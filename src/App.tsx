/**
 * Mazao ERP — Modern Multi-Tenant Business Operating System
 * PWA-First Modular Monolith with Offline Synchronization
 */

import React, { useState, useEffect } from 'react';
import { storage } from './services/storage';
import { SaleOrder } from './types/erp';
import { AppShell, ActiveTab } from './components/layout/AppShell';
import { DiagnosticsDrawer } from './components/layout/DiagnosticsDrawer';
import { PointOfSaleView } from './components/pos/PointOfSaleView';
import { HospitalityView } from './components/hospitality/HospitalityView';
import { InventoryView } from './components/inventory/InventoryView';
import { ShiftManagerView } from './components/shifts/ShiftManagerView';
import { LedgerView } from './components/finance/LedgerView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { ReceiptModal } from './components/hardware/ReceiptModal';
import { SyncCenterModal } from './components/sync/SyncCenterModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('pos');
  const [activeTenant, setActiveTenant] = useState(storage.getActiveTenant());
  const [tenants] = useState(storage.getTenants());
  const [, setIsOnline] = useState(storage.isOnline());
  const [, setOutboxCount] = useState(storage.getOutboxCount());

  // Receipt Modal State
  const [completedOrder, setCompletedOrder] = useState<SaleOrder | null>(null);

  // Sync Center Modal State
  const [isSyncCenterOpen, setIsSyncCenterOpen] = useState(false);

  // Diagnostics Drawer State
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [diagnosticsBarcode, setDiagnosticsBarcode] = useState<string | null>(null);

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

  const handleBarcodeFromDiagnostics = (barcode: string) => {
    setDiagnosticsBarcode(barcode);
    setActiveTab('pos');
  };

  return (
    <div className="h-dvh w-screen overflow-hidden bg-[#090b10] text-zinc-100 flex flex-col font-sans select-none antialiased">
      <AppShell
        activeTab={activeTab}
        onTabChange={setActiveTab}
        activeTenant={activeTenant}
        tenants={tenants}
        onTenantChange={handleTenantChange}
        onOpenSyncCenter={() => setIsSyncCenterOpen(true)}
        onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
      >
        {activeTab === 'pos' && (
          <PointOfSaleView
            tenant={activeTenant}
            onOrderCompleted={handleOrderCompleted}
            scannedBarcodeFromDiagnostics={diagnosticsBarcode}
            onClearScannedBarcode={() => setDiagnosticsBarcode(null)}
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
      </AppShell>

      {/* Diagnostics & Simulator Console Drawer */}
      <DiagnosticsDrawer
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
        onScanBarcode={handleBarcodeFromDiagnostics}
        onOpenSyncCenter={() => setIsSyncCenterOpen(true)}
      />

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
