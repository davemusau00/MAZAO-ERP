import React from 'react';
import { SaleOrder, TenantProfile } from '../../types/erp';
import { hardware } from '../../services/hardware';
import { Printer, X, Download, CheckCircle2 } from 'lucide-react';

interface ReceiptModalProps {
  order: SaleOrder | null;
  tenant: TenantProfile;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ order, tenant, onClose }) => {
  if (!order) return null;

  const rawSlipText = hardware.generateThermalReceiptText(order, tenant);

  const handlePrint = () => {
    hardware.executeSilentPrint(order, tenant);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([rawSlipText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `Receipt_${order.orderNumber}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800/40 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">Sale Completed</h3>
              <p className="text-xs text-zinc-400 font-mono">Order #{order.orderNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thermal Slip Simulator Container */}
        <div className="p-5 bg-zinc-950/90 flex justify-center">
          <div className="w-full max-w-[320px] bg-white text-zinc-950 p-5 font-mono text-[11px] leading-relaxed shadow-lg rounded-t-sm relative border-t-4 border-dashed border-zinc-400 select-all">
            {/* Top Zig-Zag receipt tear edge styling */}
            <div className="text-center font-bold text-xs uppercase tracking-tight mb-1">
              {tenant.name}
            </div>
            <div className="text-center text-[10px] text-zinc-600 mb-0.5">{tenant.tagline}</div>
            <div className="text-center text-[9px] text-zinc-500 mb-3">{tenant.address} · {tenant.phone}</div>

            <div className="border-t border-dashed border-zinc-400 my-2"></div>

            <div className="flex justify-between text-[10px]">
              <span>REC: {order.orderNumber}</span>
              <span>{new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex justify-between text-[10px] mb-1">
              <span>STAFF: {order.cashierName}</span>
              <span className="uppercase">{order.paymentMethod.replace('_', ' ')}</span>
            </div>

            {order.roomChargeRef && (
              <div className="text-[10px] font-bold bg-zinc-100 px-1 py-0.5 rounded my-1 text-zinc-800">
                BILLED TO ROOM {order.roomChargeRef.roomNumber} ({order.roomChargeRef.guestName})
              </div>
            )}

            <div className="border-t border-dashed border-zinc-400 my-2"></div>

            <table className="w-full text-[10px] my-1">
              <thead>
                <tr className="border-b border-zinc-400 text-zinc-600">
                  <th className="text-left font-semibold pb-1">ITEM</th>
                  <th className="text-right font-semibold pb-1">QTY</th>
                  <th className="text-right font-semibold pb-1">PRICE</th>
                  <th className="text-right font-semibold pb-1">TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {order.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-1 pr-1 truncate max-w-[120px]">{item.product.name}</td>
                    <td className="text-right py-1 tabular-nums">{item.quantity}</td>
                    <td className="text-right py-1 tabular-nums">{item.unitPrice.toFixed(2)}</td>
                    <td className="text-right py-1 tabular-nums">{(item.quantity * item.unitPrice).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t border-dashed border-zinc-400 my-2"></div>

            <div className="space-y-0.5 text-[10px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="tabular-nums">{tenant.currencySymbol} {order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax ({Math.round(tenant.taxRate * 100)}%):</span>
                <span className="tabular-nums">{tenant.currencySymbol} {order.tax.toFixed(2)}</span>
              </div>
              <div className="border-t border-zinc-800 my-1"></div>
              <div className="flex justify-between font-bold text-xs">
                <span>TOTAL:</span>
                <span className="tabular-nums">{tenant.currencySymbol} {order.total.toFixed(2)}</span>
              </div>
              {order.paymentMethod === 'cash' && (
                <>
                  <div className="flex justify-between text-[10px] text-zinc-700 pt-1">
                    <span>Cash Tendered:</span>
                    <span className="tabular-nums">{tenant.currencySymbol} {order.amountTendered.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-semibold text-zinc-900">
                    <span>Change Due:</span>
                    <span className="tabular-nums">{tenant.currencySymbol} {order.changeDue.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="border-t border-dashed border-zinc-400 my-3"></div>
            <div className="text-center text-[9px] text-zinc-600 leading-tight">
              {tenant.receiptFooter}
            </div>

            <div className="mt-3 text-center">
              <div className="text-[12px] tracking-[4px] font-mono select-none">
                |||| || |||||| | |||| ||
              </div>
              <div className="text-[8px] text-zinc-400 mt-0.5">
                {order.idempotencyKey.slice(0, 18)}
              </div>
            </div>

            {/* Offline sync note if needed */}
            {order.syncStatus === 'pending_outbox' && (
              <div className="mt-2 p-1 bg-amber-100 border border-amber-300 rounded text-amber-900 text-[9px] text-center font-sans font-medium">
                Offline Transaction · Saved in Local Outbox
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-4 bg-zinc-900 border-t border-zinc-800">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-800/80 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download Slip
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Done
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Receipt (80mm)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
