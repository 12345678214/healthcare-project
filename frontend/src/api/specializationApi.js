import api from "./axios";

// Public endpoint — no auth required.
export const listSpecializations = () => api.get("/specializations").then((r) => r.data);
