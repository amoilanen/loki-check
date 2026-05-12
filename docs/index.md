---
layout: home

hero:
  name: check-loki
  text: Composable, seeded data generators
  tagline: Property-based testing for TypeScript / JavaScript, in the spirit of ScalaCheck. A generator is a value, composition is just function calls.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: Concepts
      link: /guide/concepts
    - theme: alt
      text: Browse the API
      link: /api/
    - theme: alt
      text: View on GitHub
      link: https://github.com/amoilanen/check-loki

features:
  - title: Every generator is a monad
    details: "`pure`, `map` and `flatMap` live on every `Generator<T>`. If you can write a function, you can compose a generator. No schemas, no decorators, no builder DSL."
  - title: Applicative product building
    details: "`record({ ... })`, `object(Class, ...)`, `nTuple(...)` and `lift(fn, ...)` lift JS objects and class constructors into the generator world. The result is the shape you asked for."
  - title: Reproducible by design
    details: "Every entry point accepts `seed: number | string`. Pass `{ seed: 'my-test-case' }` and the same draw happens on every machine."
  - title: Property-based testing built-in
    details: "`forAll`, `forAll.assert` and `exists` plug into any test runner. Counter-examples are shrunk to the smallest failing input, and the seed is embedded in the error so you can replay it."
  - title: Honest empty case
    details: "Generators that cannot produce a value return `none` rather than silently looping. Filtering, recursion and exhaustion are explicit."
  - title: Functional heritage
    details: "Carries forward the design of QuickCheck and ScalaCheck (generators are first-class values that compose algebraically) and renders it in idiomatic TypeScript."
---

## Five-line hello world

```ts
import { Generators } from 'check-loki';

const point = Generators.record({
  x: Generators.integer({ min: 0, max: 100 }),
  y: Generators.integer({ min: 0, max: 100 }),
});

point.sample({ seed: 42 });           // { x: 73, y: 12 }
point.sampleN(3, { seed: 'demo' });   // three deterministic points
```

That is the whole picture: pick a generator, call `sample`, optionally pin the
seed for reproducibility. Browse the [Guide](/guide/getting-started) for the
longer story, the [Examples](/examples/) for runnable snippets, or jump straight
to the [API reference](/api/).

## What makes check-loki different

A generator library is only as good as how easy it is to build a new generator
for your own data. check-loki sticks to three commitments:

### 1. Composition is the API

There is no special "schema language", no annotation DSL, no inheritance
hierarchy to remember. The same three primitives that make `Promise` and
`Array` familiar give you everything you need:

```ts
import { Generators, type Generator } from 'check-loki';

// pure :: T -> Generator<T>
const always42: Generator<number> = Generators.pure(42);

// map :: Generator<T> -> (T -> U) -> Generator<U>
const evenInts = Generators.integer({ min: 0, max: 100 }).map(n => n * 2);

// flatMap :: Generator<T> -> (T -> Generator<U>) -> Generator<U>
const variableLengthArray = Generators.integer({ min: 1, max: 5 })
  .flatMap(n => Generators.arrayOfLength(Generators.integer(), n));
```

Every built-in combinator (`arrayOf`, `record`, `concat`, `oneOf`, `frequency`,
...) is a thin function written on top of those. You can read or rewrite any of
them in a few lines.

### 2. Applicative records, exactly the shape you asked for

```ts
const user = Generators.record({
  id: Generators.uuid(),
  email: Generators.lift(
    (name: string, domain: string) => `${name}@${domain}`,
    Generators.identifier(10),
    Generators.oneOfValues('example.com', 'mail.test', 'demo.dev'),
  ),
  age: Generators.integer({ min: 18, max: 99 }),
  active: Generators.boolean,
});
```

`record` returns a `Generator<{ id: string; email: string; age: number; active: boolean }>`,
a plain object with full TypeScript inference. No wrappers, no synthetic
classes, no `unwrap()` step.

### 3. The seed is a first-class debugging tool

```ts
import { forAll, Generators } from 'check-loki';

const r = forAll(
  Generators.arrayOf(Generators.integer(), 50),
  xs => xs.every(x => x !== 0),  // a deliberately false property
);

if (!r.ok) {
  console.error('Counter-example:', r.counterExample.shrunk);
  console.error('Reproduce with seed:', r.seed);
}
```

The seed is reported on every run. The shrinker turns a 50-element array with
a single `0` into a one-element array with a single `0` before the report.
Drop the seed back in via `{ seed: r.seed }` and you replay the exact draw.

## Up next

- [Getting Started](/guide/getting-started): install and sample your first value.
- [Concepts](/guide/concepts): `Generator<T>`, `Maybe<T>`, monadic composition, reproducibility, shrinking, sizing.
- [Custom generators](/guide/custom-generators): building any generator you need from the primitives.
- [Combinators reference](/guide/combinators): the full toolbox.
- [Quantifiers](/guide/quantifiers): `forAll`, `forAll.assert`, `exists`.
- [Shrinking](/guide/shrinking): how counter-examples get minimised, how to write your own shrinker.
- [Recipes](/guide/recipes): emails, UUIDs, recursive trees, model-based testing.
- [Examples](/examples/): runnable end-to-end snippets.
- [Migration from ScalaCheck](/guide/migration-from-scalacheck): terminology cheat sheet.
- [API reference](/api/): every public symbol.
