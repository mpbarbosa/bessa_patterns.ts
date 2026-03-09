// test/core/DualObserverSubject.test.ts

import DualObserverSubject from '../src/DualObserverSubject';

describe('DualObserverSubject', () => {
  let subject: DualObserverSubject;

  beforeEach(() => {
    subject = new DualObserverSubject();
  });

  function createObserver() {
    return { update: jest.fn() };
  }

  describe('constructor', () => {
    it('should initialize with empty observer arrays', () => {
      expect(subject.observers).toEqual([]);
      expect(subject.functionObservers).toEqual([]);
      expect(subject.getObserverCount()).toBe(0);
      expect(subject.getFunctionObserverCount()).toBe(0);
    });
  });

  // ─── Object Observer Management ───────────────────────────────────────────

  describe('subscribe()', () => {
    it('should add an object observer', () => {
      const observer = createObserver();
      subject.subscribe(observer);

      expect(subject.observers).toContain(observer);
      expect(subject.getObserverCount()).toBe(1);
    });

    it.each([null, undefined])('should silently ignore %p', (input) => {
      subject.subscribe(input);
      expect(subject.getObserverCount()).toBe(0);
    });

    it('should subscribe multiple observers', () => {
      const obs1 = createObserver();
      const obs2 = createObserver();
      const obs3 = createObserver();
      subject.subscribe(obs1);
      subject.subscribe(obs2);
      subject.subscribe(obs3);

      expect(subject.getObserverCount()).toBe(3);
      expect(subject.observers).toContain(obs1);
      expect(subject.observers).toContain(obs2);
      expect(subject.observers).toContain(obs3);
    });

    it('creates a new array on each subscribe (immutable pattern)', () => {
      const obs1 = createObserver();
      const obs2 = createObserver();
      subject.subscribe(obs1);
      const arrayBefore = subject.observers;
      subject.subscribe(obs2);
      const arrayAfter = subject.observers;

      expect(arrayBefore).not.toBe(arrayAfter);
      expect(arrayBefore).toHaveLength(1);
      expect(arrayAfter).toHaveLength(2);
    });

    it('accepts objects without an update method', () => {
      const observer = { someOtherMethod: jest.fn() } as unknown as { update: () => void };
      expect(() => subject.subscribe(observer)).not.toThrow();
      expect(subject.getObserverCount()).toBe(1);
    });
  });

  describe('unsubscribe()', () => {
    it('should remove the specified observer', () => {
      const obs1 = createObserver();
      const obs2 = createObserver();
      subject.subscribe(obs1);
      subject.subscribe(obs2);

      subject.unsubscribe(obs1);

      expect(subject.getObserverCount()).toBe(1);
      expect(subject.observers).toContain(obs2);
      expect(subject.observers).not.toContain(obs1);
    });

    it('should not throw when unsubscribing a non-registered observer', () => {
      const obs1 = createObserver();
      const obs2 = createObserver();
      subject.subscribe(obs1);

      expect(() => subject.unsubscribe(obs2)).not.toThrow();
      expect(subject.getObserverCount()).toBe(1);
    });

    it('creates a new array on unsubscribe (immutable pattern)', () => {
      const obs = createObserver();
      subject.subscribe(obs);
      const arrayBefore = subject.observers;
      subject.unsubscribe(obs);
      const arrayAfter = subject.observers;

      expect(arrayBefore).not.toBe(arrayAfter);
      expect(arrayBefore).toHaveLength(1);
      expect(arrayAfter).toHaveLength(0);
    });
  });

  // ─── Object Observer Notification ─────────────────────────────────────────

  describe('notifyObservers()', () => {
    it('should call update() on all subscribed object observers', () => {
      const obs1 = createObserver();
      const obs2 = createObserver();
      subject.subscribe(obs1);
      subject.subscribe(obs2);

      subject.notifyObservers('arg1', 'arg2', 'arg3');

      expect(obs1.update).toHaveBeenCalledWith('arg1', 'arg2', 'arg3');
      expect(obs2.update).toHaveBeenCalledWith('arg1', 'arg2', 'arg3');
    });

    it('should notify observers with no arguments', () => {
      const obs = createObserver();
      subject.subscribe(obs);
      subject.notifyObservers();
      expect(obs.update).toHaveBeenCalledWith();
    });

    it('should not throw when no observers are subscribed', () => {
      expect(() => subject.notifyObservers('data')).not.toThrow();
    });

    it('should skip observers without an update method', () => {
      const valid = createObserver();
      const invalid = { noUpdate: jest.fn() } as unknown as { update: () => void };
      subject.subscribe(valid);
      subject.subscribe(invalid);

      expect(() => subject.notifyObservers('data')).not.toThrow();
      expect(valid.update).toHaveBeenCalledWith('data');
    });

    it('should catch errors from misbehaving observers and continue notifying others', () => {
      const badObs = {
        update: jest.fn(() => {
          throw new Error('boom');
        }),
      };
      const goodObs = { update: jest.fn() };
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      subject.subscribe(badObs);
      subject.subscribe(goodObs);

      expect(() => subject.notifyObservers('event')).not.toThrow();
      expect(goodObs.update).toHaveBeenCalledWith('event');
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error notifying observer'),
        expect.any(Error)
      );
      warnSpy.mockRestore();
    });

    it('should NOT notify function observers', () => {
      const fn = jest.fn();
      const obs = createObserver();
      subject.subscribe(obs);
      subject.subscribeFunction(fn);

      subject.notifyObservers('data');

      expect(obs.update).toHaveBeenCalled();
      expect(fn).not.toHaveBeenCalled();
    });
  });

  // ─── Function Observer Management ─────────────────────────────────────────

  describe('subscribeFunction()', () => {
    it('should add a function observer', () => {
      const fn = jest.fn();
      subject.subscribeFunction(fn);

      expect(subject.functionObservers).toContain(fn);
      expect(subject.getFunctionObserverCount()).toBe(1);
    });

    it.each([null, undefined])('should silently ignore %p', (input) => {
      subject.subscribeFunction(input);
      expect(subject.getFunctionObserverCount()).toBe(0);
    });

    it('should subscribe multiple function observers', () => {
      const fn1 = jest.fn();
      const fn2 = jest.fn();
      const fn3 = jest.fn();
      subject.subscribeFunction(fn1);
      subject.subscribeFunction(fn2);
      subject.subscribeFunction(fn3);

      expect(subject.getFunctionObserverCount()).toBe(3);
    });

    it('creates a new array on each subscribeFunction (immutable pattern)', () => {
      const fn1 = jest.fn();
      const fn2 = jest.fn();
      subject.subscribeFunction(fn1);
      const arrayBefore = subject.functionObservers;
      subject.subscribeFunction(fn2);
      const arrayAfter = subject.functionObservers;

      expect(arrayBefore).not.toBe(arrayAfter);
      expect(arrayBefore).toHaveLength(1);
      expect(arrayAfter).toHaveLength(2);
    });
  });

  describe('unsubscribeFunction()', () => {
    it('should remove the specified function observer', () => {
      const fn1 = jest.fn();
      const fn2 = jest.fn();
      subject.subscribeFunction(fn1);
      subject.subscribeFunction(fn2);

      subject.unsubscribeFunction(fn1);

      expect(subject.getFunctionObserverCount()).toBe(1);
      expect(subject.functionObservers).toContain(fn2);
      expect(subject.functionObservers).not.toContain(fn1);
    });

    it('should not throw when unsubscribing a non-registered function', () => {
      const fn1 = jest.fn();
      const fn2 = jest.fn();
      subject.subscribeFunction(fn1);

      expect(() => subject.unsubscribeFunction(fn2)).not.toThrow();
      expect(subject.getFunctionObserverCount()).toBe(1);
    });
  });

  // ─── Function Observer Notification ───────────────────────────────────────

  describe('notifyFunctionObservers()', () => {
    it('should call all subscribed function observers with args', () => {
      const fn1 = jest.fn();
      const fn2 = jest.fn();
      subject.subscribeFunction(fn1);
      subject.subscribeFunction(fn2);

      subject.notifyFunctionObservers('arg1', 'arg2');

      expect(fn1).toHaveBeenCalledWith('arg1', 'arg2');
      expect(fn2).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should not throw when no function observers are subscribed', () => {
      expect(() => subject.notifyFunctionObservers('data')).not.toThrow();
    });

    it('should catch errors from misbehaving function observers and continue', () => {
      const badFn = jest.fn(() => {
        throw new Error('boom');
      });
      const goodFn = jest.fn();
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      subject.subscribeFunction(badFn);
      subject.subscribeFunction(goodFn);

      expect(() => subject.notifyFunctionObservers('event')).not.toThrow();
      expect(goodFn).toHaveBeenCalledWith('event');
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error notifying function observer'),
        expect.any(Error)
      );
      warnSpy.mockRestore();
    });

    it('should NOT notify object observers', () => {
      const fn = jest.fn();
      const obs = createObserver();
      subject.subscribe(obs);
      subject.subscribeFunction(fn);

      subject.notifyFunctionObservers('data');

      expect(fn).toHaveBeenCalled();
      expect(obs.update).not.toHaveBeenCalled();
    });
  });

  // ─── Mixed Observer Types ──────────────────────────────────────────────────

  describe('mixed observer types', () => {
    it('should handle both observer types independently', () => {
      const obs = createObserver();
      const fn = jest.fn();

      subject.subscribe(obs);
      subject.subscribeFunction(fn);

      expect(subject.getObserverCount()).toBe(1);
      expect(subject.getFunctionObserverCount()).toBe(1);

      subject.notifyObservers('object-data');
      expect(obs.update).toHaveBeenCalledWith('object-data');
      expect(fn).not.toHaveBeenCalled();

      subject.notifyFunctionObservers('function-data');
      expect(fn).toHaveBeenCalledWith('function-data');
      expect(obs.update).toHaveBeenCalledTimes(1); // not called again
    });
  });

  // ─── clearAllObservers ─────────────────────────────────────────────────────

  describe('clearAllObservers()', () => {
    it('should remove all object and function observers', () => {
      subject.subscribe(createObserver());
      subject.subscribe(createObserver());
      subject.subscribeFunction(jest.fn());
      subject.subscribeFunction(jest.fn());

      subject.clearAllObservers();

      expect(subject.getObserverCount()).toBe(0);
      expect(subject.getFunctionObserverCount()).toBe(0);
      expect(subject.observers).toEqual([]);
      expect(subject.functionObservers).toEqual([]);
    });

    it('should prevent further notifications after clearing', () => {
      const obs = createObserver();
      const fn = jest.fn();
      subject.subscribe(obs);
      subject.subscribeFunction(fn);

      subject.clearAllObservers();
      subject.notifyObservers('data');
      subject.notifyFunctionObservers('data');

      expect(obs.update).not.toHaveBeenCalled();
      expect(fn).not.toHaveBeenCalled();
    });
  });
});
