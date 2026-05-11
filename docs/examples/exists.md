# Existential quantification with `exists`

`forAll` proves "no counter-example was found"; `exists` proves "at least
one witness was found". They are duals, and both have their place in a
property-based test suite. Run with:

```sh
npx tsx examples/exists.ts
```

## Source

<<< @/../examples/exists.ts

## Notes

- `exists(gen, p, opts)` returns `{ found, triesRun, seed, witness? }`.
  When `found === true`, `witness` is the first value satisfying the
  predicate.
- The most common practical use is a **coverage assertion**: prove that
  your generator can actually reach an interesting corner of the input
  space. Generators biased away from edge cases are a silent source of
  false confidence.
- `exists` is also handy in maths-flavoured tests (finding a Pythagorean
  triple, a prime in a range, a graph with a specific property) where
  the cheap-to-state predicate is the *whole point*.
- A successful `exists` run with a pinned seed is a perfectly valid way
  to *document* a witness in your test suite: "input X exercises code
  path Y".

A note of caution: `exists` only proves *existence within the try budget*.
A negative result (`found === false`) does not mean no witness exists, it
means your generator and budget did not find one. Bump `tries`, change the
seed, or refine the generator if you expect a witness and are not getting
one.

## See also

- [Quantifiers guide](/guide/quantifiers): full `forAll` / `exists` reference.
- [Weighted user example](./weighted-user.md): biasing the distribution
  so `exists` queries reach realistic corners quickly.
