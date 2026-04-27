import type { Shrinker } from '../generator.js';

export type { Shrinker };

export { shrinkNumber } from '../generators/number.js';
export { shrinkString } from '../generators/string.js';
export { shrinkBoolean } from '../generators/boolean.js';

const noShrink: Shrinker<unknown> = function* () {
  /* yields nothing */
};

/**
 * Builds a shrinker for arrays. Yields shorter arrays first; if `inner` is
 * supplied, also yields arrays where a single element has been replaced by
 * one of its own shrunk candidates.
 */
export function shrinkArray<T>(inner?: Shrinker<T>): Shrinker<T[]> {
  return function* (arr: readonly T[]): Iterable<T[]> {
    const len = arr.length;
    if (len === 0) return;
    yield [];
    let n = Math.floor(len / 2);
    while (n > 0 && n < len) {
      yield arr.slice(0, n);
      const next = Math.floor(n / 2);
      if (next === n) break;
      n = next;
    }
    if (len > 1) {
      yield arr.slice(0, len - 1);
    }
    if (inner) {
      for (let i = 0; i < len; i++) {
        const element = arr[i] as T;
        for (const shrunk of inner(element)) {
          const copy = arr.slice();
          copy[i] = shrunk;
          yield copy;
        }
      }
    }
  };
}

/**
 * Builds a shrinker for fixed-arity tuples. Each position uses its own inner
 * shrinker; only one position is shrunk per emitted candidate.
 */
export function shrinkTuple<T extends readonly unknown[]>(
  ...inners: { [K in keyof T]: Shrinker<T[K]> }
): Shrinker<T> {
  return function* (tuple: T): Iterable<T> {
    for (let i = 0; i < tuple.length; i++) {
      const inner = (inners[i] ?? noShrink) as Shrinker<T[number]>;
      const element = tuple[i] as T[number];
      for (const shrunk of inner(element)) {
        const copy = (tuple as readonly unknown[]).slice() as unknown[];
        copy[i] = shrunk;
        yield copy as unknown as T;
      }
    }
  };
}

/**
 * Builds a shrinker for plain objects. Each field uses its own inner
 * shrinker; only one field is shrunk per emitted candidate.
 */
export function shrinkObject<T extends Record<string, unknown>>(
  inners: { [K in keyof T]: Shrinker<T[K]> }
): Shrinker<T> {
  const keys = Object.keys(inners) as Array<keyof T>;
  return function* (obj: T): Iterable<T> {
    for (const key of keys) {
      const inner = inners[key];
      for (const shrunk of inner(obj[key])) {
        yield { ...obj, [key]: shrunk };
      }
    }
  };
}

/**
 * Greedy bisection-style shrinking search.
 *
 * Starting from `start`, the search asks `shrinker` for candidates. The first
 * candidate for which `fails` returns `true` becomes the new starting point
 * and the process repeats. The search terminates when no candidate fails or
 * when `budget` calls to `fails` have been made; in either case it returns
 * the smallest failing value found so far.
 */
export function shrinkSearch<T>(
  start: T,
  shrinker: Shrinker<T>,
  fails: (x: T) => boolean,
  budget: number
): T {
  let current = start;
  let remaining = budget;
  outer: while (remaining > 0) {
    for (const candidate of shrinker(current)) {
      if (remaining <= 0) return current;
      remaining--;
      if (fails(candidate)) {
        current = candidate;
        continue outer;
      }
    }
    return current;
  }
  return current;
}
