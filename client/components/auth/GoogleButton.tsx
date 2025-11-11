"use client";
import { FcGoogle } from "react-icons/fc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSession } from "@/providers/SessionProvider";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import ApiClient from "@/utils/ApiClient";

export default function GoogleButton({
  className = "",
}: {
  className?: string;
}) {
  const redirect = useSearchParams().get("redirect");
  const router = useRouter();
  const { refreshSession } = useSession();

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data === "logged-in-successfully") {
        toast.success("Logged in with Google successfully!");
        await refreshSession();
        router.push(redirect || "/stocks");
      } else if (event.data === "logged-in-failed") {
        toast.error("Google Login failed. Please try again.");
      }
    };

    // Listen to window.postMessage
    window.addEventListener("message", handleMessage);

    // Also listen to BroadcastChannel (works even with COOP restrictions)
    const channel = new BroadcastChannel("google-auth-channel");
    channel.onmessage = async (event) => {
      if (event.data === "logged-in-successfully") {
        toast.success("Logged in with Google successfully!");
        await refreshSession();
        router.push(redirect || "/stocks");
      }
    };

    return () => {
      window.removeEventListener("message", handleMessage);
      channel.close();
    };
  }, [redirect, router, refreshSession]);

  const handleGoogleLogin = async () => {
    try {
      const response = await ApiClient.get("/auth/google/url");
      window.open(response.data.url, "googleLogin", "width=600,height=600");
    } catch {
      toast.error("Error while Google Login...");
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
      Continue with Google
    </Button>
  );
}
