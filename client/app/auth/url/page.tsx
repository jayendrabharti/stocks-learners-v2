"use client";

import ApiClient from "@/utils/ApiClient";
import { useEffect } from "react";
import { toast } from "sonner";

export default function GoogleUrlRedirect() {
  useEffect(() => {
    ApiClient.get("/auth/google/url?type=redirect")
      .then((response) => {
        window.open(response.data.url, "googleLogin", "width=600,height=600");
      })
      .catch(() => {
        toast.error("Unable to open login", {
          description: "Please disable popup blockers and try again.",
        });
      });
  }, []);

  return <div>Redirecting to Google...</div>;
}
