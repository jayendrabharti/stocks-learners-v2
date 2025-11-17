import { Request, Response } from "express";
import prisma from "@/database/client";
import {
  fetchInstrumentsBySymbol as fetchFromCSV,
  fetchInstrumentsByIsin as fetchIsinFromCSV,
} from "@/services";
import type {
  Exchange,
  Segment,
  InstrumentType,
} from "@/database/generated/enums";

/**
 * Convert CSV row to database format and insert
 */
const insertInstrumentFromCSV = async (csvRow: any) => {
  const expiry = csvRow.expiry_date ? new Date(csvRow.expiry_date) : null;
  const strike = csvRow.strike_price ? parseFloat(csvRow.strike_price) : null;
  const leverage = csvRow.segment === "FNO" ? 5 : 1;

  return await prisma.instrument.create({
    data: {
      exchange: csvRow.exchange.toUpperCase() as Exchange,
      segment: csvRow.segment.toUpperCase() as Segment,
      series: csvRow.series || null,
      tradingSymbol: csvRow.trading_symbol,
      exchangeToken: csvRow.exchange_token,
      growwSymbol: csvRow.groww_symbol || null,
      name: csvRow.name || null,
      isin: csvRow.isin || null,
      type: csvRow.instrument_type.toUpperCase() as InstrumentType,
      expiry,
      strike,
      underlyingSymbol: csvRow.underlying_symbol || null,
      underlyingExchangeToken: csvRow.underlying_exchange_token || null,
      lotSize: parseInt(csvRow.lot_size) || 1,
      tickSize: parseFloat(csvRow.tick_size) || 0.05,
      freezeQty: parseInt(csvRow.freeze_quantity) || 0,
      buyAllowed: csvRow.buy_allowed === "1" || csvRow.buy_allowed === "true",
      sellAllowed:
        csvRow.sell_allowed === "1" || csvRow.sell_allowed === "true",
      isReserved: csvRow.is_reserved === "1" || csvRow.is_reserved === "true",
      leverage,
    },
  });
};

export const Instruments = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const tradingSymbolInput =
      (req.params.tradingSymbol as string | undefined) ??
      (req.query.tradingSymbol as string | undefined) ??
      (req.query.trading_symbol as string | undefined);

    const isinInput =
      (req.params.isin as string | undefined) ??
      (req.query.isin as string | undefined);

    const searchIdInput = req.query.search_id as string | undefined;

    // At least one of tradingSymbol or isin must be provided
    if (
      (!tradingSymbolInput && !isinInput) ||
      (tradingSymbolInput && typeof tradingSymbolInput !== "string") ||
      (isinInput && typeof isinInput !== "string")
    ) {
      return res.status(400).json({
        error: {
          message: "Either tradingSymbol or isin is required.",
        },
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let instruments: any[] = [];
    let source = "database";

    // Search database first
    if (tradingSymbolInput && isinInput) {
      instruments = await prisma.instrument.findMany({
        where: {
          tradingSymbol: tradingSymbolInput.toUpperCase(),
          isin: isinInput.toUpperCase(),
          OR: [{ expiry: null }, { expiry: { gte: today } }],
        },
      });
    } else if (tradingSymbolInput) {
      instruments = await prisma.instrument.findMany({
        where: {
          tradingSymbol: tradingSymbolInput.toUpperCase(),
          OR: [{ expiry: null }, { expiry: { gte: today } }],
        },
      });
    } else if (isinInput) {
      instruments = await prisma.instrument.findMany({
        where: {
          isin: isinInput.toUpperCase(),
          OR: [{ expiry: null }, { expiry: { gte: today } }],
        },
      });
    }

    // If not found in database, try CSV and auto-insert
    if (instruments.length === 0) {
      console.log(`🔍 Instrument not in DB, checking CSV...`);
      source = "csv-auto-inserted";

      try {
        let csvRows: any[] = [];

        if (tradingSymbolInput) {
          csvRows = await fetchFromCSV(tradingSymbolInput);
        } else if (isinInput) {
          csvRows = await fetchIsinFromCSV(isinInput);
        }

        // Filter non-expired and insert
        for (const csvRow of csvRows) {
          const rowExpiry = csvRow.expiry_date
            ? new Date(csvRow.expiry_date)
            : null;

          // Skip expired instruments
          if (rowExpiry && rowExpiry < today) {
            continue;
          }

          // Check if already exists (race condition handling)
          const existing = await prisma.instrument.findUnique({
            where: { exchangeToken: csvRow.exchange_token },
          });

          if (!existing) {
            const inserted = await insertInstrumentFromCSV(csvRow);
            instruments.push(inserted);
            console.log(`✅ Auto-inserted: ${csvRow.trading_symbol}`);
          } else {
            instruments.push(existing);
          }
        }
      } catch (csvError) {
        console.error("CSV fetch error:", csvError);
      }
    }

    if (instruments.length === 0) {
      return res.status(404).json({
        error: {
          message: "No instruments found for the provided criteria.",
        },
      });
    }

    // Update searchId for instruments that don't have it yet
    if (searchIdInput) {
      for (const instrument of instruments) {
        if (!instrument.searchId) {
          try {
            await prisma.instrument.update({
              where: { id: instrument.id },
              data: { searchId: searchIdInput },
            });
            instrument.searchId = searchIdInput; // Update in-memory for response
            console.log(
              `✅ Updated searchId for ${instrument.tradingSymbol} to ${searchIdInput}`
            );
          } catch (error) {
            console.error(
              `Failed to update searchId for instrument ${instrument.id}:`,
              error
            );
          }
        }
      }
    }

    // Transform to match frontend expected format
    const transformedInstruments = instruments.map((inst) => ({
      exchange: inst.exchange,
      exchange_token: inst.exchangeToken,
      trading_symbol: inst.tradingSymbol,
      groww_symbol: inst.growwSymbol,
      name: inst.name,
      instrument_type: inst.type,
      segment: inst.segment,
      series: inst.series,
      isin: inst.isin,
      search_id: inst.searchId,
      underlying_symbol: inst.underlyingSymbol,
      underlying_exchange_token: inst.underlyingExchangeToken,
      expiry_date: inst.expiry ? inst.expiry.toISOString() : null,
      strike_price: inst.strike?.toString(),
      lot_size: inst.lotSize.toString(),
      tick_size: inst.tickSize.toString(),
      freeze_quantity: inst.freezeQty.toString(),
      is_reserved: inst.isReserved ? "1" : "0",
      buy_allowed: inst.buyAllowed ? "1" : "0",
      sell_allowed: inst.sellAllowed ? "1" : "0",
    }));

    return res.status(200).json({
      instruments: transformedInstruments,
      trading_sysmbol: tradingSymbolInput,
      isin: isinInput,
      source,
    });
  } catch (error) {
    console.error("Error fetching instruments:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve instrument details.",
    });
  }
};
