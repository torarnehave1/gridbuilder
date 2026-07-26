/**
 * Utility functions for UUID validation and generation.
 * Enforces strict policy that Graph IDs and Node IDs must be valid UUIDs.
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUUID(id: string | undefined | null): boolean {
  if (!id) return false;
  return UUID_REGEX.test(id.trim());
}

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback RFC4122 v4 UUID generator
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c: any) =>
    (
      c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(16)
  ).toLowerCase();
}

export function ensureUUID(id: string | undefined | null): string {
  if (id && isValidUUID(id)) {
    return id.trim();
  }
  return generateUUID();
}
