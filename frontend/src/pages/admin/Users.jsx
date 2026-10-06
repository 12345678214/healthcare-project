import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import DashboardLayout from "../../components/DashboardLayout";
import LoadingSpinner from "../../components/LoadingSpinner";
import EmptyState from "../../components/EmptyState";
import { adminLinks } from "./_links";
import { listUsers, updateUserActiveStatus } from "../../api/adminApi";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    listUsers()
      .then((res) => setUsers(res.data.users))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleToggle = async (user) => {
    try {
      await updateUserActiveStatus(user.id, !user.isActive);
      toast.success(`User ${user.isActive ? "deactivated" : "activated"}.`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed.");
    }
  };

  return (
    <DashboardLayout links={adminLinks} title="Manage Users">
      {loading ? (
        <LoadingSpinner />
      ) : users.length === 0 ? (
        <EmptyState title="No users found" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">{u.email}</td>
                  <td className="px-4 py-3 text-gray-500">{u.role}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${u.isActive ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-700"}`}>
                      {u.isActive ? "Active" : "Deactivated"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {u.role !== "ADMIN" && (
                      <button
                        className={`font-medium ${u.isActive ? "text-red-600" : "text-brand-700"}`}
                        onClick={() => handleToggle(u)}
                      >
                        {u.isActive ? "Deactivate" : "Activate"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
