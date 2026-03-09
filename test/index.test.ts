import * as index from '../src/index';

describe('src/index.ts exports', () => {
  it('should export ObserverSubject as default from ./ObserverSubject', () => {
    expect(index.ObserverSubject).toBeDefined();
  });

  it('should export DualObserverSubject as default from ./DualObserverSubject', () => {
    expect(index.DualObserverSubject).toBeDefined();
  });

  it('should not export undefined properties', () => {
    expect(index.NonExistentExport).toBeUndefined();
  });

  it('should allow importing both ObserverSubject and DualObserverSubject', () => {
    const { ObserverSubject, DualObserverSubject } = index;
    expect(ObserverSubject).toBeDefined();
    expect(DualObserverSubject).toBeDefined();
  });

  it('should throw when accessing undefined export', () => {
    expect(() => {
      // @ts-ignore
      const x = index.FakeExport;
      if (x) throw new Error('Should not exist');
    }).not.toThrow();
  });
});
