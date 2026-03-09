// test/integration.test.ts
// Integration tests: real-world usage scenarios via the public barrel export.
// These tests validate cross-pattern interactions and consumer-facing API contracts.

import { ObserverSubject, DualObserverSubject } from '../src/index';

/** Test helper: exposes protected _notifyObservers via a public wrapper */
class TestObserverSubject<T> extends ObserverSubject<T> {
  notify(snapshot: T): void {
    this._notifyObservers(snapshot);
  }
}

// ─── Scenario: Typed state store ──────────────────────────────────────────────

describe('ObserverSubject — typed state store scenario', () => {
  interface State {
    count: number;
    label: string;
  }

  let store: TestObserverSubject<State>;

  beforeEach(() => {
    store = new TestObserverSubject<State>();
  });

  it('notifies all subscribers when state changes', () => {
    const subscriber1 = jest.fn();
    const subscriber2 = jest.fn();
    store.subscribe(subscriber1);
    store.subscribe(subscriber2);

    store.notify({ count: 1, label: 'a' });

    expect(subscriber1).toHaveBeenCalledWith({ count: 1, label: 'a' });
    expect(subscriber2).toHaveBeenCalledWith({ count: 1, label: 'a' });
  });

  it('supports selective unsubscribe — removed subscriber does not receive updates', () => {
    const active = jest.fn();
    const removed = jest.fn();
    store.subscribe(active);
    const unsub = store.subscribe(removed);

    unsub();
    store.notify({ count: 2, label: 'b' });

    expect(active).toHaveBeenCalledTimes(1);
    expect(removed).not.toHaveBeenCalled();
  });

  it('survives rapid subscribe → notify → unsubscribe cycles', () => {
    const snapshots: State[] = [];
    for (let i = 0; i < 50; i++) {
      const unsub = store.subscribe((s) => snapshots.push(s));
      store.notify({ count: i, label: String(i) });
      unsub();
    }
    expect(snapshots).toHaveLength(50);
    expect(snapshots[0]).toEqual({ count: 0, label: '0' });
    expect(snapshots[49]).toEqual({ count: 49, label: '49' });
  });

  it('teardown via clearObservers stops all further notifications', () => {
    const obs = jest.fn();
    store.subscribe(obs);
    store.clearObservers();
    store.notify({ count: 99, label: 'x' });
    expect(obs).not.toHaveBeenCalled();
  });
});

// ─── Scenario: Event bus with dual channels ───────────────────────────────────

describe('DualObserverSubject — event bus scenario', () => {
  let bus: DualObserverSubject;

  beforeEach(() => {
    bus = new DualObserverSubject();
  });

  it('routes events to object observers only via notifyObservers()', () => {
    const objectHandler = createObserver();
    const functionHandler = jest.fn();
    bus.subscribe(objectHandler);
    bus.subscribeFunction(functionHandler);

    bus.notifyObservers('click', { x: 10, y: 20 });

    expect(objectHandler.update).toHaveBeenCalledWith('click', { x: 10, y: 20 });
    expect(functionHandler).not.toHaveBeenCalled();
  });

  it('routes events to function observers only via notifyFunctionObservers()', () => {
    const objectHandler = createObserver();
    const functionHandler = jest.fn();
    bus.subscribe(objectHandler);
    bus.subscribeFunction(functionHandler);

    bus.notifyFunctionObservers('resize', { width: 1920 });

    expect(functionHandler).toHaveBeenCalledWith('resize', { width: 1920 });
    expect(objectHandler.update).not.toHaveBeenCalled();
  });

  it('supports mixed teardown — clearing all stops both channels', () => {
    const obj = createObserver();
    const fn = jest.fn();
    bus.subscribe(obj);
    bus.subscribeFunction(fn);

    bus.clearAllObservers();
    bus.notifyObservers('event');
    bus.notifyFunctionObservers('event');

    expect(obj.update).not.toHaveBeenCalled();
    expect(fn).not.toHaveBeenCalled();
  });

  it('error in one observer does not break other channel or other observers', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const badObj = {
      update: jest.fn(() => {
        throw new Error('obj boom');
      }),
    };
    const goodObj = createObserver();
    const goodFn = jest.fn();

    bus.subscribe(badObj);
    bus.subscribe(goodObj);
    bus.subscribeFunction(goodFn);

    expect(() => bus.notifyObservers('event')).not.toThrow();
    expect(goodObj.update).toHaveBeenCalledWith('event');

    bus.notifyFunctionObservers('event');
    expect(goodFn).toHaveBeenCalledWith('event');

    warnSpy.mockRestore();
  });
});

// ─── Scenario: Both patterns used together (barrel import) ────────────────────

describe('barrel export — both patterns used together', () => {
  it('exports both classes from src/index.ts', () => {
    expect(ObserverSubject).toBeDefined();
    expect(DualObserverSubject).toBeDefined();
  });

  it('instances from barrel are fully functional', () => {
    const subject = new TestObserverSubject<string>();
    const dual = new DualObserverSubject();

    const subjectReceived: string[] = [];
    const dualReceived: unknown[][] = [];

    subject.subscribe((v) => subjectReceived.push(v));
    dual.subscribeFunction((...args) => dualReceived.push(args));

    subject.notify('hello');
    dual.notifyFunctionObservers('world', 42);

    expect(subjectReceived).toEqual(['hello']);
    expect(dualReceived).toEqual([['world', 42]]);
  });

  it('two independent ObserverSubject instances do not share state', () => {
    const s1 = new TestObserverSubject<number>();
    const s2 = new TestObserverSubject<number>();
    const received1: number[] = [];
    const received2: number[] = [];

    s1.subscribe((v) => received1.push(v));
    s2.subscribe((v) => received2.push(v));

    s1.notify(1);
    s2.notify(2);
    s1.notify(3);

    expect(received1).toEqual([1, 3]);
    expect(received2).toEqual([2]);
  });
});

// ─── Helper ───────────────────────────────────────────────────────────────────

function createObserver() {
  return { update: jest.fn() };
}
