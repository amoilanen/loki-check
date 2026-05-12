# Recipes

Common patterns, written as small composable snippets. Each one is a
self-contained generator you can drop into your project, or more often a
template to adapt to your own domain.

## Realistic identifiers

### Email address

```ts
import { Generators, type Generator } from 'check-loki';

const atom = Generators.stringOf(Generators.alphaNumChar(), { minLength: 1, maxLength: 8 });

const local = Generators.integer({ min: 1, max: 3 })
  .flatMap(n => Generators.arrayOfLength(atom, n).map(parts => parts.join('.')));

const domain = Generators.lift(
  (host: string, tld: string) => `${host}.${tld}`,
  Generators.identifier(10),
  Generators.oneOfValues('com', 'net', 'org', 'dev', 'io'),
);

export const email: Generator<string> = Generators.lift(
  (l: string, d: string) => `${l}@${d}`,
  local,
  domain,
);
```

Also available as a runnable file: [`examples/email.ts`](/examples/email).

### UK postcode

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

### URL with optional query

```ts
const httpScheme = Generators.oneOfValues('http', 'https');

const url = Generators.lift(
  (scheme: string, host: string, tld: string, path: string[], query?: string) => {
    const base = `${scheme}://${host}.${tld}/${path.join('/')}`;
    return query ? `${base}?${query}` : base;
  },
  httpScheme,
  Generators.identifier(10),
  Generators.oneOfValues('com', 'net', 'org'),
  Generators.arrayOf(Generators.identifier(6), 3),
  Generators.option(Generators.identifier(8), { someProbability: 0.4 }),
);
```

## Realistic shapes

### A nested record

```ts
interface User {
  id: string;
  email: string;
  profile: {
    name: string;
    age: number;
    favouriteColour: 'red' | 'green' | 'blue';
  };
  createdAt: Date;
}

const user = Generators.record<User>({
  id: Generators.uuid(),
  email: email,                                   // from above
  profile: Generators.record({
    name: Generators.identifier(10),
    age: Generators.integer({ min: 18, max: 99 }),
    favouriteColour: Generators.oneOfValues('red', 'green', 'blue'),
  }),
  createdAt: Generators.dateBetween(
    new Date('2020-01-01'),
    new Date('2030-01-01'),
  ),
});
```

Note that `record` infers the exact field types. There is no `as User` cast,
and TypeScript will reject a missing or extra field at compile time.

### A discriminated union

```ts
type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'square'; side: number }
  | { kind: 'rect'; width: number; height: number };

const shape: Generator<Shape> = Generators.oneOf<Shape>(
  Generators.record({
    kind: Generators.pure<'circle'>('circle'),
    radius: Generators.float({ min: 0, max: 100 }),
  }),
  Generators.record({
    kind: Generators.pure<'square'>('square'),
    side: Generators.float({ min: 0, max: 100 }),
  }),
  Generators.record({
    kind: Generators.pure<'rect'>('rect'),
    width: Generators.float({ min: 0, max: 100 }),
    height: Generators.float({ min: 0, max: 100 }),
  }),
);
```

### A recursive tree

```ts
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
          children: Generators.resize(
            Math.floor(size / 2),
            Generators.arrayOf(self.force(), 3),
          ),
        })
  )
);
```

See [`examples/sized.tree.ts`](/examples/sized-tree) and
[`examples/json.ts`](/examples/json) for runnable variants.

## Realistic distributions

### Mostly valid, occasionally invalid

A common pattern when fuzzing parsers is to generate inputs that are *mostly*
valid, with the occasional malformed value to make sure the error path is
exercised too:

```ts
const mostlyValidJson = Generators.frequency(
  [9, Generators.isoDateString.map(d => `{"date":"${d}"}`)],
  [1, Generators.asciiString({ maxLength: 20 })],   // sometimes total garbage
);
```

### Skewed integer distribution

```ts
const httpStatus = Generators.frequencyOfValues(
  [80, 200],
  [10, 404],
  [5, 500],
  [5, 503],
);
```

## Property-test recipes

### Round-trip

For any encoder / decoder pair, the round-trip property is essentially free:

```ts
forAll.assert(user, u => {
  const round = JSON.parse(JSON.stringify(u));
  return deepEqual(round, { ...u, createdAt: u.createdAt.toISOString() });
});
```

### Idempotence

```ts
forAll.assert(asciiString, s => s.trim() === s.trim().trim());
```

### Algebraic laws

```ts
// Associativity of string concatenation.
forAll.assert(
  Generators.nTuple(Generators.asciiString(), Generators.asciiString(), Generators.asciiString()),
  ([a, b, c]) => (a + b) + c === a + (b + c),
);
```

### Postcondition / invariant

```ts
forAll.assert(Generators.arrayOf(Generators.integer(), 50), xs => {
  const sorted = [...xs].sort((a, b) => a - b);
  // Two invariants: same length, non-decreasing.
  return sorted.length === xs.length
      && sorted.every((v, i) => i === 0 || sorted[i - 1]! <= v);
});
```

See [`examples/sorted.array.ts`](/examples/sorted-array) for a runnable
version.

### Model-based testing

When the system under test is stateful, drive it with a generated sequence of
operations and compare against a simple reference model:

```ts
type Op =
  | { kind: 'push'; value: number }
  | { kind: 'pop' }
  | { kind: 'peek' };

