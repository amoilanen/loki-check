import { describe, it, expect } from 'vitest';

import { Generators } from '../../src/index.js';

describe('boolean generator', () => {
  it('produces only true or false', () => {
    const samples = Generators.boolean.sampleN(1000, { seed: 42 });
    expect(samples.every(v => v === true || v === false)).toBe(true);
  });

  it('covers both values across 1000 seeded samples', () => {
    const samples = Generators.boolean.sampleN(1000, { seed: 'cover' });
    expect(samples.includes(true)).toBe(true);
    expect(samples.includes(false)).toBe(true);
  });

  it('is deterministic for identical seeds', () => {
    const a = Generators.boolean.sampleN(200, { seed: 7 });
    const b = Generators.boolean.sampleN(200, { seed: 7 });
    expect(a).toEqual(b);
  });

  it('carries a default shrinker that reduces true to false', () => {
    const shrinker = Generators.boolean.shrinker;
    expect(shrinker).toBeDefined();
    const trueShrinks = [...(shrinker as (v: boolean) => Iterable<boolean>)(true)];
    const falseShrinks = [...(shrinker as (v: boolean) => Iterable<boolean>)(false)];
    expect(trueShrinks).toEqual([false]);
    expect(falseShrinks).toEqual([]);
  });
});
