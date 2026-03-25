# API Reference

Public exports from `bessa_patterns.ts` (`src/index.ts`).

---

## CallbackRegistry

Registry for named callback functions with type-safe registration and guarded execution.

**Import:**

```typescript
import { CallbackRegistry } from 'bessa_patterns.ts';
```

| Member | Signature | Description |
| --- | --- | --- |
| constructor | `new CallbackRegistry()` | Creates instance with empty internal map |
| `register` | `(type: string, callback: Function \| null) => void` | Registers a callback; throws `TypeError` if not a function or `null` |
| `get` | `(type: string) => Function \| null` | Returns the callback for a key, or `null` if absent |
| `execute` | `(type: string, ...args: unknown[]) => boolean` | Calls the callback; catches errors and returns `false` on failure |
| `has` | `(type: string) => boolean` | Returns `true` if key is present (even if value is `null`) |
| `unregister` | `(type: string) => boolean` | Removes key; returns `true` if key existed |
| `clear` | `() => void` | Removes all keys |
| `getRegisteredTypes` | `() => string[]` | Returns all registered key identifiers |
| `size` | `() => number` | Number of registered keys |
| `isEmpty` | `() => boolean` | `true` when no keys are registered |

**Example:**

```typescript
const registry = new CallbackRegistry();
registry.register('onChange', (detail) => console.log(detail));
registry.execute('onChange', { from: 'a', to: 'b' }); // true
registry.unregister('onChange');
```

Full reference: [docs/CALLBACK_REGISTRY_API.md](CALLBACK_REGISTRY_API.md)

---

## ObserverSubject\<T\>

Generic concrete Subject. Manages typed callback observers and notifies them with a snapshot value.

**Import:**

```typescript
import { ObserverSubject } from 'bessa_patterns.ts';
```

| Member             | Signature                                         | Description                                                                            |
| ------------------ | ------------------------------------------------- | -------------------------------------------------------------------------------------- |
| constructor        | `new ObserverSubject<T>()`                        | Creates instance with empty observer list                                              |
| `subscribe`        | `(callback: (snapshot: T) => void) => () => void` | Registers observer; returns unsubscribe function. Throws `TypeError` if not a function |
| `unsubscribe`      | `(callback: (snapshot: T) => void) => boolean`    | Removes observer by reference; returns `true` if found                                 |
| `getObserverCount` | `() => number`                                    | Number of active observers                                                             |
| `clearObservers`   | `() => void`                                      | Removes all observers                                                                  |
| `_notifyObservers` | `(snapshot: T) => void`                           | Calls all observers with snapshot; per-observer errors are caught and logged           |

**Example:**

```typescript
const subject = new ObserverSubject<{ count: number }>();
const unsub = subject.subscribe(({ count }) => console.log(count));
subject._notifyObservers({ count: 1 }); // 1
unsub();
```

Full reference: [docs/OBSERVER_SUBJECT_API.md](OBSERVER_SUBJECT_API.md)

---

## DualObserverSubject

Concrete Subject with two independent observer channels: GoF object observers and function observers.

**Import:**

```typescript
import { DualObserverSubject } from 'bessa_patterns.ts';
import type { ObserverObject, ObserverFunction } from 'bessa_patterns.ts';
```

### Object observer channel

| Member             | Signature                                                 | Description                                                          |
| ------------------ | --------------------------------------------------------- | -------------------------------------------------------------------- |
| `subscribe`        | `(observer: ObserverObject | null | undefined) => void` | Adds object observer; silently ignores null/undefined                |
| `unsubscribe`      | `(observer: ObserverObject) => void`                      | Removes by reference                                                 |
| `notifyObservers`  | `(...args: unknown[]) => void`                            | Calls `observer.update(...args)` on each; per-observer errors caught |
| `getObserverCount` | `() => number`                                            | Number of active object observers                                    |
| `observers`        | `ReadonlyArray<ObserverObject>`                           | Read-only view of current object observers                           |

### Function observer channel

| Member                     | Signature                                             | Description                                               |
| -------------------------- | ----------------------------------------------------- | --------------------------------------------------------- |
| `subscribeFunction`        | `(fn: ObserverFunction | null | undefined) => void` | Adds function observer; silently ignores null/undefined   |
| `unsubscribeFunction`      | `(fn: ObserverFunction) => void`                      | Removes by reference                                      |
| `notifyFunctionObservers`  | `(...args: unknown[]) => void`                        | Calls each function with args; per-observer errors caught |
| `getFunctionObserverCount` | `() => number`                                        | Number of active function observers                       |
| `functionObservers`        | `ReadonlyArray<ObserverFunction>`                     | Read-only view of current function observers              |

### Shared

| Member              | Signature    | Description              |
| ------------------- | ------------ | ------------------------ |
| `clearAllObservers` | `() => void` | Empties both collections |

**Example:**

```typescript
const subject = new DualObserverSubject();

subject.subscribe({ update: (src, evt) => console.log('obj:', evt) });
subject.subscribeFunction((src, evt) => console.log('fn:', evt));

subject.notifyObservers(subject, 'click'); // obj: click
subject.notifyFunctionObservers(subject, 'click'); // fn: click
```

Full reference: [docs/DUAL_OBSERVER_SUBJECT_API.md](DUAL_OBSERVER_SUBJECT_API.md)

---

## withObserver

Mixin factory that adds GoF observer delegation methods to any class holding a `DualObserverSubject`.

**Import:**

```typescript
import { withObserver } from 'bessa_patterns.ts';
import type { ObserverMixinOptions, ObserverMixinResult } from 'bessa_patterns.ts';
```

| Member | Signature | Description |
| --- | --- | --- |
| `withObserver` | `(options?: ObserverMixinOptions) => ObserverMixinResult` | Returns a mixin with `subscribe`, `unsubscribe`, and (optionally) `notifyObservers` |

### `ObserverMixinOptions`

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `checkNull` | `boolean` | `false` | Warn and abort if observer is `null`/`undefined` |
| `className` | `string` | `'Class'` | Name used in warning messages |
| `excludeNotify` | `boolean` | `false` | Omit `notifyObservers` from the mixin |

**Example:**

```typescript
import { withObserver, DualObserverSubject } from 'bessa_patterns.ts';

class EventBus {
    observerSubject = new DualObserverSubject();
}
Object.assign(EventBus.prototype, withObserver());

const bus = new EventBus();
bus.subscribe({ update(event, data) { console.log(event, data); } });
bus.notifyObservers('click', { x: 10 });
```

Full reference: [docs/OBSERVER_MIXIN_API.md](OBSERVER_MIXIN_API.md)

---

## Exported Types

| Type | Definition | Description |
| --- | --- | --- |
| `ObserverObject` | `{ update?: (...args: unknown[]) => void }` | Shape of an object-based observer; `update` is optional |
| `ObserverFunction` | `(...args: unknown[]) => void` | Shape of a function-based observer callback |

```typescript
import type { ObserverObject, ObserverFunction } from 'bessa_patterns.ts';

const myObserver: ObserverObject = {
  update(event, data) { console.log(event, data); }
};

const myHandler: ObserverFunction = (event, data) => console.log(event, data);
```
