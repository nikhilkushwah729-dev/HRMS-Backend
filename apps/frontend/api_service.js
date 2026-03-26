te_path>
d:/HRMS_Backend/HRMS_BACKEND/apps/frontend/api_service.js
</absolute_path>
<parameter name="content">
/**
 * HRMS API Service for Frontend
 * Use this file to connect your frontend to the HRMS Backend
 * 
 * Base URL: http://localhost:3333/api
 */

const BASE_URL = 'http://localhost:3333/api';

// Token management
let authToken = localStorage.getItem('hrms_token') || null;

// Set auth token
export function setAuthToken(token) {
  authToken = token;
  if (token) {
    localStorage.setItem('hrms_token', token);
  } else {
    localStorage.removeItem('hrms_token');
  }
}

// Get auth headers
function getHeaders() {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return headers;
}

// Handle response
async function handleResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'An error occurred');
  }
  return data;
}

// ==================== AUTH ROUTES ====================

export const authAPI = {
  // Register Organization
  register: async (data) => {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Verify Email
  verifyEmail: async (token) => {
    const response = await fetch(`${BASE_URL}/auth/verify-email?token=${token}`);
    return handleResponse(response);
  },

  // Login
  login: async (email, password) => {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = handleResponse(response);
    return data;
  },

  // Verify OTP
  verifyOtp: async (otpReference, code) => {
    const response = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otpReference, code }),
    });
    const data = await handleResponse(response);
    if (data.token) {
      setAuthToken(data.token);
    }
    return data;
  },

  // Forgot Password
  forgotPassword: async (email) => {
    const response = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return handleResponse(response);
  },

  // Reset Password
  resetPassword: async (token, password) => {
    const response = await fetch(`${BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    return handleResponse(response);
  },

  // Logout
  logout: async () => {
    const response = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: getHeaders(),
    });
    setAuthToken(null);
    return handleResponse(response);
  },

  // Get Current User
  me: async () => {
    const response = await fetch(`${BASE_URL}/auth/me`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// ==================== ORGANIZATION ROUTES ====================

export const organizationAPI = {
  get: async () => {
    const response = await fetch(`${BASE_URL}/organization`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  update: async (data) => {
    const response = await fetch(`${BASE_URL}/organization`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  getDepartments: async () => {
    const response = await fetch(`${BASE_URL}/organization/departments`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  createDepartment: async (data) => {
    const response = await fetch(`${BASE_URL}/organization/departments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  getAddons: async () => {
    const response = await fetch(`${BASE_URL}/organization/addons`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  toggleAddon: async (addonId) => {
    const response = await fetch(`${BASE_URL}/organization/addons/toggle`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ addonId }),
    });
    return handleResponse(response);
  },
};

// ==================== EMPLOYEE ROUTES ====================

