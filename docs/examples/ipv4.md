# Generating an IPv4 address

A small applicative product example. An IPv4 address is four independent
octets joined by dots: `lift` does the joining, `Generators.byte` does
the rest. Run with:

```sh
npx tsx examples/ipv4.ts
```

## Source

<<< @/../examples/ipv4.ts

## Notes

- `Generators.byte` is `Generators.integer({ min: 0, max: 255 })` under
  the hood, useful enough to be its own export.
- `lift(fn, g1, g2, g3, g4)` draws one value per inner generator and
  feeds them to `fn` in order. It is the **applicative product** for any
  arity.
- All four positions are independent, so the typing is `(number, number,
  number, number) => string`. Compare with `flatMap`, which is for
  *dependent* draws (next generator chosen by the previous value).

## See also

- [Address example](./address.md): same applicative shape on a richer
  domain.
- [Combinators reference, Tuples and objects](/guide/combinators#tuples-and-objects):
  full menu of product combinators.
