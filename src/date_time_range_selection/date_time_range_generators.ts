
/* eslint-disable @typescript-eslint/no-unused-vars */
import { TimeSeriesFolder } from "@/esri/services/aggregation";
import { MillisecondRange, TimeRangeSelectionType} from "@/types/datetime";
import { parseTimeString, _normalizeTimes, formatTimeHHMM24 } from "@/utils/parse_time_strings";
import { isRingConsecutive } from "@/utils/array_operations/cyclic";

// "as const" is required to use typeof inference later
export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
] as const;
const MS_IN_HOUR = 60 * 60 * 1000;
const MS_IN_DAY = 24 * MS_IN_HOUR;

// Tolerance constants for time ranges [before, after] in hours
export const DEFAULT_TOLERANCE: [number, number] = [0.5, 0.5];
export const ALL_DAY_TOLERANCE: [number, number] = [12, 12];

export type DayType = typeof DAYS[number];
export type MonthType = typeof MONTHS[number];

export type TimeRangeCreationMode = 'single' | 'multiple';

export interface TimeRangeConfigSingle {
  type: Extract<TimeRangeCreationMode, 'single'>; // Ensures 'type' is strictly 'single'
  singleDate: Date; // UTC timestamp
}

// we use " | undefined" to force optional values to be explicitly set to undefined if not used
export interface TimeRangeConfigMultiple {
  type: Extract<TimeRangeCreationMode, 'multiple'>; // Ensures 'type' is strictly 'multiple'
  dateRange: {
      start: Date; // UTC timestamp
      end: Date;   // UTC timestamp
  },
  years: number[] | undefined;
  months: MonthType[] | undefined; // 0-11
  weekdays: DayType[] | undefined; // 0 (Sun) - 6 (Sat)
  times: string[] | undefined; // 'HH:MM' format
  toleranceHours: [number, number] | undefined; // [before, after] tolerance in hours around each time
  parcel?: boolean; // Whether to split long ranges into smaller parcels
  parcelSize?: number; // Maximum parcel size in milliseconds
}

export type TimeRangeConfig = TimeRangeConfigSingle | TimeRangeConfigMultiple;

/**
 * Parcels a long time range into smaller ranges. 
 * 
 * This should only be applied after all other time range filtering has been done.
 */
export function parcelLongRange(range: MillisecondRange, maxParcelSize: number): MillisecondRange[] {
  const parcels: MillisecondRange[] = [];
  let currentStart = range.start;
  if (range.end - range.start <= maxParcelSize) {
    return [range];
  }

  while (currentStart < range.end) {
    const currentEnd = Math.min(currentStart + maxParcelSize, range.end);
    parcels.push({ start: currentStart, end: currentEnd - 1 });
    currentStart = currentEnd;
  }

  return parcels;
}

export function parcelRanges(ranges: MillisecondRange[], maxParcelSize: number): MillisecondRange[] {
  const allParcels: MillisecondRange[] = [];
  for (const range of ranges) {
    const parcels = parcelLongRange(range, maxParcelSize);
    allParcels.push(...parcels);
  }
  return allParcels;
}

function parseTimeStringToHoursMinutes(timeStr: string): { hours: number; minutes: number } {
  const {hour: hours, minute: minutes} = parseTimeString(timeStr) || {hour: NaN, minute: NaN};
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error(`Invalid time values in: ${timeStr}. Hours must be 0-23 and minutes must be 0-59.`);
  }
  
  return { hours, minutes };
}

function genOneDayRange(date: number): MillisecondRange {
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setUTCHours(23, 59, 59, 999);
  return { start: start.getTime(), end: end.getTime() };
}

function genOneYearRange(date: number): MillisecondRange {
  const start = new Date(date);
  start.setUTCMonth(0, 1); // January 1st
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setUTCMonth(11, 31); // December 31st
  end.setUTCHours(23, 59, 59, 999);
  return { start: start.getTime(), end: end.getTime() };
}

function genOneMonthRange(date: number): MillisecondRange {
  const start = new Date(date);
  start.setUTCDate(1); // first day of month
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setUTCMonth(end.getUTCMonth() + 1);
  end.setUTCDate(0); // last day of previous month
  end.setUTCHours(23, 59, 59, 999);
  return { start: start.getTime(), end: end.getTime() };
}

