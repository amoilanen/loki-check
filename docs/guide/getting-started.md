# Getting Started

`gen.js` is a small (~ a few KB minzipped) library for building **composable,
seeded data generators** — and using them to drive property-based tests.

It is heavily inspired by [ScalaCheck](https://github.com/typelevel/scalacheck),
re-imagined around the TypeScript / 2026-era Node.js toolchain.

## Install

```sh
npm install --save-dev gen.js
```

`gen.js` ships dual ESM (`.mjs`) + CJS (`.cjs`) bundles plus first-class type
declarations and works on Node.js 22 LTS or newer.

## Your first generator

```ts
import { Generators } from 'gen.js';

const integerInRange = Generators.integer({ min: 0, max: 100 });

console.log(integerInRange.sample());
// → e.g. 47
```

Every built-in combinator lives on the `Generators` namespace; pull in just the
ones you need.

## Sampling

You will mostly use the two methods on every `Generator`:

```ts
const g = Generators.arrayOf(Generators.integer({ min: 0, max: 9 }), 5);

g.sample();                       // single value, with global Math.random()
g.sample({ seed: 42 });           // single value, deterministic
g.sampleN(3, { seed: 'demo' });   // three deterministic values
```

`sample` returns the raw value (and throws if the generator yields nothing —
e.g. `Generators.never()` or a fully filtered-out generator). For the
functional path, use `g.generate(rng)` to receive a `Maybe<T>` instead.

## Reproducibility

Every entry point that produces randomness — `sample`, `sampleN`, `forAll`,
`exists` — accepts a `seed` (number **or** string). Same seed → same output,
forever. This is the cornerstone of debuggable property-based testing:

```ts
import { forAll, Generators } from 'gen.js';

const r = forAll(Generators.integer(), n => n < 100);
if (!r.ok) console.log('reproduce with seed:', r.seed);
```

## Where to next?

- [Concepts](/guide/concepts) — what a generator actually is, and how `map` /
  `flatMap` compose.
- [Combinators](/guide/combinators) — the full toolbox.
- [Quantifiers](/guide/quantifiers) — `forAll` and `exists` for property-based
  testing.
- [Migration from ScalaCheck](/guide/migration-from-scalacheck) — terminology
  cheat sheet for ScalaCheck users.
- [API reference](/api/) — every public symbol.
