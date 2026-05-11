/*
 * Example: a Luhn-valid credit card number generator.
 *
 * Demonstrates:
 *   - `arrayOfLength` to draw a fixed-length digit sequence
 *   - `map` to derive the Luhn check digit from the body
 *   - composing a *valid-by-construction* generator instead of filtering
 *
 * The Luhn algorithm:
 *   1. From the rightmost digit, double every second digit.
 *   2. If doubling yields > 9, subtract 9 (equivalent to summing the digits).
 *   3. Sum all digits. The number is valid iff the sum is divisible by 10.
 *
 * We pick a 15-digit body and *compute* the 16th digit so the total satisfies
 * Luhn. This is the canonical "build only valid values" pattern -- much
 * better than filtering random 16-digit numbers (>90% rejection rate).
 */

import { Generators, type Generator } from '../src/index.js';

function luhnCheckDigit(digits: readonly number[]): number {
  // digits are body, ordered most-significant first. The check digit will
  // be appended on the right, so doubling starts from `digits[last]` (index
  // length-1) and moves leftward, hitting every other digit.
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    const fromRight = digits.length - 1 - i;
    let d = digits[i] as number;
    if (fromRight % 2 === 0) {
      d = d * 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  // The check digit makes the total a multiple of 10.
  return (10 - (sum % 10)) % 10;
}

function isLuhnValid(card: string): boolean {
  const digits = [...card].map(c => c.charCodeAt(0) - '0'.charCodeAt(0));
  let sum = 0;
  for (let i = digits.length - 1, alt = false; i >= 0; i--, alt = !alt) {
    let d = digits[i] as number;
    if (alt) {
      d = d * 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

const digit: Generator<number> = Generators.integer({ min: 0, max: 9 });

const creditCard: Generator<string> = Generators.arrayOfLength(digit, 15)
  .map(body => {
    const check = luhnCheckDigit(body);
    return [...body, check].join('');
  });

const samples = creditCard.sampleN(5, { seed: 'credit-card-example' });
for (const card of samples) {
  console.log('card:', card, '-> luhn valid:', isLuhnValid(card));
}

// Sanity check: every generated card is Luhn-valid by construction.
if (!samples.every(isLuhnValid)) {
  throw new Error('credit-card generator produced an invalid number');
}
