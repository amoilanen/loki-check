# Generating an address

A multi-field address built up from nested `record` / `objectGenerator` calls
and `oneOfValues` for picking from fixed lists. Run with:

```sh
npx tsx examples/address.ts
```

## Source

<<< @/../examples/address.ts

## Notes

- `objectGenerator` is the function-applicative variant of `object` — pass a
  plain function instead of a constructor, and it gets one generated argument
  per child generator.
- `record` is the plain-object applicative — perfect when you do not need a
  custom class.
- Sampling is seeded (`{ seed: 'address-example' }`), so the printed address is
  identical on every run.
