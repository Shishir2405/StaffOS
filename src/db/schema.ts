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

/* ════════════════════════════════════════════════════════════════════
   PAYROLL SUITE — extended modules (13 functional areas)
   ════════════════════════════════════════════════════════════════════ */

/* ── 2. Employee Management: Document Management (KYC, Contracts) ──── */
export const employeeDocuments = sqliteTable('employee_documents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  employeeId: integer('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  documentType: text('document_type').notNull(), // Aadhaar, PAN, Passport, Contract, Offer Letter, Bank Proof, etc.
  documentName: text('document_name').notNull(),
  documentNumber: text('document_number'),
  fileUrl: text('file_url'),
  issueDate: text('issue_date'),
  expiryDate: text('expiry_date'),
  status: text('status').notNull().default('Pending'), // Pending, Verified, Rejected, Expired
  verifiedBy: integer('verified_by').references(() => employees.id),
  remarks: text('remarks'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/* ── 3. Time & Attendance: Shift Management ───────────────────────── */
export const shifts = sqliteTable('shifts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  startTime: text('start_time').notNull(), // HH:MM
  endTime: text('end_time').notNull(),     // HH:MM
  breakMinutes: integer('break_minutes').notNull().default(0),
  workingHours: real('working_hours').notNull().default(8),
  weekOff: text('week_off'), // comma separated days e.g. "Sat,Sun"
  graceMinutes: integer('grace_minutes').notNull().default(0),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const shiftAssignments = sqliteTable('shift_assignments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  employeeId: integer('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  shiftId: integer('shift_id').notNull().references(() => shifts.id, { onDelete: 'cascade' }),
  effectiveFrom: text('effective_from').notNull(),
  effectiveTo: text('effective_to'),
  createdAt: text('created_at').notNull(),
});

/* ── 3. Time & Attendance: Holiday Calendar ───────────────────────── */
export const holidays = sqliteTable('holidays', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  date: text('date').notNull(), // YYYY-MM-DD
  type: text('type').notNull().default('Public'), // Public, Optional, Restricted
  description: text('description'),
  year: integer('year').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
});

/* ── 3. Time & Attendance: Overtime Tracking ──────────────────────── */
export const overtimeRecords = sqliteTable('overtime_records', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  employeeId: integer('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  hours: real('hours').notNull(),
  rateMultiplier: real('rate_multiplier').notNull().default(1.5),
  hourlyRate: real('hourly_rate').notNull().default(0),
  amount: real('amount').notNull().default(0),
  reason: text('reason'),
  status: text('status').notNull().default('Pending'), // Pending, Approved, Rejected, Paid
  approvedBy: integer('approved_by').references(() => employees.id),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/* ── 4. Payroll Processing: Pay Heads Configuration ───────────────── */
export const payHeads = sqliteTable('pay_heads', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  category: text('category').notNull(), // Earning, Deduction, Reimbursement
  calculationType: text('calculation_type').notNull().default('Fixed'), // Fixed, Percentage, Formula
  value: real('value').notNull().default(0),
  baseComponent: text('base_component'), // e.g. Basic, Gross (for percentage)
  isTaxable: integer('is_taxable', { mode: 'boolean' }).notNull().default(true),
  isStatutory: integer('is_statutory', { mode: 'boolean' }).notNull().default(false),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  displayOrder: integer('display_order').notNull().default(0),
  createdAt: text('created_at').notNull(),
});

/* ── 4. Payroll Processing: Arrears, Adjustments & Bonus ──────────── */
export const payrollAdjustments = sqliteTable('payroll_adjustments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  employeeId: integer('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // Arrears, Bonus, Adjustment, Incentive
  description: text('description').notNull(),
  amount: real('amount').notNull(),
  effectiveMonth: text('effective_month').notNull(), // YYYY-MM
  isCredit: integer('is_credit', { mode: 'boolean' }).notNull().default(true),
  status: text('status').notNull().default('Pending'), // Pending, Approved, Processed
  approvedBy: integer('approved_by').references(() => employees.id),
  createdAt: text('created_at').notNull(),
});

/* ── 4. Payroll Processing: Final Settlement (F&F) ────────────────── */
export const finalSettlements = sqliteTable('final_settlements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  employeeId: integer('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  lastWorkingDay: text('last_working_day').notNull(),
  noticePeriodDays: integer('notice_period_days').notNull().default(0),
  leaveEncashment: real('leave_encashment').notNull().default(0),
  gratuity: real('gratuity').notNull().default(0),
  pendingSalary: real('pending_salary').notNull().default(0),
  bonusPayable: real('bonus_payable').notNull().default(0),
  deductions: real('deductions').notNull().default(0),
  netSettlement: real('net_settlement').notNull().default(0),
  status: text('status').notNull().default('Draft'), // Draft, Approved, Paid
  remarks: text('remarks'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/* ── 5. Tax Management: Investment Declarations & Proofs ──────────── */
export const taxDeclarations = sqliteTable('tax_declarations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  employeeId: integer('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  financialYear: text('financial_year').notNull(), // e.g. 2025-26
  section: text('section').notNull(), // 80C, 80D, 80CCD, HRA, Home Loan, etc.
  category: text('category').notNull(),
  declaredAmount: real('declared_amount').notNull().default(0),
  proofAmount: real('proof_amount').notNull().default(0),
  proofUrl: text('proof_url'),
  proofStatus: text('proof_status').notNull().default('Declared'), // Declared, Submitted, Verified, Rejected
  verifiedBy: integer('verified_by').references(() => employees.id),
  remarks: text('remarks'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/* ── 5. Tax Management: Income Tax (TDS) Computation ──────────────── */
export const taxComputations = sqliteTable('tax_computations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  employeeId: integer('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  financialYear: text('financial_year').notNull(),
  regime: text('regime').notNull().default('New'), // Old, New
  grossIncome: real('gross_income').notNull().default(0),
  totalDeductions: real('total_deductions').notNull().default(0),
  taxableIncome: real('taxable_income').notNull().default(0),
  taxLiability: real('tax_liability').notNull().default(0),
  cess: real('cess').notNull().default(0),
  tdsDeducted: real('tds_deducted').notNull().default(0),
  tdsBalance: real('tds_balance').notNull().default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/* ── 6. Statutory Compliance: PF / ESI / PT / LWF contributions ───── */
export const statutoryContributions = sqliteTable('statutory_contributions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  employeeId: integer('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  payrollRunId: integer('payroll_run_id').references(() => payrollRuns.id),
  type: text('type').notNull(), // PF, ESI, PT, LWF
  month: integer('month').notNull(),
  year: integer('year').notNull(),
  wageBase: real('wage_base').notNull().default(0),
  employeeContribution: real('employee_contribution').notNull().default(0),
  employerContribution: real('employer_contribution').notNull().default(0),
  totalContribution: real('total_contribution').notNull().default(0),
  createdAt: text('created_at').notNull(),
});

/* ── 6. Statutory Compliance: Challan Generation (ECR/EPFO/ESIC/PT) ─ */
export const challans = sqliteTable('challans', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type').notNull(), // ECR, EPFO, ESIC, PT, TDS
  period: text('period').notNull(), // YYYY-MM
  totalAmount: real('total_amount').notNull().default(0),
  employeeCount: integer('employee_count').notNull().default(0),
  referenceNumber: text('reference_number'),
  status: text('status').notNull().default('Pending'), // Pending, Generated, Filed, Paid
  dueDate: text('due_date'),
  filedDate: text('filed_date'),
  fileUrl: text('file_url'),
  createdAt: text('created_at').notNull(),
});

/* ── 8. Benefits & Deductions: Loans & Advances ───────────────────── */
export const loans = sqliteTable('loans', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  employeeId: integer('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  loanType: text('loan_type').notNull(), // Personal, Salary Advance, Emergency, etc.
  principalAmount: real('principal_amount').notNull(),
  interestRate: real('interest_rate').notNull().default(0),
  tenureMonths: integer('tenure_months').notNull(),
  emiAmount: real('emi_amount').notNull().default(0),
  amountPaid: real('amount_paid').notNull().default(0),
  outstandingAmount: real('outstanding_amount').notNull().default(0),
  startDate: text('start_date').notNull(),
  status: text('status').notNull().default('Active'), // Active, Closed, Defaulted, Pending
  approvedBy: integer('approved_by').references(() => employees.id),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/* ── 8. Benefits & Deductions: Reimbursements ─────────────────────── */
export const reimbursements = sqliteTable('reimbursements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  employeeId: integer('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  category: text('category').notNull(), // Travel, Medical, Food, Communication, Other
  amount: real('amount').notNull(),
  claimDate: text('claim_date').notNull(),
  billDate: text('bill_date'),
  description: text('description'),
  billUrl: text('bill_url'),
  status: text('status').notNull().default('Pending'), // Pending, Approved, Rejected, Paid
  approvedBy: integer('approved_by').references(() => employees.id),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/* ── 8. Benefits & Deductions: Insurance Benefits ─────────────────── */
export const insurancePolicies = sqliteTable('insurance_policies', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  employeeId: integer('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  policyType: text('policy_type').notNull(), // Health, Life, Accident, Term
  provider: text('provider').notNull(),
  policyNumber: text('policy_number'),
  coverageAmount: real('coverage_amount').notNull().default(0),
  premium: real('premium').notNull().default(0),
  employeeShare: real('employee_share').notNull().default(0),
  employerShare: real('employer_share').notNull().default(0),
  startDate: text('start_date'),
  endDate: text('end_date'),
  status: text('status').notNull().default('Active'), // Active, Expired, Cancelled
  createdAt: text('created_at').notNull(),
});

/* ── 9. Finance & Integration: Cost Centers ───────────────────────── */
export const costCenters = sqliteTable('cost_centers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  department: text('department'),
  budget: real('budget').notNull().default(0),
  spent: real('spent').notNull().default(0),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
});

/* ── 9. Finance & Integration: Accounting / Journal Entries ───────── */
export const journalEntries = sqliteTable('journal_entries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  payrollRunId: integer('payroll_run_id').references(() => payrollRuns.id),
  entryDate: text('entry_date').notNull(),
  account: text('account').notNull(),
  accountCode: text('account_code'),
  debit: real('debit').notNull().default(0),
  credit: real('credit').notNull().default(0),
  narration: text('narration'),
  costCenterId: integer('cost_center_id').references(() => costCenters.id),
  status: text('status').notNull().default('Draft'), // Draft, Posted, Exported
  createdAt: text('created_at').notNull(),
});

/* ── 12. Settings: Company Setup (single row) ─────────────────────── */
export const companySettings = sqliteTable('company_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  companyName: text('company_name').notNull(),
  legalName: text('legal_name'),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  pincode: text('pincode'),
  email: text('email'),
  phone: text('phone'),
  pan: text('pan'),
  tan: text('tan'),
  gstin: text('gstin'),
  pfNumber: text('pf_number'),
  esiNumber: text('esi_number'),
  ptNumber: text('pt_number'),
  lwfNumber: text('lwf_number'),
  logoUrl: text('logo_url'),
  financialYearStart: text('financial_year_start').default('04-01'), // MM-DD
  currency: text('currency').notNull().default('INR'),
  emailNotifications: integer('email_notifications', { mode: 'boolean' }).notNull().default(true),
  smsNotifications: integer('sms_notifications', { mode: 'boolean' }).notNull().default(false),
  updatedAt: text('updated_at').notNull(),
});

/* ── 12. Settings: Salary Templates ───────────────────────────────── */
export const salaryTemplates = sqliteTable('salary_templates', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  basicPercent: real('basic_percent').notNull().default(40),
  hraPercent: real('hra_percent').notNull().default(20),
  components: text('components'), // JSON string of additional components
  ctcMin: real('ctc_min').notNull().default(0),
  ctcMax: real('ctc_max').notNull().default(0),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
});

/* ── 12. Settings: Approval Workflows ─────────────────────────────── */
export const approvalWorkflows = sqliteTable('approval_workflows', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  module: text('module').notNull(), // Leave, Reimbursement, Loan, Payroll, Overtime
  levels: text('levels'), // JSON array of approval levels
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
});

/* ── 11. Compliance & Audit: Audit Trail ──────────────────────────── */
export const auditLogs = sqliteTable('audit_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id'),
  userName: text('user_name'),
  action: text('action').notNull(), // Create, Update, Delete, Login, Export, etc.
  entity: text('entity').notNull(),
  entityId: text('entity_id'),
  details: text('details'),
  ipAddress: text('ip_address'),
  createdAt: text('created_at').notNull(),
});

/* ── 11. Compliance & Audit: Compliance Calendar ──────────────────── */
export const complianceCalendar = sqliteTable('compliance_calendar', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  category: text('category').notNull(), // PF, ESI, PT, TDS, LWF, GST, Other
  dueDate: text('due_date').notNull(),
  frequency: text('frequency').notNull().default('Monthly'), // Monthly, Quarterly, Annual, One-time
  status: text('status').notNull().default('Upcoming'), // Upcoming, Completed, Overdue
  description: text('description'),
  completedAt: text('completed_at'),
  createdAt: text('created_at').notNull(),
});

/* ── 13. Data Security & Backup ───────────────────────────────────── */
export const backups = sqliteTable('backups', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  fileName: text('file_name').notNull(),
  sizeBytes: integer('size_bytes').notNull().default(0),
  type: text('type').notNull().default('Manual'), // Manual, Auto, Scheduled
  status: text('status').notNull().default('Completed'), // Completed, Failed, In Progress
  notes: text('notes'),
  createdBy: text('created_by'),
  createdAt: text('created_at').notNull(),
});