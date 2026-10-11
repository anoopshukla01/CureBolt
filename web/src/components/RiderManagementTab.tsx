import React, { useState, useEffect } from 'react';
import {
  Bike,
  CheckCircle2,
  AlertTriangle,
  ClipboardCheck,
  Banknote,
  Download,
  AlertOctagon,
  RefreshCw,
  Shield,
  Phone,
  Calendar,
  Check,
  X
} from 'lucide-react';

export interface RiderApplicationItem {
  id: string;
  userId: string;
  riderId?: string;
  fullName: string;
  phone: string;
  selfieDocPath: string;
  govIdType: string;
  govIdNumber: string;
  govIdDocPath: string;
  drivingLicenceNumber: string;
  drivingLicenceDocPath: string;
  drivingLicenceExpiryDate: string;
  vehicleType: string;
  vehicleRegistrationNumber: string;
  vehicleRcDocPath: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  bankAccountMasked?: string;
  bankIfsc?: string;
  upiIdMasked?: string;
  status: 'submitted' | 'needs_changes' | 'approved' | 'suspended';
  reviewerComments?: string;
  createdAt: string;
  checklist?: {
    id: string;
    applicationId: string;
    drivingLicenceVerified: boolean;
    vehicleRcVerified: boolean;
    identityVerified: boolean;
    backgroundCheckCleared: boolean;
    verificationNotes?: string;
  };
}

export interface DispatchRiderItem {
  id: string;
  name: string;
  phone: string;
  vehicleType: string;
  vehicleNumber: string;
  isOnline: boolean;
  currentLoad: number;
  cashInHandPaise: number;
  lastLocationTimeAgoSeconds: number;
  acceptanceRate: number;
  rating: number;
  completedOrders: number;
  isSuspended: boolean;
}

export interface RiderIncidentItem {
  id: string;
  riderId: string;
  riderName?: string;
  orderId?: string;
  incidentType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  reportedBy: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
  resolutionNotes?: string;
  createdAt: string;
}

