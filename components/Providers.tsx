"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useState, useEffect } from "react";
import { useThemeStore } from "@/store/useThemeStore";

function ThemeHydrator() {
  const hydrate = useThemeStore((s) => s.hydrate);
  useEffect(() => {
    hydrate();

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const { theme } = useThemeStore.getState();
      if (theme === "system") hydrate();
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [hydrate]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeHydrator />
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            classNames: {
              error: "!bg-danger !text-white !border-danger",
              success: "!bg-success !text-white !border-success",
            },
          }}
        />
      </QueryClientProvider>
    </SessionProvider>
  );
}
