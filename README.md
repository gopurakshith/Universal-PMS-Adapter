# Universal PMS Adapter

A lightweight service that normalizes appointment slot data from various Practice Management Systems (PMS) into a single, consistent API format. 


## Tech Stack
- Node.js + TypeScript + Express.js + Pino (Logging) + Jest (testing)

## Architecture Overview

**Layer A** (`/mock-external-api`): Simulates legacy PMS responses. In production, you'd replace this with actual calls to third-party systems.

**Layer B** (`/api`): The clean, normalized API your application consumes.

## Project Structure
index.ts                 # Express app setup, routes mounting
drivers/                 # PMS specific transformation logic
       - index.ts             # Driver exports
       - dentrix.driver.ts    # Handles Dentrix format
       - softdent.driver.ts   # Handles SoftDent format
services/slot-adapter.ts      # Core adapter with driver registry
routes/
      - slots.routes.ts      # /api/available-slots endpoint
      - mock-external.routes.ts  # Simulated legacy API
types/slot.types.ts        # TypeScript interfaces, PmsDriver contract
data/providers.ts         # Mock provider data
utils/                    # Utility functions
test/                     # Unit test coverage

## Setup
- To install packages - npm i
- To build - npm run build
- To run server - npm run start
- To run in dev mode - npm run dev
- To run unit tests - npm run test
- Default port: 3000. Create .env file for custom port

## API Reference

### GET /api/available-slots
- Returns normalized appointment slots from all configured PMS sources

### GET /mock-external-api/slots
- Returns raw legacy data in mixed formats

### GET /health
- Basic health check endpoint. Returns `{ "status": "ok", "timestamp": "..." }`.

## To add a New PMS Driver
- To support a new PMS format:

1. **Create the driver** in `src/drivers/`:

```typescript
// src/drivers/eaglesoft.driver.ts
import { LegacySlot, NormalizedSlot, PmsDriver } from '../types/slot.types';

export class EaglesoftDriver implements PmsDriver {
  readonly name = 'eaglesoft';

  isCompatibleFormat(slot: LegacySlot): boolean {
    return 'eaglesoft_id' in slot && 'appt_time' in slot;
  }

  normalize(slot: LegacySlot, practiceId: string): NormalizedSlot {
    // Transform to normalized format
  }
}
```

2. **Inject it** when creating the adapter (dependency injection):

```typescript
import { EaglesoftDriver } from './drivers/eaglesoft.driver';

const adapter = new SlotAdapter([
  new DentrixDriver(),
  new SoftDentDriver(),
  new EaglesoftDriver(),  // Add your new driver
]);
```

Or register dynamically at runtime:

```typescript
adapter.registerDriver(new EaglesoftDriver());
```

No modifications to the core adapter logic needed.
