-- Fix for employees table - remove deleted_by column
-- Run this to remove the deleted_by column if it exists

ALTER TABLE `employees` DROP COLUMN IF EXISTS `deleted_by`;

-- If the above doesn't work (MySQL doesn't support IF EXISTS), run:
-- ALTER TABLE `employees` DROP COLUMN `deleted_by`;
