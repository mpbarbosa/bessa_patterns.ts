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

counter._notifyObservers({ count: 1 }); // 1
counter._notifyObservers({ count: 2 }); // 2
unsub();
```

## Deployment

`scripts/deploy.sh` builds and publishes the package to npm. It is invoked automatically by `ai-workflow deploy` or manually:

```bash
export NPM_TOKEN=<your-npm-token>
bash scripts/deploy.sh
```

**Prerequisites:**

- `NPM_TOKEN` environment variable must be set (publish auth token)
- `npm` must be available on `PATH`

**What it does (in order):**

1. `npm ci` — clean dependency install
2. `npm test` — all tests must pass
3. `npm run build` — TypeScript compiled to `dist/`
4. `npm publish --access public` — publishes to the npm registry

**Exit codes:** `0` on success; non-zero on any failure (guard failures abort immediately via `set -euo pipefail`).

## Documentation

- [Documentation Index](docs/README.md)
- [Getting Started](docs/GETTING_STARTED.md)
- [API Reference](docs/API.md)
- [DualObserverSubject API](docs/DUAL_OBSERVER_SUBJECT_API.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Roadmap](docs/ROADMAP.md)
- [Changelog](CHANGELOG.md)
- [Contributing](CONTRIBUTING.md)
