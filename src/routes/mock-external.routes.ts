/**
 * Mock External API Routes
 * Simulates legacy PMS endpoints with the data formats
 * This is Layer A
 */

import { Router, Request, Response } from 'express';

const router = Router();

/* Simulats raw data from different PMS vendors
 * Tackles mixed casing, different field names, various date formats
 */
const mockLegacySlots = [
  // Dentrix-style (PascalCase, ISO dates)
  {
    AptNum: 101,
    AptDateTime: '2025-07-20T09:00:00',
    ProvNum: 'DDS1',
    Duration: 30,
  },
  // SoftDent-style (snake_case, mm/dd/yyyy AM/PM format)
  {
    appointment_id: '999',
    start_time: '07/21/2025 10:00 AM',
    provider_id: 'HYG2',
    length_min: 60,
  },
];

/**
 * GET /mock-external-api/slots
 * Returns raw legacy data
 */
router.get('/slots', (_req: Request, res: Response) => {
  res.json(mockLegacySlots);
});

export default router;
