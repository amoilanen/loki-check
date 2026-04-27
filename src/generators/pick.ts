import { Generator, type Shrinker } from '../generator.js';
import { type Maybe, Some } from '../maybe.js';
import { type Random, defaultRandom } from '../random/index.js';

/**
 * Default shrinker for {@link pick} results. Shrinks toward keeping the first
 * elements, since those are most likely to be the simplest counter-example.
 */
export function* shrinkPick<T>(picked: readonly T[]): Iterable<T[]> {
  const len = picked.length;
  if (len === 0) return;
  for (let n = len - 1; n >= 0; n--) {
    yield picked.slice(0, n);
  }
}

/**
 * Default shrinker for {@link shuffle} results. Without access to the original
 * input here, the best generic move is to shrink toward shorter prefixes — the
 * runner-level shrinker (step 10) replaces this with a permutation-aware one.
 */
export function* shrinkShuffle<T>(arr: readonly T[]): Iterable<T[]> {
  if (arr.length === 0) return;
  yield [];
  if (arr.length > 1) yield arr.slice(0, arr.length - 1);
}

const pickShrinker: Shrinker<unknown[]> = shrinkPick as Shrinker<unknown[]>;
const shuffleShrinker: Shrinker<unknown[]> = shrinkShuffle as Shrinker<unknown[]>;

/**
 * Generates a distinct `n`-element subset of `xs` via a Fisher–Yates partial shuffle.
 *
 * @throws `RangeError` when `n < 0` or `n > xs.length`.
 *
 * @example
 * ```ts
 * Generators.pick(2, ['a', 'b', 'c', 'd']).sample({ seed: 1 });
 * ```
 */
export function pick<T>(n: number, xs: readonly T[]): Generator<T[]> {
  if (!Number.isInteger(n) || n < 0) {
    throw new RangeError(`pick: n must be a non-negative integer, received ${n}`);
  }
  if (n > xs.length) {
    throw new RangeError(`pick: n (${n}) exceeds source length (${xs.length})`);
  }
  const source = xs.slice();
  return new (class extends Generator<T[]> {
    override shrinker: Shrinker<any> = pickShrinker as Shrinker<any>;
    generate(rng: Random = defaultRandom()): Maybe<T[]> {
      const buf = source.slice();
      const out = new Array<T>(n);
      const last = buf.length - 1;
      for (let i = 0; i < n; i++) {
        const j = rng.nextInt(i, last);
        const tmp = buf[i] as T;
        buf[i] = buf[j] as T;
        buf[j] = tmp;
        out[i] = buf[i] as T;
      }
      return new Some(out);
    }
  })();
}

/**
 * Generates a permutation of `xs` via a full Fisher–Yates shuffle.
 *
 * @example
 * ```ts
 * Generators.shuffle([1, 2, 3, 4]).sample({ seed: 1 });
 * ```
 */
export function shuffle<T>(xs: readonly T[]): Generator<T[]> {
  const source = xs.slice();
  return new (class extends Generator<T[]> {
    override shrinker: Shrinker<any> = shuffleShrinker as Shrinker<any>;
    generate(rng: Random = defaultRandom()): Maybe<T[]> {
      if (source.length === 0) return new Some([]);
      const out = source.slice();
      for (let i = out.length - 1; i > 0; i--) {
        const j = rng.nextInt(0, i);
        const tmp = out[i] as T;
        out[i] = out[j] as T;
        out[j] = tmp;
      }
      return new Some(out);
    }
  })();
}
