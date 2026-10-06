import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const DASHBOARD_PATH = { PATIENT: "/patient/dashboard", DOCTOR: "/doctor/dashboard", ADMIN: "/admin/dashboard" };

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");

  useEffect(() => { document.documentElement.classList.toggle("dark", dark); localStorage.setItem("theme", dark ? "dark" : "light"); }, [dark]);
  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/85">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-6">
        <Link to="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-700 text-xl font-bold text-white shadow-lg shadow-brand-700/20">+</span>
          <span><span className="block text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">MediCare</span><span className="block -mt-1 text-[10px] font-semibold uppercase tracking-[.22em] text-brand-700 dark:text-brand-300">Connect</span></span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-600 md:flex dark:text-slate-300">
          <Link to="/doctors" className="nav-link">Find Doctors</Link><Link to="/about" className="nav-link">How it works</Link>
          {isAuthenticated && <Link to={DASHBOARD_PATH[user.role]} className="nav-link">Dashboard</Link>}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <button onClick={() => setDark((v) => !v)} className="theme-toggle" title="Toggle theme">{dark ? "☀" : "☾"}</button>
          {isAuthenticated ? <><span className="hidden text-sm text-slate-500 lg:inline">Hi, {user.patient?.fullName || user.doctor?.fullName || user.email}</span><button className="btn-secondary" onClick={handleLogout}>Logout</button></> : <><Link to="/login" className="btn-secondary">Login</Link><Link to="/register" className="btn-primary">Get started</Link></>}
        </div>
        <button className="md:hidden" onClick={() => setMenuOpen((o) => !o)} aria-label="Toggle menu"><span className="text-2xl">☰</span></button>
      </div>
      {menuOpen && <div className="border-t border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950 md:hidden"><div className="flex flex-col gap-4 text-sm font-semibold"><Link to="/doctors" onClick={() => setMenuOpen(false)}>Find Doctors</Link><Link to="/about" onClick={() => setMenuOpen(false)}>How it works</Link>{isAuthenticated ? <><Link to={DASHBOARD_PATH[user.role]} onClick={() => setMenuOpen(false)}>Dashboard</Link><button className="btn-secondary w-fit" onClick={handleLogout}>Logout</button></> : <><Link to="/login">Login</Link><Link to="/register">Get started</Link></>}<button className="btn-secondary w-fit" onClick={() => setDark((v) => !v)}>{dark ? "Light mode" : "Dark mode"}</button></div></div>}
    </header>
  );
}
