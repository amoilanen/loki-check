import type { Generator } from '../generator.js';

/**
 * Returns the integers `[0, 1, ..., n-1]`. Negative or non-finite `n` yields `[]`.
 */
export function range(n: number): number[] {
  const safeN = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  const out = new Array<number>(safeN);
  for (let i = 0; i < safeN; i++) {
    out[i] = i;
  }
  return out;
}

/**
 * Returns an array containing `g` repeated `n` times. Negative or non-finite `n` yields `[]`.
 */
export function repeatGenerator<T>(n: number, g: Generator<T>): Generator<T>[] {
  const safeN = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  const out = new Array<Generator<T>>(safeN);
  for (let i = 0; i < safeN; i++) {
    out[i] = g;
  }
  return out;
}
