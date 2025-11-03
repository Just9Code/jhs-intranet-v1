CREATE TABLE `invoices_quotes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`document_number` text NOT NULL,
	`client_name` text NOT NULL,
	`client_email` text NOT NULL,
	`client_address` text NOT NULL,
	`client_phone` text,
	`chantier_id` integer,
	`issue_date` text NOT NULL,
	`due_date` text,
	`validity_date` text,
	`status` text NOT NULL,
	`items` text NOT NULL,
	`subtotal` real NOT NULL,
	`tax_rate` real NOT NULL,
	`tax_amount` real NOT NULL,
	`total_amount` real NOT NULL,
	`notes` text,
	`terms` text,
	`created_by` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`chantier_id`) REFERENCES `chantiers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_quotes_document_number_unique` ON `invoices_quotes` (`document_number`);