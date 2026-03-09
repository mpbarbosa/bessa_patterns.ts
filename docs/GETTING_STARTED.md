# Getting Started

## Prerequisites

- **Node.js** ≥ 18.0.0
- **npm** ≥ 9.0.0

## Installation

```bash
npm install bessa_patterns.ts
```

## Quick Start

### ObserverSubject — typed callback-based observer

```typescript
import { ObserverSubject } from 'bessa_patterns.ts';

interface PriceSnapshot {
  symbol: string;
  price: number;
}

const ticker = new ObserverSubject<PriceSnapshot>();

// Subscribe
const unsubscribe = ticker.subscribe(({ symbol, price }) => {
  console.log(`${symbol}: $${price}`);
});

ticker._notifyObservers({ symbol: 'AAPL', price: 182.5 }); // logs: AAPL: $182.5
ticker._notifyObservers({ symbol: 'AAPL', price: 183.0 }); // logs: AAPL: $183

// Unsubscribe when done
unsubscribe();
ticker._notifyObservers({ symbol: 'AAPL', price: 184.0 }); // not received
```

### DualObserverSubject — GoF + function-based observers

```typescript
import { DualObserverSubject } from 'bessa_patterns.ts';

const subject = new DualObserverSubject();

// GoF object observer
const logger = {
  update(source: unknown, event: unknown, data: unknown) {
    console.log(`[${event}]`, data);
  },
};
subject.subscribe(logger);

// Function observer
const monitor = (source: unknown, event: unknown) => {
  console.log('Event fired:', event);
};
subject.subscribeFunction(monitor);

// Notify each channel independently
subject.notifyObservers(subject, 'change', { value: 42 }); // GoF only
subject.notifyFunctionObservers(subject, 'change', { value: 42 }); // fn only

subject.unsubscribe(logger);
subject.unsubscribeFunction(monitor);
```

## Building from Source

```bash
git clone https://github.com/mpbarbosa/bessa_patterns.ts.git
cd bessa_patterns.ts
npm install
npm run build   # compiles TypeScript → dist/
npm test        # run all tests
npm run lint    # ESLint with TypeScript rules
```

## Next Steps

- [ObserverSubject API Reference](docs/OBSERVER_SUBJECT_API.md)
- [DualObserverSubject API Reference](docs/DUAL_OBSERVER_SUBJECT_API.md)
- [Architecture Overview](docs/ARCHITECTURE.md)
- [Contributing](CONTRIBUTING.md)
