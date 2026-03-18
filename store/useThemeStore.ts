"use client";

import { create } from "zustand";

type Theme = "light" | "dark" | "system";

type ThemeState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
  hydrate: () => void;
};

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(resolved: "light" | "dark") {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (resolved === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

function resolve(theme: Theme): "light" | "dark" {
  return theme === "system" ? getSystemTheme() : theme;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "system",
  resolvedTheme: "light",

  setTheme: (theme) => {
    const resolved = resolve(theme);
    localStorage.setItem("theme", theme);
    applyTheme(resolved);
    set({ theme, resolvedTheme: resolved });
  },

  hydrate: () => {
    const stored = localStorage.getItem("theme") as Theme | null;
    const theme = stored || "system";
    const resolved = resolve(theme);
    applyTheme(resolved);
    set({ theme, resolvedTheme: resolved });
  },
}));
