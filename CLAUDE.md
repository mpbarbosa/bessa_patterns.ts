# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A zero-dependency TypeScript library of concrete, generic GoF design-pattern implementations. Each pattern is a directly-instantiable class or factory function in its own file under `src/`, re-exported from the single public barrel `src/index.ts`. Currently the Observer/Subject family and a callback Registry are implemented; more are planned (`docs/ROADMAP.md`).

## Commands

```bash
npm install            # install dev dependencies (there are no runtime deps)
npm test               # run all Jest suites
npm run test:coverage  # run tests with coverage (thresholds enforced — see below)
npm run lint           # ESLint (flat config, type-aware via tsconfig)
npm run format         # Prettier --write across the repo
npm run build          # tsc → dist/ (dev/typecheck build; CommonJS, NOT the published shape)
npm run build:vite     # Vite → dist/index.mjs + index.cjs + rolled-up index.d.ts (the PUBLISHED artifacts)
```

Run a single test file (Jest 30 — pass a filename/path substring, not `--testPathPattern`):

```bash
npx jest CallbackRegistry          # by file
npx jest -t "deduplicate"          # by test name (describe/it text)
```

Coverage thresholds (`jest.config.json`) fail the run below **80%** statements/branches/functions/lines. `test:coverage` runs in CI, so a drop breaks the build.

## Build nuance (important)

`package.json` `main`/`module`/`exports` point at `dist/index.cjs`, `dist/index.mjs`, `dist/index.d.ts` — **these are produced by `build:vite`, not `npm run build`.** `npm run build` (plain `tsc`) emits per-file CommonJS for typechecking/local use and does *not* create the `.mjs`/`.cjs` bundle the package publishes. `scripts/deploy.sh` correctly uses `build:vite`. Don't assume `npm run build` regenerates publishable output.

## Architecture

Two independent Observer implementations coexist by design, plus a mixin and a registry. Their contracts differ in ways that matter — read the class before assuming behavior:

- **`ObserverSubject<T>`** — typed single-channel subject. `subscribe(cb)` **deduplicates** (same reference registered once) and returns an unsubscribe closure. `_notifyObservers(snapshot)` is **`protected`** — a bare `new ObserverSubject()` can subscribe but has no public way to notify; you must subclass to emit (tests use a `TestObserverSubject` wrapper). Notification iterates the live `_observers` array.

- **`DualObserverSubject<T extends unknown[]>`** — two *independent* observer collections: object observers (`{ update?(...args) }`, via `subscribe`/`notifyObservers`) and function observers (`(...args) => void`, via `subscribeFunction`/`notifyFunctionObservers`). Notifying one channel never touches the other. `subscribe` does **not** deduplicate (double-subscribe → notified twice), and subscribe/unsubscribe rebuild the array immutably (spread/filter).

- **`ObserverMixin` (`withObserver()`)** — returns a plain object of `subscribe`/`unsubscribe`/`notifyObservers` delegation methods to `Object.assign` onto a class prototype. The host must expose an `observerSubject` property (a `DualObserverSubject`). Options: `checkNull`, `className` (warning text), `excludeNotify` (host provides its own `notifyObservers`).

- **`CallbackRegistry`** — string-keyed map of named callbacks. `register(key, fn|null)` (non-function/non-null throws `TypeError`); `execute(key, ...args)` returns a boolean and swallows callback errors. `register(key, null)` keeps the key but makes `execute` a no-op; `unregister(key)` removes it.

**Cross-cutting invariant:** every notify/execute path wraps each observer/callback in its own `try/catch` so one failure cannot block the rest. Preserve this when editing any dispatch loop.

## Domain language (enforced)

`CONTEXT.md` defines a strict ubiquitous vocabulary with explicit *Avoid* lists — e.g. **Subject** (not observable/publisher/emitter/bus), **Observer** = the GoF object form *only* (a plain callback is a **Function observer**, never an "observer"), **Snapshot** (not event/payload/data), **Notification** (not emit/dispatch/broadcast). Match this vocabulary in code, identifiers, JSDoc, and docs; it is intentional, not incidental.

## Conventions

- TypeScript `strict: true`; prefer `unknown` + generics over `any` (ESLint warns on `any` in `src/`).
- Concrete, directly-instantiable classes; avoid abstract unless genuinely needed.
- Immutable collection updates (spread/filter) over in-place mutation, per `DualObserverSubject`.
- Tests mirror source one-to-one (`src/Foo.ts` → `test/Foo.test.ts`); `test/integration.test.ts` covers cross-pattern/barrel scenarios; shared helpers in `test/helpers.ts`.
- Note: `CallbackRegistry.ts` currently uses tab indentation while the rest of `src/` uses 2 spaces; `npm run format` normalizes it.

## Adding a pattern (from CONTRIBUTING.md)

1. `src/<Pattern>.ts` — concrete instantiable class. 2. Export from `src/index.ts`. 3. `test/<Pattern>.test.ts` with full coverage. 4. `docs/<PATTERN>_API.md`. 5. Mark done in `docs/ROADMAP.md`. 6. Bump version in `package.json` **and** `.workflow-config.yaml`.

## Deploy

`scripts/deploy.sh` (invoked by `ai-workflow deploy`): guards on `NPM_TOKEN` → `npm ci` → test → `build:vite` → commit `dist/` (force-added; it's gitignored but published for jsDelivr CDN) → tag → push → `npm publish`. `NPM_TOKEN` is read from the environment, or auto-loaded from a gitignored `.env` at the project root (an explicit `export` wins). The npm dist-tag is derived from the version's prerelease suffix (e.g. `-alpha` → tag `alpha`, otherwise `latest`).

## CI

`.github/workflows/ci.yml` runs lint → `test:coverage` → build on Node 18.x & 20.x for every push/PR to `main`.
