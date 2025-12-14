import { getProviderById, getProviderOrDefault } from '../src/data/providers';

describe('providers', () => {
  describe('getProviderById', () => {
    it('returns provider if ID exists', () => {
      const result = getProviderById('DDS1');

      expect(result).toEqual({
        provider_id: 'DDS1',
        first_name: 'John',
        last_name: 'Smith',
      });
    });

    it('returns null for unknown provider ID', () => {
      const result = getProviderById('UNKNOWN_ID');
      expect(result).toBeNull();
    });

    it('returns correct provider data', () => {
      const result = getProviderById('HYG2');

      expect(result?.first_name).toBe('Jane');
      expect(result?.last_name).toBe('Lee');
    });
  });

  describe('getProviderOrDefault', () => {
    it('returns provider if ID exists', () => {
      const result = getProviderOrDefault('DDS2');

      expect(result.first_name).toBe('Robert');
      expect(result.last_name).toBe('Williams');
    });

    it('returns placeholder for unknown ID', () => {
      const unknownId = 'FAKE_PROVIDER';
      const result = getProviderOrDefault(unknownId);

      expect(result.provider_id).toBe(unknownId);
      expect(result.first_name).toBe('Unknown');
      expect(result.last_name).toBe('Provider');
    });

    it('preserves the original ID in fallback', () => {
      const result = getProviderOrDefault('XYZ999');
      expect(result.provider_id).toBe('XYZ999');
    });
  });
});
