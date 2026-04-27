/*
 * Example of generating an address using nested record/objectGenerator combinators.
 *
 * Demonstrates:
 *   - record({ ... }) for plain-object shapes
 *   - oneOfValues for picking from a fixed list
 *   - nested generators (postcode lives inside the address object)
 */

import { Generators } from '../src/index.js';

const streetNames = ['Baker', 'Abbey', 'Downing', 'Carnaby', 'Portobello'];
const streetTypes = ['Street', 'Road', 'Lane', 'Avenue'];
const cities = ['London', 'Manchester', 'Bristol', 'Edinburgh', 'Cardiff'];

const street = Generators.objectGenerator(
  (number: number, name: string, type: string) => `${number} ${name} ${type}`,
  Generators.integer({ min: 1, max: 999 }),
  Generators.oneOfValues(...streetNames),
  Generators.oneOfValues(...streetTypes),
);

const postcode = Generators.objectGenerator(
  (area: string, district: number, sector: number, unit: string) =>
    `${area}${district} ${sector}${unit}`,
  Generators.stringOf(Generators.alphaUpperChar(), { minLength: 1, maxLength: 2 }),
  Generators.integer({ min: 1, max: 99 }),
  Generators.integer({ min: 0, max: 9 }),
  Generators.stringOf(Generators.alphaUpperChar(), { minLength: 2, maxLength: 2 }),
);

const address = Generators.record({
  street,
  city: Generators.oneOfValues(...cities),
  postcode,
});

const sampled = address.sample({ seed: 'address-example' });
console.log('address:', sampled);
