import { describe, it, expect, afterEach, vi } from 'vitest';

import { Generator } from '../../src/index.js';
import { none, Maybe } from '../../src/maybe.js';
import { Generators } from '../../src/index.js';

describe('number generators', () => {

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('choose', () => {

    it('should produce empty value for empty range', () => {
      let generator: Generator<number> = Generators.choose(1, 0);

      expect(generator.generate()).toEqual(none);
    });

    it('should produce single point for the range containing one point', () => {
      let generator: Generator<number> = Generators.choose(5, 5);

      expect(generator.generate()).toEqual(Maybe.pure(5));
    });

    it('should produce a random value within a range', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      let generator: Generator<number> = Generators.choose(0, 10);

      expect(generator.generate()).toEqual(Maybe.pure(5));
    });
  });

  describe('integer', () => {
    it('produces integers within the requested range', () => {
      const samples = Generators.integer({ min: -5, max: 5 }).sampleN(1000, { seed: 'int' });
      expect(samples.every(v => Number.isInteger(v))).toBe(true);
      expect(samples.every(v => v >= -5 && v <= 5)).toBe(true);
    });

    it('is deterministic for identical seeds', () => {
      const a = Generators.integer({ min: 0, max: 1000 }).sampleN(200, { seed: 'k' });
      const b = Generators.integer({ min: 0, max: 1000 }).sampleN(200, { seed: 'k' });
      expect(a).toEqual(b);
    });

    it('covers both endpoints across 10k samples', () => {
      const samples = Generators.integer({ min: 0, max: 9 }).sampleN(10_000, { seed: 'span' });
      expect(samples.includes(0)).toBe(true);
      expect(samples.includes(9)).toBe(true);
    });

    it('uses the default 32-bit signed range when no bounds are provided', () => {
      const samples = Generators.integer().sampleN(200, { seed: 'default' });
      const lo = -(2 ** 31);
      const hi = 2 ** 31 - 1;
      expect(samples.every(v => Number.isInteger(v))).toBe(true);
      expect(samples.every(v => v >= lo && v <= hi)).toBe(true);
    });

    it('yields none when max < min', () => {
      expect(Generators.integer({ min: 10, max: 0 }).generate()).toEqual(none);
    });

    it('carries a numeric shrinker', () => {
      const g = Generators.integer({ min: 0, max: 100 });
      expect(g.shrinker).toBeDefined();
    });
  });

  describe('float', () => {
    it('defaults to [0, 1)', () => {
      const samples = Generators.float().sampleN(1000, { seed: 'f' });
      expect(samples.every(v => v >= 0 && v < 1)).toBe(true);
    });

    it('respects custom bounds', () => {
      const samples = Generators.float({ min: -10, max: 10 }).sampleN(1000, { seed: 'fc' });
      expect(samples.every(v => v >= -10 && v < 10)).toBe(true);
    });

    it('is deterministic for identical seeds', () => {
      const a = Generators.float({ min: 0, max: 100 }).sampleN(200, { seed: 'fk' });
      const b = Generators.float({ min: 0, max: 100 }).sampleN(200, { seed: 'fk' });
      expect(a).toEqual(b);
    });

    it('yields none when max < min', () => {
      expect(Generators.float({ min: 1, max: 0 }).generate()).toEqual(none);
    });
  });

  describe('byte', () => {
    it('produces integers in [0, 255]', () => {
      const samples = Generators.byte.sampleN(1000, { seed: 'byte' });
      expect(samples.every(v => Number.isInteger(v) && v >= 0 && v <= 255)).toBe(true);
    });
  });

  describe('posInt', () => {
    it('produces integers >= 1', () => {
      const samples = Generators.posInt.sampleN(1000, { seed: 'pos' });
      expect(samples.every(v => Number.isInteger(v) && v >= 1)).toBe(true);
    });
  });

  describe('negInt', () => {
    it('produces integers <= -1', () => {
      const samples = Generators.negInt.sampleN(1000, { seed: 'neg' });
      expect(samples.every(v => Number.isInteger(v) && v <= -1)).toBe(true);
    });
  });

  describe('smallInt', () => {
    it('produces integers in [-100, 100]', () => {
      const samples = Generators.smallInt.sampleN(1000, { seed: 'small' });
      expect(samples.every(v => Number.isInteger(v) && v >= -100 && v <= 100)).toBe(true);
    });
  });

  describe('nonZeroInt', () => {
    it('never returns 0 across 1000 seeded samples', () => {
      const samples = Generators.nonZeroInt.sampleN(1000, { seed: 'nz' });
      expect(samples.every(v => Number.isInteger(v) && v !== 0)).toBe(true);
    });

    it('is deterministic for identical seeds', () => {
      const a = Generators.nonZeroInt.sampleN(200, { seed: 'nzk' });
      const b = Generators.nonZeroInt.sampleN(200, { seed: 'nzk' });
      expect(a).toEqual(b);
    });
  });

  describe('shrinkNumber', () => {
    it('yields nothing for 0', () => {
      expect([...Generators.shrinkNumber(0)]).toEqual([]);
    });

    it('progresses toward 0 for positive integers', () => {
      const out = [...Generators.shrinkNumber(8)];
      expect(out[0]).toBe(0);
      expect(out).toContain(4);
      expect(out).toContain(2);
      expect(out).toContain(1);
    });

    it('includes the absolute value for negatives', () => {
      const out = [...Generators.shrinkNumber(-8)];
      expect(out).toContain(0);
      expect(out).toContain(8);
    });

    it('terminates for floats', () => {
      const out = [...Generators.shrinkNumber(0.5)];
      expect(out.length).toBeGreaterThan(0);
      expect(out.length).toBeLessThan(1100);
    });
  });
});
