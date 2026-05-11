# Email address

Builds an email-address generator from monadic primitives: a textbook
example of mixing **dependent draws** (via `flatMap`) with **independent
draws** (via `lift`). Run with:

```sh
npx tsx examples/email.ts
```

## Source

<<< @/../examples/email.ts

## Notes

- `local` uses `flatMap` to make the number of atoms a *generated* value:
  first pick `n`, then build an array of length `n` and join with dots.
- `domain` uses `lift`: host and TLD are drawn independently and combined
  with a pure function.
- The final email is, again, a pure function of two independently-drawn
  parts. This is the applicative pattern that `record`, `object`,
  `nTuple`, and `lift` all share.
- The seed is a string (`'email-example'`), making it trivial to reproduce.
