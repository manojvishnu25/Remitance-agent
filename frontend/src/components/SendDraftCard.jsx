import React from 'react';
import { Clock, ShieldAlert, CheckCircle, XCircle, ArrowRight, Calendar, Info } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function SendDraftCard({ draft, onApprove, onCancel, approving, cancelling }) {
  const formatINR = (val) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

  const isDraft = draft.status === 'DRAFT';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Simulation Banner on Draft */}
      <div className="bg-blue-600 px-6 py-3 text-white flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <ShieldAlert className="w-4 h-4" />
          <span>Simulated Remittance Draft #{draft.id}</span>
        </div>
        <StatusBadge status={draft.status} />
      </div>

      <div className="p-6 space-y-6">
        {/* Core numbers overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/60">
          <div>
            <span className="text-xs text-slate-500 uppercase font-semibold">Transfer Amount</span>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {formatINR(draft.amount)}
            </div>
          </div>
          <div>
            <span className="text-xs text-slate-500 uppercase font-semibold">Corridor Fee</span>
            <div className="text-2xl font-bold text-slate-700 mt-0.5">
              {formatINR(draft.fee)}
            </div>
          </div>
          <div>
            <span className="text-xs text-slate-500 uppercase font-semibold">Estimated Recipient Amount</span>
            <div className="text-2xl font-bold text-blue-600 mt-0.5">
              {draft.currency_symbol || '$'}{draft.estimated_recipient_amount.toLocaleString()} {draft.destination_currency || 'USD'}
            </div>
          </div>
        </div>

        {/* Detailed specs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="p-3.5 rounded-xl border border-slate-100 bg-white">
            <span className="text-xs text-slate-400 block font-medium">Selected Corridor</span>
            <span className="font-semibold text-slate-800 text-base">{draft.corridor_name}</span>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-100 bg-white">
            <span className="text-xs text-slate-400 block font-medium">Simulated FX Rate</span>
            <span className="font-semibold text-slate-800 text-base">
              1 INR = {draft.fx_rate} {draft.destination_currency || 'USD'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-100 bg-white">
            <span className="text-xs text-slate-400 block font-medium">Recipient Due Deadline</span>
            <span className="font-semibold text-slate-800 text-base flex items-center gap-1.5 mt-0.5">
              <Calendar className="w-4 h-4 text-slate-400" /> {draft.deadline}
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-100 bg-white">
            <span className="text-xs text-slate-400 block font-medium">Total Deducted (Amount + Fee)</span>
            <span className="font-bold text-slate-900 text-base">{formatINR(draft.total_deducted)}</span>
          </div>
        </div>

        {/* Suggested Send Window Box */}
        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
          <div className="flex items-center gap-2 text-amber-900 font-semibold text-sm">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Suggested Send Window — Simulation</span>
          </div>
          <p className="text-base font-bold text-amber-950 mt-1">
            {draft.suggested_window_display}
          </p>
          <p className="text-xs text-amber-800/80 mt-1 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 shrink-0" />
            Calculated deterministically so that funds arrive securely before your deadline of {draft.deadline}.
          </p>
        </div>

        {/* Approval or Cancellation Action Buttons */}
        {isDraft ? (
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={onApprove}
              disabled={approving || cancelling}
              className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{approving ? 'Processing Approval...' : 'Approve Simulation'}</span>
            </button>

            <button
              onClick={onCancel}
              disabled={approving || cancelling}
              className="w-full sm:w-auto py-3 px-5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 active:bg-slate-100 font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <XCircle className="w-4 h-4 text-rose-500" />
              <span>{cancelling ? 'Cancelling...' : 'Cancel'}</span>
            </button>
          </div>
        ) : (
          <div className={`p-4 rounded-xl text-sm font-semibold flex items-center gap-2 ${
            draft.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            {draft.status === 'APPROVED' ? (
              <>
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span>Simulated Transfer Approved. Leftover balance is available to park toward goals.</span>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-rose-600" />
                <span>Draft cancelled. No money was deducted.</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
