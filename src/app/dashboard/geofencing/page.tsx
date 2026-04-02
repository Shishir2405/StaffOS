"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Map as MapIcon,
  Navigation,
  CheckCircle2,
  XCircle,
  Loader2,
  Power,
  PowerOff
} from "lucide-react"
import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Geofence {
  id: number
  name: string
  description: string | null
  latitude: number
  longitude: number
  radius: number
  address: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// User's enabled geofences stored in localStorage
const ENABLED_GEOFENCES_KEY = "enabled_geofences"

export default function GeofencingPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [geofences, setGeofences] = useState<Geofence[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingGeofence, setEditingGeofence] = useState<Geofence | null>(null)
  const [saving, setSaving] = useState(false)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [geofenceToDelete, setGeofenceToDelete] = useState<Geofence | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [enabledGeofences, setEnabledGeofences] = useState<Set<number>>(new Set())
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    latitude: "",
    longitude: "",
    radius: "100",
    address: "",
    isActive: true,
  })

  // Redirect if not authenticated
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/sign-in")
    }
  }, [session, isPending, router])

  // Load enabled geofences from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(ENABLED_GEOFENCES_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setEnabledGeofences(new Set(parsed))
      } catch (error) {
        console.error("Error loading enabled geofences:", error)
      }
    }
  }, [])

  useEffect(() => {
    if (session?.user) {
      fetchGeofences()
    }
  }, [session])

  const fetchGeofences = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("bearer_token")
      const response = await fetch("/api/geofences", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        // Handle standardized response format
        if (data.success && Array.isArray(data.data)) {
          setGeofences(data.data)
        } else if (Array.isArray(data)) {
          // Fallback for backwards compatibility
          setGeofences(data)
        }
      }
    } catch (error) {
      console.error("Error fetching geofences:", error)
      toast.error("Failed to fetch geofences")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (geofence?: Geofence) => {
    if (geofence) {
      setEditingGeofence(geofence)
      setFormData({
        name: geofence.name,
        description: geofence.description || "",
        latitude: geofence.latitude.toString(),
        longitude: geofence.longitude.toString(),
        radius: geofence.radius.toString(),
        address: geofence.address,
        isActive: geofence.isActive,
      })
    } else {
      setEditingGeofence(null)
      setFormData({
        name: "",
        description: "",
        latitude: "",
        longitude: "",
        radius: "100",
        address: "",
        isActive: true,
      })
    }
    setDialogOpen(true)
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser")
      return
    }

    setGettingLocation(true)
    toast.loading("Getting your current location...")

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }))
        toast.dismiss()
        toast.success("Location detected successfully!")
        setGettingLocation(false)
      },
      (error) => {
        console.error("Error getting location:", error)
        toast.dismiss()
        
        let errorMessage = "Unable to get your current location"
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please allow location access in your browser settings."
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable. Please try again."
            break
          case error.TIMEOUT:
            errorMessage = "Location request timed out. Please try again."
            break
        }
        
        toast.error(errorMessage, {
          duration: 5000,
          description: "Make sure location services are enabled"
        })
        setGettingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const token = localStorage.getItem("bearer_token")
      const url = editingGeofence 
        ? `/api/geofences?id=${editingGeofence.id}`
        : "/api/geofences"
      
      const response = await fetch(url, {
        method: editingGeofence ? "PUT" : "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setDialogOpen(false)
        toast.success(editingGeofence ? "Geofence updated successfully" : "Geofence created successfully")
        fetchGeofences()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to save geofence")
      }
    } catch (error) {
      console.error("Error saving geofence:", error)
      toast.error("Failed to save geofence")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClick = (geofence: Geofence) => {
    setGeofenceToDelete(geofence)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!geofenceToDelete) return

    setDeleting(true)
    try {
      const token = localStorage.getItem("bearer_token")
      const response = await fetch(`/api/geofences?id=${geofenceToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        toast.success(`Geofence "${geofenceToDelete.name}" deleted successfully`)
        setDeleteDialogOpen(false)
        setGeofenceToDelete(null)
        
        // Remove from enabled geofences if present
        const newEnabled = new Set(enabledGeofences)
        newEnabled.delete(geofenceToDelete.id)
        setEnabledGeofences(newEnabled)
        localStorage.setItem(ENABLED_GEOFENCES_KEY, JSON.stringify(Array.from(newEnabled)))
        
        fetchGeofences()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to delete geofence")
      }
    } catch (error) {
      console.error("Error deleting geofence:", error)
      toast.error("Failed to delete geofence. Please try again.")
    } finally {
      setDeleting(false)
    }
  }

  const toggleGeofenceEnabled = (geofenceId: number, geofenceName: string) => {
    const newEnabled = new Set(enabledGeofences)
    
    if (newEnabled.has(geofenceId)) {
      newEnabled.delete(geofenceId)
      toast.info(`"${geofenceName}" disabled for attendance tracking`)
    } else {
      newEnabled.add(geofenceId)
      toast.success(`"${geofenceName}" enabled for attendance tracking`)
    }
    
    setEnabledGeofences(newEnabled)
    localStorage.setItem(ENABLED_GEOFENCES_KEY, JSON.stringify(Array.from(newEnabled)))
  }

  const openInMaps = (latitude: number, longitude: number) => {
    window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, "_blank")
  }

  if (isPending) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <MapPin className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (!session?.user) {
    return null
  }

  const activeGeofences = geofences.filter((g) => g.isActive)
  const enabledCount = activeGeofences.filter((g) => enabledGeofences.has(g.id)).length

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Geofencing</h1>
            <p className="text-muted-foreground">
              Manage location-based attendance zones and enable them for tracking
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Geofence
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingGeofence ? "Edit Geofence" : "Create New Geofence"}
                </DialogTitle>
                <DialogDescription>
                  Define a geographic boundary for attendance tracking
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="name">
                      Geofence Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder="Head Office"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Main headquarters building"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="latitude">
                      Latitude <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="0.000001"
                      placeholder="37.7749"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="longitude">
                      Longitude <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="0.000001"
                      placeholder="-122.4194"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={getCurrentLocation}
                      disabled={gettingLocation}
                    >
                      {gettingLocation ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Getting Location...
                        </>
                      ) : (
                        <>
                          <Navigation className="h-4 w-4 mr-2" />
                          Use Current Location
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="radius">
                      Radius (meters) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="radius"
                      type="number"
                      step="1"
                      placeholder="100"
                      value={formData.radius}
                      onChange={(e) => setFormData({ ...formData, radius: e.target.value })}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      The radius defines how far employees can be from the center point. Recommended: 50-200 meters for better accuracy.
                    </p>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">
                      Address <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="address"
                      placeholder="350 Market Street, San Francisco, CA 94102"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      required
                      rows={2}
                    />
                  </div>

                  <div className="flex items-center space-x-2 md:col-span-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    />
                    <Label htmlFor="isActive">Active (available for use)</Label>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : editingGeofence ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Geofences</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{geofences.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Zones</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activeGeofences.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Enabled for You</CardTitle>
              <Power className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {enabledCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Tracking attendance
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive Zones</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {geofences.filter((g) => !g.isActive).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Power className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-900">
                  Personal Geofence Control
                </p>
                <p className="text-sm text-blue-800">
                  Enable specific geofences to track your attendance. For example, if you work in Building A, 
                  enable only "Building A" geofence to automatically check in/out when you enter or leave that location.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Geofences List */}
        <Card>
          <CardHeader>
            <CardTitle>Geofence Locations</CardTitle>
            <CardDescription>
              All configured attendance tracking zones • Toggle to enable/disable for your attendance
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : geofences.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No geofences found</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Create your first geofence to start tracking attendance
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Enabled</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Radius</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {geofences.map((geofence) => {
                      const isEnabled = enabledGeofences.has(geofence.id)
                      const canToggle = geofence.isActive
                      
                      return (
                        <TableRow key={geofence.id}>
                          <TableCell>
                            <Button
                              variant={isEnabled ? "default" : "outline"}
                              size="sm"
                              onClick={() => toggleGeofenceEnabled(geofence.id, geofence.name)}
                              disabled={!canToggle}
                              className={isEnabled ? "bg-green-600 hover:bg-green-700" : ""}
                            >
                              {isEnabled ? (
                                <>
                                  <Power className="h-3 w-3 mr-1" />
                                  ON
                                </>
                              ) : (
                                <>
                                  <PowerOff className="h-3 w-3 mr-1" />
                                  OFF
                                </>
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="font-medium">
                            {geofence.name}
                            {isEnabled && (
                              <Badge className="ml-2 bg-green-600" variant="default">
                                Tracking
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3" />
                              {geofence.latitude.toFixed(4)}, {geofence.longitude.toFixed(4)}
                            </div>
                          </TableCell>
                          <TableCell>{geofence.radius}m</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {geofence.address}
                          </TableCell>
                          <TableCell>
                            {geofence.isActive ? (
                              <Badge variant="default">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openInMaps(geofence.latitude, geofence.longitude)}
                                title="Open in Google Maps"
                              >
                                <MapIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenDialog(geofence)}
                                title="Edit geofence"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteClick(geofence)}
                                title="Delete geofence"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Geofence?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>"{geofenceToDelete?.name}"</strong>? 
              This action cannot be undone and will remove the geofence permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}