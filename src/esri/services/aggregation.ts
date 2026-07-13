/* eslint-disable indent */
/* eslint-disable @typescript-eslint/no-unused-vars */
/** A set of generic routines for aggregating data that comes from 
 * our Tempo Data Serivce
*/

import type { Prettify } from "@/types";
import type { RawSampleData } from "./TempoDataService";
import type { CEsriTimeseries } from "../types";
// import type { TimeSeriesData } from "./TempoDataService";
import type { AggValue, DataPointError } from "@/types";
import { 
  toZonedTime, // returns a Date object where the time is ajusted
  fromZonedTime, 
  format as formatTz,
  formatInTimeZone
} from 'date-fns-tz';
import {
  nan2null,
} from "../../utils/array_operations/array_math";

import { aggregateData } from "../../utils/array_operations/aggregator";

export interface TimeSeriesData {
  values: Record<number, AggValue>;
  errors: Record<number, DataPointError>;
  locations: Array<{ x: number; y: number }>;
  geometryType: 'rectangle' | 'point';
}

// a flexible aggregation
// aggregation options
// daily, multi-day, weekly

/** https://www.geeksforgeeks.org/javascript/calculate-current-week-number-in-javascript/
* getWeekoOfYear for Date object
* If you have a UTC/js timestamp, and want the day of week for a 
* specfic timezone
*/
import {
  getBeginningOfWeek,
  getWeekOfYear,
} from '@/utils/calendar_utils';

type Window = string ; // e.g, '1d', '3d', '1w' , 'weekly'

export type AggregationMethod = 'mean' | 'median' | 'sum' | 'min' | 'max';


export class TimeSeriesResampler {
  window: Window;
  timezone?: string;
  method: AggregationMethod;
  errorMethod: 'std' | 'sem' = 'sem'; // standard deviation or standard error of the mean
  includeCalibrationUncertainty = true; // whether to include calibration uncertainty in the error propagation

  constructor(
    window: Window, 
    timezone: string = 'UTC', 
    method: AggregationMethod = 'mean',
    errorMethod: 'std' | 'sem' = 'sem',
    includeCalibrationUncertainty = true
  ) {
    this.window = window;
    this.timezone = timezone;
    this.method = method;
    this.errorMethod = errorMethod;
    this.includeCalibrationUncertainty = includeCalibrationUncertainty;
    if (includeCalibrationUncertainty) {
      console.error('This may not handle NaN values in the errors correctly which can lead to Zero values for errors');
    }
  }
  
  private _getZonedDate(date: Date): Date {
    return this.timezone ? toZonedTime(date, this.timezone) : date;
  }

  getGroupId(date: Date): string {
    const zonedDate = this._getZonedDate(date);
    const groupDate = new Date(zonedDate);
    
    // handle daily or multi-day
    if (this.window.endsWith('d')) {
      const days = parseInt(this.window.slice(0, -1));
      const day = zonedDate.getDate();
      const groupDay = Math.floor((day - 1) / days) * days + 1;
      groupDate.setDate(groupDay);
      groupDate.setHours(0, 0, 0, 0);
      
      // handle weekly
    } else if (this.window === '1w' || this.window === 'weekly') {
      const weekStart = getBeginningOfWeek(date, this.timezone);
      return String(weekStart.getTime());
      
      // handly monthly
    } else if (this.window === '1m' || this.window === 'monthly') {
      groupDate.setDate(1);
      groupDate.setHours(0, 0, 0, 0);
      
      // default to daily
    } else {
      groupDate.setHours(0, 0, 0, 0);
    }
    const utcMidnight = this.timezone ? fromZonedTime(groupDate, this.timezone) : groupDate;
    return String(utcMidnight.getTime());
  }
  
