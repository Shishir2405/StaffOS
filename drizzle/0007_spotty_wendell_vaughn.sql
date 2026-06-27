CREATE TABLE `approval_workflows` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`module` text NOT NULL,
	`levels` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text,
	`user_name` text,
	`action` text NOT NULL,
	`entity` text NOT NULL,
	`entity_id` text,
	`details` text,
	`ip_address` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `backups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`file_name` text NOT NULL,
	`size_bytes` integer DEFAULT 0 NOT NULL,
	`type` text DEFAULT 'Manual' NOT NULL,
	`status` text DEFAULT 'Completed' NOT NULL,
	`notes` text,
	`created_by` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `challans` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`period` text NOT NULL,
	`total_amount` real DEFAULT 0 NOT NULL,
	`employee_count` integer DEFAULT 0 NOT NULL,
	`reference_number` text,
	`status` text DEFAULT 'Pending' NOT NULL,
	`due_date` text,
	`filed_date` text,
	`file_url` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `company_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_name` text NOT NULL,
	`legal_name` text,
	`address` text,
	`city` text,
	`state` text,
	`pincode` text,
	`email` text,
	`phone` text,
	`pan` text,
	`tan` text,
	`gstin` text,
	`pf_number` text,
	`esi_number` text,
	`pt_number` text,
	`lwf_number` text,
	`logo_url` text,
	`financial_year_start` text DEFAULT '04-01',
	`currency` text DEFAULT 'INR' NOT NULL,
	`email_notifications` integer DEFAULT true NOT NULL,
	`sms_notifications` integer DEFAULT false NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `compliance_calendar` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`due_date` text NOT NULL,
	`frequency` text DEFAULT 'Monthly' NOT NULL,
	`status` text DEFAULT 'Upcoming' NOT NULL,
	`description` text,
	`completed_at` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `cost_centers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`department` text,
	`budget` real DEFAULT 0 NOT NULL,
	`spent` real DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cost_centers_code_unique` ON `cost_centers` (`code`);--> statement-breakpoint
CREATE TABLE `employee_documents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_id` integer NOT NULL,
	`document_type` text NOT NULL,
	`document_name` text NOT NULL,
	`document_number` text,
	`file_url` text,
	`issue_date` text,
	`expiry_date` text,
	`status` text DEFAULT 'Pending' NOT NULL,
	`verified_by` integer,
	`remarks` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`verified_by`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `final_settlements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_id` integer NOT NULL,
	`last_working_day` text NOT NULL,
	`notice_period_days` integer DEFAULT 0 NOT NULL,
	`leave_encashment` real DEFAULT 0 NOT NULL,
	`gratuity` real DEFAULT 0 NOT NULL,
	`pending_salary` real DEFAULT 0 NOT NULL,
	`bonus_payable` real DEFAULT 0 NOT NULL,
	`deductions` real DEFAULT 0 NOT NULL,
	`net_settlement` real DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'Draft' NOT NULL,
	`remarks` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `holidays` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`date` text NOT NULL,
	`type` text DEFAULT 'Public' NOT NULL,
	`description` text,
	`year` integer NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `insurance_policies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_id` integer NOT NULL,
	`policy_type` text NOT NULL,
	`provider` text NOT NULL,
	`policy_number` text,
	`coverage_amount` real DEFAULT 0 NOT NULL,
	`premium` real DEFAULT 0 NOT NULL,
	`employee_share` real DEFAULT 0 NOT NULL,
	`employer_share` real DEFAULT 0 NOT NULL,
	`start_date` text,
	`end_date` text,
	`status` text DEFAULT 'Active' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `journal_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`payroll_run_id` integer,
	`entry_date` text NOT NULL,
	`account` text NOT NULL,
	`account_code` text,
	`debit` real DEFAULT 0 NOT NULL,
	`credit` real DEFAULT 0 NOT NULL,
	`narration` text,
	`cost_center_id` integer,
	`status` text DEFAULT 'Draft' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`payroll_run_id`) REFERENCES `payroll_runs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`cost_center_id`) REFERENCES `cost_centers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `loans` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_id` integer NOT NULL,
	`loan_type` text NOT NULL,
	`principal_amount` real NOT NULL,
	`interest_rate` real DEFAULT 0 NOT NULL,
	`tenure_months` integer NOT NULL,
	`emi_amount` real DEFAULT 0 NOT NULL,
	`amount_paid` real DEFAULT 0 NOT NULL,
	`outstanding_amount` real DEFAULT 0 NOT NULL,
	`start_date` text NOT NULL,
	`status` text DEFAULT 'Active' NOT NULL,
	`approved_by` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`approved_by`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `overtime_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_id` integer NOT NULL,
	`date` text NOT NULL,
	`hours` real NOT NULL,
	`rate_multiplier` real DEFAULT 1.5 NOT NULL,
	`hourly_rate` real DEFAULT 0 NOT NULL,
	`amount` real DEFAULT 0 NOT NULL,
	`reason` text,
	`status` text DEFAULT 'Pending' NOT NULL,
	`approved_by` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`approved_by`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `pay_heads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`category` text NOT NULL,
	`calculation_type` text DEFAULT 'Fixed' NOT NULL,
	`value` real DEFAULT 0 NOT NULL,
	`base_component` text,
	`is_taxable` integer DEFAULT true NOT NULL,
	`is_statutory` integer DEFAULT false NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pay_heads_code_unique` ON `pay_heads` (`code`);--> statement-breakpoint
CREATE TABLE `payroll_adjustments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_id` integer NOT NULL,
	`type` text NOT NULL,
	`description` text NOT NULL,
	`amount` real NOT NULL,
	`effective_month` text NOT NULL,
	`is_credit` integer DEFAULT true NOT NULL,
	`status` text DEFAULT 'Pending' NOT NULL,
	`approved_by` integer,
	`created_at` text NOT NULL,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`approved_by`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `reimbursements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_id` integer NOT NULL,
	`category` text NOT NULL,
	`amount` real NOT NULL,
	`claim_date` text NOT NULL,
	`bill_date` text,
	`description` text,
	`bill_url` text,
	`status` text DEFAULT 'Pending' NOT NULL,
	`approved_by` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`approved_by`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `salary_templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`basic_percent` real DEFAULT 40 NOT NULL,
	`hra_percent` real DEFAULT 20 NOT NULL,
	`components` text,
	`ctc_min` real DEFAULT 0 NOT NULL,
	`ctc_max` real DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `shift_assignments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_id` integer NOT NULL,
	`shift_id` integer NOT NULL,
	`effective_from` text NOT NULL,
	`effective_to` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`shift_id`) REFERENCES `shifts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `shifts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`break_minutes` integer DEFAULT 0 NOT NULL,
	`working_hours` real DEFAULT 8 NOT NULL,
	`week_off` text,
	`grace_minutes` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `shifts_code_unique` ON `shifts` (`code`);--> statement-breakpoint
