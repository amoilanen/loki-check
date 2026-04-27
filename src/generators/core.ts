import { Maybe, none } from '../maybe.js';
import { Lazy } from '../lazy.js';
import { Generator } from '../generator.js';
import { type Random, defaultRandom } from '../random/index.js';

const pure = Generator.pure;

const neverGenerator: Generator<any> = pure(null);

/**
 * Generator that never yields a value. Useful as the identity for choice-like
 * combinators ({@link oneOf}, {@link frequency}). Aliased as `fail`.
 */
export function never<T>(): Generator<T> {
  return neverGenerator;
}

/**
 * Alias of {@link never}; reads better as the failure case in property-test
 * style code.
 */
export const fail = never;

/**
 * Yields one of `values` chosen uniformly at random. Equivalent to
 * `oneOf(...values.map(pure))`.
 *
 * @example
 * ```ts
 * Generators.oneOfValues('red', 'green', 'blue').sample({ seed: 1 });
 * ```
 */
export function oneOfValues<T>(...values: Array<T>): Generator<T> {
  const generators = values.map(value => pure(value));
  return oneOf(...generators);
}

/**
 * Cycles through `values` deterministically: the i-th draw returns
 * `values[i % values.length]`.
 */
export function sequenceOfValues<T>(...values: Array<T>): Generator<T> {
  const generators = values.map(value => pure(value));
  return sequenceOf(...generators);
}

/**
 * Picks one of the supplied generators uniformly at random and delegates to
 * it. Yields `none` when called with no generators.
 *
 * @example
 * ```ts
 * import { Generators } from 'gen.js';
 *
 * const colour = Generators.oneOf(
 *   Generators.pure('red'),
 *   Generators.pure('green'),
 *   Generators.pure('blue'),
 * );
 * colour.sample({ seed: 1 });
 * ```
 */
export function oneOf<T>(...generators: Array<Generator<T>>): Generator<T> {
  return new (class extends Generator<T> {
    generate(rng: Random = defaultRandom()): Maybe<T> {
      const length = generators.length;
      if (length === 0) {
        return none;
      }
      const idx = rng.nextInt(0, length - 1);
      return (generators[idx] as Generator<T>).generate(rng);
    }
  })();
}

/**
 * Cycles through the supplied generators in order: successive `generate` calls
 * return values from `values[0]`, `values[1]`, …, wrapping around at the end.
 */
export function sequenceOf<T>(...values: Array<Generator<T>>): Generator<T> {
  return new (class extends Generator<T> {
    idx: number = -1;

    generate(rng: Random = defaultRandom()): Maybe<T> {
      if (values.length === 0) {
        return none;
      }
      this.idx = (this.idx + 1) % values.length;
      return (values[this.idx] as Generator<T>).generate(rng);
    }
  })();
}

/**
 * Convenience variant of {@link frequency} that lifts plain values into pure
 * generators. Each tuple is `[weight, value]`.
 */
export function frequencyOfValues<T>(...valueFrequencies: Array<[number, T]>): Generator<T> {
  const generators: Array<[number, Generator<T>]> = valueFrequencies.map(([frequency, value]) =>
    [frequency, pure(value)]);
  return frequency(...generators);
}

function frequenciesToProbabilities(frequencies: Array<number>): Array<number> {
  const totalFrequency = frequencies.reduce((x, y) => x + y);
  return frequencies.map(_ => _ / totalFrequency);
}

function randomIndexWithProbabilityDistribution(probabilities: Array<number>, randomValue: number): number {
  let currentIndex = 0;
  let hasFoundIndex = false;
  let accumulatedProbability = 0;
  while (!hasFoundIndex && (currentIndex < probabilities.length)) {
    accumulatedProbability += probabilities[currentIndex] as number;
    currentIndex += 1;
    if (accumulatedProbability >= randomValue) {
      hasFoundIndex = true;
    }
  }
  return currentIndex - 1;
}

/**
 * Picks one of the supplied generators with weighted probability. Each tuple
 * is `[weight, generator]`; weights are normalised to a probability
 * distribution. Tuples whose weight is `<= 0` are dropped; if no positive
 * weights remain, returns {@link never}.
 *
 * @example
 * ```ts
 * import { Generators } from 'gen.js';
 *
 * // 80% positive integers, 20% negative.
 * const skewed = Generators.frequency(
 *   [4, Generators.posInt],
 *   [1, Generators.negInt],
 * );
 * skewed.sample({ seed: 1 });
 * ```
 */
export function frequency<T>(...generatorFrequences: Array<[number, Generator<T>]>): Generator<T> {
  generatorFrequences = generatorFrequences.filter(([frequency, _]) => frequency > 0);
  if (generatorFrequences.length === 0) {
    return never();
  }
  const frequencies = generatorFrequences.map(([frequency, _]) => frequency);
  const generators = generatorFrequences.map(([_, generator]) => generator);
  const probabilities = frequenciesToProbabilities(frequencies);

  return new (class extends Generator<T> {
    generate(rng: Random = defaultRandom()): Maybe<T> {
      const generatorIdx = randomIndexWithProbabilityDistribution(probabilities, rng.next());
      if (generatorIdx >= 0) {
        return (generators[generatorIdx] as Generator<T>).generate(rng);
      }
      return none;
    }
  })();
}

/**
 * Builds a recursive generator. The supplied `block` receives a {@link Lazy}
 * thunk that, when forced, yields a fresh recursive instance — use it to
 * describe self-referential shapes (trees, lists, JSON-like values).
 *
 * @example
 * ```ts
 * import { Generators } from 'gen.js';
 *
 * type Tree = { value: number; children: Tree[] };
 * const tree = Generators.recursive<Tree>(self =>
 *   Generators.record({
 *     value: Generators.integer(),
 *     children: Generators.arrayOf(Generators.sized(s =>
 *       s <= 0 ? Generators.pure({ value: 0, children: [] }) : self.force()
 *     ), 3),
 *   })
 * );
 * ```
 */
export function recursive<T>(block: (recurse: Lazy<Generator<T>>) => Generator<T>): Generator<T> {
  return block(new Lazy(() => recursive(block)));
}
