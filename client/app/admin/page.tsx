"use client";
import DashboardNewUsersTable from "@/components/admin/DashboardNewUsersTable";
import DashboardStatCard, {
  DashboardStatCardProps,
} from "@/components/admin/DashboardStatCard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import ApiClient from "@/utils/ApiClient";
import {
  MailIcon,
  User2Icon,
  UserLockIcon,
  Trophy,
  Calendar,
  Users,
  DollarSign,
  Settings,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function AdminPage() {
  const [data, setData] = useState<{
    userCount: number;
    adminCount: number;
    recentUsers: User[];
    contactFormCount: number;
    pendingContactFormCount: number;
    // Event stats
    totalEvents: number;
    activeEvents: number;
    liveEvents: number;
    totalRegistrations: number;
    confirmedRegistrations: number;
    totalEventRevenue: number;
  } | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number>(1.0);
  const [newExchangeRate, setNewExchangeRate] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    ApiClient.get("/admin/dashboard")
      .then((response) => {
        setData(response.data);
      })
      .catch((err) => {
        setError(
          err.response?.data?.error?.message || "Failed to load dashboard data",
        );
      });

    // Load current exchange rate
    ApiClient.get("/admin/settings")
      .then((response) => {
        setExchangeRate(response.data.exchangeRate);
        setNewExchangeRate(response.data.exchangeRate.toString());
      })
      .catch((err) => {
        console.error("Failed to load settings:", err);
      });
  }, []);

  const handleUpdateExchangeRate = async () => {
    const rate = parseFloat(newExchangeRate);

    if (isNaN(rate) || rate <= 0) {
      toast.error("Invalid exchange rate", {
        description: "Please enter a valid positive number",
      });
      return;
    }

    setIsUpdating(true);
    try {
      const response = await ApiClient.put("/admin/settings/exchange-rate", {
        exchangeRate: rate,
      });

      if (response.status === 200) {
        setExchangeRate(rate);
        toast.success("Exchange rate updated successfully!");
      }
    } catch (err: any) {
      toast.error("Failed to update exchange rate", {
        description: err.response?.data?.error?.message || "Unknown error",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (error || !data) {
    return (
      <div className="flex h-40 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-700">
        <span className="font-semibold">
          Error: {error || "Unknown error occurred"}
        </span>
      </div>
    );
  }

  const stats: DashboardStatCardProps[] = [
    {
      title: "Total Users",
      value: data.userCount,
      icon: <User2Icon />,
      shortcut: { link: "/admin/users", label: "View Users" },
    },
    {
      title: "Admins",
      value: data.adminCount,
      icon: <UserLockIcon />,
      shortcut: {
        link: "/admin/users?role_filter=admin",
        label: "View Admins",
      },
    },
    {
      title: "Total Events",
      value: data.totalEvents,
      icon: <Trophy />,
      shortcut: {
        link: "/admin/events",
        label: "View Events",
      },
    },
    {
      title: "Live Events",
      value: data.liveEvents,
      icon: <Calendar />,
      shortcut: {
        link: "/admin/events",
        label: "View Events",
      },
    },
    {
      title: "Event Registrations",
      value: data.confirmedRegistrations,
      icon: <Users />,
      shortcut: {
        link: "/admin/events",
        label: "View Events",
      },
    },
    {
      title: "Event Revenue",
      value: `₹${data.totalEventRevenue.toLocaleString()}`,
      icon: <DollarSign />,
      shortcut: {
        link: "/admin/events",
        label: "View Events",
      },
    },
    {
      title: "Contact Forms",
      value: data.contactFormCount,
      icon: <MailIcon />,
      shortcut: {
        link: "/admin/contact",
        label: "View Contacts",
      },
    },
    {
      title: "Pending Contact Forms",
      value: data.pendingContactFormCount,
      icon: <MailIcon />,
      shortcut: {
        link: "/admin/contact?status=pending",
        label: "View Pending Contacts",
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Overview of platform statistics and management
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <DashboardStatCard key={index} {...stat} />
        ))}
      </div>

      {/* Exchange Rate Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            App Settings
          </CardTitle>
          <CardDescription>
            Manage application settings and configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-md space-y-4">
            <div>
              <Label htmlFor="exchangeRate" className="text-sm font-medium">
                Exchange Rate (INR to Credits)
              </Label>
              <p className="text-muted-foreground mt-1 mb-3 text-sm">
                Current rate: ₹1 = {exchangeRate.toFixed(2)} Credits
              </p>
              <div className="flex gap-2">
                <Input
                  id="exchangeRate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newExchangeRate}
                  onChange={(e) => setNewExchangeRate(e.target.value)}
                  placeholder="Enter new exchange rate"
                  disabled={isUpdating}
                  className="max-w-xs"
                />
                <Button
                  onClick={handleUpdateExchangeRate}
                  disabled={
                    isUpdating || newExchangeRate === exchangeRate.toString()
                  }
                  className="min-w-24"
                >
                  {isUpdating ? "Updating..." : "Update"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Users */}
      <DashboardNewUsersTable newUsers={data.recentUsers} />
    </div>
  );
}
