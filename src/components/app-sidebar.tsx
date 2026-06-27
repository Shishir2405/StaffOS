"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  RiDashboardLine,
  RiDashboardFill,
  RiGroupLine,
  RiGroupFill,
  RiCalendarCheckLine,
  RiCalendarCheckFill,
  RiMapPinLine,
  RiMapPinFill,
  RiCalendarLine,
  RiCalendarFill,
  RiMoneyDollarCircleLine,
  RiMoneyDollarCircleFill,
  RiBuildingLine,
  RiBuildingFill,
  RiShieldLine,
  RiShieldFill,
  RiLogoutBoxLine,
  RiFileTextLine,
  RiFileTextFill,
  RiTimeLine,
  RiTimeFill,
  RiSunLine,
  RiSunFill,
  RiTimerLine,
  RiTimerFill,
  RiPriceTag3Line,
  RiPriceTag3Fill,
  RiExchangeFundsLine,
  RiExchangeFundsFill,
  RiUserUnfollowLine,
  RiUserUnfollowFill,
  RiGovernmentLine,
  RiGovernmentFill,
  RiShieldCheckLine,
  RiShieldCheckFill,
  RiHandCoinLine,
  RiHandCoinFill,
  RiBarChartBoxLine,
  RiBarChartBoxFill,
  RiBankLine,
  RiBankFill,
  RiAccountCircleLine,
  RiAccountCircleFill,
  RiSettings3Line,
  RiSettings3Fill,
  RiFileSearchLine,
  RiFileSearchFill,
  RiLockLine,
  RiLockFill,
} from "react-icons/ri";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { useSession, authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/custom-toast";
import { buttonTap } from "@/lib/animations";

/* ─── Nav types ──────────────────────────────────────────── */
type NavLink = {
  title: string;
  url: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  iconActive: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  match: (p: string) => boolean;
  adminOnly?: boolean;
};

type NavGroup = {
  label: string;
  items: NavLink[];
};

/* ─── Nav config (grouped) ───────────────────────────────── */
const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: RiDashboardLine,
        iconActive: RiDashboardFill,
        match: (p) => p === "/dashboard",
      },
    ],
  },
  {
    label: "People",
    items: [
      {
        title: "Employees",
        url: "/dashboard/employees",
        icon: RiGroupLine,
        iconActive: RiGroupFill,
        match: (p) => p.startsWith("/dashboard/employees"),
      },
      {
        title: "Documents",
        url: "/dashboard/documents",
        icon: RiFileTextLine,
        iconActive: RiFileTextFill,
        match: (p) => p.startsWith("/dashboard/documents"),
      },
      {
        title: "Attendance",
        url: "/dashboard/attendance",
        icon: RiCalendarCheckLine,
        iconActive: RiCalendarCheckFill,
        match: (p) => p.startsWith("/dashboard/attendance"),
      },
      {
        title: "Shifts",
        url: "/dashboard/shifts",
        icon: RiTimeLine,
        iconActive: RiTimeFill,
        match: (p) => p.startsWith("/dashboard/shifts"),
      },
      {
        title: "Leave",
        url: "/dashboard/leave",
        icon: RiCalendarLine,
        iconActive: RiCalendarFill,
        match: (p) => p.startsWith("/dashboard/leave"),
      },
      {
        title: "Holidays",
        url: "/dashboard/holidays",
        icon: RiSunLine,
        iconActive: RiSunFill,
        match: (p) => p.startsWith("/dashboard/holidays"),
      },
      {
        title: "Overtime",
        url: "/dashboard/overtime",
        icon: RiTimerLine,
        iconActive: RiTimerFill,
        match: (p) => p.startsWith("/dashboard/overtime"),
      },
      {
        title: "Geofencing",
        url: "/dashboard/geofencing",
        icon: RiMapPinLine,
        iconActive: RiMapPinFill,
        match: (p) => p.startsWith("/dashboard/geofencing"),
      },
    ],
  },
  {
    label: "Payroll",
    items: [
      {
        title: "Payroll Runs",
        url: "/dashboard/payroll",
        icon: RiMoneyDollarCircleLine,
        iconActive: RiMoneyDollarCircleFill,
        match: (p) => p === "/dashboard/payroll" || p.startsWith("/dashboard/payroll/runs"),
      },
      {
        title: "Pay Heads",
        url: "/dashboard/payroll/pay-heads",
        icon: RiPriceTag3Line,
        iconActive: RiPriceTag3Fill,
        match: (p) => p.startsWith("/dashboard/payroll/pay-heads"),
      },
      {
        title: "Adjustments",
        url: "/dashboard/payroll/adjustments",
        icon: RiExchangeFundsLine,
        iconActive: RiExchangeFundsFill,
        match: (p) => p.startsWith("/dashboard/payroll/adjustments"),
      },
      {
        title: "Final Settlement",
        url: "/dashboard/payroll/settlement",
        icon: RiUserUnfollowLine,
        iconActive: RiUserUnfollowFill,
        match: (p) => p.startsWith("/dashboard/payroll/settlement"),
      },
      {
        title: "Tax (TDS)",
        url: "/dashboard/tax",
        icon: RiGovernmentLine,
        iconActive: RiGovernmentFill,
        match: (p) => p.startsWith("/dashboard/tax"),
      },
      {
        title: "Compliance",
        url: "/dashboard/compliance",
        icon: RiShieldCheckLine,
        iconActive: RiShieldCheckFill,
        match: (p) => p.startsWith("/dashboard/compliance"),
      },
      {
        title: "Benefits",
        url: "/dashboard/benefits",
        icon: RiHandCoinLine,
        iconActive: RiHandCoinFill,
        match: (p) => p.startsWith("/dashboard/benefits"),
      },
      {
        title: "Reports",
        url: "/dashboard/reports",
        icon: RiBarChartBoxLine,
        iconActive: RiBarChartBoxFill,
        match: (p) => p.startsWith("/dashboard/reports"),
      },
    ],
  },
  {
    label: "Finance & Self-Service",
    items: [
      {
        title: "Finance",
        url: "/dashboard/finance",
        icon: RiBankLine,
        iconActive: RiBankFill,
        match: (p) => p.startsWith("/dashboard/finance"),
      },
      {
        title: "Self-Service",
        url: "/dashboard/ess",
        icon: RiAccountCircleLine,
        iconActive: RiAccountCircleFill,
        match: (p) => p.startsWith("/dashboard/ess"),
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        title: "Organization",
        url: "/dashboard/organization",
        icon: RiBuildingLine,
        iconActive: RiBuildingFill,
        match: (p) => p.startsWith("/dashboard/organization"),
      },
      {
        title: "Settings",
        url: "/dashboard/settings",
        icon: RiSettings3Line,
        iconActive: RiSettings3Fill,
        match: (p) => p.startsWith("/dashboard/settings"),
        adminOnly: true,
      },
      {
        title: "Audit & Compliance",
        url: "/dashboard/audit",
        icon: RiFileSearchLine,
        iconActive: RiFileSearchFill,
        match: (p) => p.startsWith("/dashboard/audit"),
        adminOnly: true,
      },
      {
        title: "Security & Backup",
        url: "/dashboard/security",
        icon: RiLockLine,
        iconActive: RiLockFill,
        match: (p) => p.startsWith("/dashboard/security"),
        adminOnly: true,
      },
      {
        title: "User Management",
        url: "/dashboard/admin/users",
        icon: RiShieldLine,
        iconActive: RiShieldFill,
        match: (p) => p.startsWith("/dashboard/admin"),
        adminOnly: true,
      },
    ],
  },
];

