# Roadmap — bessa_patterns.ts

> Library of Reusable Design Patterns in TypeScript

---

## Current State (v0.12.16-alpha / main)

Four Observer/Registry modules are implemented and fully tested:

| Class / Function      | Since        | Description                                                                                  |
| --------------------- | ------------ | -------------------------------------------------------------------------------------------- |
| `ObserverSubject<T>`  | 0.9.1-alpha  | Generic callback-based Observer — typed snapshot, subscribe/unsubscribe by returned function |
| `DualObserverSubject` | 0.10.0-alpha | GoF + function-based dual Observer — two independent observer collections managed immutably  |
| `withObserver`        | 0.12.3-alpha | Mixin factory that delegates standard observer methods to any class via composition          |
| `CallbackRegistry`    | 0.12.16-alpha | Type-safe named-callback registry — register, execute, unregister, error-isolated            |

**Infrastructure:** TypeScript build (Vite, dual CJS + ESM output), Jest + ts-jest, 97 passing tests, API reference docs for all four modules (`OBSERVER_SUBJECT_API.md`, `DUAL_OBSERVER_SUBJECT_API.md`, `OBSERVER_MIXIN_API.md`, `CALLBACK_REGISTRY_API.md`).

---

## v0.12.3-alpha — Library Foundations ✅

Complete the foundational scaffolding before adding more patterns.

- [x] `src/index.ts` — public barrel export for all patterns
- [x] API documentation for `DualObserverSubject` (`docs/DUAL_OBSERVER_SUBJECT_API.md`)
- [x] ESLint + TypeScript-aware rules (`eslint.config.mjs`)
- [x] GitHub Actions CI workflow (build + test on push/PR)
- [x] `npm run lint` wired to ESLint
- [x] **`ai-workflow deploy` support** — bash deploy script + workflow config wiring
  - `scripts/deploy.sh` — runs tests, compiles TypeScript, and publishes to npm; exits non-zero on any failure
  - `deploy:` section added to `.workflow-config.yaml` (`script: scripts/deploy.sh`, `description: Build and publish to npm`)
  - Script guards: checks `npm test` passes, `npm run build` succeeds, and `NPM_TOKEN` env var is set before publishing

---

## v0.12.4-alpha — Observer Mixin ✅

Composition helper that eliminates observer boilerplate for any class.

- [x] `withObserver` — factory function returning a mixin with `subscribe`, `unsubscribe`, `notify`, and `getObserverCount`
- [x] `ObserverMixinOptions` / `ObserverMixinResult<T>` — exported types
- [x] Full test coverage (`test/ObserverMixin.test.ts` — 14 tests)
- [x] API documentation (`docs/OBSERVER_MIXIN_API.md`)
- [x] Exported from `src/index.ts`

---

## v0.12.16-alpha — CallbackRegistry ✅

Type-safe registry for managing named callbacks with centralised execution and error isolation.

- [x] `CallbackRegistry` — `register(type, fn | null)`, `execute(type, ...args)`, `unregister`, `has`, `clear`, `getRegisteredTypes`, `size`, `isEmpty`
- [x] `TypeError` on invalid registration input; guarded `execute` catches and logs errors, returns `boolean`
- [x] Full test coverage (`test/CallbackRegistry.test.ts` — 25 tests)
- [x] API documentation (`docs/CALLBACK_REGISTRY_API.md`)
- [x] Exported from `src/index.ts`

---

## v0.13.0-alpha — Command Pattern

Encapsulate requests as objects, enabling undo/redo, queuing, and logging.

- [ ] `Command<T>` — interface: `execute(): T`, `undo(): void`
- [ ] `CommandHistory` — stack-based undo/redo manager
- [ ] `MacroCommand` — composite command that executes a sequence
- [ ] Full test coverage
- [ ] API documentation

---

## v0.14.0-alpha — Strategy Pattern

Define a family of algorithms behind a common interface, making them interchangeable at runtime.

- [ ] `Strategy<TInput, TOutput>` — interface: `execute(input: TInput): TOutput`
- [ ] `StrategyContext<TInput, TOutput>` — context that delegates to a `Strategy`
- [ ] Full test coverage
- [ ] API documentation

---

## v0.15.0-alpha — State Pattern

Allow an object to alter its behaviour when its internal state changes.

- [ ] `State` — interface: `handle(context: StateContext): void`
- [ ] `StateContext` — manages the current state and transitions
- [ ] `StateMachine<TState, TEvent>` — generic typed finite state machine
- [ ] Full test coverage
- [ ] API documentation

---

## v0.16.0-alpha — Iterator Pattern

Provide a standard way to traverse collections without exposing internal representation.

- [ ] `Iterator<T>` — interface: `hasNext(): boolean`, `next(): T`
- [ ] `IterableCollection<T>` — interface for collections that produce iterators
- [ ] Integration with native JavaScript `Symbol.iterator` protocol
- [ ] Full test coverage
- [ ] API documentation

---

## v0.17.0-alpha — Composite & Decorator Patterns

Structural patterns for building tree hierarchies and layering behaviour transparently.

