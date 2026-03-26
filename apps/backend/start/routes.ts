import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

// Controllers
const AuthController = () => import('#controllers/Http/AuthController')
const OrganizationsController = () => import('#controllers/Http/OrganizationsController')
const EmployeesController = () => import('#controllers/Http/EmployeesController')
const AttendancesController = () => import('#controllers/Http/AttendancesController')
const LeavesController = () => import('#controllers/Http/LeavesController')
const NotificationsController = () => import('#controllers/Http/NotificationsController')
const DocumentsController = () => import('#controllers/Http/DocumentsController')
const RolesController = () => import('#controllers/Http/RolesController')

router.get('/', async () => {
  return { status: 'online', version: '1.0.0' }
})

/**
 * Authentication Routes
 */
const OrgRegistrationController = () => import('#controllers/org_registration_controller')
const SocialAuthController = () => import('#controllers/Http/SocialAuthController')
const CountriesController = () => import('#controllers/Http/CountriesController')

router.group(() => {
  router.get('countries', [CountriesController, 'index'])
  router.post('register', [OrgRegistrationController, 'register'])
  router.get('verify-email', [OrgRegistrationController, 'verifyEmail'])
  router.post('login', [AuthController, 'login'])
  router.post('verify-otp', [AuthController, 'verifyOtp'])
  router.post('check-identifier', [AuthController, 'checkIdentifier'])

  // New email-first login flow endpoints
  router.post('request-email-otp', [AuthController, 'requestEmailOtp'])
  router.post('verify-email-otp', [AuthController, 'verifyEmailOtp'])
  router.post('login-with-verified-email', [AuthController, 'loginWithVerifiedEmail'])

  router.post('forgot-password', [AuthController, 'forgotPassword'])
  router.post('reset-password', [AuthController, 'resetPassword'])
  router.post('logout', [AuthController, 'logout']).use(middleware.auth())
  router.get('me', [AuthController, 'me']).use(middleware.auth())

  // OAuth Routes
  router.get('google', [SocialAuthController, 'redirectToGoogle'])
  router.get('google/callback', [SocialAuthController, 'handleGoogleCallback'])
  router.get('microsoft', [SocialAuthController, 'redirectToMicrosoft'])
  router.get('microsoft/callback', [SocialAuthController, 'handleMicrosoftCallback'])

  // Phone OTP Routes
  router.post('phone/request-otp', [SocialAuthController, 'requestPhoneOtp'])
  router.post('phone/verify', [SocialAuthController, 'verifyPhoneOtp'])
  router.post('phone/resend', [SocialAuthController, 'resendPhoneOtp'])
  router.post('phone/enable', [SocialAuthController, 'enablePhoneAuth']).use(middleware.auth())
  router.post('phone/disable', [SocialAuthController, 'disablePhoneAuth']).use(middleware.auth())

  // Social Account Linking
  router.post('social/link', [SocialAuthController, 'linkSocialAccount']).use(middleware.auth())
}).prefix('api/auth')

/**
 * Organization Routes
 */
router.group(() => {
  router.get('/', [OrganizationsController, 'show'])
  router.put('/', [OrganizationsController, 'update'])
  router.get('departments', [OrganizationsController, 'getDepartments'])
  router.post('departments', [OrganizationsController, 'storeDepartment'])
  router.get('designations', [OrganizationsController, 'getDesignations'])
  router.post('designations', [OrganizationsController, 'storeDesignation'])
  router.get('addons', [OrganizationsController, 'getAddons'])
  router.post('addons/toggle', [OrganizationsController, 'toggleAddon'])
}).prefix('api/organization').use(middleware.auth())

/**
 * Employee Management Routes
 */
router.group(() => {
  router.get('/', [EmployeesController, 'index'])
  router.post('/', [EmployeesController, 'store'])
  router.get(':id', [EmployeesController, 'show'])
  router.put(':id', [EmployeesController, 'update'])
  router.delete(':id', [EmployeesController, 'destroy'])

  // Employee Geofence Management
  router.put(':id/geofence', [EmployeesController, 'updateGeofence'])
  router.get(':id/geofence', [EmployeesController, 'getGeofence'])
  router.delete(':id/geofence', [EmployeesController, 'removeGeofence'])
}).prefix('api/employees').use(middleware.auth())

