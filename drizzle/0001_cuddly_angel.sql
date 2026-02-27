CREATE TABLE `attendance` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_id` integer NOT NULL,
	`date` text NOT NULL,
	`check_in_time` text,
	`check_out_time` text,
	`check_in_geofence_id` integer,
	`check_out_geofence_id` integer,
	`check_in_latitude` real,
	`check_in_longitude` real,
	`check_out_latitude` real,
	`check_out_longitude` real,
	`status` text NOT NULL,
	`working_hours` real,
	`is_auto_check_in` integer DEFAULT false,
	`is_auto_check_out` integer DEFAULT false,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`check_in_geofence_id`) REFERENCES `geofences`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`check_out_geofence_id`) REFERENCES `geofences`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `geofences` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`radius` real NOT NULL,
	`address` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `leave_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_id` integer NOT NULL,
	`leave_type` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`total_days` real NOT NULL,
	`reason` text NOT NULL,
	`status` text NOT NULL,
	`approved_by` integer,
	`approved_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`approved_by`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
