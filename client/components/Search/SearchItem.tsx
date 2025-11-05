import { PiIcon, SearchIcon } from "lucide-react";

export default function SearchItem({
  item,
  handleClick,
}: {
  item: any;
  handleClick: (trading_symbol: string, item: any, entity_type: string) => void;
}) {
  const itemType: string = (function () {
    switch (item.entity_type) {
      case "Stocks":
        return "Stock";
      case "Index":
        return "Index";
      case "Future":
        return "Future";
      case "Option":
        return "Option";
      case "OPTION_CHAIN":
        return "Option Chain";
      case "IPO":
        return "IPO";
      default:
        return "Unknown";
    }
  })();

  const ItemIcon = (function () {
    switch (item.entity_type) {
      case "Stocks":
        return PiIcon;
      default:
        return SearchIcon;
    }
  })();

  const trading_symbol = (function () {
    switch (item.entity_type) {
      case "Stocks":
        return item.nse_scrip_code;
      case "Index":
        return item.nse_scrip_code;
      default:
        return item.id;
    }
  })();

  return (
    <div
      className="flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3 shadow-sm transition hover:border-primary/50 hover:bg-muted hover:shadow-md"
      onClick={() => handleClick(trading_symbol, item, item.entity_type)}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <ItemIcon className="size-6" />
      </span>
      <div className="flex flex-1 flex-col gap-1">
        <span className="text-base font-medium leading-tight">
          {item.title}
        </span>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>{itemType}</span>
          {item.nse_scrip_code && (
            <span className="font-medium text-foreground">
              {item.nse_scrip_code}
            </span>
          )}
        </div>
      </div>
      <SearchIcon className="size-4 text-muted-foreground/70" />
    </div>
  );
}
