import { type Maybe, Some, none } from '../maybe.js';
import { Generator, type Shrinker } from '../generator.js';
import { type Random, defaultRandom } from '../random/index.js';
import * as Generators from './index.js';

const DEFAULT_MAX_LENGTH = 100;

const PRINTABLE_ASCII_START = 0x20;
const PRINTABLE_ASCII_END = 0x7e;

const SURROGATE_START = 0xd800;
const SURROGATE_END = 0xdfff;
const BMP_END = 0xffff;
const NON_SURROGATE_BMP_COUNT = (SURROGATE_START - 0) + (BMP_END - SURROGATE_END);

/**
 * Returns the first code point of `char` (0 if `char` is empty).
 */
export function asciiCode(char: string): number {
  return char.codePointAt(0) ?? 0;
}

const capitalLettersASCIIStart = asciiCode('A');
const capitalLettersASCIIEnd = asciiCode('Z');

const lettersASCIIStart = asciiCode('a');
const lettersASCIIEnd = asciiCode('z');

const digitsASCIIStart = asciiCode('0');
const digitsASCIIEnd = asciiCode('9');

/**
 * Yields shorter and lexicographically smaller candidate strings, used as the
 * default shrinker for string generators.
 */
export function* shrinkString(value: string): Iterable<string> {
  if (value.length === 0) return;
  yield '';
  if (value.length > 1) {
    yield value.slice(0, Math.floor(value.length / 2));
    for (let i = 0; i < value.length; i++) {
      yield value.slice(0, i) + value.slice(i + 1);
    }
  }
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code > PRINTABLE_ASCII_START) {
      yield value.slice(0, i) + String.fromCharCode(PRINTABLE_ASCII_START) + value.slice(i + 1);
    }
  }
}

const stringShrinker: Shrinker<string> = shrinkString;

function attachStringShrinker<G extends Generator<string>>(g: G): G {
  g.shrinker = stringShrinker as Shrinker<any>;
  return g;
}

/**
 * Generates a single character whose code point lies in `[from, to]` (inclusive).
 */
export function asciiRange(from: number, to: number): Generator<string> {
  return Generators.choose(from, to)
    .map((value: number) => String.fromCharCode(Math.ceil(value)));
}

/**
 * Generates a single ASCII letter (`a-z` or `A-Z`).
 */
export function alphaChar(): Generator<string> {
  return Generators.oneOf(alphaLowerChar(), alphaUpperChar());
}

/**
 * Generates a single lowercase ASCII letter (`a-z`).
 */
export function alphaLowerChar(): Generator<string> {
  return asciiRange(lettersASCIIStart, lettersASCIIEnd);
}

/**
 * Generates a single uppercase ASCII letter (`A-Z`).
 */
export function alphaUpperChar(): Generator<string> {
  return asciiRange(capitalLettersASCIIStart, capitalLettersASCIIEnd);
}

/**
 * Generates a single hexadecimal digit (`0-9` or `A-F`).
 */
export function hexChar(): Generator<string> {
  return Generators.oneOf(
    numChar(),
    asciiRange(
      asciiCode('A'),
      asciiCode('F')
    )
  );
}

/**
 * Generates a single decimal digit (`0-9`).
 */
export function numChar(): Generator<string> {
  return asciiRange(digitsASCIIStart, digitsASCIIEnd);
}

/**
 * Generates a single alphanumeric character (`a-z`, `A-Z`, or `0-9`).
 */
export function alphaNumChar(): Generator<string> {
  return Generators.oneOf(alphaChar(), numChar());
}

/**
 * Generates a single printable ASCII character (`0x20`–`0x7E`).
 */
export function asciiChar(): Generator<string> {
  return asciiRange(PRINTABLE_ASCII_START, PRINTABLE_ASCII_END);
}

/**
 * Generates a single Unicode BMP character, skipping the surrogate range
 * (`0xD800`–`0xDFFF`).
 */
export function unicodeChar(): Generator<string> {
  return new (class extends Generator<string> {
    generate(rng: Random = defaultRandom()): Maybe<string> {
      const idx = rng.nextInt(0, NON_SURROGATE_BMP_COUNT - 1);
      const code = idx < SURROGATE_START ? idx : idx + (SURROGATE_END - SURROGATE_START + 1);
      return new Some(String.fromCharCode(code));
    }
  })();
}

/**
 * Concatenates `numberOfTimes` draws from `stringGenerator`. `numberOfTimes`
 * less than or equal to zero yields the empty string.
 */
export function repeat(numberOfTimes: number, stringGenerator: Generator<string>): Generator<string> {
  return attachStringShrinker(
    Generators.times(numberOfTimes, stringGenerator).map((_: string[]) => _.join(''))
  );
}

/**
 * Concatenates the values produced by each provided string generator, in order.
 * Returns the empty string when called with no arguments.
 */