  groupData(timeseries: Prettify<TimeSeriesData>): TimeSeriesData {
    // the data and the error are in the same order
    const data = Object.values(timeseries.values); // AggValue[]
    const error = Object.values(timeseries.errors); // DataPointError[] | undefined
    
    // colate the data and errors into groups (bins)
    const groups: { [key: string]: { values: AggValue[]; errors: DataPointError[] } } = {};
    data.forEach((d, idx) => {
      const groupId = this.getGroupId(d.date);
      if (!groups[groupId]) {
        groups[groupId] = { values: [], errors: [] };
      }
      groups[groupId].values.push(d);
      if (error) {
        groups[groupId].errors.push(error[idx]);
      }
    });

    // these will be the time-aggregated values
    const values: Record<number, AggValue> = {};
    const errors: Record<number, DataPointError> = {};
    
    // loop over the groups
    for (const groupId in groups) {
      const groupData = groups[groupId];
      const timestamp = parseInt(groupId); // this is the UTC for the start of the group

      const groupValues = groupData.values.map(d => d.value);
      
      // Prepare error arrays for aggregateData (using uppers since errors are symmetric)
      const errorValues = this.includeCalibrationUncertainty && groupData.errors.length > 0
        ? groupData.errors.map(e => e.upper)
        : undefined;
      
      // Map error method from 'sem'/'std' to aggregateData's format
      const errorFunc = this.errorMethod === 'sem' ? 'standardError' : 'stdev';
      
      // Use aggregateData (errors are symmetric, so we reuse the result)
      const result = aggregateData(groupValues, errorValues, this.method, errorFunc);
      
      values[timestamp] = { value: result.value, date: new Date(timestamp) };
      errors[timestamp] = { 
        lower: result.error, 
        upper: result.error 
      };
      
      // end of loop over groups
    }
    
    return {
      values,
      errors,
      locations: timeseries.locations,
      geometryType: timeseries.geometryType
    };
  }
}




// name format is [binning]Of[folding period]
export type FoldType = 
    // Original fold types
    'hourOfDay' | 
    'dayOfWeek' | 
    'hourOfWeek'|
    'dayOfWeekdayWeekend' |
    // Hour-based bins
    'hourOfWeek' |    // hour bins, folded over a week (0-167)
    'hourOfMonth' |   // hour bins, folded over a month (0-743 max)
    'hourOfYear' |    // hour bins, folded over a year (0-8783 max)
    'hourOfSeason' |  // hour bins, folded over a season (0-2183 max)
    // Day-based bins
    'dayOfWeek' |     // day bins, folded over a week (0-6)
    'dayOfMonth' |    // day bins, folded over a month (0-30 max)
    'dayOfYear' |     // day bins, folded over a year (0-365)
    'dayOfSeason' |   // day bins, folded over a season (0-91 max)
    // Week-based bins
    'weekOfMonth' |   // week bins, folded over a month (0-4 max)
    'weekOfYear' |    // week bins, folded over a year (0-52)
    'weekOfSeason' |  // week bins, folded over a season (0-13 max)
    // Month-based bins
    'monthOfYear' |   // month bins, folded over a year (0-11)
    'monthOfSeason'|  // month bins, folded over a season (0-2)
    // None-period bins (simple binning with dates, no folding)
    'hourOfNone' |    // hour bins with no folding (x-axis shows dates)
    'dayOfNone' |     // day bins with no folding (x-axis shows dates)
    'weekOfNone' |    // week bins with no folding (x-axis shows dates)
    'monthOfNone' |   // month bins with no folding (x-axis shows dates)
    'noneOfNone' |   // no folding or binning
    // fold without binning
    'noneOfDay' |    // shows days of the week
    'noneOfWeek' |   // shows weeks of the year
    'noneOfMonth' |  // shows months of the year
    'noneOfYear' |   // shows months of the year
    // Others
    'hourOfWeekdayWeekend'; // shows hours of the weekday, and hour of the weekend

export interface FoldBinContent {
  bin: number;
  timestamps: number[];          // original UTC timestamps of samples contributing
  binPhase: number[]
  lowers: (number | null)[];    // original lower error values (may include nulls)
  uppers: (number | null)[];    // original upper error values (may include nulls)
  rawValues: (number | null)[];  // raw numeric values (may include nulls)
}


