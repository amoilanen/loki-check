# Idempotence and algebraic laws

Idempotence (`f(f(x)) === f(x)`) is one of the most reliable property
patterns. Many real-world functions are *meant* to be idempotent
(`trim`, `sort`, `dedupe`, `normalise`, `canonicalise`, schema-validate),
and stating the law as a property gives you confidence the implementation
matches the name. This example also covers the related laws of
commutativity, associativity, and identity. Run with:

```sh
npx tsx examples/idempotence.ts
```

## Source

<<< @/../examples/idempotence.ts

## Notes

- Each `forAll.assert` is independent and gets its own string seed.
  Distinct seeds are useful when you want to reproduce a single failing
  law without re-running its siblings.
- **Generic algebraic laws are gold-standard property tests.** They are
  short, mechanically derivable, and the bugs they catch (off-by-one,
  sign flips, missing-case fallthroughs) tend to be exactly the bugs
  that escape example-based tests.
- For *partial* laws (e.g. division is not associative on integers due
  to truncation) you can either restrict the input generator or wrap
  the predicate in a guard that returns `true` on out-of-domain inputs.

Common algebraic-law tests:

| Law | Pattern |
| --- | ------- |
| Idempotence | `f(f(x)) === f(x)` |
| Involution | `f(f(x)) === x` |
| Commutativity | `f(a, b) === f(b, a)` |
| Associativity | `f(f(a, b), c) === f(a, f(b, c))` |
| Identity | `f(a, e) === a` |
| Distributivity | `f(a, g(b, c)) === g(f(a, b), f(a, c))` |
| Monotonicity | `a <= b implies f(a) <= f(b)` |
| Order-preserving | `f(sort(xs))` should equal `sort(map(f, xs))` when `f` is monotonic |

## See also

- [Property test](./property-test.md): involution (`reverse(reverse) === id`).
- [Round-trip](./round-trip.md): `decode(encode(x)) === x`, a special
  case of an algebraic law.
- [Sorted array](./sorted-array.md): multiple invariants combined.
