# DualObserverSubject API Documentation

**Version:** 0.10.0-alpha
**Module:** `src/DualObserverSubject.ts`
**Pattern:** Observer/Subject (GoF + Function-based dual variant)
**Author:** Marcelo Pereira Barbosa

## Overview

`DualObserverSubject` is a concrete class that manages **two independent observer collections**:

- **Object observers** — GoF-style objects with an optional `update()` method, subscribed via `subscribe()` and notified via `notifyObservers()`
- **Function observers** — modern callback functions, subscribed via `subscribeFunction()` and notified via `notifyFunctionObservers()`

The two collections are fully independent: notifying one does not affect the other. Both use an **immutable array pattern** — every subscribe/unsubscribe creates a new array rather than mutating in place.

## Purpose and Responsibility

- **Dual observer management:** Two separate collections for object and function observers
- **GoF compatibility:** Object observers called via `observer.update(...args)` — compatible with classic Observer implementations
- **Error isolation:** Errors thrown by individual observers are caught and logged; remaining observers still receive the notification
- **Null safety:** `null` and `undefined` subscriptions are silently ignored
- **Introspection:** `getObserverCount()`, `getFunctionObserverCount()`, read-only `observers` and `functionObservers` accessors

## Location in Codebase

```text
src/DualObserverSubject.ts
```

## Types

### `ObserverObject`

An object that may implement an `update` method.

```typescript
type ObserverObject = { update?: (...args: unknown[]) => void };
```

### `ObserverFunction`

A function-based observer callback.

```typescript
type ObserverFunction = (...args: unknown[]) => void;
```

## Constructor

### `constructor()`

Creates a new `DualObserverSubject` with two empty observer collections.

```typescript
const subject = new DualObserverSubject();
```

## Properties

### `observers` *(read-only)*

A read-only view of the object observers currently subscribed via `subscribe()`.

**Type:** `ReadonlyArray<ObserverObject>`

```typescript
console.log(subject.observers.length); // 0
```

### `functionObservers` *(read-only)*

A read-only view of the function observers currently subscribed via `subscribeFunction()`.

**Type:** `ReadonlyArray<ObserverFunction>`

```typescript
console.log(subject.functionObservers.length); // 0
```

## Methods

### `subscribe(observer)`

Subscribes an object observer. The observer's `update()` method will be called on each `notifyObservers()` invocation. Silently ignores `null` and `undefined`.

**Parameters:**

- `observer` (`ObserverObject | null | undefined`) — object with an optional `update` method

**Returns:** `void`

**Immutable pattern:** creates a new internal array on each call.

```typescript
const observer = {
  update(source, event, data) {
    console.log('Notified:', event, data);
  }
};

subject.subscribe(observer);
subject.subscribe(null);      // silently ignored
subject.subscribe(undefined); // silently ignored
```

---

### `unsubscribe(observer)`

Removes a previously subscribed object observer by reference. No-ops silently if the observer is not found.

**Parameters:**

- `observer` (`ObserverObject`) — the exact object reference passed to `subscribe()`

**Returns:** `void`

**Immutable pattern:** creates a new internal array via `filter`.

```typescript
subject.unsubscribe(observer);
```

---

### `notifyObservers(...args)`

Calls `update(...args)` on every subscribed object observer that implements `update`. Observers without an `update` method are silently skipped. Errors thrown by individual observers are caught and logged with `console.warn`; remaining observers are still called.

**Parameters:**

- `...args` (`unknown[]`) — forwarded verbatim to each observer's `update()` method

**Returns:** `void`

```typescript
subject.notifyObservers(this, 'positionChanged', { lat: -23.5, lon: -46.6 });
// does NOT notify function observers
```

---

### `subscribeFunction(observerFunction)`

Subscribes a function observer. The function will be called on each `notifyFunctionObservers()` invocation. Silently ignores `null` and `undefined`.

**Parameters:**

- `observerFunction` (`ObserverFunction | null | undefined`) — callback function

**Returns:** `void`

**Immutable pattern:** creates a new internal array on each call.

```typescript
const handler = (source, event, data) => {
  console.log('Function notified:', event);
};

subject.subscribeFunction(handler);
subject.subscribeFunction(null);      // silently ignored
subject.subscribeFunction(undefined); // silently ignored
```

---

### `unsubscribeFunction(observerFunction)`

Removes a previously subscribed function observer by reference. No-ops silently if not found.

**Parameters:**

- `observerFunction` (`ObserverFunction`) — the exact function reference passed to `subscribeFunction()`

**Returns:** `void`

