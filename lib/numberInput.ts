/**
 * Format a raw string as a comma-separated number while the user types.
 * Supports optional decimal places (e.g. "1,250,000.50").
 *
 * @param value      Raw input string (may already contain commas)
 * @param allowDecimal  Whether to allow a decimal point (default true)
 */
export function formatNumberInput(value: string, allowDecimal = true): string {
  // Strip everything except digits and (optionally) a decimal point
  let cleaned = value.replace(/[^\d.]/g, '');

  if (!allowDecimal) {
    cleaned = cleaned.replace(/\./g, '');
    return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  // Allow only one decimal point
  const dotIndex = cleaned.indexOf('.');
  if (dotIndex !== -1) {
    const intPart = cleaned.slice(0, dotIndex).replace(/\./g, '');
    const decPart = cleaned.slice(dotIndex + 1).replace(/\./g, '');
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `${formattedInt}.${decPart}`;
  }

  return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Convert a comma-formatted display string back to a plain number.
 * Returns NaN if the string is empty or invalid.
 */
export function parseFormattedNumber(value: string): number {
  return Number(value.replace(/,/g, ''));
}

/**
 * Convert a plain number into a comma-formatted display string.
 * Used when pre-filling inputs programmatically.
 *
 * @param value        The number to format
 * @param decimals     Number of decimal places to include (default 2)
 */
export function numberToDisplay(value: number, decimals = 2): string {
  if (!isFinite(value) || isNaN(value)) return '';
  return formatNumberInput(value.toFixed(decimals));
}
