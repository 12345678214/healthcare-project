import React, { useState } from "react";
import toast from "react-hot-toast";
import { createOrUpdateMedicalRecord } from "../api/medicalRecordApi";

// Lets a doctor create or edit the single medical record attached to a
// COMPLETED appointment, including a dynamic list of prescribed
// medicines. `record` is the existing MedicalRecord (or null/undefined
// if none exists yet) as returned by GET /appointments/:id.
export default function MedicalRecordEditor({ appointmentId, record, onSaved }) {
  const [editing, setEditing] = useState(!record);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    diagnosis: record?.diagnosis || "",
    symptoms: record?.symptoms || "",
    doctorNotes: record?.doctorNotes || "",
    followUpDate: record?.followUpDate ? record.followUpDate.slice(0, 10) : "",
    medicines:
      record?.prescriptionItems?.length > 0
        ? record.prescriptionItems.map((m) => ({ medicineName: m.medicineName, dosage: m.dosage || "", instructions: m.instructions || "" }))
        : [{ medicineName: "", dosage: "", instructions: "" }],
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const updateMedicine = (index, field, value) => {
    const next = [...form.medicines];
    next[index] = { ...next[index], [field]: value };
    setForm({ ...form, medicines: next });
  };

  const addMedicineRow = () => setForm({ ...form, medicines: [...form.medicines, { medicineName: "", dosage: "", instructions: "" }] });
  const removeMedicineRow = (index) => setForm({ ...form, medicines: form.medicines.filter((_, i) => i !== index) });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const medicines = form.medicines.filter((m) => m.medicineName.trim());
      const res = await createOrUpdateMedicalRecord({
        appointmentId,
        diagnosis: form.diagnosis,
        symptoms: form.symptoms,
        doctorNotes: form.doctorNotes,
        followUpDate: form.followUpDate || undefined,
        medicines,
      });
      toast.success("Medical record saved.");
      setEditing(false);
      onSaved?.(res.data.medicalRecord);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save medical record.");
    } finally {
      setSaving(false);
    }
  };

  if (!editing && record) {
    return (
      <div className="mt-6 border-t border-gray-100 pt-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">Medical Record</h3>
          <button className="text-sm font-medium text-brand-700" onClick={() => setEditing(true)}>Edit</button>
        </div>
        <div className="mt-3 space-y-2 text-sm">
          {record.diagnosis && <div><span className="font-medium text-gray-700">Diagnosis: </span>{record.diagnosis}</div>}
          {record.symptoms && <div><span className="font-medium text-gray-700">Symptoms: </span>{record.symptoms}</div>}
          {record.doctorNotes && <div><span className="font-medium text-gray-700">Notes: </span>{record.doctorNotes}</div>}
          {record.followUpDate && <div><span className="font-medium text-gray-700">Follow-up: </span>{new Date(record.followUpDate).toLocaleDateString()}</div>}
          {record.prescriptionItems?.length > 0 && (
            <ul className="list-disc pl-5">
              {record.prescriptionItems.map((m) => (
                <li key={m.id}>{m.medicineName}{m.dosage ? ` — ${m.dosage}` : ""}{m.instructions ? ` (${m.instructions})` : ""}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 border-t border-gray-100 pt-4">
      <h3 className="font-medium text-gray-900">{record ? "Edit Medical Record" : "Add Medical Record"}</h3>
      <form onSubmit={handleSubmit} className="mt-3 space-y-3">
        <div>
          <label className="label">Diagnosis</label>
          <input className="input" name="diagnosis" value={form.diagnosis} onChange={handleChange} />
        </div>
        <div>
          <label className="label">Symptoms / observations</label>
          <textarea className="input" name="symptoms" rows={2} value={form.symptoms} onChange={handleChange} />
        </div>
        <div>
          <label className="label">Doctor's notes</label>
          <textarea className="input" name="doctorNotes" rows={2} value={form.doctorNotes} onChange={handleChange} />
        </div>
        <div>
          <label className="label">Follow-up date (optional)</label>
          <input type="date" className="input" name="followUpDate" value={form.followUpDate} onChange={handleChange} />
        </div>

        <div>
          <label className="label">Prescription</label>
          <div className="space-y-2">
            {form.medicines.map((m, i) => (
              <div key={i} className="grid grid-cols-8 gap-2">
                <input
                  className="input col-span-3"
                  placeholder="Medicine name"
                  value={m.medicineName}
                  onChange={(e) => updateMedicine(i, "medicineName", e.target.value)}
                />
                <input
                  className="input col-span-2"
                  placeholder="Dosage"
                  value={m.dosage}
                  onChange={(e) => updateMedicine(i, "dosage", e.target.value)}
                />
                <input
                  className="input col-span-2"
                  placeholder="Instructions"
                  value={m.instructions}
                  onChange={(e) => updateMedicine(i, "instructions", e.target.value)}
                />
                <button type="button" className="text-sm text-red-600" onClick={() => removeMedicineRow(i)}>Remove</button>
              </div>
            ))}
          </div>
          <button type="button" className="mt-2 text-sm font-medium text-brand-700" onClick={addMedicineRow}>
            + Add medicine
          </button>
        </div>

        <div className="flex gap-3">
          {record && (
            <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
          )}
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Save medical record"}
          </button>
        </div>
      </form>
    </div>
  );
}
