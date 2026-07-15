import { NavLink } from 'react-router-dom';

const NAV = [
  {
    to: '/suppliers',
    label: 'Suppliers',
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="square" d="M3 21V7l9-4 9 4v14M9 21V11h6v10" />
      </svg>
    ),
  },
  {
    to: '/import',
    label: 'JSON Import',
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="square" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 3v13M8 9l4-4 4 4" />
      </svg>
    ),
  },
  {
    to: '/search',
    label: 'Global Search',
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="square" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
      </svg>
    ),
  },
];

// onClose — called when a nav link is tapped on mobile to close the drawer
export default function Sidebar({ onClose }) {
  return (
    <aside className="w-64 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col h-full">
      {/* Logo — desktop only (mobile shows it in MobileNav) */}
      <div className="hidden md:flex px-6 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-blue-600 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-xs tracking-widest">S</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm tracking-wide leading-none">SAS</p>
            <p className="text-slate-500 text-[10px] tracking-widest uppercase leading-tight mt-0.5">Custom Clearance</p>
          </div>
        </div>
      </div>

      {/* Mobile drawer header with close button */}
      <div className="md:hidden flex items-center justify-between px-4 h-14 border-b border-slate-800 shrink-0">
        <p className="text-slate-400 text-[10px] uppercase tracking-widest font-medium">Navigation</p>
        <button
          onClick={onClose}
          aria-label="Close navigation"
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="square" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="hidden md:block text-slate-600 text-[10px] uppercase tracking-widest font-medium px-3 pb-2">Navigation</p>
        {NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            {icon}
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-800">
        <p className="text-slate-600 text-[10px]">v1.0.0 · Logistics System</p>
      </div>
    </aside>
  );
}
