# UUID-shaped strings

`uuid()` returns a generator producing strings matching the RFC 4122 v4
shape. Run with:

```sh
npx tsx examples/uuid.ts
```

## Source

<<< @/../examples/uuid.ts

## When to prefer `uuid()`

- You need deterministic, seedable identifiers for tests / fixtures.
- You want a string that *looks* like a UUID without dragging in a crypto-grade
  UUID library.

## When NOT to use it

- Production identifiers — use `crypto.randomUUID()` instead. `uuid()` is
  backed by a deterministic PRNG, not a CSPRNG.
