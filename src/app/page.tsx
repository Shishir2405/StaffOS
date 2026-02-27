"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw
} from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"

interface Employee {
  id: number
  employeeCode: string
  firstName: string
  lastName: string
  email: string
  department: string
  designation: string
}

interface AttendanceRecord {
  id: number
  employeeId: number
  employeeName?: string
  checkInTime: string
  checkOutTime: string | null
  zoneName?: string
  status: string
}

interface Department {
  id: number
  name: string
  description: string
  employeeCount?: number
}

export default function Home() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Redirect if not authenticated
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/sign-in")
    }
  }, [session, isPending, router])

  useEffect(() => {
    if (session?.user) {
      fetchDashboardData()
    }
  }, [session])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("bearer_token")
      const headers = {
        Authorization: `Bearer ${token}`,
      }

      const [employeesRes, attendanceRes, departmentsRes] = await Promise.all([
        fetch("/api/employees", { headers }),
        fetch("/api/attendance", { headers }),
        fetch("/api/departments", { headers })
      ])

      if (employeesRes.ok) {
        const employeesData = await employeesRes.json()
        if (employeesData.success && Array.isArray(employeesData.data)) {
          setEmployees(employeesData.data)
        }
      }

      if (attendanceRes.ok) {
        const attendanceData = await attendanceRes.json()
        if (attendanceData.success && Array.isArray(attendanceData.data)) {
          setAttendanceRecords(attendanceData.data)
        }
      }

      if (departmentsRes.ok) {
        const departmentsData = await departmentsRes.json()
        if (departmentsData.success && Array.isArray(departmentsData.data)) {
          setDepartments(departmentsData.data)
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      toast.error("Failed to fetch dashboard data")
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate stats from real data
  const today = new Date().toDateString()
  const todayAttendance = attendanceRecords.filter(
    (record) => new Date(record.checkInTime).toDateString() === today
  )

  const stats = [
    {
      title: "Total Employees",
      value: employees.length.toString(),
      change: "+0%",
      trend: "up",
      icon: Users,
      color: "text-blue-500",
    },
    {
      title: "Present Today",
      value: todayAttendance.length.toString(),
      change: employees.length > 0 
        ? `${Math.round((todayAttendance.length / employees.length) * 100)}%`
        : "0%",
      trend: "up",
      icon: UserCheck,
      color: "text-green-500",
    },
    {
      title: "Absent Today",
      value: (employees.length - todayAttendance.length).toString(),
      change: employees.length > 0
        ? `${Math.round(((employees.length - todayAttendance.length) / employees.length) * 100)}%`
        : "0%",
      trend: "down",
      icon: UserX,
      color: "text-red-500",
    },
    {
      title: "Departments",
      value: departments.length.toString(),
      change: "+0%",
      trend: "up",
      icon: Users,
      color: "text-purple-500",
    },
  ]

  // Get recent activity from today's attendance
  const recentActivity = todayAttendance
    .slice(0, 4)
    .map((record) => ({
      name: record.employeeName || "Unknown",
      action: record.checkOutTime ? "Checked out" : "Checked in",
      time: new Date(record.checkInTime).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      location: record.zoneName || "Unknown",
      status: record.checkOutTime ? "completed" : "active",
    }))

  // Calculate department stats
  const departmentStats = departments.map((dept) => {
    const deptEmployees = employees.filter((emp) => emp.department === dept.name)
    const deptAttendance = todayAttendance.filter((att) =>
      employees.find((emp) => emp.id === att.employeeId && emp.department === dept.name)
    )
    const attendanceRate = deptEmployees.length > 0
      ? Math.round((deptAttendance.length / deptEmployees.length) * 100)
      : 0

    return {
      name: dept.name,
      count: deptEmployees.length,
      attendance: attendanceRate,
      color: "bg-blue-500",
    }
  })

  if (isPending || isLoading) {
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
        {/* Welcome Section */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your organization today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            const TrendIcon = stat.trend === "up" ? TrendingUp : TrendingDown
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <TrendIcon className={`h-3 w-3 ${stat.trend === "up" ? "text-green-500" : "text-red-500"}`} />
                    {stat.change} of total
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          {/* Recent Activity */}
          <Card className="lg:col-span-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Today's check-in/check-out activity
                  </CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={() => router.push("/attendance")}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No Activity Yet</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    No employee check-ins recorded today
                  </p>
                  <Button 
                    className="mt-4" 
                    onClick={() => router.push("/attendance")}
                  >
                    Mark Attendance
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {activity.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {activity.name}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{activity.action}</span>
                          <span>•</span>
                          <MapPin className="h-3 w-3" />
                          <span>{activity.location}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge 
                          variant={activity.status === "active" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {activity.status === "active" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                          {activity.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {activity.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Employees List */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Employees</CardTitle>
                  <CardDescription>
                    Recent employees
                  </CardDescription>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => router.push("/employees/new")}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {employees.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No Employees</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Get started by adding your first employee
                  </p>
                  <Button 
                    className="mt-4" 
                    onClick={() => router.push("/employees/new")}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Employee
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {employees.slice(0, 5).map((employee) => (
                    <div key={employee.id} className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {employee.firstName[0]}{employee.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {employee.firstName} {employee.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {employee.designation}
                        </p>
                      </div>
                      <Badge variant="outline">{employee.department}</Badge>
                    </div>
                  ))}
                  {employees.length > 5 && (
                    <Button 
                      variant="ghost" 
                      className="w-full" 
                      onClick={() => router.push("/employees")}
                    >
                      View All ({employees.length})
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Department Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Department Overview</CardTitle>
                <CardDescription>
                  Attendance and headcount by department
                </CardDescription>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => router.push("/organization")}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Department
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {departmentStats.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No Departments</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Create departments to organize your employees
                </p>
                <Button 
                  className="mt-4" 
                  onClick={() => router.push("/organization")}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Create Department
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {departmentStats.map((dept) => (
                  <div key={dept.name} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${dept.color}`} />
                        <span className="font-medium">{dept.name}</span>
                      </div>
                      <Badge variant="outline">{dept.count} employees</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Today's Attendance</span>
                        <span className="font-medium">{dept.attendance}%</span>
                      </div>
                      <Progress value={dept.attendance} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Frequently used actions and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Button 
                className="h-20 flex-col gap-2" 
                variant="outline"
                onClick={() => router.push("/employees/new")}
              >
                <Users className="h-5 w-5" />
                <span>Add Employee</span>
              </Button>
              <Button 
                className="h-20 flex-col gap-2" 
                variant="outline"
                onClick={() => router.push("/attendance")}
              >
                <Clock className="h-5 w-5" />
                <span>Mark Attendance</span>
              </Button>
              <Button 
                className="h-20 flex-col gap-2" 
                variant="outline"
                onClick={() => router.push("/geofencing")}
              >
                <MapPin className="h-5 w-5" />
                <span>Manage Geofences</span>
              </Button>
              <Button 
                className="h-20 flex-col gap-2" 
                variant="outline"
                onClick={() => router.push("/attendance/dashboard")}
              >
                <UserCheck className="h-5 w-5" />
                <span>View Reports</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}