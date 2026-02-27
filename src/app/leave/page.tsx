"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Calendar as CalendarIcon, Plus, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"

interface LeaveRequest {
  id: number
  employeeId: number
  employeeName: string
  employeeCode?: string
  leaveType: string
  startDate: string
  endDate: string
  totalDays: number
  reason: string
  status: string
  approvedBy?: number | null
  approvedAt?: string | null
  createdAt: string
}

export default function LeavePage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [formData, setFormData] = useState({
    leaveType: "",
    reason: "",
  })

  // Redirect if not authenticated
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/sign-in")
    }
  }, [session, isPending, router])

  useEffect(() => {
    if (session?.user) {
      fetchLeaveRequests()
    }
  }, [session])

  const fetchLeaveRequests = async () => {
    setIsFetching(true)
    try {
      const token = localStorage.getItem("bearer_token")
      const response = await fetch("/api/leave-requests", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      // API returns array directly
      if (Array.isArray(data)) {
        setLeaveRequests(data)
      } else {
        console.error("Unexpected data format:", data)
        toast.error("Failed to load leave requests")
      }
    } catch (error) {
      console.error("Error fetching leave requests:", error)
      toast.error("Failed to fetch leave requests")
    } finally {
      setIsFetching(false)
    }
  }

  const calculateDays = () => {
    if (!startDate || !endDate) return 0
    const diff = Math.abs(endDate.getTime() - startDate.getTime())
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!startDate || !endDate || !formData.leaveType || !formData.reason) {
      toast.error("Please fill in all fields")
      return
    }

    if (!session?.user?.employeeId) {
      toast.error("No employee record linked to your account. Please contact admin.")
      return
    }

    setIsLoading(true)
    try {
      const token = localStorage.getItem("bearer_token")
      const response = await fetch("/api/leave-requests", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          employeeId: session.user.employeeId,
          leaveType: formData.leaveType,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          totalDays: calculateDays(),
          reason: formData.reason,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to submit leave request")
      }
      
      const data = await response.json()
      toast.success("Leave request submitted successfully")
      setIsDialogOpen(false)
      setFormData({ leaveType: "", reason: "" })
      setStartDate(undefined)
      setEndDate(undefined)
      fetchLeaveRequests()
    } catch (error: any) {
      console.error("Submit error:", error)
      toast.error(error.message || "Failed to submit leave request")
    } finally {
      setIsLoading(false)
    }
  }

  const handleApproveReject = async (leaveId: number, status: "Approved" | "Rejected") => {
    if (!session?.user?.employeeId) {
      toast.error("No employee record linked to your account.")
      return
    }

    try {
      const token = localStorage.getItem("bearer_token")
      const response = await fetch(`/api/leave-requests?id=${leaveId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
          approvedBy: session.user.employeeId,
          approvedAt: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to ${status.toLowerCase()} leave request`)
      }

      toast.success(`Leave request ${status.toLowerCase()} successfully`)
      fetchLeaveRequests()
    } catch (error: any) {
      console.error("Approve/Reject error:", error)
      toast.error(error.message || `Failed to ${status.toLowerCase()} leave request`)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "default"
      case "pending":
        return "secondary"
      case "rejected":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return <CheckCircle className="h-4 w-4" />
      case "pending":
        return <Clock className="h-4 w-4" />
      case "rejected":
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const leaveBalance = {
    casual: 12,
    sick: 10,
    earned: 15,
    total: 37,
  }

  // Check if user is admin or HR
  const isAdminOrHR = session?.user?.role === "admin" || session?.user?.role === "hr"

  // Filter requests for different tabs
  const myRequests = leaveRequests.filter(req => req.employeeId === session?.user?.employeeId)
  const pendingApprovals = leaveRequests.filter(req => req.status === "Pending")
  const allRequests = leaveRequests

  if (isPending || isFetching) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <RefreshCw className="h-8 w-8 animate-spin" />
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
            <h1 className="text-3xl font-bold tracking-tight">Leave Management</h1>
            <p className="text-muted-foreground">
              {isAdminOrHR ? "Manage leave requests and approvals" : "Apply for leave and track your requests"}
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Apply Leave
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>New Leave Request</DialogTitle>
                <DialogDescription>
                  Submit a leave request for approval
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="leaveType">Leave Type</Label>
                    <Select
                      value={formData.leaveType}
                      onValueChange={(value) =>
                        setFormData({ ...formData, leaveType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select leave type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Casual Leave">Casual Leave</SelectItem>
                        <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                        <SelectItem value="Paid Leave">Paid Leave</SelectItem>
                        <SelectItem value="Unpaid Leave">Unpaid Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Total Days</Label>
                    <Input
                      value={calculateDays()}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      className="rounded-md border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={(date) => startDate ? date < startDate : false}
                      className="rounded-md border"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea
                    id="reason"
                    placeholder="Please provide a reason for your leave request"
                    value={formData.reason}
                    onChange={(e) =>
                      setFormData({ ...formData, reason: e.target.value })
                    }
                    rows={4}
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Submitting..." : "Submit Request"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Leave Balance Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Leave Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{leaveBalance.total}</div>
              <p className="text-xs text-muted-foreground mt-1">days remaining</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Casual Leave
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{leaveBalance.casual}</div>
              <p className="text-xs text-muted-foreground mt-1">days remaining</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Sick Leave
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{leaveBalance.sick}</div>
              <p className="text-xs text-muted-foreground mt-1">days remaining</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Earned Leave
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{leaveBalance.earned}</div>
              <p className="text-xs text-muted-foreground mt-1">days remaining</p>
            </CardContent>
          </Card>
        </div>

        {/* Leave Requests Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Leave Requests</CardTitle>
            <CardDescription>
              {isAdminOrHR ? "View and manage all leave requests" : "View and track your leave applications"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={isAdminOrHR ? "pending" : "my-requests"}>
              <TabsList className="mb-4">
                <TabsTrigger value="my-requests">My Requests</TabsTrigger>
                {isAdminOrHR && (
                  <>
                    <TabsTrigger value="pending">
                      Pending Approvals
                      {pendingApprovals.length > 0 && (
                        <Badge variant="destructive" className="ml-2">
                          {pendingApprovals.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="all">All Requests</TabsTrigger>
                  </>
                )}
              </TabsList>

              <TabsContent value="my-requests">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Leave Type</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Applied On</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No leave requests found
                        </TableCell>
                      </TableRow>
                    ) : (
                      myRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">
                            {request.leaveType}
                          </TableCell>
                          <TableCell>
                            {format(new Date(request.startDate), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell>
                            {format(new Date(request.endDate), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell>{request.totalDays}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {request.reason}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(request.status)}>
                              <span className="flex items-center gap-1">
                                {getStatusIcon(request.status)}
                                <span className="capitalize">{request.status}</span>
                              </span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(request.createdAt), "MMM dd, yyyy")}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>

              {isAdminOrHR && (
                <>
                  <TabsContent value="pending">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Leave Type</TableHead>
                          <TableHead>Start Date</TableHead>
                          <TableHead>End Date</TableHead>
                          <TableHead>Days</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Applied On</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingApprovals.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                              No pending approvals
                            </TableCell>
                          </TableRow>
                        ) : (
                          pendingApprovals.map((request) => (
                            <TableRow key={request.id}>
                              <TableCell className="font-medium">
                                {request.employeeName}
                                {request.employeeCode && (
                                  <div className="text-xs text-muted-foreground">
                                    {request.employeeCode}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>{request.leaveType}</TableCell>
                              <TableCell>
                                {format(new Date(request.startDate), "MMM dd, yyyy")}
                              </TableCell>
                              <TableCell>
                                {format(new Date(request.endDate), "MMM dd, yyyy")}
                              </TableCell>
                              <TableCell>{request.totalDays}</TableCell>
                              <TableCell className="max-w-xs truncate">
                                {request.reason}
                              </TableCell>
                              <TableCell>
                                {format(new Date(request.createdAt), "MMM dd, yyyy")}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => handleApproveReject(request.id, "Approved")}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleApproveReject(request.id, "Rejected")}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TabsContent>

                  <TabsContent value="all">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Leave Type</TableHead>
                          <TableHead>Start Date</TableHead>
                          <TableHead>End Date</TableHead>
                          <TableHead>Days</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Applied On</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allRequests.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                              No leave requests found
                            </TableCell>
                          </TableRow>
                        ) : (
                          allRequests.map((request) => (
                            <TableRow key={request.id}>
                              <TableCell className="font-medium">
                                {request.employeeName}
                                {request.employeeCode && (
                                  <div className="text-xs text-muted-foreground">
                                    {request.employeeCode}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>{request.leaveType}</TableCell>
                              <TableCell>
                                {format(new Date(request.startDate), "MMM dd, yyyy")}
                              </TableCell>
                              <TableCell>
                                {format(new Date(request.endDate), "MMM dd, yyyy")}
                              </TableCell>
                              <TableCell>{request.totalDays}</TableCell>
                              <TableCell className="max-w-xs truncate">
                                {request.reason}
                              </TableCell>
                              <TableCell>
                                <Badge variant={getStatusColor(request.status)}>
                                  <span className="flex items-center gap-1">
                                    {getStatusIcon(request.status)}
                                    <span className="capitalize">{request.status}</span>
                                  </span>
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {format(new Date(request.createdAt), "MMM dd, yyyy")}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TabsContent>
                </>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}