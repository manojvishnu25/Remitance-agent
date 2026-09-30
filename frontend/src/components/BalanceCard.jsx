import React from 'react';
import { Wallet, PiggyBank, Target, ArrowUpRight } from 'lucide-react';

export default function BalanceCard({
  availableBalance = 0,
  goalReserved = 0,
  activeGoalsCount = 0,
  simulatedTransfersCount = 0,
  currency = 'INR'
}) {
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      maximumFractionDigits: 2,
    }).format(val);
  };

  const totalSimulatedWealth = availableBalance + goalReserved;
  const reservedPercentage = totalSimulatedWealth > 0 
    ? Math.round((goalReserved / totalSimulatedWealth) * 100) 
    : 0;

  return (
    <div className="space-y-4">
      {/* 4 Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Balance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Available Balance
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">
              {formatCurrency(availableBalance)}
            </h3>
            <span className="text-[11px] text-emerald-600 font-medium mt-1 inline-flex items-center gap-1">
              Ready for Remittance
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        {/* Goal Reserved */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Goal Reserved
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">
              {formatCurrency(goalReserved)}
            </h3>
            <span className="text-[11px] text-blue-600 font-medium mt-1 inline-flex items-center gap-1">
              Protected Savings ({reservedPercentage}%)
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <PiggyBank className="w-6 h-6" />
          </div>
        </div>

        {/* Active Goals */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Goals
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">
              {activeGoalsCount}
            </h3>
            <span className="text-[11px] text-slate-500 font-medium mt-1 inline-flex items-center gap-1">
              Educational & Living Goals
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Target className="w-6 h-6" />
          </div>
        </div>

        {/* Simulated Transfers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Simulated Transfers
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">
              {simulatedTransfersCount}
            </h3>
            <span className="text-[11px] text-slate-500 font-medium mt-1 inline-flex items-center gap-1">
              Approved Sandbox Tests
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>
  );
}
