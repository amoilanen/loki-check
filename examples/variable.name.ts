/*
 * Example of generating valid JavaScript variable names.
 *
 * Demonstrates:
 *   - identifier(maxLength) for ASCII identifier-shaped strings
 *   - .filter(...) to reject reserved words via predicate
 */

import { Generators } from '../src/index.js';

const RESERVED_WORDS = new Set([
  'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger',
  'default', 'delete', 'do', 'else', 'export', 'extends', 'finally',
  'for', 'function', 'if', 'import', 'in', 'instanceof', 'new',
  'return', 'super', 'switch', 'this', 'throw', 'try', 'typeof',
  'var', 'void', 'while', 'with', 'yield',
  'let', 'static', 'enum', 'await', 'implements', 'interface',
  'package', 'private', 'protected', 'public',
  'true', 'false', 'null', 'undefined',
]);

const variableName = Generators.identifier(8)
  .filter((name) => !RESERVED_WORDS.has(name));

const names = variableName.sampleN(5, { seed: 'variable-name-example' });
for (const name of names) {
  console.log('variable name:', name);
}
