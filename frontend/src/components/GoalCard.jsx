import React from 'react';
import { Target, Calendar, CheckCircle2, PlusCircle } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function GoalCard({ goal, onAllocateClick }) {
  const formatINR = (val) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

  const isCompleted = goal.saved_amount >= goal.target_amount;

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-50 text-blue-600'
            }`}>
              {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Target className="w-5 h-5" />}
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base leading-tight">
                {goal.name}
              </h4>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3" /> Due {goal.deadline}
              </p>
            </div>
          </div>
          <StatusBadge status={goal.status} text={isCompleted ? 'COMPLETED' : 'IN PROGRESS'} />
        </div>

        {/* Financial Progress Numbers */}
        <div className="mt-4 flex items-baseline justify-between text-sm">
          <div>
            <span className="text-xs text-slate-500 block">Saved Amount</span>
            <span className="text-lg font-bold text-slate-900">
              {formatINR(goal.saved_amount)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500 block">Target</span>
            <span className="text-sm font-semibold text-slate-700">
              {formatINR(goal.target_amount)}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs font-semibold mb-1">
            <span className={isCompleted ? 'text-emerald-700' : 'text-blue-700'}>
              {goal.progress_percentage}% Protected
            </span>
            <span className="text-slate-500 font-normal">
              {isCompleted ? 'Fully Funded' : `Remaining: ${formatINR(goal.remaining_amount)}`}
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isCompleted ? 'bg-emerald-500' : 'bg-blue-600'
              }`}
              style={{ width: `${Math.min(100, goal.progress_percentage)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Action button */}
      <div className="mt-5 pt-3 border-t border-slate-100">
        <button
          onClick={() => onAllocateClick(goal)}
          disabled={isCompleted}
          className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            isCompleted
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-blue-50 text-blue-700 hover:bg-blue-100 active:bg-blue-200'
          }`}
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>{isCompleted ? 'Goal Fully Funded' : 'Allocate Leftover Money'}</span>
        </button>
      </div>
    </div>
  );
}
