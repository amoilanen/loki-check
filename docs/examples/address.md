# Generating an address

A multi-field address built up from nested `record` / `objectGenerator` calls
and `oneOfValues` for picking from fixed lists. The result is a plain JS
object whose fields are drawn independently. Run with:

```sh
npx tsx examples/address.ts
```

## Source

<<< @/../examples/address.ts

## Notes

- `objectGenerator` is the function-applicative variant of `object`. Pass
  a plain function instead of a constructor, and it gets one generated
  argument per child generator. Use it when the value you want is a
  *derived* string (or any pure function of the field values).
- `record` is the plain-object applicative. Use it when you do not need
  a custom class and want the result typed exactly as `{ ... }`.
- `oneOfValues(...)` picks one item from a fixed list uniformly at random.
  Use `frequencyOfValues([w, v], ...)` for a weighted version.
- Sampling is seeded (`{ seed: 'address-example' }`), so the printed
  address is identical on every run.

## See also

- [Email example](./email.md) uses the same `lift` / `objectGenerator`
  shape for a more involved string-templating problem.
- [Custom generators guide](/guide/custom-generators) walks through the
  patterns behind this example.
