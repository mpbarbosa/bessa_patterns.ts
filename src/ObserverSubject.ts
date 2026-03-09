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
class ObserverSubject<T> {
    private _observers: ((snapshot: T) => void)[];

    /**
     * Creates a new ObserverSubject instance with an empty observer list.
     *
     * @constructor
     */
    constructor() {
        /**
         * Registered observer callbacks
         * @type {Function[]}
         * @private
         */
        this._observers = [];
    }

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
    subscribe(callback: (snapshot: T) => void): () => void {
        if (typeof callback !== 'function') {
            throw new TypeError('ObserverSubject: callback must be a function');
        }
        this._observers.push(callback);

        return () => {
            const index = this._observers.indexOf(callback);
            if (index > -1) {
                this._observers.splice(index, 1);
            }
        };
    }

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
    unsubscribe(callback: (snapshot: T) => void): boolean {
        const index = this._observers.indexOf(callback);
        if (index > -1) {
            this._observers.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * Get number of active observers
     *
     * @returns {number} Number of subscribed observers
     */
    getObserverCount(): number {
        return this._observers.length;
    }

    /**
     * Remove all observers
     *
     * @example
     * subject.clearObservers();
     * console.log(subject.getObserverCount()); // 0
     */
    clearObservers(): void {
        this._observers = [];
    }

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
    _notifyObservers(snapshot: T): void {
        this._observers.forEach(callback => {
            try {
                callback(snapshot);
            } catch (error) {
                console.warn('ObserverSubject: Error notifying observer', error);
            }
        });
    }
}

export default ObserverSubject;
