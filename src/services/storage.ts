/**
 * Mazao ERP Authoritative Storage & Offline Synchronization Engine
 * Local-First architecture using IndexedDB / LocalStorage with Outbox Queue
 */

import {
  TenantProfile,
  ProductItem,
  Room,
  SaleOrder,
  Shift,
  StockMovement,
  LedgerEntry,
  OutboxItem,
  FolioCharge
} from '../types/erp';

// Seed tenants
export const INITIAL_TENANTS: TenantProfile[] = [
  {
    id: 'tenant-retail',
    name: 'Apex Supermarket & Hardware',
    type: 'retail',
    currency: 'KES',
    currencySymbol: 'KSh',
    taxRate: 0.16,
    address: 'Kenyatta Ave, Suite 104, Nairobi',
    phone: '+254 700 123 456',
    tagline: 'High-Velocity Fast Retail & Building Supplies',
    receiptHeader: 'APEX SUPERMARKET & WHOLESALE',
    receiptFooter: 'Thank you for shopping at Apex! Goods once sold cannot be returned without receipt.',
  },
  {
    id: 'tenant-lodge',
    name: 'Savanna Ridge Safari Lodge',
    type: 'hospitality',
    currency: 'USD',
    currencySymbol: '$',
    taxRate: 0.12,
    address: 'Mara Triangle Ridge Road, Maasai Mara',
    phone: '+254 711 987 654',
    tagline: 'Luxury Bush Retreat & Eco-Conservancy',
    receiptHeader: 'SAVANNA RIDGE SAFARI LODGE',
    receiptFooter: 'Thank you for staying with us. Conservation levy included in all rates.',
  },
  {
    id: 'tenant-farm',
    name: 'Green Valley Agro-Estate',
    type: 'farm_estate',
    currency: 'KES',
    currencySymbol: 'KSh',
    taxRate: 0.0, // Agricultural produce exempt
    address: 'Highland Farm Block 4, Nyeri Outskirts',
    phone: '+254 722 555 789',
    tagline: 'Farm-Fresh Dairy, Avocados & Specialty Nursery',
    receiptHeader: 'GREEN VALLEY AGRO-ESTATE',
    receiptFooter: 'Harvested daily. Traceable from soil to dining table.',
  },
  {
    id: 'tenant-bistro',
    name: 'The Brass Foundry Bistro',
    type: 'restaurant',
    currency: 'KES',
    currencySymbol: 'KSh',
    taxRate: 0.16,
    address: '4th Floor, Craft Quarter, Westlands',
    phone: '+254 733 444 112',
    tagline: 'Artisan Wood-Fired Kitchen & Craft Bar',
    receiptHeader: 'THE BRASS FOUNDRY BISTRO',
    receiptFooter: 'Service charge not included. Tips go directly to floor & kitchen team.',
  },
];

