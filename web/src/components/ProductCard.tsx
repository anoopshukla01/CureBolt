import React from 'react';
import { Product } from '../types';
import { ProductArtwork } from './ProductArtwork';
import { Clock, Plus, Minus } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  quantity: number;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onSelectProduct: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  quantity,
  onAddToCart,
  onUpdateQuantity,
  onSelectProduct
}) => {
  const discountPercent = product.discount_percent || 
    (product.mrp > product.selling_price 
      ? Math.round(((product.mrp - product.selling_price) / product.mrp) * 100) 
      : 0);

  return (
    <div 
      className="blinkit-product-card p-3 flex flex-col justify-between cursor-pointer w-48 sm:w-52 flex-shrink-0"
      onClick={() => onSelectProduct(product)}
    >
      <div>
        {/* White Image Canvas */}
        <div className="blinkit-image-canvas h-36 w-full relative mb-2.5">
          {discountPercent > 0 && (
            <div className="absolute top-2 left-2 z-10">
              <span className="blinkit-discount-badge">{discountPercent}% OFF</span>
            </div>
          )}
          {product.requires_prescription && (
            <div className="absolute top-2 right-2 z-10">
              <span className="bg-red-500/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                Rx
              </span>
            </div>
          )}
          <ProductArtwork productId={product.id} name={product.name} size="md" />
        </div>

        {/* ETA Badge */}
        <div className="mb-1.5">
          <span className="blinkit-timer-tag">
            <Clock className="w-2.5 h-2.5 text-emerald-400" />
            <span className="text-emerald-400 font-extrabold">9 MINS</span>
          </span>
        </div>

        {/* Title */}
        <h3 className="text-white text-xs font-bold line-clamp-2 leading-tight h-8 mb-1">
          {product.name}
        </h3>

        {/* Pack Size / Weight */}
        <p className="text-[#a1a1aa] text-[11px] mb-3">
          {product.pack_size}
        </p>
      </div>

      {/* Bottom Pricing & Action Row */}
      <div className="flex items-center justify-between pt-1 border-t border-[#27272a]/40" onClick={e => e.stopPropagation()}>
        <div className="flex flex-col">
          <span className="text-white font-extrabold text-sm">
            ₹{product.selling_price}
          </span>
          {product.mrp > product.selling_price && (
            <span className="text-[#71717a] text-[10px] line-through -mt-0.5">
              ₹{product.mrp}
            </span>
          )}
        </div>

        {quantity === 0 ? (
          <button
            onClick={() => onAddToCart(product)}
            className="blinkit-add-btn flex items-center justify-center"
          >
            ADD
          </button>
        ) : (
          <div className="blinkit-stepper">
            <button 
              onClick={() => onUpdateQuantity(product.id, -1)}
              className="hover:scale-110 active:scale-95"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs px-1 select-none">{quantity}</span>
            <button 
              onClick={() => onUpdateQuantity(product.id, 1)}
              className="hover:scale-110 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
