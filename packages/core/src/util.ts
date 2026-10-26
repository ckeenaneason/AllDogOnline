/**
 * @param value - data to validate
 * @returns Assertion that input value is a Record when true
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * @param value - variable to validate as string
 * @param fallback - optional value to return if input is not a string
 * @returns Assertion that input is a string or the fallback string
 * @default returns ''
 */
export function toString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

/**
 * @param value - variable to validate as a number
 * @param fallback - optional value to return if input is not a number
 * @returns Assertion that input is a number, or the fallback number
 * @default returns 0
 */
export function toNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/**
 * @param value - data to validate as a Record
 * @returns Assertion that input value is a Record, or a null object.
 */
export function toRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}