// functino to sort folded bin content by timestamps
export function sortfoldBinContent(bin: FoldBinContent): FoldBinContent {
  const sorted = bin.binPhase
    .map((bp, idx) => ({ bp, idx }))
    .sort((a, b) =>a.bp - b.bp);
  
  const sortedIndices = sorted.map(item => item.idx);
  function applySort<T>(arr: T[]): T[] {
    return sortedIndices.map(i => arr[i]);
  }
  
  return {
    bin: bin.bin,
    timestamps: applySort(bin.timestamps),
    binPhase: sorted.map(item => item.bp),
    rawValues: applySort(bin.rawValues),
    lowers: applySort(bin.lowers),
    uppers: applySort(bin.uppers)
  };
}

function altFloorHour(date: Date): Date {
  const msPerHour = 3600000; // milliseconds in an hour
  return new Date(Math.round(date.getTime() / msPerHour) * msPerHour);
}

export type Seasons = 'DJF' | 'MAM' | 'JJA' | 'SON'; // meteorological seasons

export interface FoldedAggValue {
  value: number | null;
  bin: number; // 0–23, 0–6, or 0–167 depending on fold
  date?: Date; // actual date for None-period bins (hourOfNone, dayOfNone, etc.)
}

interface InternalBin {
      bin: number;
      timestamps: number[];
      rawValues: (number | null)[];
      numericValues: number[];           // non-null numeric values
      calibrationErrors: DataPointError[]; // original per-sample errors
    }

export interface FoldedTimeSeriesData {
  foldType: FoldType;
  values: Record<number, FoldedAggValue>;         // binIndex -> aggregated value
  errors: Record<number, DataPointError>;         // binIndex -> aggregated error
  bins: Record<number, FoldBinContent>;           // binIndex -> full raw bin content
  locations: Array<{ x: number; y: number }>;
  geometryType: 'rectangle' | 'point';
}

/** Class for folding data periodically 
 * We want to control the periodicity and resolution
*/
export class TimeSeriesFolder {
  foldType: FoldType;
  timezone: string;
  method: AggregationMethod;
  errorMethod: 'std' | 'sem';
  includeCalibrationUncertainty: boolean;

  constructor(
    foldType: FoldType,
    timezone: string = 'UTC',
    method: AggregationMethod = 'mean',
    errorMethod: 'std' | 'sem' = 'sem',
    includeCalibrationUncertainty = true
  ) {
    this.foldType = foldType;
    this.timezone = timezone;
    this.method = method;
    this.errorMethod = errorMethod;
    this.includeCalibrationUncertainty = includeCalibrationUncertainty;
  }
  
  private _getZonedDate(date: Date): Date {
    return this.timezone ? toZonedTime(date, this.timezone) : date;
  }

  // convenience to get the number of bins
  private _binCount(): number {
    switch (this.foldType) {
      // Hour-based bins
      case 'hourOfDay': return 24;
      case 'hourOfWeek': return 24 * 7;        // 168
      case 'hourOfMonth': return 24 * 31;      // 744 (max for 31-day month)
      case 'hourOfYear': return 24 * 366;      // 8784 (max for leap year)
      case 'hourOfSeason': return 24 * 92;     // 2208 (max ~92 days)
      
      // Day-based bins
      case 'dayOfWeek': return 7;
      case 'dayOfMonth': return 31;            // max days in a month
      case 'dayOfYear': return 366;            // max for leap year
      case 'dayOfSeason': return 92;           // max ~92 days in a season
      
      // Week-based bins
      case 'weekOfMonth': return 5;            // max ~5 weeks in a month
      case 'weekOfYear': return 54;            // max 53 weeks in a year
      case 'weekOfSeason': return 14;          // max ~14 weeks in a season
      
      // Month-based bins
      case 'monthOfYear': return 12;
      case 'monthOfSeason': return 3;          // 3 months per season
      
      // None-period bins (use timestamps as keys, so no fixed count)
      case 'hourOfNone':
      case 'dayOfNone':
      case 'weekOfNone':
      case 'monthOfNone':
      case 'noneOfNone':
        return Infinity;  // no fixed bin count for None-period types
      
      // fold without binning
      case 'noneOfDay':
      case 'noneOfWeek':
      case 'noneOfMonth':
      case 'noneOfYear':
        return Infinity; // no fixed bin count for fold-only types
      
      // Special cases
      case 'dayOfWeekdayWeekend': return 2;
      case 'hourOfWeekdayWeekend': return 48; // 0-23 for weekday, 24-48 for weekend
      
      default:
        console.error('Unknown fold type:', this.foldType);
        return 1;
    }
  }
  