/**
 * Attendance & Tracking Routes
 */
router.group(() => {
  router.post('check-in', [AttendancesController, 'checkIn'])
  router.post('check-out', [AttendancesController, 'checkOut'])
  router.get('history', [AttendancesController, 'history'])

  // Today's attendance
  router.get('today', [AttendancesController, 'getToday'])

  // Break management
  router.post('break/start', [AttendancesController, 'startBreak'])
  router.post('break/end', [AttendancesController, 'endBreak'])
  router.get('breaks/today', [AttendancesController, 'getTodayBreaks'])

  // Statistics
  router.get('stats', [AttendancesController, 'getStats'])
  router.get('monthly', [AttendancesController, 'getMonthly'])

  // Manual attendance
  router.post('manual/request', [AttendancesController, 'requestManual'])
  router.get('manual/requests', [AttendancesController, 'getManualRequests'])
  router.post('manual/process', [AttendancesController, 'processManual'])

  // Overtime
  router.post('overtime/request', [AttendancesController, 'requestOvertime'])
  router.get('overtime', [AttendancesController, 'getOvertime'])

  // Geo-fencing
  router.get('validate-location', [AttendancesController, 'validateLocation'])
  router.get('zones', [AttendancesController, 'getZones'])

  // Admin views
  router.get('all', [AttendancesController, 'getAll'])
  router.get('all/today', [AttendancesController, 'getTodayAll'])

  // Shifts
  router.get('shifts', [AttendancesController, 'getShifts'])
}).prefix('api/attendance').use(middleware.auth())

const RegularizationsController = () => import('#controllers/Http/RegularizationsController')

router.group(() => {
  router.get('/', [RegularizationsController, 'index'])
  router.post('/', [RegularizationsController, 'store'])
  router.put('/:id', [RegularizationsController, 'update'])
}).prefix('api/regularizations').use(middleware.auth())

/**
 * GPS Tracking Routes
 */
const TrackingController = () => import('#controllers/Http/TrackingController')
router.group(() => {
  router.post('update', [TrackingController, 'update'])
  router.get('history', [TrackingController, 'history'])
}).prefix('api/tracking').use(middleware.auth())

/**
 * Leave Management Routes
 */
router.group(() => {
  router.get('/', [LeavesController, 'index'])
  router.get('types', [LeavesController, 'getTypes'])
  router.post('/', [LeavesController, 'store'])
  router.put(':id/status', [LeavesController, 'updateStatus'])
}).prefix('api/leaves').use(middleware.auth())

// Backward-compatible alias for frontend path `/api/leave-types`
router.group(() => {
  router.get('/', [LeavesController, 'getTypes']).as('leave_types_alias')
}).prefix('api/leave-types').use(middleware.auth())

/**
 * Payroll Routes
 */
const PayrollsController = () => import('#controllers/Http/PayrollsController')

router.group(() => {
  router.get('/', [PayrollsController, 'index'])
  router.post('/', [PayrollsController, 'store'])
}).prefix('api/payroll').use(middleware.auth())

/**
 * Project Management Routes
 */
const ProjectsController = () => import('#controllers/Http/ProjectsController')

router.group(() => {
  router.get('/', [ProjectsController, 'index'])
  router.post('/', [ProjectsController, 'store'])
  router.get(':id/tasks', [ProjectsController, 'tasks'])
  router.post(':id/tasks', [ProjectsController, 'storeTask'])
}).prefix('api/projects').use(middleware.auth())

const AnnouncementsController = () => import('#controllers/Http/AnnouncementsController')

router.group(() => {
  router.get('/', [AnnouncementsController, 'index'])
  router.post('/', [AnnouncementsController, 'store'])
}).prefix('api/announcements').use(middleware.auth())

const ExpensesController = () => import('#controllers/Http/ExpensesController')

router.group(() => {
  router.get('/', [ExpensesController, 'index'])
  router.post('/', [ExpensesController, 'store'])
  router.put(':id/status', [ExpensesController, 'updateStatus'])
}).prefix('api/expenses').use(middleware.auth())

