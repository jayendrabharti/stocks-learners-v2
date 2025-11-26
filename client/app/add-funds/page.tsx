"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import ApiClient from "@/utils/ApiClient";
import { useSession } from "@/providers/SessionProvider";
import { set } from "zod";
import Script from "next/script";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const amount = searchParams.get("amount");

  const { user } = useSession();
  const router = useRouter();

  const [order, setOrder] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!amount) {
      setError("Amount not specified.");
      return;
    }

    ApiClient.get(`/payment/create-order?amount=${amount}`)
      .then((response) => {
        console.log(response.data.order);
        setOrder(response.data.order);
      })
      .catch(() => {
        setError("Failed to create order. Please try again.");
      });
  }, []);

  if (error) {
    return (
      <Alert variant="destructive" className="w-max">
        <AlertCircleIcon />
        <AlertTitle>Unable to process your payment.</AlertTitle>
        <AlertDescription>{error || "Amount not found."}</AlertDescription>
      </Alert>
    );
  }

  const paymentHandler = (response: any) => {
    const { razorpay_order_id, razorpay_payment_id } = response;

    if (!razorpay_order_id && !razorpay_payment_id) {
      toast.error("Payment failed. Please try again.");
    }
    ApiClient.get(
      `/payment/verify-order?amount=${amount}&order_id=${razorpay_order_id}&payment_id=${razorpay_payment_id}`,
    ).then((res) => {
      console.log(res);
      if (res.data.success) {
        toast.success("Payment successful! You are now registered.");
        router.push("/portfolio");
      } else {
        toast.error("Payment verification failed. Please contact support.");
      }
    });
  };

  const handlePayment = () => {
    if (!order || !amount) return;

    try {
      setProcessing(true);
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
        amount: Number(amount) * 100,
        currency: "INR",
        name: "Stocks Learners",
        description: "Registration Payment",
        order_id: order.id,
        handler: paymentHandler,
        prefill: {
          name: user?.name || "",
          email: user?.email,
          contact: user?.phone || "",
        },
        theme: {
          color: "#3399cc",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      setError("Payment gateway failed to load. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card className="w-max max-w-full">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <CardContent className="flex max-w-full flex-col gap-6">
        <span className="mx-auto text-2xl font-bold">
          Pay to get registered
        </span>
        <Button
          className="text-lg"
          onClick={handlePayment}
          disabled={processing}
        >
          Pay ₹{amount}
          {processing && <Spinner />}
        </Button>
      </CardContent>
    </Card>
  );
}
