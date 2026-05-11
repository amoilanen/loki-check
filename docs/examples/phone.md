# UK-style phone numbers

A practical use of `concat` plus literal segments via `pure`. Run with:

```sh
npx tsx examples/phone.ts
```

## Source

<<< @/../examples/phone.ts

## Notes

- `concat(g1, g2, ...)` glues string generators together. Handy for templated
  identifiers, formatted numbers, etc.
- `pure(x)` injects a constant value (here, the literal separators).
- `numericString` and `stringOf(numChar(), { ... })` both produce digit-only
  strings; the former is a thin convenience over the latter.
