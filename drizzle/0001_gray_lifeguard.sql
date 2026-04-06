CREATE TABLE `order_traces` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`description` varchar(512) NOT NULL,
	`location` varchar(255),
	`tracedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `order_traces_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderNo` varchar(64) NOT NULL,
	`agentId` int NOT NULL,
	`customerName` varchar(255) NOT NULL,
	`customerPhone` varchar(32) NOT NULL,
	`customerAddress` text NOT NULL,
	`productName` varchar(255) NOT NULL,
	`productSize` varchar(64),
	`quantity` int NOT NULL DEFAULT 1,
	`productPrice` decimal(10,2) DEFAULT '0',
	`orderValue` decimal(10,2) DEFAULT '0',
	`productImageUrl` text,
	`aadhaarFrontUrl` text,
	`aadhaarBackUrl` text,
	`paymentStatus` enum('unpaid','paid') NOT NULL DEFAULT 'unpaid',
	`cashback` decimal(10,2) DEFAULT '0',
	`orderStatus` enum('processing','shipped','delivered','cancelled') NOT NULL DEFAULT 'processing',
	`trackingNumber` varchar(128),
	`origin` varchar(128),
	`destination` varchar(128),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_orderNo_unique` UNIQUE(`orderNo`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','agent') NOT NULL DEFAULT 'agent';--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(32);