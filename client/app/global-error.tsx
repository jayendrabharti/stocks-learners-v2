"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ServerCrash, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center p-4">
          <Card className="w-full max-w-md border-rose-200 dark:border-rose-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <ServerCrash className="h-5 w-5" />
                Application Error
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">
                A critical error occurred. Please try refreshing the page.
              </p>
              {process.env.NODE_ENV === "development" && error.message && (
                <details className="text-xs">
                  <summary className="cursor-pointer font-semibold">
                    Error details
                  </summary>
                  <pre className="bg-muted mt-2 overflow-auto rounded p-2">
                    {error.message}
                  </pre>
                </details>
              )}
              <Button onClick={reset} className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  );
}
