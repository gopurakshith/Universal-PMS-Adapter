/**
 * SlotAdapter - The core transformation logic
 * Uses a driver registry pattern to plugin new PMS formats
 * To add New PMS formats:
 * 1. Create a driver and implement PmsDriver interface
 * 2. Register it with adapter.registerDriver()
 */

import { LegacySlot, NormalizedSlot, PmsDriver } from '../types/slot.types';
import { DentrixDriver, SoftDentDriver } from '../drivers';
import { logger } from '../utils/logger';

// Temporarily hardcoded for demo - in real world scenario, this would come from DB call
const DEFAULT_PRACTICE_ID = '12345';

// Default drivers - used when no drivers are injected
const DEFAULT_DRIVERS: PmsDriver[] = [new DentrixDriver(), new SoftDentDriver()];

export class SlotAdapter {
  private practiceId: string;
  private drivers: PmsDriver[] = [];

  constructor(drivers: PmsDriver[] = DEFAULT_DRIVERS, practiceId: string = DEFAULT_PRACTICE_ID) {
    this.practiceId = practiceId;

    // Register injected drivers
    drivers.forEach(driver => this.registerDriver(driver));
  }

  // Register a new PMS driver - no need to modify this class for new additions
  registerDriver(driver: PmsDriver): void {
    // Prevent duplicate registrations
    if (this.drivers.some(d => d.name === driver.name)) {
      logger.warn(`Driver '${driver.name}' is already registered, skipping.`);
      return;
    }
    this.drivers.push(driver);
  }

  // To Unregister a driver
  unregisterDriver(driverName: string): boolean {
    const index = this.drivers.findIndex(d => d.name === driverName);
    if (index !== -1) {
      this.drivers.splice(index, 1);
      return true;
    }
    return false;
  }

  // Get list of registered driver names
  getRegisteredDrivers(): string[] {
    return this.drivers.map(d => d.name);
  }

  // transforms array of mixed legacy formats
  normalizeSlots(rawSlots: LegacySlot[]): NormalizedSlot[] {
    return rawSlots.map(slot => this.normalizeSlot(slot));
  }

  // Route to pick driver type based on data shape
  private normalizeSlot(raw: LegacySlot): NormalizedSlot {
    const driver = this.drivers.find(d => d.isCompatibleFormat(raw));

    if (driver) {
      return driver.normalize(raw, this.practiceId);
    }

    // No driver found for this format
    throw new Error(
      `Unknown slot format - registered driver cannot handle this data shape :: ${JSON.stringify(raw)}`
    );
  }
}
