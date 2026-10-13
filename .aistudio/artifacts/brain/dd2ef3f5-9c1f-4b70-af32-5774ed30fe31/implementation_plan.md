# Responsive Shell, Role-Based Navigation & Viewport Redesign

This plan addresses the viewport and structural limitations of Mazao ERP across compact POS terminals (1024×600), tablets, and mobile devices, establishing a unified responsive layout with role-governed navigation and production-grade accessibility.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions have been confirmed and incorporated into the design:
> - **Navigation Shell**: Slim icon rail on desktop (64px width, icons + micro-labels), compact top bar for tenant/staff status, and sticky bottom navigation bar on mobile/narrow terminals.
> - **Mobile & Small-Terminal Basket**: Persistent bottom summary bar with live item count and total due that expands into a full slide-up checkout sheet with complete tender options.
> - **Development & Simulation Tools**: Relocated out of everyday production POS views into an unobtrusive slide-out Diagnostics Drawer accessible via a dedicated tool icon in the top toolbar.
> - **Role-Based Dynamic Menus**: Modules filtered automatically based on the current staff member's RBAC permissions and the active business vertical.

---

## 1. Overview & Core Concept

### What It Delivers
A flexible, high-density business operating system layout that automatically conforms to screen dimensions ranging from small 1024×600 touch terminals to mobile phones and 1440px+ widescreen desktop stations. It eliminates broken viewport calculations, hides development clutter, adapts views to user roles, and provides seamless touch and keyboard accessibility.

### Target Terminals & Form Factors
- **Compact POS Terminals (1024×600 / 1280×800)**: Wide but vertically constrained screens; requires independent vertical scroll regions without top/bottom bar clipping.
- **Mobile Handhelds (360px–480px)**: Cashiers, floor servers, and stockroom auditors using phones; requires thumb-reachable bottom navigation and persistent checkout sheets.
- **Desktop Stations (1440px+)**: Multi-module administrative displays with spacious high-density data tables and side-by-side split panels.

---

## 2. User Experience & Visual Design

### Key Layout Architectures

```
DESKTOP VIEWPORT (≥1024px)
┌─────┬──────────────────────────────────────────────────────────────────┐
│     │ TOP BAR: [Tenant] [Staff Profile & Role]  [Diagnostics] [Sync]   │
│     ├──────────────────────────────────────────────────────────────────┤
│ S   │ VIEWPORT CONTENT: flex-1 min-h-0 overflow-hidden                │
│ L   │                                                                  │
│ I   │ ┌──────────────────────────────┬───────────────────────────────┐ │
│ M   │ │ Left Scrollable Region       │ Right Fixed / Scrollable      │ │
│     │ │ (Product Grid / Room Rack /  │ (Cart Panel / Folio Inspector │ │
│ R   │ │  Data Cards)                 │  Summary)                     │ │
│ A   │ └──────────────────────────────┴───────────────────────────────┘ │
│ I   │                                                                  │
│ L   │                                                                  │
└─────┴──────────────────────────────────────────────────────────────────┘

MOBILE / SMALL TERMINAL VIEWPORT (<1024px)
┌────────────────────────────────────────────────────────────────────────┐
│ TOP BAR: [Brand] [Tenant Dropdown] [Staff Role Badge] [Diagnostics]    │
├────────────────────────────────────────────────────────────────────────┤
│ SCROLLABLE CONTENT AREA: min-h-0 overflow-y-auto                       │
│ • Full-width Catalogue Grid or Responsive Data Cards                   │
├────────────────────────────────────────────────────────────────────────┤
│ PERSISTENT MOBILE BASKET BAR: [3 items · KSh 3,250] [View Basket / Pay]│
├────────────────────────────────────────────────────────────────────────┤
│ BOTTOM NAVIGATION BAR: [POS] [Rooms] [Inventory] [Shifts] [More...]    │
└────────────────────────────────────────────────────────────────────────┘
```

### Component Redesign Specifications

1. **Application Shell (`AppShell.tsx`)**:
   - Replaces the monolithic header with a unified shell consisting of:
     - **Slim Desktop Rail (`nav-rail`)**: 64px wide vertical column with icon, tooltip, and micro-label.
     - **Compact Top Bar**: Wordmark, tenant profile picker, active staff role switcher, offline prober, and diagnostics toggle.
     - **Mobile Bottom Navigation Bar**: 56px sticky bottom bar with high-intent touch targets ($\ge 44\text{px}$) for primary modules.

2. **Role-Based Navigation Gating**:
   - Dynamically checks `storage.hasPermission(perm)`:
     - **Cashier**: Accesses Point of Sale, Shifts (drawer balancing), and Rooms (check-in). Restricted from General Ledger and Advanced Analytics.
     - **Manager**: Accesses POS, Rooms, Inventory adjustments, Shift Overrides & Audits, and Analytics.
     - **Admin**: Full access to all 6 modules and system settings.

