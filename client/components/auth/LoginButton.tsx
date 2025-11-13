"use client";

import { Button } from "@/components/ui/button";
import { LogInIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import GoogleButton from "./GoogleButton";
import { ButtonGroup } from "../ui/button-group";
import { cn } from "@/lib/utils";

export default function LoginButton({
  className = "",
  rounded = true,
}: {
  className?: string;
  rounded?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const handleClick = () => {
    router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
  };

  return (
    <ButtonGroup className={cn(className, "rounded-full")}>
      <Button
        variant={"outline"}
        onClick={handleClick}
        className={cn(rounded ? "rounded-l-full" : "")}
      >
        <LogInIcon />
        Log In
      </Button>
      <GoogleButton
        type={"refresh"}
        showText={false}
        className={cn(rounded ? "rounded-r-full" : "")}
      />
    </ButtonGroup>
  );
}
