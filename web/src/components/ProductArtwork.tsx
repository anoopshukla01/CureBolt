import React from 'react';

interface ProductArtworkProps {
  productId: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ProductArtwork: React.FC<ProductArtworkProps> = ({ productId, name, size = 'md' }) => {
  const width = size === 'sm' ? 80 : size === 'md' ? 140 : 260;
  const height = size === 'sm' ? 80 : size === 'md' ? 130 : 240;

  // 1. Betnovate N Tube
  if (productId === 'prd-betnovate-n' || name.toLowerCase().includes('betnovate')) {
    return (
      <svg width={width} height={height} viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Shadow */}
        <ellipse cx="120" cy="155" rx="90" ry="10" fill="#E2E8F0" />
        
        {/* Carton Box behind */}
        <rect x="25" y="65" width="190" height="52" rx="4" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
        <rect x="25" y="75" width="190" height="32" fill="#22C55E" />
        {/* GSK Red Logo */}
        <rect x="180" y="70" width="24" height="12" rx="2" fill="#EF4444" />
        <text x="183" y="79" fill="#FFFFFF" fontSize="7" fontWeight="bold">GSK</text>
        {/* Typography */}
        <text x="32" y="86" fill="#14532D" fontSize="7.5" fontWeight="900" letterSpacing="0.5">BETAMETHASONE VALERATE AND</text>
        <text x="32" y="95" fill="#14532D" fontSize="7.5" fontWeight="900" letterSpacing="0.5">NEOMYCIN SKIN CREAM</text>
        <text x="32" y="105" fill="#14532D" fontSize="10" fontWeight="900">BETNOVATE - N</text>
        <rect x="135" y="97" width="34" height="9" fill="#DC2626" rx="2" />
        <text x="138" y="104" fill="#FFFFFF" fontSize="6.5" fontWeight="bold">Now in Lamitube</text>

        {/* Realistic Tube in front */}
        <g transform="rotate(-8 120 70)">
          {/* Cap */}
          <rect x="30" y="62" width="16" height="16" rx="3" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1.5" />
          <line x1="34" y1="62" x2="34" y2="78" stroke="#CBD5E1" />
          <line x1="38" y1="62" x2="38" y2="78" stroke="#CBD5E1" />
          <line x1="42" y1="62" x2="42" y2="78" stroke="#CBD5E1" />
          {/* Tube Body */}
          <path d="M46 64 L190 60 L195 80 L46 76 Z" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="1.5" />
          <path d="M60 65 L170 62 L170 74 L60 75 Z" fill="#22C55E" />
          <text x="65" y="72" fill="#14532D" fontSize="6" fontWeight="bold">BETNOVATE-N 25g</text>
        </g>
      </svg>
    );
  }

  // 2. Boroline Ayurvedic Cream
  if (productId === 'prd-boroline-20g' || name.toLowerCase().includes('boroline')) {
    return (
      <svg width={width} height={height} viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="120" cy="150" rx="85" ry="10" fill="#E2E8F0" />
        {/* Dark Olive Green Tube */}
        <g transform="rotate(-6 120 90)">
          {/* Cap */}
          <rect x="35" y="80" width="18" height="20" rx="3" fill="#15803D" stroke="#166534" strokeWidth="2" />
          {/* Tube */}
          <path d="M53 82 L190 75 L195 105 L53 98 Z" fill="#14532D" />
          {/* Gold Elephant Circle */}
          <circle cx="95" cy="88" r="8" fill="#FBBF24" />
          <text x="91" y="91" fill="#78350F" fontSize="8" fontWeight="bold">🐘</text>
          {/* Boroline Text */}
          <text x="110" y="92" fill="#FFFFFF" fontSize="13" fontWeight="900" letterSpacing="1">BOROLINE</text>
          <text x="110" y="100" fill="#86EFAC" fontSize="6" fontWeight="bold">ANTISEPTIC AYURVEDIC CREAM</text>
        </g>
      </svg>
    );
  }

  // 3. Hansaplast Washproof Bandage
  if (productId === 'prd-hansaplast-20' || name.toLowerCase().includes('hansaplast')) {
    return (
      <svg width={width} height={height} viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="120" cy="155" rx="65" ry="8" fill="#E2E8F0" />
        {/* Box */}
        <rect x="70" y="30" width="100" height="120" rx="8" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
        {/* Blue Header */}
        <rect x="70" y="30" width="100" height="32" rx="6" fill="#1D4ED8" />
        <text x="76" y="52" fill="#FFFFFF" fontSize="13" fontWeight="900">Hansaplast</text>
        {/* Washproof text */}
        <text x="76" y="74" fill="#1E293B" fontSize="9" fontWeight="900">WASHPROOF</text>
        <circle cx="152" cy="72" r="10" fill="#FEE2E2" />
        <text x="146" y="75" fill="#DC2626" fontSize="8" fontWeight="bold">20</text>
        <text x="145" y="80" fill="#DC2626" fontSize="5" fontWeight="bold">Strips</text>
        {/* Bandage Graphic */}
        <rect x="80" y="90" width="80" height="30" rx="8" fill="#FDE68A" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="3 2" />
        <rect x="105" y="90" width="30" height="30" fill="#FEF3C7" />
        <text x="82" y="140" fill="#16A34A" fontSize="7" fontWeight="bold">Bacteria Shield 99%</text>
      </svg>
    );
  }

