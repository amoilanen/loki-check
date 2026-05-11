/*
 * Example: attaching a custom shrinker so a property failure reports a
 * minimal counter-example.
 *
 * Demonstrates:
 *   - Generators.object(Class, ...) for a class-instance generator
 *   - g.withShrinker(s) to attach a domain-aware shrinker
 *   - Reading r.counterExample.shrunk from a forAll result
 */

import { forAll, Generators, type Shrinker } from '../src/index.js';

class Money {
  constructor(readonly amount: number, readonly currency: string) {}
  toJSON() {
    return { amount: this.amount, currency: this.currency };
  }
}

// object(Class, ...) does not derive a shrinker on its own.
const moneyBase = Generators.object(
  Money,
  Generators.integer({ min: 0, max: 1000 }),
  Generators.oneOfValues('USD', 'EUR', 'GBP'),
);

// Domain-aware shrinker:
//   1) trivial: amount = 0 in the same currency
//   2) halving the amount toward 0
//   3) currency simplification: prefer USD
const shrinkMoney: Shrinker<Money> = function* (m) {
  if (m.amount > 0) {
    yield new Money(0, m.currency);
    yield new Money(Math.trunc(m.amount / 2), m.currency);
  }
  if (m.currency !== 'USD') {
    yield new Money(m.amount, 'USD');
  }
};

const money = moneyBase.withShrinker(shrinkMoney);

// Deliberately false property: "amount is always strictly greater than 100".
// Most draws falsify it (amount lives in [0, 1000]). The shrinker should
// then drive the counter-example toward { amount: 0, currency: 'USD' }.
const r = forAll(money, m => m.amount > 100, {
  tries: 200,
  seed: 'custom-shrinker-example',
});

if (r.ok) {
  throw new Error('property unexpectedly held - example is miscalibrated');
}

console.log('counter-example found:');
console.log('  original:', JSON.stringify(r.counterExample!.original));
console.log('  shrunk:  ', JSON.stringify(r.counterExample!.shrunk));
console.log('  seed:    ', r.seed);
