/**
 * DentrixDriver - PMS Driver for Dentrix format
 * Handles PascalCase field format
 * Fields: AptNum, AptDateTime, ProvNum, Duration
 */

import { getProviderOrDefault } from '../data/providers';
import { DentrixSlot, LegacySlot, NormalizedSlot, PmsDriver } from '../types/slot.types';

export class DentrixDriver implements PmsDriver {
  readonly name = 'dentrix';

  isCompatibleFormat(slot: LegacySlot): slot is DentrixSlot {
    return 'AptNum' in slot && 'AptDateTime' in slot;
  }

  normalize(slot: LegacySlot, practiceId: string): NormalizedSlot {
    const dentrixSlot = slot as DentrixSlot;
    const startTime = this.parseToUtc(dentrixSlot.AptDateTime);
    const endTime = this.addMinutes(startTime, dentrixSlot.Duration);

    return {
      appointment_id: String(dentrixSlot.AptNum),
      practice_id: practiceId,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      status: 'Available',
      provider: getProviderOrDefault(dentrixSlot.ProvNum),
    };
  }

  // Parse ISO format without timezone and treat as UTC
  private parseToUtc(dateStr: string): Date {
    if (!dateStr.endsWith('Z') && !dateStr.includes('+')) {
      return new Date(dateStr + 'Z');
    }
    return new Date(dateStr);
  }

  private addMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes * 60 * 1000);
  }
}
