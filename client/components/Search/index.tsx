"use client";

import { Loader2, SearchIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../ui/input-group";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "../ui/empty";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import ApiClient from "@/utils/ApiClient";
import { Kbd, KbdGroup } from "../ui/kbd";
import SearchItem from "./SearchItem";

const DEBOUNCE_DELAY = 400;

export default function Search({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState<boolean>(false);
  const [query, setQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Array<any>>([]);
  const [isPending, startTransition] = useTransition();

  const inputRef = useRef<HTMLInputElement | null>(null);
  const latestQueryRef = useRef<string>("");

  const normalizedQuery = query.trim();
  const showSpinner = isPending && Boolean(normalizedQuery);

  const from = 0;
  const size = 20;
  const web = true;

  const handleSearch = useCallback(
    (normalizedQuery: string) => {
      if (!normalizedQuery) {
        setSearchResults([]);
        return;
      }

      startTransition(() => {
        (async () => {
          try {
            const { data } = await ApiClient.get("/search", {
              params: { query: normalizedQuery, from, size, web },
            });

            if (latestQueryRef.current !== normalizedQuery) {
              return;
            }

            const { success, instruments } = data;

            if (success) {
              setSearchResults(instruments || []);
            } else {
              toast.error("Search failed. Please try again.");
            }
          } catch (error) {
            if (latestQueryRef.current === normalizedQuery) {
              toast.error("Search failed. Please try again.");
            }
          }
        })();
      });
    },
    [from, size, web],
  );

  const handleClear = useCallback(() => {
    setQuery("");
    setSearchResults([]);
    latestQueryRef.current = "";
    inputRef.current?.focus();
  }, []);

  const handleClose = (item: any) => {
    setOpen(false);
    setQuery("");
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    latestQueryRef.current = normalizedQuery;

    if (!normalizedQuery) {
      setSearchResults([]);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      handleSearch(normalizedQuery);
    }, DEBOUNCE_DELAY);

    return () => window.clearTimeout(timeoutId);
  }, [handleSearch, normalizedQuery, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 75);

    return () => window.clearTimeout(focusTimer);
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button
            variant={"outline"}
            className={`${className} group rounded-full`}
          >
            <SearchIcon className="size-4" />
            <span>Search</span>
            <KbdGroup>
              <Kbd>Ctrl</Kbd>
              <span>+</span>
              <Kbd>K</Kbd>
            </KbdGroup>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        className="bg-background/95 supports-backdrop-filter:bg-background/60 flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border p-0 shadow-2xl backdrop-blur"
      >
        <div className="bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-10 border-b p-4 backdrop-blur">
          <div className="flex items-start justify-between gap-4 pb-4">
            <DialogHeader className="gap-1 p-0 text-left">
              <DialogTitle className="text-lg font-semibold">
                Search instruments
              </DialogTitle>
              <DialogDescription>
                Find stocks, indices, futures, options, and more.
              </DialogDescription>
            </DialogHeader>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" aria-label="Close search">
                <XIcon className="size-4" />
              </Button>
            </DialogClose>
          </div>
          <InputGroup className="bg-background focus-within:border-primary/50 h-12 overflow-hidden rounded-xl border shadow-sm transition focus-within:shadow-md">
            <InputGroupAddon className="text-muted-foreground pl-4">
              <SearchIcon className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search stocks, indices, futures, and options..."
              className="h-full text-base"
            />
            <InputGroupAddon align="inline-end" className="pr-2">
              <Button
                variant="ghost"
                size="icon"
                className={`text-muted-foreground hover:text-foreground transition ${
                  query.length === 0 ? "pointer-events-none opacity-0" : ""
                }`}
                aria-label="Clear search"
                disabled={query.length === 0}
                onClick={handleClear}
              >
                <XIcon className="size-4" />
              </Button>
            </InputGroupAddon>
          </InputGroup>
        </div>

        <div className="bg-muted/10 flex-1 overflow-y-auto px-4 py-4">
          {showSpinner ? (
            <div className="text-muted-foreground flex h-full min-h-[200px] items-center justify-center">
              <Loader2 className="size-6 animate-spin" />
            </div>
          ) : searchResults.length === 0 ? (
            <Empty className="bg-background/80 mx-auto w-full max-w-md rounded-xl border border-dashed text-center">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <SearchIcon />
                </EmptyMedia>
                <EmptyTitle>
                  {normalizedQuery ? "No results found" : "Ready to search"}
                </EmptyTitle>
                <EmptyDescription>
                  {normalizedQuery
                    ? "Try adjusting your search to find what you're looking for."
                    : "Start typing to discover instruments across markets."}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <DialogClose asChild>
                  <Button variant="outline" size="sm">
                    Close
                    <XIcon className="size-4" />
                  </Button>
                </DialogClose>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="space-y-3">
              {searchResults.map((item) => (
                <SearchItem key={item.id} item={item} onClick={handleClose} />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
