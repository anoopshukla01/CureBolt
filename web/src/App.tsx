import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Search, 
  ShoppingBag, 
  FileText, 
  CheckCircle, 
  Sparkles, 
  MapPin, 
  X,
  Plus,
  Minus,
  Stethoscope,
  Dog,
  RefreshCw,
  ChevronRight
} from 'lucide-react';
import { Product, CartItem, Order, HealthcareDomain } from './types';

const API_BASE = 'http://localhost:4000/api/v1';

export default function App() {
  // Navigation & Role State
  const [activeTab, setActiveTab] = useState<'customer' | 'pharmacy' | 'admin'>('customer');
  const [selectedDomain, setSelectedDomain] = useState<HealthcareDomain>('human');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAiDrawer, setShowAiDrawer] = useState(false);

  // Products & Cart
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [uploadedRxId, setUploadedRxId] = useState<string | null>(null);
  const [showRxModal, setShowRxModal] = useState(false);
  const [pendingRxProduct, setPendingRxProduct] = useState<Product | null>(null);

  // Active Orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTrackOrder, setActiveTrackOrder] = useState<Order | null>(null);

  // Pharmacy Modal State
  const [selectedRxReviewOrder, setSelectedRxReviewOrder] = useState<Order | null>(null);
  const [pharmacistRegNum, setPharmacistRegNum] = useState('UP-PCR-78421');
  const [pharmacistNotes, setPharmacistNotes] = useState('Dosage verified against council guidelines.');
  const [selectedPackOrder, setSelectedPackOrder] = useState<Order | null>(null);
  const [packBatchNum, setPackBatchNum] = useState('GLY-8490');
  const [packExpiry, setPackExpiry] = useState('2026-11-30');

  // AI Assistant State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiChatLogs, setAiChatLogs] = useState<{ sender: 'user' | 'bot'; text: string; disclaimer?: string; isSafetyAlert?: boolean }[]>([
    {
      sender: 'bot',
      text: 'Namaste! I am the Medcure Assistant for Gorakhpur. I can help you search in-stock human and veterinary products or check order status. (I cannot diagnose symptoms or recommend medicine doses).',
      disclaimer: 'Grounded ordering assistant.'
    }
  ]);
  const [aiLoading, setAiLoading] = useState(false);

  // Initial Data Fetch
  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch(`${API_BASE}/catalogue/products?domain=${selectedDomain}&query=${searchQuery}`);
      const data = await res.json();
      setProducts(data.items || []);
    } catch {
      const fallbackItems: Product[] = [
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
          available_quantity: 80,
          in_stock: true
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
          available_quantity: 30,
          in_stock: true,
          species_restrictions: [
            { speciesName: 'Cattle', withdrawalPeriodDays: 0, precautions: 'Nutritional supplement. Zero milk withdrawal.' },
            { speciesName: 'Buffalo', withdrawalPeriodDays: 0, precautions: 'Nutritional supplement. Zero milk withdrawal.' }
          ]
        },
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
          available_quantity: 60,
          in_stock: true,
          species_restrictions: [
            { speciesName: 'Canine', withdrawalPeriodDays: 0, precautions: 'Strictly for dogs. Not for human use.' }
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
          available_quantity: 25,
          in_stock: true,
          species_restrictions: [
            { speciesName: 'Bovine', withdrawalPeriodDays: 7, precautions: 'Milk withdrawal period: 7 days. Meat withdrawal: 28 days.' }
          ]
        }
      ];
      setProducts(fallbackItems.filter(p => p.category_domain === selectedDomain));
    } finally {
      setLoadingProducts(false);
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
    } catch {
      // Backend offline fallback handled silently
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedDomain, searchQuery]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 4000);
    return () => clearInterval(interval);
  }, []);

  // Cart Management
  const addToCart = (product: Product) => {
    if (product.requires_prescription && !uploadedRxId) {
      setPendingRxProduct(product);
      setShowRxModal(true);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.product.selling_price * item.quantity), 0);
  const cartDeliveryFee = cartSubtotal > 500 || cartSubtotal === 0 ? 0 : 25;
  const cartTaxes = Number((cartSubtotal * 0.05).toFixed(2));
  const cartTotal = Number((cartSubtotal + cartDeliveryFee + cartTaxes).toFixed(2));
  const hasRxItem = cart.some(item => item.product.requires_prescription);

  // Upload Prescription Mock Handler
  const handleUploadPrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/prescriptions/upload-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'usr-cust-1',
          fileName: 'prescription_rx_gorakhpur.jpg',
          doctorName: 'Dr. R.K. Sharma, BRD Medical College'
        })
      });
      const data = await res.json();
      setUploadedRxId(data.prescription_id || `rx-${Date.now()}`);
      setShowRxModal(false);

      if (pendingRxProduct) {
        setCart(prev => [...prev, { product: pendingRxProduct, quantity: 1 }]);
        setPendingRxProduct(null);
      }
    } catch {
      setUploadedRxId(`rx-${Date.now()}`);
      setShowRxModal(false);
      if (pendingRxProduct) {
        setCart(prev => [...prev, { product: pendingRxProduct, quantity: 1 }]);
        setPendingRxProduct(null);
      }
    }
  };

  // Checkout Handler
  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;

    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'usr-cust-1',
          pharmacyId: 'pharm-gkp-1',
          deliveryAddressId: 'addr-cust-1',
          categoryDomain: selectedDomain,
          items: cart.map(i => ({ productId: i.product.id, quantity: i.quantity })),
          prescriptionId: uploadedRxId || undefined
        })
      });
      const data = await res.json();
      if (data.order) {
        setOrders(prev => [data.order, ...prev]);
        setActiveTrackOrder(data.order);
        setCart([]);
        setShowCartDrawer(false);
      }
    } catch {
      alert('Order placed in demo offline mode.');
    }
  };

  // Pharmacist Review Handler
  const handleReviewRx = async (decision: 'approved' | 'rejected') => {
    if (!selectedRxReviewOrder) return;
    try {
      const res = await fetch(`${API_BASE}/pharmacy/orders/${selectedRxReviewOrder.id}/review-prescription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pharmacistId: 'usr-pharma-1',
          pharmacistRegNumber: pharmacistRegNum,
          decision,
          notes: pharmacistNotes
        })
      });
      const data = await res.json();
      if (data.order) {
        setOrders(prev => prev.map(o => o.id === data.order.id ? data.order : o));
        if (activeTrackOrder?.id === data.order.id) {
          setActiveTrackOrder(data.order);
        }
      }
      setSelectedRxReviewOrder(null);
    } catch {
      alert('Review action recorded.');
      setSelectedRxReviewOrder(null);
    }
  };

  // Pack Order Handler
  const handlePackOrder = async () => {
    if (!selectedPackOrder) return;
    try {
      const res = await fetch(`${API_BASE}/pharmacy/orders/${selectedPackOrder.id}/pack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: 'usr-staff-1',
          batchAllocations: selectedPackOrder.items.map(i => ({
            productId: i.productId,
            batchNumber: packBatchNum,
            expiryDate: packExpiry
          }))
        })
      });
      const data = await res.json();
      if (data.order) {
        setOrders(prev => prev.map(o => o.id === data.order.id ? data.order : o));
        if (activeTrackOrder?.id === data.order.id) {
          setActiveTrackOrder(data.order);
        }
      }
      setSelectedPackOrder(null);
    } catch {
      setSelectedPackOrder(null);
    }
  };

  // Delivery Advance Simulation
  const handleAdvanceDelivery = async (orderId: string, currentStep: string) => {
    try {
      if (currentStep === 'PACKED') {
        await fetch(`${API_BASE}/dispatch/assign-rider`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, riderId: 'usr-rider-1' })
        });
        fetchOrders();
      } else if (currentStep === 'RIDER_ASSIGNED') {
        await fetch(`${API_BASE}/rider/orders/${orderId}/pickup`, { method: 'POST' });
        fetchOrders();
      } else if (currentStep === 'OUT_FOR_DELIVERY') {
        const ord = orders.find(o => o.id === orderId);
        if (ord) {
          await fetch(`${API_BASE}/rider/orders/${orderId}/complete-delivery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deliveryOtp: ord.deliveryOtp })
          });
          fetchOrders();
        }
      }
    } catch {
      fetchOrders();
    }
  };

  // AI Assistant Chat Handler
  const handleSendAiPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    const userText = aiPrompt;
    setAiChatLogs(prev => [...prev, { sender: 'user', text: userText }]);
    setAiPrompt('');
    setAiLoading(true);

    try {
      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userText, userId: 'usr-cust-1' })
      });
      const data = await res.json();
      setAiChatLogs(prev => [
        ...prev,
        {
          sender: 'bot',
          text: data.message,
          disclaimer: data.disclaimer,
          isSafetyAlert: data.escalateToHumanSupport
        }
      ]);
    } catch {
      setAiChatLogs(prev => [
        ...prev,
        {
          sender: 'bot',
          text: 'Medcure Assistant is functioning in local protected mode.',
          disclaimer: 'Offline safety fallback.'
        }
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* TOP PILOT BANNER (Clay Capsule Pill) */}
      <div style={{ padding: '8px 24px', display: 'flex', justifyContent: 'center' }}>
        <div 
          style={{ 
            background: 'linear-gradient(135deg, #0B192C, #1E3E62)', 
            color: '#94A3B8', 
            fontSize: '12px', 
            padding: '7px 22px', 
            borderRadius: '9999px',
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px',
            boxShadow: '4px 6px 16px rgba(11, 25, 44, 0.2), inset 1px 1px 2px rgba(255,255,255,0.2)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', boxShadow: '0 0 8px #10B981' }}></span>
            <span style={{ color: '#F1F5F9', fontWeight: 700 }}>GORAKHPUR PILOT HUB:</span>
            <span>Golghar & Medical College Zones</span>
          </div>
          <span style={{ color: '#475569' }}>•</span>
          <span style={{ color: '#E2E8F0', fontWeight: 600 }}>Zero Warehouse Model (Partner Dispensing)</span>
          <span style={{ color: '#475569' }}>•</span>
          <span style={{ color: '#38BDF8' }}>Drugs & Cosmetics Act 1940</span>
        </div>
      </div>

      {/* CLAYMORPHIC MAIN HEADER */}
      <header 
        style={{ 
          margin: '4px 20px 16px 20px',
          padding: '12px 24px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          borderRadius: '26px',
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1.5px solid rgba(255, 255, 255, 0.8)',
          boxShadow: '6px 12px 28px rgba(11, 25, 44, 0.06), -3px -3px 10px rgba(255, 255, 255, 0.95), inset 2px 2px 4px rgba(255, 255, 255, 0.9)',
          position: 'sticky', 
          top: 8, 
          zIndex: 30 
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          {/* LOGO */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setActiveTab('customer')}>
            <div 
              className="clay-icon-circle"
              style={{ 
                background: 'linear-gradient(135deg, #0294A3, #017380)',
                color: '#FFF'
              }}
            >
              <ShieldCheck size={26} />
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#0B192C', letterSpacing: '-0.03em' }}>
                Med<span style={{ color: '#028391' }}>cure</span>
              </div>
              <div style={{ fontSize: '10px', color: '#5B6B7C', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                Blinkit-Style Medicine Delivery
              </div>
            </div>
          </div>

          {/* GORAKHPUR SERVICE PILL */}
          <div 
            className="clay-pill clay-pill-otc"
            style={{ padding: '6px 14px', fontSize: '12px' }}
          >
            <MapPin size={15} />
            <span>Gorakhpur Central (273001)</span>
            <span style={{ opacity: 0.6 }}>• 10-15m</span>
          </div>
        </div>

        {/* CLAY NAV TABS */}
        <div className="clay-nav-container">
          <button
            onClick={() => setActiveTab('customer')}
            className={`clay-nav-tab ${activeTab === 'customer' ? 'active' : ''}`}
          >
            🛍️ Customer Store
          </button>
          <button
            onClick={() => setActiveTab('pharmacy')}
            className={`clay-nav-tab ${activeTab === 'pharmacy' ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            🏥 Pharmacy Portal
            {orders.filter(o => o.state === 'PHARMACY_REVIEW').length > 0 && (
              <span 
                style={{ 
                  backgroundColor: '#EF4444', 
                  color: '#FFF', 
                  fontSize: '10px', 
                  padding: '2px 7px', 
                  borderRadius: '9999px', 
                  fontWeight: 800,
                  boxShadow: '0 2px 5px rgba(239, 68, 68, 0.4)'
                }}
              >
                {orders.filter(o => o.state === 'PHARMACY_REVIEW').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`clay-nav-tab ${activeTab === 'admin' ? 'active' : ''}`}
          >
            🛡️ Admin & Dispatch
          </button>
        </div>

        {/* CLAY ACTIONS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setShowAiDrawer(true)}
            className="clay-btn-white"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              fontSize: '13px',
              color: '#1D4ED8'
            }}
          >
            <Sparkles size={16} color="#2563EB" />
            AI Assistant
          </button>

          <button
            onClick={() => setShowCartDrawer(true)}
            className="clay-btn-teal"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 18px',
              fontSize: '14px'
            }}
          >
            <ShoppingBag size={18} />
            <span>₹{cartTotal.toFixed(2)}</span>
            {cart.length > 0 && (
              <span 
                style={{ 
                  backgroundColor: '#FFFFFF', 
                  color: '#028391', 
                  borderRadius: '9999px', 
                  padding: '2px 8px', 
                  fontSize: '11px', 
                  fontWeight: 800,
                  boxShadow: '1px 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* =====================================================================
          TAB 1: CUSTOMER QUICK-COMMERCE PORTAL
          ===================================================================== */}
      {activeTab === 'customer' && (
        <main style={{ maxWidth: '1240px', margin: '0 auto', padding: '12px 20px 40px 20px', width: '100%', flex: 1 }}>
          
          {/* HERO DUAL SECTOR SELECTION (Big Tactile Clay Cards) */}
          <div style={{ marginBottom: '28px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* HUMAN HEALTHCARE CARD */}
            <div
              onClick={() => setSelectedDomain('human')}
              className={selectedDomain === 'human' ? 'clay-human-card' : 'clay-card'}
              style={{
                padding: '24px',
                cursor: 'pointer',
                position: 'relative',
                transform: selectedDomain === 'human' ? 'scale(1.01)' : 'scale(1)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div 
                  className="clay-icon-circle"
                  style={{ 
                    background: 'linear-gradient(135deg, #0284C7, #0369A1)',
                    color: '#FFF'
                  }}
                >
                  <Stethoscope size={28} />
                </div>
                {selectedDomain === 'human' ? (
                  <span className="clay-pill clay-pill-state">
                    ✓ Active Store
                  </span>
                ) : (
                  <span className="clay-pill" style={{ background: '#F1F5F9', color: '#64748B' }}>
                    Click to Open
                  </span>
                )}
              </div>

              <div>
                <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#0B192C', marginBottom: '4px' }}>
                  Human Healthcare
                </h3>
                <p style={{ fontSize: '13px', color: '#5B6B7C', lineHeight: 1.4, marginBottom: '14px' }}>
                  Prescription medicines, fever relief, diabetes care, baby essentials, and surgical supplies.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0284C7', fontWeight: 700, fontSize: '13px' }}>
                  <span>Browse Human Formulary</span>
                  <ChevronRight size={16} />
                </div>
              </div>
            </div>

            {/* VETERINARY HEALTHCARE CARD */}
            <div
              onClick={() => setSelectedDomain('veterinary')}
              className={selectedDomain === 'veterinary' ? 'clay-vet-card' : 'clay-card'}
              style={{
                padding: '24px',
                cursor: 'pointer',
                position: 'relative',
                transform: selectedDomain === 'veterinary' ? 'scale(1.01)' : 'scale(1)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div 
                  className="clay-icon-circle"
                  style={{ 
                    background: 'linear-gradient(135deg, #10B981, #047857)',
                    color: '#FFF'
                  }}
                >
                  <Dog size={28} />
                </div>
                {selectedDomain === 'veterinary' ? (
                  <span className="clay-pill clay-pill-vet">
                    ✓ Active Store
                  </span>
                ) : (
                  <span className="clay-pill" style={{ background: '#F1F5F9', color: '#64748B' }}>
                    Click to Open
                  </span>
                )}
              </div>

              <div>
                <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#0B192C', marginBottom: '4px' }}>
                  Animal Healthcare (Veterinary)
                </h3>
                <p style={{ fontSize: '13px', color: '#5B6B7C', lineHeight: 1.4, marginBottom: '14px' }}>
                  Cattle & livestock calcium tonics, pet dewormers, veterinary bolus with milk/meat withdrawal warnings.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#15803D', fontWeight: 700, fontSize: '13px' }}>
                  <span>Browse Veterinary Formulary</span>
                  <ChevronRight size={16} />
                </div>
              </div>
            </div>
          </div>

          {/* SEARCH & PRESCRIPTION ATTACHMENT BAR */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '26px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder={selectedDomain === 'human' ? "Search human medicines (e.g. Metformin, Paracetamol, Dolo 650)..." : "Search veterinary items (e.g. HimCal, Dewormer, Cattle tonic)..."}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="clay-input"
                style={{ width: '100%', paddingLeft: '48px', height: '52px', fontSize: '15px' }}
              />
            </div>

            {uploadedRxId ? (
              <div 
                className="clay-card"
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 20px', color: '#047857', fontSize: '13px', fontWeight: 700, background: '#ECFDF5' }}
              >
                <CheckCircle size={18} color="#059669" />
                Prescription Attached ({uploadedRxId})
              </div>
            ) : (
              <button
                onClick={() => setShowRxModal(true)}
                className="clay-btn-white"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0 22px',
                  height: '52px',
                  fontSize: '14px'
                }}
              >
                <FileText size={18} color="#028391" />
                Upload Prescription
              </button>
            )}
          </div>

          {/* ACTIVE ORDER TRACKER TIMELINE (CLAY CARD) */}
          {activeTrackOrder && (
            <div 
              className="clay-card" 
              style={{ padding: '24px', marginBottom: '32px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <span className="clay-pill clay-pill-state" style={{ marginBottom: '6px' }}>
                    LIVE ORDER STATUS
                  </span>
                  <h4 style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px' }}>
                    Order {activeTrackOrder.orderCode}
                  </h4>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div 
                    style={{ 
                      background: '#F1F5F9', 
                      borderRadius: '14px', 
                      padding: '8px 16px', 
                      boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.06)' 
                    }}
                  >
                    <span style={{ fontSize: '12px', color: '#64748B' }}>Handshake OTP: </span>
                    <strong style={{ color: '#028391', fontSize: '16px', letterSpacing: '1px' }}>
                      {activeTrackOrder.deliveryOtp}
                    </strong>
                  </div>
                  <span className="clay-pill clay-pill-rx">{activeTrackOrder.state}</span>
                </div>
              </div>

              {/* TACTILE PROGRESS TIMELINE */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
                {[
                  { key: 'PHARMACY_REVIEW', label: '1. Rx Review' },
                  { key: 'ACCEPTED', label: '2. Accepted' },
                  { key: 'PACKED', label: '3. Packed' },
                  { key: 'OUT_FOR_DELIVERY', label: '4. Out for Delivery' },
                  { key: 'DELIVERED', label: '5. Delivered' }
                ].map((step, idx) => {
                  const stateHierarchy = ['CREATED', 'PAYMENT_PENDING', 'PHARMACY_REVIEW', 'ACCEPTED', 'PAYMENT_CONFIRMED', 'PACKING', 'PACKED', 'RIDER_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'];
                  const currentIndex = stateHierarchy.indexOf(activeTrackOrder.state);
                  const stepIndex = stateHierarchy.indexOf(step.key);
                  const isDone = currentIndex >= stepIndex;
                  const isCurrent = activeTrackOrder.state === step.key;

                  return (
                    <div 
                      key={idx} 
                      className="clay-timeline-step"
                      style={{ 
                        textAlign: 'center', 
                        background: isCurrent ? '#EFF6FF' : isDone ? '#F0FDF4' : '#FFFFFF',
                        border: isCurrent ? '2px solid #93C5FD' : isDone ? '1.5px solid #86EFAC' : '1px solid #E2E8F0'
                      }}
                    >
                      <div style={{ fontSize: '13px', fontWeight: 800, color: isCurrent ? '#1D4ED8' : isDone ? '#15803D' : '#94A3B8' }}>
                        {step.label}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B', marginTop: '3px' }}>
                        {isDone ? '✓ Verified' : 'In Progress'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CATALOGUE SECTION HEADER */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 800 }}>
                {selectedDomain === 'human' ? 'Approved Human Healthcare Catalogue' : 'Veterinary & Livestock Formulations'}
              </h3>
              <p style={{ fontSize: '13px', color: '#5B6B7C' }}>
                Dispensed from verified partner stores in Gorakhpur
              </p>
            </div>
            <span className="clay-pill clay-pill-otc">
              {products.length} Products Available
            </span>
          </div>

          {loadingProducts && (
            <div style={{ textAlign: 'center', padding: '36px', color: '#64748B', fontSize: '15px' }}>
              Verifying live Gorakhpur partner pharmacy stock...
            </div>
          )}

          {/* PRODUCT CARDS (CLAYMORPHISM) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
            {products.map(product => {
              const inCart = cart.find(c => c.product.id === product.id);

              return (
                <div
                  key={product.id}
                  className="clay-card"
                  style={{
                    padding: '22px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    {/* CLAY BADGES */}
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                      {product.requires_prescription ? (
                        <span className="clay-pill clay-pill-rx">Rx Required</span>
                      ) : (
                        <span className="clay-pill clay-pill-otc">OTC Available</span>
                      )}
                      <span className="clay-pill" style={{ background: '#F1F5F9', color: '#475569' }}>
                        {product.schedule_type}
                      </span>
                      {product.category_domain === 'veterinary' && (
                        <span className="clay-pill clay-pill-vet">Animal Care</span>
                      )}
                    </div>

                    <h4 style={{ fontSize: '17px', fontWeight: 800, marginBottom: '6px', color: '#0B192C' }}>
                      {product.name}
                    </h4>

                    {product.generic_salt_name && (
                      <div style={{ fontSize: '12px', color: '#028391', fontWeight: 700, marginBottom: '6px' }}>
                        {product.generic_salt_name}
                      </div>
                    )}

                    <div style={{ fontSize: '12px', color: '#5B6B7C', marginBottom: '12px' }}>
                      {product.pack_size} • {product.manufacturer}
                    </div>

                    {/* VETERINARY WITHDRAWAL WARNINGS */}
                    {product.species_restrictions && product.species_restrictions.length > 0 && (
                      <div 
                        style={{ 
                          background: 'linear-gradient(135deg, #FEF3C7, #FFFBEB)', 
                          border: '1px solid #FCD34D', 
                          padding: '10px 12px', 
                          borderRadius: '12px', 
                          fontSize: '11px', 
                          color: '#92400E', 
                          marginBottom: '16px',
                          boxShadow: 'inset 1px 1px 2px rgba(255,255,255,0.8)'
                        }}
                      >
                        <strong>Target Species:</strong> {product.species_restrictions.map(s => s.speciesName).join(', ')}
                        {product.species_restrictions[0].withdrawalPeriodDays > 0 && (
                          <div style={{ marginTop: '2px', fontWeight: 700 }}>
                            ⚠️ Meat/Milk Withdrawal: {product.species_restrictions[0].withdrawalPeriodDays} Days
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* PRICE & ADD TO CART */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid #F1F5F9' }}>
                    <div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#0B192C' }}>
                        ₹{product.selling_price.toFixed(2)}
                      </div>
                      {product.mrp > product.selling_price && (
                        <div style={{ fontSize: '12px', color: '#94A3B8', textDecoration: 'line-through' }}>
                          MRP ₹{product.mrp.toFixed(2)}
                        </div>
                      )}
                    </div>

                    {inCart ? (
                      <div 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '10px', 
                          background: 'linear-gradient(145deg, #0294A3, #017380)', 
                          borderRadius: '14px', 
                          padding: '6px 12px', 
                          color: '#FFF',
                          boxShadow: '3px 5px 12px rgba(2, 131, 145, 0.3)'
                        }}
                      >
                        <button onClick={() => updateQuantity(product.id, -1)} style={{ background: 'transparent', color: '#FFF' }}>
                          <Minus size={15} />
                        </button>
                        <span style={{ fontSize: '14px', fontWeight: 800 }}>{inCart.quantity}</span>
                        <button onClick={() => updateQuantity(product.id, 1)} style={{ background: 'transparent', color: '#FFF' }}>
                          <Plus size={15} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(product)}
                        className="clay-btn-teal"
                        style={{
                          padding: '10px 20px',
                          fontSize: '13px'
                        }}
                      >
                        + Add to Cart
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      )}

      {/* =====================================================================
          TAB 2: PHARMACY PARTNER PORTAL
          ===================================================================== */}
      {activeTab === 'pharmacy' && (
        <main style={{ maxWidth: '1240px', margin: '0 auto', padding: '16px 20px 40px 20px', width: '100%', flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <span className="clay-pill clay-pill-otc" style={{ marginBottom: '8px' }}>
                LICENSED PARTNER DISPENSARY
              </span>
              <h2 style={{ fontSize: '26px', fontWeight: 800 }}>Gorakhpur Medicos & Veterinary Care</h2>
              <p style={{ fontSize: '13px', color: '#5B6B7C' }}>
                Licence: Form 20/21 (UP-GKP-20-847291) • Cinema Road, Golghar Market
              </p>
            </div>
            <button
              onClick={fetchOrders}
              className="clay-btn-white"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '13px' }}
            >
              <RefreshCw size={16} /> Refresh Dispensing Stream
            </button>
          </div>

          {/* INCOMING QUEUE (CLAY CONTAINER) */}
          <div className="clay-card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Incoming Orders & Prescription Verification</h3>
              <span className="clay-pill clay-pill-state">{orders.length} Active Orders</span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: 700 }}>
                    <th style={{ padding: '14px 22px' }}>Order Code</th>
                    <th style={{ padding: '14px 22px' }}>Sector</th>
                    <th style={{ padding: '14px 22px' }}>Items & Strength</th>
                    <th style={{ padding: '14px 22px' }}>State Machine</th>
                    <th style={{ padding: '14px 22px' }}>OTP Code</th>
                    <th style={{ padding: '14px 22px' }}>Verification Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '16px 22px', fontWeight: 800, color: '#0B192C' }}>
                        {order.orderCode}
                      </td>
                      <td style={{ padding: '16px 22px' }}>
                        {order.categoryDomain === 'human' ? (
                          <span className="clay-pill clay-pill-otc">Human</span>
                        ) : (
                          <span className="clay-pill clay-pill-vet">Veterinary</span>
                        )}
                      </td>
                      <td style={{ padding: '16px 22px' }}>
                        {order.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')}
                      </td>
                      <td style={{ padding: '16px 22px' }}>
                        <span className="clay-pill clay-pill-state">{order.state}</span>
                      </td>
                      <td style={{ padding: '16px 22px', fontWeight: 800, color: '#028391' }}>
                        {order.deliveryOtp}
                      </td>
                      <td style={{ padding: '16px 22px' }}>
                        {order.state === 'PHARMACY_REVIEW' && (
                          <button
                            onClick={() => setSelectedRxReviewOrder(order)}
                            className="clay-btn-teal"
                            style={{ padding: '8px 16px', fontSize: '12px' }}
                          >
                            Review Prescription
                          </button>
                        )}
                        {(order.state === 'PAYMENT_CONFIRMED' || order.state === 'ACCEPTED') && (
                          <button
                            onClick={() => setSelectedPackOrder(order)}
                            className="clay-btn-white"
                            style={{ padding: '8px 16px', fontSize: '12px', color: '#0F766E' }}
                          >
                            Assign Batch & Pack
                          </button>
                        )}
                        {order.state === 'PACKED' && (
                          <button
                            onClick={() => handleAdvanceDelivery(order.id, 'PACKED')}
                            className="clay-btn-teal"
                            style={{ padding: '8px 16px', fontSize: '12px', background: '#2563EB' }}
                          >
                            Assign Rider
                          </button>
                        )}
                        {order.state === 'RIDER_ASSIGNED' && (
                          <button
                            onClick={() => handleAdvanceDelivery(order.id, 'RIDER_ASSIGNED')}
                            className="clay-btn-teal"
                            style={{ padding: '8px 16px', fontSize: '12px', background: '#D97706' }}
                          >
                            Handover to Rider
                          </button>
                        )}
                        {order.state === 'OUT_FOR_DELIVERY' && (
                          <button
                            onClick={() => handleAdvanceDelivery(order.id, 'OUT_FOR_DELIVERY')}
                            className="clay-btn-teal"
                            style={{ padding: '8px 16px', fontSize: '12px', background: '#16A34A' }}
                          >
                            Simulate Customer OTP
                          </button>
                        )}
                        {order.state === 'DELIVERED' && (
                          <span style={{ color: '#16A34A', fontWeight: 800, fontSize: '12px' }}>
                            ✓ Handed Over & Closed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      )}

      {/* =====================================================================
          TAB 3: ADMIN & DISPATCH CONSOLE
          ===================================================================== */}
      {activeTab === 'admin' && (
        <main style={{ maxWidth: '1240px', margin: '0 auto', padding: '16px 20px 40px 20px', width: '100%', flex: 1 }}>
          <h2 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '24px' }}>
            Platform Administrative & Dispatch Station
          </h2>

          {/* CLAY KPI CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '28px' }}>
            <div className="clay-card" style={{ padding: '22px' }}>
              <div style={{ fontSize: '11px', color: '#5B6B7C', fontWeight: 800, textTransform: 'uppercase' }}>PILOT MUNICIPALITY</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#0B192C', marginTop: '4px' }}>Gorakhpur, UP</div>
              <div style={{ fontSize: '12px', color: '#16A34A', marginTop: '4px', fontWeight: 700 }}>● Urban Boundary Active</div>
            </div>
            <div className="clay-card" style={{ padding: '22px' }}>
              <div style={{ fontSize: '11px', color: '#5B6B7C', fontWeight: 800, textTransform: 'uppercase' }}>PARTNER PHARMACIES</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#0B192C', marginTop: '4px' }}>2 Verified</div>
              <div style={{ fontSize: '12px', color: '#028391', marginTop: '4px', fontWeight: 700 }}>Golghar & BRD Road</div>
            </div>
            <div className="clay-card" style={{ padding: '22px' }}>
              <div style={{ fontSize: '11px', color: '#5B6B7C', fontWeight: 800, textTransform: 'uppercase' }}>ORDERS IN ENGINE</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#0B192C', marginTop: '4px' }}>{orders.length} Total</div>
              <div style={{ fontSize: '12px', color: '#5B6B7C', marginTop: '4px', fontWeight: 600 }}>Zero Over-Allocation</div>
            </div>
            <div className="clay-card" style={{ padding: '22px' }}>
              <div style={{ fontSize: '11px', color: '#5B6B7C', fontWeight: 800, textTransform: 'uppercase' }}>DPDP ACT SECURITY</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#16A34A', marginTop: '4px' }}>100% Enforced</div>
              <div style={{ fontSize: '12px', color: '#5B6B7C', marginTop: '4px', fontWeight: 600 }}>Private SAS Vault</div>
            </div>
          </div>

          {/* AUDIT LOG IN CLAY CARD */}
          <div className="clay-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>
              Statutory Dispensing Audit & Chain of Custody
            </h3>
            <p style={{ fontSize: '13px', color: '#5B6B7C', marginBottom: '16px' }}>
              Under the Drugs & Cosmetics Act 1940, all Schedule H dispensing actions require human pharmacist council verification.
            </p>
            <div 
              style={{ 
                background: '#F1F5F9', 
                padding: '16px', 
                borderRadius: '16px', 
                fontFamily: 'monospace', 
                fontSize: '12px', 
                color: '#334155',
                boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.06)'
              }}
            >
              <div>[COMPLIANCE] Registered Pharmacist UP-PCR-78421 verified batch allocation and prescription signature.</div>
              <div>[PRIVACY] Private 15-minute SAS token generated for customer prescription. Rider view sanitized.</div>
              <div>[GEO] Delivery address confirmed inside Gorakhpur urban boundary polygon (lat: 26.7606, lng: 83.3732).</div>
            </div>
          </div>
        </main>
      )}

      {/* =====================================================================
          PRESCRIPTION UPLOAD MODAL (CLAYMORPHISM)
          ===================================================================== */}
      {showRxModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(11,25,44,0.45)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
          <div 
            className="clay-card" 
            style={{ maxWidth: '500px', width: '90%', padding: '28px', border: '2px solid rgba(255,255,255,0.9)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800 }}>Upload Prescription</h3>
              <button onClick={() => setShowRxModal(false)} style={{ background: 'transparent', color: '#64748B' }}>
                <X size={22} />
              </button>
            </div>

            <div 
              style={{ 
                background: '#EFF6FF', 
                border: '1px solid #BFDBFE', 
                borderRadius: '14px', 
                padding: '12px 14px', 
                fontSize: '12px', 
                color: '#1E40AF', 
                marginBottom: '18px',
                boxShadow: 'inset 1px 1px 2px rgba(255,255,255,0.8)'
              }}
            >
              <strong>Regulatory Rule:</strong> Schedule H human and veterinary drugs require human pharmacist approval before dispensing. AI models never approve prescriptions.
            </div>

            <form onSubmit={handleUploadPrescription}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Doctor or Registered Vet Name</label>
                <input type="text" defaultValue="Dr. R.K. Sharma, BRD Medical College" className="clay-input" style={{ width: '100%' }} required />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Prescription Document (JPG/PNG/PDF)</label>
                <div 
                  style={{ 
                    border: '2px dashed #CBD5E1', 
                    borderRadius: '16px', 
                    padding: '24px', 
                    textAlign: 'center', 
                    background: '#F8FAFC',
                    boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.03)'
                  }}
                >
                  <FileText size={36} color="#028391" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>dr_sharma_rx_gorakhpur.jpg</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Mock test file selected (Encrypted Vault Upload)</div>
                </div>
              </div>

              <button
                type="submit"
                className="clay-btn-teal"
                style={{ width: '100%', padding: '14px', fontSize: '15px' }}
              >
                Upload & Attach to Order
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          PHARMACIST PRESCRIPTION REVIEW MODAL (CLAYMORPHISM)
          ===================================================================== */}
      {selectedRxReviewOrder && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(11,25,44,0.45)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
          <div 
            className="clay-card" 
            style={{ maxWidth: '540px', width: '90%', padding: '28px', border: '2px solid rgba(255,255,255,0.9)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800 }}>Dispensing Pharmacist Verification</h3>
              <button onClick={() => setSelectedRxReviewOrder(null)} style={{ background: 'transparent', color: '#64748B' }}>
                <X size={22} />
              </button>
            </div>

            <div 
              style={{ 
                background: '#F8FAFC', 
                border: '1px solid #E2E8F0', 
                borderRadius: '14px', 
                padding: '14px', 
                marginBottom: '18px', 
                fontSize: '13px',
                boxShadow: 'inset 1px 1px 3px rgba(0,0,0,0.04)'
              }}
            >
              <div><strong>Order Reference:</strong> {selectedRxReviewOrder.orderCode}</div>
              <div><strong>Patient/User:</strong> Pooja Srivastava (Park Road, Gorakhpur)</div>
              <div><strong>Prescribed Drugs:</strong> {selectedRxReviewOrder.items.map(i => `${i.productName} (Qty: ${i.quantity})`).join(', ')}</div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>State Pharmacy Council Registration #</label>
              <input
                type="text"
                value={pharmacistRegNum}
                onChange={e => setPharmacistRegNum(e.target.value)}
                className="clay-input"
                style={{ width: '100%' }}
                required
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Pharmacist Verification Notes</label>
              <textarea
                value={pharmacistNotes}
                onChange={e => setPharmacistNotes(e.target.value)}
                className="clay-input"
                style={{ width: '100%', height: '70px', borderRadius: '14px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '14px' }}>
              <button
                onClick={() => handleReviewRx('rejected')}
                className="clay-btn-white"
                style={{ flex: 1, padding: '12px', color: '#B91C1C' }}
              >
                Reject Order
              </button>
              <button
                onClick={() => handleReviewRx('approved')}
                className="clay-btn-teal"
                style={{ flex: 1, padding: '12px' }}
              >
                Approve & Dispense
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          BATCH ALLOCATION & PACK MODAL (CLAYMORPHISM)
          ===================================================================== */}
      {selectedPackOrder && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(11,25,44,0.45)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
          <div 
            className="clay-card" 
            style={{ maxWidth: '500px', width: '90%', padding: '28px', border: '2px solid rgba(255,255,255,0.9)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800 }}>Physical Batch & Expiry Allocation</h3>
              <button onClick={() => setSelectedPackOrder(null)} style={{ background: 'transparent', color: '#64748B' }}>
                <X size={22} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#5B6B7C', marginBottom: '18px' }}>
              Verify the physical manufacturer batch printed on the product packaging before sealing the tamper-evident delivery pouch.
            </p>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Assigned Batch Number</label>
              <input
                type="text"
                value={packBatchNum}
                onChange={e => setPackBatchNum(e.target.value)}
                className="clay-input"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Expiry Date</label>
              <input
                type="date"
                value={packExpiry}
                onChange={e => setPackExpiry(e.target.value)}
                className="clay-input"
                style={{ width: '100%' }}
              />
            </div>

            <button
              onClick={handlePackOrder}
              className="clay-btn-teal"
              style={{ width: '100%', padding: '14px', fontSize: '15px', background: 'linear-gradient(145deg, #0D9488, #0F766E)' }}
            >
              Seal Tamper-Evident Bag & Mark Packed
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          CART SLIDE-OVER DRAWER (CLAYMORPHISM)
          ===================================================================== */}
      {showCartDrawer && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', justifyContent: 'flex-end', backgroundColor: 'rgba(11,25,44,0.45)', backdropFilter: 'blur(6px)' }}>
          <div 
            style={{ 
              width: '100%', 
              maxWidth: '440px', 
              background: '#FFFFFF', 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              boxShadow: '-10px 0 30px rgba(11,25,44,0.15)',
              borderLeft: '2px solid rgba(255,255,255,0.8)'
            }}
          >
            <div style={{ padding: '22px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800 }}>Order Cart ({cart.length})</h3>
              <button onClick={() => setShowCartDrawer(false)} style={{ background: 'transparent', color: '#64748B' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '22px' }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#94A3B8' }}>
                  <ShoppingBag size={52} style={{ margin: '0 auto 12px', color: '#CBD5E1' }} />
                  <p style={{ fontWeight: 600 }}>Your cart is empty.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {cart.map(item => (
                    <div 
                      key={item.product.id} 
                      className="clay-card"
                      style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '15px', fontWeight: 800 }}>{item.product.name}</div>
                        <div style={{ fontSize: '13px', color: '#64748B' }}>₹{item.product.selling_price.toFixed(2)} each</div>
                        {item.product.requires_prescription && (
                          <span className="clay-pill clay-pill-rx" style={{ marginTop: '4px' }}>Rx Mandatory</span>
                        )}
                      </div>
                      <div 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px', 
                          background: '#F1F5F9', 
                          borderRadius: '12px', 
                          padding: '6px 10px',
                          boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.06)'
                        }}
                      >
                        <button onClick={() => updateQuantity(item.product.id, -1)} style={{ background: 'transparent' }}><Minus size={14} /></button>
                        <span style={{ fontSize: '14px', fontWeight: 800 }}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product.id, 1)} style={{ background: 'transparent' }}><Plus size={14} /></button>
                      </div>
                    </div>
                  ))}

                  {/* PRESCRIPTION WARNING NOTICE */}
                  {hasRxItem && (
                    <div 
                      style={{ 
                        background: '#FEF2F2', 
                        border: '1.5px solid #FCA5A5', 
                        padding: '12px 14px', 
                        borderRadius: '14px', 
                        fontSize: '12px', 
                        color: '#991B1B', 
                        marginTop: '8px',
                        boxShadow: 'inset 1px 1px 2px rgba(255,255,255,0.8)'
                      }}
                    >
                      ⚠️ <strong>Prescription Required:</strong> Your cart contains Schedule H / restricted animal healthcare items. A registered pharmacist will review your prescription before dispatch.
                    </div>
                  )}

                  {/* CLAY BILL BREAKDOWN */}
                  <div 
                    style={{ 
                      background: '#F8FAFC', 
                      padding: '18px', 
                      borderRadius: '18px', 
                      marginTop: '12px',
                      boxShadow: 'inset 2px 2px 5px rgba(0,0,0,0.04)' 
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                      <span style={{ color: '#64748B' }}>Item Subtotal</span>
                      <span style={{ fontWeight: 700 }}>₹{cartSubtotal.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                      <span style={{ color: '#64748B' }}>Delivery Fee (Gorakhpur)</span>
                      <span style={{ fontWeight: 700, color: cartDeliveryFee === 0 ? '#16A34A' : '#0B192C' }}>
                        {cartDeliveryFee === 0 ? 'FREE' : `₹${cartDeliveryFee.toFixed(2)}`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '12px' }}>
                      <span style={{ color: '#64748B' }}>GST & Govt Taxes (5%)</span>
                      <span style={{ fontWeight: 700 }}>₹{cartTaxes.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '17px', fontWeight: 800, borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
                      <span>Total Payable</span>
                      <span style={{ color: '#028391' }}>₹{cartTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div style={{ padding: '22px', borderTop: '1px solid #E2E8F0' }}>
                <button
                  onClick={handlePlaceOrder}
                  className="clay-btn-teal"
                  style={{
                    width: '100%',
                    padding: '16px',
                    fontSize: '16px'
                  }}
                >
                  Place Gorakhpur Pilot Order (₹{cartTotal.toFixed(2)})
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          SAFE AI ASSISTANT DRAWER (CLAYMORPHISM)
          ===================================================================== */}
      {showAiDrawer && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', justifyContent: 'flex-end', backgroundColor: 'rgba(11,25,44,0.45)', backdropFilter: 'blur(6px)' }}>
          <div 
            style={{ 
              width: '100%', 
              maxWidth: '460px', 
              background: '#FFFFFF', 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              boxShadow: '-10px 0 30px rgba(11,25,44,0.15)'
            }}
          >
            <div style={{ padding: '20px 22px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} color="#2563EB" />
                <h3 style={{ fontSize: '17px', fontWeight: 800 }}>Medcure AI Assistant</h3>
              </div>
              <button onClick={() => setShowAiDrawer(false)} style={{ background: 'transparent', color: '#64748B' }}>
                <X size={22} />
              </button>
            </div>

            <div style={{ padding: '10px 18px', background: '#FEF3C7', fontSize: '12px', color: '#92400E', borderBottom: '1px solid #FDE68A' }}>
              🔒 <strong>Compliance Boundary:</strong> Searches verified Gorakhpur partner inventory and orders. Cannot diagnose or calculate doses.
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {aiChatLogs.map((chat, idx) => (
                <div key={idx} style={{ alignSelf: chat.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                  <div
                    className={chat.sender === 'user' ? 'clay-btn-teal' : 'clay-card'}
                    style={{
                      padding: '13px 16px',
                      fontSize: '13px',
                      lineHeight: '1.45',
                      color: chat.sender === 'user' ? '#FFFFFF' : chat.isSafetyAlert ? '#991B1B' : '#0B192C',
                      background: chat.sender === 'user' ? undefined : chat.isSafetyAlert ? '#FEE2E2' : '#FFFFFF',
                      border: chat.isSafetyAlert ? '1.5px solid #FCA5A5' : undefined
                    }}
                  >
                    {chat.text}
                  </div>
                  {chat.disclaimer && (
                    <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '4px', textAlign: chat.sender === 'user' ? 'right' : 'left' }}>
                      {chat.disclaimer}
                    </div>
                  )}
                </div>
              ))}
              {aiLoading && (
                <div style={{ alignSelf: 'flex-start', fontSize: '12px', color: '#64748B' }}>
                  Medcure Assistant consulting verified data...
                </div>
              )}
            </div>

            {/* QUICK TEST CHIPS (CLAY PILLS) */}
            <div style={{ padding: '10px 18px', borderTop: '1px solid #F1F5F9', display: 'flex', gap: '8px', overflowX: 'auto' }}>
              <button
                onClick={() => setAiPrompt('Do you have HimCal liquid calcium in Gorakhpur?')}
                className="clay-pill clay-pill-otc"
                style={{ whiteSpace: 'nowrap', cursor: 'pointer' }}
              >
                🔍 HimCal Stock
              </button>
              <button
                onClick={() => setAiPrompt('What is my order status?')}
                className="clay-pill clay-pill-state"
                style={{ whiteSpace: 'nowrap', cursor: 'pointer' }}
              >
                📦 Track Order
              </button>
              <button
                onClick={() => setAiPrompt('What dose of paracetamol should I give my cow for fever?')}
                className="clay-pill clay-pill-rx"
                style={{ whiteSpace: 'nowrap', cursor: 'pointer' }}
              >
                ⚠️ Test Guardrail
              </button>
            </div>

            <form onSubmit={handleSendAiPrompt} style={{ padding: '18px', borderTop: '1px solid #E2E8F0', display: 'flex', gap: '10px' }}>
              <input
                type="text"
                placeholder="Ask about catalogue, stock, or policies..."
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                className="clay-input"
                style={{ flex: 1 }}
              />
              <button
                type="submit"
                className="clay-btn-teal"
                style={{ padding: '10px 18px', fontSize: '14px' }}
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer style={{ marginTop: 'auto', padding: '24px 20px', textAlign: 'center', fontSize: '12px', color: '#64748B' }}>
        <div>
          © 2026 Medcure Technologies India. Built for Gorakhpur, Uttar Pradesh pilot validation.
        </div>
        <div style={{ marginTop: '4px' }}>
          Partner Pharmacies are independently licensed under UP State Drug Licensing Authority. Dispensing strictly by Registered Pharmacists.
        </div>
      </footer>
    </div>
  );
}