// Seed products per tenant
export const INITIAL_PRODUCTS: Record<string, ProductItem[]> = {
  'tenant-retail': [
    { id: 'ret-1', sku: 'RET-MILK-1L', barcode: '61611001', name: 'Fresh Whole Milk 1L', category: 'Dairy', costPrice: 65, sellingPrice: 85, stockOnHand: 142, reorderPoint: 30, unit: 'pck', fastKey: '1' },
    { id: 'ret-2', sku: 'RET-BREAD-800G', barcode: '61611002', name: 'Artisan Sliced Bread 800g', category: 'Bakery', costPrice: 70, sellingPrice: 95, stockOnHand: 84, reorderPoint: 20, unit: 'loaf', fastKey: '2' },
    { id: 'ret-3', sku: 'RET-COFFEE-250G', barcode: '61611003', name: 'Estate Ground Coffee 250g', category: 'Beverages', costPrice: 380, sellingPrice: 550, stockOnHand: 36, reorderPoint: 15, unit: 'tin', fastKey: '3' },
    { id: 'ret-4', sku: 'RET-RICE-5KG', barcode: '61611004', name: 'Aromatic Pishori Rice 5kg', category: 'Pantry', costPrice: 850, sellingPrice: 1150, stockOnHand: 28, reorderPoint: 10, unit: 'bag' },
    { id: 'ret-5', sku: 'RET-SUGAR-2KG', barcode: '61611005', name: 'Pure White Sugar 2kg', category: 'Pantry', costPrice: 280, sellingPrice: 360, stockOnHand: 45, reorderPoint: 15, unit: 'bag' },
    { id: 'ret-6', sku: 'RET-SOAP-BAR', barcode: '61611006', name: 'Antibacterial Bar Soap', category: 'Toiletries', costPrice: 55, sellingPrice: 80, stockOnHand: 190, reorderPoint: 40, unit: 'pcs' },
    { id: 'ret-7', sku: 'RET-NAILS-2IN', barcode: '61611007', name: 'Steel Wire Nails 2-Inch (1kg)', category: 'Hardware', costPrice: 160, sellingPrice: 240, stockOnHand: 52, reorderPoint: 15, unit: 'kg' },
    { id: 'ret-8', sku: 'RET-CEMENT-50KG', barcode: '61611008', name: 'Portland Cement 50kg', category: 'Hardware', costPrice: 680, sellingPrice: 820, stockOnHand: 18, reorderPoint: 25, unit: 'bag' }, // low stock
  ],
  'tenant-lodge': [
    { id: 'lod-1', sku: 'LOD-COCKTAIL-SUN', barcode: '72722001', name: 'Sundowner Gin Fizz', category: 'Bar', costPrice: 4, sellingPrice: 14, stockOnHand: 120, reorderPoint: 25, unit: 'gls', fastKey: '1' },
    { id: 'lod-2', sku: 'LOD-WINE-CAB', barcode: '72722002', name: 'Reserve Cabernet Sauvignon', category: 'Bar', costPrice: 18, sellingPrice: 48, stockOnHand: 44, reorderPoint: 12, unit: 'btl', fastKey: '2' },
    { id: 'lod-3', sku: 'LOD-GAME-DRIVE', barcode: '72722003', name: 'Private Dawn Safari Drive', category: 'Activities', costPrice: 35, sellingPrice: 110, stockOnHand: 999, reorderPoint: 0, unit: 'pax', fastKey: '3' },
    { id: 'lod-4', sku: 'LOD-SPA-MASSAGE', barcode: '72722004', name: '60-Min Savanna Herbal Spa', category: 'Wellness', costPrice: 20, sellingPrice: 75, stockOnHand: 999, reorderPoint: 0, unit: 'session' },
    { id: 'lod-5', sku: 'LOD-LAUNDRY-SET', barcode: '72722005', name: 'Guest Express Bush Laundry', category: 'Services', costPrice: 3, sellingPrice: 18, stockOnHand: 999, reorderPoint: 0, unit: 'load' },
    { id: 'lod-6', sku: 'LOD-BUFFET-DINNER', barcode: '72722006', name: 'Boma Barbecue Dinner Buffet', category: 'Dining', costPrice: 12, sellingPrice: 38, stockOnHand: 80, reorderPoint: 10, unit: 'cover' },
  ],
  'tenant-farm': [
    { id: 'frm-1', sku: 'FRM-MILK-BULK', barcode: '83833001', name: 'Raw Chilled Dairy Milk (5L)', category: 'Dairy', costPrice: 200, sellingPrice: 350, stockOnHand: 48, reorderPoint: 10, unit: 'jug', fastKey: '1' },
    { id: 'frm-2', sku: 'FRM-AVO-HASS', barcode: '83833002', name: 'Export Grade Hass Avocados (1kg)', category: 'Horticulture', costPrice: 90, sellingPrice: 160, stockOnHand: 220, reorderPoint: 40, unit: 'kg', fastKey: '2' },
    { id: 'frm-3', sku: 'FRM-EGGS-TRAY', barcode: '83833003', name: 'Free-Range Brown Eggs (30-Tray)', category: 'Poultry', costPrice: 360, sellingPrice: 480, stockOnHand: 65, reorderPoint: 15, unit: 'tray', fastKey: '3' },
    { id: 'frm-4', sku: 'FRM-HONEY-500G', barcode: '83833004', name: 'Raw Acacia Forest Honey 500g', category: 'Apiary', costPrice: 420, sellingPrice: 650, stockOnHand: 32, reorderPoint: 10, unit: 'jar' },
    { id: 'frm-5', sku: 'FRM-SEEDLING-MAC', barcode: '83833005', name: 'Grafted Macadamia Seedling', category: 'Nursery', costPrice: 180, sellingPrice: 350, stockOnHand: 110, reorderPoint: 25, unit: 'tree' },
    { id: 'frm-6', sku: 'FRM-ORGANIC-COMPOST', barcode: '83833006', name: 'Aged Farm Compost 50kg', category: 'Fertilizer', costPrice: 250, sellingPrice: 450, stockOnHand: 40, reorderPoint: 12, unit: 'bag' },
  ],
  'tenant-bistro': [
    { id: 'bst-1', sku: 'BST-STEAK-RIBEYE', barcode: '94944001', name: 'Prime Aged Ribeye Steak 350g', category: 'Mains', costPrice: 850, sellingPrice: 1850, stockOnHand: 24, reorderPoint: 8, unit: 'plate', fastKey: '1' },
    { id: 'bst-2', sku: 'BST-CRAFT-IPA', barcode: '94944002', name: 'Foundry Draught IPA 500ml', category: 'Drinks', costPrice: 160, sellingPrice: 450, stockOnHand: 86, reorderPoint: 20, unit: 'pint', fastKey: '2' },
    { id: 'bst-3', sku: 'BST-BURGER-WAGYU', barcode: '94944003', name: 'Truffle Wagyu Melt Burger', category: 'Mains', costPrice: 520, sellingPrice: 1250, stockOnHand: 32, reorderPoint: 10, unit: 'plate', fastKey: '3' },
    { id: 'bst-4', sku: 'BST-ESPRESSO-DBL', barcode: '94944004', name: 'Double Shot Single Origin', category: 'Coffee', costPrice: 45, sellingPrice: 220, stockOnHand: 300, reorderPoint: 50, unit: 'cup' },
    { id: 'bst-5', sku: 'BST-TIRAMISU', barcode: '94944005', name: 'House Mascarpone Tiramisu', category: 'Dessert', costPrice: 180, sellingPrice: 580, stockOnHand: 14, reorderPoint: 6, unit: 'pcs' },
  ],
};

