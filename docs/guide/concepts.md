# Concepts

The whole API surface of `check-loki` is built on a handful of ideas. Once you
have them in your head, every combinator in the library reads as a thin
convenience over the same machinery.

## A `Generator<T>` is a recipe

A `Generator<T>` describes **how** to produce values of type `T`. It does not
hold any values until you ask for one.

```ts
import { Generators, type Generator } from 'check-loki';

const g: Generator<number> = Generators.integer({ min: 0, max: 9 });

g.sample();   // 4
g.sample();   // 7
g.sample();   // 0
```

Internally, a generator is a function from a [`Random`](/api/) source to a
`Maybe<T>`:

```ts
abstract class Generator<T> {
  abstract generate(rng?: Random): Maybe<T>;
}
```

That single method is *all* of the contract. Every combinator in the library
builds on top of it.

## Why `Maybe<T>` matters

A generator can legitimately decline to produce a value:

- `Generators.suchThat(g, p)` may run out of retries.
- `Generators.never()` always declines.
- A child generator that exhausts its budget cascades up.

`Maybe<T>` (with `Some<T>` and the singleton `none`) makes that explicit:

```ts
const g = Generators.integer().filter(n => n > 1_000_000_000, { retries: 5 });

const m = g.generate(/* rng */);
if (m.isDefined) {
  // m.value is the produced value
} else {
  // generator exhausted, handled deliberately
}
```

`sample` and `sampleN` collapse `none` into a thrown `GenError` for ergonomics.
When you want to *handle* the empty case (for example when writing your own
combinator), use `generate` directly.

## Composing with `map` and `flatMap`

The two primary methods on every generator:

```ts
import { Generators } from 'check-loki';

// map : Generator<T> -> (T -> U) -> Generator<U>
const evenInts = Generators.integer({ min: 0, max: 100 }).map(n => n * 2);

// flatMap : Generator<T> -> (T -> Generator<U>) -> Generator<U>
const arrayOfRandomLength = Generators.integer({ min: 1, max: 5 })
  .flatMap(n => Generators.arrayOfLength(Generators.integer(), n));
```

- **`map`** reshapes a value. Use it when the new value depends on the old one,
  but the *shape* of the randomness does not change.
- **`flatMap`** chooses the *next generator* based on the produced value. Use
  it when the next draw depends on the previous one. Variable-length
  collections, conditional shapes, dependent fields.

With `map`, `flatMap` and `pure` you have everything you need to write any
generator from scratch. Every other combinator in the library is a convenience
built on top of them. This is the same algebraic structure as `Promise`,
`Array` and `Maybe` itself. If you have used those, you already know how
generators compose.

### A worked example: `nTuple` from first principles

`nTuple` looks magical until you derive it yourself:

```ts
function pair<A, B>(ga: Generator<A>, gb: Generator<B>): Generator<[A, B]> {
  return ga.flatMap(a => gb.map(b => [a, b] as [A, B]));
}
```

That is the entire applicative product, built from `flatMap` + `map`. The
built-in `Generators.nTuple(...)` does the same thing, but generalised to
arbitrary arity and with a proper shrinker attached.

## Applicative composition

`record`, `object`, `objectGenerator`, `lift` and `nTuple` are all
**applicative** combinators: they draw one independent value per inner
generator and combine the results.

```ts
// Plain object
const point = Generators.record({
  x: Generators.integer(),
  y: Generators.integer(),
});

// Constructor
class Point { constructor(public x: number, public y: number) {} }
const pointInstances = Generators.object(Point,
  Generators.integer(), Generators.integer());

// Function
const sumPoint = Generators.lift(
  (x: number, y: number) => ({ sum: x + y }),
  Generators.integer(), Generators.integer(),
);

// Tuple
const pair = Generators.nTuple(Generators.integer(), Generators.integer());
```

Pick the variant that matches the value you want back. They all share the same
underlying mechanism, and they all return `none` if any inner generator yields
`none`.

## Sampling vs generating

Two ways to consume a generator:

