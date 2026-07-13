import { MillisecondRange } from "@/types";
/**
 * Efficient "two-pointer" filtering of time ranges based on allowed timestamps.
 * These methods were suggest by Google Gemini 2.5 Flash
 * 
*/


// Helper to convert an allowed Date into a full-day range (00:00:00 to 23:59:59.999)
// The times we input have the correct UTC days values. 
// Out allowed Dates have the correct Date but start at 0:00 Eastern time, but have the correct Day
// So we need to create a full-day range in UTC for that date.
function dateToDayRange(date: Date): MillisecondRange {
  const startUTC = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getDate(), 0, 0, 0, 0);
  const start = new Date(startUTC);
  
  const endUTC = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getDate(), 23, 59, 59, 999);
  const end = new Date(endUTC);
  
  return {
    start: start.getTime(),
    end: end.getTime(),
  };
}

/**
 * Filters a sorted list of time ranges based on ANY overlap with a sorted list of allowed full-day ranges.
 * This is the correct Range-Over-Range Two-Pointer approach for your requirement.
 *
 * @param ranges Must be sorted by 'start'.
 * @param allowedDates Must be sorted chronologically.
 * @returns Filtered MillisecondRange[]
 */
export function filterForAllowedDates(
  ranges: MillisecondRange[],
  allowedDates: Date[]
): MillisecondRange[] {
  if (!allowedDates || allowedDates.length === 0) {
    return [];
  }

  const filteredRanges: MillisecondRange[] = [];
  
  // O(M) transformation
  const allowedDayRanges = allowedDates.map(dateToDayRange);
  
  let rangeIndex = 0; // Pointer for the input ranges (N)
  let dayIndex = 0;   // Pointer for the allowed full-day ranges (M)
  let _rejectedCount = 0;

  while (rangeIndex < ranges.length && dayIndex < allowedDayRanges.length) {
    const currentRange = ranges[rangeIndex];
    const currentDayRange = allowedDayRanges[dayIndex];

    // Check for ANY overlap
    const hasOverlap = currentRange.start <= currentDayRange.end &&
                       currentRange.end >= currentDayRange.start;

    if (hasOverlap) {
      // 1. MATCH: The time range is valid.
      filteredRanges.push(currentRange);
      // Advance the time range pointer to check the next range.
      // The current allowed day might validate multiple ranges.
      rangeIndex++;
    } else {
      // 2. NO MATCH: Determine which pointer to advance.
      
      // If the current time range ENDS BEFORE the allowed day STARTS, 
      // the time range is too early. Advance the time range pointer.
      if (currentRange.end < currentDayRange.start) {
        _rejectedCount++;
        rangeIndex++;
      }
      
      // If the current time range STARTS AFTER the allowed day ENDS, 
      // the allowed day is too early. Advance the allowed day pointer.
      else if (currentRange.start > currentDayRange.end) {
        dayIndex++;
      }
      
      // Note: Due to the 'hasOverlap' check above, one of the two conditions 
      // in the 'else' block must be true if there is no overlap.
    }
  }
  // console.log(`filterForAllowedDates: Rejected ${rejectedCount} ranges/dates.`);
  return filteredRanges;
}