  // instead of a groupId we just need the bin index
  private _binIndex(date: Date): number {
    const z = this._getZonedDate(date);
    const hourWithFraction = z.getHours()
      + z.getMinutes() / 60
      + z.getSeconds() / 3600
      + z.getMilliseconds() / 3600000;
    
    switch (this.foldType) {
      // Hour-based bins
      case 'hourOfDay': 
        return altFloorHour(z).getHours();                                    // 0–23
      case 'hourOfWeek': 
        return z.getDay() * 24 + altFloorHour(z).getHours();                  // 0–167
      case 'hourOfMonth': 
        return (z.getDate() - 1) * 24 + altFloorHour(z).getHours();           // 0–743
      case 'hourOfYear': {
        const yearStart = new Date(z.getFullYear(), 0, 1);
        const dayOfYear = Math.floor((z.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24));
        return dayOfYear * 24 + altFloorHour(z).getHours();                   // 0–8783
      }
      case 'hourOfSeason': {
        const month = z.getMonth();
        const season = Math.floor(((month + 1) / 3) % 4);       // 0-3 for DJF, MAM, JJA, SON
        const seasonStartMonths = [11, 2, 5, 8];                // Dec, Mar, Jun, Sep
        const yearOff = season === 0 ? 1 : 0;
        const seasonStart = new Date(z.getFullYear() - yearOff, seasonStartMonths[season], 1);
        const dayOfSeason = Math.floor((z.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24));
        return dayOfSeason * 24 + altFloorHour(z).getHours();                 // 0–2207
      }
      
      // Day-based bins
      case 'dayOfWeek': 
        return z.getDay();                                      // 0–6
      case 'dayOfMonth': 
        return z.getDate() - 1;                                 // 0–30
      case 'dayOfYear': {
        const yearStart = new Date(z.getFullYear(), 0, 1);
        return Math.floor((z.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24)); // 0–365
      }
      case 'dayOfSeason': {
        const month = z.getMonth();
        const season = Math.floor(((month + 1) / 3) % 4);
        const seasonStartMonths = [11, 2, 5, 8];
        const yearOff = season === 0 ? 1 : 0;
        const seasonStart = new Date(z.getFullYear() - yearOff, seasonStartMonths[season], 1);
        return Math.floor((z.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24)); // 0–91
      }
      
      // Week-based bins
      case 'weekOfMonth': {
        const dayOfMonth = z.getDate();
        return Math.floor((dayOfMonth - 1) / 7);                // 0–4
      }
      case 'weekOfYear': {
        return getWeekOfYear(date); // this can be done approximately w/o the timezone
        // i haven't tested, but in principle there could be some off-by one hour errors
      }
      
      case 'weekOfSeason': {
        const month = z.getMonth();
        const season = Math.floor(((month + 1) / 3) % 4);
        const seasonStartMonths = [11, 2, 5, 8];
        const yearOff = season === 0 ? 1 : 0;
        const seasonStart = new Date(z.getFullYear() - yearOff, seasonStartMonths[season], 1);
        const dayOfSeason = Math.floor((z.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24));
        return Math.floor(dayOfSeason / 7);                     // 0–13
      }
      
      // Month-based bins
      case 'monthOfYear': 
        return z.getMonth();                                    // 0–11
      case 'monthOfSeason': {
        const month = z.getMonth();
        const season = Math.floor(((month + 1) / 3) % 4);
        const seasonStartMonths = [11, 2, 5, 8];
        const seasonStartMonth = seasonStartMonths[season];
        // Calculate month offset within season
        if (season === 0) { // DJF
          return month === 11 ? 0 : month + 1;                  // Dec=0, Jan=1, Feb=2
        } else {
          return (month - seasonStartMonth + 12) % 12;          // 0–2
        }
      }

      // Fold-only (no binning): return continuous folded phase
      case 'noneOfDay':
        return hourWithFraction;                                  // 0–24
      case 'noneOfWeek':
        return z.getDay() * 24 + hourWithFraction;               // 0–168
      case 'noneOfMonth':
        return (z.getDate() - 1) * 24 + hourWithFraction;        // 0–744
      case 'noneOfYear': {
        const yearStart = new Date(z.getFullYear(), 0, 1);
        const dayOfYear = Math.floor((z.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24));
        return dayOfYear * 24 + hourWithFraction;                // 0–8784
      }
      case 'noneOfNone':
        return date.getTime();                                   // passthrough timestamp
      
      // None-period bins (return timestamp of bin start, like resampler)
      case 'hourOfNone': {
        // const zBinStart = new Date(z);
        // zBinStart.setMinutes(0, 0, 0);
        const zBinStart = altFloorHour(z);
        return (this.timezone ? fromZonedTime(zBinStart, this.timezone) : zBinStart).getTime();
      }
      case 'dayOfNone': {
        const zBinStart = new Date(z);
        zBinStart.setHours(0, 0, 0, 0);
        return (this.timezone ? fromZonedTime(zBinStart, this.timezone) : zBinStart).getTime();
      }
      case 'weekOfNone': {
        const weekStart = getBeginningOfWeek(date, this.timezone);
        return weekStart.getTime();
      }
      case 'monthOfNone': {
        const zBinStart = new Date(z);
        zBinStart.setDate(1);
        zBinStart.setHours(0, 0, 0, 0);
        return (this.timezone ? fromZonedTime(zBinStart, this.timezone) : zBinStart).getTime();
      }      
      
      // Special cases
      case 'dayOfWeekdayWeekend': 
        return (z.getDay() % 6 > 0) ? 0 : 1;                    // 1=weekend, 0=weekday
        
      case 'hourOfWeekdayWeekend': {
        const isWeekend = (z.getDay() % 6 === 0);                // true if weekend
        return isWeekend ? (24 + altFloorHour(z).getHours()) : altFloorHour(z).getHours();  // 0-23 for weekday, 24-47 for weekend
      }
      
      default:
        console.error('Unknown fold type:', this.foldType);
        return 0;
    }
  }
  
