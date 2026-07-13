/* eslint-disable @typescript-eslint/naming-convention */
import { rectangleToGeometry, pointToGeometry } from '../geometry';
import type { RectBounds, PointBounds, EsriGeometryType } from '../geometry';
import type { EsriGetSamplesReturn, EsriGetSamplesReturnError, EsriGetSamplesSample, Variables, EsriInterpolationMethod, CEsriTimeseries } from '../types';
import type { AggValue, DataPointError } from "../../types";

function safeParseNumber(value: string | null | undefined): number | null {
  if (value === null || value === '' || value === undefined) return null;

  const parsed = parseFloat(value); // parsing only fails if 1st digit is not a number :)
  return isNaN(parsed) ? null : parsed; // Return null if parsing fails
}



export interface EsriGetSamplesParameters {
  geometry: ReturnType<typeof rectangleToGeometry> | ReturnType<typeof pointToGeometry>;
  geometryType: EsriGeometryType;
  sampleDistance?: number;
  sampleCount?: number;
  mosaicRule?: string | Record<string, unknown>;
  pixelSize?: number;
  returnFirstValueOnly?: boolean;
  interpolation: EsriInterpolationMethod;
  outFields?: string | string[];
  sliceID?: string | number;
  time?: string | [number, number] | [Date, Date];
  f: 'pjson'; // Format of the response
}

function stringifyEsriGetSamplesParameters(params: EsriGetSamplesParameters): URLSearchParams {
  const {
    geometry,
    geometryType,
    sampleDistance,
    sampleCount,
    mosaicRule,
    pixelSize,
    returnFirstValueOnly,
    interpolation,
    outFields,
    sliceID,
    time,
  } = params;
  
  

  const options: Record<string, string> = {
    f: 'pjson',
    geometry: JSON.stringify(geometry),
    geometryType: geometryType,
    interpolation: interpolation,
  };

  if (sampleDistance) options.sampleDistance = sampleDistance.toString();
  if (sampleCount) options.sampleCount = sampleCount.toString();
  if (mosaicRule) options.mosaicRule = JSON.stringify(mosaicRule);
  if (pixelSize) options.pixelSize = pixelSize.toString();
  if (returnFirstValueOnly !== undefined) options.returnFirstValueOnly = returnFirstValueOnly.toString();
  if (outFields) options.outFields = Array.isArray(outFields) ? outFields.join(',') : outFields;
  if (sliceID !== undefined) options.sliceID = sliceID.toString();
  if (time) {
    const timeStr = Array.isArray(time)
      ? time.map((t) => (t instanceof Date ? t.getTime() : t)).join(',')
      : time;
    options.time = timeStr;
  }

  return new URLSearchParams(options);
}


const esriGetSamplesRequest = async (url: string, params: EsriGetSamplesParameters): Promise<EsriGetSamplesReturn | EsriGetSamplesReturnError> => {
  const getSamplesUrl = `${url}/getSamples/?`;
  const urlWithParams = getSamplesUrl + stringifyEsriGetSamplesParameters(params).toString();
  
  console.log(urlWithParams.replace('pjson', 'html'));

  try {
    const response = await fetch(urlWithParams);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in esriGetSamplesRequest:', error);
    throw error;
  }
};

