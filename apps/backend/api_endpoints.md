# HRMS API Endpoints Documentation

## Base URL
```
http://localhost:3333/api
```

---

## Authentication Routes (Public)

### Register Organization
- **URL:** `POST /api/auth/register`
- **Body:**
  ```json
  {
    "companyName": "Company Name",
    "email": "admin@company.com",
    "password": "password123",
    "firstName": "Admin",
    "lastName": "User"
  }
  ```

### Verify Email
- **URL:** `GET /api/auth/verify-email?token=xxx`

### Login
- **URL:** `POST /api/auth/login`
- **Body:**
  ```json
  {
    "email": "nikhilkushwah729@gmail.com",
    "password": "password123"
  }
  ```
- **Response:** Returns `{ requires2fa: true, otpReference: xxx, message: "OTP sent" }`

### Verify OTP
- **URL:** `POST /api/auth/verify-otp`
- **Body:**
  ```json
  {
    "otpReference": 1,
    "code": "123456"
  }
  ```
- **Response:** Returns `{ token: "xxx", employee: {...} }`

### Forgot Password
- **URL:** `POST /api/auth/forgot-password`
- **Body:**
  ```json
  {
    "email": "user@company.com"
  }
  ```

### Reset Password
- **URL:** `POST /api/auth/reset-password`
- **Body:**
  ```json
  {
    "token": "xxx",
    "password": "newpassword123"
  }
  ```

---

## Protected Routes (Require Token)

All protected routes require header: `Authorization: Bearer <token>`

---

### Get Current User
- **URL:** `GET /api/auth/me`

### Logout
- **URL:** `POST /api/auth/logout`

---

## Organization Routes

### Get Organization
- **URL:** `GET /api/organization`

### Update Organization
- **URL:** `PUT /api/organization`
- **Body:** (fields to update)

### Get Departments
- **URL:** `GET /api/organization/departments`

### Create Department
- **URL:** `POST /api/organization/departments`
- **Body:**
  ```json
  {
    "departmentName": "Engineering",
    "description": "Tech team"
  }
  ```

### Get Addons
- **URL:** `GET /api/organization/addons`

### Toggle Addon
- **URL:** `POST /api/organization/addons/toggle`
- **Body:**
  ```json
  {
    "addonId": 1
  }
  ```

---

## Employee Routes

### List Employees
- **URL:** `GET /api/employees`

### Get Employee
- **URL:** `GET /api/employees/:id`

### Create Employee
- **URL:** `POST /api/employees`
- **Body:**
  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@company.com",
    "phone": "1234567890",
    "departmentId": 1,
    "roleId": 4,
    "status": "active",
    "password": "password123"
  }
  ```

### Update Employee
- **URL:** `PUT /api/employees/:id`

### Delete Employee
- **URL:** `DELETE /api/employees/:id`

### Invite Employee
- **URL:** `POST /api/employees/invite`
- **Description:** Send an invitation email to a new employee to join the organization
- **Body:**
  ```json
  {
    "email": "new@company.com",
    "roleId": 4
  }
  ```
- **Response:**
  ```json
  {
    "status": "success",
    "message": "Invitation sent successfully",
    "data": {
      "id": 1,
      "email": "new@company.com",
      "expiresAt": "2026-01-15T10:30:00.000+05:30",
      "_dev_token": "xxx-xxx-xxx"
    }
  }
  ```
- **Notes:** 
  - The `_dev_token` is only returned in development mode
  - In production, the invitation email is sent automatically with a link like: `https://yourapp.com/invite/:token`
  - Invitations expire after 7 days

### List Invitations
- **URL:** `GET /api/employees/invitations`
- **Description:** Get all pending invitations for the organization

### Revoke Invitation
- **URL:** `POST /api/employees/invitations/:id/revoke`
- **Description:** Cancel a pending invitation

### Resend Invitation
- **URL:** `POST /api/employees/invitations/:id/resend`
- **Description:** Resend an invitation that hasn't been accepted yet

---

## Employee Not Found Error Messages

When accessing employee endpoints, you may receive these specific error messages:

| Message | Cause | Solution |
|---------|-------|----------|
| `Employee not found. The employee may have been deleted or never existed.` | The employee ID doesn't exist in the database | Check if the employee ID is correct |
| `Employee not found in your organization` | Employee belongs to a different organization (multi-tenancy) | You can only view employees in your organization |
| `Employee has been removed from the organization` | Employee was soft-deleted | Contact admin if you need to restore the employee |

---

## Attendance Routes

