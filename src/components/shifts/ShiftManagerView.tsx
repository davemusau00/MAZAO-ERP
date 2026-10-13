import React, { useState } from 'react';
import { Shift, TenantProfile, ShiftAuditLog, ShiftAuditAction } from '../../types/erp';
import { storage } from '../../services/storage';
import { hardware } from '../../services/hardware';
import {
  Clock,
  Banknote,
  DollarSign,
  Printer,
  PlusCircle,
  MinusCircle,
  FileText,
  AlertCircle,
  CheckCircle2,
  X,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Search,
  Filter,
  Sliders,
  AlertTriangle
} from 'lucide-react';

interface ShiftManagerViewProps {
  tenant: TenantProfile;
}

export const ShiftManagerView: React.FC<ShiftManagerViewProps> = ({ tenant }) => {
  const [activeShift, setActiveShift] = useState<Shift | null>(storage.getActiveShift());
  const [shiftsHistory, setShiftsHistory] = useState<Shift[]>(storage.getShiftsHistory());
  const [auditLogs, setAuditLogs] = useState<ShiftAuditLog[]>(storage.getAuditLogs());
  const [viewTab, setViewTab] = useState<'current' | 'audit' | 'history'>('current');
  const [auditActionFilter, setAuditActionFilter] = useState<string>('all');
  const [auditSearchQuery, setAuditSearchQuery] = useState('');

  // Close shift modal state
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [actualCashCounted, setActualCashCounted] = useState<string>('');
  const [closeNotes, setCloseNotes] = useState('');

  // Cash payout modal state
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutReason, setPayoutReason] = useState('');

  // Open shift modal state
  const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(false);
  const [newCashierName, setNewCashierName] = useState('Jane Mwangi');
  const [newOpeningFloat, setNewOpeningFloat] = useState('1500');

  // New Mid-Shift Override Modal
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overrideAction, setOverrideAction] = useState<ShiftAuditAction>('price_override');
  const [overrideDetails, setOverrideDetails] = useState('');
  const [overrideAmount, setOverrideAmount] = useState('');
  const [managerPinInput, setManagerPinInput] = useState('');
  const [overrideError, setOverrideError] = useState<string | null>(null);

  // Z-Report Preview modal
  const [zReportSlip, setZReportSlip] = useState<{ shift: Shift; text: string } | null>(null);

  const activeStaff = storage.getActiveStaff();
  const canDisbursePayout = storage.hasPermission('shift.payout');

  const refreshData = () => {
    setActiveShift(storage.getActiveShift());
    setShiftsHistory([...storage.getShiftsHistory()]);
    setAuditLogs([...storage.getAuditLogs()]);
  };

  const handleOpenCloseModal = () => {
    if (!activeShift) return;
    setActualCashCounted(activeShift.expectedCash.toFixed(2));
    setIsCloseModalOpen(true);
  };

  const handleConfirmCloseShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;

    const counted = parseFloat(actualCashCounted) || 0;
    const closed = storage.closeShift(counted, closeNotes);
    const slipText = hardware.generateZReportText(closed, tenant);

    setIsCloseModalOpen(false);
    refreshData();
    setZReportSlip({ shift: closed, text: slipText });
  };

  const handleConfirmPayout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift || !payoutAmount) return;

    const amt = parseFloat(payoutAmount) || 0;
    storage.recordCashPayout(amt, payoutReason || 'Store petty cash expense');
    setIsPayoutModalOpen(false);
    setPayoutAmount('');
    setPayoutReason('');
    refreshData();
  };

  const handleConfirmOpenShift = (e: React.FormEvent) => {
    e.preventDefault();
    const flt = parseFloat(newOpeningFloat) || 0;
    storage.openNewShift(newCashierName.trim() || 'Cashier', flt);
    setIsOpenShiftModalOpen(false);
    refreshData();
  };

  const handleCreateOverride = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate Manager PIN (Manager PIN: 2222, Admin: 9999)
    if (managerPinInput !== '2222' && managerPinInput !== '9999' && activeStaff.role === 'cashier') {
      setOverrideError('Invalid Manager PIN. Mid-shift overrides require Supervisor authorization.');
      return;
    }

    const amt = parseFloat(overrideAmount) || undefined;
    storage.recordAuditLog({
      action: overrideAction,
      details: overrideDetails || `Staff requested mid-shift ${overrideAction.replace('_', ' ')}`,
      amount: amt,
      authorizedBy: activeStaff.role !== 'cashier' ? `${activeStaff.name} (${activeStaff.title})` : 'David Kibet (Manager PIN Verified)',
      flagSeverity: overrideAction === 'emergency_drawer_kick' ? 'alert' : 'warning',
    });

    if (overrideAction === 'emergency_drawer_kick') {
      hardware.triggerCashDrawerKick();
    }

    setIsOverrideModalOpen(false);
    setOverrideDetails('');
    setOverrideAmount('');
    setManagerPinInput('');
    setOverrideError(null);
    refreshData();
  };

  const handlePrintZReport = (shift: Shift) => {
    const text = hardware.generateZReportText(shift, tenant);
    setZReportSlip({ shift, text });
  };

  const filteredAuditLogs = auditLogs.filter(log => {
    const matchesAction = auditActionFilter === 'all' || log.action === auditActionFilter;
    const matchesSearch =
      log.details.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
      log.staffName.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
      log.authorizedBy?.toLowerCase().includes(auditSearchQuery.toLowerCase());
    return matchesAction && matchesSearch;
  });

  const totalShiftRevenue = activeShift
    ? activeShift.cashSales + activeShift.cardSales + activeShift.mobileSales + activeShift.roomChargesTotal
    : 0;

  const countedNum = parseFloat(actualCashCounted) || 0;
  const variance = activeShift ? countedNum - activeShift.expectedCash : 0;

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-[#090b10] space-y-6">
      {/* Top Tabs Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-850 pb-4">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setViewTab('current')}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${
              viewTab === 'current'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            Active Drawer & Cash Balancing
          </button>
          <button
            onClick={() => setViewTab('audit')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${
              viewTab === 'audit'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Audit Trail & Overrides</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-zinc-900 text-zinc-300">
              {auditLogs.length}
            </span>
          </button>
          <button
            onClick={() => setViewTab('history')}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${
              viewTab === 'history'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            Z-Reports Archive ({shiftsHistory.length})
          </button>
        </div>

        {/* Current Operator RBAC Badge */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-500 text-[11px]">Current Staff:</span>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-200 font-mono">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="font-semibold">{activeStaff.name}</span>
            <span className="text-[10px] uppercase text-blue-400">({activeStaff.role})</span>
          </div>
        </div>
      </div>

      {/* TAB 1: CURRENT ACTIVE SHIFT VIEW */}
      {viewTab === 'current' && (
        <div className="space-y-6">
          {activeShift ? (
            <div className="rounded-xl bg-zinc-950 border border-zinc-850 p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-850 pb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-800/40 text-emerald-400">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-zinc-100">Active Trading Shift</h2>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-900 uppercase">
                        Open & Trading
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Cashier: <strong className="text-zinc-200">{activeShift.cashierName}</strong> · Started at {new Date(activeShift.startTime).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsPayoutModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-xs font-medium text-zinc-200 transition-colors"
                  >
                    <MinusCircle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Record Till Payout</span>
                  </button>

                  <button
                    onClick={handleOpenCloseModal}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-sm transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Close Shift & Balance Drawer</span>
                  </button>
                </div>
              </div>

              {/* Drawer Reconciliation Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800">
                  <div className="text-xs text-zinc-400">Opening Cash Float (+)</div>
                  <div className="text-xl font-bold font-mono text-zinc-200 tabular-nums mt-1">
                    {tenant.currencySymbol} {activeShift.openingFloat.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">Locked opening cash reserve</div>
                </div>

                <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800">
                  <div className="text-xs text-zinc-400">Cash Sales Collected (+)</div>
                  <div className="text-xl font-bold font-mono text-emerald-400 tabular-nums mt-1">
                    {tenant.currencySymbol} {activeShift.cashSales.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">Physical currency intake</div>
                </div>

                <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800">
                  <div className="text-xs text-zinc-400">Till Cash Payouts (-)</div>
                  <div className="text-xl font-bold font-mono text-rose-400 tabular-nums mt-1">
                    {tenant.currencySymbol} {activeShift.cashPayouts.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">Authorized petty cash drops</div>
                </div>

                <div className="p-4 rounded-lg bg-blue-950/20 border border-blue-900/40">
                  <div className="text-xs text-blue-300 font-semibold">Expected Till Cash (=)</div>
                  <div className="text-2xl font-bold font-mono text-blue-400 tabular-nums mt-1">
                    {tenant.currencySymbol} {activeShift.expectedCash.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-1">Float + Cash Sales - Payouts</div>
                </div>
              </div>

              {/* Non-Cash Revenue Audit Grid */}
              <div className="p-4 rounded-lg bg-zinc-900/40 border border-zinc-850 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-300 uppercase tracking-wider text-[11px]">
                    Electronic & Room Revenue Audit
                  </span>
                  <span className="text-zinc-400">
                    Gross Shift Total: <strong className="font-mono text-zinc-100 text-sm tabular-nums">{tenant.currencySymbol} {totalShiftRevenue.toFixed(2)}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs font-mono">
                  <div className="p-3 rounded bg-zinc-950 border border-zinc-800">
                    <span className="text-zinc-500 text-[11px] font-sans">Card POS:</span>
                    <div className="font-bold text-zinc-200 mt-0.5 tabular-nums">
                      {tenant.currencySymbol} {activeShift.cardSales.toFixed(2)}
                    </div>
                  </div>
                  <div className="p-3 rounded bg-zinc-950 border border-zinc-800">
                    <span className="text-zinc-500 text-[11px] font-sans">Mobile Money:</span>
                    <div className="font-bold text-zinc-200 mt-0.5 tabular-nums">
                      {tenant.currencySymbol} {activeShift.mobileSales.toFixed(2)}
                    </div>
                  </div>
                  <div className="p-3 rounded bg-zinc-950 border border-zinc-800">
                    <span className="text-zinc-500 text-[11px] font-sans">Guest Room Folios:</span>
                    <div className="font-bold text-zinc-200 mt-0.5 tabular-nums">
                      {tenant.currencySymbol} {activeShift.roomChargesTotal.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-zinc-950 border border-zinc-850 text-center space-y-3">
              <Clock className="w-10 h-10 mx-auto text-zinc-600" />
              <h3 className="text-base font-semibold text-zinc-200">No Shift Currently Open</h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Assign an active cashier and initialize the opening cash till float to begin operations.
              </p>
              <button
                onClick={() => setIsOpenShiftModalOpen(true)}
                className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-sm transition-colors"
              >
                Start New Trading Shift
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GRANULAR AUDIT TRAIL TAB */}
      {viewTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-zinc-950 border border-zinc-850">
            <div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-zinc-100">
                  Granular Shift Audit Trail & Staff Overrides
                </h3>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Read-only immutable log of cash adjustments, voided items, price overrides, and manager authorizations
              </p>
            </div>

            <button
              onClick={() => setIsOverrideModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-sm transition-colors shrink-0"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Record Mid-Shift Override</span>
            </button>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
              {[
                { id: 'all', label: 'All Events' },
                { id: 'opening_float', label: 'Opening Float' },
                { id: 'cash_payout', label: 'Cash Payouts' },
                { id: 'void_line_item', label: 'Void Items' },
                { id: 'price_override', label: 'Price Overrides' },
                { id: 'emergency_drawer_kick', label: 'Drawer Release' },
                { id: 'shift_close_variance', label: 'Shift Variance' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setAuditActionFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    auditActionFilter === f.id
                      ? 'bg-zinc-800 text-zinc-100'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search audit trail..."
                value={auditSearchQuery}
                onChange={e => setAuditSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Granular Audit Logs Table */}
          <div className="border border-zinc-850 rounded-xl bg-zinc-950 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-zinc-850 text-zinc-500 font-mono text-[11px] bg-zinc-950/80">
                    <th className="p-3.5">TIMESTAMP</th>
                    <th className="p-3.5">OPERATOR & ROLE</th>
                    <th className="p-3.5">ACTION EVENT</th>
                    <th className="p-3.5">DETAILS & REASON</th>
                    <th className="p-3.5 text-right">AMOUNT IMPACT</th>
                    <th className="p-3.5">SUPERVISOR SIGN-OFF</th>
                    <th className="p-3.5 text-center">FLAG</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-zinc-500">
                        No audit events matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-zinc-900/40 transition-colors">
                        <td className="p-3.5 font-mono text-zinc-400 text-[11px] whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="p-3.5">
                          <div className="font-semibold text-zinc-200">{log.staffName}</div>
                          <div className="text-[10px] uppercase font-mono text-zinc-500">
                            {log.staffRole}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                            log.action === 'void_line_item' || log.action === 'price_override'
                              ? 'bg-amber-950 text-amber-300 border border-amber-900'
                              : log.action === 'emergency_drawer_kick' || log.action === 'shift_close_variance'
                              ? 'bg-rose-950 text-rose-300 border border-rose-900'
                              : 'bg-blue-950 text-blue-300 border border-blue-900'
                          }`}>
                            {log.action.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="p-3.5 text-zinc-300 max-w-sm">{log.details}</td>
                        <td className="p-3.5 text-right font-mono font-bold tabular-nums whitespace-nowrap">
                          {log.amount !== undefined ? (
                            <span className="text-zinc-100">
                              {tenant.currencySymbol} {log.amount.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-zinc-600">—</span>
                          )}
                        </td>
                        <td className="p-3.5 font-mono text-[11px] text-zinc-400">
                          {log.authorizedBy || 'System Verified'}
                        </td>
                        <td className="p-3.5 text-center">
                          <span className={`inline-block w-2 h-2 rounded-full ${
                            log.flagSeverity === 'alert'
                              ? 'bg-rose-500'
                              : log.flagSeverity === 'warning'
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Z-REPORTS ARCHIVE */}
      {viewTab === 'history' && (
        <div className="space-y-3">
          <div className="border border-zinc-850 rounded-xl bg-zinc-950 overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-zinc-850 text-zinc-500 font-mono text-[11px] bg-zinc-950/80">
                  <th className="p-3.5">Z-REPORT #</th>
                  <th className="p-3.5">CASHIER</th>
                  <th className="p-3.5">SHIFT WINDOW</th>
                  <th className="p-3.5 text-right">EXPECTED</th>
                  <th className="p-3.5 text-right">COUNTED</th>
                  <th className="p-3.5 text-right">VARIANCE</th>
                  <th className="p-3.5 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {shiftsHistory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-zinc-500">
                      No closed shifts archived yet. Closed shifts generate official Z-Reports here.
                    </td>
                  </tr>
                ) : (
                  shiftsHistory.map(s => {
                    const varDiff = s.discrepancy || 0;
                    return (
                      <tr key={s.id} className="hover:bg-zinc-900/40">
                        <td className="p-3.5 font-mono font-bold text-zinc-200">
                          {s.zReportNumber || 'Z-REP'}
                        </td>
                        <td className="p-3.5 text-zinc-300 font-medium">{s.cashierName}</td>
                        <td className="p-3.5 font-mono text-zinc-400 text-[11px]">
                          {new Date(s.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })} · {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} → {s.endTime ? new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'CLOSED'}
                        </td>
                        <td className="p-3.5 text-right font-mono text-zinc-300 tabular-nums">
                          {tenant.currencySymbol} {s.expectedCash.toFixed(2)}
                        </td>
                        <td className="p-3.5 text-right font-mono text-zinc-100 font-bold tabular-nums">
                          {tenant.currencySymbol} {(s.actualCashCounted || 0).toFixed(2)}
                        </td>
                        <td className="p-3.5 text-right font-mono font-semibold tabular-nums">
                          <span className={varDiff === 0 ? 'text-emerald-400' : varDiff > 0 ? 'text-blue-400' : 'text-rose-400'}>
                            {varDiff === 0 ? 'Balanced' : `${varDiff > 0 ? '+' : ''}${varDiff.toFixed(2)}`}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => handlePrintZReport(s)}
                            className="flex items-center gap-1 ml-auto px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 text-xs transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Reprint Z-Report</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mid-Shift Override & Audit Modal */}
      {isOverrideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-zinc-100">Record Mid-Shift Override</h3>
                <p className="text-xs text-zinc-400">Supervisor authorization & immutable audit entry</p>
              </div>
              <button onClick={() => setIsOverrideModalOpen(false)} className="p-1 text-zinc-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOverride} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Override Action Type</label>
                <select
                  value={overrideAction}
                  onChange={e => setOverrideAction(e.target.value as any)}
                  className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="price_override">Price Override / Concession</option>
                  <option value="void_line_item">Voided Item Prior to Payment</option>
                  <option value="manual_discount">Manual Manager Discount %</option>
                  <option value="emergency_drawer_kick">Emergency Physical Drawer Kick</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Operational Justification / Reason</label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Scuffed packaging discount / Customer line cancellation"
                  value={overrideDetails}
                  onChange={e => setOverrideDetails(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Amount Impact ({tenant.currencySymbol})</label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 50"
                  value={overrideAmount}
                  onChange={e => setOverrideAmount(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono text-base tabular-nums focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Manager PIN verification if acting as Cashier */}
              {activeStaff.role === 'cashier' && (
                <div className="p-3 rounded-lg bg-zinc-950 border border-amber-900/60 space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Manager PIN Authorization Required</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Cashier role cannot execute mid-shift overrides without Manager sign-off. (Demo PIN: <code className="text-zinc-200">2222</code>).
                  </p>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    placeholder="Enter 4-digit PIN..."
                    value={managerPinInput}
                    onChange={e => setManagerPinInput(e.target.value)}
                    className="w-full p-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-100 font-mono tracking-widest text-center"
                  />
                  {overrideError && (
                    <div className="text-[11px] text-rose-400 font-medium">{overrideError}</div>
                  )}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOverrideModalOpen(false)}
                  className="px-4 py-2 text-zinc-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
                >
                  Authorize & Append to Audit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Shift Modal */}
      {isCloseModalOpen && activeShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-zinc-100">End-of-Shift Reconciliation</h3>
                <p className="text-xs text-zinc-400">Cash drawer audit & Z-Report generator</p>
              </div>
              <button onClick={() => setIsCloseModalOpen(false)} className="p-1 text-zinc-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmCloseShift} className="space-y-4 text-xs">
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex justify-between items-center">
                <span className="text-zinc-400">Expected Physical Cash:</span>
                <span className="font-mono text-sm font-bold text-blue-400 tabular-nums">
                  {tenant.currencySymbol} {activeShift.expectedCash.toFixed(2)}
                </span>
              </div>

              <div>
                <label className="block text-zinc-300 mb-1 font-semibold">
                  Actual Physical Cash Counted in Till
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-mono text-zinc-500">
                    {tenant.currencySymbol}
                  </span>
                  <input
                    type="number"
                    step="any"
                    required
                    value={actualCashCounted}
                    onChange={e => setActualCashCounted(e.target.value)}
                    className="w-full pl-12 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-lg font-mono font-bold text-zinc-100 focus:outline-none focus:border-blue-500 tabular-nums"
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex justify-between items-center">
                <span className="text-zinc-400">Calculated Variance:</span>
                <span className={`font-mono font-bold text-sm tabular-nums ${variance === 0 ? 'text-emerald-400' : variance > 0 ? 'text-blue-400' : 'text-rose-400'}`}>
                  {variance === 0 ? 'Balanced (Zero Discrepancy)' : `${variance > 0 ? '+ Overage' : '- Shortage'}: ${tenant.currencySymbol} ${Math.abs(variance).toFixed(2)}`}
                </span>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Supervisor Audit Note</label>
                <input
                  type="text"
                  placeholder="e.g. Verified by Lead Supervisor"
                  value={closeNotes}
                  onChange={e => setCloseNotes(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCloseModalOpen(false)}
                  className="px-4 py-2 text-zinc-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
                >
                  Generate Z-Report & Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Till Cash Payout Modal */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-zinc-100">Record Cash Payout from Till</h3>
              <button onClick={() => setIsPayoutModalOpen(false)} className="p-1 text-zinc-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayout} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Payout Amount ({tenant.currencySymbol})</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="e.g. 200"
                  value={payoutAmount}
                  onChange={e => setPayoutAmount(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono text-base tabular-nums focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Reason / Expense Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Courier dispatch fee / Kitchen ice bag"
                  value={payoutReason}
                  onChange={e => setPayoutReason(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPayoutModalOpen(false)}
                  className="px-4 py-2 text-zinc-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold transition-colors"
                >
                  Disburse & Deduct Till
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Start New Shift Modal */}
      {isOpenShiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-zinc-100">Start New Trading Shift</h3>
              <button onClick={() => setIsOpenShiftModalOpen(false)} className="p-1 text-zinc-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmOpenShift} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Cashier Staff Member</label>
                <input
                  type="text"
                  required
                  value={newCashierName}
                  onChange={e => setNewCashierName(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Opening Cash Till Float ({tenant.currencySymbol})</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={newOpeningFloat}
                  onChange={e => setNewOpeningFloat(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono text-base tabular-nums focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpenShiftModalOpen(false)}
                  className="px-4 py-2 text-zinc-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
                >
                  Open Till & Begin Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Z-Report Slip Modal */}
      {zReportSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">Official Z-Report Print Preview</h3>
                <p className="text-xs text-zinc-400 font-mono">Ref: {zReportSlip.shift.zReportNumber}</p>
              </div>
              <button onClick={() => setZReportSlip(null)} className="p-1 text-zinc-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-white text-zinc-950 rounded font-mono text-[11px] leading-snug whitespace-pre select-all max-h-96 overflow-y-auto">
              {zReportSlip.text}
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => {
                  try {
                    window.print();
                  } catch {}
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Z-Report
              </button>
              <button
                onClick={() => setZReportSlip(null)}
                className="px-4 py-1.5 text-zinc-400 hover:text-zinc-200 text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
