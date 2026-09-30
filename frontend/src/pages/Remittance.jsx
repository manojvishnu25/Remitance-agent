import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftRight, Calendar, AlertCircle, Info, Sparkles, Send, ShieldCheck, RefreshCw, Globe2 } from 'lucide-react';
import { compareRemittance, createDraft, getDashboard, getDestinations } from '../services/api';
import CorridorCard from '../components/CorridorCard';

export default function Remittance() {
  const navigate = useNavigate();

  // Form State
  const [amount, setAmount] = useState('10000');
  const [deadline, setDeadline] = useState('2026-10-10');

  // Destination Corridors (Multiple International Countries)
  const defaultDestinations = [
    { country: 'United States', country_code: 'US', currency: 'USD', currency_symbol: '$', flag: '🇺🇸' },
    { country: 'United Kingdom', country_code: 'GB', currency: 'GBP', currency_symbol: '£', flag: '🇬🇧' },
    { country: 'European Union', country_code: 'EU', currency: 'EUR', currency_symbol: '€', flag: '🇪🇺' },
    { country: 'Canada', country_code: 'CA', currency: 'CAD', currency_symbol: 'C$', flag: '🇨🇦' },
    { country: 'Australia', country_code: 'AU', currency: 'AUD', currency_symbol: 'A$', flag: '🇦🇺' },
    { country: 'United Arab Emirates', country_code: 'AE', currency: 'AED', currency_symbol: 'AED ', flag: '🇦🇪' },
  ];
  const [destinations, setDestinations] = useState(defaultDestinations);
  const [selectedDestination, setSelectedDestination] = useState('United States');

  // Balance info
  const [availableBalance, setAvailableBalance] = useState(20000);
  const [balanceLoading, setBalanceLoading] = useState(true);

  // Comparison State
  const [comparing, setComparing] = useState(false);
  const [comparisonResults, setComparisonResults] = useState(null);
  const [selectedCorridorId, setSelectedCorridorId] = useState(null);
  const [formError, setFormError] = useState('');

  // Draft Creation State
  const [creatingDraft, setCreatingDraft] = useState(false);
  const [draftError, setDraftError] = useState('');

  useEffect(() => {
    // Fetch user available balance
    getDashboard(1)
      .then((data) => {
        setAvailableBalance(data.available_balance);
        setBalanceLoading(false);
      })
      .catch(() => {
        setBalanceLoading(false);
      });

    // Fetch dynamic destinations from backend
    getDestinations()
      .then((dests) => {
        if (dests && dests.length > 0) {
          const merged = dests.map((d) => {
            const match = defaultDestinations.find((def) => def.country === d.country);
            return {
              ...d,
              flag: match ? match.flag : '🌐',
            };
          });
          setDestinations(merged);
        }
      })
      .catch(() => {
        // Fallback to default presets
      });
  }, []);

  const handleCompare = async (e) => {
    e.preventDefault();
    setFormError('');
    setDraftError('');
    setSelectedCorridorId(null);

    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      setFormError('Please enter a transfer amount greater than ₹0.');
      return;
    }

    if (amt > availableBalance) {
      setFormError(`Transfer amount (₹${amt.toLocaleString('en-IN')}) exceeds your available balance (₹${availableBalance.toLocaleString('en-IN')}).`);
      return;
    }

    if (!deadline) {
      setFormError('Please select a target deadline date.');
      return;
    }

    setComparing(true);
    try {
      const res = await compareRemittance({
        amount: amt,
        deadline: deadline,
        country: selectedDestination,
      });
      setComparisonResults(res);
      // Auto-select none so user makes deliberate choice
      setSelectedCorridorId(null);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setComparing(false);
    }
  };

  const handleCreateDraft = async () => {
    if (!selectedCorridorId) {
      setDraftError('Please choose one of the corridors above to proceed.');
      return;
    }

    const amt = parseFloat(amount);
    setCreatingDraft(true);
    setDraftError('');

    try {
      const draft = await createDraft({
        user_id: 1,
        corridor_id: selectedCorridorId,
        amount: amt,
        deadline: deadline,
      });
      navigate(`/send-draft/${draft.id}`);
    } catch (err) {
      setDraftError(err.message);
      setCreatingDraft(false);
    }
  };

  const activeDestObj = destinations.find((d) => d.country === selectedDestination) || destinations[0];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
          Module 1 — Remittance Comparison
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
          Compare Remittance Corridors
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Evaluate simulated international settlement corridors across multiple countries with fixed mock FX rates and fee schedules.
        </p>
      </div>

      {/* Available Balance Helper Notice */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-blue-50/70 border border-blue-100 text-xs sm:text-sm">
        <div className="flex items-center gap-2 text-blue-900 font-semibold">
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Your Available Simulation Balance:</span>
        </div>
        <span className="font-bold text-base text-blue-700">
          ₹{availableBalance.toLocaleString('en-IN')}
        </span>
      </div>

      {/* Input Comparison Form */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
        <form onSubmit={handleCompare} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Amount */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  step="any"
                  id="remittance-amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="10000"
                  className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Max available: ₹{availableBalance.toLocaleString('en-IN')}
              </p>
            </div>

            {/* Destination Selector (Multiple International Corridors) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center justify-between">
                <span>Destination Country</span>
                <span className="text-[10px] text-blue-600 font-semibold lowercase">
                  ({destinations.length} corridors)
                </span>
              </label>
              <div className="relative">
                <select
                  id="destination-country-select"
                  value={selectedDestination}
                  onChange={(e) => {
                    setSelectedDestination(e.target.value);
                    setComparisonResults(null);
                    setSelectedCorridorId(null);
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-semibold text-slate-800 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600 cursor-pointer"
                >
                  {destinations.map((d) => (
                    <option key={d.country} value={d.country}>
                      {d.flag} {d.country} ({d.currency})
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
                <Globe2 className="w-3 h-3 text-slate-400" />
                Target Currency: <span className="font-bold text-slate-700">{activeDestObj.currency} ({activeDestObj.currency_symbol})</span>
              </p>
            </div>

            {/* Required By (Deadline) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Required By (Deadline)
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="remittance-deadline"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600 cursor-pointer"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Target delivery date for send window
              </p>
            </div>
          </div>

          {formError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500 hidden sm:inline-block">
              Comparing 2 mock corridors for <span className="font-bold text-slate-700">{activeDestObj.country} ({activeDestObj.currency})</span>
            </span>

            <button
              type="submit"
              disabled={comparing}
              id="compare-options-btn"
              className="w-full sm:w-auto py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {comparing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Comparing Corridors...</span>
                </>
              ) : (
                <>
                  <ArrowLeftRight className="w-4 h-4" />
                  <span>Compare Options</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Side-by-Side Comparison Results */}
      {comparisonResults && (
        <div className="space-y-6 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                {comparisonResults.country || selectedDestination} Corridors
              </h3>
              <p className="text-xs text-slate-500">
                Comparing ₹{comparisonResults.amount.toLocaleString('en-IN')} transfer to {comparisonResults.country || selectedDestination} due by {comparisonResults.deadline}.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 w-fit">
              Select one corridor below
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {comparisonResults.options.map((option) => (
              <CorridorCard
                key={option.id}
                option={option}
                amount={comparisonResults.amount}
                isSelected={selectedCorridorId === option.id}
                onSelect={() => {
                  setSelectedCorridorId(option.id);
                  setDraftError('');
                }}
              />
            ))}
          </div>

          {/* Action Step: Create Send Draft */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-slate-900 text-base">
                Ready to Schedule Send Window?
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedCorridorId
                  ? 'Corridor chosen! Proceed to generate your deterministic send window and create a draft.'
                  : 'Please choose either corridor option above to create your send draft.'}
              </p>
            </div>

            {draftError && (
              <p className="text-xs text-rose-600 font-semibold">{draftError}</p>
            )}

            <button
              onClick={handleCreateDraft}
              disabled={!selectedCorridorId || creatingDraft}
              id="create-draft-btn"
              className={`py-3 px-6 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer ${
                selectedCorridorId && !creatingDraft
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>{creatingDraft ? 'Generating Draft...' : 'Create Send Draft'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
