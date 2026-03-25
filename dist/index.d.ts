/**
 * CallbackRegistry — Type-safe registry for named callback functions.
 *
 * @fileoverview Provides a centralised registry for registering and executing
 * named callback functions. Callbacks are keyed by a string type identifier,
 * validated on registration, and executed with per-call error isolation so a
 * misbehaving callback cannot block others.
 *
 * **Design Principles:**
 * - **Single Responsibility:** Registration and safe execution only
 * - **Type-safe:** Callbacks must be functions or `null`; other values throw `TypeError`
 * - **Error isolation:** `execute()` catches and logs errors without re-throwing
 * - **Zero dependencies:** Pure TypeScript, no external imports
 *
 * @module CallbackRegistry
 * @since 0.12.9-alpha
 * @author Marcelo Pereira Barbosa
 *
 * @example
 * import CallbackRegistry from './CallbackRegistry.js';
 *
 * const registry = new CallbackRegistry();
 *
 * registry.register('onChange', (details) => {
 *   console.log('Changed:', details);
 * });
 *
 * registry.execute('onChange', { from: 'a', to: 'b' });
 *
 * @example
 * // Unregister by passing null
 * registry.register('onChange', null);
 *
 * @example
 * // Remove from registry entirely
 * registry.unregister('onChange');
 * registry.has('onChange'); // false
 */
export declare class CallbackRegistry {
    callbacks: Map<string, ((...args: unknown[]) => void) | null>;
    /**
     * Creates a new CallbackRegistry instance with an empty internal map.
     */
    constructor();
    /**
     * Registers a callback for a specific key.
     *
     * Passing `null` stores `null` against the key (the key remains present,
     * `has()` returns `true`, but `execute()` is a no-op). To remove the key
     * entirely, use `unregister()`.
     *
     * @param type - Callback key identifier
     * @param callback - Callback function to register, or `null` to clear it
     * @throws {TypeError} If `callback` is neither a function nor `null`
     *
     * @example
     * registry.register('logradouro', (details) => console.log(details));
     * registry.register('bairro', null); // clears without removing
     */
    register(type: string, callback: ((...args: unknown[]) => void) | null): void;
    /**
     * Returns the registered callback for a given key, or `null` if absent.
     *
     * @param type - Callback key identifier
     * @returns The registered callback function, or `null`
     *
     * @example
     * const cb = registry.get('logradouro');
     * if (cb) cb(details);
     */
    get(type: string): ((...args: unknown[]) => void) | null;
    /**
     * Executes the callback registered under `type` with the provided arguments.
     *
     * Any error thrown by the callback is caught and logged to `console.error`;
     * the method returns `false` in that case so callers can detect failures
     * without crashing.
     *
     * @param type - Callback key identifier
     * @param args - Arguments forwarded to the callback
     * @returns `true` if the callback ran successfully, `false` otherwise
     *
     * @example
     * registry.execute('bairro', { from: 'Centro', to: 'Boa Vista' });
     */
    execute(type: string, ...args: unknown[]): boolean;
    /**
     * Returns `true` if a key is present in the registry (even if its value is `null`).
     *
     * @param type - Callback key identifier
     *
     * @example
     * registry.register('x', myFn);
     * registry.has('x'); // true
     * registry.has('y'); // false
     */
    has(type: string): boolean;
    /**
     * Removes a key from the registry entirely.
     *
     * @param type - Callback key identifier
     * @returns `true` if the key existed and was removed, `false` otherwise
     *
     * @example
     * registry.unregister('logradouro');
     * registry.has('logradouro'); // false
     */
    unregister(type: string): boolean;
    /**
     * Removes all keys from the registry.
     *
     * @example
     * registry.clear();
     * registry.isEmpty(); // true
     */
    clear(): void;
    /**
     * Returns an array of all registered key identifiers (including those set to `null`).
     *
     * @returns Array of key strings
     *
     * @example
     * registry.register('a', fn);
     * registry.register('b', fn);
     * registry.getRegisteredTypes(); // ['a', 'b']
     */
    getRegisteredTypes(): string[];
    /**
     * Returns the number of registered keys.
     *
     * @example
     * registry.size(); // 0
     * registry.register('x', fn);
     * registry.size(); // 1
     */
    size(): number;
    /**
     * Returns `true` when no callbacks are registered.
     *
     * @example
     * new CallbackRegistry().isEmpty(); // true
     */
    isEmpty(): boolean;
}

