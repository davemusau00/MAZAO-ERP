import React from 'react';
import { TenantProfile } from '../types/erp';
import { storage } from '../services/storage';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  Wifi,
  WifiOff,
  Building2,
  ChevronDown,
  Download,
} from 'lucide-react';

export type ActiveTab = 'pos' | 'hospitality' | 'inventory' | 'shifts' | 'ledger';

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

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
      <div className="flex items-center justify-between gap-6 px-6 py-3">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-sm shadow-sm shadow-blue-500/20">
              M
            </div>
            <span className="text-base font-bold tracking-tight text-zinc-100 whitespace-nowrap">
              Mazao ERP
            </span>
          </div>

          {/* Tenant Selector */}
          <div className="relative group ml-1">
            <button
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 hover:border-zinc-700 transition-colors"
              title="Switch business workspace profile"
            >
              <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="max-w-[130px] md:max-w-[180px] truncate font-medium">
                {activeTenant.name}
              </span>
              <ChevronDown className="w-3 h-3 text-zinc-500 shrink-0" />
            </button>
            <div className="absolute left-0 mt-1 w-64 rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl p-1.5 hidden group-hover:block hover:block z-50">
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Switch Business Profile
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
        </div>

        {/* Zone 2: Navigation Links (Single-Line, 4-5 items) */}
        <nav className="hidden lg:flex items-center gap-1 shrink-0">
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
            Shifts & Drawer
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

      {/* Mobile Nav strip */}
      <div className="flex lg:hidden overflow-x-auto px-4 py-2 border-t border-zinc-850 gap-1 bg-zinc-950 text-xs">
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
          Shifts
        </button>
        <button
          onClick={() => onTabChange('ledger')}
          className={`px-3 py-1 rounded-md shrink-0 ${activeTab === 'ledger' ? 'bg-zinc-800 text-white' : 'text-zinc-400'}`}
        >
          Ledger
        </button>
      </div>
    </header>
  );
};
