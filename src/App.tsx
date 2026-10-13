/**
 * Mazao ERP — Modern Multi-Tenant Business Operating System
 * PWA-First Modular Monolith with Offline Synchronization
 */

import React, { useState, useEffect } from 'react';
import { storage } from './services/storage';
import { SaleOrder } from './types/erp';
import { Header, ActiveTab } from './components/Header';
import { PointOfSaleView } from './components/pos/PointOfSaleView';
import { HospitalityView } from './components/hospitality/HospitalityView';
import { InventoryView } from './components/inventory/InventoryView';
import { ShiftManagerView } from './components/shifts/ShiftManagerView';
import { LedgerView } from './components/finance/LedgerView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { ReceiptModal } from './components/hardware/ReceiptModal';
import { SyncCenterModal } from './components/sync/SyncCenterModal';
import { WifiOff } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('pos');
  const [activeTenant, setActiveTenant] = useState(storage.getActiveTenant());
  const [tenants] = useState(storage.getTenants());
  const [isOnline, setIsOnline] = useState(storage.isOnline());
  const [outboxCount, setOutboxCount] = useState(storage.getOutboxCount());

  // Receipt Modal State
  const [completedOrder, setCompletedOrder] = useState<SaleOrder | null>(null);

  // Sync Center Modal State
  const [isSyncCenterOpen, setIsSyncCenterOpen] = useState(false);

  // Subscribe to reactive storage changes
  useEffect(() => {
    const unsubscribe = storage.subscribe(() => {
      setActiveTenant(storage.getActiveTenant());
      setIsOnline(storage.isOnline());
      setOutboxCount(storage.getOutboxCount());
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleTenantChange = (newTenantId: string) => {
    storage.switchTenant(newTenantId);
    setActiveTenant(storage.getActiveTenant());
  };

  const handleOrderCompleted = (order: SaleOrder) => {
    setCompletedOrder(order);
  };

  return (
    <div className="min-h-screen bg-[#090b10] text-zinc-100 flex flex-col font-sans select-none antialiased">
      {/* Top Navigation Bar adhering to Top Bar Contract */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        activeTenant={activeTenant}
        tenants={tenants}
        onTenantChange={handleTenantChange}
        onOpenSyncCenter={() => setIsSyncCenterOpen(true)}
      />

      {/* Main Operational Viewport */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'pos' && (
          <PointOfSaleView
            tenant={activeTenant}
            onOrderCompleted={handleOrderCompleted}
          />
        )}

        {activeTab === 'hospitality' && (
          <HospitalityView tenant={activeTenant} />
        )}

        {activeTab === 'inventory' && (
          <InventoryView tenant={activeTenant} />
        )}

        {activeTab === 'shifts' && (
          <ShiftManagerView tenant={activeTenant} />
        )}

        {activeTab === 'ledger' && (
          <LedgerView tenant={activeTenant} />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView currentTenant={activeTenant} />
        )}
      </main>

      {/* Non-intrusive Offline Toast Indicator */}
      {!isOnline && (
        <div
          onClick={() => setIsSyncCenterOpen(true)}
          className="fixed bottom-4 left-4 z-40 flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-zinc-900 border border-amber-600/60 shadow-2xl text-xs font-medium text-amber-300 cursor-pointer hover:bg-zinc-850 transition-colors"
        >
          <WifiOff className="w-4 h-4 text-amber-400" />
          <span>
            Offline Mode Active · {outboxCount} order{outboxCount === 1 ? '' : 's'} queued locally
          </span>
          <span className="text-[10px] text-zinc-500 font-mono underline ml-1">View</span>
        </div>
      )}

      {/* Receipt Preview & ESC/POS Print Modal */}
      <ReceiptModal
        order={completedOrder}
        tenant={activeTenant}
        onClose={() => setCompletedOrder(null)}
      />

      {/* Outbox Sync Center & Network Simulator Modal */}
      <SyncCenterModal
        isOpen={isSyncCenterOpen}
        onClose={() => setIsSyncCenterOpen(false)}
      />
    </div>
  );
}
