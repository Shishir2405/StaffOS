"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiGroupLine,
  RiUserFollowLine,
  RiBuildingLine,
  RiAddLine,
  RiSearchLine,
  RiDownloadLine,
  RiMoreLine,
  RiEyeLine,
  RiEditLine,
  RiDeleteBinLine,
  RiMailLine,
  RiPhoneLine,
  RiLoader4Line,
  RiFilterLine,
  RiCalendarLine,
} from "react-icons/ri";
import { DashboardLayout } from "@/components/dashboard-layout";
import { toast } from "sonner";

/* ─── Types ──────────────────────────────────────────────── */
interface Employee {
  id: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  employmentType: string;
  employmentStatus: string;
  avatarUrl: string | null;
  dateOfJoining: string;
}

/* ─── Helpers ────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.06 },
  }),
};

const COLORS = [
  "#E11D48",
  "#1E2040",
  "#7C3AED",
  "#0891B2",
  "#D97706",
  "#16A34A",
];
const colorFor = (i: number) => COLORS[i % COLORS.length];

const initials = (first: string, last: string) =>
  `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();

/* ─── Status badge ───────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; color: string }> = {
    Active: { bg: "oklch(0.16 0.04 145 / 0.15)", color: "#16A34A" },
    Inactive: { bg: "var(--secondary)", color: "var(--muted-foreground)" },
    Terminated: {
      bg: "oklch(0.68 0.22 13 / 0.12)",
      color: "var(--brand-rose)",
    },
  };
  const c = cfg[status] ?? cfg.Inactive;
  return (
    <span
      className="text-xs font-medium px-2.5 py-1 rounded-full"
      style={{
        background: c.bg,
        color: c.color,
        border: `1px solid ${c.color}30`,
      }}
    >
      {status}
    </span>
  );
}

/* ─── Type badge ─────────────────────────────────────────── */
function TypeBadge({ type }: { type: string }) {
  const cfg: Record<string, { bg: string; color: string }> = {
    "Full-time": {
      bg: "oklch(0.20 0.07 262 / 0.10)",
      color: "var(--brand-navy)",
    },
    "Part-time": { bg: "oklch(0.49 0.16 264 / 0.12)", color: "#7C3AED" },
    Contract: { bg: "oklch(0.68 0.14 55 / 0.12)", color: "#D97706" },
  };
  const c = cfg[type] ?? {
    bg: "var(--secondary)",
    color: "var(--muted-foreground)",
  };
  return (
    <span
      className="text-xs font-medium px-2.5 py-1 rounded-full"
      style={{
        background: c.bg,
        color: c.color,
        border: `1px solid ${c.color}30`,
      }}
    >
      {type}
    </span>
  );
}

/* ─── Stat card ──────────────────────────────────────────── */
function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  index,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  accent: string;
  index: number;
}) {
  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="relative rounded-2xl p-5 overflow-hidden"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div
        className="absolute -top-5 -right-5 w-20 h-20 rounded-full pointer-events-none"
        style={{ background: accent, filter: "blur(24px)", opacity: 0.15 }}
      />
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: accent + "18", border: `1px solid ${accent}28` }}
        >
          <Icon size={17} style={{ color: accent }} />
        </div>
      </div>
      <p
        className="text-2xl font-bold mb-0.5"
        style={{
          fontFamily: "var(--font-playfair)",
          color: "var(--foreground)",
        }}
      >
        {value}
      </p>
      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
        {label}
      </p>
    </motion.div>
  );
}

/* ─── Select ─────────────────────────────────────────────── */
function StyledSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
  placeholder: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none text-sm pl-3 pr-8 py-2.5 rounded-xl outline-none cursor-pointer transition-all"
        style={{
          background: "var(--card)",
          border: "1.5px solid var(--border)",
          color: "var(--foreground)",
          fontFamily: "var(--font-dm-sans)",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "var(--brand-rose)";
          e.currentTarget.style.boxShadow =
            "0 0 0 3px oklch(0.578 0.232 13 / 0.10)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "var(--border)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <option value="all">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <RiFilterLine
        size={13}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: "var(--muted-foreground)" }}
      />
    </div>
  );
}

