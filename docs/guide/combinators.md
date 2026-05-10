# Combinators reference

A grouped tour of the built-in combinators. Every symbol below is exported on
the `Generators` namespace:

```ts
import { Generators } from 'loki-check';
```

For full type signatures see the [API reference](/api/).

## Core

| Combinator | Purpose |
| ---------- | ------- |
| `pure(x)` | Always yields `x`. |
| `oneOf(g1, g2, ...)` | Picks one of the supplied generators uniformly. |
| `oneOfValues(v1, v2, ...)` | Picks one of the supplied values uniformly. |
| `frequency([w, g], ...)` | Weighted choice between generators. |
| `frequencyOfValues([w, v], ...)` | Weighted choice between values. |
| `sequenceOf(g1, g2, ...)` | Cycles through the supplied generators. |
| `sequenceOfValues(v1, v2, ...)` | Cycles through the supplied values. |
| `choose(min, max)` | Integer in `[min, max]`. |
| `never()` / `fail()` | Always yields `none`. |
| `recursive(rec => ...)` | Builds self-referential generators safely (see `Lazy`). |

## Numbers

| Combinator | Purpose |
| ---------- | ------- |
| `integer({ min?, max? })` | Integer in the given range. Defaults to safe integer range. |
| `float({ min?, max? })` | Uniform float. Defaults to `[0, 1)`. |
| `byte` | Integer in `[0, 255]`. |
| `posInt` / `negInt` | Strictly positive / negative integers. |
| `smallInt` | Integer in `[-100, 100]` — handy for property tests. |
| `nonZeroInt` | Any safe integer except `0`. |

## Booleans

| Combinator | Purpose |
| ---------- | ------- |
| `boolean` | `true` or `false` with equal probability. |

## Strings

Char-level generators:

| Combinator | Purpose |
| ---------- | ------- |
| `asciiChar()` | Printable ASCII char. |
| `unicodeChar()` | BMP char (no lone surrogates). |
| `alphaChar()` / `alphaLowerChar()` / `alphaUpperChar()` | Letter chars. |
| `hexChar()` / `numChar()` / `alphaNumChar()` | Hex, digit, alphanumeric chars. |
| `asciiRange(from, to)` | ASCII code-point range. |

String-level generators:

| Combinator | Purpose |
| ---------- | ------- |
| `stringOf(charGen, { minLength, maxLength })` | String built from `charGen`. |
| `nonEmptyString({ maxLength? })` | At least one char. |
| `asciiString({ ... })` / `unicodeString({ ... })` | Convenience wrappers. |
| `numericString({ ... })` | Digits only. |
| `alphaNumString(length)` | Fixed-length alphanumeric string. |
| `hexString(length)` | Fixed-length hex string. |
| `identifier(maxLength)` | ASCII identifier-shaped string. |
| `uuid()` | RFC 4122-shaped v4 string. |
| `repeat(n, g)` | Concatenates `n` strings drawn from `g`. |
| `concat(g1, g2, ...)` | Concatenates the given string generators. |

## Arrays

| Combinator | Purpose |
| ---------- | ------- |
| `arrayOf(g, maxLength)` | Random length in `[0, maxLength]`. |
| `arrayOfLength(g, n)` | Exactly `n` items (returns `[]` for `n === 0`). |
| `nonEmptyArray(g, maxSize)` | At least one item. |
| `times(n, g)` | Exactly `n` items — drop-in for `arrayOfLength`. |
| `listOf` / `listOfN` / `nonEmptyListOf` | ScalaCheck-affinity aliases. |

## Collections

| Combinator | Purpose |
| ---------- | ------- |
| `setOf(g, { minSize?, maxSize? })` | `Set<T>`. |
| `mapOf(keyG, valueG, { minSize?, maxSize? })` | `Map<K, V>`. |
| `containerOf(factory, g, opts)` | Build any container from an array of items. |

## Tuples and objects

| Combinator | Purpose |
| ---------- | ------- |
| `nTuple(g1, g2, ...)` / `zip(...)` | Fixed-arity tuple. |
| `lift(fn, g1, g2, ...)` | Apply `fn` to a tuple of generated args. |
| `record({ k: gk, ... })` | Plain-object applicative. |
| `object(Class, g1, g2, ...)` | Constructor-applicative. |
| `objectGenerator((a, b) => fn, g1, g2, ...)` | Function-applicative variant. |

## Dates

| Combinator | Purpose |
| ---------- | ------- |
| `date` | `Date` within ±100 years of the epoch. |
| `dateBetween(from, to)` | `Date` in the given range. |
| `isoDateString` | ISO-8601 string from `date`. |

## Picking & shuffling

| Combinator | Purpose |
| ---------- | ------- |
| `pick(n, xs)` | Distinct `n`-element subset of `xs`. |
| `shuffle(xs)` | Full Fisher–Yates permutation. |

## Sizing

| Combinator | Purpose |
| ---------- | ------- |
| `sized(s => g)` | React to the size carried on `Random`. |
| `resize(n, g)` | Run `g` with size fixed to `n`. |

## Optionality & filtering

| Combinator | Purpose |
| ---------- | ------- |
| `option(g, { someProbability? })` | `T \| undefined`. Alias `maybe`. |
| `suchThat(g, p, { retries? })` | Reject draws failing `p`. |
| `g.filter(p, { retries? })` | Method form of `suchThat`. |
