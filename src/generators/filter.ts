import { Generator } from '../generator.js';

/**
 * Options for {@link suchThat}.
 */
export interface SuchThatOptions {
  /**
   * Maximum number of attempts to draw a value satisfying the predicate before
   * giving up and yielding `none`. Defaults to `100`.
   */
  retries?: number;
}

/**
 * Returns a generator that only yields values from `g` satisfying `p`.
 *
 * Each call retries up to `opts.retries` times (default 100); after that the
 * generator yields `none`. Standalone form of {@link Generator.filter} —
 * delegates to it under the hood and is exposed for affinity with ScalaCheck's
 * `Gen.suchThat` API.
 *
 * @param g - source generator.
 * @param p - predicate that must hold for accepted values.
 * @param opts - retry budget.
 *
 * @example
 * ```ts
 * const evenInt = Generators.suchThat(Generators.integer(), n => n % 2 === 0);
 * ```
 */
export function suchThat<T>(
  g: Generator<T>,
  p: (x: T) => boolean,
  opts: SuchThatOptions = {}
): Generator<T> {
  return g.filter(p, opts);
}