/**
 * DualObserverSubject — Subject managing two independent observer collections.
 *
 * @class
 * @template T - Tuple of argument types forwarded to observer callbacks (defaults to `unknown[]`)
 *
 * @example
 * // Typed usage: all notifications are [source: object, event: string]
 * const bus = new DualObserverSubject<[source: object, event: string]>();
 * bus.subscribe({ update(src, evt) { console.log(evt); } });
 * bus.notifyObservers(this, 'click');
 *
 * @example
 * // Untyped usage (backwards-compatible default)
 * const subject = new DualObserverSubject();
 * subject.subscribe({ update: (...args) => console.log(args) });
 */
export declare class DualObserverSubject<T extends unknown[] = unknown[]> {
    private _observers;
    private _functionObservers;
    /** Read-only view of object observers subscribed via {@link subscribe}. */
    get observers(): ReadonlyArray<ObserverObject<T>>;
    /** Read-only view of function observers subscribed via {@link subscribeFunction}. */
    get functionObservers(): ReadonlyArray<ObserverFunction<T>>;
    /**
     * Creates a new DualObserverSubject with empty observer collections.
     */
    constructor();
    /**
     * Subscribes an object observer to receive notifications via its `update()` method.
     *
     * **Immutable Pattern:** Creates a new array using spread operator instead of
     * mutating the existing observers array.
     *
     * @param {ObserverObject | null | undefined} observer - Observer object (may have `update` method)
     * @returns {void}
     *
     * @example
     * const observer = { update: (source, event) => console.log(event) };
     * subject.subscribe(observer);
     */
    subscribe(observer: ObserverObject<T> | null | undefined): void;
    /**
     * Unsubscribes an object observer from notifications.
     *
     * **Immutable Pattern:** Uses filter to create a new array without the observer.
     *
     * @param {ObserverObject} observer - Observer object to remove
     * @returns {void}
     *
     * @example
     * subject.unsubscribe(myObserver);
     */
    unsubscribe(observer: ObserverObject<T>): void;
    /**
     * Notifies all subscribed object observers.
     * Calls `observer.update(...args)` on each observer that implements `update`.
     * Errors thrown by individual observers are caught so others still receive notifications.
     *
     * @param {...unknown} args - Arguments forwarded to each observer's `update()` method
     * @returns {void}
     *
     * @example
     * subject.notifyObservers(this, 'positionChanged', position, null);
     */
    notifyObservers(...args: T): void;
    /**
     * Subscribes a function observer to receive notifications via `notifyFunctionObservers`.
     *
     * **Immutable Pattern:** Creates a new array using spread operator.
     *
     * @param {ObserverFunction | null | undefined} observerFunction - Callback function
     * @returns {void}
     *
     * @example
     * const handler = (source, event, data) => console.log(event);
     * subject.subscribeFunction(handler);
     */
    subscribeFunction(observerFunction: ObserverFunction<T> | null | undefined): void;
    /**
     * Unsubscribes a function observer from notifications.
     *
     * **Immutable Pattern:** Uses filter to create a new array without the function.
     *
     * @param {ObserverFunction} observerFunction - Function to remove
     * @returns {void}
     *
     * @example
     * subject.unsubscribeFunction(handler);
     */
    unsubscribeFunction(observerFunction: ObserverFunction<T>): void;
    /**
     * Notifies all subscribed function observers.
     * Errors thrown by individual observers are caught so others still receive notifications.
     *
     * @param {...unknown} args - Arguments forwarded to each observer function
     * @returns {void}
     *
     * @example
     * subject.notifyFunctionObservers(this, 'positionChanged', data);
     */
    notifyFunctionObservers(...args: T): void;
    /**
     * Returns the count of subscribed object observers.
     *
     * @returns {number} Number of object observers subscribed via {@link subscribe}
     */
    getObserverCount(): number;
    /**
     * Returns the count of subscribed function observers.
     *
     * @returns {number} Number of function observers subscribed via {@link subscribeFunction}
     */
    getFunctionObserverCount(): number;
    /**
     * Removes all observers (both object and function collections).
     *
     * @returns {void}
     *
     * @example
     * subject.clearAllObservers();
     * console.log(subject.getObserverCount());         // 0
     * console.log(subject.getFunctionObserverCount()); // 0
     */
    clearAllObservers(): void;
}

/**
 * A function-based observer callback.
 * @template T - Tuple of argument types for observer notifications (defaults to `unknown[]`)
 */
