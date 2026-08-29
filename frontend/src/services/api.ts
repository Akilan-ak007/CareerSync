const API_BASE_URL = 'http://localhost:5001/api';

// Helper to get auth headers containing the JWT token
function getHeaders(isMultipart = false) {
  const token = localStorage.getItem('placement_jwt_token');
  const headers: any = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

// Global response parsing helper
async function handleResponse(response: Response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong.');
  }
  return data;
}

export const api = {
  // 1. Auth endpoints
  auth: {
    login: async (payload: any) => {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      return handleResponse(res);
    },
    me: async () => {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
  },

  // 2. Students endpoints
  students: {
    list: async (params: {
      search?: string;
      departmentId?: string;
      studentType?: string;
      placementStatus?: string;
      minUg?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: string;
    }) => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.append(key, String(val));
        }
      });
      const res = await fetch(`${API_BASE_URL}/students?${query.toString()}`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    get: async (id: string) => {
      const res = await fetch(`${API_BASE_URL}/students/${id}`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    create: async (data: any) => {
      const res = await fetch(`${API_BASE_URL}/students`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(res);
    },
    update: async (id: string, data: any) => {
      const res = await fetch(`${API_BASE_URL}/students/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(res);
    },
    delete: async (id: string) => {
      const res = await fetch(`${API_BASE_URL}/students/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    importPreview: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE_URL}/students/import/preview`, {
        method: 'POST',
        headers: getHeaders(true),
        body: formData,
      });
      return handleResponse(res);
    },
    importConfirm: async (students: any[]) => {
      const res = await fetch(`${API_BASE_URL}/students/import/confirm`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ students }),
      });
      return handleResponse(res);
    },
    departments: async () => {
      const res = await fetch(`${API_BASE_URL}/students/departments`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
  },

  // 3. Companies endpoints
  companies: {
    list: async (params: { search?: string; status?: string; page?: number; limit?: number }) => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.append(key, String(val));
        }
      });
      const res = await fetch(`${API_BASE_URL}/companies?${query.toString()}`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    get: async (id: string) => {
      const res = await fetch(`${API_BASE_URL}/companies/${id}`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    create: async (data: any) => {
      const res = await fetch(`${API_BASE_URL}/companies`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(res);
    },
    update: async (id: string, data: any) => {
      const res = await fetch(`${API_BASE_URL}/companies/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(res);
    },
    delete: async (id: string) => {
      const res = await fetch(`${API_BASE_URL}/companies/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    listDeleted: async () => {
      const res = await fetch(`${API_BASE_URL}/companies/deleted`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    restore: async (id: string) => {
      const res = await fetch(`${API_BASE_URL}/companies/${id}/restore`, {
        method: 'POST',
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    permanentDelete: async (id: string) => {
      const res = await fetch(`${API_BASE_URL}/companies/${id}/permanent`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    submissions: async () => {
      const res = await fetch(`${API_BASE_URL}/companies/submissions`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    approve: async (submissionId: string) => {
      const res = await fetch(`${API_BASE_URL}/companies/submissions/${submissionId}/approve`, {
        method: 'POST',
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    reject: async (submissionId: string, reason: string) => {
      const res = await fetch(`${API_BASE_URL}/companies/submissions/${submissionId}/reject`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ reason }),
      });
      return handleResponse(res);
    },
  },

  // 4. Drives endpoints
  drives: {
    list: async (params: { status?: string; companyId?: string; department?: string; page?: number; limit?: number }) => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.append(key, String(val));
        }
      });
      const res = await fetch(`${API_BASE_URL}/placement-drives?${query.toString()}`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    get: async (id: string) => {
      const res = await fetch(`${API_BASE_URL}/placement-drives/${id}`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    create: async (data: any) => {
      const res = await fetch(`${API_BASE_URL}/placement-drives`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(res);
    },
    update: async (id: string, data: any) => {
      const res = await fetch(`${API_BASE_URL}/placement-drives/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(res);
    },
    delete: async (id: string) => {
      const res = await fetch(`${API_BASE_URL}/placement-drives/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    complete: async (id: string, payload: {
      selectedStudentIds: string[];
      participatedStudentIds: string[];
      ctc?: number;
      highestCtc?: number;
      averageCtc?: number;
      lowestCtc?: number;
    }) => {
      const res = await fetch(`${API_BASE_URL}/placement-drives/${id}/complete`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      return handleResponse(res);
    },
  },

  // 5. Offers endpoints
  offers: {
    list: async (params: { departmentId?: string; companyId?: string; status?: string; search?: string; page?: number; limit?: number }) => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.append(key, String(val));
        }
      });
      const res = await fetch(`${API_BASE_URL}/offers?${query.toString()}`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    update: async (id: string, data: any) => {
      const res = await fetch(`${API_BASE_URL}/offers/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(res);
    },
    delete: async (id: string) => {
      const res = await fetch(`${API_BASE_URL}/offers/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
  },

  // 6. Users endpoints (Placement team CRUD)
  users: {
    list: async (role?: string) => {
      const query = role ? `?role=${role}` : '';
      const res = await fetch(`${API_BASE_URL}/users${query}`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    create: async (data: any) => {
      const res = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(res);
    },
    update: async (id: string, data: any) => {
      const res = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(res);
    },
    delete: async (id: string) => {
      const res = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
  },

  // 7. Dashboard endpoints
  dashboard: {
    getStats: async (role: 'ADMIN' | 'MANAGER' | 'PLACEMENT_TEAM') => {
      const rolePath = role.toLowerCase().replace('_', '-');
      const res = await fetch(`${API_BASE_URL}/dashboard/${rolePath}`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
  },

  // 8. Audit Logs (Admin only)
  auditLogs: {
    list: async (params: { page?: number; limit?: number; search?: string }) => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.append(key, String(val));
        }
      });
      const res = await fetch(`${API_BASE_URL}/audit-logs?${query.toString()}`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
  },

  // 9. Notifications
  notifications: {
    list: async () => {
      const res = await fetch(`${API_BASE_URL}/notifications`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    read: async (id: string) => {
      const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    readAll: async () => {
      const res = await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
  },

  // 10. ATS Analytics and Candidate Matching
  ats: {
    uploadJd: async (driveId: string, file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE_URL}/ats/${driveId}/jd-upload`, {
        method: 'POST',
        headers: getHeaders(true),
        body: formData,
      });
      return handleResponse(res);
    },
    removeJd: async (driveId: string) => {
      const res = await fetch(`${API_BASE_URL}/ats/${driveId}/jd-delete`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    extractJd: async (driveId: string) => {
      const res = await fetch(`${API_BASE_URL}/ats/${driveId}/jd-extract`, {
        method: 'POST',
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    updateJd: async (driveId: string, extractedInfo: any) => {
      const res = await fetch(`${API_BASE_URL}/ats/${driveId}/jd-update`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ extractedInfo }),
      });
      return handleResponse(res);
    },
    matchResumes: async (driveId: string) => {
      const res = await fetch(`${API_BASE_URL}/ats/${driveId}/ats-match`, {
        method: 'POST',
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    listCandidates: async (driveId: string, params: {
      search?: string;
      departmentId?: string;
      minScore?: number;
      shortlisted?: boolean;
      eligible?: boolean;
      page?: number;
      limit?: number;
    }) => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.append(key, String(val));
        }
      });
      const res = await fetch(`${API_BASE_URL}/ats/${driveId}/ats-candidates?${query.toString()}`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    getCandidateDetail: async (driveId: string, studentId: string) => {
      const res = await fetch(`${API_BASE_URL}/ats/${driveId}/students/${studentId}/ats-detail`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    updateStatus: async (driveId: string, studentId: string, status: 'Shortlisted' | 'Review' | 'Pending') => {
      const res = await fetch(`${API_BASE_URL}/ats/${driveId}/students/${studentId}/ats-status`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status }),
      });
      return handleResponse(res);
    },
    getAnalytics: async () => {
      const res = await fetch(`${API_BASE_URL}/ats/dashboard/analytics`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
  },
};
