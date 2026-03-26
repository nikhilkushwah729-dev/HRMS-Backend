-- Enable phone authentication for employee with email nikhilkushwah729@gmail.com
-- This updates the employee record to add phone number and enable phone auth

UPDATE employees 
SET 
    phone = '6266330976',
    phone_verified = 1,
    phone_auth_enabled = 1,
    login_type = 'phone'
WHERE 
    email = 'nikhilkushwah729@gmail.com';

-- Verify the update
SELECT id, first_name, last_name, email, phone, phone_verified, phone_auth_enabled, login_type 
FROM employees 
WHERE email = 'nikhilkushwah729@gmail.com';
