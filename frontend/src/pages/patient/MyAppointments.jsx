import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import DashboardLayout from "../../components/DashboardLayout";
import LoadingSpinner from "../../components/LoadingSpinner";
import EmptyState from "../../components/EmptyState";
import StatusBadge from "../../components/StatusBadge";
import ConfirmDialog from "../../components/ConfirmDialog";

import { patientLinks } from "./_links";
import {
  listAppointments,
  cancelAppointment,
} from "../../api/appointmentApi";

const TABS = [
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
  { key: "all", label: "All" },
];

export default function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("upcoming");
  const [cancelTarget, setCancelTarget] = useState(null);
  const [view, setView] = useState("list");

  // Load appointments from the backend
  const load = useCallback(async () => {
    setLoading(true);

    try {
      const res = await listAppointments();

      setAppointments(res.data.appointments || []);
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Could not load appointments."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Filter appointments based on the selected tab
  const filtered = appointments.filter((a) => {
    if (tab === "upcoming") {
      return ["PENDING", "CONFIRMED"].includes(a.status);
    }

    if (tab === "past") {
      return [
        "COMPLETED",
        "CANCELLED",
        "REJECTED",
      ].includes(a.status);
    }

    return true;
  });

  // Cancel appointment
  const handleCancel = async () => {
    if (!cancelTarget) return;

    try {
      await cancelAppointment(cancelTarget.id);

      toast.success("Appointment cancelled.");

      setCancelTarget(null);

      await load();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Could not cancel appointment."
      );
    }
  };

  return (
    <DashboardLayout
      links={patientLinks}
      title="My Appointments"
    >
      {/* Tabs and View Switcher */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                tab === t.key
                  ? "bg-brand-600 text-white"
                  : "bg-white text-gray-600 border border-gray-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setView("list")}
            className={`rounded-full px-4 py-1.5 text-sm font-bold ${
              view === "list"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "border border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            }`}
          >
            List
          </button>

          <button
            onClick={() => setView("calendar")}
            className={`rounded-full px-4 py-1.5 text-sm font-bold ${
              view === "calendar"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "border border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            }`}
          >
            Calendar
          </button>
        </div>
      </div>

      {/* Appointment Content */}
      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No appointments here"
          description="Nothing to show in this tab yet."
        />
      ) : view === "calendar" ? (
        <CalendarView appointments={filtered} />
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => (
            <div
              key={a.id}
              className="card flex flex-col justify-between gap-3 sm:flex-row sm:items-center"
            >
              <div>
                <p className="font-medium text-gray-900">
                  Dr. {a.doctor.fullName}
                </p>

                <p className="text-sm text-gray-500">
                  {new Date(
                    a.appointmentDate
                  ).toLocaleDateString()}{" "}
                  at {a.startTime}
                </p>

                {a.reasonForVisit && (
                  <p className="mt-1 text-sm text-gray-500">
                    Reason: {a.reasonForVisit}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <StatusBadge status={a.status} />

                <Link
                  to={`/patient/appointments/${a.id}`}
                  className="text-sm font-medium text-brand-700"
                >
                  Details
                </Link>

                {["PENDING", "CONFIRMED"].includes(
                  a.status
                ) && (
                  <button
                    className="text-sm font-medium text-red-600"
                    onClick={() => setCancelTarget(a)}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        open={!!cancelTarget}
        title="Cancel this appointment?"
        description="This action cannot be undone. You'll need to book a new appointment if you change your mind."
        confirmLabel="Yes, cancel"
        danger
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </DashboardLayout>
  );
}

// Calendar View
function CalendarView({ appointments }) {
  const days = Array.from(
    { length: 14 },
    (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return d;
    }
  );

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {days.map((d) => {
        const key = d.toISOString().slice(0, 10);

        const day = appointments.filter(
          (a) =>
            new Date(a.appointmentDate)
              .toISOString()
              .slice(0, 10) === key
        );

        return (
          <div
            key={key}
            className={`min-h-32 rounded-2xl border p-4 ${
              day.length
                ? "border-brand-200 bg-brand-50/50 dark:bg-brand-900/10"
                : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              {d.toLocaleDateString(undefined, {
                weekday: "short",
              })}
            </p>

            <p className="mt-1 text-xl font-black dark:text-white">
              {d.getDate()}
            </p>

            <div className="mt-3 space-y-2">
              {day.length ? (
                day.map((a) => (
                  <Link
                    key={a.id}
                    to={`/patient/appointments/${a.id}`}
                    className="block rounded-lg bg-white p-2 text-xs shadow-sm dark:bg-slate-800"
                  >
                    <span className="font-bold dark:text-white">
                      {a.startTime}
                    </span>

                    <span className="ml-2 text-slate-500">
                      Dr.{" "}
                      {a.doctor.fullName
                        .split(" ")
                        .slice(-1)[0]}
                    </span>
                  </Link>
                ))
              ) : (
                <span className="text-xs text-slate-400">
                  No appointments
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}