"use client";
import DashboardNewUsersTable from "@/components/admin/DashboardNewUsersTable";
import DashboardStatCard, {
  DashboardStatCardProps,
} from "@/components/admin/DashboardStatCard";
import ApiClient from "@/utils/ApiClient";
import { MailIcon, User2Icon, UserLockIcon } from "lucide-react";
import { useEffect, useState } from "react";

export default function AdminPage() {
  const [data, setData] = useState<{
    userCount: number;
    adminCount: number;
    recentUsers: User[];
    contactFormCount: number;
    pendingContactFormCount: number;
  } | null>(null);

  const [error, setError] = useState<string | null>(null);

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
  }, []);

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
    <>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <DashboardStatCard key={index} {...stat} />
        ))}
      </div>
      <DashboardNewUsersTable newUsers={data.recentUsers} />
    </>
  );
}