CREATE TABLE `statutory_contributions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_id` integer NOT NULL,
	`payroll_run_id` integer,
	`type` text NOT NULL,
	`month` integer NOT NULL,
	`year` integer NOT NULL,
	`wage_base` real DEFAULT 0 NOT NULL,
	`employee_contribution` real DEFAULT 0 NOT NULL,
	`employer_contribution` real DEFAULT 0 NOT NULL,
	`total_contribution` real DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`payroll_run_id`) REFERENCES `payroll_runs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tax_computations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_id` integer NOT NULL,
	`financial_year` text NOT NULL,
	`regime` text DEFAULT 'New' NOT NULL,
	`gross_income` real DEFAULT 0 NOT NULL,
	`total_deductions` real DEFAULT 0 NOT NULL,
	`taxable_income` real DEFAULT 0 NOT NULL,
	`tax_liability` real DEFAULT 0 NOT NULL,
	`cess` real DEFAULT 0 NOT NULL,
	`tds_deducted` real DEFAULT 0 NOT NULL,
	`tds_balance` real DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tax_declarations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_id` integer NOT NULL,
	`financial_year` text NOT NULL,
	`section` text NOT NULL,
	`category` text NOT NULL,
	`declared_amount` real DEFAULT 0 NOT NULL,
	`proof_amount` real DEFAULT 0 NOT NULL,
	`proof_url` text,
	`proof_status` text DEFAULT 'Declared' NOT NULL,
	`verified_by` integer,
	`remarks` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`verified_by`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
