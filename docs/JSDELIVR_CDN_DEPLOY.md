# Deploying to jsDelivr CDN

This guide explains how `bessa_patterns.ts` is published so its compiled
bundles are automatically available on the jsDelivr CDN — no extra CDN
configuration required.

---

## How jsDelivr works for npm packages

jsDelivr mirrors every file from every npm package automatically. Once a
version is published to npm **and** the `dist/` folder is included in the
package tarball, jsDelivr serves those files at:

```
https://cdn.jsdelivr.net/npm/<package-name>@<version>/<file-path>
```

The `files` field in `package.json` controls what is included in the
tarball. Everything else is excluded at publish time.

---

## Project CDN configuration

### 1. `package.json` — what gets published

```json
{
  "name": "bessa_patterns.ts",
  "version": "0.12.15-alpha",
  "main":    "dist/index.cjs",
  "module":  "dist/index.mjs",
  "types":   "dist/index.d.ts",
  "files": [
    "dist/**/*.js",
    "dist/**/*.mjs",
    "dist/**/*.cjs",
    "dist/**/*.d.ts",
    "dist/**/*.map",
    "README.md",
    "LICENSE",
    "CHANGELOG.md"
  ],
  "exports": {
    ".": {
      "types":   "./dist/index.d.ts",
      "import":  "./dist/index.mjs",
      "require": "./dist/index.cjs"
    }
  }
}
```

Key points:
- `files` is an **allowlist** — only the listed globs land in the tarball.
- Both `dist/index.mjs` (ESM) and `dist/index.cjs` (CJS) are included.
- Source files (`src/`) and test files (`test/`) are **not** included.

### 2. `vite.config.ts` — the build that produces `dist/`

```ts
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry:    resolve(__dirname, 'src/index.ts'),
      name:     'BessaPatterns',        // UMD global name (unused here)
      formats:  ['es', 'cjs'],          // ESM + CommonJS
      fileName: (format) =>
        format === 'es' ? 'index.mjs' : 'index.cjs',
    },
    outDir:     'dist',
    sourcemap:  true,
    emptyOutDir: true,
  },
  plugins: [
    dts({ rollupTypes: true, insertTypesEntry: true }),
  ],
});
```

Run the build:

```bash
npm run build:vite
# produces: dist/index.mjs  dist/index.cjs  dist/index.d.ts  *.map
```

### 3. `.gitignore` — `dist/` is ignored normally

```gitignore
dist
```

`dist/` is **not** committed to main branch history during development.
The deploy script force-adds it for the CDN commit (see below).

---

## The deploy script (`scripts/deploy.sh`)

The full deploy pipeline is automated in `scripts/deploy.sh`:

```text
Step 1/5  npm ci                    install dependencies from lockfile
Step 2/5  npm test                  all tests must pass
Step 3/5  npm run build:vite        compile ESM + CJS bundles
Step 4/5  git add -f dist/          force-commit build artifacts
          git tag vX.Y.Z
          git push origin main --tags
Step 5/5  npm publish               publish to npm registry
```

### Running the deploy

```bash
# 1. Set your npm Automation token (must have "bypass 2FA" + "read and write")
export NPM_TOKEN=npm_...

# 2. Run the script from the repo root
bash scripts/deploy.sh
```

The script prints jsDelivr URLs for both the dist-tag and pinned version
at the end of Step 4 — before npm publish starts.

---

## jsDelivr URL patterns

After a successful deploy the bundles are available at these URLs.
Replace `<version>` with the exact semver string (e.g. `0.12.15-alpha`).

| File | Dist-tag URL | Pinned URL |
|------|-------------|------------|
| ESM bundle | `…/npm/bessa_patterns.ts@alpha/dist/index.mjs` | `…/npm/bessa_patterns.ts@0.12.15-alpha/dist/index.mjs` |
| CJS bundle | `…/npm/bessa_patterns.ts@alpha/dist/index.cjs` | `…/npm/bessa_patterns.ts@0.12.15-alpha/dist/index.cjs` |
| Types | `…/npm/bessa_patterns.ts@alpha/dist/index.d.ts` | `…/npm/bessa_patterns.ts@0.12.15-alpha/dist/index.d.ts` |

