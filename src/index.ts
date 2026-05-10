/**
 * loki-check — composable, seeded data generators for TypeScript/JavaScript.
 *
 * The public surface is intentionally narrow:
 *
 * - {@link Generator} — the core abstract type users compose with `map`/`flatMap`
 *   and consume with {@link Generator.sample} / {@link Generator.sampleN}.
 * - {@link Generators} — namespace containing every built-in combinator
 *   (numbers, booleans, strings, collections, dates, etc.).
 * - {@link forAll} / {@link exists} — quantifier-style property-test entry points.
 * - {@link Random}, {@link fromSeed}, {@link defaultRandom} — deterministic
 *   randomness for reproducible sampling.
 * - {@link Maybe}, {@link Some}, {@link None}, {@link none} — return type of
 *   {@link Generator.generate} for users who prefer the functional path.
 *
 * @example
 * ```ts
 * import { Generators, forAll } from 'loki-check';
 *
 * const xs = Generators.arrayOf(Generators.integer(), 5).sample({ seed: 1 });
 * forAll.assert(Generators.integer(), n => Number.isInteger(n));
 * ```
 *
 * @packageDocumentation
 */
import * as Generators from './generators/index.js';
import { Generator, GenError, type SampleOpts, type Shrinker } from './generator.js';
import { Maybe, Some, None, none } from './maybe.js';
import { type Random, fromSeed, defaultRandom } from './random/index.js';

export * from './quantifiers/index.js';
export { Generators, Generator, GenError, Maybe, Some, None, none, fromSeed, defaultRandom };
export type { SampleOpts, Shrinker, Random };
