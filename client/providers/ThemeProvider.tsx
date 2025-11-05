"use client";

import { ThemeProvider as NextThemeProvider } from "next-themes";
import { Fragment, useEffect, useState } from "react";

export function ThemeProvider({
  children,
  defaultTheme = "dark",
}: Readonly<{
  children: React.ReactNode;
  defaultTheme?: "light" | "dark";
}>) {
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <NextThemeProvider
      attribute="class"
      storageKey="theme"
      defaultTheme={defaultTheme}
    >
      <Fragment key={mounted ? "mounted" : "unmounted"}>{children}</Fragment>
    </NextThemeProvider>
  );
}
