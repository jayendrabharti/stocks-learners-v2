"use client";

import useIsMobile from "@/hooks/useIsMobile";
import Link from "next/link";

export default function ScrollToSection({
  targetId,
  children,
}: {
  targetId: string;
  children: React.ReactNode;
}) {
  const isMobile = useIsMobile();
  const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isMobile) return;
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <Link href={`#${targetId}`} onClick={scrollTo}>
      {children}
    </Link>
  );
}