  // 4. Dettol Antiseptic Liquid
  if (productId === 'prd-dettol-250' || name.toLowerCase().includes('dettol')) {
    return (
      <svg width={width} height={height} viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="120" cy="160" rx="50" ry="8" fill="#E2E8F0" />
        {/* White Cap */}
        <rect x="110" y="35" width="20" height="18" rx="3" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1.5" />
        {/* Amber Flask Bottle */}
        <path d="M112 53 L100 70 L95 140 A15 15 0 0 0 110 155 L130 155 A15 15 0 0 0 145 140 L140 70 L128 53 Z" fill="#D97706" />
        {/* White Label */}
        <rect x="100" y="85" width="40" height="50" rx="4" fill="#FFFFFF" />
        {/* Green Sword Emblem */}
        <circle cx="120" cy="102" r="10" fill="#15803D" />
        <line x1="120" y1="95" x2="120" y2="109" stroke="#FFFFFF" strokeWidth="2" />
        <line x1="116" y1="99" x2="124" y2="99" stroke="#FFFFFF" strokeWidth="1.5" />
        {/* Dettol Text */}
        <text x="106" y="122" fill="#15803D" fontSize="9" fontWeight="900">Dettol</text>
        <text x="106" y="129" fill="#475569" fontSize="5" fontWeight="bold">ANTISEPTIC</text>
      </svg>
    );
  }

  // 5. Minimalist 10% Vitamin C Serum
  if (productId === 'prd-minimalist-vitc' || name.toLowerCase().includes('minimalist')) {
    return (
      <svg width={width} height={height} viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="120" cy="160" rx="45" ry="8" fill="#E2E8F0" />
        {/* Dropper Bulb & Collar */}
        <rect x="112" y="25" width="16" height="14" rx="7" fill="#18181B" />
        <rect x="109" y="39" width="22" height="12" rx="2" fill="#E4E4E7" stroke="#CBD5E1" />
        {/* Glass Dropper Bottle */}
        <rect x="102" y="51" width="36" height="95" rx="8" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
        {/* Label */}
        <rect x="104" y="65" width="32" height="70" fill="#FFFFFF" />
        <text x="107" y="78" fill="#09090B" fontSize="6.5" fontWeight="900">Minimalist</text>
        <text x="107" y="88" fill="#2563EB" fontSize="8" fontWeight="900">10%</text>
        <text x="107" y="96" fill="#09090B" fontSize="5" fontWeight="bold">Vitamin C</text>
        <text x="107" y="103" fill="#71717A" fontSize="4.5">Face Serum</text>
        <line x1="107" y1="107" x2="131" y2="107" stroke="#E4E4E7" />
        <text x="107" y="115" fill="#71717A" fontSize="4.5">10 ml</text>
      </svg>
    );
  }

  // 6. Dot & Key Sunscreen
  if (productId === 'prd-dotkey-sunscreen' || name.toLowerCase().includes('dot & key')) {
    return (
      <svg width={width} height={height} viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="120" cy="160" rx="55" ry="8" fill="#E2E8F0" />
        {/* Orange Bottle */}
        <rect x="95" y="45" width="50" height="105" rx="20" fill="#FB923C" />
        <rect x="108" y="30" width="24" height="16" rx="6" fill="#FBBF24" />
        {/* Label */}
        <text x="102" y="68" fill="#7C2D12" fontSize="6" fontWeight="bold">DOT & KEY</text>
        <text x="102" y="77" fill="#FFFFFF" fontSize="6" fontWeight="900">SUPER BRIGHT</text>
        <circle cx="120" cy="98" r="14" fill="#F97316" stroke="#FEF08A" strokeWidth="2" />
        <text x="111" y="99" fill="#FFFFFF" fontSize="8" fontWeight="900">50+</text>
        <text x="110" y="105" fill="#FEF08A" fontSize="4.5" fontWeight="bold">SPF PA+++</text>
        <text x="102" y="125" fill="#FFFFFF" fontSize="5" fontWeight="bold">VITAMIN C + E</text>
      </svg>
    );
  }

