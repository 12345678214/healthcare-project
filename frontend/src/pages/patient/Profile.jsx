import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import DashboardLayout from "../../components/DashboardLayout";
import LoadingSpinner from "../../components/LoadingSpinner";
import { patientLinks } from "./_links";
import { getMyPatientProfile, updateMyPatientProfile } from "../../api/patientApi";

export default function PatientProfile() {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMyPatientProfile()
      .then((res) => {
        const p = res.data.patient;
        setForm({
          fullName: p.fullName || "",
          phone: p.phone || "",
          dob: p.dob ? p.dob.slice(0, 10) : "",
          gender: p.gender || "",
          address: p.address || "",
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateMyPatientProfile(form);
      toast.success("Profile updated.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout links={patientLinks} title="My Profile">
      <div className="card max-w-lg">
        {loading || !form ? (
          <LoadingSpinner />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full name</label>
              <input className="input" name="fullName" value={form.fullName} onChange={handleChange} required />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" name="phone" value={form.phone} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Date of birth</label>
                <input className="input" type="date" name="dob" value={form.dob} onChange={handleChange} />
              </div>
              <div>
                <label className="label">Gender</label>
                <select className="input" name="gender" value={form.gender} onChange={handleChange}>
                  <option value="">Prefer not to say</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Address</label>
              <textarea className="input" name="address" rows={3} value={form.address} onChange={handleChange} />
            </div>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </button>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
