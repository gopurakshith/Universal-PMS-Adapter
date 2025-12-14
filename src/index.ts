/**
 * Entry point for Universal PMS Adapter Service
 * Exposes both the mock legacy API and the clean normalized API.
 */

import express from 'express';
import mockExternalRoutes from './routes/mock-external.routes';
import slotsRoutes from './routes/slots.routes';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

/* Layer A: Simulates external legacy PMS systems (Dentrix, Eaglesoft, others)
 * In PROD, this would be replaced by actual calls to third-party servers
 * so this is not under /api path
 */
app.use('/mock-external-api', mockExternalRoutes);

// Layer B: Clean normalized API
app.use('/api', slotsRoutes);

/*
 * Health check - Optional for this project.
 * Used to check if the API is up and running,
 * will be useful when this service is containerized.
 */
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Universal PMS Adapter running on port ${PORT}`);
  logger.info(`Layer A: Legacy Mock :: http://localhost:${PORT}/mock-external-api/slots`);
  logger.info(`Layer B (Clean API) :: http://localhost:${PORT}/api/available-slots`);
  logger.info(`Health Check :: http://localhost:${PORT}/health`);
});
