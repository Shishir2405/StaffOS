"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";
import {
  RiGroupLine,
  RiUserFollowLine,
  RiUserUnfollowLine,
  RiBuildingLine,
  RiMapPinLine,
  RiCheckboxCircleLine,
  RiTimeLine,
  RiAddLine,
  RiRefreshLine,
  RiArrowRightLine,
  RiArrowUpSLine,
  RiArrowDownSLine,
  RiCalendarCheckLine,
  RiBarChartBoxLine,
} from "react-icons/ri";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useSession } from "@/lib/auth-client";
import { toast } from "@/components/ui/custom-toast";
import {
  pageVariants,
  fadeUp,
  staggerContainer,
  listItem,
  buttonTap,
} from "@/lib/animations";
import { ActivityHeatmap, TeamPulse, ProductivityRing } from "@/components/innovative-widgets";

/* ─── Types ──────────────────────────────────────────────── */
interface Employee {
  id: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  designation: string;
}

interface AttendanceRecord {
  id: number;
  employeeId: number;
  employeeName?: string;
  checkInTime: string;
  checkOutTime: string | null;
  zoneName?: string;
  status: string;
}

interface Department {
  id: number;
  name: string;
  description: string;
  employeeCount?: number;
}

/* ─── Animated Number ────────────────────────────────────── */
function AnimatedNumber({ value }: { value: number }) {
  const motionVal = useMotionValue(0);
  const springVal = useSpring(motionVal, { stiffness: 100, damping: 30 });
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    motionVal.set(value);
  }, [value, motionVal]);

  useEffect(() => {
    const unsubscribe = springVal.on("change", (v) => {
      setDisplay(Math.round(v));
    });
    return unsubscribe;
  }, [springVal]);

  return (
    <span ref={ref} style={{ fontFamily: "var(--font-mono-face)" }}>
      {display}
    </span>
  );
}

/* ─── Live Clock Widget ──────────────────────────────────── */
function LiveClock({ isCheckedIn }: { isCheckedIn: boolean }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = time.getHours().toString().padStart(2, "0");
  const minutes = time.getMinutes().toString().padStart(2, "0");
  const seconds = time.getSeconds().toString().padStart(2, "0");

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        {/* Pulsing ring when clocked in */}
        {isCheckedIn && (
          <div
            className="absolute inset-0 rounded-full pulse-ring"
            style={{
              border: "2px solid var(--brand)",
              margin: -4,
              borderRadius: "50%",
              width: "calc(100% + 8px)",
              height: "calc(100% + 8px)",
            }}
          />
        )}
        <div
          className="w-3 h-3 rounded-full"
          style={{
            background: isCheckedIn ? "var(--success)" : "var(--text-3)",
          }}
        />
      </div>
      <div style={{ fontFamily: "var(--font-mono-face)" }}>
        <span className="text-2xl font-bold" style={{ color: "var(--text-1)", letterSpacing: "1px" }}>
          {hours}:{minutes}
        </span>
        <span className="text-sm ml-1" style={{ color: "var(--text-3)" }}>
          {seconds}
        </span>
      </div>
      <span
        className="text-xs font-medium px-2 py-0.5 rounded-full"
        style={{
          background: isCheckedIn ? "var(--success-bg)" : "var(--bg-subtle)",
          color: isCheckedIn ? "var(--success)" : "var(--text-3)",
          border: `1px solid ${isCheckedIn ? "var(--success)" : "var(--border-1)"}`,
        }}
      >
        {isCheckedIn ? "Clocked In" : "Not Clocked In"}
      </span>
    </div>
  );
}

/* ─── Skeleton Loader ────────────────────────────────────── */
function DashboardSkeleton() {
  return (
    <DashboardLayout title="Dashboard">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Welcome banner skeleton */}
        <div className="skeleton-pulse h-28 rounded-[var(--r-lg)]" />
        {/* Stat cards skeleton */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton-pulse h-32 rounded-[var(--r-lg)]" />
          ))}
        </div>
        {/* Content skeleton */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
          <div className="lg:col-span-4 skeleton-pulse h-80 rounded-[var(--r-lg)]" />
          <div className="lg:col-span-3 skeleton-pulse h-80 rounded-[var(--r-lg)]" />
        </div>
      </div>
    </DashboardLayout>
  );
}

