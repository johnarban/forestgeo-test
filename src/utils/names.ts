export function capitalizeWords(text: string): string {
  return text.replace(/\b(\w)/g, function(match) {
    return match.toUpperCase();
  });
}
