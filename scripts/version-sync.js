#!/usr/bin/env node
// scripts/version-sync.js
// Keeps version strings in .workflow-config.yaml and docs/ROADMAP.md in sync
// with the canonical version in package.json.
//
// Usage:
//   node scripts/version-sync.js          # apply sync (exits 0 on success)
//   node scripts/version-sync.js --check  # verify only (exits 1 on mismatch)

'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const expected = pkg.version;

const checkOnly = process.argv.includes('--check');

// ── Helpers ──────────────────────────────────────────────────────────────────

function readFile(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function writeFile(rel, content) {
  fs.writeFileSync(path.join(root, rel), content);
}

// ── Check / Fix .workflow-config.yaml ────────────────────────────────────────

const wfPath = '.workflow-config.yaml';
let wf = readFile(wfPath);
const wfMatch = wf.match(/^ {2}version:\s*"?([^"\s]+)"?/m);
const wfVer = wfMatch ? wfMatch[1] : null;

// ── Check / Fix docs/ROADMAP.md ──────────────────────────────────────────────

const rmPath = 'docs/ROADMAP.md';
let rm = readFile(rmPath);
const rmMatch = rm.match(/^## Current State \(v([^\s/)]+)/m);
const rmVer = rmMatch ? rmMatch[1] : null;

// ── Report / Apply ───────────────────────────────────────────────────────────

let ok = true;

if (wfVer !== expected) {
  if (checkOnly) {
    console.error('MISMATCH ' + wfPath + ': expected ' + expected + ', found ' + wfVer);
    ok = false;
  } else {
    wf = wf.replace(/^(\s*version:\s*)"?[^"\s]+"?/m, '$1"' + expected + '"');
    writeFile(wfPath, wf);
    console.log('Updated ' + wfPath + ' → ' + expected);
  }
}

if (rmVer !== expected) {
  if (checkOnly) {
    console.error('MISMATCH ' + rmPath + ': expected ' + expected + ', found ' + rmVer);
    ok = false;
  } else {
    rm = rm.replace(/^(## Current State \(v)[^\s/)]+/m, '$1' + expected);
    writeFile(rmPath, rm);
    console.log('Updated ' + rmPath + ' → ' + expected);
  }
}

if (checkOnly) {
  if (ok) console.log('OK all version strings match ' + expected);
  process.exit(ok ? 0 : 1);
} else {
  console.log('Synced version strings to ' + expected);
}
