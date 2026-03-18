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
  b as DualObserverSubject,
  o as ObserverSubject,
  u as withObserver
};
//# sourceMappingURL=index.mjs.map
