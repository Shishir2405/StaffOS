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
  Building2,
  Plus,
  Save,
  Trash2,
  RefreshCw,
  FileSpreadsheet,
  GitBranch,
  Bell,
  Mail,
  MessageSquare,
} from "lucide-react";
import { toast } from "@/components/ui/custom-toast";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface SalaryTemplate {
  id: number;
  name: string;
  description?: string | null;
  basicPercent: number;
  hraPercent: number;
  components?: string | null;
  ctcMin: number;
  ctcMax: number;
  isActive: boolean;
  createdAt: string;
}

interface ApprovalWorkflow {
  id: number;
  name: string;
  module: string;
  levels?: string | null;
  isActive: boolean;
  createdAt: string;
}

const EMPTY_COMPANY = {
  companyName: "",
  legalName: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  email: "",
  phone: "",
  pan: "",
  tan: "",
  gstin: "",
  pfNumber: "",
  esiNumber: "",
  ptNumber: "",
  lwfNumber: "",
  financialYearStart: "04-01",
  currency: "INR",
  emailNotifications: true,
  smsNotifications: false,
};

export default function SettingsPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const [isFetching, setIsFetching] = useState(true);

  // Company settings
  const [company, setCompany] = useState<any>({ ...EMPTY_COMPANY });
  const [savingCompany, setSavingCompany] = useState(false);
  const [savingNotifs, setSavingNotifs] = useState(false);

  // Salary templates
  const [templates, setTemplates] = useState<SalaryTemplate[]>([]);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    name: "",
    description: "",
    basicPercent: "40",
    hraPercent: "20",
    ctcMin: "0",
    ctcMax: "0",
    isActive: true,
  });

  // Approval workflows
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([]);
  const [workflowOpen, setWorkflowOpen] = useState(false);
  const [savingWorkflow, setSavingWorkflow] = useState(false);
  const [workflowForm, setWorkflowForm] = useState({
    name: "",
    module: "Leave",
    levels: "",
    isActive: true,
  });

  const token = () =>
    typeof window !== "undefined" ? localStorage.getItem("bearer_token") : "";

  useEffect(() => {
    if (!isPending && !session?.user) router.push("/sign-in");
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  async function loadAll() {
    setIsFetching(true);
    try {
      const headers = { Authorization: `Bearer ${token()}` };
      const [cRes, tRes, wRes] = await Promise.all([
        fetch("/api/company-settings", { headers }),
        fetch("/api/salary-templates", { headers }),
        fetch("/api/approval-workflows", { headers }),
      ]);
      const cData = await cRes.json();
      if (cData && typeof cData === "object") {
        setCompany({ ...EMPTY_COMPANY, ...cData });
      }
      const tData = await tRes.json();
      setTemplates(Array.isArray(tData) ? tData : []);
      const wData = await wRes.json();
      setWorkflows(Array.isArray(wData) ? wData : []);
    } catch {
      toast.error("Failed to load settings");
    } finally {
      setIsFetching(false);
    }
  }

  async function saveCompany(e: React.FormEvent) {
    e.preventDefault();
    if (!company.companyName || company.companyName.trim() === "") {
      toast.error("Company name is required");
      return;
    }
    setSavingCompany(true);
    try {
      const res = await fetch("/api/company-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify(company),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      const data = await res.json();
      setCompany({ ...EMPTY_COMPANY, ...data });
      toast.success("Company settings saved");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSavingCompany(false);
    }
  }

  async function saveNotifications(next: {
    emailNotifications?: boolean;
    smsNotifications?: boolean;
  }) {
    const merged = { ...company, ...next };
    setCompany(merged);
    setSavingNotifs(true);
    try {
      const res = await fetch("/api/company-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify(merged),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      const data = await res.json();
      setCompany({ ...EMPTY_COMPANY, ...data });
      toast.success("Notification preferences updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to update");
    } finally {
      setSavingNotifs(false);
    }
  }

  async function createTemplate(e: React.FormEvent) {
    e.preventDefault();
    if (!templateForm.name.trim()) {
      toast.error("Template name is required");
      return;
    }
    setSavingTemplate(true);
    try {
      const res = await fetch("/api/salary-templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({
          name: templateForm.name.trim(),
          description: templateForm.description.trim() || null,
          basicPercent: Number(templateForm.basicPercent) || 0,
          hraPercent: Number(templateForm.hraPercent) || 0,
          ctcMin: Number(templateForm.ctcMin) || 0,
          ctcMax: Number(templateForm.ctcMax) || 0,
          isActive: templateForm.isActive,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      toast.success("Salary template created");
      setTemplateOpen(false);
      setTemplateForm({
        name: "",
        description: "",
        basicPercent: "40",
        hraPercent: "20",
        ctcMin: "0",
        ctcMax: "0",
        isActive: true,
      });
      loadAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to create template");
    } finally {
      setSavingTemplate(false);
    }
  }

  async function deleteTemplate(id: number) {
    try {
      const res = await fetch(`/api/salary-templates?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Template deleted");
      loadAll();
    } catch {
      toast.error("Failed to delete template");
    }
  }

  async function createWorkflow(e: React.FormEvent) {
    e.preventDefault();
    if (!workflowForm.name.trim()) {
      toast.error("Workflow name is required");
      return;
    }
    setSavingWorkflow(true);
    try {
      const levelsArr = workflowForm.levels
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean);
      const res = await fetch("/api/approval-workflows", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({
          name: workflowForm.name.trim(),
          module: workflowForm.module,
          levels: levelsArr.length ? JSON.stringify(levelsArr) : null,
          isActive: workflowForm.isActive,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      toast.success("Approval workflow created");
      setWorkflowOpen(false);
      setWorkflowForm({
        name: "",
        module: "Leave",
        levels: "",
        isActive: true,
      });
      loadAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to create workflow");
    } finally {
      setSavingWorkflow(false);
    }
  }

  async function deleteWorkflow(id: number) {
    try {
      const res = await fetch(`/api/approval-workflows?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Workflow deleted");
      loadAll();
    } catch {
      toast.error("Failed to delete workflow");
    }
  }

  function parseLevels(levels?: string | null): string[] {
    if (!levels) return [];
    try {
      const parsed = JSON.parse(levels);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      return levels
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean);
    }
    return [];
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
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">
              Configure company profile, salary templates, approval workflows
              and notifications
            </p>
          </div>
        </div>

        <Tabs defaultValue="company">
          <TabsList>
            <TabsTrigger value="company">
              <Building2 className="mr-2 h-4 w-4" />
              Company
            </TabsTrigger>
            <TabsTrigger value="templates">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Salary Templates
            </TabsTrigger>
            <TabsTrigger value="workflows">
              <GitBranch className="mr-2 h-4 w-4" />
              Approval Workflows
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="mr-2 h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          {/* ── COMPANY ───────────────────────────────────────── */}
          <TabsContent value="company" className="mt-6">
            <form onSubmit={saveCompany}>
              <Card>
                <CardHeader>
                  <CardTitle>Company Profile</CardTitle>
                  <CardDescription>
                    These details appear on payslips, reports and statutory
                    filings.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold mb-3">
                      General Information
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="companyName">Company Name *</Label>
                        <Input
                          id="companyName"
                          value={company.companyName ?? ""}
                          onChange={(e) =>
                            setCompany({
                              ...company,
                              companyName: e.target.value,
                            })
                          }
                          placeholder="StaffOS Technologies Pvt Ltd"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="legalName">Legal Name</Label>
                        <Input
                          id="legalName"
                          value={company.legalName ?? ""}
                          onChange={(e) =>
                            setCompany({ ...company, legalName: e.target.value })
                          }
                          placeholder="Registered legal entity name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={company.email ?? ""}
                          onChange={(e) =>
                            setCompany({ ...company, email: e.target.value })
                          }
                          placeholder="hr@company.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={company.phone ?? ""}
                          onChange={(e) =>
                            setCompany({ ...company, phone: e.target.value })
                          }
                          placeholder="+91 98765 43210"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold mb-3">Address</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="address">Address</Label>
                        <Textarea
                          id="address"
                          value={company.address ?? ""}
                          onChange={(e) =>
                            setCompany({ ...company, address: e.target.value })
                          }
                          rows={2}
                          placeholder="Street, building, area"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={company.city ?? ""}
                          onChange={(e) =>
                            setCompany({ ...company, city: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          value={company.state ?? ""}
                          onChange={(e) =>
                            setCompany({ ...company, state: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pincode">Pincode</Label>
                        <Input
                          id="pincode"
                          value={company.pincode ?? ""}
                          onChange={(e) =>
                            setCompany({ ...company, pincode: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold mb-3">
                      Statutory Identifiers
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="pan">PAN</Label>
                        <Input
                          id="pan"
                          value={company.pan ?? ""}
                          onChange={(e) =>
                            setCompany({ ...company, pan: e.target.value })
                          }
                          placeholder="ABCDE1234F"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tan">TAN</Label>
                        <Input
                          id="tan"
                          value={company.tan ?? ""}
                          onChange={(e) =>
                            setCompany({ ...company, tan: e.target.value })
                          }
                          placeholder="ABCD12345E"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gstin">GSTIN</Label>
                        <Input
                          id="gstin"
                          value={company.gstin ?? ""}
                          onChange={(e) =>
                            setCompany({ ...company, gstin: e.target.value })
                          }
                          placeholder="22ABCDE1234F1Z5"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pfNumber">PF Number</Label>
                        <Input
                          id="pfNumber"
                          value={company.pfNumber ?? ""}
                          onChange={(e) =>
                            setCompany({ ...company, pfNumber: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="esiNumber">ESI Number</Label>
                        <Input
                          id="esiNumber"
                          value={company.esiNumber ?? ""}
                          onChange={(e) =>
                            setCompany({ ...company, esiNumber: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ptNumber">PT Number</Label>
                        <Input
                          id="ptNumber"
                          value={company.ptNumber ?? ""}
                          onChange={(e) =>
                            setCompany({ ...company, ptNumber: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lwfNumber">LWF Number</Label>
                        <Input
                          id="lwfNumber"
                          value={company.lwfNumber ?? ""}
                          onChange={(e) =>
                            setCompany({ ...company, lwfNumber: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold mb-3">
                      Financial Configuration
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="financialYearStart">
                          Financial Year Start (MM-DD)
                        </Label>
                        <Input
                          id="financialYearStart"
                          value={company.financialYearStart ?? ""}
                          onChange={(e) =>
                            setCompany({
                              ...company,
                              financialYearStart: e.target.value,
                            })
                          }
                          placeholder="04-01"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="currency">Currency</Label>
                        <Select
                          value={company.currency ?? "INR"}
                          onValueChange={(v) =>
                            setCompany({ ...company, currency: v })
                          }
                        >
                          <SelectTrigger id="currency">
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="INR">INR (₹)</SelectItem>
                            <SelectItem value="USD">USD ($)</SelectItem>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                            <SelectItem value="GBP">GBP (£)</SelectItem>
                            <SelectItem value="AED">AED (د.إ)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={savingCompany}>
                      <Save className="mr-2 h-4 w-4" />
                      {savingCompany ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </TabsContent>

          {/* ── SALARY TEMPLATES ──────────────────────────────── */}
          <TabsContent value="templates" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Salary Templates</CardTitle>
                  <CardDescription>
                    Reusable CTC structures that define basic and HRA splits per
                    salary band.
                  </CardDescription>
                </div>
                <Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      New Template
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>New Salary Template</DialogTitle>
                      <DialogDescription>
                        Define the percentage split and applicable CTC range.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={createTemplate} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="t-name">Name *</Label>
                        <Input
                          id="t-name"
                          value={templateForm.name}
                          onChange={(e) =>
                            setTemplateForm({
                              ...templateForm,
                              name: e.target.value,
                            })
                          }
                          placeholder="Standard Grade A"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="t-desc">Description</Label>
                        <Textarea
                          id="t-desc"
                          value={templateForm.description}
                          onChange={(e) =>
                            setTemplateForm({
                              ...templateForm,
                              description: e.target.value,
                            })
                          }
                          rows={2}
                        />
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="t-basic">Basic %</Label>
                          <Input
                            id="t-basic"
                            type="number"
                            value={templateForm.basicPercent}
                            onChange={(e) =>
                              setTemplateForm({
                                ...templateForm,
                                basicPercent: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="t-hra">HRA %</Label>
                          <Input
                            id="t-hra"
                            type="number"
                            value={templateForm.hraPercent}
                            onChange={(e) =>
                              setTemplateForm({
                                ...templateForm,
                                hraPercent: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="t-min">CTC Min (₹)</Label>
                          <Input
                            id="t-min"
                            type="number"
                            value={templateForm.ctcMin}
                            onChange={(e) =>
                              setTemplateForm({
                                ...templateForm,
                                ctcMin: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="t-max">CTC Max (₹)</Label>
                          <Input
                            id="t-max"
                            type="number"
                            value={templateForm.ctcMax}
                            onChange={(e) =>
                              setTemplateForm({
                                ...templateForm,
                                ctcMax: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between rounded-md border p-3">
                        <div>
                          <Label htmlFor="t-active">Active</Label>
                          <p className="text-xs text-muted-foreground">
                            Available for assignment to employees
                          </p>
                        </div>
                        <Switch
                          id="t-active"
                          checked={templateForm.isActive}
                          onCheckedChange={(v) =>
                            setTemplateForm({ ...templateForm, isActive: v })
                          }
                        />
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setTemplateOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={savingTemplate}>
                          {savingTemplate ? "Creating..." : "Create Template"}
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
                      <TableHead>Basic %</TableHead>
                      <TableHead>HRA %</TableHead>
                      <TableHead>CTC Range</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center text-muted-foreground py-8"
                        >
                          No salary templates yet. Create one to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      templates.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="font-medium">
                            {t.name}
                            {t.description && (
                              <div className="text-xs text-muted-foreground">
                                {t.description}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{t.basicPercent}%</TableCell>
                          <TableCell>{t.hraPercent}%</TableCell>
                          <TableCell>
                            ₹{Number(t.ctcMin || 0).toLocaleString("en-IN")} – ₹
                            {Number(t.ctcMax || 0).toLocaleString("en-IN")}
                          </TableCell>
                          <TableCell>
                            <Badge variant={t.isActive ? "default" : "outline"}>
                              {t.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteTemplate(t.id)}
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
          </TabsContent>

          {/* ── APPROVAL WORKFLOWS ────────────────────────────── */}
          <TabsContent value="workflows" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Approval Workflows</CardTitle>
                  <CardDescription>
                    Define multi-level approval chains for each module.
                  </CardDescription>
                </div>
                <Dialog open={workflowOpen} onOpenChange={setWorkflowOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      New Workflow
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>New Approval Workflow</DialogTitle>
                      <DialogDescription>
                        Levels are processed in the order entered.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={createWorkflow} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="w-name">Name *</Label>
                        <Input
                          id="w-name"
                          value={workflowForm.name}
                          onChange={(e) =>
                            setWorkflowForm({
                              ...workflowForm,
                              name: e.target.value,
                            })
                          }
                          placeholder="Standard Leave Approval"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="w-module">Module</Label>
                        <Select
                          value={workflowForm.module}
                          onValueChange={(v) =>
                            setWorkflowForm({ ...workflowForm, module: v })
                          }
                        >
                          <SelectTrigger id="w-module">
                            <SelectValue placeholder="Select module" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Leave">Leave</SelectItem>
                            <SelectItem value="Reimbursement">
                              Reimbursement
                            </SelectItem>
                            <SelectItem value="Loan">Loan</SelectItem>
                            <SelectItem value="Payroll">Payroll</SelectItem>
                            <SelectItem value="Overtime">Overtime</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="w-levels">
                          Approval Levels (comma-separated)
                        </Label>
                        <Input
                          id="w-levels"
                          value={workflowForm.levels}
                          onChange={(e) =>
                            setWorkflowForm({
                              ...workflowForm,
                              levels: e.target.value,
                            })
                          }
                          placeholder="Manager, HR, Finance"
                        />
                        <p className="text-xs text-muted-foreground">
                          e.g. Manager, HR, Finance
                        </p>
                      </div>
                      <div className="flex items-center justify-between rounded-md border p-3">
                        <div>
                          <Label htmlFor="w-active">Active</Label>
                          <p className="text-xs text-muted-foreground">
                            Apply this workflow to new requests
                          </p>
                        </div>
                        <Switch
                          id="w-active"
                          checked={workflowForm.isActive}
                          onCheckedChange={(v) =>
                            setWorkflowForm({ ...workflowForm, isActive: v })
                          }
                        />
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setWorkflowOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={savingWorkflow}>
                          {savingWorkflow ? "Creating..." : "Create Workflow"}
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
                      <TableHead>Module</TableHead>
                      <TableHead>Levels</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workflows.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center text-muted-foreground py-8"
                        >
                          No approval workflows yet. Create one to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      workflows.map((w) => {
                        const lvls = parseLevels(w.levels);
                        return (
                          <TableRow key={w.id}>
                            <TableCell className="font-medium">
                              {w.name}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{w.module}</Badge>
                            </TableCell>
                            <TableCell>
                              {lvls.length ? (
                                <div className="flex flex-wrap gap-1">
                                  {lvls.map((l, i) => (
                                    <Badge key={i} variant="outline">
                                      {i + 1}. {l}
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={w.isActive ? "default" : "outline"}
                              >
                                {w.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteWorkflow(w.id)}
                              >
                                <Trash2 className="h-4 w-4" />
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

          {/* ── NOTIFICATIONS ─────────────────────────────────── */}
          <TabsContent value="notifications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Control how StaffOS communicates payroll and approval events.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-md border p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-md bg-muted p-2">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <Label
                        htmlFor="emailNotifications"
                        className="text-base"
                      >
                        Email Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Send payslips, approvals and reminders over email.
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={!!company.emailNotifications}
                    disabled={savingNotifs}
                    onCheckedChange={(v) =>
                      saveNotifications({ emailNotifications: v })
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-md border p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-md bg-muted p-2">
                      <MessageSquare className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <Label htmlFor="smsNotifications" className="text-base">
                        SMS Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Send critical alerts and OTPs over SMS.
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="smsNotifications"
                    checked={!!company.smsNotifications}
                    disabled={savingNotifs}
                    onCheckedChange={(v) =>
                      saveNotifications({ smsNotifications: v })
                    }
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  Changes are saved automatically.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
