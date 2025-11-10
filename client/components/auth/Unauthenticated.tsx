import { BanIcon, LogInIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Unauthenticated() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-20">
      <BanIcon className="size-16 text-red-500" />
      <span className="text-2xl font-bold text-red-500">Unauthenticated</span>
      <span className="text-muted-foreground text-sm">
        You must be logged in to access this page.
      </span>
      <Link href="/login">
        <Button variant="outline" className="rounded-full">
          Log In <LogInIcon />
        </Button>
      </Link>
    </div>
  );
}