export interface RiderCashDepositItem {
  id: string;
  riderId: string;
  riderName: string;
  amountPaise: number;
  depositMethod: 'BANK_DEPOSIT' | 'UPI_TRANSFER' | 'HUB_CASH';
  referenceNumber?: string;
  notes?: string;
  status: 'SUBMITTED' | 'CONFIRMED' | 'REJECTED';
  confirmedBy?: string;
  confirmedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface RiderPayoutBatchItem {
  id: string;
  periodStart: string;
  periodEnd: string;
  totalRiders: number;
  totalAmountPaise: number;
  status: string;
  items: {
    riderId: string;
    riderName: string;
    phone: string;
    completedDeliveries: number;
    basePayPaise: number;
    distanceBonusPaise: number;
    tipsPaise: number;
    codDeductionsPaise: number;
    netPayoutPaise: number;
    bankAccountMasked?: string;
    upiIdMasked?: string;
  }[];
  createdAt: string;
}

interface RiderManagementTabProps {
  currentStaffUserId: string;
  onShowFeedback: (type: 'success' | 'error', text: string) => void;
}

export function RiderManagementTab({ currentStaffUserId, onShowFeedback }: RiderManagementTabProps) {
  const [subTab, setSubTab] = useState<'onboarding' | 'roster' | 'deposits' | 'incidents' | 'payouts'>('onboarding');
  const [loading, setLoading] = useState(false);

  // Data states
  const [applications, setApplications] = useState<RiderApplicationItem[]>([]);
  const [riders, setRiders] = useState<DispatchRiderItem[]>([]);
  const [incidents, setIncidents] = useState<RiderIncidentItem[]>([]);
  const [deposits, setDeposits] = useState<RiderCashDepositItem[]>([]);
  const [payouts, setPayouts] = useState<RiderPayoutBatchItem[]>([]);

  // Onboarding review modal
  const [selectedApp, setSelectedApp] = useState<RiderApplicationItem | null>(null);
  const [checklistState, setChecklistState] = useState({
    drivingLicenceVerified: false,
    vehicleRcVerified: false,
    identityVerified: false,
    backgroundCheckCleared: false,
    verificationNotes: ''
  });
  const [decisionReason, setDecisionReason] = useState('');

  // Incidents modal
  const [showNewIncidentModal, setShowNewIncidentModal] = useState(false);
  const [newIncidentForm, setNewIncidentForm] = useState({
    riderId: 'rider-1',
    incidentType: 'DELAYED_DELIVERY',
    severity: 'LOW' as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    description: ''
  });
  const [selectedIncidentForResolve, setSelectedIncidentForResolve] = useState<RiderIncidentItem | null>(null);
  const [incidentResolutionNotes, setIncidentResolutionNotes] = useState('');

  // Payouts modal
  const [payoutPeriod, setPayoutPeriod] = useState({
    periodStart: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
    periodEnd: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchAllRiderData();
  }, [currentStaffUserId]);

  const fetchAllRiderData = async () => {
    setLoading(true);
    try {
      const [appsRes, ridersRes, incRes, depRes, payRes] = await Promise.all([
        fetch('http://localhost:4000/api/v1/admin/rider-applications'),
        fetch('http://localhost:4000/api/v1/dispatch/riders'),
        fetch('http://localhost:4000/api/v1/admin/rider-incidents'),
        fetch('http://localhost:4000/api/v1/admin/rider-cash-deposits'),
        fetch('http://localhost:4000/api/v1/admin/rider-payouts')
      ]);

      if (appsRes.ok) {
        const data = await appsRes.json();
        setApplications(data.applications || []);
      }
      if (ridersRes.ok) {
        const data = await ridersRes.json();
        setRiders(data.riders || []);
      }
      if (incRes.ok) {
        const data = await incRes.json();
        setIncidents(data.incidents || []);
      }
      if (depRes.ok) {
        const data = await depRes.json();
        setDeposits(data.deposits || []);
      }
      if (payRes.ok) {
        const data = await payRes.json();
        setPayouts(data.batches || []);
      }
    } catch (err) {
      console.error('Failed to load rider data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReviewModal = (app: RiderApplicationItem) => {
    setSelectedApp(app);
    setChecklistState({
      drivingLicenceVerified: !!app.checklist?.drivingLicenceVerified,
      vehicleRcVerified: !!app.checklist?.vehicleRcVerified,
      identityVerified: !!app.checklist?.identityVerified,
      backgroundCheckCleared: !!app.checklist?.backgroundCheckCleared,
      verificationNotes: app.checklist?.verificationNotes || ''
    });
    setDecisionReason('');
  };

  const handleSaveRiderChecklist = async () => {
    if (!selectedApp) return;
    try {
      const res = await fetch(`http://localhost:4000/api/v1/admin/rider-applications/${selectedApp.id}/checklist`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-staff-user-id': currentStaffUserId },
        body: JSON.stringify(checklistState)
      });
      if (res.ok) {
        onShowFeedback('success', 'Rider verification checklist saved.');
        fetchAllRiderData();
      } else {
        const err = await res.json();
        onShowFeedback('error', err.error || 'Failed to update checklist.');
      }
    } catch (e: any) {
      onShowFeedback('error', e.message);
    }
  };

  const handleRiderDecision = async (decision: 'APPROVE' | 'REQUEST_CHANGES' | 'SUSPEND') => {
    if (!selectedApp) return;
    if (!decisionReason || decisionReason.trim().length < 5) {
      onShowFeedback('error', 'Mandatory decision reason (min 5 characters) required.');
      return;
    }

    try {
      await fetch(`http://localhost:4000/api/v1/admin/rider-applications/${selectedApp.id}/checklist`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-staff-user-id': currentStaffUserId },
        body: JSON.stringify(checklistState)
      });

      const res = await fetch(`http://localhost:4000/api/v1/admin/rider-applications/${selectedApp.id}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-staff-user-id': currentStaffUserId },
        body: JSON.stringify({ decision, reason: decisionReason })
      });

      const data = await res.json();
      if (res.ok) {
        onShowFeedback('success', data.message || `Rider marked as ${decision}.`);
        setSelectedApp(null);
        fetchAllRiderData();
      } else {
        onShowFeedback('error', data.message || data.error || 'Failed to execute decision.');
      }
    } catch (e: any) {
      onShowFeedback('error', e.message);
    }
  };

  const handleConfirmDeposit = async (depositId: string) => {
    try {
      const res = await fetch(`http://localhost:4000/api/v1/admin/rider-cash-deposits/${depositId}/confirm`, {
        method: 'POST',
        headers: { 'x-staff-user-id': currentStaffUserId }
      });
      const data = await res.json();
      if (res.ok) {
        onShowFeedback('success', `Deposit confirmed. Cash-in-hand deducted atomically: ₹${(data.updatedCashInHandPaise / 100).toFixed(2)} remaining.`);
        fetchAllRiderData();
      } else {
        onShowFeedback('error', data.error || 'Failed to confirm deposit.');
      }
    } catch (e: any) {
      onShowFeedback('error', e.message);
    }
  };

