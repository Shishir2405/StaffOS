"use client"

import * as React from "react"
import Link from "next/link"
import {
  Building2,
  Users,
  MapPin,
  DollarSign,
  Calendar,
  FileText,
  Settings,
  BarChart3,
  Clock,
  UserCheck,
  Briefcase,
  Shield,
  Home,
  LayoutDashboard,
} from "lucide-react"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useSession } from "@/lib/auth-client"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session, isPending } = useSession()
  const pathname = usePathname()

  const navMain = [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboard,
      isActive: pathname === "/",
    },
    {
      title: "Employees",
      url: "/employees",
      icon: Users,
      isActive: pathname.startsWith("/employees"),
    },
    {
      title: "Attendance",
      url: "/attendance",
      icon: Clock,
      isActive: pathname.startsWith("/attendance"),
    },
    {
      title: "Geofencing",
      url: "/geofencing",
      icon: MapPin,
      isActive: pathname.startsWith("/geofencing"),
    },
    {
      title: "Leave",
      url: "/leave",
      icon: Calendar,
      isActive: pathname.startsWith("/leave"),
    },
    {
      title: "Payroll",
      url: "/payroll",
      icon: DollarSign,
      isActive: pathname.startsWith("/payroll"),
    },
    {
      title: "Organization",
      url: "/organization",
      icon: Building2,
      isActive: pathname.startsWith("/organization"),
    },
  ]

  // Admin-only menu items
  const adminNavItems = [
    {
      title: "User Management",
      url: "/admin/users",
      icon: Shield,
      isActive: pathname.startsWith("/admin"),
    },
  ]

  // Filter nav items based on user role
  const filteredNavMain = session?.user?.role === 'admin' || session?.user?.role === 'hr'
    ? [...navMain, ...adminNavItems]
    : navMain

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <MapPin className="h-5 w-5" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-lg font-bold">StaffOS</span>
            <span className="text-xs text-muted-foreground">HRMS & Payroll</span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarMenu>
            {filteredNavMain.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={item.isActive}>
                  <Link href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="/profile" className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session?.user?.image || undefined} />
                  <AvatarFallback>
                    {session?.user?.name ? getInitials(session.user.name) : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                  <span className="text-sm font-medium">
                    {session?.user?.name || "Guest User"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {session?.user?.email || "Not signed in"}
                  </span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      
      <SidebarRail />
    </Sidebar>
  )
}