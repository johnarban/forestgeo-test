// list of stop words to not upper case
const STOP_WORDS = [
  'A', 'An', 'The', 
  'And', 'But', 'Or', 'Nor', 
  'For', 'So', 'Yet', 
  'At', 'By', 'In', 'Of', 'On', 'To', 'Up',
];

export function camelToSentance(s: string): string {
  if (s.length == 0) return s;
  let out = s[0].toUpperCase();
  for (const c of s.slice(1)) {
    out += (!isNaN(+c) || c == c.toLowerCase()) ? c : ` ${c}`;
  }
  // un-capitalize stop words
  out = out.replace(/\b\w+\b/g, (word) => {
    if (STOP_WORDS.includes(word)) {
      return word.toLowerCase();
    }
    return word;
  });
  return out;
}

// https://stackoverflow.com/a/4149612/11594175
export function camelToSnake(s: string, delimeter = '_'): string {
  return s.replace(/([a-z])([A-Z])/g, `$1${delimeter}$2`).toLowerCase();
}