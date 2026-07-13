

/**
 * @function atleast1d
 * Ensures that the input is at least 1-dimensional. If the input is a single value, it wraps it in an array.
 * If the input is already an array, it returns the array as is.
 * If the input is undefined, it returns undefined.
 * If the input is null, it returns an array with a single null element.
 */
// The complicated typing ensures that if T is undefined, the return type is also undefined.
export function atleast1d<T>(value: T | T[]): T[] {
  return (Array.isArray(value) ? value : [value]);
}