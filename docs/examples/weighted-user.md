# Realistic-distribution user generation

Real-world inputs are not uniformly distributed. `frequency` /
`frequencyOfValues` let you bias the generator toward the shape your
production traffic actually has, so most of your property-test cycles
go to values you care about. Run with:

```sh
npx tsx examples/weighted.user.ts
```

## Source

<<< @/../examples/weighted.user.ts

## Notes

- `frequencyOfValues([w, v], ...)` is the weighted version of
  `oneOfValues(v, ...)`. Weights are normalised to a probability
  distribution; tuples with weight `<= 0` are dropped.
- `frequency([w, g], ...)` is the same idea but with *generators* in the
  second slot, so each branch can itself be a complex shape (e.g. a
  range of ages per band).
- The trailing 2000-draw sanity check is a useful pattern: it tells you
  whether your weights actually produce the distribution you expect.
  Wire it into a real test if your generator's distribution is
  load-bearing for correctness or coverage.

## See also

- [Combinators reference, Core combinators](/guide/combinators#core-combinators):
  `frequency` / `frequencyOfValues` in the wider toolbox.
- [Exists example](./exists.md): using `exists` to assert that a
  distribution actually *reaches* a specific corner case.
