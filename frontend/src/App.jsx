import React from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

// Public pages
import Home from "./pages/public/Home";
import About from "./pages/public/About";
import Doctors from "./pages/public/Doctors";
import DoctorDetails from "./pages/public/DoctorDetails";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";
import Unauthorized from "./pages/public/Unauthorized";
import NotFound from "./pages/public/NotFound";

// Patient pages
import PatientDashboard from "./pages/patient/Dashboard";
import PatientProfile from "./pages/patient/Profile";
import BookAppointment from "./pages/patient/BookAppointment";
import MyAppointments from "./pages/patient/MyAppointments";
import PatientAppointmentDetails from "./pages/patient/AppointmentDetails";
import PatientNotifications from "./pages/patient/Notifications";
import PatientMedicalRecords from "./pages/patient/MedicalRecords";

// Doctor pages
import DoctorDashboard from "./pages/doctor/Dashboard";
import DoctorProfile from "./pages/doctor/Profile";
import DoctorAvailability from "./pages/doctor/Availability";
import DoctorLeaves from "./pages/doctor/Leaves";
import DoctorAppointments from "./pages/doctor/Appointments";
import DoctorAppointmentDetails from "./pages/doctor/AppointmentDetails";

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminDoctors from "./pages/admin/Doctors";
import AdminPatients from "./pages/admin/Patients";
import AdminAppointments from "./pages/admin/Appointments";
import AdminSpecializations from "./pages/admin/Specializations";

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/doctors" element={<Doctors />} />
      <Route path="/doctors/:id" element={<DoctorDetails />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Patient (protected) */}
      <Route path="/patient/dashboard" element={<ProtectedRoute roles={["PATIENT"]}><PatientDashboard /></ProtectedRoute>} />
      <Route path="/patient/profile" element={<ProtectedRoute roles={["PATIENT"]}><PatientProfile /></ProtectedRoute>} />
      <Route path="/patient/book/:doctorId" element={<ProtectedRoute roles={["PATIENT"]}><BookAppointment /></ProtectedRoute>} />
      <Route path="/patient/appointments" element={<ProtectedRoute roles={["PATIENT"]}><MyAppointments /></ProtectedRoute>} />
      <Route path="/patient/appointments/:id" element={<ProtectedRoute roles={["PATIENT"]}><PatientAppointmentDetails /></ProtectedRoute>} />
      <Route path="/patient/notifications" element={<ProtectedRoute roles={["PATIENT"]}><PatientNotifications /></ProtectedRoute>} />
      <Route path="/patient/medical-records" element={<ProtectedRoute roles={["PATIENT"]}><PatientMedicalRecords /></ProtectedRoute>} />

      {/* Doctor (protected) */}
      <Route path="/doctor/dashboard" element={<ProtectedRoute roles={["DOCTOR"]}><DoctorDashboard /></ProtectedRoute>} />
      <Route path="/doctor/profile" element={<ProtectedRoute roles={["DOCTOR"]}><DoctorProfile /></ProtectedRoute>} />
      <Route path="/doctor/availability" element={<ProtectedRoute roles={["DOCTOR"]}><DoctorAvailability /></ProtectedRoute>} />
      <Route path="/doctor/leaves" element={<ProtectedRoute roles={["DOCTOR"]}><DoctorLeaves /></ProtectedRoute>} />
      <Route path="/doctor/appointments" element={<ProtectedRoute roles={["DOCTOR"]}><DoctorAppointments /></ProtectedRoute>} />
      <Route path="/doctor/appointments/:id" element={<ProtectedRoute roles={["DOCTOR"]}><DoctorAppointmentDetails /></ProtectedRoute>} />

      {/* Admin (protected) */}
      <Route path="/admin/dashboard" element={<ProtectedRoute roles={["ADMIN"]}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute roles={["ADMIN"]}><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/doctors" element={<ProtectedRoute roles={["ADMIN"]}><AdminDoctors /></ProtectedRoute>} />
      <Route path="/admin/patients" element={<ProtectedRoute roles={["ADMIN"]}><AdminPatients /></ProtectedRoute>} />
      <Route path="/admin/appointments" element={<ProtectedRoute roles={["ADMIN"]}><AdminAppointments /></ProtectedRoute>} />
      <Route path="/admin/specializations" element={<ProtectedRoute roles={["ADMIN"]}><AdminSpecializations /></ProtectedRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
