# gen.js

Composable, seeded data generators and property-based testing for TypeScript / JavaScript, inspired by ScalaCheck.

## Hello world

```ts
import { Generators } from 'gen.js';

const point = Generators.record({ x: Generators.integer(), y: Generators.integer() });
console.log(point.sample({ seed: 42 }));
```

## Documentation

Full guide and API reference: <https://antivanov.github.io/gen.js/>

## Examples

Runnable examples live in [`examples/`](./examples). Run them all with `npm run test:examples`.

## License

MIT
