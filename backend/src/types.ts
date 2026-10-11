export type UserRole = 
  | 'customer'
  | 'pharmacy_owner'
  | 'pharmacist'
  | 'pharmacy_staff'
  | 'delivery_partner'
  | 'platform_admin'
  | 'support_operator';

export type HealthcareDomain = 'human' | 'veterinary';

export type PaymentMode = 'ONLINE' | 'COD';

export type StockBadge = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface AppConfigRecord {
  appId: string;
  appName: string;
  minSupportedVersion: string;
  latestVersion: string;
  forceUpdateTitle: string;
  forceUpdateMessage: string;
  storeUrlAndroid: string;
  storeUrlIos: string;
  allowedRoles: string[];
  maintenanceMode: boolean;
}

export type OrderState = 
  | 'CREATED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_CONFIRMED'
  | 'PHARMACY_REVIEW'
  | 'PRESCRIPTION_CLARIFICATION'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'PACKING'
  | 'PACKED'
  | 'RIDER_ASSIGNED'
  | 'PICKED_UP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'DELIVERY_FAILED'
  | 'REFUND_PENDING'
  | 'REFUNDED';

export type PrescriptionStatus = 
  | 'uploaded'
  | 'ocr_processed'
  | 'under_review'
  | 'clarification_requested'
  | 'approved'
  | 'rejected'
  | 'expired';

export interface User {
  id: string;
  phone: string;
  email?: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  dateOfBirth?: string;
  termsVersion?: string;
  termsAcceptedAt?: string;
}

export interface CustomerAddress {
  id: string;
  userId: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}

export interface AnimalProfile {
  id: string;
  userId: string;
  animalName: string;
  species: string;
  breed?: string;
  ageYears?: number;
  weightKg?: number;
  isFoodProducing: boolean;
  allergies?: string;
}

export interface RiderProfile {
  id: string;
  userId: string;
  vehicleType: string;
  vehicleRegistrationNumber: string;
  drivingLicenceNumber: string;
  isAvailable: boolean;
  currentCashInHand: number;
  isApproved?: boolean;
  approvalStatus?: 'submitted' | 'needs_changes' | 'approved' | 'suspended';
  onboardingApplicationId?: string;
  reviewerComments?: string;
}

export interface Pharmacy {
  id: string;
  businessName: string;
  legalEntityName: string;
  contactPhone: string;
  contactEmail?: string;
  addressLine1: string;
  city: string;
  pincode: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  isVerified: boolean;
  operatingHours: { open: string; close: string };
  licenceNumber?: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  genericSaltName?: string;
  categoryId: string;
  categoryDomain: HealthcareDomain;
  formulation: string;
  strength?: string;
  packSize: string;
  manufacturer: string;
  mrp: number;
  requiresPrescription: boolean;
  isOtcDirect: boolean; // Allow-list flag for direct ordering
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
}

export interface PharmacyInventoryItem {
  id: string;
  pharmacyId: string;
  productId: string;
  availableQuantity: number;
  reservedQuantity: number;
  mrp: number;
  sellingPrice: number;
  isAvailableOverride: boolean;
  batches: {
    batchNumber: string;
    mfgDate: string;
    expiryDate: string;
    quantity: number;
    isRecalled?: boolean;
    recallNoticeId?: string;
  }[];
}

export interface Prescription {
  id: string;
  userId: string;
  animalId?: string;
  documentVaultPath: string;
  doctorName?: string;
  status: PrescriptionStatus;
  reviewedBy?: string;
  pharmacistRegNumber?: string;
  rejectionReason?: string;
  ocrExtractedText?: string;
  candidateMatches?: {
    productId: string;
    productName: string;
    confidence: number;
  }[];
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  packSizeSnapshot?: string;
  unitPrice: number;
  unitPricePaise: number;
  unitMrpPaise: number;
  quantity: number;
  lineTotalPaise: number;
  requiresPrescription: boolean;
  batchNumberAssigned?: string;
  expiryDateAssigned?: string;
}

export interface InventoryReservation {
  id: string;
  orderId: string;
  pharmacyId: string;
  productId: string;
  quantity: number;
  expiresAt: string;
  status: 'ACTIVE' | 'CONFIRMED' | 'RELEASED';
  createdAt: string;
}

