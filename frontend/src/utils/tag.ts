/**
 * Normalizes a raw tag string into a clean, lowercased, slug-like identifier.
 * - Strips leading '#' characters
 * - Converts spaces and underscores to hyphens
 * - Removes non-alphanumeric characters except hyphens
 * - Collapses consecutive hyphens and trims leading/trailing hyphens
 * - Enforces max length of 30 characters
 */
export function normalizeTag(raw: string): string {
  if (!raw) return "";

  return raw
    .trim()
    .toLowerCase()
    .replace(/^#+/, "")
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
}