const op: Generator<Op> = Generators.oneOf<Op>(
  Generators.record({ kind: Generators.pure<'push'>('push'),
                      value: Generators.integer({ min: -100, max: 100 }) }),
  Generators.pure<Op>({ kind: 'pop' }),
  Generators.pure<Op>({ kind: 'peek' }),
);

const programs = Generators.arrayOf(op, 50);

forAll.assert(programs, ops => {
  const real = new MyFancyStack<number>();
  const model: number[] = [];
  for (const o of ops) {
    switch (o.kind) {
      case 'push':
        real.push(o.value); model.push(o.value); break;
      case 'pop':
        if (real.pop() !== model.pop()) return false; break;
      case 'peek':
        if (real.peek() !== model[model.length - 1]) return false; break;
    }
  }
  return true;
});
```

## Performance recipes

### Capping draw size with `resize`

```ts
// Cap the maximum size of arrays inside this sub-generator to 10.
const small = Generators.resize(10, Generators.arrayOf(Generators.integer(), 100));
```

### Avoiding filter when possible

```ts
// Worse: rejects half the draws.
const positiveBad = Generators.integer().filter(n => n > 0);

// Better: produces only positive values, no rerolls.
const positiveGood = Generators.integer({ min: 1 });
```

### Reusing one seeded `rng` across many calls

```ts
import { fromSeed, Generators } from 'check-loki';

const rng = fromSeed('fixtures');
const fixtures = {
  users: Generators.arrayOfLength(user, 20).sample({ rng }),
  posts: Generators.arrayOfLength(post, 50).sample({ rng }),
  tags:  Generators.arrayOfLength(tag,  10).sample({ rng }),
};
// Reproducible across runs; each batch consumes from the same stream.
```

## Where the example files live

Everything above is illustrated by a runnable file in [`examples/`](/examples/):

| Recipe | File |
| ------ | ---- |
| Address (nested `record` + `objectGenerator`) | [`address.ts`](/examples/address) |
| Class instance via `object(Class, ...)` | [`object.generation.ts`](/examples/object-generation) |
| Phone number string template | [`phone.ts`](/examples/phone) |
| Email via `flatMap` + `lift` | [`email.ts`](/examples/email) |
| UUID-shaped string | [`uuid.ts`](/examples/uuid) |
| Identifier with reserved-word filter | [`variable.name.ts`](/examples/variable-name) |
| Recursive JSON value | [`json.ts`](/examples/json) |
| Sized recursive tree | [`sized.tree.ts`](/examples/sized-tree) |
| Manual generator extending the base class | [`build.from.scratch.ts`](/examples/build-from-scratch) |
| `forAll.assert` property test | [`property-test.ts`](/examples/property-test) |
| Property test on a real algorithm | [`sorted.array.ts`](/examples/sorted-array) |
| Custom shrinker via `withShrinker` | [`custom.shrinker.ts`](/examples/custom-shrinker) |
