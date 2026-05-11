# Combinators reference

A grouped tour of every built-in combinator, with idiomatic snippets. All
symbols below are exported on the `Generators` namespace:

```ts
import { Generators } from 'loki-check';
```

For full type signatures, see the [API reference](/api/).

## Method-form combinators

These four methods live on every `Generator<T>`:

| Method | Purpose | Notes |
| ------ | ------- | ----- |
| `g.map(f)` | `Generator<U>` whose values are `f(x)` for each `x` drawn. | Cheap. Use for pure value transformations. |
| `g.flatMap(f)` | Pick the next generator based on the drawn value. | Monadic bind. Use for dependent draws. |
| `g.filter(p, { retries? })` | Reroll until the predicate holds (or yield `none`). | Keep predicates cheap and high-acceptance. See [Recipes](./recipes.md). |
| `g.withShrinker(s)` | Attach a custom shrinker. Does not change value-generation. | See the [Shrinking guide](./shrinking.md). |

```ts
const evenInts  = Generators.integer().map(n => n * 2);
const longArr   = Generators.integer({ min: 1, max: 5 })
                    .flatMap(n => Generators.arrayOfLength(Generators.integer(), n));
const positives = Generators.integer().filter(n => n > 0);
```

## Core combinators

| Combinator | Purpose |
| ---------- | ------- |
| `pure(x)` | Always yields `x`. The applicative unit. Routes `null` / `undefined` to `none`. |
| `constant(x)` | Always yields `x`, **including** `null` and `undefined`. Use when you need to generate an "absent" sentinel as a real value. |
| `oneOf(g1, g2, ...)` | Picks one of the supplied generators uniformly. |
| `oneOfValues(v1, v2, ...)` | Picks one of the supplied values uniformly. |
| `frequency([w, g], ...)` | Weighted choice between generators. |
| `frequencyOfValues([w, v], ...)` | Weighted choice between values. |
| `sequenceOf(g1, g2, ...)` | Cycles through the supplied generators deterministically. |
| `sequenceOfValues(v1, v2, ...)` | Cycles through the supplied values deterministically. |
| `choose(min, max)` | Float in `[min, max)`. |
| `never()` / `fail()` | Always yields `none`. The neutral element for choice combinators. |
| `recursive(rec => ...)` | Builds self-referential generators safely via a `Lazy` thunk. |

```ts
// 80% positive, 20% negative. Common shape for "mostly-valid" inputs.
const skewed = Generators.frequency(
  [4, Generators.posInt],
  [1, Generators.negInt],
);
```

### `pure` vs `constant`

`pure` is the monad/applicative unit and treats `null` / `undefined` as
"no value": `Generators.pure(null).generate()` is `none`. When you
actually want `null` or `undefined` as a *generated value* (for example,
as a branch of a JSON-shaped union), reach for `constant` instead:

```ts
const jsonLeaf = Generators.oneOf(
  Generators.constant(null),
  Generators.boolean,
  Generators.integer(),
  Generators.asciiString({ maxLength: 6 }),
);
```

## Numbers

| Combinator | Purpose |
| ---------- | ------- |
| `integer({ min?, max? })` | Integer in the given range. Defaults to the signed 32-bit range. |
| `float({ min?, max? })` | Uniform float. Defaults to `[0, 1)`. |
| `byte` | Integer in `[0, 255]`. |
| `posInt` / `negInt` | Strictly positive / negative integers. |
| `smallInt` | Integer in `[-100, 100]`. Handy for property tests. |
| `nonZeroInt` | Any safe integer except `0`. |

All number generators ship with a shrinker that walks toward `0`.

## Booleans

| Combinator | Purpose |
| ---------- | ------- |
| `boolean` | `true` or `false` with equal probability. Shrinks toward `false`. |

## Strings

### Character-level

| Combinator | Purpose |
| ---------- | ------- |
| `asciiChar()` | Printable ASCII char (`0x20`–`0x7E`). |
| `unicodeChar()` | BMP char, excluding lone surrogates. |
| `alphaChar()` / `alphaLowerChar()` / `alphaUpperChar()` | Letter chars. |
| `hexChar()` / `numChar()` / `alphaNumChar()` | Hex, digit, alphanumeric chars. |
| `asciiRange(from, to)` | ASCII code-point range. |

### String-level

| Combinator | Purpose |
| ---------- | ------- |
| `stringOf(charGen, { minLength, maxLength })` | String built from `charGen`. |
| `nonEmptyString({ maxLength?, charGen? })` | At least one char (printable ASCII by default). |
| `asciiString(opts)` / `unicodeString(opts)` | Convenience wrappers. |
| `numericString(opts)` | Digits only. |
| `alphaNumString(length)` | Fixed-length alphanumeric string. |
| `hexString(length)` | Fixed-length hex string. |
| `identifier(maxLength)` | ASCII identifier-shaped string (lowercase letter + alphanum). |
| `uuid()` | RFC 4122 v4-shaped string (deterministic, see [the UUID example](/examples/uuid)). |
| `repeat(n, g)` | Concatenates `n` strings drawn from `g`. |
| `concat(g1, g2, ...)` | Concatenates the given string generators. Returns `''` for zero args. |

