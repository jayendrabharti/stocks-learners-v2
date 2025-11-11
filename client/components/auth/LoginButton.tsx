import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogInIcon } from "lucide-react";
import { usePathname } from "next/navigation";

export default function LoginButton({
  className = "",
}: {
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <Link href={`/login?redirect=${encodeURIComponent(pathname)}`}>
      <Button variant="outline" className={`rounded-full ${className}`}>
        Log In <LogInIcon />
      </Button>
    </Link>
  );
}
