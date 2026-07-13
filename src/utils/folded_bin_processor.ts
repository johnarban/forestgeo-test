import type { FoldType } from '@/esri/services/aggregation';
import { daysInMonth } from '@/utils/calendar_utils';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednewday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const REFERENCE_LEAP_YEAR = 2020;

function normalizeFoldTypeForLabels(foldType: FoldType | string): FoldType | string {
  if (foldType.startsWith('noneOf') && foldType !== 'noneOfNone') {
    return foldType.replace('noneOf', 'hourOf') as FoldType;
  }
  return foldType;
}

function formatHourLabel(hourValue: number): string {
  if (!Number.isFinite(hourValue)) return '';
  const wrapped = ((hourValue % 24) + 24) % 24;
  let hour = Math.floor(wrapped);
  let minute = Math.round((wrapped - hour) * 60);

  if (minute === 60) {
    minute = 0;
    hour = (hour + 1) % 24;
  }

  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;

  if (minute === 0) {
    return `${hour12} ${ampm}`;
  }

  return `${hour12}:${String(minute).padStart(2, '0')} ${ampm}`;
}

function dayIndexToMonthDay(dayIndex: number, year: number): { monthIndex: number; dayOfMonth: number } {
  let remaining = Math.max(0, Math.floor(dayIndex));
  for (let monthIndex = 0; monthIndex < 12; monthIndex += 1) {
    const days = daysInMonth(monthIndex + 1, year);
    if (remaining < days) {
      return { monthIndex, dayOfMonth: remaining + 1 };
    }
    remaining -= days;
  }
  const lastMonth = 11;
  return { monthIndex: lastMonth, dayOfMonth: daysInMonth(lastMonth + 1, year) };
}

function formatMonthDay(dayIndex: number): string {
  const { monthIndex, dayOfMonth } = dayIndexToMonthDay(dayIndex, REFERENCE_LEAP_YEAR);
  const monthName = MONTH_NAMES[monthIndex] ?? '';
  return `${monthName} ${dayOfMonth}`;
}

export function formatFoldedBinValue(foldType: FoldType | string, bin: number): string {
  if (!Number.isFinite(bin)) return '';
  const normalizedFoldType = normalizeFoldTypeForLabels(foldType);

  switch (normalizedFoldType) {
  case 'hourOfDay':
    return formatHourLabel(bin);
  case 'hourOfWeek': {
    const dayIndex = Math.floor(bin / 24);
    const hour = bin - dayIndex * 24;
    const dayName = DAY_NAMES[((dayIndex % 7) + 7) % 7] ?? '';
    return `${dayName} ${formatHourLabel(hour)}`.trim();
  }
  case 'hourOfMonth': {
    const dayIndex = Math.floor(bin / 24);
    const hour = bin - dayIndex * 24;
    return `Day ${dayIndex + 1} ${formatHourLabel(hour)}`;
  }
  case 'hourOfYear': {
    const dayIndex = Math.floor(bin / 24);
    const hour = bin - dayIndex * 24;
    return `${formatMonthDay(dayIndex)} ${formatHourLabel(hour)}`;
  }
  case 'hourOfSeason': {
    const dayIndex = Math.floor(bin / 24);
    const hour = bin - dayIndex * 24;
    return `Day ${dayIndex + 1} ${formatHourLabel(hour)}`;
  }
  case 'dayOfWeek': {
    const dayIndex = Math.floor(bin);
    return DAY_NAMES[((dayIndex % 7) + 7) % 7] ?? String(bin);
  }
  case 'dayOfWeekdayWeekend':
    return Math.floor(bin) === 0 ? 'Weekday' : 'Weekend';
  case 'hourOfWeekdayWeekend': {
    const dayHour = Math.floor(bin);
    const isWeekend = dayHour >= 24;
    const hour = bin - (isWeekend ? 24 : 0);
    const suffix = isWeekend ? 'WE' : 'WD';
    return `${formatHourLabel(hour)} (${suffix})`;
  }
  case 'dayOfMonth':
    return `Day ${Math.floor(bin) + 1}`;
  case 'dayOfYear':
    return formatMonthDay(bin);
  case 'dayOfSeason':
    return `Day ${Math.floor(bin) + 1}`;
  case 'weekOfMonth':
    return `Week ${Math.floor(bin) + 1}`;
  case 'weekOfYear': {
    const week = Math.floor(bin);
    return `Week ${week < 1 ? week + 1 : week}`;
  }
  case 'weekOfSeason':
    return `Week ${Math.floor(bin) + 1}`;
  case 'monthOfYear': {
    const monthIndex = Math.floor(bin);
    return MONTH_NAMES[((monthIndex % 12) + 12) % 12] ?? String(bin);
  }
  case 'monthOfSeason':
    return `Month ${Math.floor(bin) + 1}`;
  case 'noneOfNone':
  case 'hourOfNone':
  case 'dayOfNone':
  case 'weekOfNone':
  case 'monthOfNone':
    return String(bin);
  default:
    return String(bin);
  }
}

export function foldedDataBinUnit(foldType: FoldType | string): string | null {
  const unit = normalizeFoldTypeForLabels(foldType).split('Of')[0];
  if (unit === 'none') {
    return 'Time';
  }
  return unit;
}

import { camelToSentance } from './text';

export function foldTypeToLabel(foldType: FoldType | string): string {
  if (!foldType.endsWith('None')) {
    return camelToSentance(foldType);
  }
  
  return camelToSentance(foldType.split('Of')[0]).replace('Day', 'Dai') + 'ly Average';
}