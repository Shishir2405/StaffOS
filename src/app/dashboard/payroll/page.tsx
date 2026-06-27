"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DollarSign, Plus, Play, FileText, CheckCircle, Clock, Calendar } from "lucide-react"
import { toast } from "@/components/ui/custom-toast"
import { format } from "date-fns"
import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"

interface PayrollRun {
  id: number
  runDate: string
  periodStart: string
  periodEnd: string
  status: string
  totalEmployees: number
  totalAmount: number
  createdAt: string
  processedAt: string | null
}

interface Payslip {
  id: number
  payrollRunId: number
  employeeId: number
  employeeName: string
  department: string
  designation: string
  periodStart: string
  periodEnd: string
  basicSalary: number
  totalAllowances: number
  totalDeductions: number
  grossSalary: number
  netSalary: number
  pfAmount: number
  esiAmount: number
  tdsAmount: number
  status: string
  generatedAt: string | null
}

export default function PayrollPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([])
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null)
  const [payslips, setPayslips] = useState<Payslip[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [formData, setFormData] = useState({
    periodStart: "",
    periodEnd: "",
    runDate: new Date().toISOString().split('T')[0],
  })

  // Redirect if not authenticated
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/sign-in")
    }
  }, [session, isPending, router])

  useEffect(() => {
    if (session?.user) {
      fetchPayrollRuns()
    }
  }, [session])

  const fetchPayrollRuns = async () => {
    try {
      const token = localStorage.getItem("bearer_token")
      const response = await fetch("/api/payroll-runs", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      setPayrollRuns(data)
    } catch (error) {
      console.error("Error fetching payroll runs:", error)
      toast.error("Failed to fetch payroll runs")
    }
  }

  const fetchPayslips = async (payrollRunId: number) => {
    try {
      const token = localStorage.getItem("bearer_token")
      const response = await fetch(`/api/payslips?payrollRunId=${payrollRunId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      setPayslips(data)
    } catch (error) {
      console.error("Error fetching payslips:", error)
      toast.error("Failed to fetch payslips")
    }
  }

  const handleCreatePayrollRun = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.periodStart || !formData.periodEnd) {
      toast.error("Please fill in all required fields")
      return
    }

    if (!session?.user?.id) {
      toast.error("User session not found. Please log in again.")
      return
    }

    setIsLoading(true)
    try {
      const token = localStorage.getItem("bearer_token")
      const response = await fetch("/api/payroll-runs", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          runDate: formData.runDate,
          periodStart: formData.periodStart,
          periodEnd: formData.periodEnd,
          status: "draft",
          createdBy: session.user.id,
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
        toast.success("Payroll run created successfully")
        setIsCreateDialogOpen(false)
        setFormData({
          periodStart: "",
          periodEnd: "",
          runDate: new Date().toISOString().split('T')[0],
        })
        fetchPayrollRuns()
      } else {
        toast.error(data.error || "Failed to create payroll run")
      }
    } catch (error) {
      console.error("Create error:", error)
      toast.error("Failed to create payroll run")
    } finally {
      setIsLoading(false)
    }
  }

  const handleProcessPayroll = async (payrollRunId: number) => {
    setIsProcessing(true)
    try {
      const token = localStorage.getItem("bearer_token")
      const response = await fetch("/api/payroll/process", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          payrollRunId,
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
        toast.success(`Payroll processed successfully! Generated ${data.summary.totalEmployees} payslips`)
        fetchPayrollRuns()
        if (selectedRun?.id === payrollRunId) {
          fetchPayslips(payrollRunId)
        }
      } else {
        toast.error(data.error || "Failed to process payroll")
      }
    } catch (error) {
      console.error("Process error:", error)
      toast.error("Failed to process payroll")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleViewPayslips = (run: PayrollRun) => {
    setSelectedRun(run)
    fetchPayslips(run.id)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", icon: any }> = {
      draft: { variant: "outline", icon: FileText },
      processing: { variant: "secondary", icon: Clock },
      completed: { variant: "default", icon: CheckCircle },
      approved: { variant: "default", icon: CheckCircle },
    }

    const config = statusConfig[status] || statusConfig.draft
    const Icon = config.icon

    return (
      <Badge variant={config.variant}>
        <Icon className="mr-1 h-3 w-3" />
        <span className="capitalize">{status}</span>
      </Badge>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const totalPayroll = payrollRuns
    .filter((run) => run.status === "completed" || run.status === "approved")
    .reduce((sum, run) => sum + run.totalAmount, 0)

  const pendingRuns = payrollRuns.filter((run) => run.status === "draft").length

  if (isPending) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <Clock className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (!session?.user) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payroll Management</h1>
            <p className="text-muted-foreground">
              Manage salary computation, payslips, and statutory compliance
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Payroll Run
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Payroll Run</DialogTitle>
                <DialogDescription>
                  Set up a new payroll processing cycle
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreatePayrollRun} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="periodStart">Period Start Date</Label>
                  <Input
                    id="periodStart"
                    type="date"
                    value={formData.periodStart}
                    onChange={(e) =>
                      setFormData({ ...formData, periodStart: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="periodEnd">Period End Date</Label>
                  <Input
                    id="periodEnd"
                    type="date"
                    value={formData.periodEnd}
                    onChange={(e) =>
                      setFormData({ ...formData, periodEnd: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="runDate">Run Date</Label>
                  <Input
                    id="runDate"
                    type="date"
                    value={formData.runDate}
                    onChange={(e) =>
                      setFormData({ ...formData, runDate: e.target.value })
                    }
                    required
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Creating..." : "Create Payroll Run"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Payroll (Processed)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalPayroll)}</div>
              <p className="text-xs text-muted-foreground mt-1">this period</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Runs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{payrollRuns.length}</div>
              <p className="text-xs text-muted-foreground mt-1">all time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Runs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#611F69]">{pendingRuns}</div>
              <p className="text-xs text-muted-foreground mt-1">awaiting processing</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Employees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {payrollRuns.length > 0 ? payrollRuns[0].totalEmployees : 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">in last run</p>
            </CardContent>
          </Card>
        </div>

        {/* Payroll Runs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Payroll Runs</CardTitle>
            <CardDescription>View and manage payroll processing cycles</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Run ID</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Run Date</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrollRuns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No payroll runs found. Create your first payroll run to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  payrollRuns.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell className="font-medium">#{run.id}</TableCell>
                      <TableCell>
                        {format(new Date(run.periodStart), "MMM dd")} -{" "}
                        {format(new Date(run.periodEnd), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>{format(new Date(run.runDate), "MMM dd, yyyy")}</TableCell>
                      <TableCell>{run.totalEmployees}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(run.totalAmount)}
                      </TableCell>
                      <TableCell>{getStatusBadge(run.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {run.status === "draft" && (
                            <Button
                              size="sm"
                              onClick={() => handleProcessPayroll(run.id)}
                              disabled={isProcessing}
                            >
                              <Play className="mr-1 h-3 w-3" />
                              Process
                            </Button>
                          )}
                          {(run.status === "completed" || run.status === "approved") && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewPayslips(run)}
                            >
                              <FileText className="mr-1 h-3 w-3" />
                              View Payslips
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Payslips Table */}
        {selectedRun && (
          <Card>
            <CardHeader>
              <CardTitle>
                Payslips - {format(new Date(selectedRun.periodStart), "MMMM yyyy")}
              </CardTitle>
              <CardDescription>
                Generated payslips for payroll run #{selectedRun.id}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Basic Salary</TableHead>
                    <TableHead>Allowances</TableHead>
                    <TableHead>Deductions</TableHead>
                    <TableHead>Gross Salary</TableHead>
                    <TableHead>Net Salary</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payslips.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground">
                        No payslips generated yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    payslips.map((payslip) => (
                      <TableRow key={payslip.id}>
                        <TableCell className="font-medium">{payslip.employeeName}</TableCell>
                        <TableCell>{payslip.department}</TableCell>
                        <TableCell>{payslip.designation}</TableCell>
                        <TableCell>{formatCurrency(payslip.basicSalary)}</TableCell>
                        <TableCell className="text-green-600">
                          +{formatCurrency(payslip.totalAllowances)}
                        </TableCell>
                        <TableCell className="text-red-600">
                          -{formatCurrency(payslip.totalDeductions)}
                        </TableCell>
                        <TableCell>{formatCurrency(payslip.grossSalary)}</TableCell>
                        <TableCell className="font-bold">
                          {formatCurrency(payslip.netSalary)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {payslip.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}