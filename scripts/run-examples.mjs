#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const examplesDir = resolve(here, '..', 'examples');

const files = readdirSync(examplesDir)
  .filter((f) => f.endsWith('.ts'))
  .sort();

if (files.length === 0) {
  console.error('No examples found in', examplesDir);
  process.exit(1);
}

let failed = 0;
for (const file of files) {
  const fullPath = join(examplesDir, file);
  process.stdout.write(`\n=== running example: ${file} ===\n`);
  const result = spawnSync(
    process.execPath,
    ['--import', 'tsx', fullPath],
    { stdio: 'inherit' },
  );
  if (result.status !== 0) {
    failed++;
    console.error(`example failed: ${file} (exit ${result.status})`);
  }
}

if (failed > 0) {
  console.error(`\n${failed} example(s) failed.`);
  process.exit(1);
}
console.log(`\nAll ${files.length} examples passed.`);