function mergeOverlappingOrConsecutiveRanges(ranges: MillisecondRange[], adjacentOnly: boolean = false): MillisecondRange[] {
  if (ranges.length <= 1) {
    return ranges;
  }
  
  const merged: MillisecondRange[] = [];
  let current = ranges[0];
  
  for (let i = 1; i < ranges.length; i++) {
    const next = ranges[i];
    
    // Check if ranges overlap or are adjacent
    // Overlap: next.start <= current.end + 1
    // Adjacent: next.start === current.end + 1
    const merge = adjacentOnly ? (next.start === current.end + 1) : (next.start <= current.end + 1);
    if (merge) {
      current = {
        start: current.start,
        end: Math.max(current.end, next.end)
      };
    } else {
      merged.push(current);
      current = next;
    }
  }
  merged.push(current);
  return merged;
}

/** 
Generate all of the hour ranges for a single day.

If no times are provided, return the full day range.

Otherwise, each time generates a range range that is {time - toleranceMs, time + toleranceMs}.
The range will be left-inclusive, right-exclusive: [start, end)

Multiple time ranges that overlap or are adjacent will be merged into continuous ranges.
*/
function genHoursForOneDay(date: number, times: string[] | undefined, toleranceMs: [number, number] = [DEFAULT_TOLERANCE[0] * MS_IN_HOUR, DEFAULT_TOLERANCE[1] * MS_IN_HOUR]): MillisecondRange[] {
  const ranges: MillisecondRange[] = [];
  if (!times || times.length === 0) {
    return [genOneDayRange(date)];
  }
  
  const [toleranceMsBefore, toleranceMsAfter] = toleranceMs;
  
  // for each time, generate the appropriate range. by default +/- 30 minutes
  for (const timeStr of times) {
    if (timeStr.includes('-')) {
      const [startStr, endStr] = timeStr.split('-').map(s => s.trim());
      const { hours: startHours, minutes: startMinutes } = parseTimeStringToHoursMinutes(startStr);
      const { hours: endHours, minutes: endMinutes } = parseTimeStringToHoursMinutes(endStr);
      const start = new Date(date);
      start.setUTCHours(startHours, startMinutes, 0, 0);
      const end = new Date(date);
      end.setUTCHours(endHours, endMinutes, 59, 999);
      ranges.push({ start: start.getTime(), end: end.getTime() - 1 });
    } else {
      const { hours, minutes } = parseTimeStringToHoursMinutes(timeStr);
      const start = new Date(date);
      start.setUTCHours(hours, minutes, 0, 0);
      ranges.push({ start: start.getTime() - toleranceMsBefore, end: start.getTime() + toleranceMsAfter - 1 });
    }
  }
  
  // Sort ranges by start time and merge overlapping/adjacent ranges
  ranges.sort((a, b) => a.start - b.start);
  
  const merged = mergeOverlappingOrConsecutiveRanges(ranges, false);
  
  return merged;
}

function advanceDateToNextMonth(date: Date): Date {
  const newDate = new Date(date);
  const newMonth = newDate.getUTCMonth() + 1;
  newDate.setUTCMonth(newMonth);
  newDate.setUTCDate(1);
  newDate.setUTCHours(0, 0, 0, 0);
  return newDate;
}

function advanceDateToNextYear(date: Date): Date {
  const newDate = new Date(date);
  newDate.setUTCFullYear(newDate.getUTCFullYear() + 1);
  newDate.setUTCMonth(0);
  newDate.setUTCDate(1);
  newDate.setUTCHours(0, 0, 0, 0);
  return newDate;
}


/**
 * Merges consecutive/adjacent ranges when appropriate based on the filter configuration.
 */
function mergeConsecutiveRanges(ranges: MillisecondRange[], shouldMerge: boolean): MillisecondRange[] {
  if (ranges.length <= 1 || !shouldMerge) {
    return ranges;
  }
  
  const merged = mergeOverlappingOrConsecutiveRanges(ranges, true);
  
  return merged;
}