/* ─── Row action menu ────────────────────────────────────── */
function RowMenu({
  employee,
  onDelete,
  onView,
  onEdit,
}: {
  employee: Employee;
  onDelete: () => void;
  onView: () => void;
  onEdit: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex justify-end">
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
        style={{
          background: "transparent",
          border: "none",
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
        <RiMoreLine size={16} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.13 }}
              className="absolute right-0 top-9 z-50 rounded-xl overflow-hidden py-1"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                boxShadow: "0 8px 24px -6px oklch(0 0 0 / 0.15)",
                minWidth: 160,
                fontFamily: "var(--font-dm-sans)",
              }}
            >
              {[
                {
                  icon: RiEyeLine,
                  label: "View Details",
                  onClick: onView,
                  color: "var(--foreground)",
                },
                {
                  icon: RiEditLine,
                  label: "Edit",
                  onClick: onEdit,
                  color: "var(--foreground)",
                },
                {
                  icon: RiDeleteBinLine,
                  label: "Delete",
                  onClick: onDelete,
                  color: "var(--brand-rose)",
                },
              ].map((item, i) => (
                <button
                  key={item.label}
                  onClick={() => {
                    item.onClick();
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-left transition-colors"
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: item.color,
                    borderTop: i === 2 ? "1px solid var(--border)" : "none",
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
                  <item.icon size={14} style={{ flexShrink: 0 }} />
                  {item.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────── */
export default function EmployeesPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    if (!isPending && !session?.user) router.push("/sign-in");
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) fetchEmployees();
  }, [search, deptFilter, statusFilter, typeFilter, session]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (deptFilter !== "all") params.append("department", deptFilter);
      if (statusFilter !== "all")
        params.append("employmentStatus", statusFilter);
      if (typeFilter !== "all") params.append("employmentType", typeFilter);
      const token = localStorage.getItem("bearer_token");
      const res = await fetch(`/api/employees?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const d = await res.json();
        setEmployees(
          d.success && Array.isArray(d.data)
            ? d.data
            : Array.isArray(d)
              ? d
              : [],
        );
      }
    } catch {
      toast.error("Failed to fetch employees");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this employee?")) return;
    try {
      const token = localStorage.getItem("bearer_token");
      const res = await fetch(`/api/employees?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Employee deleted");
        fetchEmployees();
      } else toast.error("Failed to delete employee");
    } catch {
      toast.error("An error occurred");
    }
  };

  const departments = [
    "Engineering",
    "Sales",
    "Marketing",
    "HR",
    "Finance",
    "Operations",
  ];
  const active = employees.filter(
    (e) => e.employmentStatus === "Active",
  ).length;
  const deptCount = new Set(employees.map((e) => e.department)).size;
  const newThisMonth = employees.filter((e) => {
    const d = new Date(e.dateOfJoining);
    const n = new Date();
    return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  }).length;

  if (isPending)
    return (
      <DashboardLayout title="Employees">
        <div
          className="flex items-center justify-center h-80 gap-2"
          style={{ color: "var(--muted-foreground)" }}
        >
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          >
            <RiLoader4Line size={20} />
          </motion.span>
          <span className="text-sm">Loading…</span>
        </div>
      </DashboardLayout>
    );

  return (
    <DashboardLayout
      title="Employees"
      subtitle="Manage your organisation's people"
    >
      <div
        className="p-6 space-y-6"
        style={{ fontFamily: "var(--font-dm-sans)" }}
      >
        {/* ── Page header ──────────────────────────────────── */}
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1
              className="text-2xl font-bold"
              style={{
                fontFamily: "var(--font-playfair)",
                color: "var(--foreground)",
              }}
            >
              Employee Directory
            </h1>
            <p
              className="text-sm mt-0.5"
              style={{ color: "var(--muted-foreground)" }}
            >
              {employees.length} employee{employees.length !== 1 ? "s" : ""}{" "}
              total
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchEmployees}
              className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl transition-all"
              style={{
                background: "var(--card)",
                border: "1.5px solid var(--border)",
                color: "var(--foreground)",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "var(--secondary)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "var(--card)";
              }}
            >
              <RiDownloadLine size={15} /> Export
            </button>
            <button
              onClick={() => router.push("/dashboard/employees/new")}
              className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl transition-all hover:opacity-90"
              style={{
                background: "var(--brand-navy)",
                color: "white",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 16px -4px oklch(0.198 0.068 262 / 0.35)",
              }}
            >
              <RiAddLine size={15} /> Add Employee
            </button>
          </div>
        </motion.div>

        {/* ── Stats ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            index={1}
            label="Total Employees"
            value={employees.length}
            icon={RiGroupLine}
            accent="#1E2040"
          />
          <StatCard
            index={2}
            label="Active"
            value={active}
            icon={RiUserFollowLine}
            accent="#16A34A"
          />
          <StatCard
            index={3}
            label="Departments"
            value={deptCount}
            icon={RiBuildingLine}
            accent="#7C3AED"
          />
          <StatCard
            index={4}
            label="Joined This Month"
            value={newThisMonth}
            icon={RiCalendarLine}
            accent="#E11D48"
          />
        </div>

        {/* ── Filters ───────────────────────────────────────── */}
        <motion.div
          custom={5}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="rounded-2xl p-5"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div className="relative sm:col-span-2 lg:col-span-1">
              <RiSearchLine
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--muted-foreground)" }}
              />
              <input
                type="text"
                placeholder="Search employees…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-sm pl-9 pr-3 py-2.5 rounded-xl outline-none transition-all"
                style={{
                  background: "var(--background)",
                  border: "1.5px solid var(--border)",
                  color: "var(--foreground)",
                  fontFamily: "var(--font-dm-sans)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--brand-rose)";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 3px oklch(0.578 0.232 13 / 0.10)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>
            <StyledSelect
              value={deptFilter}
              onChange={setDeptFilter}
              placeholder="All Departments"
              options={departments.map((d) => ({ label: d, value: d }))}
            />
            <StyledSelect
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="All Statuses"
              options={[
                { label: "Active", value: "Active" },
                { label: "Inactive", value: "Inactive" },
                { label: "Terminated", value: "Terminated" },
              ]}
            />
            <StyledSelect
              value={typeFilter}
              onChange={setTypeFilter}
              placeholder="All Types"
              options={[
                { label: "Full-time", value: "Full-time" },
                { label: "Part-time", value: "Part-time" },
                { label: "Contract", value: "Contract" },
              ]}
            />
          </div>
        </motion.div>

        {/* ── Table ─────────────────────────────────────────── */}
        <motion.div
          custom={6}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="rounded-2xl overflow-hidden"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          {/* Table header */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <h3
              className="text-base font-semibold"
              style={{
                fontFamily: "var(--font-playfair)",
                color: "var(--foreground)",
              }}
            >
              Employee List
            </h3>
            <span
              className="text-xs px-2.5 py-1 rounded-full"
              style={{
                background: "var(--secondary)",
                color: "var(--muted-foreground)",
                border: "1px solid var(--border)",
              }}
            >
              {employees.length} records
            </span>
          </div>

          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div
                    className="w-10 h-10 rounded-xl flex-shrink-0"
                    style={{ background: "var(--secondary)" }}
                  />
                  <div className="flex-1 space-y-2">
                    <div
                      className="h-3.5 rounded-lg w-48"
                      style={{ background: "var(--secondary)" }}
                    />
                    <div
                      className="h-3 rounded-lg w-32"
                      style={{ background: "var(--secondary)" }}
                    />
                  </div>
                  <div
                    className="h-6 w-16 rounded-full"
                    style={{ background: "var(--secondary)" }}
                  />
                  <div
                    className="h-6 w-16 rounded-full"
                    style={{ background: "var(--secondary)" }}
                  />
                </div>
              ))}
            </div>
          ) : employees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{
                  background: "var(--secondary)",
                  border: "1px solid var(--border)",
                }}
              >
                <RiGroupLine
                  size={28}
                  style={{ color: "var(--muted-foreground)" }}
                />
              </div>
              <p
                className="text-base font-semibold mb-1"
                style={{ color: "var(--foreground)" }}
              >
                No employees found
              </p>
              <p
                className="text-sm mb-5"
                style={{ color: "var(--muted-foreground)" }}
              >
                {search ||
                deptFilter !== "all" ||
                statusFilter !== "all" ||
                typeFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Get started by adding your first employee"}
              </p>
              <button
                onClick={() => router.push("/dashboard/employees/new")}
                className="flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-xl"
                style={{
                  background: "var(--brand-navy)",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <RiAddLine size={14} /> Add Employee
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table
                className="w-full"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {[
                      "Employee",
                      "Code",
                      "Department",
                      "Designation",
                      "Type",
                      "Status",
                      "Contact",
                      "",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left px-5 py-3 text-xs font-semibold tracking-wide"
                        style={{
                          color: "var(--muted-foreground)",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp, i) => (
                    <motion.tr
                      key={emp.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.035 }}
                      style={{ borderBottom: "1px solid var(--border)" }}
                      className="transition-colors"
                      onMouseEnter={(e) => {
                        (
                          e.currentTarget as HTMLTableRowElement
                        ).style.background = "var(--secondary)";
                      }}
                      onMouseLeave={(e) => {
                        (
                          e.currentTarget as HTMLTableRowElement
                        ).style.background = "transparent";
                      }}
                    >
                      {/* Employee */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                            style={{ background: colorFor(i) }}
                          >
                            {initials(emp.firstName, emp.lastName)}
                          </div>
                          <div>
                            <p
                              className="text-sm font-medium"
                              style={{ color: "var(--foreground)" }}
                            >
                              {emp.firstName} {emp.lastName}
                            </p>
                            <p
                              className="text-xs flex items-center gap-1 mt-0.5"
                              style={{ color: "var(--muted-foreground)" }}
                            >
                              <RiMailLine size={11} />
                              {emp.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      {/* Code */}
                      <td className="px-5 py-3.5">
                        <code
                          className="text-xs px-2 py-1 rounded-lg"
                          style={{
                            background: "var(--secondary)",
                            color: "var(--foreground)",
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          {emp.employeeCode}
                        </code>
                      </td>
                      {/* Dept */}
                      <td
                        className="px-5 py-3.5 text-sm"
                        style={{ color: "var(--foreground)" }}
                      >
                        {emp.department}
                      </td>
                      {/* Designation */}
                      <td
                        className="px-5 py-3.5 text-sm"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        {emp.designation}
                      </td>
                      {/* Type */}
                      <td className="px-5 py-3.5">
                        <TypeBadge type={emp.employmentType} />
                      </td>
                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <StatusBadge status={emp.employmentStatus} />
                      </td>
                      {/* Contact */}
                      <td className="px-5 py-3.5">
                        <p
                          className="text-xs flex items-center gap-1"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          <RiPhoneLine size={11} />
                          {emp.phone}
                        </p>
                      </td>
                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <RowMenu
                          employee={emp}
                          onView={() =>
                            router.push(`/dashboard/employees/${emp.id}`)
                          }
                          onEdit={() =>
                            router.push(`/dashboard/employees/${emp.id}/edit`)
                          }
                          onDelete={() => handleDelete(emp.id)}
                        />
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
