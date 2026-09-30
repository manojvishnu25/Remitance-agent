import React from 'react';
import { Zap, Clock, Coins, CheckCircle, ArrowRight } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function CorridorCard({ option, isSelected, onSelect, amount }) {
  const formatINR = (val) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

  const formatDestCurrency = (val) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: option.destination_currency || 'USD',
        maximumFractionDigits: 2
      }).format(val);
    } catch {
      return `${option.currency_symbol || '$'}${val.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
    }
  };

  return (
    <div
      onClick={onSelect}
      className={`relative p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
        isSelected
          ? 'border-blue-600 bg-blue-50/30 shadow-md ring-2 ring-blue-600/20'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
      }`}
    >
      {/* Top Header & Badges */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-slate-900">{option.name}</h3>
              {isSelected && (
                <CheckCircle className="w-5 h-5 text-blue-600 fill-blue-50" />
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{option.description}</p>
          </div>
        </div>

        {/* Badges list */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {option.badges && option.badges.map((badge, idx) => (
            <StatusBadge key={idx} text={badge} />
          ))}
          <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md border border-slate-200">
            SIMULATION DATA
          </span>
        </div>

        {/* Recipient Estimated Amount Highlight */}
        <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Estimated Recipient Gets
          </p>
          <div className="text-3xl font-extrabold text-blue-600 mt-1 tracking-tight">
            {formatDestCurrency(option.estimated_recipient_amount)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Calculation: (₹{amount.toLocaleString('en-IN')} - ₹{option.fee}) × {option.fx_rate} FX
          </p>
        </div>

        {/* Feature comparison rows */}
        <div className="mt-5 space-y-3 text-sm">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-slate-500 flex items-center gap-2">
              <Coins className="w-4 h-4 text-slate-400" /> Transfer Fee:
            </span>
            <span className="font-semibold text-slate-900">{formatINR(option.fee)}</span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-slate-500 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" /> Transfer Speed:
            </span>
            <span className="font-semibold text-slate-900">
              {option.speed_days} {option.speed_days === 1 ? 'Day (Fast)' : 'Days'}
            </span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-slate-500 flex items-center gap-2">
              <Zap className="w-4 h-4 text-slate-400" /> Fixed FX Rate:
            </span>
            <span className="font-semibold text-slate-900">
              1 INR = {option.fx_rate} {option.destination_currency}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-slate-500">Total Deducted:</span>
            <span className="font-bold text-slate-900">{formatINR(option.total_cost)}</span>
          </div>
        </div>
      </div>

      {/* Select button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        className={`mt-6 w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
          isSelected
            ? 'bg-blue-600 text-white shadow-xs hover:bg-blue-700'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
        }`}
      >
        <span>{isSelected ? 'Corridor Selected' : 'Choose This Corridor'}</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
