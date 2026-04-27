import { describe, it, expect } from 'vitest';

import { none } from '../../src/maybe.js';
import { Generators } from '../../src/index.js';

describe('object generators', () => {

  describe('object', () => {

    class City {
      constructor(
        readonly name: string,
        readonly population: number,
        readonly area: number) {}
    }

    const name = 'name1';
    const nameGenerator = Generators.pure(name);
    const population = 123;
    const populationGenerator = Generators.pure(population);
    const area = 10;
    const areaGenerator = Generators.pure(area);
    const never = Generators.never;

    it('should generate value if all the used generators generate values', () => {
      const expected = new City(name, population, area);
      expect(Generators.object(City, nameGenerator, populationGenerator, areaGenerator).generate().get()).toEqual(expected);
    });

    it('should generate none when one of the used generated generators generates none', () => {
      expect(Generators.object(City, nameGenerator, never<number>(), areaGenerator).generate()).toEqual(none);
    });

    it('should generate none when all of the used generated generators generate none', () => {
      expect(Generators.object(City, never<string>(), never<number>(), never<number>()).generate()).toEqual(none);
    });
  });

  describe('record', () => {

    it('yields plain objects with both fields populated', () => {
      const g = Generators.record({
        a: Generators.integer({ min: 0, max: 9 }),
        b: Generators.boolean,
      });

      for (let i = 0; i < 50; i++) {
        const value = g.sample({ seed: `r-${i}` });
        expect(typeof value.a).toBe('number');
        expect(Number.isInteger(value.a)).toBe(true);
        expect(value.a).toBeGreaterThanOrEqual(0);
        expect(value.a).toBeLessThanOrEqual(9);
        expect(typeof value.b).toBe('boolean');
        expect(Object.keys(value).sort()).toEqual(['a', 'b']);
      }
    });

    it('produces plain objects (not class instances)', () => {
      const g = Generators.record({ x: Generators.pure(1) });
      const value = g.sample();
      expect(Object.getPrototypeOf(value)).toBe(Object.prototype);
    });

    it('returns none when any inner generator yields none', () => {
      const g = Generators.record({
        a: Generators.pure(1),
        b: Generators.never<number>(),
      });
      expect(g.generate()).toEqual(none);
    });

    it('is deterministic given a seed', () => {
      const g = Generators.record({
        a: Generators.integer(),
        b: Generators.integer(),
      });
      expect(g.sample({ seed: 's' })).toEqual(g.sample({ seed: 's' }));
    });
  });
});