3. **Responsive Point of Sale (`PointOfSaleView.tsx`)**:
   - Replaces `h-[calc(100vh-61px)]` with `flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden`.
   - On Desktop: Side-by-side product grid and cart panel, each scrolling independently without page-level scrollbars.
   - On Mobile / Small Screens: Full-width product catalogue with a **persistent bottom summary bar** (`sticky bottom-0 z-20`) that slides up a full checkout sheet on tap.

4. **Shared Responsive Dialog Component (`ResponsiveDialog.tsx`)**:
   - Implements a standardized modal contract:
     - Desktop: Centered card (`max-w-lg` to `max-w-2xl`, `max-h-[85vh]`).
     - Mobile: Bottom slide-up sheet (`max-h-[92vh] w-full rounded-t-2xl`).
     - Structured layout: Fixed header with close button, scrollable body (`flex-1 min-h-0 overflow-y-auto`), and sticky bottom action footer.

5. **Responsive Data Views (Cards on Mobile, Tables on Desktop)**:
   - **Inventory**: Desktop renders high-density data grid; mobile renders compact item cards with stock badge, cost/selling price, and quick adjustment action.
   - **Shifts & Audit Trail**: Desktop renders comprehensive audit log; mobile renders event timeline cards with expandable supervisor details.
   - **General Ledger**: Desktop renders dual-account DR/CR columns; mobile renders transaction summary cards with net accounting impact.

6. **Diagnostics & Simulation Drawer (`DiagnosticsDrawer.tsx`)**:
   - Extracts development and simulation controls out of production POS views:
     - Quick barcode scanner tests (`61611001`, `61611002`, etc.).
     - Network WAN connection drop simulator (Online / Offline mode).
     - Concurrent offline conflict simulators (Stock race, Double booking, Price override).
     - Hardware cash drawer manual test pulse.

---

## 3. Key Technical Decisions & Trade-Offs

| Decision | Chosen Approach | Rationale | Alternatives Passed |
| :--- | :--- | :--- | :--- |
| **Desktop Shell** | Slim 64px Icon Rail | Maximizes horizontal real estate for 1024px screens and POS terminals. | 260px wide sidebar (wastes 25% of 1024px screen width). |
| **Mobile Cart** | Persistent Bottom Bar + Slide-up Sheet | Keeps order total and checkout action in reach without obscuring product grid. | Vertical stacking (pushes cart far down the page). |
| **Dialog Layout** | Flex column with `min-h-0` + sticky footer | Prevents modal action buttons from disappearing below the fold on 600px screens. | Unconstrained centered modals with viewport overflow. |
| **Diagnostics Placement** | Dedicated Slide-out Drawer | Keeps everyday sales interface clean and compliant with production UX standards. | Cluttering POS header with developer test buttons. |

---

## 4. Technical Architecture & File Organization

### Component Hierarchy

```
┌────────────────────────────────────────────────────────────────────────┐
│                              APP SHELL                                 │
│  ┌──────────┬───────────────────────────────────────────────────────┐  │
│  │ SLIM     │ TOP BAR: [Tenant] [Staff Profile] [Diagnostics Toggle] │  │
│  │ RAIL     ├───────────────────────────────────────────────────────┤  │
│  │ (Desktop)│ MAIN VIEWPORT: flex-1 min-h-0 (POS / Rooms / etc.)   │  │
│  │          │                                                       │  │
│  │          ├───────────────────────────────────────────────────────┤  │
│  │          │ MOBILE BOTTOM BAR (Mobile / Small Terminals only)     │  │
│  └──────────┴───────────────────────────────────────────────────────┘  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
       ┌────────────────────────────┼────────────────────────────┐
       ▼                            ▼                            ▼
┌──────────────┐             ┌──────────────┐             ┌──────────────┐
│  RESPONSIVE  │             │  RESPONSIVE  │             │ DIAGNOSTICS  │
│  POS & SHEET │             │  DATA CARDS  │             │ SLIDE DRAWER │
└──────────────┘             └──────────────┘             └──────────────┘
```

### Planned File Edits
1. `src/components/common/ResponsiveDialog.tsx`: New reusable dialog primitive with mobile bottom-sheet behavior and desktop centering.
2. `src/components/layout/AppShell.tsx`: New responsive layout wrapper providing the slim desktop rail, top bar, and mobile bottom navigation.
3. `src/components/layout/DiagnosticsDrawer.tsx`: Dedicated drawer for offline toggling, hardware testing, and simulated barcode scanning.
4. `src/components/pos/PointOfSaleView.tsx`: Refactored layout with `min-h-0`, mobile checkout bottom sheet, and clean production interface.
5. `src/components/inventory/InventoryView.tsx`: Responsive table-to-card adaptive layout.
6. `src/components/shifts/ShiftManagerView.tsx`: Responsive layout for till metrics, audit trail cards on mobile, and sticky modal dialogs.
7. `src/components/finance/LedgerView.tsx`: Responsive ledger cards for narrow screens.
8. `src/App.tsx`: Refactored to integrate `AppShell` with role-based access control.
