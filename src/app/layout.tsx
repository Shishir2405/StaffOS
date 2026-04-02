import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter, DM_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { AutoGeofenceMonitor } from "@/components/auto-geofence-monitor"

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const dmMono = DM_Mono({
  variable: "--font-mono-face",
  subsets: ["latin"],
  weight: ["400", "500"],
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
    <html lang="en" className={`${plusJakarta.variable} ${inter.variable} ${dmMono.variable}`} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#FDFAF5" />
      </head>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
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