export declare type ObserverFunction<T extends unknown[] = unknown[]> = (...args: T) => void;

/**
 * Minimum shape a host object must have to use the mixin methods.
 *
 * @template T - Tuple of argument types forwarded on notification
 */
declare interface ObserverHost<T extends unknown[] = unknown[]> {
    observerSubject: SubjectDelegate<T>;
}

/**
 * Configuration options for {@link withObserver}.
 */
export declare interface ObserverMixinOptions {
    /**
     * When `true`, a `console.warn` is emitted and the call is aborted if the
     * observer argument is `null` or `undefined`. Default: `false`.
     */
    checkNull?: boolean;
    /**
     * Class name included in warning messages when `checkNull` is `true`.
     * Default: `'Class'`.
     */
    className?: string;
    /**
     * When `true`, the `notifyObservers` method is **not** added to the returned
     * mixin. Use this when the host class provides its own custom notification
     * logic. Default: `false`.
     */
    excludeNotify?: boolean;
}

/**
 * Shape of the object returned by {@link withObserver}.
 *
 * @template T - Tuple of argument types forwarded on notification
 */
export declare type ObserverMixinResult<T extends unknown[] = unknown[]> = {
    subscribe(this: ObserverHost<T>, observer: ObserverObject<T> | null | undefined): void;
    unsubscribe(this: ObserverHost<T>, observer: ObserverObject<T>): void;
    notifyObservers?(this: ObserverHost<T>, ...args: T): void;
};

/**
 * DualObserverSubject - GoF Observer pattern implementation supporting both
 * object-based observers (with update methods) and function-based observers.
 *
 * @fileoverview Provides a reusable Subject that maintains two independent observer
 * collections: object observers (GoF pattern, notified via notifyObservers) and
 * function observers (modern callback pattern, notified via notifyFunctionObservers).
 *
 * **Design Principles:**
 * - **Dual Observer Collections:** Object and function observers are managed independently
 * - **Immutability:** subscribe/unsubscribe create new arrays (spread + filter); no in-place mutation
 * - **Error Isolation:** Errors in individual observers are caught so others still receive notifications
 * - **Null Safety:** Null/undefined subscriptions are silently ignored
 *
 * **Observer Types:**
 * - Object observers: `{ update(...args): void }` — subscribed via `subscribe()`, notified via `notifyObservers()`
 * - Function observers: `(...args) => void` — subscribed via `subscribeFunction()`, notified via `notifyFunctionObservers()`
 *
 * @module core/DualObserverSubject
 * @since 0.10.0-alpha
 * @author Marcelo Pereira Barbosa
 * @reviewed 2026-03-18
 *
 * @example
 * // Object-based (GoF) pattern
 * const subject = new DualObserverSubject();
 *
 * const myObserver = {
 *   update(source, event, data) {
 *     console.log('Notified:', event, data);
 *   }
 * };
 *
 * subject.subscribe(myObserver);
 * subject.notifyObservers(this, 'positionChanged', { lat: -23.5, lon: -46.6 });
 * subject.unsubscribe(myObserver);
 *
 * @example
 * // Function-based pattern
 * const subject = new DualObserverSubject();
 *
 * const handler = (source, event, data) => {
 *   console.log('Function notified:', event);
 * };
 *
 * subject.subscribeFunction(handler);
 * subject.notifyFunctionObservers(this, 'positionChanged', data);
 * subject.unsubscribeFunction(handler);
 *
 * @example
 * // Mixed usage — both patterns are independent
 * const subject = new DualObserverSubject();
 * subject.subscribe({ update: (src, evt) => console.log(evt) });
 * subject.subscribeFunction((src, evt) => console.log(evt));
 *
 * subject.notifyObservers(this, 'event');    // notifies ONLY object observers
 * subject.notifyFunctionObservers(this, 'event'); // notifies ONLY function observers
 */
/**
 * An observer object that may implement an `update` method.
 * @template T - Tuple of argument types for observer notifications (defaults to `unknown[]`)
 */
export declare type ObserverObject<T extends unknown[] = unknown[]> = {
    update?: (...args: T) => void;
};

