/**
 * Instrument Metadata Utilities
 * Shared logic for fetching instrument metadata and titles
 */

import ApiClient from "./ApiClient";

export interface InstrumentMetadata {
  displayName?: string;
  logoUrl?: string;
  [key: string]: any;
}

export interface MetadataResult {
  metadataMap: Record<string, InstrumentMetadata>;
  titleMap: Record<string, string>;
}

interface InstrumentLike {
  id?: string;
  searchId?: string | null;
  tradingSymbol: string;
  segment: string;
}

interface PositionLike {
  id: string;
  instrument: InstrumentLike;
}

/**
 * Fetches metadata and titles for a list of positions/holdings
 * Uses instrument.id as key for PortfolioHoldings, position.id for HoldingsSection
 *
 * @param positions - Array of positions with instrument data
 * @param useInstrumentIdAsKey - If true, uses instrument.id as key, else uses position.id
 * @returns Object containing metadataMap and titleMap
 */
export async function fetchInstrumentMetadata(
  positions: PositionLike[],
  useInstrumentIdAsKey: boolean = false,
): Promise<MetadataResult> {
  const newMetadata: Record<string, InstrumentMetadata> = {};
  const newTitles: Record<string, string> = {};

  const fetchPromises = positions.map(async (position) => {
    const key = useInstrumentIdAsKey
      ? position.instrument.id || position.id
      : position.id;

    try {
      const searchId =
        position.instrument.searchId ||
        position.instrument.tradingSymbol.toLowerCase();

      const metadataResponse = await ApiClient.get(
        `/metadata?search_id=${encodeURIComponent(searchId)}`,
      );

      if (position.instrument.segment === "CASH") {
        newTitles[key] = metadataResponse.data.displayName;
      } else {
        // For FNO, get the title from search
        const searchResponse = await ApiClient.get("/search", {
          params: { query: position.instrument.tradingSymbol, size: 1 },
        });
        const { success, instruments } = searchResponse.data;
        if (success && instruments[0]) {
          newTitles[key] = instruments[0].title;
        }
      }

      newMetadata[key] = metadataResponse.data;
    } catch (error) {
      // Metadata not found - logo will not be displayed
      console.debug(
        `Metadata not found for ${position.instrument?.tradingSymbol || key}`,
      );
    }
  });

  await Promise.all(fetchPromises);

  return {
    metadataMap: newMetadata,
    titleMap: newTitles,
  };
}

/**
 * Gets the URL for an instrument based on its type
 * @param instrument - Instrument data
 * @returns URL path for the instrument
 */
export function getInstrumentUrl(instrument: InstrumentLike): string {
  const { tradingSymbol, segment } = instrument;
  const searchId = instrument.searchId || tradingSymbol.toLowerCase();

  // Determine the base path based on instrument type/segment
  if (segment === "FNO") {
    // For F&O, we need to determine if it's options or futures
    // This is a simplified version - you may need to enhance this
    if (tradingSymbol.includes("CE") || tradingSymbol.includes("PE")) {
      return `/options/${encodeURIComponent(searchId)}`;
    }
    return `/futures/${encodeURIComponent(searchId)}`;
  }

  // Default to stocks for CASH segment
  return `/stocks/${encodeURIComponent(searchId)}`;
}

/**
 * Gets display name for an instrument, with fallback
 * @param instrument - Instrument data
 * @param titleMap - Map of titles from metadata fetch
 * @param key - Key to look up in titleMap
 * @returns Display name or fallback
 */
export function getInstrumentDisplayName(
  instrument: InstrumentLike,
  titleMap: Record<string, string>,
  key: string,
): string {
  return titleMap[key] || instrument.tradingSymbol;
}
