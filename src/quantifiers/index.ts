import { Generator, type Shrinker } from '../generator.js';
import { type Random, fromSeed } from '../random/index.js';
import { shrinkSearch } from './shrink.js';

/**
 * Predicate accepted by {@link forAll} and {@link exists}. May return `boolean`
 * or `void`. A returned `undefined` (i.e. no explicit return) is treated as
 * success; thrown errors are caught and treated as failure.
 */
export type Predicate<T> = (x: T) => boolean | void;

/**
 * Options for {@link forAll}.
 */
export interface ForAllOpts {
  /** Number of values to draw before declaring the property holds. Default `100`. */
  tries?: number;
  /** Reproducible seed. Ignored when `rng` is supplied. */
  seed?: number | string;
  /** Pre-built random source. Takes precedence over `seed`. */
  rng?: Random;
  /** Whether to attempt shrinking when a counter-example is found. Default `true`. */
  shrink?: boolean;
  /** Maximum number of predicate calls during shrinking. Default `1000`. */
  shrinkBudget?: number;
}

/**
 * Options for {@link exists}.
 */
export interface ExistsOpts {
  /** Number of values to draw before giving up. Default `100`. */
  tries?: number;
  /** Reproducible seed. Ignored when `rng` is supplied. */
  seed?: number | string;
  /** Pre-built random source. Takes precedence over `seed`. */
  rng?: Random;
}

/**
 * Outcome of a {@link forAll} run.
 */
export interface ForAllResult<T> {
  /** `true` when the property held for every draw. */
  ok: boolean;
  /** Number of predicate evaluations performed before stopping. */
  triesRun: number;
  /** Seed used by the run. Pass it back as `opts.seed` to reproduce. */
  seed: number;
  /**
   * Populated when `ok` is `false`. `original` is the first failing value
   * drawn; `shrunk` is the smallest failing value found via the attached
   * shrinker (equal to `original` when `shrink` is disabled).
   */
  counterExample?: {
    /** First failing value drawn from the generator. */
    original: T;
    /** Smallest failing value reached by shrinking. */
    shrunk: T;
  };
}

/**
 * Outcome of an {@link exists} run.
 */
export interface ExistsResult<T> {
  /** `true` when a witness satisfying the predicate was found. */
  found: boolean;
  /** Number of predicate evaluations performed before stopping. */
  triesRun: number;
  /** Seed used by the run. Pass it back as `opts.seed` to reproduce. */
  seed: number;
  /** The first value satisfying the predicate, when `found` is `true`. */
  witness?: T;
}

interface Resolved {
  rng: Random;
  seed: number;
}

function resolve(opts: { seed?: number | string; rng?: Random }): Resolved {
  if (opts.rng) return { rng: opts.rng, seed: opts.rng.seed };
  if (opts.seed !== undefined) {
    const rng = fromSeed(opts.seed);
    return { rng, seed: rng.seed };
  }
  const seed = (Math.random() * 0x1_0000_0000) >>> 0;
  return { rng: fromSeed(seed), seed };
}

function evalPredicate<T>(p: Predicate<T>, x: T): boolean {
  try {
    const r = p(x);
    if (r === undefined) return true;
    return Boolean(r);
  } catch {
    return false;
  }
}

const noShrinker: Shrinker<unknown> = function* () {
  /* yields nothing */
};

function getShrinker<T>(gen: Generator<T>): Shrinker<T> {
  return (gen.shrinker as Shrinker<T> | undefined) ?? (noShrinker as Shrinker<T>);
}

function safeStringify(value: unknown): string {
  try {
    const s = JSON.stringify(value, (_k, v) => (typeof v === 'bigint' ? v.toString() : v));
    return s ?? String(value);
  } catch {
    return String(value);
  }
}

/**
 * Universal quantifier. Draws up to `opts.tries` values from `gen` and reports
 * whether `predicate` holds for every one. On the first failure, the original
 * counter-example is captured and (when `opts.shrink !== false`) reduced via
 * the generator's attached shrinker.
 *
 * @example
 * ```ts
 * const r = forAll(Generators.integer(), x => Number.isInteger(x));
 * if (!r.ok) console.log('seed for repro:', r.seed);
 * ```
 */
function forAllImpl<T>(
  gen: Generator<T>,
  predicate: Predicate<T>,
  opts: ForAllOpts = {}
): ForAllResult<T> {
  const tries = opts.tries ?? 100;
  const shrink = opts.shrink ?? true;
  const shrinkBudget = opts.shrinkBudget ?? 1000;
  const { rng, seed } = resolve(opts);

  for (let i = 0; i < tries; i++) {
    const m = gen.generate(rng);
    if (!m.isDefined) continue;
    const value = m.value;
    if (!evalPredicate(predicate, value)) {
      const shrunk = shrink
        ? shrinkSearch(value, getShrinker(gen), x => !evalPredicate(predicate, x), shrinkBudget)
        : value;
      return {
        ok: false,
        triesRun: i + 1,
        seed,
        counterExample: { original: value, shrunk },
      };
    }
  }
  return { ok: true, triesRun: tries, seed };
}

/**
 * Asserting variant of {@link forAll}. Throws an `Error` whose message embeds
 * the seed and counter-examples when the property fails.
 */
function assertForAll<T>(
  gen: Generator<T>,
  predicate: Predicate<T>,
  opts?: ForAllOpts
): void {
  const r = forAllImpl(gen, predicate, opts);
  if (!r.ok) {
    const orig = safeStringify(r.counterExample?.original);
    const shrunk = safeStringify(r.counterExample?.shrunk);
    throw new Error(
      `forAll: property failed (seed=${r.seed}, tries=${r.triesRun}). ` +
        `Original counter-example: ${orig}. Shrunk: ${shrunk}.`
    );
  }
}

/**
 * Universal quantifier entry point.
 *
 * Calling `forAll(gen, predicate, opts?)` runs the predicate against up to
 * `opts.tries` random draws. The function additionally exposes an
 * {@link forAll.assert | `assert`} variant that throws on failure for use
 * inside test runners.
 *
 * @example
 * ```ts
 * import { forAll, Generators } from 'check-loki';
 *
 * const r = forAll(Generators.integer(), n => Number.isInteger(n));
 * if (!r.ok) console.error('Counter-example:', r.counterExample, 'seed:', r.seed);
 *
 * forAll.assert(Generators.integer(), n => Number.isInteger(n));
 * ```
 */
export const forAll: typeof forAllImpl & {
  /** Asserting variant — throws on failure with seed embedded in the message. */
  assert: typeof assertForAll;
} = Object.assign(forAllImpl, { assert: assertForAll });

/**
 * Existential quantifier. Draws up to `opts.tries` values from `gen` and
 * returns the first that satisfies `predicate`. Returns `{ found: false }`
 * when no witness is found within the try budget.
 */
export function exists<T>(
  gen: Generator<T>,
  predicate: Predicate<T>,
  opts: ExistsOpts = {}
): ExistsResult<T> {
  const tries = opts.tries ?? 100;
  const { rng, seed } = resolve(opts);

  for (let i = 0; i < tries; i++) {
    const m = gen.generate(rng);
    if (!m.isDefined) continue;
    if (evalPredicate(predicate, m.value)) {
      return { found: true, triesRun: i + 1, seed, witness: m.value };
    }
  }
  return { found: false, triesRun: tries, seed };
}
