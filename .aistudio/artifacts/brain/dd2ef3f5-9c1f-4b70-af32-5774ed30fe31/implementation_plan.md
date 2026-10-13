# Mazao ERP: Multi-Tenant PWA-First Business Operating System

Mazao ERP is a unified, offline-first business operating system designed for real-world operations across retail, hospitality, farm estate, and restaurant businesses. It replaces fragmented POS and back-office silos with an authoritative modular core that guarantees operational continuity under unstable network conditions.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions have been confirmed and incorporated into the design:
> - **Multi-Tenant Sandbox**: Pre-configured switchable profiles for *Retail & Wholesale (Supermarket/Hardware)*, *Hospitality & Lodge (Rooms & Folios)*, *Farm-to-Table Estate*, and *Gastro-Dining*, allowing full testing across business models within one unified codebase.
> - **Modern Dark Terminal Aesthetic**: High-contrast OLED dark theme (`#090A0F` obsidian canvas, zinc-900 elevated surfaces, high-contrast borders, emerald/amber operational status accents, and tabular monospace numerals) engineered for intense day/night shift ergonomics.
> - **Silent Background Print & Thermal Receipt Engine**: Formatted 58mm/80mm ESC/POS-ready thermal receipts with direct browser print dialog execution, print preview modal, audio cash drawer kick trigger, and barcode verification.
> - **Authoritative Offline Queue**: Local-first storage backed by IndexedDB with deterministic idempotency keys, conflict-free sequence counters, and live network failure/reconnection simulations.

---

## 1. Overview & Core Concept

### What It Does
Mazao ERP unifies high-velocity Point-of-Sale (POS), guest room and reservation management, stock batch tracking, shift accounting, and financial ledgering into a single responsive Progressive Web App. When the internet drops, cashiers continue scanning, billing, and printing receipts without interruption; when reconnected, changes replay seamlessly to the authoritative ledger.

### Target Audience & Personas
- **Cashier / POS Operator**: Needs ultra-fast sub-second barcode entry, hotkeys, split payments, and uninterrupted offline receipt printing during busy checkout queues.
- **Front Desk Host**: Manages guest check-ins, room folios, housekeeping status changes, and room-charge transfers from the restaurant/bar.
- **Store / Warehouse Manager**: Oversees real-time stock levels, low-inventory triggers, batch transfers, and procurement purchase orders.
- **General Manager / Accountant**: Inspects end-of-shift drawer reconciliation (cash variances, float counts), gross margin analytics, and double-entry journal entries.

### Key Value
- **Zero Downtime**: Offline transactions persist safely on the client device and synchronize transparently without losing a single cent.
- **Single Operational Truth**: Room service dining bills post directly to the guest’s room folio; retail POS sales deduct stock immediately from warehouse inventory; shifts reconcile with double-entry ledgers.
- **Human-First Ergonomics**: Every screen is designed around an urgent real-life human task (e.g., "Settle Bill", "Check In Room 204", "Close Shift Drawer") rather than raw database entities.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **High-Speed Checkout & Offline Resilience**:
   - Cashier scans or searches items with instant keyboard shortcuts (`F2` search, `Space` pay, `Esc` clear).
   - Cashier toggles the network simulator to "Offline" to test network outages. The POS continues processing orders, saves records to the offline sync queue with encrypted local IDs, fires the simulated cash drawer kick, and outputs the silent thermal print slip.
   - Upon reconnecting to "Online", the queue flushes automatically with visual conflict-free synchronization.

2. **Hospitality & Room Folio Lifecycle**:
   - Interactive visual room matrix (e.g. Standard, Deluxe Suite, Cottage) showing real-time occupancy: *Vacant Clean*, *Occupied*, *Dirty / Housekeeping*, *Reserved*.
   - One-click guest check-in, duration setting, and room folio creation.
   - Cross-module billing: Cashier at the restaurant/bar can charge a meal directly to "Room 102 - Elena Rostova", appending the line item to the active hotel folio.

