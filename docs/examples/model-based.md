# Model-based testing

A stateful system is correct if it stays in lockstep with a simpler
*reference model* under every sequence of operations. Generate the
sequence, replay it against both, assert their observable states agree.
This finds long, subtle interaction bugs that example-based tests almost
always miss. Run with:

```sh
npx tsx examples/model.based.ts
```

## Source

<<< @/../examples/model.based.ts

## Notes

- **Operations are values.** Define them as a discriminated union, then
  use `oneOf` to draw one and `arrayOf` to draw a sequence. The
  shrinker can then minimise *both* the sequence length and the
  individual operation values when a counter-example is found.
- **The model should be obviously correct.** Often it is a wrapping of
  a built-in data structure (`Map`, `Set`, plain array) doing nothing
  clever. Its job is to *define behaviour*, not to be efficient.
- **Check the invariant after every step**, not just at the end. A
  small divergence at step 7 of a 50-step program is much easier to
  diagnose than the same divergence observable only via the final
  state.
- Flip `BUGGY = true` at the top of the file to inject a fault (`pop`
  returns `undefined` when the stack has exactly one element). The
  property will fail and `r.counterExample.shrunk` will reduce to a
  minimal `[{push, x}, {pop}]` sequence, illustrating how shrinking
  works on operation arrays.

Things worth model-testing:

- Caches, queues, stacks, ring buffers, LRUs
- In-memory key-value stores
- State machines (lifecycle, workflow, finite automata)
- Idempotent CRUD layers
- Reactive stores (Redux, Zustand, Pinia, custom)
- Anything where "the order of events matters"

## See also

- [Custom shrinker example](./custom-shrinker.md): the same shrinking
  mechanism, but with a custom shrinker for a richer value type.
- [Recipes guide](/guide/recipes): more end-to-end patterns.
