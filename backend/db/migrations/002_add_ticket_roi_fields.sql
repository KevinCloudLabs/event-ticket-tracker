ALTER TABLE `tickets` ADD COLUMN `ticket_type` varchar(50) NOT NULL DEFAULT 'general' AFTER `price`;
ALTER TABLE `tickets` ADD COLUMN `purchased_at` date DEFAULT NULL AFTER `ticket_type`;

UPDATE `tickets` SET `purchased_at` = CURDATE() WHERE `status` = 'assigned' AND `purchased_at` IS NULL;
