import React, { useState } from 'react';
import { TenantProfile, StaffUser, UserRole, ROLE_PERMISSIONS } from '../types/erp';
import { storage } from '../services/storage';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  Wifi,
  WifiOff,
  Building2,
  ChevronDown,
  Download,
  User,
  Shield,
  Check,
  X
} from 'lucide-react';

export type ActiveTab = 'pos' | 'hospitality' | 'inventory' | 'shifts' | 'ledger' | 'analytics';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  activeTenant: TenantProfile;
  tenants: TenantProfile[];
  onTenantChange: (tenantId: string) => void;
  onOpenSyncCenter: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  activeTenant,
  tenants,
  onTenantChange,
  onOpenSyncCenter,
}) => {
  const isOnline = storage.isOnline();
  const pendingOutbox = storage.getOutboxCount();
  const { isInstallable, isInstalled, install } = usePWAInstall();

  const [staffUsers] = useState<StaffUser[]>(storage.getStaffUsers());
  const [activeStaff, setActiveStaff] = useState<StaffUser>(storage.getActiveStaff());
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);

  const handleStaffChange = (staffId: string) => {
    storage.switchStaff(staffId);
    setActiveStaff(storage.getActiveStaff());
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-850 bg-zinc-950/90 backdrop-blur-md">
      <div className="flex items-center justify-between gap-4 px-6 py-3">
        {/* Zone 1: Brand Wordmark & Business / Staff Profiles */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-sm shadow-sm shadow-blue-500/20">
              M
            </div>
            <span className="text-base font-bold tracking-tight text-zinc-100 whitespace-nowrap">
              Mazao ERP
            </span>
          </div>

          {/* Tenant Switcher Dropdown */}
          <div className="relative group ml-1">
            <button
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 hover:border-zinc-700 transition-colors"
              title="Switch business workspace profile"
            >
              <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="max-w-[110px] md:max-w-[150px] truncate font-medium">
                {activeTenant.name}
              </span>
              <ChevronDown className="w-3 h-3 text-zinc-500 shrink-0" />
            </button>
            <div className="absolute left-0 mt-1 w-64 rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl p-1.5 hidden group-hover:block hover:block z-50">
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Business Tenant Unit
              </div>
              {tenants.map(t => (
                <button
                  key={t.id}
                  onClick={() => onTenantChange(t.id)}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex flex-col transition-colors ${
                    t.id === activeTenant.id
                      ? 'bg-blue-600/10 border border-blue-500/30 text-blue-400 font-medium'
                      : 'text-zinc-300 hover:bg-zinc-800/80'
                  }`}
                >
                  <span className="font-semibold text-zinc-200">{t.name}</span>
                  <span className="text-[10px] text-zinc-500 capitalize">{t.type.replace('_', ' ')} · {t.currency}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Staff & RBAC Role Switcher */}
          <div className="relative group">
            <button
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 hover:border-zinc-700 transition-colors"
              title="Switch operator role to test permissions"
            >
              <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="max-w-[100px] truncate font-medium">
                {activeStaff.name}
              </span>
              <span className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-mono font-bold ${
                activeStaff.role === 'admin'
                  ? 'bg-purple-950 text-purple-300 border border-purple-800'
                  : activeStaff.role === 'manager'
                  ? 'bg-blue-950 text-blue-300 border border-blue-800'
                  : 'bg-zinc-800 text-zinc-300'
              }`}>
                {activeStaff.role}
              </span>
              <ChevronDown className="w-3 h-3 text-zinc-500 shrink-0" />
            </button>
            <div className="absolute left-0 mt-1 w-64 rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl p-1.5 hidden group-hover:block hover:block z-50">
              <div className="flex items-center justify-between px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                <span>Active User & RBAC Role</span>
                <button
                  onClick={() => setIsPermissionsModalOpen(true)}
                  className="text-blue-400 hover:text-blue-300 capitalize text-[10px]"
                >
                  View Matrix
                </button>
              </div>
              {staffUsers.map(s => (
                <button
                  key={s.id}
                  onClick={() => handleStaffChange(s.id)}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex flex-col transition-colors ${
                    s.id === activeStaff.id
                      ? 'bg-emerald-600/10 border border-emerald-500/30 text-emerald-400 font-medium'
                      : 'text-zinc-300 hover:bg-zinc-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-200">{s.name}</span>
                    <span className="text-[10px] uppercase font-mono text-zinc-400 font-bold">{s.role}</span>
                  </div>
                  <span className="text-[10px] text-zinc-500">{s.title} · PIN: {s.pin}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden xl:flex items-center gap-1 shrink-0">
          <button
            onClick={() => onTabChange('pos')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'pos'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            Point of Sale
          </button>
          <button
            onClick={() => onTabChange('hospitality')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'hospitality'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            Rooms & Folios
          </button>
          <button
            onClick={() => onTabChange('inventory')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'inventory'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            Inventory Ledger
          </button>
          <button
            onClick={() => onTabChange('shifts')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'shifts'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            Shifts & Audit
          </button>
          <button
            onClick={() => onTabChange('ledger')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'ledger'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            General Ledger
          </button>
          <button
            onClick={() => onTabChange('analytics')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'analytics'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            Reporting & Analytics
          </button>
        </nav>

        {/* Zone 3: Primary Action Zone */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Network Prober / Offline Button */}
          <button
            onClick={onOpenSyncCenter}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap transition-colors ${
              isOnline
                ? 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                : 'bg-rose-950/80 border-rose-800 text-rose-300 hover:bg-rose-900/80'
            }`}
            title="Inspect offline queue and toggle connection"
          >
            {isOnline ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            )}
            <span className="hidden sm:inline">
              {isOnline ? 'Online' : 'Offline'}
            </span>
            {pendingOutbox > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[10px] font-mono tabular-nums">
                {pendingOutbox}
              </span>
            )}
          </button>

          {/* In-App PWA Install Button */}
          {isInstallable && !isInstalled && (
            <button
              onClick={install}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm whitespace-nowrap transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install PWA</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile / Tablet Nav Strip */}
      <div className="flex xl:hidden overflow-x-auto px-4 py-2 border-t border-zinc-850 gap-1 bg-zinc-950 text-xs">
        <button
          onClick={() => onTabChange('pos')}
          className={`px-3 py-1 rounded-md shrink-0 ${activeTab === 'pos' ? 'bg-zinc-800 text-white' : 'text-zinc-400'}`}
        >
          POS
        </button>
        <button
          onClick={() => onTabChange('hospitality')}
          className={`px-3 py-1 rounded-md shrink-0 ${activeTab === 'hospitality' ? 'bg-zinc-800 text-white' : 'text-zinc-400'}`}
        >
          Rooms
        </button>
        <button
          onClick={() => onTabChange('inventory')}
          className={`px-3 py-1 rounded-md shrink-0 ${activeTab === 'inventory' ? 'bg-zinc-800 text-white' : 'text-zinc-400'}`}
        >
          Inventory
        </button>
        <button
          onClick={() => onTabChange('shifts')}
          className={`px-3 py-1 rounded-md shrink-0 ${activeTab === 'shifts' ? 'bg-zinc-800 text-white' : 'text-zinc-400'}`}
        >
          Shifts & Audit
        </button>
        <button
          onClick={() => onTabChange('ledger')}
          className={`px-3 py-1 rounded-md shrink-0 ${activeTab === 'ledger' ? 'bg-zinc-800 text-white' : 'text-zinc-400'}`}
        >
          Ledger
        </button>
        <button
          onClick={() => onTabChange('analytics')}
          className={`px-3 py-1 rounded-md shrink-0 ${activeTab === 'analytics' ? 'bg-zinc-800 text-white' : 'text-zinc-400'}`}
        >
          Analytics
        </button>
      </div>

      {/* Permissions Matrix Modal */}
      {isPermissionsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-semibold text-zinc-100">
                  Mazao ERP Role-Based Access Control (RBAC) Matrix
                </h3>
              </div>
              <button
                onClick={() => setIsPermissionsModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-200 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Granular access definitions governing operational cashiering, supervisor overrides, financial ledgers, and conflict resolution.
            </p>

            <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-zinc-850 font-mono text-[11px] text-zinc-500 bg-zinc-900/50">
                    <th className="p-3">CAPABILITY / PERMISSION</th>
                    <th className="p-3 text-center">CASHIER</th>
                    <th className="p-3 text-center">MANAGER</th>
                    <th className="p-3 text-center">ADMINISTRATOR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900 font-mono text-[11px]">
                  {[
                    { key: 'pos.sell', label: 'Process POS checkout & barcode scans' },
                    { key: 'pos.void_item', label: 'Mid-shift void lines & price overrides' },
                    { key: 'shift.payout', label: 'Authorize till cash payouts / drops' },
                    { key: 'shift.view_audit', label: 'View granular staff audit trail' },
                    { key: 'rooms.manage_folios', label: 'Settle folios & post room charges' },
                    { key: 'inventory.adjust', label: 'Adjust inventory stock counts' },
                    { key: 'ledger.view', label: 'Inspect double-entry general ledger' },
                    { key: 'analytics.view', label: 'Access reporting & sales intelligence' },
                    { key: 'system.manage_conflicts', label: 'Resolve offline multi-device conflicts' },
                  ].map(row => (
                    <tr key={row.key} className="hover:bg-zinc-900/40">
                      <td className="p-3 font-sans text-zinc-200">
                        <div className="font-medium">{row.label}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">{row.key}</div>
                      </td>
                      <td className="p-3 text-center">
                        {ROLE_PERMISSIONS.cashier.includes(row.key as any) ? (
                          <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {ROLE_PERMISSIONS.manager.includes(row.key as any) ? (
                          <Check className="w-4 h-4 text-blue-400 mx-auto" />
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {ROLE_PERMISSIONS.admin.includes(row.key as any) ? (
                          <Check className="w-4 h-4 text-purple-400 mx-auto" />
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsPermissionsModalOpen(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg"
              >
                Close Matrix
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
