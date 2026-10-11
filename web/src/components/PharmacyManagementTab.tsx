import React, { useState, useEffect } from 'react';
import {
  Store,
  CheckCircle2,
  AlertTriangle,
  Building2,
  ClipboardCheck,
  FileText,
  Percent,
  CalendarClock,
  AlertOctagon,
  RefreshCw,
  Power,
  Users,
  Check,
  X
} from 'lucide-react';

export interface PharmacyApplicationItem {
  id: string;
  pharmacyId?: string;
  businessName: string;
  legalEntityName: string;
  gstin?: string;
  addressLine1: string;
  city: string;
  pincode: string;
  authorisedRepresentativeName: string;
  authorisedRepresentativePhone: string;
  licenceForm20: string;
  licenceForm21?: string;
  licenceExpiryDate: string;
  licenceDocPath: string;
  premisesDocPath: string;
  idDocPath: string;
  pharmacistName: string;
  pharmacistRegNumber: string;
  pharmacistCouncil: string;
  pharmacistRegDocPath: string;
  bankAccountMasked?: string;
  bankIfsc?: string;
  status: 'draft' | 'submitted' | 'needs_changes' | 'verified' | 'suspended';
  reviewerComments?: string;
  createdAt: string;
  checklist?: {
    id: string;
    applicationId: string;
    licenceValidityVerified: boolean;
    registrationVerified: boolean;
    physicalAddressVerified: boolean;
    authorisedPersonsVerified: boolean;
    pharmacistCredentialsVerified: boolean;
    verificationNotes?: string;
  };
}

export interface VerifiedPharmacyItem {
  id: string;
  businessName: string;
  legalEntityName: string;
  contactPhone: string;
  addressLine1: string;
  city: string;
  pincode: string;
  isActive: boolean;
  isVerified: boolean;
  licenceNumber?: string;
  commission?: {
    commissionRatePct: number;
    fixedPlatformFeePaise: number;
    payoutCycle: string;
    bankAccountMasked?: string;
    bankIfsc?: string;
    beneficiaryName?: string;
  };
  scorecard?: {
    acceptanceRate: number;
    avgAcceptMinutes: number;
    avgPackMinutes: number;
    rejectionReasons: { reason: string; count: number }[];
    stockAccuracyRate: number;
    complaintsCount: number;
    activeLicenceStatus: string;
    licenceExpiryDate: string;
    daysToExpiry: number;
  };
}

export interface PharmacyLicenceTrackerItem {
  pharmacyId: string;
  businessName: string;
  licenceNumber: string;
  licenceExpiryDate: string;
  daysRemaining: number;
  status: 'VALID' | 'EXPIRING_SOON' | 'EXPIRING_CRITICAL' | 'EXPIRED';
  isActive: boolean;
}

export interface PharmacyComplianceExceptionItem {
  id: string;
  pharmacyId: string;
  pharmacyName?: string;
  orderId?: string;
  exceptionType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  reportedBy: string;
  resolutionNotes?: string;
  isResolved: boolean;
  createdAt: string;
}

interface PharmacyManagementTabProps {
  currentStaffUserId: string;
  onShowFeedback: (type: 'success' | 'error', text: string) => void;
}

