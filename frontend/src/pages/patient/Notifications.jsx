import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import DashboardLayout from "../../components/DashboardLayout";
import LoadingSpinner from "../../components/LoadingSpinner";
import EmptyState from "../../components/EmptyState";
import { patientLinks } from "./_links";
import api from "../../api/axios";

// Notifications share one backend module across all roles, so this
// small API client lives inline here rather than in a role-specific file.
const listMyNotifications = () => api.get("/notifications").then((r) => r.data);
const markAllAsRead = () => api.patch("/notifications/read-all").then((r) => r.data);
const markAsRead = (id) => api.patch(`/notifications/${id}/read`).then((r) => r.data);

export default function PatientNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    listMyNotifications()
      .then((res) => setNotifications(res.data.notifications))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleMarkAll = async () => {
    await markAllAsRead();
    toast.success("All notifications marked as read.");
    load();
  };

  return (
    <DashboardLayout links={patientLinks} title="Notifications">
      {notifications.some((n) => !n.isRead) && (
        <button className="btn-secondary mb-4" onClick={handleMarkAll}>Mark all as read</button>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : notifications.length === 0 ? (
        <EmptyState title="No notifications yet" description="You'll see appointment updates here." />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.isRead && markAsRead(n.id).then(load)}
              className={`card cursor-pointer ${!n.isRead ? "border-brand-200 bg-brand-50" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-gray-900">{n.title}</p>
                  <p className="mt-1 text-sm text-gray-600">{n.message}</p>
                </div>
                {!n.isRead && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-600" />}
              </div>
              <p className="mt-2 text-xs text-gray-400">{new Date(n.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
