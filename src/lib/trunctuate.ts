export function truncateText(text: string, length?: number) {
  const maxLength = length || 10;
  if (text.length <= maxLength) {
    return text;
  }
  return text?.substring(0, maxLength) + "...";
}
