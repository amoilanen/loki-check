import { Generator, type Shrinker } from '../generator.js';
import { type Maybe, Some, none } from '../maybe.js';
import { type Random, defaultRandom } from '../random/index.js';

/**
 * Sizing options shared by {@link setOf}, {@link mapOf} and {@link containerOf}.
 */
export interface SizeOptions {
  /** Inclusive lower bound on the resulting container size. Defaults to `0`. */
  minSize?: number;
  /** Inclusive upper bound on the resulting container size. Defaults to `10`. */
  maxSize?: number;
}

interface ResolvedSizes {
  minSize: number;
  maxSize: number;
}

function resolveSizes(opts: SizeOptions | undefined, kind: string): ResolvedSizes | null {
  const minSize = opts?.minSize ?? 0;
  const maxSize = opts?.maxSize ?? 10;
  if (!Number.isFinite(minSize) || !Number.isFinite(maxSize)) {
    throw new RangeError(`${kind}: size bounds must be finite, received [${minSize}, ${maxSize}]`);
  }
  if (minSize < 0 || maxSize < 0) {
    return null;
  }
  if (minSize > maxSize) {
    return null;
  }
  return { minSize: Math.floor(minSize), maxSize: Math.floor(maxSize) };
}

function chooseSize(rng: Random, sizes: ResolvedSizes): number {
  if (sizes.minSize === sizes.maxSize) return sizes.minSize;
  return rng.nextInt(sizes.minSize, sizes.maxSize);
}

/** Default retry budget when collapsing duplicates would drop below `minSize`. */
const DEDUP_RETRIES = 100;

/**
 * Default shrinker for sets. Yields smaller sets approaching the empty set.
 */
export function* shrinkSet<T>(set: ReadonlySet<T>): Iterable<Set<T>> {
  const items = [...set];
  if (items.length === 0) return;
  yield new Set();
  let n = Math.floor(items.length / 2);
  while (n > 0 && n < items.length) {
    yield new Set(items.slice(0, n));
    const next = Math.floor(n / 2);
    if (next === n) break;
    n = next;
  }
  if (items.length > 1) {
    yield new Set(items.slice(0, items.length - 1));
  }
}

/**
 * Default shrinker for maps. Yields smaller maps approaching the empty map.
 */
export function* shrinkMap<K, V>(map: ReadonlyMap<K, V>): Iterable<Map<K, V>> {
  const entries = [...map.entries()];
  if (entries.length === 0) return;
  yield new Map();
  let n = Math.floor(entries.length / 2);
  while (n > 0 && n < entries.length) {
    yield new Map(entries.slice(0, n));
    const next = Math.floor(n / 2);
    if (next === n) break;
    n = next;
  }
  if (entries.length > 1) {
    yield new Map(entries.slice(0, entries.length - 1));
  }
}

const setShrinker: Shrinker<Set<unknown>> = shrinkSet as Shrinker<Set<unknown>>;
const mapShrinker: Shrinker<Map<unknown, unknown>> = shrinkMap as Shrinker<Map<unknown, unknown>>;

/**
 * Generates a {@link Set} populated by drawing values from `g`.
 *
 * Duplicates that collapse under the size requirement are retried up to a
 * bounded budget; if that budget is exhausted before `minSize` distinct values
 * are seen, the generator yields `none`.
 *
 * @example
 * ```ts
 * Generators.setOf(Generators.integer({ min: 0, max: 9 }), { minSize: 1, maxSize: 5 })
 *   .sample({ seed: 'k' });
 * ```
 */
export function setOf<T>(g: Generator<T>, opts: SizeOptions = {}): Generator<Set<T>> {
  const sizes = resolveSizes(opts, 'setOf');
  return new (class extends Generator<Set<T>> {
    override shrinker: Shrinker<any> = setShrinker as Shrinker<any>;
    generate(rng: Random = defaultRandom()): Maybe<Set<T>> {
      if (sizes === null) return none;
      const target = chooseSize(rng, sizes);
      const out = new Set<T>();
      let misses = 0;
      while (out.size < target) {
        const m = g.generate(rng);
        if (!m.isDefined) return none;
        const before = out.size;
        out.add(m.value);
        if (out.size === before) {
          misses++;
          if (misses >= DEDUP_RETRIES) {
            return out.size >= sizes.minSize ? new Some(out) : none;
          }
        }
      }
      return new Some(out);
    }
  })();
}

/**
 * Generates a {@link Map} whose keys are drawn from `keyG` and values from `valueG`.
 *
 * Key collisions are retried up to a bounded budget; if the budget is
 * exhausted before `minSize` distinct keys are seen, the generator yields `none`.
 */
export function mapOf<K, V>(
  keyG: Generator<K>,
  valueG: Generator<V>,
  opts: SizeOptions = {}
): Generator<Map<K, V>> {
  const sizes = resolveSizes(opts, 'mapOf');
  return new (class extends Generator<Map<K, V>> {
    override shrinker: Shrinker<any> = mapShrinker as Shrinker<any>;
    generate(rng: Random = defaultRandom()): Maybe<Map<K, V>> {
      if (sizes === null) return none;
      const target = chooseSize(rng, sizes);
      const out = new Map<K, V>();
      let misses = 0;
      while (out.size < target) {
        const k = keyG.generate(rng);
        if (!k.isDefined) return none;
        const v = valueG.generate(rng);
        if (!v.isDefined) return none;
        if (out.has(k.value)) {
          misses++;
          if (misses >= DEDUP_RETRIES) {
            return out.size >= sizes.minSize ? new Some(out) : none;
          }
          continue;
        }
        out.set(k.value, v.value);
      }
      return new Some(out);
    }
  })();
}

/**
 * Generic container generator. Draws an array of items from `g` whose size is
 * within `opts`, then converts it via `factory`.
 *
 * @example
 * ```ts
 * const setG = Generators.containerOf((xs) => new Set(xs), Generators.integer(), { minSize: 1, maxSize: 4 });
 * ```
 */
export function containerOf<T, C>(
  factory: (items: T[]) => C,
  g: Generator<T>,
  opts: SizeOptions = {}
): Generator<C> {
  const sizes = resolveSizes(opts, 'containerOf');
  return new (class extends Generator<C> {
    generate(rng: Random = defaultRandom()): Maybe<C> {
      if (sizes === null) return none;
      const size = chooseSize(rng, sizes);
      const items: T[] = [];
      for (let i = 0; i < size; i++) {
        const m = g.generate(rng);
        if (!m.isDefined) return none;
        items.push(m.value);
      }
      return new Some(factory(items));
    }
  })();
}