/* ─── Stat Card ──────────────────────────────────────────── */
function StatCard({
  title,
  value,
  sub,
  trend,
  icon: Icon,
  accent,
}: {
  title: string;
  value: number;
  sub: string;
  trend: "up" | "down" | "neutral";
  icon: React.ElementType;
  accent: string;
}) {
  const TrendIcon =
    trend === "up"
      ? RiArrowUpSLine
      : trend === "down"
        ? RiArrowDownSLine
        : null;
  const trendColor =
    trend === "up"
      ? "var(--success)"
      : trend === "down"
        ? "var(--danger)"
        : "var(--text-3)";

  return (
    <motion.div
      variants={fadeUp}
      className="relative rounded-[var(--r-lg)] p-5 overflow-hidden transition-all duration-200"
      style={{
        background: "var(--bg-raised)",
        border: "1px solid var(--border-1)",
        boxShadow: "var(--shadow-sm)",
      }}
      whileHover={{
        y: -3,
        boxShadow: "var(--shadow-md)",
      }}
    >
      {/* Subtle accent blob */}
      <div
        className="absolute -top-6 -right-6 w-24 h-24 rounded-full pointer-events-none"
        style={{ background: accent, filter: "blur(28px)", opacity: 0.12 }}
      />

      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-[var(--r-md)] flex items-center justify-center shrink-0"
          style={{ background: accent + "18", border: `1px solid ${accent}28` }}
        >
          <Icon size={18} style={{ color: accent }} />
        </div>
        {TrendIcon && (
          <div className="flex items-center gap-1">
            <TrendIcon size={12} style={{ color: trendColor }} />
            <span className="text-xs font-medium" style={{ color: trendColor }}>
              {sub}
            </span>
          </div>
        )}
      </div>

      <p
        className="text-3xl font-bold mb-1"
        style={{
          fontFamily: "var(--font-display)",
          color: "var(--text-1)",
        }}
      >
        <AnimatedNumber value={value} />
      </p>
      <p
        className="text-xs font-medium label-caps"
      >
        {title}
      </p>
      {trend === "neutral" && (
        <p
          className="text-xs mt-0.5"
          style={{ color: "var(--text-3)", opacity: 0.6 }}
        >
          {sub}
        </p>
      )}
    </motion.div>
  );
}

