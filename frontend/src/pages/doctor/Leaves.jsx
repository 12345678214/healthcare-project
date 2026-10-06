import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import DashboardLayout from "../../components/DashboardLayout";
import LoadingSpinner from "../../components/LoadingSpinner";
import EmptyState from "../../components/EmptyState";
import ConfirmDialog from "../../components/ConfirmDialog";
import { doctorLinks } from "./_links";
import { getMyLeaves, addLeave, deleteLeave } from "../../api/doctorApi";

export default function DoctorLeaves() {
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ startDate: "", endDate: "", reason: "" });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = () => {
    setLoading(true);
    getMyLeaves()
      .then((res) => {
        setUpcoming(res.data.upcoming);
        setPast(res.data.past);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await addLeave({
        startDate: form.startDate,
        endDate: form.endDate || form.startDate,
        reason: form.reason,
      });
      if (res.data.conflictingAppointmentCount > 0) {
        toast(
          `Leave added — but you have ${res.data.conflictingAppointmentCount} existing appointment(s) during this period. Please review them.`,
          { icon: "⚠️", duration: 6000 }
        );
      } else {
        toast.success("Leave added.");
      }
      setForm({ startDate: "", endDate: "", reason: "" });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not add leave.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteLeave(deleteTarget.id);
      toast.success("Leave removed.");
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not remove leave.");
    }
  };

  return (
    <DashboardLayout links={doctorLinks} title="Leave / Holidays">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-1">
          <h3 className="font-semibold text-gray-900">Add leave</h3>
          <p className="mt-1 text-xs text-gray-500">
            Patients won't be able to book appointments with you during this period.
          </p>
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div>
              <label className="label">From</label>
              <input
                type="date"
                className="input"
                name="startDate"
                required
                min={new Date().toISOString().slice(0, 10)}
                value={form.startDate}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="label">To (leave blank for a single day)</label>
              <input
                type="date"
                className="input"
                name="endDate"
                min={form.startDate || new Date().toISOString().slice(0, 10)}
                value={form.endDate}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="label">Reason (optional)</label>
              <input className="input" name="reason" value={form.reason} onChange={handleChange} placeholder="e.g. Personal leave, conference" />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={saving}>
              {saving ? "Adding..." : "Add leave"}
            </button>
          </form>
        </div>

        <div className="card lg:col-span-2">
          <h3 className="font-semibold text-gray-900">Upcoming leaves</h3>
          <div className="mt-3">
            {loading ? (
              <LoadingSpinner />
            ) : upcoming.length === 0 ? (
              <EmptyState title="No upcoming leaves" description="Add one on the left when you need time off." />
            ) : (
              <div className="space-y-2">
                {upcoming.map((l) => (
                  <div key={l.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-2">
                    <div>
                      <span className="font-medium text-gray-800">
                        {new Date(l.startDate).toLocaleDateString()}
                        {l.startDate !== l.endDate && ` – ${new Date(l.endDate).toLocaleDateString()}`}
                      </span>
                      {l.reason && <span className="ml-2 text-sm text-gray-500">({l.reason})</span>}
                    </div>
                    <button className="text-sm font-medium text-red-600" onClick={() => setDeleteTarget(l)}>Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {past.length > 0 && (
            <div className="mt-6 border-t border-gray-100 pt-4">
              <h3 className="font-semibold text-gray-900">Past leaves</h3>
              <div className="mt-3 space-y-2">
                {past.map((l) => (
                  <div key={l.id} className="rounded-lg bg-gray-50 px-4 py-2 text-sm text-gray-500">
                    {new Date(l.startDate).toLocaleDateString()}
                    {l.startDate !== l.endDate && ` – ${new Date(l.endDate).toLocaleDateString()}`}
                    {l.reason && ` (${l.reason})`}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Remove this leave entry?"
        confirmLabel="Remove"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </DashboardLayout>
  );
}
