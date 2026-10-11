import React, { useState, useEffect } from 'react';
import {
  Package,
  CheckCircle2,
  AlertOctagon,
  Image as ImageIcon,
  ShieldAlert,
  Search,
  Plus,
  RefreshCw,
  Check,
  X,
  Lock,
  Tag,
  AlertCircle
} from 'lucide-react';

export interface ProductItem {
  id: string;
  name: string;
  brand: string;
  genericSaltName?: string;
  categoryId: string;
  categoryDomain: 'human' | 'veterinary';
  formulation: string;
  strength?: string;
  packSize: string;
  manufacturer: string;
  mrp: number;
  requiresPrescription: boolean;
  isOtcDirect: boolean;
  scheduleType: 'OTC' | 'Schedule H' | 'Schedule H1' | 'Schedule X';
  imageUrl: string;
  storageInstructions?: string;
  speciesRestrictions?: {
    speciesName: string;
    withdrawalPeriodDays: number;
    precautions: string;
  }[];
  maxOrderQuantity?: number;
  isActiveInCatalogue?: boolean;
  totalInventoryQuantity?: number;
  hasActiveRecall?: boolean;
  activeRecallNotices?: string[];
}

export interface TwoPersonApprovalItem {
  id: string;
  actionType: string;
  targetResourceId: string;
  targetResourceName?: string;
  requestedBy: string;
  requestedByName?: string;
  requestedReason: string;
  payload: any;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedByName?: string;
  approvalReason?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface RecallItem {
  id: string;
  productId: string;
  productName: string;
  batchNumber: string;
  manufacturerNoticeRef: string;
  recallClass: 'CLASS_1_CRITICAL' | 'CLASS_2_DEFECT' | 'CLASS_3_MINOR';
  reason: string;
  issuedBy: string;
  issuedByName: string;
  issuedAt: string;
  status: 'ACTIVE' | 'RESOLVED' | 'CANCELLED';
  resolutionNotes?: string;
  affectedInventoryUnits: number;
  affectedActiveOrdersCount: number;
}

export interface ImageModerationItem {
  id: string;
  productId: string;
  productName: string;
  submittedByPharmacyId: string;
  pharmacyName: string;
  imageUrl: string;
  submittedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
}

interface CatalogueManagementTabProps {
  currentUserId: string;
  onRefreshGlobal?: () => void;
}

export const CatalogueManagementTab: React.FC<CatalogueManagementTabProps> = ({
  currentUserId,
  onRefreshGlobal
}) => {
  const [subTab, setSubTab] = useState<'products' | 'approvals' | 'recalls' | 'moderation'>('products');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Data states
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [approvals, setApprovals] = useState<TwoPersonApprovalItem[]>([]);
  const [recalls, setRecalls] = useState<RecallItem[]>([]);
  const [imageModerations, setImageModerations] = useState<ImageModerationItem[]>([]);
  const [summary, setSummary] = useState<any>(null);

  // Filter states for Products tab
  const [domainFilter, setDomainFilter] = useState<'all' | 'human' | 'veterinary'>('all');
  const [scheduleFilter, setScheduleFilter] = useState<string>('all');
  const [otcDirectFilter, setOtcDirectFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [showRecallModal, setShowRecallModal] = useState(false);
  const [showResolveRecallModal, setShowResolveRecallModal] = useState<RecallItem | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');

  // Form state for new product
  const [newProd, setNewProd] = useState({
    name: '',
    brand: '',
    genericSaltName: '',
    categoryId: 'cat-general',
    categoryDomain: 'human' as 'human' | 'veterinary',
    formulation: 'Tablet',
    strength: '500 mg',
    packSize: '10 Tablets Strip',
    manufacturer: '',
    mrp: 50,
    requiresPrescription: false,
    isOtcDirect: true,
    scheduleType: 'OTC' as 'OTC' | 'Schedule H' | 'Schedule H1' | 'Schedule X',
    imageUrl: '/products/generic.png',
    maxOrderQuantity: 10
  });

  // Recall Form
  const [newRecall, setNewRecall] = useState({
    productId: '',
    batchNumber: '',
    manufacturerNoticeRef: '',
    recallClass: 'CLASS_1_CRITICAL' as 'CLASS_1_CRITICAL' | 'CLASS_2_DEFECT' | 'CLASS_3_MINOR',
    reason: ''
  });

  // Approvals Review Modal
  const [selectedApproval, setSelectedApproval] = useState<TwoPersonApprovalItem | null>(null);
  const [approvalDecision, setApprovalDecision] = useState<'approved' | 'rejected'>('approved');
  const [approvalReason, setApprovalReason] = useState('');
  const [totpCode, setTotpCode] = useState('123456');

  // Image rejection modal
  const [rejectingImage, setRejectingImage] = useState<ImageModerationItem | null>(null);
  const [imageRejectReason, setImageRejectReason] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const prodRes = await fetch(`/api/v1/admin/catalogue/products?domain=${domainFilter}&scheduleType=${scheduleFilter}&query=${encodeURIComponent(searchQuery)}`);
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData.items || []);
        setSummary(prodData.summary || null);
      }

