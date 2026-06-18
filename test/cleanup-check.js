/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { main, targets } = require('../scripts/cleanup-unwanted-files');

const root = path.resolve(__dirname, '..');

console.log('Running cleanup verification test...');

main();

for (const target of targets) {
  const targetPath = path.join(root, target);
  assert.strictEqual(
    fs.existsSync(targetPath),
    false,
    `Unwanted path still exists: ${targetPath}`
  );
}

console.log('✅ Cleanup verification passed. No unwanted files remain.');
