
import {
  nan2null,
  nanmin,
  nanmax,
} from "@/utils/array_operations/array_math";

import {
  mean,
  standardError,
  stdev,
  sum,
  median,
  mad,
  rootMeanSquare,
} from "@/utils/array_operations/array_math";



/**
 * Aggregate numerical data and calculates an associated error
 *
 * @param y - An array of numerical values (or nulls) to aggregate.
 * @param e - An optional array of numerical error values (or nulls) corresponding to `y`.
 * @param aggFunc - mean, median, min, max, sum
 * @param errorFunc - The error calculation function to use. Options are:
 *   - `'standardError'`: Calculates the standard error of the values.
 *   - `'stdev'`: Calculates the standard deviation of the values.
 *   - `'mad'`: Calculates the median absolute deviation, scaled to approximate standard deviation.
 * @returns An object containing:
 *   - `value`: The aggregated value, or `null` if the input data is empty or invalid.
 *   - `error`: The calculated error value, or `null` if the input data is empty or invalid.
 *
 * The function handles null values in the input arrays by filtering them out before performing calculations.
 * Notes on Errors
 * 
 * For`'sum'`, the error is calculated as the square root of the sum of squared data errors.
 * 
 * For `'median'` with `'standardError'`, the error is scaled to approximate the standard error of the median
 * assuming a normal distribution.
 * 
 * In general, the final error is quadrature sum of the aggregation error and the RMS of the input errors.
 */
export function aggregateData(
  y: (number | null)[],
  e: (number | null)[] | undefined,
  aggFunc: 'mean' | 'median' | 'min' | 'max' | 'sum',
  errorFunc: 'standardError' | 'stdev' | 'mad',
): { value: number | null; error: number | null } {
  
  // console log an error if we will be ignoring the errorFunc choice
  // if ((aggFunc === 'min' || aggFunc === 'max' || aggFunc === 'sum') ) {
  //   console.warn(`Warning: Choice of error function will be ignored when using aggFunc of ${aggFunc}`);
  // }
  
  let aggY: number | null = null;
  let aggE: number | null = null;
  
  const cleanY = y.filter(v => v !== null) as number[];
  const cleanE = e ? e.filter(v => v !== null) as number[] : [];
  
  if (cleanY.length === 0) {
    return { value: null, error: null };
  }
  
  
  // Special case for sum since error is different
  if (aggFunc === 'sum') {
    aggY = sum(cleanY);
    aggE = stdev(cleanY);
    const calE = rootMeanSquare(cleanE);
    return { value: aggY, error: nan2null(Math.sqrt((aggE ?? 0) ** 2 + (calE ?? 0) ** 2)) };
  }
  
  // Special case for rms since error is different
  if (aggFunc === 'max') {
    const r = nanmax(cleanY, true);
    aggY = r ? r.value : null;
    aggE = r ? cleanE[r.index] : null;
    return { value: aggY, error: aggE };
  }
  
  
  // Special case for rms since error is different
  if (aggFunc === 'min') {
    const r = nanmin(cleanY, true);
    aggY = r ? r.value : null;
    aggE = r ? cleanE[r.index] : null;
    return { value: aggY, error: aggE };
  }
  
  // We will be using RMS error in quadrature with aggregation error
  const calE = rootMeanSquare(cleanE);
  
  if (aggFunc === 'mean') {
    aggY = mean(cleanY);
  }
  
  if (aggFunc === 'median') {
    aggY = median(cleanY);
  }
  
  if (errorFunc === 'standardError') {
    aggE = standardError(cleanY);
    
  } else if (errorFunc === 'stdev') {
    aggE = stdev(cleanY);
    
  } else if (errorFunc === 'mad') {
    aggE = mad(cleanY); // scale factor for normal distribution
    aggE = aggE !== null ? aggE * 1.4826 : null; // convert to stddev equivalent
  }
  
  // sqrt(pi/2) = 1.2533141...
  // https://stats.stackexchange.com/a/61759
  // https://en.wikipedia.org/wiki/Median#Sampling_distribution
  if (aggE !== null && aggFunc === 'median' && errorFunc === 'standardError') {
    aggE = aggE * 1.25331; // convert to standard error on median (assuming normal)
  }
  
  const finalError = nan2null(Math.sqrt((aggE ?? 0) ** 2 + (calE ?? 0) ** 2));
  
  return { value: aggY, error: finalError };
}



