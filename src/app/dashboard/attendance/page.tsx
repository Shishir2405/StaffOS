"use client";

import { useState, useEffect, useRef } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  Navigation,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface GeofenceZone {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  isActive: boolean;
  description?: string;
  address?: string;
}

interface AttendanceRecord {
  id: number;
  employeeId: number;
  date: string;
  checkInTime: string;
  checkOutTime: string | null;
  checkInGeofenceId?: number;
  zoneName?: string;
  status: string;
  workingHours: number | null;
  checkInLatitude: number;
  checkInLongitude: number;
}

interface DailySummary {
  employeeId: number;
  employeeName: string;
  date: string;
  checkInOut: Array<{
    checkInTime: string | null;
    checkOutTime: string | null;
    duration: number;
  }>;
  totalWorkingHours: number;
  status: string;
}

export default function AttendancePage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [nearbyZones, setNearbyZones] = useState<GeofenceZone[]>([]);
  const [assignedGeofences, setAssignedGeofences] = useState<GeofenceZone[]>(
    [],
  );
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGeofences, setIsLoadingGeofences] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [activeCheckInId, setActiveCheckInId] = useState<number | null>(null);
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const wasInGeofence = useRef<boolean>(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/sign-in");
    }
  }, [session, isPending, router]);

  // Initial location fetch with high accuracy
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationError(null);
        },
        (error) => {
          setLocationError(
            "Location access denied. Please enable location services.",
          );
          console.error("Location error:", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
      );
    } else {
      setLocationError("Geolocation is not supported by this browser.");
    }
  }, []);

  // Fetch user's assigned geofences
  useEffect(() => {
    if (session?.user?.id) {
      fetchAssignedGeofences();
    }
  }, [session]);

  // Background location checking every 3 seconds
  useEffect(() => {
    if (!session?.user || assignedGeofences.length === 0) return;

    // Clear any existing interval
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
    }

    // Set up new interval
    locationIntervalRef.current = setInterval(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const newLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setCurrentLocation(newLocation);
            setLocationError(null);

            // Check geofence status and handle auto check-in/out
            checkGeofenceAndAutoAttendance(newLocation);
          },
          (error) => {
            console.error("Background location error:", error);
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
          },
        );
      }
    }, 3000); // Check every 3 seconds

    // Cleanup on unmount
    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
    };
  }, [session, assignedGeofences, isCheckedIn]);

  // Fetch attendance data and update check-in status
  useEffect(() => {
    if (session?.user) {
      fetchAttendanceData();
    }
  }, [session]);

  const fetchAssignedGeofences = async () => {
    setIsLoadingGeofences(true);
    try {
      const token = localStorage.getItem("bearer_token");
      const userId = session?.user?.id;

      if (!userId) {
        setIsLoadingGeofences(false);
        return;
      }

      const response = await fetch(`/api/user-geofences?userId=${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error("Failed to fetch assigned geofences");
        setIsLoadingGeofences(false);
        return;
      }

      const data = await response.json();

      // Extract geofence objects from assignments
      const geofences = Array.isArray(data)
        ? data.map((assignment: any) => assignment.geofence).filter(Boolean)
        : [];

      setAssignedGeofences(geofences);
    } catch (error) {
      console.error("Error fetching assigned geofences:", error);
    } finally {
      setIsLoadingGeofences(false);
    }
  };

  const checkGeofenceAndAutoAttendance = async (location: {
    lat: number;
    lng: number;
  }) => {
    if (!location || assignedGeofences.length === 0) return;

    // Calculate nearby assigned zones with improved accuracy
    const nearby = assignedGeofences.filter((zone: GeofenceZone) => {
      const distance = calculateDistance(
        location.lat,
        location.lng,
        zone.latitude,
        zone.longitude,
      );
      // Add 10% buffer to radius for better accuracy
      const effectiveRadius = zone.radius * 1.1;
      return distance <= effectiveRadius;
    });

    setNearbyZones(nearby);

    const isCurrentlyInGeofence = nearby.length > 0;

    // Auto check-in: User entered a geofence and is not checked in
    if (isCurrentlyInGeofence && !isCheckedIn && !wasInGeofence.current) {
      await performAutoCheckIn(location, nearby[0]);
    }

    // Auto check-out: User left all geofences and is checked in
    if (!isCurrentlyInGeofence && isCheckedIn && wasInGeofence.current) {
      await performAutoCheckOut();
    }

    // Update the previous state
    wasInGeofence.current = isCurrentlyInGeofence;
  };

  const performAutoCheckIn = async (
    location: { lat: number; lng: number },
    zone: GeofenceZone,
  ) => {
    if (!session?.user?.id) return;

    try {
      const token = localStorage.getItem("bearer_token");
      const employeeId = (session.user as any).employeeId || session.user.id;

      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          employeeId: employeeId,
          checkInGeofenceId: zone.id,
          checkInLatitude: location.lat,
          checkInLongitude: location.lng,
          status: "Present",
          isAutoCheckIn: true,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Auto checked in at ${zone.name}`, {
          description: `Location accuracy: High`,
        });
        setIsCheckedIn(true);
        setActiveCheckInId(data.id);
        fetchAttendanceData();
      }
    } catch (error) {
      console.error("Auto check-in error:", error);
    }
  };

  const performAutoCheckOut = async () => {
    if (!activeCheckInId) return;

    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/attendance?id=${activeCheckInId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          checkOutTime: new Date().toISOString(),
          isAutoCheckOut: true,
        }),
      });

      if (response.ok) {
        toast.info("Auto checked out (left geofence zone)");
        setIsCheckedIn(false);
        setActiveCheckInId(null);
        fetchAttendanceData();
      }
    } catch (error) {
      console.error("Auto check-out error:", error);
    }
  };

  const fetchAttendanceData = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      const employeeId =
        (session?.user as any)?.employeeId || session?.user?.id;

      // Fetch all attendance records
      const response = await fetch("/api/attendance", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Handle standardized response format
        const records =
          data.success && Array.isArray(data.data)
            ? data.data
            : Array.isArray(data)
              ? data
              : [];
        setAttendanceRecords(records);

        // Check if there's an active check-in today
        const today = new Date().toDateString();
        const todayActiveCheckIn = records.find(
          (record: AttendanceRecord) =>
            new Date(record.checkInTime).toDateString() === today &&
            !record.checkOutTime &&
            record.employeeId === employeeId,
        );

        if (todayActiveCheckIn) {
          setIsCheckedIn(true);
          setActiveCheckInId(todayActiveCheckIn.id);
        } else {
          setIsCheckedIn(false);
          setActiveCheckInId(null);
          wasInGeofence.current = false;
        }
      }

      // Fetch today's daily summary
      const today = new Date().toISOString().split("T")[0];
      const summaryResponse = await fetch(
        `/api/attendance/daily-summary?employeeId=${employeeId}&date=${today}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        setDailySummary(summaryData);
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
    }
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const handleManualCheckIn = async () => {
    if (!currentLocation) {
      toast.error("Location not available. Please enable location services.");
      return;
    }

    if (nearbyZones.length === 0) {
      toast.error("You are not within any assigned geofence zone.", {
        description:
          assignedGeofences.length === 0
            ? "No geofences assigned. Contact your admin."
            : "Move closer to an assigned geofence location",
      });
      return;
    }

    if (!session?.user?.id) {
      toast.error("User session not found. Please log in again.");
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("bearer_token");
      const employeeId = (session.user as any).employeeId || session.user.id;

      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          employeeId: employeeId,
          checkInGeofenceId: nearbyZones[0].id,
          checkInLatitude: currentLocation.lat,
          checkInLongitude: currentLocation.lng,
          status: "Present",
          isAutoCheckIn: false,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Checked in at ${nearbyZones[0].name}`);
        setIsCheckedIn(true);
        setActiveCheckInId(data.id);
        wasInGeofence.current = true;
        fetchAttendanceData();
      } else {
        toast.error(data.error || "Failed to check in");
      }
    } catch (error) {
      console.error("Check-in error:", error);
      toast.error("Failed to check in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualCheckOut = async () => {
    if (!activeCheckInId) {
      toast.error("No active check-in found.");
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/attendance?id=${activeCheckInId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          checkOutTime: new Date().toISOString(),
          isAutoCheckOut: false,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Checked out successfully");
        setIsCheckedIn(false);
        setActiveCheckInId(null);
        wasInGeofence.current = false;
        fetchAttendanceData();
      } else {
        toast.error(data.error || "Failed to check out");
      }
    } catch (error) {
      console.error("Check-out error:", error);
      toast.error("Failed to check out. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kolkata",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    });
  };

  if (isPending || isLoadingGeofences) {
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Attendance Tracking
          </h1>
          <p className="text-muted-foreground">
            GPS-based attendance with automatic check-in/out •{" "}
            {assignedGeofences.length} assigned location
            {assignedGeofences.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* No Geofences Alert */}
        {!isLoadingGeofences && assignedGeofences.length === 0 && (
          <Card className="border-amber-500 bg-amber-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-900">
                <AlertCircle className="h-5 w-5" />
                No Geofences Assigned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-amber-800">
                You don't have any geofence locations assigned yet. Please
                contact your administrator to assign geofence locations for
                automatic attendance tracking.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Assigned Locations Card */}
        {assignedGeofences.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Your Assigned Geofence Locations
              </CardTitle>
              <CardDescription>
                Locations where you can check in/out for attendance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {assignedGeofences.map((geofence) => (
                  <div
                    key={geofence.id}
                    className="flex items-start gap-3 p-3 border rounded-lg"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <p className="font-medium text-sm">{geofence.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {geofence.address}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Radius: {geofence.radius}m
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="tracking" className="w-full">
          <TabsList>
            <TabsTrigger value="tracking">Live Tracking</TabsTrigger>
            <TabsTrigger value="today">Today's Summary</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="tracking" className="space-y-4">
            {/* Location Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="h-5 w-5" />
                  Current Location Status
                </CardTitle>
                <CardDescription>
                  Auto-checking location every 3 seconds. Auto attendance
                  enabled
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {locationError ? (
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-5 w-5" />
                    <span>{locationError}</span>
                  </div>
                ) : currentLocation ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-5 w-5" />
                      <span>Location detected</span>
                    </div>
                    <div className="grid gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Coordinates:
                        </span>
                        <span className="font-mono">
                          {currentLocation.lat.toFixed(6)},{" "}
                          {currentLocation.lng.toFixed(6)}
                        </span>
                      </div>
                    </div>

                    {/* Improved geofence status messaging */}
                    {isCheckedIn ? (
                      nearbyZones.length > 0 ? (
                        <div className="rounded-lg border bg-green-50 p-4">
                          <p className="font-medium text-green-900 mb-2">
                            Checked in. Currently within{" "}
                            {nearbyZones.length} zone(s):
                          </p>
                          <ul className="space-y-1">
                            {nearbyZones.map((zone) => (
                              <li
                                key={zone.id}
                                className="text-sm text-green-800"
                              >
                                • {zone.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div className="rounded-lg border bg-blue-50 p-4">
                          <p className="font-medium text-blue-900 mb-1">
                            You're checked in but outside assigned zones
                          </p>
                          <p className="text-sm text-blue-800">
                            You'll be automatically checked out when system
                            confirms you've left the area
                          </p>
                        </div>
                      )
                    ) : nearbyZones.length > 0 ? (
                      <div className="rounded-lg border bg-green-50 p-4">
                        <p className="font-medium text-green-900 mb-2">
                          You are within {nearbyZones.length} assigned
                          zone(s):
                        </p>
                        <ul className="space-y-1">
                          {nearbyZones.map((zone) => (
                            <li
                              key={zone.id}
                              className="text-sm text-green-800"
                            >
                              • {zone.name}
                            </li>
                          ))}
                        </ul>
                        <p className="text-sm text-green-800 mt-2">
                          Ready for check-in or waiting for auto check-in
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-lg border bg-muted p-4">
                        <p className="text-sm text-muted-foreground">
                          Not within any assigned geofence zone
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {assignedGeofences.length > 0
                            ? "Enter one of your assigned zones to enable check-in"
                            : "Contact your administrator to assign geofence locations"}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-5 w-5 animate-spin" />
                    <span>Detecting location...</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Single Check-in/Out Button Card */}
            <Card>
              <CardHeader>
                <CardTitle>Attendance Control</CardTitle>
                <CardDescription>
                  {isCheckedIn
                    ? "You are currently checked in • Click to check out manually"
                    : "You are not checked in • Click to check in manually or wait for auto check-in"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isCheckedIn ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg border bg-green-50">
                      <div className="space-y-1">
                        <p className="text-lg font-semibold text-green-900">
                          Currently Checked In
                        </p>
                        <p className="text-sm text-green-700">
                          You will be automatically checked out when you leave
                          the geofence zone
                        </p>
                      </div>
                      <Badge className="bg-green-600 hover:bg-green-700 text-white">
                        Active
                      </Badge>
                    </div>
                    <Button
                      onClick={handleManualCheckOut}
                      disabled={isLoading}
                      variant="destructive"
                      className="w-full"
                      size="lg"
                    >
                      <XCircle className="mr-2 h-5 w-5" />
                      {isLoading ? "Checking out..." : "Check Out Now"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                      <div className="space-y-1">
                        <p className="text-lg font-semibold">
                          Not Checked In
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {nearbyZones.length > 0
                            ? "You are in an assigned zone. Click to check in or wait for auto check-in."
                            : assignedGeofences.length > 0
                              ? "Enter an assigned geofence zone to check in"
                              : "Contact your administrator to assign geofence locations"}
                        </p>
                      </div>
                      <Badge variant="secondary">Inactive</Badge>
                    </div>
                    <Button
                      onClick={handleManualCheckIn}
                      disabled={
                        isLoading ||
                        nearbyZones.length === 0 ||
                        !currentLocation
                      }
                      className="w-full"
                      size="lg"
                    >
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      {isLoading ? "Checking in..." : "Check In Now"}
                    </Button>
                    {nearbyZones.length === 0 &&
                      assignedGeofences.length > 0 && (
                        <p className="text-sm text-center text-muted-foreground">
                          You must be within an assigned geofence zone to check
                          in
                        </p>
                      )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="today" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Today's Work Summary</CardTitle>
                <CardDescription>
                  All check-ins and check-outs for today
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dailySummary ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Total Working Hours
                        </p>
                        <p className="text-3xl font-bold">
                          {dailySummary.totalWorkingHours.toFixed(2)}h
                        </p>
                      </div>
                      <Badge
                        variant={
                          dailySummary.status === "Present"
                            ? "default"
                            : "destructive"
                        }
                      >
                        {dailySummary.status}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <p className="font-medium">Check-in/Check-out Pairs:</p>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Check In</TableHead>
                            <TableHead>Check Out</TableHead>
                            <TableHead>Duration</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dailySummary.checkInOut.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={3}
                                className="text-center text-muted-foreground"
                              >
                                No completed check-in/out pairs today
                              </TableCell>
                            </TableRow>
                          ) : (
                            dailySummary.checkInOut.map((pair, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  {pair.checkInTime
                                    ? formatTime(pair.checkInTime)
                                    : "-"}
                                </TableCell>
                                <TableCell>
                                  {pair.checkOutTime
                                    ? formatTime(pair.checkOutTime)
                                    : "Active"}
                                </TableCell>
                                <TableCell>
                                  {pair.duration > 0
                                    ? `${pair.duration.toFixed(2)}h`
                                    : "-"}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No attendance data for today
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Attendance History</CardTitle>
                    <CardDescription>
                      Your recent attendance records
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/attendance/dashboard")}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    View Calendar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceRecords.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center text-muted-foreground"
                        >
                          No attendance records found
                        </TableCell>
                      </TableRow>
                    ) : (
                      attendanceRecords.slice(0, 10).map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            {formatDate(record.checkInTime)}
                          </TableCell>
                          <TableCell>
                            {formatTime(record.checkInTime)}
                          </TableCell>
                          <TableCell>
                            {record.checkOutTime
                              ? formatTime(record.checkOutTime)
                              : "Active"}
                          </TableCell>
                          <TableCell>
                            {record.workingHours
                              ? `${record.workingHours.toFixed(1)}h`
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                record.status === "Present"
                                  ? "default"
                                  : "destructive"
                              }
                            >
                              {record.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
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
