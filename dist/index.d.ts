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

export { }
