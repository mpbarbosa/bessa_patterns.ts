# ObserverSubject API Documentation

**Version:** 0.9.1-alpha
**Module:** `src/ObserverSubject.ts`
**Pattern:** Observer/Subject
**Author:** Marcelo Pereira Barbosa

## Overview

`ObserverSubject<T>` is a concrete generic class that implements the Observer/Subject pattern.
It manages a typed list of observer callbacks and notifies them with a snapshot value whenever
the subject signals a state change.

The class can be used directly or extended by specialised subclasses.

## Purpose and Responsibility

- **Observer registration:** `subscribe` / `unsubscribe` with function-reference semantics
- **Notification:** `_notifyObservers(snapshot)` forwards a typed value to all registered callbacks
- **Error isolation:** Errors thrown inside observer callbacks are caught and logged so other observers are unaffected
- **Introspection:** `getObserverCount()` and `clearObservers()` for lifecycle management

## Location in Codebase

```text
src/ObserverSubject.ts
```

## Type Parameter

| Parameter | Description                                                             |
| --------- | ----------------------------------------------------------------------- |
| `T`       | Shape of the snapshot value forwarded to observers on each notification |

## Constructor

### `constructor()`

Creates a new `ObserverSubject` instance with an empty observer list.

```typescript
const subject = new ObserverSubject<{ value: number }>();
```

## Methods

### `subscribe(callback)`

Registers an observer callback. Returns a zero-argument unsubscribe function for convenience.

**Parameters:**

- `callback` (`(snapshot: T) => void`) — called on each `_notifyObservers` invocation

**Returns:** `() => void` — call to remove this observer

**Throws:** `TypeError` if `callback` is not a function

```typescript
const unsub = subject.subscribe((snap) => console.log(snap.value));

// Later
unsub();
```

---

### `unsubscribe(callback)`

Removes a previously registered observer by function reference.

**Parameters:**

- `callback` — the exact function reference passed to `subscribe()`

**Returns:** `boolean` — `true` if the callback was found and removed, `false` otherwise

```typescript
const handler = (snap) => doSomething(snap);
subject.subscribe(handler);
subject.unsubscribe(handler); // true
subject.unsubscribe(handler); // false — already removed
```

---

### `getObserverCount()`

Returns the number of currently registered observers.

**Returns:** `number`

```typescript
console.log(subject.getObserverCount()); // 0
subject.subscribe(jest.fn());
console.log(subject.getObserverCount()); // 1
```

---

### `clearObservers()`

Removes all registered observers. Useful for cleanup and testing.

```typescript
subject.clearObservers();
console.log(subject.getObserverCount()); // 0
```

---

### `_notifyObservers(snapshot)`

Calls every registered observer with `snapshot`. Errors thrown by individual observers
are caught and logged with `console.warn`; remaining observers are still called.

**Parameters:**

- `snapshot` (`T`) — value forwarded to every observer

```typescript
subject._notifyObservers({ value: 42 });
```

## Error Handling

Observer errors are caught per-callback and logged:

```typescript
subject.subscribe(() => {
  throw new Error('boom');
}); // caught, logged
subject.subscribe((snap) => doWork(snap)); // still called
```

## Usage Examples

### Direct instantiation

```typescript
import ObserverSubject from './src/ObserverSubject';

interface CounterSnapshot {
  count: number;
}

const subject = new ObserverSubject<CounterSnapshot>();

const unsub = subject.subscribe(({ count }) => {
  console.log('Count is now', count);
});

subject._notifyObservers({ count: 1 });
subject._notifyObservers({ count: 2 });

unsub();
subject._notifyObservers({ count: 3 }); // not received
```

### Subclassing

```typescript
class Counter extends ObserverSubject<{ count: number }> {
  private _count = 0;

  increment() {
    this._count++;
    this._notifyObservers({ count: this._count });
  }
}

const counter = new Counter();
counter.subscribe(({ count }) => console.log(count));
counter.increment(); // logs: 1
counter.increment(); // logs: 2
```

## Design Notes

- **Concrete:** Not abstract — instantiable directly without subclassing
- **Generic:** The type parameter `T` ensures observers receive correctly typed snapshots
- **No coupling:** Has no dependencies on `GeoPosition` or any domain classes
- **Prefix convention:** `_notifyObservers` uses the `_` prefix to indicate it is an
  internal/protected operation intended to be called by the owning class or subclass,
  not by external consumers

## Tests

Tests are located at `test/ObserverSubject.test.ts` and cover:

- Constructor initialisation
- `subscribe()` registration and returned unsubscribe function
- `unsubscribe()` by reference, return value, and effect on other observers
- `getObserverCount()` across subscribe/unsubscribe cycles
- `clearObservers()` removing all observers
- `_notifyObservers(snapshot)` delivery to all observers
- Observer error isolation and `console.warn` logging
- Observer error isolation and `console.warn` logging
