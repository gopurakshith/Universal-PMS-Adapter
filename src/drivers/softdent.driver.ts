/**
 * SoftDentDriver - PMS Driver for SoftDent format
 * Handles snake_case field format
 * Fields: appointment_id, start_time, provider_id, length_min
 */

import { getProviderOrDefault } from '../data/providers';
import { SoftDentSlot, LegacySlot, NormalizedSlot, PmsDriver } from '../types/slot.types';

export class SoftDentDriver implements PmsDriver {
  readonly name = 'softdent';

  isCompatibleFormat(slot: LegacySlot): slot is SoftDentSlot {
    return 'appointment_id' in slot && 'start_time' in slot && 'length_min' in slot;
  }

  normalize(slot: LegacySlot, practiceId: string): NormalizedSlot {
    const softDentSlot = slot as SoftDentSlot;
    const startTime = this.parseToUtc(softDentSlot.start_time);
    const endTime = this.addMinutes(startTime, softDentSlot.length_min);

    return {
      appointment_id: softDentSlot.appointment_id,
      practice_id: practiceId,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      status: 'Available',
      provider: getProviderOrDefault(softDentSlot.provider_id),
    };
  }

  // Parse mm/dd/yyyy hh:mm AM/PM format and treat as UTC
  private parseToUtc(dateStr: string): Date {
    // Handle mm/dd/yyyy hh:mm AM/PM format
    if (dateStr.includes('/') && dateStr.includes(' ')) {
      return this.parseAmPmDate(dateStr);
    }

    // Handle ISO format without timezone
    if (!dateStr.endsWith('Z') && !dateStr.includes('+')) {
      return new Date(dateStr + 'Z');
    }

    return new Date(dateStr);
  }

  private parseAmPmDate(dateStr: string): Date {
    // exmaple: "07/21/2025 10:00 AM"
    const [datePart, timePart, ampm] = dateStr.split(' ');
    const [month, day, year] = datePart.split('/').map(Number);
    const [parsedHours, minutes] = timePart.split(':').map(Number);
    let hours = parsedHours;

    // Convert to 24hr
    if (ampm?.toUpperCase() === 'PM' && hours !== 12) {
      hours += 12;
    } else if (ampm?.toUpperCase() === 'AM' && hours === 12) {
      hours = 0;
    }

    // Build UTC date
    return new Date(Date.UTC(year, month - 1, day, hours, minutes));
  }

  private addMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes * 60 * 1000);
  }
}
