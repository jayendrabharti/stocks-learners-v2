"use client";

import Footer from "@/components/Footer";
import Main from "@/components/Main";
import NavBar from "@/components/NavBar";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <Main
      className={cn(
        "flex h-full min-h-0 w-full flex-1 flex-col items-center overflow-x-hidden overflow-y-auto",
      )}
    >
      <NavBar />
      {children}
      <Footer />
    </Main>
  );
}
