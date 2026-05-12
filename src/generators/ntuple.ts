import { Generator, type Shrinker } from '../generator.js';
import { objectGenerator } from './object.js';
import { shrinkTuple } from '../quantifiers/shrink.js';

const noShrink: Shrinker<unknown> = function* () {
  /* yields nothing */
};

type G<T> = Generator<T>;

export function nTuple<T1, T2>(g1: G<T1>, g2: G<T2>): G<[T1, T2]>
export function nTuple<T1, T2, T3>(g1: G<T1>, g2: G<T2>, g3: G<T3>): G<[T1, T2, T3]>
export function nTuple<T1, T2, T3, T4>(g1: G<T1>, g2: G<T2>, g3: G<T3>, g4: G<T4>): G<[T1, T2, T3, T4]>
export function nTuple<T1, T2, T3, T4, T5>(g1: G<T1>, g2: G<T2>, g3: G<T3>, g4: G<T4>, g5: G<T5>): G<[T1, T2, T3, T4, T5]>
export function nTuple<T1, T2, T3, T4, T5, T6>(g1: G<T1>, g2: G<T2>, g3: G<T3>, g4: G<T4>, g5: G<T5>, g6: G<T6>): G<[T1, T2, T3, T4, T5, T6]>
export function nTuple<T1, T2, T3, T4, T5, T6, T7>(g1: G<T1>, g2: G<T2>, g3: G<T3>, g4: G<T4>, g5: G<T5>, g6: G<T6>, g7: G<T7>): G<[T1, T2, T3, T4, T5, T6, T7]>
export function nTuple<T1, T2, T3, T4, T5, T6, T7, T8>(g1: G<T1>, g2: G<T2>, g3: G<T3>, g4: G<T4>, g5: G<T5>, g6: G<T6>, g7: G<T7>, g8: G<T8>): G<[T1, T2, T3, T4, T5, T6, T7, T8]>
export function nTuple<T1, T2, T3, T4, T5, T6, T7, T8, T9>(g1: G<T1>, g2: G<T2>, g3: G<T3>, g4: G<T4>, g5: G<T5>, g6: G<T6>, g7: G<T7>, g8: G<T8>, g9: G<T9>): G<[T1, T2, T3, T4, T5, T6, T7, T8, T9]>
export function nTuple<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(g1: G<T1>, g2: G<T2>, g3: G<T3>, g4: G<T4>, g5: G<T5>, g6: G<T6>, g7: G<T7>, g8: G<T8>, g9: G<T9>, g10: G<T10>): G<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10]>
//TODO: Add tests for this variant
export function nTuple<T>(...generators: Array<Generator<T>>): Generator<[T]>

/**
 * Combines independent generators into a tuple. Each value in the resulting
 * tuple is drawn from the corresponding generator in order.
 *
 * @example
 * ```ts
 * import { Generators } from 'check-loki';
 *
 * const point = Generators.nTuple(Generators.integer(), Generators.integer());
 * point.sample({ seed: 1 }); // [number, number]
 * ```
 */
export function nTuple(...generators: Array<Generator<any>>): Generator<any> {
  const built = objectGenerator((...generatedFields: any[]) => generatedFields, ...generators);
  const inners = generators.map(g => g.shrinker ?? noShrink) as Array<Shrinker<unknown>>;
  return built.withShrinker(shrinkTuple(...inners) as Shrinker<unknown[]>);
}

/**
 * ScalaCheck-affinity alias for {@link nTuple}. Combines independent
 * generators into a tuple that preserves their order.
 */
export const zip = nTuple;

/**
 * Lifts an n-ary function `fn` into the generator world. Given one generator
 * per parameter, returns a generator that draws each argument independently
 * and applies `fn` to the resulting tuple.
 *
 * Equivalent to `nTuple(...gens).map(args => fn(...args))`, with stricter
 * argument typing.
 *
 * @example
 * ```ts
 * import { Generators } from 'check-loki';
 *
 * const sum = Generators.lift(
 *   (a: number, b: number) => a + b,
 *   Generators.integer({ min: 0, max: 9 }),
 *   Generators.integer({ min: 0, max: 9 }),
 * );
 * sum.sample({ seed: 1 }); // a number in [0, 18]
 * ```
 */
export function lift<A extends readonly unknown[], R>(
  fn: (...args: A) => R,
  ...gens: { [K in keyof A]: Generator<A[K]> } & { length: A['length'] }
): Generator<R> {
  const tupled = (nTuple as (...gs: Array<Generator<any>>) => Generator<any[]>)(
    ...(gens as unknown as Array<Generator<unknown>>),
  );
  return tupled.map((args: unknown[]) => fn(...(args as unknown as A)));
}