export const employeeAPI = {
  list: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${BASE_URL}/employees?${params}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  get: async (id) => {
    const response = await fetch(`${BASE_URL}/employees/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  create: async (data) => {
    const response = await fetch(`${BASE_URL}/employees`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  update: async (id, data) => {
    const response = await fetch(`${BASE_URL}/employees/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${BASE_URL}/employees/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  invite: async (data) => {
    const response = await fetch(`${BASE_URL}/employees/invite`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  listInvitations: async () => {
    const response = await fetch(`${BASE_URL}/employees/invitations`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  revokeInvitation: async (id) => {
    const response = await fetch(`${BASE_URL}/employees/invitations/${id}/revoke`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  resendInvitation: async (id) => {
    const response = await fetch(`${BASE_URL}/employees/invitations/${id}/resend`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// ==================== ATTENDANCE ROUTES ====================

export const attendanceAPI = {
  checkIn: async (data) => {
    const response = await fetch(`${BASE_URL}/attendance/check-in`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  checkOut: async (data) => {
    const response = await fetch(`${BASE_URL}/attendance/check-out`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  history: async (startDate, endDate) => {
    const params = new URLSearchParams({ startDate, endDate });
    const response = await fetch(`${BASE_URL}/attendance/history?${params}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  today: async () => {
    const response = await fetch(`${BASE_URL}/attendance/today`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  startBreak: async (type = 'lunch') => {
    const response = await fetch(`${BASE_URL}/attendance/break/start`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ type }),
    });
    return handleResponse(response);
  },

  endBreak: async () => {
    const response = await fetch(`${BASE_URL}/attendance/break/end`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getTodayBreaks: async () => {
    const response = await fetch(`${BASE_URL}/attendance/breaks/today`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getStats: async (period = 'month') => {
    const response = await fetch(`${BASE_URL}/attendance/stats?period=${period}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getMonthly: async (year, month) => {
    const response = await fetch(`${BASE_URL}/attendance/monthly?year=${year}&month=${month}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  requestManual: async (data) => {
    const response = await fetch(`${BASE_URL}/attendance/manual/request`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  getManualRequests: async () => {
    const response = await fetch(`${BASE_URL}/attendance/manual/requests`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  processManual: async (requestId, action, reason) => {
    const response = await fetch(`${BASE_URL}/attendance/manual/process`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ request_id: requestId, action, reason }),
    });
    return handleResponse(response);
  },

  requestOvertime: async (data) => {
    const response = await fetch(`${BASE_URL}/attendance/overtime/request`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  getOvertime: async () => {
    const response = await fetch(`${BASE_URL}/attendance/overtime`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  validateLocation: async (lat, lng) => {
    const response = await fetch(`${BASE_URL}/attendance/validate-location?lat=${lat}&lng=${lng}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getZones: async () => {
    const response = await fetch(`${BASE_URL}/attendance/zones`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getAll: async (startDate, endDate) => {
    const params = new URLSearchParams({ startDate, endDate });
    const response = await fetch(`${BASE_URL}/attendance/all?${params}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getTodayAll: async () => {
    const response = await fetch(`${BASE_URL}/attendance/all/today`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getShifts: async () => {
    const response = await fetch(`${BASE_URL}/attendance/shifts`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// ==================== REGULARIZATION ROUTES ====================

export const regularizationAPI = {
  list: async () => {
    const response = await fetch(`${BASE_URL}/regularizations`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  create: async (data) => {
    const response = await fetch(`${BASE_URL}/regularizations`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  update: async (id, data) => {
    const response = await fetch(`${BASE_URL}/regularizations/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
};

// ==================== TRACKING ROUTES ====================

export const trackingAPI = {
  update: async (latitude, longitude) => {
    const response = await fetch(`${BASE_URL}/tracking/update`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ latitude, longitude }),
    });
    return handleResponse(response);
  },

  history: async (startDate, endDate) => {
    const params = new URLSearchParams({ startDate, endDate });
    const response = await fetch(`${BASE_URL}/tracking/history?${params}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// ==================== LEAVE ROUTES ====================

export const leaveAPI = {
  list: async () => {
    const response = await fetch(`${BASE_URL}/leaves`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getTypes: async () => {
    const response = await fetch(`${BASE_URL}/leaves/types`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  apply: async (data) => {
    const response = await fetch(`${BASE_URL}/leaves`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  updateStatus: async (id, status, rejectionNote = '') => {
    const response = await fetch(`${BASE_URL}/leaves/${id}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status, rejectionNote }),
    });
    return handleResponse(response);
  },

  getBalances: async (year) => {
    const response = await fetch(`${BASE_URL}/leaves/balances?year=${year}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  adjustBalance: async (data) => {
    const response = await fetch(`${BASE_URL}/leaves/balances/adjust`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Alternative route
  getLeaveTypes: async () => {
    const response = await fetch(`${BASE_URL}/leave-types`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// ==================== PAYROLL ROUTES ====================

export const payrollAPI = {
  list: async () => {
    const response = await fetch(`${BASE_URL}/payroll`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  create: async (data) => {
    const response = await fetch(`${BASE_URL}/payroll`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
};

// ==================== PROJECT ROUTES ====================

export const projectAPI = {
  list: async () => {
    const response = await fetch(`${BASE_URL}/projects`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  create: async (data) => {
    const response = await fetch(`${BASE_URL}/projects`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  getTasks: async (id) => {
    const response = await fetch(`${BASE_URL}/projects/${id}/tasks`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  createTask: async (projectId, data) => {
    const response = await fetch(`${BASE_URL}/projects/${projectId}/tasks`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
};

// ==================== ANNOUNCEMENT ROUTES ====================

export const announcementAPI = {
  list: async () => {
    const response = await fetch(`${BASE_URL}/announcements`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  create: async (data) => {
    const response = await fetch(`${BASE_URL}/announcements`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
};

// ==================== EXPENSE ROUTES ====================

export const expenseAPI = {
  list: async () => {
    const response = await fetch(`${BASE_URL}/expenses`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  create: async (data) => {
    const response = await fetch(`${BASE_URL}/expenses`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  updateStatus: async (id, status) => {
    const response = await fetch(`${BASE_URL}/expenses/${id}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(response);
  },
};

// ==================== TIMESHEET ROUTES ====================

export const timesheetAPI = {
  list: async () => {
    const response = await fetch(`${BASE_URL}/timesheets`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  create: async (data) => {
    const response = await fetch(`${BASE_URL}/timesheets`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
};

// ==================== NOTIFICATION ROUTES ====================

export const notificationAPI = {
  list: async () => {
    const response = await fetch(`${BASE_URL}/notifications`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  markAsRead: async (id) => {
    const response = await fetch(`${BASE_URL}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  markAllAsRead: async () => {
    const response = await fetch(`${BASE_URL}/notifications/read-all`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${BASE_URL}/notifications/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// ==================== AUDIT LOG ROUTES ====================

export const auditLogAPI = {
  list: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${BASE_URL}/audit-logs?${params}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  create: async (data) => {
    const response = await fetch(`${BASE_URL}/audit-logs`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  getModules: async () => {
    const response = await fetch(`${BASE_URL}/audit-logs/modules`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getActions: async () => {
    const response = await fetch(`${BASE_URL}/audit-logs/actions`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  export: async (startDate, endDate) => {
    const params = new URLSearchParams({ startDate, endDate });
    const response = await fetch(`${BASE_URL}/audit-logs/export?${params}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  get: async (id) => {
    const response = await fetch(`${BASE_URL}/audit-logs/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// ==================== DOCUMENT ROUTES ====================

export const documentAPI = {
  list: async () => {
    const response = await fetch(`${BASE_URL}/documents`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  upload: async (formData) => {
    const headers = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    const response = await fetch(`${BASE_URL}/documents`, {
      method: 'POST',
      headers,
      body: formData,
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${BASE_URL}/documents/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// ==================== ROLE ROUTES ====================

export const roleAPI = {
  list: async () => {
    const response = await fetch(`${BASE_URL}/roles`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  create: async (data) => {
    const response = await fetch(`${BASE_URL}/roles`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  update: async (id, data) => {
    const response = await fetch(`${BASE_URL}/roles/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  getPermissions: async () => {
    const response = await fetch(`${BASE_URL}/roles/permissions`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// ==================== FACE RECOGNITION ROUTES ====================

export const faceAPI = {
  register: async (image) => {
    const response = await fetch(`${BASE_URL}/face/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ image }),
    });
    return handleResponse(response);
  },

  verify: async (image) => {
    const response = await fetch(`${BASE_URL}/face/verify`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ image }),
    });
    return handleResponse(response);
  },

  status: async (id) => {
    const response = await fetch(`${BASE_URL}/face/status/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${BASE_URL}/face/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// ==================== PUBLIC INVITATION ROUTES ====================

export const invitationAPI = {
  getByToken: async (token) => {
    const response = await fetch(`${BASE_URL}/invitations/${token}`);
    return handleResponse(response);
  },

  respond: async (token, action, password) => {
    const response = await fetch(`${BASE_URL}/invitations/${token}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, password }),
    });
    return handleResponse(response);
  },
};

// ==================== EXAMPLE USAGE ====================

/*
// Login Example
async function login() {
  try {
    const loginResult = await authAPI.login('user@company.com', 'password123');
    console.log('Login result:', loginResult);
    
    if (loginResult.requires2fa) {
      // Show OTP input to user
      const otp = prompt('Enter OTP:');
      const verifyResult = await authAPI.verifyOtp(loginResult.otpReference, otp);
      console.log('Verified!', verifyResult);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Get Employees
async function getEmployees() {
  try {
    const employees = await employeeAPI.list();
    console.log('Employees:', employees);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Check In
async function checkIn() {
  try {
    const result = await attendanceAPI.checkIn({
      latitude: 28.6139,
      longitude: 77.2090,
      source: 'mobile'
    });
    console.log('Checked in!', result);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Apply Leave
async function applyLeave() {
  try {
    const result = await leaveAPI.apply({
      leaveTypeId: 1,
      startDate: '2026-02-01',
      endDate: '2026-02-03',
      reason: 'Personal work'
    });
    console.log('Leave applied!', result);
  } catch (error) {
    console.error('Error:', error.message);
  }
}
*/
