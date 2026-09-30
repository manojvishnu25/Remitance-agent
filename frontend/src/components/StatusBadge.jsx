import React from 'react';

export default function StatusBadge({ status, text }) {
  const displayStatus = (text || status || '').toUpperCase();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';

  if (displayStatus === 'APPROVED' || displayStatus === 'SIMULATED_APPROVED' || displayStatus === 'COMPLETED') {
    styles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (displayStatus === 'DRAFT' || displayStatus === 'IN_PROGRESS') {
    styles = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (displayStatus === 'CANCELLED') {
    styles = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (displayStatus === 'LOWER FEE') {
    styles = 'bg-teal-50 text-teal-700 border-teal-200';
  } else if (displayStatus === 'FASTER') {
    styles = 'bg-indigo-50 text-indigo-700 border-indigo-200';
  } else if (displayStatus === 'HIGHER ESTIMATED VALUE') {
    styles = 'bg-purple-50 text-purple-700 border-purple-200';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles}`}>
      {text || status}
    </span>
  );
}
