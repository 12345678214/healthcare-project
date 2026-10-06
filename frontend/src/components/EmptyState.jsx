import React from "react";

export default function EmptyState({ title = "Nothing here yet", description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-gray-500">
      <p className="text-lg font-medium text-gray-700">{title}</p>
      {description && <p className="max-w-sm text-sm">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
