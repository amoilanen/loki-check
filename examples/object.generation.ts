/*
 * Example of generating an object by building a generator from its field generators.
 */

import { Generators } from '../src/index.js';

class Person {
  constructor(
    readonly name: string,
    readonly surname: string,
    readonly age: number,
    readonly city: string,
  ) {}
}

const names = ['John', 'Martin', 'George', 'Oliver', 'Olivia', 'Sophia', 'Lily', 'Freya', 'Ella'];
const surnames = ['Smith', 'Jones', 'Brown', 'Taylor'];
const cities = ['London', 'Liverpool', 'Bristol', 'Manchester', 'Bolton'];

const personGen = Generators.object(
  Person,
  Generators.oneOfValues(...names),
  Generators.oneOfValues(...surnames),
  Generators.integer({ min: 0, max: 120 }),
  Generators.oneOfValues(...cities),
);

const person = personGen.sample({ seed: 'object-generation-example' });
console.log('person:', person);