export function esriGetSamples(
  url: string,
  variableName: Variables,
  geometry: RectBounds | PointBounds,
  start: number,
  end: number,
  sampleCount: number = 30,
): Promise<CEsriTimeseries[]> {
  // const getSamplesUrl = `${url}/getSamples/?`;

  const esriGeometry =
    Object.keys(geometry).includes('xmin') ?
      rectangleToGeometry(geometry as RectBounds)
      : pointToGeometry(geometry as PointBounds);

  const geometryType: EsriGeometryType =
    Object.keys(geometry).includes('xmin') ?
      'esriGeometryPolygon'
      : 'esriGeometryPoint';

  // https://developers.arcgis.com/rest/services-reference/enterprise/get-samples/
  const options: EsriGetSamplesParameters = {
    f: 'pjson',
    interpolation: 'RSP_NearestNeighbor',
    returnFirstValueOnly: false,
    geometry: esriGeometry,
    geometryType: geometryType,
    time: `${start},${end}`,
    sampleCount: sampleCount,
  };
  

  return esriGetSamplesRequest(url, options)
    .then((data) => {
      if ('error' in data) {
        throw new Error(`Error fetching samples (${data.error.code}): ${data.error.message} ${data.error.details}`);
      }
      // want to get the location x, y, the time, the variableName (NO2_Troposphere)
      return data.samples.map((sample: EsriGetSamplesSample) => {
        return {
          x: sample.location.x,
          y: sample.location.y,
          time: sample.attributes.StdTime,
          date: new Date(sample.attributes.StdTime), // assuming StdTime is in seconds
          variable: safeParseNumber(sample.attributes[variableName] ?? ''), // assuming NO2_Troposphere is the variable we want
          value: safeParseNumber(sample.value),
          locationId: sample.locationId,
          geometryType: geometryType === 'esriGeometryPolygon' ? 'rectangle' : 'point' as CEsriTimeseries['geometryType'],
        };
      });
    })
    .catch((error) => {
      console.error('Error fetching samples:', error);
      throw error;
    });
}


export function groupSamplesByTime(
  samples: CEsriTimeseries[],
): Map<number, CEsriTimeseries[]> {
  const groupd: Map<number, CEsriTimeseries[]> = new Map();

  samples.forEach((sample) => {
    if (!groupd.has(sample.time)) {
      groupd.set(sample.time, []);
    }
    groupd.get(sample.time)?.push(sample);
  });

  return groupd;
}

function nullMean(samples: (number | null)[], time: number): AggValue {
  const validSamples = samples.filter((sample) => sample !== null);
  if (validSamples.length === 0) return {value: null, date: new Date(time)};
  const sum = validSamples.reduce((acc, val) => acc + (val ?? 0), 0);
  return {value: sum / validSamples.length, date: new Date(time)}; 
}


function nullError(samples: (number | null)[], _time: number): DataPointError {
  const validSamples = samples.filter((sample) => sample !== null);
  if (validSamples.length === 0) return {lower: null, upper: null};
  
  const mean = validSamples.reduce((acc, val) => acc + (val ?? 0), 0) / validSamples.length;
  const squaredDiffs = validSamples.map((sample) => {
    if (sample === null) return 0;
    return Math.pow(sample - mean, 2);
  });
  const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / validSamples.length;
  
  return {lower: Math.sqrt(variance), upper: Math.sqrt(variance)}; 
}

export function aggregate<T>(
  grouped: Map<number, CEsriTimeseries[]>,
  aggFunction: (samples: CEsriTimeseries[], time: number) => T,
) {
  const aggregated: Record<number, T> = {};
  grouped.forEach((samples, time) => {
    aggregated[time] = aggFunction(samples, time);
  });
  return aggregated;
}


// now write a function that takes a url and returns the aggregated values for a given variable, geometry, start and end time
export async function getAggregatedSamples(
  url: string,
  variableName: Variables,
  geometry: RectBounds | PointBounds,
  start: number,
  end: number,
  sampleCount: number = 30,
): Promise<{ mean: Record<number, AggValue>, error: Record<number, DataPointError>, uniqueLocations: { x: number, y: number }[] }> {
  const samples = await esriGetSamples(url, variableName, geometry, start, end, sampleCount);
  const grouped = groupSamplesByTime(samples);
  const mean = aggregate(grouped, (samples, time) => nullMean(samples.map((sample) => sample.value), time));
  const error = aggregate(grouped, (samples, time) => nullError(samples.map((sample) => sample.value), time));
  // Collect unique locations
  const seen = new Set<string>();
  const uniqueLocations: { x: number, y: number }[] = [];
  for (const sample of samples) {
    const key = `${sample.x},${sample.y}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueLocations.push({ x: sample.x, y: sample.y });
    }
  }
  return { mean, error, uniqueLocations };
}