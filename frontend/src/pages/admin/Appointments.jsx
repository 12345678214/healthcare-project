import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import LoadingSpinner from "../../components/LoadingSpinner";
import EmptyState from "../../components/EmptyState";
import StatusBadge from "../../components/StatusBadge";
import { adminLinks } from "./_links";
import { listAllAppointments } from "../../api/adminApi";

const STATUSES = ["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "REJECTED"];

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("ALL");

  useEffect(() => {
    setLoading(true);
    listAllAppointments(status === "ALL" ? {} : { status })
      .then((res) => setAppointments(res.data.appointments))
      .finally(() => setLoading(false));
  }, [status]);

  return (
    <DashboardLayout links={adminLinks} title="All Appointments">
      <div className="mb-4 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              status === s ? "bg-brand-600 text-white" : "bg-white text-gray-600 border border-gray-200"
            }`}
          >
            {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : appointments.length === 0 ? (
        <EmptyState title="No appointments found" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Doctor</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {appointments.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">{a.patient.fullName}</td>
                  <td className="px-4 py-3 text-gray-500">Dr. {a.doctor.fullName}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(a.appointmentDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-gray-500">{a.startTime}</td>
                  <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
