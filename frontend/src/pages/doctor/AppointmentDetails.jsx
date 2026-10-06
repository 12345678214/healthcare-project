import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import DashboardLayout from "../../components/DashboardLayout";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorMessage from "../../components/ErrorMessage";
import StatusBadge from "../../components/StatusBadge";
import ConfirmDialog from "../../components/ConfirmDialog";
import { doctorLinks } from "./_links";
import { getAppointmentById, updateAppointmentStatus, cancelAppointment } from "../../api/appointmentApi";
import MedicalRecordEditor from "../../components/MedicalRecordEditor";

export default function DoctorAppointmentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmAction, setConfirmAction] = useState(null); // { type, label }

  const load = () => {
    setLoading(true);
    getAppointmentById(id)
      .then((res) => setAppointment(res.data.appointment))
      .catch(() => setError("Appointment not found."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const handleStatusChange = async (status) => {
    try {
      await updateAppointmentStatus(id, status);
      toast.success(`Appointment marked as ${status.toLowerCase()}.`);
      setConfirmAction(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update status.");
    }
  };

  const handleCancel = async () => {
    try {
      await cancelAppointment(id);
      toast.success("Appointment cancelled.");
      setConfirmAction(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not cancel.");
    }
  };

  if (loading) return <DashboardLayout links={doctorLinks}><LoadingSpinner /></DashboardLayout>;
  if (error || !appointment) return <DashboardLayout links={doctorLinks}><ErrorMessage message={error} /></DashboardLayout>;

  const { status } = appointment;

  return (
    <DashboardLayout links={doctorLinks} title="Appointment Details">
      <div className="card max-w-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{appointment.patient.fullName}</h2>
          <StatusBadge status={status} />
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-y-3 text-sm">
          <dt className="text-gray-500">Date</dt>
          <dd className="text-gray-900">{new Date(appointment.appointmentDate).toLocaleDateString()}</dd>
          <dt className="text-gray-500">Time</dt>
          <dd className="text-gray-900">{appointment.startTime} – {appointment.endTime}</dd>
          <dt className="text-gray-500">Phone</dt>
          <dd className="text-gray-900">{appointment.patient.phone || "—"}</dd>
          <dt className="text-gray-500">Reason for visit</dt>
          <dd className="text-gray-900">{appointment.reasonForVisit || "—"}</dd>
        </dl>

        <div className="mt-6 flex flex-wrap gap-3">
          {status === "PENDING" && (
            <>
              <button className="btn-primary" onClick={() => setConfirmAction("CONFIRMED")}>Confirm</button>
              <button className="btn-danger" onClick={() => setConfirmAction("REJECTED")}>Reject</button>
            </>
          )}
          {status === "CONFIRMED" && (
            <>
              <button className="btn-primary" onClick={() => setConfirmAction("COMPLETED")}>Mark as Completed</button>
              <button className="btn-secondary" onClick={() => setConfirmAction("CANCEL")}>Cancel</button>
            </>
          )}
        </div>

        {status === "COMPLETED" && (
          <MedicalRecordEditor
            appointmentId={appointment.id}
            record={appointment.medicalRecord}
            onSaved={(medicalRecord) => setAppointment({ ...appointment, medicalRecord })}
          />
        )}
      </div>

      <ConfirmDialog
        open={!!confirmAction}
        title={
          confirmAction === "CANCEL"
            ? "Cancel this appointment?"
            : `Mark appointment as ${confirmAction?.toLowerCase()}?`
        }
        confirmLabel="Confirm"
        danger={confirmAction === "REJECTED" || confirmAction === "CANCEL"}
        onConfirm={() => (confirmAction === "CANCEL" ? handleCancel() : handleStatusChange(confirmAction))}
        onCancel={() => setConfirmAction(null)}
      />

      <button className="mt-4 text-sm text-brand-700" onClick={() => navigate(-1)}>← Back</button>
    </DashboardLayout>
  );
}
