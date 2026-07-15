import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { NavLink } from 'react-router-dom';

// ─── Mobile Top Navbar (md:hidden) ────────────────────────────────────────────
function MobileNav({ onOpenMenu }) {
  return (
    <header className="md:hidden flex items-center justify-between px-4 h-14 bg-slate-900 border-b border-slate-800 shrink-0 z-30">
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 bg-blue-600 flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-[10px] tracking-widest">S</span>
        </div>
        <div>
          <p className="text-white font-semibold text-xs tracking-wide leading-none">SAS</p>
          <p className="text-slate-500 text-[9px] tracking-widest uppercase leading-tight">Custom Clearance</p>
        </div>
      </div>
      {/* Hamburger */}
      <button
        onClick={onOpenMenu}
        aria-label="Open navigation"
        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="square" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </header>
  );
}

export default function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-slate-100">
      {/* ── Mobile Backdrop ── */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ── Sidebar: hidden by default on mobile, slides in when open ── */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transition-transform duration-300 md:static md:translate-x-0 md:z-auto ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onClose={() => setIsMobileMenuOpen(false)} />
      </div>

      {/* ── Right side: mobile topbar + scrollable content ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <MobileNav onOpenMenu={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
