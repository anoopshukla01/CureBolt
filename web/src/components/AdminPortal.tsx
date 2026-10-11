import React, { useState, useEffect } from 'react';
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  Lock,
  KeyRound,
  FileText,
  UserPlus,
  RefreshCw,
  Check,
  X,
  FileCheck2,
  Navigation,
  Bike,
  Store,
  DollarSign,
  Clock,
  AlertOctagon,
  ArrowUpRight,
  Filter,
  Phone,
  Sliders,
  Pause,
  Play,
  Radio,
  Info,
  RotateCcw,
  Power,
  Search,
  MapPin,
  User,
  Package
} from 'lucide-react';
import { PharmacyManagementTab } from './PharmacyManagementTab';
import { RiderManagementTab } from './RiderManagementTab';
import { CatalogueManagementTab } from './CatalogueManagementTab';

export type StaffRole = 'admin' | 'dispatcher' | 'support_operator';

interface StaffMember {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  role: StaffRole;
  isActive: boolean;
  lastStepUpAt?: string;
  createdAt: string;
}

interface TwoPersonApprovalItem {
  id: string;
  actionType: string;
  targetResourceId: string;
  requestedBy: string;
  requestedReason: string;
  payload: any;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvalReason?: string;
  createdAt: string;
}

interface AuditLogItem {
  id: string;
  actorId?: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details: any;
  timestamp: string;
}

interface AdminKpis {
  ordersToday: number;
  awaitingPharmacyReview: number;
  beingFulfilled: number;
  deliveriesInProgress: number;
  failedAndCancelled: number;
  revenuePaise: number;
  refundsPaise: number;
  codCashOutstandingPaise: number;
}

interface LiveMapPharmacy {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  pendingOrdersCount: number;
}

interface LiveMapRider {
  id: string;
  name: string;
  phone: string;
  latitude: number;
  longitude: number;
  isAvailable: boolean;
  currentLoad: number;
  cashInHandPaise: number;
  lastSeenSecondsAgo: number;
  heading?: number;
}

interface LiveMapDelivery {
  orderId: string;
  status: string;
  pharmacyId: string;
  pharmacyName: string;
  pharmacyLat: number;
  pharmacyLng: number;
  dropAddress: string;
  dropLat: number;
  dropLng: number;
  riderId?: string;
  riderName?: string;
  etaMinutes: number;
  isCod: boolean;
  codAmountPaise?: number;
}

interface OperationalAlertItem {
  id: string;
  alertType: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  entityType: string;
  entityId: string;
  slaBreachMinutes?: number;
  isResolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  createdAt: string;
}

// ============================================================================
// MILESTONE A3: DISPATCHER CONSOLE INTERFACES
// ============================================================================
interface DispatchQueueOrder {
  id: string;
  orderCode: string;
  pharmacyId: string;
  pharmacyName: string;
  pharmacyAddress: string;
  pharmacyLat: number;
  pharmacyLng: number;
  dropArea: string;
  dropAddress: string;
  dropLat: number;
  dropLng: number;
  packageCount: number;
  paymentMode: string;
  codAmountPaise?: number;
  state: string;
  ageMinutes: number;
  escalationCount: number;
  autoAssignmentPaused: boolean;
  assignedRiderId?: string;
  assignedRiderName?: string;
  currentOffer?: {
    offerId: string;
    riderId: string;
    riderName: string;
    expiresAt: string;
    secondsRemaining: number;
  };
}

interface DispatchRiderItem {
  riderId: string;
  userId: string;
  fullName: string;
  phone: string;
  isOnline: boolean;
  currentLatitude: number;
  currentLongitude: number;
  lastLocationUpdateAt: string;
  currentLoad: number;
  currentCashInHandPaise: number;
  acceptanceRate: number;
  rating: number;
  totalCompletedOrders: number;
  drivingLicenceExpiryDate: string;
  isApproved: boolean;
  isSuspended: boolean;
  distanceKm: number;
  etaMinutes: number;
}

interface AssignmentSettingsData {
  id: string;
  zoneId: string;
  zoneName: string;
  mode: 'AUTO_WITH_MANUAL_FALLBACK' | 'AUTO' | 'MANUAL';
  killSwitchEnabled: boolean;
  triggerPoint: 'on_acceptance' | 'on_packing' | 'on_packed';
  searchRadiusKm: number;
  offerTimeoutSeconds: number;
  maxEscalationOffers: number;
  escalationTimeLimitSeconds: number;
  maxConcurrentOrders: number;
  maxCodCashPaise: number;
  scoringWeights: {
    eta: number;
    load: number;
    idle: number;
    acceptance: number;
    rating: number;
  };
}

interface DecisionCandidate {
  riderId: string;
  riderName: string;
  totalScore: number;
  eligible: boolean;
  exclusionReason?: string;
  scoreBreakdown: {
    distanceKm: number;
    etaMinutes: number;
    etaScore: number;
    loadScore: number;
    idleScore: number;
    acceptanceScore: number;
    ratingScore: number;
    totalScore: number;
    eligible: boolean;
    exclusionReason?: string;
  };
}

interface AssignmentDecisionItem {
  id: string;
  orderId: string;
  zoneId: string;
  mode: string;
  evaluatedAt: string;
  candidateCount: number;
  candidates: DecisionCandidate[];
  selectedRiderId?: string;
  outcome: string;
  notes?: string;
  createdAt: string;
}