// Seed rooms (primarily for lodge and estate accommodations)
export const INITIAL_ROOMS: Room[] = [
  {
    id: 'rm-101',
    number: '101',
    type: 'Savanna Tent',
    tier: 'Deluxe',
    floor: 1,
    ratePerNight: 280,
    maxGuests: 2,
    status: 'occupied',
    guestName: 'Elena Rostova',
    guestPhone: '+44 7700 900123',
    checkInDate: '2026-10-12',
    checkOutDate: '2026-10-16',
    folioCharges: [
      { id: 'chg-1', timestamp: '2026-10-12T14:00:00Z', description: 'Room Stay (Night 1 of 4)', category: 'room', amount: 280 },
      { id: 'chg-2', timestamp: '2026-10-12T19:30:00Z', description: 'Sundowner Gin Fizz x 2', category: 'dining', amount: 28, referenceOrderNumber: 'ORD-8812' },
      { id: 'chg-3', timestamp: '2026-10-13T06:30:00Z', description: 'Private Dawn Safari Drive', category: 'spa', amount: 110 },
    ],
  },
  {
    id: 'rm-102',
    number: '102',
    type: 'Bush Cottage',
    tier: 'Executive Suite',
    floor: 1,
    ratePerNight: 420,
    maxGuests: 3,
    status: 'occupied',
    guestName: 'Marcus & Sarah Vance',
    guestPhone: '+1 415 555 2671',
    checkInDate: '2026-10-11',
    checkOutDate: '2026-10-15',
    folioCharges: [
      { id: 'chg-4', timestamp: '2026-10-11T15:00:00Z', description: 'Room Stay (Night 1 of 4)', category: 'room', amount: 420 },
      { id: 'chg-5', timestamp: '2026-10-12T15:00:00Z', description: 'Room Stay (Night 2 of 4)', category: 'room', amount: 420 },
      { id: 'chg-6', timestamp: '2026-10-12T20:15:00Z', description: 'Reserve Cabernet Sauvignon + Boma Dinner', category: 'dining', amount: 86 },
    ],
  },
  {
    id: 'rm-103',
    number: '103',
    type: 'Savanna Tent',
    tier: 'Deluxe',
    floor: 1,
    ratePerNight: 280,
    maxGuests: 2,
    status: 'vacant_dirty',
    folioCharges: [],
  },
  {
    id: 'rm-104',
    number: '104',
    type: 'Acacia Chalet',
    tier: 'Standard',
    floor: 1,
    ratePerNight: 190,
    maxGuests: 2,
    status: 'vacant_clean',
    folioCharges: [],
  },
  {
    id: 'rm-201',
    number: '201',
    type: 'Valley Lookout',
    tier: 'Executive Suite',
    floor: 2,
    ratePerNight: 460,
    maxGuests: 4,
    status: 'vacant_clean',
    folioCharges: [],
  },
  {
    id: 'rm-202',
    number: '202',
    type: 'Acacia Chalet',
    tier: 'Standard',
    floor: 2,
    ratePerNight: 190,
    maxGuests: 2,
    status: 'reserved',
    guestName: 'Dr. Kwame Osei',
    checkInDate: '2026-10-14',
    checkOutDate: '2026-10-17',
    folioCharges: [],
  },
];

