---
layout: home

hero:
  name: loki-check
  text: Composable, seeded data generators
  tagline: ScalaCheck-inspired generators and property-based testing for TypeScript / JavaScript.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: Browse the API
      link: /api/
    - theme: alt
      text: View on GitHub
      link: https://github.com/amoilanen/loki-check

features:
  - title: Composable combinators
    details: "Build generators for any shape from small, well-typed primitives — numbers, strings, arrays, sets, maps, dates, tuples, records, objects."
  - title: Reproducible by design
    details: "Every sample is driven by a seeded PRNG. Pass a seed to sample, sampleN, forAll, or exists and get the same output every time."
  - title: Property-based testing
    details: "forAll and exists quantifiers with built-in shrinking turn generators into the property-based test runner you've always wanted."
---

## Five-line hello world

```ts
import { Generators } from 'loki-check';

const point = Generators.record({ x: Generators.integer(), y: Generators.integer() });
console.log(point.sample({ seed: 42 }));
console.log(point.sampleN(3, { seed: 'demo' }));
```

That is the whole picture — pick a generator, call `sample`, optionally pin the
seed for reproducibility. Browse the [Guide](/guide/getting-started) for the
longer story or jump straight to the [API reference](/api/).
