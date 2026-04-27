import { describe, it, expect, afterEach, vi } from 'vitest';

import { none } from '../../src/maybe.js';
import { Generators } from '../../src/index.js';

describe('array generators', () => {

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('times', () => {

    const value = 'a';

    it('should generate array of the requested length', () => {
      const elementsNumber = 5;
      const generator = Generators.times(elementsNumber, Generators.pure(value));

      const expected = [...new Array(elementsNumber)].map(_ => value);
      expect(generator.generate().get()).toEqual(expected);
    });

    it('should be able to generate array of length 1', () => {
      const triesNumber = 10;
      const generator = Generators.pure(value);
      const timesGenerator = Generators.times(1, generator);
      const arrayGenerator = generator.map((value: string) => [value]);
      [...Array(triesNumber)].forEach(_ => {
        expect(timesGenerator.generate()).toEqual(arrayGenerator.generate());
      });
    });

    it('should always generate an empty Array if timesNumber is 0', () => {
      const generator = Generators.times(0, Generators.never());
      expect(generator.generate().get()).toEqual([]);
    });

    it('should always generate an empty Array if timesNumber is negative', () => {
      const generator = Generators.times(-3, Generators.never());
      expect(generator.generate().get()).toEqual([]);
    });
  });

  describe('arrayOfLength', () => {

    it('should generate array of given length if generator generates values', () => {
      const value = 'abc';
      const length = 5;
      const generator = Generators.arrayOfLength(Generators.pure(value), length);
      const expected = [...Array(length)].map(_ => value);
      expect(generator.generate().get()).toEqual(expected);
    });

    it('should generate none if given generator generates none at least once', () => {
      const value = 3;
      const frequencyGenerator = Generators.frequency([0.1, Generators.pure(value)], [0.9, Generators.never()]);
      const random = vi.spyOn(Math, 'random');
      random.mockReturnValueOnce(0.05);
      random.mockReturnValueOnce(0.06);
      random.mockReturnValueOnce(0.15);
      const generator = Generators.arrayOfLength(frequencyGenerator, 3);
      expect(generator.generate()).toEqual(none);
    });

    it('should generate empty array if length is zero', () => {
      let notNoneZeroTimes = Generators.arrayOfLength(Generators.pure(3), 0);
      let noneZeroTimes = Generators.arrayOfLength(Generators.never(), 0);

      expect(notNoneZeroTimes.generate().get()).toEqual([]);
      expect(noneZeroTimes.generate().get()).toEqual([]);
    });

    it('should generate none if the length is negative', () => {
      let generator = Generators.arrayOfLength(Generators.pure(3), -5);

      expect(generator.generate()).toEqual(none);
    });
  });

  describe('arrayOf', () => {

    const value = 3;
    const maxLength = 10;

    it('should generate the array of at most provided length', () => {
      let valuesCount = 5;
      expect(valuesCount).toBeLessThan(maxLength);

      let generator = Generators.arrayOf(Generators.pure(value), maxLength);

      let smallDelta = 1 / (maxLength * 10);
      vi.spyOn(Math, 'random').mockReturnValue((valuesCount / maxLength) + smallDelta);
      expect(generator.generate().get()).toEqual([...Array(valuesCount)].map( _ => value));
    });

    it('might generate arrays of different lengths on subsequent tries', () => {
      let generator = Generators.arrayOf(Generators.pure(value), maxLength);

      const random = vi.spyOn(Math, 'random');
      random.mockReturnValueOnce(0.11);
      random.mockReturnValueOnce(0.21);
      random.mockReturnValueOnce(0.31);

      expect(generator.generate().get()).toEqual([ value ]);
      expect(generator.generate().get()).toEqual([ value, value ]);
      expect(generator.generate().get()).toEqual([ value, value, value ]);
    });

    it('should generate empty array if length is zero', () => {
      let notNoneZeroTimes = Generators.arrayOf(Generators.pure(3), 0);
      let noneZeroTimes = Generators.arrayOf(Generators.never(), 0);

      expect(notNoneZeroTimes.generate().get()).toEqual([]);
      expect(noneZeroTimes.generate().get()).toEqual([]);
    });

    it('should generate none if the length is negative', () => {
      let generator = Generators.arrayOf(Generators.pure(3), -5);

      expect(generator.generate()).toEqual(none);
    });
  });

  describe('ScalaCheck-affinity aliases', () => {
    it('listOf is reference-equal to arrayOf', () => {
      expect(Generators.listOf).toBe(Generators.arrayOf);
    });

    it('listOfN is reference-equal to arrayOfLength', () => {
      expect(Generators.listOfN).toBe(Generators.arrayOfLength);
    });

    it('nonEmptyListOf is reference-equal to nonEmptyArray', () => {
      expect(Generators.nonEmptyListOf).toBe(Generators.nonEmptyArray);
    });
  });

  describe('nonEmptyArray', () => {
    const value = 5;

    it('should generate array of length 1 if maxSize is 1', () => {
      const generator = Generators.nonEmptyArray(Generators.pure(value), 1);
      expect(generator.generate().get()).toEqual([value]);
    });

    it('should always generate an array which size is between 1 and maxSize', () => {
      const tries = 50;
      const maxSize = 3;
      const generator = Generators.nonEmptyArray(Generators.pure(value), maxSize);
      [...Array(tries)].forEach(_ => {
        const generated = generator.generate().get();
        expect(generated.length).toBeGreaterThanOrEqual(1);
        expect(generated.length).toBeLessThanOrEqual(maxSize);
        generated.forEach((element: number) =>
          expect(element).toEqual(value)
        );
      });
    });

    it('should generate none if maxSize is 0', () => {
      const generator = Generators.nonEmptyArray(Generators.pure(value), 0);
      expect(generator.generate()).toEqual(none);
    });

    it('should generate none if maxSize is negative', () => {
      const generator = Generators.nonEmptyArray(Generators.pure(value), -1);
      expect(generator.generate()).toEqual(none);
    });
  });
});
