// super-simple, fast sanitizer: strips tags & collapses control chars
export function stripHTML(input: string | null | undefined) {
  if (!input) return input ?? '';
  return String(input)
    .replace(/<[^>]*>/g, '')       // strip tags
    .replace(/[\u0000-\u001F]/g, '') // control chars
    .trim();
}
