"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";
import ApiClient from "@/utils/ApiClient";
import AuthGuard from "@/auth/AuthGuard";

type VerificationStatus = "verifying" | "success" | "error";

export default function PaymentCallbackPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventSlug = params.slug as string;

  const [status, setStatus] = useState<VerificationStatus>("verifying");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    try {
      // Get Razorpay callback parameters
      const razorpay_payment_link_id = searchParams.get(
        "razorpay_payment_link_id",
      );
      const razorpay_payment_link_reference_id = searchParams.get(
        "razorpay_payment_link_reference_id",
      );
      const razorpay_payment_link_status = searchParams.get(
        "razorpay_payment_link_status",
      );
      const razorpay_payment_id = searchParams.get("razorpay_payment_id");
      const razorpay_signature = searchParams.get("razorpay_signature");

      // Check if payment was cancelled or failed
      if (!razorpay_payment_id || razorpay_payment_link_status !== "paid") {
        setStatus("error");
        setErrorMessage(
          razorpay_payment_link_status === "cancelled"
            ? "Payment was cancelled"
            : "Payment was not completed",
        );
        return;
      }

      // Verify payment with backend
      const response = await ApiClient.get("/payment/event/verify-link", {
        params: {
          razorpay_payment_link_id,
          razorpay_payment_link_reference_id,
          razorpay_payment_link_status,
          razorpay_payment_id,
          razorpay_signature,
        },
      });

      if (response.data.success) {
        setStatus("success");
        toast.success("Registration successful!", {
          description: "Your event account has been created.",
        });
      } else {
        throw new Error(response.data.error?.message || "Verification failed");
      }
    } catch (error: any) {
      console.error("Payment verification error:", error);
      setStatus("error");
      setErrorMessage(
        error.response?.data?.error?.message ||
          error.message ||
          "Failed to verify payment. Please contact support.",
      );
    }
  };

  const handleContinue = () => {
    router.push(`/events/${eventSlug}`);
  };

  const handleRetry = () => {
    router.push(`/events/${eventSlug}/register`);
  };

  return (
    <div className="container mx-auto flex min-h-[60vh] max-w-md items-center justify-center px-4 py-8">
      <AuthGuard>
        <Card className="w-full">
          <CardHeader className="text-center">
            {status === "verifying" && (
              <>
                <Loader2 className="mx-auto mb-4 h-16 w-16 animate-spin text-blue-500" />
                <CardTitle>Verifying Payment</CardTitle>
                <CardDescription>
                  Please wait while we confirm your registration...
                </CardDescription>
              </>
            )}

            {status === "success" && (
              <>
                <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-500" />
                <CardTitle className="text-green-600">
                  Registration Successful!
                </CardTitle>
                <CardDescription>
                  Your payment has been verified and your event account is
                  ready.
                </CardDescription>
              </>
            )}

            {status === "error" && (
              <>
                <XCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
                <CardTitle className="text-red-600">
                  Payment Verification Failed
                </CardTitle>
                <CardDescription>{errorMessage}</CardDescription>
              </>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {status === "success" && (
              <Button onClick={handleContinue} className="w-full" size="lg">
                Go to Event
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}

            {status === "error" && (
              <div className="space-y-3">
                <Button onClick={handleRetry} className="w-full" size="lg">
                  Try Again
                </Button>
                <Button
                  onClick={handleContinue}
                  variant="outline"
                  className="w-full"
                >
                  Back to Event
                </Button>
                <p className="text-muted-foreground text-center text-sm">
                  If the payment was deducted, please contact support with your
                  payment ID.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </AuthGuard>
    </div>
  );
}