  const handleRejectDeposit = async (depositId: string) => {
    const reason = window.prompt('Enter reason for rejecting deposit submission:');
    if (!reason || reason.trim().length < 5) {
      onShowFeedback('error', 'Mandatory reason required.');
      return;
    }

    try {
      const res = await fetch(`http://localhost:4000/api/v1/admin/rider-cash-deposits/${depositId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-staff-user-id': currentStaffUserId },
        body: JSON.stringify({ rejectionReason: reason })
      });
      if (res.ok) {
        onShowFeedback('success', 'Deposit submission rejected.');
        fetchAllRiderData();
      }
    } catch (e: any) {
      onShowFeedback('error', e.message);
    }
  };

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncidentForm.description || newIncidentForm.description.trim().length < 5) {
      onShowFeedback('error', 'Incident description (min 5 chars) required.');
      return;
    }

    try {
      const res = await fetch('http://localhost:4000/api/v1/admin/rider-incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-staff-user-id': currentStaffUserId },
        body: JSON.stringify(newIncidentForm)
      });
      if (res.ok) {
        onShowFeedback('success', 'Incident report created.');
        setShowNewIncidentModal(false);
        setNewIncidentForm({ riderId: 'rider-1', incidentType: 'DELAYED_DELIVERY', severity: 'LOW', description: '' });
        fetchAllRiderData();
      }
    } catch (e: any) {
      onShowFeedback('error', e.message);
    }
  };

  const handleResolveIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncidentForResolve) return;
    if (!incidentResolutionNotes || incidentResolutionNotes.trim().length < 5) {
      onShowFeedback('error', 'Resolution notes (min 5 chars) required.');
      return;
    }

    try {
      const res = await fetch(`http://localhost:4000/api/v1/admin/rider-incidents/${selectedIncidentForResolve.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-staff-user-id': currentStaffUserId },
        body: JSON.stringify({ resolutionNotes: incidentResolutionNotes })
      });
      if (res.ok) {
        onShowFeedback('success', 'Incident report resolved and logged.');
        setSelectedIncidentForResolve(null);
        setIncidentResolutionNotes('');
        fetchAllRiderData();
      }
    } catch (e: any) {
      onShowFeedback('error', e.message);
    }
  };

  const handleGeneratePayouts = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:4000/api/v1/admin/rider-payouts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-staff-user-id': currentStaffUserId },
        body: JSON.stringify(payoutPeriod)
      });
      const data = await res.json();
      if (res.ok) {
        onShowFeedback('success', `Generated payout batch for ${data.batch.totalRiders} riders: ₹${(data.batch.totalAmountPaise / 100).toFixed(2)}.`);
        fetchAllRiderData();
      } else {
        onShowFeedback('error', data.error || 'Failed to generate payout batch.');
      }
    } catch (e: any) {
      onShowFeedback('error', e.message);
    }
  };

  const allFourChecked =
    checklistState.drivingLicenceVerified &&
    checklistState.vehicleRcVerified &&
    checklistState.identityVerified &&
    checklistState.backgroundCheckCleared;

  const totalOutstandingCash = riders.reduce((acc, r) => acc + r.cashInHandPaise, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Active Fleet</span>
            <Bike className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-black text-white">{riders.length}</div>
          <div className="text-[11px] text-teal-400 font-medium mt-1">
            {riders.filter(r => r.isOnline).length} riders online in Gorakhpur
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">COD Cash in Hand</span>
            <Banknote className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">
            ₹{(totalOutstandingCash / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-400 font-medium mt-1">
            Fleet total door-step collection
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Deposits</span>
            <ClipboardCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">
            {deposits.filter(d => d.status === 'SUBMITTED').length}
          </div>
          <div className="text-[11px] text-zinc-400 font-medium mt-1">
            Reconciliation confirmations due
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Open Incidents</span>
            <AlertOctagon className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {incidents.filter(i => i.status === 'OPEN').length}
          </div>
          <div className="text-[11px] text-rose-400 font-medium mt-1">
            Transit delays & spills logged
          </div>
        </div>
      </div>

      {/* Subtabs Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setSubTab('onboarding')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
              subTab === 'onboarding' ? 'bg-teal-600 text-white shadow-lg' : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5" /> Onboarding Queue ({applications.length})
          </button>
          <button
            onClick={() => setSubTab('roster')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
              subTab === 'roster' ? 'bg-teal-600 text-white shadow-lg' : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            <Bike className="w-3.5 h-3.5" /> Active Fleet Roster ({riders.length})
          </button>
          <button
            onClick={() => setSubTab('deposits')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
              subTab === 'deposits' ? 'bg-teal-600 text-white shadow-lg' : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            <Banknote className="w-3.5 h-3.5" /> COD Cash & Deposits ({deposits.length})
          </button>
          <button
            onClick={() => setSubTab('incidents')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
              subTab === 'incidents' ? 'bg-teal-600 text-white shadow-lg' : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" /> Incident Reports ({incidents.length})
          </button>
          <button
            onClick={() => setSubTab('payouts')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
              subTab === 'payouts' ? 'bg-teal-600 text-white shadow-lg' : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" /> Payout Batches & Export ({payouts.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          {subTab === 'incidents' && (
            <button
              onClick={() => setShowNewIncidentModal(true)}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-black rounded-lg text-xs font-black flex items-center gap-1.5 shadow-lg"
            >
              <AlertTriangle className="w-3 h-3" /> Log Field Incident
            </button>
          )}
          <button
            onClick={fetchAllRiderData}
            className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* SUBTAB 1: ONBOARDING QUEUE */}
      {subTab === 'onboarding' && (
        <div className="space-y-4">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-zinc-800">
              <h3 className="text-sm font-black text-white">Rider Onboarding Applications</h3>
              <p className="text-xs text-zinc-400">
                Review driving licences, vehicle RC via Parivahan, government identity KYC, and police background checks.
              </p>
            </div>

            <div className="divide-y divide-zinc-800/80">
              {applications.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-xs">No rider applications in queue.</div>
              ) : (
                applications.map(app => (
                  <div key={app.id} className="p-4 hover:bg-zinc-800/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white">{app.fullName}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          app.status === 'approved'
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                            : app.status === 'needs_changes'
                            ? 'bg-amber-950/80 text-amber-400 border border-amber-800'
                            : app.status === 'suspended'
                            ? 'bg-rose-950/80 text-rose-400 border border-rose-800'
                            : 'bg-cyan-950/80 text-cyan-400 border border-cyan-800'
                        }`}>
                          {app.status}
                        </span>
                      </div>

                      <div className="text-xs text-zinc-400 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span>Phone: <strong className="text-zinc-200">{app.phone}</strong></span>
                        <span>Vehicle: <strong className="text-zinc-200">{app.vehicleType} ({app.vehicleRegistrationNumber})</strong></span>
                        <span>DL: <strong className="text-zinc-200">{app.drivingLicenceNumber}</strong></span>
                        <span>Expiry: <strong className="text-zinc-200">{app.drivingLicenceExpiryDate}</strong></span>
                      </div>

                      {app.reviewerComments && (
                        <div className="text-[11px] text-zinc-300 bg-zinc-950/60 p-2 rounded-lg border border-zinc-800/80">
                          <span className="text-zinc-500 font-bold">Reviewer Note: </span>{app.reviewerComments}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleOpenReviewModal(app)}
                        className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-black shadow-lg flex items-center gap-1.5 transition-all"
                      >
                        <ClipboardCheck className="w-3.5 h-3.5" /> Review Documents & Checklist
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: ACTIVE FLEET ROSTER */}
      {subTab === 'roster' && (
        <div className="space-y-4">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-zinc-800">
              <h3 className="text-sm font-black text-white">Active Delivery Fleet Roster</h3>
              <p className="text-xs text-zinc-400">
                Live delivery partner availability, load metrics, ratings, vehicle registration details, and emergency contacts.
              </p>
            </div>

            <div className="divide-y divide-zinc-800/80">
              {riders.map(r => (
                <div key={r.id} className="p-4 hover:bg-zinc-800/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white">{r.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        r.isSuspended
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : r.isOnline
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {r.isSuspended ? 'SUSPENDED' : r.isOnline ? 'ONLINE' : 'OFFLINE'}
                      </span>
                    </div>

                    <div className="text-xs text-zinc-400 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span>Phone: <strong className="text-zinc-200">{r.phone}</strong></span>
                      <span>Vehicle: <strong className="text-zinc-200">{r.vehicleType} ({r.vehicleNumber})</strong></span>
                      <span>Orders Completed: <strong className="text-zinc-200">{r.completedOrders}</strong></span>
                      <span>Rating: <strong className="text-amber-400">★ {r.rating.toFixed(1)}</strong></span>
                      <span>Cash in Hand: <strong className="text-emerald-400">₹{(r.cashInHandPaise / 100).toFixed(2)}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-zinc-400 bg-zinc-950 px-2 py-1 rounded border border-zinc-800">
                      Load: {r.currentLoad} orders
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: COD CASH & DEPOSITS RECONCILIATION */}
      {subTab === 'deposits' && (
        <div className="space-y-4">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-zinc-800">
              <h3 className="text-sm font-black text-white">COD Doorstep Cash Collections & Bank Settlements</h3>
              <p className="text-xs text-zinc-400">
                Riders deposit collected COD cash via designated bank counters, hub desks, or official QR. Confirmation atomically reconciles cash-in-hand.
              </p>
            </div>

            <div className="divide-y divide-zinc-800/80">
              {deposits.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-xs">No deposit records found.</div>
              ) : (
                deposits.map(dep => (
                  <div key={dep.id} className="p-4 hover:bg-zinc-800/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white">{dep.riderName}</span>
                        <span className="text-base font-black text-emerald-400">
                          ₹{(dep.amountPaise / 100).toFixed(2)}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          dep.status === 'CONFIRMED'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : dep.status === 'REJECTED'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}>
                          {dep.status}
                        </span>
                      </div>

                      <div className="text-xs text-zinc-400 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span>Method: <strong className="text-zinc-200">{dep.depositMethod}</strong></span>
                        <span>Ref / Txn: <strong className="text-zinc-200 font-mono">{dep.referenceNumber || 'N/A'}</strong></span>
                        <span>Date: <strong className="text-zinc-200">{new Date(dep.createdAt).toLocaleString()}</strong></span>
                      </div>

                      {dep.notes && <div className="text-[11px] text-zinc-400">Note: {dep.notes}</div>}
                      {dep.rejectionReason && (
                        <div className="text-[11px] text-rose-400">Rejected: {dep.rejectionReason}</div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {dep.status === 'SUBMITTED' ? (
                        <>
                          <button
                            onClick={() => handleConfirmDeposit(dep.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-lg text-xs shadow-lg flex items-center gap-1 transition-all"
                          >
                            <Check className="w-3.5 h-3.5" /> Confirm Cash Reconciled
                          </button>
                          <button
                            onClick={() => handleRejectDeposit(dep.id)}
                            className="px-3 py-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold rounded-lg text-xs"
                          >
                            Reject
                          </button>
                        </>
                      ) : dep.status === 'CONFIRMED' ? (
                        <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Reconciled into Platform Account
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: INCIDENT REPORTS */}
      {subTab === 'incidents' && (
        <div className="space-y-4">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-zinc-800">
              <h3 className="text-sm font-black text-white">Rider Incident & Field Quality Log</h3>
              <p className="text-xs text-zinc-400">
                Log and remediate vehicle breakdowns, traffic transit delays, package damage/spills, and customer disputes.
              </p>
            </div>

            <div className="divide-y divide-zinc-800/80">
              {incidents.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-xs">No incidents reported.</div>
              ) : (
                incidents.map(inc => (
                  <div key={inc.id} className="p-4 hover:bg-zinc-800/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          inc.severity === 'CRITICAL'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : inc.severity === 'HIGH'
                            ? 'bg-orange-950 text-orange-400 border border-orange-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}>
                          {inc.severity}
                        </span>
                        <span className="text-xs font-bold text-white font-mono">{inc.incidentType}</span>
                        <span className="text-xs text-zinc-400">· {inc.riderName || inc.riderId}</span>
                      </div>

                      <p className="text-xs text-zinc-300">{inc.description}</p>

                      {inc.resolutionNotes && (
                        <div className="text-[11px] text-emerald-300 bg-emerald-950/40 p-2 rounded border border-emerald-800/60 mt-1">
                          <strong className="text-emerald-400">Resolved: </strong>{inc.resolutionNotes}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {inc.status === 'RESOLVED' ? (
                        <span className="px-2 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedIncidentForResolve(inc);
                            setIncidentResolutionNotes('');
                          }}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-black font-black rounded-lg text-xs shadow-lg transition-all"
                        >
                          Resolve Incident
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 5: PAYOUT BATCHES & EXPORT */}
      {subTab === 'payouts' && (
        <div className="space-y-6">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 shadow-xl">
            <h3 className="text-sm font-black text-white mb-2">Generate Period Payout Batch</h3>
            <form onSubmit={handleGeneratePayouts} className="flex flex-col sm:flex-row items-end gap-3">
              <div>
                <label className="text-[11px] font-bold text-zinc-400 block mb-1">Period Start</label>
                <input
                  type="date"
                  value={payoutPeriod.periodStart}
                  onChange={e => setPayoutPeriod({ ...payoutPeriod, periodStart: e.target.value })}
                  className="bg-black border border-zinc-800 rounded-lg p-2 text-xs text-white"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-zinc-400 block mb-1">Period End</label>
                <input
                  type="date"
                  value={payoutPeriod.periodEnd}
                  onChange={e => setPayoutPeriod({ ...payoutPeriod, periodEnd: e.target.value })}
                  className="bg-black border border-zinc-800 rounded-lg p-2 text-xs text-white"
                  required
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-black rounded-lg text-xs shadow-lg transition-all flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5" /> Calculate Fleet Earnings Batch
              </button>
            </form>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-zinc-800">
              <h3 className="text-sm font-black text-white">Historical Settlement Batches</h3>
            </div>

            <div className="divide-y divide-zinc-800/80">
              {payouts.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-xs">No payout batches generated yet.</div>
              ) : (
                payouts.map(batch => (
                  <div key={batch.id} className="p-4 hover:bg-zinc-800/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white">
                          Batch: {batch.periodStart} to {batch.periodEnd}
                        </span>
                        <span className="text-sm font-black text-emerald-400">
                          ₹{(batch.totalAmountPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-cyan-950 text-cyan-400 border border-cyan-800">
                          {batch.status}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400">
                        {batch.totalRiders} riders included · Created {new Date(batch.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`http://localhost:4000/api/v1/admin/rider-payouts/${batch.id}/export?format=csv`}
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
                        download
                      >
                        <Download className="w-3.5 h-3.5 text-teal-400" /> Export CSV
                      </a>
                      <a
                        href={`http://localhost:4000/api/v1/admin/rider-payouts/${batch.id}/export?format=json`}
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
                        download
                      >
                        <Download className="w-3.5 h-3.5 text-cyan-400" /> Export JSON
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: RIDER ONBOARDING DOCUMENT REVIEW & 4-POINT CHECKLIST */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-teal-400" />
                  Rider Verification & Onboarding: {selectedApp.fullName}
                </h3>
                <span className="text-xs text-zinc-400">Driving licence, vehicle RC, government ID and background credentials</span>
              </div>
              <button onClick={() => setSelectedApp(null)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2 bg-zinc-950 border border-zinc-800 rounded-xl text-center">
                <Shield className="w-4 h-4 text-teal-400 mx-auto mb-1" />
                <span className="text-[10px] font-bold text-zinc-300 block">Driving Licence</span>
                <span className="text-[9px] text-zinc-500 font-mono truncate">{selectedApp.drivingLicenceNumber}</span>
              </div>
              <div className="p-2 bg-zinc-950 border border-zinc-800 rounded-xl text-center">
                <Bike className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                <span className="text-[10px] font-bold text-zinc-300 block">Vehicle RC</span>
                <span className="text-[9px] text-zinc-500 font-mono truncate">{selectedApp.vehicleRegistrationNumber}</span>
              </div>
              <div className="p-2 bg-zinc-950 border border-zinc-800 rounded-xl text-center">
                <Phone className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                <span className="text-[10px] font-bold text-zinc-300 block">Emergency Contact</span>
                <span className="text-[9px] text-zinc-500 truncate">{selectedApp.emergencyContactName} ({selectedApp.emergencyContactRelation})</span>
              </div>
              <div className="p-2 bg-zinc-950 border border-zinc-800 rounded-xl text-center">
                <Banknote className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                <span className="text-[10px] font-bold text-zinc-300 block">Payout Account</span>
                <span className="text-[9px] text-zinc-500 font-mono truncate">{selectedApp.bankAccountMasked || selectedApp.upiIdMasked || 'Pending'}</span>
              </div>
            </div>

            {/* 4-Point Statutory Verification Checklist */}
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 space-y-3">
              <span className="text-xs font-black text-teal-400 uppercase tracking-wider block">
                4-Point Rider Verification Checklist (All Required for Approval)
              </span>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklistState.drivingLicenceVerified}
                  onChange={e => setChecklistState({ ...checklistState, drivingLicenceVerified: e.target.checked })}
                  className="mt-0.5 w-4 h-4 accent-teal-500 rounded"
                />
                <span className="text-xs text-zinc-300">
                  <strong>1. Driving Licence Active & Valid:</strong> Verified DL number {selectedApp.drivingLicenceNumber} against Parivahan / Sarathi national database. Expiry: {selectedApp.drivingLicenceExpiryDate}.
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklistState.vehicleRcVerified}
                  onChange={e => setChecklistState({ ...checklistState, vehicleRcVerified: e.target.checked })}
                  className="mt-0.5 w-4 h-4 accent-teal-500 rounded"
                />
                <span className="text-xs text-zinc-300">
                  <strong>2. Vehicle Registration Certificate (RC):</strong> Active commercial / transport permit registration verified for vehicle {selectedApp.vehicleRegistrationNumber} ({selectedApp.vehicleType}).
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklistState.identityVerified}
                  onChange={e => setChecklistState({ ...checklistState, identityVerified: e.target.checked })}
                  className="mt-0.5 w-4 h-4 accent-teal-500 rounded"
                />
                <span className="text-xs text-zinc-300">
                  <strong>3. Government Identity & Facial Match:</strong> Aadhaar/PAN identity verified; selfie photo matches uploaded photo ID.
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklistState.backgroundCheckCleared}
                  onChange={e => setChecklistState({ ...checklistState, backgroundCheckCleared: e.target.checked })}
                  className="mt-0.5 w-4 h-4 accent-teal-500 rounded"
                />
                <span className="text-xs text-zinc-300">
                  <strong>4. Police Background Clearance:</strong> Clear verification report obtained for local delivery operations in Gorakhpur district.
                </span>
              </label>

              <div className="pt-2">
                <input
                  type="text"
                  placeholder="Verification officer notes..."
                  value={checklistState.verificationNotes}
                  onChange={e => setChecklistState({ ...checklistState, verificationNotes: e.target.value })}
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200"
                />
              </div>
            </div>

            {/* Mandatory Decision Reason Input */}
            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">
                Decision Audit Reason (Min 5 chars):
              </label>
              <textarea
                rows={2}
                placeholder="State the audit rationale for this decision..."
                value={decisionReason}
                onChange={e => setDecisionReason(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-200"
                required
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={handleSaveRiderChecklist}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold"
              >
                Save Checklist
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleRiderDecision('SUSPEND')}
                  className="px-3 py-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded-lg text-xs font-bold"
                >
                  Suspend
                </button>
                <button
                  type="button"
                  onClick={() => handleRiderDecision('REQUEST_CHANGES')}
                  className="px-3 py-1.5 bg-amber-950 hover:bg-amber-900 border border-amber-800 text-amber-300 rounded-lg text-xs font-bold"
                >
                  Request Changes
                </button>
                <button
                  type="button"
                  disabled={!allFourChecked}
                  onClick={() => handleRiderDecision('APPROVE')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-black shadow-lg transition-all flex items-center gap-1 ${
                    allFourChecked
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" /> Approve & Activate Rider
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: LOG NEW INCIDENT */}
      {showNewIncidentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Report Field Incident
            </h3>

            <form onSubmit={handleCreateIncident} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Rider</label>
                <select
                  value={newIncidentForm.riderId}
                  onChange={e => setNewIncidentForm({ ...newIncidentForm, riderId: e.target.value })}
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-xs text-white"
                >
                  {riders.map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({r.phone})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Incident Type</label>
                <select
                  value={newIncidentForm.incidentType}
                  onChange={e => setNewIncidentForm({ ...newIncidentForm, incidentType: e.target.value })}
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-xs text-white"
                >
                  <option value="DELAYED_DELIVERY">Transit Delay (Traffic, Rail Crossing)</option>
                  <option value="VEHICLE_BREAKDOWN">Vehicle Breakdown (Flat tyre, Engine)</option>
                  <option value="SPILL_DAMAGE">Package Seal Damaged / Medicine Spill</option>
                  <option value="CUSTOMER_DISPUTE">Customer Dispute / Address Not Found</option>
                  <option value="CASH_DISCREPANCY">COD Cash Shortage at Doorstep</option>
                  <option value="ACCIDENT">Road Accident</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Severity</label>
                <select
                  value={newIncidentForm.severity}
                  onChange={e => setNewIncidentForm({ ...newIncidentForm, severity: e.target.value as any })}
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-xs text-white"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Incident Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detail the circumstances, location, and immediate remediation..."
                  value={newIncidentForm.description}
                  onChange={e => setNewIncidentForm({ ...newIncidentForm, description: e.target.value })}
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewIncidentModal(false)}
                  className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-black font-black rounded-lg text-xs shadow-lg"
                >
                  Submit Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: RESOLVE INCIDENT */}
      {selectedIncidentForResolve && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Resolve Field Incident
            </h3>
            <p className="text-xs text-zinc-400">{selectedIncidentForResolve.description}</p>

            <form onSubmit={handleResolveIncident} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Administrative Resolution Notes</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain remediation taken (e.g., rider replacement, customer voucher, insurance claim)..."
                  value={incidentResolutionNotes}
                  onChange={e => setIncidentResolutionNotes(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedIncidentForResolve(null)}
                  className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-lg text-xs shadow-lg"
                >
                  Mark Resolved
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
