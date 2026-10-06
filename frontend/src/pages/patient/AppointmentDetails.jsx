import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import DashboardLayout from "../../components/DashboardLayout";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorMessage from "../../components/ErrorMessage";
import StatusBadge from "../../components/StatusBadge";
import ConfirmDialog from "../../components/ConfirmDialog";
import { patientLinks } from "./_links";
import { getAppointmentById, cancelAppointment, rescheduleAppointment } from "../../api/appointmentApi";
import { getDoctorSlots } from "../../api/doctorApi";

export default function PatientAppointmentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCancel, setShowCancel] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [onLeave, setOnLeave] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const load = () => {
    setLoading(true);
    getAppointmentById(id)
      .then((res) => setAppointment(res.data.appointment))
      .catch(() => setError("Appointment not found."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  useEffect(() => {
    if (!rescheduling || !newDate || !appointment) return;
    getDoctorSlots(appointment.doctorId, newDate).then((res) => {
      setSlots(res.data.slots);
      setOnLeave(Boolean(res.data.onLeave));
    });
  }, [rescheduling, newDate, appointment]);

  const handleCancel = async () => {
    try {
      await cancelAppointment(id);
      toast.success("Appointment cancelled.");
      setShowCancel(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not cancel.");
    }
  };

  const handleReschedule = async () => {
    try {
      await rescheduleAppointment(id, { appointmentDate: newDate, startTime: selectedSlot.startTime });
      toast.success("Appointment rescheduled — pending doctor confirmation again.");
      setRescheduling(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not reschedule.");
    }
  };

  if (loading) return <DashboardLayout links={patientLinks}><LoadingSpinner /></DashboardLayout>;
  if (error || !appointment) return <DashboardLayout links={patientLinks}><ErrorMessage message={error} /></DashboardLayout>;

  const canModify = ["PENDING", "CONFIRMED"].includes(appointment.status);

  return (
    <DashboardLayout links={patientLinks} title="Appointment Details">
      <div className="card max-w-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Dr. {appointment.doctor.fullName}</h2>
          <StatusBadge status={appointment.status} />
        </div>
        <p className="mt-1 text-sm text-gray-500">
          {appointment.doctor.specializations?.map((s) => s.specialization.name).join(", ")}
        </p>

        <dl className="mt-4 grid grid-cols-2 gap-y-3 text-sm">
          <dt className="text-gray-500">Date</dt>
          <dd className="text-gray-900">{new Date(appointment.appointmentDate).toLocaleDateString()}</dd>
          <dt className="text-gray-500">Time</dt>
          <dd className="text-gray-900">{appointment.startTime} – {appointment.endTime}</dd>
          <dt className="text-gray-500">Reason for visit</dt>
          <dd className="text-gray-900">{appointment.reasonForVisit || "—"}</dd>
          <dt className="text-gray-500">Consultation fee</dt>
          <dd className="text-gray-900">₹{Number(appointment.doctor.consultationFee).toFixed(0)}</dd>
        </dl>

        {canModify && !rescheduling && (
          <div className="mt-6 flex gap-3">
            <button className="btn-secondary" onClick={() => setRescheduling(true)}>Reschedule</button>
            <button className="btn-danger" onClick={() => setShowCancel(true)}>Cancel Appointment</button>
          </div>
        )}

        {appointment.status === "COMPLETED" && (
          <div className="mt-6 border-t border-gray-100 pt-4">
            <h3 className="font-medium text-gray-900">Medical Record</h3>
            {appointment.medicalRecord ? (
              <div className="mt-3 space-y-3 text-sm">
                {appointment.medicalRecord.diagnosis && (
                  <div><span className="font-medium text-gray-700">Diagnosis: </span>{appointment.medicalRecord.diagnosis}</div>
                )}
                {appointment.medicalRecord.symptoms && (
                  <div><span className="font-medium text-gray-700">Symptoms: </span>{appointment.medicalRecord.symptoms}</div>
                )}
                {appointment.medicalRecord.doctorNotes && (
                  <div><span className="font-medium text-gray-700">Doctor's notes: </span>{appointment.medicalRecord.doctorNotes}</div>
                )}
                {appointment.medicalRecord.followUpDate && (
                  <div><span className="font-medium text-gray-700">Follow-up date: </span>{new Date(appointment.medicalRecord.followUpDate).toLocaleDateString()}</div>
                )}
                {appointment.medicalRecord.prescriptionItems?.length > 0 && (
                  <div>
                    <span className="font-medium text-gray-700">Prescription:</span>
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                      {appointment.medicalRecord.prescriptionItems.map((m) => (
                        <li key={m.id}>
                          {m.medicineName}{m.dosage ? ` — ${m.dosage}` : ""}{m.instructions ? ` (${m.instructions})` : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-500">The doctor hasn't added a medical record for this visit yet.</p>
            )}
          </div>
        )}

        {rescheduling && (
          <div className="mt-6 border-t border-gray-100 pt-4">
            <h3 className="font-medium text-gray-900">Choose a new date & time</h3>
            <input
              type="date"
              className="input mt-2"
              min={new Date().toISOString().slice(0, 10)}
              value={newDate}
              onChange={(e) => { setNewDate(e.target.value); setSelectedSlot(null); }}
            />
            {newDate && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {onLeave ? (
                  <p className="col-span-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    The doctor is on leave on this date. Please choose another date.
                  </p>
                ) : slots.length === 0 ? (
                  <p className="col-span-4 text-sm text-gray-500">No free slots on this date.</p>
                ) : (
                  slots.map((s) => (
                    <button
                      key={s.startTime}
                      onClick={() => setSelectedSlot(s)}
                      className={`rounded-lg border px-2 py-1.5 text-sm ${
                        selectedSlot?.startTime === s.startTime ? "border-brand-600 bg-brand-600 text-white" : "border-gray-200"
                      }`}
                    >
                      {s.startTime}
                    </button>
                  ))
                )}
              </div>
            )}
            <div className="mt-4 flex gap-3">
              <button className="btn-secondary" onClick={() => setRescheduling(false)}>Cancel</button>
              <button className="btn-primary" disabled={!selectedSlot} onClick={handleReschedule}>Confirm reschedule</button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showCancel}
        title="Cancel this appointment?"
        confirmLabel="Yes, cancel"
        danger
        onConfirm={handleCancel}
        onCancel={() => setShowCancel(false)}
      />

      <button className="mt-4 text-sm text-brand-700" onClick={() => navigate(-1)}>← Back</button>
    </DashboardLayout>
  );
}
