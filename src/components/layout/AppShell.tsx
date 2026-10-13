import React, { useState } from 'react';
import { TenantProfile, StaffUser, Permission, ROLE_PERMISSIONS } from '../../types/erp';
import { storage } from '../../services/storage';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { ResponsiveDialog } from '../common/ResponsiveDialog';
import {
  ShoppingCart,
  Hotel,
  Package,
  Clock,
  Scale,
  BarChart3,
  Wifi,
  WifiOff,
  Building2,
  User,
  Shield,
  Check,
  ChevronDown,
  Download,
  Wrench,
  X
} from 'lucide-react';

export type ActiveTab = 'pos' | 'hospitality' | 'inventory' | 'shifts' | 'ledger' | 'analytics';

interface NavItemConfig {
  id: ActiveTab;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  permission: Permission;
}

const NAV_ITEMS: NavItemConfig[] = [
  {
    id: 'pos',
    label: 'Point of Sale',
    shortLabel: 'POS',
    icon: <ShoppingCart className="w-5 h-5" />,
    permission: 'pos.sell',
  },
  {
    id: 'hospitality',
    label: 'Rooms & Folios',
    shortLabel: 'Rooms',
    icon: <Hotel className="w-5 h-5" />,
    permission: 'rooms.checkin',
  },
  {
    id: 'inventory',
    label: 'Inventory Ledger',
    shortLabel: 'Stock',
    icon: <Package className="w-5 h-5" />,
    permission: 'inventory.adjust',
  },
  {
    id: 'shifts',
    label: 'Shifts & Audit',
    shortLabel: 'Shifts',
    icon: <Clock className="w-5 h-5" />,
    permission: 'shift.open',
  },
  {
    id: 'ledger',
    label: 'General Ledger',
    shortLabel: 'Ledger',
    icon: <Scale className="w-5 h-5" />,
    permission: 'ledger.view',
  },
  {
    id: 'analytics',
    label: 'Reporting & Analytics',
    shortLabel: 'Reports',
    icon: <BarChart3 className="w-5 h-5" />,
    permission: 'analytics.view',
  },
];

