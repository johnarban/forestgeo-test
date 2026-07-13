import type { TimeBinOptions, FoldingPeriodOptions } from '@/types';
export type { TimeBinOptions, FoldingPeriodOptions } from '@/types';

const validFoldingPeriodsForTimeBin: Record<TimeBinOptions, FoldingPeriodOptions[]> = {
  'hour': [ 'none', 'day', 'week', 'month', 'year', 'weekdayWeekend',],
  'day': ['none', 'week', 'month', 'year', 'weekdayWeekend', ],
  'week': ['none', 'month', 'year', ],
  'month': ['none', 'year', ],
  'none' :  [ 'none', 'day', 'week', 'month', 'year']
};


const validTimeBinsForFoldingPeriod: Record<FoldingPeriodOptions, (keyof typeof validFoldingPeriodsForTimeBin)[]> = {
  'day': ['none', 'hour'],
  'week': ['none', 'hour', 'day'],
  'month': ['none', 'hour', 'day', 'week'],
  'year': ['none', 'hour', 'day', 'week', 'month'],
  'weekdayWeekend': ['hour', 'day'],
  'none': ['none', 'hour', 'day', 'week', 'month'],
};


export function getValidFoldingPeriods(timeBin: TimeBinOptions): FoldingPeriodOptions[] {
  return validFoldingPeriodsForTimeBin[timeBin] || [];
}


export function getValidTimeBins(foldingPeriod: FoldingPeriodOptions): TimeBinOptions[] {
  return validTimeBinsForFoldingPeriod[foldingPeriod] || [];
}

export function isValidCombination(timeBin: TimeBinOptions, foldingPeriod: FoldingPeriodOptions): boolean {
  return validTimeBinsForFoldingPeriod[foldingPeriod]?.includes(timeBin) ?? false;
}

export function getFirstValidTimeBin(foldingPeriod: FoldingPeriodOptions): TimeBinOptions {
  const validTimeBins = validTimeBinsForFoldingPeriod[foldingPeriod];
  return validTimeBins[0];
}

export function getFirstValidFoldingPeriod(timeBin: TimeBinOptions): FoldingPeriodOptions {
  const validFoldingPeriods = validFoldingPeriodsForTimeBin[timeBin];
  return validFoldingPeriods[0];
}