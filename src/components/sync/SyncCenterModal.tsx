import React from 'react';
import { storage } from '../../services/storage';
import { Wifi, WifiOff, RefreshCw, X, Database, ArrowRight } from 'lucide-react';

interface SyncCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SyncCenterModal: React.FC<SyncCenterModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const isOnline = storage.isOnline();
  const queue = storage.getOutboxQueue();
  const pendingCount = storage.getOutboxCount();

  const handleToggleOnline = () => {
    storage.toggleNetworkSimulation();
  };

  const handleManualFlush = () => {
    storage.flushOutboxQueue();
  };

  const handleClearSynced = () => {
    storage.clearSyncedOutbox();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/70">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg border ${isOnline ? 'bg-emerald-950/60 border-emerald-800/40 text-emerald-400' : 'bg-rose-950/60 border-rose-800/40 text-rose-400'}`}>
              {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-100">Durable Offline Sync & Outbox</h3>
              <p className="text-xs text-zinc-400">
                Authoritative local queue backed by deterministic idempotency
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Strip */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800">
              <div className="text-xs text-zinc-400 mb-1">Network State</div>
              <div className="flex items-center gap-2">
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                <span className="text-sm font-semibold text-zinc-100">
                  {isOnline ? 'Authoritative Online' : 'Offline / Isolated'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-2">
                {isOnline ? 'Syncing directly to backend ledger' : 'Operating on durable IndexedDB queue'}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800">
              <div className="text-xs text-zinc-400 mb-1">Pending Outbox Items</div>
              <div className="text-2xl font-bold font-mono text-zinc-100 tabular-nums">
                {pendingCount}
              </div>
              <p className="text-[11px] text-zinc-500 mt-2">
                {pendingCount > 0 ? 'Awaiting reconnection sync' : 'All transactions reconciled'}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800">
              <div className="text-xs text-zinc-400 mb-1">Architecture Invariant</div>
              <div className="text-sm font-semibold text-zinc-200">
                Zero Lost Sales
              </div>
              <p className="text-[11px] text-zinc-500 mt-2">
                Deterministic keys prevent duplicate accounting entries
              </p>
            </div>
          </div>

          {/* Network Simulator Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-zinc-950/60 border border-zinc-800/80 rounded-lg">
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-zinc-200">Simulate Network Failure Condition</div>
              <div className="text-xs text-zinc-400">
                Toggle to test how POS cashiering and receipt printing behave during WAN outages.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleOnline}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  isOnline
                    ? 'bg-rose-950 border border-rose-800 text-rose-300 hover:bg-rose-900'
                    : 'bg-emerald-950 border border-emerald-800 text-emerald-300 hover:bg-emerald-900'
                }`}
              >
                {isOnline ? (
                  <>
                    <WifiOff className="w-3.5 h-3.5" />
                    Drop Connection (Go Offline)
                  </>
                ) : (
                  <>
                    <Wifi className="w-3.5 h-3.5" />
                    Restore Connection (Go Online)
                  </>
                )}
              </button>

              {isOnline && pendingCount > 0 && (
                <button
                  onClick={handleManualFlush}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Sync Outbox Now
                </button>
              )}
            </div>
          </div>

          {/* Queue Inspection Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Outbox Ledger Log ({queue.length} events)
              </h4>
              {queue.some(q => q.status === 'synced') && (
                <button
                  onClick={handleClearSynced}
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Clear Synced Entries
                </button>
              )}
            </div>

            <div className="border border-zinc-800 rounded-lg bg-zinc-950 overflow-hidden max-h-60 overflow-y-auto">
              {queue.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-500">
                  <Database className="w-6 h-6 mx-auto mb-2 text-zinc-600" />
                  Outbox is clean. No queued mutations.
                </div>
              ) : (
                <div className="divide-y divide-zinc-900 font-mono text-xs">
                  {queue.map(item => (
                    <div key={item.id} className="p-3 flex items-center justify-between hover:bg-zinc-900/40">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-medium uppercase ${
                          item.status === 'synced'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-900'
                            : 'bg-amber-950 text-amber-400 border border-amber-900'
                        }`}>
                          {item.status}
                        </span>
                        <div>
                          <span className="font-semibold text-zinc-200 uppercase">{item.entityType}</span>
                          <span className="text-zinc-500 ml-2">ID: {item.id.slice(-8)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-zinc-400 text-[11px]">
                        <span>{new Date(item.createdAt).toLocaleTimeString()}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-zinc-600" />
                        <span className="text-zinc-300 font-sans">
                          {item.entityType === 'sale' ? `Order #${item.payload.orderNumber}` :
                           item.entityType === 'room_folio' ? 'Folio Charge' :
                           item.entityType === 'stock' ? `Stock Movement` : 'Shift Update'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-zinc-950/80 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
          >
            Close Sync Center
          </button>
        </div>
      </div>
    </div>
  );
};
