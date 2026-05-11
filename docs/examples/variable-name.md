# Generating valid JS variable names

`identifier(maxLength)` produces ASCII identifier-shaped strings. The example
adds a `.filter(...)` call to skip over reserved keywords. Run with:

```sh
npx tsx examples/variable.name.ts
```

## Source

<<< @/../examples/variable.name.ts

## Notes

- `.filter(p)` is the method form of `Generators.suchThat(g, p)`. Both
  reroll the generator until the predicate holds (or yield `none` after the
  retry budget).
- Keep filtering predicates **cheap and high-acceptance**. Filtering is a
  blunt instrument; if your predicate rejects most draws you should refactor
  the generator instead.
