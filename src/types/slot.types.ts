// Types for the standardized output format (Sikka ONE API style)

import { Provider } from '../data/providers';

export interface NormalizedSlot {
  appointment_id: string;
  practice_id: string;
  start_time: string; // ISO 8601 UTC
  end_time: string; // ISO 8601 UTC
  status: string;
  provider: Provider;
}

export interface ApiResponse {
  items: NormalizedSlot[];
  meta: {
    count: number;
    generated_at: string;
  };
}

// Raw slot types from legacy systems
export interface DentrixSlot {
  AptNum: number;
  AptDateTime: string;
  ProvNum: string;
  Duration: number;
}

export interface SoftDentSlot {
  appointment_id: string;
  start_time: string;
  provider_id: string;
  length_min: number;
}

// Union type for any incoming legacy data
export type LegacySlot = DentrixSlot | SoftDentSlot | Record<string, unknown>;

/**
 * PmsDriver Interface - The plugin for adding new PMS format
 * To add New PMS formats:
 * 1. Create a driver and implement PmsDriver interface
 * 2. Register it with adapter.registerDriver()
 * Allows adding new PMS integrations without modifying the core SlotAdapter.
 */
export interface PmsDriver {
  readonly name: string;

  /**
   * Type guard - determines if this driver can handle the given slot format
   * Should check for unique field signatures of the PMS format
   */
  isCompatibleFormat(slot: LegacySlot): boolean;

  /**
   * Transforms the legacy slot into the normalized format
   * @param slot - The raw legacy slot data
   * @param practiceId - The practice identifier to include
   * @returns Normalized slot in standard format
   */
  normalize(slot: LegacySlot, practiceId: string): NormalizedSlot;
}