/**
 * ObserverSubject - Generic concrete implementation of the Observer/Subject pattern
 *
 * @fileoverview Provides a reusable subject that manages a list of observer callbacks
 * and notifies them with a typed snapshot whenever state changes.
 *
 * **Design Principles:**
 * - **Single Responsibility:** Observer management only
 * - **Generic:** Type parameter `T` defines the snapshot shape passed to observers
 * - **Concrete:** Can be instantiated directly or extended by specialised subclasses
 *
 * @module core/ObserverSubject
 * @since 0.9.1-alpha
 * @author Marcelo Pereira Barbosa
 *
 * @example
 * // Direct usage
 * import ObserverSubject from './core/ObserverSubject.js';
 *
 * const subject = new ObserverSubject<{ value: number }>();
 *
 * const unsubscribe = subject.subscribe((snapshot) => {
 *   console.log('Value changed:', snapshot.value);
 * });
 *
 * subject._notifyObservers({ value: 42 });
 * unsubscribe();
 *
 * @example
 * // Subclass usage
 * class MyState extends ObserverSubject<{ count: number }> {
 *   private _count = 0;
 *   increment() {
 *     this._count++;
 *     this._notifyObservers({ count: this._count });
 *   }
 * }
 */
/**
 * ObserverSubject<T> - Manages a list of observer callbacks and notifies them with a typed snapshot.
 *
 * @class
 * @template T - The type of the snapshot object passed to observers on notification
 */
export declare class ObserverSubject<T> {
    private _observers;
    /**
     * Creates a new ObserverSubject instance with an empty observer list.
     *
     * @constructor
     */
    constructor();
    /**
     * Subscribe to notifications
     *
     * @param {Function} callback - Called on each notification: (snapshot: T) => void
     * @returns {Function} Unsubscribe function — call it to remove this observer
     * @throws {TypeError} If callback is not a function
     *
     * @example
     * const unsubscribe = subject.subscribe((snapshot) => {
     *   console.log(snapshot);
     * });
     * // Later:
     * unsubscribe();
     */
    subscribe(callback: (snapshot: T) => void): () => void;
    /**
     * Unsubscribe an observer by reference
     *
     * @param {Function} callback - The callback to remove
     * @returns {boolean} True if the callback was found and removed
     *
     * @example
     * const handler = (s) => console.log(s);
     * subject.subscribe(handler);
     * subject.unsubscribe(handler); // true
     */
    unsubscribe(callback: (snapshot: T) => void): boolean;
    /**
     * Get number of active observers
     *
     * @returns {number} Number of subscribed observers
     */
    getObserverCount(): number;
    /**
     * Remove all observers
     *
     * @example
     * subject.clearObservers();
     * console.log(subject.getObserverCount()); // 0
     */
    clearObservers(): void;
    /**
     * Notify all observers with the given snapshot
     *
     * Errors thrown by individual observer callbacks are caught and logged so
     * that a misbehaving observer cannot prevent the others from being called.
     *
     * @param {T} snapshot - Value forwarded to every observer callback
     *
     * @example
     * subject._notifyObservers({ value: 42 });
     */
    protected _notifyObservers(snapshot: T): void;
}

/**
 * Minimal interface the host's `observerSubject` property must satisfy.
 * Fulfilled by {@link DualObserverSubject} (GoF channel).
 *
 * @template T - Tuple of argument types forwarded on notification
 */
declare interface SubjectDelegate<T extends unknown[] = unknown[]> {
    subscribe(observer: ObserverObject<T> | null | undefined): void;
    unsubscribe(observer: ObserverObject<T>): void;
    notifyObservers(...args: T): void;
}

/**
 * Creates an observer mixin with standard delegation methods.
 *
 * Returns an object whose methods delegate `subscribe`, `unsubscribe`, and
 * (unless excluded) `notifyObservers` to `this.observerSubject`. Assign it to
 * a class prototype to add observer capabilities without inheritance.
 *
 * The host class **must** have an `observerSubject` property that is a
 * {@link DualObserverSubject} instance (or any object matching
 * {@link SubjectDelegate}).
 *
 * @template T - Tuple of argument types forwarded to observer callbacks
 * @param {ObserverMixinOptions} [options={}] - Configuration options
 * @returns {ObserverMixinResult<T>} Object with observer delegation methods
 *
 * @example
 * // Basic usage
 * Object.assign(MyClass.prototype, withObserver());
 *
 * @example
 * // With null checking
 * Object.assign(MyClass.prototype, withObserver({
 *     checkNull: true,
 *     className: 'MyClass'
 * }));
 */
export declare function withObserver<T extends unknown[] = unknown[]>(options?: ObserverMixinOptions): ObserverMixinResult<T>;

export { }
