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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Plus,
  Shield,
  Trash2,
  Loader2,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  employeeCode: string;
  department: string;
  email: string;
}

interface UserAccount {
  id: string;
  email: string;
  name: string;
  role: string;
  employeeId: number | null;
  emailVerified: boolean;
  createdAt: string;
  firstName: string | null;
  lastName: string | null;
  employeeCode: string | null;
  department: string | null;
  designation: string | null;
  employmentStatus: string | null;
}

interface Geofence {
  id: number;
  name: string;
  description: string | null;
  address: string;
  latitude: number;
  longitude: number;
  radius: number;
  isActive: boolean;
}

interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  emailVerified: boolean;
  image?: string | null;
}

export default function AdminUsersPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedGeofences, setSelectedGeofences] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    role: "employee",
    employeeId: "",
  });

  const sessionUser = session?.user as SessionUser | undefined;

  useEffect(() => {
    if (!isPending && !sessionUser) {
      router.push("/sign-in");
    } else if (!isPending && sessionUser?.role !== "admin") {
      toast.error("Access denied. Admin only.");
      router.push("/");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (sessionUser?.role === "admin") {
      fetchUsers();
      fetchEmployees();
      fetchGeofences();
    }
  }, [session]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/admin/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/employees", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setEmployees(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchGeofences = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/geofences?isActive=true", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setGeofences(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching geofences:", error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.email ||
      !formData.password ||
      !formData.name ||
      !formData.employeeId
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    if (selectedGeofences.length === 0) {
      toast.error("Please select at least one geofence location");
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("bearer_token");

      // Create user account
      const userResponse = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          employeeId: parseInt(formData.employeeId),
        }),
      });

      const userData = await userResponse.json();

      if (!userResponse.ok) {
        toast.error(userData.error || "Failed to create user");
        setIsLoading(false);
        return;
      }

      // Assign geofences to user
      const geofenceResponse = await fetch("/api/user-geofences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: userData.id,
          geofenceIds: selectedGeofences,
        }),
      });

      if (!geofenceResponse.ok) {
        const geofenceError = await geofenceResponse.json();
        console.error("Failed to assign geofences:", geofenceError);
        toast.warning("User created but failed to assign some geofences");
      } else {
        const geofenceData = await geofenceResponse.json();
        toast.success(
          `User created with ${geofenceData.summary.created} geofence(s) assigned`,
        );
      }

      // Reset form and close dialog
      setIsDialogOpen(false);
      setFormData({
        email: "",
        password: "",
        name: "",
        role: "employee",
        employeeId: "",
      });
      setSelectedGeofences([]);
      fetchUsers();
    } catch (error) {
      console.error("Create error:", error);
      toast.error("Failed to create user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    if (!confirm("Are you sure you want to deactivate this user account?"))
      return;

    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("User deactivated successfully");
        fetchUsers();
      } else {
        toast.error(data.error || "Failed to deactivate user");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to deactivate user");
    }
  };

  const toggleGeofence = (geofenceId: number) => {
    setSelectedGeofences((prev) =>
      prev.includes(geofenceId)
        ? prev.filter((id) => id !== geofenceId)
        : [...prev, geofenceId],
    );
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      admin: "destructive",
      hr: "default",
      manager: "secondary",
      employee: "outline",
    };
    return (
      <Badge variant={colors[role] || "outline"}>{role.toUpperCase()}</Badge>
    );
  };

  // Filter employees who don't have user accounts yet
  const availableEmployees = employees.filter(
    (emp) => !users.some((user) => user.employeeId === emp.id),
  );

  if (isPending) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!sessionUser || sessionUser.role !== "admin") {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Shield className="h-8 w-8" />
              User Management
            </h1>
            <p className="text-muted-foreground">
              Create and manage user accounts with role-based access
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create User Account
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New User Account</DialogTitle>
                <DialogDescription>
                  Set up login credentials and assign geofence locations
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-6">
                {/* Employee Selection */}
                <div className="space-y-2">
                  <Label htmlFor="employee">
                    Employee <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.employeeId}
                    onValueChange={(value) => {
                      const employee = employees.find(
                        (emp) => emp.id === parseInt(value),
                      );
                      setFormData({
                        ...formData,
                        employeeId: value,
                        email: employee?.email || formData.email,
                        name: employee
                          ? `${employee.firstName} ${employee.lastName}`
                          : formData.name,
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableEmployees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>
                          {emp.employeeCode} - {emp.firstName} {emp.lastName} (
                          {emp.department})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Credentials Section */}
                <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <h3 className="font-semibold">Login Credentials</h3>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Full Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">
                      Password <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required
                      autoComplete="off"
                      placeholder="Minimum 8 characters"
                    />
                    <p className="text-xs text-muted-foreground">
                      User can change this password after first login
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">
                      Role <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) =>
                        setFormData({ ...formData, role: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="hr">HR</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Geofence Assignment Section */}
                <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <h3 className="font-semibold">
                        Assign Geofence Locations
                      </h3>
                    </div>
                    <Badge variant="secondary">
                      {selectedGeofences.length} selected
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Select locations where this user can check in/out
                  </p>

                  {geofences.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No active geofences available</p>
                      <p className="text-xs mt-1">
                        Create geofences first in the Geofencing page
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto border rounded p-3">
                      {geofences.map((geofence) => (
                        <div
                          key={geofence.id}
                          className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => toggleGeofence(geofence.id)}
                        >
                          <Checkbox
                            checked={selectedGeofences.includes(geofence.id)}
                            onCheckedChange={() => toggleGeofence(geofence.id)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">
                                {geofence.name}
                              </p>
                              {selectedGeofences.includes(geofence.id) && (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {geofence.address}
                            </p>
                            {geofence.description && (
                              <p className="text-xs text-muted-foreground italic">
                                {geofence.description}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Radius: {geofence.radius}m
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setSelectedGeofences([]);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading || geofences.length === 0}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Admin Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter((u) => u.role === "admin").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                HR Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter((u) => u.role === "hr").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter((u) => u.emailVerified).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>User Accounts</CardTitle>
            <CardDescription>
              Manage user accounts and their role-based permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground"
                    >
                      No user accounts found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        {user.firstName && user.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : "-"}
                      </TableCell>
                      <TableCell>{user.department || "-"}</TableCell>
                      <TableCell>
                        {user.employmentStatus === "Active" ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeactivateUser(user.id)}
                          disabled={user.email === "admin@staffos.com"}
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

        {/* Admin Credentials Info */}
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Default Admin Credentials
            </CardTitle>
            <CardDescription>
              Use these credentials to log in as admin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Email:</Label>
                <p className="font-mono text-sm">admin@staffos.com</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Password:</Label>
                <p className="font-mono text-sm">Admin@123</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              ⚠️ Please change the default admin password after first login
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
