/**
 * ObserverMixin — delegation helper for classes that compose a DualObserverSubject.
 *
 * @fileoverview This mixin eliminates boilerplate by providing standard GoF observer
 * delegation methods. Apply it to any class that holds a `observerSubject` property
 * (a {@link DualObserverSubject} instance) to gain `subscribe`, `unsubscribe`, and
 * optionally `notifyObservers` without repeating the delegation code.
 *
 * **Benefits**:
 * - Eliminates 10–15 lines of boilerplate per class
 * - Consistent observer interface across all classes
 * - Optional null checking with descriptive warnings
 * - Backward compatible with existing host classes
 *
 * **Usage Patterns**:
 *
 * 1. **Simple delegation** (most common):
 * ```typescript
 * import { withObserver } from './ObserverMixin';
 * import DualObserverSubject from './DualObserverSubject';
 *
 * class MyService {
 *     observerSubject = new DualObserverSubject();
 * }
 *
 * Object.assign(MyService.prototype, withObserver());
 * ```
 *
 * 2. **With null checking** (for critical / user-facing APIs):
 * ```typescript
 * Object.assign(MyService.prototype,
 *     withObserver({ checkNull: true, className: 'MyService' }));
 * ```
 *
 * 3. **With custom notification logic** (exclude the generated notifyObservers):
 * ```typescript
 * class MyService {
 *     observerSubject = new DualObserverSubject();
 *
 *     notifyObservers(event: string, data: unknown) {
 *         console.log(`Notifying: ${event}`);
 *         this.observerSubject.notifyObservers(this, event, data);
 *     }
 * }
 *
 * // Add subscribe / unsubscribe only
 * Object.assign(MyService.prototype, withObserver({ excludeNotify: true }));
 * ```
 *
 * @module ObserverMixin
 * @since 0.12.3-alpha
 * @author Marcelo Pereira Barbosa
 *
 * @example
 * // Standard usage
 * import { withObserver } from 'bessa_patterns.ts';
 * import DualObserverSubject from 'bessa_patterns.ts';
 *
 * class EventBus {
 *     observerSubject = new DualObserverSubject();
 * }
 * Object.assign(EventBus.prototype, withObserver());
 *
 * @example
 * // With null checking
 * class LocationManager {
 *     observerSubject = new DualObserverSubject();
 * }
 * Object.assign(LocationManager.prototype,
 *     withObserver({ checkNull: true, className: 'LocationManager' }));
 */

import { type ObserverObject } from './DualObserverSubject';

// ─── Interfaces ───────────────────────────────────────────────────────────────

/**
 * Minimal interface the host's `observerSubject` property must satisfy.
 * Fulfilled by {@link DualObserverSubject} (GoF channel).
 *
 * @template T - Tuple of argument types forwarded on notification
 */
interface SubjectDelegate<T extends unknown[] = unknown[]> {
  subscribe(observer: ObserverObject<T> | null | undefined): void;
  unsubscribe(observer: ObserverObject<T>): void;
  notifyObservers(...args: T): void;
}

/**
 * Minimum shape a host object must have to use the mixin methods.
 *
 * @template T - Tuple of argument types forwarded on notification
 */
interface ObserverHost<T extends unknown[] = unknown[]> {
  observerSubject: SubjectDelegate<T>;
}

/**
 * Configuration options for {@link withObserver}.
 */
export interface ObserverMixinOptions {
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
export type ObserverMixinResult<T extends unknown[] = unknown[]> = {
  subscribe(this: ObserverHost<T>, observer: ObserverObject<T> | null | undefined): void;
  unsubscribe(this: ObserverHost<T>, observer: ObserverObject<T>): void;
  notifyObservers?(this: ObserverHost<T>, ...args: T): void;
};

// ─── Implementation ───────────────────────────────────────────────────────────

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
export function withObserver<T extends unknown[] = unknown[]>(
  options: ObserverMixinOptions = {},
): ObserverMixinResult<T> {
  const { checkNull = false, className = 'Class', excludeNotify = false } = options;

  const mixin: ObserverMixinResult<T> = {
    /**
     * Subscribes an object observer to receive GoF-style notifications.
     *
     * @param {ObserverObject | null | undefined} observer - Observer with optional `update()` method
     * @returns {void}
     */
    subscribe(
      this: ObserverHost<T>,
      observer: ObserverObject<T> | null | undefined,
    ): void {
      if (checkNull && observer == null) {
        console.warn(`(${className}) Attempted to subscribe a null observer.`);
        return;
      }
      this.observerSubject.subscribe(observer);
    },

    /**
     * Unsubscribes an object observer from receiving notifications.
     *
     * @param {ObserverObject} observer - Observer object to remove
     * @returns {void}
     */
    unsubscribe(this: ObserverHost<T>, observer: ObserverObject<T>): void {
      this.observerSubject.unsubscribe(observer);
    },
  };

  if (!excludeNotify) {
    /**
     * Notifies all subscribed object observers with the provided arguments.
     *
     * @param {...T} args - Arguments forwarded to each observer's `update()` method
     * @returns {void}
     */
    mixin.notifyObservers = function (this: ObserverHost<T>, ...args: T): void {
      this.observerSubject.notifyObservers(...args);
    };
  }

  return mixin;
}

/**
 * Default export for convenience.
 */
export default withObserver;
