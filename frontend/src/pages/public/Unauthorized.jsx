import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";

export default function Unauthorized() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-3xl font-bold text-gray-900">403 — Access denied</h1>
        <p className="mt-3 text-gray-600">You don't have permission to view this page with your current account role.</p>
        <Link to="/" className="btn-primary mt-6 inline-flex">Back to Home</Link>
      </div>
    </div>
  );
}
