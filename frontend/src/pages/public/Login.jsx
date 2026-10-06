import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "../../components/Navbar";
import ErrorMessage from "../../components/ErrorMessage";
import { useAuth } from "../../context/AuthContext";

const DASHBOARD_PATH = { PATIENT: "/patient/dashboard", DOCTOR: "/doctor/dashboard", ADMIN: "/admin/dashboard" };

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const user = await login(form.email, form.password);
      toast.success("Welcome back!");
      const redirectTo = location.state?.from?.pathname || DASHBOARD_PATH[user.role] || "/";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-16">
        <div className="card">
          <h1 className="text-2xl font-bold text-gray-900">Log in</h1>
          <p className="mt-1 text-sm text-gray-500">Access your patient, doctor, or admin dashboard.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <ErrorMessage message={error} />
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" name="email" required value={form.email} onChange={handleChange} placeholder="you@example.com" />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" name="password" required value={form.password} onChange={handleChange} placeholder="••••••••" />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don't have an account? <Link to="/register" className="font-medium text-brand-700">Register</Link>
          </p>

          <div className="mt-6 rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
            <p className="font-semibold">Demo credentials (password: Password@123)</p>
            <p>Patient: patient1@healthcare.demo</p>
            <p>Doctor: dr.sharma@healthcare.demo</p>
            <p>Admin: admin@healthcare.demo</p>
          </div>
        </div>
      </div>
    </div>
  );
}
