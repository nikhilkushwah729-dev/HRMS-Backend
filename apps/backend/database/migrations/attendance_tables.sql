-- Attendance System Database Tables
-- Run this SQL to create necessary tables for the enhanced attendance system

-- 1. Attendance Regularizations (Manual Attendance Requests)
CREATE TABLE IF NOT EXISTS attendance_regularizations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT UNSIGNED NOT NULL,
    org_id INT UNSIGNED NOT NULL,
    attendance_date DATE NOT NULL,
    check_in TIME NOT NULL,
    check_out TIME,
    reason TEXT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approved_by INT UNSIGNED,
    approved_at DATETIME,
    rejection_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_employee (employee_id),
    INDEX idx_status (status),
    INDEX idx_date (attendance_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Overtime Requests
CREATE TABLE IF NOT EXISTS overtime_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT UNSIGNED NOT NULL,
    org_id INT UNSIGNED NOT NULL,
    date DATE NOT NULL,
    hours DECIMAL(4,2) NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approved_by INT UNSIGNED,
    approved_at DATETIME,
    rejection_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_employee (employee_id),
    INDEX idx_status (status),
    INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Organization Locations (Geo-fence Zones)
CREATE TABLE IF NOT EXISTS org_locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    org_id INT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    radius_meters INT DEFAULT 100,
    is_active TINYINT(1) DEFAULT 1,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_org (org_id),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Add break columns to attendances table (if not exists)
-- These are already added to the model, run migration to update DB:
-- ALTER TABLE attendances 
--     ADD COLUMN break_start DATETIME NULL AFTER net_work_hours,
--     ADD COLUMN break_end DATETIME NULL AFTER break_start,
--     ADD COLUMN break_duration INT NULL AFTER break_end;

-- 5. Insert sample organization location (optional)
-- INSERT INTO org_locations (org_id, name, latitude, longitude, radius_meters, address)
-- VALUES (1, 'Main Office', 28.6139, 77.2090, 100, 'New Delhi, India');

