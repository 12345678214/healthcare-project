import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import DashboardLayout from "../../components/DashboardLayout";
import LoadingSpinner from "../../components/LoadingSpinner";
import { doctorLinks } from "./_links";
import { getMyDoctorProfile, updateMyDoctorProfile } from "../../api/doctorApi";
import { listSpecializations } from "../../api/specializationApi";
import StatusBadge from "../../components/StatusBadge";

export default function DoctorProfile() {
  const [form, setForm] = useState(null);
  const [specializations, setSpecializations] = useState([]);
  const [approvalStatus, setApprovalStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getMyDoctorProfile(), listSpecializations()]).then(([profileRes, specRes]) => {
      const d = profileRes.data.doctor;
      setForm({
        fullName: d.fullName || "",
        phone: d.phone || "",
        bio: d.bio || "",
        experienceYears: d.experienceYears ?? 0,
        qualifications: d.qualifications || "",
        consultationFee: d.consultationFee ?? 0,
        specializationIds: d.specializations.map((s) => s.specializationId),
      });
      setApprovalStatus(d.approvalStatus);
      setSpecializations(specRes.data.specializations);
      setLoading(false);
    });
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const toggleSpecialization = (id) => {
    setForm((f) => ({
      ...f,
      specializationIds: f.specializationIds.includes(id)
        ? f.specializationIds.filter((s) => s !== id)
        : [...f.specializationIds, id],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateMyDoctorProfile({
        ...form,
        experienceYears: Number(form.experienceYears),
        consultationFee: Number(form.consultationFee),
      });
      toast.success("Profile updated.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout links={doctorLinks} title="My Profile">
      <div className="card max-w-xl">
        {loading || !form ? (
          <LoadingSpinner />
        ) : (
          <>
            <div className="mb-4 flex items-center gap-2">
              <span className="text-sm text-gray-500">Account status:</span>
              <StatusBadge status={approvalStatus} />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Full name</label>
                <input className="input" name="fullName" value={form.fullName} onChange={handleChange} required />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" name="phone" value={form.phone} onChange={handleChange} />
              </div>
              <div>
                <label className="label">Bio</label>
                <textarea className="input" name="bio" rows={3} value={form.bio} onChange={handleChange} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Experience (years)</label>
                  <input className="input" type="number" min="0" name="experienceYears" value={form.experienceYears} onChange={handleChange} />
                </div>
                <div>
                  <label className="label">Consultation fee (₹)</label>
                  <input className="input" type="number" min="0" name="consultationFee" value={form.consultationFee} onChange={handleChange} />
                </div>
              </div>
              <div>
                <label className="label">Qualifications</label>
                <input className="input" name="qualifications" value={form.qualifications} onChange={handleChange} placeholder="MBBS, MD ..." />
              </div>
              <div>
                <label className="label">Specializations</label>
                <div className="flex flex-wrap gap-2">
                  {specializations.map((s) => (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => toggleSpecialization(s.id)}
                      className={`rounded-full border px-3 py-1 text-sm ${
                        form.specializationIds.includes(s.id)
                          ? "border-brand-600 bg-brand-600 text-white"
                          : "border-gray-300 text-gray-600"
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Save changes"}
              </button>
            </form>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
