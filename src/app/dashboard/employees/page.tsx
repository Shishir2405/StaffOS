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
  RiCalendarLine,
  RiFilterLine,
} from "react-icons/ri";
import { DashboardLayout } from "@/components/dashboard-layout";
import { toast } from "@/components/ui/custom-toast";
import {
  pageVariants,
  fadeUp,
  staggerContainer,
  listItem,
  buttonTap,
  scaleIn,
} from "@/lib/animations";

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
const COLORS = ["#D97706", "#16A34A", "#7C3AED", "#2563EB", "#D97706", "#DC2626"];
const colorFor = (i: number) => COLORS[i % COLORS.length];
const initials = (first: string, last: string) =>
  `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();

/* ─── Status badge ───────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; color: string }> = {
    Active: { bg: "var(--success-bg)", color: "var(--success)" },
    Inactive: { bg: "var(--bg-subtle)", color: "var(--text-3)" },
    Terminated: { bg: "var(--danger-bg)", color: "var(--danger)" },
  };
  const c = cfg[status] ?? cfg.Inactive;
  return (
    <span
      className="text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase"
      style={{
        background: c.bg,
        color: c.color,
        letterSpacing: "0.5px",
      }}
    >
      {status}
    </span>
  );
}

/* ─── Type badge ─────────────────────────────────────────── */
function TypeBadge({ type }: { type: string }) {
  const cfg: Record<string, { bg: string; color: string }> = {
    "Full-time": { bg: "var(--brand-xlight)", color: "var(--brand)" },
    "Part-time": { bg: "var(--info-bg)", color: "var(--info)" },
    Contract: { bg: "var(--warning-bg)", color: "var(--warning)" },
  };
  const c = cfg[type] ?? { bg: "var(--bg-subtle)", color: "var(--text-3)" };
  return (
    <span
      className="text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase"
      style={{
        background: c.bg,
        color: c.color,
        letterSpacing: "0.5px",
      }}
    >
      {type}
    </span>
  );
}

/* ─── Animated Stat card ─────────────────────────────────── */
function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <motion.div
      variants={fadeUp}
      className="relative rounded-[var(--r-lg)] p-5 overflow-hidden transition-all duration-200"
      style={{
        background: "var(--bg-raised)",
        border: "1px solid var(--border-1)",
        boxShadow: "var(--shadow-sm)",
      }}
      whileHover={{ y: -3, boxShadow: "var(--shadow-md)" }}
    >
      <div
        className="absolute -top-5 -right-5 w-20 h-20 rounded-full pointer-events-none"
        style={{ background: accent, filter: "blur(24px)", opacity: 0.12 }}
      />
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-9 h-9 rounded-[var(--r-md)] flex items-center justify-center"
          style={{ background: accent + "18", border: `1px solid ${accent}28` }}
        >
          <Icon size={17} style={{ color: accent }} />
        </div>
      </div>
      <p
        className="text-2xl font-bold mb-0.5"
        style={{ fontFamily: "var(--font-mono-face)", color: "var(--text-1)" }}
      >
        {value}
      </p>
      <p className="label-caps">{label}</p>
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
        className="w-full appearance-none text-sm pl-3 pr-8 py-2.5 rounded-[var(--r-md)] outline-none cursor-pointer transition-all"
        style={{
          background: "var(--bg-subtle)",
          border: "1.5px solid var(--border-1)",
          color: "var(--text-1)",
          fontFamily: "var(--font-body)",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "var(--brand)";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(217,119,6,0.12)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "var(--border-1)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <option value="all">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <RiFilterLine
        size={13}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: "var(--text-3)" }}
      />
    </div>
  );
}

/* ─── Row action menu ────────────────────────────────────── */
function RowMenu({
  onDelete,
  onView,
  onEdit,
}: {
  onDelete: () => void;
  onView: () => void;
  onEdit: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex justify-end">
      <motion.button
        whileTap={buttonTap}
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "var(--text-3)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-subtle)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
        }}
      >
        <RiMoreLine size={16} />
      </motion.button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute right-0 top-9 z-50 rounded-[var(--r-lg)] overflow-hidden py-1"
              style={{
                background: "var(--bg-raised)",
                border: "1px solid var(--border-1)",
                boxShadow: "var(--shadow-lg)",
                minWidth: 160,
                fontFamily: "var(--font-body)",
              }}
            >
              {[
                { icon: RiEyeLine, label: "View Details", onClick: onView, color: "var(--text-1)" },
                { icon: RiEditLine, label: "Edit", onClick: onEdit, color: "var(--text-1)" },
                { icon: RiDeleteBinLine, label: "Delete", onClick: onDelete, color: "var(--danger)" },
              ].map((item, i) => (
                <button
                  key={item.label}
                  onClick={() => { item.onClick(); setOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-left transition-colors"
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: item.color,
                    borderTop: i === 2 ? "1px solid var(--border-1)" : "none",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "var(--brand-ghost)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
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

/* ─── Mobile Employee Card ───────────────────────────────── */
function EmployeeMobileCard({ emp, i, router, handleDelete }: {
  emp: Employee; i: number; router: any; handleDelete: (id: number) => void;
}) {
  return (
    <motion.div
      variants={listItem}
      className="p-4 rounded-[var(--r-lg)] transition-all duration-200"
      style={{
        background: "var(--bg-raised)",
        border: "1px solid var(--border-1)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
          style={{ background: colorFor(i) }}
        >
          {initials(emp.firstName, emp.lastName)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: "var(--text-1)" }}>
            {emp.firstName} {emp.lastName}
          </p>
          <p className="text-xs truncate" style={{ color: "var(--text-3)" }}>{emp.designation}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <StatusBadge status={emp.employmentStatus} />
            <TypeBadge type={emp.employmentType} />
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs flex items-center gap-1" style={{ color: "var(--text-3)" }}>
              <RiBuildingLine size={11} /> {emp.department}
            </span>
            <span className="text-xs" style={{ color: "var(--text-3)", fontFamily: "var(--font-mono-face)" }}>
              {emp.employeeCode}
            </span>
          </div>
        </div>
        <RowMenu
          onView={() => router.push(`/dashboard/employees/${emp.id}`)}
          onEdit={() => router.push(`/dashboard/employees/${emp.id}/edit`)}
          onDelete={() => handleDelete(emp.id)}
        />
      </div>
    </motion.div>
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
      if (statusFilter !== "all") params.append("employmentStatus", statusFilter);
      if (typeFilter !== "all") params.append("employmentType", typeFilter);
      const token = localStorage.getItem("bearer_token");
      const res = await fetch(`/api/employees?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const d = await res.json();
        setEmployees(d.success && Array.isArray(d.data) ? d.data : Array.isArray(d) ? d : []);
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

  const departments = ["Engineering", "Sales", "Marketing", "HR", "Finance", "Operations"];
  const active = employees.filter((e) => e.employmentStatus === "Active").length;
  const deptCount = new Set(employees.map((e) => e.department)).size;
  const newThisMonth = employees.filter((e) => {
    const d = new Date(e.dateOfJoining);
    const n = new Date();
    return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  }).length;

  if (isPending) {
    return (
      <DashboardLayout title="Employees">
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="skeleton-pulse h-16 rounded-[var(--r-lg)]" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton-pulse h-28 rounded-[var(--r-lg)]" />
            ))}
          </div>
          <div className="skeleton-pulse h-96 rounded-[var(--r-lg)]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Employees" subtitle="Manage your organisation's people">
      <motion.div
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        className="p-4 sm:p-6 lg:p-8 space-y-6"
        style={{ fontFamily: "var(--font-body)" }}
      >
        {/* ── Page header ──────────────────────────────────── */}
        <motion.div
          variants={fadeUp}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", color: "var(--text-1)" }}>
              Employee Directory
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-3)" }}>
              {employees.length} employee{employees.length !== 1 ? "s" : ""} total
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <motion.button
              whileTap={buttonTap}
              whileHover={{ opacity: 0.92 }}
              onClick={fetchEmployees}
              className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-[var(--r-md)] transition-all"
              style={{
                background: "var(--bg-raised)",
                border: "1.5px solid var(--border-1)",
                color: "var(--text-1)",
                cursor: "pointer",
              }}
            >
              <RiDownloadLine size={15} /> Export
            </motion.button>
            <motion.button
              whileTap={buttonTap}
              whileHover={{ opacity: 0.92 }}
              onClick={() => router.push("/dashboard/employees/new")}
              className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-[var(--r-md)] transition-all"
              style={{
                background: "var(--brand)",
                color: "var(--text-on-brand)",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 16px -4px rgba(217,119,6,0.25)",
              }}
            >
              <RiAddLine size={15} /> Add Employee
            </motion.button>
          </div>
        </motion.div>

        {/* ── Stats ─────────────────────────────────────────── */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <StatCard label="Total Employees" value={employees.length} icon={RiGroupLine} accent="#D97706" />
          <StatCard label="Active" value={active} icon={RiUserFollowLine} accent="#16A34A" />
          <StatCard label="Departments" value={deptCount} icon={RiBuildingLine} accent="#7C3AED" />
          <StatCard label="Joined This Month" value={newThisMonth} icon={RiCalendarLine} accent="#2563EB" />
        </motion.div>

        {/* ── Filters ───────────────────────────────────────── */}
        <motion.div
          variants={fadeUp}
          className="rounded-[var(--r-lg)] p-4 sm:p-5"
          style={{
            background: "var(--bg-raised)",
            border: "1px solid var(--border-1)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <RiSearchLine
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--text-3)" }}
              />
              <input
                type="text"
                placeholder="Search employees..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-sm pl-9 pr-3 py-2.5 rounded-[var(--r-md)] outline-none transition-all"
                style={{
                  background: "var(--bg-subtle)",
                  border: "1.5px solid var(--border-1)",
                  color: "var(--text-1)",
                  fontFamily: "var(--font-body)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--brand)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(217,119,6,0.12)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-1)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>
            <StyledSelect value={deptFilter} onChange={setDeptFilter} placeholder="All Departments" options={departments.map((d) => ({ label: d, value: d }))} />
            <StyledSelect value={statusFilter} onChange={setStatusFilter} placeholder="All Statuses" options={[{ label: "Active", value: "Active" }, { label: "Inactive", value: "Inactive" }, { label: "Terminated", value: "Terminated" }]} />
            <StyledSelect value={typeFilter} onChange={setTypeFilter} placeholder="All Types" options={[{ label: "Full-time", value: "Full-time" }, { label: "Part-time", value: "Part-time" }, { label: "Contract", value: "Contract" }]} />
          </div>
        </motion.div>

        {/* ── Table / Cards ─────────────────────────────────── */}
        <motion.div
          variants={fadeUp}
          className="rounded-[var(--r-lg)] overflow-hidden"
          style={{
            background: "var(--bg-raised)",
            border: "1px solid var(--border-1)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          {/* Table header */}
          <div
            className="flex items-center justify-between px-4 sm:px-6 py-4"
            style={{ borderBottom: "1px solid var(--border-1)" }}
          >
            <h3 style={{ fontFamily: "var(--font-display)", color: "var(--text-1)" }}>
              Employee List
            </h3>
            <span
              className="text-xs px-2.5 py-1 rounded-full"
              style={{
                background: "var(--bg-subtle)",
                color: "var(--text-3)",
                border: "1px solid var(--border-1)",
                fontFamily: "var(--font-mono-face)",
              }}
            >
              {employees.length} records
            </span>
          </div>

          {loading ? (
            <div className="p-4 sm:p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="skeleton-pulse w-10 h-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton-pulse h-3.5 rounded-lg w-48" />
                    <div className="skeleton-pulse h-3 rounded-lg w-32" />
                  </div>
                  <div className="skeleton-pulse h-6 w-16 rounded-full" />
                </div>
              ))}
            </div>
          ) : employees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div
                className="w-16 h-16 rounded-[var(--r-lg)] flex items-center justify-center mb-4"
                style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-1)" }}
              >
                <RiGroupLine size={28} style={{ color: "var(--text-3)" }} />
              </div>
              <p className="text-base font-semibold mb-1" style={{ color: "var(--text-1)" }}>
                No employees found
              </p>
              <p className="text-sm mb-5" style={{ color: "var(--text-3)" }}>
                {search || deptFilter !== "all" || statusFilter !== "all" || typeFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Get started by adding your first employee"}
              </p>
              <motion.button
                whileTap={buttonTap}
                onClick={() => router.push("/dashboard/employees/new")}
                className="flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-[var(--r-md)]"
                style={{
                  background: "var(--brand)",
                  color: "var(--text-on-brand)",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <RiAddLine size={14} /> Add Employee
              </motion.button>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full" style={{ fontFamily: "var(--font-body)" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-1)" }}>
                      {["Employee", "Code", "Department", "Designation", "Type", "Status", "Contact", ""].map((h) => (
                        <th
                          key={h}
                          className="text-left px-5 py-3 label-caps"
                          style={{ background: "var(--bg-subtle)" }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <motion.tbody variants={staggerContainer} initial="hidden" animate="visible">
                    {employees.map((emp, i) => (
                      <motion.tr
                        key={emp.id}
                        variants={listItem}
                        style={{ borderBottom: "1px solid var(--border-1)" }}
                        className="transition-colors"
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLTableRowElement).style.background = "var(--brand-ghost)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLTableRowElement).style.background = "transparent";
                        }}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
                              style={{ background: colorFor(i) }}
                            >
                              {initials(emp.firstName, emp.lastName)}
                            </div>
                            <div>
                              <p className="text-sm font-medium" style={{ color: "var(--text-1)" }}>
                                {emp.firstName} {emp.lastName}
                              </p>
                              <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: "var(--text-3)" }}>
                                <RiMailLine size={11} /> {emp.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <code
                            className="text-xs px-2 py-1 rounded-lg"
                            style={{
                              background: "var(--bg-subtle)",
                              color: "var(--text-1)",
                              fontFamily: "var(--font-mono-face)",
                            }}
                          >
                            {emp.employeeCode}
                          </code>
                        </td>
                        <td className="px-5 py-3.5 text-sm" style={{ color: "var(--text-1)" }}>{emp.department}</td>
                        <td className="px-5 py-3.5 text-sm" style={{ color: "var(--text-3)" }}>{emp.designation}</td>
                        <td className="px-5 py-3.5"><TypeBadge type={emp.employmentType} /></td>
                        <td className="px-5 py-3.5"><StatusBadge status={emp.employmentStatus} /></td>
                        <td className="px-5 py-3.5">
                          <p className="text-xs flex items-center gap-1" style={{ color: "var(--text-3)" }}>
                            <RiPhoneLine size={11} /> {emp.phone}
                          </p>
                        </td>
                        <td className="px-5 py-3.5">
                          <RowMenu
                            onView={() => router.push(`/dashboard/employees/${emp.id}`)}
                            onEdit={() => router.push(`/dashboard/employees/${emp.id}/edit`)}
                            onDelete={() => handleDelete(emp.id)}
                          />
                        </td>
                      </motion.tr>
                    ))}
                  </motion.tbody>
                </table>
              </div>

              {/* Mobile card layout */}
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="sm:hidden p-4 space-y-3"
              >
                {employees.map((emp, i) => (
                  <EmployeeMobileCard
                    key={emp.id}
                    emp={emp}
                    i={i}
                    router={router}
                    handleDelete={handleDelete}
                  />
                ))}
              </motion.div>
            </>
          )}
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
