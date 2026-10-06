import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import DashboardLayout from "../../components/DashboardLayout";
import LoadingSpinner from "../../components/LoadingSpinner";
import EmptyState from "../../components/EmptyState";
import StatusBadge from "../../components/StatusBadge";
import { adminLinks } from "./_links";
import { listAllDoctors, updateDoctorApprovalStatus } from "../../api/adminApi";

const FILTERS = ["ALL", "PENDING", "APPROVED", "REJECTED"];

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  const load = () => {
    setLoading(true);
    listAllDoctors()
      .then((res) => setDoctors(res.data.doctors))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleStatusChange = async (id, status) => {
    try {
      await updateDoctorApprovalStatus(id, status);
      toast.success(`Doctor ${status.toLowerCase()}.`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed.");
    }
  };

  const filtered = filter === "ALL" ? doctors : doctors.filter((d) => d.approvalStatus === filter);

  return (
    <DashboardLayout links={adminLinks} title="Manage Doctors">
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              filter === f ? "bg-brand-600 text-white" : "bg-white text-gray-600 border border-gray-200"
            }`}
          >
            {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState title="No doctors found" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Specializations</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((d) => (
                <tr key={d.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">{d.fullName}</td>
                  <td className="px-4 py-3 text-gray-500">{d.user.email}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {d.specializations.map((s) => s.specialization.name).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={d.approvalStatus} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {d.approvalStatus !== "APPROVED" && (
                        <button className="text-brand-700 font-medium" onClick={() => handleStatusChange(d.id, "APPROVED")}>Approve</button>
                      )}
                      {d.approvalStatus !== "REJECTED" && (
                        <button className="text-red-600 font-medium" onClick={() => handleStatusChange(d.id, "REJECTED")}>Reject</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
