---
name: sync-version
description: >
  Read the canonical version from package.json and check it against every
  file in the repository that carries a version string. Fix any inconsistency
  found. Use this skill whenever the project version has been bumped in
  package.json and the change needs to propagate to all dependent files, or
  when a version audit is needed before a release.
---

# sync-version

## Overview

`package.json` → `version` is the **single source of truth** for the
project version. Every other file that contains a version string must agree
with it. This skill audits all known locations, reports mismatches, and
applies targeted fixes.

```text
┌─────────────────────────────────────────────────────────────────────┐
│                         sync-version                                │
│                                                                     │
│  1. Read PKG_VERSION from package.json                              │
│  2. Parse → MAJOR · MINOR · PATCH · PRERELEASE                      │
│  3. Check each file in the canonical list                           │
│  4. Report mismatches                                               │
│  5. Fix each mismatch (targeted sed / node script)                  │
│  6. Re-validate (npm run build + npm test)                          │
│  7. Commit all changes                                              │
└─────────────────────────────────────────────────────────────────────┘
```

The skill is also available as a GitHub Actions workflow:
**`.github/workflows/sync-version.yml`** — triggered on `workflow_dispatch`
or automatically on pushes to `main` that modify `package.json`.

---

## Canonical version locations

The following files are checked in order. Each entry lists the file, the
pattern that must match, and how to fix it if it does not.

### 1. `.workflow-config.yaml` — workflow version field

Pattern: `version: X.Y.Z-PRERELEASE`
Fix: replace the version string on that line.

### 2. `docs/ROADMAP.md` — Current State header line

Pattern: `## Current State (vX.Y.Z-PRERELEASE)`
Fix: replace only this header line; do **not** touch any other version
strings in the roadmap (those are historical release planning records).

---

## Files explicitly excluded from auto-fix

| File | Reason |
|------|--------|
| `CHANGELOG.md` | All version entries are historical; never overwrite past entries |
| `package-lock.json` | Managed by npm; updated by `npm install` / `npm ci` |
| `node_modules/` | Never modified directly |
| `.ai_workflow/` | AI-generated log files; not project source |
| `src/*.ts` `@since` tags | These record the version when a feature was *introduced*; they are historical and must never be updated on version bumps |
| Roadmap section headers (e.g. `## v0.12.3-alpha — Command Pattern`) | Release planning records; only `## Current State (v…)` is a live version indicator |
| `test/` | Version strings in tests assert against actual runtime values; a mismatch here means the source file was wrong, not the test |

---

## Step-by-step execution

### Step 1 — Read canonical version

```bash
PKG_VERSION="$(node -p "require('./package.json').version")"
```

Parse into components:

```bash
VERSION_CORE="${PKG_VERSION%%-*}"    # e.g. "0.12.6"
PRERELEASE="${PKG_VERSION#*-}"       # e.g. "alpha"  (empty string if no dash)
MAJOR="${VERSION_CORE%%.*}"
REST="${VERSION_CORE#*.}"
MINOR="${REST%%.*}"
PATCH="${REST#*.}"
```

Print: `ℹ️  Canonical version: PKG_VERSION (MAJOR.MINOR.PATCH, prerelease: PRERELEASE)`

### Step 2 — Detect old version (for targeted replacement)

When running as a workflow after a `package.json` change, the previous
version is available via `git diff HEAD~1 -- package.json`. When running
manually, scan each target file for any version string that does **not**
match `PKG_VERSION` and treat it as the old version.

```bash
# Automated detection from git history
OLD_VERSION="$(git diff HEAD~1 -- package.json 2>/dev/null \
  | grep '^-.*"version"' \
  | grep -oP '\d+\.\d+\.\d+(-\w+)?')" || OLD_VERSION=""
```

If `OLD_VERSION` is empty (no prior commit or no change), fall back to
scanning each file individually (see Step 3).

### Step 3 — Check each file

For each file in the canonical list, determine whether it contains
`PKG_VERSION` where expected. Collect mismatches into a report table:

```
File                         | Expected              | Found                 | Status
.workflow-config.yaml        | version: 0.12.14-alpha | version: 0.12.3-alpha | ✗ MISMATCH
docs/ROADMAP.md              | (v0.12.14-alpha)       | (v0.11.0-alpha)       | ✗ MISMATCH
```

**Check `.workflow-config.yaml`:**