class StorageEngine {
  private tenantId: string = 'tenant-retail';
  private isSimulatedOnline: boolean = true;
  private products: Record<string, ProductItem[]> = {};
  private rooms: Room[] = [];
  private orders: SaleOrder[] = [];
  private activeShift: Shift | null = null;
  private shiftsHistory: Shift[] = [];
  private stockMovements: StockMovement[] = [];
  private ledgerEntries: LedgerEntry[] = [];
  private outboxQueue: OutboxItem[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.init();
  }

  private init() {
    // Check localStorage
    const savedTenant = localStorage.getItem('mazao_active_tenant');
    if (savedTenant) this.tenantId = savedTenant;

    const savedSimOnline = localStorage.getItem('mazao_sim_online');
    if (savedSimOnline !== null) this.isSimulatedOnline = savedSimOnline === 'true';

    const savedProducts = localStorage.getItem('mazao_products');
    this.products = savedProducts ? JSON.parse(savedProducts) : INITIAL_PRODUCTS;

    const savedRooms = localStorage.getItem('mazao_rooms');
    this.rooms = savedRooms ? JSON.parse(savedRooms) : INITIAL_ROOMS;

    const savedOrders = localStorage.getItem('mazao_orders');
    this.orders = savedOrders ? JSON.parse(savedOrders) : [];

    const savedActiveShift = localStorage.getItem('mazao_active_shift');
    if (savedActiveShift) {
      this.activeShift = JSON.parse(savedActiveShift);
    } else {
      // Default initial open shift
      this.activeShift = {
        id: 'shift-' + Date.now(),
        tenantId: this.tenantId,
        cashierName: 'Jane Mwangi',
        startTime: new Date(Date.now() - 3600 * 3000).toISOString(),
        status: 'open',
        openingFloat: 1500,
        cashSales: 0,
        cardSales: 0,
        mobileSales: 0,
        roomChargesTotal: 0,
        cashPayouts: 0,
        expectedCash: 1500,
      };
    }

    const savedShifts = localStorage.getItem('mazao_shifts_history');
    this.shiftsHistory = savedShifts ? JSON.parse(savedShifts) : [];

    const savedMovements = localStorage.getItem('mazao_stock_movements');
    this.stockMovements = savedMovements ? JSON.parse(savedMovements) : [];

    const savedLedger = localStorage.getItem('mazao_ledger');
    this.ledgerEntries = savedLedger ? JSON.parse(savedLedger) : this.seedInitialLedger();

    const savedOutbox = localStorage.getItem('mazao_outbox');
    this.outboxQueue = savedOutbox ? JSON.parse(savedOutbox) : [];
  }

