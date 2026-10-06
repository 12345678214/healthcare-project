import api from "./axios";

export const getMyPatientProfile = () => api.get("/patients/profile").then((r) => r.data);
export const updateMyPatientProfile = (payload) => api.put("/patients/profile", payload).then((r) => r.data);
