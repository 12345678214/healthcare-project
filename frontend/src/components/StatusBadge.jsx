import React from "react";

const STYLES = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-200 text-gray-700",
  REJECTED: "bg-red-100 text-red-800",
  APPROVED: "bg-green-100 text-green-800",
};

export default function StatusBadge({ status }) {
  return <span className={`badge ${STYLES[status] || "bg-gray-100 text-gray-700"}`}>{status}</span>;
}