/* ─── Section wrapper ────────────────────────────────────── */
function Section({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[var(--r-lg)] overflow-hidden transition-all duration-200 ${className}`}
      style={{
        background: "var(--bg-raised)",
        border: "1px solid var(--border-1)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {children}
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center justify-between px-4 sm:px-6 py-4"
      style={{ borderBottom: "1px solid var(--border-1)" }}
    >
      <div>
        <h3
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--text-1)",
          }}
        >
          {title}
        </h3>
        {subtitle && (
          <p
            className="text-xs mt-0.5"
            style={{ color: "var(--text-3)" }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

/* ─── Empty state ────────────────────────────────────────── */
function Empty({
  icon: Icon,
  title,
  desc,
  action,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
      <div
        className="w-14 h-14 rounded-[var(--r-lg)] flex items-center justify-center mb-4"
        style={{
          background: "var(--bg-subtle)",
          border: "1px solid var(--border-1)",
        }}
      >
        <Icon size={24} style={{ color: "var(--text-3)" }} />
      </div>
      <p
        className="text-sm font-semibold mb-1"
        style={{ color: "var(--text-1)" }}
      >
        {title}
      </p>
      <p className="text-xs mb-4" style={{ color: "var(--text-3)" }}>
        {desc}
      </p>
      {action}
    </div>
  );
}

/* ─── Quick action button ────────────────────────────────── */
function QuickAction({
  icon: Icon,
  label,
  onClick,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  accent: string;
}) {
  return (
    <motion.button
      whileTap={buttonTap}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="flex flex-col items-center gap-2.5 py-5 px-3 rounded-[var(--r-lg)] transition-all duration-150 w-full"
      style={{
        background: "var(--bg-subtle)",
        border: "1px solid var(--border-1)",
        cursor: "pointer",
        fontFamily: "var(--font-body)",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.background = accent + "12";
        el.style.borderColor = accent + "40";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.background = "var(--bg-subtle)";
        el.style.borderColor = "var(--border-1)";
      }}
    >
      <div
        className="w-10 h-10 rounded-[var(--r-md)] flex items-center justify-center transition-colors"
        style={{ background: accent + "18", border: `1px solid ${accent}28` }}
      >
        <Icon size={18} style={{ color: accent }} />
      </div>
      <span
        className="text-xs font-medium text-center"
        style={{ color: "var(--text-1)" }}
      >
        {label}
      </span>
    </motion.button>
  );
}

/* ─── Main dashboard page ────────────────────────────────── */
export default function Home() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { ref: deptRef, inView: deptInView } = useInView({ triggerOnce: true, threshold: 0.1 });

  useEffect(() => {
    if (!isPending && !session?.user) router.push("/sign-in");
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) fetchData();
  }, [session]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("bearer_token");
      const headers = { Authorization: `Bearer ${token}` };

      const [eRes, aRes, dRes] = await Promise.all([
        fetch("/api/employees", { headers }),
        fetch("/api/attendance", { headers }),
        fetch("/api/departments", { headers }),
      ]);

      if (eRes.ok) {
        const d = await eRes.json();
        if (d.success && Array.isArray(d.data)) setEmployees(d.data);
      }
      if (aRes.ok) {
        const d = await aRes.json();
        if (d.success && Array.isArray(d.data)) setAttendanceRecords(d.data);
      }
      if (dRes.ok) {
        const d = await dRes.json();
        if (d.success && Array.isArray(d.data)) setDepartments(d.data);
      }
    } catch {
      toast.error("Failed to fetch dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  /* Derived stats */
  const today = new Date().toDateString();
  const todayAtt = attendanceRecords.filter(
    (r) => new Date(r.checkInTime).toDateString() === today,
  );
  const absent = employees.length - todayAtt.length;
  const attendancePct =
    employees.length > 0
      ? Math.round((todayAtt.length / employees.length) * 100)
      : 0;
  const isCheckedIn = todayAtt.some((r) => !r.checkOutTime);

  const deptStats = departments.map((dept) => {
    const dEmp = employees.filter((e) => e.department === dept.name);
    const dAtt = todayAtt.filter((a) =>
      employees.find(
        (e) => e.id === a.employeeId && e.department === dept.name,
      ),
    );
    return {
      name: dept.name,
      count: dEmp.length,
      attendance:
        dEmp.length > 0 ? Math.round((dAtt.length / dEmp.length) * 100) : 0,
    };
  });

  /* Loading */
  if (isPending || isLoading) {
    return <DashboardSkeleton />;
  }

  if (!session?.user) return null;

  const firstName = session.user.name?.split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle={`${greeting}, ${firstName}`}
    >
      <motion.div
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        className="p-4 sm:p-6 lg:p-8 space-y-6"
        style={{ fontFamily: "var(--font-body)" }}
      >
        {/* ── Live Clock + Welcome banner ────────────────── */}
        <motion.div
          variants={fadeUp}
          className="relative rounded-[var(--r-lg)] overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 sm:px-8 py-6 gap-4"
          style={{
            background: "linear-gradient(135deg, #1C1208 0%, #3D2B14 50%, #4A3520 100%)",
            minHeight: 110,
          }}
        >
          {/* Grid overlay */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.08]">
            <defs>
              <pattern id="dbgrid" width="36" height="36" patternUnits="userSpaceOnUse">
                <path d="M 36 0 L 0 0 0 36" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dbgrid)" />
          </svg>

          <div className="relative z-10">
            <div className="mb-2">
              <LiveClock isCheckedIn={isCheckedIn} />
            </div>
            <p
              className="text-xs font-medium tracking-widest uppercase mb-1"
              style={{ color: "rgba(255,255,255,0.55)" }}
            >
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
            <h2
              className="text-xl sm:text-2xl font-bold text-white"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {greeting},{" "}
              <span style={{ color: "var(--brand-light)", fontStyle: "italic" }}>
                {firstName}.
              </span>
            </h2>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.60)" }}>
              {todayAtt.length} of {employees.length} employees checked in today
              {employees.length > 0 && ` \u2014 ${attendancePct}% attendance`}
            </p>
          </div>

          <motion.button
            whileTap={buttonTap}
            whileHover={{ opacity: 0.92 }}
            onClick={fetchData}
            className="relative z-10 flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-[var(--r-md)] transition-all"
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.25)",
              color: "white",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
            }}
          >
            <RiRefreshLine size={14} />
            Refresh
          </motion.button>
        </motion.div>

        {/* ── Stat cards ───────────────────────────────────── */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        >
          <StatCard
            title="Total Employees"
            value={employees.length}
            sub="All time"
            trend="neutral"
            icon={RiGroupLine}
            accent="#4A154B"
          />
          <StatCard
            title="Present Today"
            value={todayAtt.length}
            sub={`${attendancePct}% attendance`}
            trend="up"
            icon={RiUserFollowLine}
            accent="#16A34A"
          />
          <StatCard
            title="Absent Today"
            value={absent}
            sub={
              employees.length > 0
                ? `${100 - attendancePct}% of team`
                : "No data"
            }
            trend={absent > 0 ? "down" : "neutral"}
            icon={RiUserUnfollowLine}
            accent="#DC2626"
          />
          <StatCard
            title="Departments"
            value={departments.length}
            sub="Active units"
            trend="neutral"
            icon={RiBuildingLine}
            accent="#7C3AED"
          />
        </motion.div>

        {/* ── Activity + Employees row ─────────────────────── */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
          {/* Recent Activity */}
          <motion.div variants={fadeUp} className="lg:col-span-4">
            <Section>
              <SectionHeader
                title="Recent Activity"
                subtitle="Today's check-in & check-out"
                action={
                  <motion.button
                    whileTap={buttonTap}
                    whileHover={{ opacity: 0.92 }}
                    onClick={() => router.push("/dashboard/attendance")}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-[var(--r-sm)] transition-colors"
                    style={{
                      color: "var(--brand)",
                      border: "1px solid var(--border-1)",
                      cursor: "pointer",
                      background: "transparent",
                    }}
                  >
                    View All <RiArrowRightLine size={12} />
                  </motion.button>
                }
              />
              <div className="p-4">
                {todayAtt.length === 0 ? (
                  <Empty
                    icon={RiTimeLine}
                    title="No Activity Yet"
                    desc="No check-ins recorded today"
                    action={
                      <motion.button
                        whileTap={buttonTap}
                        onClick={() => router.push("/dashboard/attendance")}
                        className="inline-flex items-center gap-2"
                        style={{
                          padding: "10px 18px",
                          borderRadius: "var(--r-md)",
                          background: "var(--brand)",
                          color: "var(--text-on-brand)",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        Mark Attendance
                      </motion.button>
                    }
                  />
                ) : (
                  <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="space-y-1"
                  >
                    {todayAtt.slice(0, 6).map((record) => {
                      const isCheckedOut = !!record.checkOutTime;
                      const name = record.employeeName || "Unknown";
                      const initials = name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase();
                      const time = new Date(
                        record.checkInTime,
                      ).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      return (
                        <motion.div
                          key={record.id}
                          variants={listItem}
                          className="flex items-center gap-3 p-3 rounded-[var(--r-md)] transition-colors"
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLDivElement).style.background =
                              "var(--brand-ghost)";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLDivElement).style.background =
                              "transparent";
                          }}
                        >
                          {/* Avatar */}
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                            style={{
                              background: isCheckedOut
                                ? "var(--bg-subtle)"
                                : "var(--brand)",
                              color: isCheckedOut
                                ? "var(--text-2)"
                                : "var(--text-on-brand)",
                              border: isCheckedOut ? "1px solid var(--border-1)" : "none",
                            }}
                          >
                            {initials}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p
                              className="text-sm font-medium truncate"
                              style={{ color: "var(--text-1)" }}
                            >
                              {name}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <RiMapPinLine
                                size={11}
                                style={{ color: "var(--text-3)", flexShrink: 0 }}
                              />
                              <p className="text-xs truncate" style={{ color: "var(--text-3)" }}>
                                {record.zoneName || "Office"}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <span
                              className="text-xs font-semibold px-2 py-0.5 rounded-full uppercase"
                              style={{
                                background: isCheckedOut
                                  ? "var(--bg-subtle)"
                                  : "var(--brand-xlight)",
                                color: isCheckedOut
                                  ? "var(--text-3)"
                                  : "var(--brand)",
                                border: `1px solid ${isCheckedOut ? "var(--border-1)" : "var(--brand-light)"}`,
                                fontSize: "10px",
                                letterSpacing: "0.5px",
                              }}
                            >
                              {isCheckedOut ? "Out" : "In"}
                            </span>
                            <span
                              className="text-xs"
                              style={{ color: "var(--text-3)", fontFamily: "var(--font-mono-face)" }}
                            >
                              {time}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </div>
            </Section>
          </motion.div>

          {/* Employees list */}
          <motion.div variants={fadeUp} className="lg:col-span-3">
            <Section>
              <SectionHeader
                title="Employees"
                subtitle="Recently added"
                action={
                  <motion.button
                    whileTap={buttonTap}
                    whileHover={{ opacity: 0.92 }}
                    onClick={() => router.push("/dashboard/employees/new")}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-[var(--r-sm)] transition-colors"
                    style={{
                      background: "var(--brand)",
                      color: "var(--text-on-brand)",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <RiAddLine size={13} /> Add
                  </motion.button>
                }
              />
              <div className="p-4">
                {employees.length === 0 ? (
                  <Empty
                    icon={RiGroupLine}
                    title="No Employees Yet"
                    desc="Add your first employee to get started"
                    action={
                      <motion.button
                        whileTap={buttonTap}
                        onClick={() => router.push("/dashboard/employees/new")}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "10px 18px",
                          borderRadius: "var(--r-md)",
                          background: "var(--brand)",
                          color: "var(--text-on-brand)",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        <RiAddLine size={14} /> Add Employee
                      </motion.button>
                    }
                  />
                ) : (
                  <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="space-y-1"
                  >
                    {employees.slice(0, 6).map((emp, i) => {
                      const inits =
                        `${emp.firstName[0]}${emp.lastName[0]}`.toUpperCase();
                      const colors = [
                        "#4A154B", "#16A34A", "#7C3AED",
                        "#2563EB", "#4A154B", "#DC2626",
                      ];
                      return (
                        <motion.div
                          key={emp.id}
                          variants={listItem}
                          className="flex items-center gap-3 p-3 rounded-[var(--r-md)] transition-colors cursor-pointer"
                          onClick={() => router.push(`/dashboard/employees/${emp.id}`)}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLDivElement).style.background =
                              "var(--brand-ghost)";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLDivElement).style.background =
                              "transparent";
                          }}
                        >
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
                            style={{ background: colors[i % colors.length] }}
                          >
                            {inits}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: "var(--text-1)" }}>
                              {emp.firstName} {emp.lastName}
                            </p>
                            <p className="text-xs truncate" style={{ color: "var(--text-3)" }}>
                              {emp.designation}
                            </p>
                          </div>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full shrink-0 label-caps"
                            style={{
                              background: "var(--bg-subtle)",
                              color: "var(--text-3)",
                              border: "1px solid var(--border-1)",
                              fontSize: "10px",
                            }}
                          >
                            {emp.department}
                          </span>
                        </motion.div>
                      );
                    })}
                    {employees.length > 6 && (
                      <motion.button
                        whileTap={buttonTap}
                        onClick={() => router.push("/dashboard/employees")}
                        className="w-full py-2.5 text-xs font-semibold rounded-[var(--r-md)] transition-colors mt-1"
                        style={{
                          background: "transparent",
                          color: "var(--brand)",
                          border: "1px dashed var(--border-1)",
                          cursor: "pointer",
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
                        View all {employees.length} employees &rarr;
                      </motion.button>
                    )}
                  </motion.div>
                )}
              </div>
            </Section>
          </motion.div>
        </div>

        {/* ── Department overview (in-view triggered) ──────── */}
        <motion.div
          ref={deptRef}
          variants={fadeUp}
          initial="hidden"
          animate={deptInView ? "visible" : "hidden"}
        >
          <Section>
            <SectionHeader
              title="Department Overview"
              subtitle="Headcount & today's attendance rate"
              action={
                <motion.button
                  whileTap={buttonTap}
                  whileHover={{ opacity: 0.92 }}
                  onClick={() => router.push("/dashboard/organization")}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-[var(--r-sm)] transition-colors"
                  style={{
                    color: "var(--text-2)",
                    border: "1px solid var(--border-1)",
                    cursor: "pointer",
                    background: "transparent",
                  }}
                >
                  <RiAddLine size={12} /> Add Department
                </motion.button>
              }
            />
            <div className="p-4 sm:p-6">
              {deptStats.length === 0 ? (
                <Empty
                  icon={RiBuildingLine}
                  title="No Departments"
                  desc="Create departments to organise your workforce"
                  action={
                    <motion.button
                      whileTap={buttonTap}
                      onClick={() => router.push("/dashboard/organization")}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "10px 18px",
                        borderRadius: "var(--r-md)",
                        background: "var(--brand)",
                        color: "var(--text-on-brand)",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      <RiAddLine size={14} /> Create Department
                    </motion.button>
                  }
                />
              ) : (
                <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {deptStats.map((dept, i) => {
                    const colors = [
                      "#4A154B", "#16A34A", "#7C3AED",
                      "#2563EB", "#4A154B", "#DC2626",
                    ];
                    const color = colors[i % colors.length];
                    return (
                      <div
                        key={dept.name}
                        className="p-4 rounded-[var(--r-lg)]"
                        style={{
                          background: "var(--bg-subtle)",
                          border: "1px solid var(--border-1)",
                        }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ background: color }}
                            />
                            <span
                              className="text-sm font-medium"
                              style={{ color: "var(--text-1)" }}
                            >
                              {dept.name}
                            </span>
                          </div>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                              background: "var(--bg-raised)",
                              color: "var(--text-3)",
                              border: "1px solid var(--border-1)",
                              fontFamily: "var(--font-mono-face)",
                            }}
                          >
                            {dept.count} {dept.count === 1 ? "person" : "people"}
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs" style={{ color: "var(--text-3)" }}>
                              Today's attendance
                            </span>
                            <span
                              className="text-xs font-semibold"
                              style={{
                                color:
                                  dept.attendance >= 70
                                    ? "var(--success)"
                                    : dept.attendance >= 40
                                      ? "var(--warning)"
                                      : "var(--danger)",
                                fontFamily: "var(--font-mono-face)",
                              }}
                            >
                              {dept.attendance}%
                            </span>
                          </div>
                          <div
                            className="h-1.5 rounded-full overflow-hidden"
                            style={{ background: "var(--border-1)" }}
                          >
                            <motion.div
                              initial={{ width: 0 }}
                              animate={deptInView ? { width: `${dept.attendance}%` } : { width: 0 }}
                              transition={{
                                duration: 0.8,
                                delay: 0.3 + i * 0.08,
                                ease: "easeOut",
                              }}
                              className="h-full rounded-full"
                              style={{ background: color }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Section>
        </motion.div>

        {/* ── Quick actions ─────────────────────────────────── */}
        <motion.div variants={fadeUp}>
          <Section>
            <SectionHeader
              title="Quick Actions"
              subtitle="Shortcuts to common tasks"
            />
            <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <QuickAction
                icon={RiGroupLine}
                label="Add Employee"
                onClick={() => router.push("/dashboard/employees/new")}
                accent="#4A154B"
              />
              <QuickAction
                icon={RiCalendarCheckLine}
                label="Mark Attendance"
                onClick={() => router.push("/dashboard/attendance")}
                accent="#16A34A"
              />
              <QuickAction
                icon={RiMapPinLine}
                label="Manage Geofences"
                onClick={() => router.push("/dashboard/geofencing")}
                accent="#7C3AED"
              />
              <QuickAction
                icon={RiBarChartBoxLine}
                label="View Reports"
                onClick={() => router.push("/dashboard/attendance/dashboard")}
                accent="#2563EB"
              />
            </div>
          </Section>
        </motion.div>

        {/* ── Innovative Widgets Row ───────────────────────── */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {/* Activity Heatmap */}
          <div className="sm:col-span-2 lg:col-span-1">
            <ActivityHeatmap attendanceData={attendanceRecords} />
          </div>

          {/* Team Pulse */}
          <TeamPulse
            onlineEmployees={todayAtt
              .filter((r) => !r.checkOutTime)
              .map((r) => ({
                name: r.employeeName || "Unknown",
                initials: (r.employeeName || "U")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase(),
                zone: r.zoneName,
              }))}
          />

          {/* Productivity Score */}
          <ProductivityRing
            score={employees.length > 0 ? attendancePct : 0}
            label="Workforce Score"
            sublabel="Based on today's attendance rate"
          />
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
