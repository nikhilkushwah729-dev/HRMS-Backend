-- Fix social_logins table schema to match SocialLogin model
-- Run: cd apps/backend && mysql -u[DB_USER] -p[DB_DATABASE] < database/fix_social_logins_schema.sql

ALTER TABLE `social_logins` 
ADD COLUMN `phone` VARCHAR(20) NULL AFTER `provider_user_id`,
ADD COLUMN `is_primary` TINYINT(1) NOT NULL DEFAULT 0 AFTER `phone`,
ADD COLUMN `last_login_at` TIMESTAMP NULL AFTER `is_primary`;

-- Verify:
-- DESCRIBE social_logins;
