/*
 * Example: a round-trip property, a classic property-based testing pattern.
 *
 * Property:
 *   forall x. decode(encode(x)) === x
 *
 * Round-trip properties are powerful because the predicate is *cheap to
 * state* and catches a huge class of bugs: missing fields, type confusion,
 * encoding mismatches, lossy serialisation, etc. Almost every serialiser,
 * parser, and codec in your codebase has at least one round-trip law worth
 * testing.
 *
 * Here we test a simple `Point` codec: `{x, y} -> "x,y" -> {x, y}`.
 *
 * Demonstrates:
 *   - forAll.assert as a test-runner-compatible entry point
 *   - record({...}) to build the input generator
 *   - keeping the value generator pinned to the *domain* of the codec
 *     (otherwise edge cases like commas in numbers would break encoding)
 */

import { forAll, Generators, type Generator } from '../src/index.js';

interface Point { x: number; y: number; }

function encode(p: Point): string {
  return `${p.x},${p.y}`;
}

function decode(s: string): Point {
  const [xs, ys] = s.split(',');
  return { x: Number(xs), y: Number(ys) };
}

const point: Generator<Point> = Generators.record<Point>({
  x: Generators.integer({ min: -1_000_000, max: 1_000_000 }),
  y: Generators.integer({ min: -1_000_000, max: 1_000_000 }),
});

forAll.assert(
  point,
  (p) => {
    const round = decode(encode(p));
    return round.x === p.x && round.y === p.y;
  },
  { tries: 500, seed: 'round-trip-example' },
);

console.log('property holds: decode(encode(p)) === p');
