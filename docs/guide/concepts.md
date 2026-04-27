# Concepts

## A `Generator<T>` is a recipe

A `Generator<T>` describes **how** to produce values of type `T`. It does not
hold any values until you ask for one.

```ts
import { Generators, type Generator } from 'gen.js';

const g: Generator<number> = Generators.integer({ min: 0, max: 9 });

g.sample();   // 4
g.sample();   // 7
g.sample();   // 0
```

Internally a generator is a function from a [`Random`](/api/) source to a
`Maybe<T>`. The `Maybe` carrier means that a generator can legitimately decline
to produce a value (e.g. `suchThat` ran out of retries) — `sample` turns that
into an exception, while the lower-level `g.generate(rng)` lets you handle the
`none` case yourself.

## Composing with `map` and `flatMap`

The two primary combinators on every generator:

```ts
import { Generators } from 'gen.js';

// map : (T -> U) -> Generator<U>
const evenInts = Generators.integer({ min: 0, max: 100 }).map(n => n * 2);

// flatMap : (T -> Generator<U>) -> Generator<U>
const arrayOfRandomLength = Generators.integer({ min: 1, max: 5 })
  .flatMap(n => Generators.arrayOfLength(Generators.integer(), n));
```

`map` reshapes a value; `flatMap` chooses the next generator based on the
produced value. With `map` and `flatMap` (plus `pure`) you have everything you
need to write any generator from scratch — every other combinator is a
convenience built on these.

## Sampling vs generating

Two ways to consume a generator:

| Method | Returns | When the generator yields nothing |
| ------ | ------- | --------------------------------- |
| `g.sample(opts?)` | `T` | throws `GenError` |
| `g.sampleN(n, opts?)` | `T[]` | throws `GenError` |
| `g.generate(rng?)` | `Maybe<T>` | returns `none` (no exception) |

Use `sample` / `sampleN` for tests, fixtures, and exploratory work. Use
`generate` when you are building your own combinators or when you want explicit
control over how empty draws are handled.

## Seeding and reproducibility

Every entry point that draws values accepts a seed:

```ts
const xs = Generators.arrayOf(Generators.integer(), 10).sample({ seed: 42 });
const ys = Generators.arrayOf(Generators.integer(), 10).sample({ seed: 42 });
// xs and ys are identical, every time, on every machine
```

Under the hood the seed (number or string) is passed to `fromSeed`, which
produces a `Random` instance backed by a [`mulberry32`](https://github.com/bryc/code/blob/master/jshash/PRNGs.md#mulberry32)
PRNG. String seeds are first hashed via `cyrb53`. If you do not pass a seed,
the runtime uses an unseeded `Random` backed by `Math.random()`.

When `forAll` finds a counter-example it always reports the seed that produced
it — copy that seed into the next run and you are debugging the exact same
inputs.

## Shrinking

Every built-in combinator carries a default **shrinker**: a function that, given
a failing value, lazily produces "smaller" candidates. When `forAll` finds a
counter-example it shrinks toward the simplest failing input before reporting,
so a 1000-element array with one bad item becomes a single-element array.

You can override or attach a custom shrinker on any generator with
`g.withShrinker(myShrinker)`.

## Sized generation

Some combinators (notably `arrayOf` without an explicit length) draw from a
**size** carried on the `Random` source. The default size is `100`. Use
`Generators.sized(s => ...)` to react to it, or
`Generators.resize(n, gen)` to fix it for a sub-generator.

```ts
import { Generators } from 'gen.js';

const tinyArrays = Generators.resize(5, Generators.arrayOf(Generators.integer()));
```
