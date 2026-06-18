/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const targets = [
  '.next',
  'node_modules',
  path.join('src', 'generated', 'prisma'),
  'next-env.d.ts',
];

function getTargetPath(relativePath) {
  return path.join(root, relativePath);
}

function removeTarget(relativePath, dryRun = false) {
  const targetPath = getTargetPath(relativePath);
  if (!fs.existsSync(targetPath)) {
    return false;
  }

  if (dryRun) {
    return true;
  }

  const stat = fs.lstatSync(targetPath);
  if (stat.isDirectory()) {
    fs.rmSync(targetPath, { recursive: true, force: true });
  } else {
    fs.rmSync(targetPath, { force: true });
  }

  return !fs.existsSync(targetPath);
}

function main(options = { dryRun: false }) {
  const results = {};
  for (const target of targets) {
    results[target] = removeTarget(target, options.dryRun);
  }

  return results;
}

if (require.main === module) {
  const dryRun = process.argv.includes('--dry-run');
  const results = main({ dryRun });
  console.log(`Cleanup results (${dryRun ? 'dry run' : 'execute'}):`);
  for (const [target, removed] of Object.entries(results)) {
    console.log(`- ${target}: ${removed ? (dryRun ? 'would remove' : 'removed') : 'not found'}`);
  }
}

module.exports = { targets, removeTarget, main };