const TimesheetsController = () => import('#controllers/Http/TimesheetsController')

router.group(() => {
  router.get('/', [TimesheetsController, 'index'])
  router.post('/', [TimesheetsController, 'store'])
}).prefix('api/timesheets').use(middleware.auth())

// Notifications
router.group(() => {
  router.get('/', [NotificationsController, 'index'])
  router.patch('/:id/read', [NotificationsController, 'markAsRead'])
  router.post('/read-all', [NotificationsController, 'markAllAsRead'])
  router.delete('/:id', [NotificationsController, 'destroy'])
}).prefix('api/notifications').use(middleware.auth())

// Audit Logs
const AuditLogsController = () => import('#controllers/Http/AuditLogsController')
router.group(() => {
  router.get('/', [AuditLogsController, 'index'])
  router.post('/', [AuditLogsController, 'store'])
  router.get('/modules', [AuditLogsController, 'getModules'])
  router.get('/actions', [AuditLogsController, 'getActions'])
  router.get('/export', [AuditLogsController, 'export'])
  router.get('/:id', [AuditLogsController, 'show'])
}).prefix('api/audit-logs').use(middleware.auth())

// Documents
router.group(() => {
  router.get('/', [DocumentsController, 'index'])
  router.post('/', [DocumentsController, 'store'])
  router.delete('/:id', [DocumentsController, 'destroy'])
}).prefix('api/documents').use(middleware.auth())

// Roles & Permissions
router.group(() => {
  router.get('/', [RolesController, 'index'])
  router.post('/', [RolesController, 'store'])
  router.put('/:id', [RolesController, 'update'])
  router.get('/permissions', [RolesController, 'getPermissions'])
}).prefix('api/roles').use(middleware.auth())

/**
 * Face Recognition Routes
 */
const FaceRecognitionController = () => import('#controllers/Http/FaceRecognitionController')

router.group(() => {
  router.post('/register', [FaceRecognitionController, 'register'])
  router.post('/verify', [FaceRecognitionController, 'verify'])
  router.get('/status/:id', [FaceRecognitionController, 'status'])
  router.delete('/:id', [FaceRecognitionController, 'delete'])
}).prefix('api/face').use(middleware.auth())

/**
 * Employee Invitations Routes
 */
const EmployeeInvitationsController = () => import('#controllers/Http/EmployeeInvitationsController')

router.group(() => {
  router.post('/invite', [EmployeeInvitationsController, 'invite'])
  router.get('/invitations', [EmployeeInvitationsController, 'list'])
  router.post('/invitations/:id/revoke', [EmployeeInvitationsController, 'revoke'])
  router.post('/invitations/:id/resend', [EmployeeInvitationsController, 'resend'])
}).prefix('api/employees').use(middleware.auth())

// Public invitation routes
router.get('api/invitations/:token', [EmployeeInvitationsController, 'getByToken'])
router.post('api/invitations/:token/respond', [EmployeeInvitationsController, 'respond'])

/**
 * Leave Balances Routes
 */
router.group(() => {
  router.get('/balances', [LeavesController, 'getBalances'])
  router.post('/balances/adjust', [LeavesController, 'adjustBalance'])
}).prefix('api/leaves').use(middleware.auth())

/**
 * Reports Routes
 */
const ReportsController = () => import('#controllers/Http/ReportsController')
router.group(() => {
  router.get('/daily', [ReportsController, 'getDailyReport'])
  router.get('/monthly', [ReportsController, 'getMonthlyReport'])
  router.get('/attendance', [ReportsController, 'getAttendanceReport'])
  router.get('/late', [ReportsController, 'getLateArrivals'])
  router.get('/absent', [ReportsController, 'getAbsentReport'])
  router.get('/summary', [ReportsController, 'getSummary'])
  router.get('/weekly', [ReportsController, 'getWeeklyAttendance'])
  router.get('/by-department', [ReportsController, 'getDepartmentWiseAttendance'])
  router.get('/export/excel', [ReportsController, 'exportExcel'])
  router.get('/export/pdf', [ReportsController, 'exportPdf'])
}).prefix('api/reports').use(middleware.auth())
