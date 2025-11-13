import AuthGuard from "@/auth/AuthGuard";
import RevealHero from "@/components/animations/RevealHero";

export default function Page() {
  return (
    <section className="mx-auto flex w-full flex-col p-4">
      <RevealHero className="mx-auto text-3xl font-extrabold">
        Your Portfolio
      </RevealHero>
      <AuthGuard>
        <span className="mx-auto text-2xl font-light">Coming Soon...</span>
      </AuthGuard>
    </section>
  );
}
