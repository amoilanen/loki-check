# check-loki

<p>
  <img src="./assets/logo.jpg" alt="check-loki — raven mascot, in the spirit of the Norse sagas" width="80" align="left" hspace="16" vspace="8" />
  <strong>× ᛚᚢᚴᛁ ᚠᚱᚢᚦᚢᚾ ×</strong><br/>
  <em>"Loki, the shape-shifter of the sagas, slips between forms to test everybody."</em>
</p>


<br/>
<br/>
<br/>

Composable, seeded data generators and property-based testing for TypeScript / JavaScript, in the spirit of [ScalaCheck](https://github.com/typelevel/scalacheck) and named for the Norse trickster of the Eddas. Like Loki of the sagas, the library shape-shifts your inputs, slipping unexpected values past your assumptions until your invariants hold under every guise.

```sh
npm install --save-dev check-loki
```

> **Full guide and API reference:** **<https://amoilanen.github.io/check-loki/>**

## Why check-loki?

A generator library is only as good as how easy it is to build a generator for your own data. check-loki is built around three ideas:

1. **Every generator is a monad.** `pure`, `map` and `flatMap` are methods on every `Generator<T>`. If you can write a function, you can compose a generator. No inheritance, no schema files, no decorators, no builder DSL.
2. **Composition is applicative.** `record`, `object`, `nTuple` and `lift` assemble generators for product types in one line.
3. **Reproducibility is non-negotiable.** Every entry point (`sample`, `sampleN`, `forAll`, `exists`) accepts a `seed: number | string`. The same seed produces the same values on every machine. When `forAll` finds a counter-example it reports the seed so you can replay the exact run.

### Functional heritage

check-loki follows the design of [ScalaCheck](https://github.com/typelevel/scalacheck) and the lineage that goes back to [QuickCheck](https://hackage.haskell.org/package/QuickCheck): generators are first-class values that compose algebraically. The TypeScript surface keeps the substance and trades the syntax for what reads naturally in JS:

| QuickCheck / ScalaCheck idea | check-loki rendering |
| ---------------------------- | -------------------- |
| `Gen[T]` as a Functor / Monad | `Generator<T>` with `map`, `flatMap`, `pure` |
| Applicative product building | `record({ ... })`, `object(Class, ...)`, `nTuple(...)`, `lift(fn, ...)` |
| Frequency-weighted choice | `frequency([w, g], ...)`, `oneOf(g1, g2, ...)` |
| `suchThat` predicate filter | `g.filter(p)` (or `Generators.suchThat(g, p)`) |
| `Gen.sized` / `Gen.resize` | `Generators.sized(s => g)` / `Generators.resize(n, g)` |
| Automatic shrinking | Default shrinkers on every built-in; override with `g.withShrinker(...)` |
| `forAll` quantifier | `forAll(g, p)`, `forAll.assert(g, p)`, `exists(g, p)` |

### What sets it apart

- **Functions, not typeclasses.** A generator is a value, a combinator is a function. No implicit machinery.
- **String seeds out of the box.** `{ seed: 'my-test-case' }` works just like an integer seed. Human-readable labels are easier to copy back into a failing test than a 32-bit number.
- **An honest empty case.** A generator that cannot produce a value returns `none` from `g.generate(rng)`. `sample` throws a labelled `GenError`. Filtering, recursion and exhaustion are explicit instead of silently looping.
- **Recursive generators without footguns.** `Generators.recursive(self => ...)` builds self-referential generators safely via a `Lazy` thunk, so trees and JSON-shaped values don't blow the stack at construction time.
- **Plug into any test runner.** `forAll` returns a structured result, `forAll.assert` throws on failure. Use it inside Vitest, Mocha, Jest, `node:test`, or your own harness. The library does not own the test loop.
- **Tiny.** Zero runtime dependencies, dual ESM + CJS bundles, full type declarations.

## Hello world

```ts
import { Generators } from 'check-loki';

const point = Generators.record({
  x: Generators.integer({ min: 0, max: 100 }),
  y: Generators.integer({ min: 0, max: 100 }),
});

point.sample({ seed: 42 });             // { x: 73, y: 12 }
point.sampleN(3, { seed: 'demo' });     // three deterministic points
```

## A taste of the composition story

Most generators are built by gluing smaller ones together. Three short examples, all of them runnable in [`examples/`](./examples).

**Applicative product**: every field is drawn independently.

```ts
import { Generators } from 'check-loki';

const address = Generators.record({
  street: Generators.lift(
    (number: number, name: string, type: string) => `${number} ${name} ${type}`,
    Generators.integer({ min: 1, max: 999 }),
    Generators.oneOfValues('Baker', 'Abbey', 'Downing', 'Carnaby'),
    Generators.oneOfValues('Street', 'Road', 'Lane', 'Avenue'),
  ),
  city: Generators.oneOfValues('London', 'Manchester', 'Bristol', 'Edinburgh'),
});
```

**Monadic dependency**: pick a length, then a generator that respects it.

```ts
const variableLengthArray = Generators.integer({ min: 1, max: 5 })
  .flatMap(n => Generators.arrayOfLength(Generators.integer(), n));
```

**Recursive shape**: JSON-style values with bounded depth.

```ts
import { Generators, type Generator } from 'check-loki';

type Json = null | boolean | number | string | Json[];

const json: Generator<Json> = Generators.recursive<Json>(self =>
  Generators.sized(size =>
    size <= 0
      ? Generators.oneOf<Json>(
          Generators.constant(null),
          Generators.boolean,
          Generators.integer({ min: -100, max: 100 }),
        )
      : Generators.frequency<Json>(
          [3, Generators.integer({ min: -100, max: 100 })],
          [3, Generators.boolean],
          [2, Generators.asciiString({ maxLength: 8 })],
          [1, Generators.resize(Math.floor(size / 2), Generators.arrayOf(self.force(), 4))],
        )
  )
);
```

## A property-based test in three lines

```ts
import { describe, it } from 'vitest';
import { forAll, Generators } from 'check-loki';

describe('Math', () => {
  it('addition is commutative', () => {
    forAll.assert(
      Generators.nTuple(Generators.integer(), Generators.integer()),
      ([a, b]) => a + b === b + a,
    );
  });
});
```

When the property fails, the thrown error embeds the seed (so you can re-run the exact draw) and the shrunk counter-example (the smallest failing input the runner could find).

## Documentation

The full guide lives at **<https://amoilanen.github.io/check-loki/>**. Highlights:

- [**Getting Started**](https://amoilanen.github.io/check-loki/guide/getting-started): install, sample, seed.
- [**Concepts**](https://amoilanen.github.io/check-loki/guide/concepts): `Generator<T>`, `Maybe<T>`, monadic composition, reproducibility, shrinking.
- [**Custom generators**](https://amoilanen.github.io/check-loki/guide/custom-generators): building any generator from `pure`, `map`, `flatMap` and friends.
- [**Combinators reference**](https://amoilanen.github.io/check-loki/guide/combinators): the full toolbox.
- [**Quantifiers**](https://amoilanen.github.io/check-loki/guide/quantifiers): `forAll`, `forAll.assert`, `exists`.
- [**Shrinking**](https://amoilanen.github.io/check-loki/guide/shrinking): how counter-examples get minimised, how to write your own shrinker.
- [**Recipes**](https://amoilanen.github.io/check-loki/guide/recipes): common patterns - emails, UUIDs, recursive trees, model-based testing.
- [**Migration from ScalaCheck**](https://amoilanen.github.io/check-loki/guide/migration-from-scalacheck): terminology cheat sheet.
- [**API reference**](https://amoilanen.github.io/check-loki/api/): every public symbol.

## Examples

Runnable examples live in [`examples/`](./examples) and double as integration tests. `npm run test:examples` runs every one of them.

### Building generators

| Example | Shows |
| ------- | ----- |
| [`address.ts`](./examples/address.ts) | Nested `record` / `objectGenerator` / `oneOfValues` |
| [`object.generation.ts`](./examples/object.generation.ts) | `object(Class, ...)` constructor-applicative |
| [`phone.ts`](./examples/phone.ts) | String templating with `concat` and `pure` |
| [`ipv4.ts`](./examples/ipv4.ts) | `lift` over four `byte` draws joined as a string |
| [`email.ts`](./examples/email.ts) | Monadic composition with `flatMap` and applicative `lift` |
| [`uuid.ts`](./examples/uuid.ts) | `uuid()` and when (not) to use it |
| [`variable.name.ts`](./examples/variable.name.ts) | `identifier(...)` with `.filter(...)` for reserved words |
| [`credit.card.ts`](./examples/credit.card.ts) | Random body plus a computed Luhn check digit |
| [`weighted.user.ts`](./examples/weighted.user.ts) | Realistic distributions via `frequency` / `frequencyOfValues` |
| [`json.ts`](./examples/json.ts) | Recursive generator with `sized`, `frequency` and `constant(null)` |
| [`sized.tree.ts`](./examples/sized.tree.ts) | `sized` / `resize` for bounded recursive shapes |
| [`build.from.scratch.ts`](./examples/build.from.scratch.ts) | Writing a generator manually with `pure`, `map`, `flatMap` |

### Property-based testing

| Example | Shows |
| ------- | ----- |
| [`property-test.ts`](./examples/property-test.ts) | `forAll.assert` driving a property check |
| [`round.trip.ts`](./examples/round.trip.ts) | `decode(encode(x)) === x`, the codec law |
| [`idempotence.ts`](./examples/idempotence.ts) | Idempotence, commutativity, associativity, identity |
| [`sorted.array.ts`](./examples/sorted.array.ts) | Property-based testing of a real algorithm |
| [`model.based.ts`](./examples/model.based.ts) | Stack vs reference-array model-based testing |
| [`exists.ts`](./examples/exists.ts) | `exists` for witness search and coverage assertions |
| [`custom.shrinker.ts`](./examples/custom.shrinker.ts) | Attaching a custom shrinker via `withShrinker` |

## License

MIT