  // 7. Boroplus Ayurvedic Cream
  if (productId === 'prd-boroplus-80' || name.toLowerCase().includes('boroplus')) {
    return (
      <svg width={width} height={height} viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="120" cy="155" rx="55" ry="8" fill="#E2E8F0" />
        {/* White & Lilac Tube standing */}
        <path d="M102 145 L138 145 L132 40 L108 40 Z" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
        <rect x="105" y="142" width="30" height="12" rx="3" fill="#A855F7" />
        <rect x="105" y="55" width="30" height="25" fill="#7E22CE" />
        <text x="107" y="67" fill="#FFFFFF" fontSize="6" fontWeight="900">BORO</text>
        <text x="107" y="74" fill="#FDE047" fontSize="6" fontWeight="900">PLUS</text>
        {/* Aloe vera icon */}
        <circle cx="120" cy="100" r="10" fill="#DCFCE7" />
        <text x="116" y="103" fill="#15803D" fontSize="10">🌿</text>
        <text x="109" y="125" fill="#4B5563" fontSize="5" fontWeight="bold">Antiseptic</text>
      </svg>
    );
  }

  // 8. Dolo 650
  if (productId === 'prd-dolo-650' || name.toLowerCase().includes('dolo')) {
    return (
      <svg width={width} height={height} viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="120" cy="150" rx="75" ry="10" fill="#E2E8F0" />
        {/* Green Blister Pack */}
        <rect x="60" y="45" width="120" height="95" rx="8" fill="#FFFFFF" stroke="#86EFAC" strokeWidth="2" />
        <rect x="60" y="45" width="120" height="24" rx="6" fill="#15803D" />
        <text x="80" y="61" fill="#FFFFFF" fontSize="13" fontWeight="900" letterSpacing="1">DOLO 650</text>
        {/* Tablets */}
        {[0, 1, 2, 3].map((row) =>
          [0, 1, 2].map((col) => (
            <ellipse
              key={`${row}-${col}`}
              cx={80 + col * 40}
              cy={80 + row * 16}
              rx="12"
              ry="6"
              fill="#F0FDF4"
              stroke="#22C55E"
              strokeWidth="1.5"
            />
          ))
        )}
      </svg>
    );
  }

  // 9. Veterinary HimCal
  if (productId === 'prd-himcal-1l' || name.toLowerCase().includes('himcal')) {
    return (
      <svg width={width} height={height} viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="120" cy="160" rx="55" ry="8" fill="#E2E8F0" />
        {/* Big White Cattle Calcium Jug */}
        <rect x="90" y="45" width="60" height="105" rx="10" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
        <rect x="105" y="30" width="30" height="15" rx="3" fill="#15803D" />
        <rect x="90" y="65" width="60" height="40" fill="#166534" />
        <text x="96" y="82" fill="#FFFFFF" fontSize="10" fontWeight="900">HimCal</text>
        <text x="96" y="93" fill="#86EFAC" fontSize="5.5" fontWeight="bold">Liquid Calcium</text>
        <circle cx="120" cy="125" r="12" fill="#FEF3C7" />
        <text x="114" y="129" fill="#92400E" fontSize="11">🐄</text>
      </svg>
    );
  }

  // 10. Drontal Dog Dewormer
  if (productId === 'prd-drontal-dog' || name.toLowerCase().includes('drontal')) {
    return (
      <svg width={width} height={height} viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="120" cy="155" rx="65" ry="8" fill="#E2E8F0" />
        <rect x="65" y="45" width="110" height="95" rx="8" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
        <rect x="65" y="45" width="110" height="26" fill="#0284C7" rx="6" />
        <text x="75" y="62" fill="#FFFFFF" fontSize="12" fontWeight="900">Drontal Plus</text>
        {/* Dog Bone Tablet shape */}
        <rect x="95" y="85" width="50" height="20" rx="10" fill="#D97706" />
        <circle cx="95" cy="90" r="7" fill="#D97706" />
        <circle cx="95" cy="100" r="7" fill="#D97706" />
        <circle cx="145" cy="90" r="7" fill="#D97706" />
        <circle cx="145" cy="100" r="7" fill="#D97706" />
        <text x="105" y="98" fill="#FFFFFF" fontSize="8" fontWeight="bold">🐕 Tasty</text>
      </svg>
    );
  }

  // Generic fallback product medicine container
  return (
    <svg width={width} height={height} viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="120" cy="155" rx="60" ry="8" fill="#E2E8F0" />
      <rect x="85" y="40" width="70" height="105" rx="10" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
      <rect x="98" y="28" width="44" height="14" rx="4" fill="#0C831F" />
      <rect x="85" y="65" width="70" height="35" fill="#F1F5F9" />
      <circle cx="120" cy="82" r="10" fill="#DCFCE7" />
      <text x="114" y="86" fill="#0C831F" fontSize="12" fontWeight="bold">💊</text>
      <text x="92" y="118" fill="#334155" fontSize="7" fontWeight="bold">MEDCURE PHARMA</text>
    </svg>
  );
};
