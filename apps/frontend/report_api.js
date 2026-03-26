

/**
 * HRMS Report API Service for Frontend
 * Use this file to integrate reports into your frontend
 * 
 * Base URL: http://localhost:3333/api
 */

const BASE_URL = 'http://localhost:3333/api';

// Token management
let authToken = localStorage.getItem('hrms_token') || null;

function setAuthToken(token) {
  authToken = token;
  if (token) {
    localStorage.setItem('hrms_token', token);
  } else {
    localStorage.removeItem('hrms_token');
  }
}

function getHeaders() {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return headers;
}

async function handleResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'An error occurred');
  }
  return data;
}

// ==================== REPORT ROUTES ====================

export const reportAPI = {
  // Get daily attendance report
  getDailyReport: async (date, departmentId = null) => {
    let url = `${BASE_URL}/reports/daily?date=${date}`;
    if (departmentId) {
      url += `&departmentId=${departmentId}`;
    }
    const response = await fetch(url, { headers: getHeaders() });
    return handleResponse(response);
  },

  // Get monthly attendance report
  getMonthlyReport: async (year, month, departmentId = null, employeeId = null) => {
    let url = `${BASE_URL}/reports/monthly?year=${year}&month=${month}`;
    if (departmentId) {
      url += `&departmentId=${departmentId}`;
    }
    if (employeeId) {
      url += `&employeeId=${employeeId}`;
    }
    const response = await fetch(url, { headers: getHeaders() });
    return handleResponse(response);
  },

  // Get attendance report for a date range
  getAttendanceReport: async (startDate, endDate, departmentId = null, employeeId = null, status = null) => {
    let url = `${BASE_URL}/reports/attendance?startDate=${startDate}&endDate=${endDate}`;
    if (departmentId) {
      url += `&departmentId=${departmentId}`;
    }
    if (employeeId) {
      url += `&employeeId=${employeeId}`;
    }
    if (status) {
      url += `&status=${status}`;
    }
    const response = await fetch(url, { headers: getHeaders() });
    return handleResponse(response);
  },

  // Get late arrival report
  getLateArrivals: async (startDate, endDate, departmentId = null, employeeId = null) => {
    let url = `${BASE_URL}/reports/late?startDate=${startDate}&endDate=${endDate}`;
    if (departmentId) {
      url += `&departmentId=${departmentId}`;
    }
    if (employeeId) {
      url += `&employeeId=${employeeId}`;
    }
    const response = await fetch(url, { headers: getHeaders() });
    return handleResponse(response);
  },

  // Get absent report
  getAbsentReport: async (startDate, endDate, departmentId = null, employeeId = null) => {
    let url = `${BASE_URL}/reports/absent?startDate=${startDate}&endDate=${endDate}`;
    if (departmentId) {
      url += `&departmentId=${departmentId}`;
    }
    if (employeeId) {
      url += `&employeeId=${employeeId}`;
    }
    const response = await fetch(url, { headers: getHeaders() });
    return handleResponse(response);
  },

  // Get attendance summary
  getAttendanceSummary: async (year, month) => {
    const url = `${BASE_URL}/reports/summary?year=${year}&month=${month}`;
    const response = await fetch(url, { headers: getHeaders() });
    return handleResponse(response);
  },

  // Get weekly attendance for charts
  getWeeklyAttendance: async () => {
    const url = `${BASE_URL}/reports/weekly`;
    const response = await fetch(url, { headers: getHeaders() });
    return handleResponse(response);
  },

  // Get department-wise attendance
  getDepartmentWiseAttendance: async (year, month) => {
    const url = `${BASE_URL}/reports/by-department?year=${year}&month=${month}`;
    const response = await fetch(url, { headers: getHeaders() });
    return handleResponse(response);
  },

  // Export to Excel
  exportToExcel: async (startDate, endDate, departmentId = null, employeeId = null, status = null) => {
    let url = `${BASE_URL}/reports/export/excel?startDate=${startDate}&endDate=${endDate}`;
    if (departmentId) {
      url += `&departmentId=${departmentId}`;
    }
    if (employeeId) {
      url += `&employeeId=${employeeId}`;
    }
    if (status) {
      url += `&status=${status}`;
    }
    const response = await fetch(url, {
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Export failed');
    }
    
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = 'attendance_report.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  },

  // Export to PDF
  exportToPdf: async (startDate, endDate, departmentId = null, employeeId = null, status = null) => {
    let url = `${BASE_URL}/reports/export/pdf?startDate=${startDate}&endDate=${endDate}`;
    if (departmentId) {
      url += `&departmentId=${departmentId}`;
    }
    if (employeeId) {
      url += `&employeeId=${employeeId}`;
    }
    if (status) {
      url += `&status=${status}`;
    }
    const response = await fetch(url, {
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Export failed');
    }
    
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = 'attendance_report.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  },
};

// ==================== EXAMPLE USAGE ====================

/*
// Get daily report
async function getDailyReport() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const result = await reportAPI.getDailyReport(today);
    console.log('Daily Report:', result);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Get monthly report
async function getMonthlyReport() {
  try {
    const year = 2026;
    const month = 1;
    const result = await reportAPI.getMonthlyReport(year, month);
    console.log('Monthly Report:', result);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Get attendance for date range
async function getAttendanceRange() {
  try {
    const result = await reportAPI.getAttendanceReport('2026-01-01', '2026-01-31');
    console.log('Attendance Report:', result);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Get late arrivals
async function getLateArrivals() {
  try {
    const result = await reportAPI.getLateArrivals('2026-01-01', '2026-01-31');
    console.log('Late Arrivals:', result);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Get weekly attendance for charts
async function getWeeklyData() {
  try {
    const result = await reportAPI.getWeeklyAttendance();
    console.log('Weekly Data:', result);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Export to Excel
async function exportExcel() {
  try {
    await reportAPI.exportToExcel('2026-01-01', '2026-01-31');
    console.log('Exported successfully');
  } catch (error) {
    console.error('Error:', error.message);
  }
}
*/