function generatePatternedRanges(config: TimeRangeConfigMultiple): MillisecondRange[] {
  const ranges: MillisecondRange[] = [];
  
  // loop every day
  // use a while loop so we can easily increment by day or month or 
  if (!config.dateRange) {
    throw new Error('dateRange is required for multiple time range generation.');
  }
  
  if (config.dateRange.start >= config.dateRange.end) {
    // swap them
    const temp = config.dateRange.start;
    config.dateRange.start = config.dateRange.end;
    config.dateRange.end = temp;
  }
  
  const startDate = new Date(config.dateRange.start);
  startDate.setUTCHours(0, 0, 0, 0);
  const endDate = new Date(config.dateRange.end);
  endDate.setUTCHours(23, 59, 59, 999);
  
  let currentDate = new Date(startDate);
      
  // are we splitting on month, year, weekday, or time. 
  // if we split on times or weekdays  then we need to generate daily ranges
  // other wise we just pull the the largest time range we can
  const filterOnTimes = config.times;// && config.times.length > 0;
  const filterOnWeekdays = config.weekdays && config.weekdays.length !== DAYS.length;
  const filterOnMonths = config.months && config.months.length !== MONTHS.length;
  const filterOnYears = config.years;// && config.years.length > 0;
  
  // boolearns to determine if we need finer filtering
  const needsFinerThanYears = filterOnMonths || filterOnWeekdays || filterOnTimes;
  const needsFinerThanMonths = filterOnWeekdays || filterOnTimes;
  const needsFinerThanWeekdays = filterOnTimes;
  
  // If no filters are applied, return the full range
  if (!filterOnTimes && !filterOnWeekdays && !filterOnMonths && !filterOnYears) {
    return [ { start: config.dateRange.start.getTime(), end: config.dateRange.end.getTime() } ];
  }
  
  
  
  
  
  // The way this loop works is to incrementally advance the currentDate pointer
  // depending on how fine of a filter is required. The goal to to produce the
  // largest possible time ranges (so no having daily time ranges if we can do monthly ranges).
  // If no filters we applied, then, then the full range was already returned above.
  // Here we check from largest to smallest filter.
  // So if year filter is applied, we check that first
  // Then, if we don't need any finer filtering, we grab the whole year and advance to next year
  // short-circuiting the rest of the checks.
  // Getting data for a single day already allows for time filtering if needed, so we don't need
  // the extra check for finer filters
  while (currentDate <= endDate) {

    
    // check year filter
    const currentYear = currentDate.getUTCFullYear();
    if (config.years && !config.years.includes(currentYear)) {
      currentDate = advanceDateToNextYear(currentDate); // advances to beginning of next year
      continue;
    }
    
    // the year is fine. 
    // if we don't need any finer filtering, just grab the whole year, and then go to the next year
    if (!needsFinerThanYears) { 
      const yearRange = genOneYearRange(currentDate.getTime());
      if (yearRange.end > endDate.getTime()) {
        yearRange.end = endDate.getTime();
      }
      ranges.push(yearRange);
      currentDate = advanceDateToNextYear(currentDate);
      continue;
    }
    
    // check month filter
    const currentMonth = currentDate.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' }) as MonthType;
    if (config.months && !config.months.includes(currentMonth)) {
      currentDate = advanceDateToNextMonth(currentDate); // advances to beginning of next month
      continue;
    }
    
    // the month is fine.
    // if we don't need any finer filtering, just grab the whole month, and then go to the next month
    if (!needsFinerThanMonths) { 
      const monthRange = genOneMonthRange(currentDate.getTime());
      if (monthRange.end > endDate.getTime()) {
        monthRange.end = endDate.getTime();
      }
      ranges.push(monthRange);
      currentDate = advanceDateToNextMonth(currentDate);
      continue;
    }
    
    // check weekday filter
    const currentWeekday = currentDate.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }) as DayType;
    if (config.weekdays && !config.weekdays.includes(currentWeekday)) {
      // advance to next day
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
      continue;
    }
    
    // 
    
    // generate time ranges for this day
    const toleranceHours = config.toleranceHours ?? DEFAULT_TOLERANCE;
    const toleranceMs: [number, number] = [toleranceHours[0] * MS_IN_HOUR, toleranceHours[1] * MS_IN_HOUR];
    const dailyRanges = genHoursForOneDay(currentDate.getTime(), config.times, toleranceMs);
    ranges.push(...dailyRanges);
    
    // advance to next day
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }
  
  
  // Determine if we should merge consecutive ranges
  // We merge if:
  // 1. We're at year or month granularity (no finer filters), OR
  // 2. The filtered months/weekdays are cyclically consecutive (wrapping around)
  let shouldMerge = !needsFinerThanYears || !needsFinerThanMonths;
  
  // Check for cyclically consecutive months (e.g., Nov, Dec, Jan, Feb)
  if (filterOnMonths && config.months && !needsFinerThanMonths) {
    const monthCheck = isRingConsecutive(config.months, [...MONTHS], false);
    if (monthCheck.consecutive) {
      // console.log(`Detected cyclically consecutive months: ${monthCheck.start} to ${monthCheck.end}`);
      shouldMerge = true;
    }
  }
  
  // Check for cyclically consecutive weekdays (e.g., Sat, Sun, Mon)
  if (filterOnWeekdays && config.weekdays && !needsFinerThanWeekdays) {
    const weekdayCheck = isRingConsecutive(config.weekdays, [...DAYS], false);
    if (weekdayCheck.consecutive) {
      // console.log(`Detected cyclically consecutive weekdays: ${weekdayCheck.start} to ${weekdayCheck.end}`);
      shouldMerge = true;
    }
  }
  
  const mergedRanges = mergeConsecutiveRanges(ranges, shouldMerge);
  if (mergedRanges.length < ranges.length) {
    // console.log(`Merged ${ranges.length - mergedRanges.length} consecutive ranges. Now ${mergedRanges.length} ranges.`);
  }
  
  return mergedRanges;
}
    


