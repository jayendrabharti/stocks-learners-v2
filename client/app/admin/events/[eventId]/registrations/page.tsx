"use client";

import ApiClient from "@/utils/ApiClient";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, DollarSign, CheckCircle, XCircle, Clock } from "lucide-react";

interface Registration {
  id: string;
  userId: string;
  paymentStatus: string;
  status: string;
  amountPaid: number;
  registeredAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  eventAccount: {
    id: string;
    cash: number;
    usedMargin: number;
  } | null;
}

export default function EventRegistrationsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<any>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    pending: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    loadData();
  }, [eventId]);

  const loadData = async () => {
    try {
      // Load event details
      const eventResponse = await ApiClient.get(`/admin/events/${eventId}`);
      if (eventResponse.status === 200) {
        setEvent(eventResponse.data);
      }

      // Load registrations
      const regResponse = await ApiClient.get(`/admin/events/${eventId}/registrations`);

      if (regResponse.status !== 200) throw new Error("Failed to load registrations");

      const data = regResponse.data;
      setRegistrations(data.registrations);

      // Calculate stats
      const total = data.registrations.length;
      const confirmed = data.registrations.filter((r: Registration) => r.status === "CONFIRMED").length;
      const pending = data.registrations.filter((r: Registration) => r.status === "PENDING").length;
      const totalRevenue = data.registrations
        .filter((r: Registration) => r.paymentStatus === "COMPLETED")
        .reduce((sum: number, r: Registration) => sum + r.amountPaid, 0);

      setStats({ total, confirmed, pending, totalRevenue });
    } catch (error) {
      console.error("Error loading data:", error);
      alert("Failed to load registrations");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      CONFIRMED: { variant: "default", icon: CheckCircle, label: "Confirmed" },
      PENDING: { variant: "secondary", icon: Clock, label: "Pending" },
      CANCELLED: { variant: "destructive", icon: XCircle, label: "Cancelled" },
    };

    const config = variants[status] || variants.PENDING;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant as any} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPaymentBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      COMPLETED: { variant: "default", label: "Paid" },
      PENDING: { variant: "secondary", label: "Pending" },
      FAILED: { variant: "destructive", label: "Failed" },
    };

    const config = variants[status] || variants.PENDING;

    return (
      <Badge variant={config.variant as any}>
        {config.label}
      </Badge>
    );
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

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/events")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Button>
        <h1 className="text-3xl font-bold">Event Registrations</h1>
        {event && (
          <p className="text-muted-foreground mt-2">{event.title}</p>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Registrations</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Confirmed</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.confirmed}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{stats.pending}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Revenue</CardDescription>
            <CardTitle className="text-3xl">₹{stats.totalRevenue.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Registrations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Registrations List
          </CardTitle>
          <CardDescription>
            All registrations for this event
          </CardDescription>
        </CardHeader>
        <CardContent>
          {registrations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No registrations yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">User</th>
                    <th className="text-left py-3 px-4">Email</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Payment</th>
                    <th className="text-right py-3 px-4">Amount</th>
                    <th className="text-right py-3 px-4">Balance</th>
                    <th className="text-left py-3 px-4">Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((reg) => (
                    <tr key={reg.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="font-medium">
                          {reg.user.name || "Unknown"}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {reg.user.email}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(reg.status)}
                      </td>
                      <td className="py-3 px-4">
                        {getPaymentBadge(reg.paymentStatus)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        ₹{reg.amountPaid.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {reg.eventAccount ? (
                          <div className="text-sm">
                            <div className="font-medium">
                              ₹{reg.eventAccount.cash.toLocaleString()}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              Used: ₹{reg.eventAccount.usedMargin.toLocaleString()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {new Date(reg.registeredAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