  private _binPhase(date: Date): number {
    const z = this._getZonedDate(date);
    const minutes = z.getMinutes();
    const seconds = z.getSeconds();
    const milliseconds = z.getMilliseconds();
    
    switch (this.foldType) {
      // Hour-based bins - return fraction of hour
      case 'hourOfDay':
      case 'hourOfWeek':
      case 'hourOfMonth':
      case 'hourOfYear':
      case 'hourOfSeason':
      case 'hourOfNone':
        return -((minutes / 60 + seconds / 3600 + milliseconds / 3600000 ) - 0.5); // fraction of hour
      
      // Day-based bins - return fraction of day (as hours)
      case 'dayOfWeek':
      case 'dayOfMonth':
      case 'dayOfYear':
      case 'dayOfSeason':
      case 'dayOfNone': {
        const hourOfDay = z.getHours() + minutes / 60 + seconds / 3600;
        return hourOfDay / 24; // fraction of day
      }
      
      // Week-based bins - return fraction of week (as days)
      case 'weekOfMonth':
      case 'weekOfYear':
      case 'weekOfSeason':
      case 'weekOfNone': {
        const dayOfWeek = z.getDay();
        const hourOfDay = z.getHours() + minutes / 60 + seconds / 3600;
        return (dayOfWeek + hourOfDay / 24) / 7; // fraction of week
      }
      
      // Month-based bins - return fraction of month (as days)
      case 'monthOfYear':
      case 'monthOfSeason':
      case 'monthOfNone': {
        const dayOfMonth = z.getDate() - 1; // 0-based
        const hourOfDay = z.getHours() + minutes / 60 + seconds / 3600;
        const daysInMonth = new Date(z.getFullYear(), z.getMonth() + 1, 0).getDate();
        return (dayOfMonth + hourOfDay / 24) / daysInMonth; // fraction of month
      }
      
      // Special cases
      case 'dayOfWeekdayWeekend': 
        return 0;  // binary choice, no phase
        
      case 'hourOfWeekdayWeekend': {
        // Return fraction of hour (0-1) to match other hour-based bins
        return minutes / 60 + seconds / 3600 + milliseconds / 3600000;
      }

      case 'noneOfDay':
      case 'noneOfWeek':
      case 'noneOfMonth':
      case 'noneOfYear':
      case 'noneOfNone':
        return 0;  // no additional phase for unbinned folds
      
      default:
        console.error('Unknown fold type:', this.foldType);
        return 0;
    }
  }
  
