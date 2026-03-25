# CallbackRegistry API Documentation

**Version:** 0.12.9-alpha
**Module:** `src/CallbackRegistry.ts`
**Pattern:** Registry
**Author:** Marcelo Pereira Barbosa

## Overview

`CallbackRegistry` is a concrete class that manages a map of named callback functions. It
provides type-safe registration, null-safe retrieval, and error-isolated execution. A single
registry instance can manage callbacks for any number of named events or change types.

## Purpose and Responsibility

- **Registration:** `register` / `unregister` with string-key semantics
- **Safe execution:** `execute` catches errors inside callbacks so one failure cannot block others
- **Type safety:** Non-function, non-null values throw `TypeError` at registration time
- **Zero dependencies:** No imports, no DOM coupling

## Class Diagram

```
┌──────────────────────────────────────────┐
│           CallbackRegistry               │
├──────────────────────────────────────────┤
│ - callbacks: Map<string, Function|null>  │
├──────────────────────────────────────────┤
│ + register(type, fn|null): void          │
│ + get(type): fn|null                     │
│ + execute(type, ...args): boolean        │
│ + has(type): boolean                     │
│ + unregister(type): boolean              │
│ + clear(): void                          │
│ + getRegisteredTypes(): string[]         │
│ + size(): number                         │
│ + isEmpty(): boolean                     │
└──────────────────────────────────────────┘
```

## Constructor

### `new CallbackRegistry()`

Creates an instance with an empty internal `Map`. No arguments required.

```typescript
const registry = new CallbackRegistry();
registry.isEmpty(); // true
```

## Methods

### `register(type, callback)`

Registers a callback under the given key.

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | `string` | Key identifier |
| `callback` | `((...args: unknown[]) => void) \| null` | Function to register, or `null` to clear without removing the key |

- Throws `TypeError` if `callback` is neither a function nor `null`.
- Passing `null` keeps the key present (`has()` returns `true`) but `execute()` becomes a no-op.
- Calling `register` again with the same key overwrites the previous value.

```typescript
registry.register('onChange', (detail) => console.log(detail));
registry.register('onChange', null);  // clears but keeps key
```

---

### `get(type)`

Returns the callback registered under `type`, or `null` if absent or set to `null`.

```typescript
const cb = registry.get('onChange');
if (cb) cb({ value: 1 });
```

---

### `execute(type, ...args)`

Calls the callback for `type` with the provided arguments. Catches any error the callback
throws, logs it to `console.error`, and returns `false`.

| Return value | Condition |
|---|---|
| `true` | Callback exists, is a function, and ran without throwing |
| `false` | No callback, value is `null`, or callback threw an error |

```typescript
registry.execute('onChange', { from: 'a', to: 'b' }); // true
registry.execute('nonexistent');                        // false
```

---

### `has(type)`

Returns `true` if the key is present in the registry, even if its value is `null`.

```typescript
registry.register('x', myFn);
registry.has('x'); // true
registry.register('y', null);
registry.has('y'); // true  ← key present, value is null
registry.has('z'); // false ← key absent
```

---

### `unregister(type)`

Removes the key from the registry entirely. Returns `true` if the key existed.

```typescript
registry.unregister('x'); // true
registry.has('x');        // false
```

---

### `clear()`

Removes all keys. Equivalent to calling `unregister` on every key.

```typescript
registry.clear();
registry.isEmpty(); // true
```

---

### `getRegisteredTypes()`

Returns an array of all currently registered key identifiers (including keys with `null` values).

```typescript
registry.register('a', fn);
registry.register('b', fn);
registry.getRegisteredTypes(); // ['a', 'b']
```

---

### `size()`

Returns the number of registered keys.

```typescript
registry.size(); // 0
registry.register('a', fn);
registry.size(); // 1
```

---

### `isEmpty()`

Returns `true` when the registry has no keys.

```typescript
new CallbackRegistry().isEmpty(); // true
```

## Design Principles

| Principle | How it is applied |
|---|---|
| **Error isolation** | `execute()` wraps the callback in `try/catch`; errors are logged, not re-thrown |
| **Type safety** | `register()` validates the callback type at call time and throws `TypeError` on violation |
| **Null safety** | `null` is an explicitly supported value; `get()` always returns `Function \| null` |
| **Zero dependencies** | No imports; usable in any TypeScript/JavaScript environment |

## Usage Example

```typescript
import { CallbackRegistry } from 'bessa_patterns.ts';

const registry = new CallbackRegistry();

registry.register('addressChange', ({ from, to }) => {
  console.log(`Address changed from "${from}" to "${to}"`);
});

registry.register('error', (err) => {
  reportError(err);
});

// Later, trigger callbacks safely
registry.execute('addressChange', { from: 'Rua A', to: 'Rua B' }); // true
registry.execute('error', new Error('network timeout'));             // true

// Check before executing
if (registry.has('addressChange')) {
  registry.execute('addressChange', snapshot);
}

// Cleanup
registry.unregister('addressChange');
registry.clear();
```
