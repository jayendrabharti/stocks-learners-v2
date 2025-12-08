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
import { ErrorAlertDialog } from "@/components/ui/error-alert-dialog";

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
  const [exchangeRate, setExchangeRate] = useState<number>(1.0);
  const [loading, setLoading] = useState(true);
  const [errorDialog, setErrorDialog] = useState<{
    message: string;
    errorCode?: string;
  } | null>(null);

  useEffect(() => {
    if (!amount) {
      setError("Amount not specified.");
      setLoading(false);
      return;
    }

    // Fetch settings and create order
    const init = async () => {
      try {
        // Get exchange rate first
        const settingsRes = await ApiClient.get("/settings");
        const rate = settingsRes.data.exchangeRate || 1.0;
        setExchangeRate(rate);

        // Create order
        const orderRes = await ApiClient.get(`/payment/create-order?amount=${amount}`);
        console.log(orderRes.data.order);
        setOrder(orderRes.data.order);
      } catch (err) {
        console.error(err);
        setError("Failed to initialize payment. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [amount]);

  if (error) {
    return (
      <Alert variant="destructive" className="w-max">
        <AlertCircleIcon />
        <AlertTitle>Unable to process your payment.</AlertTitle>
        <AlertDescription>{error || "Amount not found."}</AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <Card className="w-96">
        <CardContent className="flex flex-col items-center justify-center h-40 gap-4">
          <Spinner />
          <p className="text-muted-foreground">Preparing payment...</p>
        </CardContent>
      </Card>
    );
  }

  const paymentHandler = (response: any) => {
    const { razorpay_order_id, razorpay_payment_id } = response;

    if (!razorpay_order_id && !razorpay_payment_id) {
      toast.error("Payment failed. Please try again.");
      return;
    }

    // Verify order
    // We don't need to pass amount here anymore as backend calculates it from payment
    // But keeping it for consistency if needed, though backend ignores it for calculation now
    ApiClient.get(
      `/payment/verify-order?payment_id=${razorpay_payment_id}`,
    ).then((res) => {
      console.log(res);
      if (res.data.success) {
        const deposited = res.data.depositedAmount;
        toast.success(`Payment successful! Added ${deposited} credits to your wallet.`);
        router.push("/portfolio");
      } else {
        toast.error("Payment verification failed. Please contact support.");
      }
    }).catch(err => {
      setErrorDialog({
        message: err?.response?.data?.error?.message || "Payment verification failed",
        errorCode: err?.response?.data?.error?.code || "PAYMENT_VERIFICATION_FAILED",
      });
    });
  };

  const handlePayment = () => {
    if (!order || !amount) return;

    try {
      setProcessing(true);
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
        amount: order.amount, // Use amount from order (in paise)
        currency: order.currency,
        name: "Stocks Learners",
        description: "Wallet Funding",
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

  // Calculate display values
  const payableAmountINR = order ? order.amount / 100 : 0;

  return (
    <Card className="w-full max-w-md mx-auto mt-10">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <CardContent className="flex flex-col gap-6 pt-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Add Funds</h1>
          <p className="text-muted-foreground">Complete your payment to add funds</p>
        </div>

        <div className="space-y-4 rounded-lg border p-4 bg-muted/50">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Amount to Add:</span>
            <span className="font-medium">{Number(amount).toLocaleString()} Credits</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Exchange Rate:</span>
            <span className="font-medium">1 INR = {exchangeRate} Credits</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-bold text-lg">
            <span>You Pay:</span>
            <span>₹{payableAmountINR.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        <Button
          className="w-full text-lg py-6"
          onClick={handlePayment}
          disabled={processing || !order}
        >
          {processing ? (
            <>
              <Spinner className="mr-2" /> Processing...
            </>
          ) : (
            `Pay ₹${payableAmountINR.toLocaleString('en-IN')}`
          )}
        </Button>
        
        <p className="text-xs text-center text-muted-foreground">
          Secured by Razorpay
        </p>
      </CardContent>
      
      {/* Error Alert Dialog */}
      {errorDialog && (
        <ErrorAlertDialog
          open={!!errorDialog}
          onOpenChange={(open) => !open && setErrorDialog(null)}
          message={errorDialog.message}
          errorCode={errorDialog.errorCode}
        />
      )}
    </Card>
  );
}
