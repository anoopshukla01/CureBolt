import React, { useState } from 'react';
import { Product } from '../types';
import { ProductArtwork } from './ProductArtwork';
import { ProductCard } from './ProductCard';
import { Clock, ShieldCheck, Tag, ChevronDown, ChevronUp, ArrowLeft, Plus, Minus } from 'lucide-react';

interface ProductDetailViewProps {
  product: Product;
  allProducts: Product[];
  cartQuantity: number;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onSelectProduct: (product: Product) => void;
  onBack: () => void;
  getCartQuantity: (productId: string) => number;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  product,
  allProducts,
  cartQuantity,
  onAddToCart,
  onUpdateQuantity,
  onSelectProduct,
  onBack,
  getCartQuantity
}) => {
  const [activeThumbnail, setActiveThumbnail] = useState(0);
  const [showMoreDetails, setShowMoreDetails] = useState(false);

  const relatedProducts = allProducts.filter(p => p.id !== product.id).slice(0, 8);

  const categoryLabel = product.category_domain === 'veterinary' 
    ? 'Veterinary Healthcare' 
    : (product.requires_prescription ? 'Prescription Medicines' : 'Over The Counter Healthcare');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#a1a1aa] mb-6">
        <button 
          onClick={onBack}
          className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-bold transition-colors mr-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <span className="cursor-pointer hover:underline" onClick={onBack}>Home</span>
        <span>/</span>
        <span className="cursor-pointer hover:underline">{categoryLabel}</span>
        <span>/</span>
        <span className="text-white font-medium truncate max-w-xs">{product.name}</span>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
        
        {/* LEFT COLUMN: Image Showcase, Thumbnails & Details */}
        <div className="lg:col-span-7 flex flex-col">
          {/* Big Image Canvas */}
          <div className="bg-white rounded-2xl p-8 flex items-center justify-center relative min-h-[380px] sm:min-h-[440px] shadow-2xl">
            {product.requires_prescription && (
              <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded uppercase tracking-wider">
                Prescription Required (Schedule {product.schedule_type})
              </div>
            )}
            <ProductArtwork productId={product.id} name={product.name} size="lg" />
          </div>

          {/* 4 Thumbnails strip */}
          <div className="flex items-center gap-3 mt-4">
            {['Front View', 'Salt Info', 'Batch MRP', 'Packaging'].map((label, index) => (
              <button
                key={index}
                onClick={() => setActiveThumbnail(index)}
                className={`pdp-thumbnail flex-1 h-20 flex flex-col items-center justify-center p-2 text-center transition-all ${
                  activeThumbnail === index ? 'active shadow-lg' : 'opacity-80 hover:opacity-100'
                }`}
              >
                <div className="transform scale-50 -my-3">
                  <ProductArtwork productId={product.id} name={product.name} size="sm" />
                </div>
                <span className="text-[10px] text-zinc-700 font-bold mt-1">{label}</span>
              </button>
            ))}
          </div>

          {/* Product Details Section */}
          <div className="mt-8 bg-[#18181b] border border-[#27272a] rounded-2xl p-6">
            <h3 className="text-white font-extrabold text-base mb-3">Product Details</h3>
            
            {/* Salt composition */}
            <div className="mb-4">
              <span className="text-[#a1a1aa] text-xs font-semibold block uppercase tracking-wider mb-1">
                Salt Composition
              </span>
              <p className="text-zinc-200 text-sm font-medium">
                {product.generic_salt_name || 'Standard therapeutic formulation'}
              </p>
            </div>

            {/* Expandable Accordion */}
            <button
              onClick={() => setShowMoreDetails(!showMoreDetails)}
              className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold hover:text-emerald-300 transition-colors"
            >
              <span>{showMoreDetails ? 'View less details' : 'View more details'}</span>
              {showMoreDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showMoreDetails && (
              <div className="mt-4 pt-4 border-t border-[#27272a] space-y-3 text-xs text-zinc-300">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[#71717a] block font-medium">Manufacturer</span>
                    <span className="text-white font-semibold">{product.manufacturer}</span>
                  </div>
                  <div>
                    <span className="text-[#71717a] block font-medium">Formulation</span>
                    <span className="text-white font-semibold">{product.formulation}</span>
                  </div>
                  <div>
                    <span className="text-[#71717a] block font-medium">Regulatory Schedule</span>
                    <span className="text-white font-semibold">{product.schedule_type}</span>
                  </div>
                  <div>
                    <span className="text-[#71717a] block font-medium">Authenticity</span>
                    <span className="text-emerald-400 font-semibold">100% Licensed Pharmacy Stock</span>
                  </div>
                </div>

                {product.species_restrictions && product.species_restrictions.length > 0 && (
                  <div className="mt-3 p-3 bg-amber-950/40 border border-amber-600/30 rounded-xl">
                    <span className="text-amber-400 font-bold block mb-1">Veterinary Withdrawal Notice:</span>
                    {product.species_restrictions.map((spec, idx) => (
                      <p key={idx} className="text-amber-200 text-[11px]">
                        • <strong>{spec.speciesName}</strong>: {spec.precautions} ({spec.withdrawalPeriodDays} days withdrawal period)
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Buy Box & "Why Shop from Medcure?" */}
        <div className="lg:col-span-5 flex flex-col justify-start">
          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-6 sticky top-24">
            
            {/* Title with indicator */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <h1 className="text-white text-xl sm:text-2xl font-black leading-snug">
                {product.name}
              </h1>
              <div className="p-1 rounded-sm border border-emerald-500/60 flex items-center justify-center flex-shrink-0 mt-1">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
            </div>

            {/* Pack Size */}
            <p className="text-[#a1a1aa] text-sm mb-4">
              {product.pack_size}
            </p>

            {/* Pricing */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-white font-extrabold text-2xl sm:text-3xl">
                ₹{product.selling_price}
              </span>
              {product.mrp > product.selling_price && (
                <span className="text-[#71717a] text-sm line-through">
                  ₹{product.mrp}
                </span>
              )}
              <span className="text-[#a1a1aa] text-xs">
                (Inclusive of all taxes)
              </span>
            </div>

            {/* Primary Add to Cart Action */}
            <div className="mb-8">
              {cartQuantity === 0 ? (
                <button
                  onClick={() => onAddToCart(product)}
                  className="blinkit-primary-btn w-full flex items-center justify-center gap-2 py-3.5 shadow-lg shadow-emerald-900/30"
                >
                  <span>Add to cart</span>
                </button>
              ) : (
                <div className="flex items-center justify-between bg-zinc-900 border border-[#27272a] rounded-xl p-2">
                  <span className="text-xs text-zinc-300 font-bold pl-3">
                    Item Added to Cart
                  </span>
                  <div className="blinkit-stepper py-1.5 px-3">
                    <button 
                      onClick={() => onUpdateQuantity(product.id, -1)}
                      className="hover:scale-110 active:scale-95"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-sm px-2 font-black select-none">{cartQuantity}</span>
                    <button 
                      onClick={() => onUpdateQuantity(product.id, 1)}
                      className="hover:scale-110 active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* WHY SHOP FROM MEDCURE? Section (Screenshot 2 Match) */}
            <div className="pt-6 border-t border-[#27272a]">
              <h4 className="text-white text-sm font-extrabold mb-4">Why shop from medcure?</h4>
              
              <div className="space-y-4">
                {/* 1. Round The Clock Delivery */}
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 text-emerald-400">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-white text-xs font-bold mb-0.5">Round The Clock Delivery</h5>
                    <p className="text-[#a1a1aa] text-[11px] leading-relaxed">
                      Get items delivered to your doorstep from partner pharmacies in Gorakhpur in 10-15 minutes, whenever you need them.
                    </p>
                  </div>
                </div>

                {/* 2. Best Prices & Offers */}
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 text-amber-400">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-white text-xs font-bold mb-0.5">Best Prices & Offers</h5>
                    <p className="text-[#a1a1aa] text-[11px] leading-relaxed">
                      Direct licensed pharmacy pricing with authentic batch verification and statutory selling_price ≤ MRP protection.
                    </p>
                  </div>
                </div>

                {/* 3. Wide Assortment */}
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 text-blue-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-white text-xs font-bold mb-0.5">Wide Assortment</h5>
                    <p className="text-[#a1a1aa] text-[11px] leading-relaxed">
                      Choose from 100% genuine Human and Veterinary medicines verified by registered pharmacists.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* "Top 10 products in this category" Carousel (Screenshot 2 Bottom Match) */}
      <div className="mt-12 pt-8 border-t border-[#27272a]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white text-lg font-black tracking-tight">
            Top products in this category
          </h3>
          <span className="text-emerald-400 text-xs font-bold cursor-pointer hover:underline">
            see all
          </span>
        </div>

        <div className="blinkit-carousel">
          {relatedProducts.map(p => (
            <ProductCard
              key={p.id}
              product={p}
              quantity={getCartQuantity(p.id)}
              onAddToCart={onAddToCart}
              onUpdateQuantity={onUpdateQuantity}
              onSelectProduct={onSelectProduct}
            />
          ))}
        </div>
      </div>

    </div>
  );
};
