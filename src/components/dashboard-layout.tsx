"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiDashboardLine,
  RiCalendarCheckLine,
  RiCalendarLine,
  RiMoneyDollarCircleLine,
  RiUserLine,
  RiSearchLine,
  RiCloseLine,
} from "react-icons/ri";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Header } from "@/components/header";
import { scaleIn, buttonTap } from "@/lib/animations";

/* ─── Command Palette nav items for search ───────────────── */
const searchItems = [
  { label: "Dashboard", url: "/dashboard", type: "page" },
  { label: "Employees", url: "/dashboard/employees", type: "page" },
  { label: "Add Employee", url: "/dashboard/employees/new", type: "action" },
  { label: "Documents (KYC, Contracts)", url: "/dashboard/documents", type: "page" },
  { label: "Attendance", url: "/dashboard/attendance", type: "page" },
  { label: "Attendance Dashboard", url: "/dashboard/attendance/dashboard", type: "page" },
  { label: "Shifts", url: "/dashboard/shifts", type: "page" },
  { label: "Leave Management", url: "/dashboard/leave", type: "page" },
  { label: "Holidays", url: "/dashboard/holidays", type: "page" },
  { label: "Overtime", url: "/dashboard/overtime", type: "page" },
  { label: "Geofencing", url: "/dashboard/geofencing", type: "page" },
  { label: "Payroll Runs", url: "/dashboard/payroll", type: "page" },
  { label: "Pay Heads", url: "/dashboard/payroll/pay-heads", type: "page" },
  { label: "Payroll Adjustments", url: "/dashboard/payroll/adjustments", type: "page" },
  { label: "Final Settlement (F&F)", url: "/dashboard/payroll/settlement", type: "page" },
  { label: "Tax & TDS", url: "/dashboard/tax", type: "page" },
  { label: "Statutory Compliance", url: "/dashboard/compliance", type: "page" },
  { label: "Benefits & Deductions", url: "/dashboard/benefits", type: "page" },
  { label: "Reports & Exports", url: "/dashboard/reports", type: "page" },
  { label: "Finance & Integration", url: "/dashboard/finance", type: "page" },
  { label: "Self-Service Portal", url: "/dashboard/ess", type: "page" },
  { label: "Organization", url: "/dashboard/organization", type: "page" },
  { label: "Settings", url: "/dashboard/settings", type: "page" },
  { label: "Audit & Compliance", url: "/dashboard/audit", type: "page" },
  { label: "Security & Backup", url: "/dashboard/security", type: "page" },
  { label: "User Management", url: "/dashboard/admin/users", type: "page" },
];

