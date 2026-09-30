import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftRight, Target, Clock, ArrowUpRight, AlertCircle, RefreshCw } from 'lucide-react';
import { getDashboard, allocateGoal } from '../services/api';
import BalanceCard from '../components/BalanceCard';
import GoalCard from '../components/GoalCard';
import StatusBadge from '../components/StatusBadge';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Allocate Modal state
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [allocAmount, setAllocAmount] = useState('');
  const [allocSubmitting, setAllocSubmitting] = useState(false);
  const [allocError, setAllocError] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getDashboard(1);
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleOpenAllocate = (goal) => {
    setSelectedGoal(goal);
    setAllocAmount('');
    setAllocError('');
  };

  const handleAllocateSubmit = async (e) => {
    e.preventDefault();
    setAllocError('');

    const amt = parseFloat(allocAmount);
    if (!amt || amt <= 0) {
      setAllocError('Please enter a valid amount greater than ₹0.');
      return;
    }
    if (amt > data.available_balance) {
      setAllocError(`Amount exceeds your available balance of ₹${data.available_balance.toLocaleString('en-IN')}.`);
      return;
    }
    if (amt > selectedGoal.remaining_amount) {
      setAllocError(`Amount exceeds goal remaining target of ₹${selectedGoal.remaining_amount.toLocaleString('en-IN')}.`);
      return;
    }

    setAllocSubmitting(true);
    try {
      await allocateGoal(selectedGoal.id, { user_id: 1, amount: amt });
      setSelectedGoal(null);
      await fetchDashboardData();
    } catch (err) {
      setAllocError(err.message);
    } finally {
      setAllocSubmitting(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Loading student simulation data...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 space-y-3">
        <div className="flex items-center gap-2 font-bold text-base">
          <AlertCircle className="w-5 h-5 text-rose-600" />
          <span>Could not load dashboard</span>
        </div>
        <p className="text-sm">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xs">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-300">
            Student Financial Hub
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Welcome back, {data.user_name}
          </h2>
          <p className="text-sm text-slate-300 mt-1 max-w-xl">
            Compare remittance corridors with mock FX rates, plan safe send windows, and reserve leftover cash for your educational goals.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/remittance"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-3 px-5 rounded-2xl shadow-sm transition-all cursor-pointer"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>New Transfer</span>
          </Link>
          <Link
            to="/goals"
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold py-3 px-5 rounded-2xl border border-white/20 transition-all cursor-pointer"
          >
            <Target className="w-4 h-4" />
            <span>Manage Goals</span>
          </Link>
        </div>
      </div>

      {/* Balance & Top Metrics */}
      <BalanceCard
        availableBalance={data.available_balance}
        goalReserved={data.goal_reserved}
        activeGoalsCount={data.active_goals_count}
        simulatedTransfersCount={data.simulated_transfers_count}
        currency={data.currency}
      />

      {/* Main Grid: Goals & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Current Goals (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Current Goals</h3>
              <p className="text-xs text-slate-500">
                Protected savings to ensure tuition, rent, and exam fees are never spent.
              </p>
            </div>
            <Link
              to="/goals"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.current_goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onAllocateClick={handleOpenAllocate}
              />
            ))}
          </div>

          {/* Pending Drafts Notice (if any) */}
          {data.recent_drafts && data.recent_drafts.filter(d => d.status === 'DRAFT').length > 0 && (
            <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-bold text-amber-900">
                    You have pending drafts awaiting approval
                  </span>
                </div>
                <span className="text-xs font-semibold bg-amber-200/60 text-amber-900 px-2 py-0.5 rounded-full">
                  Action Required
                </span>
              </div>
              <div className="mt-3 divide-y divide-amber-200/60">
                {data.recent_drafts.filter(d => d.status === 'DRAFT').map(draft => (
                  <div key={draft.id} className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-800">Draft #{draft.id}: ₹{draft.amount.toLocaleString('en-IN')}</span>
                      <span className="text-slate-500 ml-2">via {draft.corridor_name}</span>
                    </div>
                    <Link
                      to={`/send-draft/${draft.id}`}
                      className="px-3 py-1 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700"
                    >
                      Review & Approve
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent Activity (1 col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Recent Activity</h3>
              <p className="text-xs text-slate-500">All lookups & transactions logged.</p>
            </div>
            <Link
              to="/activity"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Full Log</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            {data.recent_activity.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No activity logged yet.</p>
            ) : (
              <div className="space-y-4">
                {data.recent_activity.slice(0, 5).map((act) => (
                  <div key={act.id} className="flex items-start gap-3 text-xs pb-3 border-b border-slate-100 last:border-b-0 last:pb-0">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{act.action}</span>
                        <span className="text-[10px] text-slate-400">{act.time_display}</span>
                      </div>
                      <p className="text-slate-600 mt-0.5 leading-relaxed">{act.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Goal Allocation Modal */}
      {selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-scale-up">
            <h3 className="text-lg font-bold text-slate-900">
              Park Leftover Money
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Protect your available balance by depositing into <span className="font-semibold text-slate-800">{selectedGoal.name}</span>.
            </p>

            <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Available to Park:</span>
                <span className="font-bold text-slate-900">₹{data.available_balance.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Remaining Needed for Goal:</span>
                <span className="font-bold text-slate-900">₹{selectedGoal.remaining_amount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <form onSubmit={handleAllocateSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Amount to Park (₹)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="any"
                    value={allocAmount}
                    onChange={(e) => setAllocAmount(e.target.value)}
                    placeholder="e.g. 1500"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                    required
                  />
                </div>
              </div>

              {/* Shortcut buttons */}
              <div className="flex flex-wrap gap-2 text-xs">
                {[500, 1000, 2000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAllocAmount(Math.min(amt, selectedGoal.remaining_amount, data.available_balance).toString())}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium cursor-pointer"
                  >
                    ₹{amt}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setAllocAmount(Math.min(selectedGoal.remaining_amount, data.available_balance).toString())}
                  className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium cursor-pointer"
                >
                  Max Possible (₹{Math.min(selectedGoal.remaining_amount, data.available_balance).toLocaleString('en-IN')})
                </button>
              </div>

              {allocError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                  {allocError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedGoal(null)}
                  disabled={allocSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={allocSubmitting}
                  className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {allocSubmitting ? 'Parking...' : 'Confirm Allocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
