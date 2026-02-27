ALTER TABLE `user` ADD `role` text DEFAULT 'employee' NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `employee_id` integer REFERENCES employees(id);