/* ─── Helpers ────────────────────────────────────────────── */
const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

/* ─── NavItem ────────────────────────────────────────────── */
function NavItem({ item, isActive }: { item: NavLink; isActive: boolean }) {
  const Icon = isActive ? item.iconActive : item.icon;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={item.title}
        className="relative h-10 rounded-xl transition-all duration-150"
        style={{
          background: isActive ? "var(--brand-xlight)" : "transparent",
          color: isActive ? "var(--brand)" : "var(--text-2)",
          borderLeft: isActive ? "3px solid var(--brand)" : "3px solid transparent",
        }}
      >
        <motion.div whileHover={{ x: isActive ? 0 : 4 }} whileTap={buttonTap} transition={{ type: "spring", stiffness: 400, damping: 30 }}>
          <Link href={item.url} className="flex items-center gap-3 w-full">
            <Icon
              size={17}
              style={{
                color: isActive ? "var(--brand)" : "var(--text-3)",
                flexShrink: 0,
              }}
            />
            <span
              className="text-sm font-medium truncate"
              style={{
                color: isActive ? "var(--brand)" : "var(--text-2)",
                fontFamily: "var(--font-body)",
              }}
            >
              {item.title}
            </span>
          </Link>
        </motion.div>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

/* ─── AppSidebar ─────────────────────────────────────────── */
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const sessionUser = session?.user as any;
  const isAdminOrHr =
    sessionUser?.role === "admin" || sessionUser?.role === "hr";

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
  };

  const user = session?.user;
  const initials = user?.name ? getInitials(user.name) : "U";

  return (
    <Sidebar
      collapsible="icon"
      style={
        {
          "--sidebar-width": "16rem",
          "--sidebar-width-icon": "4rem",
        } as React.CSSProperties
      }
      {...props}
    >
      {/* ── Header / Logo ─────────────────────────────────── */}
      <SidebarHeader
        style={{
          background: "var(--bg-subtle)",
          borderBottom: "1px solid var(--border-1)",
          padding: "0",
        }}
      >
        <div className="flex items-center gap-3 px-4" style={{ height: 64 }}>
          {/* Logo icon — orange filled rounded square */}
          <div
            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "var(--brand)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>

          {/* Brand name — hidden when icon-only */}
          <div className="flex flex-col group-data-[collapsible=icon]:hidden overflow-hidden">
            <span
              className="font-bold text-base leading-tight"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--text-1)",
                fontWeight: 700,
              }}
            >
              StaffOS
            </span>
            <span className="text-xs" style={{ color: "var(--text-3)" }}>
              HRMS & Payroll
            </span>
          </div>
        </div>
      </SidebarHeader>

      {/* ── Nav content ───────────────────────────────────── */}
      <SidebarContent
        style={{
          background: "var(--bg-subtle)",
          fontFamily: "var(--font-body)",
        }}
      >
        {navGroups.map((group, gi) => {
          const visibleItems = group.items.filter(
            (item) => !item.adminOnly || isAdminOrHr,
          );
          if (visibleItems.length === 0) return null;

          return (
            <SidebarGroup
              key={group.label}
              style={{
                padding: "12px 10px 0",
                ...(gi > 0
                  ? { marginTop: 6, borderTop: "1px solid var(--border-1)" }
                  : {}),
              }}
            >
              <SidebarGroupLabel
                className="group-data-[collapsible=icon]:hidden label-caps"
                style={{ marginBottom: 4 }}
              >
                {group.label}
              </SidebarGroupLabel>

              <SidebarGroupContent>
                <SidebarMenu style={{ gap: 2 }}>
                  {visibleItems.map((item) => (
                    <NavItem
                      key={item.url}
                      item={item}
                      isActive={item.match(pathname)}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}

        {/* System section */}
        <SidebarGroup
          style={{
            padding: "12px 10px 0",
            marginTop: 6,
            borderTop: "1px solid var(--border-1)",
          }}
        >
          <SidebarGroupLabel
            className="group-data-[collapsible=icon]:hidden label-caps"
            style={{ marginBottom: 4 }}
          >
            System
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu style={{ gap: 2 }}>
              {/* Sign out */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Sign Out"
                  onClick={handleSignOut}
                  className="h-10 rounded-xl cursor-pointer"
                  style={{ background: "transparent" }}
                >
                  <RiLogoutBoxLine
                    size={17}
                    style={{ color: "var(--text-3)", flexShrink: 0 }}
                  />
                  <span
                    className="text-sm font-medium group-data-[collapsible=icon]:hidden"
                    style={{ color: "var(--text-2)" }}
                  >
                    Sign Out
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ── Footer / User ─────────────────────────────────── */}
      <SidebarFooter
        style={{
          background: "var(--bg-subtle)",
          borderTop: "1px solid var(--border-1)",
          padding: "12px 10px",
        }}
      >
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              tooltip={user?.name || "Profile"}
              className="h-auto rounded-xl py-2.5 px-3"
              style={{ background: "transparent" }}
            >
              <a
                href="/profile"
                className="flex items-center gap-3"
                style={{ textDecoration: "none" }}
              >
                {/* Avatar — orange circle with initials */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                  style={{
                    background: "var(--brand)",
                    color: "var(--text-on-brand)",
                  }}
                >
                  {initials}
                </div>

                {/* Name + email */}
                <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
                  <span
                    className="text-sm font-medium truncate leading-tight"
                    style={{
                      fontFamily: "var(--font-body)",
                      color: "var(--text-1)",
                    }}
                  >
                    {user?.name || "User"}
                  </span>
                  <span
                    className="text-xs truncate"
                    style={{ color: "var(--text-3)" }}
                  >
                    {user?.email || ""}
                  </span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
