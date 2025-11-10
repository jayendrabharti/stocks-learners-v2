"use client";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

import React from "react";
import { Button } from "@/components/ui/button";

interface ThemeSwitchProps {
  className?: string;
}

const ThemeSwitch: React.FC<ThemeSwitchProps> = ({ className }) => {
  const { theme, setTheme } = useTheme();

  const switchTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    setTheme(theme === "dark" ? "light" : "dark");
    e.stopPropagation();
  };

  return (
    <Button
      variant={"outline"}
      size={"icon"}
      onClick={switchTheme}
      className={cn("relative rounded-full", className)}
    >
      <Moon
        className={`absolute scale-0 rotate-180 transition-all duration-400 dark:scale-125 dark:rotate-0`}
      />
      <Sun
        className={`absolute scale-125 rotate-0 transition-all duration-400 dark:scale-0 dark:-rotate-180`}
      />
    </Button>
  );
};

export default ThemeSwitch;
