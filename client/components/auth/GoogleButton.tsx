"use client";
import { FcGoogle } from "react-icons/fc";
import { Button } from "@/components/ui/button";
import ApiClient from "@/utils/ApiClient";
import { toast } from "sonner";

export default function GoogleButton({
  className = "",
}: {
  className?: string;
}) {
  const handleGoogleLogin = async () => {
    try {
      const response = await ApiClient.get("/auth/google/url");
      window.location.href = response.data.url;
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
