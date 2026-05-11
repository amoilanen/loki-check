# Recursive JSON values

A recursive generator that produces JSON-shaped values (booleans, numbers,
strings, arrays, objects). Demonstrates the standard recipe for any
self-referential shape: **`recursive` + `sized` + halve the size at every
recursive position**. Run with:

```sh
npx tsx examples/json.ts
```

## Source

<<< @/../examples/json.ts

## Notes

- `Generators.recursive<T>(self => ...)` builds a self-referential generator
  safely. `self` is a `Lazy<Generator<T>>`; call `self.force()` at draw
  time to recurse.
- `Generators.sized(size => ...)` reads the *active* size hint. The default
  is `100`; every `resize(n, g)` overrides it for the sub-generator.
- **Halving on every recursive position** (`Math.floor(size / 2)`) is the
  standard pattern. It guarantees termination and gives you a natural way
  to control overall complexity from the call site.
- `Generators.constant(null)` is what puts the JSON `null` leaf into the
  union. `Generators.pure(null)` would yield `none` because `pure` routes
  `null` / `undefined` through the `Maybe<T>` carrier as "absence", while
  `constant` wraps the value unconditionally. See
  [Combinators, `pure` vs `constant`](/guide/combinators#core-combinators)
  for the full story.
