# loki-check

<p>
  <img src="./assets/logo.jpg" alt="loki-check — raven mascot, in the spirit of the Norse sagas" width="80" align="left" hspace="16" vspace="8" />
  <strong>× ᛚᚢᚴᛁ ᚠᚱᚢᚦᚢᚾ ×</strong><br/>
  <em>"Loki, the shape-shifter of the sagas, slips between forms to test everybody."</em>
</p>


<br/>
<br/>
<br/>

Composable, seeded data generators and property-based testing for TypeScript / JavaScript, in the spirit of ScalaCheck - and named for the Norse trickster of the Eddas. Like Loki of the sagas, the library shape-shifts your inputs, slipping unexpected values past your assumptions until your invariants hold under every guise.

## Hello world

```ts
import { Generators } from 'loki-check';

const point = Generators.record({ x: Generators.integer(), y: Generators.integer() });
console.log(point.sample({ seed: 42 }));
```

## Documentation

Full guide and API reference: <https://amoilanen.github.io/loki-check/>

## Examples

Runnable examples live in [`examples/`](./examples). Run them all with `npm run test:examples`.

## License

MIT
