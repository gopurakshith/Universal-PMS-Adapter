import { SlotAdapter } from '../src/services/slot-adapter';
import { logger } from '../src/utils/logger';
import { DentrixDriver } from '../src/drivers/dentrix.driver';
import { SoftDentDriver } from '../src/drivers/softdent.driver';

describe('SlotAdapter', () => {
  let adapter: SlotAdapter;

  beforeEach(() => {
    // Inject drivers explicitly for testing
    adapter = new SlotAdapter([new DentrixDriver(), new SoftDentDriver()], 'TEST_PRACTICE');
  });

  describe('Dentrix format : PascalCase', () => {
    it('normalizes a basic Dentrix slot', () => {
      const dentrixSlot = {
        AptNum: 101,
        AptDateTime: '2025-07-20T09:00:00',
        ProvNum: 'DDS1',
        Duration: 30,
      };

      const result = adapter.normalizeSlots([dentrixSlot]);

      expect(result).toHaveLength(1);
      expect(result[0].appointment_id).toBe('101');
      expect(result[0].practice_id).toBe('TEST_PRACTICE');
      expect(result[0].status).toBe('Available');
    });

    it('calculates end time correctly using duration', () => {
      const slot = {
        AptNum: 200,
        AptDateTime: '2025-07-20T14:00:00',
        ProvNum: 'DDS1',
        Duration: 45,
      };

      const [result] = adapter.normalizeSlots([slot]);

      expect(result.start_time).toBe('2025-07-20T14:00:00.000Z');
      expect(result.end_time).toBe('2025-07-20T14:45:00.000Z');
    });

    it('maps known provider correctly', () => {
      const slot = {
        AptNum: 300,
        AptDateTime: '2025-07-20T10:00:00',
        ProvNum: 'HYG2',
        Duration: 60,
      };

      const [result] = adapter.normalizeSlots([slot]);

      expect(result.provider.provider_id).toBe('HYG2');
      expect(result.provider.first_name).toBe('Jane');
    });
  });

  describe('SoftDent format : snake_case', () => {
    it('normalizes a basic SoftDent slot', () => {
      const softDentSlot = {
        appointment_id: '999',
        start_time: '07/21/2025 10:00 AM',
        provider_id: 'HYG2',
        length_min: 60,
      };

      const result = adapter.normalizeSlots([softDentSlot]);

      expect(result).toHaveLength(1);
      expect(result[0].appointment_id).toBe('999');
      expect(result[0].practice_id).toBe('TEST_PRACTICE');
    });

    it('parses AM/PM date format correctly', () => {
      const slot = {
        appointment_id: '500',
        start_time: '12/25/2025 02:30 PM',
        provider_id: 'DDS1',
        length_min: 30,
      };

      const [result] = adapter.normalizeSlots([slot]);

      expect(result.start_time).toBe('2025-12-25T14:30:00.000Z');
      expect(result.end_time).toBe('2025-12-25T15:00:00.000Z');
    });

    it('handles midnight edge case', () => {
      const slot = {
        appointment_id: '600',
        start_time: '01/01/2026 12:00 AM',
        provider_id: 'DDS1',
        length_min: 15,
      };

      const [result] = adapter.normalizeSlots([slot]);

      expect(result.start_time).toBe('2026-01-01T00:00:00.000Z');
    });

    it('handles noon edge case', () => {
      const slot = {
        appointment_id: '700',
        start_time: '01/01/2026 12:00 PM',
        provider_id: 'DDS1',
        length_min: 30,
      };

      const [result] = adapter.normalizeSlots([slot]);

      expect(result.start_time).toBe('2026-01-01T12:00:00.000Z');
    });
  });

  describe('mixed formats', () => {
    it('handles array with both formats', () => {
      const mixedSlots = [
        {
          AptNum: 101,
          AptDateTime: '2025-07-20T09:00:00',
          ProvNum: 'DDS1',
          Duration: 30,
        },
        {
          appointment_id: '999',
          start_time: '07/21/2025 10:00 AM',
          provider_id: 'HYG2',
          length_min: 60,
        },
      ];

      const results = adapter.normalizeSlots(mixedSlots);

      expect(results).toHaveLength(2);
      expect(results[0].appointment_id).toBe('101');
      expect(results[1].appointment_id).toBe('999');
    });
  });

  describe('test error handling', () => {
    it('throws error if unknown format', () => {
      const weirdSlot = { foo: 'bar', baz: 123 };

      expect(() => adapter.normalizeSlots([weirdSlot])).toThrow('Unknown slot format');
    });
  });

  describe('driver registry (resiliency)', () => {
    it('lists registered drivers', () => {
      const drivers = adapter.getRegisteredDrivers();

      expect(drivers).toContain('dentrix');
      expect(drivers).toContain('softdent');
    });

    it('allows registering a custom driver', () => {
      // Mock for "Schema C" driver
      const schemaCDriver = {
        name: 'schema-c',
        isCompatibleFormat: (slot: any) => 'schemaC_id' in slot,
        normalize: (slot: any, practiceId: string) => ({
          appointment_id: slot.schemaC_id,
          practice_id: practiceId,
          start_time: '2025-01-01T09:00:00.000Z',
          end_time: '2025-01-01T09:30:00.000Z',
          status: 'Available',
          provider: {
            provider_id: 'TEST',
            first_name: 'Test',
            last_name: 'Provider',
            specialty: 'General',
          },
        }),
      };

      adapter.registerDriver(schemaCDriver);

      expect(adapter.getRegisteredDrivers()).toContain('schema-c');

      // Test that the new driver works
      const schemaCSlot = { schemaC_id: 'SC-001' };
      const [result] = adapter.normalizeSlots([schemaCSlot]);

      expect(result.appointment_id).toBe('SC-001');
    });

    it('prevents duplicate driver registration', () => {
      const loggerSpy = jest.spyOn(logger, 'warn').mockImplementation();

      const duplicateDriver = {
        name: 'dentrix',
        isCompatibleFormat: () => false,
        normalize: () => ({}) as any,
      };

      adapter.registerDriver(duplicateDriver);

      expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('already registered'));
      loggerSpy.mockRestore();
    });

    it('allows unregistering a driver', () => {
      expect(adapter.getRegisteredDrivers()).toContain('softdent');

      const removed = adapter.unregisterDriver('softdent');

      expect(removed).toBe(true);
      expect(adapter.getRegisteredDrivers()).not.toContain('softdent');
    });

    it('returns false when unregistering non-existent driver', () => {
      const removed = adapter.unregisterDriver('non-existent');

      expect(removed).toBe(false);
    });
  });

  describe('use custom practice ID', () => {
    it('uses default practice ID when not specified', () => {
      const defaultAdapter = new SlotAdapter();
      const slot = {
        AptNum: 1,
        AptDateTime: '2025-01-01T08:00:00',
        ProvNum: 'DDS1',
        Duration: 15,
      };

      const [result] = defaultAdapter.normalizeSlots([slot]);

      expect(result.practice_id).toBe('12345');
    });
  });
});
