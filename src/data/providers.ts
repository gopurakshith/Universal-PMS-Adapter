/* Provider directory - simulates lookup from PMS database
 * In real world scenario this would hit a database
 */

export interface Provider {
  provider_id: string;
  first_name: string;
  last_name: string;
}

// Static provider mapping - mimics the Providers table in legacy PMS
const providerDirectory: Record<string, Provider> = {
  DDS1: {
    provider_id: 'DDS1',
    first_name: 'John',
    last_name: 'Smith',
  },
  HYG2: {
    provider_id: 'HYG2',
    first_name: 'Jane',
    last_name: 'Lee',
  },
  DDS2: {
    provider_id: 'DDS2',
    first_name: 'Robert',
    last_name: 'Williams',
  },
  HYG1: {
    provider_id: 'HYG1',
    first_name: 'Emily',
    last_name: 'Chen',
  },
};

export function getProviderById(providerId: string): Provider | null {
  return providerDirectory[providerId] || null;
}

// Fallback for unknown providers
export function getProviderOrDefault(providerId: string): Provider {
  const provider = providerDirectory[providerId];

  if (provider) {
    return provider;
  }

  // A temporary placeholder if provider is not found
  return {
    provider_id: providerId,
    first_name: 'Unknown',
    last_name: 'Provider',
  };
}
