import { describe, it, expect } from 'vitest';

import { Generators } from '../../src/index.js';
import { fromSeed } from '../../src/random/index.js';

describe('collection generators', () => {
  describe('setOf', () => {
    it('honours minSize and maxSize bounds', () => {
      const g = Generators.setOf(Generators.integer({ min: 0, max: 1000 }), {
        minSize: 2,
        maxSize: 5,
      });
      for (let i = 0; i < 100; i++) {
        const set = g.generate(fromSeed(i)).get();
        expect(set).toBeInstanceOf(Set);
        expect(set.size).toBeGreaterThanOrEqual(2);
        expect(set.size).toBeLessThanOrEqual(5);
      }
    });

    it('contains only values produced by the inner generator', () => {
      const allowed = new Set([10, 20, 30]);
      const g = Generators.setOf(Generators.oneOfValues(...allowed), {
        minSize: 1,
        maxSize: 3,
      });
      const set = g.generate(fromSeed('seed')).get();
      for (const v of set) expect(allowed.has(v)).toBe(true);
    });

    it('is deterministic for the same seed', () => {
      const g = Generators.setOf(Generators.integer({ min: 0, max: 999 }), {
        minSize: 3,
        maxSize: 5,
      });
      const a = [...g.generate(fromSeed(42)).get()];
      const b = [...g.generate(fromSeed(42)).get()];
      expect(a).toEqual(b);
    });

    it('yields none when min > max', () => {
      const g = Generators.setOf(Generators.pure(1), { minSize: 5, maxSize: 1 });
      expect(g.generate(fromSeed(1)).isDefined).toBe(false);
    });

    it('yields none when minSize cannot be satisfied due to dedup', () => {
      const g = Generators.setOf(Generators.pure(1), { minSize: 2, maxSize: 3 });
      expect(g.generate(fromSeed(1)).isDefined).toBe(false);
    });
  });

  describe('mapOf', () => {
    it('returns a Map with sized entries', () => {
      const g = Generators.mapOf(
        Generators.integer({ min: 0, max: 10000 }),
        Generators.integer({ min: 0, max: 10 }),
        { minSize: 2, maxSize: 4 }
      );
      for (let i = 0; i < 50; i++) {
        const m = g.generate(fromSeed(i)).get();
        expect(m).toBeInstanceOf(Map);
        expect(m.size).toBeGreaterThanOrEqual(2);
        expect(m.size).toBeLessThanOrEqual(4);
      }
    });

    it('is deterministic for the same seed', () => {
      const g = Generators.mapOf(
        Generators.integer({ min: 0, max: 1000 }),
        Generators.integer({ min: 0, max: 9 }),
        { minSize: 2, maxSize: 3 }
      );
      const a = [...g.generate(fromSeed('k')).get().entries()];
      const b = [...g.generate(fromSeed('k')).get().entries()];
      expect(a).toEqual(b);
    });

    it('yields none when key dedup cannot satisfy minSize', () => {
      const g = Generators.mapOf(Generators.pure('k'), Generators.pure(1), {
        minSize: 2,
        maxSize: 3,
      });
      expect(g.generate(fromSeed(1)).isDefined).toBe(false);
    });
  });

  describe('containerOf', () => {
    it('builds containers via the supplied factory', () => {
      const g = Generators.containerOf(
        (xs: number[]) => xs.reduce((a, b) => a + b, 0),
        Generators.integer({ min: 1, max: 1 }),
        { minSize: 3, maxSize: 3 }
      );
      expect(g.generate(fromSeed(0)).get()).toBe(3);
    });

    it('respects size bounds', () => {
      const g = Generators.containerOf(
        (xs: number[]) => xs,
        Generators.integer({ min: 0, max: 100 }),
        { minSize: 1, maxSize: 4 }
      );
      for (let i = 0; i < 50; i++) {
        const arr = g.generate(fromSeed(i)).get();
        expect(arr.length).toBeGreaterThanOrEqual(1);
        expect(arr.length).toBeLessThanOrEqual(4);
      }
    });

    it('yields none when bounds are negative', () => {
      const g = Generators.containerOf(
        (xs: number[]) => xs,
        Generators.pure(1),
        { minSize: -1, maxSize: -1 }
      );
      expect(g.generate(fromSeed(1)).isDefined).toBe(false);
    });
  });
});
