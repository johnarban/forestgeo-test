import { toZonedTime, fromZonedTime } from 'date-fns-tz';

export const START_WEEK_ON_MONDAY = false;


export function getBeginningOfWeek(date: Date, timezone?: string): Date {
  const zonedDate = timezone ? toZonedTime(date, timezone) : new Date(date);
  const day = zonedDate.getDay(); // 0 (Sun) to 6 (Sat)
  const weekStart = new Date(zonedDate);
  if (START_WEEK_ON_MONDAY) {
    if (day === 0) { // if it is a Sunday, go back 6 days to monday
      weekStart.setDate(zonedDate.getDate() - 6);
    } else { // otherwise only go back to Monday
      weekStart.setDate(zonedDate.getDate() - (day - 1));
    }
  
  } else { // we can just subtract the day number
    weekStart.setDate(zonedDate.getDate() - day);
  }
  weekStart.setHours(0, 0, 0, 0);
  // want this to return the UTC time (so we can use the timestamp if we want)
  return timezone ? fromZonedTime(weekStart, timezone) : weekStart;
}

export function getEndOfWeek(date: Date, timezone?: string): Date {
  // we'll handle the timzone
  const zonedDate = timezone ? toZonedTime(date, timezone) : date;
  const weekEnd = getBeginningOfWeek(zonedDate); // we'll modify this to be the end
  // increment by 6 days 23:59:59.999
  weekEnd.setDate(weekEnd.getDate() + 6); // move to Sunday
  weekEnd.setHours(23, 59, 59, 999); // end of the day
  return timezone ? fromZonedTime(weekEnd, timezone) : weekEnd;
}


function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

function getWeekOfYearSundayStart(date: Date) {
  const currentDayOfYear = dayOfYear(date);
  const januaryFirst = new Date(date.getFullYear(), 0, 1);
  const dayOfYearStart = januaryFirst.getDay();
  
  return Math.floor((currentDayOfYear + dayOfYearStart) / 7) + 1; 
}

function getWeekOfYearMondayStart(date: Date) {
  const currentDayOfYear = dayOfYear(date);
  const januaryFirst = new Date(date.getFullYear(), 0, 1);
  // Shift so that Monday = 0, Sunday = 6
  const dayOfYearStart = (januaryFirst.getDay() + 6) % 7;

  return Math.floor((currentDayOfYear + dayOfYearStart) / 7) + 1;
}

export function getWeekOfYear(date: Date) {
  return START_WEEK_ON_MONDAY ? getWeekOfYearMondayStart(date) : getWeekOfYearSundayStart(date);
}


/**
 * Helper to get number of days in a month
 * @param month 1-12 for Jan-Dec
 * @param year full year e.g. 2023
 * @returns number of days in the month
 */
export function daysInMonth(month, year) {
  return new Date(year, month, 0).getDate();
}

export function getDaysInMonth(date: Date): number {
  return daysInMonth(date.getMonth() + 1, date.getFullYear());
}

export function getDaysInYear(date: Date): number {
  const year = date.getFullYear();
  return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0) ? 366 : 365;
}