      const appRes = await fetch('/api/v1/admin/two-person-approvals');
      if (appRes.ok) {
        const appData = await appRes.json();
        setApprovals(appData.approvals || []);
      }

      const recRes = await fetch('/api/v1/admin/recalls');
      if (recRes.ok) {
        const recData = await recRes.json();
        setRecalls(recData.recalls || []);
      }

      const imgRes = await fetch('/api/v1/admin/image-moderations');
      if (imgRes.ok) {
        const imgData = await imgRes.json();
        setImageModerations(imgData.items || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load catalogue data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [domainFilter, scheduleFilter, otcDirectFilter, searchQuery]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch('/api/v1/admin/catalogue/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProd)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create product');
      }
      setSuccessMsg(`Product "${data.product.name}" created in master catalogue!`);
      setShowAddModal(false);
      loadData();
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setError(null);
    try {
      const res = await fetch(`/api/v1/admin/catalogue/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProduct)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update product');
      }
      setSuccessMsg(`Product "${data.product.name}" updated successfully.`);
      setEditingProduct(null);
      loadData();
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleToggleProductStatus = async (product: ProductItem) => {
    const nextStatus = !product.isActiveInCatalogue;
    try {
      const res = await fetch(`/api/v1/admin/catalogue/products/${product.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isActive: nextStatus,
          reason: nextStatus ? 'Admin reactivated product' : 'Admin temporarily deactivated product'
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to toggle status');
      }
      setSuccessMsg(`Product status updated to ${nextStatus ? 'ACTIVE' : 'INACTIVE'}`);
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleIssueRecall = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch('/api/v1/admin/recalls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecall)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to issue recall notice');
      }
      setSuccessMsg(`DRUG RECALL ISSUED! ${data.recall.affectedInventoryUnits} units quarantined across pharmacies.`);
      setShowRecallModal(false);
      setNewRecall({
        productId: '',
        batchNumber: '',
        manufacturerNoticeRef: '',
        recallClass: 'CLASS_1_CRITICAL',
        reason: ''
      });
      loadData();
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleResolveRecall = async () => {
    if (!showResolveRecallModal) return;
    setError(null);
    try {
      const res = await fetch(`/api/v1/admin/recalls/${showResolveRecallModal.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolutionNotes: resolveNotes })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resolve recall');
      setSuccessMsg('Recall notice marked as RESOLVED.');
      setShowResolveRecallModal(null);
      setResolveNotes('');
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDecideApproval = async () => {
    if (!selectedApproval) return;
    setError(null);
    try {
      const res = await fetch(`/api/v1/admin/two-person-approvals/${selectedApproval.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewerId: currentUserId,
          decision: approvalDecision,
          reason: approvalReason || 'Approved according to pharmacovigilance safety guidelines.',
          totpCode
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to decide approval');
      }
      setSuccessMsg(`Two-person approval ${approvalDecision.toUpperCase()} executed successfully.`);
      setSelectedApproval(null);
      setApprovalReason('');
      loadData();
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleReviewImage = async (id: string, decision: 'APPROVE' | 'REJECT', rejectionReason?: string) => {
    try {
      const res = await fetch(`/api/v1/admin/image-moderations/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          rejectionReason,
          setAsPrimary: decision === 'APPROVE'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to review image');
      setSuccessMsg(`Image moderation decision: ${decision}`);
      setRejectingImage(null);
      setImageRejectReason('');
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Alert Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide">
                Master Catalogue & Statutory Drug Safety
              </h2>
              <p className="text-sm text-zinc-400">
                Central medicine formulary, statutory two-person approvals, batch recalls, and vendor image verification.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowRecallModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-rose-900/30 transition-all cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4" />
            Issue Drug Recall
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-teal-900/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Master Medicine
          </button>
          <button
            onClick={loadData}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl border border-zinc-700 transition-all cursor-pointer"
            title="Refresh catalogue data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Overview Chips */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <span className="text-xs text-zinc-500 block uppercase font-medium">Total Products</span>
            <span className="text-2xl font-bold text-white mt-1 block">{summary.total}</span>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <span className="text-xs text-blue-400 block uppercase font-medium">Human Healthcare</span>
            <span className="text-2xl font-bold text-blue-400 mt-1 block">{summary.humanCount}</span>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <span className="text-xs text-emerald-400 block uppercase font-medium">Veterinary Care</span>
            <span className="text-2xl font-bold text-emerald-400 mt-1 block">{summary.veterinaryCount}</span>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <span className="text-xs text-amber-400 block uppercase font-medium">OTC Direct Allow-list</span>
            <span className="text-2xl font-bold text-amber-400 mt-1 block">{summary.otcDirectCount}</span>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <span className="text-xs text-purple-400 block uppercase font-medium">Schedule H / H1 / X</span>
            <span className="text-2xl font-bold text-purple-400 mt-1 block">{summary.scheduleHCount}</span>
          </div>
          <div className="bg-zinc-900 border border-rose-950/60 rounded-xl p-4">
            <span className="text-xs text-rose-400 block uppercase font-medium">Under Active Recall</span>
            <span className="text-2xl font-bold text-rose-400 mt-1 block">{summary.recalledCount}</span>
          </div>
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{successMsg}</span>
        </div>
      )}

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        <button
          onClick={() => setSubTab('products')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            subTab === 'products'
              ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/30'
              : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800'
          }`}
        >
          <Package className="w-4 h-4" />
          Master Products ({products.length})
        </button>
        <button
          onClick={() => setSubTab('approvals')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            subTab === 'approvals'
              ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/30'
              : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800'
          }`}
        >
          <Lock className="w-4 h-4" />
          Two-Person Safety Approvals ({approvals.filter(a => a.status === 'pending').length} Pending)
        </button>
        <button
          onClick={() => setSubTab('recalls')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            subTab === 'recalls'
              ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/30'
              : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Drug Batch Recalls ({recalls.filter(r => r.status === 'ACTIVE').length} Active)
        </button>
        <button
          onClick={() => setSubTab('moderation')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            subTab === 'moderation'
              ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/30'
              : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          Image Moderation ({imageModerations.filter(i => i.status === 'PENDING').length} Pending)
        </button>
      </div>

      {/* SUB-TAB 1: MASTER PRODUCTS */}
      {subTab === 'products' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
            <div className="flex items-center gap-3 flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search by drug name, salt (e.g. Paracetamol), or brand..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent text-sm text-white focus:outline-none w-full"
              />
            </div>
            <div className="flex items-center gap-3">
              <select
                value={domainFilter}
                onChange={e => setDomainFilter(e.target.value as any)}
                className="bg-zinc-800 text-xs text-zinc-300 border border-zinc-700 rounded-lg px-3 py-1.5 focus:outline-none"
              >
                <option value="all">All Domains</option>
                <option value="human">Human Healthcare</option>
                <option value="veterinary">Veterinary Care</option>
              </select>
              <select
                value={scheduleFilter}
                onChange={e => setScheduleFilter(e.target.value)}
                className="bg-zinc-800 text-xs text-zinc-300 border border-zinc-700 rounded-lg px-3 py-1.5 focus:outline-none"
              >
                <option value="all">All Schedules</option>
                <option value="OTC">OTC Only</option>
                <option value="Schedule H">Schedule H</option>
                <option value="Schedule H1">Schedule H1</option>
                <option value="Schedule X">Schedule X</option>
              </select>
              <select
                value={otcDirectFilter}
                onChange={e => setOtcDirectFilter(e.target.value)}
                className="bg-zinc-800 text-xs text-zinc-300 border border-zinc-700 rounded-lg px-3 py-1.5 focus:outline-none"
              >
                <option value="all">All Modes</option>
                <option value="true">Direct OTC</option>
                <option value="false">Rx Required</option>
              </select>
            </div>
          </div>

          {/* Product Grid / Table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-950 text-zinc-400 text-xs uppercase tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Medicine Details</th>
                    <th className="px-6 py-4 font-semibold">Domain & Classification</th>
                    <th className="px-6 py-4 font-semibold">Statutory MRP</th>
                    <th className="px-6 py-4 font-semibold">OTC Direct & Limits</th>
                    <th className="px-6 py-4 font-semibold">Live Stock</th>
                    <th className="px-6 py-4 font-semibold">Catalogue Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 text-zinc-300">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.imageUrl || '/products/generic.png'}
                            alt={p.name}
                            className="w-12 h-12 rounded-lg object-cover bg-zinc-800 border border-zinc-700"
                            onError={e => {
                              (e.target as any).src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100';
                            }}
                          />
                          <div>
                            <div className="font-semibold text-white flex items-center gap-2">
                              {p.name}
                              {p.hasActiveRecall && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
                                  <AlertOctagon className="w-3 h-3" />
                                  RECALLED
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-zinc-400">{p.brand} • {p.packSize}</div>
                            {p.genericSaltName && (
                              <div className="text-xs text-teal-400/80 italic font-mono mt-0.5">
                                Salt: {p.genericSaltName}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-semibold ${
                            p.categoryDomain === 'human'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {p.categoryDomain === 'human' ? 'Human Care' : 'Veterinary'}
                          </span>
                          <span className={`inline-block px-2 py-0.5 rounded text-xs ml-1 font-mono ${
                            p.scheduleType === 'OTC'
                              ? 'bg-zinc-800 text-zinc-300'
                              : 'bg-purple-500/10 text-purple-400 border border-purple-500/30 font-bold'
                          }`}>
                            {p.scheduleType}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">₹{p.mrp.toFixed(2)}</div>
                        <div className="text-xs text-zinc-500">Max Retail Price</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {p.isOtcDirect ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" /> Direct OTC
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400">
                              Rx Required
                            </span>
                          )}
                          <div className="text-xs text-zinc-400">
                            Max Order Qty: <span className="font-semibold text-white">{p.maxOrderQuantity || 10}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-white">{p.totalInventoryQuantity || 0}</span>
                        <span className="text-xs text-zinc-500 ml-1">units</span>
                      </td>
                      <td className="px-6 py-4">
                        {p.isActiveInCatalogue !== false ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span> Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingProduct({ ...p })}
                            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-medium rounded-lg text-zinc-200 transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleProductStatus(p)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                              p.isActiveInCatalogue !== false
                                ? 'bg-rose-950/40 text-rose-400 hover:bg-rose-900/60 border border-rose-800/40'
                                : 'bg-teal-950/40 text-teal-400 hover:bg-teal-900/60 border border-teal-800/40'
                            }`}
                          >
                            {p.isActiveInCatalogue !== false ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                        No products match the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: TWO-PERSON SAFETY APPROVALS */}
      {subTab === 'approvals' && (
        <div className="space-y-4">
          <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-200">
              <span className="font-bold">Statutory Separation of Duties:</span> High-risk operations such as changing prescription schedule classifications (e.g. Schedule H → OTC), toggling the <code className="bg-amber-950/60 px-1 py-0.5 rounded font-mono">isOtcDirect</code> allow-list, and altering maximum quantity caps require approval from a <strong>second distinct administrator</strong> with mandatory TOTP step-up verification.
            </div>
          </div>

          <div className="space-y-3">
            {approvals.map(a => {
              const isRequester = a.requestedBy === currentUserId;
              return (
                <div
                  key={a.id}
                  className={`bg-zinc-900 border rounded-2xl p-6 transition-all ${
                    a.status === 'pending'
                      ? 'border-amber-500/30 shadow-lg shadow-amber-950/10'
                      : a.status === 'approved'
                      ? 'border-emerald-500/20'
                      : 'border-zinc-800'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-zinc-500">{a.id}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                          a.status === 'pending'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            : a.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        }`}>
                          {a.status}
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs font-mono bg-zinc-800 text-zinc-300">
                          {a.actionType}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white mt-1">
                        {a.targetResourceName || a.targetResourceId}
                      </h3>
                      <p className="text-sm text-zinc-400 mt-1">
                        <strong className="text-zinc-300">Justification:</strong> {a.requestedReason}
                      </p>
                      <div className="text-xs text-zinc-500 mt-2 flex flex-wrap items-center gap-4">
                        <span>Requested by: <strong className="text-zinc-300">{a.requestedByName || a.requestedBy}</strong></span>
                        <span>Date: {new Date(a.createdAt).toLocaleString()}</span>
                        {a.approvedBy && (
                          <span>Decided by: <strong className="text-emerald-400">{a.approvedByName || a.approvedBy}</strong></span>
                        )}
                      </div>
                    </div>

                    {a.status === 'pending' && (
                      <div className="flex items-center gap-3">
                        {isRequester ? (
                          <div className="px-4 py-2 bg-zinc-800 border border-zinc-700 text-xs text-zinc-400 rounded-xl flex items-center gap-2">
                            <Lock className="w-4 h-4 text-zinc-500" />
                            Self-approval prohibited
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedApproval(a);
                              setApprovalDecision('approved');
                            }}
                            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-teal-900/30 transition-all cursor-pointer flex items-center gap-2"
                          >
                            <Check className="w-4 h-4" />
                            Review & Decide
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Proposed Payload Diff */}
                  {a.payload && (
                    <div className="mt-4 p-3 bg-zinc-950 border border-zinc-800/80 rounded-xl text-xs font-mono">
                      <span className="text-zinc-500 block mb-1">PROPOSED CHANGE PAYLOAD:</span>
                      <pre className="text-teal-400/90 whitespace-pre-wrap">{JSON.stringify(a.payload, null, 2)}</pre>
                    </div>
                  )}
                </div>
              );
            })}
            {approvals.length === 0 && (
              <div className="p-12 text-center text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-2xl">
                No two-person safety approval requests found.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: DRUG RECALLS & QUARANTINE */}
      {subTab === 'recalls' && (
        <div className="space-y-4">
          <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl flex items-start gap-3">
            <AlertOctagon className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-rose-200">
              <span className="font-bold">Drug Recall Protocol (Form 20/21 Compliance):</span> Issuing a batch recall immediately flags matching batches across partner pharmacy inventories as <code className="bg-rose-950 px-1 py-0.5 rounded font-mono">isRecalled = true</code>, zeroes available stock, and flags unfulfilled active orders for immediate quarantine.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recalls.map(r => (
              <div
                key={r.id}
                className={`bg-zinc-900 border rounded-2xl p-6 ${
                  r.status === 'ACTIVE'
                    ? 'border-rose-500/40 shadow-lg shadow-rose-950/20'
                    : 'border-zinc-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      r.recallClass === 'CLASS_1_CRITICAL'
                        ? 'bg-rose-600 text-white'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    }`}>
                      {r.recallClass.replace('_', ' ')}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-1">{r.productName}</h3>
                    <div className="text-xs font-mono text-rose-400 mt-0.5">
                      Batch: <strong className="text-white">{r.batchNumber}</strong> • Notice: {r.manufacturerNoticeRef}
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                    r.status === 'ACTIVE'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  }`}>
                    {r.status}
                  </span>
                </div>

                <p className="text-sm text-zinc-300 mt-3 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                  <strong className="text-zinc-400">Direct Reason:</strong> {r.reason}
                </p>

                <div className="grid grid-cols-2 gap-3 mt-4 text-center">
                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                    <span className="text-xs text-zinc-500 block">Quarantined Stock</span>
                    <span className="text-lg font-bold text-white mt-0.5 block">{r.affectedInventoryUnits} units</span>
                  </div>
                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                    <span className="text-xs text-zinc-500 block">Orders Impacted</span>
                    <span className="text-lg font-bold text-white mt-0.5 block">{r.affectedActiveOrdersCount} orders</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
                  <span>Issued: {new Date(r.issuedAt).toLocaleDateString()}</span>
                  {r.status === 'ACTIVE' && (
                    <button
                      onClick={() => setShowResolveRecallModal(r)}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-teal-400 font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Resolve Directive
                    </button>
                  )}
                </div>
              </div>
            ))}
            {recalls.length === 0 && (
              <div className="col-span-2 p-12 text-center text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-2xl">
                No active or historical recall directives.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: IMAGE MODERATION QUEUE */}
      {subTab === 'moderation' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {imageModerations.map(img => (
              <div key={img.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 mb-3">
                    <img
                      src={img.imageUrl}
                      alt={img.productName}
                      className="w-full h-full object-cover"
                      onError={e => {
                        (e.target as any).src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400';
                      }}
                    />
                    <span className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      img.status === 'PENDING'
                        ? 'bg-amber-500 text-black'
                        : img.status === 'APPROVED'
                        ? 'bg-emerald-500 text-black'
                        : 'bg-rose-500 text-white'
                    }`}>
                      {img.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-sm">{img.productName}</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">Submitted by: {img.pharmacyName}</p>
                </div>

                {img.status === 'PENDING' ? (
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-zinc-800">
                    <button
                      onClick={() => handleReviewImage(img.id, 'APPROVE')}
                      className="flex-1 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve & Set Primary
                    </button>
                    <button
                      onClick={() => setRejectingImage(img)}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-rose-900/60 text-rose-400 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-zinc-500 mt-3 pt-2 border-t border-zinc-800">
                    Status: {img.status} {img.rejectionReason && `• Reason: ${img.rejectionReason}`}
                  </div>
                )}
              </div>
            ))}
            {imageModerations.length === 0 && (
              <div className="col-span-3 p-12 text-center text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-2xl">
                No pharmacy-uploaded images pending moderation.
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: ADD NEW PRODUCT */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-teal-400" />
                Add Master Medicine
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Trade / Product Name</label>
                  <input
                    type="text"
                    required
                    value={newProd.name}
                    onChange={e => setNewProd({ ...newProd, name: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-white focus:outline-none"
                    placeholder="e.g. Dolo 650 Tablet"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Manufacturer Brand</label>
                  <input
                    type="text"
                    required
                    value={newProd.brand}
                    onChange={e => setNewProd({ ...newProd, brand: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-white focus:outline-none"
                    placeholder="e.g. Micro Labs Ltd"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Active Pharmaceutical Ingredient / Salt</label>
                <input
                  type="text"
                  value={newProd.genericSaltName}
                  onChange={e => setNewProd({ ...newProd, genericSaltName: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-white focus:outline-none font-mono"
                  placeholder="e.g. Paracetamol IP 650mg"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Category Domain</label>
                  <select
                    value={newProd.categoryDomain}
                    onChange={e => setNewProd({ ...newProd, categoryDomain: e.target.value as any })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-white focus:outline-none"
                  >
                    <option value="human">Human Healthcare</option>
                    <option value="veterinary">Animal Healthcare</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Drug Schedule</label>
                  <select
                    value={newProd.scheduleType}
                    onChange={e => {
                      const sched = e.target.value as any;
                      setNewProd({
                        ...newProd,
                        scheduleType: sched,
                        requiresPrescription: sched !== 'OTC',
                        isOtcDirect: sched === 'OTC'
                      });
                    }}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-white focus:outline-none"
                  >
                    <option value="OTC">OTC (Non-Scheduled)</option>
                    <option value="Schedule H">Schedule H</option>
                    <option value="Schedule H1">Schedule H1</option>
                    <option value="Schedule X">Schedule X</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Statutory MRP (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={newProd.mrp}
                    onChange={e => setNewProd({ ...newProd, mrp: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-white focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Pack Size</label>
                  <input
                    type="text"
                    required
                    value={newProd.packSize}
                    onChange={e => setNewProd({ ...newProd, packSize: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-white focus:outline-none"
                    placeholder="e.g. 15 Tablets Strip"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Max Order Quantity Cap</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newProd.maxOrderQuantity}
                    onChange={e => setNewProd({ ...newProd, maxOrderQuantity: parseInt(e.target.value) || 10 })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newProd.requiresPrescription}
                    disabled={newProd.scheduleType !== 'OTC'}
                    onChange={e => setNewProd({ ...newProd, requiresPrescription: e.target.checked, isOtcDirect: !e.target.checked })}
                    className="w-4 h-4 rounded text-teal-600"
                  />
                  <span className="text-xs text-zinc-300 font-medium">
                    Prescription Required for Ordering
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newProd.isOtcDirect}
                    disabled={newProd.scheduleType !== 'OTC'}
                    onChange={e => setNewProd({ ...newProd, isOtcDirect: e.target.checked, requiresPrescription: !e.target.checked })}
                    className="w-4 h-4 rounded text-teal-600"
                  />
                  <span className="text-xs text-zinc-300 font-medium">
                    Allow direct quick-commerce checkout without prescription (OTC_DIRECT)
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-teal-900/30 cursor-pointer"
                >
                  Register Master Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT PRODUCT */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Tag className="w-5 h-5 text-teal-400" />
                Edit Product: {editingProduct.name}
              </h3>
              <button onClick={() => setEditingProduct(null)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Statutory MRP (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={editingProduct.mrp}
                    onChange={e => setEditingProduct({ ...editingProduct, mrp: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-white focus:outline-none font-bold"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block">
                    Note: Lowering MRP will clamp all partner pharmacy selling prices.
                  </span>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Max Order Quantity</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={editingProduct.maxOrderQuantity || 10}
                    onChange={e => setEditingProduct({ ...editingProduct, maxOrderQuantity: parseInt(e.target.value) || 10 })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Pack Size</label>
                <input
                  type="text"
                  value={editingProduct.packSize}
                  onChange={e => setEditingProduct({ ...editingProduct, packSize: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-teal-900/30 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ISSUE DRUG RECALL */}
      {showRecallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-rose-900/60 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 text-rose-400">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                Issue Drug Recall Notice
              </h3>
              <button onClick={() => setShowRecallModal(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIssueRecall} className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Select Product</label>
                <select
                  required
                  value={newRecall.productId}
                  onChange={e => setNewRecall({ ...newRecall, productId: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-white focus:outline-none"
                >
                  <option value="">-- Choose target product --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.brand})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Batch Number</label>
                  <input
                    type="text"
                    required
                    value={newRecall.batchNumber}
                    onChange={e => setNewRecall({ ...newRecall, batchNumber: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-white focus:outline-none font-mono"
                    placeholder="e.g. DL-24A91 or ALL"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block">
                    Enter <code className="text-rose-400 font-bold">ALL</code> for complete product recall blackout.
                  </span>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Recall Severity Class</label>
                  <select
                    value={newRecall.recallClass}
                    onChange={e => setNewRecall({ ...newRecall, recallClass: e.target.value as any })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-white focus:outline-none"
                  >
                    <option value="CLASS_1_CRITICAL">Class 1: Critical (Dangerous to health)</option>
                    <option value="CLASS_2_DEFECT">Class 2: Defect (Quality violation)</option>
                    <option value="CLASS_3_MINOR">Class 3: Minor (Labelling defect)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Manufacturer / Regulatory Notice Reference</label>
                <input
                  type="text"
                  required
                  value={newRecall.manufacturerNoticeRef}
                  onChange={e => setNewRecall({ ...newRecall, manufacturerNoticeRef: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-white focus:outline-none"
                  placeholder="e.g. MFR-MICRO-2026-RC04"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Recall Directive Reason</label>
                <textarea
                  required
                  rows={3}
                  value={newRecall.reason}
                  onChange={e => setNewRecall({ ...newRecall, reason: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-white focus:outline-none"
                  placeholder="Detailed findings, laboratory audit report, or manufacturer notice summary..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowRecallModal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-rose-900/30 cursor-pointer"
                >
                  Publish Quarantine Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: RESOLVE RECALL */}
      {showResolveRecallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-teal-400" />
              Resolve Recall: {showResolveRecallModal.productName}
            </h3>
            <p className="text-xs text-zinc-400">
              Record disposition notes, destruction certificates, or distributor credit note details for audit closure.
            </p>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">Resolution Disposition Notes</label>
              <textarea
                rows={3}
                required
                value={resolveNotes}
                onChange={e => setResolveNotes(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-white focus:outline-none"
                placeholder="e.g. Quarantined stock returned to distributor. Credit Note received."
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                onClick={() => setShowResolveRecallModal(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveRecall}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-teal-900/30 cursor-pointer"
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: TWO-PERSON APPROVAL REVIEW */}
      {selectedApproval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-400" />
                Review Safety Request
              </h3>
              <button onClick={() => setSelectedApproval(null)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="text-zinc-400">
                Action: <strong className="text-white">{selectedApproval.actionType}</strong>
              </div>
              <div className="text-zinc-400">
                Target: <strong className="text-white">{selectedApproval.targetResourceName || selectedApproval.targetResourceId}</strong>
              </div>
              <div className="text-zinc-400">
                Requested by: <strong className="text-white">{selectedApproval.requestedByName || selectedApproval.requestedBy}</strong>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Decision</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                    <input
                      type="radio"
                      name="decision"
                      checked={approvalDecision === 'approved'}
                      onChange={() => setApprovalDecision('approved')}
                    />
                    Approve & Apply
                  </label>
                  <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                    <input
                      type="radio"
                      name="decision"
                      checked={approvalDecision === 'rejected'}
                      onChange={() => setApprovalDecision('rejected')}
                    />
                    Reject
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Review Comments / Reason</label>
                <textarea
                  rows={2}
                  value={approvalReason}
                  onChange={e => setApprovalReason(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-white focus:outline-none"
                  placeholder="Record pharmacovigilance rationale..."
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">MFA TOTP Step-Up Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={totpCode}
                  onChange={e => setTotpCode(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-white focus:outline-none font-mono text-center tracking-widest"
                  placeholder="123456"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                onClick={() => setSelectedApproval(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDecideApproval}
                className={`px-4 py-2 text-white rounded-xl text-sm font-semibold shadow-lg transition-all cursor-pointer ${
                  approvalDecision === 'approved'
                    ? 'bg-teal-600 hover:bg-teal-500 shadow-teal-900/30'
                    : 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/30'
                }`}
              >
                Submit Decision
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: REJECT IMAGE */}
      {rejectingImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <X className="w-5 h-5 text-rose-400" />
              Reject Pharmacy Image Submission
            </h3>
            <p className="text-xs text-zinc-400">
              Specify why the carton/medicine photo fails quality or compliance standards.
            </p>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">Rejection Reason</label>
              <textarea
                rows={3}
                required
                value={imageRejectReason}
                onChange={e => setImageRejectReason(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-white focus:outline-none"
                placeholder="e.g. Carton label is blurry, dosage strength unreadable."
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                onClick={() => setRejectingImage(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReviewImage(rejectingImage.id, 'REJECT', imageRejectReason)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-rose-900/30 cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
