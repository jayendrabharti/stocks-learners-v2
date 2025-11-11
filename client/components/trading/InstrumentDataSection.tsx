"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckIcon, Link2Icon, PlusIcon, SaveIcon } from "lucide-react";
import { MdError } from "react-icons/md";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { useInstrument } from "./InstrumentProvider";

const timeRangeName: Record<HistoricalDataTimeRange, string> = {
  "1D": "Today",
  "1W": "1 Week",
  "1M": "1 Month",
  "3M": "3 Months",
  "6M": "6 Months",
  "1Y": "1 Year",
  "3Y": "3 Years",
  "5Y": "5 Years",
  ALL: "All Time",
};

const instrumentTypeName: Record<InstrumentType, string> = {
  EQ: "Stock",
  IDX: "Index",
  CE: "Call Option",
  PE: "Put Option",
  FUT: "Future",
};

export function InstrumentDataSection() {
  const {
    metadata,
    metadataError,
    instruments,
    exchange,
    setExchange,
    liveData,
    liveDataError,
    historicalData,
    historicalDataError,
    timeRange,
    setTimeRange,
    currentPrice,
    positiveChange,
    changeValue,
    changePerc,
    title,
    watchlist,
    toggleWatchlist,
    formatTimeStamp,
    refetchHistoricalData,
    availableTimeRanges,
    type,
  } = useInstrument();

  return (
    <div className="w-full max-w-full px-4">
      {/* header */}
      <div className="flex flex-row flex-wrap justify-between gap-2 px-2 py-6">
        <div className="flex flex-col gap-2">
          {metadataError ? (
            <div className="border-destructive bg-destructive/10 flex items-center gap-2 rounded-lg border p-3">
              <MdError className="text-destructive size-5" />
              <span className="text-destructive text-sm">{metadataError}</span>
            </div>
          ) : metadata?.logoUrl ? (
            <img
              src={metadata.logoUrl}
              alt={metadata.searchId ?? "searchId"}
              className="size-20 rounded-lg"
            />
          ) : (
            <Skeleton className="size-20 rounded-lg" />
          )}
          {title ? (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-semibold">{title}</span>
              <Badge variant="secondary">{instrumentTypeName[type]}</Badge>
            </div>
          ) : (
            <Skeleton className="h-8 w-48" />
          )}
          <div className="flex flex-row items-baseline gap-2 text-sm">
            {liveDataError ? (
              <div className="border-destructive bg-destructive/10 flex items-center gap-2 rounded border px-2 py-1">
                <MdError className="text-destructive size-4" />
                <span className="text-destructive text-xs">
                  {liveDataError}
                </span>
              </div>
            ) : liveData ? (
              <>
                <span className="text-3xl font-bold">₹{currentPrice}</span>
                <span
                  className={
                    positiveChange ? "text-green-600" : "text-destructive"
                  }
                >
                  {positiveChange && "+"}
                  {changeValue.toFixed(2)} ({changePerc.toFixed(2)}%)
                </span>
                {timeRangeName[timeRange]}
              </>
            ) : (
              <>
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-6 w-24" />
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col flex-wrap items-end gap-2">
          <Button
            variant={watchlist ? "default" : "outline"}
            onClick={toggleWatchlist}
            size={"sm"}
            disabled={!metadata}
          >
            <SaveIcon />
            Watchlist
            {watchlist ? <CheckIcon /> : <PlusIcon />}
          </Button>
          <Button size={"sm"} variant={"link"} disabled={!metadata}>
            <Link2Icon />
            Option Chain
          </Button>
          {instruments && instruments.length > 1 ? (
            <div className="flex flex-row gap-2">
              <Button
                size={"sm"}
                variant={exchange === "NSE" ? "default" : "outline"}
                onClick={() => {
                  setExchange("NSE");
                }}
              >
                NSE
              </Button>
              <Button
                size={"sm"}
                variant={exchange === "BSE" ? "default" : "outline"}
                onClick={() => {
                  setExchange("BSE");
                }}
              >
                BSE
              </Button>
            </div>
          ) : (
            <Badge>{exchange}</Badge>
          )}
        </div>
      </div>

      <Separator />

      {/* chart */}
      <div className="flex flex-row flex-wrap justify-center gap-4 py-6">
        {historicalDataError ? (
          <div className="border-destructive bg-destructive/10 flex h-[400px] w-full items-center justify-center rounded-lg border">
            <div className="flex flex-col items-center gap-3">
              <MdError className="text-destructive size-12" />
              <span className="text-destructive text-lg font-medium">
                {historicalDataError}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={refetchHistoricalData}
              >
                Retry
              </Button>
            </div>
          </div>
        ) : historicalData?.candles ? (
          <ChartContainer
            config={{
              price: {
                label: "Price",
                color: positiveChange ? "var(--primary)" : "var(--destructive)",
              },
            }}
            className="h-[400px] w-full"
          >
            <LineChart
              data={historicalData.candles.map((candle: any) => ({
                timestamp: candle[0],
                formattedTime: formatTimeStamp(candle[0], "date"),
                open: candle[1],
                high: candle[2],
                low: candle[3],
                close: candle[4],
                volume: candle[5],
                price: candle[4], // close price for the chart
              }))}
              margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="formattedTime"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => `₹${value}`}
                domain={["auto", "auto"]}
              />
              <ChartTooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="border-border/50 bg-background rounded-lg border px-3 py-2 shadow-xl">
                      <div className="mb-2 text-xs font-medium">
                        {formatTimeStamp(data.timestamp)}
                      </div>
                      <div className="flex justify-between gap-4 text-xs">
                        <span className="text-muted-foreground">Price:</span>
                        <span className="font-mono font-medium">
                          ₹{Number(data.close).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="var(--color-price)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ChartContainer>
        ) : (
          <Skeleton className="h-[400px] w-full rounded-lg" />
        )}
        <Separator />
        <div className="mb-4 flex flex-row gap-2">
          {availableTimeRanges.map((range) => (
            <Button
              key={range}
              size="sm"
              variant={timeRange === range ? "default" : "outline"}
              onClick={() => setTimeRange(range)}
              disabled={!historicalData}
            >
              {range}
            </Button>
          ))}
          {instruments && instruments.length > 1 && (
            <>
              <Separator orientation={"vertical"} className="mx-2" />
              <Button
                size={"sm"}
                variant={exchange === "NSE" ? "default" : "outline"}
                onClick={() => {
                  setExchange("NSE");
                }}
              >
                NSE
              </Button>
              <Button
                size={"sm"}
                variant={exchange === "BSE" ? "default" : "outline"}
                onClick={() => {
                  setExchange("BSE");
                }}
              >
                BSE
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