export function generateTimeRanges(config: TimeRangeConfig, parcel: boolean = false): MillisecondRange[] {
  const ranges: MillisecondRange[] = [];
  
  if (config.type === 'single') {
    return [genOneDayRange(config.singleDate.getTime())];
  }
  
  if (config.type === 'multiple') {
    const range = generatePatternedRanges(config, );
    const shouldParcel = config.parcel ?? parcel;
    const parcelSizeMs = config.parcelSize ?? 7 * MS_IN_DAY;
    return shouldParcel ? parcelRanges(range, parcelSizeMs) : range;
  }
    
    
  return ranges;
}


function dateInRange(date: number, start: Date, end: Date): boolean {
  return (date >= start.getTime()) && (date <= end.getTime());
}


/**
 * Validate a range that should match a time point with tolerance
 * (e.g., "14:00" with ±0.5h tolerance)
 * Since we merge contiguous/overlappying ranges, we will check if 
 * the desired configured time point (with tolerance) overlaps within the range.
 * 
 */
function validateTimePointRange(
  range: MillisecondRange, 
  configuredTime: string, 
  toleranceMs: [number, number]
): boolean {
  // Parse the configured time to get the center point
  const parsed = parseTimeString(configuredTime);
  if (!parsed) return false;
  
  const { hour, minute } = parsed;
  
  // Get the date from the range start (they should be on the same day)
  const rangeStartDate = new Date(range.start);
  const targetDate = new Date(rangeStartDate);
  targetDate.setUTCHours(hour, minute, 0, 0);
  const targetTime = targetDate.getTime();
  
  // Check if the target time (with tolerance) is within  the range
  // The configured time point should be within the range when accounting for tolerance
  const targetWithToleranceStart = targetTime - toleranceMs[0];
  const targetWithToleranceEnd = targetTime + toleranceMs[1] - 1;
  
  // Check for overlap: target time range overlaps with the actual range
  // const overlaps = targetWithToleranceStart <= range.end && targetWithToleranceEnd >= range.start;
  const within = targetWithToleranceStart >= range.start && targetWithToleranceEnd <= range.end;
  return within;
}

/**
 * Validate a range that should match a time range specification
 * (e.g., "09:00-17:00")
 */
function validateTimeRangeSpec(
  range: MillisecondRange,
  configuredTimeRange: string
): boolean {
  const [startStr, endStr] = configuredTimeRange.split('-').map(s => s.trim())
    .map(s => formatTimeHHMM24(parseTimeString(s)!));
  
  
  
  const startDate = new Date(range.start);
  const endDate = new Date(range.end);
  
  const rangeStartTimeStr = startDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC'
  }).replace(/^24/, '00');
  
  const rangeEndTimeStr = endDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC'
  }).replace(/^24/, '00');
  
  return rangeStartTimeStr === startStr && rangeEndTimeStr === endStr;
}

