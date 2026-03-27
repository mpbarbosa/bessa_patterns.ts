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
 * @since 0.12.15-alpha
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
class CallbackRegistry {
	callbacks: Map<string, ((...args: unknown[]) => void) | null>;

	/**
	 * Creates a new CallbackRegistry instance with an empty internal map.
	 */
	constructor() {
		this.callbacks = new Map();
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
	register(type: string, callback: ((...args: unknown[]) => void) | null): void {
		if (callback !== null && typeof callback !== 'function') {
			throw new TypeError(
				`Callback for type "${type}" must be a function or null. Received: ${typeof callback}`
			);
		}
		this.callbacks.set(type, callback);
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
	get(type: string): ((...args: unknown[]) => void) | null {
		return this.callbacks.get(type) ?? null;
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
	execute(type: string, ...args: unknown[]): boolean {
		const callback = this.callbacks.get(type);

		if (typeof callback === 'function') {
			try {
				callback(...args);
				return true;
			} catch (error: unknown) {
				console.error(`[CallbackRegistry] Error executing callback for type "${type}":`, error);
				return false;
			}
		}

		return false;
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
	has(type: string): boolean {
		return this.callbacks.has(type);
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
	unregister(type: string): boolean {
		return this.callbacks.delete(type);
	}

	/**
	 * Removes all keys from the registry.
	 *
	 * @example
	 * registry.clear();
	 * registry.isEmpty(); // true
	 */
	clear(): void {
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
	getRegisteredTypes(): string[] {
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
	size(): number {
		return this.callbacks.size;
	}

	/**
	 * Returns `true` when no callbacks are registered.
	 *
	 * @example
	 * new CallbackRegistry().isEmpty(); // true
	 */
	isEmpty(): boolean {
		return this.callbacks.size === 0;
	}
}

export default CallbackRegistry;