export function seasonFraction(date: Date): number {
  // D=12, J=1, F=2, M=3, A=4, M=5, J=6, J=7, A=8, S=9, O=10, N=11
  // D=11, J=0, F=1, M=2, A=3, M=4, J=5, J=6, A=7, S=8, O=9, N=10 (0-based)
  const month = date.getMonth();
  const seasonStartingMonths = [11, 2, 5, 8]; // Dec-11, Mar-2, Jun-5, Sep-8
  const seasonEndingMonths = [1, 4, 7, 10]; // Feb-1, May-4, Aug-7, Nov-10
  const season = Math.floor(((month + 1) / 3) % 4); // 0, 1, 2, 3 for DJF, MAM, JJA, SON

  const yearOff = season === 0 ? 1 : 0; // if DJF, then year offset is 1
  const seasonStart = new Date(
    date.getFullYear() - yearOff, 
    seasonStartingMonths[season], 1).getTime(); // Dec 1 of previous year
  const seasonEnd = new Date(
    date.getFullYear(),
    seasonEndingMonths[season] +1 , -1, 23, 59, 59, 999).getTime(); // Last day of Feb
  const seasonFrac = (date.getTime() - seasonStart) / (seasonEnd - seasonStart);
  return seasonFrac;
  
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export function _run_value_or_funcion<T, D>(valueOrFunc: T | ((input: D) => T) | undefined, argument?: D) : T | undefined {
  if (valueOrFunc === undefined) return undefined;
  if (typeof valueOrFunc === 'function') {
    if (!argument) throw new Error('An argument must be provided when value is a function');
    return (valueOrFunc as (input: D) => T)(argument);
  }
  return valueOrFunc;
} 

export type BinSizes = 's' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year' | 'none' | 'weekendweekday';
export type FoldPeriods = 'day' | 'week' | 'year' | 'month' | 'none' | 'weekendweekday';

/**
 * 
 * Handle our basic BinSizes and time specifiers
 * 
 * 
*/

function altFloorHour(date: Date): Date {
  const msPerHour = 3600000; // milliseconds in an hour
  return new Date(Math.round(date.getTime() / msPerHour) * msPerHour);
}

function floorWeekendWeekday(date: Date): Date {
  // The weekend defined to be consecutive Saturday and Sunday
  const _date = new Date(date);
  const day = date.getDay();
  _date.setHours(0, 0, 0, 0); // set to start of day
  
  const isWeekday = !(day === 0 || day === 6);
  // just push to previous Monday
  
  
  if (isWeekday) { // move to Monday
    _date.setDate(date.getDate() - day + 1);
    return _date;
  } 
  
  // // eslint-disable-next-line no-empty
  if (day === 6) { 
    _date.setDate(date.getDate() - 5); // move to Monday
  }
  
  if (day == 0) {
    _date.setDate(date.getDate() - 1 - 5);
  }
  
  return _date;
}

const d = (date: Date) => new Date(date); // helper to avoid mutating input date
const dateFlooringMap = new Map<BinSizes, (date: Date) => Date>([
  ['s', (date: Date) => new Date(d(date).setMilliseconds(0))],
  
  ['minute', (date: Date) => new Date(d(date).setSeconds(0, 0))],
  
  // ['hour', (date: Date) => new Date(d(date).setMinutes(0, 0, 0))],
  ['hour', altFloorHour], // we want to bin to the nearest hour
  
  ['day', (date: Date) => new Date(d(date).setHours(0, 0, 0, 0))],
  
  ['week', (date: Date) => getBeginningOfWeek(date)],
  
  ['month', (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0)],
  
  ['year', (date: Date) => new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0)],
  
  ['none', (date: Date) => date],
  
  ['weekendweekday', (date: Date) => floorWeekendWeekday(date)],
  
]); 
  
// we never actually use this fucntionc
// const getDateLocalPart = new Map<BinSizes, (date: Date) => number>([
//   ['s', (date: Date) => date.getSeconds()],
//   ['minute', (date: Date) => date.getMinutes()],
//   ['hour', (date: Date) => date.getHours()],
//   ['day', (date: Date) => date.getDate()],
//   ['week', (date: Date) => getWeekOfYear(date)],
//   ['month', (date: Date) => date.getMonth()], // return 1-12
//   ['year', (date: Date) => date.getFullYear()],
//   ['none', (date: Date) => date.getTime()], // not sure if this makes sense
//   ['weekendweekday', (date: Date) => {
//     const day = date.getDay();
//     return (day === 0 || day === 6) ? 2 : 5; // 6 = Sat/Sun, 1 = Mon-Fri
//   }], 
// ]);

const MS_IN_SECOND = 1000;
const MS_IN_MINUTE = 60 * MS_IN_SECOND;
const MS_IN_HOUR = 60 * MS_IN_MINUTE;
const MS_IN_DAY = 24 * MS_IN_HOUR;
const MS_IN_WEEK = 7 * MS_IN_DAY;

export const binDurationMs = new Map<BinSizes, number | ((date: Date) => number)>([
  ['s', MS_IN_SECOND],
  ['minute', MS_IN_MINUTE],
  ['hour', MS_IN_HOUR],
  ['day', MS_IN_DAY],
  ['week', MS_IN_WEEK],
  ['month', (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return daysInMonth(month + 1, year) * MS_IN_DAY;
  }],
  ['year', (date: Date) => {
    const year = date.getFullYear();
    return getDaysInYear(new Date(year, 0, 1)) * MS_IN_DAY;
  }],
  ['none', 1],
  ['weekendweekday', (date: Date) => {
    const day = date.getDay();
    return MS_IN_DAY * (day === 0 || day === 6 ? 1 : 1);
  }],
]);