  private persist() {
    try {
      localStorage.setItem('mazao_active_tenant', this.tenantId);
      localStorage.setItem('mazao_sim_online', String(this.isSimulatedOnline));
      localStorage.setItem('mazao_products', JSON.stringify(this.products));
      localStorage.setItem('mazao_rooms', JSON.stringify(this.rooms));
      localStorage.setItem('mazao_orders', JSON.stringify(this.orders));
      if (this.activeShift) {
        localStorage.setItem('mazao_active_shift', JSON.stringify(this.activeShift));
      } else {
        localStorage.removeItem('mazao_active_shift');
      }
      localStorage.setItem('mazao_shifts_history', JSON.stringify(this.shiftsHistory));
      localStorage.setItem('mazao_stock_movements', JSON.stringify(this.stockMovements));
      localStorage.setItem('mazao_ledger', JSON.stringify(this.ledgerEntries));
      localStorage.setItem('mazao_outbox', JSON.stringify(this.outboxQueue));
    } catch {
      // storage quota fallback
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener();
    }
  }

  // --- Tenants ---
  public getTenants(): TenantProfile[] {
    return INITIAL_TENANTS;
  }

  public getActiveTenant(): TenantProfile {
    return INITIAL_TENANTS.find(t => t.id === this.tenantId) || INITIAL_TENANTS[0];
  }

  public switchTenant(newTenantId: string): void {
    this.tenantId = newTenantId;
    if (this.activeShift) {
      this.activeShift.tenantId = newTenantId;
    }
    this.persist();
  }

  // --- Network Offline Simulation ---
  public isOnline(): boolean {
    return this.isSimulatedOnline;
  }

  public toggleNetworkSimulation(): void {
    this.isSimulatedOnline = !this.isSimulatedOnline;
    if (this.isSimulatedOnline) {
      this.flushOutboxQueue();
    }
    this.persist();
  }

  public getOutboxCount(): number {
    return this.outboxQueue.filter(item => item.status === 'pending').length;
  }

  public getOutboxQueue(): OutboxItem[] {
    return this.outboxQueue;
  }

  public flushOutboxQueue(): void {
    if (!this.isSimulatedOnline) return;

    // Simulate replay synchronization to authoritative PostgreSQL
    let replayedCount = 0;
    this.outboxQueue = this.outboxQueue.map(item => {
      if (item.status === 'pending') {
        replayedCount++;
        return { ...item, status: 'synced', attempts: item.attempts + 1 };
      }
      return item;
    });

    // Mark pending orders as synced
    this.orders = this.orders.map(o => ({
      ...o,
      syncStatus: 'synced',
    }));

    this.persist();
  }

  public clearSyncedOutbox(): void {
    this.outboxQueue = this.outboxQueue.filter(item => item.status === 'pending');
    this.persist();
  }

  // --- Products & Inventory ---
  public getProducts(): ProductItem[] {
    return this.products[this.tenantId] || [];
  }

  public adjustStock(productId: string, delta: number, type: StockMovement['type'], note: string): void {
    const list = this.products[this.tenantId] || [];
    const prod = list.find(p => p.id === productId);
    if (!prod) return;

    prod.stockOnHand = Math.max(0, prod.stockOnHand + delta);

    const movement: StockMovement = {
      id: 'mov-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      sku: prod.sku,
      productName: prod.name,
      type,
      quantity: delta,
      balanceAfter: prod.stockOnHand,
      note,
    };

    this.stockMovements.unshift(movement);

    // Outbox queue entry
    this.outboxQueue.unshift({
      id: 'outbox-stock-' + Date.now(),
      entityType: 'stock',
      payload: movement,
      createdAt: new Date().toISOString(),
      attempts: 0,
      status: this.isSimulatedOnline ? 'synced' : 'pending',
    });

    this.persist();
  }

