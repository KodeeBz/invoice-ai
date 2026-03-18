"use client";

import { useSession } from "next-auth/react";
import { Menu, Sun, Moon, Monitor } from "lucide-react";
import { useThemeStore } from "@/store/useThemeStore";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { data: session } = useSession();
  const { theme, setTheme } = useThemeStore();

  const cycleTheme = () => {
    const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    setTheme(next);
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-slate-700 dark:bg-slate-800 lg:px-6">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-700 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Spacer for desktop */}
      <div className="hidden lg:block" />

      {/* User info */}
      <div className="flex items-center gap-3">
        {/* Theme toggle */}
        <button
          onClick={cycleTheme}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-700"
          title={`Theme: ${theme}`}
        >
          {theme === "light" && <Sun className="h-5 w-5" />}
          {theme === "dark" && <Moon className="h-5 w-5" />}
          {theme === "system" && <Monitor className="h-5 w-5" />}
        </button>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {session?.user?.name}
          </p>
          {session?.user?.businessName && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {session.user.businessName}
            </p>
          )}
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-medium text-white">
          {session?.user?.name
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2) ?? "?"}
        </div>
      </div>
    </header>
  );
}
