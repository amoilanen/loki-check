import { Generator, type Shrinker } from '../generator.js';
import { nTuple } from './ntuple.js';
import { never } from './core.js';
import { choose } from './number.js';
import { repeatGenerator } from '../internal/range.js';
import { shrinkArray as shrinkArrayFactory } from '../quantifiers/shrink.js';

function attachArrayShrinker<T>(g: Generator<T[]>, element: Generator<T>): Generator<T[]> {
  const inner = element.shrinker as Shrinker<T> | undefined;
  return g.withShrinker(shrinkArrayFactory<T>(inner));
}

/**
 * Generates an array containing exactly `timesNumber` independent draws from
 * `generator`. Negative or non-finite counts are clamped to `0`.
 */
export function times<T>(timesNumber: number, generator: Generator<T>): Generator<Array<T>> {
  const safeTimes = Math.max(timesNumber, 0);
  const generators = repeatGenerator(safeTimes, generator);
  return attachArrayShrinker(nTuple(...generators) as Generator<T[]>, generator);
}

/**
 * Generates a non-empty array of up to `maxSize` independent draws from
 * `generator`. Yields `never` for `maxSize < 1`.
 */
export function nonEmptyArray<T>(generator: Generator<T>, maxSize: number): Generator<Array<T>> {
  if (maxSize < 1) {
    return never();
  }
  const suffixGenerator = arrayOfLength(generator, maxSize - 1);
  const built = nTuple(generator, suffixGenerator).map(([first, suffix]: [T, Array<T>]) =>
    [first].concat(suffix)
  );
  return attachArrayShrinker(built, generator);
}

/**
 * Generates an array of exactly `length` independent draws from `generator`.
 * `length === 0` yields the generator that always returns `[]`; `length < 0`
 * yields {@link never}.
 */
export function arrayOfLength<T>(generator: Generator<T>, length: number): Generator<Array<T>> {
  if (length < 0) {
    return never();
  }
  return attachArrayShrinker(nTuple(...repeatGenerator(length, generator)) as Generator<T[]>, generator);
}

/**
 * Generates an array whose length is drawn uniformly from `[0, maxLength]` and
 * whose elements are independent draws from `generator`.
 *
 * @example
 * ```ts
 * import { Generators } from 'gen.js';
 *
 * const xs = Generators.arrayOf(Generators.integer({ min: 0, max: 9 }), 5)
 *   .sample({ seed: 1 });
 * ```
 */
export function arrayOf<T>(generator: Generator<T>, maxLength: number): Generator<Array<T>> {
  return attachArrayShrinker(
    choose(0, maxLength).flatMap((length: number) =>
      arrayOfLength(generator, Math.round(length))
    ),
    generator
  );
}

/**
 * ScalaCheck-affinity alias for {@link arrayOf}.
 */
export const listOf = arrayOf;

/**
 * ScalaCheck-affinity alias for {@link arrayOfLength}.
 */
export const listOfN = arrayOfLength;

/**
 * ScalaCheck-affinity alias for {@link nonEmptyArray}.
 */
export const nonEmptyListOf = nonEmptyArray;
