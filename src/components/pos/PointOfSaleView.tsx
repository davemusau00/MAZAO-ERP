import React, { useState, useEffect, useRef } from 'react';
import { ProductItem, CartItem, PaymentMethod, TenantProfile, SaleOrder } from '../../types/erp';
import { storage } from '../../services/storage';
import { hardware } from '../../services/hardware';
import {
  Barcode,
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  Smartphone,
  Hotel,
  Printer,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface PointOfSaleViewProps {
  tenant: TenantProfile;
  onOrderCompleted: (order: SaleOrder) => void;
}

export const PointOfSaleView: React.FC<PointOfSaleViewProps> = ({
  tenant,
  onOrderCompleted,
}) => {
  const [products, setProducts] = useState<ProductItem[]>(storage.getProducts());
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isTenderModalOpen, setIsTenderModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountTendered, setAmountTendered] = useState<string>('');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [silentPrintEnabled, setSilentPrintEnabled] = useState(true);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Sync products when tenant changes
  useEffect(() => {
    setProducts(storage.getProducts());
    setCart([]);
  }, [tenant.id]);

  // Occupied rooms for cross-module folio billing
  const occupiedRooms = storage.getOccupiedRoomsWithGuests();

  // Categories
  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  // Filtered products
  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Cart calculations
  const subtotal = cart.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const tax = subtotal * tenant.taxRate;
  const total = subtotal + tax;
  const tenderedNum = parseFloat(amountTendered) || 0;
  const changeDue = Math.max(0, tenderedNum - total);

  // Add item to cart
  const handleAddToCart = (product: ProductItem) => {
    if (product.stockOnHand <= 0) {
      showNotice(`Warning: ${product.name} is out of stock!`);
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1, unitPrice: product.sellingPrice }];
    });
  };

  // Adjust cart quantity
  const handleUpdateQty = (productId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Barcode scanner submission
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const found = products.find(
      p => p.barcode === barcodeInput.trim() || p.sku.toLowerCase() === barcodeInput.trim().toLowerCase()
    );

    if (found) {
      handleAddToCart(found);
      setBarcodeInput('');
      showNotice(`Added: ${found.name}`);
    } else {
      showNotice(`Barcode "${barcodeInput}" not found in catalogue`);
    }
  };

  const showNotice = (msg: string) => {
    setFeedbackNotice(msg);
    setTimeout(() => setFeedbackNotice(null), 3000);
  };

  // Open Tender modal
  const handleOpenTender = () => {
    if (cart.length === 0) return;
    setAmountTendered(total.toFixed(2));
    if (occupiedRooms.length > 0) {
      setSelectedRoomId(occupiedRooms[0].id);
    }
    setIsTenderModalOpen(true);
  };

  // Complete sale
  const handleFinalizeSale = () => {
    if (cart.length === 0) return;

    const activeShift = storage.getActiveShift();
    if (!activeShift) {
      showNotice('No active shift! Please open a cashier shift first.');
      return;
    }

    let roomChargeRef = undefined;
    if (paymentMethod === 'room_folio') {
      const room = occupiedRooms.find(r => r.id === selectedRoomId);
      if (!room) {
        showNotice('Please select an active hotel guest room for folio charge');
        return;
      }
      roomChargeRef = {
        roomId: room.id,
        roomNumber: room.number,
        guestName: room.guestName || 'Valued Guest',
      };
    }

    const orderNumber = 'ORD-' + Math.floor(100000 + Math.random() * 900000);

    const saleOrder = storage.processSale({
      orderNumber,
      shiftId: activeShift.id,
      cashierName: activeShift.cashierName,
      tenantId: tenant.id,
      items: [...cart],
      subtotal,
      tax,
      discount: 0,
      total,
      paymentMethod,
      amountTendered: paymentMethod === 'cash' ? (tenderedNum || total) : total,
      changeDue: paymentMethod === 'cash' ? changeDue : 0,
      roomChargeRef,
    });

    // Hardware interactions:
    // 1. Trigger cash drawer kick solenoid pulse!
    if (paymentMethod === 'cash') {
      hardware.triggerCashDrawerKick();
    }

    // 2. Silent thermal print execution if enabled
    if (silentPrintEnabled) {
      hardware.executeSilentPrint(saleOrder, tenant);
    }

    // Reset state & pass to parent for preview
    setCart([]);
    setIsTenderModalOpen(false);
    onOrderCompleted(saleOrder);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-61px)] overflow-hidden bg-[#090b10]">
      {/* LEFT: Products Catalogue & Scanner Area */}
      <div className="flex-1 flex flex-col p-4 lg:p-6 overflow-hidden border-r border-zinc-850">
        {/* Barcode & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
          <form onSubmit={handleBarcodeSubmit} className="relative flex-1 w-full">
            <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
            <input
              ref={barcodeInputRef}
              type="text"
              placeholder="Scan Barcode or SKU (Enter)..."
              value={barcodeInput}
              onChange={e => setBarcodeInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 font-mono transition-colors"
            />
          </form>

          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Quick Barcode Scanner Simulation Strip */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 text-xs text-zinc-400">
          <span className="shrink-0 text-[11px] font-mono uppercase text-zinc-500">Quick Test Scans:</span>
          {products.slice(0, 5).map(prod => (
            <button
              key={prod.id}
              onClick={() => handleAddToCart(prod)}
              className="shrink-0 px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-mono text-[11px] hover:border-zinc-700 transition-colors"
            >
              {prod.barcode} ({prod.name.slice(0, 10)}…)
            </button>
          ))}
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap capitalize transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-zinc-900 border border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Notice toast if any */}
        {feedbackNotice && (
          <div className="mb-3 p-2.5 rounded-lg bg-blue-950/80 border border-blue-800 text-xs text-blue-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{feedbackNotice}</span>
          </div>
        )}

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredProducts.map(product => {
            const isLowStock = product.stockOnHand <= product.reorderPoint;
            return (
              <button
                key={product.id}
                onClick={() => handleAddToCart(product)}
                className="group flex flex-col justify-between p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 text-left transition-all active:scale-[0.98]"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">{product.category}</span>
                    <span className={`text-[10px] font-mono tabular-nums ${isLowStock ? 'text-amber-400 font-semibold' : 'text-zinc-500'}`}>
                      {product.stockOnHand} {product.unit}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-white line-clamp-2 leading-snug">
                    {product.name}
                  </h4>
                </div>

                <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-zinc-100 tabular-nums">
                    {tenant.currencySymbol} {product.sellingPrice.toFixed(2)}
                  </span>
                  <span className="w-6 h-6 rounded-md bg-zinc-800 group-hover:bg-blue-600 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Fast Cart & Checkout Panel */}
      <div className="w-full lg:w-96 flex flex-col bg-zinc-950 border-t lg:border-t-0 border-zinc-850">
        {/* Cart Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-850 bg-zinc-950/60">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-zinc-200">Current Order</h3>
            <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-900 text-zinc-400 font-mono">
              {cart.reduce((a, b) => a + b.quantity, 0)} items
            </span>
          </div>
          {cart.length > 0 && (
            <button
              onClick={handleClearCart}
              className="text-xs text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
              <ShoppingCart className="w-10 h-10 stroke-1 mb-2 text-zinc-700" />
              <p className="text-xs">Cart is empty</p>
              <p className="text-[11px] text-zinc-600 mt-1">Scan a barcode or click items to add</p>
            </div>
          ) : (
            cart.map(item => (
              <div
                key={item.product.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900 border border-zinc-800/80"
              >
                <div className="flex-1 min-w-0 pr-3">
                  <h5 className="text-xs font-medium text-zinc-200 truncate">{item.product.name}</h5>
                  <div className="text-[11px] font-mono text-zinc-500 tabular-nums">
                    {tenant.currencySymbol} {item.unitPrice.toFixed(2)} × {item.quantity} = {tenant.currencySymbol} {(item.quantity * item.unitPrice).toFixed(2)}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleUpdateQty(item.product.id, -1)}
                    className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center font-mono text-xs font-bold text-zinc-200 tabular-nums">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => handleUpdateQty(item.product.id, 1)}
                    className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleRemoveItem(item.product.id)}
                    className="p-1 text-zinc-600 hover:text-rose-400 ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Totals & Checkout Button */}
        <div className="p-4 border-t border-zinc-850 bg-zinc-950/90 space-y-3">
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-zinc-400">
              <span>Subtotal</span>
              <span className="font-mono tabular-nums">{tenant.currencySymbol} {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Tax ({Math.round(tenant.taxRate * 100)}% VAT)</span>
              <span className="font-mono tabular-nums">{tenant.currencySymbol} {tax.toFixed(2)}</span>
            </div>
            <div className="border-t border-zinc-800 pt-2 flex justify-between text-base font-bold text-zinc-100">
              <span>Total Due</span>
              <span className="font-mono text-blue-400 tabular-nums">
                {tenant.currencySymbol} {total.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={silentPrintEnabled}
                onChange={e => setSilentPrintEnabled(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-800 text-blue-600 focus:ring-0"
              />
              <span className="flex items-center gap-1 text-[11px]">
                <Printer className="w-3.5 h-3.5 text-zinc-400" />
                Silent Print Thermal Receipt
              </span>
            </label>
          </div>

          <button
            onClick={handleOpenTender}
            disabled={cart.length === 0}
            className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <span>Charge {tenant.currencySymbol} {total.toFixed(2)}</span>
          </button>
        </div>
      </div>

      {/* Tender & Payment Modal */}
      {isTenderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/70">
              <div>
                <h3 className="text-base font-semibold text-zinc-100">Settle Payment</h3>
                <p className="text-xs text-zinc-400 font-mono">
                  Amount Due: {tenant.currencySymbol} {total.toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => setIsTenderModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-100 text-xs px-2 py-1 rounded"
              >
                Cancel
              </button>
            </div>

            {/* Payment Method Selector */}
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-3 rounded-lg border flex flex-col items-center gap-1.5 text-xs font-medium transition-all ${
                    paymentMethod === 'cash'
                      ? 'bg-blue-600/10 border-blue-500 text-blue-400'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  <Banknote className="w-5 h-5" />
                  <span>Cash</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-lg border flex flex-col items-center gap-1.5 text-xs font-medium transition-all ${
                    paymentMethod === 'card'
                      ? 'bg-blue-600/10 border-blue-500 text-blue-400'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span>Card POS</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('mobile_money')}
                  className={`p-3 rounded-lg border flex flex-col items-center gap-1.5 text-xs font-medium transition-all ${
                    paymentMethod === 'mobile_money'
                      ? 'bg-blue-600/10 border-blue-500 text-blue-400'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  <Smartphone className="w-5 h-5" />
                  <span>M-Pesa / Mobile</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('room_folio')}
                  className={`p-3 rounded-lg border flex flex-col items-center gap-1.5 text-xs font-medium transition-all ${
                    paymentMethod === 'room_folio'
                      ? 'bg-blue-600/10 border-blue-500 text-blue-400'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  <Hotel className="w-5 h-5" />
                  <span>Room Folio</span>
                </button>
              </div>

              {/* Conditional Method Inputs */}
              {paymentMethod === 'cash' && (
                <div className="space-y-4 p-4 rounded-lg bg-zinc-950 border border-zinc-800">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Cash Tendered</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-mono text-zinc-500">
                        {tenant.currencySymbol}
                      </span>
                      <input
                        type="number"
                        step="any"
                        value={amountTendered}
                        onChange={e => setAmountTendered(e.target.value)}
                        className="w-full pl-12 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-lg font-mono font-bold text-zinc-100 focus:outline-none focus:border-blue-500 tabular-nums"
                      />
                    </div>
                  </div>

                  {/* Fast Denomination Cash Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setAmountTendered(total.toFixed(2))}
                      className="px-2.5 py-1 rounded bg-zinc-850 hover:bg-zinc-800 border border-zinc-700 text-xs font-mono text-zinc-200"
                    >
                      Exact ({tenant.currencySymbol} {total.toFixed(0)})
                    </button>
                    {[100, 200, 500, 1000, 2000, 5000].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setAmountTendered(String(val))}
                        className="px-2.5 py-1 rounded bg-zinc-850 hover:bg-zinc-800 border border-zinc-700 text-xs font-mono text-zinc-200"
                      >
                        +{val}
                      </button>
                    ))}
                  </div>

                  {/* Change calculation */}
                  <div className="pt-3 border-t border-zinc-850 flex items-center justify-between">
                    <span className="text-xs text-zinc-400">Change Due to Customer:</span>
                    <span className={`text-base font-mono font-bold tabular-nums ${tenderedNum >= total ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {tenant.currencySymbol} {changeDue.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {paymentMethod === 'room_folio' && (
                <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-3">
                  <div className="text-xs font-semibold text-zinc-300">
                    Cross-Module Billing: Append charge to Guest Hotel Folio
                  </div>
                  {occupiedRooms.length === 0 ? (
                    <div className="p-3 bg-amber-950/40 border border-amber-900/60 rounded text-xs text-amber-300">
                      No guests are currently checked into rooms. Check in a guest in the "Rooms & Folios" tab first.
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Select Occupied Room</label>
                      <select
                        value={selectedRoomId}
                        onChange={e => setSelectedRoomId(e.target.value)}
                        className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
                      >
                        {occupiedRooms.map(r => (
                          <option key={r.id} value={r.id}>
                            Room {r.number} — {r.guestName} ({r.type})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {paymentMethod === 'mobile_money' && (
                <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2 text-xs text-zinc-300">
                  <div className="font-semibold text-emerald-400">Mobile Money Till Active</div>
                  <p className="text-zinc-400">
                    Customer should send <span className="font-mono font-bold text-zinc-100">{tenant.currencySymbol} {total.toFixed(2)}</span> to Buy Goods Till #884129.
                  </p>
                </div>
              )}

              {paymentMethod === 'card' && (
                <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2 text-xs text-zinc-300">
                  <div className="font-semibold text-blue-400">EMV Chip / Contactless Terminal</div>
                  <p className="text-zinc-400">
                    Awaiting contactless tap on attached USB/Bluetooth card terminal.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 bg-zinc-950 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsTenderModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200"
              >
                Back
              </button>

              <button
                type="button"
                onClick={handleFinalizeSale}
                disabled={paymentMethod === 'cash' && tenderedNum < total}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-semibold text-xs shadow-sm transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Print Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
