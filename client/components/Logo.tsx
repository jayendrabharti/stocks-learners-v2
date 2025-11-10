"use client";
import { cn } from "@/lib/utils";
import { appName } from "@/utils/data";
import { anurati } from "@/utils/fonts";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Logo() {
  const [mounted, setMounted] = useState(false);
  const [imgSize, setImgSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const logoSrc = "/logos/stocks-learners-logo.png";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const img = new window.Image();
    img.src = logoSrc;
    img.onload = () => {
      const maxHeight = 40; // fit within navbar height
      const aspectRatio = img.width / img.height;
      let height = maxHeight;
      let width = Math.round(maxHeight * aspectRatio);
      setImgSize({ width, height });
    };
  }, [logoSrc, mounted]);

  // Show text logo during SSR and before dimensions are calculated
  if (!mounted || !imgSize) {
    return (
      <Link
        href={"/"}
        className={cn("text-foreground text-xl font-bold", anurati.className)}
      >
        {appName}
      </Link>
    );
  }

  return (
    <Link href={"/"} className="flex w-max flex-row items-center gap-2">
      <Image
        src={logoSrc}
        alt={`${appName} Logo`}
        width={imgSize.width}
        height={imgSize.height}
        className="h-auto w-auto object-contain"
        style={{ maxHeight: "40px" }}
        priority
      />
      <span
        className={cn(
          "text-foreground hidden text-xl font-bold sm:block md:hidden lg:block",
        )}
      >
        Stocks&nbsp;Learners
      </span>
    </Link>
  );
}
