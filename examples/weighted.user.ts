/*
 * Example: realistic user generation via `frequency` and `frequencyOfValues`.
 *
 * Demonstrates:
 *   - `frequencyOfValues` for weighted enums (account type, country)
 *   - `frequency` for weighted *generators* (age distributions)
 *   - composing with `record` so the result is a typed plain object
 *
 * The point: in production code your inputs are not uniformly distributed.
 * Property-based tests work much better when the *test* data matches the
 * production distribution -- you spend most of your shrinking and counter-
 * example budget on values you actually care about.
 */

import { Generators, type Generator } from '../src/index.js';

type AccountType = 'free' | 'basic' | 'premium' | 'enterprise';

interface User {
  age: number;
  country: string;
  accountType: AccountType;
}

// 70% in working-age band, 20% youth, 10% retired. Each band is a *generator*
// so the resulting age is drawn uniformly within the band.
const age: Generator<number> = Generators.frequency(
  [7, Generators.integer({ min: 25, max: 55 })],
  [2, Generators.integer({ min: 13, max: 24 })],
  [1, Generators.integer({ min: 65, max: 90 })],
);

// 60% US, 15% UK, 10% DE, 10% IN, 5% other.
const country: Generator<string> = Generators.frequencyOfValues(
  [60, 'US'],
  [15, 'UK'],
  [10, 'DE'],
  [10, 'IN'],
  [5, 'OTHER'],
);

// Heavy free-tier skew -- mirrors a typical SaaS funnel.
const accountType: Generator<AccountType> = Generators.frequencyOfValues<AccountType>(
  [70, 'free'],
  [20, 'basic'],
  [8,  'premium'],
  [2,  'enterprise'],
);

const user: Generator<User> = Generators.record<User>({ age, country, accountType });

const samples = user.sampleN(8, { seed: 'weighted-user-example' });
for (const u of samples) {
  console.log('user:', JSON.stringify(u));
}

// Quick distribution sanity check on a larger sample.
const big = user.sampleN(2000, { seed: 'weighted-user-distribution' });
const tally = big.reduce<Record<AccountType, number>>(
  (acc, u) => ((acc[u.accountType]++, acc)),
  { free: 0, basic: 0, premium: 0, enterprise: 0 },
);
console.log('\naccountType distribution (n=2000):', tally);
