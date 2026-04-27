import { describe, it, expect } from 'vitest';

import { fromSeed, defaultRandom, type Random } from '../src/random/index.js';

const ITERATIONS = 1000;
const INT_SAMPLES = 10_000;

function take(rng: Random, n: number): number[] {
  const out = new Array<number>(n);
  for (let i = 0; i < n; i++) out[i] = rng.next();
  return out;
}

function takeInt(rng: Random, n: number, min: number, max: number): number[] {
  const out = new Array<number>(n);
  for (let i = 0; i < n; i++) out[i] = rng.nextInt(min, max);
  return out;
}

describe('Random', () => {

  describe('fromSeed', () => {

    it('produces a deterministic sequence of next() values for the same numeric seed', () => {
      const a = fromSeed(42);
      const b = fromSeed(42);

      const seqA = take(a, ITERATIONS);
      const seqB = take(b, ITERATIONS);

      expect(seqA).toEqual(seqB);
    });

    it('exposes the original seed', () => {
      expect(fromSeed(42).seed).toBe(42);
      expect(fromSeed(0).seed).toBe(0);
    });

    it('returns next() values strictly in [0, 1)', () => {
      const rng = fromSeed(123);
      for (const v of take(rng, ITERATIONS)) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThan(1);
      }
    });

    it('produces different streams for different seeds', () => {
      const a = take(fromSeed(1), 50);
      const b = take(fromSeed(2), 50);
      expect(a).not.toEqual(b);
    });

    it('rejects non-finite numeric seeds', () => {
      expect(() => fromSeed(Number.NaN)).toThrow(RangeError);
      expect(() => fromSeed(Number.POSITIVE_INFINITY)).toThrow(RangeError);
    });
  });

  describe('fromSeed with string seed', () => {

    it('maps equal strings to the same deterministic stream', () => {
      const a = take(fromSeed('hello'), ITERATIONS);
      const b = take(fromSeed('hello'), ITERATIONS);
      expect(a).toEqual(b);
    });

    it('produces different streams for different string seeds', () => {
      const a = take(fromSeed('hello'), 50);
      const b = take(fromSeed('world'), 50);
      expect(a).not.toEqual(b);
    });

    it('exposes a numeric seed derived from the string', () => {
      const rng = fromSeed('hello');
      expect(typeof rng.seed).toBe('number');
      expect(Number.isFinite(rng.seed)).toBe(true);
    });
  });

  describe('nextInt', () => {

    it('is inclusive on both bounds and never out of range', () => {
      const rng = fromSeed(7);
      const min = -3;
      const max = 5;
      const samples = takeInt(rng, INT_SAMPLES, min, max);
      for (const v of samples) {
        expect(Number.isInteger(v)).toBe(true);
        expect(v).toBeGreaterThanOrEqual(min);
        expect(v).toBeLessThanOrEqual(max);
      }
      // Both endpoints should be observed across 10k samples for a 9-value range.
      expect(samples).toContain(min);
      expect(samples).toContain(max);
    });

    it('is deterministic for a given seed', () => {
      const a = takeInt(fromSeed('abc'), 500, 0, 99);
      const b = takeInt(fromSeed('abc'), 500, 0, 99);
      expect(a).toEqual(b);
    });

    it('returns the only value when min === max', () => {
      const rng = fromSeed(1);
      for (let i = 0; i < 10; i++) {
        expect(rng.nextInt(7, 7)).toBe(7);
      }
    });

    it('rejects min > max', () => {
      const rng = fromSeed(1);
      expect(() => rng.nextInt(5, 4)).toThrow(RangeError);
    });

    it('rejects non-finite bounds', () => {
      const rng = fromSeed(1);
      expect(() => rng.nextInt(Number.NaN, 1)).toThrow(RangeError);
      expect(() => rng.nextInt(0, Number.POSITIVE_INFINITY)).toThrow(RangeError);
    });
  });

  describe('defaultRandom', () => {

    it('returns next() values in [0, 1)', () => {
      const rng = defaultRandom();
      for (const v of take(rng, ITERATIONS)) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThan(1);
      }
    });

    it('reports NaN as its seed', () => {
      expect(Number.isNaN(defaultRandom().seed)).toBe(true);
    });

    it('fork() returns itself', () => {
      const rng = defaultRandom();
      expect(rng.fork()).toBe(rng);
    });

    it('nextInt honours bounds', () => {
      const rng = defaultRandom();
      const samples = takeInt(rng, INT_SAMPLES, 0, 9);
      for (const v of samples) {
        expect(Number.isInteger(v)).toBe(true);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(9);
      }
    });
  });

  describe('fork', () => {

    it('returns an independent stream that is itself deterministic given the parent seed', () => {
      const parentA = fromSeed(99);
      const childA = parentA.fork();
      const parentB = fromSeed(99);
      const childB = parentB.fork();

      const seqChildA = take(childA, 200);
      const seqChildB = take(childB, 200);
      expect(seqChildA).toEqual(seqChildB);
    });

    it('produces a child whose stream differs from the parent', () => {
      const parent = fromSeed(99);
      const child = parent.fork();

      const seqParent = take(parent, 200);
      const seqChild = take(child, 200);

      expect(seqParent).not.toEqual(seqChild);
    });

    it('two siblings forked from the same parent diverge', () => {
      const parent = fromSeed(99);
      const first = parent.fork();
      const second = parent.fork();

      const seqFirst = take(first, 200);
      const seqSecond = take(second, 200);

      expect(seqFirst).not.toEqual(seqSecond);
    });
  });
});
