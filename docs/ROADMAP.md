# Roadmap — bessa_patterns.ts

> Library of Reusable Design Patterns in TypeScript

---

## Current State (v0.11.0-alpha)

Two Observer/Subject variants are implemented and fully tested:

| Class                 | Since        | Description                                                                                  |
| --------------------- | ------------ | -------------------------------------------------------------------------------------------- |
| `ObserverSubject<T>`  | 0.9.1-alpha  | Generic callback-based Observer — typed snapshot, subscribe/unsubscribe by returned function |
| `DualObserverSubject` | 0.10.0-alpha | GoF + function-based dual Observer — two independent observer collections managed immutably  |

**Infrastructure:** TypeScript build (`tsc`), Jest + ts-jest, 46 passing tests, API docs for `ObserverSubject`.

---

## v0.12.2-alpha — Library Foundations ✅

Complete the foundational scaffolding before adding more patterns.

- [x] `src/index.ts` — public barrel export for all patterns
- [x] API documentation for `DualObserverSubject` (`docs/DUAL_OBSERVER_SUBJECT_API.md`)
- [x] ESLint + TypeScript-aware rules (`eslint.config.mjs`)
- [x] GitHub Actions CI workflow (build + test on push/PR)
- [x] `npm run lint` wired to ESLint (currently points to `tsc --noEmit`)
- [x] **`ai-workflow deploy` support** — bash deploy script + workflow config wiring
  - `scripts/deploy.sh` — runs tests, compiles TypeScript, and publishes to npm; exits non-zero on any failure
  - `deploy:` section added to `.workflow-config.yaml` (`script: scripts/deploy.sh`, `description: Build and publish to npm`)
  - Script guards: checks `npm test` passes, `npm run build` succeeds, and `NPM_TOKEN` env var is set before publishing

---

## v0.12.2-alpha — Command Pattern

Encapsulate requests as objects, enabling undo/redo, queuing, and logging.

- [ ] `Command<T>` — interface: `execute(): T`, `undo(): void`
- [ ] `CommandHistory` — stack-based undo/redo manager
- [ ] `MacroCommand` — composite command that executes a sequence
- [ ] Full test coverage
- [ ] API documentation

---

## v0.13.0-alpha — Strategy Pattern

Define a family of algorithms behind a common interface, making them interchangeable at runtime.

- [ ] `Strategy<TInput, TOutput>` — interface: `execute(input: TInput): TOutput`
- [ ] `StrategyContext<TInput, TOutput>` — context that delegates to a `Strategy`
- [ ] Full test coverage
- [ ] API documentation

---

## v0.14.0-alpha — State Pattern

Allow an object to alter its behaviour when its internal state changes.

- [ ] `State` — interface: `handle(context: StateContext): void`
- [ ] `StateContext` — manages the current state and transitions
- [ ] `StateMachine<TState, TEvent>` — generic typed finite state machine
- [ ] Full test coverage
- [ ] API documentation

---

## v0.15.0-alpha — Iterator Pattern

Provide a standard way to traverse collections without exposing internal representation.

- [ ] `Iterator<T>` — interface: `hasNext(): boolean`, `next(): T`
- [ ] `IterableCollection<T>` — interface for collections that produce iterators
- [ ] Integration with native JavaScript `Symbol.iterator` protocol
- [ ] Full test coverage
- [ ] API documentation

---

## v0.16.0-alpha — Composite & Decorator Patterns

Structural patterns for building tree hierarchies and layering behaviour transparently.

**Composite**

- [ ] `Component<T>` — common interface for leaf and composite nodes
- [ ] `Leaf<T>` / `CompositeNode<T>` — concrete implementations
- [ ] `walk(visitor)` / `find(predicate)` traversal helpers

**Decorator**

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

## Design Principles (all patterns follow these)

- **Typed first** — generics over `any`; `unknown` where the type cannot be fixed
- **Concrete by default** — instantiable directly unless abstraction is genuinely necessary
- **Error isolation** — observer/callback errors are caught per-invocation; others proceed
- **Immutable collections** — subscribe/unsubscribe return new arrays (no in-place mutation)
- **Zero runtime dependencies** — the library itself has no production `dependencies`
- **One file per pattern** — `src/<PatternName>.ts`; test at `test/<PatternName>.test.ts`
