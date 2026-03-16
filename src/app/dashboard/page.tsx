"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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
  RiLoader4Line,
  RiAlertLine,
  RiCalendarCheckLine,
  RiBarChartBoxLine,
} from "react-icons/ri";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";

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

/* ─── Fade-up variant ────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.48, delay: i * 0.07 },
  }),
};

/* ─── Stat Card ──────────────────────────────────────────── */
function StatCard({
  title,
  value,
  sub,
  trend,
  icon: Icon,
  accent,
  index,
}: {
  title: string;
  value: string;
  sub: string;
  trend: "up" | "down" | "neutral";
  icon: React.ElementType;
  accent: string;
  index: number;
}) {
  const TrendIcon =
    trend === "up"
      ? RiArrowUpSLine
      : trend === "down"
        ? RiArrowDownSLine
        : null;
  const trendColor =
    trend === "up"
      ? "#16A34A"
      : trend === "down"
        ? "#E11D48"
        : "var(--muted-foreground)";

  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="relative rounded-2xl p-5 overflow-hidden"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        fontFamily: "var(--font-dm-sans)",
      }}
    >
      {/* Subtle accent blob */}
      <div
        className="absolute -top-6 -right-6 w-24 h-24 rounded-full pointer-events-none"
        style={{ background: accent, filter: "blur(28px)", opacity: 0.18 }}
      />

      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: accent + "20", border: `1px solid ${accent}30` }}
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
          fontFamily: "var(--font-playfair)",
          color: "var(--foreground)",
        }}
      >
        {value}
      </p>
      <p
        className="text-xs font-medium"
        style={{ color: "var(--muted-foreground)" }}
      >
        {title}
      </p>
      {trend === "neutral" && (
        <p
          className="text-xs mt-0.5"
          style={{ color: "var(--muted-foreground)", opacity: 0.6 }}
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
      className={`rounded-2xl overflow-hidden ${className}`}
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        fontFamily: "var(--font-dm-sans)",
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
      className="flex items-center justify-between px-6 py-4"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      <div>
        <h3
          className="text-base font-semibold"
          style={{
            fontFamily: "var(--font-playfair)",
            color: "var(--foreground)",
          }}
        >
          {title}
        </h3>
        {subtitle && (
          <p
            className="text-xs mt-0.5"
            style={{ color: "var(--muted-foreground)" }}
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
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{
          background: "var(--secondary)",
          border: "1px solid var(--border)",
        }}
      >
        <Icon size={24} style={{ color: "var(--muted-foreground)" }} />
      </div>
      <p
        className="text-sm font-semibold mb-1"
        style={{ color: "var(--foreground)" }}
      >
        {title}
      </p>
      <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>
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
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2.5 py-5 px-3 rounded-2xl transition-all duration-150 group w-full"
      style={{
        background: "var(--secondary)",
        border: "1px solid var(--border)",
        cursor: "pointer",
        fontFamily: "var(--font-dm-sans)",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.background = accent + "12";
        el.style.borderColor = accent + "40";
        el.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.background = "var(--secondary)";
        el.style.borderColor = "var(--border)";
        el.style.transform = "translateY(0)";
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
        style={{ background: accent + "18", border: `1px solid ${accent}28` }}
      >
        <Icon size={18} style={{ color: accent }} />
      </div>
      <span
        className="text-xs font-medium text-center"
        style={{ color: "var(--foreground)" }}
      >
        {label}
      </span>
    </button>
  );
}

/* ─── Main dashboard page ────────────────────────────────── */
export default function Home() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    return (
      <DashboardLayout title="Dashboard">
        <div
          className="flex items-center justify-center h-[80vh] gap-3"
          style={{ color: "var(--muted-foreground)" }}
        >
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          >
            <RiLoader4Line size={22} />
          </motion.span>
          <span className="text-sm">Loading dashboard…</span>
        </div>
      </DashboardLayout>
    );
  }

  if (!session?.user) return null;

  const firstName = session.user.name?.split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle={`${greeting}, ${firstName} 👋`}
    >
      <div
        className="p-6 space-y-6"
        style={{ fontFamily: "var(--font-dm-sans)" }}
      >
        {/* ── Welcome banner ──────────────────────────────── */}
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="relative rounded-2xl overflow-hidden flex items-center justify-between px-8 py-6"
          style={{
            background:
              "linear-gradient(135deg, var(--brand-navy) 0%, oklch(0.260 0.070 262) 100%)",
            minHeight: 110,
          }}
        >
          {/* Grid overlay */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.06]">
            <defs>
              <pattern
                id="dbgrid"
                width="36"
                height="36"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 36 0 L 0 0 0 36"
                  fill="none"
                  stroke="white"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dbgrid)" />
          </svg>
          {/* Rose glow */}
          <div
            className="absolute right-24 top-0 bottom-0 w-48 pointer-events-none"
            style={{
              background: "var(--brand-rose)",
              opacity: 0.12,
              filter: "blur(40px)",
            }}
          />

          <div className="relative z-10">
            <p
              className="text-xs font-medium tracking-widest uppercase mb-1"
              style={{ color: "oklch(1 0 0 / 0.45)" }}
            >
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
            <h2
              className="text-2xl font-bold text-white"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              {greeting},{" "}
              <span
                style={{
                  color: "var(--brand-rose-muted)",
                  fontStyle: "italic",
                }}
              >
                {firstName}.
              </span>
            </h2>
            <p
              className="text-sm mt-1"
              style={{ color: "oklch(1 0 0 / 0.50)" }}
            >
              {todayAtt.length} of {employees.length} employees checked in today
              {employees.length > 0 && ` — ${attendancePct}% attendance`}
            </p>
          </div>

          <button
            onClick={fetchData}
            className="relative z-10 flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl transition-all hover:opacity-80"
            style={{
              background: "oklch(1 0 0 / 0.10)",
              border: "1px solid oklch(1 0 0 / 0.18)",
              color: "white",
              cursor: "pointer",
              fontFamily: "var(--font-dm-sans)",
            }}
          >
            <RiRefreshLine size={14} />
            Refresh
          </button>
        </motion.div>

        {/* ── Stat cards ───────────────────────────────────── */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <StatCard
            index={1}
            title="Total Employees"
            value={employees.length.toString()}
            sub="All time"
            trend="neutral"
            icon={RiGroupLine}
            accent="#1E2040"
          />
          <StatCard
            index={2}
            title="Present Today"
            value={todayAtt.length.toString()}
            sub={`${attendancePct}% attendance`}
            trend="up"
            icon={RiUserFollowLine}
            accent="#16A34A"
          />
          <StatCard
            index={3}
            title="Absent Today"
            value={absent.toString()}
            sub={
              employees.length > 0
                ? `${100 - attendancePct}% of team`
                : "No data"
            }
            trend={absent > 0 ? "down" : "neutral"}
            icon={RiUserUnfollowLine}
            accent="#E11D48"
          />
          <StatCard
            index={4}
            title="Departments"
            value={departments.length.toString()}
            sub="Active units"
            trend="neutral"
            icon={RiBuildingLine}
            accent="#7C3AED"
          />
        </div>

        {/* ── Activity + Employees row ─────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-7">
          {/* Recent Activity */}
          <motion.div
            custom={5}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="lg:col-span-4"
          >
            <Section>
              <SectionHeader
                title="Recent Activity"
                subtitle="Today's check-in & check-out"
                action={
                  <button
                    onClick={() => router.push("/attendance")}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors hover:bg-secondary"
                    style={{
                      color: "var(--brand-rose)",
                      border: "1px solid var(--border)",
                      cursor: "pointer",
                      background: "transparent",
                    }}
                  >
                    View All <RiArrowRightLine size={12} />
                  </button>
                }
              />
              <div className="p-4">
                {todayAtt.length === 0 ? (
                  <Empty
                    icon={RiTimeLine}
                    title="No Activity Yet"
                    desc="No check-ins recorded today"
                    action={
                      <button
                        onClick={() => router.push("/attendance")}
                        className="btn-navy inline-flex items-center gap-2 w-auto px-4"
                        style={{
                          width: "auto",
                          display: "inline-flex",
                          padding: "10px 18px",
                          borderRadius: "10px",
                          background: "var(--brand-navy)",
                          color: "white",
                          fontSize: "0.8rem",
                          fontWeight: 500,
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        Mark Attendance
                      </button>
                    }
                  />
                ) : (
                  <div className="space-y-1">
                    {todayAtt.slice(0, 6).map((record, i) => {
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
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center gap-3 p-3 rounded-xl transition-colors"
                          style={{ fontFamily: "var(--font-dm-sans)" }}
                          onMouseEnter={(e) => {
                            (
                              e.currentTarget as HTMLDivElement
                            ).style.background = "var(--secondary)";
                          }}
                          onMouseLeave={(e) => {
                            (
                              e.currentTarget as HTMLDivElement
                            ).style.background = "transparent";
                          }}
                        >
                          {/* Avatar */}
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                            style={{
                              background: isCheckedOut
                                ? "var(--brand-navy)"
                                : "var(--brand-rose)",
                            }}
                          >
                            {initials}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p
                              className="text-sm font-medium truncate"
                              style={{ color: "var(--foreground)" }}
                            >
                              {name}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <RiMapPinLine
                                size={11}
                                style={{
                                  color: "var(--muted-foreground)",
                                  flexShrink: 0,
                                }}
                              />
                              <p
                                className="text-xs truncate"
                                style={{ color: "var(--muted-foreground)" }}
                              >
                                {record.zoneName || "Office"}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                            <span
                              className="text-xs font-medium px-2 py-0.5 rounded-full"
                              style={{
                                background: isCheckedOut
                                  ? "var(--secondary)"
                                  : "oklch(0.578 0.232 13 / 0.10)",
                                color: isCheckedOut
                                  ? "var(--muted-foreground)"
                                  : "var(--brand-rose)",
                                border: `1px solid ${isCheckedOut ? "var(--border)" : "oklch(0.578 0.232 13 / 0.20)"}`,
                              }}
                            >
                              {isCheckedOut ? "Out" : "In"}
                            </span>
                            <span
                              className="text-xs"
                              style={{ color: "var(--muted-foreground)" }}
                            >
                              {time}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Section>
          </motion.div>

          {/* Employees list */}
          <motion.div
            custom={6}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="lg:col-span-3"
          >
            <Section>
              <SectionHeader
                title="Employees"
                subtitle="Recently added"
                action={
                  <button
                    onClick={() => router.push("/employees/new")}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                    style={{
                      background: "var(--brand-rose)",
                      color: "white",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <RiAddLine size={13} /> Add
                  </button>
                }
              />
              <div className="p-4">
                {employees.length === 0 ? (
                  <Empty
                    icon={RiGroupLine}
                    title="No Employees Yet"
                    desc="Add your first employee to get started"
                    action={
                      <button
                        onClick={() => router.push("/employees/new")}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "10px 18px",
                          borderRadius: "10px",
                          background: "var(--brand-navy)",
                          color: "white",
                          fontSize: "0.8rem",
                          fontWeight: 500,
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        <RiAddLine size={14} /> Add Employee
                      </button>
                    }
                  />
                ) : (
                  <div className="space-y-1">
                    {employees.slice(0, 6).map((emp, i) => {
                      const inits =
                        `${emp.firstName[0]}${emp.lastName[0]}`.toUpperCase();
                      const colors = [
                        "#E11D48",
                        "#1E2040",
                        "#7C3AED",
                        "#0891B2",
                        "#D97706",
                        "#16A34A",
                      ];
                      return (
                        <motion.div
                          key={emp.id}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer"
                          onClick={() => router.push(`/employees/${emp.id}`)}
                          onMouseEnter={(e) => {
                            (
                              e.currentTarget as HTMLDivElement
                            ).style.background = "var(--secondary)";
                          }}
                          onMouseLeave={(e) => {
                            (
                              e.currentTarget as HTMLDivElement
                            ).style.background = "transparent";
                          }}
                        >
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                            style={{ background: colors[i % colors.length] }}
                          >
                            {inits}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-sm font-medium truncate"
                              style={{ color: "var(--foreground)" }}
                            >
                              {emp.firstName} {emp.lastName}
                            </p>
                            <p
                              className="text-xs truncate"
                              style={{ color: "var(--muted-foreground)" }}
                            >
                              {emp.designation}
                            </p>
                          </div>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{
                              background: "var(--secondary)",
                              color: "var(--muted-foreground)",
                              border: "1px solid var(--border)",
                            }}
                          >
                            {emp.department}
                          </span>
                        </motion.div>
                      );
                    })}
                    {employees.length > 6 && (
                      <button
                        onClick={() => router.push("/employees")}
                        className="w-full py-2.5 text-xs font-medium rounded-xl transition-colors mt-1"
                        style={{
                          background: "transparent",
                          color: "var(--brand-rose)",
                          border: "1px dashed var(--border)",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => {
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.background = "var(--secondary)";
                        }}
                        onMouseLeave={(e) => {
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.background = "transparent";
                        }}
                      >
                        View all {employees.length} employees →
                      </button>
                    )}
                  </div>
                )}
              </div>
            </Section>
          </motion.div>
        </div>

        {/* ── Department overview ───────────────────────────── */}
        <motion.div
          custom={7}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <Section>
            <SectionHeader
              title="Department Overview"
              subtitle="Headcount & today's attendance rate"
              action={
                <button
                  onClick={() => router.push("/organization")}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors hover:bg-secondary"
                  style={{
                    color: "var(--muted-foreground)",
                    border: "1px solid var(--border)",
                    cursor: "pointer",
                    background: "transparent",
                  }}
                >
                  <RiAddLine size={12} /> Add Department
                </button>
              }
            />
            <div className="p-6">
              {deptStats.length === 0 ? (
                <Empty
                  icon={RiBuildingLine}
                  title="No Departments"
                  desc="Create departments to organise your workforce"
                  action={
                    <button
                      onClick={() => router.push("/organization")}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "10px 18px",
                        borderRadius: "10px",
                        background: "var(--brand-navy)",
                        color: "white",
                        fontSize: "0.8rem",
                        fontWeight: 500,
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      <RiAddLine size={14} /> Create Department
                    </button>
                  }
                />
              ) : (
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {deptStats.map((dept, i) => {
                    const colors = [
                      "#E11D48",
                      "#1E2040",
                      "#7C3AED",
                      "#0891B2",
                      "#D97706",
                      "#16A34A",
                    ];
                    const color = colors[i % colors.length];
                    return (
                      <div
                        key={dept.name}
                        className="p-4 rounded-2xl"
                        style={{
                          background: "var(--secondary)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ background: color }}
                            />
                            <span
                              className="text-sm font-medium"
                              style={{ color: "var(--foreground)" }}
                            >
                              {dept.name}
                            </span>
                          </div>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                              background: "var(--card)",
                              color: "var(--muted-foreground)",
                              border: "1px solid var(--border)",
                            }}
                          >
                            {dept.count}{" "}
                            {dept.count === 1 ? "person" : "people"}
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span
                              className="text-xs"
                              style={{ color: "var(--muted-foreground)" }}
                            >
                              Today's attendance
                            </span>
                            <span
                              className="text-xs font-semibold"
                              style={{
                                color:
                                  dept.attendance >= 70
                                    ? "#16A34A"
                                    : dept.attendance >= 40
                                      ? "#D97706"
                                      : "#E11D48",
                              }}
                            >
                              {dept.attendance}%
                            </span>
                          </div>
                          <div
                            className="h-1.5 rounded-full overflow-hidden"
                            style={{ background: "var(--border)" }}
                          >
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${dept.attendance}%` }}
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
        <motion.div
          custom={8}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <Section>
            <SectionHeader
              title="Quick Actions"
              subtitle="Shortcuts to common tasks"
            />
            <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              <QuickAction
                icon={RiGroupLine}
                label="Add Employee"
                onClick={() => router.push("/employees/new")}
                accent="#1E2040"
              />
              <QuickAction
                icon={RiCalendarCheckLine}
                label="Mark Attendance"
                onClick={() => router.push("/attendance")}
                accent="#E11D48"
              />
              <QuickAction
                icon={RiMapPinLine}
                label="Manage Geofences"
                onClick={() => router.push("/geofencing")}
                accent="#7C3AED"
              />
              <QuickAction
                icon={RiBarChartBoxLine}
                label="View Reports"
                onClick={() => router.push("/attendance/dashboard")}
                accent="#0891B2"
              />
            </div>
          </Section>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
