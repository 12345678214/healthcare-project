import api from "./axios";

export const getDashboardStats = () => api.get("/admin/dashboard").then((r) => r.data);
export const listUsers = () => api.get("/admin/users").then((r) => r.data);
export const listAllDoctors = () => api.get("/admin/doctors").then((r) => r.data);
export const listAllPatients = () => api.get("/admin/patients").then((r) => r.data);
export const listAllAppointments = (params) => api.get("/admin/appointments", { params }).then((r) => r.data);
export const updateDoctorApprovalStatus = (id, status) =>
  api.patch(`/admin/doctors/${id}/status`, { status }).then((r) => r.data);
export const updateUserActiveStatus = (id, isActive) =>
  api.patch(`/admin/users/${id}/status`, { isActive }).then((r) => r.data);
export const createSpecialization = (payload) => api.post("/admin/specializations", payload).then((r) => r.data);
export const getSystemActivity = () => api.get("/admin/activity").then((r) => r.data);
