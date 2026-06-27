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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, RefreshCw, BookOpen, Building2, Info } from "lucide-react";
import { toast } from "@/components/ui/custom-toast";
import { format } from "date-fns";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface CostCenter {
  id: number;
  name: string;
  code: string;
  department?: string | null;
  budget: number;
  spent: number;
  isActive: boolean;
  createdAt: string;
}

interface JournalEntry {
  id: number;
  entryDate: string;
  account: string;
  accountCode?: string | null;
  debit: number;
  credit: number;
  narration?: string | null;
  costCenterId?: number | null;
  status: string;
  createdAt: string;
}

const money = (n: number | null | undefined) =>
  `₹${Number(n || 0).toLocaleString("en-IN")}`;

const safeDate = (d?: string | null) => {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? "—" : format(dt, "MMM dd, yyyy");
};

const statusVariant = (
  status: string,
): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "Approved":
    case "Active":
    case "Verified":
    case "Paid":
    case "Completed":
    case "Filed":
    case "Posted":
      return "default";
    case "Pending":
    case "Draft":
    case "Declared":
    case "Upcoming":
    case "Submitted":
    case "In Progress":
      return "secondary";
    case "Rejected":
    case "Overdue":
    case "Defaulted":
    case "Failed":
    case "Expired":
    case "Exported":
      return "outline";
    default:
      return "outline";
  }
};

