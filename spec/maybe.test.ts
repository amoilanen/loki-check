import { describe, it, expect } from 'vitest';

import { Maybe, Some, none } from '../src/maybe.js';

const pure = Maybe.pure;

describe('Maybe', () => {

  describe('pure', () => {

    it('should produce Some for a non-empty value', () => {
      let numericValue = 3;
      let wrappedValue: Maybe<number> = pure(numericValue);

      expect(wrappedValue).toEqual(new Some(numericValue));
    });

    it('should produce None for an empty value', () => {
      let wrappedValue: Maybe<number> = pure<number>(null as unknown as number);

      expect(wrappedValue).toBe(none);
    });
  });

  describe('Some', () => {

    let value = 2;

    it('should be defined and have value', () => {
      let wrappedValue = new Some(value);
      expect(wrappedValue.isDefined).toBe(true);
      expect(wrappedValue.value).toEqual(value);
    });

    it('should map to another Some', () => {
      let wrappedValue = new Some(value).map((x: number) => 2 * x);
      expect(wrappedValue).toEqual(new Some(2 * value));
    });

    it('should flatMap to another Some', () => {
      let wrappedValue = new Some(value).flatMap((x: number) => new Some(x - 1));
      expect(wrappedValue).toEqual(new Some(value - 1));
    });
  });

  describe('None', () => {

    it('should not be defined and value should throw exception', () => {
      expect(none.isDefined).toBe(false);
      expect(() => none.value).toThrow('None: accessing undefined value');
    });

    it('should map to None', () => {
      expect(none.map((x: number) => 2 * x)).toBe(none);
    });

    it('should flatMap to None', () => {
      expect(none.flatMap((x: number) => new Some(2 * x))).toBe(none);
    });
  });

  describe('Monadic laws for Maybe', () => {

    let values = [null, 1, 3, 5];

    // flatMap(f)(pure) == f
    it('should satisfy the left identity law', () => {
      values.forEach(value => {
        let f = (x: number | null) => pure(x == null ? null : 2 * x);
        expect(pure(value).flatMap(f)).toEqual(f(value));
      });
    });

    // m.flatMap(pure) == m
    it('should satisfy the right identity law', () => {
      values.forEach(value => {
        let m = pure(value);
        expect(m.flatMap(pure)).toEqual(m);
      });
    });

    // m.flatMap(f).flatMap(g) == m.flatMap(flatMap(g)(f))
    it('should satisfy the associativity law', () => {
      values.forEach(value => {
        let f = (x: number | null) => pure(x == null ? null : 2 * x);
        let g = (x: number | null) => pure(x == null ? null : x * x);
        let m = pure(value);

        let leftSide = m.flatMap(f).flatMap(g);
        let rightSide = m.flatMap((x: number | null) => f(x).flatMap(g));

        expect(leftSide).toEqual(rightSide);
      });
    });
  });
});
