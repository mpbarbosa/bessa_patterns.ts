# bessa_patterns.ts

A zero-dependency TypeScript library of concrete, generic design pattern implementations. Each pattern is a directly-instantiable class or factory function, exported from a single public barrel (`src/index.ts`).

## Language

**Pattern**:
A concrete, generic TypeScript class or factory function that implements a named GoF design pattern. The unit of authorship, publication, and import in this library.
_Avoid_: module, utility, helper

**Subject**:
An object that manages a collection of observers and notifies them when an event or state change occurs. The publisher half of the Observer/Subject pair.
_Avoid_: observable, publisher, emitter, event bus

**Observer**:
Exclusively a GoF-style object with an optional `update()` method, subscribed via `DualObserverSubject.subscribe()` and notified via `notifyObservers()`. The word "observer" is reserved for this form only — plain function callbacks are never called observers in this library.
_Avoid_: listener, subscriber, watcher, handler

**Function observer**:
A plain callback function (`(...args) => void`) registered with a `DualObserverSubject` via `subscribeFunction()`. Managed in an independent collection from GoF observers; notified separately via `notifyFunctionObservers()`. Not an observer — the "observer" label belongs to the GoF object form only.
_Avoid_: observer, listener, handler, callback (reserve "callback" for the `CallbackRegistry` concept)

**Snapshot**:
The typed value (`T`) forwarded to every observer in an `ObserverSubject<T>` on notification. Captures the state at the moment of the notification call.
_Avoid_: event, payload, data, state

**Notification**:
The act of a Subject invoking all registered observers with the current arguments. Each observer is called within its own try/catch so one failure cannot block others.
_Avoid_: emit, dispatch, broadcast, trigger, fire

**Subscription**:
The zero-argument function returned by `ObserverSubject.subscribe()`. Calling it removes the observer from the Subject. Only `ObserverSubject` uses this return-value pattern; `DualObserverSubject` uses explicit `unsubscribe()` calls instead.
_Avoid_: handle, token, cancellation, unsubscribe function

**Mixin**:
The plain object returned by `withObserver()`, containing `subscribe`, `unsubscribe`, and optionally `notifyObservers` as delegation methods. Applied to a class prototype via `Object.assign(MyClass.prototype, withObserver())`.
_Avoid_: trait, extension, decorator (conflicts with the GoF Decorator pattern), plugin

**Host**:
A class that composes a `DualObserverSubject` as `this.observerSubject` and applies the `withObserver` mixin to gain observer methods without inheritance.
_Avoid_: consumer, owner, parent, wrapper

**Callback**:
A function registered in a `CallbackRegistry` under a string key. Executed by name via `execute()`; errors are caught per-invocation.
_Avoid_: handler, listener, observer (those belong to the Observer pattern, not the Registry pattern)

**Registry**:
A `CallbackRegistry` instance — a type-safe map of string keys to callback functions. Emphasises the execution contract (`execute`, `has`, `unregister`) over raw storage.
_Avoid_: store, map, dictionary
