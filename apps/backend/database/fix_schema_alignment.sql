-- ============================================================================
-- HRMS Database Schema Alignment Fix
-- This file aligns the database schema with the actual application requirements
-- Based on: phpMyAdmin SQL Dump (hrms_v3_secured.sql)
-- ============================================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

-- ============================================================================
-- STEP 1: Fix organizations table - Add missing columns
-- ============================================================================

-- Add slug column (must be unique)
ALTER TABLE `organizations` 
ADD COLUMN `slug` varchar(100) NOT NULL AFTER `company_name`;

-- Add unique constraint for slug
ALTER TABLE `organizations` 
ADD UNIQUE KEY `slug` (`slug`);

-- Add geofence-related columns
ALTER TABLE `organizations` 
ADD COLUMN `geofence_enabled` tinyint(1) DEFAULT 0 AFTER `updated_at`,
ADD COLUMN `require_geofence_for_all` tinyint(1) DEFAULT 0 AFTER `geofence_enabled`,
ADD COLUMN `default_geofence_id` int(11) DEFAULT NULL AFTER `require_geofence_for_all`,
ADD COLUMN `org_type` enum('national','international') DEFAULT 'national' AFTER `default_geofence_id`,
ADD COLUMN `default_language` varchar(10) DEFAULT 'en' AFTER `org_type`,
ADD COLUMN `allowed_login_methods` set('email','google','microsoft','phone') DEFAULT 'email,google,microsoft,phone' AFTER `default_language`;

-- Add foreign key for default_geofence_id
ALTER TABLE `organizations` 
ADD CONSTRAINT `fk_org_default_geofence` 
FOREIGN KEY (`default_geofence_id`) REFERENCES `geofences`(`id`) ON DELETE SET NULL;

-- ============================================================================
-- STEP 2: Fix employees table - Add missing columns
-- ============================================================================

-- Add manager_id column
ALTER TABLE `employees` 
ADD COLUMN `manager_id` int(10) UNSIGNED DEFAULT NULL AFTER `role_id`,
ADD CONSTRAINT `fk_emp_manager` 
FOREIGN KEY (`manager_id`) REFERENCES `employees`(`id`) ON DELETE SET NULL;

-- Add phone_verified column
ALTER TABLE `employees` 
ADD COLUMN `phone_verified` tinyint(1) NOT NULL DEFAULT 0 AFTER `phone`;

-- Add phone_auth_enabled column
ALTER TABLE `employees` 
ADD COLUMN `phone_auth_enabled` tinyint(1) NOT NULL DEFAULT 0 AFTER `phone_verified`;

-- Add login_type column
ALTER TABLE `employees` 
ADD COLUMN `login_type` enum('email','google','microsoft','phone') DEFAULT 'email' AFTER `phone_auth_enabled`;

-- Add is_international column
ALTER TABLE `employees` 
ADD COLUMN `is_international` tinyint(1) NOT NULL DEFAULT 0 AFTER `login_type`;

-- Add index for manager_id
ALTER TABLE `employees` 
ADD KEY `idx_manager_id` (`manager_id`);

-- ============================================================================
-- STEP 3: Add missing tables from the SQL dump
-- ============================================================================

