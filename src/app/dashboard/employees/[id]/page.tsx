"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  DollarSign,
  Users,
  CreditCard,
  AlertCircle,
  Building2,
  User,
  FileText
} from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { useSession } from "@/lib/auth-client"

interface Employee {
  id: number
  employeeCode: string
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  gender: string
  maritalStatus: string
  address: string
  city: string
  state: string
  postalCode: string
  country: string
  department: string
  designation: string
  role: string
  managerId: number | null
  employmentType: string
  employmentStatus: string
  dateOfJoining: string
  dateOfLeaving: string | null
  salary: number
  bankAccountNumber: string | null
  bankName: string | null
  emergencyContactName: string
  emergencyContactPhone: string
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
}

export default function EmployeeDetailPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const params = useParams()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [subordinates, setSubordinates] = useState<Employee[]>([])

  // Redirect if not authenticated
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/sign-in")
    }
  }, [session, isPending, router])

  useEffect(() => {
    if (params.id && session?.user) {
      fetchEmployee()
      fetchSubordinates()
    }
  }, [params.id, session])

  const fetchEmployee = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("bearer_token")
      const response = await fetch(`/api/employees?id=${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setEmployee(data)
      }
    } catch (error) {
      console.error("Error fetching employee:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSubordinates = async () => {
    try {
      const token = localStorage.getItem("bearer_token")
      const response = await fetch(`/api/employees/subordinates?managerId=${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setSubordinates(data)
      }
    } catch (error) {
      console.error("Error fetching subordinates:", error)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      Active: "default",
      Inactive: "secondary",
      Terminated: "destructive",
    }
    return (
      <Badge variant={variants[status] || "secondary"}>
        {status}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  if (isPending || loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-6 p-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    )
  }

  if (!session?.user) {
    return null
  }

  if (!employee) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <h2 className="text-2xl font-semibold">Employee Not Found</h2>
          <p className="text-muted-foreground">The employee you're looking for doesn't exist.</p>
          <Button onClick={() => router.push("/employees")}>
            Back to Employees
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Employee Profile</h1>
              <p className="text-muted-foreground">
                Complete employee information and details
              </p>
            </div>
          </div>
          <Button onClick={() => router.push(`/employees/${employee.id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </div>

        {/* Profile Header Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              <Avatar className="h-32 w-32">
                <AvatarImage src={employee.avatarUrl || undefined} />
                <AvatarFallback className="text-3xl">
                  {employee.firstName[0]}{employee.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {employee.firstName} {employee.lastName}
                    </h2>
                    <p className="text-lg text-muted-foreground">{employee.designation}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="font-mono text-sm text-muted-foreground">
                        {employee.employeeCode}
                      </span>
                      <Separator orientation="vertical" className="h-4" />
                      {getStatusBadge(employee.employmentStatus)}
                      <Badge variant="outline">{employee.employmentType}</Badge>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{employee.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{employee.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{employee.department}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Joined {formatDate(employee.dateOfJoining)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Information Tabs */}
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="employment">Employment</TabsTrigger>
            <TabsTrigger value="compensation">Compensation</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Basic personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                    <p className="text-sm">{formatDate(employee.dateOfBirth)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Gender</p>
                    <p className="text-sm">{employee.gender}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Marital Status</p>
                    <p className="text-sm">{employee.maritalStatus}</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    Address
                  </p>
                  <p className="text-sm">
                    {employee.address}<br />
                    {employee.city}, {employee.state} {employee.postalCode}<br />
                    {employee.country}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    Emergency Contact
                  </p>
                  <div className="space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">Name:</span> {employee.emergencyContactName}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Phone:</span> {employee.emergencyContactPhone}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Employment Details</CardTitle>
                <CardDescription>Job and organizational information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Department</p>
                    <p className="text-sm">{employee.department}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Designation</p>
                    <p className="text-sm">{employee.designation}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Role</p>
                    <p className="text-sm">{employee.role}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Employment Type</p>
                    <p className="text-sm">{employee.employmentType}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Date of Joining</p>
                    <p className="text-sm">{formatDate(employee.dateOfJoining)}</p>
                  </div>
                  {employee.dateOfLeaving && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Date of Leaving</p>
                      <p className="text-sm">{formatDate(employee.dateOfLeaving)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compensation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Compensation & Banking</CardTitle>
                <CardDescription>Salary and payment information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Annual Salary</p>
                  <p className="text-2xl font-bold">{formatCurrency(employee.salary)}</p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    <CreditCard className="h-4 w-4 inline mr-1" />
                    Banking Details
                  </p>
                  {employee.bankAccountNumber ? (
                    <>
                      <p className="text-sm">
                        <span className="font-medium">Account Number:</span> {employee.bankAccountNumber}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Bank Name:</span> {employee.bankName}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No banking details provided</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>
                  {subordinates.length} direct report{subordinates.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {subordinates.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-sm text-muted-foreground">
                      No team members reporting to this employee
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {subordinates.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => router.push(`/employees/${member.id}`)}
                      >
                        <Avatar>
                          <AvatarImage src={member.avatarUrl || undefined} />
                          <AvatarFallback>
                            {member.firstName[0]}{member.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">
                            {member.firstName} {member.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">{member.designation}</p>
                        </div>
                        <Badge variant="outline">{member.employmentStatus}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
                <CardDescription>Employee documents and files</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    Document management coming soon
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}