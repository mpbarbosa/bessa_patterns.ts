// test/ObserverMixin.test.ts

import { withObserver, type ObserverMixinOptions } from '../src/ObserverMixin';
import DualObserverSubject from '../src/DualObserverSubject';

// ─── Test helper ─────────────────────────────────────────────────────────────

function makeHost(options?: ObserverMixinOptions) {
  const host = { observerSubject: new DualObserverSubject() };
  Object.assign(host, withObserver(options));
  return host as typeof host & ReturnType<typeof withObserver>;
}

function createObserver() {
  return { update: jest.fn() };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('withObserver', () => {
  describe('returned mixin shape', () => {
    it('adds subscribe, unsubscribe and notifyObservers by default', () => {
      const mixin = withObserver();
      expect(typeof mixin.subscribe).toBe('function');
      expect(typeof mixin.unsubscribe).toBe('function');
      expect(typeof mixin.notifyObservers).toBe('function');
    });

    it('excludeNotify omits notifyObservers', () => {
      const mixin = withObserver({ excludeNotify: true });
      expect(mixin.notifyObservers).toBeUndefined();
      expect(typeof mixin.subscribe).toBe('function');
      expect(typeof mixin.unsubscribe).toBe('function');
    });
  });

  describe('subscribe / notifyObservers / unsubscribe round-trip', () => {
    it('notifies a subscribed observer then stops after unsubscribe', () => {
      const host = makeHost();
      const observer = createObserver();

      host.subscribe(observer);
      host.notifyObservers!('event', { data: 1 });
      expect(observer.update).toHaveBeenCalledTimes(1);
      expect(observer.update).toHaveBeenCalledWith('event', { data: 1 });

      host.unsubscribe(observer);
      host.notifyObservers!('event', { data: 2 });
      expect(observer.update).toHaveBeenCalledTimes(1); // still 1
    });

    it('notifies multiple observers independently', () => {
      const host = makeHost();
      const obs1 = createObserver();
      const obs2 = createObserver();

      host.subscribe(obs1);
      host.subscribe(obs2);
      host.notifyObservers!('ping');

      expect(obs1.update).toHaveBeenCalledWith('ping');
      expect(obs2.update).toHaveBeenCalledWith('ping');
    });

    it('unsubscribing one observer does not affect others', () => {
      const host = makeHost();
      const obs1 = createObserver();
      const obs2 = createObserver();

      host.subscribe(obs1);
      host.subscribe(obs2);
      host.unsubscribe(obs1);
      host.notifyObservers!('tick');

      expect(obs1.update).not.toHaveBeenCalled();
      expect(obs2.update).toHaveBeenCalledWith('tick');
    });
  });

  describe('checkNull option', () => {
    it('checkNull=true warns and skips null observer', () => {
      const host = makeHost({ checkNull: true, className: 'TestClass' });
      const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      host.subscribe(null);

      expect(spy).toHaveBeenCalledWith(
        '(TestClass) Attempted to subscribe a null observer.',
      );
      spy.mockRestore();
    });

    it('checkNull=true warns and skips undefined observer', () => {
      const host = makeHost({ checkNull: true, className: 'TestClass' });
      const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      host.subscribe(undefined);

      expect(spy).toHaveBeenCalledTimes(1);
      spy.mockRestore();
    });

    it('checkNull=false accepts null without warning (delegates to subject)', () => {
      const host = makeHost(); // checkNull defaults to false
      const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      // DualObserverSubject silently ignores null — no warn expected from mixin
      host.subscribe(null);

      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it('className defaults to "Class" in warning message', () => {
      const host = makeHost({ checkNull: true });
      const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      host.subscribe(null);

      expect(spy).toHaveBeenCalledWith('(Class) Attempted to subscribe a null observer.');
      spy.mockRestore();
    });
  });

  describe('default export', () => {
    it('default export equals withObserver named export', async () => {
      const mod = await import('../src/ObserverMixin');
      expect(mod.default).toBe(withObserver);
    });
  });
});
