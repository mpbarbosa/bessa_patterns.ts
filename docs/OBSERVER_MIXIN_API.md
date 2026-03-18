# ObserverMixin API Documentation

**Version:** 0.12.3-alpha
**Module:** `src/ObserverMixin.ts`
**Pattern:** Observer Mixin (Delegation Helper)
**Author:** Marcelo Pereira Barbosa

## Overview

`withObserver` is a factory function that returns a mixin object containing standard GoF observer
delegation methods. Assign it to any class prototype that holds a `observerSubject` property
(a `DualObserverSubject` instance) to eliminate repetitive `subscribe`, `unsubscribe`, and
`notifyObservers` boilerplate.

```typescript
import { withObserver } from 'bessa_patterns.ts';
import { DualObserverSubject } from 'bessa_patterns.ts';

class EventBus {
    observerSubject = new DualObserverSubject();
}

Object.assign(EventBus.prototype, withObserver());
```

## Purpose and Responsibility

- **Boilerplate reduction:** Eliminates 10–15 lines of delegation code per class
- **Consistent interface:** All mixin-enhanced classes expose the same observer API
- **Optional null safety:** `checkNull` option guards `subscribe` against null/undefined
- **Composable:** Works alongside hand-written methods; `excludeNotify` lets the host
  override notification logic

## Location in Codebase

```text
src/ObserverMixin.ts
test/ObserverMixin.test.ts
```

## Requirement

The host class **must** expose a public `observerSubject` property that satisfies the
`SubjectDelegate` interface (fulfilled by `DualObserverSubject`):

```typescript
interface SubjectDelegate<T extends unknown[] = unknown[]> {
  subscribe(observer: ObserverObject<T> | null | undefined): void;
  unsubscribe(observer: ObserverObject<T>): void;
  notifyObservers(...args: T): void;
}
```

## Exported Symbols

| Symbol | Kind | Description |
| --- | --- | --- |
| `withObserver` | function (named + default) | Factory that creates the mixin object |
| `ObserverMixinOptions` | interface | Configuration accepted by `withObserver` |
| `ObserverMixinResult` | type alias | Shape of the returned mixin |

---

## `withObserver(options?)`

**Signature:**

```typescript
function withObserver<T extends unknown[] = unknown[]>(
    options?: ObserverMixinOptions
): ObserverMixinResult<T>
```

**Parameters:**

| Parameter | Type | Description |
| --- | --- | --- |
| `options` | `ObserverMixinOptions` (optional) | Configuration — see table below |

**Returns:** `ObserverMixinResult<T>` — an object with `subscribe`, `unsubscribe`, and
(unless `excludeNotify` is set) `notifyObservers` methods.

### `ObserverMixinOptions`

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `checkNull` | `boolean` | `false` | Emit `console.warn` and abort if the observer is `null`/`undefined` |
| `className` | `string` | `'Class'` | Class name used in the warning message when `checkNull` is `true` |
| `excludeNotify` | `boolean` | `false` | Omit `notifyObservers` (use when the host provides its own notification logic) |

---

## Mixin Methods

### `subscribe(observer)`

Delegates to `this.observerSubject.subscribe(observer)`.

If `checkNull` is `true`, a `console.warn` is emitted and the call is aborted when
`observer` is `null` or `undefined`.

**Parameters:**

- `observer` (`ObserverObject | null | undefined`) — observer with optional `update()` method

**Returns:** `void`

```typescript
const bus = new EventBus();
bus.subscribe({ update(event, data) { console.log(event, data); } });
```

---

### `unsubscribe(observer)`

Delegates to `this.observerSubject.unsubscribe(observer)`.

**Parameters:**

- `observer` (`ObserverObject`) — observer to remove by reference

**Returns:** `void`

```typescript
const handler = { update: (evt) => console.log(evt) };
bus.subscribe(handler);
bus.unsubscribe(handler);
```

---

### `notifyObservers(...args)` *(present unless `excludeNotify: true`)*

Delegates to `this.observerSubject.notifyObservers(...args)`, forwarding all arguments
to each subscribed observer's `update()` method.

**Parameters:**

- `...args` (`T`) — forwarded to each `observer.update(...args)` call

**Returns:** `void`

```typescript
bus.notifyObservers(bus, 'positionChanged', { lat: -23.5, lon: -46.6 });
```

---

## Usage Examples

### Basic usage — add all three methods

```typescript
import { withObserver } from 'bessa_patterns.ts';
import { DualObserverSubject } from 'bessa_patterns.ts';

class ReverseGeocoder {
    observerSubject = new DualObserverSubject();
    // ... geocoding logic
}

Object.assign(ReverseGeocoder.prototype, withObserver());

// Consumer code
const geocoder = new ReverseGeocoder();
geocoder.subscribe({ update(source, event, address) { console.log(address); } });
geocoder.notifyObservers(geocoder, 'addressFetched', { city: 'Recife' });
```

### With null checking — user-facing APIs

```typescript
class LocationManager {
    observerSubject = new DualObserverSubject();
}

Object.assign(LocationManager.prototype,
    withObserver({ checkNull: true, className: 'LocationManager' }));

const mgr = new LocationManager();
mgr.subscribe(null); // console.warn: (LocationManager) Attempted to subscribe a null observer.
```

### Exclude notification — custom notify logic

```typescript
class PositionManager {
    observerSubject = new DualObserverSubject();

    notifyObservers(event: string, position: GeoPosition) {
        console.log(`[PositionManager] ${event}`);
        this.observerSubject.notifyObservers(this, event, position);
    }
}

// subscribe / unsubscribe only — notifyObservers stays custom
Object.assign(PositionManager.prototype, withObserver({ excludeNotify: true }));
```

### TypeScript generic — typed notification arguments

```typescript
type PositionArgs = [source: PositionManager, event: string, position: GeoPosition];

Object.assign(PositionManager.prototype, withObserver<PositionArgs>());
```

## Design Notes

- **Prototype assignment pattern:** Works with plain ES classes without inheritance; the mixin
  is applied once at class definition time.
- **No shared state:** The returned mixin object contains only methods — all state lives in
  the host's `observerSubject` property, which is instantiated per object.
- **Delegates, not owns:** The mixin does not create or own the `DualObserverSubject`; the host
  class is responsible for initialising `this.observerSubject` before any mixin method is called.
- **Zero dependencies:** `ObserverMixin.ts` only imports from within `bessa_patterns.ts`.

## Tests

Tests are located at `test/ObserverMixin.test.ts` and cover:

- Mixin shape (`subscribe`, `unsubscribe`, `notifyObservers` presence)
- `excludeNotify` omits `notifyObservers`
- Subscribe / notify / unsubscribe round-trip
- Multiple observers notified independently
- Unsubscribing one observer does not affect others
- `checkNull=true` warns on `null` and `undefined` observer
- `checkNull=true` uses custom `className` in warning
- `checkNull=false` (default) delegates silently
- Default export equals named export