### Check In
- **URL:** `POST /api/attendance/check-in`
- **Body:**
  ```json
  {
    "latitude": 28.6139,
    "longitude": 77.2090,
    "source": "mobile"
  }
  ```

### Check Out
- **URL:** `POST /api/attendance/check-out`
- **Body:**
  ```json
  {
    "latitude": 28.6139,
    "longitude": 77.2090
  }
  ```

### Get Attendance History
- **URL:** `GET /api/attendance/history?startDate=2026-01-01&endDate=2026-01-31`

### Get Today's Attendance
- **URL:** `GET /api/attendance/today`

### Start Break
- **URL:** `POST /api/attendance/break/start`
- **Body:** `{ "type": "lunch" }`

### End Break
- **URL:** `POST /api/attendance/break/end`

### Get Today's Breaks
- **URL:** `GET /api/attendance/breaks/today`

### Get Attendance Stats
- **URL:** `GET /api/attendance/stats?period=month`

### Get Monthly Attendance
- **URL:** `GET /api/attendance/monthly?year=2026&month=1`

### Request Manual Attendance
- **URL:** `POST /api/attendance/manual/request`
- **Body:**
  ```json
  {
    "date": "2026-01-15",
    "check_in": "09:00",
    "check_out": "18:00",
    "reason": "Forgot to check in"
  }
  ```

### Get Manual Requests
- **URL:** `GET /api/attendance/manual/requests`

### Process Manual Request
- **URL:** `POST /api/attendance/manual/process`
- **Body:**
  ```json
  {
    "request_id": 1,
    "action": "approved",
    "reason": "Approved"
  }
  ```

### Request Overtime
- **URL:** `POST /api/attendance/overtime/request`
- **Body:**
  ```json
  {
    "date": "2026-01-15",
    "hours": 2,
    "reason": "Extra work"
  }
  ```

### Get Overtime Records
- **URL:** `GET /api/attendance/overtime`

### Validate Location
- **URL:** `GET /api/attendance/validate-location?lat=28.6139&lng=77.2090`

### Get Geo-fence Zones
- **URL:** `GET /api/attendance/zones`

### Get All Attendance (Admin)
- **URL:** `GET /api/attendance/all?startDate=2026-01-01&endDate=2026-01-31`

### Get Today's All Attendance (Admin)
- **URL:** `GET /api/attendance/all/today`

### Get Shifts
- **URL:** `GET /api/attendance/shifts`

---

## Regularization Routes

### List Regularizations
- **URL:** `GET /api/regularizations`

### Create Regularization
- **URL:** `POST /api/regularizations`
- **Body:**
  ```json
  {
    "regularizationDate": "2026-01-15",
    "type": "late_arrival",
    "reason": "Traffic"
  }
  ```

### Update Regularization
- **URL:** `PUT /api/regularizations/:id`

---

## Tracking Routes

### Update Location
- **URL:** `POST /api/tracking/update`
- **Body:**
  ```json
  {
    "latitude": 28.6139,
    "longitude": 77.2090
  }
  ```

### Get Location History
- **URL:** `GET /api/tracking/history?startDate=2026-01-01&endDate=2026-01-31`

---

## Leave Routes

### List Leaves
- **URL:** `GET /api/leaves`

### Get Leave Types
- **URL:** `GET /api/leaves/types`

### Apply Leave
- **URL:** `POST /api/leaves`
- **Body:**
  ```json
  {
    "leaveTypeId": 1,
    "startDate": "2026-02-01",
    "endDate": "2026-02-03",
    "reason": "Personal work"
  }
  ```

### Update Leave Status
- **URL:** `PUT /api/leaves/:id/status`
- **Body:**
  ```json
  {
    "status": "approved",
    "rejectionNote": ""
  }
  ```

### Get Leave Balances
- **URL:** `GET /api/leaves/balances?year=2026`

### Adjust Leave Balance
- **URL:** `POST /api/leaves/balances/adjust`
- **Body:**
  ```json
  {
    "leaveTypeId": 1,
    "employeeId": 2,
    "year": 2026,
    "adjustment": 2,
    "reason": "Bonus leave"
  }
  ```

---

## Leave Types (Alternative)
- **URL:** `GET /api/leave-types`

---

## Payroll Routes

### List Payroll
- **URL:** `GET /api/payroll`

### Create Payroll
- **URL:** `POST /api/payroll`
- **Body:**
  ```json
  {
    "employeeId": 1,
    "month": 1,
    "year": 2026,
    "basicSalary": 50000,
    "hra": 10000,
    "allowances": 5000,
    "bonus": 0,
    "pfDeduction": 1800,
    "esiDeduction": 375,
    "tdsDeduction": 5000
  }
  ```

