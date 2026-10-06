import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import DashboardLayout from "../../components/DashboardLayout";
import LoadingSpinner from "../../components/LoadingSpinner";
import EmptyState from "../../components/EmptyState";
import { adminLinks } from "./_links";
import { listSpecializations } from "../../api/specializationApi";
import { createSpecialization } from "../../api/adminApi";

export default function AdminSpecializations() {
  const [specializations, setSpecializations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    listSpecializations()
      .then((res) => setSpecializations(res.data.specializations))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createSpecialization(form);
      toast.success("Specialization added.");
      setForm({ name: "", description: "" });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not add specialization.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout links={adminLinks} title="Specializations / Departments">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-1">
          <h3 className="font-semibold text-gray-900">Add specialization</h3>
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div>
              <label className="label">Name</label>
              <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Neurology" />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={saving}>
              {saving ? "Adding..." : "Add specialization"}
            </button>
          </form>
        </div>

        <div className="card lg:col-span-2">
          <h3 className="font-semibold text-gray-900">Existing specializations</h3>
          <div className="mt-4">
            {loading ? (
              <LoadingSpinner />
            ) : specializations.length === 0 ? (
              <EmptyState title="No specializations yet" />
            ) : (
              <ul className="divide-y divide-gray-100">
                {specializations.map((s) => (
                  <li key={s.id} className="py-3">
                    <p className="font-medium text-gray-900">{s.name}</p>
                    {s.description && <p className="text-sm text-gray-500">{s.description}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
