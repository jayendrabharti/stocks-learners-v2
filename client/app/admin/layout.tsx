"use client";
import AuthGuard from "@/auth/AuthGuard";
import AdminBottomBar from "@/components/admin/AdminBottomBar";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSideBar from "@/components/admin/AdminSideBar";
import Main from "@/components/Main";
import { Button } from "@/components/ui/button";
import { useSession } from "@/providers/SessionProvider";
import { BanIcon, HomeIcon, UserCircle2Icon } from "lucide-react";
import Link from "next/link";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useSession();

  return (
    <Main className="bg-background text-foreground grid h-dvh min-h-dvh w-full grid-rows-[auto_1fr]">
      <div className="flex min-h-screen flex-row">
        <AdminSideBar className="hidden md:block" />
        <div className="flex flex-1 flex-col">
          <AdminHeader />
          <div className="flex w-full flex-1 flex-col gap-3 overflow-y-scroll p-3 pb-20 md:pb-3">
            <AuthGuard>
              {user?.isAdmin ? children : <NotAdminWarning />}
            </AuthGuard>
          </div>
          <AdminBottomBar className="block md:hidden" />
        </div>
      </div>
    </Main>
  );
}

const NotAdminWarning = () => (
  <div className="text-destructive mx-auto flex h-full w-full flex-col items-center justify-center gap-4 p-4 text-center">
    <BanIcon className="size-20" />
    <span className="mx-auto text-3xl font-extrabold">Access Denied</span>
    <p className="text-center">
      You do not have permission to access this page.
      <br />
      This page is restricted to admins only.
    </p>
    <div className="flex flex-row flex-wrap items-center justify-center gap-2 text-center">
      <Link href="/">
        <Button>
          <HomeIcon />
          Home Page
        </Button>
      </Link>
      <Link href="/profile">
        <Button>
          <UserCircle2Icon />
          Your Profile
        </Button>
      </Link>
    </div>
  </div>
);
