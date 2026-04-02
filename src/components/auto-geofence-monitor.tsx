"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { toast } from "@/components/ui/custom-toast";

interface Geofence {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  is_active: boolean;
}

export function AutoGeofenceMonitor() {
  const { data: session } = useSession();
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [isInsideZone, setIsInsideZone] = useState(false);
  const [currentZone, setCurrentZone] = useState<Geofence | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastCheckInRef = useRef<number | null>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!session?.user?.id || hasInitialized.current) return;

    hasInitialized.current = true;
    fetchGeofences();
    startLocationMonitoring();

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [session?.user?.id]);

  const fetchGeofences = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/geofences", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error("Failed to fetch geofences:", response.statusText);
        return;
      }

      const data = await response.json();

      // Handle both response formats: direct array or wrapped in data object
      const geofenceList = Array.isArray(data)
        ? data
        : data.data || data.geofences || [];

      // Filter only active geofences
      const activeGeofences = geofenceList.filter((g: Geofence) => g.is_active);
      setGeofences(activeGeofences);

      console.log("Loaded active geofences:", activeGeofences.length);
    } catch (error) {
      console.error("Error fetching geofences:", error);
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

  const findNearestZone = (
    latitude: number,
    longitude: number,
  ): Geofence | null => {
    for (const zone of geofences) {
      const distance = calculateDistance(
        latitude,
        longitude,
        zone.latitude,
        zone.longitude,
      );
      console.log(
        `Distance to ${zone.name}: ${distance.toFixed(0)}m (radius: ${zone.radius}m)`,
      );
      if (distance <= zone.radius) {
        return zone;
      }
    }
    return null;
  };

  const autoCheckIn = async (
    zone: Geofence,
    latitude: number,
    longitude: number,
  ) => {
    if (!session?.user?.id) {
      console.log("No user session, cannot auto check-in");
      return;
    }

    try {
      const token = localStorage.getItem("bearer_token");
      const today = new Date().toISOString().split("T")[0];

      // Check if already checked in today
      const existingResponse = await fetch(`/api/attendance?date=${today}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!existingResponse.ok) {
        console.error("Failed to check existing attendance");
        return;
      }

      const existingData = await existingResponse.json();
      const existingRecords = Array.isArray(existingData)
        ? existingData
        : existingData.data || [];

      if (existingRecords.length > 0 && !existingRecords[0].checkOutTime) {
        console.log("Already checked in today");
        return;
      }

      // Get employeeId from session
      const employeeId = (session.user as any).employeeId || session.user.id;

      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          employeeId: employeeId,
          date: today,
          checkInTime: new Date().toISOString(),
          checkInGeofenceId: zone.id,
          checkInLatitude: latitude,
          checkInLongitude: longitude,
          status: "Present",
          isAutoCheckIn: true,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        lastCheckInRef.current = Date.now();
        toast.success(`Auto check-in successful!`, {
          description: `Checked in at ${zone.name}`,
        });
      } else {
        console.error("Auto check-in failed:", result);
        // Don't show error toast for duplicate attendance
        if (result.code !== "DUPLICATE_ATTENDANCE") {
          toast.error("Auto check-in failed", {
            description: result.error || "Please try manual check-in",
          });
        }
      }
    } catch (error) {
      console.error("Auto check-in error:", error);
    }
  };

  const autoCheckOut = async (latitude: number, longitude: number) => {
    if (!session?.user?.id || !lastCheckInRef.current) {
      console.log("No active check-in session");
      return;
    }

    try {
      const token = localStorage.getItem("bearer_token");
      const today = new Date().toISOString().split("T")[0];

      // Find today's attendance record
      const response = await fetch(`/api/attendance?date=${today}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error("Failed to fetch attendance for checkout");
        return;
      }

      const data = await response.json();
      const records = Array.isArray(data) ? data : data.data || [];

      if (records.length > 0 && !records[0].checkOutTime) {
        const attendanceId = records[0].id;

        const updateResponse = await fetch(
          `/api/attendance?id=${attendanceId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              checkOutTime: new Date().toISOString(),
              checkOutLatitude: latitude,
              checkOutLongitude: longitude,
              isAutoCheckOut: true,
            }),
          },
        );

        if (updateResponse.ok) {
          lastCheckInRef.current = null;
          toast.success("Auto check-out successful!", {
            description: "You've been checked out automatically",
          });
        } else {
          const errorData = await updateResponse.json();
          console.error("Auto check-out failed:", errorData);
        }
      }
    } catch (error) {
      console.error("Auto check-out error:", error);
    }
  };

  const handleLocationUpdate = (position: GeolocationPosition) => {
    const { latitude, longitude } = position.coords;

    if (geofences.length === 0) {
      console.log("No geofences configured");
      return;
    }

    const nearestZone = findNearestZone(latitude, longitude);

    if (nearestZone) {
      if (!isInsideZone) {
        // Entered a geofence zone
        console.log(`Entered zone: ${nearestZone.name}`);
        setIsInsideZone(true);
        setCurrentZone(nearestZone);
        autoCheckIn(nearestZone, latitude, longitude);
      }
    } else {
      if (isInsideZone && currentZone) {
        // Exited the geofence zone
        console.log(`Exited zone: ${currentZone.name}`);
        setIsInsideZone(false);
        autoCheckOut(latitude, longitude);
        setCurrentZone(null);
      }
    }
  };

  const startLocationMonitoring = () => {
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported");
      toast.error("Geolocation not supported", {
        description: "Your browser doesn't support location tracking",
      });
      return;
    }

    console.log("Starting location monitoring for auto-geofencing...");

    watchIdRef.current = navigator.geolocation.watchPosition(
      handleLocationUpdate,
      (error) => {
        console.error("Location error:", error.message);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error("Location permission denied", {
            description:
              "Please enable location access for auto check-in to work",
          });
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000, // Cache position for 30 seconds
      },
    );
  };

  return null;
}
