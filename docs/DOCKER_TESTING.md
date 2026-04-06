# Docker Testing Guide

> This guide covers running the `bessa_patterns.ts` test suite inside Docker for a clean, reproducible, host-independent test environment.

---

## Table of Contents

1. [Why run tests in Docker?](#why-run-tests-in-docker)
2. [Prerequisites](#prerequisites)
3. [Project files overview](#project-files-overview)
4. [Dockerfile.test walkthrough](#dockerfiletest-walkthrough)
5. [.dockerignore walkthrough](#dockerignore-walkthrough)
6. [Shell script walkthrough](#shell-script-walkthrough)
7. [Running the tests](#running-the-tests)
8. [Extracting coverage reports](#extracting-coverage-reports)
9. [CI/CD integration (GitHub Actions)](#cicd-integration-github-actions)
10. [Troubleshooting](#troubleshooting)

---

## Why run tests in Docker?

| Benefit | Details |
|---|---|
| **Isolation** | Tests run in a clean OS every time — no leftover state, no host machine differences |
| **Reproducibility** | Same image = same result on any machine or CI runner |
| **CI parity** | What passes locally in Docker will pass in CI |
| **Dependency pinning** | The exact Node.js version is locked to the image tag |
| **Safe multi-project setups** | Different projects can use conflicting Node versions without virtual-env headaches |

---

## Prerequisites

### Docker

| Platform | Install |
|---|---|
| **macOS / Windows** | [Docker Desktop](https://docs.docker.com/desktop/) |
| **Linux** | [Docker Engine](https://docs.docker.com/engine/install/) |

Verify installation:

```bash
docker --version      # Docker version 26.x.x or later
docker info           # confirms the daemon is running
```

On Linux, ensure your user is in the `docker` group so the daemon socket is accessible without `sudo`:

```bash
sudo usermod -aG docker $USER
newgrp docker          # apply group change in the current shell
```

### Node.js (host only)

The host machine needs Node.js **only** for the `npm run test:docker` convenience script (it resolves the package version). The actual tests run inside Docker.

```bash
node --version   # v18.0.0 or later
```

---

## Project files overview

The Docker test setup consists of three files:

```
bessa_patterns.ts/
├── Dockerfile.test          ← image definition for the test runner
├── .dockerignore            ← files excluded from the build context
└── scripts/
    └── run-tests-docker.sh  ← orchestration script (build → run → report)
```

`package.json` exposes a convenience script:

```json
"scripts": {
  "test:docker": "bash scripts/run-tests-docker.sh"
}
```

---

## Dockerfile.test walkthrough

```dockerfile
FROM node:22-alpine
```

- Uses the **official Node.js Alpine image** — roughly 60 MB vs 900 MB for the Debian image.
- Pinned to `node:22-alpine` rather than `node:alpine` or `node:latest` for reproducible builds.
- Satisfies the project's `"engines": { "node": ">=18.0.0" }` requirement.

---

```dockerfile
WORKDIR /app
```

- Sets `/app` as the working directory for all subsequent commands.
- Creates the directory if it does not exist.

---

```dockerfile
COPY package.json package-lock.json ./
```

- Copies **only the dependency manifests** first.
- Docker caches each layer; if neither file changed since the last build, the next `RUN npm ci` layer is also cached — saving time on subsequent builds.

---

```dockerfile
ENV NODE_ENV=test
RUN npm ci --ignore-scripts
```

- `npm ci` does a clean install from `package-lock.json`. It is faster and stricter than `npm install` and never modifies `package-lock.json`.
- `--ignore-scripts` skips lifecycle scripts (`preinstall`, `postinstall`, etc.) that may fail inside Alpine.
- **`ENV NODE_ENV=test` is critical** — the `node:22-alpine` base image ships with `NODE_ENV=production`, which causes `npm ci` to silently skip `devDependencies`. This would omit Jest, ts-jest, TypeScript type definitions, and other test tooling. Setting it to `test` ensures the full dependency tree is installed.

---

```dockerfile
COPY . .
```

- Copies the remaining project files **after** `npm ci` so that source-code changes do not invalidate the dependency cache layer.
- The `.dockerignore` file controls what is excluded.

---

```dockerfile
CMD ["npm", "test"]
```

- Default command when the container is run without arguments.
- Uses JSON array form to avoid spawning an intermediate shell, making signal handling more reliable.

---

## .dockerignore walkthrough

`.dockerignore` uses the same syntax as `.gitignore`. It tells Docker which files to exclude from the **build context** sent to the daemon before the build starts. A smaller build context means faster builds.

```dockerignore
# Installed packages — npm ci installs these fresh inside the container
node_modules/

# TypeScript compilation output — not needed for tests (ts-jest compiles on the fly)
dist/

# Previous coverage output — tests produce their own inside the container
coverage/

# Git metadata — not needed at runtime
.git/

# Logs
*.log
npm-debug.log*
.npm/

# OS artefacts
.DS_Store
*.tsbuildinfo
```

**Key rules:**
- Always exclude `node_modules/` — copying it in would override the clean `npm ci` install and dramatically bloat the build context.
- Exclude `dist/` — tests run against source files via ts-jest, not pre-built output.
- Exclude `.git/` — no need for version history inside the container.

---

## Shell script walkthrough

`scripts/run-tests-docker.sh` is a convenience wrapper with three steps:

### Step 1 — Build the image

```bash
docker build \
  --build-arg BUILDKIT_INLINE_CACHE=1 \
  -t bessa-patterns-test \
  -f Dockerfile.test \
  "${PROJECT_ROOT}"
```

- `-f Dockerfile.test` — uses the dedicated test Dockerfile.
- `-t bessa-patterns-test` — tags the image for easy reference.
- `--build-arg BUILDKIT_INLINE_CACHE=1` — embeds cache metadata in the image layers (useful for registry-based caching in CI).

### Step 2 — Run the container

```bash
docker run \
  --rm \
  --name bessa-patterns-test-run \
  -e CI=true \
  bessa-patterns-test \
  sh -c "npm test -- --runInBand"
```

- `--rm` — removes the container automatically after it exits.
- `-e CI=true` — signals to Jest that the run is non-interactive; disables watch mode.
- `--runInBand` — runs all test suites serially in the current process, which avoids rare parallel-worker races inside Docker's resource-constrained environment.
- The exit code of `docker run` mirrors the exit code of the test process.

### Step 3 — Report

The script captures the container's exit code and prints a pass/fail summary, then exits with the same code. This makes it compatible with CI pipelines that check `$?`.

### Passing extra Jest arguments

Extra arguments after `--` are forwarded to the test command:

```bash
bash scripts/run-tests-docker.sh -- --coverage
bash scripts/run-tests-docker.sh -- --testPathPattern=ObserverSubject
bash scripts/run-tests-docker.sh -- --verbose --detectOpenHandles
```

---

## Running the tests

### Basic run

```bash
npm run test:docker
# or directly:
bash scripts/run-tests-docker.sh
```

### With a specific test file

```bash
bash scripts/run-tests-docker.sh -- --testPathPattern=DualObserverSubject
```

### With verbose output

```bash
bash scripts/run-tests-docker.sh -- --verbose
```

### With coverage threshold enforcement

```bash
bash scripts/run-tests-docker.sh -- --coverage
```

The project enforces 80 % coverage thresholds on statements, branches, functions, and lines (configured in `jest.config.json`).

### One-liner without the script

```bash
docker build -f Dockerfile.test -t bessa-patterns-test . && \
docker run --rm -e CI=true bessa-patterns-test
```

---

## Extracting coverage reports

By default, coverage output stays inside the container and is lost when `--rm` removes it. Mount the `coverage/` directory as a volume to persist it on the host:

```bash
docker run --rm \
  -e CI=true \
  -v "$(pwd)/coverage:/app/coverage" \
  bessa-patterns-test \
  npm test -- --coverage
```

After the run, `./coverage/` on the host contains the full HTML and LCOV reports. Open the report in a browser:

```bash
open coverage/lcov-report/index.html       # macOS
xdg-open coverage/lcov-report/index.html   # Linux
```

Or use the convenience script with the coverage flag:

```bash
bash scripts/run-tests-docker.sh -- --coverage
```

---

## CI/CD integration (GitHub Actions)

The workflow below builds the image, runs the tests, and uploads the coverage report as an artifact.

```yaml
# .github/workflows/test.yml  (example — adapt as needed)
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build test image
        run: |
          docker build \
            --cache-from type=gha \
            --cache-to type=gha,mode=max \
            -t bessa-patterns-test \
            -f Dockerfile.test \
            .

      - name: Run tests
        run: |
          docker run --rm \
            -e CI=true \
            -v "${{ github.workspace }}/coverage:/app/coverage" \
            bessa-patterns-test \
            npm test -- --runInBand --coverage

      - name: Upload coverage report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/
          retention-days: 7
```

**Key points:**
- `--cache-from / --cache-to type=gha` — uses GitHub Actions cache for Docker layers, reducing build time after the first run.
- `-v "${{ github.workspace }}/coverage:/app/coverage"` — extracts coverage from the container into the runner's workspace so the upload-artifact step can find it.
- `if: always()` on the upload step — uploads the report even when tests fail, which is when you need it most.

> **Note:** The existing `.github/workflows/ci.yml` already runs `lint → test → build` directly on the runner. The Docker workflow above is a standalone alternative for fully isolated runs. Both can coexist in the same repository.

---

## Troubleshooting

### `Cannot find module 'jest'` (or `'ts-jest'`) when tests run inside Docker

This almost always means devDependencies were not installed. The root cause is `NODE_ENV=production`.

**Cause:** The `node:22-alpine` base image sets `NODE_ENV=production` by default. When `NODE_ENV=production`, `npm ci` silently skips `devDependencies` — so packages like `jest` and `ts-jest` are never installed inside the container.

**Fix:** Verify `Dockerfile.test` contains `ENV NODE_ENV=test` **before** the `npm ci` step:

```dockerfile
ENV NODE_ENV=test
RUN npm ci --ignore-scripts
```

---

### `Cannot find module 'promise-retry'` (or similar) during `npm ci`

**Cause:** A `RUN npm install -g npm@latest` line was added before `npm ci`. The base image ships a working npm; self-upgrading can break it by producing a partially linked installation.

**Fix:** Remove `RUN npm install -g npm@latest` entirely. The image's bundled npm is sufficient for `npm ci`.

---

### `package-lock.json` references a sibling project's `node_modules`

npm 7+ resolves peer dependencies aggressively. If another Node.js project in a **sibling directory** already has a dependency installed, npm may record that external path in `package-lock.json`:

```
# Example of a broken package-lock.json entry
"../some-other-project/node_modules/typescript": { "version": "5.x.x", ... }
```

`npm ci` follows the lock file exactly. Inside Docker, only the current project is present, so `../` paths do not exist and the module cannot be found.

**Diagnosis:**

```bash
python3 -c "
import json
l = json.load(open('package-lock.json'))
sibling = [k for k in l['packages'] if k.startswith('../')]
print('sibling refs:', len(sibling))
if sibling:
    print('examples:', sibling[:3])
"
```

**Fix:** Regenerate `package-lock.json` in isolation:

```bash
# 1. Create a clean workspace with only package.json
mkdir -p /tmp/npm-clean && cp package.json /tmp/npm-clean/

# 2. Resolve and write a fresh lock file
cd /tmp/npm-clean && NODE_ENV=test npm install --package-lock-only

# 3. Copy back and resync local node_modules
cp /tmp/npm-clean/package-lock.json /path/to/bessa_patterns.ts/
cd /path/to/bessa_patterns.ts && npm ci --ignore-scripts

# 4. Commit the updated lock file
git add package-lock.json && git commit -m "fix: regenerate package-lock.json in isolation"
```

---

### Coverage report not appearing on the host after the run

**Cause:** The `coverage/` directory is inside the container and is deleted when `--rm` removes it.

**Fix:** Mount `coverage/` as a host volume:

```bash
docker run --rm \
  -e CI=true \
  -v "$(pwd)/coverage:/app/coverage" \
  bessa-patterns-test \
  npm test -- --coverage
```
