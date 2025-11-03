ALTER TABLE `user` ADD `role` text DEFAULT 'travailleur' NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `status` text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `phone` text;--> statement-breakpoint
ALTER TABLE `user` ADD `address` text;--> statement-breakpoint
ALTER TABLE `user` ADD `last_login` integer;