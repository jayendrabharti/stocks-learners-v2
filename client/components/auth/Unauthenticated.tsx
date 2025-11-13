import { BanIcon } from "lucide-react";
import LoginButton from "./LoginButton";

export default function Unauthenticated({
  title = "Unauthenticated",
  description = "You must be logged in to access this page.",
}) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-20">
      <BanIcon className="size-16 text-red-500" />
      <span className="text-2xl font-bold text-red-500">{title}</span>
      <span className="text-muted-foreground text-sm">{description}</span>
      <LoginButton />
    </div>
  );
}
