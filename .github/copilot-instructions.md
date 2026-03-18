# Copilot Instructions

## Project Overview

`bessa_patterns.ts` is a library of reusable design patterns implemented in TypeScript. It is a Node.js/npm project.

## Conventions

- Language: TypeScript
- Package manager: npm
- Source files: `src/`
- Tests: `test/`
- Docs: `docs/`
- Build output: `dist/`
- Each pattern in its own file/subdirectory under `src/`
- Linting: ESLint (`eslint.config.mjs`)
- Testing: Jest + ts-jest (`jest.config.json`)
- Minimum documentation coverage: 80%
- Minimum test coverage: 70%

## Commands

```bash
npm install          # install dependencies
npm run build        # compile TypeScript
npm test             # run all tests
npm test -- --testPathPattern=<name>  # run a single test
npm run lint         # lint the codebase
```

## Architecture

Patterns are exported via `src/index.ts` as a public barrel. Observer/Subject variants are implemented; more patterns are planned (see `docs/ROADMAP.md`).

## CI/CD

- GitHub Actions workflow: `.github/workflows/ci.yml` (lint → test → build)
- Deploy script: `scripts/deploy.sh` (see `.workflow-config.yaml`)

## References

- [docs/ROADMAP.md](../docs/ROADMAP.md)
- [docs/API.md](../docs/API.md)
- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)
- [docs/DUAL_OBSERVER_SUBJECT_API.md](../docs/DUAL_OBSERVER_SUBJECT_API.md)
