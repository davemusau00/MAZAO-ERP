/**
 * Mazao ERP Domain Models & Canonical Contracts
 */

export type TenantType = 'retail' | 'hospitality' | 'farm_estate' | 'restaurant';

export interface TenantProfile {
  id: string;
  name: string;
  type: TenantType;
  currency: string;
  currencySymbol: string;
  taxRate: number; // e.g. 0.16 for 16% VAT
  address: string;
  phone: string;
  tagline: string;
  receiptHeader: string;
  receiptFooter: string;
}

export interface ProductItem {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  stockOnHand: number;
  reorderPoint: number;
  unit: string;
  description?: string;
  fastKey?: string;
}

export interface CartItem {
  product: ProductItem;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  notes?: string;
}

export type PaymentMethod = 'cash' | 'card' | 'mobile_money' | 'room_folio';

export interface SaleOrder {
  id: string;
  idempotencyKey: string;
  orderNumber: string;
  shiftId: string;
  cashierName: string;
  tenantId: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  amountTendered: number;
  changeDue: number;
  roomChargeRef?: {
    roomId: string;
    roomNumber: string;
    guestName: string;
  };
  timestamp: string;
  syncStatus: 'synced' | 'pending_outbox';
  printed: boolean;
}

export type RoomStatus = 'vacant_clean' | 'vacant_dirty' | 'occupied' | 'reserved' | 'maintenance';
export type RoomTier = 'Standard' | 'Deluxe' | 'Executive Suite' | 'Safari Cottage';

export interface FolioCharge {
  id: string;
  timestamp: string;
  description: string;
  category: 'room' | 'dining' | 'laundry' | 'spa' | 'retail';
  amount: number;
  referenceOrderNumber?: string;
}

export interface Room {
  id: string;
  number: string;
  type: string;
  tier: RoomTier;
  floor: number;
  ratePerNight: number;
  maxGuests: number;
  status: RoomStatus;
  guestName?: string;
  guestPhone?: string;
  checkInDate?: string;
  checkOutDate?: string;
  folioCharges: FolioCharge[];
}

export interface Shift {
  id: string;
  tenantId: string;
  cashierName: string;
  startTime: string;
  endTime?: string;
  status: 'open' | 'closed';
  openingFloat: number;
  cashSales: number;
  cardSales: number;
  mobileSales: number;
  roomChargesTotal: number;
  cashPayouts: number;
  expectedCash: number;
  actualCashCounted?: number;
  discrepancy?: number;
  notes?: string;
  zReportNumber?: string;
}

export interface StockMovement {
  id: string;
  timestamp: string;
  sku: string;
  productName: string;
  type: 'sale' | 'restock' | 'adjustment' | 'damage';
  quantity: number;
  balanceAfter: number;
  note: string;
  reference?: string;
}

export interface LedgerEntry {
  id: string;
  timestamp: string;
  reference: string;
  description: string;
  category: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
}

export interface OutboxItem {
  id: string;
  entityType: 'sale' | 'shift' | 'room_folio' | 'stock' | 'ledger';
  payload: any;
  createdAt: string;
  attempts: number;
  status: 'pending' | 'synced' | 'failed';
  error?: string;
}

export type UserRole = 'cashier' | 'manager' | 'admin';

export type Permission =
  | 'pos.sell'
  | 'pos.discount_override'
  | 'pos.price_override'
  | 'pos.void_item'
  | 'shift.open'
  | 'shift.payout'
  | 'shift.close'
  | 'shift.view_audit'
  | 'rooms.checkin'
  | 'rooms.checkout'
  | 'rooms.manage_folios'
  | 'inventory.adjust'
  | 'ledger.view'
  | 'analytics.view'
  | 'system.manage_conflicts';

export interface StaffUser {
  id: string;
  name: string;
  role: UserRole;
  pin: string;
  title: string;
  badgeNumber: string;
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  cashier: [
    'pos.sell',
    'shift.open',
    'shift.close',
    'rooms.checkin',
  ],
  manager: [
    'pos.sell',
    'pos.discount_override',
    'pos.price_override',
    'pos.void_item',
    'shift.open',
    'shift.payout',
    'shift.close',
    'shift.view_audit',
    'rooms.checkin',
    'rooms.checkout',
    'rooms.manage_folios',
    'inventory.adjust',
    'analytics.view',
    'system.manage_conflicts',
  ],
  admin: [
    'pos.sell',
    'pos.discount_override',
    'pos.price_override',
    'pos.void_item',
    'shift.open',
    'shift.payout',
    'shift.close',
    'shift.view_audit',
    'rooms.checkin',
    'rooms.checkout',
    'rooms.manage_folios',
    'inventory.adjust',
    'ledger.view',
    'analytics.view',
    'system.manage_conflicts',
  ],
};

export type ShiftAuditAction =
  | 'opening_float'
  | 'cash_payout'
  | 'void_line_item'
  | 'price_override'
  | 'manual_discount'
  | 'emergency_drawer_kick'
  | 'shift_close_variance';

export interface ShiftAuditLog {
  id: string;
  shiftId: string;
  timestamp: string;
  staffName: string;
  staffRole: UserRole;
  action: ShiftAuditAction;
  details: string;
  amount?: number;
  authorizedBy?: string;
  flagSeverity: 'info' | 'warning' | 'alert';
}

export type ConflictResolutionStrategy =
  | 'commutative_delta'
  | 'first_write_wins'
  | 'escalation_required';

export interface SyncConflict {
  id: string;
  entityType: 'stock_delta' | 'room_booking' | 'price_override';
  entityId: string;
  title: string;
  clientDevice: string;
  serverState: any;
  clientState: any;
  conflictStrategy: ConflictResolutionStrategy;
  status: 'auto_resolved' | 'escalation_pending' | 'manually_resolved';
  timestamp: string;
  resolutionDetails: string;
}

