import { describe, it, expect } from 'vitest';

import { Generators } from '../../src/index.js';
import { fromSeed } from '../../src/random/index.js';

describe('suchThat', () => {
  it('returns only values satisfying the predicate', () => {
    const evenInt = Generators.suchThat(
      Generators.integer({ min: -100, max: 100 }),
      n => n % 2 === 0
    );
    for (let i = 0; i < 500; i++) {
      const v = evenInt.sample({ seed: i });
      expect(Math.abs(v % 2)).toBe(0);
    }
  });

  it('yields none after exhausting the retry budget', () => {
    const impossible = Generators.suchThat(Generators.pure(1), n => n === 2, {
      retries: 5,
    });
    expect(impossible.generate(fromSeed(1)).isDefined).toBe(false);
  });

  it('is deterministic for the same seed', () => {
    const g = Generators.suchThat(Generators.integer({ min: 0, max: 1000 }), n => n > 10);
    const a = g.sampleN(50, { seed: 'k' });
    const b = g.sampleN(50, { seed: 'k' });
    expect(a).toEqual(b);
  });

  it('matches Generator.prototype.filter behaviour', () => {
    const source = Generators.integer({ min: -50, max: 50 });
    const a = Generators.suchThat(source, n => n > 0).sampleN(20, { seed: 's' });
    const b = source.filter(n => n > 0).sampleN(20, { seed: 's' });
    expect(a).toEqual(b);
  });
});
