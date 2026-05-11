# Valid-by-construction credit-card numbers

A Luhn-valid 16-digit credit-card number, built by drawing a random 15-digit
body and *computing* the check digit. This is the "construct only valid
values" pattern, much better than filtering random 16-digit strings (which
would reject >90% of draws). Run with:

```sh
npx tsx examples/credit.card.ts
```

## Source

<<< @/../examples/credit.card.ts

## Notes

- The Luhn algorithm is a simple checksum used by the card industry to
  catch single-digit transcription errors. Generating valid numbers by
  computing the check digit guarantees we never waste cycles on
  rejected draws.
- The `.map(body => ...)` step takes the random body and appends the
  correctly-derived check digit. There is no dependence on randomness
  inside that callback (it is pure arithmetic), so `map` (not `flatMap`)
  is the right tool.
- The sanity assertion at the end protects against future refactors:
  every example file is run on every commit by `npm run test:examples`,
  so an accidental break would surface immediately.

The same construct-don't-filter pattern applies anywhere validity has a
deterministic function of the input:

- ISBN / IBAN / VIN / EAN-13 check digits
- HMAC-signed tokens
- Sorted arrays (`.map(xs => [...xs].sort())`)
- JSON canonical form (sort keys)

Whenever you find yourself reaching for `.filter(isValid)`, ask first
whether `.map(makeValid)` can do the work.

## See also

- [Custom generators guide, Pattern 1: `map`](/guide/custom-generators#pattern-1-map-reshape-a-value)
- [Recipes](/guide/recipes)
