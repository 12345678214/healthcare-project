import React from "react";
import { NavLink } from "react-router-dom";
import Navbar from "./Navbar";

export default function DashboardLayout({ links, title, children, subtitle }) {
  return <div className="min-h-screen bg-slate-50 dark:bg-slate-950"><Navbar/><div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 lg:px-6"><aside className="hidden w-60 shrink-0 md:block"><nav className="glass-card sticky top-24 space-y-1 p-3">{links.map((link) => <NavLink key={link.to} to={link.to} end={link.end} className={({isActive}) => `sidebar-link ${isActive ? "sidebar-link-active" : ""}`}>{link.label}</NavLink>)}</nav></aside><main className="min-w-0 flex-1"><div className="mb-6"><p className="eyebrow">MediCare Connect</p>{title && <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{title}</h1>}{subtitle && <p className="mt-1 text-slate-500 dark:text-slate-400">{subtitle}</p>}</div>{children}</main></div></div>;
}
