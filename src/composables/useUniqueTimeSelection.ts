import { ref, computed, watch, Ref, nextTick } from 'vue';
import { getTimezoneOffset } from 'date-fns-tz';

const ONEDAYMS = 1000 * 60 * 60 * 24;

function isBad(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

export const useUniqueTimeSelection = (timestamps: Ref<number[]>) => {
  const timeIndex = ref(0);
  const singleDateSelected = ref<Date>(new Date());
  const minIndex = ref<number>(0);
  const maxIndex = ref<number>(0);
  
  const mode = ref<'single' | 'all'>('single');
  const initialTimeSelection = ref<'first' | 'last'>('first');

  function getOneDaysTimestamps(date: Date) {
    if (isBad(date)) {
      return [];
    }
    const mod = [] as {ts:number, idx: number}[];
    timestamps.value.forEach((ts, idx) => {
      if ((ts - date.getTime()) < ONEDAYMS && (ts - date.getTime()) > 0) {
        mod.push({ ts, idx });
      }
    });
    return mod;
  }
  
  function getAllDaysTimestamps(date: Date) {
    if (isBad(date)) {
      return [];
    }
    // const mod = [] as {ts:number, idx: number}[];
    // timestamps.value.forEach((ts, idx) => {
    //   mod.push({ ts, idx });
    // });
    return timestamps.value.map((ts, idx) => ({ ts, idx }));
  }

  function setNearestDate(date: number | null) {
    if (date == null) {
      return;
    }

    const mod = mode.value === 'single' ? getOneDaysTimestamps(new Date(date)) : getAllDaysTimestamps(new Date(date));
    if (mod.length > 0) {
      minIndex.value = mod[0].idx;
      maxIndex.value = mod[mod.length - 1].idx;
      timeIndex.value = initialTimeSelection.value === 'first' ? minIndex.value : maxIndex.value;
    } else {
      console.warn("No timestamps found for the given date.");
    }
  }

  const timestamp = computed(() => {
    if (timestamps.value.length === 0) {
      return null;
    }
    const val = timestamps.value[timeIndex.value];
    return val;
  });

  const date = computed(() => {
    return timestamp.value ? new Date(timestamp.value) : null;
  });

  const offset = (date: Date) => getTimezoneOffset("US/Eastern", date);

  const uniqueDays = computed(() => {
    const easternDates = timestamps.value.map(ts => new Date(ts + offset(new Date(ts))));
    const days = easternDates.map(date => (new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())).getTime());
    const unique = Array.from(new Set(days));
    return unique.map(ts => new Date(ts));
  });

  const uniqueDaysIndex = (ts: number) => {
    let date = new Date(ts + offset(new Date(ts)));
    date = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    return uniqueDays.value.map(e => e.getTime()).indexOf(date.getTime());
  };

  function getUniqueDayIndex(date: Date | null | undefined): number {
    if (isBad(date)) {
      return 0;
    }
    return uniqueDays.value.findIndex(day => day.getTime() === date.getTime());
  }

  function moveBackwardOneDay() {
    const currentIndex = getUniqueDayIndex(singleDateSelected.value);
    if (currentIndex > 0) {
      singleDateSelected.value = uniqueDays.value[currentIndex - 1];
    }
  }

  function moveForwardOneDay() {
    const nextIndex = getUniqueDayIndex(singleDateSelected.value) + 1;
    if (nextIndex < uniqueDays.value.length) {
      singleDateSelected.value = uniqueDays.value[nextIndex];
    }
  }

  function nearestDate(date: Date): number {
    const time = date.getTime();
    const timestamp = timestamps.value.find(ts => ((ts - time) < ONEDAYMS) && (ts - time) >= 0);
    if (timestamp !== undefined) {
      return timestamp;
    } else {
      console.warn("No matching timestamp found, returning default value.");
      return timestamps.value[0];
    }
  }

  function nearestDateIndex(date: Date): number {
    const timestamp = date.getTime();
    const index = timestamps.value.findIndex(ts => ((ts - timestamp) < ONEDAYMS) && (ts - timestamp) >= 0);
    if (index < 0) {
      console.log("No matching timestamp found, returning default index.");
      return 0;
    }
    return index;
  }
  
    
  /**
   * setNearestTime function will set the timeIndex to the nearest timestamp for the given date
   * it will also setup the minIndex and maxIndex for the day, and singleDateSelected to the date
   */
  function setNearestTime(date: Date | null) {
    if (isBad(date)) {
      return;
    }
    // check if same day as singleDateSelected
    let selectedDate = singleDateSelected.value;
    const sameDay = (selectedDate.getFullYear() === date.getFullYear() &&
        selectedDate.getMonth() === date.getMonth() &&
        selectedDate.getDate() === date.getDate());
    if (!sameDay) {
      selectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      // check that it is in uniqueDays
      const uniqueDayIndex = getUniqueDayIndex(selectedDate);
      if (uniqueDayIndex >= 0) {
        singleDateSelected.value = uniqueDays.value[uniqueDayIndex];
      } else {
        throw new Error("Date not found in unique days");
      }
    }
    // want to set timeIndex to nearest timestamp for that day
    nextTick(() => {
      const index = nearestDateIndex(date);
      timeIndex.value = index;
      console.log("setNearestTime: set timeIndex to ", index, selectedDate);
    });
    
  }
  


  watch(singleDateSelected, (value) => {
    if (value) { 
      setNearestDate(value.getTime());
    }
  });
  
  watch(mode, () => {
    setNearestDate(singleDateSelected.value.getTime());
  });

  watch(timestamps, (newTimestamps) => {
    if (newTimestamps.length === 0) {
      timeIndex.value = 0;
      minIndex.value = 0;
      maxIndex.value = 0;
      return;
    }
    // Reset to first date if current date is out of range
    if (timeIndex.value == null || timeIndex.value >= newTimestamps.length) {
      timeIndex.value = 0;
      singleDateSelected.value = new Date(newTimestamps[0]);
    } else {
      setNearestDate(singleDateSelected.value.getTime());
    }
  }, { immediate: true });

  return {
    timeIndex,
    timestamp,
    date,
    singleDateSelected,
    maxIndex,
    minIndex,
    uniqueDays,
    mode,
    initialTimeSelection,
    uniqueDaysIndex,
    setNearestDate,
    getUniqueDayIndex,
    moveBackwardOneDay,
    moveForwardOneDay,
    nearestDate,
    nearestDateIndex,
    setNearestTime,
  };
};