---

## Project Routes

### List Projects
- **URL:** `GET /api/projects`

### Create Project
- **URL:** `POST /api/projects`
- **Body:**
  ```json
  {
    "name": "Project Name",
    "description": "Description",
    "clientName": "Client",
    "startDate": "2026-01-01",
    "endDate": "2026-12-31",
    "budget": 100000,
    "priority": "high"
  }
  ```

### Get Project Tasks
- **URL:** `GET /api/projects/:id/tasks`

### Create Task
- **URL:** `POST /api/projects/:id/tasks`
- **Body:**
  ```json
  {
    "title": "Task Name",
    "description": "Description",
    "assignedTo": 1,
    "priority": "high",
    "dueDate": "2026-02-01"
  }
  ```

---

## Announcement Routes

### List Announcements
- **URL:** `GET /api/announcements`

### Create Announcement
- **URL:** `POST /api/announcements`
- **Body:**
  ```json
  {
    "title": "Title",
    "content": "Content",
    "target": "all",
    "priority": "high",
    "publishedAt": "2026-01-01 09:00:00"
  }
  ```

---

## Expense Routes

### List Expenses
- **URL:** `GET /api/expenses`

### Create Expense
- **URL:** `POST /api/expenses`
- **Body:**
  ```json
  {
    "category": "travel",
    "amount": 5000,
    "expenseDate": "2026-01-15",
    "description": "Client meeting",
    "projectId": 1
  }
  ```

### Update Expense Status
- **URL:** `PUT /api/expenses/:id/status`
- **Body:**
  ```json
  {
    "status": "approved"
  }
  ```

---

## Timesheet Routes

### List Timesheets
- **URL:** `GET /api/timesheets`

### Create Timesheet
- **URL:** `POST /api/timesheets`
- **Body:**
  ```json
  {
    "projectId": 1,
    "taskId": 1,
    "workDate": "2026-01-15",
    "durationMinutes": 480,
    "description": "Development work"
  }
  ```

---

## Notification Routes

### List Notifications
- **URL:** `GET /api/notifications`

### Mark as Read
- **URL:** `PATCH /api/notifications/:id/read`

### Mark All as Read
- **URL:** `POST /api/notifications/read-all`

### Delete Notification
- **URL:** `DELETE /api/notifications/:id`

---

## Audit Log Routes

### List Audit Logs
- **URL:** `GET /api/audit-logs`

### Create Audit Log
- **URL:** `POST /api/audit-logs`

### Get Modules
- **URL:** `GET /api/audit-logs/modules`

### Get Actions
- **URL:** `GET /api/audit-logs/actions`

### Export Audit Logs
- **URL:** `GET /api/audit-logs/export?startDate=2026-01-01&endDate=2026-01-31`

### Get Audit Log
- **URL:** `GET /api/audit-logs/:id`

---

## Document Routes

### List Documents
- **URL:** `GET /api/documents`

### Upload Document
- **URL:** `POST /api/documents`
- **Body:** FormData with file

### Delete Document
- **URL:** `DELETE /api/documents/:id`

---

## Role Routes

### List Roles
- **URL:** `GET /api/roles`

### Create Role
- **URL:** `POST /api/roles`
- **Body:**
  ```json
  {
    "roleName": "Manager"
  }
  ```

### Update Role
- **URL:** `PUT /api/roles/:id`

### Get Permissions
- **URL:** `GET /api/roles/permissions`

---

## Face Recognition Routes

### Register Face
- **URL:** `POST /api/face/register`
- **Body:**
  ```json
  {
    "image": "base64..."
  }
  ```

### Verify Face
- **URL:** `POST /api/face/verify`
- **Body:**
  ```json
  {
    "image": "base64..."
  }
  ```

### Get Face Status
- **URL:** `GET /api/face/status/:id`

### Delete Face
- **URL:** `DELETE /api/face/:id`

---

## Public Invitation Routes

### Get Invitation by Token
- **URL:** `GET /api/invitations/:token`

### Respond to Invitation
- **URL:** `POST /api/invitations/:token/respond`
- **Body:**
  ```json
  {
    "action": "accept",
    "password": "password123"
  }
  ```

---

## Notes

- All dates should be in format: `YYYY-MM-DD`
- All datetime should be in format: `YYYY-MM-DD HH:MM:SS`
- Token should be included in header: `Authorization: Bearer <token>`
- For file uploads, use `FormData`
