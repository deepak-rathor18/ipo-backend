import { PAISE_MULTIPLIER } from '../constants';

/**
 * All monetary amounts are stored in the database as integer paise
 * (rupees * 100) to avoid floating point rounding errors. These helpers
 * convert between the rupee values used in API payloads and the paise
 * values used internally for storage and arithmetic.
 */

export function rupeesToPaise(rupees: number): number {
  if (!Number.isFinite(rupees)) {
    throw new Error('Invalid rupee amount');
  }
  return Math.round(rupees * PAISE_MULTIPLIER);
}

export function paiseToRupees(paise: number): number {
  if (!Number.isFinite(paise)) {
    throw new Error('Invalid paise amount');
  }
  return Math.round(paise) / PAISE_MULTIPLIER;
}

export function addPaise(...values: number[]): number {
  return values.reduce((sum, v) => sum + Math.round(v), 0);
}

export function subtractPaise(a: number, b: number): number {
  return Math.round(a) - Math.round(b);
}

export function multiplyPaise(paise: number, factor: number): number {
  return Math.round(Math.round(paise) * factor);
}

export function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

export function percentage(part: number, whole: number): number {
  if (whole === 0) return 0;
  return roundToTwo((part / whole) * 100);
}