export function PharmacyManagementTab({ currentStaffUserId, onShowFeedback }: PharmacyManagementTabProps) {
  const [subTab, setSubTab] = useState<'applications' | 'directory' | 'licences' | 'exceptions'>('applications');
  const [loading, setLoading] = useState(false);

  // Data states
  const [applications, setApplications] = useState<PharmacyApplicationItem[]>([]);
  const [pharmacies, setPharmacies] = useState<VerifiedPharmacyItem[]>([]);
  const [licences, setLicences] = useState<PharmacyLicenceTrackerItem[]>([]);
  const [exceptions, setExceptions] = useState<PharmacyComplianceExceptionItem[]>([]);

  // Modals state
  const [selectedApp, setSelectedApp] = useState<PharmacyApplicationItem | null>(null);
  const [appChecklist, setAppChecklist] = useState({
    licenceValidityVerified: false,
    registrationVerified: false,
    physicalAddressVerified: false,
    authorisedPersonsVerified: false,
    pharmacistCredentialsVerified: false,
    verificationNotes: ''
  });
  const [decisionReason, setDecisionReason] = useState('');

  // Lifecycle modal
  const [selectedPharmaForLifecycle, setSelectedPharmaForLifecycle] = useState<VerifiedPharmacyItem | null>(null);
  const [lifecycleAction, setLifecycleAction] = useState<'ACTIVATE' | 'SUSPEND' | 'REINSTATE'>('SUSPEND');
  const [lifecycleReason, setLifecycleReason] = useState('');

  // Commission modal
  const [selectedPharmaForCommission, setSelectedPharmaForCommission] = useState<VerifiedPharmacyItem | null>(null);
  const [commissionForm, setCommissionForm] = useState({
    commissionRatePct: 8.5,
    fixedPlatformFeePaise: 1500,
    payoutCycle: 'WEEKLY' as 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY',
    bankAccountMasked: '',
    bankIfsc: '',
    beneficiaryName: ''
  });

  // Scorecard modal
  const [selectedPharmaForScorecard, setSelectedPharmaForScorecard] = useState<VerifiedPharmacyItem | null>(null);

  // Staff modal
  const [selectedPharmaForStaff, setSelectedPharmaForStaff] = useState<VerifiedPharmacyItem | null>(null);
  const [staffList, setStaffList] = useState<Array<{ id: string; fullName: string; phone: string; role: string; isActive: boolean }>>([]);

  // Exceptions modals
  const [showNewExceptionModal, setShowNewExceptionModal] = useState(false);
  const [newExceptionForm, setNewExceptionForm] = useState({
    pharmacyId: 'pharm-gkp-1',
    exceptionType: 'STOCK_MISMATCH',
    severity: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    description: ''
  });
  const [selectedExceptionForResolve, setSelectedExceptionForResolve] = useState<PharmacyComplianceExceptionItem | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  useEffect(() => {
    fetchAllPharmacyData();
  }, [currentStaffUserId]);

  const fetchAllPharmacyData = async () => {
    setLoading(true);
    try {
      const [appsRes, pharmRes, licRes, excRes] = await Promise.all([
        fetch('http://localhost:4000/api/v1/admin/pharmacy-applications'),
        fetch('http://localhost:4000/api/v1/admin/pharmacies'),
        fetch('http://localhost:4000/api/v1/admin/pharmacies/licence-tracker'),
        fetch('http://localhost:4000/api/v1/admin/pharmacy-exceptions')
      ]);

      if (appsRes.ok) {
        const data = await appsRes.json();
        setApplications(data.applications || []);
      }
      if (pharmRes.ok) {
        const data = await pharmRes.json();
        setPharmacies(data.pharmacies || []);
      }
      if (licRes.ok) {
        const data = await licRes.json();
        setLicences(data.licences || []);
      }
      if (excRes.ok) {
        const data = await excRes.json();
        setExceptions(data.exceptions || []);
      }
    } catch (err) {
      console.error('Failed to load pharmacy data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReviewModal = (app: PharmacyApplicationItem) => {
    setSelectedApp(app);
    setAppChecklist({
      licenceValidityVerified: !!app.checklist?.licenceValidityVerified,
      registrationVerified: !!app.checklist?.registrationVerified,
      physicalAddressVerified: !!app.checklist?.physicalAddressVerified,
      authorisedPersonsVerified: !!app.checklist?.authorisedPersonsVerified,
      pharmacistCredentialsVerified: !!app.checklist?.pharmacistCredentialsVerified,
      verificationNotes: app.checklist?.verificationNotes || ''
    });
    setDecisionReason('');
  };

  const handleSaveChecklist = async () => {
    if (!selectedApp) return;
    try {
      const res = await fetch(`http://localhost:4000/api/v1/admin/pharmacy-applications/${selectedApp.id}/checklist`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-staff-user-id': currentStaffUserId },
        body: JSON.stringify(appChecklist)
      });
      if (res.ok) {
        onShowFeedback('success', 'Statutory verification checklist saved.');
        fetchAllPharmacyData();
      } else {
        const err = await res.json();
        onShowFeedback('error', err.error || 'Failed to update checklist.');
      }
    } catch (e: any) {
      onShowFeedback('error', e.message);
    }
  };

  const handleApplicationDecision = async (decision: 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT') => {
    if (!selectedApp) return;
    if (!decisionReason || decisionReason.trim().length < 5) {
      onShowFeedback('error', 'Mandatory review comments (min 5 characters) are required for regulatory accountability.');
      return;
    }

    try {
      // First ensure checklist is saved
      await fetch(`http://localhost:4000/api/v1/admin/pharmacy-applications/${selectedApp.id}/checklist`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-staff-user-id': currentStaffUserId },
        body: JSON.stringify(appChecklist)
      });

      const res = await fetch(`http://localhost:4000/api/v1/admin/pharmacy-applications/${selectedApp.id}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-staff-user-id': currentStaffUserId },
        body: JSON.stringify({ decision, reason: decisionReason })
      });

      const data = await res.json();
      if (res.ok) {
        onShowFeedback('success', data.message || `Application marked as ${decision}.`);
        setSelectedApp(null);
        fetchAllPharmacyData();
      } else {
        onShowFeedback('error', data.message || data.error || 'Failed to execute application decision.');
      }
    } catch (e: any) {
      onShowFeedback('error', e.message);
    }
  };

  const handleExecuteLifecycle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPharmaForLifecycle) return;
    if (!lifecycleReason || lifecycleReason.trim().length < 5) {
      onShowFeedback('error', 'Mandatory recorded reason required for pharmacy lifecycle change.');
      return;
    }

    try {
      const res = await fetch(`http://localhost:4000/api/v1/admin/pharmacies/${selectedPharmaForLifecycle.id}/lifecycle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-staff-user-id': currentStaffUserId },
        body: JSON.stringify({ action: lifecycleAction, reason: lifecycleReason })
      });

      const data = await res.json();
      if (res.ok) {
        onShowFeedback('success', `Pharmacy ${selectedPharmaForLifecycle.businessName} updated to ${lifecycleAction}. Affected orders: ${data.affectedOrders}`);
        setSelectedPharmaForLifecycle(null);
        fetchAllPharmacyData();
      } else {
        onShowFeedback('error', data.error || 'Failed to update lifecycle.');
      }
    } catch (e: any) {
      onShowFeedback('error', e.message);
    }
  };

  const handleEnforceLicenceExpiries = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/v1/admin/pharmacies/enforce-licence-expiries', {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        onShowFeedback('success', `Enforced licence checks. Expired/Hidden: ${data.expiredCount}, Near-Expiry Warnings: ${data.warningCount}`);
        fetchAllPharmacyData();
      }
    } catch (e: any) {
      onShowFeedback('error', e.message);
    }
  };

  const handleOpenCommissionModal = (pharma: VerifiedPharmacyItem) => {
    setSelectedPharmaForCommission(pharma);
    setCommissionForm({
      commissionRatePct: pharma.commission?.commissionRatePct || 8.5,
      fixedPlatformFeePaise: pharma.commission?.fixedPlatformFeePaise || 1500,
      payoutCycle: (pharma.commission?.payoutCycle as any) || 'WEEKLY',
      bankAccountMasked: pharma.commission?.bankAccountMasked || '••••••••4892',
      bankIfsc: pharma.commission?.bankIfsc || 'SBIN0001234',
      beneficiaryName: pharma.commission?.beneficiaryName || pharma.legalEntityName
    });
  };

  const handleSaveCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPharmaForCommission) return;

    try {
      const res = await fetch(`http://localhost:4000/api/v1/admin/pharmacies/${selectedPharmaForCommission.id}/commission`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-staff-user-id': currentStaffUserId },
        body: JSON.stringify(commissionForm)
      });
      if (res.ok) {
        onShowFeedback('success', `Updated commission rules for ${selectedPharmaForCommission.businessName}.`);
        setSelectedPharmaForCommission(null);
        fetchAllPharmacyData();
      } else {
        const err = await res.json();
        onShowFeedback('error', err.error || 'Failed to update commission.');
      }
    } catch (e: any) {
      onShowFeedback('error', e.message);
    }
  };

  const handleOpenStaffModal = async (pharma: VerifiedPharmacyItem) => {
    setSelectedPharmaForStaff(pharma);
    try {
      const res = await fetch(`http://localhost:4000/api/v1/admin/pharmacies/${pharma.id}/staff`);
      if (res.ok) {
        const data = await res.json();
        setStaffList(data.staff || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateException = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExceptionForm.description || newExceptionForm.description.trim().length < 5) {
      onShowFeedback('error', 'Detailed description (min 5 chars) required.');
      return;
    }

    try {
      const res = await fetch('http://localhost:4000/api/v1/admin/pharmacy-exceptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-staff-user-id': currentStaffUserId },
        body: JSON.stringify(newExceptionForm)
      });
      if (res.ok) {
        onShowFeedback('success', 'Compliance exception logged.');
        setShowNewExceptionModal(false);
        setNewExceptionForm({ pharmacyId: 'pharm-gkp-1', exceptionType: 'STOCK_MISMATCH', severity: 'MEDIUM', description: '' });
        fetchAllPharmacyData();
      }
    } catch (e: any) {
      onShowFeedback('error', e.message);
    }
  };

  const handleResolveException = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExceptionForResolve) return;
    if (!resolutionNotes || resolutionNotes.trim().length < 5) {
      onShowFeedback('error', 'Audit resolution notes (min 5 chars) required.');
      return;
    }

    try {
      const res = await fetch(`http://localhost:4000/api/v1/admin/pharmacy-exceptions/${selectedExceptionForResolve.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-staff-user-id': currentStaffUserId },
        body: JSON.stringify({ resolutionNotes })
      });
      if (res.ok) {
        onShowFeedback('success', 'Compliance exception resolved and logged.');
        setSelectedExceptionForResolve(null);
        setResolutionNotes('');
        fetchAllPharmacyData();
      }
    } catch (e: any) {
      onShowFeedback('error', e.message);
    }
  };

  const allFiveChecked =
    appChecklist.licenceValidityVerified &&
    appChecklist.registrationVerified &&
    appChecklist.physicalAddressVerified &&
    appChecklist.authorisedPersonsVerified &&
    appChecklist.pharmacistCredentialsVerified;

  return (
    <div className="space-y-6">
      {/* Top Banner & KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Partner Pharmacies</span>
            <Store className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-black text-white">{pharmacies.length}</div>
          <div className="text-[11px] text-teal-400 font-medium mt-1">
            {pharmacies.filter(p => p.isActive).length} active in Gorakhpur grid
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Onboarding Queue</span>
            <ClipboardCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">
            {applications.filter(a => a.status === 'submitted').length}
          </div>
          <div className="text-[11px] text-zinc-400 font-medium mt-1">
            Awaiting Form 20/21 verification
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Licence Expiries</span>
            <CalendarClock className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {licences.filter(l => l.status === 'EXPIRED' || l.status === 'EXPIRING_CRITICAL').length}
          </div>
          <div className="text-[11px] text-rose-400 font-medium mt-1">
            Critical or expired licences
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Open Exceptions</span>
            <AlertOctagon className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {exceptions.filter(e => !e.isResolved).length}
          </div>
          <div className="text-[11px] text-orange-400 font-medium mt-1">
            Audit discrepancies pending
          </div>
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setSubTab('applications')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
              subTab === 'applications' ? 'bg-teal-600 text-white shadow-lg' : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5" /> Onboarding Applications ({applications.length})
          </button>
          <button
            onClick={() => setSubTab('directory')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
              subTab === 'directory' ? 'bg-teal-600 text-white shadow-lg' : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            <Store className="w-3.5 h-3.5" /> Partner Directory ({pharmacies.length})
          </button>
          <button
            onClick={() => setSubTab('licences')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
              subTab === 'licences' ? 'bg-teal-600 text-white shadow-lg' : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            <CalendarClock className="w-3.5 h-3.5" /> Licence Expiry Tracker ({licences.length})
          </button>
          <button
            onClick={() => setSubTab('exceptions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
              subTab === 'exceptions' ? 'bg-teal-600 text-white shadow-lg' : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" /> Compliance Exceptions ({exceptions.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          {subTab === 'licences' && (
            <button
              onClick={handleEnforceLicenceExpiries}
              className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-200 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all"
            >
              <Power className="w-3 h-3 text-rose-400" /> Enforce Auto-Hide on Expiry
            </button>
          )}
          {subTab === 'exceptions' && (
            <button
              onClick={() => setShowNewExceptionModal(true)}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-black rounded-lg text-xs font-black flex items-center gap-1.5 transition-all shadow-lg"
            >
              <AlertTriangle className="w-3 h-3" /> Log Compliance Discrepancy
            </button>
          )}
          <button
            onClick={fetchAllPharmacyData}
            className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* SUBTAB 1: ONBOARDING APPLICATIONS QUEUE */}
      {subTab === 'applications' && (
        <div className="space-y-4">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-white">Pharmacy Applications Queue</h3>
                <p className="text-xs text-zinc-400">
                  Review statutory licences Form 20/21, premises plans, and UP Pharmacy Council registered dispensing staff.
                </p>
              </div>
            </div>

            <div className="divide-y divide-zinc-800/80">
              {applications.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-xs">No pharmacy onboarding applications found.</div>
              ) : (
                applications.map(app => (
                  <div key={app.id} className="p-4 hover:bg-zinc-800/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white">{app.businessName}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          app.status === 'verified'
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
                        <span>Legal: <strong className="text-zinc-200">{app.legalEntityName}</strong></span>
                        <span>Form 20: <strong className="text-zinc-200">{app.licenceForm20}</strong></span>
                        <span>Pharmacist: <strong className="text-zinc-200">{app.pharmacistName} ({app.pharmacistRegNumber})</strong></span>
                        <span>Location: <strong className="text-zinc-200">{app.addressLine1}, {app.city}</strong></span>
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
                        <ClipboardCheck className="w-3.5 h-3.5" /> Review & Checklist
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: PARTNER PHARMACIES DIRECTORY */}
      {subTab === 'directory' && (
        <div className="space-y-4">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-white">Verified Partner Pharmacies</h3>
                <p className="text-xs text-zinc-400">
                  Manage active network pharmacies, commercial commission rates, operational scorecards, and authorized staff.
                </p>
              </div>
            </div>

            <div className="divide-y divide-zinc-800/80">
              {pharmacies.map(pharma => (
                <div key={pharma.id} className="p-4 hover:bg-zinc-800/20 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white">{pharma.businessName}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        pharma.isActive
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                          : 'bg-rose-950/80 text-rose-400 border border-rose-800'
                      }`}>
                        {pharma.isActive ? 'ACTIVE IN GRID' : 'SUSPENDED / HIDDEN'}
                      </span>
                    </div>

                    <div className="text-xs text-zinc-400 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span>Address: <strong className="text-zinc-200">{pharma.addressLine1}, {pharma.city}</strong></span>
                      <span>Licence: <strong className="text-zinc-200">{pharma.licenceNumber || 'UP-GKP-20-847291'}</strong></span>
                      <span>Commission: <strong className="text-teal-400">{pharma.commission?.commissionRatePct || 8.5}%</strong></span>
                      <span>Cycle: <strong className="text-zinc-200">{pharma.commission?.payoutCycle || 'WEEKLY'}</strong></span>
                      {pharma.scorecard && (
                        <span>Acceptance: <strong className="text-emerald-400">{pharma.scorecard.acceptanceRate}%</strong></span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <button
                      onClick={() => {
                        setSelectedPharmaForLifecycle(pharma);
                        setLifecycleAction(pharma.isActive ? 'SUSPEND' : 'REINSTATE');
                        setLifecycleReason('');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 transition-all ${
                        pharma.isActive
                          ? 'bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300'
                          : 'bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-300'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" /> {pharma.isActive ? 'Suspend' : 'Reinstate'}
                    </button>

                    <button
                      onClick={() => handleOpenCommissionModal(pharma)}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-bold flex items-center gap-1"
                    >
                      <Percent className="w-3.5 h-3.5 text-teal-400" /> Commission Rules
                    </button>

                    <button
                      onClick={() => setSelectedPharmaForScorecard(pharma)}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-bold flex items-center gap-1"
                    >
                      <ClipboardCheck className="w-3.5 h-3.5 text-cyan-400" /> Scorecard
                    </button>

                    <button
                      onClick={() => handleOpenStaffModal(pharma)}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-bold flex items-center gap-1"
                    >
                      <Users className="w-3.5 h-3.5 text-amber-400" /> Staff
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: LICENCE EXPIRY TRACKER */}
      {subTab === 'licences' && (
        <div className="space-y-4">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-white">Statutory Drug Licence Expiry Tracker</h3>
                <p className="text-xs text-zinc-400">
                  Continuous tracking of Drug Sale Form 20/21 expiry dates. Expired licences are automatically hidden from customer routing.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800">
                  <tr>
                    <th className="p-3">Pharmacy Name</th>
                    <th className="p-3">Licence Form 20</th>
                    <th className="p-3">Expiry Date</th>
                    <th className="p-3">Days Remaining</th>
                    <th className="p-3">Compliance Status</th>
                    <th className="p-3">Grid Visibility</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80 text-zinc-300">
                  {licences.map((lic, idx) => (
                    <tr key={idx} className="hover:bg-zinc-800/20">
                      <td className="p-3 font-bold text-white">{lic.businessName}</td>
                      <td className="p-3 font-mono text-zinc-400">{lic.licenceNumber}</td>
                      <td className="p-3 font-mono">{lic.licenceExpiryDate}</td>
                      <td className="p-3">
                        <span className={`font-black ${
                          lic.daysRemaining <= 0 ? 'text-rose-400' : lic.daysRemaining <= 30 ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {lic.daysRemaining <= 0 ? 'EXPIRED' : `${lic.daysRemaining} days`}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          lic.status === 'VALID'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : lic.status === 'EXPIRING_SOON'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : lic.status === 'EXPIRING_CRITICAL'
                            ? 'bg-orange-950 text-orange-400 border border-orange-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}>
                          {lic.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`text-[11px] font-bold ${lic.isActive ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {lic.isActive ? 'Visible & Routable' : 'Auto-Hidden from Grid'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: COMPLIANCE EXCEPTIONS LOG */}
      {subTab === 'exceptions' && (
        <div className="space-y-4">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-white">Compliance Exceptions & Quality Log</h3>
                <p className="text-xs text-zinc-400">
                  Dispensing discrepancies, missing signatures, stock shortages, temperature alerts, and customer complaints.
                </p>
              </div>
            </div>

            <div className="divide-y divide-zinc-800/80">
              {exceptions.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-xs">No compliance exceptions logged.</div>
              ) : (
                exceptions.map(exc => (
                  <div key={exc.id} className="p-4 hover:bg-zinc-800/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          exc.severity === 'CRITICAL'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : exc.severity === 'HIGH'
                            ? 'bg-orange-950 text-orange-400 border border-orange-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}>
                          {exc.severity}
                        </span>
                        <span className="text-xs font-bold text-white font-mono">{exc.exceptionType}</span>
                        <span className="text-xs text-zinc-400">· {exc.pharmacyName || exc.pharmacyId}</span>
                      </div>

                      <p className="text-xs text-zinc-300">{exc.description}</p>

                      {exc.resolutionNotes && (
                        <div className="text-[11px] text-emerald-300 bg-emerald-950/40 p-2 rounded border border-emerald-800/60 mt-1">
                          <strong className="text-emerald-400">Resolved: </strong>{exc.resolutionNotes}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {exc.isResolved ? (
                        <span className="px-2 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedExceptionForResolve(exc);
                            setResolutionNotes('');
                          }}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-black font-black rounded-lg text-xs shadow-lg transition-all"
                        >
                          Resolve Discrepancy
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

      {/* MODAL 1: APPLICATION REVIEW & 5-POINT STATUTORY CHECKLIST */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-teal-400" />
                  Statutory Application Review: {selectedApp.businessName}
                </h3>
                <span className="text-xs text-zinc-400">Verification of Drug Sale Licence Form 20/21 & dispensing personnel</span>
              </div>
              <button onClick={() => setSelectedApp(null)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2 bg-zinc-950 border border-zinc-800 rounded-xl text-center">
                <FileText className="w-4 h-4 text-teal-400 mx-auto mb-1" />
                <span className="text-[10px] font-bold text-zinc-300 block">Licence Form 20</span>
                <span className="text-[9px] text-zinc-500 font-mono truncate">{selectedApp.licenceForm20}</span>
              </div>
              <div className="p-2 bg-zinc-950 border border-zinc-800 rounded-xl text-center">
                <FileText className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                <span className="text-[10px] font-bold text-zinc-300 block">Schedule C Form 21</span>
                <span className="text-[9px] text-zinc-500 font-mono truncate">{selectedApp.licenceForm21 || 'Attached'}</span>
              </div>
              <div className="p-2 bg-zinc-950 border border-zinc-800 rounded-xl text-center">
                <Building2 className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                <span className="text-[10px] font-bold text-zinc-300 block">Premises Plan</span>
                <span className="text-[9px] text-zinc-500 truncate">{selectedApp.city}</span>
              </div>
              <div className="p-2 bg-zinc-950 border border-zinc-800 rounded-xl text-center">
                <Users className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                <span className="text-[10px] font-bold text-zinc-300 block">UP Pharmacist Cert</span>
                <span className="text-[9px] text-zinc-500 font-mono truncate">{selectedApp.pharmacistRegNumber}</span>
              </div>
            </div>

            {/* 5-Point Statutory Verification Checklist */}
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 space-y-3">
              <span className="text-xs font-black text-teal-400 uppercase tracking-wider block">
                5-Point Statutory Verification Checklist (All Required for Approval)
              </span>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={appChecklist.licenceValidityVerified}
                  onChange={e => setAppChecklist({ ...appChecklist, licenceValidityVerified: e.target.checked })}
                  className="mt-0.5 w-4 h-4 accent-teal-500 rounded"
                />
                <span className="text-xs text-zinc-300">
                  <strong>1. Drug Sale Licence Validity:</strong> Form 20/21 verified against Uttar Pradesh Food Safety and Drug Administration portal.
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={appChecklist.registrationVerified}
                  onChange={e => setAppChecklist({ ...appChecklist, registrationVerified: e.target.checked })}
                  className="mt-0.5 w-4 h-4 accent-teal-500 rounded"
                />
                <span className="text-xs text-zinc-300">
                  <strong>2. Licensing Authority Registration:</strong> State drug authority registration certificate and GSTIN verified.
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={appChecklist.physicalAddressVerified}
                  onChange={e => setAppChecklist({ ...appChecklist, physicalAddressVerified: e.target.checked })}
                  className="mt-0.5 w-4 h-4 accent-teal-500 rounded"
                />
                <span className="text-xs text-zinc-300">
                  <strong>3. Physical Premises Inspection:</strong> Verification of physical location, temperature/cold chain storage, and sealed packing setup.
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={appChecklist.authorisedPersonsVerified}
                  onChange={e => setAppChecklist({ ...appChecklist, authorisedPersonsVerified: e.target.checked })}
                  className="mt-0.5 w-4 h-4 accent-teal-500 rounded"
                />
                <span className="text-xs text-zinc-300">
                  <strong>4. Authorised Representative KYC:</strong> Identity and authority documents of proprietor / managing director verified.
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={appChecklist.pharmacistCredentialsVerified}
                  onChange={e => setAppChecklist({ ...appChecklist, pharmacistCredentialsVerified: e.target.checked })}
                  className="mt-0.5 w-4 h-4 accent-teal-500 rounded"
                />
                <span className="text-xs text-zinc-300">
                  <strong>5. Qualified Registered Pharmacist:</strong> Pharmacist registration ({selectedApp.pharmacistRegNumber}) confirmed active on Uttar Pradesh Pharmacy Council register.
                </span>
              </label>

              <div className="pt-2">
                <input
                  type="text"
                  placeholder="Verification inspection notes..."
                  value={appChecklist.verificationNotes}
                  onChange={e => setAppChecklist({ ...appChecklist, verificationNotes: e.target.value })}
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200"
                />
              </div>
            </div>

            {/* Mandatory Decision Reason Input */}
            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">
                Mandatory Review Decision Reason (Min 5 chars):
              </label>
              <textarea
                rows={2}
                placeholder="State the audit rationale for this decision (recorded permanently in immutable audit ledger)..."
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
                onClick={handleSaveChecklist}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold"
              >
                Save Checklist State
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleApplicationDecision('REJECT')}
                  className="px-3 py-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded-lg text-xs font-bold"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => handleApplicationDecision('REQUEST_CHANGES')}
                  className="px-3 py-1.5 bg-amber-950 hover:bg-amber-900 border border-amber-800 text-amber-300 rounded-lg text-xs font-bold"
                >
                  Request Changes
                </button>
                <button
                  type="button"
                  disabled={!allFiveChecked}
                  onClick={() => handleApplicationDecision('APPROVE')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-black shadow-lg transition-all flex items-center gap-1 ${
                    allFiveChecked
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" /> Approve & Activate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: LIFECYCLE (ACTIVATE / SUSPEND / REINSTATE) */}
      {selectedPharmaForLifecycle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Power className="w-5 h-5 text-rose-400" />
              Pharmacy Lifecycle Action
            </h3>
            <p className="text-xs text-zinc-400">
              Target: <strong className="text-white">{selectedPharmaForLifecycle.businessName}</strong>. Suspension immediately removes catalogue products from customer search and cancels or reroutes open orders.
            </p>

            <form onSubmit={handleExecuteLifecycle} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Lifecycle Action</label>
                <select
                  value={lifecycleAction}
                  onChange={e => setLifecycleAction(e.target.value as any)}
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-xs text-white"
                >
                  <option value="SUSPEND">SUSPEND (Hide from catalogue, stop routing)</option>
                  <option value="ACTIVATE">ACTIVATE (Restore catalogue & order routing)</option>
                  <option value="REINSTATE">REINSTATE (Clear suspension)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Administrative Reason (Mandatory)</label>
                <textarea
                  rows={3}
                  required
                  placeholder="State the audit reason for this operational state change..."
                  value={lifecycleReason}
                  onChange={e => setLifecycleReason(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPharmaForLifecycle(null)}
                  className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-lg text-xs shadow-lg"
                >
                  Confirm Lifecycle Action
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: COMMISSION & COMMERCIAL SETTINGS */}
      {selectedPharmaForCommission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Percent className="w-5 h-5 text-teal-400" />
              Commission & Settlement Rules
            </h3>
            <span className="text-xs text-zinc-400">{selectedPharmaForCommission.businessName}</span>

            <form onSubmit={handleSaveCommission} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Commission Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="50"
                    value={commissionForm.commissionRatePct}
                    onChange={e => setCommissionForm({ ...commissionForm, commissionRatePct: parseFloat(e.target.value) })}
                    className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-xs text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Platform Fee (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={commissionForm.fixedPlatformFeePaise / 100}
                    onChange={e => setCommissionForm({ ...commissionForm, fixedPlatformFeePaise: Math.round(parseFloat(e.target.value) * 100) })}
                    className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-xs text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Payout Cycle</label>
                <select
                  value={commissionForm.payoutCycle}
                  onChange={e => setCommissionForm({ ...commissionForm, payoutCycle: e.target.value as any })}
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-xs text-white"
                >
                  <option value="DAILY">DAILY SETTLEMENT</option>
                  <option value="WEEKLY">WEEKLY BATCH (Standard)</option>
                  <option value="BIWEEKLY">BIWEEKLY BATCH</option>
                  <option value="MONTHLY">MONTHLY SETTLEMENT</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Masked Account</label>
                  <input
                    type="text"
                    value={commissionForm.bankAccountMasked}
                    onChange={e => setCommissionForm({ ...commissionForm, bankAccountMasked: e.target.value })}
                    className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">IFSC</label>
                  <input
                    type="text"
                    value={commissionForm.bankIfsc}
                    onChange={e => setCommissionForm({ ...commissionForm, bankIfsc: e.target.value })}
                    className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPharmaForCommission(null)}
                  className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-black rounded-lg text-xs shadow-lg"
                >
                  Save Commercial Terms
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: OPERATIONAL SCORECARD */}
      {selectedPharmaForScorecard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-cyan-400" />
                Scorecard: {selectedPharmaForScorecard.businessName}
              </h3>
              <button onClick={() => setSelectedPharmaForScorecard(null)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                <span className="text-[11px] text-zinc-400 block">Order Acceptance Rate</span>
                <span className="text-xl font-black text-emerald-400">
                  {selectedPharmaForScorecard.scorecard?.acceptanceRate || 97.2}%
                </span>
              </div>
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                <span className="text-[11px] text-zinc-400 block">Stock Accuracy</span>
                <span className="text-xl font-black text-cyan-400">
                  {selectedPharmaForScorecard.scorecard?.stockAccuracyRate || 99.4}%
                </span>
              </div>
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                <span className="text-[11px] text-zinc-400 block">Avg Time to Accept</span>
                <span className="text-xl font-black text-white">
                  {selectedPharmaForScorecard.scorecard?.avgAcceptMinutes || 1.4} mins
                </span>
              </div>
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                <span className="text-[11px] text-zinc-400 block">Avg Time to Pack</span>
                <span className="text-xl font-black text-white">
                  {selectedPharmaForScorecard.scorecard?.avgPackMinutes || 3.8} mins
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-zinc-300 block">Historical Rejection Breakdown</span>
              <div className="space-y-1.5">
                {(selectedPharmaForScorecard.scorecard?.rejectionReasons || [
                  { reason: 'Out of Stock Batch', count: 2 },
                  { reason: 'Clarification Needed on Strength', count: 1 }
                ]).map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-xs bg-zinc-950 p-2 rounded-lg border border-zinc-800">
                    <span className="text-zinc-300">{r.reason}</span>
                    <span className="font-bold text-amber-400">{r.count} orders</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: AUTHORISED STAFF LIST */}
      {selectedPharmaForStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                Staff: {selectedPharmaForStaff.businessName}
              </h3>
              <button onClick={() => setSelectedPharmaForStaff(null)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="divide-y divide-zinc-800">
              {staffList.map(s => (
                <div key={s.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white block">{s.fullName}</span>
                    <span className="text-zinc-400">{s.phone}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    s.role === 'pharmacist' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' : 'bg-zinc-800 text-zinc-300'
                  }`}>
                    {s.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: LOG COMPLIANCE EXCEPTION */}
      {showNewExceptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Log Compliance Exception
            </h3>

            <form onSubmit={handleCreateException} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Target Pharmacy</label>
                <select
                  value={newExceptionForm.pharmacyId}
                  onChange={e => setNewExceptionForm({ ...newExceptionForm, pharmacyId: e.target.value })}
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-xs text-white"
                >
                  {pharmacies.map(p => (
                    <option key={p.id} value={p.id}>{p.businessName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Exception Type</label>
                <select
                  value={newExceptionForm.exceptionType}
                  onChange={e => setNewExceptionForm({ ...newExceptionForm, exceptionType: e.target.value })}
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-xs text-white"
                >
                  <option value="STOCK_MISMATCH">Stock Discrepancy</option>
                  <option value="MISSING_PHARMACIST_SIGNATURE">Missing Pharmacist Counter-Signature</option>
                  <option value="TEMPERATURE_EXCURSION">Cold Chain Temperature Deviation</option>
                  <option value="DELAYED_HANDOVER">Delayed Handover to Rider (&gt;15 min)</option>
                  <option value="EXPIRED_STOCK_ATTEMPT">Attempted Dispensing of Near-Expiry Batch</option>
                  <option value="CUSTOMER_COMPLAINT">Customer Quality Complaint</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Severity</label>
                <select
                  value={newExceptionForm.severity}
                  onChange={e => setNewExceptionForm({ ...newExceptionForm, severity: e.target.value as any })}
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-xs text-white"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Discrepancy Details</label>
                <textarea
                  rows={3}
                  required
                  placeholder="State the observed non-compliance..."
                  value={newExceptionForm.description}
                  onChange={e => setNewExceptionForm({ ...newExceptionForm, description: e.target.value })}
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewExceptionModal(false)}
                  className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-black font-black rounded-lg text-xs shadow-lg"
                >
                  Log Exception
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 7: RESOLVE COMPLIANCE EXCEPTION */}
      {selectedExceptionForResolve && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Resolve Compliance Exception
            </h3>
            <p className="text-xs text-zinc-400">{selectedExceptionForResolve.description}</p>

            <form onSubmit={handleResolveException} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Audit Resolution Notes (Min 5 chars)</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain remediation, corrective actions, and inspection confirmation..."
                  value={resolutionNotes}
                  onChange={e => setResolutionNotes(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedExceptionForResolve(null)}
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
