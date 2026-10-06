import React from "react";
import Navbar from "../../components/Navbar";

export default function About() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-bold text-gray-900">About MediCare Connect</h1>
        <p className="mt-4 text-gray-600">
          MediCare Connect is a demo healthcare appointment management platform built to
          showcase a full-stack booking workflow: patients search for doctors, view
          real-time availability, and book appointments; doctors manage their schedule
          and patient visits; admins oversee the whole system.
        </p>
        <p className="mt-4 text-gray-600">
          This is a portfolio/demo project and is not connected to a real hospital
          network. It is not HIPAA-compliant and should not be used to store real
          patient medical data.
        </p>
      </div>
    </div>
  );
}
