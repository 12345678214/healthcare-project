import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import DashboardLayout from "../../components/DashboardLayout";
import LoadingSpinner from "../../components/LoadingSpinner";
import EmptyState from "../../components/EmptyState";
import { doctorLinks } from "./_links";
import { getMyAvailability, addAvailability, deleteAvailability } from "../../api/doctorApi";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function DoctorAvailability() {
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ dayOfWeek: 1, startTime: "09:00", endTime: "13:00", slotDurationMinutes: 30 });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    getMyAvailability()
      .then((res) => setAvailability(res.data.availability))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await addAvailability({
        dayOfWeek: Number(form.dayOfWeek),
        startTime: form.startTime,
        endTime: form.endTime,
        slotDurationMinutes: Number(form.slotDurationMinutes),
      });
      toast.success("Availability window added.");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not add availability.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAvailability(id);
      toast.success("Availability window removed.");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not remove.");
    }
  };

  return (
    <DashboardLayout links={doctorLinks} title="Manage Availability">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-1">
          <h3 className="font-semibold text-gray-900">Add availability window</h3>
          <form onSubmit={handleAdd} className="mt-4 space-y-3">
            <div>
              <label className="label">Day of week</label>
              <select className="input" name="dayOfWeek" value={form.dayOfWeek} onChange={handleChange}>
                {DAY_NAMES.map((name, idx) => (
                  <option key={idx} value={idx}>{name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Start time</label>
                <input className="input" type="time" name="startTime" value={form.startTime} onChange={handleChange} />
              </div>
              <div>
                <label className="label">End time</label>
                <input className="input" type="time" name="endTime" value={form.endTime} onChange={handleChange} />
              </div>
            </div>
            <div>
              <label className="label">Slot duration (minutes)</label>
              <select className="input" name="slotDurationMinutes" value={form.slotDurationMinutes} onChange={handleChange}>
                {[15, 20, 30, 45, 60].map((m) => <option key={m} value={m}>{m} min</option>)}
              </select>
            </div>
            <button type="submit" className="btn-primary w-full" disabled={saving}>
              {saving ? "Adding..." : "Add window"}
            </button>
          </form>
        </div>

        <div className="card lg:col-span-2">
          <h3 className="font-semibold text-gray-900">Your weekly schedule</h3>
          <div className="mt-4">
            {loading ? (
              <LoadingSpinner />
            ) : availability.length === 0 ? (
              <EmptyState title="No availability set" description="Add a window on the left so patients can book you." />
            ) : (
              <div className="space-y-2">
                {availability.map((w) => (
                  <div key={w.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-2">
                    <div>
                      <span className="font-medium text-gray-800">{DAY_NAMES[w.dayOfWeek]}</span>{" "}
                      <span className="text-sm text-gray-500">{w.startTime} – {w.endTime} ({w.slotDurationMinutes} min slots)</span>
                    </div>
                    <button className="text-sm font-medium text-red-600" onClick={() => handleDelete(w.id)}>Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
