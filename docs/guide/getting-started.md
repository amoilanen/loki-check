# Getting Started

`check-loki` is a small (~ a few KB minzipped, zero runtime dependencies) library
for building **composable, seeded data generators** and using them to drive
property-based tests.

It is heavily inspired by [ScalaCheck](https://github.com/typelevel/scalacheck)
and re-imagined around the TypeScript / 2026-era Node.js toolchain. If you have
used QuickCheck-family libraries before, you will feel at home immediately. If
you have not, the next few minutes will show you why "a generator is just a
value" matters.

## Install

```sh
npm install --save-dev check-loki
```

`check-loki` ships dual ESM (`.mjs`) and CJS (`.cjs`) bundles plus first-class
type declarations and works on Node.js 22 LTS or newer.

## Your first generator

Every built-in combinator lives on the `Generators` namespace. Pull in just the
ones you need.

```ts
import { Generators } from 'check-loki';

const integerInRange = Generators.integer({ min: 0, max: 100 });

integerInRange.sample();             // e.g. 47
integerInRange.sample({ seed: 42 }); // deterministic
```

## Building a generator for your own type

The whole point of check-loki is that you build the generator you need by
composing the ones you have. Three combinators do most of the work:

```ts
import { Generators } from 'check-loki';

interface User {
  id: string;
  name: string;
  age: number;
  isAdmin: boolean;
}

const user = Generators.record<User>({
  id: Generators.uuid(),
  name: Generators.identifier(8),
  age: Generators.integer({ min: 18, max: 99 }),
  isAdmin: Generators.boolean,
});

user.sample({ seed: 'alice' });
// {
//   id: '6a4f...',
//   name: 'kqwbzeil',
//   age: 47,
//   isAdmin: false,
// }
```

`Generators.record({ ... })` is the *applicative* product builder. Every field
is drawn independently from the corresponding inner generator, and the result
is a plain JS object with the exact keys you supplied, typed precisely.

When the shape you want already has a constructor, use `object(Class, ...)`
instead:

```ts
class Point {
  constructor(readonly x: number, readonly y: number) {}
}

const points = Generators.object(Point, Generators.integer(), Generators.integer());

points.sample({ seed: 1 });   // a real Point instance
```

When the value has to be derived from the generated arguments, use `lift`
(each field becomes a function argument):

```ts
const email = Generators.lift(
  (name: string, domain: string) => `${name}@${domain}`,
  Generators.identifier(10),
  Generators.oneOfValues('example.com', 'mail.test', 'demo.dev'),
);

email.sample({ seed: 'mail' });   // 'a8jw13kn@example.com'
```

## Sampling

You will mostly use the two methods on every `Generator<T>`:

```ts
const g = Generators.arrayOf(Generators.integer({ min: 0, max: 9 }), 5);

g.sample();                       // single value, with Math.random()
g.sample({ seed: 42 });           // single value, deterministic
g.sampleN(3, { seed: 'demo' });   // three deterministic values
```

`sample` returns the raw value, and throws `GenError` if the generator yields
nothing (for example `Generators.never()` or a fully filtered-out generator).
For the functional path, use `g.generate(rng)` to receive a `Maybe<T>` instead.
See [Concepts](./concepts.md).

## Reproducibility

Every entry point that produces randomness (`sample`, `sampleN`, `forAll`,
`exists`) accepts a `seed` of type `number | string`. Same seed, same output,
forever. This is the cornerstone of debuggable property-based testing:

```ts
import { forAll, Generators } from 'check-loki';

const r = forAll(Generators.integer(), n => n < 100);
if (!r.ok) console.log('reproduce with seed:', r.seed);
```

String seeds are first-class. A human-readable label like `'commutativity'` is
easier to copy around than `0x9c1f3a4b`:

```ts
forAll.assert(myGen, predicate, { seed: 'addition-commutativity' });
```

## Your first property-based test

`forAll.assert` throws on failure, so it drops straight into Vitest / Mocha /
Jest / `node:test`. check-loki does not own the test loop:

```ts
import { describe, it } from 'vitest';
import { forAll, Generators } from 'check-loki';

describe('Array#reverse', () => {
  it('is its own inverse', () => {
    const intArrays = Generators.arrayOf(Generators.integer(), 50);

    forAll.assert(intArrays, xs => {
      const round = [...xs].reverse().reverse();
      return round.length === xs.length && round.every((v, i) => v === xs[i]);
    });
  });
});
```

When this property fails, the thrown error embeds:

1. The **seed** used for the failing run. Copy it into `{ seed: ... }` to replay.
2. The **original counter-example**, the first failing draw.
3. The **shrunk counter-example**, the same failure with the input minimised
   by the runner so debugging is easy.

## Where to next?

- [Concepts](./concepts.md): what a generator really is, monadic composition,
  the `Maybe<T>` carrier, seeded randomness, sized generation.
- [Custom generators](./custom-generators.md): recipes for any data shape you
  can dream up, built only from `pure` / `map` / `flatMap` and the combinator
  library.
- [Combinators](./combinators.md): the full toolbox.
- [Quantifiers](./quantifiers.md): `forAll` and `exists` for property-based testing.
- [Shrinking](./shrinking.md): automatic counter-example minimisation, plus how
  to write your own shrinker.
- [Recipes](./recipes.md): common patterns (emails, dates, trees, model-based
  testing).
- [Migration from ScalaCheck](./migration-from-scalacheck.md): terminology
  cheat sheet for ScalaCheck users.
- [API reference](/api/): every public symbol.
