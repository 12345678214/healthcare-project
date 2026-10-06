import api from "./axios";

export const createAppointment = (payload) => api.post("/appointments", payload).then((r) => r.data);
export const listAppointments = (params) => api.get("/appointments", { params }).then((r) => r.data);
export const getAppointmentById = (id) => api.get(`/appointments/${id}`).then((r) => r.data);
export const rescheduleAppointment = (id, payload) => api.put(`/appointments/${id}`, payload).then((r) => r.data);
export const cancelAppointment = (id) => api.patch(`/appointments/${id}/cancel`).then((r) => r.data);
export const updateAppointmentStatus = (id, status) =>
  api.patch(`/appointments/${id}/status`, { status }).then((r) => r.data);
