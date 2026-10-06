import api from "./axios";

export const createOrUpdateMedicalRecord = (payload) => api.post("/medical-records", payload).then((r) => r.data);
export const listMedicalRecords = () => api.get("/medical-records").then((r) => r.data);
export const getMedicalRecordById = (id) => api.get(`/medical-records/${id}`).then((r) => r.data);
