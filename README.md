# bessa_patterns.ts

Library of Reusable Design Patterns in TypeScript

## Installation

```bash
npm install bessa_patterns.ts
```

## Patterns

| Class                 | Pattern  | Description                                                           |
| --------------------- | -------- | --------------------------------------------------------------------- |
| `ObserverSubject<T>`  | Observer | Typed callback-based subject — subscribe/notify with typed snapshots  |
| `DualObserverSubject` | Observer | GoF + function-based dual subject — two independent observer channels |

## Quick Example

```typescript
import { ObserverSubject } from 'bessa_patterns.ts';

const counter = new ObserverSubject<{ count: number }>();
const unsub = counter.subscribe(({ count }) => console.log(count));

counter.notify({ count: 1 }); // 1
counter.notify({ count: 2 }); // 2
unsub();
```

## Deployment

`scripts/deploy.sh` builds and publishes the package to npm. It is invoked automatically by `ai-workflow deploy` or manually:

```bash
export NPM_TOKEN=<your-npm-token>
bash scripts/deploy.sh
```

Alternatively, place the token in a gitignored `.env` file at the project root and the deploy script loads it automatically:

```bash
# .env  (never committed)
NPM_TOKEN=<your-npm-token>
```

An explicit `export NPM_TOKEN=...` in the environment takes precedence over the `.env` value.

**Prerequisites:**

- `NPM_TOKEN` must be set — via the environment or a `.env` file at the project root (publish auth token)
- `npm` must be available on `PATH`

**What it does (in order):**

1. `npm ci` — clean dependency install
1. `npm test` — all tests must pass
1. `npm run build` — TypeScript compiled to `dist/`
1. `npm publish --access public` — publishes to the npm registry

**Exit codes:** `0` on success; non-zero on any failure (guard failures abort immediately via `set -euo pipefail`).

### Troubleshooting

| Symptom                               | Cause                                     | Fix                                                             |
| ------------------------------------- | ----------------------------------------- | --------------------------------------------------------------- |
| `Error: npm ERR! 401 Unauthorized`    | `NPM_TOKEN` is missing or expired         | Run `export NPM_TOKEN=<valid-token>` before invoking the script |
| Script aborts at `npm test` step      | One or more tests are failing             | Run `npm test` locally, fix failures, then retry the deploy     |
| `npm ERR! network` / registry timeout | Transient npm registry connectivity issue | Retry; if persistent, check `https://status.npmjs.org`          |

## Documentation

- [Documentation Index](docs/README.md)
- [Getting Started](docs/GETTING_STARTED.md)
- [API Reference](docs/API.md)
- [DualObserverSubject API](docs/DUAL_OBSERVER_SUBJECT_API.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Roadmap](docs/ROADMAP.md)
- [Changelog](CHANGELOG.md)
- [Contributing](CONTRIBUTING.md)

## Development

| Tool / Directory        | Purpose                                                                                   |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| `npm test`              | Run all Jest tests                                                                        |
| `npm run test:coverage` | Run tests with coverage report (output to `coverage/`; 80% threshold enforced)            |
| `npm run lint`          | Lint with ESLint (`eslint.config.mjs`)                                                    |
| `npm run build`         | Compile TypeScript to `dist/` via `tsc`                                                   |
| `.husky/`               | [Husky](https://typicode.github.io/husky/) Git hooks — runs lint and tests before commits |