### Composite

- [ ] `Component<T>` — common interface for leaf and composite nodes
- [ ] `Leaf<T>` / `CompositeNode<T>` — concrete implementations
- [ ] `walk(visitor)` / `find(predicate)` traversal helpers

### Decorator

- [ ] `Decorator<T>` — base wrapper delegating to a `Component<T>`
- [ ] Example decorator: logging, caching, retry

- [ ] Full test coverage for both patterns
- [ ] API documentation for both patterns

---

## v1.0.0 — Stable Release

- [ ] All alpha patterns promoted to stable API surface
- [ ] `CHANGELOG.md` with full version history
- [ ] 100% documented public API (JSDoc + Markdown)
- [ ] Test coverage ≥ 90% on all modules
- [ ] Published to npm (`npm publish`)
- [ ] `README.md` expanded: installation, quick-start examples, pattern catalogue

---

## Considered / Future

These are under consideration and may be added after v1.0.0 based on need:

| Pattern                 | Category    | Notes                                                      |
| ----------------------- | ----------- | ---------------------------------------------------------- |
| Factory Method          | Creational  | Typed object creation without coupling to concrete classes |
| Abstract Factory        | Creational  | Families of related objects                                |
| Builder                 | Creational  | Step-by-step typed object construction                     |
| Proxy                   | Structural  | Lazy loading, access control, caching                      |
| Chain of Responsibility | Behavioural | Request pipelines                                          |
| Template Method         | Behavioural | Algorithm skeleton with overrideable steps                 |
| Mediator                | Behavioural | Decoupled many-to-many communication                       |
| Memento                 | Behavioural | Snapshot + restore object state                            |
| Visitor                 | Behavioural | Operations on object structures without modifying them     |

---

## Roadmap — Minor Issues

> Populated by the `fix-log-issues` skill. Each item was verified against
> the live codebase before being marked done.

| ID     | Source step | Description                                                        | File / Path                                                        | Priority | Status |
|--------|-------------|--------------------------------------------------------------------|--------------------------------------------------------------------|----------|--------|
| RI-001 | step_05     | `.github/skills/` not documented in ARCHITECTURE.md               | docs/ARCHITECTURE.md                                               | Medium   | done   |
| RI-002 | step_13     | MD002: first header not H1 in all SKILL.md files                  | .github/skills/*/SKILL.md                                          | Low      | done   |
| RI-003 | step_13     | MD029: sequential ordered list numbering in SKILL.md files        | .github/skills/validate-logs/SKILL.md, fix-log-issues/SKILL.md    | Low      | done   |
| RI-004 | step_06     | warnSpy not restored in afterEach in integration tests            | test/integration.test.ts                                           | Low      | done   |
| RI-005 | step_09     | test:watch and test:coverage scripts use npm passthrough          | package.json                                                       | Low      | done   |
| RI-006 | step_03     | `scripts/colors.sh` not documented in ARCHITECTURE.md             | docs/ARCHITECTURE.md                                               | Low      | done   |
| RI-007 | step_06     | `createObserver()` duplicated across three test files             | test/helpers.ts, test/DualObserverSubject.test.ts, test/ObserverMixin.test.ts, test/integration.test.ts | Medium | done |
| RI-008 | step_16     | version-sync `node -e` inline script fails with SyntaxError       | scripts/version-sync.js, .workflow-config.yaml                     | Medium   | done   |
| RI-009 | step_05     | `verify-workflow-efficacy` skill missing from ARCHITECTURE.md skills tree | docs/ARCHITECTURE.md                                        | Low      | done   |
| RI-010 | step_02     | README.md deployment section lacks troubleshooting guidance        | README.md                                                          | Medium   | done   |
| RI-011 | step_05     | `validate-log-file` skill missing from ARCHITECTURE.md skills tree | docs/ARCHITECTURE.md                                              | Low      | done   |
| RI-012 | step_06     | Redundant and misleadingly-named test in `test/index.test.ts`     | test/index.test.ts                                                 | Low      | done   |
| RI-013 | step_09     | Package name `bessa_patterns.ts` uses non-conventional characters  | package.json                                                       | Low      | open   |
| RI-014 | step_19     | Missing explicit `: unknown` annotation on catch parameter         | src/CallbackRegistry.ts                                            | Low      | done   |
| RI-015 | step_20     | `ObserverSubject.subscribe()` allows duplicate subscriptions silently | src/ObserverSubject.ts, test/ObserverSubject.test.ts            | Low      | done   |

---

## Design Principles (all patterns follow these)

- **Typed first** — generics over `any`; `unknown` where the type cannot be fixed
- **Concrete by default** — instantiable directly unless abstraction is genuinely necessary
- **Error isolation** — observer/callback errors are caught per-invocation; others proceed
- **Immutable collections** — subscribe/unsubscribe return new arrays (no in-place mutation)
- **Zero runtime dependencies** — the library itself has no production `dependencies`
- **One file per pattern** — `src/<PatternName>.ts`; test at `test/<PatternName>.test.ts`
