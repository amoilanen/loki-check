import { Generator } from '../generator.js';

/**
 * Lifts a plain value into a generator that always yields it.
 *
 * @example
 * ```ts
 * import { Generators } from 'gen.js';
 *
 * Generators.pure(42).sample(); // 42
 * ```
 */
export const pure = Generator.pure;

export * from './array.js';
export * from './boolean.js';
export * from './collection.js';
export * from './core.js';
export * from './date.js';
export * from './filter.js';
export * from './ntuple.js';
export * from './number.js';
export * from './object.js';
export * from './option.js';
export * from './pick.js';
export * from './sized.js';
export * from './string.js';
