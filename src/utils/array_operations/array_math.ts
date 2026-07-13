export function isBad(v: number | null | undefined): v is null | undefined {
  return v === null || v === undefined || isNaN(v);
}

export function nan2null(v: number | null): number | null {
  return isBad(v) ? null : v;
}


// typeof NaN is 'number'. Just included here 
type DirtyNumberArray = Array<number | null | typeof NaN | undefined>;

function _getValidData(arr: DirtyNumberArray) {
  const validArr: number[] = [];
  let sum = 0;
  for (const v of arr) {
    if (!isBad(v)) {
      validArr.push(v);
      sum += v;
    }
  }
  return { validArr, sum, length: validArr.length };
}

function _length(arr: DirtyNumberArray): number {
  return arr.length;
}

function _nanLength(arr: DirtyNumberArray): number {
  return arr.filter(v => !isBad(v)).length;
}

export function sum(arr: DirtyNumberArray): number | null {
  if (arr.length === 0 || arr.some(v => isBad(v))) {
    return null;
  }
  return (arr as number[]).reduce((a, b) => a + b, 0);
}

export function nansum(arr: DirtyNumberArray): number {
  const { sum } = _getValidData(arr);
  return sum;
}

export function mean(arr: DirtyNumberArray): number | null {
  // filter nan, null, undefined
  if (arr.length === 0 || arr.some(v => isBad(v))) {
    return null;
  }
  const sum = (arr as number[]).reduce((a, b) => a + b, 0);
  return sum / arr.length;
}

export function nanmean(_arr: DirtyNumberArray): number | null {
  const { sum, length } = _getValidData(_arr);
  if (length === 0) return null;
  return sum / length;
}

export function difference(a: number | null | undefined, b: number | null | undefined): number | null {
  if (isBad(a) || isBad(b)) return null;
  return a - b;
}

export function diff(arr: DirtyNumberArray): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 1; i < arr.length; i++) {
    result.push(difference(arr[i],arr[i - 1]));
  }
  return result;
}


export function variance(arr: DirtyNumberArray): number | null {
  if (arr.length < 2 || arr.some(v => isBad(v))) {
    return null;
  }
  const m = mean(arr);
  if (m === null) return null;
  const diffs = (arr as number[]).map(v => (v - m) * (v - m));
  return mean(diffs); // mean = sum(diffs) / n
}

export function stdev(arr: DirtyNumberArray): number | null {
  const v = variance(arr);
  if (v === null) return null;
  return Math.sqrt(v);
}

export function standardError(arr: DirtyNumberArray): number | null {
  const s = stdev(arr);
  return s ? s / Math.sqrt(arr.length) : null;
}

export function nanvariance(arr: DirtyNumberArray): number | null {
  const { validArr, length } = _getValidData(arr);
  if (length < 2) {
    return null;
  }
  const m = nanmean(validArr);
  if (m === null) return null;
  const diffs = validArr.map(v => (v - m) * (v - m));
  const result = nanmean(diffs);
  return result;
}


export function nanstdev(arr: DirtyNumberArray): number | null {
  const v = nanvariance(arr);
  if (v === null) return null;
  return Math.sqrt(v);
}

export function nanstandardError(arr: DirtyNumberArray): number | null {
  const stdev = nanstdev(arr);
  const length = _nanLength(arr);
  if (stdev === null || length === 0) return null;
  return stdev / Math.sqrt(length);
}

export function median(arr: DirtyNumberArray): number | null {
  if (arr.length === 0 || arr.some(v => isBad(v))) {
    return null;
  }
  const sorted = [...(arr as number[])].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  } else {
    return sorted[mid];
  }
}

export function nanmedian(arr: DirtyNumberArray): number | null {
  const { validArr } = _getValidData(arr);
  if (validArr.length === 0) return null;
  return median(validArr);
}

export function nanmedianAbsoluteDeviation(arr: DirtyNumberArray): number | null {
  const { validArr } = _getValidData(arr);
  if (validArr.length === 0) return null;
  const med = median(validArr);
  if (med === null) return null;
  const absDevs = validArr.map(v => Math.abs(v - med));
  return median(absDevs);
}

export function mad(arr: number[]): number;
export function mad(arr: DirtyNumberArray): number | null {
  const med = median(arr);
  if (med === null) return null;
  const absDevs = (arr as number[]).map(v => Math.abs(v - med));
  return median(absDevs);
}