Base URL: `https://cdn.jsdelivr.net`

### Usage in a browser

```html
<!-- ESM (modern browsers) -->
<script type="module">
  import { ObserverSubject } from
    'https://cdn.jsdelivr.net/npm/bessa_patterns.ts@alpha/dist/index.mjs';

  const subject = new ObserverSubject();
  subject.subscribe((value) => console.log('received:', value));
  subject.notify('hello from CDN');
</script>
```

### Usage in Node.js (no bundler)

```js
// CJS
const { ObserverSubject } =
  require('https://cdn.jsdelivr.net/npm/bessa_patterns.ts@alpha/dist/index.cjs');
// Note: direct HTTPS require only works with loaders; prefer npm install for Node.js.
```

### Usage with an import map

```html
<script type="importmap">
{
  "imports": {
    "bessa_patterns.ts": "https://cdn.jsdelivr.net/npm/bessa_patterns.ts@0.12.15-alpha/dist/index.mjs"
  }
}
</script>

<script type="module">
  import { ObserverSubject } from 'bessa_patterns.ts';
  // ...
</script>
```

---

## Verifying CDN availability

After publishing, confirm the files are live:

```bash
VERSION="0.12.15-alpha"
BASE="https://cdn.jsdelivr.net/npm/bessa_patterns.ts@${VERSION}"

# Check HTTP 200 for each artifact
curl -sI "${BASE}/dist/index.mjs" | head -1
curl -sI "${BASE}/dist/index.cjs" | head -1
curl -sI "${BASE}/dist/index.d.ts" | head -1
```

Expected: `HTTP/2 200`

jsDelivr may take a few minutes to propagate a newly published version.
You can also check the package file listing at:

```
https://cdn.jsdelivr.net/npm/bessa_patterns.ts@0.12.15-alpha/
```

---

## Cache purging

jsDelivr caches aggressively. If you republish the same version tag (not
recommended — semver should be immutable), purge the cache manually:

```bash
# Purge a specific file
curl "https://purge.jsdelivr.net/npm/bessa_patterns.ts@0.12.15-alpha/dist/index.mjs"

# Or use the jsDelivr purge UI
# https://www.jsdelivr.com/tools/purge
```

For normal version bumps, simply publish a new semver and update the
pinned URL — no purge needed.

---

## npm token setup

The deploy script requires an **Automation token** with 2FA bypass enabled.

1. Go to <https://www.npmjs.com/settings/~/tokens>
2. Click **Generate New Token → Granular Access Token**
3. Set:
   - Packages and scopes: **Read and write**
   - Selected packages: `bessa_patterns.ts`
   - Enable **Bypass two-factor authentication**
4. Copy the token and export it before running the deploy script:

```bash
export NPM_TOKEN=npm_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
bash scripts/deploy.sh
```

> **Security:** never commit `NPM_TOKEN` to the repository. The deploy
> script writes it to a temporary `.npmrc` and removes it via an `EXIT`
> trap.

---

## CI/CD — GitHub Actions

The `ci.yml` workflow runs lint → test → build on every push to `main`
and every pull request. It does **not** publish to npm or push tags —
that is handled exclusively by `scripts/deploy.sh` run locally or via
`ai_workflow.js deploy`.

To add an automated release step to CI, create a separate
`.github/workflows/release.yml` triggered on `push` to tags matching
`v*.*.*` and use a repository secret for `NPM_TOKEN`:

```yaml
name: Release

on:
  push:
    tags: ['v*.*.*']

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm test
      - run: npm run build:vite
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## Summary

| Step | Command / Action |
|------|-----------------|
| Build bundles | `npm run build:vite` |
| Full deploy | `export NPM_TOKEN=... && bash scripts/deploy.sh` |
| Verify CDN | `curl -sI https://cdn.jsdelivr.net/npm/bessa_patterns.ts@<version>/dist/index.mjs` |
| Purge cache | `curl https://purge.jsdelivr.net/npm/bessa_patterns.ts@<version>/dist/index.mjs` |
