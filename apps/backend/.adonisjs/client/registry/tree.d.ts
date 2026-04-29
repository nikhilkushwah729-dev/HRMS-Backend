/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  countries: {
    index: typeof routes['countries.index']
  }
  orgRegistration: {
    register: typeof routes['org_registration.register']
    verifyEmail: typeof routes['org_registration.verify_email']
  }
  auth: {
    login: typeof routes['auth.login']
    verifyOtp: typeof routes['auth.verify_otp']
    checkIdentifier: typeof routes['auth.check_identifier']
    requestEmailOtp: typeof routes['auth.request_email_otp']
    verifyEmailOtp: typeof routes['auth.verify_email_otp']
    loginWithVerifiedEmail: typeof routes['auth.login_with_verified_email']
    forgotPassword: typeof routes['auth.forgot_password']
    resetPassword: typeof routes['auth.reset_password']
    logout: typeof routes['auth.logout']
    me: typeof routes['auth.me']
  }
  socialAuth: {
    redirectToGoogle: typeof routes['social_auth.redirect_to_google']
    handleGoogleCallback: typeof routes['social_auth.handle_google_callback']
    redirectToMicrosoft: typeof routes['social_auth.redirect_to_microsoft']
    handleMicrosoftCallback: typeof routes['social_auth.handle_microsoft_callback']
    requestPhoneOtp: typeof routes['social_auth.request_phone_otp']
    verifyPhoneOtp: typeof routes['social_auth.verify_phone_otp']
    resendPhoneOtp: typeof routes['social_auth.resend_phone_otp']
    enablePhoneAuth: typeof routes['social_auth.enable_phone_auth']
    disablePhoneAuth: typeof routes['social_auth.disable_phone_auth']
    linkSocialAccount: typeof routes['social_auth.link_social_account']
  }
  organizations: {
    show: typeof routes['organizations.show']
    update: typeof routes['organizations.update']
    getDepartments: typeof routes['organizations.get_departments']
    storeDepartment: typeof routes['organizations.store_department']
    updateDepartment: typeof routes['organizations.update_department']
    destroyDepartment: typeof routes['organizations.destroy_department']
    getDesignations: typeof routes['organizations.get_designations']
    storeDesignation: typeof routes['organizations.store_designation']
    updateDesignation: typeof routes['organizations.update_designation']
    destroyDesignation: typeof routes['organizations.destroy_designation']
    getSettingCollection: typeof routes['organizations.get_setting_collection']
    saveSettingCollection: typeof routes['organizations.save_setting_collection']
    getAddons: typeof routes['organizations.get_addons']
    toggleAddon: typeof routes['organizations.toggle_addon']
  }
  holidays: {
    index: typeof routes['holidays.index']
    store: typeof routes['holidays.store']
    update: typeof routes['holidays.update']
    destroy: typeof routes['holidays.destroy']
  }
  platform: {
    overview: typeof routes['platform.overview']
  }
  employees: {
    myTeam: typeof routes['employees.my_team']
    index: typeof routes['employees.index']
    store: typeof routes['employees.store']
    occasions: typeof routes['employees.occasions']
    show: typeof routes['employees.show']
    update: typeof routes['employees.update']
    destroy: typeof routes['employees.destroy']
    updateGeofence: typeof routes['employees.update_geofence']
    getGeofence: typeof routes['employees.get_geofence']
    removeGeofence: typeof routes['employees.remove_geofence']
    setKioskPin: typeof routes['employees.set_kiosk_pin']
    resetKioskPin: typeof routes['employees.reset_kiosk_pin']
  }
  kiosks: {
    register: typeof routes['kiosks.register']
    validate: typeof routes['kiosks.validate']
    index: typeof routes['kiosks.index']
    show: typeof routes['kiosks.show']
    approve: typeof routes['kiosks.approve']
    block: typeof routes['kiosks.block']
    toggle: typeof routes['kiosks.toggle']
    resetToken: typeof routes['kiosks.reset_token']
  }
  kioskAttendance: {
    markFace: typeof routes['kiosk_attendance.mark_face']
    markPin: typeof routes['kiosk_attendance.mark_pin']
    markQr: typeof routes['kiosk_attendance.mark_qr']
    offlineSync: typeof routes['kiosk_attendance.offline_sync']
    logs: typeof routes['kiosk_attendance.logs']
  }
  faceProfiles: {
    create: typeof routes['face_profiles.create']
    pending: typeof routes['face_profiles.pending']
    approve: typeof routes['face_profiles.approve']
    reject: typeof routes['face_profiles.reject']
  }
  employeeInvitations: {
    invite: typeof routes['employee_invitations.invite']
    list: typeof routes['employee_invitations.list']
    revoke: typeof routes['employee_invitations.revoke']
    resend: typeof routes['employee_invitations.resend']
    getByToken: typeof routes['employee_invitations.get_by_token']
    validate: typeof routes['employee_invitations.validate']
    respond: typeof routes['employee_invitations.respond']
  }
  subscriptions: {
    listPlans: typeof routes['subscriptions.list_plans']
    razorpayWebhook: typeof routes['subscriptions.razorpay_webhook']
    stripeWebhook: typeof routes['subscriptions.stripe_webhook']
    legacyInvoice: typeof routes['subscriptions.legacy_invoice']
    getStatus: typeof routes['subscriptions.get_status']
    createUpgradeIntent: typeof routes['subscriptions.create_upgrade_intent']
    verifyPayment: typeof routes['subscriptions.verify_payment']
    getLegacyContext: typeof routes['subscriptions.get_legacy_context']
    legacyPurchase: typeof routes['subscriptions.legacy_purchase']
    legacyConfirm: typeof routes['subscriptions.legacy_confirm']
  }
  attendances: {
    checkIn: typeof routes['attendances.check_in']
    checkOut: typeof routes['attendances.check_out']
    history: typeof routes['attendances.history']
    getToday: typeof routes['attendances.get_today']
    startBreak: typeof routes['attendances.start_break']
    endBreak: typeof routes['attendances.end_break']
    getTodayBreaks: typeof routes['attendances.get_today_breaks']
    getStats: typeof routes['attendances.get_stats']
    getMonthly: typeof routes['attendances.get_monthly']
    requestManual: typeof routes['attendances.request_manual']
    getManualRequests: typeof routes['attendances.get_manual_requests']
    processManual: typeof routes['attendances.process_manual']
    requestOvertime: typeof routes['attendances.request_overtime']
    getOvertime: typeof routes['attendances.get_overtime']
    validateLocation: typeof routes['attendances.validate_location']
    getZones: typeof routes['attendances.get_zones']
    createZone: typeof routes['attendances.create_zone']
    updateZone: typeof routes['attendances.update_zone']
    deleteZone: typeof routes['attendances.delete_zone']
    getGeoFenceSettings: typeof routes['attendances.get_geo_fence_settings']
    updateGeoFenceSettings: typeof routes['attendances.update_geo_fence_settings']
    getAll: typeof routes['attendances.get_all']
    getTodayAll: typeof routes['attendances.get_today_all']
    getShifts: typeof routes['attendances.get_shifts']
    createShift: typeof routes['attendances.create_shift']
    updateShift: typeof routes['attendances.update_shift']
    deleteShift: typeof routes['attendances.delete_shift']
  }
  regularizations: {
    index: typeof routes['regularizations.index']
    store: typeof routes['regularizations.store']
    update: typeof routes['regularizations.update']
  }
  tracking: {
    update: typeof routes['tracking.update']
    history: typeof routes['tracking.history']
    current: typeof routes['tracking.current']
  }
  leaves: {
    index: typeof routes['leaves.index']
    dashboard: typeof routes['leaves.dashboard']
    getTypes: typeof routes['leaves.get_types']
    createType: typeof routes['leaves.create_type']
    updateType: typeof routes['leaves.update_type']
    destroyType: typeof routes['leaves.destroy_type']
    store: typeof routes['leaves.store']
    update: typeof routes['leaves.update']
    updateStatus: typeof routes['leaves.update_status']
    getBalances: typeof routes['leaves.get_balances']
    adjustBalance: typeof routes['leaves.adjust_balance']
  }
  leaveTypesAlias: typeof routes['leave_types_alias']
  payrolls: {
    index: typeof routes['payrolls.index']
    store: typeof routes['payrolls.store']
    process: typeof routes['payrolls.process']
  }
  projects: {
    index: typeof routes['projects.index']
    store: typeof routes['projects.store']
    tasks: typeof routes['projects.tasks']
    storeTask: typeof routes['projects.store_task']
  }
  announcements: {
    index: typeof routes['announcements.index']
    show: typeof routes['announcements.show']
    store: typeof routes['announcements.store']
    update: typeof routes['announcements.update']
  }
  expenses: {
    index: typeof routes['expenses.index']
    store: typeof routes['expenses.store']
    updateStatus: typeof routes['expenses.update_status']
  }
  timesheets: {
    index: typeof routes['timesheets.index']
    store: typeof routes['timesheets.store']
    reports: typeof routes['timesheets.reports']
    approvalIndex: typeof routes['timesheets.approval_index']
    bulkApprovalAction: typeof routes['timesheets.bulk_approval_action']
    approvalDetail: typeof routes['timesheets.approval_detail']
    approvalAction: typeof routes['timesheets.approval_action']
    show: typeof routes['timesheets.show']
    update: typeof routes['timesheets.update']
    submit: typeof routes['timesheets.submit']
  }
  visitManagement: {
    dashboard: typeof routes['visit_management.dashboard']
    references: typeof routes['visit_management.references']
    reports: typeof routes['visit_management.reports']
    exportReports: typeof routes['visit_management.export_reports']
    listClients: typeof routes['visit_management.list_clients']
    createClient: typeof routes['visit_management.create_client']
    updateClient: typeof routes['visit_management.update_client']
    listVisitors: typeof routes['visit_management.list_visitors']
    createVisitor: typeof routes['visit_management.create_visitor']
    updateVisitor: typeof routes['visit_management.update_visitor']
    index: typeof routes['visit_management.index']
    store: typeof routes['visit_management.store']
    show: typeof routes['visit_management.show']
    update: typeof routes['visit_management.update']
    review: typeof routes['visit_management.review']
    checkIn: typeof routes['visit_management.check_in']
    checkOut: typeof routes['visit_management.check_out']
    addNote: typeof routes['visit_management.add_note']
    addFollowUp: typeof routes['visit_management.add_follow_up']
    updateFollowUp: typeof routes['visit_management.update_follow_up']
  }
  notifications: {
    index: typeof routes['notifications.index']
    markAsRead: typeof routes['notifications.mark_as_read']
    markAllAsRead: typeof routes['notifications.mark_all_as_read']
    destroy: typeof routes['notifications.destroy']
  }
  employeeSelfService: {
    dashboard: typeof routes['employee_self_service.dashboard']
    listRequests: typeof routes['employee_self_service.list_requests']
    createRequest: typeof routes['employee_self_service.create_request']
    cancelRequest: typeof routes['employee_self_service.cancel_request']
    profileAudit: typeof routes['employee_self_service.profile_audit']
    loginActivity: typeof routes['employee_self_service.login_activity']
    kioskQrToken: typeof routes['employee_self_service.kiosk_qr_token']
    changePassword: typeof routes['employee_self_service.change_password']
    approvalQueue: typeof routes['employee_self_service.approval_queue']
    bulkApprovalAction: typeof routes['employee_self_service.bulk_approval_action']
    approvalDetail: typeof routes['employee_self_service.approval_detail']
    approvalAction: typeof routes['employee_self_service.approval_action']
  }
  auditLogs: {
    index: typeof routes['audit_logs.index']
    store: typeof routes['audit_logs.store']
    getModules: typeof routes['audit_logs.get_modules']
    getActions: typeof routes['audit_logs.get_actions']
    export: typeof routes['audit_logs.export']
    show: typeof routes['audit_logs.show']
  }
  documents: {
    index: typeof routes['documents.index']
    store: typeof routes['documents.store']
    download: typeof routes['documents.download']
    destroy: typeof routes['documents.destroy']
  }
  roles: {
    index: typeof routes['roles.index']
    store: typeof routes['roles.store']
    getPermissions: typeof routes['roles.get_permissions']
    show: typeof routes['roles.show']
    update: typeof routes['roles.update']
    destroy: typeof routes['roles.destroy']
  }
  employeeExperiences: {
    index: typeof routes['employee_experiences.index']
    store: typeof routes['employee_experiences.store']
    update: typeof routes['employee_experiences.update']
    destroy: typeof routes['employee_experiences.destroy']
  }
  employeeEducations: {
    index: typeof routes['employee_educations.index']
    store: typeof routes['employee_educations.store']
    update: typeof routes['employee_educations.update']
    destroy: typeof routes['employee_educations.destroy']
  }
  faceRecognition: {
    register: typeof routes['face_recognition.register']
    verify: typeof routes['face_recognition.verify']
    status: typeof routes['face_recognition.status']
    delete: typeof routes['face_recognition.delete']
  }
  reports: {
    getDailyReport: typeof routes['reports.get_daily_report']
    getMonthlyReport: typeof routes['reports.get_monthly_report']
    getAttendanceReport: typeof routes['reports.get_attendance_report']
    getAttendanceDashboard: typeof routes['reports.get_attendance_dashboard']
    getLateArrivals: typeof routes['reports.get_late_arrivals']
    getAbsentReport: typeof routes['reports.get_absent_report']
    getSummary: typeof routes['reports.get_summary']
    getWeeklyAttendance: typeof routes['reports.get_weekly_attendance']
    getDepartmentWiseAttendance: typeof routes['reports.get_department_wise_attendance']
    exportExcel: typeof routes['reports.export_excel']
    exportPdf: typeof routes['reports.export_pdf']
  }
}
