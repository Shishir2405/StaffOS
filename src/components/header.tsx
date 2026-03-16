"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiSunLine,
  RiMoonLine,
  RiComputerLine,
  RiNotification3Line,
  RiUserLine,
  RiLogoutBoxLine,
  RiArrowDownSLine,
  RiCheckLine,
  RiSettings3Line,
} from "react-icons/ri";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useSession, authClient } from "@/lib/auth-client";
import { toast } from "sonner";

/* ─── Helpers ────────────────────────────────────────────── */
const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

/* ─── Theme menu ─────────────────────────────────────────── */
function ThemeMenu() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const options = [
    { label: "Light", value: "light", icon: RiSunLine },
    { label: "Dark", value: "dark", icon: RiMoonLine },
    { label: "System", value: "system", icon: RiComputerLine },
  ];

  const CurrentIcon =
    theme === "dark"
      ? RiMoonLine
      : theme === "light"
        ? RiSunLine
        : RiComputerLine;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
        style={{
          border: "1.5px solid var(--border)",
          background: "transparent",
          cursor: "pointer",
          color: "var(--muted-foreground)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            "var(--secondary)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            "transparent";
        }}
      >
        <CurrentIcon size={15} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="absolute right-0 top-11 z-50 rounded-xl overflow-hidden py-1"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                boxShadow: "0 8px 24px -6px oklch(0 0 0 / 0.15)",
                minWidth: 140,
                fontFamily: "var(--font-dm-sans)",
              }}
            >
              {options.map((opt) => {
                const Icon = opt.icon;
                const isActive = theme === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setTheme(opt.value);
                      setOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left"
                    style={{
                      background: isActive ? "var(--secondary)" : "transparent",
                      color: isActive
                        ? "var(--brand-rose)"
                        : "var(--foreground)",
                      cursor: "pointer",
                      border: "none",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive)
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.background = "var(--secondary)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive)
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.background = "transparent";
                    }}
                  >
                    <Icon size={14} style={{ flexShrink: 0 }} />
                    {opt.label}
                    {isActive && <RiCheckLine size={13} className="ml-auto" />}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── User menu ──────────────────────────────────────────── */
function UserMenu() {
  const { data: session } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    const token = localStorage.getItem("bearer_token");
    const { error } = await authClient.signOut({
      fetchOptions: { headers: { Authorization: `Bearer ${token}` } },
    });
    if (error?.code) {
      toast.error(error.code);
    } else {
      localStorage.removeItem("bearer_token");
      router.push("/sign-in");
    }
    setOpen(false);
  };

  const user = session?.user;
  const initials = user?.name ? getInitials(user.name) : "U";

  if (!user) {
    return (
      <button
        onClick={() => router.push("/sign-in")}
        className="text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        style={{
          background: "var(--brand-navy)",
          color: "white",
          border: "none",
          cursor: "pointer",
          fontFamily: "var(--font-dm-sans)",
        }}
      >
        Sign In
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 pl-1 pr-2.5 py-1 rounded-xl transition-colors"
        style={{
          border: "1.5px solid var(--border)",
          background: "transparent",
          cursor: "pointer",
          fontFamily: "var(--font-dm-sans)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            "var(--secondary)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            "transparent";
        }}
      >
        {/* Avatar */}
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-semibold text-white flex-shrink-0"
          style={{ background: "var(--brand-rose)" }}
        >
          {initials}
        </div>

        {/* Name - hidden on small screens */}
        <span
          className="text-sm font-medium hidden sm:block max-w-[120px] truncate"
          style={{ color: "var(--foreground)" }}
        >
          {user.name}
        </span>

        <RiArrowDownSLine
          size={14}
          style={{
            color: "var(--muted-foreground)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="absolute right-0 top-12 z-50 rounded-xl overflow-hidden"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                boxShadow: "0 8px 24px -6px oklch(0 0 0 / 0.15)",
                minWidth: 200,
                fontFamily: "var(--font-dm-sans)",
              }}
            >
              {/* User info header */}
              <div
                className="px-4 py-3.5"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                    style={{ background: "var(--brand-rose)" }}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p
                      className="text-sm font-semibold truncate"
                      style={{
                        color: "var(--foreground)",
                        fontFamily: "var(--font-playfair)",
                      }}
                    >
                      {user.name}
                    </p>
                    <p
                      className="text-xs truncate"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="py-1.5">
                {[
                  {
                    icon: RiUserLine,
                    label: "Profile",
                    onClick: () => {
                      router.push("/profile");
                      setOpen(false);
                    },
                  },
                  {
                    icon: RiSettings3Line,
                    label: "Settings",
                    onClick: () => {
                      router.push("/settings");
                      setOpen(false);
                    },
                  },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors text-left"
                    style={{
                      background: "transparent",
                      color: "var(--foreground)",
                      cursor: "pointer",
                      border: "none",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "var(--secondary)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "transparent";
                    }}
                  >
                    <item.icon
                      size={14}
                      style={{
                        color: "var(--muted-foreground)",
                        flexShrink: 0,
                      }}
                    />
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Sign out */}
              <div
                className="py-1.5"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors text-left"
                  style={{
                    background: "transparent",
                    color: "var(--brand-rose)",
                    cursor: "pointer",
                    border: "none",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "var(--brand-rose-soft)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "transparent";
                  }}
                >
                  <RiLogoutBoxLine size={14} style={{ flexShrink: 0 }} />
                  Sign out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Notification bell ──────────────────────────────────── */
function NotificationBell() {
  return (
    <button
      className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
      style={{
        border: "1.5px solid var(--border)",
        background: "transparent",
        cursor: "pointer",
        color: "var(--muted-foreground)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background =
          "var(--secondary)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
      }}
    >
      <RiNotification3Line size={15} />
      {/* Unread dot */}
      <span
        className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
        style={{ background: "var(--brand-rose)" }}
      />
    </button>
  );
}

/* ─── Header ─────────────────────────────────────────────── */
interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header
      className="flex h-16 flex-shrink-0 items-center justify-between px-5 gap-4 sticky top-0 z-30"
      style={{
        background: "var(--background)",
        borderBottom: "1px solid var(--border)",
        fontFamily: "var(--font-dm-sans)",
      }}
    >
      {/* Left — sidebar trigger + page title */}
      <div className="flex items-center gap-3 min-w-0">
        <SidebarTrigger
          className="flex-shrink-0 w-8 h-8 rounded-lg transition-colors"
          style={{
            color: "var(--muted-foreground)",
          }}
        />

        {title && (
          <div className="hidden sm:block min-w-0">
            <h1
              className="text-base font-semibold leading-tight truncate"
              style={{
                fontFamily: "var(--font-playfair)",
                color: "var(--foreground)",
              }}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                className="text-xs truncate"
                style={{ color: "var(--muted-foreground)" }}
              >
                {subtitle}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Right — date, notification, theme, user */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Current date */}
        <span
          className="text-xs hidden md:block mr-1"
          style={{ color: "var(--muted-foreground)" }}
        >
          {new Date().toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}
        </span>

        <NotificationBell />
        <ThemeMenu />

        {/* Divider */}
        <div
          className="w-px h-5 hidden sm:block"
          style={{ background: "var(--border)" }}
        />

        <UserMenu />
      </div>
    </header>
  );
}