3. **Shift Opening, Trading & Cash Drawer Balancing**:
   - Cashier opens shift with an opening float (e.g. $150.00 cash).
   - All cash, card, and mobile payments during the shift increment expected drawer amounts.
   - At shift end, cashier enters actual counted cash. The system calculates exact overage/shortage variance with an audit note and prints the Z-Report shift summary.

4. **Inventory Control & Reorder Triggers**:
   - Live stock valuation with automated low-stock warnings.
   - Quick stock adjustment workflow (damage, shrinkage, manual count) and purchase order receiving.

5. **Multi-Tenant Switcher**:
   - Top-level tenant profile picker to instantly preview different businesses: *Apex Retail & Supermarket*, *Savanna Ridge Safari Lodge*, *Green Valley Farm Estate*, or *The Brass Foundry Bistro*.

### Visual Identity & Theme
- **Color Palette (Modern Dark Terminal)**:
  - **Canvas Canvas**: Deep Obsidian (`#090B10`) and Dark Slate (`#0F121A`)
  - **Structural Surfaces**: Zinc-900 (`#181B26`) with 1px hairline borders (`rgba(255, 255, 255, 0.08)`)
  - **Primary Interactive Accent**: Electric Cyan / Cobalt (`#3B82F6` / `#2563EB`)
  - **Operational Indicators**:
    - Nominal / Synced / Clean: Emerald (`#10B981`)
    - Pending Sync / Dirty / Attention: Amber (`#F59E0B`)
    - Offline / Discrepancy / Overdue: Rose (`#EF4444`)
- **Typography & Hierarchy**:
  - Display & Headings: `Plus Jakarta Sans` (weights 600, 700)
  - Body & Form Controls: `Public Sans` / `Inter-clean`
  - Numeric Tables, Barcodes & Currencies: Strict tabular figures (`font-mono tabular-nums`, `JetBrains Mono`)
- **Ergonomics & Layout**:
  - Full desktop width (1440px target) with collapsible quick-action sidebar ($260px).
  - Compact row heights ($38px–$44px) for data tables to maximize vertical data density.
  - Zero-pill metadata design: metadata separated cleanly by typographic bullet separators (`·` or `/`).
  - No decorative status pulse animations on static content.

---

## 3. Key Product Decisions & Trade-Offs

| Decision | Chosen Approach | Rationale | Alternatives Passed |
| :--- | :--- | :--- | :--- |
| **Monolith Architecture** | Modular domain services in single codebase | Eliminates multi-service deployment latency; enables strict synchronous cross-domain contracts (POS + Hotel + Ledger). | Microservices (too fragile for edge/offline retail). |
| **Offline Persistence** | Client IndexedDB storage + Outbox Queue | Guarantees zero dropped sales when WAN connectivity drops. Transactions queue locally with monotonic UUIDs. | Pure Online API (crashes POS when WiFi drops). |
| **Hardware Printing** | Thermal ESC/POS CSS engine + Auto Print | Emulates real 58mm/80mm receipt rolls with high fidelity, silent print dialog trigger, and downloadable thermal slips. | Generic window.print() on unformatted page. |
| **Multi-Tenancy** | Schema-isolated tenant sandbox state | Allows immediate evaluation across hospitality, retail, and agri-estate operations without database migrations. | Hardcoded single retail profile. |

---

## 4. Technical Architecture & Data Strategy

### System & Domain Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MAZAO ERP WORKSPACE SHELL                       │
│  [Tenant Picker] ── [Network Prober & Offline Mode] ── [Shift Status]  │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         ▼                           ▼                           ▼
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│   POINT OF SALE  │       │   HOSPITALITY    │       │    INVENTORY     │
│  • Barcode Scan  │       │  • Room Matrix   │       │  • Stock Batches │
│  • Fast Cart     │       │  • Guest Folios  │       │  • Reorder Level │
│  • Split Payment │       │  • Housekeeping  │       │  • Suppliers/POs │
└────────┬─────────┘       └────────┬─────────┘       └────────┬─────────┘
         │                          │                          │
         └──────────────────────────┼──────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      CORE OPERATIONAL ENGINE                           │
