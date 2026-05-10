# Property-based testing with `forAll` and `exists`

`loki-check` ships two quantifier-style entry points designed to plug into any test
runner (Vitest, Mocha, Jest — all of them).

## `forAll`

Runs a predicate against `tries` (default `100`) random draws from a generator.
Returns a structured result; on failure it shrinks toward the simplest
counter-example.

```ts
import { forAll, Generators } from 'loki-check';

const r = forAll(Generators.integer({ min: -1000, max: 1000 }), n => n * 0 === 0);

if (!r.ok) {
  console.error('Counter-example:', r.counterExample);
  console.error('Reproduce with seed:', r.seed);
}
```

The result shape:

```ts
interface ForAllResult<T> {
  ok: boolean;
  triesRun: number;
  seed: number;
  counterExample?: { original: T; shrunk: T };
}
```

## `forAll.assert`

Throws on failure. Use it directly inside a test runner's `it(...)` block:

```ts
import { describe, it } from 'vitest';
import { forAll, Generators } from 'loki-check';

describe('Math', () => {
  it('addition is commutative', () => {
    forAll.assert(
      Generators.nTuple(Generators.integer(), Generators.integer()),
      ([a, b]) => a + b === b + a,
    );
  });
});
```

The thrown error message embeds the seed, the original counter-example, and
the shrunk counter-example.

## Reproducing a failure

Both `forAll` and `forAll.assert` always log/return the seed used. Pin it to
re-run the exact same sequence of draws:

```ts
forAll.assert(myGen, predicate, { seed: 1234567890 });
```

## Shrinking

Default shrinkers are attached to every built-in combinator:

- numbers shrink toward `0`
- strings shrink toward `""`
- arrays / sets / maps shrink toward smaller sizes
- tuples / records / objects shrink each component independently
- booleans shrink to `false`

You can disable shrinking (`shrink: false`) or cap its work
(`shrinkBudget: <n>`), and you can attach a custom shrinker with
`g.withShrinker(myShrinker)` before passing the generator into `forAll`.

## `exists`

The dual of `forAll` — returns the first witness satisfying the predicate, or
reports failure after exhausting the try budget.

```ts
import { exists, Generators } from 'loki-check';

const r = exists(Generators.integer({ min: 0, max: 1000 }), n => n > 950);

if (r.found) console.log('witness:', r.witness, 'after', r.triesRun, 'tries');
```

Both quantifiers accept the same `seed` / `rng` / `tries` options.
