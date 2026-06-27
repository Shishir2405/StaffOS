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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/custom-toast";
import { format } from "date-fns";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import {
  Plus,
  RefreshCw,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Trash2,
  ExternalLink,
} from "lucide-react";

interface EmployeeDocument {
  id: number;
  employeeId: number;
  documentType: string;
  documentName: string;
  documentNumber?: string | null;
  fileUrl?: string | null;
  issueDate?: string | null;
  expiryDate?: string | null;
  status: string;
  verifiedBy?: number | null;
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
  employeeName?: string | null;
  employeeCode?: string | null;
}

interface EmployeeOption {
  id: number;
  firstName: string;
  lastName: string;
  employeeCode: string;
}

const DOCUMENT_TYPES = [
  "Aadhaar",
  "PAN",
  "Passport",
  "Driving License",
  "Offer Letter",
  "Contract",
  "Bank Proof",
  "Educational Certificate",
  "Experience Letter",
  "Other",
];

function safeFormat(d?: string | null) {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  return format(date, "MMM dd, yyyy");
}

function getStatusVariant(status: string) {
  switch (status.toLowerCase()) {
    case "verified":
      return "default" as const;
    case "pending":
      return "secondary" as const;
    case "rejected":
    case "expired":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
}

function isExpiringSoon(expiryDate?: string | null) {
  if (!expiryDate) return false;
  const exp = new Date(expiryDate);
  if (isNaN(exp.getTime())) return false;
  const now = new Date();
  const in30 = new Date();
  in30.setDate(now.getDate() + 30);
  return exp >= now && exp <= in30;
}

export default function DocumentsPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [employeeList, setEmployeeList] = useState<EmployeeOption[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    employeeId: "",
    documentType: "",
    documentName: "",
    documentNumber: "",
    fileUrl: "",
    issueDate: "",
    expiryDate: "",
    remarks: "",
  });

  useEffect(() => {
    if (!isPending && !session?.user) router.push("/sign-in");
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      load();
      loadEmployees();
    }
  }, [session]);

  const token = () =>
    typeof window !== "undefined" ? localStorage.getItem("bearer_token") : "";

  async function load() {
    setIsFetching(true);
    try {
      const res = await fetch("/api/employee-documents", {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      setDocuments(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load documents");
    } finally {
      setIsFetching(false);
    }
  }

  async function loadEmployees() {
    try {
      const res = await fetch("/api/employees?limit=100", {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const d = await res.json();
      const arr = Array.isArray(d) ? d : (d.data ?? d.employees ?? []);
      setEmployeeList(arr);
    } catch {
      // employee select will simply be empty
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.employeeId || !form.documentType || !form.documentName) {
      toast.error("Please fill in employee, type and name");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/employee-documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({
          employeeId: parseInt(form.employeeId),
          documentType: form.documentType,
          documentName: form.documentName,
          documentNumber: form.documentNumber || undefined,
          fileUrl: form.fileUrl || undefined,
          issueDate: form.issueDate || undefined,
          expiryDate: form.expiryDate || undefined,
          remarks: form.remarks || undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      toast.success("Document added");
      setOpen(false);
      setForm({
        employeeId: "",
        documentType: "",
        documentName: "",
        documentNumber: "",
        fileUrl: "",
        issueDate: "",
        expiryDate: "",
        remarks: "",
      });
      load();
    } catch (err: any) {
      toast.error(err.message || "Failed to add document");
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(id: number, status: string) {
    try {
      const res = await fetch(`/api/employee-documents?id=${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      toast.success(`Document ${status.toLowerCase()}`);
      load();
    } catch (err: any) {
      toast.error(err.message || "Failed to update document");
    }
  }

  async function remove(id: number) {
    try {
      const res = await fetch(`/api/employee-documents?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Document deleted");
      load();
    } catch {
      toast.error("Failed to delete document");
    }
  }

  const sessionUser = session?.user as any;
  const isAdminOrHR =
    sessionUser?.role === "admin" || sessionUser?.role === "hr";

  const total = documents.length;
  const verified = documents.filter((d) => d.status === "Verified").length;
  const pending = documents.filter((d) => d.status === "Pending").length;
  const expiring = documents.filter((d) => isExpiringSoon(d.expiryDate)).length;

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Document Management
            </h1>
            <p className="text-muted-foreground">
              Manage employee KYC documents, contracts and verifications
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Document
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Employee Document</DialogTitle>
                <DialogDescription>
                  Record a KYC document or contract for an employee
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={save} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Employee</Label>
                    <Select
                      value={form.employeeId}
                      onValueChange={(v) =>
                        setForm({ ...form, employeeId: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employeeList.map((e) => (
                          <SelectItem key={e.id} value={String(e.id)}>
                            {e.firstName} {e.lastName} ({e.employeeCode})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Document Type</Label>
                    <Select
                      value={form.documentType}
                      onValueChange={(v) =>
                        setForm({ ...form, documentType: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {DOCUMENT_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="documentName">Document Name</Label>
                    <Input
                      id="documentName"
                      placeholder="e.g. Aadhaar Card"
                      value={form.documentName}
                      onChange={(e) =>
                        setForm({ ...form, documentName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="documentNumber">Document Number</Label>
                    <Input
                      id="documentNumber"
                      placeholder="e.g. XXXX-XXXX-XXXX"
                      value={form.documentNumber}
                      onChange={(e) =>
                        setForm({ ...form, documentNumber: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fileUrl">File URL</Label>
                  <Input
                    id="fileUrl"
                    placeholder="https://... (link to the uploaded file)"
                    value={form.fileUrl}
                    onChange={(e) =>
                      setForm({ ...form, fileUrl: e.target.value })
                    }
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="issueDate">Issue Date</Label>
                    <Input
                      id="issueDate"
                      type="date"
                      value={form.issueDate}
                      onChange={(e) =>
                        setForm({ ...form, issueDate: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">Expiry Date</Label>
                    <Input
                      id="expiryDate"
                      type="date"
                      value={form.expiryDate}
                      onChange={(e) =>
                        setForm({ ...form, expiryDate: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="remarks">Remarks</Label>
                  <Textarea
                    id="remarks"
                    placeholder="Optional notes"
                    value={form.remarks}
                    onChange={(e) =>
                      setForm({ ...form, remarks: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Add Document"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <span className="text-3xl font-bold">{total}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Verified
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-muted-foreground" />
                <span className="text-3xl font-bold">{verified}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span className="text-3xl font-bold">{pending}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Expiring Soon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                <span className="text-3xl font-bold">{expiring}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                within 30 days
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Employee Documents</CardTitle>
            <CardDescription>
              All recorded KYC documents and contracts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Number</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center text-muted-foreground py-8"
                    >
                      No documents found
                    </TableCell>
                  </TableRow>
                ) : (
                  documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">
                        {doc.employeeName || `#${doc.employeeId}`}
                        {doc.employeeCode && (
                          <div className="text-xs text-muted-foreground">
                            {doc.employeeCode}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{doc.documentName}</TableCell>
                      <TableCell>{doc.documentType}</TableCell>
                      <TableCell>{doc.documentNumber || "—"}</TableCell>
                      <TableCell>{safeFormat(doc.issueDate)}</TableCell>
                      <TableCell>
                        <span
                          className={
                            isExpiringSoon(doc.expiryDate)
                              ? "text-destructive font-medium"
                              : ""
                          }
                        >
                          {safeFormat(doc.expiryDate)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(doc.status)}>
                          {doc.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {doc.fileUrl ? (
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                          >
                            <ExternalLink className="h-4 w-4" />
                            View
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isAdminOrHR && doc.status === "Pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => setStatus(doc.id, "Verified")}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Verify
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setStatus(doc.id, "Rejected")}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => remove(doc.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