interface TimeRangeValidation {
  valid: boolean
  errors: string[]
  badRanges?: MillisecondRange[]
}

  
export function validateRanges(ranges: MillisecondRange[], config: TimeRangeConfig): TimeRangeValidation {
  let valid = true;
  const errors: string[] = [];
  const badRanges: MillisecondRange[] = [];
  
  if (config.type === 'single') {
    const singleDate = config.singleDate.toLocaleDateString(undefined, { timeZone: 'UTC' });
    let count = 0;
    
    // check that all ranges fall within the single date
    ranges.forEach(r => {
      if (singleDate !== new Date(r.start).toLocaleDateString(undefined, { timeZone: 'UTC' })) {
        valid = false;
        count += 1;
        badRanges.push(r);
      }
    });
    if (count > 0) {
      errors.push(`Found ${count} ranges outside Single Date Value.`);
    }
  }
  
  
  if (config.type === 'multiple') {
    const startDate = config.dateRange.start;
    const endDate = config.dateRange.end;
    let count = 0;
    
    // check that all ranges fall within the date range
    ranges.forEach(r => {
      if (!dateInRange(r.start, startDate, endDate) || !dateInRange(r.end, startDate, endDate)) {
        // console.log('Range out of date range:', r, 'Date Range:', startDate, endDate);
        valid = false;
        count += 1;
        badRanges.push(r);
      }
    });
    if (count > 0) {
      errors.push(`Found ${count} ranges outside Date Range Values.`);
    }
    
    // check for each year filter
    if (config.years && config.years.length > 0) {
      let yearCount = 0;
      ranges.forEach(r => {
        const startYear = new Date(r.start).getUTCFullYear();
        const endYear = new Date(r.end).getUTCFullYear();
        if (!config.years!.includes(startYear) || !config.years!.includes(endYear)) {
          valid = false;
          yearCount += 1;
          badRanges.push(r);
        }
      });
      if (yearCount > 0) {
        errors.push(`Found ${yearCount} ranges outside Year Values.`);
      }
    }
    
    // check for each month filter
    if (config.months && config.months.length > 0) {
      let monthCount = 0;
      ranges.forEach(r => {
        const startMonth = new Date(r.start).toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' }) as MonthType;
        const endMonth = new Date(r.end).toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' }) as MonthType;
        if (!config.months!.includes(startMonth) || !config.months!.includes(endMonth)) {
          valid = false;
          monthCount += 1;
          badRanges.push(r);
        }
      });
      if (monthCount > 0) {
        errors.push(`Found ${monthCount} ranges outside Month Values.`);
      }
    } 
    
    // check for each weekday filter
    if (config.weekdays && config.weekdays.length > 0) {
      let weekdayCount = 0;
      ranges.forEach(r => {
        const startWeekday = new Date(r.start).toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }) as DayType;
        const endWeekday = new Date(r.end).toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }) as DayType;
        if (!config.weekdays!.includes(startWeekday) || !config.weekdays!.includes(endWeekday)) {
          valid = false;
          weekdayCount += 1;
          badRanges.push(r);
        }
      });
      if (weekdayCount > 0) {
        errors.push(`Found ${weekdayCount} ranges outside Weekday Values.`);
      }
    }
    
    // check for each time filter
    if (config.times && config.times.length > 0) {
      let timeCount = 0;
      const toleranceHours = config.toleranceHours ?? DEFAULT_TOLERANCE;
      const toleranceMs: [number, number] = [toleranceHours[0] * MS_IN_HOUR, toleranceHours[1] * MS_IN_HOUR];
      
      ranges.forEach(r => {
        // Check if this range matches any of the configured times
        let matchesAnyTime = false;
        
        for (const configuredTime of config.times!) {
          let isValid = false;
          if (configuredTime.includes('-')) {
            // This is a time range specification (e.g., "09:00-17:00")
            isValid = validateTimeRangeSpec(r, configuredTime);
          } else {
            // This is a time point with tolerance (e.g., "14:00" ± toleranceMs)
            isValid = validateTimePointRange(r, configuredTime, toleranceMs);
          }
          
          if (isValid) {
            matchesAnyTime = true;
            break;
          }
        }
        
        if (!matchesAnyTime) {
          valid = false;
          timeCount += 1;
          badRanges.push(r);
          // console.log('Range time not in configured times:', r);
        }
      });
      
      if (timeCount > 0) {
        errors.push(`Found ${timeCount} ranges outside Time Values.`);
      }
    }
  }
  
  
  
  return {
    valid,
    errors,
    badRanges
  };
  
}