import { type Maybe, Some, none } from '../maybe.js';
import { Generator, type Shrinker } from '../generator.js';
import { type Random, defaultRandom } from '../random/index.js';

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;
const DEFAULT_RANGE_MS = 100 * MS_PER_YEAR;

/**
 * Default shrinker for {@link Date} values. Shrinks toward the Unix epoch
 * (`1970-01-01T00:00:00.000Z`).
 */
export function* shrinkDate(value: Date): Iterable<Date> {
  const t = value.getTime();
  if (!Number.isFinite(t) || t === 0) return;
  yield new Date(0);
  let current = t;
  while (true) {
    const next = Math.trunc(current / 2);
    if (next === current || next === 0) return;
    yield new Date(next);
    current = next;
  }
}

const dateShrinker: Shrinker<Date> = shrinkDate;

/**
 * Generates a {@link Date} drawn uniformly from a window of ±100 years around
 * the Unix epoch.
 *
 * @example
 * ```ts
 * Generators.date.sample({ seed: 'today' });
 * ```
 */
export const date: Generator<Date> = (() => {
  const g = new (class extends Generator<Date> {
    generate(rng: Random = defaultRandom()): Maybe<Date> {
      const offset = (rng.next() * 2 - 1) * DEFAULT_RANGE_MS;
      return new Some(new Date(Math.trunc(offset)));
    }
  })();
  g.shrinker = dateShrinker as Shrinker<any>;
  return g;
})();

/**
 * Generates a {@link Date} drawn uniformly from the inclusive range `[from, to]`.
 *
 * Yields `none` if either bound is an invalid `Date` or if `from > to`.
 *
 * @example
 * ```ts
 * const g = Generators.dateBetween(new Date('2020-01-01'), new Date('2025-12-31'));
 * ```
 */
export function dateBetween(from: Date, to: Date): Generator<Date> {
  const lo = from.getTime();
  const hi = to.getTime();
  const g = new (class extends Generator<Date> {
    generate(rng: Random = defaultRandom()): Maybe<Date> {
      if (!Number.isFinite(lo) || !Number.isFinite(hi) || lo > hi) return none;
      const span = hi - lo;
      const offset = Math.trunc(rng.next() * (span + 1));
      const clamped = offset > span ? span : offset;
      return new Some(new Date(lo + clamped));
    }
  })();
  g.shrinker = dateShrinker as Shrinker<any>;
  return g;
}

/**
 * Generates an ISO-8601 formatted date string (output of `Date.toISOString()`).
 *
 * Round-trips through {@link Date.parse}.
 *
 * @example
 * ```ts
 * Generators.isoDateString.sample({ seed: 1 }); // e.g. "1993-04-12T08:23:11.456Z"
 * ```
 */
export const isoDateString: Generator<string> = date.map(d => d.toISOString());
