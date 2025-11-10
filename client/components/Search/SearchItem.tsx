import { PiIcon, SearchIcon } from "lucide-react";

export default function SearchItem({
  item,
  handleClick,
}: {
  item: any;
  handleClick: (item: any) => void;
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
      className="border-border bg-card hover:border-primary/50 hover:bg-muted flex cursor-pointer items-center gap-4 rounded-xl border px-4 py-3 shadow-sm transition hover:shadow-md active:scale-90"
      onClick={() => handleClick(item)}
    >
      <span className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full">
        <ItemIcon className="size-6" />
      </span>
      <div className="flex flex-1 flex-col gap-1">
        <span className="text-base leading-tight font-medium">
          {item.title}
        </span>
        <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
          <span>{itemType}</span>
          {item.nse_scrip_code && (
            <span className="text-foreground font-medium">
              {item.nse_scrip_code}
            </span>
          )}
        </div>
      </div>
      <SearchIcon className="text-muted-foreground/70 size-4" />
    </div>
  );
}
