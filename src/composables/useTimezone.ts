import { computed, type Ref } from 'vue';
import { toZonedTime, fromZonedTime, format as formatTz, getTimezoneOffset } from 'date-fns-tz';
import type { MillisecondRange } from '../types/datetime';

export type Timezone = 
  "US/Eastern" |
  "US/Central" |
  "US/Mountain" |
  "US/Arizona" |
  "US/Pacific" |
  "US/Alaska" |
  "UTC";

type TimezoneOption = { tz: Timezone, name: string };

/**
 * Composable for centralized timezone handling and formatting
 */
export function useTimezone(selectedTimezone: Ref<string>) {
  
  /**
   * Convert UTC timestamp to timezone-aware date
   */
  function toTimezone(timestamp: number): Date {
    const utcDate = new Date(timestamp);
    return toZonedTime(utcDate, selectedTimezone.value);
  }

  /**
   * Convert timezone-aware date to UTC timestamp
   */
  function fromTimezone(date: Date): number {
    return fromZonedTime(date, selectedTimezone.value).getTime();
  }

  /**
   * Set date to local midnight in selected timezone
   */
  function setToMidnight(date: Date): number {
    const zonedDate = toZonedTime(date, selectedTimezone.value);
    zonedDate.setHours(0, 0, 0, 0);
    return fromZonedTime(zonedDate, selectedTimezone.value).getTime();
  }

  /**
   * Set date to end of day in selected timezone
   */
  function setToEndOfDay(date: Date): number {
    const zonedDate = toZonedTime(date, selectedTimezone.value);
    zonedDate.setHours(23, 59, 59, 999);
    return fromZonedTime(zonedDate, selectedTimezone.value).getTime();
  }

  /**
   * Format timestamp with full date and time
   */
  function formatTimeLong(timestamp: number): string {
    const utcDate = new Date(timestamp);
    const zonedDate = toZonedTime(utcDate, selectedTimezone.value);
    return formatTz(zonedDate, 'EEE, MMM d, yyyy \'at\' h:mm a', { timeZone: selectedTimezone.value });
  }

  /**
   * Format duration with timezone prefix
   */
  function formatDuration(range: MillisecondRange): string {
    const startUtc = new Date(range.start);
    const endUtc = new Date(range.end);
    const startZoned = toZonedTime(startUtc, selectedTimezone.value);
    const endZoned = toZonedTime(endUtc, selectedTimezone.value);
    
    const startTime = startZoned.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    const endTime = endZoned.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    return `${selectedTimezone.value}: ${startTime} - ${endTime}`;
  }

  /**
   * Format timezone range with date and time
   */
  function formatTimezoneRange(range: MillisecondRange): string {
    const startUtc = new Date(range.start);
    const endUtc = new Date(range.end);
    const startZoned = toZonedTime(startUtc, selectedTimezone.value);
    const endZoned = toZonedTime(endUtc, selectedTimezone.value);
    
    const startDate = startZoned.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    const startTime = startZoned.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    const endTime = endZoned.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    return `${startDate} ${startTime} - ${endTime}`;
  }

  /**
   * Format UTC range
   */
  function formatUTCRange(range: MillisecondRange): string {
    const startUtc = new Date(range.start);
    const endUtc = new Date(range.end);
    
    const startDate = startUtc.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      timeZone: 'UTC'
    });
    const startTime = startUtc.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC'
    });
    const endTime = endUtc.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC'
    });
    
    return `${startDate} ${startTime} - ${endTime}`;
  }

  /**
   * Format time string for display
   */
  function formatTime(timeString: string): string {
    const [hour, minute] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hour, minute, 0, 0);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  /**
   * Format date for display
   */
  function formatDateDisplay(date: Date | null): string {
    return date?.toDateString() || '';
  }

  // Computed properties for reactive timezone info
  const timezoneInfo = computed(() => ({
    name: selectedTimezone.value,
    offset: new Date().toLocaleString('en', {
      timeZone: selectedTimezone.value,
      timeZoneName: 'short'
    }).split(' ').pop() || ''
  }));

  function isDST(date: Date): boolean {
    const standardOffset = getTimezoneOffset(selectedTimezone.value, new Date(date.getUTCFullYear(), 0, 1));
    const currentOffset = getTimezoneOffset(selectedTimezone.value, date);
    if (standardOffset === currentOffset) {
      return false;
    }
    return true;
  }

  function timezoneOptions(date: Date): TimezoneOption[] {
    const dateIsDST = isDST(date);
    return [
      { tz: 'US/Eastern', name: dateIsDST ? 'Eastern Daylight' : 'Eastern Standard' },
      { tz: 'US/Central', name: dateIsDST ? 'Central Daylight' : 'Central Standard' },
      { tz: 'US/Mountain', name: dateIsDST ? 'Mountain Daylight' : 'Mountain Standard' },
      { tz: 'US/Arizona', name: 'Mountain Standard (AZ)' },
      { tz: 'US/Pacific', name: dateIsDST ? 'Pacific Daylight' : 'Pacific Standard' },
      { tz: 'US/Alaska', name: dateIsDST ? 'Alaska Daylight' : 'Alaska Standard' },
      { tz: 'UTC', name: 'UTC' },
    ];
  }

  return {
    // Core timezone operations
    toTimezone,
    fromTimezone,
    setToMidnight,
    setToEndOfDay,
    
    // Formatting functions
    formatTimeLong,
    formatDuration,
    formatTimezoneRange,
    formatUTCRange,
    formatTime,
    formatDateDisplay,

    // Utility functions
    isDST,
    timezoneOptions,
    
    // Computed properties
    timezoneInfo,
  };
}