export function concat(...generators: Array<Generator<string>>): Generator<string> {
  if (generators.length === 0) {
    return attachStringShrinker(Generator.pure(''));
  }
  return attachStringShrinker(
    Generators.nTuple(...generators).map((values: string[]) => values.join(''))
  );
}

/**
 * Options accepted by length-bounded string generators.
 */
export interface StringOptions {
  /** Inclusive lower bound on the generated string's length. Defaults to `0`. */
  minLength?: number;
  /** Inclusive upper bound on the generated string's length. Defaults to `100`. */
  maxLength?: number;
}

/**
 * Options accepted by {@link nonEmptyString}.
 */
export interface NonEmptyStringOptions {
  /** Inclusive upper bound on the generated string's length. Defaults to `100`. */
  maxLength?: number;
  /** Per-character generator. Defaults to printable ASCII. */
  charGen?: Generator<string>;
}

function resolveLengthBounds(opts: StringOptions, defaultMin: number): { min: number; max: number } | null {
  const rawMin = opts.minLength ?? defaultMin;
  const rawMax = opts.maxLength ?? Math.max(rawMin, DEFAULT_MAX_LENGTH);
  const min = Math.max(0, Math.floor(rawMin));
  const max = Math.floor(rawMax);
  if (max < min) return null;
  return { min, max };
}

/**
 * Generates a string of length drawn uniformly from `[minLength, maxLength]`,
 * with each character drawn independently from `charGen`.
 *
 * @example
 * ```ts
 * Generators.stringOf(Generators.alphaLowerChar(), { minLength: 3, maxLength: 8 })
 *   .sample({ seed: 42 });
 * ```
 */
export function stringOf(charGen: Generator<string>, opts: StringOptions = {}): Generator<string> {
  const bounds = resolveLengthBounds(opts, 0);
  return attachStringShrinker(new (class extends Generator<string> {
    generate(rng: Random = defaultRandom()): Maybe<string> {
      if (bounds === null) return none;
      const len = rng.nextInt(bounds.min, bounds.max);
      let out = '';
      for (let i = 0; i < len; i++) {
        const m = charGen.generate(rng);
        if (!m.isDefined) return none;
        out += m.value;
      }
      return new Some(out);
    }
  })());
}

/**
 * Generates a non-empty string. The character generator and maximum length can
 * be overridden via `opts`; defaults to printable ASCII characters.
 */
export function nonEmptyString(opts: NonEmptyStringOptions = {}): Generator<string> {
  const charGen = opts.charGen ?? asciiChar();
  const maxLength = opts.maxLength ?? DEFAULT_MAX_LENGTH;
  return stringOf(charGen, { minLength: 1, maxLength });
}

/**
 * Generates a string of printable ASCII characters (`0x20`–`0x7E`).
 */
export function asciiString(opts: StringOptions = {}): Generator<string> {
  return stringOf(asciiChar(), opts);
}

/**
 * Generates a string of Unicode BMP characters, excluding the surrogate range.
 */
export function unicodeString(opts: StringOptions = {}): Generator<string> {
  return stringOf(unicodeChar(), opts);
}

/**
 * Generates a string of decimal digits (`0`–`9`).
 */
export function numericString(opts: StringOptions = {}): Generator<string> {
  return stringOf(numChar(), opts);
}

/**
 * Generates an alphanumeric string of exactly `length` characters.
 */
export function alphaNumString(length: number): Generator<string> {
  return repeat(length, alphaNumChar());
}

/**
 * Generates a hexadecimal string of exactly `length` characters (`0-9`, `A-F`).
 */
export function hexString(length: number): Generator<string> {
  return repeat(length, hexChar());
}

/**
 * Generates an identifier-shaped string: a lowercase letter followed by up to
 * `maxLength - 1` alphanumeric characters. Yields `none` when `maxLength <= 0`.
 */
export function identifier(maxLength: number): Generator<string> {
  return Generators.choose(1, maxLength)
    .map((len: number) => Math.ceil(len))
    .flatMap((identifierLength: number) =>
      alphaNumString(identifierLength - 1).flatMap((suffix: string) =>
        alphaLowerChar().map((prefix: string) => prefix + suffix)
      )
    );
}

/**
 * Generates an RFC 4122 version-4 UUID-shaped string.
 */
export function uuid(): Generator<string> {
  const uuidVersion = 4;
  const variant = Generators.oneOfValues('8', '9', 'A', 'B');

  const blocks: Array<Generator<string>> = [
    hexString(8),
    hexString(4),
    hexString(3).map((_: string) => `${uuidVersion}${_}`),
    hexString(3).flatMap((_: string) => variant.map((v: string) => `${v}${_}`)),
    hexString(12)
  ];
  return Generators.nTuple(...blocks).map((_: string[]) => _.join('-'));
}
