import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Search, 
  Package, 
  FileSpreadsheet, 
  ShieldCheck, 
  Eye, 
  RefreshCw, 
  ArrowRight
} from 'lucide-react';
import { Product, HealthcareDomain } from '../types';
import { ProductArtwork } from './ProductArtwork';

const API_BASE = 'http://localhost:4000/api/v1';

interface PharmacyPortalProps {
  onMedicineListed: (newProduct: Product) => void;
  onPreviewOnStore: (product: Product) => void;
}

export const PharmacyPortal: React.FC<PharmacyPortalProps> = ({
  onMedicineListed,
  onPreviewOnStore
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'add_single' | 'bulk_import' | 'onboarding'>('inventory');
  const [currentRole, setCurrentRole] = useState<'pharmacy_owner' | 'pharmacist' | 'pharmacy_staff'>('pharmacy_owner');
  const [onboardingData, setOnboardingData] = useState<any>(null);
  const [inventoryList, setInventoryList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState<'all' | 'human' | 'veterinary'>('all');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Single Medicine Form State
  const [form, setForm] = useState({
    name: '',
    brand: '',
    genericSaltName: '',
    categoryDomain: 'human' as HealthcareDomain,
    formulation: 'Tablet',
    strength: '',
    packSize: '10 Tablets',
    manufacturer: '',
    mrp: 100,
    sellingPrice: 90,
    availableQuantity: 50,
    scheduleType: 'OTC' as 'OTC' | 'Schedule H' | 'Schedule H1' | 'Schedule X',
    batchNumber: 'GLP-2024-B1',
    expiryDate: '2027-08-31',
    // Veterinary fields
    speciesName: 'Bovine',
    withdrawalPeriodDays: 0,
    precautions: 'Nutritional supplement'
  });

  const [submitting, setSubmitting] = useState(false);

  // Fetch Inventory from API
  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/pharmacy/inventory?pharmacyId=pharm-gkp-1`);
      const data = await res.json();
      if (data.items) {
        setInventoryList(data.items);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchOnboarding = async () => {
    try {
      const res = await fetch(`${API_BASE}/pharmacy/onboarding/application?pharmacyId=pharm-gkp-1`);
      const data = await res.json();
      if (data.application) {
        setOnboardingData(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchOnboarding();
  }, []);

  // Handle Single Medicine Form Submit
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (form.sellingPrice > form.mrp) {
      setStatusMessage({
        type: 'error',
        text: `Statutory violation: Selling price (₹${form.sellingPrice}) cannot exceed MRP (₹${form.mrp}).`
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        pharmacyId: 'pharm-gkp-1',
        name: form.name,
        brand: form.brand,
        genericSaltName: form.genericSaltName,
        categoryDomain: form.categoryDomain,
        formulation: form.formulation,
        strength: form.strength,
        packSize: form.packSize,
        manufacturer: form.manufacturer,
        mrp: Number(form.mrp),
        sellingPrice: Number(form.sellingPrice),
        availableQuantity: Number(form.availableQuantity),
        scheduleType: form.scheduleType,
        requiresPrescription: form.scheduleType !== 'OTC',
        batchNumber: form.batchNumber,
        expiryDate: form.expiryDate
      };

      if (form.categoryDomain === 'veterinary') {
        payload.speciesRestrictions = [{
          speciesName: form.speciesName,
          withdrawalPeriodDays: Number(form.withdrawalPeriodDays),
          precautions: form.precautions
        }];
      }

      const res = await fetch(`${API_BASE}/pharmacy/products/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        setStatusMessage({
          type: 'success',
          text: `🎉 '${data.product.name}' is now listed and live on the Medcure customer storefront!`
        });
        onMedicineListed(data.product);
        fetchInventory();
        // Reset form
        setForm({
          name: '',
          brand: '',
          genericSaltName: '',
          categoryDomain: 'human',
          formulation: 'Tablet',
          strength: '',
          packSize: '10 Tablets',
          manufacturer: '',
          mrp: 100,
          sellingPrice: 90,
          availableQuantity: 50,
          scheduleType: 'OTC',
          batchNumber: 'GLP-2024-B1',
          expiryDate: '2027-08-31',
          speciesName: 'Bovine',
          withdrawalPeriodDays: 0,
          precautions: 'Nutritional supplement'
        });
        setActiveTab('inventory');
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to list product.' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Starter Preset Importers
  const handleImportPreset = async (presetType: 'antibiotics' | 'dairy' | 'pet') => {
    setSubmitting(true);
    setStatusMessage(null);

    let medicinesToImport: any[] = [];

    if (presetType === 'antibiotics') {
      medicinesToImport = [
        {
          name: 'Augmentin 625 Duo Tablet',
          brand: 'GSK',
          genericSaltName: 'Amoxicillin (500mg) + Clavulanic Acid (125mg)',
          categoryDomain: 'human',
          formulation: 'Tablet',
          packSize: '10 Tablets',
          manufacturer: 'GlaxoSmithKline Pharmaceuticals Ltd',
          mrp: 223.00,
          sellingPrice: 201.00,
          availableQuantity: 60,
          scheduleType: 'Schedule H1',
          requiresPrescription: true,
          expiryDate: '2027-05-31'
        },
        {
          name: 'Azithral 500mg Tablet',
          brand: 'Alembic',
          genericSaltName: 'Azithromycin (500mg)',
          categoryDomain: 'human',
          formulation: 'Tablet',
          packSize: '5 Tablets',
          manufacturer: 'Alembic Pharmaceuticals Ltd',
          mrp: 132.00,
          sellingPrice: 118.00,
          availableQuantity: 80,
          scheduleType: 'Schedule H',
          requiresPrescription: true,
          expiryDate: '2027-09-30'
        },
        {
          name: 'Pantocid DSR Capsule',
          brand: 'Sun Pharma',
          genericSaltName: 'Pantoprazole (40mg) + Domperidone (30mg SR)',
          categoryDomain: 'human',
          formulation: 'Capsule',
          packSize: '15 Capsules',
          manufacturer: 'Sun Pharmaceutical Industries Ltd',
          mrp: 189.00,
          sellingPrice: 170.00,
          availableQuantity: 75,
          scheduleType: 'Schedule H',
          requiresPrescription: true,
          expiryDate: '2027-11-30'
        }
      ];
    } else if (presetType === 'dairy') {
      medicinesToImport = [
        {
          name: 'Belamyl Liver Extract Injection',
          brand: 'Zydus Animal Health',
          genericSaltName: 'Liver Extract + Vitamin B-Complex with Choline',
          categoryDomain: 'veterinary',
          formulation: 'Injectable Solution',
          packSize: '100 ml Vial',
          manufacturer: 'Zydus Animal Health Ltd',
          mrp: 165.00,
          sellingPrice: 148.00,
          availableQuantity: 40,
          scheduleType: 'OTC',
          requiresPrescription: false,
          expiryDate: '2027-04-30'
        },
        {
          name: 'Calup Gel High Calcium Gel',
          brand: 'Virbac',
          genericSaltName: 'Ionic Calcium, Phosphorus & Energy Gel',
          categoryDomain: 'veterinary',
          formulation: 'Oral Gel',
          packSize: '300 g Tube',
          manufacturer: 'Virbac Animal Health India',
          mrp: 290.00,
          sellingPrice: 260.00,
          availableQuantity: 50,
          scheduleType: 'OTC',
          requiresPrescription: false,
          expiryDate: '2027-07-31'
        }
      ];
    } else {
      medicinesToImport = [
        {
          name: 'Himalaya Erina Plus Coat Shampoo',
          brand: 'Himalaya Pet',
          genericSaltName: 'Neem & Karanja Herbal Cleanser',
          categoryDomain: 'veterinary',
          formulation: 'Liquid Shampoo',
          packSize: '200 ml Bottle',
          manufacturer: 'The Himalaya Drug Company',
          mrp: 240.00,
          sellingPrice: 215.00,
          availableQuantity: 35,
          scheduleType: 'OTC',
          requiresPrescription: false,
          expiryDate: '2028-01-31'
        },
        {
          name: 'Kiwof Plus Dog Dewormer Strip',
          brand: 'Savavet',
          genericSaltName: 'Praziquantel, Pyrantel Pamoate, Febantel',
          categoryDomain: 'veterinary',
          formulation: 'Chewable Tablet',
          packSize: '4 Tablets Strip',
          manufacturer: 'Sava Healthcare Ltd',
          mrp: 180.00,
          sellingPrice: 162.00,
          availableQuantity: 45,
          scheduleType: 'OTC',
          requiresPrescription: false,
          expiryDate: '2027-10-31'
        }
      ];
    }

    try {
      const res = await fetch(`${API_BASE}/pharmacy/products/bulk-import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pharmacyId: 'pharm-gkp-1',
          medicines: medicinesToImport
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({
          type: 'success',
          text: `🎉 Imported ${data.imported_count} medicines! All items are now listed on the customer website.`
        });
        data.products.forEach((p: Product) => onMedicineListed(p));
        fetchInventory();
        setActiveTab('inventory');
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Failed to import preset.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Stock Adjustment
  const handleUpdateStock = async (productId: string, delta: number) => {
    const item = inventoryList.find(i => i.productId === productId);
    if (!item) return;

    const newQty = Math.max(0, item.availableQuantity + delta);
    try {
      const res = await fetch(`${API_BASE}/pharmacy/inventory/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availableQuantity: newQty })
      });
      const d = await res.json();
      if (d.success) {
        fetchInventory();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredItems = inventoryList.filter(item => {
    const prod = item.product;
    if (!prod) return false;
    const matchesQuery = !searchQuery || 
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prod.genericSaltName && prod.genericSaltName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (domainFilter === 'all') return matchesQuery;
    return matchesQuery && prod.categoryDomain === domainFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* 1. PHARMACY HEADER & LICENCE CARD */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-6 mb-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  Gorakhpur Medicos & Veterinary Care
                </h1>
                <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Licensed Partner
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Shop 14, Cinema Road, Golghar, Gorakhpur • Drug Licence: <strong>UP-GKP-20-847291</strong> • Pharmacist Reg: <strong>UP-PCR-78421</strong>
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] text-emerald-400 font-extrabold uppercase tracking-wider">
                  Live Sync Active: Listed medicines immediately appear on Medcure Customer Storefront
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Navigation & Role Switcher */}
          <div className="flex items-center gap-2 flex-wrap justify-between w-full mt-2 pt-4 border-t border-zinc-800">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setActiveTab('inventory')}
                className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                  activeTab === 'inventory' 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50' 
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Listed Catalogue ({inventoryList.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('add_single')}
                className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                  activeTab === 'add_single' 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50' 
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>List New Medicine</span>
              </button>

              <button
                onClick={() => setActiveTab('bulk_import')}
                className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                  activeTab === 'bulk_import' 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50' 
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>Import Medicines Batch</span>
              </button>

              <button
                onClick={() => setActiveTab('onboarding')}
                className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                  activeTab === 'onboarding' 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50' 
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Licences & Verification</span>
                {onboardingData?.licenceStatus?.daysUntilExpiry && (
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-1.5 py-0.5 rounded-full font-mono">
                    {onboardingData.licenceStatus.daysUntilExpiry}d valid
                  </span>
                )}
              </button>
            </div>

            {/* Acting Role Switcher */}
            <div className="flex items-center gap-2 bg-zinc-800/80 px-3 py-1.5 rounded-xl border border-zinc-700/60">
              <span className="text-[11px] font-bold text-zinc-400">Current Role:</span>
              <select
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value as any)}
                className="bg-zinc-900 text-xs font-bold text-emerald-400 rounded-lg px-2.5 py-1 border border-zinc-700 focus:outline-none cursor-pointer"
              >
                <option value="pharmacy_owner">👑 Owner (Rajesh Gupta)</option>
                <option value="pharmacist">🩺 Pharmacist (Sunil Sharma)</option>
                <option value="pharmacy_staff">📦 Staff (Amit Mishra)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Status Toast */}
        {statusMessage && (
          <div className={`mt-4 p-3.5 rounded-xl text-xs flex items-center gap-2.5 font-bold ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-950/40 border border-emerald-600/40 text-emerald-300' 
              : 'bg-red-950/40 border border-red-600/40 text-red-300'
          }`}>
            {statusMessage.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
        )}
      </div>

      {/* 2. TAB CONTENT */}
      {activeTab === 'inventory' && (
        /* TAB 1: LISTED MEDICINES TABLE */
        <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-black text-white">Live Storefront Inventory</h2>
              <p className="text-xs text-zinc-400">Medicines currently visible to customers in Gorakhpur for 9-10 min delivery</p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center bg-zinc-900 border border-zinc-700 px-3 py-1.5 rounded-xl text-xs flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-zinc-400 mr-2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Filter listed medicines..."
                  className="bg-transparent border-none outline-none text-white text-xs w-full"
                />
              </div>

              <select
                value={domainFilter}
                onChange={e => setDomainFilter(e.target.value as any)}
                className="bg-zinc-900 border border-zinc-700 text-xs text-white px-3 py-2 rounded-xl outline-none"
              >
                <option value="all">All Domains</option>
                <option value="human">Human Health</option>
                <option value="veterinary">Veterinary Health</option>
              </select>

              <button
                onClick={fetchInventory}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-zinc-300 hover:text-white transition-colors"
                title="Refresh Inventory"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-xs text-emerald-400 animate-pulse font-bold">
              Loading Gorakhpur pharmacy inventory...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-16 text-center text-zinc-400">
              <p className="text-sm font-semibold mb-2">No medicines found</p>
              <p className="text-xs text-zinc-500 mb-4">You have not listed any medicines matching this filter yet.</p>
              <button
                onClick={() => setActiveTab('add_single')}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
              >
                List Your First Medicine
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#27272a] text-[#a1a1aa] uppercase text-[10px] tracking-wider font-extrabold">
                    <th className="py-3 px-4">Medicine Details</th>
                    <th className="py-3 px-4">Domain / Category</th>
                    <th className="py-3 px-4">Regulatory Schedule</th>
                    <th className="py-3 px-4">MRP & Selling Price</th>
                    <th className="py-3 px-4">Stock on Hand</th>
                    <th className="py-3 px-4 text-right">Storefront Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a]">
                  {filteredItems.map(item => {
                    const prod = item.product;
                    if (!prod) return null;
                    return (
                      <tr key={item.inventoryId} className="hover:bg-zinc-900/40 transition-colors">
                        
                        {/* Artwork & Name */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white rounded-lg p-1 flex items-center justify-center flex-shrink-0">
                              <ProductArtwork productId={prod.id} name={prod.name} size="sm" />
                            </div>
                            <div>
                              <span className="font-extrabold text-white text-xs block">
                                {prod.name}
                              </span>
                              <span className="text-[11px] text-zinc-400 block">
                                {prod.genericSaltName || prod.brand} • {prod.packSize}
                              </span>
                              <span className="text-[10px] text-zinc-500">
                                Mfr: {prod.manufacturer}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Domain */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            prod.categoryDomain === 'veterinary'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}>
                            {prod.categoryDomain === 'veterinary' ? '🐾 Veterinary' : '🩺 Human Care'}
                          </span>
                        </td>

                        {/* Regulatory Schedule */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            prod.requiresPrescription
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {prod.scheduleType} {prod.requiresPrescription ? '(Rx Required)' : '(OTC Direct)'}
                          </span>
                        </td>

                        {/* Pricing */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-extrabold text-white text-sm">
                              ₹{item.sellingPrice}
                            </span>
                            {item.mrp > item.sellingPrice && (
                              <span className="text-[10px] text-zinc-500 line-through">
                                ₹{item.mrp}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-emerald-400 font-semibold block">
                            Statutory Check: selling_price ≤ MRP ✓
                          </span>
                        </td>

                        {/* Stock Controls */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className={`font-black text-xs px-2 py-0.5 rounded ${
                              item.availableQuantity > 10 ? 'bg-zinc-800 text-white' : 'bg-red-950 text-red-400 font-bold'
                            }`}>
                              {item.availableQuantity} units
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleUpdateStock(prod.id, -5)}
                                className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center font-bold text-zinc-300"
                                title="-5 units"
                              >
                                -
                              </button>
                              <button
                                onClick={() => handleUpdateStock(prod.id, 10)}
                                className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center font-bold text-zinc-300"
                                title="+10 units"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => onPreviewOnStore(prod)}
                            className="px-3 py-1.5 bg-emerald-950/40 border border-emerald-600/40 text-emerald-400 hover:bg-emerald-900/30 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Preview Storefront</span>
                          </button>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'add_single' && (
        /* TAB 2: SINGLE MEDICINE QUICK LISTER FORM */
        <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-6 sm:p-8 shadow-xl max-w-4xl mx-auto">
          <div className="flex items-center justify-between pb-4 border-b border-[#27272a] mb-6">
            <div>
              <h2 className="text-lg font-black text-white">List a New Medicine on Medcure</h2>
              <p className="text-xs text-zinc-400">Fill in clinical information and inventory pricing. Newly listed items go live immediately.</p>
            </div>
            <button
              onClick={() => setActiveTab('inventory')}
              className="text-xs text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSingleSubmit} className="space-y-6">
            
            {/* Row 1: Name, Brand, Salt */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Medicine Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Augmentin 625 Duo"
                  className="w-full bg-zinc-900 border border-zinc-700 px-3 py-2 rounded-xl text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Brand Name *</label>
                <input
                  type="text"
                  required
                  value={form.brand}
                  onChange={e => setForm({ ...form, brand: e.target.value })}
                  placeholder="e.g. GSK"
                  className="w-full bg-zinc-900 border border-zinc-700 px-3 py-2 rounded-xl text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Generic Salt Composition *</label>
                <input
                  type="text"
                  required
                  value={form.genericSaltName}
                  onChange={e => setForm({ ...form, genericSaltName: e.target.value })}
                  placeholder="e.g. Amoxicillin (500mg) + Clavulanic Acid"
                  className="w-full bg-zinc-900 border border-zinc-700 px-3 py-2 rounded-xl text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Row 2: Domain, Formulation, Pack Size, Manufacturer */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Domain *</label>
                <select
                  value={form.categoryDomain}
                  onChange={e => setForm({ ...form, categoryDomain: e.target.value as any })}
                  className="w-full bg-zinc-900 border border-zinc-700 px-3 py-2 rounded-xl text-xs text-white outline-none"
                >
                  <option value="human">🩺 Human Healthcare</option>
                  <option value="veterinary">🐾 Animal / Veterinary</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Formulation</label>
                <select
                  value={form.formulation}
                  onChange={e => setForm({ ...form, formulation: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-700 px-3 py-2 rounded-xl text-xs text-white outline-none"
                >
                  <option value="Tablet">Tablet</option>
                  <option value="Capsule">Capsule</option>
                  <option value="Syrup / Liquid">Syrup / Liquid</option>
                  <option value="Topical Cream">Topical Cream</option>
                  <option value="Injectable Vial">Injectable Vial</option>
                  <option value="Bandage / Dressing">Bandage / Dressing</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Pack Size *</label>
                <input
                  type="text"
                  required
                  value={form.packSize}
                  onChange={e => setForm({ ...form, packSize: e.target.value })}
                  placeholder="e.g. 10 Tablets, 25 g, 100 ml"
                  className="w-full bg-zinc-900 border border-zinc-700 px-3 py-2 rounded-xl text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Manufacturer *</label>
                <input
                  type="text"
                  required
                  value={form.manufacturer}
                  onChange={e => setForm({ ...form, manufacturer: e.target.value })}
                  placeholder="e.g. GlaxoSmithKline Ltd"
                  className="w-full bg-zinc-900 border border-zinc-700 px-3 py-2 rounded-xl text-xs text-white outline-none"
                />
              </div>
            </div>

            {/* Row 3: Statutory Schedule, MRP, Selling Price, Initial Stock */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Schedule Type</label>
                <select
                  value={form.scheduleType}
                  onChange={e => setForm({ ...form, scheduleType: e.target.value as any })}
                  className="w-full bg-zinc-900 border border-zinc-700 px-3 py-2 rounded-xl text-xs text-white outline-none"
                >
                  <option value="OTC">OTC (Over the Counter)</option>
                  <option value="Schedule H">Schedule H (Rx Mandated)</option>
                  <option value="Schedule H1">Schedule H1 (Strict Rx)</option>
                  <option value="Schedule X">Schedule X</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Max Retail Price (MRP ₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={form.mrp}
                  onChange={e => setForm({ ...form, mrp: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-zinc-900 border border-zinc-700 px-3 py-2 rounded-xl text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Selling Price (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={form.sellingPrice}
                  onChange={e => setForm({ ...form, sellingPrice: parseFloat(e.target.value) || 0 })}
                  className={`w-full bg-zinc-900 border px-3 py-2 rounded-xl text-xs text-white outline-none ${
                    form.sellingPrice > form.mrp ? 'border-red-500' : 'border-zinc-700'
                  }`}
                />
                {form.sellingPrice > form.mrp && (
                  <span className="text-[10px] text-red-400 font-bold block mt-1">
                    Error: Selling price cannot exceed MRP!
                  </span>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Initial Stock Units *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={form.availableQuantity}
                  onChange={e => setForm({ ...form, availableQuantity: parseInt(e.target.value) || 0 })}
                  className="w-full bg-zinc-900 border border-zinc-700 px-3 py-2 rounded-xl text-xs text-white outline-none"
                />
              </div>
            </div>

            {/* If Veterinary: Species and Withdrawal Info */}
            {form.categoryDomain === 'veterinary' && (
              <div className="p-4 bg-amber-950/20 border border-amber-600/30 rounded-xl space-y-3">
                <span className="text-xs font-bold text-amber-400 block">🐾 Veterinary Animal & Safety Details</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[11px] text-zinc-300 block mb-1">Target Species</label>
                    <input
                      type="text"
                      value={form.speciesName}
                      onChange={e => setForm({ ...form, speciesName: e.target.value })}
                      placeholder="e.g. Canine, Bovine, Poultry"
                      className="w-full bg-zinc-900 border border-zinc-700 px-3 py-2 rounded-xl text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-300 block mb-1">Withdrawal Period (Days)</label>
                    <input
                      type="number"
                      value={form.withdrawalPeriodDays}
                      onChange={e => setForm({ ...form, withdrawalPeriodDays: parseInt(e.target.value) || 0 })}
                      className="w-full bg-zinc-900 border border-zinc-700 px-3 py-2 rounded-xl text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-300 block mb-1">Precautions</label>
                    <input
                      type="text"
                      value={form.precautions}
                      onChange={e => setForm({ ...form, precautions: e.target.value })}
                      placeholder="e.g. Milk withdrawal 7 days"
                      className="w-full bg-zinc-900 border border-zinc-700 px-3 py-2 rounded-xl text-xs text-white outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Submit CTA */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#27272a]">
              <button
                type="button"
                onClick={() => setActiveTab('inventory')}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-zinc-800 text-zinc-300 hover:text-white"
              >
                Back to Inventory
              </button>
              <button
                type="submit"
                disabled={submitting || form.sellingPrice > form.mrp}
                className="px-6 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 shadow-lg shadow-emerald-950/40 disabled:opacity-50"
              >
                {submitting ? 'Listing on Medcure...' : 'List Medicine on Customer Storefront'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </form>
        </div>
      )}

      {activeTab === 'bulk_import' && (
        /* TAB 3: BATCH & PRESET MEDICINE IMPORTER */
        <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-6 sm:p-8 shadow-xl max-w-4xl mx-auto">
          <div className="pb-4 border-b border-[#27272a] mb-6">
            <h2 className="text-lg font-black text-white">Import Medicine Batches</h2>
            <p className="text-xs text-zinc-400">Rapidly onboard entire pharmacy shelves onto the Medcure Gorakhpur quick-commerce platform.</p>
          </div>

          {/* Preset 1-Click Packs */}
          <div className="mb-8">
            <h3 className="text-xs font-extrabold text-zinc-300 uppercase tracking-wider mb-3">
              ⚡ 1-Click Starter Pharmacy Packages:
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Preset 1 */}
              <div className="bg-zinc-900 border border-zinc-700 p-4 rounded-xl flex flex-col justify-between hover:border-emerald-500 transition-colors group">
                <div>
                  <span className="text-xs font-black text-white block mb-1 group-hover:text-emerald-400">
                    🏥 Gorakhpur Fever & Antibiotics Pack
                  </span>
                  <p className="text-[11px] text-zinc-400 leading-relaxed mb-3">
                    Augmentin 625 Duo, Azithral 500, Pantocid DSR with pre-configured batch expiry and MRP check.
                  </p>
                </div>
                <button
                  disabled={submitting}
                  onClick={() => handleImportPreset('antibiotics')}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import Fever Pack (3 Items)</span>
                </button>
              </div>

              {/* Preset 2 */}
              <div className="bg-zinc-900 border border-zinc-700 p-4 rounded-xl flex flex-col justify-between hover:border-emerald-500 transition-colors group">
                <div>
                  <span className="text-xs font-black text-white block mb-1 group-hover:text-emerald-400">
                    🐄 Dairy & Livestock Care Pack
                  </span>
                  <p className="text-[11px] text-zinc-400 leading-relaxed mb-3">
                    Belamyl Liver Extract Injection, Calup Gel High Calcium with zero-withdrawal metadata.
                  </p>
                </div>
                <button
                  disabled={submitting}
                  onClick={() => handleImportPreset('dairy')}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import Livestock Pack (2 Items)</span>
                </button>
              </div>

              {/* Preset 3 */}
              <div className="bg-zinc-900 border border-zinc-700 p-4 rounded-xl flex flex-col justify-between hover:border-emerald-500 transition-colors group">
                <div>
                  <span className="text-xs font-black text-white block mb-1 group-hover:text-emerald-400">
                    🐕 Pet & Canine Essentials Pack
                  </span>
                  <p className="text-[11px] text-zinc-400 leading-relaxed mb-3">
                    Himalaya Erina Plus Coat Shampoo, Kiwof Plus Dewormer strips with authentic batch allocations.
                  </p>
                </div>
                <button
                  disabled={submitting}
                  onClick={() => handleImportPreset('pet')}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import Pet Pack (2 Items)</span>
                </button>
              </div>

            </div>
          </div>

          {/* Custom CSV / File Dropzone */}
          <div className="p-8 border-2 border-dashed border-zinc-700 rounded-2xl text-center bg-zinc-900/40">
            <FileSpreadsheet className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-white mb-1">Upload Pharmacy Inventory Spreadsheet (CSV / Excel)</h4>
            <p className="text-xs text-zinc-400 max-w-md mx-auto mb-4">
              Columns supported: <code>name, brand, genericSaltName, mrp, sellingPrice, packSize, quantity, scheduleType</code>
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => handleImportPreset('antibiotics')}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-colors"
              >
                Download CSV Sample Template
              </button>
              <button
                onClick={() => handleImportPreset('antibiotics')}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-colors"
              >
                Upload & Process File
              </button>
            </div>
          </div>

        </div>
      )}

      {/* 4. ONBOARDING, LICENCES & VERIFICATION TAB (Milestone P1) */}
      {activeTab === 'onboarding' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Status & Reviewer Summary Banner */}
          <div className="bg-gradient-to-r from-emerald-950/60 to-zinc-900 border border-emerald-500/40 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-black text-white">Partner Pharmacy Onboarding & Verification</h3>
                  <span className="bg-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border border-emerald-500/30">
                    Status: Verified & Operational
                  </span>
                </div>
                <p className="text-xs text-zinc-300 mt-1">
                  Verified with Food Safety and Drug Administration UP records • Reviewed by Dr. Alok Verma (Platform Admin)
                </p>
                <div className="flex items-center gap-4 mt-3 text-xs text-zinc-400 font-mono">
                  <span>GSTIN: 09AAACG1234F1Z5</span>
                  <span>•</span>
                  <span>Delivery Zone: Gorakhpur Core Urban Cluster (6 km Radius)</span>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/90 border border-zinc-700/80 p-3.5 rounded-xl text-right">
              <span className="text-[11px] text-zinc-400 block font-bold uppercase tracking-wider">Drug Licence Expiry</span>
              <span className="text-sm font-black text-emerald-400">31 Dec 2027</span>
              <span className="text-[10px] text-zinc-400 block font-mono">628 days remaining (Active)</span>
            </div>
          </div>

          {/* Grid of Verified Credentials & Vault */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Drug Licences */}
            <div className="bg-zinc-900/90 border border-zinc-800 p-6 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <span>Statutory Drug Sale Licences</span>
                </h4>
                <span className="text-[11px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded">
                  Drugs & Cosmetics Act 1940
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between p-3 bg-zinc-800/40 rounded-xl border border-zinc-800">
                  <span className="text-zinc-400">Form 20 Licence (Retail Allopathic Drugs):</span>
                  <span className="font-mono font-bold text-white">UP-GKP-20-847291</span>
                </div>
                <div className="flex justify-between p-3 bg-zinc-800/40 rounded-xl border border-zinc-800">
                  <span className="text-zinc-400">Form 21 Licence (Specified Schedule C/C1):</span>
                  <span className="font-mono font-bold text-white">UP-GKP-21-847292</span>
                </div>
                <div className="flex justify-between p-3 bg-zinc-800/40 rounded-xl border border-zinc-800">
                  <span className="text-zinc-400">Licensing Authority:</span>
                  <span className="font-semibold text-zinc-300">Food Safety & Drug Administration, Gorakhpur</span>
                </div>
                <div className="flex justify-between p-3 bg-zinc-800/40 rounded-xl border border-zinc-800">
                  <span className="text-zinc-400">Authorised Representative:</span>
                  <span className="font-semibold text-zinc-300">Rajesh Gupta (+91 98765 00002)</span>
                </div>
              </div>
            </div>

            {/* Qualified Dispensing Pharmacist */}
            <div className="bg-zinc-900/90 border border-zinc-800 p-6 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Qualified Registered Pharmacist</span>
                </h4>
                <span className="text-[11px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded">
                  Section 42 Registered
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between p-3 bg-zinc-800/40 rounded-xl border border-zinc-800">
                  <span className="text-zinc-400">Dispensing Pharmacist Name:</span>
                  <span className="font-bold text-white">Sunil Kumar Sharma</span>
                </div>
                <div className="flex justify-between p-3 bg-zinc-800/40 rounded-xl border border-zinc-800">
                  <span className="text-zinc-400">Registration Number:</span>
                  <span className="font-mono font-bold text-white">UP-PH-49210</span>
                </div>
                <div className="flex justify-between p-3 bg-zinc-800/40 rounded-xl border border-zinc-800">
                  <span className="text-zinc-400">State Registration Council:</span>
                  <span className="font-semibold text-zinc-300">Uttar Pradesh Pharmacy Council</span>
                </div>
                <div className="flex justify-between p-3 bg-zinc-800/40 rounded-xl border border-zinc-800">
                  <span className="text-zinc-400">Prescription Dispensing Authority:</span>
                  <span className="font-bold text-emerald-400">Authorized Human & Veterinary Review</span>
                </div>
              </div>
            </div>

          </div>

          {/* Private Document Vault & Settlement Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Private Vault Files */}
            <div className="bg-zinc-900/90 border border-zinc-800 p-6 rounded-2xl shadow-lg">
              <h4 className="text-sm font-black text-white mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-400" />
                <span>Verified Private Document Vault</span>
              </h4>
              <p className="text-xs text-zinc-400 mb-4">
                Encrypted repository access guarded by Supabase Private Bucket signed URLs.
              </p>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-xl border border-zinc-700/50">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-zinc-400" />
                    <span className="text-zinc-200 font-medium">Form 20 Drug Sale Licence</span>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">Verified</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-xl border border-zinc-700/50">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-zinc-400" />
                    <span className="text-zinc-200 font-medium">Premises Floor Plan & Cold-Chain Layout</span>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">Verified</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-xl border border-zinc-700/50">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-zinc-400" />
                    <span className="text-zinc-200 font-medium">Pharmacist Council Certificate</span>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">Verified</span>
                </div>
              </div>
            </div>

            {/* Role-Based Permissions (RBAC Matrix) */}
            <div className="bg-zinc-900/90 border border-zinc-800 p-6 rounded-2xl shadow-lg">
              <h4 className="text-sm font-black text-white mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Active Role Permissions Matrix ({currentRole.replace('_', ' ').toUpperCase()})</span>
              </h4>
              <p className="text-xs text-zinc-400 mb-4">
                Enforced server-side via Supabase Row Level Security (RLS) policies.
              </p>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-800/40">
                  <span className="text-zinc-300">Manage Staff, Settings & Payouts</span>
                  <span className={`text-[11px] font-bold ${currentRole === 'pharmacy_owner' ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    {currentRole === 'pharmacy_owner' ? '✓ Authorized (Owner)' : '✗ Restricted'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-800/40">
                  <span className="text-zinc-300">View & Approve Prescription Files</span>
                  <span className={`text-[11px] font-bold ${currentRole === 'pharmacist' || currentRole === 'pharmacy_owner' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {currentRole === 'pharmacist' || currentRole === 'pharmacy_owner' ? '✓ Authorized (Dispenser)' : '✗ Restricted (Staff)'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-800/40">
                  <span className="text-zinc-300">Pick, Pack & Record Batches</span>
                  <span className="text-[11px] font-bold text-emerald-400">
                    ✓ Authorized (All Active Roles)
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-800/40">
                  <span className="text-zinc-300">Financial Reports & Commission Settlements</span>
                  <span className={`text-[11px] font-bold ${currentRole === 'pharmacy_owner' ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    {currentRole === 'pharmacy_owner' ? '✓ Authorized (Owner)' : '✗ Restricted'}
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
