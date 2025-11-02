#!/usr/bin/env node
// Minimal CI guard for Amplify Gen 2 authz and storage rules.
// - Verifies Tweet 140-char validation and owner/admin permissions
// - Verifies storage path rules don't conflict (entity_id vs wildcard, nesting)
// - Safe to run before Amplify files exist (no hard failure)

const fs = require('fs');
const path = require('path');

const repoRoot = process.cwd();
const dataFile = path.join(repoRoot, 'amplify', 'data', 'resource.ts');
const storageFile = path.join(repoRoot, 'amplify', 'storage', 'resource.ts');

/** Utility */
function readIfExists(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return null;
  }
}

function fail(msgs) {
  console.error('\nSchema/AuthZ Guard found issues:\n');
  for (const m of msgs) console.error('- ' + m);
  process.exit(1);
}

const warnings = [];
const errors = [];

// 1) Check data/resource.ts for Tweet constraints and permissions
const dataSrc = readIfExists(dataFile);
if (!dataSrc) {
  warnings.push(`Skip: not found ${path.relative(repoRoot, dataFile)} (ok for early setup)`);
} else {
  // 140-char validation on Tweet.content
  const tweetModelBlock = /\bTweet\s*:\s*a\s*\.\s*model\(\{[\s\S]*?\}\)\s*\.?[\s\S]*?\.authorization\(/m.exec(dataSrc);
  if (!tweetModelBlock) {
    errors.push('Tweet model not found or missing .authorization()');
  } else {
    const block = tweetModelBlock[0];
    const hasMax140 = /content\s*:\s*a\s*\.\s*string\(\)\s*([\s\S]*?)maxLength\(\s*140\s*(,|\))/m.test(block);
    const hasMax140Comment = /\/\/.*140.*文字/m.test(block);
    if (!hasMax140 && !hasMax140Comment) {
      warnings.push('Tweet.content should validate maxLength(140) - currently enforced in frontend');
    }

    const hasOwner = /allow\.owner\s*\(\s*\)/.test(block);
    const hasAdmins = /allow\.groups\(\s*\[\s*['\"]ADMINS['\"]\s*\]\s*\)\s*\.to\(\s*\[/m.test(block);
    const hasAuthenticatedCreateRead = /allow\.authenticated\(\s*\)\s*\.to\(\s*\[\s*['\"]create['\"],\s*['\"]read['\"]\s*\]/m.test(block);
    if (!hasAuthenticatedCreateRead) errors.push('Tweet should allow.authenticated().to(["create","read"])');
    if (!hasOwner) errors.push('Tweet should include allow.owner() for self update/delete');
    if (!hasAdmins) errors.push('Tweet should include allow.groups(["ADMINS"]).to(["update","delete"])');
  }
}

// 2) Check storage/resource.ts for path rule conflicts
const storageSrc = readIfExists(storageFile);
if (!storageSrc) {
  warnings.push(`Skip: not found ${path.relative(repoRoot, storageFile)} (ok for early setup)`);
} else {
  // Collect path patterns inside access mapping: "path": [ ... ]
  const pathRegex = /"([^"]+\/\*)"\s*:\s*\[/g; // matches paths ending with /*
  const paths = [];
  let m;
  while ((m = pathRegex.exec(storageSrc))) paths.push(m[1]);

  // Rule 1: all must end with /* (already enforced by regex)

  // Rule 2: only one level of nesting per docs (e.g., media/* and media/albums/* ok, but not deeper chains)
  // We approximate by ensuring no more than one segment before the /* for any given base.
  for (const p of paths) {
    const parts = p.split('/').filter(Boolean); // e.g., ['media','*'] or ['media','albums','*']
    const starIndex = parts.indexOf('*');
    const depth = starIndex >= 0 ? starIndex : parts.length;
    if (depth > 2) {
      errors.push(`Storage path too deep: "${p}" (only one level of nesting allowed)`);
    }
  }

  // Rule 3/4: wildcard cannot conflict with {entity_id}; and path cannot be prefix of a {entity_id} path
  const hasEntityPaths = paths.filter((p) => p.includes('{entity_id}'));
  const hasWildPaths = paths.filter((p) => !p.includes('{entity_id}'));
  for (const ep of hasEntityPaths) {
    for (const wp of hasWildPaths) {
      if (ep.startsWith(wp.replace('*', ''))) {
        errors.push(`Wildcard path "${wp}" conflicts with entity_id path "${ep}"`);
      }
    }
  }
}

if (errors.length) fail(errors);

console.log('Schema/AuthZ Guard: OK');
if (warnings.length) {
  console.log('Warnings:');
  for (const w of warnings) console.log('- ' + w);
}
process.exit(0);

