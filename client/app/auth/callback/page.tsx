"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function GoogleCallback() {
  const [status, setStatus] = useState<"sending" | "success" | "fallback">(
    "sending",
  );

  useEffect(() => {
    let messageSent = false;

    const sendAuthMessage = () => {
      // Method 1: Try window.opener.postMessage (may be blocked by COOP)
      try {
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(
            "logged-in-successfully",
            window.location.origin,
          );
          messageSent = true;
        }
      } catch (e) {
        console.log("window.opener not available:", e);
      }

      // Method 2: BroadcastChannel (not supported in Safari < 15.4)
      try {
        if (typeof BroadcastChannel !== "undefined") {
          const channel = new BroadcastChannel("google-auth-channel");
          channel.postMessage("logged-in-successfully");
          channel.close();
          messageSent = true;
        }
      } catch (e) {
        console.log("BroadcastChannel not available:", e);
      }

      // Method 3: localStorage event (works in ALL browsers as fallback)
      try {
        // Set a unique timestamp to ensure the storage event fires
        const timestamp = Date.now().toString();
        localStorage.setItem("google-auth-success", timestamp);
        // Clean up after a short delay
        setTimeout(() => {
          localStorage.removeItem("google-auth-success");
        }, 2000);
        messageSent = true;
      } catch (e) {
        console.log("localStorage not available:", e);
      }

      return messageSent;
    };

    const sent = sendAuthMessage();

    if (sent) {
      setStatus("success");
      // Close popup after ensuring message was sent
      setTimeout(() => {
        window.close();
        // If popup didn't close (some browsers block this), show fallback message
        setTimeout(() => {
          setStatus("fallback");
        }, 1000);
      }, 800);
    } else {
      setStatus("fallback");
    }
  }, []);

  if (status === "fallback") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <CheckCircle2 className="mb-4 h-16 w-16 text-green-500" />
        <h1 className="mb-2 text-xl font-semibold">Login Successful!</h1>
        <p className="text-muted-foreground mb-4">
          You can close this window and refresh the main page.
        </p>
        <button
          onClick={() => window.close()}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2"
        >
          Close Window
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Loader2 className="text-primary mb-4 h-8 w-8 animate-spin" />
      <p className="text-muted-foreground">Signing you in...</p>
    </div>
  );
}
