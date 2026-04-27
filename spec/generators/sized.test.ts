import { describe, it, expect } from 'vitest';

import { Generators } from '../../src/index.js';
import { DEFAULT_SIZE, defaultRandom, fromSeed, withSize } from '../../src/random/index.js';

describe('sized generators', () => {

  describe('Random.size', () => {

    it('exposes DEFAULT_SIZE on a fresh defaultRandom()', () => {
      expect(defaultRandom().size).toBe(DEFAULT_SIZE);
    });

    it('exposes DEFAULT_SIZE on a fresh seeded Random', () => {
      expect(fromSeed(1).size).toBe(DEFAULT_SIZE);
    });

    it('preserves size across fork()', () => {
      const parent = fromSeed(1);
      const sized = withSize(parent, 7);
      expect(sized.fork().size).toBe(7);
    });

    it('rejects non-integer or negative sizes', () => {
      const rng = fromSeed(1);
      expect(() => withSize(rng, -1)).toThrow(RangeError);
      expect(() => withSize(rng, 1.5)).toThrow(RangeError);
      expect(() => withSize(rng, Number.NaN)).toThrow(RangeError);
    });
  });

  describe('sized', () => {

    it('receives the current size hint', () => {
      const captured: number[] = [];
      const g = Generators.sized(s => {
        captured.push(s);
        return Generators.pure(s);
      });

      expect(g.sample({ seed: 'a' })).toBe(DEFAULT_SIZE);
      expect(captured).toContain(DEFAULT_SIZE);
    });

    it('reflects the active size when wrapped by resize', () => {
      const g = Generators.resize(
        7,
        Generators.sized(s => Generators.pure(s)),
      );
      expect(g.sample({ seed: 'a' })).toBe(7);
    });
  });

  describe('resize', () => {

    it('runs sized(arrayOfLength) at the requested length', () => {
      const inner = Generators.sized(s =>
        Generators.arrayOfLength(Generators.integer({ min: 0, max: 9 }), s),
      );
      const five = Generators.resize(5, inner);

      const sample = five.sample({ seed: 1 });
      expect(sample).toHaveLength(5);
      for (const v of sample) {
        expect(Number.isInteger(v)).toBe(true);
      }
    });

    it('does not affect generators that ignore size', () => {
      const g = Generators.resize(3, Generators.pure(42));
      expect(g.sample({ seed: 1 })).toBe(42);
    });

    it('preserves determinism: identical seeds produce identical sequences', () => {
      const g = Generators.resize(
        4,
        Generators.sized(s => Generators.arrayOfLength(Generators.integer(), s)),
      );
      const a = g.sample({ seed: 'k' });
      const b = g.sample({ seed: 'k' });
      expect(a).toEqual(b);
    });
  });
});