export function nanmad(arr: DirtyNumberArray): number | null {
  return nanmedianAbsoluteDeviation(arr);
}


export function arrayMax(arr: number[]): number | null {
  if (arr.length === 0) {
    return null;
  }

  return arr.reduce((max, current) => {
    return current > max ? current : max;
  });
}

export function arrayMin(arr: number[]): number | null {
  if (arr.length === 0) {
    return null;
  }

  return arr.reduce((min, current) => {
    return current < min ? current : min;
  });
}

export function nanmin(arr: DirtyNumberArray, returnIndex: true): { value: number, index: number } | null;
export function nanmin(arr: DirtyNumberArray, returnIndex?: false): number | null;
export function nanmin(arr: DirtyNumberArray, returnIndex = false): { value: number, index: number } | number | null {
  const { validArr } = _getValidData(arr);
  if (validArr.length === 0) return null;
  if (!returnIndex) {
    return arrayMin(validArr);
  } else {
    const r = validArr.reduce((min, val, idx) => val < min.value ? { value: val, index: idx } : min, { value: validArr[0], index: 0 });
    return r;
  }
}

export function nanmax(arr: DirtyNumberArray, returnIndex: true): { value: number, index: number } | null;
export function nanmax(arr: DirtyNumberArray, returnIndex?: false): number | null;
export function nanmax(arr: DirtyNumberArray, returnIndex = false): { value: number, index: number } | number | null {
  const { validArr } = _getValidData(arr);
  if (validArr.length === 0) return null;
  if (!returnIndex) {
    return arrayMax(validArr);
  } else {
    const r = validArr.reduce((max, val, idx) => val > max.value ? { value: val, index: idx } : max, { value: validArr[0], index: 0 });
    return r;
  }
}



// Combining errors in quadrature
export function sumOfSquares(arr: number[]): number {
  return arr.reduce((acc, val) => acc + val * val, 0);
}

export function nanSumOfSquares(arr: DirtyNumberArray): number {
  const { validArr } = _getValidData(arr);
  return sumOfSquares(validArr);
}

export function meanOfSquares(arr: DirtyNumberArray): number | null {
  const { validArr, length } = _getValidData(arr);
  if (length === 0) return null;
  return sumOfSquares(validArr) / length;
}
export function nanMeanOfSquares(arr: DirtyNumberArray): number | null {
  const { validArr, length } = _getValidData(arr);
  if (length === 0) return null;
  return sumOfSquares(validArr) / length;
}

export function rootMeanSquare(arr: DirtyNumberArray): number | null{
  const ms = meanOfSquares(arr);
  if (ms === null) return null;
  return Math.sqrt(ms);
}

export function nanRootMeanSquare(arr: DirtyNumberArray): number | null {
  const ms = nanMeanOfSquares(arr);
  if (ms === null) return null;
  return Math.sqrt(ms);
}

export function weightedMean(values: DirtyNumberArray, errors: DirtyNumberArray): {mean: number | null, error: number | null} {
  if (values.length === 0 || values.length !== errors.length) {
    return {mean: null, error: null};
  }
  let weightedSum = 0;
  let weightTotal = 0;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    const e = errors[i];
    if (isBad(v) || isBad(e) || e === 0) {
      continue; // skip bad values or zero error
    }
    const weight = 1 / (e * e);
    weightedSum += v * weight;
    weightTotal += weight;
  }
  if (weightTotal === 0) return {mean: null, error: null};
  return {mean: weightedSum / weightTotal, error: Math.sqrt(1 / weightTotal)};
} 

export function clip(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function allEqual<T>(arr: T[]): boolean {
  if (arr.length === 0) return true;
  const first = arr[0];
  return arr.every(v => v === first);
}

export function arraysEqual<T>(arr1: T[] | undefined, arr2: T[] | undefined): boolean {
  /* if either or both are undefined, then not equal */
  // if (arr1 === undefined && arr2 === undefined) return true; /* ignore: both undefined is equal */
  if (arr1 === undefined || arr2 === undefined) return false;
  if (arr1.length !== arr2.length) return false; /* check lengths first */
  /* single pass element comparison */
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }
  return true;
}


export function cycleIndex<T>(index: number, arr: T[] | undefined | null): number {
  return (arr && index < arr.length) ? index : (index % (arr?.length || 1));
}  

export function cycle<T>(index: number, arr: T[] | undefined | null): T | null {
  if (!arr || arr.length === 0) return null;
  return arr[cycleIndex(index, arr)];
}