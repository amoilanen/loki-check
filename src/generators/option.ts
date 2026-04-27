import { type Maybe, Some } from '../maybe.js';
import { Generator } from '../generator.js';
import { type Random, defaultRandom } from '../random/index.js';

/**
 * Options for {@link option}.
 */
export interface OptionOptions {
  /**
   * Probability of producing a defined value rather than `undefined`.
   * Must be in `[0, 1]`. Defaults to `0.75`.
   */
  someProbability?: number;
}

/**
 * Wraps `g` so that it occasionally yields `undefined` instead of a value.
 *
 * Use this to model nullable/optional fields in generated test data.
 *
 * @param g - generator producing the wrapped value.
 * @param opts - controls how often `undefined` is produced.
 *
 * @example
 * ```ts
 * const maybeName = Generators.option(Generators.identifier, { someProbability: 0.5 });
 * ```
 */
export function option<T>(g: Generator<T>, opts: OptionOptions = {}): Generator<T | undefined> {
  const p = opts.someProbability ?? 0.75;
  if (!Number.isFinite(p) || p < 0 || p > 1) {
    throw new RangeError(`option: someProbability must be in [0, 1], received ${String(p)}`);
  }
  return new (class extends Generator<T | undefined> {
    generate(rng: Random = defaultRandom()): Maybe<T | undefined> {
      if (rng.next() >= p) {
        return new Some<T | undefined>(undefined);
      }
      return g.generate(rng) as Maybe<T | undefined>;
    }
  })();
}

/**
 * Alias of {@link option}, named after the ScalaCheck `Gen.option` combinator
 * for users migrating from that library.
 */
export const maybe = option;
