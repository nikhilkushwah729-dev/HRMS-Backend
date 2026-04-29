/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractQuery, ExtractQueryForGet, ExtractResponse } from '@tuyau/core/types'
import type { InferInput } from '@vinejs/vine/types'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
  'countries.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/auth/countries'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/CountriesController').default['index']>>>
    }
  }
  'org_registration.register': {
    methods: ["POST"]
    pattern: '/api/auth/register'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/org_registration_controller').default)['registerValidator']>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#controllers/org_registration_controller').default)['registerValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/org_registration_controller').default['register']>>>
    }
  }
  'org_registration.verify_email': {
    methods: ["GET","HEAD"]
    pattern: '/api/auth/verify-email'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/org_registration_controller').default['verifyEmail']>>>
    }
  }
  'auth.login': {
    methods: ["POST"]
    pattern: '/api/auth/login'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/AuthController').default)['loginValidator']>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/AuthController').default)['loginValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/AuthController').default['login']>>>
    }
  }
  'auth.verify_otp': {
    methods: ["POST"]
    pattern: '/api/auth/verify-otp'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/AuthController').default)['verifyOtpValidator']>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/AuthController').default)['verifyOtpValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/AuthController').default['verifyOtp']>>>
    }
  }
  'auth.check_identifier': {
    methods: ["POST"]
    pattern: '/api/auth/check-identifier'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/AuthController').default)['checkIdentifierValidator']>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/AuthController').default)['checkIdentifierValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/AuthController').default['checkIdentifier']>>>
    }
  }
  'auth.request_email_otp': {
    methods: ["POST"]
    pattern: '/api/auth/request-email-otp'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/AuthController').default)['requestEmailOtpValidator']>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/AuthController').default)['requestEmailOtpValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/AuthController').default['requestEmailOtp']>>>
    }
  }
  'auth.verify_email_otp': {
    methods: ["POST"]
    pattern: '/api/auth/verify-email-otp'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/AuthController').default)['verifyEmailOtpValidator']>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/AuthController').default)['verifyEmailOtpValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/AuthController').default['verifyEmailOtp']>>>
    }
  }
  'auth.login_with_verified_email': {
    methods: ["POST"]
    pattern: '/api/auth/login-with-verified-email'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/AuthController').default)['loginWithVerifiedEmailValidator']>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/AuthController').default)['loginWithVerifiedEmailValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/AuthController').default['loginWithVerifiedEmail']>>>
    }
  }
  'auth.forgot_password': {
    methods: ["POST"]
    pattern: '/api/auth/forgot-password'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/AuthController').default['forgotPassword']>>>
    }
  }
  'auth.reset_password': {
    methods: ["POST"]
    pattern: '/api/auth/reset-password'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/AuthController').default['resetPassword']>>>
    }
  }
  'auth.logout': {
    methods: ["POST"]
    pattern: '/api/auth/logout'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/AuthController').default['logout']>>>
    }
  }
  'auth.me': {
    methods: ["GET","HEAD"]
    pattern: '/api/auth/me'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/AuthController').default['me']>>>
    }
  }
  'social_auth.redirect_to_google': {
    methods: ["GET","HEAD"]
    pattern: '/api/auth/google'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/SocialAuthController').default['redirectToGoogle']>>>
    }
  }
  'social_auth.handle_google_callback': {
    methods: ["GET","HEAD"]
    pattern: '/api/auth/google/callback'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/SocialAuthController').default['handleGoogleCallback']>>>
    }
  }
  'social_auth.redirect_to_microsoft': {
    methods: ["GET","HEAD"]
    pattern: '/api/auth/microsoft'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/SocialAuthController').default['redirectToMicrosoft']>>>
    }
  }
  'social_auth.handle_microsoft_callback': {
    methods: ["GET","HEAD"]
    pattern: '/api/auth/microsoft/callback'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/SocialAuthController').default['handleMicrosoftCallback']>>>
    }
  }
  'social_auth.request_phone_otp': {
    methods: ["POST"]
    pattern: '/api/auth/phone/request-otp'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/SocialAuthController').default['requestPhoneOtp']>>>
    }
  }
  'social_auth.verify_phone_otp': {
    methods: ["POST"]
    pattern: '/api/auth/phone/verify'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/SocialAuthController').default['verifyPhoneOtp']>>>
    }
  }
  'social_auth.resend_phone_otp': {
    methods: ["POST"]
    pattern: '/api/auth/phone/resend'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/SocialAuthController').default['resendPhoneOtp']>>>
    }
  }
  'social_auth.enable_phone_auth': {
    methods: ["POST"]
    pattern: '/api/auth/phone/enable'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/SocialAuthController').default['enablePhoneAuth']>>>
    }
  }
  'social_auth.disable_phone_auth': {
    methods: ["POST"]
    pattern: '/api/auth/phone/disable'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/SocialAuthController').default['disablePhoneAuth']>>>
    }
  }
  'social_auth.link_social_account': {
    methods: ["POST"]
    pattern: '/api/auth/social/link'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/SocialAuthController').default['linkSocialAccount']>>>
    }
  }
  'organizations.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/organization'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/OrganizationsController').default['show']>>>
    }
  }
  'organizations.update': {
    methods: ["PUT"]
    pattern: '/api/organization'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/OrganizationsController').default)['orgValidator']>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/OrganizationsController').default)['orgValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/OrganizationsController').default['update']>>>
    }
  }
  'organizations.get_departments': {
    methods: ["GET","HEAD"]
    pattern: '/api/organization/departments'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/OrganizationsController').default['getDepartments']>>>
    }
  }
  'organizations.store_department': {
    methods: ["POST"]
    pattern: '/api/organization/departments'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/OrganizationsController').default)['departmentValidator']>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/OrganizationsController').default)['departmentValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/OrganizationsController').default['storeDepartment']>>>
    }
  }
  'organizations.update_department': {
    methods: ["PUT"]
    pattern: '/api/organization/departments/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/OrganizationsController').default)['departmentValidator']>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/OrganizationsController').default)['departmentValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/OrganizationsController').default['updateDepartment']>>>
    }
  }
  'organizations.destroy_department': {
    methods: ["DELETE"]
    pattern: '/api/organization/departments/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/OrganizationsController').default['destroyDepartment']>>>
    }
  }
  'organizations.get_designations': {
    methods: ["GET","HEAD"]
    pattern: '/api/organization/designations'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/OrganizationsController').default['getDesignations']>>>
    }
  }
  'organizations.store_designation': {
    methods: ["POST"]
    pattern: '/api/organization/designations'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/OrganizationsController').default)['designationValidator']>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/OrganizationsController').default)['designationValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/OrganizationsController').default['storeDesignation']>>>
    }
  }
  'organizations.update_designation': {
    methods: ["PUT"]
    pattern: '/api/organization/designations/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/OrganizationsController').default)['designationValidator']>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/OrganizationsController').default)['designationValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/OrganizationsController').default['updateDesignation']>>>
    }
  }
  'organizations.destroy_designation': {
    methods: ["DELETE"]
    pattern: '/api/organization/designations/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/OrganizationsController').default['destroyDesignation']>>>
    }
  }
  'organizations.get_setting_collection': {
    methods: ["GET","HEAD"]
    pattern: '/api/organization/settings/:key'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { key: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/OrganizationsController').default['getSettingCollection']>>>
    }
  }
  'organizations.save_setting_collection': {
    methods: ["PUT"]
    pattern: '/api/organization/settings/:key'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { key: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/OrganizationsController').default['saveSettingCollection']>>>
    }
  }
  'holidays.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/organization/holidays'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/HolidaysController').default['index']>>>
    }
  }
  'holidays.store': {
    methods: ["POST"]
    pattern: '/api/organization/holidays'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/HolidaysController').default)['holidayValidator']>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/HolidaysController').default)['holidayValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/HolidaysController').default['store']>>>
    }
  }
  'holidays.update': {
    methods: ["PUT"]
    pattern: '/api/organization/holidays/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/HolidaysController').default)['holidayValidator']>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/HolidaysController').default)['holidayValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/HolidaysController').default['update']>>>
    }
  }
  'holidays.destroy': {
    methods: ["DELETE"]
    pattern: '/api/organization/holidays/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/HolidaysController').default['destroy']>>>
    }
  }
  'organizations.get_addons': {
    methods: ["GET","HEAD"]
    pattern: '/api/organization/addons'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/OrganizationsController').default['getAddons']>>>
    }
  }
  'organizations.toggle_addon': {
    methods: ["POST"]
    pattern: '/api/organization/addons/toggle'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/OrganizationsController').default['toggleAddon']>>>
    }
  }
  'platform.overview': {
    methods: ["GET","HEAD"]
    pattern: '/api/platform/overview'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/PlatformController').default['overview']>>>
    }
  }
  'employees.my_team': {
    methods: ["GET","HEAD"]
    pattern: '/api/employees/my-team'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/EmployeesController').default['myTeam']>>>
    }
  }
  'kiosks.register': {
    methods: ["POST"]
    pattern: '/api/kiosks/register'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/kiosk').registerKioskValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/kiosk').registerKioskValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/KiosksController').default['register']>>>
    }
  }
  'kiosks.validate': {
    methods: ["POST"]
    pattern: '/api/kiosks/validate'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/kiosk').validateKioskValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/kiosk').validateKioskValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/KiosksController').default['validate']>>>
    }
  }
  'kiosks.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/kiosks'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/KiosksController').default['index']>>>
    }
  }
  'kiosks.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/kiosks/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/KiosksController').default['show']>>>
    }
  }
  'kiosks.approve': {
    methods: ["PATCH"]
    pattern: '/api/kiosks/:id/approve'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/kiosk').kioskApprovalValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/kiosk').kioskApprovalValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/KiosksController').default['approve']>>>
    }
  }
  'kiosks.block': {
    methods: ["PATCH"]
    pattern: '/api/kiosks/:id/block'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/KiosksController').default['block']>>>
    }
  }
  'kiosks.toggle': {
    methods: ["PATCH"]
    pattern: '/api/kiosks/:id/toggle'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/KiosksController').default['toggle']>>>
    }
  }
  'kiosks.reset_token': {
    methods: ["PATCH"]
    pattern: '/api/kiosks/:id/reset-token'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/KiosksController').default['resetToken']>>>
    }
  }
  'kiosk_attendance.mark_face': {
    methods: ["POST"]
    pattern: '/api/kiosk/attendance/face'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/kiosk').faceAttendanceValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/kiosk').faceAttendanceValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/KioskAttendanceController').default['markFace']>>>
    }
  }
  'kiosk_attendance.mark_pin': {
    methods: ["POST"]
    pattern: '/api/kiosk/attendance/pin'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/kiosk').pinAttendanceValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/kiosk').pinAttendanceValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/KioskAttendanceController').default['markPin']>>>
    }
  }
  'kiosk_attendance.mark_qr': {
    methods: ["POST"]
    pattern: '/api/kiosk/attendance/qr'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/kiosk').qrAttendanceValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/kiosk').qrAttendanceValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/KioskAttendanceController').default['markQr']>>>
    }
  }
  'kiosk_attendance.offline_sync': {
    methods: ["POST"]
    pattern: '/api/kiosk/offline-sync'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/kiosk').offlineSyncValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/kiosk').offlineSyncValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/KioskAttendanceController').default['offlineSync']>>>
    }
  }
  'kiosk_attendance.logs': {
    methods: ["GET","HEAD"]
    pattern: '/api/kiosk/attendance/logs'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/KioskAttendanceController').default['logs']>>>
    }
  }
  'face_profiles.create': {
    methods: ["POST"]
    pattern: '/api/employees/:id/face-profile'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/kiosk').faceProfileValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/kiosk').faceProfileValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/FaceProfilesController').default['create']>>>
    }
  }
  'face_profiles.pending': {
    methods: ["GET","HEAD"]
    pattern: '/api/face-profiles/pending'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/FaceProfilesController').default['pending']>>>
    }
  }
  'face_profiles.approve': {
    methods: ["PATCH"]
    pattern: '/api/face-profiles/:id/approve'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/FaceProfilesController').default['approve']>>>
    }
  }
  'face_profiles.reject': {
    methods: ["PATCH"]
    pattern: '/api/face-profiles/:id/reject'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/FaceProfilesController').default['reject']>>>
    }
  }
  'employees.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/employees'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/EmployeesController').default['index']>>>
    }
  }
  'employees.store': {
    methods: ["POST"]
    pattern: '/api/employees'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/EmployeesController').default)['employeeValidator']>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/EmployeesController').default)['employeeValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/EmployeesController').default['store']>>>
    }
  }
  'employees.occasions': {
    methods: ["GET","HEAD"]
    pattern: '/api/employees/occasions'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/EmployeesController').default['occasions']>>>
    }
  }
  'employee_invitations.invite': {
    methods: ["POST"]
    pattern: '/api/employees/invite'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/EmployeeInvitationsController').default)['inviteValidator']>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/EmployeeInvitationsController').default)['inviteValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/EmployeeInvitationsController').default['invite']>>>
    }
  }
  'employee_invitations.list': {
    methods: ["GET","HEAD"]
    pattern: '/api/employees/invitations'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/EmployeeInvitationsController').default['list']>>>
    }
  }
  'employee_invitations.revoke': {
    methods: ["POST"]
    pattern: '/api/employees/invitations/:id/revoke'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/EmployeeInvitationsController').default['revoke']>>>
    }
  }
  'employee_invitations.resend': {
    methods: ["POST"]
    pattern: '/api/employees/invitations/:id/resend'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/EmployeeInvitationsController').default['resend']>>>
    }
  }
  'employees.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/employees/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/EmployeesController').default['show']>>>
    }
  }
  'employees.update': {
    methods: ["PUT"]
    pattern: '/api/employees/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/EmployeesController').default)['employeeValidator']>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/EmployeesController').default)['employeeValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/EmployeesController').default['update']>>>
    }
  }
  'employees.destroy': {
    methods: ["DELETE"]
    pattern: '/api/employees/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/EmployeesController').default['destroy']>>>
    }
  }
  'employees.update_geofence': {
    methods: ["PUT"]
    pattern: '/api/employees/:id/geofence'
    types: {
      body: ExtractBody<InferInput<(typeof import('@vinejs/vine').default)['compile']>|InferInput<(typeof import('@vinejs/vine').default)['object']>|InferInput<(typeof import('@vinejs/vine').default)['number()']['nullable']>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('@vinejs/vine').default)['compile']>|InferInput<(typeof import('@vinejs/vine').default)['object']>|InferInput<(typeof import('@vinejs/vine').default)['number()']['nullable']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/EmployeesController').default['updateGeofence']>>>
    }
  }
  'employees.get_geofence': {
    methods: ["GET","HEAD"]
    pattern: '/api/employees/:id/geofence'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/EmployeesController').default['getGeofence']>>>
    }
  }
  'employees.remove_geofence': {
    methods: ["DELETE"]
    pattern: '/api/employees/:id/geofence'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/EmployeesController').default['removeGeofence']>>>
    }
  }
  'employees.set_kiosk_pin': {
    methods: ["POST"]
    pattern: '/api/employees/:id/kiosk-pin'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/EmployeesController').default)['kioskPinValidator']>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/EmployeesController').default)['kioskPinValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/EmployeesController').default['setKioskPin']>>>
    }
  }
  'employees.reset_kiosk_pin': {
    methods: ["DELETE"]
    pattern: '/api/employees/:id/kiosk-pin'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/EmployeesController').default['resetKioskPin']>>>
    }
  }
  'subscriptions.list_plans': {
    methods: ["GET","HEAD"]
    pattern: '/api/billing/plans'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/SubscriptionsController').default['listPlans']>>>
    }
  }
  'subscriptions.razorpay_webhook': {
    methods: ["POST"]
    pattern: '/api/billing/webhooks/razorpay'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/SubscriptionsController').default['razorpayWebhook']>>>
    }
  }
  'subscriptions.stripe_webhook': {
    methods: ["POST"]
    pattern: '/api/billing/webhooks/stripe'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/SubscriptionsController').default['stripeWebhook']>>>
    }
  }
  'subscriptions.legacy_invoice': {
    methods: ["GET","HEAD"]
    pattern: '/api/billing/legacy/invoice'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/SubscriptionsController').default['legacyInvoice']>>>
    }
  }
  'subscriptions.get_status': {
    methods: ["GET","HEAD"]
    pattern: '/api/billing/status'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/SubscriptionsController').default['getStatus']>>>
    }
  }
  'subscriptions.create_upgrade_intent': {
    methods: ["POST"]
    pattern: '/api/billing/upgrade-intent'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/SubscriptionsController').default)['upgradeValidator']>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/SubscriptionsController').default)['upgradeValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/SubscriptionsController').default['createUpgradeIntent']>>>
    }
  }
  'subscriptions.verify_payment': {
    methods: ["POST"]
    pattern: '/api/billing/verify-payment'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/SubscriptionsController').default)['verifyValidator']>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/SubscriptionsController').default)['verifyValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/SubscriptionsController').default['verifyPayment']>>>
    }
  }
  'subscriptions.get_legacy_context': {
    methods: ["GET","HEAD"]
    pattern: '/api/billing/legacy/context'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/SubscriptionsController').default['getLegacyContext']>>>
    }
  }
  'subscriptions.legacy_purchase': {
    methods: ["POST"]
    pattern: '/api/billing/legacy/purchase'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/SubscriptionsController').default)['legacyPurchaseValidator']>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/SubscriptionsController').default)['legacyPurchaseValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/SubscriptionsController').default['legacyPurchase']>>>
    }
  }
  'subscriptions.legacy_confirm': {
    methods: ["POST"]
    pattern: '/api/billing/legacy/confirm'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/SubscriptionsController').default)['legacyConfirmValidator']>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/SubscriptionsController').default)['legacyConfirmValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/SubscriptionsController').default['legacyConfirm']>>>
    }
  }
  'attendances.check_in': {
    methods: ["POST"]
    pattern: '/api/attendance/check-in'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/AttendancesController').default)['checkInValidator']>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/AttendancesController').default)['checkInValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/AttendancesController').default['checkIn']>>>
    }
  }
  'attendances.check_out': {
    methods: ["POST"]
    pattern: '/api/attendance/check-out'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/AttendancesController').default)['checkOutValidator']>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/AttendancesController').default)['checkOutValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/AttendancesController').default['checkOut']>>>
    }
  }
  'attendances.history': {
    methods: ["GET","HEAD"]
    pattern: '/api/attendance/history'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/AttendancesController').default['history']>>>
    }
  }
  'attendances.get_today': {
    methods: ["GET","HEAD"]
    pattern: '/api/attendance/today'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/AttendancesController').default['getToday']>>>
    }
  }
  'attendances.start_break': {
    methods: ["POST"]
    pattern: '/api/attendance/break/start'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/AttendancesController').default['startBreak']>>>
    }
  }
  'attendances.end_break': {
    methods: ["POST"]
    pattern: '/api/attendance/break/end'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/AttendancesController').default['endBreak']>>>
    }
  }
  'attendances.get_today_breaks': {
    methods: ["GET","HEAD"]
    pattern: '/api/attendance/breaks/today'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/AttendancesController').default['getTodayBreaks']>>>
    }
  }
  'attendances.get_stats': {
    methods: ["GET","HEAD"]
    pattern: '/api/attendance/stats'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/AttendancesController').default['getStats']>>>
    }
  }
  'attendances.get_monthly': {
    methods: ["GET","HEAD"]
    pattern: '/api/attendance/monthly'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/AttendancesController').default['getMonthly']>>>
    }
  }
  'attendances.request_manual': {
    methods: ["POST"]
    pattern: '/api/attendance/manual/request'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/AttendancesController').default)['manualAttendanceValidator']>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/AttendancesController').default)['manualAttendanceValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/AttendancesController').default['requestManual']>>>
    }
  }
  'attendances.get_manual_requests': {
    methods: ["GET","HEAD"]
    pattern: '/api/attendance/manual/requests'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/AttendancesController').default['getManualRequests']>>>
    }
  }
  'attendances.process_manual': {
    methods: ["POST"]
    pattern: '/api/attendance/manual/process'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/AttendancesController').default)['processManualValidator']>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/AttendancesController').default)['processManualValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/AttendancesController').default['processManual']>>>
    }
  }
  'attendances.request_overtime': {
    methods: ["POST"]
    pattern: '/api/attendance/overtime/request'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/AttendancesController').default)['overtimeValidator']>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/AttendancesController').default)['overtimeValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/AttendancesController').default['requestOvertime']>>>
    }
  }
  'attendances.get_overtime': {
    methods: ["GET","HEAD"]
    pattern: '/api/attendance/overtime'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/AttendancesController').default['getOvertime']>>>
    }
  }
  'attendances.validate_location': {
    methods: ["GET","HEAD"]
    pattern: '/api/attendance/validate-location'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/AttendancesController').default['validateLocation']>>>
    }
  }
  'attendances.get_zones': {
    methods: ["GET","HEAD"]
    pattern: '/api/attendance/zones'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/AttendancesController').default['getZones']>>>
    }
  }
  'attendances.create_zone': {
    methods: ["POST"]
    pattern: '/api/attendance/zones'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/AttendancesController').default)['geoFenceZoneValidator']>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/AttendancesController').default)['geoFenceZoneValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/AttendancesController').default['createZone']>>>
    }
  }
  'attendances.update_zone': {
    methods: ["PUT"]
    pattern: '/api/attendance/zones/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/AttendancesController').default)['geoFenceZoneValidator']>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/AttendancesController').default)['geoFenceZoneValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/AttendancesController').default['updateZone']>>>
    }
  }
  'attendances.delete_zone': {
    methods: ["DELETE"]
    pattern: '/api/attendance/zones/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/AttendancesController').default['deleteZone']>>>
    }
  }
  'attendances.get_geo_fence_settings': {
    methods: ["GET","HEAD"]
    pattern: '/api/attendance/geofence-settings'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/AttendancesController').default['getGeoFenceSettings']>>>
    }
  }
  'attendances.update_geo_fence_settings': {
    methods: ["PUT"]
    pattern: '/api/attendance/geofence-settings'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/AttendancesController').default)['geoFenceSettingsValidator']>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/AttendancesController').default)['geoFenceSettingsValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/AttendancesController').default['updateGeoFenceSettings']>>>
    }
  }
  'attendances.get_all': {
    methods: ["GET","HEAD"]
    pattern: '/api/attendance/all'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/AttendancesController').default['getAll']>>>
    }
  }
  'attendances.get_today_all': {
    methods: ["GET","HEAD"]
    pattern: '/api/attendance/all/today'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/AttendancesController').default['getTodayAll']>>>
    }
  }
  'attendances.get_shifts': {
    methods: ["GET","HEAD"]
    pattern: '/api/attendance/shifts'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/AttendancesController').default['getShifts']>>>
    }
  }
  'attendances.create_shift': {
    methods: ["POST"]
    pattern: '/api/attendance/shifts'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/AttendancesController').default)['shiftValidator']>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/AttendancesController').default)['shiftValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/AttendancesController').default['createShift']>>>
    }
  }
  'attendances.update_shift': {
    methods: ["PUT"]
    pattern: '/api/attendance/shifts/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/AttendancesController').default)['shiftValidator']>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/AttendancesController').default)['shiftValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/AttendancesController').default['updateShift']>>>
    }
  }
  'attendances.delete_shift': {
    methods: ["DELETE"]
    pattern: '/api/attendance/shifts/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/AttendancesController').default['deleteShift']>>>
    }
  }
  'regularizations.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/regularizations'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/RegularizationsController').default['index']>>>
    }
  }
  'regularizations.store': {
    methods: ["POST"]
    pattern: '/api/regularizations'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/RegularizationsController').default)['submitValidator']>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/RegularizationsController').default)['submitValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/RegularizationsController').default['store']>>>
    }
  }
  'regularizations.update': {
    methods: ["PUT"]
    pattern: '/api/regularizations/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/RegularizationsController').default)['processValidator']>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/RegularizationsController').default)['processValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/RegularizationsController').default['update']>>>
    }
  }
  'tracking.update': {
    methods: ["POST"]
    pattern: '/api/tracking/update'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/TrackingController').default)['updateValidator']>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/TrackingController').default)['updateValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/TrackingController').default['update']>>>
    }
  }
  'tracking.history': {
    methods: ["GET","HEAD"]
    pattern: '/api/tracking/history'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/TrackingController').default['history']>>>
    }
  }
  'tracking.current': {
    methods: ["GET","HEAD"]
    pattern: '/api/tracking/current'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/TrackingController').default['current']>>>
    }
  }
  'leaves.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/leaves'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/LeavesController').default['index']>>>
    }
  }
  'leaves.dashboard': {
    methods: ["GET","HEAD"]
    pattern: '/api/leaves/dashboard'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/LeavesController').default['dashboard']>>>
    }
  }
  'leaves.get_types': {
    methods: ["GET","HEAD"]
    pattern: '/api/leaves/types'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/LeavesController').default['getTypes']>>>
    }
  }
  'leaves.create_type': {
    methods: ["POST"]
    pattern: '/api/leaves/types'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/LeavesController').default)['leaveTypeValidator']>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/LeavesController').default)['leaveTypeValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/LeavesController').default['createType']>>>
    }
  }
  'leaves.update_type': {
    methods: ["PUT"]
    pattern: '/api/leaves/types/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/LeavesController').default)['leaveTypeValidator']>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/LeavesController').default)['leaveTypeValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/LeavesController').default['updateType']>>>
    }
  }
  'leaves.destroy_type': {
    methods: ["DELETE"]
    pattern: '/api/leaves/types/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/LeavesController').default['destroyType']>>>
    }
  }
  'leaves.store': {
    methods: ["POST"]
    pattern: '/api/leaves'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/LeavesController').default)['leaveValidator']>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/LeavesController').default)['leaveValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/LeavesController').default['store']>>>
    }
  }
  'leaves.update': {
    methods: ["PUT"]
    pattern: '/api/leaves/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/LeavesController').default)['leaveValidator']>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/LeavesController').default)['leaveValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/LeavesController').default['update']>>>
    }
  }
  'leaves.update_status': {
    methods: ["PUT"]
    pattern: '/api/leaves/:id/status'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/LeavesController').default)['statusValidator']>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/LeavesController').default)['statusValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/LeavesController').default['updateStatus']>>>
    }
  }
  'leave_types_alias': {
    methods: ["GET","HEAD"]
    pattern: '/api/leave-types'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/LeavesController').default['getTypes']>>>
    }
  }
  'payrolls.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/payroll'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/PayrollsController').default['index']>>>
    }
  }
  'payrolls.store': {
    methods: ["POST"]
    pattern: '/api/payroll'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/PayrollsController').default)['payrollValidator']>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/PayrollsController').default)['payrollValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/PayrollsController').default['process']>>>
    }
  }
  'payrolls.process': {
    methods: ["POST"]
    pattern: '/api/payroll/process'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/PayrollsController').default)['payrollValidator']>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/PayrollsController').default)['payrollValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/PayrollsController').default['process']>>>
    }
  }
  'projects.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/projects'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/ProjectsController').default['index']>>>
    }
  }
  'projects.store': {
    methods: ["POST"]
    pattern: '/api/projects'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/ProjectsController').default)['projectValidator']>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/ProjectsController').default)['projectValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/ProjectsController').default['store']>>>
    }
  }
  'projects.tasks': {
    methods: ["GET","HEAD"]
    pattern: '/api/projects/:id/tasks'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/ProjectsController').default['tasks']>>>
    }
  }
  'projects.store_task': {
    methods: ["POST"]
    pattern: '/api/projects/:id/tasks'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/ProjectsController').default)['taskValidator']>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/ProjectsController').default)['taskValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/ProjectsController').default['storeTask']>>>
    }
  }
  'announcements.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/announcements'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/AnnouncementsController').default['index']>>>
    }
  }
  'announcements.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/announcements/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/AnnouncementsController').default['show']>>>
    }
  }
  'announcements.store': {
    methods: ["POST"]
    pattern: '/api/announcements'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/AnnouncementsController').default)['announcementValidator']>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/AnnouncementsController').default)['announcementValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/AnnouncementsController').default['store']>>>
    }
  }
  'announcements.update': {
    methods: ["PUT"]
    pattern: '/api/announcements/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('@vinejs/vine').default)['compile']>|InferInput<(typeof import('@vinejs/vine').default)['object']>|InferInput<(typeof import('@vinejs/vine').default)['string()']['maxLength(200)']['optional']>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('@vinejs/vine').default)['compile']>|InferInput<(typeof import('@vinejs/vine').default)['object']>|InferInput<(typeof import('@vinejs/vine').default)['string()']['maxLength(200)']['optional']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/AnnouncementsController').default['update']>>>
    }
  }
  'expenses.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/expenses'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/ExpensesController').default['index']>>>
    }
  }
  'expenses.store': {
    methods: ["POST"]
    pattern: '/api/expenses'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/ExpensesController').default)['expenseValidator']>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/ExpensesController').default)['expenseValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/ExpensesController').default['store']>>>
    }
  }
  'expenses.update_status': {
    methods: ["PUT"]
    pattern: '/api/expenses/:id/status'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/ExpensesController').default)['statusValidator']>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/ExpensesController').default)['statusValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/ExpensesController').default['updateStatus']>>>
    }
  }
  'timesheets.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/timesheets'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/TimesheetsController').default['index']>>>
    }
  }
  'timesheets.store': {
    methods: ["POST"]
    pattern: '/api/timesheets'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/TimesheetsController').default)['upsertValidator']>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/TimesheetsController').default)['upsertValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/TimesheetsController').default['store']>>>
    }
  }
  'timesheets.reports': {
    methods: ["GET","HEAD"]
    pattern: '/api/timesheets/reports'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/TimesheetsController').default['reports']>>>
    }
  }
  'timesheets.approval_index': {
    methods: ["GET","HEAD"]
    pattern: '/api/timesheets/approvals'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/TimesheetsController').default['approvalIndex']>>>
    }
  }
  'timesheets.bulk_approval_action': {
    methods: ["POST"]
    pattern: '/api/timesheets/approvals/bulk-action'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/TimesheetsController').default)['bulkApprovalActionValidator']>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/TimesheetsController').default)['bulkApprovalActionValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/TimesheetsController').default['bulkApprovalAction']>>>
    }
  }
  'timesheets.approval_detail': {
    methods: ["GET","HEAD"]
    pattern: '/api/timesheets/approvals/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/TimesheetsController').default['approvalDetail']>>>
    }
  }
  'timesheets.approval_action': {
    methods: ["POST"]
    pattern: '/api/timesheets/approvals/:id/action'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/TimesheetsController').default)['approvalActionValidator']>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/TimesheetsController').default)['approvalActionValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/TimesheetsController').default['approvalAction']>>>
    }
  }
  'timesheets.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/timesheets/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/TimesheetsController').default['show']>>>
    }
  }
  'timesheets.update': {
    methods: ["PUT"]
    pattern: '/api/timesheets/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/TimesheetsController').default)['upsertValidator']>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/TimesheetsController').default)['upsertValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/TimesheetsController').default['update']>>>
    }
  }
  'timesheets.submit': {
    methods: ["POST"]
    pattern: '/api/timesheets/:id/submit'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/TimesheetsController').default['submit']>>>
    }
  }
  'visit_management.dashboard': {
    methods: ["GET","HEAD"]
    pattern: '/api/visits/dashboard'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/VisitManagementController').default['dashboard']>>>
    }
  }
  'visit_management.references': {
    methods: ["GET","HEAD"]
    pattern: '/api/visits/references'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/VisitManagementController').default['references']>>>
    }
  }
  'visit_management.reports': {
    methods: ["GET","HEAD"]
    pattern: '/api/visits/reports'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/VisitManagementController').default['reports']>>>
    }
  }
  'visit_management.export_reports': {
    methods: ["GET","HEAD"]
    pattern: '/api/visits/reports/export'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/VisitManagementController').default['exportReports']>>>
    }
  }
  'visit_management.list_clients': {
    methods: ["GET","HEAD"]
    pattern: '/api/visits/clients'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/VisitManagementController').default['listClients']>>>
    }
  }
  'visit_management.create_client': {
    methods: ["POST"]
    pattern: '/api/visits/clients'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/VisitManagementController').default)['clientValidator']>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/VisitManagementController').default)['clientValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/VisitManagementController').default['createClient']>>>
    }
  }
  'visit_management.update_client': {
    methods: ["PUT"]
    pattern: '/api/visits/clients/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/VisitManagementController').default)['clientValidator']>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/VisitManagementController').default)['clientValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/VisitManagementController').default['updateClient']>>>
    }
  }
  'visit_management.list_visitors': {
    methods: ["GET","HEAD"]
    pattern: '/api/visits/visitors'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/VisitManagementController').default['listVisitors']>>>
    }
  }
  'visit_management.create_visitor': {
    methods: ["POST"]
    pattern: '/api/visits/visitors'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/VisitManagementController').default)['visitorValidator']>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/VisitManagementController').default)['visitorValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/VisitManagementController').default['createVisitor']>>>
    }
  }
  'visit_management.update_visitor': {
    methods: ["PUT"]
    pattern: '/api/visits/visitors/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/VisitManagementController').default)['visitorValidator']>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/VisitManagementController').default)['visitorValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/VisitManagementController').default['updateVisitor']>>>
    }
  }
  'visit_management.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/visits'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/VisitManagementController').default['index']>>>
    }
  }
  'visit_management.store': {
    methods: ["POST"]
    pattern: '/api/visits'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/VisitManagementController').default)['visitValidator']>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/VisitManagementController').default)['visitValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/VisitManagementController').default['store']>>>
    }
  }
  'visit_management.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/visits/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/VisitManagementController').default['show']>>>
    }
  }
  'visit_management.update': {
    methods: ["PUT"]
    pattern: '/api/visits/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/VisitManagementController').default)['visitValidator']>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/VisitManagementController').default)['visitValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/VisitManagementController').default['update']>>>
    }
  }
  'visit_management.review': {
    methods: ["POST"]
    pattern: '/api/visits/:id/review'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/VisitManagementController').default)['reviewValidator']>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/VisitManagementController').default)['reviewValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/VisitManagementController').default['review']>>>
    }
  }
  'visit_management.check_in': {
    methods: ["POST"]
    pattern: '/api/visits/:id/check-in'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/VisitManagementController').default)['checkFlowValidator']>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/VisitManagementController').default)['checkFlowValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/VisitManagementController').default['checkIn']>>>
    }
  }
  'visit_management.check_out': {
    methods: ["POST"]
    pattern: '/api/visits/:id/check-out'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/VisitManagementController').default)['checkFlowValidator']>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/VisitManagementController').default)['checkFlowValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/VisitManagementController').default['checkOut']>>>
    }
  }
  'visit_management.add_note': {
    methods: ["POST"]
    pattern: '/api/visits/:id/notes'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/VisitManagementController').default)['noteValidator']>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/VisitManagementController').default)['noteValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/VisitManagementController').default['addNote']>>>
    }
  }
  'visit_management.add_follow_up': {
    methods: ["POST"]
    pattern: '/api/visits/:id/follow-ups'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/VisitManagementController').default)['followUpValidator']>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/VisitManagementController').default)['followUpValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/VisitManagementController').default['addFollowUp']>>>
    }
  }
  'visit_management.update_follow_up': {
    methods: ["PUT"]
    pattern: '/api/visits/follow-ups/:followUpId'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/VisitManagementController').default)['followUpValidator']>>
      paramsTuple: [ParamValue]
      params: { followUpId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/VisitManagementController').default)['followUpValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/VisitManagementController').default['updateFollowUp']>>>
    }
  }
  'notifications.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/notifications'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/NotificationsController').default['index']>>>
    }
  }
  'notifications.mark_as_read': {
    methods: ["PATCH"]
    pattern: '/api/notifications/:id/read'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/NotificationsController').default['markAsRead']>>>
    }
  }
  'notifications.mark_all_as_read': {
    methods: ["POST"]
    pattern: '/api/notifications/read-all'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/NotificationsController').default['markAllAsRead']>>>
    }
  }
  'notifications.destroy': {
    methods: ["DELETE"]
    pattern: '/api/notifications/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/NotificationsController').default['destroy']>>>
    }
  }
  'employee_self_service.dashboard': {
    methods: ["GET","HEAD"]
    pattern: '/api/ess/dashboard'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/EmployeeSelfServiceController').default['dashboard']>>>
    }
  }
  'employee_self_service.list_requests': {
    methods: ["GET","HEAD"]
    pattern: '/api/ess/requests'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/EmployeeSelfServiceController').default['listRequests']>>>
    }
  }
  'employee_self_service.create_request': {
    methods: ["POST"]
    pattern: '/api/ess/requests'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/EmployeeSelfServiceController').default)['requestValidator']>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/EmployeeSelfServiceController').default)['requestValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/EmployeeSelfServiceController').default['createRequest']>>>
    }
  }
  'employee_self_service.cancel_request': {
    methods: ["POST"]
    pattern: '/api/ess/requests/:id/cancel'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/EmployeeSelfServiceController').default['cancelRequest']>>>
    }
  }
  'employee_self_service.profile_audit': {
    methods: ["GET","HEAD"]
    pattern: '/api/ess/profile-audit'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/EmployeeSelfServiceController').default['profileAudit']>>>
    }
  }
  'employee_self_service.login_activity': {
    methods: ["GET","HEAD"]
    pattern: '/api/ess/login-activity'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/EmployeeSelfServiceController').default['loginActivity']>>>
    }
  }
  'employee_self_service.kiosk_qr_token': {
    methods: ["GET","HEAD"]
    pattern: '/api/ess/kiosk-qr'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/EmployeeSelfServiceController').default['kioskQrToken']>>>
    }
  }
  'employee_self_service.change_password': {
    methods: ["POST"]
    pattern: '/api/ess/change-password'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/EmployeeSelfServiceController').default)['passwordValidator']>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/EmployeeSelfServiceController').default)['passwordValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/EmployeeSelfServiceController').default['changePassword']>>>
    }
  }
  'employee_self_service.approval_queue': {
    methods: ["GET","HEAD"]
    pattern: '/api/approval-center'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/EmployeeSelfServiceController').default['approvalQueue']>>>
    }
  }
  'employee_self_service.bulk_approval_action': {
    methods: ["POST"]
    pattern: '/api/approval-center/bulk-action'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/EmployeeSelfServiceController').default)['bulkApprovalActionValidator']>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/EmployeeSelfServiceController').default)['bulkApprovalActionValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/EmployeeSelfServiceController').default['bulkApprovalAction']>>>
    }
  }
  'employee_self_service.approval_detail': {
    methods: ["GET","HEAD"]
    pattern: '/api/approval-center/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/EmployeeSelfServiceController').default['approvalDetail']>>>
    }
  }
  'employee_self_service.approval_action': {
    methods: ["POST"]
    pattern: '/api/approval-center/:id/action'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/EmployeeSelfServiceController').default)['approvalActionValidator']>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/EmployeeSelfServiceController').default)['approvalActionValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/EmployeeSelfServiceController').default['approvalAction']>>>
    }
  }
  'audit_logs.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/audit-logs'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/AuditLogsController').default['index']>>>
    }
  }
  'audit_logs.store': {
    methods: ["POST"]
    pattern: '/api/audit-logs'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/AuditLogsController').default['store']>>>
    }
  }
  'audit_logs.get_modules': {
    methods: ["GET","HEAD"]
    pattern: '/api/audit-logs/modules'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/AuditLogsController').default['getModules']>>>
    }
  }
  'audit_logs.get_actions': {
    methods: ["GET","HEAD"]
    pattern: '/api/audit-logs/actions'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/AuditLogsController').default['getActions']>>>
    }
  }
  'audit_logs.export': {
    methods: ["GET","HEAD"]
    pattern: '/api/audit-logs/export'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/AuditLogsController').default['export']>>>
    }
  }
  'audit_logs.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/audit-logs/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/AuditLogsController').default['show']>>>
    }
  }
  'documents.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/documents'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/DocumentsController').default['index']>>>
    }
  }
  'documents.store': {
    methods: ["POST"]
    pattern: '/api/documents'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/DocumentsController').default)['documentValidator']>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/DocumentsController').default)['documentValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/DocumentsController').default['store']>>>
    }
  }
  'documents.download': {
    methods: ["GET","HEAD"]
    pattern: '/api/documents/:id/download'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/DocumentsController').default['download']>>>
    }
  }
  'documents.destroy': {
    methods: ["DELETE"]
    pattern: '/api/documents/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/DocumentsController').default['destroy']>>>
    }
  }
  'roles.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/roles'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/RolesController').default['index']>>>
    }
  }
  'roles.store': {
    methods: ["POST"]
    pattern: '/api/roles'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/RolesController').default)['roleValidator']>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/RolesController').default)['roleValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/RolesController').default['store']>>>
    }
  }
  'roles.get_permissions': {
    methods: ["GET","HEAD"]
    pattern: '/api/roles/permissions'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/RolesController').default['getPermissions']>>>
    }
  }
  'roles.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/roles/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/RolesController').default['show']>>>
    }
  }
  'roles.update': {
    methods: ["PUT"]
    pattern: '/api/roles/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/RolesController').default)['roleValidator']>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/RolesController').default)['roleValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/RolesController').default['update']>>>
    }
  }
  'roles.destroy': {
    methods: ["DELETE"]
    pattern: '/api/roles/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/RolesController').default['destroy']>>>
    }
  }
  'employee_experiences.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/experiences'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/EmployeeExperiencesController').default['index']>>>
    }
  }
  'employee_experiences.store': {
    methods: ["POST"]
    pattern: '/api/experiences'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/EmployeeExperiencesController').default)['validator']>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/EmployeeExperiencesController').default)['validator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/EmployeeExperiencesController').default['store']>>>
    }
  }
  'employee_experiences.update': {
    methods: ["PUT"]
    pattern: '/api/experiences/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/EmployeeExperiencesController').default)['validator']>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/EmployeeExperiencesController').default)['validator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/EmployeeExperiencesController').default['update']>>>
    }
  }
  'employee_experiences.destroy': {
    methods: ["DELETE"]
    pattern: '/api/experiences/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/EmployeeExperiencesController').default['destroy']>>>
    }
  }
  'employee_educations.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/education'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/EmployeeEducationsController').default['index']>>>
    }
  }
  'employee_educations.store': {
    methods: ["POST"]
    pattern: '/api/education'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/EmployeeEducationsController').default)['validator']>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/EmployeeEducationsController').default)['validator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/EmployeeEducationsController').default['store']>>>
    }
  }
  'employee_educations.update': {
    methods: ["PUT"]
    pattern: '/api/education/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/EmployeeEducationsController').default)['validator']>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/EmployeeEducationsController').default)['validator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/EmployeeEducationsController').default['update']>>>
    }
  }
  'employee_educations.destroy': {
    methods: ["DELETE"]
    pattern: '/api/education/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/EmployeeEducationsController').default['destroy']>>>
    }
  }
  'face_recognition.register': {
    methods: ["POST"]
    pattern: '/api/face/register'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/FaceRecognitionController').default)['registerFaceValidator']>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/FaceRecognitionController').default)['registerFaceValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/FaceRecognitionController').default['register']>>>
    }
  }
  'face_recognition.verify': {
    methods: ["POST"]
    pattern: '/api/face/verify'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/FaceRecognitionController').default)['verifyFaceValidator']>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/FaceRecognitionController').default)['verifyFaceValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/FaceRecognitionController').default['verify']>>>
    }
  }
  'face_recognition.status': {
    methods: ["GET","HEAD"]
    pattern: '/api/face/status/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/FaceRecognitionController').default['status']>>>
    }
  }
  'face_recognition.delete': {
    methods: ["DELETE"]
    pattern: '/api/face/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/FaceRecognitionController').default['delete']>>>
    }
  }
  'employee_invitations.get_by_token': {
    methods: ["GET","HEAD"]
    pattern: '/api/invitations/:token'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { token: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/EmployeeInvitationsController').default['getByToken']>>>
    }
  }
  'employee_invitations.validate': {
    methods: ["GET","HEAD"]
    pattern: '/api/invitations/:token/validate'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { token: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/EmployeeInvitationsController').default['validate']>>>
    }
  }
  'employee_invitations.respond': {
    methods: ["POST"]
    pattern: '/api/invitations/:token/respond'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/EmployeeInvitationsController').default)['respondValidator']>>
      paramsTuple: [ParamValue]
      params: { token: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/EmployeeInvitationsController').default)['respondValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/EmployeeInvitationsController').default['respond']>>>
    }
  }
  'leaves.get_balances': {
    methods: ["GET","HEAD"]
    pattern: '/api/leaves/balances'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/LeavesController').default['getBalances']>>>
    }
  }
  'leaves.adjust_balance': {
    methods: ["POST"]
    pattern: '/api/leaves/balances/adjust'
    types: {
      body: ExtractBody<InferInput<(typeof import('#controllers/Http/LeavesController').default)['balanceValidator']>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#controllers/Http/LeavesController').default)['balanceValidator']>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/LeavesController').default['adjustBalance']>>>
    }
  }
  'reports.get_daily_report': {
    methods: ["GET","HEAD"]
    pattern: '/api/reports/daily'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/ReportsController').default['getDailyReport']>>>
    }
  }
  'reports.get_monthly_report': {
    methods: ["GET","HEAD"]
    pattern: '/api/reports/monthly'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/ReportsController').default['getMonthlyReport']>>>
    }
  }
  'reports.get_attendance_report': {
    methods: ["GET","HEAD"]
    pattern: '/api/reports/attendance'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/ReportsController').default['getAttendanceReport']>>>
    }
  }
  'reports.get_attendance_dashboard': {
    methods: ["GET","HEAD"]
    pattern: '/api/reports/attendance-dashboard'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/ReportsController').default['getAttendanceDashboard']>>>
    }
  }
  'reports.get_late_arrivals': {
    methods: ["GET","HEAD"]
    pattern: '/api/reports/late'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/ReportsController').default['getLateArrivals']>>>
    }
  }
  'reports.get_absent_report': {
    methods: ["GET","HEAD"]
    pattern: '/api/reports/absent'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/ReportsController').default['getAbsentReport']>>>
    }
  }
  'reports.get_summary': {
    methods: ["GET","HEAD"]
    pattern: '/api/reports/summary'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/ReportsController').default['getSummary']>>>
    }
  }
  'reports.get_weekly_attendance': {
    methods: ["GET","HEAD"]
    pattern: '/api/reports/weekly'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/ReportsController').default['getWeeklyAttendance']>>>
    }
  }
  'reports.get_department_wise_attendance': {
    methods: ["GET","HEAD"]
    pattern: '/api/reports/by-department'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/ReportsController').default['getDepartmentWiseAttendance']>>>
    }
  }
  'reports.export_excel': {
    methods: ["GET","HEAD"]
    pattern: '/api/reports/export/excel'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/ReportsController').default['exportExcel']>>>
    }
  }
  'reports.export_pdf': {
    methods: ["GET","HEAD"]
    pattern: '/api/reports/export/pdf'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/Http/ReportsController').default['exportPdf']>>>
    }
  }
}
