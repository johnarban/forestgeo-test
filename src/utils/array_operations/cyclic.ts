function diff(arr: number[]): number[] {
  const result: number[] = [];
  for (let i = 1; i < arr.length; i++) {
    result.push(arr[i] - arr[i - 1]);
  }
  return result;
}


// function ringAccessor<T>(arr: T[], n: number): T {
//   return arr[n % arr.length];
// }

function isLinearConsecutive(arr: number[], validDiffs = [1]): boolean {
  return diff(arr).every(d => validDiffs.includes(d));
}

function getIndices<T>(arr: T[], order: T[]): number[] {
  return arr.map(a => order.indexOf(a));
}


/**
 * Check if the elements in arr are consecutive in a ring defined by order
 * @param arr Array of elements to check
 * @param order The order that defines the ring
 * @returns Object with properties:
 *  - consecutive: boolean indicating if arr is consecutive in the ring
 *  - start: the starting element of the consecutive sequence
 *  - end: the ending element of the consecutive sequence
 * 
 * This is an ineffienct implementation. A better way would be 
 * Example using days of the week:
 * arr = ['Friday', 'Saturday', 'Sunday', 'Monday'], 
 * order = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
 * Here, arr is consecutive
 */
export function isRingConsecutive<T>(arr: T[], order: T[], sorted=false): {consecutive: boolean, start: T, end: T} {
  // console.log('Checking ring consecutiveness for arr:', arr, 'with order:', order);
  const newArr = arr.slice();
  if (!sorted) newArr.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  // console.log('Sorted arr for ring check:', newArr);
  const indices = getIndices(newArr, order);
  const isL = isLinearConsecutive(indices);
  if (isL) {
    return {
      consecutive: isL,
      start: newArr[0],
      end: newArr[newArr.length-1],
    };
  }
  // on the ring branch
  const n = order.length;
  const rolledOrder = order.slice();
  // this is bad because it is O(n^2) 
  for (let i = 0; i < n; i++ ) {
    rolledOrder.push(rolledOrder.shift()!);
    newArr.push(newArr.shift()!);
    const ind = getIndices(newArr, rolledOrder);
    const isL = isLinearConsecutive(ind); // << our inner loop :)
    if (isL) {
      return {
        consecutive: isL,
        start: newArr[0],
        end: newArr[newArr.length-1]
      };
    }
  }
  return {
    consecutive: false,
    start: arr[0],
    end: arr[arr.length-1],
  };
}
