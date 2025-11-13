"use client";

import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScrollToTopProps {
  mainRef: React.RefObject<HTMLElement | null>;
}

export default function ScrollToTop({ mainRef }: ScrollToTopProps) {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = (e: Event) => {
    const target = e.target as HTMLElement;
    if (target.scrollTop > 100) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  useEffect(() => {
    const currentRef = mainRef.current;
    if (currentRef) {
      currentRef.addEventListener("scroll", toggleVisibility);
    }
    return () => {
      if (currentRef) {
        currentRef.removeEventListener("scroll", toggleVisibility);
      }
    };
  }, [mainRef]);

  const scrollToTop = () => {
    mainRef.current?.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      onClick={() => {
        if (isVisible) scrollToTop();
      }}
      className={cn(
        `bg-primary fixed right-6 bottom-6 z-1000000 cursor-pointer rounded-full p-2 text-white shadow-lg transition-all duration-200`,
        isVisible ? "opacity-100" : "opacity-0",
      )}
    >
      <ArrowUp className="size-6 sm:size-8" />
    </button>
  );
}
