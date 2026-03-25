class c {
  /**
   * Creates a new CallbackRegistry instance with an empty internal map.
   */
  constructor() {
    this.callbacks = /* @__PURE__ */ new Map();
  }
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
  register(e, r) {
    if (r !== null && typeof r != "function")
      throw new TypeError(
        `Callback for type "${e}" must be a function or null. Received: ${typeof r}`
      );
    this.callbacks.set(e, r);
  }
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
  get(e) {
    return this.callbacks.get(e) ?? null;
  }
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
  execute(e, ...r) {
    const s = this.callbacks.get(e);
    if (typeof s == "function")
      try {
        return s(...r), !0;
      } catch (n) {
        return console.error(`[CallbackRegistry] Error executing callback for type "${e}":`, n), !1;
      }
    return !1;
  }
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
  has(e) {
    return this.callbacks.has(e);
  }
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
  unregister(e) {
    return this.callbacks.delete(e);
  }
  /**
   * Removes all keys from the registry.
   *
   * @example
   * registry.clear();
   * registry.isEmpty(); // true
   */
  clear() {
    this.callbacks.clear();
  }
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
  getRegisteredTypes() {
    return Array.from(this.callbacks.keys());
  }
  /**
   * Returns the number of registered keys.
   *
   * @example
   * registry.size(); // 0
   * registry.register('x', fn);
   * registry.size(); // 1
   */
  size() {
    return this.callbacks.size;
  }
  /**
   * Returns `true` when no callbacks are registered.
   *
   * @example
   * new CallbackRegistry().isEmpty(); // true
   */
  isEmpty() {
    return this.callbacks.size === 0;
  }
}
class o {
  /**
   * Creates a new ObserverSubject instance with an empty observer list.
   *
   * @constructor
   */
  constructor() {
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
  subscribe(e) {
    if (typeof e != "function")
      throw new TypeError("ObserverSubject: callback must be a function");
    return this._observers.push(e), () => {
      const r = this._observers.indexOf(e);
      r > -1 && this._observers.splice(r, 1);
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
  unsubscribe(e) {
    const r = this._observers.indexOf(e);
    return r > -1 ? (this._observers.splice(r, 1), !0) : !1;
  }
  /**
   * Get number of active observers
   *
   * @returns {number} Number of subscribed observers
   */
  getObserverCount() {
    return this._observers.length;
  }
  /**
   * Remove all observers
   *
   * @example
   * subject.clearObservers();
   * console.log(subject.getObserverCount()); // 0
   */
  clearObservers() {
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
  _notifyObservers(e) {
    this._observers.forEach((r) => {
      try {
        r(e);
      } catch (s) {
        console.warn("ObserverSubject: Error notifying observer", s);
      }
    });
  }
}
class b {
  /** Read-only view of object observers subscribed via {@link subscribe}. */
  get observers() {
    return this._observers;
  }
  /** Read-only view of function observers subscribed via {@link subscribeFunction}. */
  get functionObservers() {
    return this._functionObservers;
  }
  /**
   * Creates a new DualObserverSubject with empty observer collections.
   */
  constructor() {
    this._observers = [], this._functionObservers = [];
  }
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
  subscribe(e) {
    e && (this._observers = [...this._observers, e]);
  }
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
  unsubscribe(e) {
    this._observers = this._observers.filter((r) => r !== e);
  }
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
  notifyObservers(...e) {
    this._observers.forEach((r) => {
      if (typeof r.update == "function")
        try {
          r.update(...e);
        } catch (s) {
          console.warn("DualObserverSubject: Error notifying observer", s);
        }
    });
  }
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
  subscribeFunction(e) {
    e && (this._functionObservers = [...this._functionObservers, e]);
  }
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
  unsubscribeFunction(e) {
    this._functionObservers = this._functionObservers.filter((r) => r !== e);
  }
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
  notifyFunctionObservers(...e) {
    this._functionObservers.forEach((r) => {
      if (typeof r == "function")
        try {
          r(...e);
        } catch (s) {
          console.warn("DualObserverSubject: Error notifying function observer", s);
        }
    });
  }
  /**
   * Returns the count of subscribed object observers.
   *
   * @returns {number} Number of object observers subscribed via {@link subscribe}
   */
  getObserverCount() {
    return this._observers.length;
  }
  /**
   * Returns the count of subscribed function observers.
   *
   * @returns {number} Number of function observers subscribed via {@link subscribeFunction}
   */
  getFunctionObserverCount() {
    return this._functionObservers.length;
  }
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
  clearAllObservers() {
    this._observers = [], this._functionObservers = [];
  }
}
function u(i = {}) {
  const { checkNull: e = !1, className: r = "Class", excludeNotify: s = !1 } = i, n = {
    /**
     * Subscribes an object observer to receive GoF-style notifications.
     *
     * @param {ObserverObject | null | undefined} observer - Observer with optional `update()` method
     * @returns {void}
     */
    subscribe(t) {
      if (e && t == null) {
        console.warn(`(${r}) Attempted to subscribe a null observer.`);
        return;
      }
      this.observerSubject.subscribe(t);
    },
    /**
     * Unsubscribes an object observer from receiving notifications.
     *
     * @param {ObserverObject} observer - Observer object to remove
     * @returns {void}
     */
    unsubscribe(t) {
      this.observerSubject.unsubscribe(t);
    }
  };
  return s || (n.notifyObservers = function(...t) {
    this.observerSubject.notifyObservers(...t);
  }), n;
}
export {
  c as CallbackRegistry,
  b as DualObserverSubject,
  o as ObserverSubject,
  u as withObserver
};
//# sourceMappingURL=index.mjs.map
