# Property-based testing with `forAll` and `exists`

`loki-tscheck` ships two quantifier-style entry points designed to plug into any
test runner: Vitest, Mocha, Jest, `node:test`, or anything else that
understands "throw on failure".

The library deliberately does **not** own the test loop. `forAll.assert`
throws on failure, `forAll` returns a structured result. You compose them
into whichever harness you already use.

## `forAll`

Runs a predicate against `tries` (default `100`) random draws from a generator.
Returns a structured `ForAllResult`. On failure it shrinks toward the simplest
counter-example.

```ts
import { forAll, Generators } from 'loki-tscheck';

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

The predicate may return `boolean`, `void`, or throw. A returned `undefined`
(i.e. no explicit return) is treated as success. Thrown errors are caught and
counted as failure, so `assert(x)`-style predicates work out of the box.

## `forAll.assert`

The asserting variant. Throws on failure, so it drops directly into a test
runner's `it(...)` block:

```ts
import { describe, it } from 'vitest';
import { forAll, Generators } from 'loki-tscheck';

describe('Math', () => {
  it('addition is commutative', () => {
    forAll.assert(
      Generators.nTuple(Generators.integer(), Generators.integer()),
      ([a, b]) => a + b === b + a,
    );
  });
});
```

The thrown `Error` message embeds:

- The **seed** used for the failing run.
- The **original** counter-example, the first failing draw.
- The **shrunk** counter-example, the same failure, minimised.

## Reproducing a failure

Both `forAll` and `forAll.assert` always log/return the seed used. Pin it to
re-run the exact same sequence of draws:

```ts
forAll.assert(myGen, predicate, { seed: 1234567890 });
forAll.assert(myGen, predicate, { seed: 'commutativity-2026-01' });  // strings work too
```

This is the most useful workflow loki-tscheck enables: a CI failure
prints a seed, you paste it into the test, the failure reproduces locally
*every* time. No flaky, ungrepable random failures.

## Options

```ts
interface ForAllOpts {
  tries?: number;          // default 100
  seed?: number | string;  // omit for a random run
  rng?: Random;            // share a stream across multiple calls
  shrink?: boolean;        // default true
  shrinkBudget?: number;   // max predicate calls while shrinking, default 1000
}
```

- **`tries`**: increase for higher confidence on rare conditions, decrease
  when each draw is expensive.
- **`shrink: false`**: disable shrinking entirely. Useful when the predicate
  has heavy side-effects you do not want repeated.
- **`shrinkBudget`**: caps the work the shrinker is allowed to do per
  failure. Defaults to 1000 predicate evaluations.

## Shrinking

Default shrinkers are attached to every built-in combinator:

- **numbers** shrink toward `0`
- **strings** shrink toward `""` and toward simpler ASCII characters
- **booleans** shrink toward `false`
- **arrays / sets / maps** shrink toward smaller sizes
- **tuples / records / objects** shrink each component independently
- **dates** shrink toward `new Date(0)`

You can attach a custom shrinker with `g.withShrinker(myShrinker)` before
passing the generator into `forAll`. See [the Shrinking guide](./shrinking.md)
for full details and an example.

## `exists`

The dual of `forAll`. Returns the first witness satisfying the predicate, or
reports failure after exhausting the try budget.

```ts
import { exists, Generators } from 'loki-tscheck';

const r = exists(Generators.integer({ min: 0, max: 1000 }), n => n > 950);

if (r.found) {
  console.log('witness:', r.witness, 'after', r.triesRun, 'tries');
} else {
  console.log('no witness in', r.triesRun, 'tries');
}
```

The result shape:

```ts
interface ExistsResult<T> {
  found: boolean;
  triesRun: number;
  seed: number;
  witness?: T;
}
```

`exists` accepts the same `seed` / `rng` / `tries` options as `forAll`.

## When to reach for which

| You want... | Use |
| ----------- | --- |
| Check an invariant holds for *every* generated input | `forAll` / `forAll.assert` |
| Find at least *one* input meeting a condition | `exists` |
| Sanity-check a generator visually | `g.sample()` / `g.sampleN(n)` |
| Inspect what a generator can produce, but handle the empty case explicitly | `g.generate(rng)` |

## Patterns

### Conjunction of multiple properties

```ts
forAll.assert(
  Generators.arrayOf(Generators.integer(), 50),
  xs => {
    // Both invariants must hold for every draw.
    const sorted = [...xs].sort((a, b) => a - b);
    return sorted.length === xs.length
        && sorted.every((v, i) => i === 0 || sorted[i - 1]! <= v);
  },
);
```

### A property that *should* fail (for shrinking demos)

```ts
const r = forAll(
  Generators.arrayOf(Generators.integer(), 50),
  xs => xs.every(x => x !== 0),    // false for any array containing 0
  { seed: 'demo' },
);

console.log(r.counterExample);
// { original: [12, -3, 0, 17, ...], shrunk: [0] }
```

Shrinking turns the failing 50-element array into a one-element array `[0]`,
the smallest possible witness.

### Disabling shrinking when the predicate is expensive

```ts
forAll.assert(myGen, expensivePredicate, { shrink: false });
```

### Reusing one seed across many properties

```ts
import { fromSeed, forAll, Generators } from 'loki-tscheck';

const rng = fromSeed('shared-stream');
forAll.assert(g1, p1, { rng });
forAll.assert(g2, p2, { rng });   // continues the same stream
```