export function AdminPortal() {
  const [activeTab, setActiveTab] = useState<'overview' | 'livemap' | 'dispatch' | 'pharmacies' | 'riders' | 'catalogue' | 'alerts' | 'staff' | 'approvals' | 'breakglass' | 'audit'>('overview');
  
  // Active operating role
  const [currentStaffUserId, setCurrentStaffUserId] = useState<string>('usr-admin-1');
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [approvalsList, setApprovalsList] = useState<TwoPersonApprovalItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Milestone A2 State: KPIs, Live Map, Alerts
  const [kpis, setKpis] = useState<AdminKpis | null>(null);
  const [liveMapData, setLiveMapData] = useState<{ pharmacies: LiveMapPharmacy[]; riders: LiveMapRider[]; activeDeliveries: LiveMapDelivery[] }>({
    pharmacies: [],
    riders: [],
    activeDeliveries: []
  });
  const [alertsList, setAlertsList] = useState<OperationalAlertItem[]>([]);
  const [selectedAlertForResolution, setSelectedAlertForResolution] = useState<OperationalAlertItem | null>(null);
  const [alertResolutionNotes, setAlertResolutionNotes] = useState<string>('');
  const [liveMapPharmacyFilter, setLiveMapPharmacyFilter] = useState<string>('all');
  const [liveMapStatusFilter, setLiveMapStatusFilter] = useState<string>('all');
  const [alertsSeverityFilter, setAlertsSeverityFilter] = useState<'all' | 'critical' | 'warning'>('all');

  // Milestone A3 State: Dispatcher Console & Rider Assignment
  const [dispatchQueue, setDispatchQueue] = useState<DispatchQueueOrder[]>([]);
  const [dispatchRiders, setDispatchRiders] = useState<DispatchRiderItem[]>([]);
  const [dispatchMetrics, setDispatchMetrics] = useState<{
    avgTimeToAssignSeconds: number;
    offerAcceptanceRate: number;
    escalationsToManualCount: number;
    ordersWithNoRiderAvailableCount: number;
  }>({
    avgTimeToAssignSeconds: 54,
    offerAcceptanceRate: 0.88,
    escalationsToManualCount: 0,
    ordersWithNoRiderAvailableCount: 0
  });
  const [assignmentSettings, setAssignmentSettings] = useState<AssignmentSettingsData | null>(null);
  const [dispatchStatusFilter, setDispatchStatusFilter] = useState<string>('all');
  const [dispatchSearch, setDispatchSearch] = useState<string>('');
  const [riderAvailabilityFilter, setRiderAvailabilityFilter] = useState<'all' | 'online' | 'idle'>('all');
  
  // Dispatch Modals
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [selectedOrderForAssign, setSelectedOrderForAssign] = useState<DispatchQueueOrder | null>(null);
  const [selectedRiderIdForAssign, setSelectedRiderIdForAssign] = useState<string>('');
  const [manualAssignReason, setManualAssignReason] = useState<string>('');

  const [showContactModal, setShowContactModal] = useState<boolean>(false);
  const [contactOrder, setContactOrder] = useState<DispatchQueueOrder | null>(null);
  const [contactType, setContactType] = useState<'CALL_RIDER' | 'CALL_PHARMACY' | 'CALL_CUSTOMER'>('CALL_RIDER');
  const [contactTarget, setContactTarget] = useState<string>('');
  const [contactNotes, setContactNotes] = useState<string>('');

  const [showFailedDeliveryModal, setShowFailedDeliveryModal] = useState<boolean>(false);
  const [failedDeliveryOrder, setFailedDeliveryOrder] = useState<DispatchQueueOrder | null>(null);
  const [failedDeliveryAction, setFailedDeliveryAction] = useState<'redelivery' | 'return_to_pharmacy' | 'cancel_order'>('redelivery');
  const [failedDeliveryReason, setFailedDeliveryReason] = useState<string>('');

  const [showExplainabilityModal, setShowExplainabilityModal] = useState<boolean>(false);
  const [explainabilityDecisions, setExplainabilityDecisions] = useState<AssignmentDecisionItem[]>([]);
  const [selectedExplainOrderCode, setSelectedExplainOrderCode] = useState<string>('');

  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [settingsMode, setSettingsMode] = useState<'AUTO_WITH_MANUAL_FALLBACK' | 'AUTO' | 'MANUAL'>('AUTO_WITH_MANUAL_FALLBACK');
  const [settingsRadius, setSettingsRadius] = useState<number>(3.0);
  const [settingsTimeout, setSettingsTimeout] = useState<number>(45);
  const [settingsKillSwitch, setSettingsKillSwitch] = useState<boolean>(false);

  // Modals
  const [showCreateStaffModal, setShowCreateStaffModal] = useState<boolean>(false);
  const [showStepUpModal, setShowStepUpModal] = useState<boolean>(false);
  const [stepUpPendingAction, setStepUpPendingAction] = useState<(() => Promise<void>) | null>(null);
  const [stepUpTotpCode, setStepUpTotpCode] = useState<string>('123456');

  // Form states
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('9876543210');
  const [newStaffRole, setNewStaffRole] = useState<StaffRole>('dispatcher');
  const [newStaffReason, setNewStaffReason] = useState('Authorized for operations shift coverage');

  // Break-glass modal state
  const [breakGlassReason, setBreakGlassReason] = useState('');
  const [activeBreakGlassSession, setActiveBreakGlassSession] = useState<any | null>(null);

  // New approval request modal
  const [showRequestApprovalModal, setShowRequestApprovalModal] = useState<boolean>(false);
  const [newActionType, setNewActionType] = useState('OTC_DIRECT_TOGGLE');
  const [newTargetId, setNewTargetId] = useState('prd-amox-500');
  const [newApprovalReason, setNewApprovalReason] = useState('Statutory Schedule H classification review');

  const currentStaff = staffList.find(s => s.userId === currentStaffUserId) || {
    id: 'staff-1',
    userId: 'usr-admin-1',
    email: 'admin@medcure.in',
    fullName: 'Dr. Alok Verma',
    role: 'admin' as StaffRole,
    isActive: true,
    createdAt: ''
  };

  const isRoleAdmin = currentStaff.role === 'admin';
  const isRoleDispatcher = currentStaff.role === 'dispatcher';

  useEffect(() => {
    fetchData();
  }, [currentStaffUserId]);

  const fetchData = async () => {
    try {
      const [staffRes, approvalsRes, auditRes, kpiRes, mapRes, alertsRes, queueRes, ridersRes, settingsRes, metricsRes] = await Promise.all([
        fetch('http://localhost:4000/api/v1/admin/staff'),
        fetch('http://localhost:4000/api/v1/admin/approvals'),
        fetch('http://localhost:4000/api/v1/admin/audit-logs'),
        fetch('http://localhost:4000/api/v1/admin/overview/kpis', {
          headers: { 'x-staff-user-id': currentStaffUserId }
        }),
        fetch('http://localhost:4000/api/v1/admin/operations/live-map'),
        fetch('http://localhost:4000/api/v1/admin/operations/alerts', {
          headers: { 'x-staff-user-id': currentStaffUserId }
        }),
        fetch('http://localhost:4000/api/v1/dispatch/queue', {
          headers: { 'x-staff-user-id': currentStaffUserId }
        }),
        fetch('http://localhost:4000/api/v1/dispatch/riders'),
        fetch('http://localhost:4000/api/v1/dispatch/settings'),
        fetch('http://localhost:4000/api/v1/dispatch/metrics')
      ]);

      if (staffRes.ok) {
        const data = await staffRes.json();
        setStaffList(data.staff || []);
      }
      if (approvalsRes.ok) {
        const data = await approvalsRes.json();
        setApprovalsList(data.approvals || []);
      }
      if (auditRes.ok) {
        const data = await auditRes.json();
        setAuditLogs((data.logs || []).reverse());
      }
      if (kpiRes.ok) {
        const data = await kpiRes.json();
        setKpis(data.kpis);
      }
      if (mapRes.ok) {
        const data = await mapRes.json();
        setLiveMapData({
          pharmacies: data.pharmacies || [],
          riders: data.riders || [],
          activeDeliveries: data.activeDeliveries || []
        });
      }
      if (alertsRes.ok) {
        const data = await alertsRes.json();
        setAlertsList(data.alerts || []);
      }
      if (queueRes.ok) {
        const data = await queueRes.json();
        setDispatchQueue(data.orders || []);
      }
      if (ridersRes.ok) {
        const data = await ridersRes.json();
        setDispatchRiders(data.riders || []);
      }
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setAssignmentSettings(data.settings);
        setSettingsMode(data.settings.mode);
        setSettingsRadius(data.settings.searchRadiusKm);
        setSettingsTimeout(data.settings.offerTimeoutSeconds);
        setSettingsKillSwitch(data.settings.killSwitchEnabled);
      }
      if (metricsRes.ok) {
        const data = await metricsRes.json();
        setDispatchMetrics(data.metrics);
      }
    } catch (e) {
      console.error('Error fetching admin data:', e);
    }
  };

  const handleManualAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForAssign || !selectedRiderIdForAssign) return;
    if (!manualAssignReason || manualAssignReason.trim().length < 5) {
      setFeedbackMessage({ type: 'error', text: 'Mandatory reason of at least 5 characters required for manual assignment.' });
      return;
    }

    try {
      const res = await fetch('http://localhost:4000/api/v1/dispatch/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-staff-user-id': currentStaff.userId
        },
        body: JSON.stringify({
          orderId: selectedOrderForAssign.id,
          riderId: selectedRiderIdForAssign,
          reason: manualAssignReason,
          staffUserId: currentStaff.userId
        })
      });

      const data = await res.json();
      if (res.ok) {
        setFeedbackMessage({ type: 'success', text: `Order ${selectedOrderForAssign.orderCode} assigned to rider.` });
        setShowAssignModal(false);
        setSelectedOrderForAssign(null);
        setSelectedRiderIdForAssign('');
        setManualAssignReason('');
        fetchData();
      } else {
        setFeedbackMessage({ type: 'error', text: data.message || 'Failed to assign rider.' });
      }
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: `Error: ${err}` });
    }
  };

  const handleUnassignRider = async (orderId: string, orderCode: string) => {
    const reason = window.prompt(`Enter reason to unassign rider from order ${orderCode}:`, 'Rider vehicle breakdown reported, re-queueing for emergency dispatch');
    if (!reason || reason.trim().length < 5) {
      if (reason !== null) setFeedbackMessage({ type: 'error', text: 'A detailed reason (min 5 chars) is mandatory to unassign.' });
      return;
    }

    try {
      const res = await fetch('http://localhost:4000/api/v1/dispatch/unassign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-staff-user-id': currentStaff.userId
        },
        body: JSON.stringify({
          orderId,
          reason,
          staffUserId: currentStaff.userId
        })
      });

      const data = await res.json();
      if (res.ok) {
        setFeedbackMessage({ type: 'success', text: `Order ${orderCode} rider unassigned and returned to queue.` });
        fetchData();
      } else {
        setFeedbackMessage({ type: 'error', text: data.message || 'Failed to unassign.' });
      }
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: `Error: ${err}` });
    }
  };

  const handleTogglePauseAuto = async (orderId: string, currentlyPaused: boolean) => {
    try {
      const res = await fetch('http://localhost:4000/api/v1/dispatch/pause-auto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-staff-user-id': currentStaff.userId
        },
        body: JSON.stringify({
          orderId,
          paused: !currentlyPaused,
          reason: currentlyPaused ? 'Dispatcher resumed automated engine' : 'Dispatcher paused automated assignment to review logistics',
          staffUserId: currentStaff.userId
        })
      });

      if (res.ok) {
        setFeedbackMessage({ type: 'success', text: `Automatic assignment ${currentlyPaused ? 'resumed' : 'paused'} for order.` });
        fetchData();
      }
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: `Error: ${err}` });
    }
  };

  const handleTriggerEngine = async (orderId: string, orderCode: string) => {
    try {
      const res = await fetch('http://localhost:4000/api/v1/dispatch/engine/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-staff-user-id': currentStaff.userId
        },
        body: JSON.stringify({ orderId, zoneId: 'zone-gkp-central' })
      });

      const data = await res.json();
      if (res.ok) {
        setFeedbackMessage({ type: 'success', text: `Engine evaluated ${orderCode}: Outcome is ${data.decision.outcome} (${data.decision.notes})` });
        fetchData();
      } else {
        setFeedbackMessage({ type: 'error', text: data.message || 'Engine evaluation failed' });
      }
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: `Error: ${err}` });
    }
  };

  const handleViewExplainability = async (orderId: string, orderCode: string) => {
    try {
      const res = await fetch(`http://localhost:4000/api/v1/dispatch/assignment-decisions/${orderId}`, {
        headers: { 'x-staff-user-id': currentStaff.userId }
      });
      const data = await res.json();
      if (res.ok) {
        setExplainabilityDecisions(data.decisions || []);
        setSelectedExplainOrderCode(orderCode);
        setShowExplainabilityModal(true);
      }
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: `Error: ${err}` });
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactOrder || !contactNotes || contactNotes.trim().length < 3) {
      setFeedbackMessage({ type: 'error', text: 'Contact notes required.' });
      return;
    }

    try {
      const res = await fetch('http://localhost:4000/api/v1/dispatch/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-staff-user-id': currentStaff.userId
        },
        body: JSON.stringify({
          orderId: contactOrder.id,
          interventionType: contactType,
          targetEntity: contactTarget || 'Support Operations',
          notes: contactNotes
        })
      });

      if (res.ok) {
        setFeedbackMessage({ type: 'success', text: 'Contact intervention logged in audit ledger.' });
        setShowContactModal(false);
        setContactOrder(null);
        setContactNotes('');
        fetchData();
      }
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: `Error: ${err}` });
    }
  };

  const handleFailedDeliverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!failedDeliveryOrder || !failedDeliveryReason || failedDeliveryReason.trim().length < 5) {
      setFeedbackMessage({ type: 'error', text: 'Detailed resolution reason required.' });
      return;
    }

    try {
      const res = await fetch('http://localhost:4000/api/v1/dispatch/failed-delivery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-staff-user-id': currentStaff.userId
        },
        body: JSON.stringify({
          orderId: failedDeliveryOrder.id,
          action: failedDeliveryAction,
          reason: failedDeliveryReason,
          staffUserId: currentStaff.userId
        })
      });

      if (res.ok) {
        setFeedbackMessage({ type: 'success', text: `Delivery exception resolved via ${failedDeliveryAction}.` });
        setShowFailedDeliveryModal(false);
        setFailedDeliveryOrder(null);
        setFailedDeliveryReason('');
        fetchData();
      }
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: `Error: ${err}` });
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:4000/api/v1/dispatch/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-staff-user-id': currentStaff.userId
        },
        body: JSON.stringify({
          zoneId: 'zone-gkp-central',
          mode: settingsMode,
          searchRadiusKm: settingsRadius,
          offerTimeoutSeconds: settingsTimeout,
          killSwitchEnabled: settingsKillSwitch
        })
      });

      if (res.ok) {
        setFeedbackMessage({ type: 'success', text: 'Assignment settings updated successfully.' });
        setShowSettingsModal(false);
        fetchData();
      }
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: `Error: ${err}` });
    }
  };

  const handleToggleKillSwitch = async () => {
    const nextState = !assignmentSettings?.killSwitchEnabled;
    const confirm = window.confirm(
      nextState 
        ? 'ACTIVATE KILL SWITCH? This immediately suspends automatic rider assignment platform-wide and forces all zones into MANUAL dispatcher assignment mode.' 
        : 'Deactivate kill switch and restore automatic rider assignment engine?'
    );
    if (!confirm) return;

    try {
      const res = await fetch('http://localhost:4000/api/v1/dispatch/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-staff-user-id': currentStaff.userId
        },
        body: JSON.stringify({
          zoneId: 'zone-gkp-central',
          killSwitchEnabled: nextState
        })
      });

      if (res.ok) {
        setFeedbackMessage({ 
          type: 'success', 
          text: nextState ? 'Platform kill switch activated. Manual mode forced.' : 'Kill switch deactivated. Automated engine restored.' 
        });
        fetchData();
      }
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: `Error: ${err}` });
    }
  };

  const handleAcknowledgeAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlertForResolution) return;
    if (!alertResolutionNotes || alertResolutionNotes.trim().length < 5) {
      setFeedbackMessage({ type: 'error', text: 'Resolution notes of at least 5 characters are required.' });
      return;
    }

    try {
      const res = await fetch(`http://localhost:4000/api/v1/admin/operations/alerts/${selectedAlertForResolution.id}/acknowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-staff-user-id': currentStaff.userId
        },
        body: JSON.stringify({
          staffUserId: currentStaff.userId,
          notes: alertResolutionNotes
        })
      });

      const data = await res.json();
      if (res.ok) {
        setFeedbackMessage({ type: 'success', text: `Alert '${selectedAlertForResolution.title}' acknowledged and marked resolved.` });
        setSelectedAlertForResolution(null);
        setAlertResolutionNotes('');
        fetchData();
      } else {
        setFeedbackMessage({ type: 'error', text: data.message || 'Failed to acknowledge alert.' });
      }
    } catch (e) {
      setFeedbackMessage({ type: 'error', text: `Error: ${e}` });
    }
  };

  const handleStepUpSubmit = async () => {
    if (stepUpTotpCode !== '123456') {
      setFeedbackMessage({ type: 'error', text: 'Invalid TOTP code entered. Use test code 123456.' });
      return;
    }

    try {
      const res = await fetch('http://localhost:4000/api/v1/admin/auth/step-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentStaff.userId, totpCode: stepUpTotpCode })
      });
      if (res.ok) {
        setShowStepUpModal(false);
        if (stepUpPendingAction) {
          await stepUpPendingAction();
          setStepUpPendingAction(null);
        }
      } else {
        setFeedbackMessage({ type: 'error', text: 'Step-up authentication failed.' });
      }
    } catch (e) {
      setFeedbackMessage({ type: 'error', text: `Step-up error: ${e}` });
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:4000/api/v1/admin/staff/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId: currentStaff.userId,
          fullName: newStaffName,
          email: newStaffEmail,
          phone: `+91${newStaffPhone.replace(/\D/g, '').slice(-10)}`,
          role: newStaffRole,
          reason: newStaffReason
        })
      });

      const data = await res.json();
      if (res.ok) {
        setFeedbackMessage({ type: 'success', text: `Staff account created for ${data.staff.fullName} (${data.staff.role})` });
        setShowCreateStaffModal(false);
        setNewStaffName('');
        setNewStaffEmail('');
        fetchData();
      } else {
        setFeedbackMessage({ type: 'error', text: data.error || 'Failed to create staff' });
      }
    } catch (e) {
      setFeedbackMessage({ type: 'error', text: `Error: ${e}` });
    }
  };

  const handleDecideApproval = async (approvalId: string, decision: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`http://localhost:4000/api/v1/admin/approvals/${approvalId}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decidedBy: currentStaff.userId,
          decision,
          reason: `Resolved by ${currentStaff.fullName} as ${decision}`,
          totpCode: '123456'
        })
      });

      const data = await res.json();
      if (res.ok) {
        setFeedbackMessage({ type: 'success', text: `Two-person approval item resolved as ${decision}.` });
        fetchData();
      } else {
        setFeedbackMessage({ type: 'error', text: data.error || 'Failed to resolve approval' });
      }
    } catch (e) {
      setFeedbackMessage({ type: 'error', text: `Error: ${e}` });
    }
  };

  const handleCreateApprovalRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:4000/api/v1/admin/approvals/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestedBy: currentStaff.userId,
          actionType: newActionType,
          targetResourceId: newTargetId,
          reason: newApprovalReason,
          payload: { initiatedAt: new Date().toISOString() }
        })
      });

      const data = await res.json();
      if (res.ok) {
        setFeedbackMessage({ type: 'success', text: 'Approval request submitted. Awaiting second human administrator approval.' });
        setShowRequestApprovalModal(false);
        fetchData();
      } else {
        setFeedbackMessage({ type: 'error', text: data.error || 'Submission failed' });
      }
    } catch (e) {
      setFeedbackMessage({ type: 'error', text: `Error: ${e}` });
    }
  };

  const handleBreakGlassPrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!breakGlassReason || breakGlassReason.trim().length < 10) {
      setFeedbackMessage({ type: 'error', text: 'A detailed medical or regulatory reason (at least 10 characters) is legally required.' });
      return;
    }

    try {
      const res = await fetch('http://localhost:4000/api/v1/admin/prescriptions/rx-sample-gkp-1/break-glass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffUserId: currentStaff.userId,
          reason: breakGlassReason,
          totpCode: '123456'
        })
      });

      const data = await res.json();
      if (res.ok) {
        setActiveBreakGlassSession(data);
        setFeedbackMessage({ type: 'success', text: 'Break-glass session opened for 15 minutes. Audited permanently.' });
        fetchData();
      } else {
        setFeedbackMessage({ type: 'error', text: data.message || data.error || 'Access denied.' });
      }
    } catch (e) {
      setFeedbackMessage({ type: 'error', text: `Error: ${e}` });
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans">
      {/* Top Bar with Role Switcher */}
      <header className="border-b border-zinc-800 bg-[#121215] sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-white">Medcure Operations HQ</h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-950 text-teal-400 border border-teal-800">
                  Gorakhpur Fleet
                </span>
              </div>
              <p className="text-xs text-zinc-400">Platform Admin, Dispatcher & Support Operator Console</p>
            </div>
          </div>

          {/* Test Persona / Role Switcher */}
          <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 p-1.5 rounded-xl">
            <span className="text-xs font-semibold text-zinc-400 pl-2">Active Persona:</span>
            <select
              value={currentStaffUserId}
              onChange={(e) => setCurrentStaffUserId(e.target.value)}
              className="bg-black text-xs font-bold text-white border border-zinc-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-teal-500"
            >
              <option value="usr-admin-1">Dr. Alok Verma (Admin 1)</option>
              <option value="usr-admin-2">Sanjay Pandey (Admin 2)</option>
              <option value="usr-dispatch-1">Rohit Tripathi (Dispatcher)</option>
              <option value="usr-support-1">Ananya Singh (Support Operator)</option>
            </select>
            <div className={`px-2 py-1 rounded text-[11px] font-black uppercase tracking-wider ${
              isRoleAdmin ? 'bg-amber-950 text-amber-300 border border-amber-800' :
              isRoleDispatcher ? 'bg-blue-950 text-blue-300 border border-blue-800' :
              'bg-emerald-950 text-emerald-300 border border-emerald-800'
            }`}>
              {currentStaff.role}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto flex items-center gap-2 mt-4 pt-2 border-t border-zinc-800/60 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'overview' ? 'bg-teal-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" /> Overview & KPIs
          </button>
          <button
            onClick={() => setActiveTab('livemap')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 relative ${
              activeTab === 'livemap' ? 'bg-teal-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" /> Live Operations Map
            <span className="px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-black">
              {liveMapData.activeDeliveries.length} in flight
            </span>
          </button>
          <button
            onClick={() => setActiveTab('dispatch')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 relative ${
              activeTab === 'dispatch' ? 'bg-teal-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" /> Dispatcher Console
            {dispatchQueue.filter(o => o.state === 'PACKED' || o.state === 'DELIVERY_FAILED').length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-black text-[10px] font-black">
                {dispatchQueue.filter(o => o.state === 'PACKED' || o.state === 'DELIVERY_FAILED').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('pharmacies')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'pharmacies' ? 'bg-teal-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Store className="w-3.5 h-3.5" /> Pharmacies & Compliance
          </button>
          <button
            onClick={() => setActiveTab('riders')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'riders' ? 'bg-teal-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Bike className="w-3.5 h-3.5" /> Delivery Fleet & COD
          </button>
          <button
            onClick={() => setActiveTab('catalogue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'catalogue' ? 'bg-teal-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5" /> Master Catalogue & Recalls
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 relative ${
              activeTab === 'alerts' ? 'bg-teal-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" /> Operational Alerts
            {alertsList.filter(a => !a.isResolved).length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black">
                {alertsList.filter(a => !a.isResolved).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'staff' ? 'bg-teal-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Staff Accounts ({staffList.length})
          </button>
          <button
            onClick={() => setActiveTab('approvals')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all relative ${
              activeTab === 'approvals' ? 'bg-teal-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Two-Person Approvals
            {approvalsList.filter(a => a.status === 'pending').length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-amber-500 text-black text-[10px] font-black">
                {approvalsList.filter(a => a.status === 'pending').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('breakglass')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'breakglass' ? 'bg-teal-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Prescription Break-Glass
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'audit' ? 'bg-teal-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Tamper-Evident Audit Trail ({auditLogs.length})
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6">
        {feedbackMessage && (
          <div className={`mb-6 p-4 rounded-xl border flex items-center justify-between ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-200'
              : 'bg-rose-950/60 border-rose-800 text-rose-200'
          }`}>
            <div className="flex items-center gap-3">
              {feedbackMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              <span className="text-sm font-semibold">{feedbackMessage.text}</span>
            </div>
            <button onClick={() => setFeedbackMessage(null)} className="text-zinc-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* TAB 1: OVERVIEW & KPIS */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 8 Live Operational KPI Tiles (Milestone A2) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#18181b] border border-zinc-800 p-4 rounded-2xl">
                <div className="flex items-center justify-between text-zinc-400 mb-1">
                  <span className="text-xs font-semibold">Orders Today</span>
                  <Clock className="w-4 h-4 text-teal-400" />
                </div>
                <div className="text-2xl font-black text-white">{kpis?.ordersToday ?? 0}</div>
                <div className="text-[11px] text-zinc-500 mt-1">Gorakhpur Urban Micro-Hub</div>
              </div>

              <div className="bg-[#18181b] border border-zinc-800 p-4 rounded-2xl">
                <div className="flex items-center justify-between text-zinc-400 mb-1">
                  <span className="text-xs font-semibold">Awaiting Pharmacy Review</span>
                  <Store className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-amber-400">{kpis?.awaitingPharmacyReview ?? 0}</div>
                <div className="text-[11px] text-amber-500/80 mt-1">Pharmacist Verification Queue</div>
              </div>

              <div className="bg-[#18181b] border border-zinc-800 p-4 rounded-2xl">
                <div className="flex items-center justify-between text-zinc-400 mb-1">
                  <span className="text-xs font-semibold">Being Fulfilled & Packed</span>
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl font-black text-blue-400">{kpis?.beingFulfilled ?? 0}</div>
                <div className="text-[11px] text-zinc-500 mt-1">Sealing in tamper-evident bag</div>
              </div>

              <div className="bg-[#18181b] border border-zinc-800 p-4 rounded-2xl">
                <div className="flex items-center justify-between text-zinc-400 mb-1">
                  <span className="text-xs font-semibold">Deliveries in Progress</span>
                  <Bike className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-2xl font-black text-cyan-400">{kpis?.deliveriesInProgress ?? 0}</div>
                <div className="text-[11px] text-zinc-500 mt-1">Rider on route to doorstep</div>
              </div>

              <div className="bg-[#18181b] border border-zinc-800 p-4 rounded-2xl">
                <div className="flex items-center justify-between text-zinc-400 mb-1">
                  <span className="text-xs font-semibold">Failed & Cancelled</span>
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                </div>
                <div className="text-2xl font-black text-rose-400">{kpis?.failedAndCancelled ?? 0}</div>
                <div className="text-[11px] text-zinc-500 mt-1">SLA expired or customer cancelled</div>
              </div>

              <div className="bg-[#18181b] border border-zinc-800 p-4 rounded-2xl">
                <div className="flex items-center justify-between text-zinc-400 mb-1">
                  <span className="text-xs font-semibold">Gross Revenue</span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-emerald-400">
                  {isRoleAdmin ? `₹${((kpis?.revenuePaise ?? 0) / 100).toLocaleString('en-IN')}` : '••••••'}
                </div>
                <div className="text-[11px] text-zinc-500 mt-1">
                  {isRoleAdmin ? 'Captured via Gateway + Settled COD' : 'Restricted (Admin Only)'}
                </div>
              </div>

              <div className="bg-[#18181b] border border-zinc-800 p-4 rounded-2xl">
                <div className="flex items-center justify-between text-zinc-400 mb-1">
                  <span className="text-xs font-semibold">Total Refunds</span>
                  <RefreshCw className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl font-black text-purple-400">
                  {isRoleAdmin ? `₹${((kpis?.refundsPaise ?? 0) / 100).toLocaleString('en-IN')}` : '••••••'}
                </div>
                <div className="text-[11px] text-zinc-500 mt-1">
                  {isRoleAdmin ? 'Returned to source' : 'Restricted (Admin Only)'}
                </div>
              </div>

              <div className="bg-[#18181b] border border-zinc-800 p-4 rounded-2xl">
                <div className="flex items-center justify-between text-zinc-400 mb-1">
                  <span className="text-xs font-semibold">COD Cash Outstanding</span>
                  <DollarSign className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-amber-400">
                  {isRoleAdmin || isRoleDispatcher ? `₹${((kpis?.codCashOutstandingPaise ?? 0) / 100).toLocaleString('en-IN')}` : '••••••'}
                </div>
                <div className="text-[11px] text-zinc-500 mt-1">In rider wallets (₹5,000 max limit)</div>
              </div>
            </div>

            {/* Quick Operational Status Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-[#18181b] border border-zinc-800 p-5 rounded-2xl">
                <span className="text-xs text-zinc-400 font-semibold block mb-1">Active Operating Role</span>
                <span className="text-xl font-black text-teal-400 capitalize">{currentStaff.role}</span>
                <p className="text-xs text-zinc-500 mt-2">
                  {isRoleAdmin ? 'Full operational control with step-up verification and break-glass logging.' :
                   isRoleDispatcher ? 'Live order tracking and manual rider assignment only. No prescription access.' :
                   'Permitted ticket handling and masked customer queries. No financial or prescription access.'}
                </p>
              </div>

              <div className="bg-[#18181b] border border-zinc-800 p-5 rounded-2xl">
                <span className="text-xs text-zinc-400 font-semibold block mb-1">Partner Network Health</span>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-lg font-black text-white">{liveMapData.pharmacies.filter(p => p.isActive).length} Pharmacies</span>
                  <span className="text-zinc-600">|</span>
                  <span className="text-lg font-black text-cyan-400">{liveMapData.riders.filter(r => r.isAvailable).length} Active Riders</span>
                </div>
                <p className="text-xs text-zinc-500 mt-2">Gorakhpur urban zones (Golghar, Medical College, Betiahata)</p>
              </div>

              <div className="bg-[#18181b] border border-zinc-800 p-5 rounded-2xl">
                <span className="text-xs text-zinc-400 font-semibold block mb-1">Open Operational Alerts</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xl font-black text-rose-400">
                    {alertsList.filter(a => !a.isResolved && a.severity === 'critical').length} Critical
                  </span>
                  <span className="text-xs text-zinc-500">
                    ({alertsList.filter(a => !a.isResolved).length} total unresolved)
                  </span>
                </div>
                <button
                  onClick={() => setActiveTab('alerts')}
                  className="mt-2 text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1"
                >
                  Inspect Incident Queue <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Server-Enforced RBAC Permissions Matrix */}
            <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-black text-white">Server-Enforced RBAC Permission Matrix</h2>
                  <p className="text-xs text-zinc-400">Enforced at API gateway and PostgreSQL RLS layers, not by hiding UI buttons</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span> Active Session
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-400 uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">Operational Capability</th>
                      <th className="py-3 px-4 text-center">Platform Admin</th>
                      <th className="py-3 px-4 text-center">Dispatcher</th>
                      <th className="py-3 px-4 text-center">Support Operator</th>
                      <th className="py-3 px-4">Your Active Access</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850 text-zinc-300">
                    <tr>
                      <td className="py-3.5 px-4 font-semibold">Overview & Analytics</td>
                      <td className="py-3.5 px-4 text-center text-emerald-400 font-bold">Full</td>
                      <td className="py-3.5 px-4 text-center text-blue-400">Operational Only</td>
                      <td className="py-3.5 px-4 text-center text-zinc-400">Ticket Metrics</td>
                      <td className="py-3.5 px-4 font-bold text-white">
                        {isRoleAdmin ? 'Full Access' : isRoleDispatcher ? 'Operational Dashboard' : 'Ticket Scope'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-semibold">Pharmacy & Rider Verification</td>
                      <td className="py-3.5 px-4 text-center text-emerald-400 font-bold">Yes</td>
                      <td className="py-3.5 px-4 text-center text-rose-400">No</td>
                      <td className="py-3.5 px-4 text-center text-rose-400">No</td>
                      <td className="py-3.5 px-4">
                        {isRoleAdmin ? <span className="text-emerald-400 font-bold">Permitted</span> : <span className="text-rose-400">Blocked (HTTP 403)</span>}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-semibold">Catalogue, Restrictions & Recalls</td>
                      <td className="py-3.5 px-4 text-center text-emerald-400 font-bold">Yes (2-Person Gate)</td>
                      <td className="py-3.5 px-4 text-center text-rose-400">No</td>
                      <td className="py-3.5 px-4 text-center text-zinc-400">Read Only</td>
                      <td className="py-3.5 px-4">
                        {isRoleAdmin ? <span className="text-emerald-400 font-bold">Full Control</span> : <span className="text-zinc-500">Read Only</span>}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-semibold">Orders (View, Override, Refund)</td>
                      <td className="py-3.5 px-4 text-center text-emerald-400 font-bold">Yes (Step-Up)</td>
                      <td className="py-3.5 px-4 text-center text-blue-400">View & Assign Only</td>
                      <td className="py-3.5 px-4 text-center text-zinc-400">Permitted Fields</td>
                      <td className="py-3.5 px-4 font-bold">
                        {isRoleAdmin ? 'Override & Refund' : isRoleDispatcher ? 'Assign Riders' : 'Ticket Issues Only'}
                      </td>
                    </tr>
                    <tr className="bg-rose-950/20">
                      <td className="py-3.5 px-4 font-bold text-rose-300">Prescription Files & Clinical Data</td>
                      <td className="py-3.5 px-4 text-center text-amber-400 font-bold">Break-Glass Only</td>
                      <td className="py-3.5 px-4 text-center text-rose-500 font-black">STRICTLY NO</td>
                      <td className="py-3.5 px-4 text-center text-rose-500 font-black">STRICTLY NO</td>
                      <td className="py-3.5 px-4 font-black">
                        {isRoleAdmin ? <span className="text-amber-400">Break-Glass with Reason</span> : <span className="text-rose-400">Zero Clinical Access</span>}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-semibold">Settings, Delivery Zones & Fees</td>
                      <td className="py-3.5 px-4 text-center text-emerald-400 font-bold">Yes</td>
                      <td className="py-3.5 px-4 text-center text-rose-400">No</td>
                      <td className="py-3.5 px-4 text-center text-rose-400">No</td>
                      <td className="py-3.5 px-4">
                        {isRoleAdmin ? <span className="text-emerald-400 font-bold">Configurable</span> : <span className="text-rose-400">Blocked</span>}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LIVE OPERATIONS MAP (MILESTONE A2) */}
        {activeTab === 'livemap' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-cyan-400" /> Gorakhpur Pilot Live Operations Map
                </h2>
                <p className="text-xs text-zinc-400">
                  Real-time telemetry of partner pharmacy hubs, active fleet riders, and in-flight doorstep deliveries.
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs">
                  <Filter className="w-3.5 h-3.5 text-zinc-400" />
                  <select
                    value={liveMapPharmacyFilter}
                    onChange={(e) => setLiveMapPharmacyFilter(e.target.value)}
                    className="bg-transparent text-white font-semibold focus:outline-none"
                  >
                    <option value="all">All Micro-Hubs</option>
                    {liveMapData.pharmacies.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs">
                  <span className="text-zinc-500 font-bold">Status:</span>
                  <select
                    value={liveMapStatusFilter}
                    onChange={(e) => setLiveMapStatusFilter(e.target.value)}
                    className="bg-transparent text-white font-semibold focus:outline-none"
                  >
                    <option value="all">All In-Flight</option>
                    <option value="out_for_delivery">Out For Delivery</option>
                    <option value="rider_assigned">Rider Assigned</option>
                    <option value="packing">Packing</option>
                    <option value="pending_pharmacist_review">Awaiting Review</option>
                  </select>
                </div>

                <button
                  onClick={fetchData}
                  className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-all"
                  title="Refresh Live Telemetry"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tactical SVG Operations Map */}
            <div className="bg-[#121214] border border-zinc-800 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between mb-4 text-xs">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                    <span className="text-zinc-300 font-semibold">Pharmacy Micro-Hub</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                    <span className="text-zinc-300 font-semibold">Fleet Partner (Active)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    <span className="text-zinc-300 font-semibold">Doorstep Delivery</span>
                  </div>
                </div>

                <div className="text-[11px] text-zinc-500 font-mono">
                  BOUNDS: GORAKHPUR URBAN PILOT (26.65°N - 26.85°N, 83.25°E - 83.45°E)
                </div>
              </div>

              {/* Map Canvas */}
              <div className="w-full h-[420px] bg-[#09090b] rounded-2xl border border-zinc-850 relative flex items-center justify-center overflow-hidden">
                <svg className="w-full h-full" viewBox="0 0 800 420" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#27272a" strokeWidth="0.5" strokeOpacity="0.4" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />

                  {/* Arterial Road Paths for Gorakhpur Landmarks */}
                  {/* Medical College Road */}
                  <path d="M 400 30 L 420 180 L 450 380" stroke="#3f3f46" strokeWidth="2.5" strokeDasharray="4 2" fill="none" opacity="0.6" />
                  {/* Golghar - Park Road Arterial */}
                  <path d="M 200 200 L 420 180 L 680 160" stroke="#3f3f46" strokeWidth="3" fill="none" opacity="0.6" />
                  {/* Betiahata Crossroad */}
                  <path d="M 350 350 L 420 180 L 520 80" stroke="#3f3f46" strokeWidth="2" fill="none" opacity="0.5" />

                  {/* Landmark Text Badges */}
                  <text x="430" y="50" fill="#71717a" fontSize="10" fontWeight="bold">BRD MEDICAL COLLEGE</text>
                  <text x="390" y="195" fill="#a1a1aa" fontSize="11" fontWeight="black">GOLGHAR CENTRAL</text>
                  <text x="300" y="320" fill="#71717a" fontSize="10" fontWeight="bold">BETIAHATA</text>
                  <text x="580" y="150" fill="#71717a" fontSize="10" fontWeight="bold">GORAKHPUR JN</text>
                  <text x="120" y="350" fill="#52525b" fontSize="10" fontWeight="bold">RAPTI RIVER BASIN</text>

                  {/* Active Delivery Route Line (Dashed Cyan) */}
                  <line x1="420" y1="180" x2="560" y2="240" stroke="#06b6d4" strokeWidth="2" strokeDasharray="5 5" className="animate-pulse" />

                  {/* Pharmacy Pins */}
                  <g transform="translate(420, 180)" className="cursor-pointer">
                    <circle r="14" fill="#10b981" fillOpacity="0.2" className="animate-ping" />
                    <circle r="9" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                    <text x="14" y="4" fill="#34d399" fontSize="10" fontWeight="black">City Central Pharmacy (HQ)</text>
                  </g>

                  {/* Rider Pins */}
                  <g transform="translate(480, 210)" className="cursor-pointer">
                    <circle r="12" fill="#06b6d4" fillOpacity="0.2" className="animate-ping" />
                    <circle r="7" fill="#06b6d4" stroke="#ffffff" strokeWidth="1.5" />
                    <text x="12" y="4" fill="#22d3ee" fontSize="9" fontWeight="bold">Vikas Y. (Rider 1) • 1 Load</text>
                  </g>

                  {/* Customer Drop Pin */}
                  <g transform="translate(560, 240)">
                    <circle r="8" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
                    <text x="12" y="4" fill="#fbbf24" fontSize="9" fontWeight="bold">Drop: Royal Residency (ETA 12m)</text>
                  </g>
                </svg>

                {/* Tactical Legend Overlay */}
                <div className="absolute bottom-3 left-3 bg-zinc-950/80 backdrop-blur-md border border-zinc-800 rounded-xl p-3 text-[11px] text-zinc-400 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>Gorakhpur Micro-Hub (Active Stock)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                    <span>Fleet Partner (GPS: UP53-AB-1234)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    <span>Customer Doorstep (Park Road, Golghar)</span>
                  </div>
                </div>
              </div>

              {/* Active Deliveries Stream Table */}
              <div className="mt-6">
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-3">
                  In-Flight Delivery Stream ({liveMapData.activeDeliveries.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-400 uppercase text-[10px] tracking-wider">
                        <th className="py-2.5 px-3">Order ID</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Dispatch Hub</th>
                        <th className="py-2.5 px-3">Drop Area</th>
                        <th className="py-2.5 px-3">Assigned Fleet</th>
                        <th className="py-2.5 px-3">Dynamic ETA</th>
                        <th className="py-2.5 px-3">Payment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-850 text-zinc-300">
                      {liveMapData.activeDeliveries.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-zinc-500 italic">
                            No orders currently in-flight. New placed orders will appear here dynamically.
                          </td>
                        </tr>
                      ) : (
                        liveMapData.activeDeliveries.map(d => (
                          <tr key={d.orderId} className="hover:bg-zinc-850/50">
                            <td className="py-3 px-3 font-mono font-bold text-white">{d.orderId}</td>
                            <td className="py-3 px-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                d.status === 'out_for_delivery' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' :
                                d.status === 'packing' ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                                'bg-amber-950 text-amber-300 border border-amber-800'
                              }`}>
                                {d.status.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="py-3 px-3">{d.pharmacyName}</td>
                            <td className="py-3 px-3">{d.dropAddress}</td>
                            <td className="py-3 px-3 font-semibold text-white">
                              {d.riderName || <span className="text-zinc-500 italic">Unassigned</span>}
                            </td>
                            <td className="py-3 px-3 font-bold text-cyan-400">{d.etaMinutes} mins</td>
                            <td className="py-3 px-3">
                              {d.isCod ? (
                                <span className="text-amber-400 font-semibold">COD ₹{((d.codAmountPaise || 0) / 100).toFixed(0)}</span>
                              ) : (
                                <span className="text-emerald-400 font-semibold">Prepaid</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: DISPATCHER CONSOLE (MILESTONE A3) */}
        {activeTab === 'dispatch' && (
          <div className="space-y-6">
            {/* Top Operational Bar */}
            <div className="bg-[#18181b] border border-zinc-800 p-5 rounded-2xl shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-teal-950 border border-teal-800 text-teal-400">
                    <Radio className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-white flex items-center gap-2">
                      Gorakhpur Dispatch Operations Hub
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-bold border border-zinc-700">
                        Zone: Gorakhpur Central Urban
                      </span>
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Live automated nearest-rider dispatch engine with deterministic scoring, cascade escalation, and manual supervisor override.
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Pills & Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Engine Mode Pill */}
                <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-bold ${
                  assignmentSettings?.killSwitchEnabled
                    ? 'bg-rose-950/80 border-rose-700 text-rose-300'
                    : 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${assignmentSettings?.killSwitchEnabled ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'}`} />
                  <span>
                    {assignmentSettings?.killSwitchEnabled ? 'KILL SWITCH ACTIVE: MANUAL MODE' : `MODE: ${assignmentSettings?.mode || 'AUTO_WITH_MANUAL_FALLBACK'}`}
                  </span>
                </div>

                {/* Platform Kill Switch Toggle Button */}
                <button
                  onClick={handleToggleKillSwitch}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                    assignmentSettings?.killSwitchEnabled
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg'
                      : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/30'
                  }`}
                  title={assignmentSettings?.killSwitchEnabled ? 'Deactivate kill switch' : 'Activate platform-wide kill switch'}
                >
                  <Power className="w-3.5 h-3.5" />
                  {assignmentSettings?.killSwitchEnabled ? 'Restore Auto Engine' : 'Platform Kill Switch'}
                </button>

                {/* Settings Modal Button */}
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5" /> Engine Parameters
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-[#18181b] border border-zinc-800/80 p-3.5 rounded-xl">
                <span className="text-[11px] font-semibold text-zinc-400 block mb-1">Queue for Dispatch</span>
                <span className="text-xl font-black text-amber-400">
                  {dispatchQueue.filter(o => o.state === 'PACKED' || o.state === 'DELIVERY_FAILED').length} orders
                </span>
                <span className="text-[10px] text-zinc-500 block mt-0.5">Needing active rider</span>
              </div>
              <div className="bg-[#18181b] border border-zinc-800/80 p-3.5 rounded-xl">
                <span className="text-[11px] font-semibold text-zinc-400 block mb-1">Fleet Telemetry</span>
                <span className="text-xl font-black text-emerald-400">
                  {dispatchRiders.filter(r => r.isOnline).length} / {dispatchRiders.length} Online
                </span>
                <span className="text-[10px] text-zinc-500 block mt-0.5">
                  {dispatchRiders.filter(r => r.isOnline && r.currentLoad === 0).length} riders idle
                </span>
              </div>
              <div className="bg-[#18181b] border border-zinc-800/80 p-3.5 rounded-xl">
                <span className="text-[11px] font-semibold text-zinc-400 block mb-1">Avg Time to Assign</span>
                <span className="text-xl font-black text-cyan-400">
                  {dispatchMetrics.avgTimeToAssignSeconds}s
                </span>
                <span className="text-[10px] text-zinc-500 block mt-0.5">Target SLA &lt; 90s</span>
              </div>
              <div className="bg-[#18181b] border border-zinc-800/80 p-3.5 rounded-xl">
                <span className="text-[11px] font-semibold text-zinc-400 block mb-1">Offer Acceptance</span>
                <span className="text-xl font-black text-white">
                  {(dispatchMetrics.offerAcceptanceRate * 100).toFixed(0)}%
                </span>
                <span className="text-[10px] text-zinc-500 block mt-0.5">First 45s offer window</span>
              </div>
              <div className="bg-[#18181b] border border-zinc-800/80 p-3.5 rounded-xl">
                <span className="text-[11px] font-semibold text-zinc-400 block mb-1">Manual Escalations</span>
                <span className="text-xl font-black text-rose-400">
                  {dispatchQueue.filter(o => o.escalationCount > 0).length} flagged
                </span>
                <span className="text-[10px] text-zinc-500 block mt-0.5">Cascade limit exceeded</span>
              </div>
            </div>

            {/* Main 2-Column Work Surface */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Orders Queue Needing Dispatch (7 Cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#18181b] border border-zinc-800 p-3.5 rounded-xl">
                  {/* Status Filter Chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    {[
                      { key: 'all', label: `All (${dispatchQueue.length})` },
                      { key: 'PACKED', label: `Ready (${dispatchQueue.filter(o => o.state === 'PACKED').length})` },
                      { key: 'RIDER_ASSIGNED', label: `Assigned (${dispatchQueue.filter(o => o.state === 'RIDER_ASSIGNED').length})` },
                      { key: 'DELIVERY_FAILED', label: `Failed (${dispatchQueue.filter(o => o.state === 'DELIVERY_FAILED').length})` }
                    ].map(tab => (
                      <button
                        key={tab.key}
                        onClick={() => setDispatchStatusFilter(tab.key)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                          dispatchStatusFilter === tab.key ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search code or area..."
                      value={dispatchSearch}
                      onChange={(e) => setDispatchSearch(e.target.value)}
                      className="bg-black border border-zinc-800 rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500 w-44"
                    />
                  </div>
                </div>

                {/* Orders Queue List */}
                <div className="space-y-3">
                  {dispatchQueue
                    .filter(o => dispatchStatusFilter === 'all' || o.state === dispatchStatusFilter)
                    .filter(o => !dispatchSearch || o.orderCode.toLowerCase().includes(dispatchSearch.toLowerCase()) || o.dropArea.toLowerCase().includes(dispatchSearch.toLowerCase()))
                    .map(order => (
                      <div
                        key={order.id}
                        className={`bg-[#18181b] border rounded-2xl p-4 transition-all ${
                          order.state === 'DELIVERY_FAILED'
                            ? 'border-rose-800/80 bg-rose-950/20'
                            : order.escalationCount > 0
                            ? 'border-amber-800/80 bg-amber-950/20'
                            : 'border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        {/* Order Header */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-black text-white">{order.orderCode}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                order.state === 'DELIVERY_FAILED'
                                  ? 'bg-rose-900 text-rose-200'
                                  : order.state === 'RIDER_ASSIGNED'
                                  ? 'bg-cyan-900 text-cyan-200'
                                  : 'bg-amber-900 text-amber-200'
                              }`}>
                                {order.state.replace('_', ' ')}
                              </span>
                              {order.escalationCount > 0 && (
                                <span className="px-2 py-0.5 rounded bg-rose-950 border border-rose-800 text-rose-300 text-[10px] font-black flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                                  Escalation #{order.escalationCount}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" /> Created {order.ageMinutes}m ago
                            </span>
                          </div>

                          {/* Payment / COD Tag */}
                          <div>
                            {order.paymentMode === 'COD' ? (
                              <span className="px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-800 text-amber-300 font-bold text-xs flex items-center gap-1">
                                <DollarSign className="w-3 h-3 text-amber-400" /> COD: ₹{((order.codAmountPaise || 0) / 100).toFixed(0)}
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 font-bold text-xs">
                                Prepaid
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Route Details (Pharmacy -> Drop Address) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 bg-black/50 border border-zinc-800/80 rounded-xl text-xs mb-3">
                          <div>
                            <span className="text-[10px] text-zinc-500 font-semibold block flex items-center gap-1">
                              <Store className="w-3 h-3 text-teal-400" /> Dispensing Pharmacy
                            </span>
                            <span className="font-bold text-zinc-200 block truncate">{order.pharmacyName}</span>
                            <span className="text-[11px] text-zinc-400 truncate block">{order.pharmacyAddress}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-500 font-semibold block flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-rose-400" /> Customer Destination
                            </span>
                            <span className="font-bold text-zinc-200 block truncate">{order.dropArea}</span>
                            <span className="text-[11px] text-zinc-400 truncate block">{order.dropAddress}</span>
                          </div>
                        </div>

                        {/* Package Info (Statutory rule: NO medicine names to dispatcher!) */}
                        <div className="flex items-center justify-between text-xs text-zinc-400 mb-3 px-1">
                          <span className="text-[11px] text-zinc-400">
                            Package: <strong className="text-zinc-200">{order.packageCount} Sealed Package(s)</strong> (Verified tamper-evident)
                          </span>
                          {order.assignedRiderName && (
                            <span className="text-[11px] text-cyan-300 font-semibold flex items-center gap-1">
                              <Bike className="w-3.5 h-3.5" /> Assigned: {order.assignedRiderName}
                            </span>
                          )}
                        </div>

                        {/* Active Offer Countdown if any */}
                        {order.currentOffer && (
                          <div className="mb-3 p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-800 text-xs flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                              <span className="text-cyan-200 font-bold">
                                Live Offer to {order.currentOffer.riderName}
                              </span>
                            </div>
                            <span className="font-mono font-black text-cyan-300 text-xs">
                              {order.currentOffer.secondsRemaining}s remaining
                            </span>
                          </div>
                        )}

                        {/* Auto-Paused Banner */}
                        {order.autoAssignmentPaused && (
                          <div className="mb-3 p-2 rounded-xl bg-amber-950/40 border border-amber-800 text-[11px] text-amber-300 flex items-center gap-1.5 font-bold">
                            <Pause className="w-3.5 h-3.5 text-amber-400" /> Automatic assignment paused by dispatcher
                          </div>
                        )}

                        {/* Action Buttons Row */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800/80">
                          <div className="flex items-center gap-1.5">
                            {/* Manual Assign / Reassign Button */}
                            <button
                              onClick={() => {
                                setSelectedOrderForAssign(order);
                                setShowAssignModal(true);
                              }}
                              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-black transition-all flex items-center gap-1 shadow-md"
                            >
                              <User className="w-3 h-3" />
                              {order.assignedRiderId ? 'Reassign' : 'Manual Assign'}
                            </button>

                            {/* Unassign button if already assigned */}
                            {order.assignedRiderId && (
                              <button
                                onClick={() => handleUnassignRider(order.id, order.orderCode)}
                                className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold transition-all"
                              >
                                Unassign
                              </button>
                            )}

                            {/* Pause / Resume Auto */}
                            <button
                              onClick={() => handleTogglePauseAuto(order.id, order.autoAssignmentPaused)}
                              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                              title={order.autoAssignmentPaused ? 'Resume auto-engine' : 'Pause auto-engine for this order'}
                            >
                              {order.autoAssignmentPaused ? <Play className="w-3 h-3 text-emerald-400" /> : <Pause className="w-3 h-3 text-amber-400" />}
                              {order.autoAssignmentPaused ? 'Resume' : 'Pause'}
                            </button>

                            {/* Log Contact Call */}
                            <button
                              onClick={() => {
                                setContactOrder(order);
                                setContactTarget(order.assignedRiderName ? `Rider: ${order.assignedRiderName}` : `Pharmacy: ${order.pharmacyName}`);
                                setShowContactModal(true);
                              }}
                              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3 text-cyan-400" /> Call
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* Failed Delivery Resolution Button */}
                            {order.state === 'DELIVERY_FAILED' && (
                              <button
                                onClick={() => {
                                  setFailedDeliveryOrder(order);
                                  setShowFailedDeliveryModal(true);
                                }}
                                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-black shadow-lg shadow-rose-900/40"
                              >
                                Resolve Exception
                              </button>
                            )}

                            {/* Evaluate Engine Step */}
                            {!order.assignedRiderId && order.state !== 'DELIVERY_FAILED' && (
                              <button
                                onClick={() => handleTriggerEngine(order.id, order.orderCode)}
                                className="px-2 py-1.5 text-zinc-400 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                                title="Run automated candidate ranking"
                              >
                                <RotateCcw className="w-3 h-3" /> Auto-Offer
                              </button>
                            )}

                            {/* Explainability Decision Viewer */}
                            <button
                              onClick={() => handleViewExplainability(order.id, order.orderCode)}
                              className="px-2 py-1.5 text-zinc-400 hover:text-teal-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                              title="Inspect ranking breakdown and candidate exclusions"
                            >
                              <Info className="w-3 h-3" /> Scoring
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                  {dispatchQueue.length === 0 && (
                    <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-12 text-center text-zinc-500 text-xs">
                      No active orders currently pending rider dispatch. All Gorakhpur deliveries on track.
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Real-time Rider Fleet Telemetry (5 Cols) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-[#18181b] border border-zinc-800 p-3.5 rounded-xl flex items-center justify-between">
                  <h3 className="text-xs font-black text-white flex items-center gap-1.5">
                    <Bike className="w-4 h-4 text-teal-400" /> Gorakhpur Fleet Roster ({dispatchRiders.length})
                  </h3>

                  {/* Rider Availability Filter */}
                  <div className="flex items-center gap-1">
                    {[
                      { key: 'all', label: 'All' },
                      { key: 'online', label: `Online (${dispatchRiders.filter(r => r.isOnline).length})` },
                      { key: 'idle', label: `Idle (${dispatchRiders.filter(r => r.isOnline && r.currentLoad === 0).length})` }
                    ].map(f => (
                      <button
                        key={f.key}
                        onClick={() => setRiderAvailabilityFilter(f.key as any)}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                          riderAvailabilityFilter === f.key ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rider Cards List */}
                <div className="space-y-3">
                  {dispatchRiders
                    .filter(r => riderAvailabilityFilter === 'all' || (riderAvailabilityFilter === 'online' && r.isOnline) || (riderAvailabilityFilter === 'idle' && r.isOnline && r.currentLoad === 0))
                    .map(rider => (
                      <div
                        key={rider.riderId}
                        className="bg-[#18181b] border border-zinc-800 rounded-2xl p-3.5 hover:border-zinc-700 transition-all text-xs"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${rider.isOnline ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-zinc-600'}`} />
                            <div>
                              <span className="font-bold text-white block">{rider.fullName}</span>
                              <span className="text-[11px] text-zinc-400 font-mono">{rider.phone}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[11px] font-bold text-cyan-400 block">{rider.distanceKm} km away</span>
                            <span className="text-[10px] text-zinc-500 block">Road ETA ~{rider.etaMinutes}m</span>
                          </div>
                        </div>

                        {/* Rider Telemetry Grid */}
                        <div className="grid grid-cols-4 gap-2 bg-black/40 border border-zinc-800/80 p-2 rounded-xl text-center mb-2.5 text-[11px]">
                          <div>
                            <span className="text-zinc-500 block text-[9px]">Active Load</span>
                            <span className={`font-black ${rider.currentLoad > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {rider.currentLoad}/1
                            </span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block text-[9px]">Cash in Hand</span>
                            <span className={`font-black ${rider.currentCashInHandPaise > 500000 ? 'text-rose-400' : 'text-zinc-200'}`}>
                              ₹{(rider.currentCashInHandPaise / 100).toFixed(0)}
                            </span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block text-[9px]">Accept Rate</span>
                            <span className="font-black text-white">
                              {(rider.acceptanceRate * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block text-[9px]">Rating</span>
                            <span className="font-black text-amber-400">
                              ★ {rider.rating.toFixed(1)}
                            </span>
                          </div>
                        </div>

                        {/* Quick Assign Action */}
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] text-zinc-500">
                            {rider.totalCompletedOrders} lifetime deliveries
                          </span>
                          <button
                            onClick={() => {
                              setSelectedRiderIdForAssign(rider.riderId);
                              const targetOrder = dispatchQueue.find(o => o.state === 'PACKED') || dispatchQueue[0];
                              if (targetOrder) {
                                setSelectedOrderForAssign(targetOrder);
                                setShowAssignModal(true);
                              } else {
                                setFeedbackMessage({ type: 'error', text: 'No order pending assignment in queue.' });
                              }
                            }}
                            className="px-2.5 py-1 bg-zinc-800 hover:bg-teal-600 hover:text-white text-zinc-300 rounded-lg text-[11px] font-bold transition-all"
                          >
                            Assign to Order
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: PHARMACIES & REGULATORY COMPLIANCE (MILESTONE A4) */}
        {activeTab === 'pharmacies' && (
          <PharmacyManagementTab
            currentStaffUserId={currentStaffUserId}
            onShowFeedback={(type, text) => setFeedbackMessage({ type, text })}
          />
        )}

        {/* TAB: DELIVERY FLEET & COD CASH SETTLEMENT (MILESTONE A4) */}
        {activeTab === 'riders' && (
          <RiderManagementTab
            currentStaffUserId={currentStaffUserId}
            onShowFeedback={(type, text) => setFeedbackMessage({ type, text })}
          />
        )}

        {/* TAB: MASTER CATALOGUE, APPROVALS & DRUG RECALLS (MILESTONE A5) */}
        {activeTab === 'catalogue' && (
          <CatalogueManagementTab
            currentUserId={currentStaffUserId}
            onRefreshGlobal={fetchData}
          />
        )}

        {/* TAB 3: OPERATIONAL ALERTS & INCIDENTS (MILESTONE A2) */}
        {activeTab === 'alerts' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-rose-400" /> Operational Alerts & Incident Queue
                </h2>
                <p className="text-xs text-zinc-400">
                  Real-time exception alerts across SLA compliance, pharmacy responsiveness, fleet telemetry, and cold-chain quality.
                </p>
              </div>

              {/* Severity Filter Chips */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAlertsSeverityFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    alertsSeverityFilter === 'all' ? 'bg-zinc-700 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'
                  }`}
                >
                  All Alerts ({alertsList.length})
                </button>
                <button
                  onClick={() => setAlertsSeverityFilter('critical')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    alertsSeverityFilter === 'critical' ? 'bg-rose-600 text-white' : 'bg-rose-950/40 text-rose-300 border border-rose-900/40'
                  }`}
                >
                  Critical ({alertsList.filter(a => a.severity === 'critical').length})
                </button>
                <button
                  onClick={() => setAlertsSeverityFilter('warning')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    alertsSeverityFilter === 'warning' ? 'bg-amber-600 text-white' : 'bg-amber-950/40 text-amber-300 border border-amber-900/40'
                  }`}
                >
                  Warnings ({alertsList.filter(a => a.severity === 'warning').length})
                </button>
              </div>
            </div>

            {/* Alert Cards List */}
            <div className="space-y-3">
              {alertsList
                .filter(a => alertsSeverityFilter === 'all' || a.severity === alertsSeverityFilter)
                .map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      alert.isResolved
                        ? 'bg-zinc-900/40 border-zinc-800/60 opacity-60'
                        : alert.severity === 'critical'
                        ? 'bg-rose-950/20 border-rose-900/60 shadow-lg shadow-rose-950/10'
                        : 'bg-amber-950/20 border-amber-900/60'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                            alert.severity === 'critical' ? 'bg-rose-900 text-rose-200' :
                            alert.severity === 'warning' ? 'bg-amber-900 text-amber-200' :
                            'bg-blue-900 text-blue-200'
                          }`}>
                            {alert.severity}
                          </span>
                          <span className="text-[11px] font-mono font-bold text-zinc-400">{alert.alertType}</span>
                          {alert.slaBreachMinutes && alert.slaBreachMinutes > 0 && (
                            <span className="px-2 py-0.5 rounded bg-rose-950 border border-rose-800 text-[10px] font-bold text-rose-300">
                              {alert.slaBreachMinutes}m SLA Breach
                            </span>
                          )}
                          {alert.isResolved && (
                            <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-[10px] font-bold text-emerald-300">
                              Resolved
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm font-black text-white">{alert.title}</h3>
                        <p className="text-xs text-zinc-300 leading-relaxed max-w-3xl">{alert.description}</p>

                        <div className="flex items-center gap-4 pt-1 text-[11px] text-zinc-500">
                          <span>Target: <strong className="text-zinc-400">{alert.entityType} ({alert.entityId})</strong></span>
                          <span>•</span>
                          <span>Created: {new Date(alert.createdAt).toLocaleTimeString()}</span>
                          {alert.resolvedBy && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-400 font-semibold">Resolved by {alert.resolvedBy}</span>
                            </>
                          )}
                        </div>

                        {alert.resolutionNotes && (
                          <div className="mt-2 text-xs bg-zinc-900 p-2.5 rounded-lg border border-zinc-800 text-zinc-300">
                            <strong className="text-zinc-400">Resolution Notes: </strong>
                            {alert.resolutionNotes}
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      {!alert.isResolved && (
                        <div>
                          {isRoleAdmin || isRoleDispatcher ? (
                            <button
                              onClick={() => {
                                setSelectedAlertForResolution(alert);
                                setAlertResolutionNotes('');
                              }}
                              className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-lg"
                            >
                              Acknowledge / Resolve
                            </button>
                          ) : (
                            <div className="text-[11px] text-zinc-500 italic">
                              Escalate to Admin / Dispatcher
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 4: STAFF & ACCOUNTS */}
        {activeTab === 'staff' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-white">Platform Staff Roster & Provisioning</h2>
                <p className="text-xs text-zinc-400">Platform administrators can provision operational staff with mandatory justification</p>
              </div>
              {isRoleAdmin ? (
                <button
                  onClick={() => setShowCreateStaffModal(true)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg"
                >
                  <UserPlus className="w-4 h-4" /> Provision Staff Account
                </button>
              ) : (
                <div className="text-xs text-zinc-500 italic">Only Administrators can provision staff accounts.</div>
              )}
            </div>

            <div className="bg-[#18181b] border border-zinc-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 uppercase text-[10px] tracking-wider bg-zinc-900/40">
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Operational Role</th>
                    <th className="py-3 px-4">2FA / TOTP</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {staffList.map((s) => (
                    <tr key={s.id} className="hover:bg-zinc-850/50">
                      <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[11px]">
                          {s.fullName.slice(0, 2).toUpperCase()}
                        </div>
                        {s.fullName}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-300 font-mono">{s.email}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          s.role === 'admin' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                          s.role === 'dispatcher' ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                          'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}>
                          {s.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-emerald-400 font-bold flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" /> Enforced TOTP
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[11px] font-bold text-emerald-400">Active</span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isRoleAdmin && (
                          <button
                            onClick={() => {
                              setStepUpPendingAction(() => async () => {
                                const newRole: StaffRole = s.role === 'dispatcher' ? 'support_operator' : 'dispatcher';
                                const res = await fetch(`http://localhost:4000/api/v1/admin/staff/${s.id}/role`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    adminUserId: currentStaff.userId,
                                    newRole,
                                    reason: `Operational rotation to ${newRole}`,
                                    totpCode: '123456'
                                  })
                                });
                                if (res.ok) {
                                  setFeedbackMessage({ type: 'success', text: `Role updated for ${s.fullName}` });
                                  fetchData();
                                }
                              });
                              setShowStepUpModal(true);
                            }}
                            className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[11px] font-bold border border-zinc-700"
                          >
                            Rotate Role (Step-Up)
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: TWO-PERSON APPROVAL CENTER */}
        {activeTab === 'approvals' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-white">Two-Person Approval Control Center</h2>
                <p className="text-xs text-zinc-400">
                  Critical changes (prescription schedule, direct OTC allow-list, refund limit) strictly require a second human administrator sign-off
                </p>
              </div>
              {isRoleAdmin && (
                <button
                  onClick={() => setShowRequestApprovalModal(true)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-black rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-lg"
                >
                  <FileText className="w-4 h-4" /> Request High-Risk Change
                </button>
              )}
            </div>

            <div className="space-y-4">
              {approvalsList.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 bg-[#18181b] border border-zinc-800 rounded-2xl">
                  No approval requests recorded.
                </div>
              ) : (
                approvalsList.map((item) => {
                  const isRequester = item.requestedBy === currentStaff.userId;
                  return (
                    <div
                      key={item.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        item.status === 'pending'
                          ? 'bg-[#18181b] border-amber-800/80 shadow-md'
                          : item.status === 'approved'
                          ? 'bg-zinc-900/60 border-emerald-900/50'
                          : 'bg-zinc-900/60 border-rose-900/50'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 rounded text-[11px] font-black uppercase tracking-wider ${
                            item.status === 'pending' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                            item.status === 'approved' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                            'bg-rose-950 text-rose-300 border border-rose-800'
                          }`}>
                            {item.status}
                          </span>
                          <span className="text-sm font-black text-white font-mono">{item.actionType}</span>
                          <span className="text-xs text-zinc-400">Target: <code className="text-zinc-200">{item.targetResourceId}</code></span>
                        </div>
                        <span className="text-xs text-zinc-500">Requested: {new Date(item.createdAt).toLocaleString()}</span>
                      </div>

                      <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850 mb-4">
                        <p className="text-xs text-zinc-300"><span className="text-zinc-500 font-semibold">Justification:</span> {item.requestedReason}</p>
                        <p className="text-[11px] text-zinc-500 mt-1 font-mono">Requester: {item.requestedBy}</p>
                      </div>

                      {/* Approval Actions */}
                      {item.status === 'pending' && (
                        <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                          {isRequester ? (
                            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 bg-amber-950/40 px-3 py-1.5 rounded-lg border border-amber-900">
                              <AlertTriangle className="w-4 h-4" />
                              Two-Person Gate: You requested this change. A different Platform Administrator must review and approve.
                            </div>
                          ) : !isRoleAdmin ? (
                            <div className="text-xs text-zinc-500 italic">
                              Only Platform Administrators have authority to decide high-risk configuration requests.
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => handleDecideApproval(item.id, 'approved')}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
                              >
                                <Check className="w-4 h-4" /> Approve (2nd Admin Sign-Off)
                              </button>
                              <button
                                onClick={() => handleDecideApproval(item.id, 'rejected')}
                                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
                              >
                                <X className="w-4 h-4" /> Reject
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 4: PRESCRIPTION BREAK-GLASS GATEWAY */}
        {activeTab === 'breakglass' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-black text-white">Audited Prescription Break-Glass Gateway</h2>
              <p className="text-xs text-zinc-400">
                Prescription files and clinical notes are legally restricted. Access requires stated medical/regulatory reason, step-up TOTP verification, and produces an immutable audit record.
              </p>
            </div>

            {!isRoleAdmin ? (
              <div className="p-8 text-center bg-rose-950/20 border border-rose-800 rounded-2xl">
                <Lock className="w-10 h-10 text-rose-400 mx-auto mb-3" />
                <h3 className="text-sm font-black text-rose-300">Confidential Health Data Access Prohibited</h3>
                <p className="text-xs text-rose-200/80 mt-1 max-w-md mx-auto">
                  Your current role ({currentStaff.role}) does not possess emergency break-glass privileges. Under healthcare data privacy regulations, only licensed dispensing pharmacists and designated Platform Administrators may access clinical prescriptions.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#18181b] border border-zinc-800 p-6 rounded-2xl">
                  <h3 className="text-sm font-black text-white mb-2 flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    Open Emergency Break-Glass Session
                  </h3>
                  <p className="text-xs text-zinc-400 mb-4">
                    Sample Clinical File: <code className="text-teal-400">rx-sample-gkp-1 (Amoxicillin 500mg Schedule H)</code>
                  </p>

                  <form onSubmit={handleBreakGlassPrescription} className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-zinc-300 block mb-1">
                        Mandatory Legal & Medical Justification (min 10 chars)
                      </label>
                      <textarea
                        rows={3}
                        value={breakGlassReason}
                        onChange={(e) => setBreakGlassReason(e.target.value)}
                        placeholder="e.g. Formal regulatory inquiry by UP State Drug Inspector regarding dispensing batch #UP2026-99"
                        className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                        required
                      />
                    </div>

                    <div className="bg-amber-950/30 border border-amber-900/60 p-3 rounded-lg text-xs text-amber-300">
                      Step-Up Verified: Test TOTP code <span className="font-mono font-bold">123456</span> will be validated. Session expires in 15 minutes.
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-black font-black text-xs rounded-xl shadow-lg transition-all"
                    >
                      Authenticate & Access Prescription
                    </button>
                  </form>
                </div>

                {/* Session Viewer */}
                <div className="bg-[#18181b] border border-zinc-800 p-6 rounded-2xl flex flex-col justify-center">
                  {activeBreakGlassSession ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-black uppercase">
                          Active Break-Glass Session
                        </span>
                        <span className="text-xs text-zinc-400 font-mono">15m Window</span>
                      </div>
                      <h4 className="text-sm font-bold text-white">Prescription: {activeBreakGlassSession.prescription?.patientName}</h4>
                      <div className="aspect-[4/3] bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none rotate-45 text-2xl font-black text-white">
                          WATERMARKED: {currentStaff.fullName} • {new Date().toLocaleDateString()}
                        </div>
                        <FileCheck2 className="w-12 h-12 text-teal-400 mb-2" />
                        <span className="text-xs text-zinc-400 absolute bottom-3">Clinical Rx Document Verified by Pharmacist</span>
                      </div>
                      <p className="text-[11px] text-zinc-500">Stated Reason: {activeBreakGlassSession.session?.statedReason}</p>
                    </div>
                  ) : (
                    <div className="text-center text-zinc-500 p-6">
                      <Lock className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                      <p className="text-xs">No active break-glass session. Submit justification to open watermarked viewer.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: TAMPER-EVIDENT AUDIT TRAIL */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-white">Immutable Tamper-Evident Audit Trail</h2>
                <p className="text-xs text-zinc-400">Append-only audit ledger recording every privileged override, break-glass session, and role transition</p>
              </div>
              <button
                onClick={fetchData}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>

            <div className="bg-[#18181b] border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-400 uppercase text-[10px] tracking-wider bg-zinc-900/40">
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Actor</th>
                      <th className="py-3 px-4">Resource</th>
                      <th className="py-3 px-4">Context Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 font-mono text-[11px]">
                    {auditLogs.slice(0, 15).map((log) => (
                      <tr key={log.id} className="hover:bg-zinc-850/50">
                        <td className="py-3 px-4 text-zinc-400 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                            log.action.includes('BREAK_GLASS') ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                            log.action.includes('TWO_PERSON') ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                            log.action.includes('ROLE') ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                            'bg-zinc-800 text-zinc-300'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-zinc-300">{log.actorId || 'system'}</td>
                        <td className="py-3 px-4 text-zinc-400">{log.resourceType}:{log.resourceId}</td>
                        <td className="py-3 px-4 text-zinc-300 truncate max-w-xs">
                          {JSON.stringify(log.details)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: PROVISION STAFF ACCOUNT */}
      {showCreateStaffModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-black text-white mb-1">Provision Staff Account</h3>
            <p className="text-xs text-zinc-400 mb-4">Mandatory operational rationale required by platform policy.</p>

            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full bg-black border border-zinc-700 rounded-lg p-2.5 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Work Email</label>
                <input
                  type="email"
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  placeholder="e.g. ramesh.ops@medcure.in"
                  className="w-full bg-black border border-zinc-700 rounded-lg p-2.5 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Mobile Phone (+91)</label>
                <input
                  type="text"
                  value={newStaffPhone}
                  onChange={(e) => setNewStaffPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="w-full bg-black border border-zinc-700 rounded-lg p-2.5 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Assigned Operational Role</label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value as StaffRole)}
                  className="w-full bg-black border border-zinc-700 rounded-lg p-2.5 text-xs text-white"
                >
                  <option value="dispatcher">Dispatcher (Riders, Queue & Assignments)</option>
                  <option value="support_operator">Support Operator (Permitted Tickets Only)</option>
                  <option value="admin">Platform Administrator (Full Access)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Recorded Operational Reason</label>
                <textarea
                  rows={2}
                  value={newStaffReason}
                  onChange={(e) => setNewStaffReason(e.target.value)}
                  placeholder="Operational justification for audit record"
                  className="w-full bg-black border border-zinc-700 rounded-lg p-2.5 text-xs text-white"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateStaffModal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold"
                >
                  Create & Record Audit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: STEP-UP RE-AUTHENTICATION */}
      {showStepUpModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-amber-800/80 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="w-10 h-10 rounded-full bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400 mx-auto mb-3">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black text-center text-white mb-1">Step-Up Re-Authentication</h3>
            <p className="text-xs text-zinc-400 text-center mb-4">
              Enter your TOTP authenticator code to proceed with this privileged action.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1 text-center">6-Digit Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={stepUpTotpCode}
                  onChange={(e) => setStepUpTotpCode(e.target.value)}
                  className="w-full bg-black border border-zinc-700 rounded-lg p-2.5 text-center text-lg font-mono font-black text-amber-400 tracking-widest"
                />
                <span className="text-[10px] text-zinc-500 block text-center mt-1">Development test code: 123456</span>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStepUpModal(false)}
                  className="w-1/2 py-2 bg-zinc-800 text-zinc-300 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleStepUpSubmit}
                  className="w-1/2 py-2 bg-amber-600 hover:bg-amber-500 text-black rounded-lg text-xs font-black"
                >
                  Confirm Action
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REQUEST TWO-PERSON APPROVAL */}
      {showRequestApprovalModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-black text-white mb-1">Request High-Risk Configuration Change</h3>
            <p className="text-xs text-zinc-400 mb-4">Requires approval from a distinct secondary administrator.</p>

            <form onSubmit={handleCreateApprovalRequest} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Action Type</label>
                <select
                  value={newActionType}
                  onChange={(e) => setNewActionType(e.target.value)}
                  className="w-full bg-black border border-zinc-700 rounded-lg p-2.5 text-xs text-white"
                >
                  <option value="OTC_DIRECT_TOGGLE">Toggle OTC_DIRECT Allow-List</option>
                  <option value="CATALOGUE_CLASS_CHANGE">Alter Drug Schedule / Prescription Class</option>
                  <option value="REFUND_LIMIT_CHANGE">Modify Platform Refund Limits</option>
                  <option value="PHARMACY_DEACTIVATE">Platform-Wide Pharmacy Deactivation</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Target Resource ID</label>
                <input
                  type="text"
                  value={newTargetId}
                  onChange={(e) => setNewTargetId(e.target.value)}
                  placeholder="e.g. prd-amox-500"
                  className="w-full bg-black border border-zinc-700 rounded-lg p-2.5 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Regulatory / Operational Reason</label>
                <textarea
                  rows={2}
                  value={newApprovalReason}
                  onChange={(e) => setNewApprovalReason(e.target.value)}
                  className="w-full bg-black border border-zinc-700 rounded-lg p-2.5 text-xs text-white"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRequestApprovalModal(false)}
                  className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-black rounded-lg text-xs font-black"
                >
                  Submit for 2-Person Sign-Off
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ACKNOWLEDGE / RESOLVE OPERATIONAL ALERT */}
      {selectedAlertForResolution && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                selectedAlertForResolution.severity === 'critical' ? 'bg-rose-900 text-rose-200' : 'bg-amber-900 text-amber-200'
              }`}>
                {selectedAlertForResolution.severity}
              </span>
              <h3 className="text-sm font-black text-white">{selectedAlertForResolution.title}</h3>
            </div>
            <p className="text-xs text-zinc-400 mb-4">{selectedAlertForResolution.description}</p>

            <form onSubmit={handleAcknowledgeAlert} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Mandatory Resolution / Follow-Up Notes</label>
                <textarea
                  rows={3}
                  value={alertResolutionNotes}
                  onChange={(e) => setAlertResolutionNotes(e.target.value)}
                  placeholder="Record immediate intervention taken (e.g., Called pharmacist, rerouted order, checked refrigeration temp)"
                  className="w-full bg-black border border-zinc-700 rounded-lg p-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500"
                  required
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Logged in immutable audit trail under your staff identity ({currentStaff.fullName}).
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAlertForResolution(null)}
                  className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-black shadow-lg"
                >
                  Confirm Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISPATCH MODAL 1: MANUAL ASSIGN / REASSIGN RIDER */}
      {showAssignModal && selectedOrderForAssign && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bike className="w-5 h-5 text-teal-400" />
                <h3 className="text-sm font-black text-white">Manual Dispatcher Assignment</h3>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-black/50 border border-zinc-800 p-3 rounded-xl mb-4 text-xs">
              <div className="flex justify-between font-mono font-bold text-zinc-300 mb-1">
                <span>Order: {selectedOrderForAssign.orderCode}</span>
                <span className="text-amber-400">
                  {selectedOrderForAssign.paymentMode === 'COD' 
                    ? `COD: ₹${((selectedOrderForAssign.codAmountPaise || 0) / 100).toFixed(0)}` 
                    : 'Prepaid'}
                </span>
              </div>
              <p className="text-zinc-400 text-[11px] truncate">
                From: {selectedOrderForAssign.pharmacyName} → To: {selectedOrderForAssign.dropArea}
              </p>
            </div>

            <form onSubmit={handleManualAssign} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Select Delivery Partner</label>
                <select
                  value={selectedRiderIdForAssign}
                  onChange={(e) => setSelectedRiderIdForAssign(e.target.value)}
                  className="w-full bg-black border border-zinc-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
                  required
                >
                  <option value="">-- Choose Approved Rider --</option>
                  {dispatchRiders.map(r => (
                    <option key={r.riderId} value={r.riderId}>
                      {r.fullName} ({r.isOnline ? 'Online' : 'Offline'} • Load {r.currentLoad}/1 • {r.distanceKm} km • Cash: ₹{(r.currentCashInHandPaise / 100).toFixed(0)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Mandatory Override Reason</label>
                <textarea
                  rows={3}
                  value={manualAssignReason}
                  onChange={(e) => setManualAssignReason(e.target.value)}
                  placeholder="State operational reason for manual assignment (e.g. VIP patient request, rider was nearest to pharmacy gate, app network recovery)"
                  className="w-full bg-black border border-zinc-700 rounded-lg p-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500"
                  required
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Cancels any pending auto-offers atomically and logs decision in audit trail.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-black shadow-lg"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISPATCH MODAL 2: LOG CONTACT INTERVENTION */}
      {showContactModal && contactOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-black text-white">Log Operational Call Intervention</h3>
              </div>
              <button onClick={() => setShowContactModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Party Contacted</label>
                <select
                  value={contactType}
                  onChange={(e) => setContactType(e.target.value as any)}
                  className="w-full bg-black border border-zinc-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="CALL_RIDER">Delivery Partner (Rider)</option>
                  <option value="CALL_PHARMACY">Partner Pharmacy</option>
                  <option value="CALL_CUSTOMER">Customer (Masked)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Target Entity / Name</label>
                <input
                  type="text"
                  value={contactTarget}
                  onChange={(e) => setContactTarget(e.target.value)}
                  className="w-full bg-black border border-zinc-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Intervention Notes</label>
                <textarea
                  rows={3}
                  value={contactNotes}
                  onChange={(e) => setContactNotes(e.target.value)}
                  placeholder="Record summary of phone discussion (e.g., Rider advised 3m delay due to traffic at Cinema Road)"
                  className="w-full bg-black border border-zinc-700 rounded-lg p-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowContactModal(false)}
                  className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-black shadow-lg"
                >
                  Save Intervention
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISPATCH MODAL 3: FAILED DELIVERY RESOLUTION */}
      {showFailedDeliveryModal && failedDeliveryOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-rose-400" />
                <h3 className="text-sm font-black text-white">Resolve Delivery Exception</h3>
              </div>
              <button onClick={() => setShowFailedDeliveryModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400 mb-4">
              Order {failedDeliveryOrder.orderCode} delivery failed at doorstep. Choose protocol action per statutory SOP:
            </p>

            <form onSubmit={handleFailedDeliverySubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Resolution Protocol</label>
                <select
                  value={failedDeliveryAction}
                  onChange={(e) => setFailedDeliveryAction(e.target.value as any)}
                  className="w-full bg-black border border-zinc-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="redelivery">Re-attempt Delivery (Re-queue in dispatch console)</option>
                  <option value="return_to_pharmacy">Return Package to Pharmacy (Seals intact)</option>
                  <option value="cancel_order">Cancel Order (Initiate refund flow)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Detailed Reason</label>
                <textarea
                  rows={3}
                  value={failedDeliveryReason}
                  onChange={(e) => setFailedDeliveryReason(e.target.value)}
                  placeholder="Record customer contact status, doorstep reason, OTP status..."
                  className="w-full bg-black border border-zinc-700 rounded-lg p-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFailedDeliveryModal(false)}
                  className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-black shadow-lg"
                >
                  Execute Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISPATCH MODAL 4: EXPLAINABILITY & CANDIDATE SCORING VIEWER */}
      {showExplainabilityModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-zinc-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-teal-400" />
                <h3 className="text-sm font-black text-white">
                  Assignment Decision Explainability ({selectedExplainOrderCode})
                </h3>
              </div>
              <button onClick={() => setShowExplainabilityModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {explainabilityDecisions.map((dec, idx) => (
                <div key={dec.id} className="bg-black/50 border border-zinc-800 rounded-xl p-4 text-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[11px] text-zinc-400">
                      Evaluation #{explainabilityDecisions.length - idx} • {new Date(dec.evaluatedAt).toLocaleTimeString()}
                    </span>
                    <span className={`px-2 py-0.5 rounded font-black text-[10px] uppercase ${
                      dec.outcome === 'OFFERED' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' :
                      dec.outcome === 'ESCALATED' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                      'bg-zinc-800 text-zinc-300'
                    }`}>
                      Outcome: {dec.outcome}
                    </span>
                  </div>
                  <p className="text-zinc-300 text-xs mb-3 font-semibold">{dec.notes}</p>

                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Candidates Considered ({dec.candidates.length})
                    </span>
                    {dec.candidates.map(cand => (
                      <div 
                        key={cand.riderId}
                        className={`p-2.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                          cand.eligible 
                            ? 'bg-teal-950/20 border-teal-800/60 text-zinc-200' 
                            : 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{cand.riderName}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${cand.eligible ? 'bg-emerald-900 text-emerald-200' : 'bg-rose-950 text-rose-300'}`}>
                              {cand.eligible ? 'Eligible' : 'Excluded'}
                            </span>
                          </div>
                          {!cand.eligible && (
                            <span className="text-[11px] text-rose-400 block mt-0.5">
                              Reason: {cand.exclusionReason}
                            </span>
                          )}
                        </div>

                        {cand.eligible && (
                          <div className="flex items-center gap-2 text-[10px] font-mono">
                            <span className="bg-black/60 px-1.5 py-0.5 rounded border border-zinc-800">
                              Dist: {cand.scoreBreakdown.distanceKm}km
                            </span>
                            <span className="bg-black/60 px-1.5 py-0.5 rounded border border-zinc-800">
                              ETA: {cand.scoreBreakdown.etaMinutes}m
                            </span>
                            <span className="bg-teal-950 px-2 py-0.5 rounded border border-teal-800 text-teal-300 font-bold">
                              Score: {cand.totalScore}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {explainabilityDecisions.length === 0 && (
                <div className="text-center py-8 text-zinc-500 text-xs">
                  No decision evaluations logged yet for this order. Click "Auto-Offer" to trigger evaluation.
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-zinc-800 text-right">
              <button
                onClick={() => setShowExplainabilityModal(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DISPATCH MODAL 5: ASSIGNMENT SETTINGS & KILL SWITCH */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-teal-400" />
                <h3 className="text-sm font-black text-white">Engine Configuration & Zone Rules</h3>
              </div>
              <button onClick={() => setShowSettingsModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateSettings} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Dispatch Mode</label>
                <select
                  value={settingsMode}
                  onChange={(e) => setSettingsMode(e.target.value as any)}
                  className="w-full bg-black border border-zinc-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="AUTO_WITH_MANUAL_FALLBACK">AUTO WITH MANUAL FALLBACK (Recommended MVP Default)</option>
                  <option value="AUTO">AUTO ONLY (Alerts on failure, no auto-queue escalation)</option>
                  <option value="MANUAL">MANUAL ONLY (Dispatchers assign everything)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Search Radius (km)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={settingsRadius}
                    onChange={(e) => setSettingsRadius(parseFloat(e.target.value))}
                    className="w-full bg-black border border-zinc-700 rounded-lg p-2 text-xs text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Offer Timeout (s)</label>
                  <input
                    type="number"
                    value={settingsTimeout}
                    onChange={(e) => setSettingsTimeout(parseInt(e.target.value))}
                    className="w-full bg-black border border-zinc-700 rounded-lg p-2 text-xs text-white"
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-rose-950/30 border border-rose-800 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-rose-300 block">Platform-Wide Kill Switch</span>
                  <span className="text-[10px] text-zinc-400">Instantly forces MANUAL mode across all zones</span>
                </div>
                <input
                  type="checkbox"
                  checked={settingsKillSwitch}
                  onChange={(e) => setSettingsKillSwitch(e.target.checked)}
                  className="w-5 h-5 accent-rose-500 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-black shadow-lg"
                >
                  Save Parameters
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
