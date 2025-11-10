import ThemeSwitch from "@/components/ThemeSwitch";
import Logo from "@/components/Logo";

export default function AuthHeader() {
  return (
    <header className="bg-background border-border border-b shadow-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />

        <ThemeSwitch />
      </div>
    </header>
  );
}
