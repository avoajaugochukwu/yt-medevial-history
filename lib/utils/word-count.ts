export function countWords(text: string): number {
  // Remove extra whitespace and split by spaces
  const words = text
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter(word => word.length > 0);

  return words.length;
}