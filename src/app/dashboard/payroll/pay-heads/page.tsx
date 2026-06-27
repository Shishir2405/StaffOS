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
import { Switch } from "@/components/ui/switch";
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
import {
  Plus,
  RefreshCw,
  Trash2,
  TrendingUp,
  TrendingDown,
  Receipt,
  Layers,
} from "lucide-react";
import { toast } from "@/components/ui/custom-toast";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface PayHead {
  id: number;
  name: string;
  code: string;
  category: string;
  calculationType: string;
  value: number;
  baseComponent?: string | null;
  isTaxable: boolean;
  isStatutory: boolean;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
}

const CATEGORIES = ["Earning", "Deduction", "Reimbursement"];
const CALC_TYPES = ["Fixed", "Percentage", "Formula"];

export default function PayHeadsPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<PayHead[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    code: "",
    category: "Earning",
    calculationType: "Fixed",
    value: "",
    baseComponent: "",
    isTaxable: true,
    isStatutory: false,
    isActive: true,
    displayOrder: "0",
  });

  useEffect(() => {
    if (!isPending && !session?.user) router.push("/sign-in");
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) load();
  }, [session]);

  const token = () =>
    typeof window !== "undefined" ? localStorage.getItem("bearer_token") : "";

  async function load() {
    setIsFetching(true);
    try {
      const res = await fetch("/api/pay-heads", {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load pay heads");
    } finally {
      setIsFetching(false);
    }
  }

  function resetForm() {
    setForm({
      name: "",
      code: "",
      category: "Earning",
      calculationType: "Fixed",
      value: "",
      baseComponent: "",
      isTaxable: true,
      isStatutory: false,
      isActive: true,
      displayOrder: "0",
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) {
      toast.error("Name and code are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/pay-heads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({
          name: form.name,
          code: form.code,
          category: form.category,
          calculationType: form.calculationType,
          value: Number(form.value || 0),
          baseComponent: form.baseComponent || null,
          isTaxable: form.isTaxable,
          isStatutory: form.isStatutory,
          isActive: form.isActive,
          displayOrder: Number(form.displayOrder || 0),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to save");
      toast.success("Pay head created");
      setOpen(false);
      resetForm();
      load();
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    try {
      const res = await fetch(`/api/pay-heads?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Pay head deleted");
      load();
    } catch {
      toast.error("Failed to delete pay head");
    }
  }

  const earnings = items.filter((i) => i.category === "Earning");
  const deductions = items.filter((i) => i.category === "Deduction");
  const reimbursements = items.filter((i) => i.category === "Reimbursement");

  const formatValue = (h: PayHead) =>
    h.calculationType === "Percentage"
      ? `${Number(h.value || 0)}%`
      : `₹${Number(h.value || 0).toLocaleString("en-IN")}`;

  function renderTable(rows: PayHead[]) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Calc Type</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Taxable</TableHead>
            <TableHead>Statutory</TableHead>
            <TableHead>Active</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={8}
                className="text-center text-muted-foreground py-8"
              >
                No pay heads in this category
              </TableCell>
            </TableRow>
          ) : (
            rows.map((h) => (
              <TableRow key={h.id}>
                <TableCell className="font-medium">{h.name}</TableCell>
                <TableCell>
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                    {h.code}
                  </code>
                </TableCell>
                <TableCell>{h.calculationType}</TableCell>
                <TableCell>{formatValue(h)}</TableCell>
                <TableCell>
                  <Badge variant={h.isTaxable ? "default" : "outline"}>
                    {h.isTaxable ? "Yes" : "No"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={h.isStatutory ? "secondary" : "outline"}>
                    {h.isStatutory ? "Yes" : "No"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={h.isActive ? "default" : "destructive"}>
                    {h.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(h.id)}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    );
  }

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
            <h1 className="text-3xl font-bold tracking-tight">Pay Heads</h1>
            <p className="text-muted-foreground">
              Configure earnings, deductions and reimbursement components
            </p>
          </div>
          <Dialog
            open={open}
            onOpenChange={(o) => {
              setOpen(o);
              if (!o) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Pay Head
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>New Pay Head</DialogTitle>
                <DialogDescription>
                  Add a salary component to the payroll configuration
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={save} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g. House Rent Allowance"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">Code</Label>
                    <Input
                      id="code"
                      placeholder="e.g. HRA"
                      value={form.code}
                      onChange={(e) =>
                        setForm({ ...form, code: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={form.category}
                      onValueChange={(v) => setForm({ ...form, category: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Calculation Type</Label>
                    <Select
                      value={form.calculationType}
                      onValueChange={(v) =>
                        setForm({ ...form, calculationType: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {CALC_TYPES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="value">
                      {form.calculationType === "Percentage"
                        ? "Value (%)"
                        : "Value (₹)"}
                    </Label>
                    <Input
                      id="value"
                      type="number"
                      step="0.01"
                      placeholder="0"
                      value={form.value}
                      onChange={(e) =>
                        setForm({ ...form, value: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="baseComponent">
                      Base Component (optional)
                    </Label>
                    <Input
                      id="baseComponent"
                      placeholder="e.g. Basic, Gross"
                      value={form.baseComponent}
                      onChange={(e) =>
                        setForm({ ...form, baseComponent: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <Label htmlFor="isTaxable">Taxable</Label>
                    <Switch
                      id="isTaxable"
                      checked={form.isTaxable}
                      onCheckedChange={(v) =>
                        setForm({ ...form, isTaxable: v })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <Label htmlFor="isStatutory">Statutory</Label>
                    <Switch
                      id="isStatutory"
                      checked={form.isStatutory}
                      onCheckedChange={(v) =>
                        setForm({ ...form, isStatutory: v })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <Label htmlFor="isActive">Active</Label>
                    <Switch
                      id="isActive"
                      checked={form.isActive}
                      onCheckedChange={(v) => setForm({ ...form, isActive: v })}
                    />
                  </div>
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
                    {saving ? "Saving..." : "Create Pay Head"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Earnings
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{earnings.length}</div>
              <p className="text-xs text-muted-foreground mt-1">components</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Deductions
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{deductions.length}</div>
              <p className="text-xs text-muted-foreground mt-1">components</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Reimbursements
              </CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{reimbursements.length}</div>
              <p className="text-xs text-muted-foreground mt-1">components</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Pay Heads
              </CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{items.length}</div>
              <p className="text-xs text-muted-foreground mt-1">configured</p>
            </CardContent>
          </Card>
        </div>

        {/* Main table grouped by category */}
        <Card>
          <CardHeader>
            <CardTitle>Pay Head Configuration</CardTitle>
            <CardDescription>
              Components grouped by category. These drive salary structure
              calculations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="Earning">
              <TabsList className="mb-4">
                <TabsTrigger value="Earning">
                  Earnings
                  <Badge variant="secondary" className="ml-2">
                    {earnings.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="Deduction">
                  Deductions
                  <Badge variant="secondary" className="ml-2">
                    {deductions.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="Reimbursement">
                  Reimbursements
                  <Badge variant="secondary" className="ml-2">
                    {reimbursements.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>
              <TabsContent value="Earning">
                {renderTable(earnings)}
              </TabsContent>
              <TabsContent value="Deduction">
                {renderTable(deductions)}
              </TabsContent>
              <TabsContent value="Reimbursement">
                {renderTable(reimbursements)}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
