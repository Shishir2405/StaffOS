"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Users, 
  ChevronDown, 
  ChevronRight,
  Building2,
  Eye
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/auth-client"

interface Employee {
  id: number
  employeeCode: string
  firstName: string
  lastName: string
  email: string
  department: string
  designation: string
  managerId: number | null
  avatarUrl: string | null
  employmentStatus: string
}

interface OrgNode extends Employee {
  subordinates: OrgNode[]
  expanded?: boolean
}

export default function OrganizationPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [orgTree, setOrgTree] = useState<OrgNode[]>([])
  const [loading, setLoading] = useState(true)
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set())

  // Redirect if not authenticated
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/sign-in")
    }
  }, [session, isPending, router])

  useEffect(() => {
    if (session?.user) {
      fetchEmployees()
    }
  }, [departmentFilter, session])

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (departmentFilter !== "all") params.append("department", departmentFilter)
      
      const token = localStorage.getItem("bearer_token")
      const response = await fetch(`/api/employees?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setEmployees(data)
        buildOrgTree(data)
      }
    } catch (error) {
      console.error("Error fetching employees:", error)
    } finally {
      setLoading(false)
    }
  }

  const buildOrgTree = (employeeList: Employee[]) => {
    const employeeMap = new Map<number, OrgNode>()
    
    // Create nodes
    employeeList.forEach((emp) => {
      employeeMap.set(emp.id, { ...emp, subordinates: [] })
    })

    // Build tree structure
    const roots: OrgNode[] = []
    employeeList.forEach((emp) => {
      const node = employeeMap.get(emp.id)!
      if (emp.managerId && employeeMap.has(emp.managerId)) {
        const manager = employeeMap.get(emp.managerId)!
        manager.subordinates.push(node)
      } else {
        roots.push(node)
      }
    })

    setOrgTree(roots)
  }

  const toggleNode = (nodeId: number) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId)
      } else {
        newSet.add(nodeId)
      }
      return newSet
    })
  }

  const expandAll = () => {
    const allIds = new Set<number>()
    const collectIds = (nodes: OrgNode[]) => {
      nodes.forEach((node) => {
        if (node.subordinates.length > 0) {
          allIds.add(node.id)
          collectIds(node.subordinates)
        }
      })
    }
    collectIds(orgTree)
    setExpandedNodes(allIds)
  }

  const collapseAll = () => {
    setExpandedNodes(new Set())
  }

  const renderNode = (node: OrgNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.id)
    const hasSubordinates = node.subordinates.length > 0

    return (
      <div key={node.id} className="relative">
        <div
          className={`flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent transition-colors cursor-pointer ${
            level > 0 ? "ml-8" : ""
          }`}
          style={{ marginLeft: level * 32 }}
        >
          {hasSubordinates && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation()
                toggleNode(node.id)
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}
          {!hasSubordinates && <div className="w-6" />}

          <Avatar className="h-10 w-10">
            <AvatarImage src={node.avatarUrl || undefined} />
            <AvatarFallback>
              {node.firstName[0]}{node.lastName[0]}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-medium">
                {node.firstName} {node.lastName}
              </p>
              {hasSubordinates && (
                <Badge variant="secondary" className="text-xs">
                  {node.subordinates.length} report{node.subordinates.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{node.designation}</span>
              <span>•</span>
              <span>{node.department}</span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/employees/${node.id}`)}
          >
            <Eye className="h-4 w-4 mr-2" />
            View
          </Button>
        </div>

        {hasSubordinates && isExpanded && (
          <div className="mt-2 space-y-2">
            {node.subordinates.map((sub) => renderNode(sub, level + 1))}
          </div>
        )}
      </div>
    )
  }

  const departments = ["Engineering", "Sales", "Marketing", "HR", "Finance", "Operations"]

  const getStats = () => {
    const activeEmployees = employees.filter(e => e.employmentStatus === "Active").length
    const managers = new Set(employees.filter(e => e.managerId).map(e => e.managerId)).size
    const departments = new Set(employees.map(e => e.department)).size

    return { activeEmployees, managers, departments }
  }

  const stats = getStats()

  if (isPending) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <Users className="h-8 w-8 animate-spin" />
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
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Organization Chart</h1>
              <p className="text-muted-foreground">
                Visual representation of your organization's hierarchy
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={collapseAll}>
                Collapse All
              </Button>
              <Button variant="outline" onClick={expandAll}>
                Expand All
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeEmployees}</div>
              <p className="text-xs text-muted-foreground">Active employees</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Managers</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.managers}</div>
              <p className="text-xs text-muted-foreground">People managers</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Departments</CardTitle>
              <Building2 className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.departments}</div>
              <p className="text-xs text-muted-foreground">Active departments</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Filter by Department</CardTitle>
            <CardDescription>
              View organizational structure by specific department
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full md:w-[280px]">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Organization Tree */}
        <Card>
          <CardHeader>
            <CardTitle>Hierarchy View</CardTitle>
            <CardDescription>
              Click to expand/collapse team members
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : orgTree.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No employees found</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {departmentFilter !== "all" 
                    ? "Try selecting a different department"
                    : "Add employees to see the organization chart"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {orgTree.map((node) => renderNode(node))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}