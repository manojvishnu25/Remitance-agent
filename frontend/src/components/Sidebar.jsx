import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, Target, History, Sparkles } from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/remittance', label: 'Remittance', icon: ArrowLeftRight },
    { to: '/goals', label: 'Goals', icon: Target },
    { to: '/activity', label: 'Activity', icon: History },
  ];

  return (
    <aside className="w-full md:w-64 bg-white border-r border-slate-200 shrink-0 min-h-[calc(100vh-6rem)] p-4 flex flex-col justify-between">
      <div className="space-y-6">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3">
            Menu Navigation
          </span>
          <nav className="mt-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Expo Showcase Box */}
        <div className="rounded-xl p-3.5 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
          <div className="flex items-center gap-2 text-blue-800 font-semibold text-xs mb-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Expo Prototype Flow</span>
          </div>
          <ol className="text-[11px] text-slate-600 space-y-1 list-decimal list-inside pl-0.5 mt-2 leading-relaxed">
            <li>Compare 2 Corridors</li>
            <li>Review Send Window</li>
            <li>Approve Simulation</li>
            <li>Park Leftover to Goal</li>
          </ol>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 text-center">
        <p className="text-[11px] text-slate-400 font-medium">
          College Project Expo 2026
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5">
          Version 1.0 (Simulation Engine)
        </p>
      </div>
    </aside>
  );
}
