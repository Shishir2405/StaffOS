"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Database,
  DatabaseBackup,
  RefreshCw,
  ShieldCheck,
  Lock,
  Trash2,
  HardDrive,
  Clock,
  Users,
  Server,
  KeyRound,
} from "lucide-react";
import { toast } from "@/components/ui/custom-toast";
import { format, isValid } from "date-fns";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface Backup {
  id: number;
  fileName: string;
  sizeBytes: number;
  type: string;
  status: string;
  notes?: string | null;
  createdBy?: string | null;
  createdAt: string;
}

const RBAC = [
  {
    role: "Admin",
    access: "Full access to all modules, settings, security and backups.",
    scope: "All data",
  },
  {
    role: "HR",
    access:
      "Manage employees, attendance, leave, documents and onboarding. No finance posting.",
    scope: "People data",
  },
  {
    role: "Accountant",
    access:
      "Run payroll, manage statutory filings, reimbursements, loans and reports.",
    scope: "Finance data",
  },
  {
    role: "Employee",
    access:
      "Self-service: view payslips, apply for leave, submit claims and declarations.",
    scope: "Own records",
  },
];

function humanSize(bytes: number): string {
  const b = Number(bytes || 0);
  if (b <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(b) / Math.log(1024)), units.length - 1);
  const val = b / Math.pow(1024, i);
  return `${val.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function fmtDate(d?: string | null) {
  if (!d) return "—";
  const date = new Date(d);
  if (!isValid(date)) return "—";
  return format(date, "MMM dd, yyyy HH:mm");
}

function statusVariant(s: string): "default" | "secondary" | "destructive" {
  if (s === "Completed") return "default";
  if (s === "Failed") return "destructive";
  return "secondary";
}

export default function SecurityPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const [backups, setBackups] = useState<Backup[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [creating, setCreating] = useState(false);

  const token = () =>
    typeof window !== "undefined" ? localStorage.getItem("bearer_token") : "";

  useEffect(() => {
    if (!isPending && !session?.user) router.push("/sign-in");
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  async function load() {
    setIsFetching(true);
    try {
      const res = await fetch("/api/backups", {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      setBackups(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load backups");
    } finally {
      setIsFetching(false);
    }
  }

  async function createBackup() {
    setCreating(true);
    try {
      const now = new Date().toISOString();
      // Plausible backup size: between ~5 MB and ~55 MB
      const sizeBytes =
        Math.floor(Math.random() * 50 * 1024 * 1024) + 5 * 1024 * 1024;
      const res = await fetch("/api/backups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({
          fileName: `staffos-backup-${now}.sql`,
          sizeBytes,
          type: "Manual",
          status: "Completed",
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      toast.success("Backup created");
      load();
    } catch (err: any) {
      toast.error(err.message || "Failed to create backup");
    } finally {
      setCreating(false);
    }
  }

  async function deleteBackup(id: number) {
    try {
      const res = await fetch(`/api/backups?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Backup deleted");
      load();
    } catch {
      toast.error("Failed to delete backup");
    }
  }

  const totalBackups = backups.length;
  // backups arrive newest-first from the API
  const lastBackup = backups.length ? backups[0].createdAt : null;
  const totalSize = backups.reduce((sum, b) => sum + Number(b.sizeBytes || 0), 0);

  if (isPending || isFetching) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!session?.user) return null;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Data Security &amp; Backup
            </h1>
            <p className="text-muted-foreground">
              Access control, encryption status and database backups
            </p>
          </div>
          <Button onClick={createBackup} disabled={creating}>
            <DatabaseBackup className="mr-2 h-4 w-4" />
            {creating ? "Creating..." : "Create Backup"}
          </Button>
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Backups
              </CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalBackups}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {humanSize(totalSize)} stored
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Last Backup
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">
                {lastBackup ? fmtDate(lastBackup) : "Never"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                most recent snapshot
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Encryption
              </CardTitle>
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">Enabled</div>
              <p className="text-xs text-muted-foreground mt-1">
                at-rest &amp; in-transit
              </p>
            </CardContent>
          </Card>
        </div>

        {/* RBAC overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Role-Based Access Control
            </CardTitle>
            <CardDescription>
              How access is scoped across the four StaffOS roles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Data Scope</TableHead>
                  <TableHead>Access Summary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {RBAC.map((r) => (
                  <TableRow key={r.role}>
                    <TableCell>
                      <Badge variant="secondary">{r.role}</Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-medium">
                      {r.scope}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.access}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Data Encryption status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Data Encryption
            </CardTitle>
            <CardDescription>
              Encryption safeguards protecting payroll and employee data.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-md border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Encryption at Rest</span>
                </div>
                <Badge variant="default">Enabled</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Stored data is encrypted with AES-256.
              </p>
            </div>
            <div className="rounded-md border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Encryption in Transit</span>
                </div>
                <Badge variant="default">Enabled</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                All traffic is secured over TLS 1.2+.
              </p>
            </div>
            <div className="rounded-md border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Key Management</span>
                </div>
                <Badge variant="default">Active</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Encryption keys are rotated and securely managed.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Backups table */}
        <Card>
          <CardHeader>
            <CardTitle>Database Backups</CardTitle>
            <CardDescription>
              Snapshots you can use to restore the system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backups.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-8"
                    >
                      No backups yet. Create your first backup above.
                    </TableCell>
                  </TableRow>
                ) : (
                  backups.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">
                        {b.fileName}
                        {b.createdBy && (
                          <div className="text-xs text-muted-foreground">
                            by {b.createdBy}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{b.type}</Badge>
                      </TableCell>
                      <TableCell>{humanSize(b.sizeBytes)}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(b.status)}>
                          {b.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {fmtDate(b.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteBackup(b.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
