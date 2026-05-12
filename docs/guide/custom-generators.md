# Building custom generators

The whole point of a property-based testing library is that you can describe
*your own* data. This page walks through the patterns for doing that, from
trivial transformations up to fully recursive shapes, using only the
[monadic composition primitives](./concepts.md#composing-with-map-and-flatmap)
and the [built-in combinators](./combinators.md).

## The smallest possible custom generator

A generator that returns a single fixed value:

```ts
import { Generators } from 'check-loki';

const pi = Generators.pure(3.14159);
pi.sample();   // 3.14159, always
```

`pure` is the *applicative unit*. Most non-trivial generators will use it in
exactly one place: to inject a literal value into a `concat` / `lift` /
`flatMap` chain.

### Generating `null` or `undefined`

`pure` deliberately routes `null` / `undefined` to `none` so the
underlying `Maybe<T>` carrier can encode "absence". If you genuinely
want `null` or `undefined` as a *value*, reach for `constant`:

```ts
Generators.pure(null).generate();         // none
Generators.constant(null).generate();     // Some(null)
Generators.constant(undefined).sample();  // undefined
```

This makes `constant` the right tool for "this branch of my union is the
literal `null`": for example, modelling a JSON-shaped value where
`null` is a real leaf.

## Pattern 1: `map`, reshape a value

Use `map` when the value you want is a *function of* a value you already know
how to generate.

```ts
// Even integers, via doubling.
const even = Generators.integer({ min: 0, max: 1_000_000 }).map(n => n * 2);

// Negative-or-positive integer, never zero.
const nonZero = Generators.integer().map(n => n === 0 ? 1 : n);

// ISO date string, from a Date generator.
const isoDate = Generators.date.map(d => d.toISOString());
```

`map` does not change the *shape* of the randomness. The underlying RNG is
called the same number of times whether you map or not, so it is cheap.

## Pattern 2: `flatMap`, dependent draws

Use `flatMap` when the *next generator* depends on a previously drawn value.

```ts
// First pick a length, then build an array of exactly that length.
const variableLengthArray = Generators.integer({ min: 1, max: 10 })
  .flatMap(n => Generators.arrayOfLength(Generators.integer(), n));

// A string whose first character is always 'x'.
const xPrefixed = Generators.alphaLowerChar()
  .flatMap(prefix =>
    Generators.alphaNumString(5).map(suffix => `x${suffix}`)
  );
```

This is the *monadic bind*. Every combinator you cannot find in the library
can be written in terms of it.

## Pattern 3: applicative product, independent fields

When the components of your value are independent, reach for `record`,
`object`, `lift`, or `nTuple`. Each of them draws one value per inner
generator and combines the results.

```ts
import { Generators } from 'check-loki';

// Plain object
interface User { id: string; name: string; age: number; }
const user = Generators.record<User>({
  id: Generators.uuid(),
  name: Generators.identifier(8),
  age: Generators.integer({ min: 18, max: 99 }),
});

// Class instance
class Money {
  constructor(public readonly amount: number, public readonly currency: string) {}
}
const money = Generators.object(Money,
  Generators.float({ min: 0, max: 1000 }),
  Generators.oneOfValues('USD', 'EUR', 'GBP'),
);

// Function applicative, value is derived
const fullName = Generators.lift(
  (first: string, last: string) => `${first} ${last}`,
  Generators.identifier(6),
  Generators.identifier(8),
);

// Tuple
const point = Generators.nTuple(
  Generators.integer({ min: 0, max: 100 }),
  Generators.integer({ min: 0, max: 100 }),
);
```

These are all the *same* applicative pattern in four packages. Pick whichever
shape the consumer wants back.

## Pattern 4: choice via `oneOf`, `frequency`, `pure`

When the value is "one of these alternatives":

```ts
// Uniform choice between values.
const colour = Generators.oneOfValues('red', 'green', 'blue');

// Uniform choice between generators.
const lengthClass = Generators.oneOf(
  Generators.integer({ min: 0, max: 9 }),       // "short"
  Generators.integer({ min: 1_000, max: 9_999 }), // "long"
);

// Weighted choice.
const skewedBool = Generators.frequency(
  [3, Generators.pure(true)],
  [1, Generators.pure(false)],
);

// Weighted choice between values (no need to lift them).
const httpStatus = Generators.frequencyOfValues(
  [80, 200],
  [10, 404],
  [5, 500],
  [5, 503],
);
```

## Pattern 5: filtering with `filter` and `suchThat`

When the easiest way to describe your value is "almost anything, but not X":

```ts
const positive = Generators.integer().filter(n => n > 0);
const nonReserved = Generators.identifier(8).filter(name => !RESERVED.has(name));
```

Two important caveats:

1. **Filtering is a blunt instrument.** Each rejection wastes a draw. If your
   predicate rejects more than ~50% of values, refactor the generator to
   produce only-valid values directly. `Generators.integer({ min: 1 })` is
   always better than `Generators.integer().filter(n => n > 0)`.
2. **Filtering can yield `none`.** After `retries` failed attempts (default
   100), the generator yields `none` rather than looping forever. `sample`
   converts that to a thrown `GenError`, `generate` lets you observe it.

## Pattern 6: recursive shapes via `recursive` + `sized`

Self-referential generators (trees, JSON, ASTs, linked lists) need two things:

1. **Lazy self-reference** so construction does not loop.
2. **A size budget** so generation does not loop.

`Generators.recursive(self => ...)` gives you the first.
`Generators.sized` / `Generators.resize` give you the second.

```ts
import { Generators, type Generator } from 'check-loki';

type Tree = { value: number; children: Tree[] };

const tree: Generator<Tree> = Generators.recursive<Tree>(self =>
  Generators.sized(size =>
    size <= 0
      ? Generators.record<Tree>({
          value: Generators.integer(),
          children: Generators.pure([] as Tree[]),
        })
      : Generators.record<Tree>({
          value: Generators.integer(),
          // halve the size on every recursion, termination guaranteed
          children: Generators.resize(
            Math.floor(size / 2),
            Generators.arrayOf(self.force(), 3),
          ),
        })
  )
);

tree.sample({ seed: 'tree-1' });
```

The general recipe:

- **Base case** when `size <= 0`. No further recursion.
- **Inductive case** otherwise. Every recursive position is wrapped in
  `resize(Math.floor(size / k), ...)` for some `k >= 2`.

`self.force()` defers the recursive `Generators.recursive(block)` call until
draw time. That is why the construction does not loop.

## Pattern 7: writing a generator from scratch

If you need a generator that no combinator covers, you can always extend
the `Generator` abstract class directly. You rarely need to (`map` /
`flatMap` / `pure` express any pure generator), but it is sometimes the
clearest path for combinators that touch the RNG directly.

```ts
import {
  Generator,
  Maybe,
  Some,
  none,
  type Random,
  defaultRandom,
} from 'check-loki';

class WeightedFlip extends Generator<boolean> {
  constructor(private readonly pTrue: number) { super(); }
  generate(rng: Random = defaultRandom()): Maybe<boolean> {
    if (this.pTrue < 0 || this.pTrue > 1) return none;
    return new Some(rng.next() < this.pTrue);
  }
}

const fairCoin    = new WeightedFlip(0.5);
const loadedCoin  = new WeightedFlip(0.9);
```

Two things to note:

- `generate` is the *whole* contract: receive an `rng`, return a `Maybe<T>`.
- Returning `none` is the right thing to do whenever the generator cannot
  produce a value. The runner will treat it as a missed draw.

If your custom generator could benefit from shrinking, attach a shrinker:

```ts
const flipWithShrink = new WeightedFlip(0.9).withShrinker(function* (v) {
  if (v) yield false;
});
```

See [the Shrinking guide](./shrinking.md) for details.

## Pattern 8: deriving from a domain rule

Some of the cleanest custom generators are direct translations of a *rule*
about valid values. For example, a UK postcode:

```
AREA (1-2 letters) + DISTRICT (1-2 digits) + ' ' + SECTOR (1 digit) + UNIT (2 letters)
```

translates directly into:

```ts
const postcode = Generators.lift(
  (area: string, district: number, sector: number, unit: string) =>
    `${area}${district} ${sector}${unit}`,
  Generators.stringOf(Generators.alphaUpperChar(), { minLength: 1, maxLength: 2 }),
  Generators.integer({ min: 1, max: 99 }),
  Generators.integer({ min: 0, max: 9 }),
  Generators.stringOf(Generators.alphaUpperChar(), { minLength: 2, maxLength: 2 }),
);
```

This translation - *"a value is a function of these independently-drawn
parts"* - is the recurring shape of every applicative generator.

## Pattern 9: making your generator reproducible

Always test that your custom generator respects the seed:

```ts
const x1 = myGen.sample({ seed: 'check' });
const x2 = myGen.sample({ seed: 'check' });
console.assert(deepEqual(x1, x2));
```

If `x1 !== x2`, your generator is consuming randomness from somewhere outside
the supplied `rng`, most likely `Math.random()`. Always thread the `rng`
argument through every nested `generate` call.

## A complete worked example: email addresses

Putting everything together. An email is `local @ domain`, where:

- `local` is one or more alphanumeric "atoms" joined by dots.
- `domain` is a host plus a TLD from a known list.

```ts
import { Generators, type Generator } from 'check-loki';

const atom: Generator<string> = Generators.stringOf(
  Generators.alphaNumChar(),
  { minLength: 1, maxLength: 8 },
);

const local: Generator<string> = Generators.integer({ min: 1, max: 3 })
  .flatMap(n => Generators.arrayOfLength(atom, n).map(parts => parts.join('.')));

const domain: Generator<string> = Generators.lift(
  (host: string, tld: string) => `${host}.${tld}`,
  Generators.identifier(10),
  Generators.oneOfValues('com', 'net', 'org', 'dev', 'io'),
);

export const email: Generator<string> = Generators.lift(
  (l: string, d: string) => `${l}@${d}`,
  local,
  domain,
);

email.sample({ seed: 'mail-1' });
// e.g. 'q1pa.kxd@ze38np9.dev'
```

Everything in that snippet is either a built-in combinator or the three
verbs you already know: `flatMap`, `lift`, `map`. There is no special
"email DSL", just functions composed with the same tools you use for the
rest of your code.

This example is also runnable in [`examples/email.ts`](/examples/email).

## Where to next?

- [Shrinking](./shrinking.md): attach a shrinker so failures are minimised.
- [Recipes](./recipes.md): more end-to-end patterns - model-based tests,
  stateful systems, environment-shaped data.
- [Combinators reference](./combinators.md): the full toolbox.
