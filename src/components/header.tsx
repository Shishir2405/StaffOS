"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiNotification3Line,
  RiUserLine,
  RiLogoutBoxLine,
  RiArrowDownSLine,
  RiSettings3Line,
  RiSearchLine,
} from "react-icons/ri";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useSession, authClient } from "@/lib/auth-client";
import { toast } from "@/components/ui/custom-toast";
import { scaleIn, buttonTap } from "@/lib/animations";

/* ─── Helpers ────────────────────────────────────────────── */
const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

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
      <motion.button
        whileTap={buttonTap}
        onClick={() => router.push("/sign-in")}
        className="text-sm font-semibold px-4 py-2 rounded-[var(--r-md)] transition-colors"
        style={{
          background: "var(--brand)",
          color: "var(--text-on-brand)",
          border: "none",
          cursor: "pointer",
          fontFamily: "var(--font-body)",
        }}
      >
        Sign In
      </motion.button>
    );
  }

  return (
    <div className="relative">
      <motion.button
        whileTap={buttonTap}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 pl-1 pr-2.5 py-1 rounded-[var(--r-md)] transition-colors"
        style={{
          border: "1.5px solid var(--border-1)",
          background: "transparent",
          cursor: "pointer",
          fontFamily: "var(--font-body)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            "var(--bg-subtle)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            "transparent";
        }}
      >
        {/* Avatar */}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0"
          style={{
            background: "var(--brand)",
            color: "var(--text-on-brand)",
          }}
        >
          {initials}
        </div>

        {/* Name - hidden on small screens */}
        <span
          className="text-sm font-medium hidden sm:block max-w-[120px] truncate"
          style={{ color: "var(--text-1)" }}
        >
          {user.name}
        </span>

        <RiArrowDownSLine
          size={14}
          style={{
            color: "var(--text-3)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        />
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute right-0 top-12 z-50 rounded-[var(--r-lg)] overflow-hidden"
              style={{
                background: "var(--bg-raised)",
                border: "1px solid var(--border-1)",
                boxShadow: "var(--shadow-lg)",
                minWidth: 200,
                fontFamily: "var(--font-body)",
              }}
            >
              {/* User info header */}
              <div
                className="px-4 py-3.5"
                style={{ borderBottom: "1px solid var(--border-1)" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                    style={{
                      background: "var(--brand)",
                      color: "var(--text-on-brand)",
                    }}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p
                      className="text-sm font-semibold truncate"
                      style={{
                        color: "var(--text-1)",
                        fontFamily: "var(--font-display)",
                      }}
                    >
                      {user.name}
                    </p>
                    <p
                      className="text-xs truncate"
                      style={{ color: "var(--text-3)" }}
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
                      color: "var(--text-1)",
                      cursor: "pointer",
                      border: "none",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "var(--brand-ghost)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "transparent";
                    }}
                  >
                    <item.icon
                      size={14}
                      style={{
                        color: "var(--text-3)",
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
                style={{ borderTop: "1px solid var(--border-1)" }}
              >
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors text-left"
                  style={{
                    background: "transparent",
                    color: "var(--danger)",
                    cursor: "pointer",
                    border: "none",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "var(--danger-bg)";
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
    <motion.button
      whileTap={buttonTap}
      whileHover={{ opacity: 0.92 }}
      className="relative w-9 h-9 rounded-[var(--r-md)] flex items-center justify-center transition-colors"
      style={{
        border: "1.5px solid var(--border-1)",
        background: "transparent",
        cursor: "pointer",
        color: "var(--text-3)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background =
          "var(--bg-subtle)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
      }}
    >
      <RiNotification3Line size={15} />
      {/* Unread dot */}
      <span
        className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
        style={{ background: "var(--brand)" }}
      />
    </motion.button>
  );
}

/* ─── Header ─────────────────────────────────────────────── */
interface HeaderProps {
  title?: string;
  subtitle?: string;
  onOpenCommandPalette?: () => void;
}

export function Header({ title, subtitle, onOpenCommandPalette }: HeaderProps) {
  return (
    <header
      className="flex h-16 flex-shrink-0 items-center justify-between px-4 sm:px-6 lg:px-8 gap-4 sticky top-0 z-30"
      style={{
        background: "var(--bg-raised)",
        borderBottom: "1px solid var(--border-1)",
        boxShadow: "var(--shadow-sm)",
        fontFamily: "var(--font-body)",
      }}
    >
      {/* Left — sidebar trigger + page title */}
      <div className="flex items-center gap-3 min-w-0">
        <SidebarTrigger
          className="flex-shrink-0 w-8 h-8 rounded-lg transition-colors"
          style={{
            color: "var(--text-3)",
          }}
        />

        {title && (
          <div className="hidden sm:block min-w-0">
            <h1
              className="text-base font-semibold leading-tight truncate"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--text-1)",
                fontSize: "16px",
                fontWeight: 700,
                letterSpacing: "-0.3px",
              }}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                className="text-xs truncate"
                style={{ color: "var(--text-3)" }}
              >
                {subtitle}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Center — pill-shaped search input */}
      <div className="hidden md:flex flex-1 max-w-md mx-auto">
        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center gap-2.5 px-4 py-2 rounded-full transition-all"
          style={{
            background: "var(--bg-subtle)",
            border: "1.5px solid var(--border-1)",
            cursor: "pointer",
            fontFamily: "var(--font-body)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              "var(--border-2)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              "var(--border-1)";
          }}
        >
          <RiSearchLine size={14} style={{ color: "var(--text-3)" }} />
          <span className="text-sm" style={{ color: "var(--text-3)" }}>
            Search...
          </span>
          <kbd
            className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded"
            style={{
              background: "var(--bg-raised)",
              color: "var(--text-3)",
              border: "1px solid var(--border-1)",
              fontFamily: "var(--font-mono-face)",
            }}
          >
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right — notification + user */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Current date */}
        <span
          className="text-xs hidden lg:block mr-1"
          style={{ color: "var(--text-3)" }}
        >
          {new Date().toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}
        </span>

        <NotificationBell />

        {/* Divider */}
        <div
          className="w-px h-5 hidden sm:block"
          style={{ background: "var(--border-1)" }}
        />

        <UserMenu />
      </div>
    </header>
  );
}
