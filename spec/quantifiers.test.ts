import { describe, it, expect } from 'vitest';

import { Generator } from '../src/generator.js';
import { none } from '../src/maybe.js';
import { fromSeed } from '../src/random/index.js';
import {
  forAll,
  exists,
  type ForAllResult,
  type ExistsResult,
} from '../src/quantifiers/index.js';
import { integer } from '../src/generators/number.js';
import { boolean } from '../src/generators/boolean.js';

describe('forAll', () => {
  it('returns ok when the predicate holds for every draw', () => {
    const r: ForAllResult<number> = forAll(
      integer(),
      x => typeof x === 'number' && Number.isInteger(x),
      { seed: 'pass', tries: 200 }
    );
    expect(r.ok).toBe(true);
    expect(r.triesRun).toBe(200);
    expect(r.counterExample).toBeUndefined();
  });

  it('returns a counter-example when the predicate fails', () => {
    const r = forAll(integer(), () => false, { seed: 42, tries: 5 });
    expect(r.ok).toBe(false);
    expect(r.counterExample).toBeDefined();
    expect(r.triesRun).toBeGreaterThanOrEqual(1);
    expect(r.triesRun).toBeLessThanOrEqual(5);
  });

  it('always reports the seed used (random when not provided)', () => {
    const r = forAll(integer(), x => Number.isInteger(x), { tries: 10 });
    expect(Number.isFinite(r.seed)).toBe(true);
  });

  it('reports the supplied numeric seed verbatim', () => {
    const r = forAll(integer(), () => true, { seed: 12345, tries: 10 });
    expect(r.seed).toBe(12345);
  });

  it('reports rng.seed when an rng is supplied directly', () => {
    const rng = fromSeed(7777);
    const r = forAll(integer(), () => true, { rng, tries: 10 });
    expect(r.seed).toBe(7777);
  });

  it('treats predicate void return as success', () => {
    const r = forAll(integer(), () => {
      /* no return */
    }, { seed: 'void', tries: 50 });
    expect(r.ok).toBe(true);
  });

  it('treats thrown predicates as failure', () => {
    const r = forAll(integer(), () => {
      throw new Error('boom');
    }, { seed: 'throw', tries: 5 });
    expect(r.ok).toBe(false);
    expect(r.counterExample).toBeDefined();
  });

  it('is reproducible: same seed yields the same counter-example', () => {
    const r1 = forAll(integer(), x => x < 100, { seed: 'repro' });
    if (r1.ok) {
      // Pick a seed that is known to fail; integer() spans 32 bits so we should
      // hit a value >= 100 within 100 tries against any seed. Force a failure
      // case by tightening the predicate.
      const r2 = forAll(integer(), x => x < -10_000_000_000, { seed: 'repro' });
      const r3 = forAll(integer(), x => x < -10_000_000_000, { seed: 'repro' });
      expect(r2.ok).toBe(false);
      expect(r2.counterExample?.original).toBe(r3.counterExample?.original);
      expect(r2.counterExample?.shrunk).toBe(r3.counterExample?.shrunk);
      expect(r2.seed).toBe(r3.seed);
    } else {
      const r2 = forAll(integer(), x => x < 100, { seed: r1.seed });
      expect(r2.ok).toBe(false);
      expect(r2.counterExample?.original).toBe(r1.counterExample?.original);
      expect(r2.counterExample?.shrunk).toBe(r1.counterExample?.shrunk);
      expect(r2.seed).toBe(r1.seed);
    }
  });

  it('skips draws that yield none without consuming all tries', () => {
    // A generator that always yields none must not crash forAll.
    const empty = new (class extends Generator<number> {
      generate() {
        return none;
      }
    })();
    const r = forAll(empty, () => true, { seed: 1, tries: 10 });
    expect(r.ok).toBe(true);
  });
});

describe('forAll.assert', () => {
  it('does not throw when the property holds', () => {
    expect(() =>
      forAll.assert(integer(), x => Number.isInteger(x), { seed: 'ok' })
    ).not.toThrow();
  });

  it('throws on failure with a message containing the seed', () => {
    let caught: Error | undefined;
    try {
      forAll.assert(integer(), () => false, { seed: 99, tries: 5 });
    } catch (e) {
      caught = e as Error;
    }
    expect(caught).toBeInstanceOf(Error);
    expect(caught!.message).toContain('seed=');
    expect(caught!.message).toContain('99');
    expect(caught!.message).toContain('Original');
    expect(caught!.message).toContain('Shrunk');
  });
});

describe('shrinking via forAll', () => {
  it('shrinks integers that fail x < 100 toward the boundary', () => {
    // Search across many seeds: every failing case should produce a shrunk
    // value that (a) still fails the predicate and (b) is no larger in
    // magnitude than the original counter-example.
    const seeds = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    let observedShrunk = false;
    for (const seed of seeds) {
      const r = forAll(integer({ min: 100, max: 1_000_000 }), x => x < 100, {
        seed,
        tries: 50,
      });
      expect(r.ok).toBe(false);
      const { original, shrunk } = r.counterExample!;
      expect(shrunk).toBeGreaterThanOrEqual(100); // still fails predicate
      expect(shrunk).toBeLessThanOrEqual(original); // never grew
      if (shrunk < original) observedShrunk = true;
    }
    expect(observedShrunk).toBe(true);
  });

  it('does not shrink when shrink: false', () => {
    const r1 = forAll(integer({ min: 1000, max: 1_000_000 }), x => x < 100, {
      seed: 's1',
      tries: 5,
      shrink: false,
    });
    expect(r1.ok).toBe(false);
    expect(r1.counterExample!.original).toBe(r1.counterExample!.shrunk);
  });

  it('respects shrinkBudget', () => {
    const r = forAll(integer({ min: 1000, max: 1_000_000 }), x => x < 100, {
      seed: 'budget',
      tries: 5,
      shrinkBudget: 0,
    });
    expect(r.ok).toBe(false);
    // With zero budget, no shrinking happens.
    expect(r.counterExample!.shrunk).toBe(r.counterExample!.original);
  });
});

describe('exists', () => {
  it('finds a witness when one exists', () => {
    const r: ExistsResult<boolean> = exists(boolean, x => x === true, {
      seed: 'witness',
      tries: 100,
    });
    expect(r.found).toBe(true);
    expect(r.witness).toBe(true);
    expect(r.triesRun).toBeGreaterThanOrEqual(1);
  });

  it('returns found: false after exhausting tries', () => {
    const r = exists(integer(), () => false, { seed: 'no-witness', tries: 25 });
    expect(r.found).toBe(false);
    expect(r.witness).toBeUndefined();
    expect(r.triesRun).toBe(25);
  });

  it('reports the seed used (numeric)', () => {
    const r = exists(integer(), () => true, { seed: 555, tries: 1 });
    expect(r.seed).toBe(555);
  });

  it('treats thrown predicates as not satisfying', () => {
    const r = exists(integer(), () => {
      throw new Error('bad');
    }, { seed: 'throw', tries: 10 });
    expect(r.found).toBe(false);
  });
});
