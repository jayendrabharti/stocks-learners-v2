"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import eventsApi, { Event } from "@/services/eventsApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, CreditCard, Trophy, TrendingUp } from "lucide-react";
import AuthGuard from "@/auth/AuthGuard";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function RegisterPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.slug as string; // Using slug from params

  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (eventId) {
      loadEventDetails();
    }
  }, [eventId]);

  const loadEventDetails = async () => {
    try {
      const data = await eventsApi.getEventDetails(eventId);
      setEvent(data);
    } catch (error) {
      console.error("Error loading event:", error);
      alert("Failed to load event details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!event) return;

    setIsProcessing(true);
    try {
      // Create order
      const response = await eventsApi.registerForEvent(event.id); // Use event.id for registration

      // Initialize Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: response.payment.amount,
        currency: response.payment.currency,
        name: "Stocks Learners",
        description: `Registration for ${event.title}`,
        order_id: response.payment.orderId,
        handler: async function (razorpayResponse: any) {
          try {
            // Verify payment using ApiClient which handles auth cookies
            const { default: ApiClient } = await import("@/utils/ApiClient");
            
            await ApiClient.post("/payment/event/verify", {
              razorpay_order_id: razorpayResponse.razorpay_order_id,
              razorpay_payment_id: razorpayResponse.razorpay_payment_id,
              razorpay_signature: razorpayResponse.razorpay_signature,
            });

            alert("Registration successful! Your event account has been created.");
            router.push(`/events/${event.slug}`);
          } catch (error: any) {
            console.error("Payment verification error:", error);
            const errorMessage = error.response?.data?.error?.message || "Payment verification failed. Please contact support.";
            alert(errorMessage);
          }
        },
        prefill: {
          name: "",
          email: "",
        },
        theme: {
          color: "#3399cc",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      console.error("Error initiating registration:", error);
      const errorMessage = error.response?.data?.error?.message || error.message || "Failed to initiate registration";
      alert(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Event not found</h2>
        <Button onClick={() => router.push("/events")}>Back to Events</Button>
      </div>
    );
  }

  if (event.userRegistration?.status === "CONFIRMED") {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <div className="max-w-md mx-auto">
          <Trophy className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Already Registered!</h2>
          <p className="text-muted-foreground mb-6">
            You are already registered for {event.title}. Good luck!
          </p>
          <Button onClick={() => router.push(`/events/${event.slug}`)}>
            Go to Event Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push(`/events/${event.slug}`)}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Event
      </Button>

      {/* Header - Visible to all */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Register for Event</h1>
        <p className="text-muted-foreground">{event.title}</p>
      </div>

      <AuthGuard>
        {/* Registration Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Registration Summary</CardTitle>
            <CardDescription>Review the details before proceeding</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Event</span>
              </div>
              <span>{event.title}</span>
            </div>

            <div className="flex items-center justify-between py-3 border-b">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Registration Fee</span>
              </div>
              <span className="text-lg font-bold">₹{event.registrationFee}</span>
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Initial Trading Balance</span>
              </div>
              <span className="text-lg font-bold text-green-600">
                ₹{event.initialBalance}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Important Info */}
        <Alert className="mb-6">
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Your payment will be processed securely through Razorpay</li>
              <li>A separate trading account will be created for this event</li>
              <li>You can switch between your main account and event accounts</li>
              <li>All trades in this event are isolated from your main account</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Payment Button */}
        <Button
          size="lg"
          className="w-full"
          onClick={handleRegister}
          disabled={isProcessing || event.isFull}
        >
          {isProcessing ? (
            "Processing..."
          ) : (
            <>
              <CreditCard className="h-5 w-5 mr-2" />
              Pay ₹{event.registrationFee} & Register
            </>
          )}
        </Button>

        {event.isFull && (
          <p className="text-center text-destructive mt-4">
            This event is full and no longer accepting registrations
          </p>
        )}

        {/* Razorpay Script */}
        <script src="https://checkout.razorpay.com/v1/checkout.js" async />
      </AuthGuard>
    </div>
  );
}
