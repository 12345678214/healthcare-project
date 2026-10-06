import React from "react";

// Simple modal confirmation dialog (no external UI library needed).
export default function ConfirmDialog({ open, title, description, confirmLabel = "Confirm", onConfirm, onCancel, danger }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {description && <p className="mt-2 text-sm text-gray-600">{description}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className={danger ? "btn-danger" : "btn-primary"} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
