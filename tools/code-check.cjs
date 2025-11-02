#!/usr/bin/env node
// Lightweight code checks for repos that may not yet have full app code.
// Produces warnings for missing configs and risky patterns; exits 0 unless
// a hard violation is found (can be tightened later).

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const warnings = [];
const errors = [];

function exists(p) {
  try { fs.accessSync(p); return true; } catch { return false; }
}

function readJSON(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.git')) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, files);
    else files.push(p);
  }
  return files;
}

// 1) package.json: engines.node >= 20
const pkg = readJSON(path.join(root, 'package.json'));
if (!pkg) {
  warnings.push('package.json not found (ok for pre-init).');
} else {
  const engines = pkg.engines && pkg.engines.node;
  if (!engines) {
    warnings.push('package.json: engines.node missing (recommend ">=20").');
  } else if (!/>=\s*20/.test(engines)) {
    warnings.push(`package.json: engines.node is '${engines}', recommend ">=20".`);
  }
}

// 2) tsconfig.json strict mode
const tsconfig = readJSON(path.join(root, 'tsconfig.json'));
if (!tsconfig) warnings.push('tsconfig.json missing (TypeScript strict checks disabled).');
else if (!tsconfig.compilerOptions || tsconfig.compilerOptions.strict !== true) {
  warnings.push('tsconfig.json: compilerOptions.strict should be true.');
}

// 3) ESLint config presence
const hasEslint = ['.eslintrc.js', '.eslintrc.cjs', '.eslintrc.json', '.eslintrc.yml', '.eslintrc.yaml']
  .some((f) => exists(path.join(root, f)));
if (!hasEslint) warnings.push('ESLint config not found (.eslintrc*).');

// 4) Risky patterns scan (eval, dangerouslySetInnerHTML)
const exts = new Set(['.js', '.jsx', '.ts', '.tsx']);
const candidates = exists(root) ? walk(root).filter((p) => exts.has(path.extname(p))) : [];
let foundEval = false, foundDangerous = false;
for (const file of candidates) {
  const src = fs.readFileSync(file, 'utf8');
  if (/\beval\s*\(/.test(src)) { foundEval = true; warnings.push(`eval() usage: ${path.relative(root, file)}`); }
  if (/dangerouslySetInnerHTML\s*\:|<\w+[^>]*dangerouslySetInnerHTML=/.test(src)) {
    foundDangerous = true; warnings.push(`dangerouslySetInnerHTML usage: ${path.relative(root, file)}`);
  }
}

// 5) Next.js presence hints
const hasNextConfig = exists(path.join(root, 'next.config.js')) || exists(path.join(root, 'next.config.ts'));
if (!hasNextConfig) warnings.push('next.config.{js,ts} not found (ok if app not created yet).');

// Output
if (errors.length) {
  console.error('Code Check: FAIL');
  errors.forEach((e) => console.error('- ' + e));
  process.exit(1);
}

console.log('Code Check: OK');
if (warnings.length) {
  console.log('Warnings:');
  warnings.forEach((w) => console.log('- ' + w));
}
process.exit(0);

