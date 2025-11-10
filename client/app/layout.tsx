import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import FloatingSearch from "@/components/Search/FloatingSearch";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { DataProvider } from "@/providers/DataProvider";
import SessionProvider from "@/providers/SessionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stocks Learners",
  description: "Learn stock trading with Stocks Learners",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning lang="en" className="h-full overflow-hidden">
      <body
        className={cn(
          "flex h-full w-full flex-col overflow-hidden",
          `${geistSans.variable} ${geistMono.variable} antialiased`,
        )}
      >
        <SessionProvider>
          <DataProvider>
            <ThemeProvider>
              {children}
              <Toaster richColors />
            </ThemeProvider>
          </DataProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