```bash
node - <<'EOF'
const fs  = require('fs');
const pkg = require('./package.json');
const src = fs.readFileSync('.workflow-config.yaml', 'utf8');
const found = src.match(/^  version:\s*(\S+)/m)?.[1];
if (found === pkg.version) {
  console.log('OK: .workflow-config.yaml');
} else {
  console.log(`MISMATCH: .workflow-config.yaml — expected ${pkg.version}, found ${found ?? '<not found>'}`);
}
EOF
```

**Check `docs/ROADMAP.md`:**

```bash
node - <<'EOF'
const fs  = require('fs');
const pkg = require('./package.json');
const src = fs.readFileSync('docs/ROADMAP.md', 'utf8');
const found = src.match(/^## Current State \(v([^)]+)\)/m)?.[1];
if (found === pkg.version) {
  console.log('OK: docs/ROADMAP.md');
} else {
  console.log(`MISMATCH: docs/ROADMAP.md — expected ${pkg.version}, found ${found ?? '<not found>'}`);
}
EOF
```

### Step 4 — Fix mismatches

Apply fixes only to files that have mismatches. Never touch files that
are already correct.

**Fix `.workflow-config.yaml`** — replace the version line:

```bash
node - <<'EOF'
const fs  = require('fs');
const pkg = require('./package.json');
let src = fs.readFileSync('.workflow-config.yaml', 'utf8');
src = src.replace(/^(\s*version:\s*)\S+/m, `$1${pkg.version}`);
fs.writeFileSync('.workflow-config.yaml', src);
console.log('✅  Fixed: .workflow-config.yaml');
EOF
```

**Fix `docs/ROADMAP.md`** — replace the Current State header only:

```bash
node - <<'EOF'
const fs  = require('fs');
const pkg = require('./package.json');
let src = fs.readFileSync('docs/ROADMAP.md', 'utf8');
src = src.replace(
  /^## Current State \(v[^)]+\)/m,
  `## Current State (v${pkg.version})`
);
fs.writeFileSync('docs/ROADMAP.md', src);
console.log('✅  Fixed: docs/ROADMAP.md');
EOF
```

Alternatively, use `sed` for both files when `OLD_VERSION` is known:

```bash
# .workflow-config.yaml
sed -i "s|version: ${OLD_VERSION}|version: ${PKG_VERSION}|" .workflow-config.yaml

# docs/ROADMAP.md — Current State header only
sed -i "/^## Current State/s|v${OLD_VERSION}|v${PKG_VERSION}|" docs/ROADMAP.md
```

### Step 5 — Validate and build

```bash
npm run build   # tsc — catches type errors
npm test        # catches test regressions
```

If either fails, report the failure and stop. Do **not** commit a broken
state.

### Step 6 — Commit

Stage only the files that were changed:

```bash
git add .workflow-config.yaml docs/ROADMAP.md

git commit -m "chore(version): sync all version strings to ${PKG_VERSION}

Propagates the version bump from package.json to:
- .workflow-config.yaml (version field)
- docs/ROADMAP.md (Current State header)

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Output format

Print a structured summary after execution:

```
sync-version — bessa_patterns.ts
════════════════════════════════════════════
Canonical version: 0.12.14-alpha
─────────────────────────────────────────────
File                         Status
.workflow-config.yaml        ✗ FIXED
docs/ROADMAP.md              ✗ FIXED
─────────────────────────────────────────────
Result: 2 fixed  |  0 already correct
✅  Validation passed (npm run build + npm test)
✅  Committed: chore(version): sync all version strings to 0.12.14-alpha
════════════════════════════════════════════
```

If no mismatches are found, print:

```
✅  sync-version: all version strings already agree with package.json (0.12.14-alpha)
    No files were modified.
```

---

## Workflow trigger (automated)

The companion workflow `.github/workflows/sync-version.yml` runs this same
algorithm automatically whenever `package.json` is pushed to `main` with a
changed `version` field, and is also available via `workflow_dispatch`.

```bash
# Manual trigger
gh workflow run sync-version.yml

# Manual trigger with explicit version override (e.g. after a bump)
gh workflow run sync-version.yml --field version=0.13.0-alpha
```

---

## Related files

- `package.json` — canonical version source
- `.workflow-config.yaml` — workflow version field
- `docs/ROADMAP.md` — Current State header
- `.github/workflows/sync-version.yml` — companion GitHub Actions workflow
- `.github/SKILLS.md` — skills index for this project
