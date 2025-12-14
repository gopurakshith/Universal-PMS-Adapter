/**
 * API Route for Available Slots
 * This is Layer B - the clean, standardized API that consumers use
 * Fetches from legacy source and transforms via adapter
 */

import { Router, Request, Response } from 'express';
import { SlotAdapter } from '../services/slot-adapter';
import { ApiResponse, LegacySlot } from '../types/slot.types';
import { DentrixDriver } from '../drivers/dentrix.driver';
import { SoftDentDriver } from '../drivers/softdent.driver';

const router = Router();

// Dependency injection: explicitly provide drivers
const adapter = new SlotAdapter([new DentrixDriver(), new SoftDentDriver()]);

const LEGACY_API_URL = 'http://localhost:3000/mock-external-api';

/**
 * GET /api/available-slots
 * Returns normalized data in Sikka ONE API format
 */
router.get('/available-slots', async (_req: Request, res: Response) => {
  try {
    const legacyResponse = await fetch(`${LEGACY_API_URL}/slots`);

    if (!legacyResponse.ok) {
      throw new Error(`Legacy API response :: ${legacyResponse.status}`);
    }

    const rawSlots = (await legacyResponse.json()) as LegacySlot[];

    // Transform the data
    const normalizedSlots = adapter.normalizeSlots(rawSlots);

    // Standardized response
    const response: ApiResponse = {
      items: normalizedSlots,
      meta: {
        count: normalizedSlots.length,
        generated_at: new Date().toISOString(),
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Failed to fetch (or) transform slots:', error);

    res.status(500).json({
      error: 'Failed to retrieve available slots',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
