import React, { useState } from 'react';
import { Search, ShoppingCart, MapPin, ChevronDown, UploadCloud } from 'lucide-react';
import { HealthcareDomain } from '../types';

interface HeaderProps {
  selectedDomain: HealthcareDomain;
  onSelectDomain: (domain: HealthcareDomain) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  cartCount: number;
  cartTotal: number;
  onOpenCart: () => void;
  onOpenOcr: () => void;
  activeRole: 'customer' | 'pharmacy' | 'admin';
  onRoleChange: (role: 'customer' | 'pharmacy' | 'admin') => void;
  onLogoClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedDomain,
  onSelectDomain,
  searchQuery,
  onSearchChange,
  cartCount,
  onOpenCart,
  onOpenOcr,
  activeRole,
  onRoleChange,
  onLogoClick
}) => {
  const [selectedLocality, setSelectedLocality] = useState('P9QP+FFW, Indira Nagar, Gorakhpur');
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const localities = [
    'P9QP+FFW, Indira Nagar, Gorakhpur',
    'Shop 14, Cinema Road, Golghar, Gorakhpur',
    'Medical College Road, Basharatpur, Gorakhpur',
    'Rapti Nagar Phase 2, Gorakhpur',
    'Taramandal Road, Gorakhpur'
  ];

  return (
    <header className="blinkit-header sticky top-0 z-40 px-4 sm:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* LEFT: Logo & Delivery Location */}
        <div className="flex items-center gap-6 flex-shrink-0">
          {/* Logo */}
          <div 
            onClick={onLogoClick}
            className="cursor-pointer select-none flex items-center"
          >
            <span className="text-2xl sm:text-3xl font-black tracking-tighter text-[#F8CB46]">
              med
            </span>
            <span className="text-2xl sm:text-3xl font-black tracking-tighter text-[#0C831F]">
              cure
            </span>
          </div>

          {/* Delivery Location dropdown */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setShowLocationPicker(!showLocationPicker)}
              className="text-left flex flex-col group"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-white font-extrabold text-xs sm:text-sm tracking-tight">
                  Delivery in 9 minutes
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-colors" />
              </div>
              <span className="text-[#a1a1aa] text-[11px] truncate max-w-[200px] block">
                {selectedLocality}
              </span>
            </button>

            {/* Location selector dropdown */}
            {showLocationPicker && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-[#18181b] border border-[#27272a] rounded-xl shadow-2xl p-2 z-50">
                <p className="text-[11px] font-bold text-zinc-400 px-3 py-1.5 uppercase tracking-wider">
                  Select Gorakhpur Service Area
                </p>
                {localities.map(loc => (
                  <button
                    key={loc}
                    onClick={() => {
                      setSelectedLocality(loc);
                      setShowLocationPicker(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2 transition-colors ${
                      selectedLocality === loc ? 'bg-emerald-500/10 text-emerald-400 font-bold' : 'text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-emerald-400" />
                    <span className="truncate">{loc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CENTER: Search Bar */}
        <div className="flex-1 max-w-2xl mx-2">
          <div className="blinkit-search-container flex items-center px-3.5 py-2.5 gap-2.5">
            <Search className="w-4 h-4 text-[#8c8c8c] flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder='Search "betnovate", "dolo", "dettol", "pet medicine"'
              className="bg-transparent border-none outline-none text-xs sm:text-sm text-white placeholder-[#8c8c8c] w-full"
            />
          </div>
        </div>

        {/* RIGHT: Domain Switch, Upload Rx, Cart & Role */}
        <div className="flex items-center gap-3 flex-shrink-0">
          
          {/* Healthcare Domain Switcher */}
          <div className="hidden lg:flex items-center bg-[#242428] p-1 rounded-xl border border-[#333338]">
            <button
              onClick={() => onSelectDomain('human')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedDomain === 'human' 
                  ? 'bg-white text-black shadow-sm' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Human Care
            </button>
            <button
              onClick={() => onSelectDomain('veterinary')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedDomain === 'veterinary' 
                  ? 'bg-white text-black shadow-sm' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Veterinary
            </button>
          </div>

          {/* Upload Rx / Assistive OCR */}
          <button
            onClick={onOpenOcr}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-emerald-950/40 border border-emerald-600/40 text-emerald-400 hover:bg-emerald-900/30 rounded-xl text-xs font-extrabold transition-all"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload Rx</span>
          </button>

          {/* Portal Switcher (Customer vs Pharmacy vs Admin) */}
          <div className="flex items-center bg-zinc-900 border border-zinc-700/80 rounded-xl p-1 text-[11px] font-bold">
            <button
              onClick={() => onRoleChange('customer')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeRole === 'customer' ? 'bg-white text-black shadow-md font-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Storefront
            </button>
            <button
              onClick={() => onRoleChange('pharmacy')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeRole === 'pharmacy' ? 'bg-emerald-600 text-white shadow-md font-black' : 'text-emerald-400 hover:text-emerald-300'
              }`}
            >
              <span>Pharmacy Portal</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse hidden sm:inline-block" />
            </button>
            <button
              onClick={() => onRoleChange('admin')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeRole === 'admin' ? 'bg-zinc-700 text-white shadow-md font-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Admin
            </button>
          </div>

          {/* Login Placeholder */}
          <button className="text-zinc-300 hover:text-white text-xs sm:text-sm font-bold px-2 hidden sm:block">
            Login
          </button>

          {/* My Cart Button */}
          <button
            onClick={onOpenCart}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all shadow-md ${
              cartCount > 0 
                ? 'bg-[#0C831F] text-white hover:bg-[#16a34a]' 
                : 'bg-[#242428] text-white hover:bg-[#2c2c32] border border-[#333338]'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>My Cart</span>
            {cartCount > 0 && (
              <span className="bg-white text-[#0C831F] text-[11px] font-black px-1.5 py-0.5 rounded-full ml-0.5">
                {cartCount}
              </span>
            )}
          </button>

        </div>

      </div>
    </header>
  );
};
