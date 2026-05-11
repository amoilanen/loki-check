# Shrinking

A property-based test that says "this property failed on `[42, -1733, 9081, ...]`
of length 1000" is not very helpful. Shrinking turns that into "this property
failed on `[0]`", the *smallest* failing input the runner can find.

`loki-tscheck` ships default shrinkers for every built-in combinator, so you
get this behaviour out of the box. This page covers the model, when to write
your own shrinker, and how to do it.

## What a shrinker is

```ts
type Shrinker<T> = (value: T) => Iterable<T>;
```

A shrinker is a function that, given a failing value, **lazily** produces
candidate "smaller" replacements. The runner walks the iterable looking for
candidates that *still fail* the predicate, and recurses on the smallest one
it finds.

Two properties make a shrinker useful:

1. **Monotonic toward simplicity.** Each candidate should be obviously smaller
   than the input. Fewer elements, smaller magnitude, fewer constructors.
2. **Bounded.** The iterable must be finite (or at least the budget cap will
   force termination). Lazy generators (function generators with `yield`)
   work beautifully here.

## Defaults that come for free

Every built-in combinator already carries a shrinker:

| Combinator | Default shrinker behaviour |
| ---------- | -------------------------- |
| `integer` / `float` / `byte` / `posInt` / `negInt` / `smallInt` / `nonZeroInt` | Walk toward `0` (also flip the sign for negatives). |
| `boolean` | Yield `false` when the input is `true`. |
| `asciiString` / `unicodeString` / `numericString` / `concat` / `repeat` | Shorter prefixes, single-character deletions, and simpler ASCII replacements. |
| `arrayOf` / `arrayOfLength` / `nonEmptyArray` / `times` | Shrink each element (using the element shrinker), then shrink toward shorter prefixes. |
| `setOf` / `mapOf` | Shrink toward smaller collections. |
| `nTuple` / `record` / `object` | Shrink each component independently. |
| `date` / `dateBetween` / `isoDateString` | Walk toward `new Date(0)`. |
| `pick` / `shuffle` | Shrink toward shorter prefixes. |

Two consequences worth remembering:

- **Composition does the right thing.** If you build a generator out of
  built-in pieces with `record` / `nTuple` / `arrayOf`, your custom generator
  *automatically* inherits a sensible shrinker for the whole structure.
- **Custom-class generators do not.** `object(Class, ...)` cannot synthesise
  a shrinker for an unknown constructor. See below for attaching one.

## When does a custom shrinker matter?

You will reach for `withShrinker` when:

- You write a generator that does *not* use the built-in combinators (a
  hand-rolled `class extends Generator<T>` for example).
- Your domain has its own notion of "smaller" that the structural default
  cannot know about. For example, a `Money { amount, currency }` value
  shrinking by currency precedence, or an `IPv4` value shrinking toward
  `0.0.0.0`.
- You want to *disable* the default shrinker to debug a flaky shrinking
  result.

## Attaching a custom shrinker

`withShrinker` returns a new generator with the shrinker swapped in. The
value-generation logic is preserved.

```ts
import { Generators, type Shrinker } from 'loki-tscheck';

class Money {
  constructor(readonly amount: number, readonly currency: string) {}
}

// Default: object(Class, ...) carries no shrinker.
const money = Generators.object(Money,
  Generators.float({ min: 0, max: 1000 }),
  Generators.oneOfValues('USD', 'EUR', 'GBP'),
);

// Custom shrinker: shrink the amount toward 0, and prefer USD.
const shrinkMoney: Shrinker<Money> = function* (m) {
  if (m.amount > 0) {
    yield new Money(0, m.currency);
    yield new Money(Math.floor(m.amount / 2), m.currency);
  }
  if (m.currency !== 'USD') {
    yield new Money(m.amount, 'USD');
  }
};

const moneyWithShrinker = money.withShrinker(shrinkMoney);
```

When `forAll` finds a counter-example involving `Money`, the runner walks
through these candidates looking for the smallest one that still fails.

## Writing a `Shrinker<T>`, the four-step recipe

1. **Yield the trivial value first.** If a property fails on `[1, 2, 3]` and
   it also fails on `[]`, the runner should find `[]` immediately. Put the
   simplest candidate at the top of the iterable.
2. **Then yield halvings.** Halving is the standard QuickCheck heuristic, it
   converges in `O(log n)` steps. For arrays, yield shorter prefixes; for
   numbers, yield divisions by 2; for nested structures, yield each
   sub-shrunk version.
3. **Then yield local edits.** Drop one element, replace one field, swap one
   character. These are the "last mile" candidates.
4. **Make it lazy.** Use a generator function (`function*`) so the runner
   only computes the candidates it actually needs.

```ts
function* shrinkArray<T>(xs: readonly T[]): Iterable<T[]> {
  if (xs.length === 0) return;
  yield [];                              // 1. trivial
  if (xs.length > 1) {
    yield xs.slice(0, Math.floor(xs.length / 2));   // 2. halving
  }
  for (let i = 0; i < xs.length; i++) {
    yield [...xs.slice(0, i), ...xs.slice(i + 1)];  // 3. local edit (drop i)
  }
}
```

(This is structurally what the built-in array shrinker does, modulo
element-level shrinking.)

## How `forAll` uses the shrinker

When `forAll` finds a counter-example `x0`, it asks the attached shrinker for
candidates and runs the predicate against each one. Whenever it finds a
candidate that *also* fails, it recurses, using that candidate's own
shrinker, until either:

- No candidate fails, or
- The `shrinkBudget` (default 1000 predicate evaluations) is exhausted.

The smallest failing value found is reported as `counterExample.shrunk`.
`counterExample.original` is the first failing value drawn from the
generator, before shrinking.

```ts
const r = forAll(arrayOfInts, p, { shrinkBudget: 500 });
// r.counterExample = { original: ..., shrunk: ... }
```

## Disabling shrinking

Two ways:

```ts
forAll.assert(myGen, predicate, { shrink: false });
```

That turns shrinking off entirely. Or, on a specific generator:

```ts
const noShrink: Shrinker<T> = function* () { /* yields nothing */ };
const g = myGen.withShrinker(noShrink);
```

This is occasionally useful when:

- The predicate has heavy side-effects (database writes, network calls) and
  you do not want it called many extra times after a failure.
- You are debugging the shrinker itself and want to see the *first* failing
  draw.

## A complete worked example

See [`examples/custom.shrinker.ts`](/examples/custom-shrinker) for a runnable
file that attaches a domain-aware shrinker and demonstrates the shrunk
counter-example coming back from `forAll`.

## Caveats and tips

- **Avoid infinite shrinkers.** A common bug is to yield the *same* value as
  the input. That will be retried forever (up to the budget). Always make
  sure each yielded candidate is strictly smaller than the input.
- **Shrinkers can be wrong without breaking correctness.** A bad shrinker
  just means the runner reports a less-minimal counter-example; the property
  is still correctly identified as failing.
- **`record` and `nTuple` re-use child shrinkers.** If your `record` field is
  a number with the default shrinker, you do not need to touch anything. The
  `record` shrinker already shrinks each field with its own shrinker.
- **For custom classes, attach a shrinker.** `object(Class, ...)` cannot
  derive a useful shrinker on its own. Pass one with `withShrinker(...)`
  when shrinking matters.