  foldData(timeseries: Prettify<TimeSeriesData>): FoldedTimeSeriesData | null {
    const binCount = this._binCount();
    const binsRecord: Record<number, Prettify<InternalBin>> = {};
    
    // bundle data and errors into bins
    // it includes the timestamps, and raw/cleaned valued
    Object.entries(timeseries.values).forEach(([ts,d]) => {
      const binIndex = this._binIndex(d.date);
      if (binIndex == null || binIndex < 0 || binIndex >= binCount) {
        console.error('Invalid bin index', binIndex, 'for date', d.date, 'with fold type', this.foldType);
        return;
      }
      if (!binsRecord[binIndex]) {
        binsRecord[binIndex] = {
          bin: binIndex,
          timestamps: [],
          rawValues: [],
          numericValues: [],
          calibrationErrors: []
        };
      }
      
      const bin = binsRecord[binIndex];
      bin.timestamps.push(d.date.getTime());
      bin.rawValues.push(d.value);
      // get clean values
      if (d.value !== null && !isNaN(d.value)) {
        bin.numericValues.push(d.value);
      }
      
      const err = timeseries.errors[ts];
      if (err) {
        bin.calibrationErrors.push(err);
      } else {
        console.error('No error found for timestamp', ts);
      }
      
    });

    // Check if this is a None-period fold type
    const isNonePeriod = ['noneOfNone', 'hourOfNone', 'dayOfNone', 'weekOfNone', 'monthOfNone'].includes(this.foldType);

    // these will be the time-aggregated values
    const values: Record<number, FoldedAggValue> = {};
    const errors: Record<number, DataPointError> = {};
    const publicBins: Record<number, FoldBinContent> = {};

    // loop over the groups and aggregate
    Object.values(binsRecord).forEach(bin => {

      const { bin: binIndex, numericValues, calibrationErrors, rawValues, timestamps } = bin;
      
      // Prepare error arrays for aggregateData (using uppers since errors are symmetric)
      const errorValues = this.includeCalibrationUncertainty && calibrationErrors.length > 0
        ? calibrationErrors.map(e => e.upper)
        : undefined;
      
      // Map error method from 'sem'/'std' to aggregateData's format
      const errorFunc = this.errorMethod === 'sem' ? 'standardError' : 'stdev';
      
      // Use aggregateData (errors are symmetric, so we reuse the result)
      const result = aggregateData(rawValues, errorValues, this.method, errorFunc);
      
      // For None-period bins, binIndex is a timestamp, convert to Date
      const binDate = isNonePeriod ? new Date(binIndex) : undefined;
      
      values[binIndex] = { 
        value: result.value, 
        bin: binIndex,
        date: binDate
      };
      
      errors[binIndex] = { 
        lower: result.error, 
        upper: result.error 
      };
      
      // expose the full bin contents
      publicBins[binIndex] = {
        bin: binIndex,
        timestamps: [...timestamps],
        binPhase: timestamps.map(t => this._binPhase(new Date(t))),
        rawValues: [...rawValues].map(v => nan2null(v)),
        lowers: calibrationErrors.map(e => e.lower).map(v => nan2null(v)),
        uppers: calibrationErrors.map(e => e.upper).map(v => nan2null(v))
      };
      
    });
    
    
    return {
      foldType: this.foldType,
      values,
      errors,
      bins: publicBins,
      locations: timeseries.locations,
      geometryType: timeseries.geometryType
    };
  }
}


export function hourOfWeekToDayHour(hourOfWeek: number): { day: number; hour: number } {
  const day = Math.floor(hourOfWeek / 24);
  const hour = hourOfWeek % 24;
  return { day, hour };
}