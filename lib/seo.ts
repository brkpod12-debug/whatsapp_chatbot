/**
 * Pure SEO string helpers. No Sanity, no Next: importable from anywhere,
 * including tests.
 */

/**
 * Google truncates around 155-160 characters. Cut on a word boundary rather
 * than letting the SERP do it mid-word.
 */
export function clampDescription(text: string, max = 158): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:.\s]+$/, "") + "…";
}

/**
 * "Nizampet, Hyderabad" -> "Nizampet". Sanity stores the city inside the
 * location string, so templates that add it back would otherwise read
 * "Nizampet, Hyderabad, Hyderabad".
 */
export function locality(location: string, city: string): string {
  const trimmed = location.trim();
  const suffix = `, ${city}`;
  return trimmed.toLowerCase().endsWith(suffix.toLowerCase())
    ? trimmed.slice(0, -suffix.length).trim()
    : trimmed;
}
