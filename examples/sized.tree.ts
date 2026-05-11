/*
 * Example: a recursive binary-ish tree generator that uses `sized` / `resize`
 * to bound recursion depth.
 *
 * Demonstrates:
 *   - Generators.recursive(self => ...) for self-referential shapes
 *   - Generators.sized(size => ...) to read the active size hint
 *   - Generators.resize(n, g) to fix the size of a sub-generator
 *
 * The pattern -- halve the size at every recursive position -- guarantees
 * termination and lets you control the maximum depth from the call site.
 */

import { Generators, type Generator } from '../src/index.js';

interface Tree {
  value: number;
  children: Tree[];
}

const tree: Generator<Tree> = Generators.recursive<Tree>(self =>
  Generators.sized(size => {
    if (size <= 0) {
      return Generators.record<Tree>({
        value: Generators.integer({ min: 0, max: 99 }),
        children: Generators.pure([] as Tree[]),
      });
    }
    const next = Math.floor(size / 2);
    return Generators.record<Tree>({
      value: Generators.integer({ min: 0, max: 99 }),
      children: Generators.resize(next, Generators.arrayOf(self.force(), 2)),
    });
  })
);

function describe(t: Tree, depth = 0): string {
  const pad = '  '.repeat(depth);
  if (t.children.length === 0) {
    return `${pad}- ${t.value}`;
  }
  return `${pad}- ${t.value}\n${t.children.map(c => describe(c, depth + 1)).join('\n')}`;
}

const sampled = tree.sample({ seed: 'sized-tree-example' });
console.log('tree:\n' + describe(sampled));
