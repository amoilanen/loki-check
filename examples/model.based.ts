/*
 * Example: model-based testing.
 *
 * Model-based testing is a powerful pattern for *stateful* systems. The
 * idea:
 *
 *   1. Define a tiny, *obviously correct* reference implementation (the
 *      "model") -- usually an in-memory data structure.
 *   2. Generate a random *sequence of operations*.
 *   3. Replay the sequence against both the model and the real system.
 *   4. Assert their observable states stay in lockstep after every step.
 *
 * If the system-under-test ever diverges from the model, you have a
 * counter-example: the smallest failing sequence of operations.
 *
 * Here we test a `Stack<number>` against a plain `number[]` model. The
 * stack is correct -- this example shows the *pattern*, not a bug hunt.
 * Flip `BUGGY = true` to inject a fault and watch the property fail with
 * a minimal operation sequence.
 *
 * Demonstrates:
 *   - operations as a discriminated union via `oneOf`
 *   - `arrayOf` to draw a sequence of any length
 *   - `forAll` with a non-trivial predicate that walks a state machine
 */

import { forAll, Generators, type Generator } from '../src/index.js';

type Op =
  | { kind: 'push'; value: number }
  | { kind: 'pop' }
  | { kind: 'peek' }
  | { kind: 'size' };

const BUGGY = false;

class Stack<T> {
  private readonly data: T[] = [];
  push(v: T) { this.data.push(v); }
  pop(): T | undefined {
    // Toggle BUGGY to see the property fail with a minimal counter-example.
    if (BUGGY && this.data.length === 1) return undefined;
    return this.data.pop();
  }
  peek(): T | undefined { return this.data[this.data.length - 1]; }
  size(): number { return this.data.length; }
}

const op: Generator<Op> = Generators.oneOf<Op>(
  Generators.integer({ min: -100, max: 100 }).map(value => ({ kind: 'push', value })),
  Generators.pure<Op>({ kind: 'pop' }),
  Generators.pure<Op>({ kind: 'peek' }),
  Generators.pure<Op>({ kind: 'size' }),
);

const program: Generator<Op[]> = Generators.arrayOf(op, 50);

function run(ops: readonly Op[]): boolean {
  const system = new Stack<number>();
  const model: number[] = [];

  for (const o of ops) {
    switch (o.kind) {
      case 'push':
        system.push(o.value);
        model.push(o.value);
        break;
      case 'pop': {
        const a = system.pop();
        const b = model.pop();
        if (a !== b) return false;
        break;
      }
      case 'peek': {
        const a = system.peek();
        const b = model[model.length - 1];
        if (a !== b) return false;
        break;
      }
      case 'size': {
        if (system.size() !== model.length) return false;
        break;
      }
    }
    // Loop-invariant check after every step.
    if (system.size() !== model.length) return false;
    if (system.peek() !== model[model.length - 1]) return false;
  }
  return true;
}

const r = forAll(program, run, { tries: 300, seed: 'model-based-example' });

if (r.ok) {
  console.log(`model-based property held over ${r.triesRun} sequences`);
} else {
  console.log('model-based property failed!');
  console.log('  seed:    ', r.seed);
  console.log('  shrunk:  ', JSON.stringify(r.counterExample!.shrunk));
}
