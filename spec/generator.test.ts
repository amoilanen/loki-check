import { describe, it, expect } from 'vitest';

import * as Generators from '../src/generators/index.js';
import { Generator, GenError } from '../src/generator.js';
import { fromSeed } from '../src/random/index.js';

describe('Generator', () => {

  describe('map', () => {

    it('should produce new Generator', () => {
      const value = 5;
      const g = Generators.choose(value, value);

      expect(g.map((x: number) => x * x).generate().get()).toEqual(value * value);
    });
  });

  describe('flatMap', () => {

    it('should produce new Generator', () => {
      const value = 'x';
      const g = Generator.pure(value);

      expect(g.flatMap((x: string) => Generator.pure(x + x)).generate().get()).toEqual(value + value);
    });
  });

  describe('Monadic laws for Generator', () => {

    const valuesNumber = 10;
    const valueGenerator = Generators.choose(1, valuesNumber * valuesNumber);
    const values = [...Array(valuesNumber).keys()]
      .map(_ => valueGenerator.generate()).filter(x => x.isDefined).map(x => x.get());

    // flatMap(f)(pure) == f
    it('should satisfy the left identity law', () => {
      values.forEach(value => {
        const f = (x: number) => Generator.pure(2 * x);
        expect(Generator.pure(value).flatMap(f).generate()).toEqual(f(value).generate());
      });
    });

    // m.flatMap(pure) == m
    it('should satisfy the right identity law', () => {
      values.forEach(value => {
        const m = Generator.pure(value);
        expect(m.flatMap(Generator.pure).generate()).toEqual(m.generate());
      });
    });

    // m.flatMap(f).flatMap(g) == m.flatMap(flatMap(g)(f))
    it('should satisfy the associativity law', () => {
      values.forEach(value => {
        const f = (x: number) => Generator.pure(2 * x);
        const g = (x: number) => Generator.pure(x * x);
        const m = Generator.pure(value);

        const leftSide = m.flatMap(f).flatMap(g);
        const rightSide = m.flatMap((x: number) => f(x).flatMap(g));

        expect(leftSide.generate()).toEqual(rightSide.generate());
      });
    });
  });

  describe('sample', () => {

    it('is deterministic for the same numeric seed across two runs', () => {
      const g = Generators.choose(0, 1000);
      const a = g.sample({ seed: 42 });
      const b = g.sample({ seed: 42 });
      expect(a).toEqual(b);
    });

    it('is deterministic for the same string seed across two runs', () => {
      const g = Generators.oneOfValues(1, 2, 3, 4, 5);
      const a = g.sample({ seed: 'hello' });
      const b = g.sample({ seed: 'hello' });
      expect(a).toEqual(b);
    });

    it('uses an explicit rng when provided', () => {
      const g = Generators.choose(0, 1);
      const rngA = fromSeed(7);
      const rngB = fromSeed(7);
      expect(g.sample({ rng: rngA })).toEqual(g.sample({ rng: rngB }));
    });

    it('throws GenError when the generator yields none', () => {
      const g = Generators.never<number>();
      expect(() => g.sample()).toThrow(GenError);
    });
  });

  describe('sampleN', () => {

    it('returns n values, deterministic for the same string seed', () => {
      const g = Generators.choose(0, 1);
      const a = g.sampleN(100, { seed: 'abc' });
      const b = g.sampleN(100, { seed: 'abc' });
      expect(a.length).toBe(100);
      expect(a).toEqual(b);
    });

    it('returns an empty array when n is 0', () => {
      const g = Generators.choose(0, 1);
      expect(g.sampleN(0, { seed: 1 })).toEqual([]);
    });

    it('throws GenError on negative n', () => {
      const g = Generators.choose(0, 1);
      expect(() => g.sampleN(-1)).toThrow(GenError);
    });

    it('throws GenError when the generator yields none', () => {
      const g = Generators.never<number>();
      expect(() => g.sampleN(3)).toThrow(GenError);
    });
  });

  describe('filter', () => {

    it('only yields values satisfying the predicate', () => {
      const g = Generators.choose(0, 100).filter((x: number) => x > 50);
      const samples = g.sampleN(50, { seed: 'filter-pass' });
      for (const v of samples) {
        expect(v).toBeGreaterThan(50);
      }
    });

    it('yields none after exhausting retries', () => {
      const g = Generators.choose(0, 1).filter(() => false, { retries: 5 });
      expect(g.generate(fromSeed(1)).isDefined).toBe(false);
    });

    it('propagates none from the source generator', () => {
      const g = Generators.never<number>().filter(() => true);
      expect(g.generate().isDefined).toBe(false);
    });
  });

  describe('withShrinker', () => {

    it('attaches a shrinker without changing generation behaviour', () => {
      const g = Generators.choose(0, 100);
      const shrunk = g.withShrinker((x: number) => (x === 0 ? [] : [Math.floor(x / 2)]));
      const a = g.sample({ seed: 'shrink' });
      const b = shrunk.sample({ seed: 'shrink' });
      expect(a).toEqual(b);
      expect(shrunk.shrinker).toBeDefined();
    });
  });
});
