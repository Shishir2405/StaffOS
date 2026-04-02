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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  MapPin,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface CalendarDay {
  date: string;
  status: "present" | "absent";
  totalHours: number;
  checkInCount: number;
  checkOutCount: number;
}

interface CalendarData {
  employeeId: number;
  employeeName: string;
  startDate: string;
  endDate: string;
  calendar: CalendarDay[];
}

export default function AttendanceDashboardPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<"summary" | "calendar">("summary");
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Redirect if not authenticated
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/sign-in");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      if (viewMode === "summary") {
        fetchDashboardData();
      } else {
        fetchCalendarData();
      }
    }
  }, [session, viewMode, selectedMonth]);

  // Calculate stats from calendar data
  const stats = {
    totalDays: calendarData?.calendar.length || 0,
    presentDays:
      calendarData?.calendar.filter((d) => d.status === "present").length || 0,
    absentDays:
      calendarData?.calendar.filter((d) => d.status === "absent").length || 0,
    totalHours:
      calendarData?.calendar.reduce((sum, d) => sum + d.totalHours, 0) || 0,
  };

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("bearer_token");
      const employeeId =
        (session?.user as any)?.employeeId || session?.user?.id;

      // Calculate first and last day of selected month
      const firstDay = new Date(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth(),
        1,
      );
      const lastDay = new Date(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth() + 1,
        0,
      );

      const startDate = firstDay.toISOString().split("T")[0];
      const endDate = lastDay.toISOString().split("T")[0];

      const response = await fetch(
        `/api/attendance/dashboard?employeeId=${employeeId}&startDate=${startDate}&endDate=${endDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setCalendarData(data);
      } else {
        toast.error("Failed to fetch dashboard data");
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to fetch dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCalendarData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("bearer_token");
      const employeeId =
        (session?.user as any)?.employeeId || session?.user?.id;

      // Calculate first and last day of selected month
      const firstDay = new Date(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth(),
        1,
      );
      const lastDay = new Date(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth() + 1,
        0,
      );

      const startDate = firstDay.toISOString().split("T")[0];
      const endDate = lastDay.toISOString().split("T")[0];

      const response = await fetch(
        `/api/attendance/calendar?employeeId=${employeeId}&startDate=${startDate}&endDate=${endDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setCalendarData(data);
      } else {
        toast.error("Failed to fetch calendar data");
      }
    } catch (error) {
      console.error("Error fetching calendar data:", error);
      toast.error("Failed to fetch calendar data");
    } finally {
      setIsLoading(false);
    }
  };

  const goToPreviousMonth = () => {
    setSelectedMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
    );
  };

  const goToNextMonth = () => {
    setSelectedMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
    );
  };

  const goToCurrentMonth = () => {
    setSelectedMonth(new Date());
  };

  const renderCalendar = () => {
    if (!calendarData) return null;

    const firstDay = new Date(
      selectedMonth.getFullYear(),
      selectedMonth.getMonth(),
      1,
    );
    const lastDay = new Date(
      selectedMonth.getFullYear(),
      selectedMonth.getMonth() + 1,
      0,
    );
    const startDayOfWeek = firstDay.getDay();

    // Create calendar grid
    const calendarDays = [];
    const daysInMonth = lastDay.getDate();

    // Add empty cells for days before month starts
    for (let i = 0; i < startDayOfWeek; i++) {
      calendarDays.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dayData = calendarData.calendar.find((d) => d.date === dateStr);
      calendarDays.push({ day, data: dayData });
    }

    return (
      <div className="grid grid-cols-7 gap-2">
        {/* Day headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="text-center font-semibold text-sm text-muted-foreground p-2"
          >
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((item, index) => {
          if (!item) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const { day, data } = item;
          const isToday =
            new Date().toDateString() ===
            new Date(
              selectedMonth.getFullYear(),
              selectedMonth.getMonth(),
              day,
            ).toDateString();

          return (
            <div
              key={day}
              className={`
                aspect-square border rounded-lg p-2 flex flex-col items-center justify-center
                ${isToday ? "border-primary border-2" : ""}
                ${data?.status === "present" ? "bg-green-50" : "bg-red-50"}
              `}
            >
              <div className="text-sm font-semibold mb-1">{day}</div>
              {data ? (
                <>
                  <Badge
                    variant={
                      data.status === "present" ? "default" : "destructive"
                    }
                    className="text-xs mb-1"
                  >
                    {data.status === "present" ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <XCircle className="h-3 w-3 mr-1" />
                    )}
                    {data.status === "present" ? "P" : "A"}
                  </Badge>
                  {data.totalHours > 0 && (
                    <div className="text-xs font-medium">
                      {data.totalHours.toFixed(1)}h
                    </div>
                  )}
                  {data.checkInCount > 1 && (
                    <div className="text-xs text-muted-foreground">
                      {data.checkInCount} check-ins
                    </div>
                  )}
                </>
              ) : (
                <Badge variant="outline" className="text-xs">
                  <XCircle className="h-3 w-3 mr-1" />A
                </Badge>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (isPending) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <Clock className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {viewMode === "summary"
                ? "Live Attendance Dashboard"
                : "Attendance Calendar"}
            </h1>
            <p className="text-muted-foreground">
              {viewMode === "summary"
                ? "Real-time attendance monitoring and analytics"
                : "Monthly calendar view with present/absent status and working hours"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "summary" ? "default" : "outline"}
              onClick={() => setViewMode("summary")}
            >
              <Users className="h-4 w-4 mr-2" />
              Summary
            </Button>
            <Button
              variant={viewMode === "calendar" ? "default" : "outline"}
              onClick={() => setViewMode("calendar")}
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              Calendar
            </Button>
            {viewMode === "summary" && (
              <>
                <span className="text-sm text-muted-foreground">
                  Last updated: {lastUpdate.toLocaleTimeString()}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={fetchDashboardData}
                  disabled={isLoading}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                  />
                </Button>
              </>
            )}
          </div>
        </div>

        {viewMode === "summary" ? (
          <>
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    Total Days
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalDays}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    in selected month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Present Days
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {stats.presentDays}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.totalDays > 0
                      ? Math.round((stats.presentDays / stats.totalDays) * 100)
                      : 0}
                    % attendance rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    Absent Days
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">
                    {stats.absentDays}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.totalDays > 0
                      ? Math.round((stats.absentDays / stats.totalDays) * 100)
                      : 0}
                    % absence rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    Total Hours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {stats.totalHours.toFixed(1)}h
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.presentDays > 0
                      ? (stats.totalHours / stats.presentDays).toFixed(1)
                      : 0}
                    h avg/day
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Filters and Live Data */}
            <Card>
              <CardHeader>
                <CardTitle>Live Attendance Data</CardTitle>
                <CardDescription>
                  Real-time monitoring of employee check-ins and check-outs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead>Check-out</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calendarData && calendarData.calendar.length > 0 ? (
                      calendarData.calendar.map((day) => (
                        <TableRow key={day.date}>
                          <TableCell className="font-medium">
                            {day.status === "present" ? (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-3 w-3 text-green-600" />
                                <span>Present</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <XCircle className="h-3 w-3 text-red-600" />
                                <span>Absent</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {day.status === "present" ? (
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3 text-green-600" />
                                <span>{day.totalHours.toFixed(1)}h</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3 text-red-600" />
                                <span>0h</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {day.status === "present" ? (
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3 text-green-600" />
                                <span>{day.totalHours.toFixed(1)}h</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3 text-red-600" />
                                <span>0h</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                day.status === "present"
                                  ? "default"
                                  : "secondary"
                              }
                              className={
                                day.status === "present"
                                  ? "bg-green-100 text-green-900"
                                  : "bg-red-100 text-red-900"
                              }
                            >
                              {day.status === "present" ? (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />{" "}
                                  Present
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-3 w-3 mr-1" /> Absent
                                </>
                              )}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center text-muted-foreground"
                        >
                          No live data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Monthly Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Summary</CardTitle>
                <CardDescription>
                  Attendance statistics for the selected month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Count</TableHead>
                      <TableHead>Percentage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calendarData && (
                      <>
                        <TableRow>
                          <TableCell>Total Days</TableCell>
                          <TableCell>{stats.totalDays}</TableCell>
                          <TableCell>100%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Present Days</TableCell>
                          <TableCell>{stats.presentDays}</TableCell>
                          <TableCell>
                            {stats.totalDays > 0
                              ? Math.round(
                                  (stats.presentDays / stats.totalDays) * 100,
                                )
                              : 0}
                            %
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Absent Days</TableCell>
                          <TableCell>{stats.absentDays}</TableCell>
                          <TableCell>
                            {stats.totalDays > 0
                              ? Math.round(
                                  (stats.absentDays / stats.totalDays) * 100,
                                )
                              : 0}
                            %
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Total Hours</TableCell>
                          <TableCell>{stats.totalHours.toFixed(1)}h</TableCell>
                          <TableCell>
                            {stats.presentDays > 0
                              ? (stats.totalHours / stats.presentDays).toFixed(
                                  1,
                                )
                              : 0}
                            h/day
                          </TableCell>
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {/* Calendar View */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      Attendance Calendar - {session?.user?.name}
                    </CardTitle>
                    <CardDescription>
                      {selectedMonth.toLocaleDateString("en-IN", {
                        month: "long",
                        year: "numeric",
                        timeZone: "Asia/Kolkata",
                      })}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPreviousMonth}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToCurrentMonth}
                    >
                      Today
                    </Button>
                    <Button variant="outline" size="sm" onClick={goToNextMonth}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  renderCalendar()
                )}
              </CardContent>
            </Card>

            {/* Monthly Statistics */}
            {calendarData && (
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Present Days
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      {
                        calendarData.calendar.filter(
                          (d) => d.status === "present",
                        ).length
                      }
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">days</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Absent Days
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600">
                      {
                        calendarData.calendar.filter(
                          (d) => d.status === "absent",
                        ).length
                      }
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">days</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Working Hours
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {calendarData.calendar
                        .reduce((sum, d) => sum + d.totalHours, 0)
                        .toFixed(1)}
                      h
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      this month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Check-ins
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {calendarData.calendar.reduce(
                        (sum, d) => sum + d.checkInCount,
                        0,
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      check-ins
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Legend */}
            <Card>
              <CardHeader>
                <CardTitle>Legend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded border-2 border-primary" />
                    <span className="text-sm">Today</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-green-50 border" />
                    <span className="text-sm">Present</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-red-50 border" />
                    <span className="text-sm">Absent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />P
                    </Badge>
                    <span className="text-sm">Present Badge</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="text-xs">
                      <XCircle className="h-3 w-3 mr-1" />A
                    </Badge>
                    <span className="text-sm">Absent Badge</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
