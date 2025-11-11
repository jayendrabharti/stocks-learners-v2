"use client";

import { useEffect } from "react";

export default function GoogleCallback() {
  useEffect(() => {
    // Try window.opener (may be blocked by COOP)
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(
        "logged-in-successfully",
        window.location.origin,
      );
    }

    // BroadcastChannel (works even with COOP restrictions)
    const channel = new BroadcastChannel("google-auth-channel");
    channel.postMessage("logged-in-successfully");
    channel.close();

    // Close popup after message is sent
    setTimeout(() => {
      window.close();
    }, 500);
  }, []);

  return <p>Signing you in...</p>;
}
