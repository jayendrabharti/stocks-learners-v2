/**
 * Metadata Service
 * Provides reusable functions to fetch company metadata
 */

export interface MetadataOptions {
  searchId: string;
}

export interface CompanyMetadata {
  [key: string]: unknown;
}

/**
 * Fetches company metadata by search ID
 * @param options - Configuration options
 * @param options.searchId - The search ID of the company
 * @returns Promise with company metadata
 */
export const fetchCompanyMetadata = async (
  options: MetadataOptions
): Promise<CompanyMetadata> => {
  const { searchId } = options;

  if (!searchId) {
    throw new Error("search_id parameter is required");
  }

  const searchUrl = `https://groww.in/v1/api/stocks_data/v1/company/search_id/${searchId}?fields=COMPANY_HEADER&page=0&size=10`;

  const response = await fetch(searchUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch company metadata: ${response.statusText}`);
  }

  const data = (await response.json()) as {
    header?: Record<string, unknown>;
  };

  return data.header ?? {};
};
