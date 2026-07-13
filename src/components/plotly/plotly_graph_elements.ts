
import type { PlotlyGraphDataSet } from '../../types';
import Plotly, { type Datum } from "plotly.js-dist-min";
import { diff, nanmedian, arraysEqual } from '@/utils/array_operations/array_math';


import { nanmean } from "@/utils/array_operations/array_math";

function normalizeBadValue(v: number | null | undefined): number | null {
  if (v === null || v === undefined || isNaN(v)) {
    return null;
  }
  return v;
}

import { deepMerge } from "./plotly_styles";

export function createErrorBands(data: PlotlyGraphDataSet, color: string, datasetName: string, legendGroup: string, options: object = {}) {
  if (!data.upper || !data.lower) return {lower: null, upper: null, max: 0, min: 0};
      
  const upperY: (number | null)[] = [];
  const lowerY: (number | null)[] = [];
  let max = 0;
  let min = 0;
    
  data.y.forEach((y, idx) => {
    if (y === null) {
      lowerY.push(null);
      upperY.push(null);
      return;
    }
        
    if (data.upper === undefined) {
      upperY.push(null);
    } else {
      const high = y + (data.upper[idx] ?? nanmean(data.upper) ?? 0);
      upperY.push(high);
      max = Math.max(max, high !== null ? high : 0);
    }
        
    if (data.lower === undefined) {
      lowerY.push(null);
    } else {
      const low = y - (data.lower[idx] ?? nanmean(data.lower) ?? 0);
      lowerY.push(low);
      min = Math.min(min, low !== null ? low : 0);
          
    }
        
        
  });
  // console.log({lowerY, upperY});
  const traceErrorOptions = {
    x: data.x,
    mode: "lines",
    line: { width: 0 },
    showlegend: false,
    legendgroup: legendGroup,
    name: datasetName,
    marker: { color: color ?? 'red' },
  } as Partial<Plotly.PlotData>;
      
  return {
    lower:{
      y: lowerY.map(normalizeBadValue),
      ...deepMerge(traceErrorOptions, options),
    } as Plotly.PlotData,
    upper:{
      y: upperY.map(normalizeBadValue),
      ...deepMerge(traceErrorOptions, options),
      fill: "tonexty",
    } as Plotly.PlotData,
    max,
    min

  };
    
}

/* Check if a dataset has error bars defined
isSymmetric means, either upper = lower, or only one of them is defined
Errors are either symmetric, or both upper and lower are defined and of same length
*/
export function dataHasErrors(data: PlotlyGraphDataSet) {
  const hasUpper = !!data.upper;
  const hasLower = !!data.lower;
  const sameLength = data.upper && data.lower && data.upper.length === data.y.length && data.lower.length === data.y.length;
  const isSymmetric = (!!data.upper !== !!data.lower) || arraysEqual(data.upper, data.lower);
  const hasErrors = isSymmetric || (hasUpper && hasLower && sameLength);
  return { hasErrors, hasUpper, hasLower, isSymmetric };
}
  

export function createErrorBars(data: PlotlyGraphDataSet, color: string, options: Partial<Plotly.ErrorOptions> = {}): Extract<Plotly.ErrorBar, {type: 'data'}> | null {
  if (!data.upper && !data.lower) return null;
  
  
  const isSymmetric = (!!data.upper !== !!data.lower) || arraysEqual(data.upper, data.lower);
    
  return {
    type: 'data',
    ...options,
    color: options.color || color || 'limegreen', /* ts should prevent limegreen, but just in case */
    symmetric: isSymmetric,
    array: (isSymmetric ? (data.upper ?? data.lower) : data.upper) as Datum[],
    arrayminus: (isSymmetric ? undefined : data.lower) as Datum[],
  };
}



