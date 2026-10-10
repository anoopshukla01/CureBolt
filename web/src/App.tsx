import { useState, useEffect } from 'react';
import { 
  Bike, 
  ArrowRight, 
  ChevronRight 
} from 'lucide-react';
import { Product, CartItem, Order, HealthcareDomain, CodReconciliationData } from './types';
import { ProductCard } from './components/ProductCard';
import { ProductDetailView } from './components/ProductDetailView';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { OcrModal } from './components/OcrModal';
import { LiveTelemetryModal } from './components/LiveTelemetryModal';

const API_BASE = 'http://localhost:4000/api/v1';

export default function App() {
  // Navigation & Role State
  const [activeRole, setActiveRole] = useState<'customer' | 'pharmacy' | 'admin'>('customer');
  const [selectedDomain, setSelectedDomain] = useState<HealthcareDomain>('human');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryChip, setActiveCategoryChip] = useState('All');
  
  // Selected PDP Product (If non-null, shows Screenshot 2 Product Detail Page)
  const [selectedPdpProduct, setSelectedPdpProduct] = useState<Product | null>(null);

  // Products & Cart
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [uploadedRxId, setUploadedRxId] = useState<string | null>(null);
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'ONLINE' | 'COD'>('COD');
  const [placingOrder, setPlacingOrder] = useState(false);

  // Active Orders & Live Tracking
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTrackOrder, setActiveTrackOrder] = useState<Order | null>(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);

  // COD Cash Reconciliation State (Admin)
  const [reconData, setReconData] = useState<CodReconciliationData | null>(null);
  const [settleAmount, setSettleAmount] = useState<number>(0);
  const [settleRef, setSettleRef] = useState<string>('SBI-GKP-CASH-DEP-98124');
  const [settleMessage, setSettleMessage] = useState<string | null>(null);

  // Seed Catalog Items (Matches Screenshot 1 & 2)
  const defaultProducts: Product[] = [
    {
      id: 'prd-betnovate-n',
      name: 'Betnovate N Tube Of 25gm Cream',
      brand: 'GSK Pharmaceuticals',
      generic_salt_name: 'Betamethasone(0.1 % w/w)+Neomycin(0.5% w/w)',
      category_domain: 'human',
      formulation: 'Topical Cream',
      strength: '0.1% + 0.5%',
      pack_size: '25 g',
      manufacturer: 'GlaxoSmithKline Pharmaceuticals Ltd',
      requires_prescription: true,
      schedule_type: 'Schedule H',
      selling_price: 68.00,
      mrp: 68.00,
      discount_percent: 0,
      available_quantity: 120,
      in_stock: true
    },
    {
      id: 'prd-boroline-20g',
      name: 'Boroline Ayurvedic Antiseptic Cream',
      brand: 'G.D. Pharmaceuticals',
      generic_salt_name: 'Boric Acid, Zinc Oxide, Anhydrous Lanolin',
      category_domain: 'human',
      formulation: 'Ointment',
      strength: 'Ayurvedic Formula',
      pack_size: '20 g',
      manufacturer: 'G.D. Pharmaceuticals Pvt Ltd',
      requires_prescription: false,
      schedule_type: 'OTC',
      selling_price: 45.00,
      mrp: 50.00,
      discount_percent: 10,
      available_quantity: 95,
      in_stock: true
    },
    {
      id: 'prd-hansaplast-20',
      name: 'Hansaplast Washproof Anti-Septic Adhesive Bandage',
      brand: 'Hansaplast',
      generic_salt_name: 'Medicated Dressing (Silver/Benzalkonium Chloride)',
      category_domain: 'human',
      formulation: 'Strips',
      strength: 'Water Resistant',
      pack_size: '20 pcs',
      manufacturer: 'Beiersdorf India Pvt Ltd',
      requires_prescription: false,
      schedule_type: 'OTC',
      selling_price: 60.00,
      mrp: 65.00,
      discount_percent: 8,
      available_quantity: 200,
      in_stock: true
    },
    {
      id: 'prd-dettol-250',
      name: 'Dettol Antiseptic Liquid',
      brand: 'Reckitt Benckiser',
      generic_salt_name: 'Chloroxylenol (4.8% w/v)',
      category_domain: 'human',
      formulation: 'Liquid Disinfectant',
      strength: '4.8% w/v',
      pack_size: '250 ml',
      manufacturer: 'Reckitt Benckiser India Pvt Ltd',
      requires_prescription: false,
      schedule_type: 'OTC',
      selling_price: 167.00,
      mrp: 175.00,
      discount_percent: 5,
      available_quantity: 110,
      in_stock: true
    },
    {
      id: 'prd-minimalist-vitc',
      name: 'Minimalist 10% Vitamin C Brightening & Illumination Face Serum',
      brand: 'Minimalist',
      generic_salt_name: 'Ethyl Ascorbic Acid (10%) + Centella Asiatica',
      category_domain: 'human',
      formulation: 'Face Serum',
      strength: '10%',
      pack_size: '10 ml',
      manufacturer: 'Uprising Science Pvt Ltd',
      requires_prescription: false,
      schedule_type: 'OTC',
      selling_price: 270.00,
      mrp: 299.00,
      discount_percent: 9,
      available_quantity: 45,
      in_stock: true
    },
    {
      id: 'prd-dotkey-sunscreen',
      name: 'Dot & Key Vitamin C + E Super Bright Sunscreen (SPF 50+ PA+++)',
      brand: 'Dot & Key',
      generic_salt_name: 'Vitamin C, Vitamin E & UV Filters',
      category_domain: 'human',
      formulation: 'Fluid Sunscreen',
      strength: 'SPF 50+ PA+++',
      pack_size: '30 g',
      manufacturer: 'Dot & Key Wellness',
      requires_prescription: false,
      schedule_type: 'OTC',
      selling_price: 264.00,
      mrp: 299.00,
      discount_percent: 11,
      available_quantity: 50,
      in_stock: true
    },
    {
      id: 'prd-boroplus-80',
      name: 'Boroplus Ayurvedic Antiseptic Cream',
      brand: 'Emami',
      generic_salt_name: 'Neem, Tulsi, Aloe Vera & Turmeric Extracts',
      category_domain: 'human',
      formulation: 'Cream',
      strength: 'Ayurvedic Antiseptic',
      pack_size: '80 ml',
      manufacturer: 'Emami Limited',
      requires_prescription: false,
      schedule_type: 'OTC',
      selling_price: 157.00,
      mrp: 170.00,
      discount_percent: 7,
      available_quantity: 85,
      in_stock: true
    },
    {
      id: 'prd-dolo-650',
      name: 'Dolo 650mg Tablet',
      brand: 'Micro Labs',
      generic_salt_name: 'Paracetamol (650mg)',
      category_domain: 'human',
      formulation: 'Tablet',
      strength: '650mg',
      pack_size: '15 Tablets',
      manufacturer: 'Micro Labs Ltd',
      requires_prescription: false,
      schedule_type: 'OTC',
      selling_price: 30.50,
      mrp: 34.00,
      discount_percent: 10,
      available_quantity: 150,
      in_stock: true
    },
    {
      id: 'prd-glycomet-500',
      name: 'Glycomet 500 SR Tablet',
      brand: 'USV Ltd',
      generic_salt_name: 'Metformin Hydrochloride (500mg)',
      category_domain: 'human',
      formulation: 'Tablet',
      strength: '500mg',
      pack_size: '20 Tablets',
      manufacturer: 'USV Private Limited',
      requires_prescription: true,
      schedule_type: 'Schedule H',
      selling_price: 46.80,
      mrp: 52.00,
      discount_percent: 10,
      available_quantity: 80,
      in_stock: true
    },
    // Veterinary Products
    {
      id: 'prd-drontal-dog',
      name: 'Drontal Plus Chewable Dewormer for Dogs',
      brand: 'Elanco',
      generic_salt_name: 'Praziquantel, Pyrantel Embonate, Febantel',
      category_domain: 'veterinary',
      formulation: 'Chewable Bone Tablet',
      strength: 'For 10kg Bodyweight',
      pack_size: '1 Tablet Strip',
      manufacturer: 'Elanco Animal Health',
      requires_prescription: false,
      schedule_type: 'OTC',
      selling_price: 120.00,
      mrp: 130.00,
      discount_percent: 8,
      available_quantity: 60,
      in_stock: true,
      species_restrictions: [
        { speciesName: 'Canine', withdrawalPeriodDays: 0, precautions: 'Strictly for dogs. Not for human use.' }
      ]
    },
    {
      id: 'prd-himcal-1l',
      name: 'HimCal Liquid Calcium (Cattle/Buffalo)',
      brand: 'Himalaya Animal Health',
      generic_salt_name: 'Calcium, Phosphorus & Vit D3 Suspension',
      category_domain: 'veterinary',
      formulation: 'Liquid Suspension',
      strength: 'High Bioavailable Calcium',
      pack_size: '1 Litre Bottle',
      manufacturer: 'The Himalaya Drug Company',
      requires_prescription: false,
      schedule_type: 'OTC',
      selling_price: 216.00,
      mrp: 240.00,
      discount_percent: 10,
      available_quantity: 30,
      in_stock: true,
      species_restrictions: [
        { speciesName: 'Cattle', withdrawalPeriodDays: 0, precautions: 'Nutritional supplement. Zero milk withdrawal.' },
        { speciesName: 'Buffalo', withdrawalPeriodDays: 0, precautions: 'Nutritional supplement. Zero milk withdrawal.' }
      ]
    },
    {
      id: 'prd-intacef-4g',
      name: 'Intacef Tazo 4.5g Veterinary Injectable',
      brand: 'Intas Animal Health',
      generic_salt_name: 'Ceftriaxone Sodium & Tazobactam Sodium',
      category_domain: 'veterinary',
      formulation: 'Vial with Sterile Water',
      strength: '4.5g',
      pack_size: '1 Glass Vial + Diluent',
      manufacturer: 'Intas Pharmaceuticals Ltd',
      requires_prescription: true,
      schedule_type: 'Schedule H',
      selling_price: 436.50,
      mrp: 485.00,
      discount_percent: 10,
      available_quantity: 25,
      in_stock: true,
      species_restrictions: [
        { speciesName: 'Bovine', withdrawalPeriodDays: 7, precautions: 'Milk withdrawal: 7 days. Meat withdrawal: 28 days.' }
      ]
    }
  ];

  // Fetch from API or fallback to defaultProducts
  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE}/catalogue/products?domain=${selectedDomain}&query=${searchQuery}`);
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        setProducts(data.items);
      } else {
        setProducts(defaultProducts);
      }
    } catch {
      setProducts(defaultProducts);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_BASE}/pharmacy/orders?pharmacyId=pharm-gkp-1`);
      const data = await res.json();
      if (data.orders) {
        setOrders(data.orders);
        if (data.orders.length > 0 && !activeTrackOrder) {
          setActiveTrackOrder(data.orders[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchReconciliation = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/cod/reconciliation`);
      const data = await res.json();
      if (data.reconciliation) {
        setReconData(data.reconciliation);
        if (data.reconciliation.riders && data.reconciliation.riders.length > 0) {
          setSettleAmount(data.reconciliation.riders[0].outstandingCash);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedDomain, searchQuery]);

  useEffect(() => {
    fetchOrders();
    fetchReconciliation();
  }, []);

  // Filter products by domain & query & category
  const filteredProducts = products.filter(p => {
    const matchesDomain = p.category_domain === selectedDomain;
    const matchesQuery = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (p.generic_salt_name && p.generic_salt_name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (activeCategoryChip === 'All') return matchesDomain && matchesQuery;
    if (activeCategoryChip === 'Prescription Medicines') return matchesDomain && matchesQuery && p.requires_prescription;
    if (activeCategoryChip === 'Antiseptics & First Aid') return matchesDomain && matchesQuery && !p.requires_prescription;
    return matchesDomain && matchesQuery;
  });

  // Cart Handlers
  const handleAddToCart = (product: Product) => {
    setCart(prev => {
      const exists = prev.find(i => i.product.id === product.id);
      if (exists) {
        return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const next = item.quantity + delta;
          return next > 0 ? { ...item, quantity: next } : null;
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const getCartQuantity = (productId: string) => {
    const item = cart.find(i => i.product.id === productId);
    return item ? item.quantity : 0;
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.selling_price * item.quantity, 0);
  const hasPrescriptionRequiredItems = cart.some(i => i.product.requires_prescription);

  // Place Order
  const handlePlaceOrder = async () => {
    setPlacingOrder(true);
    try {
      const payload = {
        userId: 'usr-cust-1',
        pharmacyId: 'pharm-gkp-1',
        deliveryAddressId: 'addr-cust-1',
        categoryDomain: selectedDomain,
        paymentMode,
        prescriptionId: hasPrescriptionRequiredItems ? (uploadedRxId || 'RX-GKP-VERIFIED-981') : undefined,
        items: cart.map(i => ({
          productId: i.product.id,
          quantity: i.quantity
        }))
      };

      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.order) {
        setOrders(prev => [data.order, ...prev]);
        setActiveTrackOrder(data.order);
        setCart([]);
        setShowCartDrawer(false);
        setShowTrackingModal(true);
      } else {
        alert(data.error || 'Failed to place order');
      }
    } catch {
      // Local fallback simulation
      const mockOrder: Order = {
        id: `ord-gkp-${Date.now()}`,
        orderCode: `MC-GKP-${Math.floor(1000 + Math.random() * 9000)}`,
        userId: 'usr-cust-1',
        pharmacyId: 'pharm-gkp-1',
        deliveryAddressId: 'addr-cust-1',
        categoryDomain: selectedDomain,
        state: 'ACCEPTED',
        items: cart.map(i => ({
          productId: i.product.id,
          productName: i.product.name,
          unitPrice: i.product.selling_price,
          quantity: i.quantity
        })),
        paymentMode,
        totalMrp: cartSubtotal,
        payableAmount: cartSubtotal + 2,
        deliveryOtp: '4892',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setOrders(prev => [mockOrder, ...prev]);
      setActiveTrackOrder(mockOrder);
      setCart([]);
      setShowCartDrawer(false);
      setShowTrackingModal(true);
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      
      {/* 1. BLINKIT-STYLE DARK HEADER */}
      <Header
        selectedDomain={selectedDomain}
        onSelectDomain={domain => {
          setSelectedDomain(domain);
          setSelectedPdpProduct(null);
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        cartCount={cartCount}
        cartTotal={cartSubtotal}
        onOpenCart={() => setShowCartDrawer(true)}
        onOpenOcr={() => setShowOcrModal(true)}
        activeRole={activeRole}
        onRoleChange={setActiveRole}
        onLogoClick={() => setSelectedPdpProduct(null)}
      />

      {/* 2. ROLE TOGGLE VIEW: CUSTOMER APP vs PHARMACY vs ADMIN */}
      {activeRole === 'customer' ? (
        <main className="flex-1">
          {selectedPdpProduct ? (
            /* 2A. EXACT BLINKIT PRODUCT DETAIL PAGE (Screenshot 2) */
            <ProductDetailView
              product={selectedPdpProduct}
              allProducts={products}
              cartQuantity={getCartQuantity(selectedPdpProduct.id)}
              onAddToCart={handleAddToCart}
              onUpdateQuantity={handleUpdateQuantity}
              onSelectProduct={setSelectedPdpProduct}
              onBack={() => setSelectedPdpProduct(null)}
              getCartQuantity={getCartQuantity}
            />
          ) : (
            /* 2B. EXACT BLINKIT CATALOG & CAROUSEL VIEW (Screenshot 1) */
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              
              {/* Category Filter Chips Bar */}
              <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
                {['All', 'Prescription Medicines', 'Antiseptics & First Aid', 'Skincare & Derma', 'Fever & Pain'].map(chip => (
                  <button
                    key={chip}
                    onClick={() => setActiveCategoryChip(chip)}
                    className={`category-chip ${activeCategoryChip === chip ? 'active' : ''}`}
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Active Order Live Tracking Banner (If any order is placed) */}
              {activeTrackOrder && (
                <div 
                  onClick={() => setShowTrackingModal(true)}
                  className="mb-8 bg-gradient-to-r from-emerald-950/80 via-zinc-900 to-zinc-900 border border-emerald-500/40 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:border-emerald-400 transition-all shadow-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <Bike className="w-5 h-5 animate-bounce" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-black text-sm">
                          Order {activeTrackOrder.orderCode} is Out for Delivery!
                        </span>
                        <span className="text-[10px] bg-emerald-500 text-black font-extrabold px-2 py-0.5 rounded-full">
                          9 MINS ETA
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Rider Vikas Pandey is on Golghar → Medical Road route • Delivery OTP: <strong className="text-white">{activeTrackOrder.deliveryOtp}</strong>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs bg-emerald-500/10 px-3 py-2 rounded-xl">
                    <span>Live Track</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              )}

              {/* SECTION 1: Top 10 products in this category (Screenshot 1 Match) */}
              <div className="mb-12">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-white text-lg sm:text-xl font-black tracking-tight">
                      Top products in this category
                    </h2>
                    <p className="text-xs text-[#a1a1aa] mt-0.5">
                      Fast 9-10 min delivery from verified Gorakhpur partner pharmacies
                    </p>
                  </div>
                  <button 
                    onClick={() => setActiveCategoryChip('All')}
                    className="text-emerald-400 text-xs font-bold hover:underline"
                  >
                    see all
                  </button>
                </div>

                {/* Horizontal Scrolling Carousel of Cards */}
                <div className="blinkit-carousel">
                  {filteredProducts.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      quantity={getCartQuantity(product.id)}
                      onAddToCart={handleAddToCart}
                      onUpdateQuantity={handleUpdateQuantity}
                      onSelectProduct={setSelectedPdpProduct}
                    />
                  ))}
                </div>
              </div>

              {/* SECTION 2: Everyday Pharmacy Essentials Grid */}
              <div className="mb-14">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-white text-lg sm:text-xl font-black tracking-tight">
                      {selectedDomain === 'human' ? 'Essential Healthcare & First Aid' : 'Veterinary Care & Supplements'}
                    </h2>
                    <p className="text-xs text-[#a1a1aa] mt-0.5">
                      Direct licensed pharmacy stock with batch & expiry protection
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {filteredProducts.map(product => (
                    <ProductCard
                      key={`grid-${product.id}`}
                      product={product}
                      quantity={getCartQuantity(product.id)}
                      onAddToCart={handleAddToCart}
                      onUpdateQuantity={handleUpdateQuantity}
                      onSelectProduct={setSelectedPdpProduct}
                    />
                  ))}
                </div>
              </div>

            </div>
          )}
        </main>
      ) : activeRole === 'pharmacy' ? (
        /* PHARMACY PARTNER CONSOLE */
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-6">
            <h2 className="text-xl font-black text-white mb-2">Gorakhpur Medicos & Veterinary Care</h2>
            <p className="text-xs text-zinc-400 mb-6">Licensed Partner Pharmacy Portal (Shop 14, Cinema Road, Golghar) • Licence: UP-GKP-20-847291</p>

            <h3 className="text-sm font-extrabold text-white mb-3">Incoming Orders for Fulfillment:</h3>
            <div className="space-y-3">
              {orders.map(o => (
                <div key={o.id} className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-white block text-sm">{o.orderCode} ({o.categoryDomain.toUpperCase()})</span>
                    <span className="text-xs text-zinc-400">Status: <strong className="text-emerald-400">{o.state}</strong> • Payment: {o.paymentMode || 'COD'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-white block">₹{o.payableAmount}</span>
                    <span className="text-[11px] text-zinc-400">OTP: {o.deliveryOtp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      ) : (
        /* ADMIN & COD RECONCILIATION STATION */
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-6">
            <h2 className="text-xl font-black text-white mb-2">Admin & Field COD Cash Reconciliation Station</h2>
            <p className="text-xs text-zinc-400 mb-6">Gorakhpur Dispatch Operations • Total Field Collections & SBI Bank Deposit Remittance</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                <span className="text-xs text-zinc-400 block mb-1">Total Doorstep COD Collected</span>
                <span className="text-2xl font-black text-emerald-400">
                  ₹{reconData?.collections ? reconData.collections.reduce((sum, c) => sum + c.amountCollected, 0).toFixed(2) : '485.00'}
                </span>
              </div>
              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                <span className="text-xs text-zinc-400 block mb-1">Total Remitted to Bank</span>
                <span className="text-2xl font-black text-white">
                  ₹{reconData?.settlements ? reconData.settlements.reduce((sum, s) => sum + s.amountDeposited, 0).toFixed(2) : '0.00'}
                </span>
              </div>
              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                <span className="text-xs text-zinc-400 block mb-1">Outstanding Rider Cash-in-Hand</span>
                <span className="text-2xl font-black text-amber-400">
                  ₹{reconData?.total_outstanding_cash?.toFixed(2) || '485.00'}
                </span>
              </div>
            </div>

            {/* Settle Form */}
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-3">Execute End-of-Day Bank Remittance</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="number"
                  value={settleAmount}
                  onChange={e => setSettleAmount(parseFloat(e.target.value) || 0)}
                  placeholder="Amount"
                  className="bg-zinc-800 border border-zinc-700 px-3 py-2 rounded-lg text-xs text-white"
                />
                <input
                  type="text"
                  value={settleRef}
                  onChange={e => setSettleRef(e.target.value)}
                  placeholder="Bank Deposit Ref"
                  className="bg-zinc-800 border border-zinc-700 px-3 py-2 rounded-lg text-xs text-white flex-1"
                />
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch(`${API_BASE}/admin/cod/settle`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ riderId: 'rider-1', amount: settleAmount, depositReference: settleRef })
                      });
                      const d = await res.json();
                      if (d.settlement) {
                        setSettleMessage(`Successfully deposited ₹${d.settlement.amount} (Ref: ${d.settlement.depositReference})`);
                        fetchReconciliation();
                      }
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold"
                >
                  Record Bank Deposit
                </button>
              </div>
              {settleMessage && <p className="text-xs text-emerald-400 font-bold mt-2">{settleMessage}</p>}
            </div>
          </div>
        </main>
      )}

      {/* 3. BLINKIT-STYLE PERSISTENT STICKY BOTTOM CART BAR */}
      {cartCount > 0 && !showCartDrawer && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-md">
          <div 
            onClick={() => setShowCartDrawer(true)}
            className="blinkit-bottom-cart-bar p-3.5 flex items-center justify-between cursor-pointer hover:brightness-105 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-black text-xs">
                {cartCount}
              </div>
              <div>
                <span className="font-extrabold text-sm block leading-tight">
                  ₹{cartSubtotal.toFixed(2)}
                </span>
                <span className="text-[11px] text-emerald-100 block">
                  {cartCount} {cartCount === 1 ? 'item' : 'items'} in cart
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wider bg-white text-[#0C831F] px-4 py-2 rounded-xl shadow-md">
              <span>View Cart</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      )}

      {/* 4. SLIDE-OUT CART DRAWER */}
      <CartDrawer
        isOpen={showCartDrawer}
        onClose={() => setShowCartDrawer(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onClearCart={() => setCart([])}
        paymentMode={paymentMode}
        onPaymentModeChange={setPaymentMode}
        hasPrescriptionRequiredItems={hasPrescriptionRequiredItems}
        uploadedRxId={uploadedRxId}
        onOpenOcr={() => setShowOcrModal(true)}
        onPlaceOrder={handlePlaceOrder}
        placingOrder={placingOrder}
      />

      {/* 5. ASSISTIVE OCR SCANNER MODAL */}
      <OcrModal
        isOpen={showOcrModal}
        onClose={() => setShowOcrModal(false)}
        onPrescriptionVerified={rxId => setUploadedRxId(rxId)}
        onAddProductById={prodId => {
          const p = products.find(prod => prod.id === prodId);
          if (p) handleAddToCart(p);
        }}
      />

      {/* 6. LIVE GORAKHPUR RIDER TELEMETRY MODAL */}
      <LiveTelemetryModal
        isOpen={showTrackingModal}
        onClose={() => setShowTrackingModal(false)}
        order={activeTrackOrder}
      />

      {/* 7. EXACT BLINKIT MULTI-COLUMN DARK FOOTER (Screenshot 1) */}
      <Footer />

    </div>
  );
}
