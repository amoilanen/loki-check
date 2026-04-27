import { describe, it, expect } from 'vitest';

import { none } from '../../src/maybe.js';
import { Generators } from '../../src/index.js';

describe('ntuple generators', () => {

  describe('nTuple', () => {

    const empty = Generators.never<number>();
    const g1 = Generators.pure(1);
    const g2 = Generators.pure(2);
    const g3 = Generators.pure(3);

    it('should generate value if all the used generators generate values', () => {
      expect(Generators.nTuple(g1, g2, g3).generate().get()).toEqual([1, 2, 3]);
    });

    it('should generate none when one of the used generated generators generates none', () => {
      expect(Generators.nTuple(g1, empty, g2).generate()).toEqual(none);
    });

    it('should generate none when all of the used generated generators generate none', () => {
      expect(Generators.nTuple(empty, empty, empty).generate()).toEqual(none);
    });
  });

  describe('zip', () => {
    it('is reference-equal to nTuple', () => {
      expect(Generators.zip).toBe(Generators.nTuple);
    });
  });

  describe('lift', () => {
    it('produces sums equal to the lifted tuple', () => {
      const ints = Generators.integer({ min: 0, max: 9 });
      const sumGen = Generators.lift((a: number, b: number) => a + b, ints, ints);
      const tupleGen = Generators.nTuple(ints, ints);

      const samples = 50;
      for (let i = 0; i < samples; i++) {
        const seed = `lift-${i}`;
        const summed = sumGen.sample({ seed });
        const [a, b] = tupleGen.sample({ seed });
        expect(summed).toBe(a + b);
      }
    });

    it('propagates none when an inner generator yields none', () => {
      const lifted = Generators.lift(
        (a: number, b: number) => a + b,
        Generators.pure(1),
        Generators.never<number>(),
      );
      expect(lifted.generate()).toEqual(none);
    });
  });
});
