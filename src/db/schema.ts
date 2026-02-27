import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

export const departments = sqliteTable('departments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  code: text('code').notNull().unique(),
  headId: integer('head_id').references((): any => employees.id),
  description: text('description'),
  createdAt: text('created_at').notNull(),
});

export const employees = sqliteTable('employees', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  employeeCode: text('employee_code').notNull().unique(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone').notNull(),
  dateOfBirth: text('date_of_birth').notNull(),
  gender: text('gender').notNull(),
  maritalStatus: text('marital_status').notNull(),
  address: text('address').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  postalCode: text('postal_code').notNull(),
  country: text('country').notNull(),
  department: text('department').notNull(),
  designation: text('designation').notNull(),
  role: text('role').notNull(),
  managerId: integer('manager_id').references((): any => employees.id),
  employmentType: text('employment_type').notNull(),
  employmentStatus: text('employment_status').notNull(),
  dateOfJoining: text('date_of_joining').notNull(),
  dateOfLeaving: text('date_of_leaving'),
  salary: real('salary').notNull(),
  bankAccountNumber: text('bank_account_number'),
  bankName: text('bank_name'),
  emergencyContactName: text('emergency_contact_name').notNull(),
  emergencyContactPhone: text('emergency_contact_phone').notNull(),
  avatarUrl: text('avatar_url'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const geofences = sqliteTable('geofences', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  radius: real('radius').notNull(),
  address: text('address').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const attendance = sqliteTable('attendance', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  employeeId: integer('employee_id').notNull().references(() => employees.id),
  date: text('date').notNull(),
  checkInTime: text('check_in_time'),
  checkOutTime: text('check_out_time'),
  checkInGeofenceId: integer('check_in_geofence_id').references(() => geofences.id),
  checkOutGeofenceId: integer('check_out_geofence_id').references(() => geofences.id),
  checkInLatitude: real('check_in_latitude'),
  checkInLongitude: real('check_in_longitude'),
  checkOutLatitude: real('check_out_latitude'),
  checkOutLongitude: real('check_out_longitude'),
  status: text('status').notNull(),
  workingHours: real('working_hours'),
  isAutoCheckIn: integer('is_auto_check_in', { mode: 'boolean' }).default(false),
  isAutoCheckOut: integer('is_auto_check_out', { mode: 'boolean' }).default(false),
  checkType: text('check_type').notNull().default('check_in'),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const leaveRequests = sqliteTable('leave_requests', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  employeeId: integer('employee_id').notNull().references(() => employees.id),
  leaveType: text('leave_type').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  totalDays: real('total_days').notNull(),
  reason: text('reason').notNull(),
  status: text('status').notNull(),
  approvedBy: integer('approved_by').references(() => employees.id),
  approvedAt: text('approved_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const salaryComponents = sqliteTable('salary_components', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  employeeId: integer('employee_id').notNull().references(() => employees.id),
  componentType: text('component_type').notNull(),
  componentName: text('component_name').notNull(),
  amount: real('amount').notNull(),
  isPercentage: integer('is_percentage', { mode: 'boolean' }).notNull().default(false),
  isStatutory: integer('is_statutory', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
});

export const payrollRuns = sqliteTable('payroll_runs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  runDate: text('run_date').notNull(),
  periodStart: text('period_start').notNull(),
  periodEnd: text('period_end').notNull(),
  status: text('status').notNull().default('draft'),
  totalEmployees: integer('total_employees').default(0),
  totalAmount: real('total_amount').default(0),
  createdBy: integer('created_by').references(() => employees.id),
  createdAt: text('created_at').notNull(),
  processedAt: text('processed_at'),
});

export const payslips = sqliteTable('payslips', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  payrollRunId: integer('payroll_run_id').notNull().references(() => payrollRuns.id),
  employeeId: integer('employee_id').notNull().references(() => employees.id),
  employeeName: text('employee_name').notNull(),
  department: text('department').notNull(),
  designation: text('designation').notNull(),
  periodStart: text('period_start').notNull(),
  periodEnd: text('period_end').notNull(),
  basicSalary: real('basic_salary').notNull(),
  totalAllowances: real('total_allowances').notNull().default(0),
  totalDeductions: real('total_deductions').notNull().default(0),
  grossSalary: real('gross_salary').notNull(),
  netSalary: real('net_salary').notNull(),
  pfAmount: real('pf_amount').default(0),
  esiAmount: real('esi_amount').default(0),
  tdsAmount: real('tds_amount').default(0),
  status: text('status').notNull().default('draft'),
  generatedAt: text('generated_at'),
  createdAt: text('created_at').notNull(),
});


// Auth tables for better-auth
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  role: text("role").notNull().default("employee"),
  employeeId: integer("employee_id").references(() => employees.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

export const userGeofences = sqliteTable('user_geofences', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  geofenceId: integer('geofence_id').notNull().references(() => geofences.id, { onDelete: 'cascade' }),
  assignedAt: text('assigned_at').notNull(),
  assignedBy: text('assigned_by').references(() => user.id),
});