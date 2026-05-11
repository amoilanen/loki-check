# Build a generator from scratch

Two equivalent ways to write a "non-empty subset of an array" generator:

1. **The long way**: extend the `Generator` abstract class directly and
   talk to the `Random` source.
2. **The short way**: use only `Generators.integer` and `.map`. No custom
   class, no RNG plumbing.

Run with:

```sh
npx tsx examples/build.from.scratch.ts
```

## Source

<<< @/../examples/build.from.scratch.ts

## Notes

- The contract for `generate(rng)` is the entire interface: return a
  `Maybe<T>`. Return `none` if your generator cannot produce a value;
  otherwise wrap the produced value in `new Some(v)`.
- The short way wins almost every time. `pure`, `map`, and `flatMap`
  combined with the combinator library can express any pure generator,
  the result is shorter and declarative, and it inherits the structural
  shrinker for free.
- Reach for the long way when:
  - You need to talk to `rng` directly (custom probability distributions,
    rejection sampling, stateful logic).
  - You are writing a new combinator that will become a building block
    for other generators.
- Always thread the `rng` argument through every nested `generate` call,
  or your generator will not be reproducible.
