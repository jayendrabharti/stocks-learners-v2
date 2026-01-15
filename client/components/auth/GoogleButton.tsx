"use client";
import { FcGoogle } from "react-icons/fc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSession } from "@/providers/SessionProvider";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useCallback } from "react";
import ApiClient from "@/utils/ApiClient";

function GoogleButtonInner({
  className = "",
  type = "redirect",
  showText = true,
}: {
  className?: string;
  type?: "redirect" | "refresh";
  showText?: boolean;
}) {
  const redirect = useSearchParams().get("redirect");
  const router = useRouter();
  const { refreshSession } = useSession();
  const hasHandledLogin = useRef(false);
  const popupRef = useRef<Window | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Memoized login handler to prevent duplicate calls
  const handleLoginSuccess = useCallback(async () => {
    if (hasHandledLogin.current) return;
    hasHandledLogin.current = true;

    // Clear polling if active
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    toast.success("Logged in with Google successfully!");
    await refreshSession();

    if (type === "redirect") {
      router.push(redirect || "/stocks");
    }

    // Reset after a delay to allow for future logins
    setTimeout(() => {
      hasHandledLogin.current = false;
    }, 2000);
  }, [redirect, router, refreshSession, type]);

  useEffect(() => {
    // Method 1: Listen to window.postMessage
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data === "logged-in-successfully") {
        await handleLoginSuccess();
      } else if (event.data === "logged-in-failed") {
        toast.error("Login unsuccessful", {
          description: "Unable to sign in with Google. Please try again.",
        });
      }
    };
    window.addEventListener("message", handleMessage);

    // Method 2: BroadcastChannel (not supported in Safari < 15.4)
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== "undefined") {
        channel = new BroadcastChannel("google-auth-channel");
        channel.onmessage = async (event) => {
          if (event.data === "logged-in-successfully") {
            await handleLoginSuccess();
          }
        };
      }
    } catch (e) {
      // BroadcastChannel not supported
    }

    // Method 3: localStorage event (works in ALL browsers)
    const handleStorageChange = async (event: StorageEvent) => {
      if (event.key === "google-auth-success" && event.newValue) {
        await handleLoginSuccess();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // Cleanup
    return () => {
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("storage", handleStorageChange);
      if (channel) {
        try {
          channel.close();
        } catch (e) {
          // Ignore close errors
        }
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [handleLoginSuccess]);

  const handleGoogleLogin = async () => {
    // Reset the handled flag when starting a new login
    hasHandledLogin.current = false;

    try {
      const response = await ApiClient.get("/auth/google/url");
      popupRef.current = window.open(
        response.data.url,
        "googleLogin",
        "width=500,height=600,left=100,top=100",
      );

      // Method 4: Polling fallback - check if popup closed and user is now logged in
      // This handles cases where all message-based methods fail
      if (popupRef.current) {
        pollIntervalRef.current = setInterval(async () => {
          try {
            // Check if popup is closed
            if (popupRef.current?.closed) {
              if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
              }

              // If we haven't handled login yet, try refreshing session
              // This catches the case where the popup closed but messages didn't come through
              if (!hasHandledLogin.current) {
                // Small delay to let any pending messages arrive first
                setTimeout(async () => {
                  if (!hasHandledLogin.current) {
                    // Try to refresh - if user is logged in, this will work
                    await refreshSession();
                  }
                }, 500);
              }
            }
          } catch (e) {
            // Popup access error - clear interval
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
          }
        }, 500);
      }
    } catch {
      toast.error("Unable to open login", {
        description: "Please disable popup blockers and try again.",
      });
    }
  };

  return (
    <Button
      variant={"outline"}
      type={"button"}
      className={className}
      onClick={handleGoogleLogin}
    >
      <FcGoogle />
      {showText && "Continue with Google"}
    </Button>
  );
}

export default function GoogleButton(props: {
  className?: string;
  type?: "redirect" | "refresh";
  showText?: boolean;
}) {
  return (
    <Suspense
      fallback={
        <Button variant="outline" disabled className={props.className}>
          <FcGoogle />
          {props.showText !== false && "Continue with Google"}
        </Button>
      }
    >
      <GoogleButtonInner {...props} />
    </Suspense>
  );
}
