import { mulberry32 } from './mulberry32.js';
import { cyrb53 } from './cyrb53.js';

/**
 * A deterministic source of randomness threaded through every generator.
 *
 * Implementations must be reproducible: given the same seed, two `Random`
 * instances produce the same sequence of values.
 */
export interface Random {
  /**
   * Returns the next pseudo-random number in `[0, 1)`.
   */
  next(): number;

  /**
   * Returns an integer drawn uniformly from `[min, max]` (inclusive on both ends).
   *
   * @param min - lower bound, inclusive.
   * @param max - upper bound, inclusive.
   * @throws when `min` is greater than `max` or either argument is not finite.
   */
  nextInt(min: number, max: number): number;

  /**
   * Returns an independent `Random` whose seed is derived from the parent's stream.
   *
   * Useful for handing a child generator its own randomness without sharing state.
   */
  fork(): Random;

  /**
   * The original seed used to initialise this instance.
   *
   * Equals `NaN` for non-seeded sources (e.g. {@link defaultRandom}).
   */
  readonly seed: number;

  /**
   * The current "size" hint carried alongside the random stream. Sized
   * generators (`sized`, `resize`) use this to scale the complexity of the
   * values they produce (collection length, string length, recursion depth,
   * etc.). Defaults to {@link DEFAULT_SIZE}.
   */
  readonly size: number;
}

/**
 * Default size hint carried by every freshly constructed {@link Random}.
 * Chosen large enough to exercise non-trivial structure while still keeping
 * generated values cheap to print.
 */
export const DEFAULT_SIZE = 100;

const UINT32 = 0x1_0000_0000;

function normaliseSeed(seed: number | string): number {
  if (typeof seed === 'string') {
    return cyrb53(seed);
  }
  if (!Number.isFinite(seed)) {
    throw new RangeError(`fromSeed: numeric seed must be finite, received ${String(seed)}`);
  }
  return seed >>> 0;
}

class SeededRandom implements Random {
  readonly seed: number;
  readonly size: number;
  private readonly _next: () => number;

  constructor(seed: number, size: number = DEFAULT_SIZE) {
    this.seed = seed;
    this.size = size;
    this._next = mulberry32(seed);
  }

  next(): number {
    return this._next();
  }

  nextInt(min: number, max: number): number {
    return nextIntFrom(this._next, min, max);
  }

  fork(): Random {
    const childSeed = Math.floor(this._next() * UINT32);
    return new SeededRandom(childSeed >>> 0, this.size);
  }
}

class DefaultRandom implements Random {
  readonly seed: number = Number.NaN;
  readonly size: number = DEFAULT_SIZE;

  next(): number {
    return Math.random();
  }

  nextInt(min: number, max: number): number {
    return nextIntFrom(Math.random, min, max);
  }

  fork(): Random {
    return this;
  }
}

/**
 * Wraps an existing `Random` so that callers see a different `size` hint
 * without altering the underlying number stream. All other methods delegate
 * to the source. `fork()` produces an independent stream that still reports
 * the overridden size.
 */
export function withSize(source: Random, size: number): Random {
  if (!Number.isFinite(size) || size < 0 || !Number.isInteger(size)) {
    throw new RangeError(`withSize: size must be a non-negative integer, received ${String(size)}`);
  }
  return new SizedRandom(source, size);
}

class SizedRandom implements Random {
  readonly size: number;
  constructor(private readonly source: Random, size: number) {
    this.size = size;
  }
  get seed(): number {
    return this.source.seed;
  }
  next(): number {
    return this.source.next();
  }
  nextInt(min: number, max: number): number {
    return this.source.nextInt(min, max);
  }
  fork(): Random {
    return new SizedRandom(this.source.fork(), this.size);
  }
}

function nextIntFrom(source: () => number, min: number, max: number): number {
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    throw new RangeError(`nextInt: bounds must be finite, received [${min}, ${max}]`);
  }
  const lo = Math.ceil(min);
  const hi = Math.floor(max);
  if (lo > hi) {
    throw new RangeError(`nextInt: min (${min}) must be <= max (${max})`);
  }
  const range = hi - lo + 1;
  if (range <= 0 || !Number.isFinite(range)) {
    throw new RangeError(`nextInt: range [${min}, ${max}] is not representable`);
  }
  // Unbiased rejection sampling on the underlying 32-bit value.
  const limit = UINT32 - (UINT32 % range);
  let raw: number;
  do {
    raw = Math.floor(source() * UINT32);
  } while (raw >= limit);
  return lo + (raw % range);
}

/**
 * Builds a deterministic `Random` from a numeric or string seed.
 *
 * Numeric seeds are coerced to unsigned 32-bit integers; string seeds are
 * hashed via cyrb53 so equal strings always produce the same stream.
 *
 * @param seed - numeric or string seed.
 * @returns a `Random` whose stream is fully determined by `seed`.
 *
 * @example
 * ```ts
 * const rng = fromSeed(42);
 * rng.next(); // always the same value across runs
 * ```
 */
export function fromSeed(seed: number | string): Random {
  return new SeededRandom(normaliseSeed(seed));
}

/**
 * Returns a `Random` backed by `Math.random`.
 *
 * The returned instance has `seed === NaN` and `fork()` returns itself, since
 * a non-seeded source has no state worth splitting.
 */
export function defaultRandom(): Random {
  return new DefaultRandom();
}
