CREATE TABLE `payroll_runs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`run_date` text NOT NULL,
	`period_start` text NOT NULL,
	`period_end` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`total_employees` integer DEFAULT 0,
	`total_amount` real DEFAULT 0,
	`created_by` integer,
	`created_at` text NOT NULL,
	`processed_at` text,
	FOREIGN KEY (`created_by`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `payslips` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`payroll_run_id` integer NOT NULL,
	`employee_id` integer NOT NULL,
	`employee_name` text NOT NULL,
	`department` text NOT NULL,
	`designation` text NOT NULL,
	`period_start` text NOT NULL,
	`period_end` text NOT NULL,
	`basic_salary` real NOT NULL,
	`total_allowances` real DEFAULT 0 NOT NULL,
	`total_deductions` real DEFAULT 0 NOT NULL,
	`gross_salary` real NOT NULL,
	`net_salary` real NOT NULL,
	`pf_amount` real DEFAULT 0,
	`esi_amount` real DEFAULT 0,
	`tds_amount` real DEFAULT 0,
	`status` text DEFAULT 'draft' NOT NULL,
	`generated_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`payroll_run_id`) REFERENCES `payroll_runs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `salary_components` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_id` integer NOT NULL,
	`component_type` text NOT NULL,
	`component_name` text NOT NULL,
	`amount` real NOT NULL,
	`is_percentage` integer DEFAULT false NOT NULL,
	`is_statutory` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
