"use client";
import RevealHero from "@/components/animations/RevealHero";
import ProfileForm from "@/components/profile/ProfileForm";
import { useSession } from "@/providers/SessionProvider";

export default function ProfilePage() {
  const { user } = useSession();

  if (user)
    return (
      <section className="mx-auto flex w-full max-w-2xl flex-col items-center p-4">
        <RevealHero className="mb-8 text-3xl font-extrabold">
          Profile
        </RevealHero>
        <ProfileForm user={user} />
      </section>
    );
}