/* ─── Command Palette ────────────────────────────────────── */
function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filtered = searchItems.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && filtered[selectedIndex]) {
        router.push(filtered[selectedIndex].url);
        onClose();
        setQuery("");
      } else if (e.key === "Escape") {
        onClose();
        setQuery("");
      }
    },
    [filtered, selectedIndex, router, onClose]
  );

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100]"
            style={{ background: "rgba(28, 18, 8, 0.5)", backdropFilter: "blur(4px)" }}
            onClick={() => { onClose(); setQuery(""); }}
          />
          {/* Panel */}
          <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed top-[15%] left-1/2 -translate-x-1/2 z-[101] w-[90vw] max-w-lg"
            style={{
              background: "var(--bg-raised)",
              border: "1px solid var(--border-1)",
              borderRadius: "var(--r-xl)",
              boxShadow: "var(--shadow-lg)",
              overflow: "hidden",
            }}
          >
            {/* Search input */}
            <div
              className="flex items-center gap-3 px-5 py-4"
              style={{ borderBottom: "1px solid var(--border-1)" }}
            >
              <RiSearchLine size={18} style={{ color: "var(--text-3)", flexShrink: 0 }} />
              <input
                autoFocus
                type="text"
                placeholder="Search pages, employees, actions..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 text-sm outline-none"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-1)",
                  fontFamily: "var(--font-body)",
                }}
              />
              <button
                onClick={() => { onClose(); setQuery(""); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)" }}
              >
                <RiCloseLine size={18} />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-[300px] overflow-y-auto py-2">
              {filtered.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: "var(--text-3)" }}>
                  No results found
                </p>
              ) : (
                filtered.map((item, i) => (
                  <button
                    key={item.url}
                    onClick={() => {
                      router.push(item.url);
                      onClose();
                      setQuery("");
                    }}
                    className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-left transition-colors"
                    style={{
                      background: i === selectedIndex ? "var(--brand-ghost)" : "transparent",
                      color: i === selectedIndex ? "var(--brand)" : "var(--text-1)",
                      cursor: "pointer",
                      border: "none",
                      fontFamily: "var(--font-body)",
                    }}
                    onMouseEnter={() => setSelectedIndex(i)}
                  >
                    <span
                      className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded"
                      style={{
                        background: item.type === "action" ? "var(--brand-xlight)" : "var(--bg-subtle)",
                        color: item.type === "action" ? "var(--brand)" : "var(--text-3)",
                        fontFamily: "var(--font-body)",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {item.type}
                    </span>
                    {item.label}
                  </button>
                ))
              )}
            </div>

            {/* Footer hint */}
            <div
              className="flex items-center gap-4 px-5 py-2.5"
              style={{ borderTop: "1px solid var(--border-1)" }}
            >
              <span className="text-[11px]" style={{ color: "var(--text-3)" }}>
                ↑↓ navigate
              </span>
              <span className="text-[11px]" style={{ color: "var(--text-3)" }}>
                ↵ open
              </span>
              <span className="text-[11px]" style={{ color: "var(--text-3)" }}>
                esc close
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─── Bottom Navigation (mobile only) ────────────────────── */
function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const items = [
    { label: "Dashboard", icon: RiDashboardLine, url: "/dashboard" },
    { label: "Attendance", icon: RiCalendarCheckLine, url: "/dashboard/attendance" },
    { label: "Leave", icon: RiCalendarLine, url: "/dashboard/leave" },
    { label: "Payroll", icon: RiMoneyDollarCircleLine, url: "/dashboard/payroll" },
    { label: "Profile", icon: RiUserLine, url: "/profile" },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
      style={{
        height: 64,
        background: "var(--bg-raised)",
        borderTop: "1px solid var(--border-1)",
        boxShadow: "0 -2px 10px rgba(120,80,20,0.06)",
      }}
    >
      <div className="flex items-center justify-around h-full px-2">
        {items.map((item) => {
          const isActive = item.url === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.url);
          const Icon = item.icon;
          return (
            <motion.button
              key={item.url}
              whileTap={buttonTap}
              onClick={() => router.push(item.url)}
              className="flex flex-col items-center gap-1 py-1 px-3 relative"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              {/* Orange dot above active icon */}
              {isActive && (
                <motion.span
                  layoutId="bottom-nav-dot"
                  className="absolute -top-0.5 w-1 h-1 rounded-full"
                  style={{ background: "var(--brand)" }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon
                size={20}
                style={{
                  color: isActive ? "var(--brand)" : "var(--text-3)",
                }}
              />
              <span
                className="text-[10px] font-medium"
                style={{
                  color: isActive ? "var(--brand)" : "var(--text-3)",
                  fontFamily: "var(--font-body)",
                }}
              >
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}

/* ─── Dashboard Layout ───────────────────────────────────── */
interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function DashboardLayout({
  children,
  title,
  subtitle,
}: DashboardLayoutProps) {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Global keyboard shortcut for Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset
        style={{
          background: "var(--bg-page)",
          fontFamily: "var(--font-body)",
        }}
      >
        <Header
          title={title}
          subtitle={subtitle}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        />
        <main className="flex-1 overflow-auto pb-20 lg:pb-0">{children}</main>
      </SidebarInset>

      {/* Command Palette */}
      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />

      {/* Bottom Nav (mobile only) */}
      <BottomNav />
    </SidebarProvider>
  );
}