| Method | Returns | When the generator yields nothing |
| ------ | ------- | --------------------------------- |
| `g.sample(opts?)` | `T` | throws `GenError` |
| `g.sampleN(n, opts?)` | `T[]` | throws `GenError` |
| `g.generate(rng?)` | `Maybe<T>` | returns `none` (no exception) |

Use `sample` / `sampleN` for tests, fixtures and exploratory work. Use
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
produces a `Random` instance backed by a
[`mulberry32`](https://github.com/bryc/code/blob/master/jshash/PRNGs.md#mulberry32)
PRNG. String seeds are first hashed via `cyrb53`. If you do not pass a seed,
the runtime uses an unseeded `Random` backed by `Math.random()`.

When `forAll` finds a counter-example it always reports the seed that produced
it. Copy that seed into the next run and you are debugging the exact same
inputs.

### Sharing an `rng`

Two calls to `g.sample({ seed: 42 })` each create a *fresh* `Random`, so they
both produce the same first value. If you want a single continuous stream
across many calls, share the `rng`:

```ts
import { fromSeed, Generators } from 'check-loki';

const rng = fromSeed(42);
const a = Generators.integer().sample({ rng });
const b = Generators.integer().sample({ rng });   // different from `a`
```

## Shrinking

Every built-in combinator carries a default **shrinker**: a function that,
given a failing value, lazily produces "smaller" candidates. When `forAll`
finds a counter-example, it shrinks toward the simplest failing input before
reporting, so a 1000-element array with one bad item becomes a single-element
array.

```ts
type Shrinker<T> = (value: T) => Iterable<T>;
```

Shrinkers compose with the same applicative structure as generators.
`record` shrinks each field, `nTuple` shrinks each component, `arrayOf`
shrinks toward shorter prefixes, and so on. See the
[Shrinking guide](./shrinking.md) for how to override or attach your own.

You can attach a custom shrinker on any generator with `g.withShrinker(...)`,
or disable shrinking entirely on a `forAll` call with `{ shrink: false }`.

## Sized generation

Some combinators react to a **size** hint carried on the `Random` source.
The default size is `100`. Use `Generators.sized(s => ...)` to read it, or
`Generators.resize(n, gen)` to fix it for a sub-generator.

Size is the natural way to control recursion depth:

```ts
import { Generators, type Generator } from 'check-loki';

type Tree = { value: number; children: Tree[] };

const tree: Generator<Tree> = Generators.recursive<Tree>(self =>
  Generators.sized(size =>
    size <= 0
      ? Generators.record<Tree>({
          value: Generators.integer(),
          children: Generators.pure([] as Tree[]),
        })
      : Generators.record<Tree>({
          value: Generators.integer(),
          children: Generators.resize(
            Math.floor(size / 2),
            Generators.arrayOf(self.force(), 3),
          ),
        })
  )
);
```

The pattern of halving the size on every recursion guarantees termination
and gives you visibly different shapes for different starting sizes.

## Recursion safely

Self-referential generators are tricky in any eager-evaluation language: at
construction time the recursive call has not been built yet. `check-loki`
solves this with `recursive(block)` plus a `Lazy<T>` thunk:

```ts
type LinkedList<T> = { head: T; tail: LinkedList<T> } | null;

const list: Generator<LinkedList<number>> = Generators.recursive(self =>
  Generators.frequency(
    [1, Generators.constant(null as LinkedList<number>)],
    [3, Generators.record<{ head: number; tail: LinkedList<number> }>({
      head: Generators.integer(),
      tail: self.force(),
    })],
  )
);
```

`self.force()` defers the recursive `recursive(block)` call until the *draw*,
not until *construction*. That is the key to writing recursive generators
without exploding the call stack at module load.

## Where the pieces fit

```
sample / sampleN                     <-- user-facing convenience
   |
   v
g.generate(rng) : Maybe<T>           <-- the actual contract
   |
   uses
   v
Random  ----- seed --->  mulberry32
        ----- size --->  carried alongside the stream
```

Once you can read that, everything else in the API is a thin sugar on top.