**Immutable pattern:** creates a new internal array via `filter`.

```typescript
subject.unsubscribeFunction(handler);
```

---

### `notifyFunctionObservers(...args)`

Calls every subscribed function observer with the provided arguments. Errors thrown by individual observers are caught and logged with `console.warn`; remaining observers are still called.

**Parameters:**

- `...args` (`unknown[]`) — forwarded verbatim to each function observer

**Returns:** `void`

```typescript
subject.notifyFunctionObservers(this, 'positionChanged', data);
// does NOT notify object observers
```

---

### `getObserverCount()`

Returns the number of currently subscribed object observers.

**Returns:** `number`

```typescript
console.log(subject.getObserverCount()); // 0
subject.subscribe({ update: () => {} });
console.log(subject.getObserverCount()); // 1
```

---

### `getFunctionObserverCount()`

Returns the number of currently subscribed function observers.

**Returns:** `number`

```typescript
console.log(subject.getFunctionObserverCount()); // 0
subject.subscribeFunction(() => {});
console.log(subject.getFunctionObserverCount()); // 1
```

---

### `clearAllObservers()`

Removes **all** observers from both collections.

**Returns:** `void`

```typescript
subject.clearAllObservers();
console.log(subject.getObserverCount());         // 0
console.log(subject.getFunctionObserverCount()); // 0
```

## Error Handling

Observer errors are caught per-callback and logged, preserving notification for remaining observers:

```typescript
// Object observer error isolation
subject.subscribe({ update: () => { throw new Error('boom'); } }); // caught, logged
subject.subscribe({ update: (src, evt) => doWork(evt) });          // still called

// Function observer error isolation
subject.subscribeFunction(() => { throw new Error('boom'); }); // caught, logged
subject.subscribeFunction((evt) => doWork(evt));               // still called
```

## Usage Examples

### GoF object-based pattern

```typescript
import DualObserverSubject from './src/DualObserverSubject';

const subject = new DualObserverSubject();

const locationLogger = {
  update(source: unknown, event: unknown, data: unknown) {
    console.log(`[${event}]`, data);
  }
};

subject.subscribe(locationLogger);
subject.notifyObservers(subject, 'positionChanged', { lat: -23.5, lon: -46.6 });
// logs: [positionChanged] { lat: -23.5, lon: -46.6 }

subject.unsubscribe(locationLogger);
```

### Function-based pattern

```typescript
const handler = (source: unknown, event: unknown, data: unknown) => {
  console.log('Event received:', event);
};

subject.subscribeFunction(handler);
subject.notifyFunctionObservers(subject, 'positionChanged', { lat: -23.5, lon: -46.6 });
// logs: Event received: positionChanged

subject.unsubscribeFunction(handler);
```

### Mixed — both patterns simultaneously

```typescript
const objObserver = { update: (src, evt) => console.log('obj:', evt) };
const fnObserver  = (src, evt) => console.log('fn:', evt);

subject.subscribe(objObserver);
subject.subscribeFunction(fnObserver);

subject.notifyObservers(subject, 'click');          // logs: obj: click  (fn not called)
subject.notifyFunctionObservers(subject, 'click');  // logs: fn: click   (obj not called)
```

## Design Notes

- **Immutable collections:** `subscribe` / `unsubscribe` / `subscribeFunction` / `unsubscribeFunction` all create new arrays; the internal state is never mutated in place, making the class safe to extend
- **Independent channels:** `notifyObservers` and `notifyFunctionObservers` are strictly separate — there is no cross-notification
- **No coupling:** Has no domain-specific dependencies; args are typed `unknown[]` for maximum flexibility
- **GoF compatible:** Object observers follow the classical GoF `update(...args)` convention, enabling interoperability with existing observer hierarchies

## Tests

Tests are located at `test/DualObserverSubject.test.ts` and cover:

- Constructor initialisation (both collections empty)
- `subscribe()` — add, ignore null/undefined, multiple observers, immutable array pattern, objects without `update`
- `unsubscribe()` — remove by reference, no-op on unregistered, immutable array pattern
- `notifyObservers()` — calls `update()` on all, skips observers without `update`, error isolation, does **not** notify function observers
- `subscribeFunction()` — add, ignore null/undefined, multiple functions, immutable array pattern
- `unsubscribeFunction()` — remove by reference, no-op on unregistered
- `notifyFunctionObservers()` — calls all functions, error isolation, does **not** notify object observers
- Mixed observer types — both collections operate independently
- `clearAllObservers()` — empties both collections; subsequent notifications are no-ops
