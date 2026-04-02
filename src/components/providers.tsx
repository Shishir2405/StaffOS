"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider, ToastBridge } from "@/components/ui/custom-toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      forcedTheme="light"
      disableTransitionOnChange
    >
      <ToastProvider>
        <ToastBridge />
        {children}
      </ToastProvider>
    </ThemeProvider>
  );
}
