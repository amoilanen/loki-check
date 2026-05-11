/*
 * Example: a recursive JSON-shaped generator built with `recursive` + `sized`.
 *
 * Demonstrates:
 *   - recursive(self => ...) for self-referential generators
 *   - sized + resize to control recursion depth (halve at every step)
 *   - frequency for a skewed leaf-vs-branch distribution
 *   - oneOf for picking between heterogeneous leaf shapes
 *   - constant(null) to put `null` into the leaf set as a real value
 *     (pure(null) would be `none`, see the Combinators guide)
 */

import { Generators, type Generator } from '../src/index.js';

type Json =
  | null
  | boolean
  | number
  | string
  | Json[]
  | { [key: string]: Json };

const jsonLeaf: Generator<Json> = Generators.oneOf<Json>(
  Generators.constant(null),
  Generators.boolean,
  Generators.integer({ min: -100, max: 100 }),
  Generators.asciiString({ minLength: 0, maxLength: 8 }),
);

const json: Generator<Json> = Generators.recursive<Json>(self =>
  Generators.sized(size => {
    if (size <= 1) {
      return jsonLeaf;
    }
    const halfSize = Math.floor(size / 2);
    // Halve the size on every recursive position -- termination guaranteed.
    const childGen = Generators.resize(halfSize, self.force());
    return Generators.frequency<Json>(
      [8, jsonLeaf],
      [1, Generators.arrayOf(childGen, 3)],
      [1, Generators.mapOf(
        Generators.identifier(4),
        childGen,
        { minSize: 0, maxSize: 3 },
      ).map(m => Object.fromEntries(m.entries()) as { [k: string]: Json })],
    );
  })
);

const values = json.sampleN(3, { seed: 'json-example' });
for (const v of values) {
  console.log('json:', JSON.stringify(v));
}
