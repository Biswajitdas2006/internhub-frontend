const BASE_URL = "/api";

async function request(method, path, body = null) {
  const headers = { "Content-Type": "application/json" };
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    credentials: "include",   // sends httpOnly cookie automatically
    body: body ? JSON.stringify(body) : null
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || res.statusText);
  }

  return res.json();
}

async function requestForm(method, path, formData) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    credentials: "include",   // sends httpOnly cookie automatically
    body: formData
  });
  if (!res.ok) { const err = await res.text(); throw new Error(err || res.statusText); }
  const text = await res.text();
  try { return text ? JSON.parse(text) : null; } catch { return text; }
}

export const authApi = {
  register: (dto) => request("POST", "/auth/register", dto),
  login: (dto) => request("POST", "/auth/login", dto),
  verifyOtp: (dto) => request("POST", "/auth/verify-otp", dto),
  forgotPassword: (email) => request("POST", "/auth/forgot-password", { email }),
  verifyForgotOtp: (dto) => request("POST", "/auth/verify-forgot-otp", dto),
  resetPassword: (dto) => request("POST", "/auth/reset-password", dto),
  logout: () => request("POST", "/auth/logout"),
};

export const internshipsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append("search", params.search);
    if (params.company) query.append("company", params.company);
    if (params.role) query.append("role", params.role);
    if (params.page) query.append("page", params.page);
    if (params.pageSize) query.append("pageSize", params.pageSize);
    return request("GET", `/internships?${query}`);
  },
};

export const internshipsAdminApi = {
  create: (dto) => request("POST", "/internships", dto),
  update: (id, dto) => request("PUT", `/internships/${id}`, dto),
  delete: (id) => request("DELETE", `/internships/${id}`),
};

export const applicationsApi = {
  apply: (internshipId, formData) => requestForm("POST", `/applications/${internshipId}`, formData),
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append("search", params.search);
    if (params.status) query.append("status", params.status);
    if (params.company) query.append("company", params.company);
    if (params.page) query.append("page", params.page);
    if (params.pageSize) query.append("pageSize", params.pageSize);
    return request("GET", `/applications?${query}`);
  },
  getMyApplications: () => request("GET", "/applications/my"),
  updateStatus: (id, status, adminNote = "") => request("PUT", `/applications/${id}/status`, { status, adminNote }),
  withdraw: (id) => request("DELETE", `/applications/${id}/withdraw`),
  getDetail: (id) => request("GET", `/applications/${id}/detail`),
  messageStudent: (id, message) => request("POST", `/applications/${id}/message`, { message }),
  getResumeUrl: (id) => `${BASE_URL}/applications/${id}/resume`,
};

export const noticesApi = {
  getAll: () => request("GET", "/notices"),
  create: (dto) => request("POST", "/notices", dto),
  delete: (id) => request("DELETE", `/notices/${id}`),
};

export const analyticsApi = {
  get: () => request("GET", "/analytics"),
};

export const exportApi = {
  downloadApplications: async () => {
    const res = await fetch(`${BASE_URL}/export/applications`, {
      credentials: "include"   // cookie sent automatically
    });
    if (!res.ok) throw new Error("Export failed");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `applications_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
};

export const usersApi = {
  getMe: () => request("GET", "/users/me"),
  updateMe: (dto) => request("PUT", "/users/me", dto),
  getMyStats: () => request("GET", "/users/me/stats"),
  uploadPhoto: (formData) => requestForm("POST", "/users/me/photo", formData),
  getPhotoUrl: () => `${BASE_URL}/users/me/photo?t=${Date.now()}`,
  fetchPhoto: async () => {
    const res = await fetch(`${BASE_URL}/users/me/photo`, {
      credentials: "include"   // cookie sent automatically
    });
    if (!res.ok) return null;
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  }
};

export const qaApi = {
  getQuestions: (internshipId) => request("GET", `/internships/${internshipId}/qa`),
  postQuestion: (internshipId, body) => request("POST", `/internships/${internshipId}/qa`, { body }),
  postAnswer: (internshipId, questionId, body) => request("POST", `/internships/${internshipId}/qa/${questionId}/answers`, { body }),
  deleteQuestion: (internshipId, questionId) => request("DELETE", `/internships/${internshipId}/qa/${questionId}`),
};