  public getStockMovements(): StockMovement[] {
    return this.stockMovements;
  }

  // --- Rooms & Hospitality ---
  public getRooms(): Room[] {
    return this.rooms;
  }

  public getOccupiedRoomsWithGuests(): Room[] {
    return this.rooms.filter(r => r.status === 'occupied' && r.guestName);
  }

  public checkInGuest(roomId: string, guestName: string, phone: string, nights: number): void {
    const rm = this.rooms.find(r => r.id === roomId);
    if (!rm) return;

    const now = new Date();
    const checkOut = new Date(now.getTime() + nights * 86400000);

    rm.status = 'occupied';
    rm.guestName = guestName;
    rm.guestPhone = phone;
    rm.checkInDate = now.toISOString().slice(0, 10);
    rm.checkOutDate = checkOut.toISOString().slice(0, 10);
    
    // Add initial accommodation charges
    const roomCharge: FolioCharge = {
      id: 'chg-' + Date.now(),
      timestamp: new Date().toISOString(),
      description: `${rm.type} Room Stay (${nights} nights @ $${rm.ratePerNight}/nt)`,
      category: 'room',
      amount: rm.ratePerNight * nights,
    };
    rm.folioCharges.push(roomCharge);

    // Ledger entry for Accounts Receivable vs Accommodation Revenue
    this.recordLedgerEntry(
      'AR-' + rm.number,
      `Guest Check-in Rm ${rm.number} (${guestName})`,
      'Hospitality',
      'Accounts Receivable - Guest Ledger',
      'Room Revenue',
      roomCharge.amount
    );

    this.outboxQueue.unshift({
      id: 'outbox-checkin-' + Date.now(),
      entityType: 'room_folio',
      payload: { roomId, guestName, nights, charge: roomCharge },
      createdAt: new Date().toISOString(),
      attempts: 0,
      status: this.isSimulatedOnline ? 'synced' : 'pending',
    });

    this.persist();
  }

  public addFolioCharge(roomId: string, charge: Omit<FolioCharge, 'id' | 'timestamp'>): void {
    const rm = this.rooms.find(r => r.id === roomId);
    if (!rm) return;

    const fullCharge: FolioCharge = {
      ...charge,
      id: 'chg-' + Date.now(),
      timestamp: new Date().toISOString(),
    };

    rm.folioCharges.push(fullCharge);

    this.outboxQueue.unshift({
      id: 'outbox-folio-chg-' + Date.now(),
      entityType: 'room_folio',
      payload: { roomId, charge: fullCharge },
      createdAt: new Date().toISOString(),
      attempts: 0,
      status: this.isSimulatedOnline ? 'synced' : 'pending',
    });

    this.persist();
  }

  public checkOutGuest(roomId: string): FolioCharge[] {
    const rm = this.rooms.find(r => r.id === roomId);
    if (!rm) return [];

    const finalizedCharges = [...rm.folioCharges];
    const totalDue = finalizedCharges.reduce((acc, c) => acc + c.amount, 0);

    // Settle folio in General Ledger: Cash/Card vs Accounts Receivable
    if (totalDue > 0) {
      this.recordLedgerEntry(
        'FOLIO-SETTLE-' + rm.number,
        `Guest Checkout Settlement Rm ${rm.number} (${rm.guestName})`,
        'Hospitality',
        'Cash & Bank Clearing',
        'Accounts Receivable - Guest Ledger',
        totalDue
      );
    }

    rm.status = 'vacant_dirty';
    rm.guestName = undefined;
    rm.guestPhone = undefined;
    rm.checkInDate = undefined;
    rm.checkOutDate = undefined;
    rm.folioCharges = [];

    this.persist();
    return finalizedCharges;
  }

