import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { AutoGeofenceMonitor } from "@/components/auto-geofence-monitor"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://staffos.vercel.app'),
  title: {
    default: "StaffOS - AI-Powered HRMS & Payroll System",
    template: "%s | StaffOS"
  },
  description: "Complete HRMS and Payroll solution with AI-driven geofencing attendance, employee management, leave tracking, and comprehensive HR tools. Streamline your workforce management with automated check-in/out.",
  keywords: [
    "HRMS",
    "Payroll System",
    "HR Management",
    "Employee Management",
    "Geofencing Attendance",
    "Leave Management",
    "Payroll Processing",
    "Workforce Management",
    "AI-Powered HR",
    "Attendance Tracking"
  ],
  authors: [{ name: "StaffOS Team" }],
  creator: "StaffOS",
  publisher: "StaffOS",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://staffos.vercel.app",
    title: "StaffOS - AI-Powered HRMS & Payroll System",
    description: "Complete HRMS and Payroll solution with AI-driven geofencing attendance, employee management, and comprehensive HR tools.",
    siteName: "StaffOS",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "StaffOS HRMS Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "StaffOS - AI-Powered HRMS & Payroll System",
    description: "Complete HRMS and Payroll solution with AI-driven geofencing attendance and employee management.",
    images: ["/og-image.png"],
    creator: "@staffos",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AutoGeofenceMonitor />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}