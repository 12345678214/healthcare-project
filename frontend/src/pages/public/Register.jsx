import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "../../components/Navbar";
import ErrorMessage from "../../components/ErrorMessage";
import { useAuth } from "../../context/AuthContext";

const DASHBOARD_PATH = { PATIENT: "/patient/dashboard", DOCTOR: "/doctor/dashboard" };

export default function Register() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", role: "PATIENT", phone: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const user = await register(form);
      toast.success("Account created!");
      if (user.role === "DOCTOR") {
        toast("Your doctor account needs admin approval before it appears in search.", { icon: "ℹ️" });
      }
      navigate(DASHBOARD_PATH[user.role] || "/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-16">
        <div className="card">
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="mt-1 text-sm text-gray-500">Register as a patient to book appointments, or as a doctor to offer them.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <ErrorMessage message={error} />

            <div>
              <label className="label">I am a</label>
              <div className="grid grid-cols-2 gap-3">
                {["PATIENT", "DOCTOR"].map((role) => (
                  <button
                    type="button"
                    key={role}
                    onClick={() => setForm({ ...form, role })}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                      form.role === role ? "border-brand-600 bg-brand-50 text-brand-700" : "border-gray-300 text-gray-600"
                    }`}
                  >
                    {role === "PATIENT" ? "Patient" : "Doctor"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Full name</label>
              <input className="input" name="fullName" required value={form.fullName} onChange={handleChange} placeholder="Jane Doe" />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" name="email" required value={form.email} onChange={handleChange} placeholder="you@example.com" />
            </div>
            <div>
              <label className="label">Phone (optional)</label>
              <input className="input" name="phone" value={form.phone} onChange={handleChange} placeholder="9800000000" />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" name="password" required minLength={6} value={form.password} onChange={handleChange} placeholder="At least 6 characters" />
            </div>

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account? <Link to="/login" className="font-medium text-brand-700">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
