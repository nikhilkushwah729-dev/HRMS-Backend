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
    'organizations.update_department': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'organizations.destroy_department': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'organizations.get_designations': { paramsTuple?: []; params?: {} }
    'organizations.store_designation': { paramsTuple?: []; params?: {} }
    'organizations.update_designation': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'organizations.destroy_designation': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'organizations.get_setting_collection': { paramsTuple: [ParamValue]; params: {'key': ParamValue} }
    'organizations.save_setting_collection': { paramsTuple: [ParamValue]; params: {'key': ParamValue} }
    'holidays.index': { paramsTuple?: []; params?: {} }
    'holidays.store': { paramsTuple?: []; params?: {} }
    'holidays.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'holidays.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'organizations.get_addons': { paramsTuple?: []; params?: {} }
    'organizations.toggle_addon': { paramsTuple?: []; params?: {} }
    'employees.index': { paramsTuple?: []; params?: {} }
    'employees.store': { paramsTuple?: []; params?: {} }
    'employees.occasions': { paramsTuple?: []; params?: {} }
    'employees.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employees.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employees.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employees.update_geofence': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employees.get_geofence': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employees.remove_geofence': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'subscriptions.list_plans': { paramsTuple?: []; params?: {} }
    'subscriptions.razorpay_webhook': { paramsTuple?: []; params?: {} }
    'subscriptions.stripe_webhook': { paramsTuple?: []; params?: {} }
    'subscriptions.legacy_invoice': { paramsTuple?: []; params?: {} }
    'subscriptions.get_status': { paramsTuple?: []; params?: {} }
    'subscriptions.create_upgrade_intent': { paramsTuple?: []; params?: {} }
    'subscriptions.verify_payment': { paramsTuple?: []; params?: {} }
    'subscriptions.get_legacy_context': { paramsTuple?: []; params?: {} }
    'subscriptions.legacy_purchase': { paramsTuple?: []; params?: {} }
    'subscriptions.legacy_confirm': { paramsTuple?: []; params?: {} }
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
    'attendances.create_zone': { paramsTuple?: []; params?: {} }
    'attendances.update_zone': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'attendances.delete_zone': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'attendances.get_geo_fence_settings': { paramsTuple?: []; params?: {} }
    'attendances.update_geo_fence_settings': { paramsTuple?: []; params?: {} }
    'attendances.get_all': { paramsTuple?: []; params?: {} }
    'attendances.get_today_all': { paramsTuple?: []; params?: {} }
    'attendances.get_shifts': { paramsTuple?: []; params?: {} }
    'attendances.create_shift': { paramsTuple?: []; params?: {} }
    'attendances.update_shift': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'attendances.delete_shift': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'regularizations.index': { paramsTuple?: []; params?: {} }
    'regularizations.store': { paramsTuple?: []; params?: {} }
    'regularizations.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tracking.update': { paramsTuple?: []; params?: {} }
    'tracking.history': { paramsTuple?: []; params?: {} }
    'leaves.index': { paramsTuple?: []; params?: {} }
    'leaves.get_types': { paramsTuple?: []; params?: {} }
    'leaves.create_type': { paramsTuple?: []; params?: {} }
    'leaves.update_type': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'leaves.destroy_type': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
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
    'visit_management.dashboard': { paramsTuple?: []; params?: {} }
    'visit_management.references': { paramsTuple?: []; params?: {} }
    'visit_management.reports': { paramsTuple?: []; params?: {} }
    'visit_management.export_reports': { paramsTuple?: []; params?: {} }
    'visit_management.list_clients': { paramsTuple?: []; params?: {} }
    'visit_management.create_client': { paramsTuple?: []; params?: {} }
    'visit_management.update_client': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'visit_management.list_visitors': { paramsTuple?: []; params?: {} }
    'visit_management.create_visitor': { paramsTuple?: []; params?: {} }
    'visit_management.update_visitor': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'visit_management.index': { paramsTuple?: []; params?: {} }
    'visit_management.store': { paramsTuple?: []; params?: {} }
    'visit_management.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'visit_management.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'visit_management.review': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'visit_management.check_in': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'visit_management.check_out': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'visit_management.add_note': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'visit_management.add_follow_up': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'visit_management.update_follow_up': { paramsTuple: [ParamValue]; params: {'followUpId': ParamValue} }
    'notifications.index': { paramsTuple?: []; params?: {} }
    'notifications.mark_as_read': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'notifications.mark_all_as_read': { paramsTuple?: []; params?: {} }
    'notifications.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employee_self_service.dashboard': { paramsTuple?: []; params?: {} }
    'employee_self_service.list_requests': { paramsTuple?: []; params?: {} }
    'employee_self_service.create_request': { paramsTuple?: []; params?: {} }
    'employee_self_service.cancel_request': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employee_self_service.profile_audit': { paramsTuple?: []; params?: {} }
    'employee_self_service.login_activity': { paramsTuple?: []; params?: {} }
    'employee_self_service.change_password': { paramsTuple?: []; params?: {} }
    'audit_logs.index': { paramsTuple?: []; params?: {} }
    'audit_logs.store': { paramsTuple?: []; params?: {} }
    'audit_logs.get_modules': { paramsTuple?: []; params?: {} }
    'audit_logs.get_actions': { paramsTuple?: []; params?: {} }
    'audit_logs.export': { paramsTuple?: []; params?: {} }
    'audit_logs.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'documents.index': { paramsTuple?: []; params?: {} }
    'documents.store': { paramsTuple?: []; params?: {} }
    'documents.download': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'documents.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'roles.index': { paramsTuple?: []; params?: {} }
    'roles.store': { paramsTuple?: []; params?: {} }
    'roles.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'roles.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'roles.get_permissions': { paramsTuple?: []; params?: {} }
    'roles.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employee_experiences.index': { paramsTuple?: []; params?: {} }
    'employee_experiences.store': { paramsTuple?: []; params?: {} }
    'employee_experiences.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employee_experiences.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employee_educations.index': { paramsTuple?: []; params?: {} }
    'employee_educations.store': { paramsTuple?: []; params?: {} }
    'employee_educations.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employee_educations.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
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
    'reports.get_attendance_dashboard': { paramsTuple?: []; params?: {} }
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
    'organizations.get_designations': { paramsTuple?: []; params?: {} }
    'organizations.get_setting_collection': { paramsTuple: [ParamValue]; params: {'key': ParamValue} }
    'holidays.index': { paramsTuple?: []; params?: {} }
    'organizations.get_addons': { paramsTuple?: []; params?: {} }
    'employees.index': { paramsTuple?: []; params?: {} }
    'employees.occasions': { paramsTuple?: []; params?: {} }
    'employees.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employees.get_geofence': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'subscriptions.list_plans': { paramsTuple?: []; params?: {} }
    'subscriptions.legacy_invoice': { paramsTuple?: []; params?: {} }
    'subscriptions.get_status': { paramsTuple?: []; params?: {} }
    'subscriptions.get_legacy_context': { paramsTuple?: []; params?: {} }
    'attendances.history': { paramsTuple?: []; params?: {} }
    'attendances.get_today': { paramsTuple?: []; params?: {} }
    'attendances.get_today_breaks': { paramsTuple?: []; params?: {} }
    'attendances.get_stats': { paramsTuple?: []; params?: {} }
    'attendances.get_monthly': { paramsTuple?: []; params?: {} }
    'attendances.get_manual_requests': { paramsTuple?: []; params?: {} }
    'attendances.get_overtime': { paramsTuple?: []; params?: {} }
    'attendances.validate_location': { paramsTuple?: []; params?: {} }
    'attendances.get_zones': { paramsTuple?: []; params?: {} }
    'attendances.get_geo_fence_settings': { paramsTuple?: []; params?: {} }
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
    'visit_management.dashboard': { paramsTuple?: []; params?: {} }
    'visit_management.references': { paramsTuple?: []; params?: {} }
    'visit_management.reports': { paramsTuple?: []; params?: {} }
    'visit_management.export_reports': { paramsTuple?: []; params?: {} }
    'visit_management.list_clients': { paramsTuple?: []; params?: {} }
    'visit_management.list_visitors': { paramsTuple?: []; params?: {} }
    'visit_management.index': { paramsTuple?: []; params?: {} }
    'visit_management.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'notifications.index': { paramsTuple?: []; params?: {} }
    'employee_self_service.dashboard': { paramsTuple?: []; params?: {} }
    'employee_self_service.list_requests': { paramsTuple?: []; params?: {} }
    'employee_self_service.profile_audit': { paramsTuple?: []; params?: {} }
    'employee_self_service.login_activity': { paramsTuple?: []; params?: {} }
    'audit_logs.index': { paramsTuple?: []; params?: {} }
    'audit_logs.get_modules': { paramsTuple?: []; params?: {} }
    'audit_logs.get_actions': { paramsTuple?: []; params?: {} }
    'audit_logs.export': { paramsTuple?: []; params?: {} }
    'audit_logs.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'documents.index': { paramsTuple?: []; params?: {} }
    'documents.download': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'roles.index': { paramsTuple?: []; params?: {} }
    'roles.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'roles.get_permissions': { paramsTuple?: []; params?: {} }
    'employee_experiences.index': { paramsTuple?: []; params?: {} }
    'employee_educations.index': { paramsTuple?: []; params?: {} }
    'face_recognition.status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employee_invitations.list': { paramsTuple?: []; params?: {} }
    'employee_invitations.get_by_token': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'leaves.get_balances': { paramsTuple?: []; params?: {} }
    'reports.get_daily_report': { paramsTuple?: []; params?: {} }
    'reports.get_monthly_report': { paramsTuple?: []; params?: {} }
    'reports.get_attendance_report': { paramsTuple?: []; params?: {} }
    'reports.get_attendance_dashboard': { paramsTuple?: []; params?: {} }
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
    'organizations.get_designations': { paramsTuple?: []; params?: {} }
    'organizations.get_setting_collection': { paramsTuple: [ParamValue]; params: {'key': ParamValue} }
    'holidays.index': { paramsTuple?: []; params?: {} }
    'organizations.get_addons': { paramsTuple?: []; params?: {} }
    'employees.index': { paramsTuple?: []; params?: {} }
    'employees.occasions': { paramsTuple?: []; params?: {} }
    'employees.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employees.get_geofence': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'subscriptions.list_plans': { paramsTuple?: []; params?: {} }
    'subscriptions.legacy_invoice': { paramsTuple?: []; params?: {} }
    'subscriptions.get_status': { paramsTuple?: []; params?: {} }
    'subscriptions.get_legacy_context': { paramsTuple?: []; params?: {} }
    'attendances.history': { paramsTuple?: []; params?: {} }
    'attendances.get_today': { paramsTuple?: []; params?: {} }
    'attendances.get_today_breaks': { paramsTuple?: []; params?: {} }
    'attendances.get_stats': { paramsTuple?: []; params?: {} }
    'attendances.get_monthly': { paramsTuple?: []; params?: {} }
    'attendances.get_manual_requests': { paramsTuple?: []; params?: {} }
    'attendances.get_overtime': { paramsTuple?: []; params?: {} }
    'attendances.validate_location': { paramsTuple?: []; params?: {} }
    'attendances.get_zones': { paramsTuple?: []; params?: {} }
    'attendances.get_geo_fence_settings': { paramsTuple?: []; params?: {} }
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
    'visit_management.dashboard': { paramsTuple?: []; params?: {} }
    'visit_management.references': { paramsTuple?: []; params?: {} }
    'visit_management.reports': { paramsTuple?: []; params?: {} }
    'visit_management.export_reports': { paramsTuple?: []; params?: {} }
    'visit_management.list_clients': { paramsTuple?: []; params?: {} }
    'visit_management.list_visitors': { paramsTuple?: []; params?: {} }
    'visit_management.index': { paramsTuple?: []; params?: {} }
    'visit_management.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'notifications.index': { paramsTuple?: []; params?: {} }
    'employee_self_service.dashboard': { paramsTuple?: []; params?: {} }
    'employee_self_service.list_requests': { paramsTuple?: []; params?: {} }
    'employee_self_service.profile_audit': { paramsTuple?: []; params?: {} }
    'employee_self_service.login_activity': { paramsTuple?: []; params?: {} }
    'audit_logs.index': { paramsTuple?: []; params?: {} }
    'audit_logs.get_modules': { paramsTuple?: []; params?: {} }
    'audit_logs.get_actions': { paramsTuple?: []; params?: {} }
    'audit_logs.export': { paramsTuple?: []; params?: {} }
    'audit_logs.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'documents.index': { paramsTuple?: []; params?: {} }
    'documents.download': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'roles.index': { paramsTuple?: []; params?: {} }
    'roles.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'roles.get_permissions': { paramsTuple?: []; params?: {} }
    'employee_experiences.index': { paramsTuple?: []; params?: {} }
    'employee_educations.index': { paramsTuple?: []; params?: {} }
    'face_recognition.status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employee_invitations.list': { paramsTuple?: []; params?: {} }
    'employee_invitations.get_by_token': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'leaves.get_balances': { paramsTuple?: []; params?: {} }
    'reports.get_daily_report': { paramsTuple?: []; params?: {} }
    'reports.get_monthly_report': { paramsTuple?: []; params?: {} }
    'reports.get_attendance_report': { paramsTuple?: []; params?: {} }
    'reports.get_attendance_dashboard': { paramsTuple?: []; params?: {} }
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
    'organizations.store_designation': { paramsTuple?: []; params?: {} }
    'holidays.store': { paramsTuple?: []; params?: {} }
    'organizations.toggle_addon': { paramsTuple?: []; params?: {} }
    'employees.store': { paramsTuple?: []; params?: {} }
    'subscriptions.razorpay_webhook': { paramsTuple?: []; params?: {} }
    'subscriptions.stripe_webhook': { paramsTuple?: []; params?: {} }
    'subscriptions.create_upgrade_intent': { paramsTuple?: []; params?: {} }
    'subscriptions.verify_payment': { paramsTuple?: []; params?: {} }
    'subscriptions.legacy_purchase': { paramsTuple?: []; params?: {} }
    'subscriptions.legacy_confirm': { paramsTuple?: []; params?: {} }
    'attendances.check_in': { paramsTuple?: []; params?: {} }
    'attendances.check_out': { paramsTuple?: []; params?: {} }
    'attendances.start_break': { paramsTuple?: []; params?: {} }
    'attendances.end_break': { paramsTuple?: []; params?: {} }
    'attendances.request_manual': { paramsTuple?: []; params?: {} }
    'attendances.process_manual': { paramsTuple?: []; params?: {} }
    'attendances.request_overtime': { paramsTuple?: []; params?: {} }
    'attendances.create_zone': { paramsTuple?: []; params?: {} }
    'attendances.create_shift': { paramsTuple?: []; params?: {} }
    'regularizations.store': { paramsTuple?: []; params?: {} }
    'tracking.update': { paramsTuple?: []; params?: {} }
    'leaves.create_type': { paramsTuple?: []; params?: {} }
    'leaves.store': { paramsTuple?: []; params?: {} }
    'payrolls.store': { paramsTuple?: []; params?: {} }
    'projects.store': { paramsTuple?: []; params?: {} }
    'projects.store_task': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'announcements.store': { paramsTuple?: []; params?: {} }
    'expenses.store': { paramsTuple?: []; params?: {} }
    'timesheets.store': { paramsTuple?: []; params?: {} }
    'visit_management.create_client': { paramsTuple?: []; params?: {} }
    'visit_management.create_visitor': { paramsTuple?: []; params?: {} }
    'visit_management.store': { paramsTuple?: []; params?: {} }
    'visit_management.review': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'visit_management.check_in': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'visit_management.check_out': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'visit_management.add_note': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'visit_management.add_follow_up': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'notifications.mark_all_as_read': { paramsTuple?: []; params?: {} }
    'employee_self_service.create_request': { paramsTuple?: []; params?: {} }
    'employee_self_service.cancel_request': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employee_self_service.change_password': { paramsTuple?: []; params?: {} }
    'audit_logs.store': { paramsTuple?: []; params?: {} }
    'documents.store': { paramsTuple?: []; params?: {} }
    'roles.store': { paramsTuple?: []; params?: {} }
    'employee_experiences.store': { paramsTuple?: []; params?: {} }
    'employee_educations.store': { paramsTuple?: []; params?: {} }
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
    'organizations.update_department': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'organizations.update_designation': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'organizations.save_setting_collection': { paramsTuple: [ParamValue]; params: {'key': ParamValue} }
    'holidays.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employees.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employees.update_geofence': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'attendances.update_zone': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'attendances.update_geo_fence_settings': { paramsTuple?: []; params?: {} }
    'attendances.update_shift': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'regularizations.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'leaves.update_type': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'leaves.update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'expenses.update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'visit_management.update_client': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'visit_management.update_visitor': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'visit_management.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'visit_management.update_follow_up': { paramsTuple: [ParamValue]; params: {'followUpId': ParamValue} }
    'roles.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employee_experiences.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employee_educations.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'organizations.destroy_department': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'organizations.destroy_designation': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'holidays.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employees.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employees.remove_geofence': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'attendances.delete_zone': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'attendances.delete_shift': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'leaves.destroy_type': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'notifications.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'documents.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'roles.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employee_experiences.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employee_educations.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'face_recognition.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  PATCH: {
    'notifications.mark_as_read': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}