-- Table: face_embeddings (if not exists)
CREATE TABLE IF NOT EXISTS `face_embeddings` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `employee_id` int(10) UNSIGNED NOT NULL,
  `org_id` int(10) UNSIGNED NOT NULL,
  `embedding` longtext NOT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  KEY `org_id` (`org_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: employee_locations (if not exists)
CREATE TABLE IF NOT EXISTS `employee_locations` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `employee_id` int(10) UNSIGNED NOT NULL,
  `org_id` int(10) UNSIGNED NOT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `captured_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  KEY `org_id` (`org_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: geofences (if not exists)
CREATE TABLE IF NOT EXISTS `geofences` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `org_id` int(10) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `radius_meters` int(11) NOT NULL DEFAULT 100,
  `address` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `org_id` (`org_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: leave_balances (if not exists)
CREATE TABLE IF NOT EXISTS `leave_balances` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `employee_id` int(10) UNSIGNED NOT NULL,
  `leave_type_id` int(10) UNSIGNED NOT NULL,
  `year` year(4) NOT NULL,
  `total_days` decimal(4,1) NOT NULL DEFAULT 0.0,
  `used_days` decimal(4,1) NOT NULL DEFAULT 0.0,
  `remaining_days` decimal(4,1) NOT NULL DEFAULT 0.0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_emp_type_year` (`employee_id`,`leave_type_id`,`year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: attendance_breaks (if not exists)
CREATE TABLE IF NOT EXISTS `attendance_breaks` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `attendance_id` int(10) UNSIGNED NOT NULL,
  `employee_id` int(10) UNSIGNED NOT NULL,
  `break_start` datetime NOT NULL,
  `break_end` datetime DEFAULT NULL,
  `break_duration_min` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `attendance_id` (`attendance_id`),
  KEY `employee_id` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: attendance_regularizations (if not exists)
CREATE TABLE IF NOT EXISTS `attendance_regularizations` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `employee_id` int(10) UNSIGNED NOT NULL,
  `org_id` int(10) UNSIGNED NOT NULL,
  `attendance_id` int(10) UNSIGNED DEFAULT NULL,
  `regularization_date` date NOT NULL,
  `type` enum('missed_punch','late_arrival','half_day','other') NOT NULL,
  `reason` text NOT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `admin_notes` text DEFAULT NULL,
  `approved_by` int(10) UNSIGNED DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  KEY `org_id` (`org_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: attendance_requests (if not exists)
CREATE TABLE IF NOT EXISTS `attendance_requests` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `employee_id` int(10) UNSIGNED NOT NULL,
  `org_id` int(10) UNSIGNED NOT NULL,
  `request_type` enum('check_in','check_out','both') NOT NULL,
  `requested_time` datetime NOT NULL,
  `reason` text NOT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `approved_by` int(10) UNSIGNED DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  KEY `org_id` (`org_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: invoices (if not exists)
CREATE TABLE IF NOT EXISTS `invoices` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `payment_id` int(10) UNSIGNED NOT NULL,
  `org_id` int(10) UNSIGNED NOT NULL,
  `invoice_number` varchar(50) NOT NULL,
  `subtotal` decimal(12,2) NOT NULL,
  `tax_percent` decimal(5,2) DEFAULT 18.00,
  `tax_amount` decimal(12,2) GENERATED ALWAYS AS (round(`subtotal` * `tax_percent` / 100,2)) STORED,
  `total` decimal(12,2) GENERATED ALWAYS AS (`subtotal` + round(`subtotal` * `tax_percent` / 100,2)) STORED,
  `is_void` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_number` (`invoice_number`),
  KEY `payment_id` (`payment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- STEP 4: Update existing data with default values
-- ============================================================================

-- Update organizations with slug from company_name (if slug is empty)
UPDATE `organizations` 
SET `slug` = LOWER(REPLACE(company_name, ' ', '-'))
WHERE `slug` = '' OR `slug` IS NULL;

-- Update organizations with default language (if NULL)
UPDATE `organizations` 
SET `default_language` = 'en'
WHERE `default_language` IS NULL;

-- Update organizations with default login methods (if NULL)
UPDATE `organizations` 
SET `allowed_login_methods` = 'email,google,microsoft,phone'
WHERE `allowed_login_methods` IS NULL;

-- Update employees with default login_type (if NULL)
UPDATE `employees` 
SET `login_type` = 'email'
WHERE `login_type` IS NULL;

-- ============================================================================
-- STEP 5: Verify and display current schema status
-- ============================================================================

-- Show organizations table structure
-- DESCRIBE organizations;

-- Show employees table structure  
-- DESCRIBE employees;

-- Show geofences table structure
-- DESCRIBE geofences;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

-- ============================================================================
-- END OF SCHEMA FIX
-- ============================================================================

