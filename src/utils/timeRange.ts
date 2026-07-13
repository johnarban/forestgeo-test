import { getTimezoneOffset } from "date-fns-tz";
import type { MillisecondRange, TimeRange, UserDataset } from "../types";

export function formatSingleRange(range: MillisecondRange): string {
  const startString = new Date(range.start).toLocaleDateString();
  const endString = new Date(range.end).toLocaleDateString();
  if (startString === endString) {
    return startString;
  }
  return `${startString} - ${endString}`;
}

export function formatTimeRange(ranges: MillisecondRange | MillisecondRange[]): string {
  if (Array.isArray(ranges)) {
    if (ranges.length === 0) {
      return 'No time range set';
    }
    
    if (ranges.length === 1) {
      return formatSingleRange(ranges[0]); 
    } else {
      // For multiple ranges, show the full span
      const allStarts = ranges.map(r => r.start);
      const allEnds = ranges.map(r => r.end);
      const minStart = Math.min(...allStarts);
      const maxEnd = Math.max(...allEnds);
      return `${new Date(minStart).toLocaleDateString()} - ${new Date(maxEnd).toLocaleDateString()} (${ranges.length} ranges)`;
    }
  } else {
    return formatSingleRange(ranges);
  }
}

export function getTimeRangeDisplay(sel: UserDataset): string {
  if (!sel.timeRange || !sel.timeRange.range) {
    return `No time range set for selection ${sel.id}`;
  }
  return formatTimeRange(sel.timeRange.range);
}

export function rangeForSingleDay(day: Date, timezone: string): MillisecondRange {
  const offset = getTimezoneOffset(timezone, day);
  const dayUTC = day.getTime() - offset;
  const start = dayUTC - (dayUTC % 86400000) - offset; // Start of the day in milliseconds
  const end = start + (86400000 - 1); // End of the day in milliseconds
  return { start, end };
}

export function areEquivalentMsRanges(first: MillisecondRange, second: MillisecondRange): boolean {
  return first.start === second.start && first.end === second.end;
}

export function areEquivalentTimeRanges(first: TimeRange, second: TimeRange): boolean {
  if (first.id === second.id) {
    return true;
  }

  const array = Array.isArray(first.range);
  if (array !== Array.isArray(second.range)) {
    return false;
  }

  if (array) {
    const firstRange = first.range as MillisecondRange[];
    const secondRange = second.range as MillisecondRange[];
    return firstRange.length === secondRange.length &&
      firstRange.every((rg, idx) => areEquivalentMsRanges(rg, secondRange[idx]));
  } else {
    return areEquivalentMsRanges(first.range as MillisecondRange, second.range as MillisecondRange);
  }
}