export function floorTime(date: Date, floorTo: BinSizes): Date {
  const func = dateFlooringMap.get(floorTo);
  if (!func) throw new Error(`Unsupported floorTo value: ${floorTo}`);
  return func(new Date(date)); // use new Date to avoid mutating input date
}

export function getBinSizeAsMs(size: BinSizes, date?: Date): number | undefined {
  const duration = binDurationMs.get(size);
  return _run_value_or_funcion(duration, date);
}


// we never actually use this function
// export const applyFoldOnFunctions = (date: Date, f: BinSizes) => getDateLocalPart.get(f)!(date);

export const applyFloorFunctions = (date: Date, bin: BinSizes) => dateFlooringMap.get(bin)!(date);


export function getFoldedPhase(date: Date, period: FoldPeriods, normalize=false): number {
  if (period === 'none') return date.getTime();
  const originalTime = date.getTime();
  const foldOn = applyFloorFunctions(new Date(date), period).getTime();
  if (!normalize) {
    return originalTime - foldOn;
  }
  const durationMsValue = binDurationMs.get(period)!;
  const durationMs = typeof durationMsValue === 'function' ? durationMsValue(date) : durationMsValue;

  return (originalTime - foldOn) / durationMs;

}





/**
 * Returns a number or function that provides a precise duration in milliseconds
 * for the given TimeSpecifier.
 * In particular - for month and year, it returns a function that takes a Date object
 */


type SecondSpecifier = 's' | 'sec' | 'second' ;
type MinuteSpecifier =  'min' | 'minute' ;
type HourSpecifier = 'h' | 'hr' | 'hour' ;
type DaySpecifier = 'd' | 'day' ;
type MonthSpecifier = 'm' | 'mon' | 'month' ;
type YearSpecifier = 'y' | 'yr' | 'year' ;
type WeekSpecifier = 'w' | 'wk' | 'week' ;
type TimeSpecifier = SecondSpecifier | MinuteSpecifier | HourSpecifier | DaySpecifier | MonthSpecifier | YearSpecifier | WeekSpecifier ;

const timespecifierToBinSize: Record<TimeSpecifier, BinSizes> = {
  's': 's', 'sec': 's', 'second': 's', 
  'min': 'minute', 'minute': 'minute', 
  'h': 'hour', 'hr': 'hour', 'hour': 'hour', 
  'd': 'day', 'day': 'day', 
  'w': 'week', 'wk': 'week', 'week': 'week', 
  'm': 'month', 'mon': 'month', 'month': 'month', 
  'y': 'year', 'yr': 'year', 'year': 'year',
};

export function parseTimeSpecifier(spec: string): [number, BinSizes] | null {
  const tsoptions = Object.keys(timespecifierToBinSize).join('|');
  const decimalOrFloatRegex = '\\d*\\.?\\d+'; // matches integers or decimals of form 10, .5, 0.25, 2.0 etc.
  const regex = new RegExp(`^(${decimalOrFloatRegex})?\\s*(${tsoptions})$`, 'i');
  const match = spec.trim().match(regex);
  if (!match) return null;
  const value = match[1] ? parseFloat(match[1]) : 1;
  const unit = match[2].toLowerCase() as TimeSpecifier;
  let binSize: BinSizes;
  if (unit in timespecifierToBinSize) {
    binSize = timespecifierToBinSize[unit];
  } else {
    return null;
  }
  return [value, binSize];
}



function timeSpecDurationMs(spec: TimeSpecifier) {
  const parsed = parseTimeSpecifier(spec)!;
  const [value , binSize] = parsed;
  const duration = binDurationMs.get(binSize)!;
  if (typeof duration === 'number') {
    return value * duration;
  } else {
    return (d: Date) => value * duration(d);
  }
}

/**
 * Convenience wrapper around timeSpecDurationMs to return the duration in ms
 * for a given TimeSpecifier and optional Date (required for month and year)
 * For a loop it is better to call timeSpecDurationMs once and reuse the result
 * rather than calling this function repeatedly which results in multiple lookups
 * and function creations.
 */
export function timespecifierToMs(spec: TimeSpecifier, date?: Date): number | undefined {
  return _run_value_or_funcion(timeSpecDurationMs(spec), date);
}

