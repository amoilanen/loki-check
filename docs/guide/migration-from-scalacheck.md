# Migrating from ScalaCheck

`check-loki` is heavily inspired by [ScalaCheck](https://github.com/typelevel/scalacheck).
The shapes carry over almost 1:1, but the names and call conventions are
adjusted to feel native to TypeScript / JavaScript.

## Terminology

| ScalaCheck | check-loki | Notes |
| ---------- | ------ | ----- |
| `Gen[T]` | `Generator<T>` | Parameterised type, identical role. |
| `Gen.const(x)` | `Generators.pure(x)` | |
| `Gen.oneOf(g1, g2, ...)` | `Generators.oneOf(g1, g2, ...)` | |
| `Gen.oneOf(values)` | `Generators.oneOfValues(...values)` | Spread the values. |
| `Gen.frequency((w, g), ...)` | `Generators.frequency([w, g], ...)` | Tuples become arrays. |
| `Gen.choose(min, max)` | `Generators.choose(min, max)` | Inclusive range, integers. |
| `Gen.listOf(g)` | `Generators.listOf(g, maxLength)` / `Generators.arrayOf(...)` | check-loki requires a max length. |
| `Gen.listOfN(n, g)` | `Generators.listOfN(g, n)` / `Generators.arrayOfLength(g, n)` | Argument order flipped. |
| `Gen.nonEmptyListOf(g)` | `Generators.nonEmptyListOf(g, maxSize)` | |
| `Gen.containerOf[Set, T](g)` | `Generators.setOf(g, opts)` | |
| `Gen.mapOf(kg, vg)` | `Generators.mapOf(kg, vg, opts)` | |
| `Arbitrary.arbInt` | `Generators.integer()` | |
| `Arbitrary.arbBool` | `Generators.boolean` | |
| `Arbitrary.arbDate` | `Generators.date` | |
| `Gen.alphaNumStr` | `Generators.alphaNumString(length)` | check-loki takes an explicit length. |
| `Gen.uuid` | `Generators.uuid()` | |
| `g.suchThat(p)` | `g.filter(p)` or `Generators.suchThat(g, p)` | |
| `g.flatMap(f)` | `g.flatMap(f)` | Same shape. |
| `g.map(f)` | `g.map(f)` | Same shape. |
| `forAll { x => prop }` | `forAll(g, x => prop)` | check-loki is a function, not an implicit. |
| `Prop.exists { x => ... }` | `exists(g, x => ...)` | |
| `Test.Parameters.withMinSuccessfulTests(n)` | `forAll(g, p, { tries: n })` | |
| `Gen.sized(s => g(s))` | `Generators.sized(s => g(s))` | |
| `g.resize(n)` | `Generators.resize(n, g)` | check-loki exposes it as a free function. |
| Shrinker (auto-derived) | Default shrinkers attached to built-ins; override with `g.withShrinker(...)` | |

## Calling conventions

ScalaCheck makes heavy use of implicit parameters and Scala-isms (`Arbitrary`,
`Cogen`, `Prop`). `check-loki` is deliberately function-based:

```ts
// ScalaCheck
forAll { (xs: List[Int]) => xs.reverse.reverse == xs }

// check-loki
forAll.assert(
  Generators.arrayOf(Generators.integer(), 50),
  xs => {
    const r = [...xs].reverse().reverse();
    return r.every((v, i) => v === xs[i]) && r.length === xs.length;
  },
);
```

## What check-loki does *not* try to be

- **An `Arbitrary` typeclass system**. TypeScript's structural typing makes
  implicits awkward, so each combinator is named explicitly.
- **A test framework**. `forAll` / `forAll.assert` are designed to plug into
  whichever runner you already use.
- **A coverage / classify reporter**. Out of scope for v0.x; revisit if needed.

For everything else (the primitives, the composition story, the seeded
shrinking) it should feel familiar.
