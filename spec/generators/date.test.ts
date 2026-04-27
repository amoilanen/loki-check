import { describe, it, expect } from 'vitest';

import { Generators } from '../../src/index.js';
import { fromSeed } from '../../src/random/index.js';

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;
const HUNDRED_YEARS_MS = 100 * MS_PER_YEAR;

describe('date generators', () => {
  describe('date', () => {
    it('produces Date instances within ±100 years of the epoch', () => {
      for (let i = 0; i < 1000; i++) {
        const d = Generators.date.sample({ seed: i });
        expect(d).toBeInstanceOf(Date);
        const t = d.getTime();
        expect(Number.isFinite(t)).toBe(true);
        expect(t).toBeGreaterThanOrEqual(-HUNDRED_YEARS_MS);
        expect(t).toBeLessThanOrEqual(HUNDRED_YEARS_MS);
      }
    });

    it('is deterministic for the same seed', () => {
      const a = Generators.date.sampleN(100, { seed: 'd' }).map(d => d.getTime());
      const b = Generators.date.sampleN(100, { seed: 'd' }).map(d => d.getTime());
      expect(a).toEqual(b);
    });

    it('carries a default shrinker that approaches the epoch', () => {
      const shrinker = Generators.date.shrinker;
      expect(shrinker).toBeDefined();
      const candidates = [
        ...(shrinker as (v: Date) => Iterable<Date>)(new Date(1_000_000)),
      ];
      expect(candidates.length).toBeGreaterThan(0);
      expect(candidates[0]?.getTime()).toBe(0);
    });
  });

  describe('dateBetween', () => {
    it('produces Date instances inside the requested bounds', () => {
      const from = new Date('2020-01-01T00:00:00Z');
      const to = new Date('2025-12-31T23:59:59Z');
      const g = Generators.dateBetween(from, to);
      for (let i = 0; i < 500; i++) {
        const d = g.sample({ seed: i });
        expect(d).toBeInstanceOf(Date);
        expect(d.getTime()).toBeGreaterThanOrEqual(from.getTime());
        expect(d.getTime()).toBeLessThanOrEqual(to.getTime());
      }
    });

    it('handles a degenerate single-instant range', () => {
      const t = new Date('2024-06-15T12:00:00Z');
      const g = Generators.dateBetween(t, t);
      for (let i = 0; i < 50; i++) {
        const d = g.sample({ seed: i });
        expect(d.getTime()).toBe(t.getTime());
      }
    });

    it('yields none when from > to', () => {
      const g = Generators.dateBetween(new Date('2030-01-01'), new Date('2020-01-01'));
      expect(g.generate(fromSeed(1)).isDefined).toBe(false);
    });
  });

  describe('isoDateString', () => {
    it('produces strings that round-trip through Date.parse', () => {
      for (let i = 0; i < 500; i++) {
        const s = Generators.isoDateString.sample({ seed: i });
        expect(typeof s).toBe('string');
        const parsed = Date.parse(s);
        expect(Number.isFinite(parsed)).toBe(true);
        expect(new Date(parsed).toISOString()).toBe(s);
      }
    });
  });
});
