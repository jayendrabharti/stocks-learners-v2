-- DropIndex
DROP INDEX "Instrument_tradingSymbol_key";

-- CreateIndex
CREATE INDEX "Instrument_tradingSymbol_idx" ON "Instrument"("tradingSymbol");
