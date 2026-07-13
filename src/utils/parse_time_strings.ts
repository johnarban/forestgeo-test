export type HMFormatterFunction = (hour: number, minute: number, ampm?: boolean) => string;


/**
 * Parse a string to a timme. Support H, H:MM, HH, HH:MM, and am/pm
 * 
 */
export function parseTimeString(timeString: string): { hour: number; minute: number } | null {
  
  // get a lower case version, and remove spaces
  const lower = timeString.toLowerCase().replace(/\s+/g, '');

  // Defeine regexes
  // Match the hour part (1 or 2 digits)
  const hourRegex = /^(\d{1,2})/; 
  // Match the minute part (optional, preceded by a colon)
  const minuteRegex = /(?::(\d{1,2}))/; 
  // Matches the am/pm suffix, required
  const ampmRegex = /(am|pm)$/; 
  
  
  const ampmMatch = lower.match(new RegExp(`${hourRegex.source}${minuteRegex.source}?${ampmRegex.source}`));
  if (ampmMatch) {
    let hour = parseInt(ampmMatch[1], 10);
    const minute = ampmMatch[2] ? parseInt(ampmMatch[2], 10) : 0;
    const suffix = ampmMatch[3];
    if (suffix === 'pm' && hour < 12) hour += 12;
    if (suffix === 'am' && hour === 12) hour = 0;
    return { hour, minute };
  }
  
  const m = lower.match(new RegExp(`${hourRegex.source}${minuteRegex.source}?`));
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const mm = m[2] ? parseInt(m[2], 10) : 0;
  if (isNaN(h) || h < 0 || h > 23) return null;
  if (isNaN(mm) || mm < 0 || mm > 59) return null;
  return { hour: h, minute: mm }; 
}


export function formatTimeHHMM24(time: {hour: number, minute: number}): string {
  return `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`;
}


export function normalizeTimeRange(timeRangeStr: string, formatter: HMFormatterFunction): string | null {
  const parts = timeRangeStr.split('-').map(p => p.trim());
  if (parts.length !== 2) return null;
  let startParsed = parseTimeString(parts[0]);
  let endParsed = parseTimeString(parts[1]);
  if (!startParsed || !endParsed) return null;
  const endEarlier = (endParsed.hour + endParsed.minute / 60) < (startParsed.hour + startParsed.minute / 60);
  if (endEarlier) {
    /* Situations where due to user errorr end time is earlier than start time:
    1. hours are equal, swap -> just swap them
    2. start <= 12 and end < 12 -> end is pm
    */
    if (startParsed.hour === endParsed.hour) {
      // swap
      [startParsed, endParsed] = [endParsed, startParsed];
    } else if (startParsed.hour <= 12 && endParsed.hour < 12) {
      endParsed.hour += 12;
    } else if (startParsed.hour > 12 && endParsed.hour <= 12) {
      [startParsed, endParsed] = [endParsed, startParsed];
    } else {
      throw new Error(`Cannot parse time range: ${timeRangeStr} with start ${startParsed} and end ${endParsed}`);
    }
  }
  const startStr = formatter(startParsed.hour, startParsed.minute, true);
  const endStr = formatter(endParsed.hour, endParsed.minute, true);
  return [startStr, endStr].join('-');
}

// Normalize entered times to HH:MM 24h (flexible entry via copilot)
export function _normalizeTimes(values: string[], formatter: HMFormatterFunction): string[] {
  const normalized = values
    .map(v => String(v).trim())
    .map(v => {
      if (v.includes('-')) {
        // console.log('parsing range', v);
        const range = normalizeTimeRange(v, formatter);
        return range;
      }
      const parsed = parseTimeString(v);
      if (!parsed) return null;
      return formatter(parsed.hour, parsed.minute, true);
    })
    .filter((v): v is string => !!v);
  // Deduplicate
  return normalized;

}