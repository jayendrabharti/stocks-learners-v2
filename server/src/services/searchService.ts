/**
 * Search Service
 * Provides reusable functions for global search across instruments
 */

export interface SearchOptions {
  query: string;
  from?: number;
  size?: number;
  web?: boolean;
}

export interface SearchResult {
  content: any[];
}

/**
 * Performs a global search for instruments
 * @param options - Configuration options
 * @param options.query - The search query string
 * @param options.from - Starting offset for results (default: 0)
 * @param options.size - Number of results to return (default: 20)
 * @param options.web - Web flag (default: true)
 * @returns Promise with search results
 */
export const performGlobalSearch = async (
  options: SearchOptions
): Promise<SearchResult> => {
  const { query, from = 0, size = 20, web = true } = options;

  if (!query || typeof query !== "string") {
    throw new Error("Query parameter is required and must be a string");
  }

  // Make request to Groww's global search API
  const growwSearchUrl = `https://groww.in/v1/api/search/v3/query/global/st_query?from=${from}&query=${encodeURIComponent(
    query
  )}&size=${size}&web=${web}`;

  const growwResponse = await fetch(growwSearchUrl, {
    method: "GET",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "application/json",
    },
  });

  if (!growwResponse.ok) {
    throw new Error(`Groww API responded with status: ${growwResponse.status}`);
  }

  const searchData = await growwResponse.json();

  const responseData = (searchData as any)?.data || searchData;

  return {
    content: responseData.content || [],
  };
};