export interface OrderStatusHistoryEntry {
  id: string;
  orderId: string;
  fromState?: OrderState;
  toState: OrderState;
  actorId?: string;
  actorRole: string;
  reason?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  orderCode: string;
  userId: string;
  pharmacyId: string;
  pharmacyNameSnapshot?: string;
  deliveryAddressId: string;
  deliveryAddressSnapshot?: any;
  receiverName?: string;
  receiverPhone?: string;
  deliveryNote?: string;
  categoryDomain: HealthcareDomain;
  paymentMode: PaymentMode;
  state: OrderState;
  items: OrderItem[];
  prescriptionId?: string;
  totalMrp: number;
  totalDiscount: number;
  deliveryFee: number;
  taxes: number;
  payableAmount: number;
  // Exact Paise representation (Money Rule: server calculated integer)
  itemTotalPaise: number;
  deliveryFeePaise: number;
  handlingFeePaise: number;
  discountPaise: number;
  payableAmountPaise: number;
  deliveryOtp: string;
  idempotencyKey?: string;
  rejectionReason?: string;
  riderId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CodCollectionRecord {
  id: string;
  orderId: string;
  riderId: string;
  amountCollected: number;
  receiptNumber: string;
  collectedAt: string;
}

export interface CodSettlementRecord {
  id: string;
  riderId: string;
  amountDeposited: number;
  depositReference: string;
  verifiedBy: string;
  settledAt: string;
}

export interface RiderLocationSnapshot {
  riderId: string;
  orderId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speedKmh?: number;
  recordedAt: string;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  gatewayOrderId: string;
  gatewayPaymentId?: string;
  amount: number;
  status: 'initiated' | 'authorized' | 'captured' | 'failed' | 'refunded';
  idempotencyKey: string;
  signatureVerified: boolean;
  createdAt: string;
}

export type ApplicationStatus = 'draft' | 'submitted' | 'needs_changes' | 'verified' | 'suspended';

export interface PharmacyOnboardingApplication {
  id: string;
  pharmacyId?: string;
  ownerUserId: string;
  businessName: string;
  legalEntityName: string;
  gstin?: string;
  addressLine1: string;
  city: string;
  pincode: string;
  latitude: number;
  longitude: number;
  operatingHours: { open: string; close: string };
  deliveryRadiusM: number;
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
  status: ApplicationStatus;
  reviewerComments?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserMfaRecord {
  userId: string;
  totpSecret: string;
  isTotpEnabled: boolean;
  backupCodes: string[];
}

export interface UserSessionRecord {
  id: string;
  userId: string;
  deviceInfo: string;
  ipAddress?: string;
  tokenHash: string;
  expiresAt: string;
  isRevoked: boolean;
  createdAt: string;
  lastActiveAt: string;
}

export type RiderApplicationStatus = 'submitted' | 'needs_changes' | 'approved' | 'suspended';

export interface RiderOnboardingApplication {
  id: string;
  userId: string;
  riderId?: string;
  fullName: string;
  phone: string;
  selfieDocPath: string;
  govIdType: 'aadhaar' | 'pan' | 'voter_id';
  govIdNumber: string;
  govIdDocPath: string;
  drivingLicenceNumber: string;
  drivingLicenceDocPath: string;
  drivingLicenceExpiryDate: string;
  vehicleType: 'motorcycle' | 'scooter' | 'ev_scooter' | 'bicycle';
  vehicleRegistrationNumber: string;
  vehicleRcDocPath: string;
  vehicleInsuranceDocPath?: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  bankAccountMasked?: string;
  bankIfsc?: string;
  upiIdMasked?: string;
  status: RiderApplicationStatus;
  reviewerComments?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RiderDevice {
  id: string;
  riderId: string;
  userId: string;
  deviceFingerprint: string;
  deviceModel: string;
  osVersion: string;
  appVersion: string;
  pushToken?: string;
  isActive: boolean;
  lastActiveAt: string;
  createdAt: string;
}

export type StaffRole = 'admin' | 'dispatcher' | 'support_operator';

export interface StaffProfile {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  role: StaffRole;
  isActive: boolean;
  ipAllowlist?: string[];
  isTotpEnabled: boolean;
  lastStepUpAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type ApprovalActionType = 
  | 'CATALOGUE_CLASS_CHANGE' 
  | 'OTC_DIRECT_TOGGLE' 
  | 'SCHEDULE_CHANGE'
  | 'MAX_QUANTITY_CHANGE'
  | 'PRICE_MRP_OVERRIDE'
  | 'REFUND_LIMIT_CHANGE' 
  | 'PHARMACY_DEACTIVATE';

export interface TwoPersonApproval {
  id: string;
  actionType: ApprovalActionType;
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
  stepUpVerified: boolean;
  createdAt: string;
  resolvedAt?: string;
}

export interface BreakGlassSession {
  id: string;
  staffUserId: string;
  resourceType: string;
  resourceId: string;
  statedReason: string;
  totpStepUpVerified: boolean;
  expiresAt: string;
  createdAt: string;
}

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  isEnabled: boolean;
  clientTargets: string[];
  rolloutPercentage: number;
  metadata?: Record<string, any>;
  updatedBy?: string;
  updatedAt: string;
}

export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertType = 
  | 'SLA_BREACH' 
  | 'PHARMACY_UNRESPONSIVE' 
  | 'RIDER_OFFLINE' 
  | 'PAYMENT_MISMATCH' 
  | 'LICENCE_EXPIRING' 
  | 'NEAR_EXPIRY_STOCK' 
  | 'RECALLED_PRODUCT' 
  | 'HIGH_PRIORITY_TICKET';

export interface OperationalAlert {
  id: string;
  alertType: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  entityType: 'order' | 'pharmacy' | 'rider' | 'payment' | 'product' | 'ticket';
  entityId: string;
  slaBreachMinutes?: number;
  isResolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminKpiMetrics {
  ordersToday: number;
  awaitingPharmacyReview: number;
  beingFulfilled: number;
  deliveriesInProgress: number;
  failedAndCancelled: number;
  revenuePaise: number;
  refundsPaise: number;
  codCashOutstandingPaise: number;
}

export interface LiveMapRider {
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

export interface LiveMapPharmacy {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  pendingOrdersCount: number;
}

export interface LiveMapDelivery {
  orderId: string;
  status: OrderStatus;
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

// ============================================================================
// MILESTONE A3: RIDER ASSIGNMENT ENGINE & DISPATCHER TYPES
// ============================================================================
export type AssignmentMode = 'AUTO_WITH_MANUAL_FALLBACK' | 'AUTO' | 'MANUAL';
export type AssignmentTriggerPoint = 'on_acceptance' | 'on_packing' | 'on_packed';
export type RiderOfferStatus = 'offered' | 'accepted' | 'declined' | 'expired' | 'cancelled';
export type AssignmentOutcome = 'OFFERED' | 'ASSIGNED' | 'ESCALATED' | 'NO_CANDIDATES' | 'PAUSED' | 'MANUAL_ONLY';

export interface AssignmentScoringWeights {
  eta: number;        // default: 0.35
  load: number;       // default: 0.20
  idle: number;       // default: 0.15
  acceptance: number; // default: 0.15
  rating: number;     // default: 0.15
}

export interface AssignmentSettings {
  id: string;
  zoneId: string;
  zoneName: string;
  mode: AssignmentMode;
  killSwitchEnabled: boolean;
  triggerPoint: AssignmentTriggerPoint;
  searchRadiusKm: number;
  offerTimeoutSeconds: number;
  maxEscalationOffers: number;
  escalationTimeLimitSeconds: number;
  maxConcurrentOrders: number;
  maxCodCashPaise: number;
  radiusExpansionStepKm: number;
  maxExpandedRadiusKm: number;
  scoringWeights: AssignmentScoringWeights;
  updatedBy?: string;
  updatedAt: string;
}

export interface RiderPresence {
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
  lastCompletedDeliveryAt?: string;
  drivingLicenceExpiryDate: string;
  isApproved: boolean;
  isSuspended: boolean;
  updatedAt: string;
}

export interface RiderOffer {
  id: string;
  orderId: string;
  riderId: string;
  riderName: string;
  status: RiderOfferStatus;
  attemptNumber: number;
  offeredAt: string;
  expiresAt: string;
  respondedAt?: string;
  declineReason?: string;
  createdAt: string;
}

export interface CandidateScoreBreakdown {
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
}

export interface AssignmentDecisionCandidate {
  riderId: string;
  riderName: string;
  scoreBreakdown: CandidateScoreBreakdown;
  totalScore: number;
  eligible: boolean;
  exclusionReason?: string;
}

export interface AssignmentDecision {
  id: string;
  orderId: string;
  zoneId: string;
  mode: AssignmentMode;
  evaluatedAt: string;
  candidateCount: number;
  candidates: AssignmentDecisionCandidate[];
  selectedRiderId?: string;
  outcome: AssignmentOutcome;
  notes?: string;
  createdAt: string;
}

export interface DispatcherIntervention {
  id: string;
  orderId: string;
  staffUserId: string;
  interventionType: 'CALL_RIDER' | 'CALL_PHARMACY' | 'CALL_CUSTOMER' | 'MANUAL_OVERRIDE' | 'PAUSE_AUTO' | 'FAILED_DELIVERY_RESOLUTION';
  targetEntity: string;
  notes: string;
  createdAt: string;
}

export interface DispatchQueueOrder {
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
  paymentMode: PaymentMode;
  codAmountPaise?: number;
  state: OrderState;
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

// ============================================================================
// MILESTONE A4: PHARMACY AND RIDER MANAGEMENT TYPES
// ============================================================================
export interface PharmacyVerificationChecklist {
  id: string;
  applicationId: string;
  licenceValidityVerified: boolean;
  registrationVerified: boolean;
  physicalAddressVerified: boolean;
  authorisedPersonsVerified: boolean;
  pharmacistCredentialsVerified: boolean;
  verificationNotes?: string;
  verifiedBy?: string;
  updatedAt: string;
}

export type PharmacyExceptionType = 
  | 'DISPENSING_DISCREPANCY'
  | 'MISSING_PHARMACIST_SIGNATURE'
  | 'TEMPERATURE_EXCURSION'
  | 'DELAYED_HANDOVER'
  | 'STOCK_MISMATCH'
  | 'EXPIRED_STOCK_ATTEMPT'
  | 'CUSTOMER_COMPLAINT'
  | 'REGULATORY_NOTICE';

export interface PharmacyComplianceException {
  id: string;
  pharmacyId: string;
  pharmacyName?: string;
  orderId?: string;
  exceptionType: PharmacyExceptionType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  reportedBy: string;
  resolutionNotes?: string;
  isResolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface PharmacyCommissionSettings {
  pharmacyId: string;
  commissionRatePct: number;
  fixedPlatformFeePaise: number;
  payoutCycle: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
  minPayoutThresholdPaise: number;
  bankAccountMasked?: string;
  bankIfsc?: string;
  upiIdMasked?: string;
  beneficiaryName?: string;
  isActive: boolean;
  updatedBy?: string;
  updatedAt: string;
}

export interface PharmacyScorecard {
  pharmacyId: string;
  businessName: string;
  acceptanceRate: number;
  avgAcceptMinutes: number;
  avgPackMinutes: number;
  rejectionReasons: { reason: string; count: number }[];
  stockAccuracyRate: number;
  complaintsCount: number;
  activeLicenceStatus: 'VALID' | 'EXPIRING_SOON' | 'EXPIRING_CRITICAL' | 'EXPIRED';
  licenceExpiryDate: string;
  daysToExpiry: number;
}

export interface RiderVerificationChecklist {
  id: string;
  applicationId: string;
  drivingLicenceVerified: boolean;
  vehicleRcVerified: boolean;
  identityVerified: boolean;
  backgroundCheckCleared: boolean;
  verificationNotes?: string;
  verifiedBy?: string;
  updatedAt: string;
}

export type RiderIncidentType = 
  | 'ACCIDENT'
  | 'SPILL_DAMAGE'
  | 'CUSTOMER_DISPUTE'
  | 'DELAYED_DELIVERY'
  | 'VEHICLE_BREAKDOWN'
  | 'CASH_DISCREPANCY'
  | 'BEHAVIOURAL_ISSUE'
  | 'OTHER';

export interface RiderIncidentReport {
  id: string;
  riderId: string;
  riderName?: string;
  orderId?: string;
  incidentType: RiderIncidentType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  reportedBy: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
  resolutionNotes?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface RiderCashDeposit {
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

export interface RiderPayoutItem {
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
}

export interface RiderPayoutBatch {
  id: string;
  periodStart: string;
  periodEnd: string;
  totalRiders: number;
  totalAmountPaise: number;
  status: 'DRAFT' | 'APPROVED' | 'PROCESSED';
  items: RiderPayoutItem[];
  createdBy?: string;
  processedAt?: string;
  createdAt: string;
}

// ============================================================================
// MILESTONE A5: MASTER CATALOGUE, TWO-PERSON APPROVALS & BATCH RECALLS
// ============================================================================

export type RecallClass = 'CLASS_1_CRITICAL' | 'CLASS_2_DEFECT' | 'CLASS_3_MINOR';
export type RecallStatus = 'ACTIVE' | 'RESOLVED' | 'CANCELLED';

export interface ProductBatchRecall {
  id: string;
  productId: string;
  productName: string;
  batchNumber: string; // 'ALL' or specific batch like 'DL-24A91'
  manufacturerNoticeRef: string;
  recallClass: RecallClass;
  reason: string;
  issuedBy: string;
  issuedByName: string;
  issuedAt: string;
  status: RecallStatus;
  resolutionNotes?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  affectedInventoryUnits: number;
  affectedActiveOrdersCount: number;
}

export type ModerationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface CatalogueImageModeration {
  id: string;
  productId: string;
  productName: string;
  submittedByPharmacyId: string;
  pharmacyName: string;
  imageUrl: string;
  submittedAt: string;
  status: ModerationStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}
