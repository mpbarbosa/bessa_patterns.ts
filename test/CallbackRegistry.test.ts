// test/CallbackRegistry.test.ts

import CallbackRegistry from '../src/CallbackRegistry';
import { CallbackRegistry as CallbackRegistryNamed } from '../src/index';

describe('CallbackRegistry', () => {
	let registry: CallbackRegistry;

	beforeEach(() => {
		registry = new CallbackRegistry();
	});

	// ── smoke test: exported from the public barrel ─────────────────────────
	describe('public entry point', () => {
		it('should be exported from src/index', () => {
			expect(CallbackRegistryNamed).toBe(CallbackRegistry);
		});

		it('should be instantiable via the barrel export', () => {
			const r = new CallbackRegistryNamed();
			expect(r).toBeInstanceOf(CallbackRegistry);
		});
	});

	// ── constructor ──────────────────────────────────────────────────────────
	describe('constructor', () => {
		it('should create an empty registry', () => {
			expect(registry.isEmpty()).toBe(true);
			expect(registry.size()).toBe(0);
		});
	});

	// ── register / get ───────────────────────────────────────────────────────
	describe('register and get', () => {
		it('should register and retrieve a callback', () => {
			const callback = (): void => {};
			registry.register('logradouro', callback);
			expect(registry.get('logradouro')).toBe(callback);
		});

		it('should accept null as a callback value', () => {
			registry.register('bairro', null);
			expect(registry.get('bairro')).toBeNull();
		});

		it('should throw TypeError when given a non-function non-null value', () => {
			expect(() => registry.register('test', 'invalid' as unknown as null)).toThrow(TypeError);
			expect(() => registry.register('test', 42 as unknown as null)).toThrow(TypeError);
		});

		it('should overwrite a previously registered callback', () => {
			const fn1 = (): void => {};
			const fn2 = (): void => {};
			registry.register('x', fn1);
			registry.register('x', fn2);
			expect(registry.get('x')).toBe(fn2);
		});

		it('should return null for an unregistered key', () => {
			expect(registry.get('nonexistent')).toBeNull();
		});
	});

	// ── execute ──────────────────────────────────────────────────────────────
	describe('execute', () => {
		it('should invoke the callback with the provided arguments', () => {
			let receivedArgs: unknown[] = [];
			registry.register('logradouro', (...args: unknown[]) => {
				receivedArgs = args;
			});
			registry.execute('logradouro', 'arg1', 'arg2');
			expect(receivedArgs).toEqual(['arg1', 'arg2']);
		});

		it('should return true when the callback executes successfully', () => {
			registry.register('bairro', () => {});
			expect(registry.execute('bairro')).toBe(true);
		});

		it('should return false when no callback is registered', () => {
			expect(registry.execute('nonexistent')).toBe(false);
		});

		it('should return false when the callback is null', () => {
			registry.register('bairro', null);
			expect(registry.execute('bairro')).toBe(false);
		});

		it('should catch callback errors and return false', () => {
			const originalError = console.error;
			let errorCalled = false;
			console.error = (): void => { errorCalled = true; };

			registry.register('test', () => { throw new Error('boom'); });
			const result = registry.execute('test');

			console.error = originalError;
			expect(result).toBe(false);
			expect(errorCalled).toBe(true);
		});
	});

	// ── has / unregister ─────────────────────────────────────────────────────
	describe('has and unregister', () => {
		it('should return true for a registered key', () => {
			registry.register('logradouro', () => {});
			expect(registry.has('logradouro')).toBe(true);
		});

		it('should return false for an absent key', () => {
			expect(registry.has('nonexistent')).toBe(false);
		});

		it('should return true even when the registered value is null', () => {
			registry.register('bairro', null);
			expect(registry.has('bairro')).toBe(true);
		});

		it('should unregister a key and return true', () => {
			registry.register('bairro', () => {});
			expect(registry.unregister('bairro')).toBe(true);
			expect(registry.has('bairro')).toBe(false);
		});

		it('should return false when unregistering a non-existent key', () => {
			expect(registry.unregister('nonexistent')).toBe(false);
		});
	});

	// ── utility methods ──────────────────────────────────────────────────────
	describe('clear', () => {
		it('should remove all registered callbacks', () => {
			registry.register('a', () => {});
			registry.register('b', () => {});
			registry.clear();
			expect(registry.isEmpty()).toBe(true);
			expect(registry.size()).toBe(0);
		});
	});

	describe('getRegisteredTypes', () => {
		it('should return all registered key identifiers', () => {
			registry.register('logradouro', () => {});
			registry.register('bairro', () => {});
			const types = registry.getRegisteredTypes();
			expect(types).toContain('logradouro');
			expect(types).toContain('bairro');
			expect(types).toHaveLength(2);
		});

		it('should return an empty array when no callbacks are registered', () => {
			expect(registry.getRegisteredTypes()).toEqual([]);
		});
	});

	describe('size', () => {
		it('should return 0 for an empty registry', () => {
			expect(registry.size()).toBe(0);
		});

		it('should reflect the number of registered keys', () => {
			registry.register('a', () => {});
			registry.register('b', () => {});
			expect(registry.size()).toBe(2);
		});
	});

	describe('isEmpty', () => {
		it('should return true when empty', () => {
			expect(registry.isEmpty()).toBe(true);
		});

		it('should return false when at least one key is registered', () => {
			registry.register('a', () => {});
			expect(registry.isEmpty()).toBe(false);
		});
	});
});
