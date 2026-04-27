import { type Maybe, Some, none } from '../maybe.js';
import { Generator, type Shrinker } from '../generator.js';
import { type Random, defaultRandom } from '../random/index.js';

/**
 * Default integer bounds. Limited to the signed 32-bit range so that the
 * underlying {@link Random.nextInt} unbiased rejection sampler (which works on
 * 32-bit integers) can cover the full domain in a single draw.
 */
const DEFAULT_INT_MIN = -(2 ** 31);
const DEFAULT_INT_MAX = 2 ** 31 - 1;

/**
 * Yields a sequence of candidate replacements for `value` that progress
 * monotonically toward zero. Used by the property-test runner to minimise
 * numeric counter-examples.
 */
export function* shrinkNumber(value: number): Iterable<number> {
  if (!Number.isFinite(value) || value === 0) return;
  yield 0;
  if (value < 0) yield -value;
  const isInt = Number.isInteger(value);
  let current = value;
  while (true) {
    const next = isInt ? Math.trunc(current / 2) : current / 2;
    if (next === current || next === 0) return;
    yield next;
    current = next;
  }
}

const numberShrinker: Shrinker<number> = shrinkNumber;

function attachNumberShrinker<G extends Generator<number>>(g: G): G {
  g.shrinker = numberShrinker as Shrinker<any>;
  return g;
}

/**
 * Generates a uniformly distributed floating-point number in `[min, max)`
 * (inclusive of `min`, exclusive of `max` when `min < max`). Yields `none`
 * when `max < min`.
 */
export function choose(min: number, max: number): Generator<number> {
  return attachNumberShrinker(new (class extends Generator<number> {
    generate(rng: Random = defaultRandom()): Maybe<number> {
      if (max < min) {
        return none;
      }
      return new Some<number>(rng.next() * (max - min) + min);
    }
  })());
}

/**
 * Options for {@link integer}.
 */
export interface IntegerOptions {
  /** Inclusive lower bound. Defaults to `-(2 ** 31)`. */
  min?: number;
  /** Inclusive upper bound. Defaults to `2 ** 31 - 1`. */
  max?: number;
}

/**
 * Generates an integer drawn uniformly from `[min, max]` (inclusive on both
 * ends). Both bounds default to the signed 32-bit range.
 *
 * Delegates to {@link Random.nextInt}, so draws are unbiased.
 *
 * @example
 * ```ts
 * Generators.integer({ min: 0, max: 9 }).sample({ seed: 'x' });
 * ```
 */
export function integer(opts: IntegerOptions = {}): Generator<number> {
  const min = opts.min ?? DEFAULT_INT_MIN;
  const max = opts.max ?? DEFAULT_INT_MAX;
  return attachNumberShrinker(new (class extends Generator<number> {
    generate(rng: Random = defaultRandom()): Maybe<number> {
      if (max < min) return none;
      return new Some<number>(rng.nextInt(min, max));
    }
  })());
}

/**
 * Options for {@link float}.
 */
export interface FloatOptions {
  /** Inclusive lower bound. Defaults to `0`. */
  min?: number;
  /** Exclusive upper bound. Defaults to `1`. */
  max?: number;
}

/**
 * Generates a uniformly distributed floating-point number in `[min, max)`.
 * Defaults to `[0, 1)`.
 */
export function float(opts: FloatOptions = {}): Generator<number> {
  const min = opts.min ?? 0;
  const max = opts.max ?? 1;
  return attachNumberShrinker(new (class extends Generator<number> {
    generate(rng: Random = defaultRandom()): Maybe<number> {
      if (max < min) return none;
      return new Some<number>(min + rng.next() * (max - min));
    }
  })());
}

/**
 * Generates an integer in `[0, 255]`.
 */
export const byte: Generator<number> = integer({ min: 0, max: 255 });

/**
 * Generates a strictly positive integer (`>= 1`) up to `2 ** 31 - 1`.
 */
export const posInt: Generator<number> = integer({ min: 1, max: DEFAULT_INT_MAX });

/**
 * Generates a strictly negative integer (`<= -1`) down to `-(2 ** 31)`.
 */
export const negInt: Generator<number> = integer({ min: DEFAULT_INT_MIN, max: -1 });

/**
 * Generates an integer in `[-100, 100]`. Useful for property tests that need
 * compact, easy-to-display counter-examples.
 */
export const smallInt: Generator<number> = integer({ min: -100, max: 100 });

/**
 * Generates an integer drawn from the default integer range, rerolling whenever
 * a draw lands on `0`. Yields `none` after exhausting the retry budget.
 */
export const nonZeroInt: Generator<number> = attachNumberShrinker(
  new (class extends Generator<number> {
    private readonly source = integer();
    generate(rng: Random = defaultRandom()): Maybe<number> {
      for (let attempt = 0; attempt < 100; attempt++) {
        const m = this.source.generate(rng);
        if (!m.isDefined) return none;
        if (m.value !== 0) return m;
      }
      return none;
    }
  })()
);