export function filterNullValues(data: PlotlyGraphDataSet): PlotlyGraphDataSet {
  // filter out any place where
  // data.x or data.y is null or undefined or NaN
  if (!data.x || !data.y) {
    return data;
  }
  const filteredX: Datum[] = [];
  const filteredY: number[] = [];
  const filteredLower: (number | null)[] = [];
  const filteredUpper: (number | null)[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filteredCustomData: any[] = [];
  data.x.forEach((x, idx) => {
    const y = data.y[idx];
    if (x !== null && x !== undefined && y !== null && y !== undefined && !isNaN(y)) {
      filteredX.push(x);
      filteredY.push(y);
      filteredCustomData.push(data.datasetOptions?.customdata ? data.datasetOptions.customdata[idx] : null);
      if (data.lower) {
        filteredLower.push(data.lower[idx] ?? null); // keep length consistent 
      }
      if (data.upper) {
        filteredUpper.push(data.upper[idx] ?? null); // keep length consistent 
      }
    }
  });

  const result: PlotlyGraphDataSet = {
    ...data,
    datasetOptions: {
      ...data.datasetOptions,
      customdata: filteredCustomData,
    },
    x: filteredX,
    y: filteredY,
    name: data.name
  };
  if (data.lower) {
    result.lower = filteredLower;
  } 
  if (data.upper) {
    result.upper = filteredUpper;
  }
  result.errorType = data.errorType;
  
  return result;
}


function _appendDataPoint(target: PlotlyGraphDataSet, source: PlotlyGraphDataSet, idx: number): void {
  target.x.push(source.x[idx]);
  target.y.push(source.y[idx]);
  if (source.lower) {
    target.lower!.push(source.lower[idx]);
  }
  if (source.upper) {
    target.upper!.push(source.upper[idx]);
  }
  if (source.datasetOptions?.customdata) {
    target.datasetOptions!.customdata!.push(source.datasetOptions.customdata[idx]);
  }
}

function _createEmptyDatasetCopy(data: PlotlyGraphDataSet): PlotlyGraphDataSet {
  const copy: PlotlyGraphDataSet = {
    ...data,
    x: [],
    y: [],
    name: data.name,
  };
  
  if (data.lower) {
    copy.lower = [];
  }
  
  if (data.upper) {
    copy.upper = [];
  }
  
  if (data.datasetOptions?.customdata) {
    copy.datasetOptions = {
      ...data.datasetOptions,
      customdata: [],
    };
  }
  
  return copy;
}


export function splitDatasetByDay(data: PlotlyGraphDataSet): PlotlyGraphDataSet[] {
  const datasetsByDay: { [key: string]: PlotlyGraphDataSet } = {};

  data.x.forEach((x, idx) => {
    const date = new Date(x as string); // assuming x is a date string
    const dayKey = date.toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' });
    
    if (!datasetsByDay[dayKey]) {
      datasetsByDay[dayKey] = _createEmptyDatasetCopy(data);
    }
    _appendDataPoint(datasetsByDay[dayKey], data, idx);
    
  });

  return Object.values(datasetsByDay);
}




export function splitDatasetByGap(data: PlotlyGraphDataSet): PlotlyGraphDataSet[] {
  // const gaps: number[] = [];
  const xValues = data.x as number[];
  const gaps = diff(xValues) as number[];
  const medianGap = nanmedian(gaps);
  if (medianGap === null) {
    return [data];
  }
  const threshold = medianGap * 3;

  const datasetsByGap: PlotlyGraphDataSet[] = [];
  let currentDataset: PlotlyGraphDataSet = _createEmptyDatasetCopy(data);

  data.x.forEach((x, idx) => {
    if (idx > 0) {
      const gap = (x as number) - (data.x[idx - 1] as number);
      if (gap > threshold) {
        // Start a new dataset
        datasetsByGap.push(currentDataset);
        currentDataset = _createEmptyDatasetCopy(data);
      }
    }
    _appendDataPoint(currentDataset, data, idx);
    
  });

  // Push the last dataset if it has data
  if (currentDataset.x.length > 0) {
    datasetsByGap.push(currentDataset);
  }

  return datasetsByGap;
}