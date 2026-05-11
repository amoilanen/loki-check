/*
 * Example: generating an IPv4 address.
 *
 * Demonstrates:
 *   - `byte` for an integer in [0, 255]
 *   - `lift` to combine four independent draws into a string
 *
 * An IPv4 address is just four octets joined by dots. There is nothing
 * special about generating one once you have a "byte generator" -- the
 * applicative product (`lift`) handles the rest.
 */

import { Generators, type Generator } from '../src/index.js';

const ipv4: Generator<string> = Generators.lift(
  (a: number, b: number, c: number, d: number) => `${a}.${b}.${c}.${d}`,
  Generators.byte,
  Generators.byte,
  Generators.byte,
  Generators.byte,
);

const samples = ipv4.sampleN(5, { seed: 'ipv4-example' });
for (const ip of samples) {
  console.log('ipv4:', ip);
}
