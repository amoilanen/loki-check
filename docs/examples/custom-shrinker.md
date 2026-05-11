# Custom shrinker

Attaches a domain-aware shrinker to a `Money` generator so a property
failure reports a *minimal* counter-example. Run with:

```sh
npx tsx examples/custom.shrinker.ts
```

## Source

<<< @/../examples/custom.shrinker.ts

## Notes

- `Generators.object(Class, ...)` builds class instances but cannot
  synthesise a useful shrinker on its own. The runner does not know how
  to make a `Money` "smaller". Attach one with `g.withShrinker(...)`.
- The shrinker yields candidates **lazily** via `function*`. The runner
  walks them in order, looking for one that still fails the predicate,
  and recurses on the smallest hit.
- The order matters:
  1. Yield the trivial value first (`amount = 0`, same currency).
  2. Then yield halvings (logarithmic convergence).
  3. Then yield orthogonal simplifications (currency = `USD`).
- The property is *deliberately* false (`amount > 100`) so that the
  shrinker has something to chew on. In a real test, you would write the
  property you actually want to hold.
- See [the Shrinking guide](/guide/shrinking) for the full model.
