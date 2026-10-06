import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import LoadingSpinner from "../../components/LoadingSpinner";
import EmptyState from "../../components/EmptyState";
import { adminLinks } from "./_links";
import { listAllPatients } from "../../api/adminApi";

export default function AdminPatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listAllPatients()
      .then((res) => setPatients(res.data.patients))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout links={adminLinks} title="Manage Patients">
      {loading ? (
        <LoadingSpinner />
      ) : patients.length === 0 ? (
        <EmptyState title="No patients registered yet" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Gender</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {patients.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">{p.fullName}</td>
                  <td className="px-4 py-3 text-gray-500">{p.user.email}</td>
                  <td className="px-4 py-3 text-gray-500">{p.phone || "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{p.gender || "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
