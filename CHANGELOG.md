# Changelog

All notable changes to `bessa_patterns.ts` are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [0.11.0-alpha] — 2026-03-09

### Added

- `src/index.ts` — public barrel export for `ObserverSubject` and `DualObserverSubject`
- `eslint.config.mjs` — ESLint flat config with `typescript-eslint` rules
- `.github/workflows/ci.yml` — GitHub Actions CI (Node 18 & 20: lint → test → build)
- `scripts/deploy.sh` — guarded bash deploy script (`NPM_TOKEN` check → test → build → npm publish)
- `docs/DUAL_OBSERVER_SUBJECT_API.md` — full API reference for `DualObserverSubject`
- `docs/GETTING_STARTED.md` — installation and quick-start guide
- `docs/ARCHITECTURE.md` — directory structure, pattern catalogue, design principles, build pipeline
- `docs/API.md` — consolidated public API reference
- `CONTRIBUTING.md` — development setup, conventions, PR process
- `CHANGELOG.md` — this file

### Changed

- `package.json` `lint` script: `tsc --noEmit` → `eslint .`
- `.workflow-config.yaml`: added `deploy:` section; bumped version to `0.11.0-alpha`
- `docs/ROADMAP.md`: v0.11.0-alpha items marked complete ✅

### Dependencies added (devDependencies)

- `@typescript-eslint/eslint-plugin`
- `@typescript-eslint/parser`
- `@eslint/js`
- `globals`

---

## [0.10.0-alpha] — 2026-03-09

### Added

- `src/DualObserverSubject.ts` — GoF + function-based dual Observer pattern
  - Two independent collections: object observers (`.update()`) and function observers
  - Immutable array pattern on subscribe/unsubscribe (spread + filter)
  - Error isolation per observer; read-only `observers` and `functionObservers` accessors
- `test/DualObserverSubject.test.ts` — 32 tests covering all methods and edge cases
- `package.json`, `tsconfig.json`, `jest.config.json` — npm project scaffolding
- `.workflow-config.yaml` — `ai_workflow.js` project configuration
- `.ai_workflow/` — workflow artifact directories

---

## [0.9.1-alpha] — 2026-03-09

### Added

- `src/ObserverSubject.ts` — generic typed callback Observer pattern
  - `subscribe(callback)` returns an unsubscribe function
  - `unsubscribe(callback)` by reference, returns `boolean`
  - `_notifyObservers(snapshot)` with per-observer error isolation
  - `getObserverCount()`, `clearObservers()`
- `test/ObserverSubject.test.ts` — 14 tests covering all methods and edge cases
- `docs/OBSERVER_SUBJECT_API.md` — full API reference
- `docs/ROADMAP.md` — pattern release roadmap through v1.0.0

---

## [0.1.0] — Initial commit

- Repository initialised with `README.md`, `LICENSE`, `.gitignore`
