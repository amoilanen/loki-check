import { Maybe, Some } from '../maybe.js';
import { Generator, type Shrinker } from '../generator.js';
import { type Random, defaultRandom } from '../random/index.js';

/**
 * Default shrinker for booleans. Yields `false` when the input is `true`,
 * otherwise yields nothing.
 */
export function* shrinkBoolean(value: boolean): Iterable<boolean> {
  if (value) yield false;
}

const booleanShrinker: Shrinker<boolean> = shrinkBoolean;

class BooleanGenerator extends Generator<boolean> {
  override shrinker: Shrinker<any> = booleanShrinker as Shrinker<any>;
  generate(rng: Random = defaultRandom()): Maybe<boolean> {
    return new Some(rng.next() < 0.5);
  }
}

/**
 * Generates `true` or `false` with equal probability.
 *
 * Default shrinker reduces `true` toward `false`.
 *
 * @example
 * ```ts
 * Generators.boolean.sample({ seed: 42 }); // deterministic boolean
 * ```
 */
export const boolean: Generator<boolean> = new BooleanGenerator();