export default function FinancePage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [saving, setSaving] = useState(false);

  const [jeOpen, setJeOpen] = useState(false);
  const [ccOpen, setCcOpen] = useState(false);

  const [jeForm, setJeForm] = useState({
    entryDate: new Date().toISOString().split("T")[0],
    account: "",
    accountCode: "",
    debit: "",
    credit: "",
    narration: "",
    costCenterId: "",
  });
  const [ccForm, setCcForm] = useState({
    name: "",
    code: "",
    department: "",
    budget: "",
    spent: "",
  });

  useEffect(() => {
    if (!isPending && !session?.user) router.push("/sign-in");
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) loadAll();
  }, [session]);

  const token = () =>
    typeof window !== "undefined" ? localStorage.getItem("bearer_token") : "";
  const authHeaders = () => ({ Authorization: `Bearer ${token()}` });

  const ccName = (id?: number | null) => {
    if (!id) return "—";
    const c = costCenters.find((x) => x.id === id);
    return c ? c.name : `#${id}`;
  };

  async function loadAll() {
    setIsFetching(true);
    try {
      const [jeRes, ccRes] = await Promise.all([
        fetch("/api/journal-entries", { headers: authHeaders() }),
        fetch("/api/cost-centers", { headers: authHeaders() }),
      ]);
      const jeData = await jeRes.json();
      setEntries(Array.isArray(jeData) ? jeData : []);
      const ccData = await ccRes.json();
      setCostCenters(
        Array.isArray(ccData)
          ? ccData
          : (ccData.data ?? ccData.costCenters ?? []),
      );
    } catch {
      toast.error("Failed to load finance data");
    } finally {
      setIsFetching(false);
    }
  }

  async function saveEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!jeForm.entryDate || !jeForm.account) {
      toast.error("Entry date and account are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/journal-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          entryDate: jeForm.entryDate,
          account: jeForm.account,
          accountCode: jeForm.accountCode || null,
          debit: Number(jeForm.debit) || 0,
          credit: Number(jeForm.credit) || 0,
          narration: jeForm.narration || null,
          costCenterId: jeForm.costCenterId
            ? Number(jeForm.costCenterId)
            : null,
        }),
      });
      if (!res.ok)
        throw new Error((await res.json()).error || "Failed to create entry");
      toast.success("Journal entry created");
      setJeOpen(false);
      setJeForm({
        entryDate: new Date().toISOString().split("T")[0],
        account: "",
        accountCode: "",
        debit: "",
        credit: "",
        narration: "",
        costCenterId: "",
      });
      loadAll();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function postEntry(id: number) {
    try {
      const res = await fetch(`/api/journal-entries?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ status: "Posted" }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Entry posted");
      loadAll();
    } catch {
      toast.error("Failed to post entry");
    }
  }

  async function saveCostCenter(e: React.FormEvent) {
    e.preventDefault();
    if (!ccForm.name || !ccForm.code) {
      toast.error("Name and code are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/cost-centers", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          name: ccForm.name,
          code: ccForm.code,
          department: ccForm.department || null,
          budget: Number(ccForm.budget) || 0,
          spent: Number(ccForm.spent) || 0,
        }),
      });
      if (!res.ok)
        throw new Error(
          (await res.json()).error || "Failed to create cost center",
        );
      toast.success("Cost center created");
      setCcOpen(false);
      setCcForm({ name: "", code: "", department: "", budget: "", spent: "" });
      loadAll();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeCostCenter(id: number) {
    try {
      const res = await fetch(`/api/cost-centers?id=${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Cost center deleted");
      loadAll();
    } catch {
      toast.error("Failed to delete cost center");
    }
  }

  // ── Stats ──────────────────────────────────────────────────────
  const totalDebit = entries.reduce((s, e) => s + Number(e.debit || 0), 0);
  const totalCredit = entries.reduce((s, e) => s + Number(e.credit || 0), 0);

  const totalBudget = costCenters.reduce(
    (s, c) => s + Number(c.budget || 0),
    0,
  );
  const totalSpent = costCenters.reduce((s, c) => s + Number(c.spent || 0), 0);

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
              Finance &amp; Integration
            </h1>
            <p className="text-muted-foreground">
              Accounting journal entries and cost-center budgeting
            </p>
          </div>
          <Button variant="outline" onClick={loadAll}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        <Tabs defaultValue="journal">
          <TabsList className="mb-2">
            <TabsTrigger value="journal">
              <BookOpen className="mr-2 h-4 w-4" />
              Journal Entries
            </TabsTrigger>
            <TabsTrigger value="cost-centers">
              <Building2 className="mr-2 h-4 w-4" />
              Cost Centers
            </TabsTrigger>
          </TabsList>

          {/* ─────────────── JOURNAL ENTRIES TAB ─────────────── */}
          <TabsContent value="journal" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Debit
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{money(totalDebit)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    across all entries
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Credit
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{money(totalCredit)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    across all entries
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Entries
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{entries.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {totalDebit === totalCredit
                      ? "books balanced"
                      : "books unbalanced"}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="flex items-start gap-2 rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
              <Info className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                Tally-compatible export available in{" "}
                <span className="font-medium text-foreground">Reports</span>.
              </span>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Journal Entries</CardTitle>
                  <CardDescription>
                    Double-entry accounting ledger
                  </CardDescription>
                </div>
                <Dialog open={jeOpen} onOpenChange={setJeOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      New Entry
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create Journal Entry</DialogTitle>
                      <DialogDescription>
                        Record a debit/credit ledger line.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={saveEntry} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Entry Date</Label>
                        <Input
                          type="date"
                          value={jeForm.entryDate}
                          onChange={(e) =>
                            setJeForm({ ...jeForm, entryDate: e.target.value })
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Account</Label>
                          <Input
                            placeholder="e.g. Salaries Payable"
                            value={jeForm.account}
                            onChange={(e) =>
                              setJeForm({ ...jeForm, account: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Account Code</Label>
                          <Input
                            placeholder="e.g. 5001"
                            value={jeForm.accountCode}
                            onChange={(e) =>
                              setJeForm({
                                ...jeForm,
                                accountCode: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Debit (₹)</Label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={jeForm.debit}
                            onChange={(e) =>
                              setJeForm({ ...jeForm, debit: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Credit (₹)</Label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={jeForm.credit}
                            onChange={(e) =>
                              setJeForm({ ...jeForm, credit: e.target.value })
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Cost Center</Label>
                        <Select
                          value={jeForm.costCenterId}
                          onValueChange={(v) =>
                            setJeForm({ ...jeForm, costCenterId: v })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select cost center (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            {costCenters.length === 0 ? (
                              <SelectItem value="none" disabled>
                                No cost centers
                              </SelectItem>
                            ) : (
                              costCenters.map((c) => (
                                <SelectItem key={c.id} value={String(c.id)}>
                                  {c.name} ({c.code})
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Narration</Label>
                        <Textarea
                          placeholder="Description of the entry"
                          value={jeForm.narration}
                          onChange={(e) =>
                            setJeForm({ ...jeForm, narration: e.target.value })
                          }
                          rows={3}
                        />
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setJeOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={saving}>
                          {saving ? "Saving..." : "Create Entry"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                      <TableHead>Cost Center</TableHead>
                      <TableHead>Narration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center text-muted-foreground py-8"
                        >
                          No journal entries yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      <>
                        {entries.map((e) => (
                          <TableRow key={e.id}>
                            <TableCell>{safeDate(e.entryDate)}</TableCell>
                            <TableCell className="font-medium">
                              {e.account}
                              {e.accountCode && (
                                <div className="text-xs text-muted-foreground">
                                  {e.accountCode}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {money(e.debit)}
                            </TableCell>
                            <TableCell className="text-right">
                              {money(e.credit)}
                            </TableCell>
                            <TableCell>{ccName(e.costCenterId)}</TableCell>
                            <TableCell className="max-w-xs truncate">
                              {e.narration || "—"}
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusVariant(e.status)}>
                                {e.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {e.status === "Draft" ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => postEntry(e.id)}
                                >
                                  Mark Posted
                                </Button>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  —
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                        {/* Totals row */}
                        <TableRow className="border-t-2 font-semibold bg-muted/50">
                          <TableCell colSpan={2}>Totals</TableCell>
                          <TableCell className="text-right">
                            {money(totalDebit)}
                          </TableCell>
                          <TableCell className="text-right">
                            {money(totalCredit)}
                          </TableCell>
                          <TableCell colSpan={4}>
                            {totalDebit === totalCredit ? (
                              <Badge variant="default">Balanced</Badge>
                            ) : (
                              <Badge variant="outline">
                                Diff {money(Math.abs(totalDebit - totalCredit))}
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─────────────── COST CENTERS TAB ─────────────── */}
          <TabsContent value="cost-centers" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Budget
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{money(totalBudget)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    allocated across centers
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Spent
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{money(totalSpent)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {totalBudget > 0
                      ? `${Math.round((totalSpent / totalBudget) * 100)}% utilized`
                      : "no budget set"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Cost Centers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{costCenters.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {costCenters.filter((c) => c.isActive).length} active
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Cost Centers</CardTitle>
                  <CardDescription>
                    Departmental budget allocation and utilization
                  </CardDescription>
                </div>
                <Dialog open={ccOpen} onOpenChange={setCcOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      New Cost Center
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create Cost Center</DialogTitle>
                      <DialogDescription>
                        Codes must be unique across cost centers.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={saveCostCenter} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input
                            placeholder="e.g. Engineering"
                            value={ccForm.name}
                            onChange={(e) =>
                              setCcForm({ ...ccForm, name: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Code</Label>
                          <Input
                            placeholder="e.g. CC-ENG"
                            value={ccForm.code}
                            onChange={(e) =>
                              setCcForm({ ...ccForm, code: e.target.value })
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Department</Label>
                        <Input
                          placeholder="Optional"
                          value={ccForm.department}
                          onChange={(e) =>
                            setCcForm({ ...ccForm, department: e.target.value })
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Budget (₹)</Label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="1000000"
                            value={ccForm.budget}
                            onChange={(e) =>
                              setCcForm({ ...ccForm, budget: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Spent (₹)</Label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={ccForm.spent}
                            onChange={(e) =>
                              setCcForm({ ...ccForm, spent: e.target.value })
                            }
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setCcOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={saving}>
                          {saving ? "Saving..." : "Create Cost Center"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-right">Budget</TableHead>
                      <TableHead className="text-right">Spent</TableHead>
                      <TableHead className="text-right">Utilization</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {costCenters.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center text-muted-foreground py-8"
                        >
                          No cost centers yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      costCenters.map((c) => {
                        const util =
                          Number(c.budget) > 0
                            ? Math.round(
                                (Number(c.spent) / Number(c.budget)) * 100,
                              )
                            : 0;
                        return (
                          <TableRow key={c.id}>
                            <TableCell className="font-medium">
                              {c.name}
                            </TableCell>
                            <TableCell>{c.code}</TableCell>
                            <TableCell>{c.department || "—"}</TableCell>
                            <TableCell className="text-right">
                              {money(c.budget)}
                            </TableCell>
                            <TableCell className="text-right">
                              {money(c.spent)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge
                                variant={
                                  util > 100
                                    ? "destructive"
                                    : util >= 80
                                      ? "secondary"
                                      : "outline"
                                }
                              >
                                {util}%
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={c.isActive ? "default" : "outline"}
                              >
                                {c.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeCostCenter(c.id)}
                              >
                                Delete
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
