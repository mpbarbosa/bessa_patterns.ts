// test/helpers.ts
// Shared test utilities used across multiple test files.

/** Returns a minimal observer object whose `update` method is a Jest mock. */
export function createObserver() {
  return { update: jest.fn() };
}
