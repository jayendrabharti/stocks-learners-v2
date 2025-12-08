"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertCircle, Wallet } from "lucide-react";
import Link from "next/link";

interface ErrorAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  message: string;
  errorCode?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function ErrorAlertDialog({
  open,
  onOpenChange,
  title,
  message,
  errorCode,
  action,
}: ErrorAlertDialogProps) {
  const defaultTitle = getDefaultTitle(errorCode);
  const icon = getErrorIcon(errorCode);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            {icon}
            <AlertDialogTitle>{title || defaultTitle}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base pt-2">
            {message}
          </AlertDialogDescription>
          {errorCode && (
            <p className="text-muted-foreground text-xs pt-2">
              Error Code: {errorCode}
            </p>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
          {action && (
            <>
              {action.href ? (
                <Link href={action.href}>
                  <AlertDialogAction className="w-full">
                    {action.label}
                  </AlertDialogAction>
                </Link>
              ) : (
                <AlertDialogAction onClick={action.onClick}>
                  {action.label}
                </AlertDialogAction>
              )}
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function getDefaultTitle(errorCode?: string): string {
  switch (errorCode) {
    case "INSUFFICIENT_FUNDS":
    case "INSUFFICIENT_MARGIN":
      return "Insufficient Funds";
    case "INSUFFICIENT_QUANTITY":
      return "Insufficient Quantity";
    case "VALIDATION_ERROR":
    case "INVALID_INPUT":
      return "Invalid Order";
    case "UNAUTHORIZED":
      return "Authentication Required";
    default:
      return "Order Failed";
  }
}

function getErrorIcon(errorCode?: string) {
  switch (errorCode) {
    case "INSUFFICIENT_FUNDS":
    case "INSUFFICIENT_MARGIN":
      return <Wallet className="h-6 w-6 text-amber-500" />;
    default:
      return <AlertCircle className="h-6 w-6 text-destructive" />;
  }
}
