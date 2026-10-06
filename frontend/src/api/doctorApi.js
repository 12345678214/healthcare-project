import api from "./axios";

export const listDoctors = (params) => api.get("/doctors", { params }).then((r) => r.data);
export const getDoctorById = (id) => api.get(`/doctors/${id}`).then((r) => r.data);
export const getDoctorSlots = (id, date) =>
  api.get(`/doctors/${id}/availability`, { params: { date } }).then((r) => r.data);

export const getMyDoctorProfile = () => api.get("/doctors/profile").then((r) => r.data);
export const updateMyDoctorProfile = (payload) => api.put("/doctors/profile", payload).then((r) => r.data);
export const getMyAvailability = () => api.get("/doctors/availability").then((r) => r.data);
export const addAvailability = (payload) => api.post("/doctors/availability", payload).then((r) => r.data);
export const deleteAvailability = (id) => api.delete(`/doctors/availability/${id}`).then((r) => r.data);

export const getMyLeaves = () => api.get("/doctors/leaves").then((r) => r.data);
export const addLeave = (payload) => api.post("/doctors/leaves", payload).then((r) => r.data);
export const deleteLeave = (id) => api.delete(`/doctors/leaves/${id}`).then((r) => r.data);