String generators carry a shrinker that produces shorter and lexicographically
smaller candidates.

## Arrays

| Combinator | Purpose |
| ---------- | ------- |
| `arrayOf(g, maxLength)` | Array of random length in `[0, maxLength]`. |
| `arrayOfLength(g, n)` | Exactly `n` items (returns `[]` for `n === 0`). |
| `nonEmptyArray(g, maxSize)` | At least one item. |
| `times(n, g)` | Drop-in for `arrayOfLength`. |
| `listOf` / `listOfN` / `nonEmptyListOf` | ScalaCheck-affinity aliases. |

Array generators inherit the element-level shrinker, then shrink toward
shorter arrays. Counter-examples are minimised by removing elements and
shrinking individual entries simultaneously.

## Collections

| Combinator | Purpose |
| ---------- | ------- |
| `setOf(g, { minSize?, maxSize? })` | `Set<T>`. Duplicates are retried up to a budget; if the budget is exhausted, the generator yields `none`. |
| `mapOf(keyG, valueG, { minSize?, maxSize? })` | `Map<K, V>`. Key collisions are retried up to a budget. |
| `containerOf(factory, g, opts)` | Build any container from an array of items via `factory`. |

## Tuples and objects

| Combinator | Purpose |
| ---------- | ------- |
| `nTuple(g1, g2, ...)` / `zip(...)` | Fixed-arity tuple. Each component is drawn from the corresponding generator. |
| `lift(fn, g1, g2, ...)` | Apply `fn` to a tuple of generated args (typed). |
| `record({ k: gk, ... })` | Plain-object applicative; result is `{ k: T, ... }`. |
| `object(Class, g1, g2, ...)` | Constructor-applicative; result is `new Class(arg1, arg2, ...)`. |
| `objectGenerator((a, b) => fn, g1, g2, ...)` | Function-applicative variant (untyped args). |

```ts
// Three flavours of "build a product".
const point  = Generators.record({ x: Generators.integer(), y: Generators.integer() });
const pointI = Generators.object(Point, Generators.integer(), Generators.integer());
const sum    = Generators.lift((a: number, b: number) => a + b,
                                Generators.integer(), Generators.integer());
```

## Dates

| Combinator | Purpose |
| ---------- | ------- |
| `date` | `Date` within ±100 years of the epoch. Shrinks toward `new Date(0)`. |
| `dateBetween(from, to)` | `Date` in the inclusive range. |
| `isoDateString` | ISO-8601 string derived from `date`. |

## Picking & shuffling

| Combinator | Purpose |
| ---------- | ------- |
| `pick(n, xs)` | Distinct `n`-element subset of `xs` via partial Fisher–Yates. |
| `shuffle(xs)` | Full Fisher–Yates permutation of `xs`. |

## Sizing

| Combinator | Purpose |
| ---------- | ------- |
| `sized(s => g)` | React to the size carried on `Random`. |
| `resize(n, g)` | Run `g` with size fixed to `n`. |

The size hint defaults to `100`. Use it to scale recursion depth, collection
length, or numeric magnitude. See [Concepts > Sized generation](./concepts.md#sized-generation).

## Optionality & filtering

| Combinator | Purpose |
| ---------- | ------- |
| `option(g, { someProbability? })` | `T \| undefined`. Default probability `0.75`. Alias `maybe`. |
| `suchThat(g, p, { retries? })` | Standalone form of `g.filter(p, ...)`. |

## Cheatsheet: choosing the right product combinator

| You want... | Use |
| --------- | --- |
| A plain object with named fields | `record({ k: g })` |
| An instance of a class | `object(Class, g1, g2, ...)` |
| A value derived from generated args | `lift(fn, g1, g2, ...)` or `objectGenerator(fn, g1, ...)` |
| A fixed-arity tuple | `nTuple(g1, g2, ...)` |

| You want... | Use |
| --------- | --- |
| Random-length collection | `arrayOf(g, maxLength)` / `setOf(g, opts)` / `mapOf(k, v, opts)` |
| Exactly N items | `arrayOfLength(g, n)` / `times(n, g)` |
| At least one item | `nonEmptyArray(g, max)` / `nonEmptyString({ ... })` |

| You want... | Use |
| --------- | --- |
| Pick from a fixed list | `oneOfValues(...)` (uniform) / `frequencyOfValues(...)` (weighted) |
| Pick from a list of generators | `oneOf(...)` / `frequency([w, g], ...)` |
| Conditional / dependent draw | `g.flatMap(x => nextGen(x))` |
| Reject some draws | `g.filter(p)` or `suchThat(g, p)` |

| You want... | Use |
| --------- | --- |
| Self-referential shape | `recursive(self => ...)` + `sized` |
| Bounded recursion depth | `resize(n, g)` with `n` decreasing toward leaves |
