"use client";
import AuthGuard from "@/auth/AuthGuard";
import RevealHero from "@/components/animations/RevealHero";
import ProfileForm from "@/components/profile/ProfileForm";
import { useSession } from "@/providers/SessionProvider";

export default function ProfilePage() {
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col items-center p-4">
      <RevealHero className="mb-8 text-3xl font-extrabold">Profile</RevealHero>
      <AuthGuard>
        <ProfileForm />
      </AuthGuard>
    </section>
  );
}