│  ┌───────────────────────┐                 ┌────────────────────────┐  │
│  │ Durable Outbox Queue  │ ◄──[Offline]──► │ Double-Entry Ledger    │  │
│  │ (IndexedDB + Replay)  │                 │ (Debits/Credits/Cash)  │  │
│  └───────────┬───────────┘                 └───────────┬────────────┘  │
│              │                                         │               │
│              ▼                                         ▼               │
│  ┌───────────────────────┐                 ┌────────────────────────┐  │
│  │ ESC/POS Print Engine  │                 │ End-of-Shift Z-Report  │  │
│  │ (Thermal CSS / 80mm)  │                 │ (Drawer Reconciliation)│  │
│  └───────────────────────┘                 └────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### Core Entities & State Model
- **`Tenant`**: `id`, `name`, `type` (`'retail' | 'hospitality' | 'farm_estate' | 'restaurant'`), `currency`, `taxRate`.
- **`Product / SKU`**: `id`, `sku`, `barcode`, `name`, `category`, `costPrice`, `sellingPrice`, `stockOnHand`, `reorderPoint`, `unit`.
- **`Room / Unit`**: `id`, `number`, `type`, `tier`, `ratePerNight`, `status` (`'vacant_clean' | 'vacant_dirty' | 'occupied' | 'maintenance'`), `activeGuestId`.
- **`GuestFolio`**: `id`, `guestName`, `roomNumber`, `checkIn`, `checkOut`, `charges: FolioLineItem[]`, `totalPaid`, `balanceDue`.
- **`Shift`**: `id`, `cashierName`, `startTime`, `endTime`, `openingFloat`, `expectedCash`, `actualCashCounted`, `discrepancy`, `status` (`'open' | 'closed'`).
- **`SaleOrder`**: `id`, `idempotencyKey`, `orderNumber`, `items`, `subtotal`, `tax`, `total`, `paymentMethod`, `roomChargeRef?`, `timestamp`, `syncStatus` (`'synced' | 'pending_outbox'`).
- **`LedgerEntry`**: `id`, `timestamp`, `reference`, `account` (`'Cash' | 'AR' | 'Inventory' | 'Revenue' | 'TaxPayable'`), `debit`, `credit`.

### Component Implementation Structure
1. `src/types/erp.ts`: Canonical TypeScript schemas for all domain entities, commands, and ledger invariants.
2. `src/services/storage.ts`: Durable storage adapter with offline queue replay, IndexedDB local persistence, and conflict resolution.
3. `src/services/hardware.ts`: ESC/POS formatted receipt renderer with automatic print dialog invocation and thermal styling.
4. `src/components/Header.tsx`: Clean top navigation compliant with top-bar contracts, displaying tenant switcher, network toggle (Online / Offline simulation), and PWA install button.
5. `src/components/pos/PointOfSaleView.tsx`: Ergonomic POS terminal with barcode scanner input, quick categories, modifier support, split tender, and room charging.
6. `src/components/hospitality/HospitalityView.tsx`: Visual room rack, guest check-in/out modal, folio balance sheet, and housekeeping status board.
7. `src/components/inventory/InventoryView.tsx`: Low stock alerts, stock ledger adjustments, purchase order creation, and margin analytics.
8. `src/components/shifts/ShiftManagerView.tsx`: Drawer count manager, variance analysis, cash payout tracking, and printable Z-Report.
9. `src/components/finance/LedgerView.tsx`: Real-time double-entry trial balance, revenue breakdown, and transaction audit trails.
10. `src/components/pwa/PWAInstallBanner.tsx`: In-app PWA install prompt adhering to guidelines.
