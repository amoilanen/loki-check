import { type Maybe } from '../maybe.js';
import { Generator } from '../generator.js';
import { type Random, defaultRandom, withSize } from '../random/index.js';

/**
 * Builds a generator whose behaviour depends on the current size hint carried
 * by the active {@link Random}.
 *
 * The size hint scales the complexity of generated values (collection length,
 * recursion depth, magnitude, etc.). Use {@link resize} to set it explicitly.
 *
 * @example
 * ```ts
 * import { Generators } from 'gen.js';
 *
 * // Generates an array whose length matches the active size.
 * const arr = Generators.sized(s =>
 *   Generators.arrayOfLength(Generators.integer(), s)
 * );
 * ```
 */
export function sized<T>(build: (size: number) => Generator<T>): Generator<T> {
  return new (class extends Generator<T> {
    generate(rng: Random = defaultRandom()): Maybe<T> {
      return build(rng.size).generate(rng);
    }
  })();
}

/**
 * Runs `g` against the active random stream with its size hint replaced by
 * `n`. The underlying number stream is preserved so determinism still holds.
 *
 * @param n - the new size hint. Must be a non-negative integer.
 * @param g - the generator to run with the overridden size.
 *
 * @example
 * ```ts
 * import { Generators } from 'gen.js';
 *
 * const fiveInts = Generators.resize(
 *   5,
 *   Generators.sized(s => Generators.arrayOfLength(Generators.integer(), s))
 * );
 * fiveInts.sample({ seed: 1 }); // length === 5
 * ```
 */
export function resize<T>(n: number, g: Generator<T>): Generator<T> {
  return new (class extends Generator<T> {
    generate(rng: Random = defaultRandom()): Maybe<T> {
      return g.generate(withSize(rng, n));
    }
  })();
}
