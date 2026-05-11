import { Generator, type Shrinker } from '../generator.js';
import { type Maybe, Some, none } from '../maybe.js';
import { type Random, defaultRandom } from '../random/index.js';
import { shrinkObject } from '../quantifiers/shrink.js';

const noShrink: Shrinker<unknown> = function* () {
  /* yields nothing */
};

type G<T> = Generator<T>;

export function object<R>(objectConstructor: new () => R): G<R>
export function object<R, T1>(objectConstructor: new (x1: T1) => R, g1: G<T1>): G<R>
export function object<R, T1, T2>(objectConstructor: new (x1: T1, x2: T2) => R, g1: G<T1>, g2: G<T2>): G<R>
export function object<R, T1, T2, T3>(objectConstructor: new (x1: T1, x2: T2, x3: T3) => R, g1: G<T1>, g2: G<T2>, g3: G<T3>): G<R>
export function object<R, T1, T2, T3, T4>(objectConstructor: new (x1: T1, x2: T2, x3: T3, x4: T4) => R, g1: G<T1>, g2: G<T2>, g3: G<T3>, g4: G<T4>): G<R>
export function object<R, T1, T2, T3, T4, T5>(objectConstructor: new (x1: T1, x2: T2, x3: T3, x4: T4, x5: T5) => R,
  g1: G<T1>, g2: G<T2>, g3: G<T3>, g4: G<T4>, g5: G<T5>): G<R>
export function object<R, T1, T2, T3, T4, T5, T6>(objectConstructor: new (x1: T1, x2: T2, x3: T3, x4: T4, x5: T5, x6: T6) => R,
  g1: G<T1>, g2: G<T2>, g3: G<T3>, g4: G<T4>, g5: G<T5>, g6: G<T6>): G<R>
export function object<R, T1, T2, T3, T4, T5, T6, T7>(objectConstructor: new (x1: T1, x2: T2, x3: T3, x4: T4, x5: T5, x6: T6, x7: T7) => R,
  g1: G<T1>, g2: G<T2>, g3: G<T3>, g4: G<T4>, g5: G<T5>, g6: G<T6>, g7: G<T7>): G<R>
export function object<R, T1, T2, T3, T4, T5, T6, T7, T8>(objectConstructor: new (x1: T1, x2: T2, x3: T3, x4: T4, x5: T5, x6: T6, x7: T7, x8: T8) => R,
  g1: G<T1>, g2: G<T2>, g3: G<T3>, g4: G<T4>, g5: G<T5>, g6: G<T6>, g7: G<T7>, g8: G<T8>): G<R>
export function object<R, T1, T2, T3, T4, T5, T6, T7, T8, T9>(objectConstructor: new (x1: T1, x2: T2, x3: T3, x4: T4, x5: T5, x6: T6, x7: T7, x8: T8, x9: T9) => R,
  g1: G<T1>, g2: G<T2>, g3: G<T3>, g4: G<T4>, g5: G<T5>, g6: G<T6>, g7: G<T7>, g8: G<T8>, g9: G<T9>): G<R>
export function object<R, T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(objectConstructor: new (x1: T1, x2: T2, x3: T3, x4: T4, x5: T5, x6: T6, x7: T7, x8: T8, x9: T9, x10: T10) => R,
  g1: G<T1>, g2: G<T2>, g3: G<T3>, g4: G<T4>, g5: G<T5>, g6: G<T6>, g7: G<T7>, g8: G<T8>, g9: G<T9>, g10: G<T10>): G<R>

/**
 * Generates instances of a class. Each constructor argument is drawn
 * independently from the corresponding generator. Yields `none` if any field
 * generator yields `none`.
 *
 * Use {@link record} when you do not need a constructor.
 *
 * @example
 * ```ts
 * import { Generators } from 'loki-tscheck';
 *
 * class Point { constructor(public x: number, public y: number) {} }
 * const points = Generators.object(Point, Generators.integer(), Generators.integer());
 * points.sample({ seed: 1 });
 * ```
 */
export function object<R>(objectConstructor: new (...args: any[]) => R, ...fieldGenerators: Array<Generator<any>>): Generator<R> {
  return objectGenerator((...args: any[]) => new objectConstructor(...args), ...fieldGenerators);
}

/**
 * Lower-level applicative builder used by {@link object} and {@link nTuple}.
 * Calls `objectFromArgs` with one value per field generator. Yields `none`
 * when any field generator yields `none`.
 *
 * @example
 * ```ts
 * import { Generators } from 'loki-tscheck';
 *
 * const sum = Generators.objectGenerator(
 *   (a: number, b: number) => a + b,
 *   Generators.integer({ min: 0, max: 9 }),
 *   Generators.integer({ min: 0, max: 9 }),
 * );
 * sum.sample({ seed: 1 }); // a number in [0, 18]
 * ```
 */
export function objectGenerator<R>(objectFromArgs: (...args: any[]) => R, ...fieldGenerators: Array<Generator<any>>): Generator<R> {
  return new (class extends Generator<R> {
    generate(rng: Random = defaultRandom()): Maybe<R> {
      const generatedFields = fieldGenerators.map(g => g.generate(rng))
        .filter(v => v.isDefined).map(v => v.value);

      if (generatedFields.length < fieldGenerators.length) {
        return none;
      }
      return new Some(objectFromArgs(...generatedFields));
    }
  })();
}

/**
 * Builds a generator of plain objects whose properties are drawn independently
 * from the corresponding generator in `fields`.
 *
 * Unlike {@link object}, no constructor is involved — the result is a plain
 * `{ ... }` object with exactly the keys of `fields`. Yields `none` when any
 * inner generator yields `none`.
 *
 * @example
 * ```ts
 * import { Generators } from 'loki-tscheck';
 *
 * const point = Generators.record({
 *   x: Generators.integer({ min: 0, max: 9 }),
 *   y: Generators.integer({ min: 0, max: 9 }),
 * });
 * point.sample({ seed: 'p' }); // { x: number, y: number }
 * ```
 */
export function record<T extends Record<string, unknown>>(
  fields: { [K in keyof T]: Generator<T[K]> }
): Generator<T> {
  const keys = Object.keys(fields) as Array<keyof T>;
  const built = new (class extends Generator<T> {
    generate(rng: Random = defaultRandom()): Maybe<T> {
      const out: Partial<T> = {};
      for (const key of keys) {
        const m = fields[key].generate(rng);
        if (!m.isDefined) {
          return none;
        }
        out[key] = m.value;
      }
      return new Some(out as T);
    }
  })();
  const inners = {} as { [K in keyof T]: Shrinker<T[K]> };
  for (const key of keys) {
    inners[key] = (fields[key].shrinker ?? noShrink) as Shrinker<T[typeof key]>;
  }
  return built.withShrinker(shrinkObject(inners));
}
