import { describe, it, expect } from 'vitest';

import { Generators } from '../../src/index.js';
import { fromSeed } from '../../src/random/index.js';

describe('pick', () => {
  const xs = ['a', 'b', 'c', 'd', 'e'];

  it('returns distinct elements drawn from the source', () => {
    const g = Generators.pick(3, xs);
    for (let i = 0; i < 100; i++) {
      const out = g.generate(fromSeed(i)).get();
      expect(out).toHaveLength(3);
      expect(new Set(out).size).toBe(3);
      for (const v of out) expect(xs).toContain(v);
    }
  });

  it('is deterministic for the same seed', () => {
    const g = Generators.pick(3, xs);
    const a = g.generate(fromSeed('seed')).get();
    const b = g.generate(fromSeed('seed')).get();
    expect(a).toEqual(b);
  });

  it('throws when n exceeds the source length', () => {
    expect(() => Generators.pick(6, xs)).toThrow(RangeError);
  });

  it('throws on negative or non-integer n', () => {
    expect(() => Generators.pick(-1, xs)).toThrow(RangeError);
    expect(() => Generators.pick(1.5, xs)).toThrow(RangeError);
  });

  it('yields [] for n=0', () => {
    const g = Generators.pick(0, xs);
    expect(g.generate(fromSeed(0)).get()).toEqual([]);
  });

  it('handles n equal to source length (full permutation)', () => {
    const g = Generators.pick(xs.length, xs);
    const out = g.generate(fromSeed(7)).get();
    expect(out).toHaveLength(xs.length);
    expect([...out].sort()).toEqual([...xs].sort());
  });
});

describe('shuffle', () => {
  const xs = [1, 2, 3, 4, 5];

  it('yields a permutation with the same multiset', () => {
    const g = Generators.shuffle(xs);
    for (let i = 0; i < 50; i++) {
      const out = g.generate(fromSeed(i)).get();
      expect(out).toHaveLength(xs.length);
      expect([...out].sort((a, b) => a - b)).toEqual([...xs].sort((a, b) => a - b));
    }
  });

  it('is deterministic for the same seed', () => {
    const g = Generators.shuffle(xs);
    expect(g.generate(fromSeed(42)).get()).toEqual(g.generate(fromSeed(42)).get());
  });

  it('does not mutate the input', () => {
    const original = [1, 2, 3];
    const copy = original.slice();
    Generators.shuffle(original).generate(fromSeed(1)).get();
    expect(original).toEqual(copy);
  });

  it('handles empty input', () => {
    const g = Generators.shuffle([]);
    expect(g.generate(fromSeed(1)).get()).toEqual([]);
  });
});
