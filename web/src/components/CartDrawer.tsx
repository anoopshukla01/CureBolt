import React from 'react';
import { CartItem } from '../types';
import { ProductArtwork } from './ProductArtwork';
import { X, Plus, Minus, ShieldAlert, CreditCard, Banknote, ArrowRight, MapPin, CheckCircle } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onClearCart: () => void;
  paymentMode: 'ONLINE' | 'COD';
  onPaymentModeChange: (mode: 'ONLINE' | 'COD') => void;
  hasPrescriptionRequiredItems: boolean;
  uploadedRxId: string | null;
  onOpenOcr: () => void;
  onPlaceOrder: () => void;
  placingOrder: boolean;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  paymentMode,
  onPaymentModeChange,
  hasPrescriptionRequiredItems,
  uploadedRxId,
  onOpenOcr,
  onPlaceOrder,
  placingOrder
}) => {
  if (!isOpen) return null;

  const itemTotal = cart.reduce((sum, item) => sum + item.product.selling_price * item.quantity, 0);
  const deliveryFee = 0; // Free in Gorakhpur pilot
  const handlingFee = 2; // Statutory ₹2 handling charge
  const grandTotal = itemTotal + deliveryFee + (itemTotal > 0 ? handlingFee : 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#18181b] border-l border-[#27272a] text-white flex flex-col justify-between shadow-2xl">
          
          {/* Header */}
          <div className="p-4 border-b border-[#27272a] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-white">My Cart</h2>
              <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full font-bold">
                {cart.reduce((a, b) => a + b.quantity, 0)} items
              </span>
            </div>
            <button 
              onClick={onClose}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {cart.length === 0 ? (
              <div className="py-20 text-center text-zinc-400">
                <p className="text-sm font-semibold mb-2">Your cart is empty</p>
                <p className="text-xs text-zinc-500">Add medicines or healthcare essentials to order in 9-10 mins.</p>
              </div>
            ) : (
              <>
                {/* Delivery Address Card */}
                <div className="bg-[#242428] border border-[#333338] rounded-xl p-3 flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-bold text-white block">Delivering to Gorakhpur Pilot Area</span>
                    <span className="text-zinc-400">Shop 14, Cinema Road, Golghar / Medical Road</span>
                  </div>
                </div>

                {/* Prescription Required Alert */}
                {hasPrescriptionRequiredItems && (
                  <div className={`p-3 rounded-xl border text-xs flex flex-col gap-2 ${
                    uploadedRxId 
                      ? 'bg-emerald-950/30 border-emerald-600/40 text-emerald-300'
                      : 'bg-red-950/30 border-red-600/40 text-red-300'
                  }`}>
                    <div className="flex items-center gap-2 font-bold">
                      {uploadedRxId ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <ShieldAlert className="w-4 h-4 text-red-400" />}
                      <span>
                        {uploadedRxId 
                          ? `Prescription Uploaded (${uploadedRxId})` 
                          : 'Prescription Required for Schedule H items'}
                      </span>
                    </div>
                    {!uploadedRxId && (
                      <button
                        onClick={onOpenOcr}
                        className="px-3 py-1.5 bg-red-600 text-white rounded-lg font-bold text-xs hover:bg-red-500 transition-colors self-start"
                      >
                        Scan & Upload Prescription
                      </button>
                    )}
                  </div>
                )}

                {/* Item List */}
                <div className="space-y-3">
                  {cart.map(item => (
                    <div 
                      key={item.product.id}
                      className="bg-[#202024] border border-[#2c2c32] rounded-xl p-3 flex items-center justify-between gap-3"
                    >
                      {/* Image & Info */}
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 bg-white rounded-lg p-1 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          <ProductArtwork productId={item.product.id} name={item.product.name} size="sm" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white line-clamp-1 max-w-[160px]">
                            {item.product.name}
                          </h4>
                          <span className="text-[11px] text-zinc-400 block">
                            {item.product.pack_size}
                          </span>
                          <span className="text-xs font-extrabold text-white mt-0.5 block">
                            ₹{item.product.selling_price * item.quantity}
                          </span>
                        </div>
                      </div>

                      {/* Stepper */}
                      <div className="blinkit-stepper">
                        <button 
                          onClick={() => onUpdateQuantity(item.product.id, -1)}
                          className="hover:scale-110 active:scale-95"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs px-1 select-none">{item.quantity}</span>
                        <button 
                          onClick={() => onUpdateQuantity(item.product.id, 1)}
                          className="hover:scale-110 active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Payment Mode Selector (COD vs Online) */}
                <div className="bg-[#202024] border border-[#2c2c32] rounded-xl p-3">
                  <span className="text-xs font-bold text-zinc-300 block mb-2 uppercase tracking-wider">
                    Select Payment Method
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onPaymentModeChange('COD')}
                      className={`p-2.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        paymentMode === 'COD'
                          ? 'bg-emerald-950/50 border-emerald-500 text-emerald-400 shadow-md'
                          : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Banknote className="w-4 h-4" />
                      <span>Cash on Delivery</span>
                    </button>
                    <button
                      onClick={() => onPaymentModeChange('ONLINE')}
                      className={`p-2.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        paymentMode === 'ONLINE'
                          ? 'bg-emerald-950/50 border-emerald-500 text-emerald-400 shadow-md'
                          : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Online UPI / Card</span>
                    </button>
                  </div>
                </div>

                {/* Bill Breakdown */}
                <div className="bg-[#202024] border border-[#2c2c32] rounded-xl p-3.5 space-y-2 text-xs">
                  <h4 className="text-zinc-300 font-extrabold uppercase tracking-wider text-[11px] mb-2">
                    Bill Details
                  </h4>
                  <div className="flex justify-between text-zinc-400">
                    <span>Items Total</span>
                    <span className="text-white font-semibold">₹{itemTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Delivery Partner Fee (Gorakhpur)</span>
                    <span className="text-emerald-400 font-bold">FREE</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Handling & Packaging</span>
                    <span className="text-white font-semibold">₹{handlingFee.toFixed(2)}</span>
                  </div>
                  <div className="pt-2 border-t border-zinc-700/60 flex justify-between text-sm font-black text-white">
                    <span>Grand Total</span>
                    <span>₹{grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </>
            )}

          </div>

          {/* Bottom Action Footer */}
          {cart.length > 0 && (
            <div className="p-4 border-t border-[#27272a] bg-[#141416]">
              <div className="flex items-center justify-between mb-3 text-xs">
                <div>
                  <span className="text-[#a1a1aa] block">Paying with</span>
                  <span className="text-emerald-400 font-extrabold">
                    {paymentMode === 'COD' ? 'Cash on Delivery (Doorstep)' : 'Instant UPI / Card'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[#a1a1aa] block">To Pay</span>
                  <span className="text-white font-black text-base">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                disabled={placingOrder || (hasPrescriptionRequiredItems && !uploadedRxId)}
                onClick={onPlaceOrder}
                className={`w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                  hasPrescriptionRequiredItems && !uploadedRxId
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    : 'bg-[#0C831F] hover:bg-[#16a34a] text-white shadow-emerald-950/40'
                }`}
              >
                {placingOrder ? (
                  <span>Placing Order in Gorakhpur...</span>
                ) : (
                  <>
                    <span>Place Order ({paymentMode === 'COD' ? 'Cash on Delivery' : 'Proceed to Pay'})</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