interface AppShellProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  activeTenant: TenantProfile;
  tenants: TenantProfile[];
  onTenantChange: (tenantId: string) => void;
  onOpenSyncCenter: () => void;
  onOpenDiagnostics: () => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  activeTab,
  onTabChange,
  activeTenant,
  tenants,
  onTenantChange,
  onOpenSyncCenter,
  onOpenDiagnostics,
  children,
}) => {
  const isOnline = storage.isOnline();
  const pendingOutbox = storage.getOutboxCount();
  const { isInstallable, isInstalled, install } = usePWAInstall();

  const staffUsers = storage.getStaffUsers();
  const activeStaff = storage.getActiveStaff();
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);

  const handleStaffChange = (staffId: string) => {
    storage.switchStaff(staffId);
    // If the new staff lacks permission for the current active tab, gracefully navigate to POS
    const newStaff = storage.getActiveStaff();
    const currentItem = NAV_ITEMS.find(n => n.id === activeTab);
    if (currentItem && !ROLE_PERMISSIONS[newStaff.role].includes(currentItem.permission)) {
      onTabChange('pos');
    }
  };

  // Filter navigation items by staff RBAC permissions
  const authorizedNavItems = NAV_ITEMS.filter(item =>
    storage.hasPermission(item.permission)
  );

  return (
    <div className="flex flex-1 h-full w-full overflow-hidden bg-[#090b10] text-zinc-100 select-none">
      {/* 1. SLIM DESKTOP NAVIGATION RAIL (≥ 1024px) */}
      <aside className="hidden lg:flex w-16 xl:w-18 flex-col items-center py-4 bg-zinc-950 border-r border-zinc-850 shrink-0 z-30 select-none">
        {/* Brand Icon */}
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white text-base shadow-sm shadow-blue-500/20 mb-6 shrink-0">
          M
        </div>

        {/* Navigation Items (Icons + Micro-labels) */}
        <nav className="flex-1 w-full flex flex-col items-center gap-2 overflow-y-auto px-1.5 scrollbar-none">
          {authorizedNavItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                title={item.label}
                className={`w-full py-2.5 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[50px] ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
                }`}
              >
                <div className={`transition-transform ${isActive ? 'scale-105' : 'group-hover:scale-105'}`}>
                  {item.icon}
                </div>
                <span className="text-[10px] tracking-tight leading-none text-center truncate max-w-[56px]">
                  {item.shortLabel}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Rail Footer (Diagnostics quick trigger) */}
        <div className="pt-3 border-t border-zinc-850/60 w-full flex flex-col items-center gap-2 shrink-0">
          <button
            onClick={onOpenDiagnostics}
            title="Open Edge Diagnostics & Simulator Console"
            className="w-10 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Open Diagnostics"
          >
            <Wrench className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* 2. MAIN APPLICATION VIEWPORT */}
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        {/* COMPACT TOP BAR */}
        <header className="h-14 px-4 sm:px-6 bg-zinc-950/90 border-b border-zinc-850 flex items-center justify-between gap-3 shrink-0 z-20 backdrop-blur-md">
          {/* Left: Mobile Wordmark + Tenant Switcher */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="lg:hidden flex items-center gap-2 shrink-0">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-xs shadow-sm">
                M
              </div>
              <span className="text-sm font-bold tracking-tight text-zinc-100 hidden sm:inline">
                Mazao
              </span>
            </div>

            {/* Tenant Selector Dropdown */}
            <div className="relative group">
              <button
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 hover:border-zinc-700 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
                title="Switch business workspace profile"
              >
                <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="max-w-[110px] sm:max-w-[160px] truncate font-medium text-left">
                  {activeTenant.name}
                </span>
                <ChevronDown className="w-3 h-3 text-zinc-500 shrink-0" />
              </button>

              <div className="absolute left-0 mt-1 w-64 rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl p-1.5 hidden group-hover:block hover:block z-50">
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Business Tenant Profile
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

            {/* Staff User & RBAC Role Switcher */}
            <div className="relative group">
              <button
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 hover:border-zinc-700 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
                title="Switch operator role to test permissions"
              >
                <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="max-w-[90px] truncate font-medium hidden sm:inline">
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
                  <span>Operator Profile & Role</span>
                  <button
                    onClick={() => setIsPermissionsModalOpen(true)}
                    className="text-blue-400 hover:text-blue-300 text-[10px] underline"
                  >
                    RBAC Matrix
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

          {/* Right Controls: Diagnostics, Sync & PWA */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Mobile Diagnostics Trigger Button */}
            <button
              onClick={onOpenDiagnostics}
              className="lg:hidden p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Diagnostics"
              title="Diagnostics Console"
            >
              <Wrench className="w-4 h-4" />
            </button>

            {/* Offline Sync Prober Button */}
            <button
              onClick={onOpenSyncCenter}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap transition-colors min-h-[44px] sm:min-h-0 ${
                isOnline
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                  : 'bg-rose-950 border-rose-800 text-rose-300 hover:bg-rose-900'
              }`}
              title="Inspect offline queue and synchronization status"
            >
              {isOnline ? (
                <Wifi className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              )}
              <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
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
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm whitespace-nowrap transition-colors min-h-[44px] sm:min-h-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Install PWA</span>
              </button>
            )}
          </div>
        </header>

        {/* VIEWPORT CONTENT CONTAINER: min-h-0 flex-1 */}
        <main className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
          {children}
        </main>

        {/* 3. MOBILE BOTTOM NAVIGATION BAR (< 1024px) */}
        <nav className="lg:hidden h-14 bg-zinc-950 border-t border-zinc-850 flex items-center justify-around px-2 shrink-0 z-30 select-none">
          {authorizedNavItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex-1 py-1 flex flex-col items-center justify-center gap-0.5 transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 ${
                  isActive
                    ? 'text-blue-400 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {item.icon}
                <span className="text-[10px] font-medium leading-none">
                  {item.shortLabel}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Permissions Matrix Modal */}
      <ResponsiveDialog
        isOpen={isPermissionsModalOpen}
        onClose={() => setIsPermissionsModalOpen(false)}
        title="Role-Based Access Control (RBAC) Matrix"
        subtitle="Granular permissions mapped across Cashier, Manager, and Admin roles"
        icon={<Shield className="w-5 h-5 text-blue-400" />}
        maxWidth="lg"
        footerActions={
          <button
            onClick={() => setIsPermissionsModalOpen(false)}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg"
          >
            Close Matrix
          </button>
        }
      >
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
      </ResponsiveDialog>
    </div>
  );
};
