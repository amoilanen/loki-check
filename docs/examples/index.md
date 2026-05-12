# Examples

Each example below is a runnable file in the
[`examples/`](https://github.com/amoilanen/check-loki/tree/master/examples)
directory of the repo. They run as part of the test suite via
`npm run test:examples`, so every snippet you copy from this page is
guaranteed to execute end-to-end on every commit.

## Building generators

| Example | What it shows |
| ------- | ------------- |
| [Address](./address.md) | Nested `record` / `objectGenerator` and `oneOfValues` for fixed lists |
| [Object generation](./object-generation.md) | Constructor-applicative `object(Class, ...)` |
| [Phone number](./phone.md) | String templating with `concat`, `numericString`, `pure` |
| [IPv4 address](./ipv4.md) | A small `lift`: four independent draws joined as a string |
| [Email](./email.md) | Monadic composition: `flatMap` for dependent draws, `lift` for applicative product |
| [UUID](./uuid.md) | `uuid()` and when (not) to use it |
| [Variable name](./variable-name.md) | `identifier(...)` plus `filter` for reserved words |
| [Credit card (Luhn)](./credit-card.md) | Construct-don't-filter: compute the check digit with `.map` |
| [Weighted user](./weighted-user.md) | Realistic distributions via `frequency` / `frequencyOfValues` |
| [Recursive JSON](./json.md) | `recursive` + `sized` + `frequency` for self-referential shapes |
| [Sized tree](./sized-tree.md) | `sized` / `resize` to bound recursion depth |
| [Build from scratch](./build-from-scratch.md) | Two equivalent generators: one extending `Generator`, one composed from `map` + `flatMap` |

## Property-based testing

| Example | What it shows |
| ------- | ------------- |
| [Property test](./property-test.md) | `forAll.assert` checking `reverse(reverse(xs)) === xs` |
| [Round-trip](./round-trip.md) | `decode(encode(x)) === x`, the most valuable codec law |
| [Idempotence & laws](./idempotence.md) | Idempotence, commutativity, associativity, identity |
| [Sorted array](./sorted-array.md) | The classical ascending-sort specification (length / ordering / multiset) |
| [Model-based test](./model-based.md) | Stack-vs-reference model checking: finds long interaction bugs |
| [Existential search](./exists.md) | `exists` for witness search and coverage assertions |
| [Custom shrinker](./custom-shrinker.md) | Attaching a domain-aware shrinker via `withShrinker` and reading the shrunk counter-example |

## How to run

```sh
# Run every example end-to-end
npm run test:examples

# Or run a single example
npx tsx examples/json.ts
```

Every example pins its seed (`{ seed: '<example-name>' }`) so the printed
output is identical on every run.
