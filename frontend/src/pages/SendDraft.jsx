import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Target, ShieldCheck, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { getDraft, approveDraft, cancelDraft } from '../services/api';
import SendDraftCard from '../components/SendDraftCard';

export default function SendDraft() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [approving, setApproving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchDraft = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getDraft(id);
      setDraft(data);
    } catch (err) {
      setError(err.message || 'Failed to load draft.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDraft();
  }, [id]);

  const handleApprove = async () => {
    setApproving(true);
    setError('');
    try {
      const updated = await approveDraft(id);
      setDraft(updated);
      setActionSuccess('Simulation approved! Funds have been simulated as delivered.');
    } catch (err) {
      setError(err.message);
    } finally {
      setApproving(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    setError('');
    try {
      const updated = await cancelDraft(id);
      setDraft(updated);
      setActionSuccess('Draft cancelled successfully.');
    } catch (err) {
      setError(err.message);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Retrieving send draft #{id}...</p>
      </div>
    );
  }

  if (error && !draft) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 space-y-3">
        <div className="flex items-center gap-2 font-bold text-base">
          <AlertCircle className="w-5 h-5 text-rose-600" />
          <span>Error loading draft</span>
        </div>
        <p className="text-sm">{error}</p>
        <Link
          to="/remittance"
          className="inline-flex items-center gap-2 text-xs font-bold text-rose-900 underline"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Remittance Comparison
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Breadcrumb & Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/remittance"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Remittance Comparison</span>
        </Link>
        <span className="text-xs font-semibold text-slate-400">
          Module 2 — Send Window & User Approval
        </span>
      </div>

      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Review & Approve Send Draft
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Verify the simulated transfer details and suggested deterministic send window before authorizing deduction.
        </p>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Draft Card */}
      <SendDraftCard
        draft={draft}
        onApprove={handleApprove}
        onCancel={handleCancel}
        approving={approving}
        cancelling={cancelling}
      />

      {/* Post-Approval Leftover Protection Banner (Module 3 bridge) */}
      {draft.status === 'APPROVED' && (
        <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-md animate-scale-up space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
                Simulation Approved & Recorded
              </span>
              <h3 className="text-xl font-extrabold mt-0.5">
                Protect Your Remaining Leftover Funds
              </h3>
              <p className="text-xs text-emerald-50 mt-1 leading-relaxed">
                Your transfer of ₹{draft.amount.toLocaleString('en-IN')} (fee ₹{draft.fee}) has been deducted. Avoid accidental spending by parking leftover funds into educational goals such as Exam Fee or Rent.
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <Link
              to="/goals"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-white text-emerald-900 font-bold text-sm shadow-xs hover:bg-emerald-50 transition-all cursor-pointer"
            >
              <Target className="w-4 h-4 text-emerald-700" />
              <span>Park Leftover Toward Goal</span>
            </Link>
            <Link
              to="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center py-3 px-5 rounded-xl text-emerald-100 hover:bg-white/10 font-semibold text-sm transition-all cursor-pointer"
            >
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
