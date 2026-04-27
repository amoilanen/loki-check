import { describe, it, expect } from 'vitest';

import {
  shrinkBoolean,
  shrinkNumber,
  shrinkString,
  shrinkArray,
  shrinkTuple,
  shrinkObject,
  shrinkSearch,
  type Shrinker,
} from '../src/quantifiers/shrink.js';

describe('shrinkBoolean', () => {
  it('shrinks true toward false', () => {
    expect([...shrinkBoolean(true)]).toEqual([false]);
  });

  it('does not shrink false', () => {
    expect([...shrinkBoolean(false)]).toEqual([]);
  });
});

describe('shrinkNumber', () => {
  it('enumerates values approaching zero from a positive start', () => {
    const out = [...shrinkNumber(50)];
    expect(out[0]).toBe(0);
    expect(out).toContain(25);
    expect(out).toContain(12);
    expect(out).toContain(6);
    const halvings = out.slice(1);
    for (let i = 1; i < halvings.length; i++) {
      expect(Math.abs(halvings[i] as number)).toBeLessThan(Math.abs(halvings[i - 1] as number));
    }
  });

  it('emits no candidates for zero', () => {
    expect([...shrinkNumber(0)]).toEqual([]);
  });
});

describe('shrinkString', () => {
  it('emits the empty string first for non-empty inputs', () => {
    const out = [...shrinkString('hello')];
    expect(out[0]).toBe('');
  });

  it('emits no candidates for the empty string', () => {
    expect([...shrinkString('')]).toEqual([]);
  });
});

describe('shrinkArray', () => {
  it('produces shorter arrays approaching the empty array', () => {
    const out = [...shrinkArray<number>()([10, 20, 30])];
    expect(out[0]).toEqual([]);
    expect(out.some(c => c.length > 0 && c.length < 3)).toBe(true);
  });

  it('produces arrays with shrunk elements when an inner shrinker is supplied', () => {
    const out = [...shrinkArray(shrinkNumber)([10, 20, 30])];
    expect(out).toContainEqual([0, 20, 30]);
    expect(out).toContainEqual([10, 0, 30]);
    expect(out).toContainEqual([10, 20, 0]);
  });

  it('emits no candidates for the empty array', () => {
    expect([...shrinkArray(shrinkNumber)([])]).toEqual([]);
  });
});

describe('shrinkTuple', () => {
  it('shrinks each position using its own inner shrinker', () => {
    const sh = shrinkTuple<[number, boolean]>(shrinkNumber, shrinkBoolean);
    const out = [...sh([10, true])];
    expect(out).toContainEqual([0, true]);
    expect(out).toContainEqual([10, false]);
  });
});

describe('shrinkObject', () => {
  it('shrinks each field independently', () => {
    const sh = shrinkObject<{ n: number; b: boolean }>({
      n: shrinkNumber,
      b: shrinkBoolean,
    });
    const out = [...sh({ n: 10, b: true })];
    expect(out).toContainEqual({ n: 0, b: true });
    expect(out).toContainEqual({ n: 10, b: false });
  });
});

describe('shrinkSearch', () => {
  it('returns the smallest failing candidate (bisection on shrinkNumber)', () => {
    const result = shrinkSearch(100, shrinkNumber, x => x > 5, 1000);
    expect(result).toBe(6);
  });

  it('returns the start value when no candidate fails', () => {
    const result = shrinkSearch(3, shrinkNumber, x => x > 100, 1000);
    expect(result).toBe(3);
  });

  it('returns the smallest failing candidate found so far when budget is exhausted', () => {
    const trace: number[] = [];
    const tinyShrinker: Shrinker<number> = function* (n: number) {
      for (let i = n - 1; i >= 0; i--) yield i;
    };
    const result = shrinkSearch(
      100,
      tinyShrinker,
      x => {
        trace.push(x);
        return x > 5;
      },
      3
    );
    expect(trace.length).toBe(3);
    expect(result).toBeLessThan(100);
    expect(result).toBeGreaterThan(5);
  });
});
