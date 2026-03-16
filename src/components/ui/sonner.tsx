"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-right"
      toastOptions={{
        style: {
          fontFamily: "var(--font-dm-sans)",
          fontSize: "13.5px",
          borderRadius: "14px",
          border: "1px solid var(--border)",
          boxShadow: "0 8px 24px -6px oklch(0 0 0 / 0.15)",
        },
        classNames: {
          toast: "group toast bg-card text-foreground border-border shadow-lg",
          description: "text-muted-foreground",
          actionButton:
            "bg-primary text-primary-foreground rounded-lg text-xs font-medium",
          cancelButton:
            "bg-secondary text-secondary-foreground rounded-lg text-xs",
          success: "border-l-4 !border-l-[#16A34A]",
          error: "border-l-4 !border-l-[var(--brand-rose)]",
          warning: "border-l-4 !border-l-[#D97706]",
          info: "border-l-4 !border-l-[#0891B2]",
        },
      }}
      style={
        {
          "--normal-bg": "var(--card)",
          "--normal-text": "var(--card-foreground)",
          "--normal-border": "var(--border)",
          "--success-bg": "var(--card)",
          "--success-text": "var(--card-foreground)",
          "--success-border": "var(--border)",
          "--error-bg": "var(--card)",
          "--error-text": "var(--card-foreground)",
          "--error-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