  public updateRoomHousekeeping(roomId: string, status: Room['status']): void {
    const rm = this.rooms.find(r => r.id === roomId);
    if (rm) {
      rm.status = status;
      this.persist();
    }
  }

  // --- Point of Sale & Orders ---
  public getOrders(): SaleOrder[] {
    return this.orders;
  }

  public processSale(orderInput: Omit<SaleOrder, 'id' | 'idempotencyKey' | 'timestamp' | 'syncStatus' | 'printed'>): SaleOrder {
    const now = new Date();
    const idempotencyKey = 'IDEM-' + Math.random().toString(36).substring(2, 10).toUpperCase() + '-' + Date.now();
    const order: SaleOrder = {
      ...orderInput,
      id: 'ord-' + Date.now(),
      idempotencyKey,
      timestamp: now.toISOString(),
      syncStatus: this.isSimulatedOnline ? 'synced' : 'pending_outbox',
      printed: false,
    };

    // 1. Deduct Inventory
    for (const item of order.items) {
      this.adjustStock(
        item.product.id,
        -item.quantity,
        'sale',
        `Sale #${order.orderNumber}`
      );
    }

    // 2. Room Folio Cross-Module Routing
    if (order.paymentMethod === 'room_folio' && order.roomChargeRef) {
      this.addFolioCharge(order.roomChargeRef.roomId, {
        description: `POS Bill #${order.orderNumber} (${order.items.map(i => `${i.quantity}x ${i.product.name}`).slice(0, 2).join(', ')})`,
        category: 'dining',
        amount: order.total,
        referenceOrderNumber: order.orderNumber,
      });
    }

    // 3. Update Active Shift Balances
    if (this.activeShift && this.activeShift.status === 'open') {
      if (order.paymentMethod === 'cash') {
        this.activeShift.cashSales += order.total;
        this.activeShift.expectedCash += order.total;
      } else if (order.paymentMethod === 'card') {
        this.activeShift.cardSales += order.total;
      } else if (order.paymentMethod === 'mobile_money') {
        this.activeShift.mobileSales += order.total;
      } else if (order.paymentMethod === 'room_folio') {
        this.activeShift.roomChargesTotal += order.total;
      }
    }

    // 4. Double-Entry General Ledger Journal
    const debitAccount =
      order.paymentMethod === 'cash'
        ? 'Cash in Till (Drawer)'
        : order.paymentMethod === 'card'
        ? 'Card Clearing Merchant'
        : order.paymentMethod === 'mobile_money'
        ? 'Mobile Money Till'
        : 'Accounts Receivable - Guest Folios';

    this.recordLedgerEntry(
      order.orderNumber,
      `Sale Order #${order.orderNumber} (${order.cashierName})`,
      'Sales',
      debitAccount,
      'Sales Revenue',
      order.subtotal
    );

    if (order.tax > 0) {
      this.recordLedgerEntry(
        order.orderNumber,
        `VAT Output Tax on #${order.orderNumber}`,
        'Taxation',
        debitAccount,
        'VAT Payable',
        order.tax
      );
    }

    // 5. Append to Orders
    this.orders.unshift(order);

    // 6. Outbox Entry for Offline Durability
    this.outboxQueue.unshift({
      id: 'outbox-order-' + order.id,
      entityType: 'sale',
      payload: order,
      createdAt: now.toISOString(),
      attempts: 0,
      status: this.isSimulatedOnline ? 'synced' : 'pending',
    });

    this.persist();
    return order;
  }

  // --- Shifts & Cash Drawer Balancing ---
  public getActiveShift(): Shift | null {
    return this.activeShift;
  }

  public getShiftsHistory(): Shift[] {
    return this.shiftsHistory;
  }

