import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import LoadingSpinner from "../../components/LoadingSpinner";
import EmptyState from "../../components/EmptyState";
import StatusBadge from "../../components/StatusBadge";
import { doctorLinks } from "./_links";
import { listAppointments } from "../../api/appointmentApi";

const TABS = [
  { key: "PENDING", label: "Pending" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "COMPLETED", label: "Completed" },
  { key: "ALL", label: "All" },
];

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("PENDING");

  useEffect(() => {
    listAppointments()
      .then((res) => setAppointments(res.data.appointments))
      .finally(() => setLoading(false));
  }, []);

  const filtered = tab === "ALL" ? appointments : appointments.filter((a) => a.status === tab);

  return (
    <DashboardLayout links={doctorLinks} title="Appointments">
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              tab === t.key ? "bg-brand-600 text-white" : "bg-white text-gray-600 border border-gray-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState title="No appointments here" description="Nothing to show in this tab." />
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => (
            <div key={a.id} className="card flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="font-medium text-gray-900">{a.patient.fullName}</p>
                <p className="text-sm text-gray-500">
                  {new Date(a.appointmentDate).toLocaleDateString()} at {a.startTime}
                </p>
                {a.patient.phone && <p className="text-sm text-gray-500">Phone: {a.patient.phone}</p>}
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={a.status} />
                <Link to={`/doctor/appointments/${a.id}`} className="text-sm font-medium text-brand-700">Review</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
