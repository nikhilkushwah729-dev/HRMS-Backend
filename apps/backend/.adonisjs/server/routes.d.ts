import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'countries.index': { paramsTuple?: []; params?: {} }
    'org_registration.register': { paramsTuple?: []; params?: {} }
    'org_registration.verify_email': { paramsTuple?: []; params?: {} }
    'auth.login': { paramsTuple?: []; params?: {} }
    'auth.verify_otp': { paramsTuple?: []; params?: {} }
    'auth.check_identifier': { paramsTuple?: []; params?: {} }
    'auth.request_email_otp': { paramsTuple?: []; params?: {} }
    'auth.verify_email_otp': { paramsTuple?: []; params?: {} }
    'auth.login_with_verified_email': { paramsTuple?: []; params?: {} }
    'auth.forgot_password': { paramsTuple?: []; params?: {} }
    'auth.reset_password': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'auth.me': { paramsTuple?: []; params?: {} }
    'social_auth.redirect_to_google': { paramsTuple?: []; params?: {} }
    'social_auth.handle_google_callback': { paramsTuple?: []; params?: {} }
    'social_auth.redirect_to_microsoft': { paramsTuple?: []; params?: {} }
    'social_auth.handle_microsoft_callback': { paramsTuple?: []; params?: {} }
    'social_auth.request_phone_otp': { paramsTuple?: []; params?: {} }
    'social_auth.verify_phone_otp': { paramsTuple?: []; params?: {} }
    'social_auth.resend_phone_otp': { paramsTuple?: []; params?: {} }
    'social_auth.enable_phone_auth': { paramsTuple?: []; params?: {} }
    'social_auth.disable_phone_auth': { paramsTuple?: []; params?: {} }
    'social_auth.link_social_account': { paramsTuple?: []; params?: {} }
    'organizations.show': { paramsTuple?: []; params?: {} }
    'organizations.update': { paramsTuple?: []; params?: {} }
    'organizations.get_departments': { paramsTuple?: []; params?: {} }
    'organizations.store_department': { paramsTuple?: []; params?: {} }
    'organizations.get_addons': { paramsTuple?: []; params?: {} }
    'organizations.toggle_addon': { paramsTuple?: []; params?: {} }
    'employees.index': { paramsTuple?: []; params?: {} }
    'employees.store': { paramsTuple?: []; params?: {} }
    'employees.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employees.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employees.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employees.update_geofence': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employees.get_geofence': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employees.remove_geofence': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'attendances.check_in': { paramsTuple?: []; params?: {} }
    'attendances.check_out': { paramsTuple?: []; params?: {} }
    'attendances.history': { paramsTuple?: []; params?: {} }
    'attendances.get_today': { paramsTuple?: []; params?: {} }
    'attendances.start_break': { paramsTuple?: []; params?: {} }
    'attendances.end_break': { paramsTuple?: []; params?: {} }
    'attendances.get_today_breaks': { paramsTuple?: []; params?: {} }
    'attendances.get_stats': { paramsTuple?: []; params?: {} }
    'attendances.get_monthly': { paramsTuple?: []; params?: {} }
    'attendances.request_manual': { paramsTuple?: []; params?: {} }
    'attendances.get_manual_requests': { paramsTuple?: []; params?: {} }
    'attendances.process_manual': { paramsTuple?: []; params?: {} }
    'attendances.request_overtime': { paramsTuple?: []; params?: {} }
    'attendances.get_overtime': { paramsTuple?: []; params?: {} }
    'attendances.validate_location': { paramsTuple?: []; params?: {} }
    'attendances.get_zones': { paramsTuple?: []; params?: {} }
    'attendances.get_all': { paramsTuple?: []; params?: {} }
    'attendances.get_today_all': { paramsTuple?: []; params?: {} }
    'attendances.get_shifts': { paramsTuple?: []; params?: {} }
    'regularizations.index': { paramsTuple?: []; params?: {} }
    'regularizations.store': { paramsTuple?: []; params?: {} }
    'regularizations.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tracking.update': { paramsTuple?: []; params?: {} }
    'tracking.history': { paramsTuple?: []; params?: {} }
    'leaves.index': { paramsTuple?: []; params?: {} }
    'leaves.get_types': { paramsTuple?: []; params?: {} }
    'leaves.store': { paramsTuple?: []; params?: {} }
    'leaves.update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'leave_types_alias': { paramsTuple?: []; params?: {} }
    'payrolls.index': { paramsTuple?: []; params?: {} }
    'payrolls.store': { paramsTuple?: []; params?: {} }
    'projects.index': { paramsTuple?: []; params?: {} }
    'projects.store': { paramsTuple?: []; params?: {} }
    'projects.tasks': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'projects.store_task': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'announcements.index': { paramsTuple?: []; params?: {} }
    'announcements.store': { paramsTuple?: []; params?: {} }
    'expenses.index': { paramsTuple?: []; params?: {} }
    'expenses.store': { paramsTuple?: []; params?: {} }
    'expenses.update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'timesheets.index': { paramsTuple?: []; params?: {} }
    'timesheets.store': { paramsTuple?: []; params?: {} }
    'notifications.index': { paramsTuple?: []; params?: {} }
    'notifications.mark_as_read': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'notifications.mark_all_as_read': { paramsTuple?: []; params?: {} }
    'notifications.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'audit_logs.index': { paramsTuple?: []; params?: {} }
    'audit_logs.store': { paramsTuple?: []; params?: {} }
    'audit_logs.get_modules': { paramsTuple?: []; params?: {} }
    'audit_logs.get_actions': { paramsTuple?: []; params?: {} }
    'audit_logs.export': { paramsTuple?: []; params?: {} }
    'audit_logs.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'documents.index': { paramsTuple?: []; params?: {} }
    'documents.store': { paramsTuple?: []; params?: {} }
    'documents.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'roles.index': { paramsTuple?: []; params?: {} }
    'roles.store': { paramsTuple?: []; params?: {} }
    'roles.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'roles.get_permissions': { paramsTuple?: []; params?: {} }
    'face_recognition.register': { paramsTuple?: []; params?: {} }
    'face_recognition.verify': { paramsTuple?: []; params?: {} }
    'face_recognition.status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'face_recognition.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employee_invitations.invite': { paramsTuple?: []; params?: {} }
    'employee_invitations.list': { paramsTuple?: []; params?: {} }
    'employee_invitations.revoke': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employee_invitations.resend': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employee_invitations.get_by_token': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'employee_invitations.respond': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'leaves.get_balances': { paramsTuple?: []; params?: {} }
    'leaves.adjust_balance': { paramsTuple?: []; params?: {} }
    'reports.get_daily_report': { paramsTuple?: []; params?: {} }
    'reports.get_monthly_report': { paramsTuple?: []; params?: {} }
    'reports.get_attendance_report': { paramsTuple?: []; params?: {} }
    'reports.get_late_arrivals': { paramsTuple?: []; params?: {} }
    'reports.get_absent_report': { paramsTuple?: []; params?: {} }
    'reports.get_summary': { paramsTuple?: []; params?: {} }
    'reports.get_weekly_attendance': { paramsTuple?: []; params?: {} }
    'reports.get_department_wise_attendance': { paramsTuple?: []; params?: {} }
    'reports.export_excel': { paramsTuple?: []; params?: {} }
    'reports.export_pdf': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'countries.index': { paramsTuple?: []; params?: {} }
    'org_registration.verify_email': { paramsTuple?: []; params?: {} }
    'auth.me': { paramsTuple?: []; params?: {} }
    'social_auth.redirect_to_google': { paramsTuple?: []; params?: {} }
    'social_auth.handle_google_callback': { paramsTuple?: []; params?: {} }
    'social_auth.redirect_to_microsoft': { paramsTuple?: []; params?: {} }
    'social_auth.handle_microsoft_callback': { paramsTuple?: []; params?: {} }
    'organizations.show': { paramsTuple?: []; params?: {} }
    'organizations.get_departments': { paramsTuple?: []; params?: {} }
    'organizations.get_addons': { paramsTuple?: []; params?: {} }
    'employees.index': { paramsTuple?: []; params?: {} }
    'employees.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employees.get_geofence': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'attendances.history': { paramsTuple?: []; params?: {} }
    'attendances.get_today': { paramsTuple?: []; params?: {} }
    'attendances.get_today_breaks': { paramsTuple?: []; params?: {} }
    'attendances.get_stats': { paramsTuple?: []; params?: {} }
    'attendances.get_monthly': { paramsTuple?: []; params?: {} }
    'attendances.get_manual_requests': { paramsTuple?: []; params?: {} }
    'attendances.get_overtime': { paramsTuple?: []; params?: {} }
    'attendances.validate_location': { paramsTuple?: []; params?: {} }
    'attendances.get_zones': { paramsTuple?: []; params?: {} }
    'attendances.get_all': { paramsTuple?: []; params?: {} }
    'attendances.get_today_all': { paramsTuple?: []; params?: {} }
    'attendances.get_shifts': { paramsTuple?: []; params?: {} }
    'regularizations.index': { paramsTuple?: []; params?: {} }
    'tracking.history': { paramsTuple?: []; params?: {} }
    'leaves.index': { paramsTuple?: []; params?: {} }
    'leaves.get_types': { paramsTuple?: []; params?: {} }
    'leave_types_alias': { paramsTuple?: []; params?: {} }
    'payrolls.index': { paramsTuple?: []; params?: {} }
    'projects.index': { paramsTuple?: []; params?: {} }
    'projects.tasks': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'announcements.index': { paramsTuple?: []; params?: {} }
    'expenses.index': { paramsTuple?: []; params?: {} }
    'timesheets.index': { paramsTuple?: []; params?: {} }
    'notifications.index': { paramsTuple?: []; params?: {} }
    'audit_logs.index': { paramsTuple?: []; params?: {} }
    'audit_logs.get_modules': { paramsTuple?: []; params?: {} }
    'audit_logs.get_actions': { paramsTuple?: []; params?: {} }
    'audit_logs.export': { paramsTuple?: []; params?: {} }
    'audit_logs.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'documents.index': { paramsTuple?: []; params?: {} }
    'roles.index': { paramsTuple?: []; params?: {} }
    'roles.get_permissions': { paramsTuple?: []; params?: {} }
    'face_recognition.status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employee_invitations.list': { paramsTuple?: []; params?: {} }
    'employee_invitations.get_by_token': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'leaves.get_balances': { paramsTuple?: []; params?: {} }
    'reports.get_daily_report': { paramsTuple?: []; params?: {} }
    'reports.get_monthly_report': { paramsTuple?: []; params?: {} }
    'reports.get_attendance_report': { paramsTuple?: []; params?: {} }
    'reports.get_late_arrivals': { paramsTuple?: []; params?: {} }
    'reports.get_absent_report': { paramsTuple?: []; params?: {} }
    'reports.get_summary': { paramsTuple?: []; params?: {} }
    'reports.get_weekly_attendance': { paramsTuple?: []; params?: {} }
    'reports.get_department_wise_attendance': { paramsTuple?: []; params?: {} }
    'reports.export_excel': { paramsTuple?: []; params?: {} }
    'reports.export_pdf': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'countries.index': { paramsTuple?: []; params?: {} }
    'org_registration.verify_email': { paramsTuple?: []; params?: {} }
    'auth.me': { paramsTuple?: []; params?: {} }
    'social_auth.redirect_to_google': { paramsTuple?: []; params?: {} }
    'social_auth.handle_google_callback': { paramsTuple?: []; params?: {} }
    'social_auth.redirect_to_microsoft': { paramsTuple?: []; params?: {} }
    'social_auth.handle_microsoft_callback': { paramsTuple?: []; params?: {} }
    'organizations.show': { paramsTuple?: []; params?: {} }
    'organizations.get_departments': { paramsTuple?: []; params?: {} }
    'organizations.get_addons': { paramsTuple?: []; params?: {} }
    'employees.index': { paramsTuple?: []; params?: {} }
    'employees.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employees.get_geofence': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'attendances.history': { paramsTuple?: []; params?: {} }
    'attendances.get_today': { paramsTuple?: []; params?: {} }
    'attendances.get_today_breaks': { paramsTuple?: []; params?: {} }
    'attendances.get_stats': { paramsTuple?: []; params?: {} }
    'attendances.get_monthly': { paramsTuple?: []; params?: {} }
    'attendances.get_manual_requests': { paramsTuple?: []; params?: {} }
    'attendances.get_overtime': { paramsTuple?: []; params?: {} }
    'attendances.validate_location': { paramsTuple?: []; params?: {} }
    'attendances.get_zones': { paramsTuple?: []; params?: {} }
    'attendances.get_all': { paramsTuple?: []; params?: {} }
    'attendances.get_today_all': { paramsTuple?: []; params?: {} }
    'attendances.get_shifts': { paramsTuple?: []; params?: {} }
    'regularizations.index': { paramsTuple?: []; params?: {} }
    'tracking.history': { paramsTuple?: []; params?: {} }
    'leaves.index': { paramsTuple?: []; params?: {} }
    'leaves.get_types': { paramsTuple?: []; params?: {} }
    'leave_types_alias': { paramsTuple?: []; params?: {} }
    'payrolls.index': { paramsTuple?: []; params?: {} }
    'projects.index': { paramsTuple?: []; params?: {} }
    'projects.tasks': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'announcements.index': { paramsTuple?: []; params?: {} }
    'expenses.index': { paramsTuple?: []; params?: {} }
    'timesheets.index': { paramsTuple?: []; params?: {} }
    'notifications.index': { paramsTuple?: []; params?: {} }
    'audit_logs.index': { paramsTuple?: []; params?: {} }
    'audit_logs.get_modules': { paramsTuple?: []; params?: {} }
    'audit_logs.get_actions': { paramsTuple?: []; params?: {} }
    'audit_logs.export': { paramsTuple?: []; params?: {} }
    'audit_logs.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'documents.index': { paramsTuple?: []; params?: {} }
    'roles.index': { paramsTuple?: []; params?: {} }
    'roles.get_permissions': { paramsTuple?: []; params?: {} }
    'face_recognition.status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employee_invitations.list': { paramsTuple?: []; params?: {} }
    'employee_invitations.get_by_token': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'leaves.get_balances': { paramsTuple?: []; params?: {} }
    'reports.get_daily_report': { paramsTuple?: []; params?: {} }
    'reports.get_monthly_report': { paramsTuple?: []; params?: {} }
    'reports.get_attendance_report': { paramsTuple?: []; params?: {} }
    'reports.get_late_arrivals': { paramsTuple?: []; params?: {} }
    'reports.get_absent_report': { paramsTuple?: []; params?: {} }
    'reports.get_summary': { paramsTuple?: []; params?: {} }
    'reports.get_weekly_attendance': { paramsTuple?: []; params?: {} }
    'reports.get_department_wise_attendance': { paramsTuple?: []; params?: {} }
    'reports.export_excel': { paramsTuple?: []; params?: {} }
    'reports.export_pdf': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'org_registration.register': { paramsTuple?: []; params?: {} }
    'auth.login': { paramsTuple?: []; params?: {} }
    'auth.verify_otp': { paramsTuple?: []; params?: {} }
    'auth.check_identifier': { paramsTuple?: []; params?: {} }
    'auth.request_email_otp': { paramsTuple?: []; params?: {} }
    'auth.verify_email_otp': { paramsTuple?: []; params?: {} }
    'auth.login_with_verified_email': { paramsTuple?: []; params?: {} }
    'auth.forgot_password': { paramsTuple?: []; params?: {} }
    'auth.reset_password': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'social_auth.request_phone_otp': { paramsTuple?: []; params?: {} }
    'social_auth.verify_phone_otp': { paramsTuple?: []; params?: {} }
    'social_auth.resend_phone_otp': { paramsTuple?: []; params?: {} }
    'social_auth.enable_phone_auth': { paramsTuple?: []; params?: {} }
    'social_auth.disable_phone_auth': { paramsTuple?: []; params?: {} }
    'social_auth.link_social_account': { paramsTuple?: []; params?: {} }
    'organizations.store_department': { paramsTuple?: []; params?: {} }
    'organizations.toggle_addon': { paramsTuple?: []; params?: {} }
    'employees.store': { paramsTuple?: []; params?: {} }
    'attendances.check_in': { paramsTuple?: []; params?: {} }
    'attendances.check_out': { paramsTuple?: []; params?: {} }
    'attendances.start_break': { paramsTuple?: []; params?: {} }
    'attendances.end_break': { paramsTuple?: []; params?: {} }
    'attendances.request_manual': { paramsTuple?: []; params?: {} }
    'attendances.process_manual': { paramsTuple?: []; params?: {} }
    'attendances.request_overtime': { paramsTuple?: []; params?: {} }
    'regularizations.store': { paramsTuple?: []; params?: {} }
    'tracking.update': { paramsTuple?: []; params?: {} }
    'leaves.store': { paramsTuple?: []; params?: {} }
    'payrolls.store': { paramsTuple?: []; params?: {} }
    'projects.store': { paramsTuple?: []; params?: {} }
    'projects.store_task': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'announcements.store': { paramsTuple?: []; params?: {} }
    'expenses.store': { paramsTuple?: []; params?: {} }
    'timesheets.store': { paramsTuple?: []; params?: {} }
    'notifications.mark_all_as_read': { paramsTuple?: []; params?: {} }
    'audit_logs.store': { paramsTuple?: []; params?: {} }
    'documents.store': { paramsTuple?: []; params?: {} }
    'roles.store': { paramsTuple?: []; params?: {} }
    'face_recognition.register': { paramsTuple?: []; params?: {} }
    'face_recognition.verify': { paramsTuple?: []; params?: {} }
    'employee_invitations.invite': { paramsTuple?: []; params?: {} }
    'employee_invitations.revoke': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employee_invitations.resend': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employee_invitations.respond': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'leaves.adjust_balance': { paramsTuple?: []; params?: {} }
  }
  PUT: {
    'organizations.update': { paramsTuple?: []; params?: {} }
    'employees.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employees.update_geofence': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'regularizations.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'leaves.update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'expenses.update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'roles.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'employees.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employees.remove_geofence': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'notifications.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'documents.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'face_recognition.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  PATCH: {
    'notifications.mark_as_read': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}