  public openNewShift(cashierName: string, openingFloat: number): Shift {
    const newShift: Shift = {
      id: 'shift-' + Date.now(),
      tenantId: this.tenantId,
      cashierName,
      startTime: new Date().toISOString(),
      status: 'open',
      openingFloat,
      cashSales: 0,
      cardSales: 0,
      mobileSales: 0,
      roomChargesTotal: 0,
      cashPayouts: 0,
      expectedCash: openingFloat,
    };

    this.activeShift = newShift;

    this.recordLedgerEntry(
      'FLOAT-' + newShift.id.slice(-6),
      `Opening Cash Float (${cashierName})`,
      'Treasury',
      'Cash in Till (Drawer)',
      'Vault Reserve Cash',
      openingFloat
    );

    this.persist();
    return newShift;
  }

  public recordCashPayout(amount: number, reason: string): void {
    if (!this.activeShift || this.activeShift.status !== 'open') return;

    this.activeShift.cashPayouts += amount;
    this.activeShift.expectedCash -= amount;

    this.recordLedgerEntry(
      'DROP-' + Date.now().toString().slice(-6),
      `Till Cash Payout: ${reason}`,
      'Expenses',
      'Petty Cash Expense',
      'Cash in Till (Drawer)',
      amount
    );

    this.persist();
  }

  public closeShift(actualCashCounted: number, notes?: string): Shift {
    if (!this.activeShift) throw new Error('No active shift to close');

    const discrepancy = actualCashCounted - this.activeShift.expectedCash;
    const closedShift: Shift = {
      ...this.activeShift,
      endTime: new Date().toISOString(),
      status: 'closed',
      actualCashCounted,
      discrepancy,
      notes,
      zReportNumber: 'Z-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000),
    };

    // Ledger adjustment if discrepancy exists
    if (discrepancy !== 0) {
      if (discrepancy > 0) {
        this.recordLedgerEntry(
          closedShift.zReportNumber!,
          `Shift Cash Overage (${closedShift.cashierName})`,
          'Audit',
          'Cash in Till (Drawer)',
          'Cash Short/Over Account',
          discrepancy
        );
      } else {
        this.recordLedgerEntry(
          closedShift.zReportNumber!,
          `Shift Cash Shortage (${closedShift.cashierName})`,
          'Audit',
          'Cash Short/Over Account',
          'Cash in Till (Drawer)',
          Math.abs(discrepancy)
        );
      }
    }

    this.shiftsHistory.unshift(closedShift);
    this.activeShift = null;

    this.outboxQueue.unshift({
      id: 'outbox-shift-' + closedShift.id,
      entityType: 'shift',
      payload: closedShift,
      createdAt: new Date().toISOString(),
      attempts: 0,
      status: this.isSimulatedOnline ? 'synced' : 'pending',
    });

    this.persist();
    return closedShift;
  }

  // --- Financial Ledgers ---
  public getLedgerEntries(): LedgerEntry[] {
    return this.ledgerEntries;
  }

  private recordLedgerEntry(
    reference: string,
    description: string,
    category: string,
    debitAccount: string,
    creditAccount: string,
    amount: number
  ): void {
    const entry: LedgerEntry = {
      id: 'ledg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      timestamp: new Date().toISOString(),
      reference,
      description,
      category,
      debitAccount,
      creditAccount,
      amount: Math.round(amount * 100) / 100,
    };
    this.ledgerEntries.unshift(entry);
  }

  private seedInitialLedger(): LedgerEntry[] {
    return [
      {
        id: 'ledg-init-1',
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
        reference: 'OPEN-BAL',
        description: 'Opening Capital & Bank Reserves',
        category: 'Equity',
        debitAccount: 'Operating Bank Account',
        creditAccount: "Owner's Equity",
        amount: 500000,
      },
      {
        id: 'ledg-init-2',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        reference: 'INV-RESTOCK',
        description: 'Initial Opening Warehouse Inventory Stock',
        category: 'Inventory',
        debitAccount: 'Merchandise Inventory Asset',
        creditAccount: 'Operating Bank Account',
        amount: 185000,
      },
    ];
  }
}

export const storage = new StorageEngine();
