import { Maybe, none } from './maybe.js';
import { type Random, defaultRandom, fromSeed } from './random/index.js';

/**
 * Produces a (potentially empty) sequence of candidate replacements for `value`.
 *
 * Used by the property-test runner to search for a minimal counter-example.
 */
export type Shrinker<T> = (value: T) => Iterable<T>;

/**
 * Options accepted by {@link Generator.sample} and {@link Generator.sampleN}.
 *
 * Pass `seed` for reproducibility, or `rng` to share an existing stream across calls.
 * `rng` takes precedence if both are supplied.
 */
export interface SampleOpts {
  /** Reproducible numeric or string seed. Ignored when `rng` is supplied. */
  seed?: number | string;
  /** Pre-built random source. Takes precedence over `seed`. */
  rng?: Random;
}

/**
 * Error thrown by sampling helpers when a generator yields no value.
 */
export class GenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GenError';
  }
}

function resolveRng(opts: SampleOpts): Random {
  if (opts.rng) return opts.rng;
  if (opts.seed !== undefined) return fromSeed(opts.seed);
  return defaultRandom();
}

/**
 * A composable producer of values of type `T`.
 *
 * Generators may use the supplied {@link Random} to draw randomness. When no
 * `rng` is supplied, {@link defaultRandom} is used so existing call sites that
 * relied on `Math.random` continue to work.
 */
export abstract class Generator<T> {
  /**
   * Optional shrinker carried alongside this generator. The property-test
   * runner reads this when searching for minimal counter-examples.
   *
   * Typed as `Shrinker\<any\>` to keep `Generator\<T\>` covariant in `T`;
   * users attach shrinkers via {@link Generator.withShrinker} which retains
   * full type-safety at the call site.
   */
  shrinker?: Shrinker<any>;

  /**
   * Produces a single candidate value, or `none` if the generator is exhausted
   * or otherwise unable to produce a value.
   *
   * @param rng - random source threaded through child generators. Defaults to
   *   {@link defaultRandom}.
   */
  abstract generate(rng?: Random): Maybe<T>;

  /**
   * Returns a new generator whose values are obtained by applying `f` to the
   * values produced by this generator.
   */
  map<U>(f: (value: T) => U): Generator<U> {
    return this.flatMap(value => Generator.pure(f(value)));
  }

  /**
   * Monadic bind. Generates a value, then runs the generator returned by `f`
   * against the same random stream so that determinism is preserved.
   */
  flatMap<U>(f: (value: T) => Generator<U>): Generator<U> {
    const source = this;
    return new (class extends Generator<U> {
      generate(rng: Random = defaultRandom()): Maybe<U> {
        return source.generate(rng).flatMap((x: T) => f(x).generate(rng));
      }
    });
  }

  /**
   * Returns a generator that only yields values satisfying `p`.
   *
   * Each call retries up to `opts.retries` times (default 100); after that the
   * generator yields `none` for that call.
   */
  filter(p: (x: T) => boolean, opts: { retries?: number } = {}): Generator<T> {
    const retries = opts.retries ?? 100;
    const source = this;
    return new (class extends Generator<T> {
      generate(rng: Random = defaultRandom()): Maybe<T> {
        for (let attempt = 0; attempt <= retries; attempt++) {
          const m = source.generate(rng);
          if (!m.isDefined) {
            return none;
          }
          if (p(m.value)) {
            return m;
          }
        }
        return none;
      }
    });
  }

  /**
   * Returns a generator with `s` attached as its shrinker. The underlying
   * value-generation behaviour is unchanged.
   */
  withShrinker(s: Shrinker<T>): Generator<T> {
    const source = this;
    return new (class extends Generator<T> {
      override shrinker: Shrinker<any> = s as Shrinker<any>;
      generate(rng: Random = defaultRandom()): Maybe<T> {
        return source.generate(rng);
      }
    });
  }

  /**
   * Draws a single value, throwing {@link GenError} if the generator is
   * exhausted.
   *
   * @example
   * ```ts
   * Generator.pure(42).sample(); // 42
   * Generators.choose(0, 10).sample({ seed: 'hello' }); // deterministic
   * ```
   */
  sample(opts: SampleOpts = {}): T {
    const rng = resolveRng(opts);
    const m = this.generate(rng);
    if (!m.isDefined) {
      throw new GenError('sample: generator yielded no value');
    }
    return m.value;
  }

  /**
   * Draws `n` values from this generator. All draws share a single random
   * stream so that, given the same seed, the result is fully deterministic.
   */
  sampleN(n: number, opts: SampleOpts = {}): T[] {
    if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
      throw new GenError(`sampleN: n must be a non-negative integer, received ${n}`);
    }
    const rng = resolveRng(opts);
    const out = new Array<T>(n);
    for (let i = 0; i < n; i++) {
      const m = this.generate(rng);
      if (!m.isDefined) {
        throw new GenError(`sampleN: generator yielded no value at index ${i}`);
      }
      out[i] = m.value;
    }
    return out;
  }

  /**
   * Lifts a plain value into a generator that always produces it.
   *
   * @example
   * ```ts
   * Generator.pure(42).sample(); // 42
   * ```
   */
  static pure<T>(value: T): Generator<T> {
    return new SingleValueGenerator(value);
  }
}

class SingleValueGenerator<T> extends Generator<T> {
  generatedValue: Maybe<T>;
  constructor(value: T) {
    super();
    this.generatedValue = Maybe.pure(value);
  }
  generate(_rng?: Random): Maybe<T> {
    return this.generatedValue;
  }
}
