# StaffOS - AI-Powered HRMS & Payroll System

A comprehensive, production-grade Human Resource Management System built with **Next.js 15**, **React 19**, **Drizzle ORM**, and **Better Auth**. StaffOS handles employee management, geofence-based attendance tracking, leave management, payroll processing, and organization structure -- all in a beautifully designed warm interface.

## Features

### Core Modules

- **Employee Directory** - Full employee lifecycle management with profiles, department assignment, employment types, and status tracking
- **Geofence Attendance** - GPS-based automatic check-in/check-out with configurable geofence zones and real-time location monitoring
- **Leave Management** - Apply, approve, and track leave requests with balance calculations and multi-level approval workflows
- **Payroll Processing** - End-to-end salary computation with statutory deductions (PF, ESI, TDS), payslip generation, and payroll run management
- **Organization Structure** - Department management with hierarchical org chart and subordinate tracking
- **Role-Based Access** - Admin, HR, and Employee roles with granular permission control

### Innovative UI Features

- **Live Clock Widget** - Real-time clock with check-in status indicator and animated pulse ring
- **Global Command Palette** - `Cmd+K` / `Ctrl+K` search overlay with fuzzy matching, keyboard navigation, and quick actions
- **Activity Heatmap** - GitHub-style 12-week attendance density grid with animated cell reveals
- **Team Pulse** - Live indicator showing currently active/checked-in employees with animated avatars
- **Productivity Ring** - Animated circular SVG progress ring showing workforce attendance score
- **Animated Stat Cards** - KPI cards with spring-based number counting animations
- **Skeleton Loading** - Pulsing skeleton placeholders for every data-fetching section
- **Mobile Bottom Nav** - Fixed 5-tab bottom navigation bar on mobile with active dot indicator
- **Responsive Tables** - Tables switch to stacked card layout on mobile viewports

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| UI Components | Radix UI + shadcn/ui |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| Database | LibSQL / Turso (via Drizzle ORM) |
| Authentication | Better Auth |
| Icons | React Icons (Remix), Lucide, Tabler |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| Toast | Sonner |

## Design System

StaffOS uses a warm, amber-accented light-only design system:

- **Typography**: Plus Jakarta Sans (headings), Inter (body), DM Mono (numbers)
- **Colors**: Warm cream backgrounds (#FDFAF5), amber accent (#D97706), semantic status colors
- **Shadows**: Warm-tinted box shadows with subtle depth
- **Animations**: Spring-based Framer Motion animations defined in `src/lib/animations.ts`
- **Borders**: Warm tan borders (#E8D9C4) with focus rings

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- A Turso database (or any LibSQL-compatible database)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/staffos.git
cd staffos

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your database URL and auth secrets

# Run database migrations
bun run db:push

# Seed the database (optional)
bun run db:seed

# Start the development server
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Environment Variables

```env
DATABASE_URL=libsql://your-db.turso.io
DATABASE_AUTH_TOKEN=your-auth-token
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3000
```

## Project Structure

```
src/
  app/
    (auth)/             # Sign-in and sign-up pages
    api/                # API routes (20+ endpoints)
    dashboard/          # Dashboard pages
      admin/users/      # User management (admin)
      attendance/       # Attendance tracking + analytics
      employees/        # Employee CRUD
      geofencing/       # Geofence zone management
      leave/            # Leave request management
      organization/     # Org chart and departments
      payroll/          # Payroll processing
    globals.css         # Design tokens and global styles
    layout.tsx          # Root layout with fonts and providers
    page.tsx            # Landing page
  components/
    app-sidebar.tsx     # Main navigation sidebar
    dashboard-layout.tsx # Layout with command palette + bottom nav
    header.tsx          # Top header with search and user menu
    innovative-widgets.tsx # Activity heatmap, team pulse, score ring
    theme-provider.tsx  # Light-mode-only theme provider
    ui/                 # 57 shadcn/ui components
  db/
    schema.ts           # Drizzle ORM schema (10+ tables)
    seeds/              # Database seed scripts
  hooks/
    use-mobile.ts       # Mobile detection hook
  lib/
    animations.ts       # Framer Motion animation variants
    auth.ts             # Better Auth server config
    auth-client.ts      # Better Auth client wrapper
    utils.ts            # Utility functions
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/employees` | List and create employees |
| GET | `/api/employees/subordinates` | Get subordinate hierarchy |
| GET/POST | `/api/departments` | Department management |
| GET/POST | `/api/attendance` | Attendance records |
| GET | `/api/attendance/calendar` | Calendar view data |
| GET | `/api/attendance/summary` | Attendance statistics |
| GET | `/api/attendance/daily-summary` | Daily breakdown |
| GET/POST | `/api/geofences` | Geofence zone management |
| GET/POST | `/api/user-geofences` | User-geofence assignments |
| GET/POST | `/api/leave-requests` | Leave request management |
| GET/POST | `/api/payroll-runs` | Payroll run management |
| GET/POST | `/api/payslips` | Payslip generation |
| GET/POST | `/api/salary-components` | Salary structure |
| POST | `/api/payroll/compute` | Compute payroll |
| POST | `/api/payroll/process` | Process payroll run |
| GET | `/api/admin/users` | User management (admin) |

## Deployment

The easiest way to deploy StaffOS is on [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Import the project in Vercel
3. Set environment variables in the Vercel dashboard
4. Deploy

For other platforms, see the [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying).

## License

MIT
