import React, { useState, useEffect } from 'react';
import { Target, Plus, ShieldCheck, AlertCircle, RefreshCw, CheckCircle2, PiggyBank, Sparkles } from 'lucide-react';
import { getGoals, getDashboard, allocateGoal, createGoal } from '../services/api';
import GoalCard from '../components/GoalCard';

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Allocation Modal State
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [allocAmount, setAllocAmount] = useState('');
  const [allocating, setAllocating] = useState(false);
  const [allocError, setAllocError] = useState('');
  const [allocSuccess, setAllocSuccess] = useState('');

  // Create Goal Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalDeadline, setNewGoalDeadline] = useState('2026-12-15');
  const [creatingGoal, setCreatingGoal] = useState(false);
  const [createGoalError, setCreateGoalError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [goalsData, dashData] = await Promise.all([
        getGoals(1),
        getDashboard(1),
      ]);
      setGoals(goalsData);
      setAvailableBalance(dashData.available_balance);
    } catch (err) {
      setError(err.message || 'Failed to load goals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAllocate = (goal) => {
    setSelectedGoal(goal);
    setAllocAmount('');
    setAllocError('');
    setAllocSuccess('');
  };

  const handleAllocateSubmit = async (e) => {
    e.preventDefault();
    setAllocError('');
    setAllocSuccess('');

    const amt = parseFloat(allocAmount);
    if (!amt || amt <= 0) {
      setAllocError('Please enter a valid amount greater than ₹0.');
      return;
    }

    if (amt > availableBalance) {
      setAllocError(`Amount exceeds your available balance of ₹${availableBalance.toLocaleString('en-IN')}.`);
      return;
    }

    if (amt > selectedGoal.remaining_amount) {
      setAllocError(`Amount exceeds goal remaining target of ₹${selectedGoal.remaining_amount.toLocaleString('en-IN')}.`);
      return;
    }

    setAllocating(true);
    try {
      const res = await allocateGoal(selectedGoal.id, {
        user_id: 1,
        amount: amt,
      });
      setAllocSuccess(res.message);
      setSelectedGoal(null);
      await loadData();
    } catch (err) {
      setAllocError(err.message);
    } finally {
      setAllocating(false);
    }
  };

  const handleCreateGoalSubmit = async (e) => {
    e.preventDefault();
    setCreateGoalError('');

    const target = parseFloat(newGoalTarget);
    if (!newGoalName.trim()) {
      setCreateGoalError('Please enter a goal name.');
      return;
    }
    if (!target || target <= 0) {
      setCreateGoalError('Target amount must be greater than ₹0.');
      return;
    }
    if (!newGoalDeadline) {
      setCreateGoalError('Please select a deadline date.');
      return;
    }

    setCreatingGoal(true);
    try {
      await createGoal({
        user_id: 1,
        name: newGoalName.trim(),
        target_amount: target,
        deadline: newGoalDeadline,
      });
      setShowCreateModal(false);
      setNewGoalName('');
      setNewGoalTarget('');
      await loadData();
    } catch (err) {
      setCreateGoalError(err.message);
    } finally {
      setCreatingGoal(false);
    }
  };

  const totalSaved = goals.reduce((acc, g) => acc + g.saved_amount, 0);

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
            Module 3 — Leftover Money → Goal Allocation
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
            Goal Savings & Leftover Allocation
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Park simulated leftover funds after remittances to protect your essential student expenses.
          </p>
        </div>

        <button
          onClick={() => {
            setShowCreateModal(true);
            setCreateGoalError('');
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Goal</span>
        </button>
      </div>

      {/* Available Balance Callout Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-blue-200">
            Available to Park Right Now
          </span>
          <div className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1">
            ₹{availableBalance.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-blue-100 mt-1">
            Leftover funds available to allocate toward any goal below.
          </p>
        </div>

        <div className="flex items-center gap-6 p-4 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20">
          <div>
            <span className="text-xs text-blue-200 block">Total Protected</span>
            <span className="text-xl font-bold">₹{totalSaved.toLocaleString('en-IN')}</span>
          </div>
          <div className="w-px h-8 bg-white/20" />
          <div>
            <span className="text-xs text-blue-200 block">Active Goals</span>
            <span className="text-xl font-bold">{goals.length}</span>
          </div>
        </div>
      </div>

      {allocSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{allocSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Goals Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm font-semibold text-slate-500">Loading student goals...</p>
        </div>
      ) : goals.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
          <PiggyBank className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No Goals Created Yet</h3>
          <p className="text-xs text-slate-400 mt-1">Add a goal like Exam Fee, Rent, or Emergency Fund.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onAllocateClick={handleOpenAllocate}
            />
          ))}
        </div>
      )}

      {/* Allocation Modal */}
      {selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-scale-up">
            <h3 className="text-lg font-bold text-slate-900">
              Allocate Leftover Money
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Transfer simulated funds into <span className="font-semibold text-slate-800">{selectedGoal.name}</span>.
            </p>

            <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Available Balance:</span>
                <span className="font-bold text-slate-900">₹{availableBalance.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Remaining Needed for Target:</span>
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
                    placeholder="e.g. 2000"
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
                    onClick={() => setAllocAmount(Math.min(amt, selectedGoal.remaining_amount, availableBalance).toString())}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium cursor-pointer"
                  >
                    ₹{amt}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setAllocAmount(Math.min(selectedGoal.remaining_amount, availableBalance).toString())}
                  className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium cursor-pointer"
                >
                  Max Possible (₹{Math.min(selectedGoal.remaining_amount, availableBalance).toLocaleString('en-IN')})
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
                  disabled={allocating}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={allocating}
                  className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {allocating ? 'Parking...' : 'Park Amount'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create New Goal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-scale-up">
            <h3 className="text-lg font-bold text-slate-900">
              Create New Goal
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Add a named goal to protect savings from being spent on remittances.
            </p>

            <form onSubmit={handleCreateGoalSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Goal Name
                </label>
                <input
                  type="text"
                  value={newGoalName}
                  onChange={(e) => setNewGoalName(e.target.value)}
                  placeholder="e.g. Laptop Repair, Exam Fee, Rent"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              {/* Preset suggestions */}
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                {['Exam Fee', 'Hostel Rent', 'Emergency Fund', 'Laptop EMI', 'Family Support'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setNewGoalName(preset)}
                    className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Target Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="any"
                    value={newGoalTarget}
                    onChange={(e) => setNewGoalTarget(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Target Deadline
                </label>
                <input
                  type="date"
                  value={newGoalDeadline}
                  onChange={(e) => setNewGoalDeadline(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              {createGoalError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                  {createGoalError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creatingGoal}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingGoal}
                  className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {creatingGoal ? 'Saving...' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
