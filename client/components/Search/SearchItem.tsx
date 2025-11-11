import { on } from "events";
import { PiIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function SearchItem({
  item,
  onClick,
}: {
  item: any;
  onClick?: (item: any) => void;
}) {
  const {
    itemType,
    ItemIcon,
    href,
  }: {
    itemType: string;
    ItemIcon: React.ElementType;
    href: string | null;
  } = (function () {
    switch (item.entity_type) {
      case "Stocks":
        return {
          itemType: "Stock",
          ItemIcon: PiIcon,
          href: `/stocks/${item.search_id}`,
        };
      case "Index":
        return {
          itemType: "Index",
          ItemIcon: PiIcon,
          href: `/indices/${item.search_id}`,
        };
      case "Future":
        return {
          itemType: "Future",
          ItemIcon: PiIcon,
          href: `/futures/${item.underlying_search_id}/${item.id}`,
        };
      case "Option":
        return {
          itemType: "Option",
          ItemIcon: PiIcon,
          href: `/options/${item.underlying_search_id}/${item.id}`,
        };
      case "OPTION_CHAIN":
        return {
          itemType: "Option Chain",
          ItemIcon: PiIcon,
          href: `/options/${item.search_id}`,
        };
      case "IPO":
        return { itemType: "IPO", ItemIcon: PiIcon, href: null };
      default:
        return { itemType: "Unknown", ItemIcon: SearchIcon, href: null };
    }
  })();

  const Item = ({ onClick }: { onClick?: () => void }) => {
    return (
      <div
        className="border-border bg-card hover:border-primary/50 hover:bg-muted flex cursor-pointer items-center gap-4 rounded-xl border px-4 py-3 shadow-sm transition hover:shadow-md active:scale-90"
        onClick={onClick}
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
  };

  if (href)
    return (
      <Link href={href}>
        <Item
          onClick={() => {
            onClick && onClick(item);
          }}
        />
      </Link>
    );
  return (
    <Item
      onClick={() => {
        toast.message("No page for this instrument.");
        onClick && onClick(item);
      }}
    />
  );
}
