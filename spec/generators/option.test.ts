import { describe, it, expect } from 'vitest';

import { Generators } from '../../src/index.js';

describe('option generator', () => {
  it('with someProbability: 1 never returns undefined', () => {
    const g = Generators.option(Generators.pure(7), { someProbability: 1 });
    const samples = g.sampleN(500, { seed: 'always' });
    expect(samples.every(v => v === 7)).toBe(true);
  });

  it('with someProbability: 0 always returns undefined', () => {
    const g = Generators.option(Generators.pure(7), { someProbability: 0 });
    const samples = g.sampleN(500, { seed: 'never' });
    expect(samples.every(v => v === undefined)).toBe(true);
  });

  it('produces a mix when someProbability is in (0, 1)', () => {
    const g = Generators.option(Generators.pure('x'), { someProbability: 0.5 });
    const samples = g.sampleN(500, { seed: 'mix' });
    expect(samples.some(v => v === 'x')).toBe(true);
    expect(samples.some(v => v === undefined)).toBe(true);
  });

  it('uses 0.75 by default', () => {
    const g = Generators.option(Generators.pure(1));
    const samples = g.sampleN(2000, { seed: 'default' });
    const someCount = samples.filter(v => v === 1).length;
    expect(someCount).toBeGreaterThan(samples.length * 0.6);
    expect(someCount).toBeLessThan(samples.length * 0.9);
  });

  it('exposes a maybe alias that points to option', () => {
    expect(Generators.maybe).toBe(Generators.option);
  });

  it('rejects out-of-range someProbability', () => {
    expect(() => Generators.option(Generators.pure(1), { someProbability: -0.1 })).toThrow(
      RangeError
    );
    expect(() => Generators.option(Generators.pure(1), { someProbability: 1.1 })).toThrow(
      RangeError
    );
  });
});
