import { 
  User, 
  CustomerAddress, 
  AnimalProfile, 
  Pharmacy, 
  Product, 
  PharmacyInventoryItem, 
  Prescription, 
  Order, 
  PaymentRecord, 
  OrderState,
  RiderProfile,
  CodCollectionRecord,
  CodSettlementRecord,
  RiderLocationSnapshot,
  InventoryReservation,
  OrderStatusHistoryEntry,
  PharmacyOnboardingApplication,
  UserMfaRecord,
  UserSessionRecord,
  RiderOnboardingApplication,
  RiderDevice,
  StaffProfile,
  StaffRole,
  TwoPersonApproval,
  BreakGlassSession,
  ApprovalActionType,
  FeatureFlag,
  OperationalAlert,
  AdminKpiMetrics,
  LiveMapRider,
  LiveMapPharmacy,
  LiveMapDelivery,
  AssignmentMode,
  AssignmentTriggerPoint,
  AssignmentSettings,
  RiderPresence,
  RiderOffer,
  AssignmentDecision,
  DispatcherIntervention,
  DispatchQueueOrder,
  PharmacyVerificationChecklist,
  PharmacyComplianceException,
  PharmacyCommissionSettings,
  PharmacyScorecard,
  RiderVerificationChecklist,
  RiderIncidentReport,
  RiderCashDeposit,
  RiderPayoutBatch,
  RiderPayoutItem,
  ProductBatchRecall,
  RecallClass,
  RecallStatus,
  CatalogueImageModeration,
  ModerationStatus,
  AppConfigRecord
} from './types';

export class MedcureDataStore {
  public appConfigs: Map<string, AppConfigRecord> = new Map();
  public users: Map<string, User> = new Map();
  public addresses: Map<string, CustomerAddress> = new Map();
  public animals: Map<string, AnimalProfile> = new Map();
  public pharmacies: Map<string, Pharmacy> = new Map();
  public products: Map<string, Product> = new Map();
  public inventory: Map<string, PharmacyInventoryItem> = new Map();
  public prescriptions: Map<string, Prescription> = new Map();
  public orders: Map<string, Order> = new Map();
  public reservations: Map<string, InventoryReservation> = new Map();
  public orderStatusHistory: Map<string, OrderStatusHistoryEntry[]> = new Map();
  public idempotencyKeys: Map<string, { userId: string; statusCode: number; body: any; createdAt: number }> = new Map();
  public payments: Map<string, PaymentRecord> = new Map();
  public onboardingApplications: Map<string, PharmacyOnboardingApplication> = new Map();
  public mfaCredentials: Map<string, UserMfaRecord> = new Map();
  public userSessions: Map<string, UserSessionRecord> = new Map();
  public riders: Map<string, RiderProfile> = new Map();
  public riderApplications: Map<string, RiderOnboardingApplication> = new Map();
  public riderDevices: Map<string, RiderDevice> = new Map();
  public staffProfiles: Map<string, StaffProfile> = new Map();
  public twoPersonApprovals: Map<string, TwoPersonApproval> = new Map();
  public breakGlassSessions: Map<string, BreakGlassSession> = new Map();
  public featureFlags: Map<string, FeatureFlag> = new Map();
  public operationalAlerts: Map<string, OperationalAlert> = new Map();
  public codCollections: Map<string, CodCollectionRecord> = new Map();
  public codSettlements: Map<string, CodSettlementRecord> = new Map();
  public riderLocations: Map<string, RiderLocationSnapshot> = new Map();
  public assignmentSettings: Map<string, AssignmentSettings> = new Map();
  public riderPresence: Map<string, RiderPresence> = new Map();
  public riderOffers: Map<string, RiderOffer> = new Map();
  public assignmentDecisions: Map<string, AssignmentDecision> = new Map();
  public dispatcherInterventions: Map<string, DispatcherIntervention> = new Map();
  public pausedAutoAssignmentOrders: Set<string> = new Set();
  public pharmacyChecklists: Map<string, PharmacyVerificationChecklist> = new Map();
  public pharmacyExceptions: Map<string, PharmacyComplianceException> = new Map();
  public pharmacyCommissions: Map<string, PharmacyCommissionSettings> = new Map();
  public riderChecklists: Map<string, RiderVerificationChecklist> = new Map();
  public riderIncidents: Map<string, RiderIncidentReport> = new Map();
  public riderCashDeposits: Map<string, RiderCashDeposit> = new Map();
  public riderPayoutBatches: Map<string, RiderPayoutBatch> = new Map();
  public productBatchRecalls: Map<string, ProductBatchRecall> = new Map();
  public catalogueImageModerations: Map<string, CatalogueImageModeration> = new Map();
  public auditEvents: Array<{
    id: string;
    actorId?: string;
    action: string;
    resourceType: string;
    resourceId: string;
    details: any;
    timestamp: string;
  }> = [];

  constructor() {
    this.seedGorakhpurData();
  }

  public releaseExpiredReservations(): number {
    const now = new Date().toISOString();
    let releasedCount = 0;
    for (const res of this.reservations.values()) {
      if (res.status === 'ACTIVE' && res.expiresAt < now) {
        res.status = 'RELEASED';
        const inv = Array.from(this.inventory.values()).find(
          i => i.pharmacyId === res.pharmacyId && i.productId === res.productId
        );
        if (inv) {
          inv.availableQuantity += res.quantity;
          inv.reservedQuantity = Math.max(0, inv.reservedQuantity - res.quantity);
        }
        releasedCount++;
      }
    }
    return releasedCount;
  }

  private seedGorakhpurData() {
    // 1. Users
    const seedUsers: User[] = [
      { id: 'usr-admin-1', phone: '+919876500001', fullName: 'Dr. Alok Verma', role: 'platform_admin', isActive: true },
      { id: 'usr-admin-2', phone: '+919876500007', fullName: 'Sanjay Pandey', role: 'platform_admin', isActive: true },
      { id: 'usr-dispatch-1', phone: '+919876500008', fullName: 'Rohit Tripathi', role: 'dispatcher', isActive: true },
      { id: 'usr-support-1', phone: '+919876500009', fullName: 'Ananya Singh', role: 'support_operator', isActive: true },
      { id: 'usr-owner-1', phone: '+919876500002', fullName: 'Rajesh Gupta', role: 'pharmacy_owner', isActive: true },
      { id: 'usr-pharma-1', phone: '+919876500003', fullName: 'Sunil Kumar Sharma', role: 'pharmacist', isActive: true },
      { id: 'usr-staff-1', phone: '+919876500004', fullName: 'Amit Mishra', role: 'pharmacy_staff', isActive: true },
      { id: 'usr-rider-1', phone: '+919876500005', fullName: 'Vikas Yadav', role: 'delivery_partner', isActive: true },
      { id: 'usr-cust-1', phone: '+919876500006', fullName: 'Pooja Srivastava', role: 'customer', isActive: true }
    ];
    seedUsers.forEach(u => this.users.set(u.id, u));

    // Seed Staff Profiles
    const seedStaff: StaffProfile[] = [
      {
        id: 'staff-1',
        userId: 'usr-admin-1',
        email: 'admin@medcure.in',
        fullName: 'Dr. Alok Verma',
        role: 'admin',
        isActive: true,
        isTotpEnabled: true,
        lastStepUpAt: new Date().toISOString(),
        createdAt: '2026-10-01T08:00:00.000Z',
        updatedAt: '2026-10-01T08:00:00.000Z'
      },
      {
        id: 'staff-2',
        userId: 'usr-admin-2',
        email: 'admin2@medcure.in',
        fullName: 'Sanjay Pandey',
        role: 'admin',
        isActive: true,
        isTotpEnabled: true,
        lastStepUpAt: new Date().toISOString(),
        createdAt: '2026-10-01T08:00:00.000Z',
        updatedAt: '2026-10-01T08:00:00.000Z'
      },
      {
        id: 'staff-3',
        userId: 'usr-dispatch-1',
        email: 'dispatch@medcure.in',
        fullName: 'Rohit Tripathi',
        role: 'dispatcher',
        isActive: true,
        isTotpEnabled: true,
        lastStepUpAt: new Date().toISOString(),
        createdAt: '2026-10-01T08:00:00.000Z',
        updatedAt: '2026-10-01T08:00:00.000Z'
      },
      {
        id: 'staff-4',
        userId: 'usr-support-1',
        email: 'support@medcure.in',
        fullName: 'Ananya Singh',
        role: 'support_operator',
        isActive: true,
        isTotpEnabled: true,
        lastStepUpAt: new Date().toISOString(),
        createdAt: '2026-10-01T08:00:00.000Z',
        updatedAt: '2026-10-01T08:00:00.000Z'
      }
    ];
    seedStaff.forEach(s => this.staffProfiles.set(s.id, s));

    // Seed Platform Feature Flags
    const seedFlags: FeatureFlag[] = [
      {
        id: 'flag-1',
        key: 'veterinary_ordering_v2',
        name: 'Veterinary Healthcare Domain',
        description: 'Dedicated animal profile prescription workflows and veterinary products',
        isEnabled: true,
        clientTargets: ['customer', 'pharmacy', 'admin'],
        rolloutPercentage: 100,
        updatedAt: new Date().toISOString()
      },
      {
        id: 'flag-2',
        key: 'ai_symptom_assistant_customer',
        name: 'Controlled AI Assistant',
        description: 'Assistive non-diagnostic medicine navigation and order status lookup',
        isEnabled: true,
        clientTargets: ['customer', 'admin'],
        rolloutPercentage: 100,
        updatedAt: new Date().toISOString()
      },
      {
        id: 'flag-3',
        key: 'instant_cod_threshold_5000',
        name: 'Doorstep COD ₹5000 Limit Guard',
        description: 'Statutory cash-in-hand threshold blocking assignments above limit',
        isEnabled: true,
        clientTargets: ['rider', 'admin', 'dispatcher'],
        rolloutPercentage: 100,
        updatedAt: new Date().toISOString()
      },
      {
        id: 'flag-4',
        key: 'fefo_batch_auto_recommend',
        name: 'FEFO Batch Recommendation',
        description: 'First-Expiry First-Out inventory picking prioritization for partner pharmacies',
        isEnabled: true,
        clientTargets: ['pharmacy', 'admin'],
        rolloutPercentage: 100,
        updatedAt: new Date().toISOString()
      },
      {
        id: 'flag-5',
        key: 'prescription_assistive_ocr',
        name: 'Assistive Prescription OCR',
        description: 'Machine-read medicine suggestions labeled clearly as unverified hints',
        isEnabled: true,
        clientTargets: ['pharmacy', 'admin'],
        rolloutPercentage: 100,
        updatedAt: new Date().toISOString()
      },
      {
        id: 'flag-6',
        key: 'live_rider_gps_telemetry',
        name: 'Live GPS Tracking & Dynamic ETA',
        description: 'Real-time telemetry broadcasting with speed-jump and spoof filtering',
        isEnabled: true,
        clientTargets: ['customer', 'rider', 'admin', 'dispatcher'],
        rolloutPercentage: 100,
        updatedAt: new Date().toISOString()
      }
    ];
    seedFlags.forEach(f => this.featureFlags.set(f.key, f));

    // Rider Profile
    const rider: RiderProfile = {
      id: 'rider-1',
      userId: 'usr-rider-1',
      vehicleType: 'Hero Splendor Plus (UP53-AB-1234)',
      vehicleRegistrationNumber: 'UP53-AB-1234',
      drivingLicenceNumber: 'UP5320210098765',
      isAvailable: true,
      currentCashInHand: 0,
      isApproved: true,
      approvalStatus: 'approved',
      onboardingApplicationId: 'app-rider-1'
    };
    this.riders.set(rider.id, rider);

    // Seeded Rider Application
    const riderApp: RiderOnboardingApplication = {
      id: 'app-rider-1',
      userId: 'usr-rider-1',
      riderId: 'rider-1',
      fullName: 'Vikas Yadav',
      phone: '+919876500005',
      selfieDocPath: '/secure/riders/usr-rider-1/selfie.jpg',
      govIdType: 'aadhaar',
      govIdNumber: 'XXXX-XXXX-8921',
      govIdDocPath: '/secure/riders/usr-rider-1/aadhaar.pdf',
      drivingLicenceNumber: 'UP5320210098765',
      drivingLicenceDocPath: '/secure/riders/usr-rider-1/dl.pdf',
      drivingLicenceExpiryDate: '2031-12-31',
      vehicleType: 'motorcycle',
      vehicleRegistrationNumber: 'UP53-AB-1234',
      vehicleRcDocPath: '/secure/riders/usr-rider-1/rc.pdf',
      emergencyContactName: 'Ramesh Yadav',
      emergencyContactPhone: '+919876511111',
      emergencyContactRelation: 'Brother',
      bankAccountMasked: '••••••••4321',
      bankIfsc: 'SBIN0000123',
      upiIdMasked: 'vikas@oksbi',
      status: 'approved',
      reviewerComments: 'Verified with RTO Parivahan and Aadhaar OK',
      createdAt: '2026-10-01T10:00:00.000Z',
      updatedAt: '2026-10-01T12:00:00.000Z'
    };
    this.riderApplications.set(riderApp.id, riderApp);

    // Seeded Rider Device
    const riderDev: RiderDevice = {
      id: 'dev-rider-1',
      riderId: 'rider-1',
      userId: 'usr-rider-1',
      deviceFingerprint: 'fp-pixel7-98765',
      deviceModel: 'Google Pixel 7',
      osVersion: 'Android 14',
      appVersion: '1.0.0+1',
      pushToken: 'fcm-token-rider-1',
      isActive: true,
      lastActiveAt: new Date().toISOString(),
      createdAt: '2026-10-01T10:05:00.000Z'
    };
    this.riderDevices.set(riderDev.id, riderDev);

    // Seed Operational Alerts (Milestone A2)
    const seedAlerts: OperationalAlert[] = [
      {
        id: 'alt-sla-101',
        alertType: 'SLA_BREACH',
        severity: 'critical',
        title: 'Order ord-102 Awaiting Review Beyond SLA',
        description: 'Order ord-102 has been in pending_pharmacist_review for 14 minutes (SLA threshold is 10 minutes) at City Central Pharmacy.',
        entityType: 'order',
        entityId: 'ord-102',
        slaBreachMinutes: 14,
        isResolved: false,
        createdAt: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 14 * 60 * 1000).toISOString()
      },
      {
        id: 'alt-lic-102',
        alertType: 'LICENCE_EXPIRING',
        severity: 'warning',
        title: 'Form 20 Drug Licence Expiring Soon',
        description: 'City Central Pharmacy (pharm-gkp-1) retail drug licence expires in 28 days. Renewal submission pending with UP FDA.',
        entityType: 'pharmacy',
        entityId: 'pharm-gkp-1',
        isResolved: false,
        createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
      },
      {
        id: 'alt-exp-103',
        alertType: 'NEAR_EXPIRY_STOCK',
        severity: 'warning',
        title: 'Near-Expiry Stock Flagged: Batch AZI-2024-B1',
        description: 'Batch AZI-2024-B1 of Azithromycin 500mg at City Central Pharmacy has 45 days remaining until expiry. Prioritize FEFO.',
        entityType: 'product',
        entityId: 'prd-azith-500',
        isResolved: false,
        createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString()
      },
      {
        id: 'alt-tkt-104',
        alertType: 'HIGH_PRIORITY_TICKET',
        severity: 'critical',
        title: 'Urgent Quality Complaint: Cold-Chain Integrity Issue',
        description: 'Customer ticket tkt-901 flagged compromised cold chain for Human Insulin. Order ord-101 requires immediate investigation.',
        entityType: 'ticket',
        entityId: 'tkt-901',
        isResolved: false,
        createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString()
      }
    ];
    seedAlerts.forEach(a => this.operationalAlerts.set(a.id, a));

    // Seed Assignment Settings (Milestone A3)
    const seedSettings: AssignmentSettings = {
      id: 'set-gkp-central',
      zoneId: 'zone-gkp-central',
      zoneName: 'Gorakhpur Central Urban Zone',
      mode: 'AUTO_WITH_MANUAL_FALLBACK',
      killSwitchEnabled: false,
      triggerPoint: 'on_packing',
      searchRadiusKm: 3.0,
      offerTimeoutSeconds: 45,
      maxEscalationOffers: 3,
      escalationTimeLimitSeconds: 180,
      maxConcurrentOrders: 1,
      maxCodCashPaise: 500000, // ₹5,000 statutory COD limit
      radiusExpansionStepKm: 1.0,
      maxExpandedRadiusKm: 5.0,
      scoringWeights: {
        eta: 0.35,
        load: 0.20,
        idle: 0.15,
        acceptance: 0.15,
        rating: 0.15
      },
      updatedAt: new Date().toISOString()
    };
    this.assignmentSettings.set(seedSettings.zoneId, seedSettings);

    // Seed Rider Presence (Milestone A3 Fleet Roster)
    const seedPresence: RiderPresence[] = [
      {
        riderId: 'rider-1',
        userId: 'usr-rider-1',
        fullName: 'Vikas Yadav',
        phone: '+919876500005',
        isOnline: true,
        currentLatitude: 26.7606,
        currentLongitude: 83.3732,
        lastLocationUpdateAt: new Date(Date.now() - 5000).toISOString(),
        currentLoad: 0,
        currentCashInHandPaise: 120000,
        acceptanceRate: 0.96,
        rating: 4.90,
        totalCompletedOrders: 312,
        lastCompletedDeliveryAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        drivingLicenceExpiryDate: '2031-12-31',
        isApproved: true,
        isSuspended: false,
        updatedAt: new Date().toISOString()
      },
      {
        riderId: 'rider-2',
        userId: 'usr-rider-2',
        fullName: 'Amit Kumar',
        phone: '+919876500006',
        isOnline: true,
        currentLatitude: 26.7580,
        currentLongitude: 83.3750,
        lastLocationUpdateAt: new Date(Date.now() - 10000).toISOString(),
        currentLoad: 0,
        currentCashInHandPaise: 650000, // ₹6,500 > ₹5,000 threshold
        acceptanceRate: 0.92,
        rating: 4.75,
        totalCompletedOrders: 194,
        drivingLicenceExpiryDate: '2030-05-15',
        isApproved: true,
        isSuspended: false,
        updatedAt: new Date().toISOString()
      },
      {
        riderId: 'rider-3',
        userId: 'usr-rider-3',
        fullName: 'Deepa Maurya',
        phone: '+919876500007',
        isOnline: true,
        currentLatitude: 26.7620,
        currentLongitude: 83.3710,
        lastLocationUpdateAt: new Date(Date.now() - 75000).toISOString(), // > 30s stale
        currentLoad: 0,
        currentCashInHandPaise: 50000,
        acceptanceRate: 0.98,
        rating: 4.95,
        totalCompletedOrders: 420,
        drivingLicenceExpiryDate: '2029-10-20',
        isApproved: true,
        isSuspended: false,
        updatedAt: new Date().toISOString()
      },
      {
        riderId: 'rider-4',
        userId: 'usr-rider-4',
        fullName: 'Suraj Verma',
        phone: '+919876500008',
        isOnline: true,
        currentLatitude: 26.7610,
        currentLongitude: 83.3740,
        lastLocationUpdateAt: new Date(Date.now() - 8000).toISOString(),
        currentLoad: 1, // at max capacity
        currentCashInHandPaise: 80000,
        acceptanceRate: 0.90,
        rating: 4.60,
        totalCompletedOrders: 150,
        drivingLicenceExpiryDate: '2028-04-10',
        isApproved: true,
        isSuspended: false,
        updatedAt: new Date().toISOString()
      },
      {
        riderId: 'rider-5',
        userId: 'usr-rider-5',
        fullName: 'Rajesh Singh',
        phone: '+919876500009',
        isOnline: false, // offline
        currentLatitude: 26.7590,
        currentLongitude: 83.3730,
        lastLocationUpdateAt: new Date(Date.now() - 5000).toISOString(),
        currentLoad: 0,
        currentCashInHandPaise: 0,
        acceptanceRate: 0.88,
        rating: 4.50,
        totalCompletedOrders: 85,
        drivingLicenceExpiryDate: '2027-11-01',
        isApproved: true,
        isSuspended: false,
        updatedAt: new Date().toISOString()
      },
      {
        riderId: 'rider-6',
        userId: 'usr-rider-6',
        fullName: 'Manoj Gupta',
        phone: '+919876500010',
        isOnline: true,
        currentLatitude: 26.7950, // ~4.2 km away
        currentLongitude: 83.3980,
        lastLocationUpdateAt: new Date(Date.now() - 12000).toISOString(),
        currentLoad: 0,
        currentCashInHandPaise: 150000,
        acceptanceRate: 0.94,
        rating: 4.80,
        totalCompletedOrders: 280,
        drivingLicenceExpiryDate: '2032-01-01',
        isApproved: true,
        isSuspended: false,
        updatedAt: new Date().toISOString()
      }
    ];
    seedPresence.forEach(p => this.riderPresence.set(p.riderId, p));

    // Seed Sample Operational Orders (Milestone A3 Dispatch Queue)
    const seedOrders: Order[] = [
      {
        id: 'ord-101',
        orderCode: 'MC-GKP-202610-101',
        userId: 'usr-cust-1',
        pharmacyId: 'pharm-gkp-1',
        deliveryAddressId: 'addr-cust-1',
        categoryDomain: 'human',
        paymentMode: 'ONLINE',
        state: 'PACKED',
        items: [
          {
            id: 'item-101-1',
            orderId: 'ord-101',
            productId: 'prd-dolo-650',
            productNameSnapshot: 'Dolo 650mg Tablet',
            unitPriceSnapshot: 34.0,
            quantity: 2
          }
        ],
        totalMrp: 68.0,
        totalDiscount: 0,
        deliveryFee: 25.0,
        taxes: 12.0,
        payableAmount: 105.0,
        itemTotalPaise: 6800,
        deliveryFeePaise: 2500,
        handlingFeePaise: 0,
        discountPaise: 0,
        payableAmountPaise: 10500,
        deliveryOtp: '4921',
        deliveryAddress: {
          addressLine1: 'Flat 302, Royal Residency, Park Road, Golghar',
          city: 'Gorakhpur',
          latitude: 26.7606,
          longitude: 83.3732
        },
        createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ord-102',
        orderCode: 'MC-GKP-202610-102',
        userId: 'usr-cust-1',
        pharmacyId: 'pharm-gkp-1',
        deliveryAddressId: 'addr-cust-1',
        categoryDomain: 'human',
        paymentMode: 'COD',
        state: 'PACKED',
        items: [
          {
            id: 'item-102-1',
            orderId: 'ord-102',
            productId: 'prd-dettol-250',
            productNameSnapshot: 'Dettol Antiseptic Liquid',
            unitPriceSnapshot: 167.0,
            quantity: 2
          }
        ],
        totalMrp: 334.0,
        totalDiscount: 0,
        deliveryFee: 16.0,
        taxes: 0,
        payableAmount: 350.0,
        itemTotalPaise: 33400,
        deliveryFeePaise: 1600,
        handlingFeePaise: 0,
        discountPaise: 0,
        payableAmountPaise: 35000,
        deliveryOtp: '8104',
        deliveryAddress: {
          addressLine1: 'House 14, Civil Lines, Near St. Andrews',
          city: 'Gorakhpur',
          latitude: 26.7580,
          longitude: 83.3760
        },
        createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ord-103',
        orderCode: 'MC-GKP-202610-103',
        userId: 'usr-cust-1',
        pharmacyId: 'pharm-gkp-1',
        deliveryAddressId: 'addr-cust-1',
        categoryDomain: 'veterinary',
        paymentMode: 'COD',
        state: 'RIDER_ASSIGNED',
        riderId: 'rider-4',
        items: [
          {
            id: 'item-103-1',
            orderId: 'ord-103',
            productId: 'prd-hitek-100',
            productNameSnapshot: 'Hitek (Ivermectin) Bolus 100mg',
            unitPriceSnapshot: 220.0,
            quantity: 1
          }
        ],
        totalMrp: 220.0,
        totalDiscount: 0,
        deliveryFee: 0,
        taxes: 0,
        payableAmount: 220.0,
        itemTotalPaise: 22000,
        deliveryFeePaise: 0,
        handlingFeePaise: 0,
        discountPaise: 0,
        payableAmountPaise: 22000,
        deliveryOtp: '3391',
        deliveryAddress: {
          addressLine1: 'Dairy Farm, Chargawan Road, Medical College Area',
          city: 'Gorakhpur',
          latitude: 26.7900,
          longitude: 83.3900
        },
        createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ord-104',
        orderCode: 'MC-GKP-202610-104',
        userId: 'usr-cust-1',
        pharmacyId: 'pharm-gkp-1',
        deliveryAddressId: 'addr-cust-1',
        categoryDomain: 'human',
        paymentMode: 'COD',
        state: 'DELIVERY_FAILED',
        riderId: 'rider-1',
        items: [
          {
            id: 'item-104-1',
            orderId: 'ord-104',
            productId: 'prd-boroline-20g',
            productNameSnapshot: 'Boroline Ayurvedic Antiseptic Cream',
            unitPriceSnapshot: 45.0,
            quantity: 4
          }
        ],
        totalMrp: 180.0,
        totalDiscount: 0,
        deliveryFee: 0,
        taxes: 0,
        payableAmount: 180.0,
        itemTotalPaise: 18000,
        deliveryFeePaise: 0,
        handlingFeePaise: 0,
        discountPaise: 0,
        payableAmountPaise: 18000,
        deliveryOtp: '7250',
        deliveryAddress: {
          addressLine1: 'Shop 7, Betiahata Chowk',
          city: 'Gorakhpur',
          latitude: 26.7500,
          longitude: 83.3650
        },
        createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    seedOrders.forEach(o => this.orders.set(o.id, o));

    // 2. Customer Address
    const addr: CustomerAddress = {
      id: 'addr-cust-1',
      userId: 'usr-cust-1',
      addressLine1: 'Flat 302, Royal Residency, Park Road',
      addressLine2: 'Golghar Market',
      landmark: 'Near City Mall',
      city: 'Gorakhpur',
      state: 'Uttar Pradesh',
      pincode: '273001',
      latitude: 26.7606,
      longitude: 83.3732,
      isDefault: true
    };
    this.addresses.set(addr.id, addr);

    // 3. Animal Profiles
    const dog: AnimalProfile = {
      id: 'pet-dog-1',
      userId: 'usr-cust-1',
      animalName: 'Sheru',
      species: 'Canine',
      breed: 'German Shepherd',
      ageYears: 3,
      weightKg: 28.5,
      isFoodProducing: false,
      allergies: 'None'
    };
    const cow: AnimalProfile = {
      id: 'pet-cow-1',
      userId: 'usr-cust-1',
      animalName: 'Gauri',
      species: 'Bovine',
      breed: 'Sahiwal Dairy Cow',
      ageYears: 5,
      weightKg: 380,
      isFoodProducing: true,
      allergies: 'Sulphonamides'
    };
    this.animals.set(dog.id, dog);
    this.animals.set(cow.id, cow);

    // 4. Verified Partner Pharmacy
    const pharm1: Pharmacy = {
      id: 'pharm-gkp-1',
      businessName: 'Gorakhpur Medicos & Veterinary Care',
      legalEntityName: 'M/S Gorakhpur Healthcare & Animal Health LLP',
      contactPhone: '+919876500002',
      contactEmail: 'orders@gorakhpurmedico.in',
      addressLine1: 'Shop 14, Cinema Road, Golghar',
      city: 'Gorakhpur',
      pincode: '273001',
      latitude: 26.7598,
      longitude: 83.3725,
      isActive: true,
      isVerified: true,
      operatingHours: { open: '08:00', close: '22:00' },
      licenceNumber: 'UP-GKP-20-847291'
    };
    this.pharmacies.set(pharm1.id, pharm1);

    // 5. Products (Human & Veterinary)
    const prods: Product[] = [
      {
        id: 'prd-dolo-650',
        name: 'Dolo 650mg Tablet',
        brand: 'Micro Labs',
        genericSaltName: 'Paracetamol (650mg)',
        categoryId: 'cat-fever',
        categoryDomain: 'human',
        formulation: 'Tablet',
        strength: '650mg',
        packSize: '15 Tablets',
        manufacturer: 'Micro Labs Ltd',
        mrp: 34.00,
        requiresPrescription: false,
        isOtcDirect: true,
        scheduleType: 'OTC',
        imageUrl: '/products/dolo650.jpg',
        storageInstructions: 'Store below 30°C in dry place.'
      },
      {
        id: 'prd-glycomet-500',
        name: 'Glycomet 500 SR Tablet',
        brand: 'USV Ltd',
        genericSaltName: 'Metformin Hydrochloride (500mg)',
        categoryId: 'cat-diabetes',
        categoryDomain: 'human',
        formulation: 'Tablet (Sustained Release)',
        strength: '500mg',
        packSize: '20 Tablets',
        manufacturer: 'USV Private Limited',
        mrp: 52.00,
        requiresPrescription: true,
        isOtcDirect: false,
        scheduleType: 'Schedule H',
        imageUrl: '/products/glycomet500.jpg',
        storageInstructions: 'Store below 25°C. Protect from moisture.'
      },
      {
        id: 'prd-himcal-1l',
        name: 'HimCal Liquid Calcium (Cattle/Buffalo)',
        brand: 'Himalaya Animal Health',
        genericSaltName: 'Calcium, Phosphorus & Vit D3 Suspension',
        categoryId: 'cat-vet-nutrition',
        categoryDomain: 'veterinary',
        formulation: 'Liquid Suspension',
        strength: 'High Bioavailable Calcium',
        packSize: '1 Litre Bottle',
        manufacturer: 'The Himalaya Drug Company',
        mrp: 240.00,
        requiresPrescription: false,
        isOtcDirect: true,
        scheduleType: 'OTC',
        imageUrl: '/products/himcal.jpg',
        speciesRestrictions: [
          { speciesName: 'Cattle', withdrawalPeriodDays: 0, precautions: 'Nutritional supplement. Zero milk withdrawal.' },
          { speciesName: 'Buffalo', withdrawalPeriodDays: 0, precautions: 'Nutritional supplement. Zero milk withdrawal.' }
        ]
      },
      {
        id: 'prd-drontal-dog',
        name: 'Drontal Plus Chewable Dewormer for Dogs',
        brand: 'Elanco',
        genericSaltName: 'Praziquantel, Pyrantel Embonate, Febantel',
        categoryId: 'cat-vet-parasites',
        categoryDomain: 'veterinary',
        formulation: 'Chewable Bone Tablet',
        strength: 'For 10kg Bodyweight',
        packSize: '1 Tablet Strip',
        manufacturer: 'Elanco Animal Health',
        mrp: 130.00,
        requiresPrescription: false,
        isOtcDirect: true,
        scheduleType: 'OTC',
        imageUrl: '/products/drontal.jpg',
        speciesRestrictions: [
          { speciesName: 'Canine', withdrawalPeriodDays: 0, precautions: 'Strictly for dogs. Not for human use.' }
        ]
      },
      {
        id: 'prd-intacef-4g',
        name: 'Intacef Tazo 4.5g Veterinary Injectable',
        brand: 'Intas Animal Health',
        genericSaltName: 'Ceftriaxone Sodium & Tazobactam Sodium',
        categoryId: 'cat-vet-antibiotics',
        categoryDomain: 'veterinary',
        formulation: 'Vial with Sterile Water (WFI)',
        strength: '4.5g',
        packSize: '1 Glass Vial + Diluent',
        manufacturer: 'Intas Pharmaceuticals Ltd',
        mrp: 485.00,
        requiresPrescription: true,
        isOtcDirect: false,
        scheduleType: 'Schedule H',
        imageUrl: '/products/intacef.jpg',
        speciesRestrictions: [
          { speciesName: 'Bovine', withdrawalPeriodDays: 7, precautions: 'Milk withdrawal period: 7 days. Meat withdrawal: 28 days.' }
        ]
      },
      {
        id: 'prd-betnovate-n',
        name: 'Betnovate N Tube Of 25gm Cream',
        brand: 'GSK Pharmaceuticals',
        genericSaltName: 'Betamethasone (0.1% w/w) + Neomycin (0.5% w/w)',
        categoryId: 'cat-skin-derma',
        categoryDomain: 'human',
        formulation: 'Topical Cream',
        strength: '0.1% + 0.5%',
        packSize: '25 g',
        manufacturer: 'GlaxoSmithKline Pharmaceuticals Ltd',
        mrp: 68.00,
        requiresPrescription: true,
        isOtcDirect: false,
        scheduleType: 'Schedule H',
        imageUrl: '/products/betnovate-n.png',
        storageInstructions: 'Store below 25°C. Do not freeze.'
      },
      {
        id: 'prd-boroline-20g',
        name: 'Boroline Ayurvedic Antiseptic Cream',
        brand: 'G.D. Pharmaceuticals',
        genericSaltName: 'Boric Acid, Zinc Oxide, Anhydrous Lanolin',
        categoryId: 'cat-antiseptic',
        categoryDomain: 'human',
        formulation: 'Ointment',
        strength: 'Ayurvedic Formula',
        packSize: '20 g',
        manufacturer: 'G.D. Pharmaceuticals Pvt Ltd',
        mrp: 45.00,
        requiresPrescription: false,
        isOtcDirect: true,
        scheduleType: 'OTC',
        imageUrl: '/products/boroline.png',
        storageInstructions: 'Store in cool and dry place.'
      },
      {
        id: 'prd-hansaplast-20',
        name: 'Hansaplast Washproof Anti-Septic Adhesive Bandage',
        brand: 'Hansaplast',
        genericSaltName: 'Medicated Dressing (Silver/Benzalkonium Chloride)',
        categoryId: 'cat-first-aid',
        categoryDomain: 'human',
        formulation: 'Strips',
        strength: 'Water Resistant',
        packSize: '20 pcs',
        manufacturer: 'Beiersdorf India Pvt Ltd',
        mrp: 60.00,
        requiresPrescription: false,
        isOtcDirect: true,
        scheduleType: 'OTC',
        imageUrl: '/products/hansaplast.png',
        storageInstructions: 'Store in cool place away from moisture.'
      },
      {
        id: 'prd-dettol-250',
        name: 'Dettol Antiseptic Liquid',
        brand: 'Reckitt Benckiser',
        genericSaltName: 'Chloroxylenol (4.8% w/v)',
        categoryId: 'cat-antiseptic',
        categoryDomain: 'human',
        formulation: 'Liquid Disinfectant',
        strength: '4.8% w/v',
        packSize: '250 ml',
        manufacturer: 'Reckitt Benckiser India Pvt Ltd',
        mrp: 167.00,
        requiresPrescription: false,
        isOtcDirect: true,
        scheduleType: 'OTC',
        imageUrl: '/products/dettol.png',
        storageInstructions: 'Keep away from direct sunlight.'
      },
      {
        id: 'prd-minimalist-vitc',
        name: 'Minimalist 10% Vitamin C Brightening & Illumination Face Serum',
        brand: 'Minimalist',
        genericSaltName: 'Ethyl Ascorbic Acid (10%) + Centella Asiatica',
        categoryId: 'cat-skincare',
        categoryDomain: 'human',
        formulation: 'Face Serum',
        strength: '10%',
        packSize: '10 ml',
        manufacturer: 'Uprising Science Pvt Ltd',
        mrp: 299.00,
        requiresPrescription: false,
        isOtcDirect: true,
        scheduleType: 'OTC',
        imageUrl: '/products/minimalist-vitc.png',
        storageInstructions: 'Store in cool dark place.'
      },
      {
        id: 'prd-dotkey-sunscreen',
        name: 'Dot & Key Vitamin C + E Super Bright Sunscreen (SPF 50+ PA+++)',
        brand: 'Dot & Key',
        genericSaltName: 'Vitamin C, Vitamin E & UV Filters',
        categoryId: 'cat-skincare',
        categoryDomain: 'human',
        formulation: 'Fluid Sunscreen',
        strength: 'SPF 50+ PA+++',
        packSize: '30 g',
        manufacturer: 'Dot & Key Wellness',
        mrp: 299.00,
        requiresPrescription: false,
        isOtcDirect: true,
        scheduleType: 'OTC',
        imageUrl: '/products/dotkey-sunscreen.png',
        storageInstructions: 'Store below 30°C.'
      },
      {
        id: 'prd-boroplus-80',
        name: 'Boroplus Ayurvedic Antiseptic Cream',
        brand: 'Emami',
        genericSaltName: 'Neem, Tulsi, Aloe Vera & Turmeric Extracts',
        categoryId: 'cat-antiseptic',
        categoryDomain: 'human',
        formulation: 'Cream',
        strength: 'Ayurvedic Antiseptic',
        packSize: '80 ml',
        manufacturer: 'Emami Limited',
        mrp: 170.00,
        requiresPrescription: false,
        isOtcDirect: true,
        scheduleType: 'OTC',
        imageUrl: '/products/boroplus.png',
        storageInstructions: 'Store in cool and dry place.'
      }
    ];
    prods.forEach(p => this.products.set(p.id, {
      ...p,
      maxOrderQuantity: p.maxOrderQuantity ?? 10,
      isActiveInCatalogue: p.isActiveInCatalogue ?? true
    }));

    // 6. Inventory Mapping (Selling price strictly <= MRP)
    const invItems: PharmacyInventoryItem[] = [
      {
        id: 'inv-1',
        pharmacyId: 'pharm-gkp-1',
        productId: 'prd-dolo-650',
        availableQuantity: 150,
        reservedQuantity: 0,
        mrp: 34.00,
        sellingPrice: 30.50,
        isAvailableOverride: false,
        batches: [{ batchNumber: 'DL-24A91', mfgDate: '2024-03-01', expiryDate: '2027-02-28', quantity: 150 }]
      },
      {
        id: 'inv-2',
        pharmacyId: 'pharm-gkp-1',
        productId: 'prd-glycomet-500',
        availableQuantity: 80,
        reservedQuantity: 0,
        mrp: 52.00,
        sellingPrice: 46.80,
        isAvailableOverride: false,
        batches: [{ batchNumber: 'GLY-8490', mfgDate: '2024-06-15', expiryDate: '2026-11-30', quantity: 80 }]
      },
      {
        id: 'inv-3',
        pharmacyId: 'pharm-gkp-1',
        productId: 'prd-himcal-1l',
        availableQuantity: 30,
        reservedQuantity: 0,
        mrp: 240.00,
        sellingPrice: 216.00,
        isAvailableOverride: false,
        batches: [{ batchNumber: 'HC-202409', mfgDate: '2024-09-01', expiryDate: '2026-08-31', quantity: 30 }]
      },
      {
        id: 'inv-4',
        pharmacyId: 'pharm-gkp-1',
        productId: 'prd-drontal-dog',
        availableQuantity: 60,
        reservedQuantity: 0,
        mrp: 130.00,
        sellingPrice: 120.00,
        isAvailableOverride: false,
        batches: [{ batchNumber: 'DR-1934', mfgDate: '2024-04-01', expiryDate: '2027-03-31', quantity: 60 }]
      },
      {
        id: 'inv-5',
        pharmacyId: 'pharm-gkp-1',
        productId: 'prd-intacef-4g',
        availableQuantity: 25,
        reservedQuantity: 0,
        mrp: 485.00,
        sellingPrice: 436.50,
        isAvailableOverride: false,
        batches: [{ batchNumber: 'INT-9921', mfgDate: '2024-08-01', expiryDate: '2026-07-31', quantity: 25 }]
      },
      {
        id: 'inv-6',
        pharmacyId: 'pharm-gkp-1',
        productId: 'prd-betnovate-n',
        availableQuantity: 120,
        reservedQuantity: 0,
        mrp: 68.00,
        sellingPrice: 68.00,
        isAvailableOverride: false,
        batches: [{ batchNumber: 'BTN-0924', mfgDate: '2024-07-01', expiryDate: '2026-06-30', quantity: 120 }]
      },
      {
        id: 'inv-7',
        pharmacyId: 'pharm-gkp-1',
        productId: 'prd-boroline-20g',
        availableQuantity: 95,
        reservedQuantity: 0,
        mrp: 45.00,
        sellingPrice: 45.00,
        isAvailableOverride: false,
        batches: [{ batchNumber: 'BOR-4402', mfgDate: '2024-05-01', expiryDate: '2027-04-30', quantity: 95 }]
      },
      {
        id: 'inv-8',
        pharmacyId: 'pharm-gkp-1',
        productId: 'prd-hansaplast-20',
        availableQuantity: 200,
        reservedQuantity: 0,
        mrp: 60.00,
        sellingPrice: 60.00,
        isAvailableOverride: false,
        batches: [{ batchNumber: 'HAN-812', mfgDate: '2024-02-01', expiryDate: '2028-01-31', quantity: 200 }]
      },
      {
        id: 'inv-9',
        pharmacyId: 'pharm-gkp-1',
        productId: 'prd-dettol-250',
        availableQuantity: 110,
        reservedQuantity: 0,
        mrp: 167.00,
        sellingPrice: 167.00,
        isAvailableOverride: false,
        batches: [{ batchNumber: 'DET-102', mfgDate: '2024-08-01', expiryDate: '2027-07-31', quantity: 110 }]
      },
      {
        id: 'inv-10',
        pharmacyId: 'pharm-gkp-1',
        productId: 'prd-minimalist-vitc',
        availableQuantity: 45,
        reservedQuantity: 0,
        mrp: 299.00,
        sellingPrice: 270.00,
        isAvailableOverride: false,
        batches: [{ batchNumber: 'MIN-0091', mfgDate: '2024-09-01', expiryDate: '2026-08-31', quantity: 45 }]
      },
      {
        id: 'inv-11',
        pharmacyId: 'pharm-gkp-1',
        productId: 'prd-dotkey-sunscreen',
        availableQuantity: 50,
        reservedQuantity: 0,
        mrp: 299.00,
        sellingPrice: 264.00,
        isAvailableOverride: false,
        batches: [{ batchNumber: 'DOT-449', mfgDate: '2024-08-15', expiryDate: '2026-07-31', quantity: 50 }]
      },
      {
        id: 'inv-12',
        pharmacyId: 'pharm-gkp-1',
        productId: 'prd-boroplus-80',
        availableQuantity: 85,
        reservedQuantity: 0,
        mrp: 170.00,
        sellingPrice: 157.00,
        isAvailableOverride: false,
        batches: [{ batchNumber: 'BRP-771', mfgDate: '2024-06-01', expiryDate: '2027-05-31', quantity: 85 }]
      }
    ];
    invItems.forEach(i => this.inventory.set(i.id, i));

    // 7. Seed Verified Onboarding Application
    const seedApp: PharmacyOnboardingApplication = {
      id: 'app-gkp-1',
      pharmacyId: 'pharm-gkp-1',
      ownerUserId: 'usr-owner-1',
      businessName: 'Gorakhpur Medicos & Veterinary Care',
      legalEntityName: 'M/S Gorakhpur Healthcare & Animal Health LLP',
      gstin: '09AAACG1234F1Z5',
      addressLine1: 'Shop 14, Cinema Road, Golghar',
      city: 'Gorakhpur',
      pincode: '273001',
      latitude: 26.7598,
      longitude: 83.3725,
      operatingHours: { open: '08:00', close: '22:00' },
      deliveryRadiusM: 6000,
      authorisedRepresentativeName: 'Rajesh Gupta',
      authorisedRepresentativePhone: '+919876500002',
      licenceForm20: 'UP-GKP-20-847291',
      licenceForm21: 'UP-GKP-21-847292',
      licenceExpiryDate: '2027-12-31',
      licenceDocPath: '/vault/pharm-gkp-1/form20_licence.pdf',
      premisesDocPath: '/vault/pharm-gkp-1/premises_plan.pdf',
      idDocPath: '/vault/pharm-gkp-1/owner_id.pdf',
      pharmacistName: 'Sunil Kumar Sharma',
      pharmacistRegNumber: 'UP-PH-49210',
      pharmacistCouncil: 'Uttar Pradesh Pharmacy Council',
      pharmacistRegDocPath: '/vault/pharm-gkp-1/pharmacist_cert.pdf',
      bankAccountMasked: '••••••••4892',
      bankIfsc: 'SBIN0001234',
      status: 'verified',
      reviewerComments: 'Verified with Food Safety and Drug Administration UP records.',
      reviewedBy: 'usr-admin-1',
      reviewedAt: '2026-01-10T10:00:00.000Z',
      createdAt: '2026-01-01T10:00:00.000Z',
      updatedAt: '2026-01-10T10:00:00.000Z'
    };
    this.onboardingApplications.set(seedApp.id, seedApp);

    // Seed A4 Pharmacy Checklists
    this.pharmacyChecklists.set(seedApp.id, {
      id: 'chk-pharma-1',
      applicationId: seedApp.id,
      licenceValidityVerified: true,
      registrationVerified: true,
      physicalAddressVerified: true,
      authorisedPersonsVerified: true,
      pharmacistCredentialsVerified: true,
      verificationNotes: 'Verified via Food Safety and Drug Administration portal UP. Pharmacist registration active.',
      verifiedBy: 'usr-admin-1',
      updatedAt: '2026-01-10T10:00:00.000Z'
    });

    // Seed pending unverified pharmacy application for admin queue testing
    const pendingPharmaApp: PharmacyOnboardingApplication = {
      id: 'app-pharma-2',
      pharmacyId: 'pharm-gkp-2',
      ownerUserId: 'usr-owner-2',
      businessName: 'Purvanchal Pet & Human Pharma',
      legalEntityName: 'Purvanchal Health Services Pvt Ltd',
      gstin: '09AABCP9876C1Z1',
      addressLine1: 'Civil Lines, Near Park Road',
      city: 'Gorakhpur',
      pincode: '273009',
      latitude: 26.7490,
      longitude: 83.3850,
      operatingHours: { open: '09:00', close: '21:00' },
      deliveryRadiusM: 5000,
      authorisedRepresentativeName: 'Dr. Vivek Srivastava',
      authorisedRepresentativePhone: '+919876543210',
      licenceForm20: 'UP-GKP-20-992101',
      licenceForm21: 'UP-GKP-21-992102',
      licenceExpiryDate: '2027-06-30',
      licenceDocPath: '/vault/pharm-gkp-2/licence_docs.pdf',
      premisesDocPath: '/vault/pharm-gkp-2/premises_photos.pdf',
      idDocPath: '/vault/pharm-gkp-2/director_kyc.pdf',
      pharmacistName: 'Ravi Prakash Tiwari',
      pharmacistRegNumber: 'UP-PH-51204',
      pharmacistCouncil: 'Uttar Pradesh Pharmacy Council',
      pharmacistRegDocPath: '/vault/pharm-gkp-2/reg_certificate.pdf',
      bankAccountMasked: '••••••••9012',
      bankIfsc: 'HDFC0001234',
      status: 'submitted',
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 24).toISOString()
    };
    this.onboardingApplications.set(pendingPharmaApp.id, pendingPharmaApp);

    this.pharmacyChecklists.set(pendingPharmaApp.id, {
      id: 'chk-pharma-2',
      applicationId: pendingPharmaApp.id,
      licenceValidityVerified: false,
      registrationVerified: false,
      physicalAddressVerified: false,
      authorisedPersonsVerified: false,
      pharmacistCredentialsVerified: false,
      verificationNotes: '',
      updatedAt: new Date().toISOString()
    });

    // Seed A4 Pharmacy Commissions
    this.pharmacyCommissions.set('pharm-gkp-1', {
      pharmacyId: 'pharm-gkp-1',
      commissionRatePct: 8.50,
      fixedPlatformFeePaise: 1500,
      payoutCycle: 'WEEKLY',
      minPayoutThresholdPaise: 50000,
      bankAccountMasked: '••••••••4892',
      bankIfsc: 'SBIN0001234',
      upiIdMasked: 'rajesh.gupta@okaxis',
      beneficiaryName: 'M/S Gorakhpur Healthcare & Animal Health LLP',
      isActive: true,
      updatedBy: 'usr-admin-1',
      updatedAt: '2026-01-10T10:00:00.000Z'
    });

    // Seed A4 Pharmacy Compliance Exceptions
    this.pharmacyExceptions.set('exc-pharma-1', {
      id: 'exc-pharma-1',
      pharmacyId: 'pharm-gkp-1',
      pharmacyName: 'Gorakhpur Medicos & Veterinary Care',
      exceptionType: 'STOCK_MISMATCH',
      severity: 'LOW',
      description: 'Inventory physical count revealed 1 unit difference for Amoxicillin 500mg batch BX-9801. Batch adjusted in system.',
      reportedBy: 'usr-admin-1',
      resolutionNotes: 'Physical audit completed, pharmacist updated inventory reconciliation logs.',
      isResolved: true,
      resolvedBy: 'usr-admin-1',
      resolvedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
      createdAt: new Date(Date.now() - 3600000 * 72).toISOString()
    });

    // Seed A4 Rider Checklists
    this.riderChecklists.set('app-rider-1', {
      id: 'chk-rider-1',
      applicationId: 'app-rider-1',
      drivingLicenceVerified: true,
      vehicleRcVerified: true,
      identityVerified: true,
      backgroundCheckCleared: true,
      verificationNotes: 'Driving licence DL-UP53-202100492 valid till 2035. RC verified via Parivahan API.',
      verifiedBy: 'usr-admin-1',
      updatedAt: '2026-01-10T10:00:00.000Z'
    });

    // Seed pending unverified rider application for admin queue testing
    const pendingRiderApp: RiderOnboardingApplication = {
      id: 'app-rider-2',
      userId: 'usr-rider-2',
      fullName: 'Manoj Kumar Gupta',
      phone: '+919876500022',
      selfieDocPath: '/vault/riders/rider-2/selfie.jpg',
      govIdType: 'aadhaar',
      govIdNumber: '••••••••8819',
      govIdDocPath: '/vault/riders/rider-2/aadhaar.pdf',
      drivingLicenceNumber: 'UP53-2022009812',
      drivingLicenceDocPath: '/vault/riders/rider-2/dl.pdf',
      drivingLicenceExpiryDate: '2034-08-15',
      vehicleType: 'motorcycle',
      vehicleRegistrationNumber: 'UP 53 CP 9912',
      vehicleRcDocPath: '/vault/riders/rider-2/rc.pdf',
      emergencyContactName: 'Ramesh Gupta',
      emergencyContactPhone: '+919876500099',
      emergencyContactRelation: 'Brother',
      bankAccountMasked: '••••••••3102',
      bankIfsc: 'PUNB0001234',
      upiIdMasked: 'manoj.gupta@paytm',
      status: 'submitted',
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 12).toISOString()
    };
    this.riderApplications.set(pendingRiderApp.id, pendingRiderApp);

    this.riderChecklists.set(pendingRiderApp.id, {
      id: 'chk-rider-2',
      applicationId: pendingRiderApp.id,
      drivingLicenceVerified: false,
      vehicleRcVerified: false,
      identityVerified: false,
      backgroundCheckCleared: false,
      verificationNotes: '',
      updatedAt: new Date().toISOString()
    });

    // Seed A4 Rider Incident Reports
    this.riderIncidents.set('inc-rider-1', {
      id: 'inc-rider-1',
      riderId: 'rider-gkp-1',
      riderName: 'Vikas Yadav',
      incidentType: 'DELAYED_DELIVERY',
      severity: 'LOW',
      description: 'Railway crossing gate at Mohaddipur was closed for 18 minutes during peak freight transit. Customer informed.',
      reportedBy: 'usr-dispatch-1',
      status: 'RESOLVED',
      resolutionNotes: 'Order delivered with 12 min delay; customer offered zero delivery charge voucher.',
      resolvedBy: 'usr-dispatch-1',
      resolvedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
      createdAt: new Date(Date.now() - 3600000 * 22).toISOString()
    });

    // Seed A4 Rider Cash Deposits (COD Reconciliation)
    this.riderCashDeposits.set('dep-rider-1', {
      id: 'dep-rider-1',
      riderId: 'rider-gkp-1',
      riderName: 'Vikas Yadav',
      amountPaise: 250000, // ₹2,500
      depositMethod: 'UPI_TRANSFER',
      referenceNumber: 'UPI/2026/GKP/9948102',
      notes: 'Evening COD collection cash deposited via official QR',
      status: 'SUBMITTED',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
    });

    this.riderCashDeposits.set('dep-rider-2', {
      id: 'dep-rider-2',
      riderId: 'rider-gkp-1',
      riderName: 'Vikas Yadav',
      amountPaise: 400000, // ₹4,000
      depositMethod: 'BANK_DEPOSIT',
      referenceNumber: 'CHQ-SBI-491029',
      notes: 'Weekend COD collection cash deposited at Gorakhpur Hub Counter',
      status: 'CONFIRMED',
      confirmedBy: 'usr-admin-1',
      confirmedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
      createdAt: new Date(Date.now() - 3600000 * 50).toISOString()
    });

    // Seed A4 Rider Payout Batch
    this.riderPayoutBatches.set('payout-batch-1', {
      id: 'payout-batch-1',
      periodStart: '2026-01-01',
      periodEnd: '2026-01-07',
      totalRiders: 1,
      totalAmountPaise: 645000, // ₹6,450
      status: 'DRAFT',
      items: [
        {
          riderId: 'rider-gkp-1',
          riderName: 'Vikas Yadav',
          phone: '+919876500005',
          completedDeliveries: 43,
          basePayPaise: 430000,
          distanceBonusPaise: 155000,
          tipsPaise: 60000,
          codDeductionsPaise: 0,
          netPayoutPaise: 645000,
          bankAccountMasked: '••••••••7741',
          upiIdMasked: 'vikas.yadav@paytm'
        }
      ],
      createdBy: 'usr-admin-1',
      createdAt: '2026-01-08T10:00:00.000Z'
    });

    // Seed A5 Two-Person Approval Request (High-risk safety configuration)
    this.twoPersonApprovals.set('tpa-sample-1', {
      id: 'tpa-sample-1',
      actionType: 'OTC_DIRECT_TOGGLE',
      targetResourceId: 'prd-minimalist-vitc',
      targetResourceName: 'Minimalist 10% Vitamin C Face Serum',
      requestedBy: 'usr-admin-1',
      requestedByName: 'Dr. Ramesh Chandra (Pharmacovigilance)',
      requestedReason: 'Permit direct OTC quick-commerce checkout without prescription requirement; verified safe under Drugs & Cosmetics Rules non-scheduled cosmetic guidelines.',
      payload: { field: 'isOtcDirect', oldValue: false, newValue: true },
      status: 'pending',
      stepUpVerified: false,
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
    });

    // Seed A5 Batch Recall Directive
    this.productBatchRecalls.set('recall-notice-1', {
      id: 'recall-notice-1',
      productId: 'prd-dolo-650',
      productName: 'Dolo 650 Tablet',
      batchNumber: 'DL-24A91',
      manufacturerNoticeRef: 'MFR-MICRO-2025-RC04',
      recallClass: 'CLASS_2_DEFECT',
      reason: 'Packaging seal integrity defect flagged during routine transit quality testing in northern distribution line. No chemical active ingredient contamination.',
      issuedBy: 'usr-admin-1',
      issuedByName: 'Medcure Central Safety Desk',
      issuedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
      status: 'ACTIVE',
      affectedInventoryUnits: 150,
      affectedActiveOrdersCount: 0
    });

    // Seed A5 Catalogue Image Moderation submission
    this.catalogueImageModerations.set('img-mod-1', {
      id: 'img-mod-1',
      productId: 'prd-drontal-dog',
      productName: 'Drontal Plus Puppy Dewormer Tablet',
      submittedByPharmacyId: 'pharm-gkp-1',
      pharmacyName: 'Arogya Medical Store (Golghar)',
      imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80',
      submittedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      status: 'PENDING'
    });

    // Seed Multi-App Configurations (Milestone B1)
    const seedAppConfigs: AppConfigRecord[] = [
      {
        appId: 'com.medcure.customer',
        appName: 'Medcure Customer App',
        minSupportedVersion: '1.0.0',
        latestVersion: '1.0.0',
        forceUpdateTitle: 'Update Required',
        forceUpdateMessage: 'A critical update is required to continue ordering medicines.',
        storeUrlAndroid: 'https://play.google.com/store/apps/details?id=com.medcure.customer',
        storeUrlIos: 'https://apps.apple.com/app/id',
        allowedRoles: ['customer', 'platform_admin'],
        maintenanceMode: false
      },
      {
        appId: 'com.medcure.rider',
        appName: 'Medcure Delivery Partner App',
        minSupportedVersion: '1.0.0',
        latestVersion: '1.0.0',
        forceUpdateTitle: 'Fleet App Update Required',
        forceUpdateMessage: 'Please update your delivery partner app to receive order dispatches.',
        storeUrlAndroid: 'https://play.google.com/store/apps/details?id=com.medcure.rider',
        storeUrlIos: 'https://apps.apple.com/app/id',
        allowedRoles: ['rider', 'delivery_partner', 'platform_admin'],
        maintenanceMode: false
      },
      {
        appId: 'com.medcure.shop',
        appName: 'Medcure Pharmacy Partner App',
        minSupportedVersion: '1.0.0',
        latestVersion: '1.0.0',
        forceUpdateTitle: 'Counter Terminal Update Required',
        forceUpdateMessage: 'A critical compliance update is required for the pharmacy counter POS terminal.',
        storeUrlAndroid: 'https://play.google.com/store/apps/details?id=com.medcure.shop',
        storeUrlIos: 'https://apps.apple.com/app/id',
        allowedRoles: ['pharmacy_owner', 'pharmacist', 'pharmacy_staff', 'platform_admin'],
        maintenanceMode: false
      },
      {
        appId: 'in.medcure.merchant',
        appName: 'Medcure Pharmacy Partner App (Alt)',
        minSupportedVersion: '1.0.0',
        latestVersion: '1.0.0',
        forceUpdateTitle: 'Counter Terminal Update Required',
        forceUpdateMessage: 'A critical compliance update is required for the pharmacy counter POS terminal.',
        storeUrlAndroid: 'https://play.google.com/store/apps/details?id=in.medcure.merchant',
        storeUrlIos: 'https://apps.apple.com/app/id',
        allowedRoles: ['pharmacy_owner', 'pharmacist', 'pharmacy_staff', 'platform_admin'],
        maintenanceMode: false
      }
    ];
    seedAppConfigs.forEach(c => this.appConfigs.set(c.appId, c));
  }

  // Transactional stock reservation
  public reserveInventory(pharmacyId: string, items: { productId: string; quantity: number }[]): boolean {
    // Check all first
    for (const item of items) {
      const inv = Array.from(this.inventory.values()).find(
        i => i.pharmacyId === pharmacyId && i.productId === item.productId
      );
      if (!inv || inv.availableQuantity < item.quantity) {
        return false;
      }
    }
    // Reserve atomically
    for (const item of items) {
      const inv = Array.from(this.inventory.values()).find(
        i => i.pharmacyId === pharmacyId && i.productId === item.productId
      )!;
      inv.availableQuantity -= item.quantity;
      inv.reservedQuantity += item.quantity;
    }
    return true;
  }

  // Release reservation upon order rejection/cancellation
  public releaseReservation(pharmacyId: string, items: { productId: string; quantity: number }[]): void {
    for (const item of items) {
      const inv = Array.from(this.inventory.values()).find(
        i => i.pharmacyId === pharmacyId && i.productId === item.productId
      );
      if (inv) {
        inv.availableQuantity += item.quantity;
        inv.reservedQuantity = Math.max(0, inv.reservedQuantity - item.quantity);
      }
    }
  }

  // Rider Location Tracking
  public updateRiderLocation(snapshot: RiderLocationSnapshot): void {
    this.riderLocations.set(snapshot.orderId, snapshot);
  }

  public getRiderLocation(orderId: string): RiderLocationSnapshot | undefined {
    return this.riderLocations.get(orderId);
  }

  // COD Cash Management
  public recordCodCollection(orderId: string, riderId: string, amount: number): CodCollectionRecord {
    const record: CodCollectionRecord = {
      id: `cod-col-${Date.now()}`,
      orderId,
      riderId,
      amountCollected: amount,
      receiptNumber: `COD-GKP-${Math.floor(100000 + Math.random() * 900000)}`,
      collectedAt: new Date().toISOString()
    };
    this.codCollections.set(record.id, record);

    const rider = this.riders.get(riderId);
    if (rider) {
      rider.currentCashInHand += amount;
    }
    return record;
  }

  public recordCodSettlement(riderId: string, amount: number, depositReference: string, verifiedBy: string): CodSettlementRecord {
    const record: CodSettlementRecord = {
      id: `cod-set-${Date.now()}`,
      riderId,
      amountDeposited: amount,
      depositReference,
      verifiedBy,
      settledAt: new Date().toISOString()
    };
    this.codSettlements.set(record.id, record);

    const rider = this.riders.get(riderId);
    if (rider) {
      rider.currentCashInHand = Math.max(0, rider.currentCashInHand - amount);
    }
    return record;
  }

  public recordAudit(actorId: string | undefined, action: string, resourceType: string, resourceId: string, details: any) {
    this.auditEvents.push({
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      actorId,
      action,
      resourceType,
      resourceId,
      details,
      timestamp: new Date().toISOString()
    });
  }

  // Rider Device & Application Helpers
  public bindRiderDevice(userId: string, riderId: string, device: {
    deviceFingerprint: string;
    deviceModel: string;
    osVersion: string;
    appVersion: string;
    pushToken?: string;
  }): RiderDevice {
    // Check if device already exists for this user and fingerprint
    const existing = Array.from(this.riderDevices.values()).find(
      d => d.userId === userId && d.deviceFingerprint === device.deviceFingerprint
    );
    if (existing) {
      existing.isActive = true;
      existing.lastActiveAt = new Date().toISOString();
      if (device.pushToken) existing.pushToken = device.pushToken;
      return existing;
    }

    const newDevice: RiderDevice = {
      id: `dev-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      riderId,
      userId,
      deviceFingerprint: device.deviceFingerprint,
      deviceModel: device.deviceModel,
      osVersion: device.osVersion,
      appVersion: device.appVersion,
      pushToken: device.pushToken,
      isActive: true,
      lastActiveAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    this.riderDevices.set(newDevice.id, newDevice);
    return newDevice;
  }

  public getRiderDevices(userId: string): RiderDevice[] {
    return Array.from(this.riderDevices.values()).filter(d => d.userId === userId);
  }

  public revokeRiderDevice(deviceId: string): boolean {
    const dev = this.riderDevices.get(deviceId);
    if (dev) {
      dev.isActive = false;
      return true;
    }
    return false;
  }

  public submitRiderApplication(data: Omit<RiderOnboardingApplication, 'id' | 'status' | 'createdAt' | 'updatedAt'>): RiderOnboardingApplication {
    const existing = Array.from(this.riderApplications.values()).find(a => a.userId === data.userId);
    const id = existing ? existing.id : `app-rider-${Date.now()}`;
    const app: RiderOnboardingApplication = {
      ...data,
      id,
      status: 'submitted',
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.riderApplications.set(app.id, app);

    // Update rider profile approval status
    const rider = Array.from(this.riders.values()).find(r => r.userId === data.userId);
    if (rider) {
      rider.approvalStatus = 'submitted';
      rider.onboardingApplicationId = app.id;
    }
    return app;
  }

  public reviewRiderApplication(id: string, reviewerId: string, status: 'approved' | 'needs_changes' | 'suspended', comments?: string): RiderOnboardingApplication | undefined {
    const app = this.riderApplications.get(id);
    if (!app) return undefined;
    app.status = status;
    app.reviewedBy = reviewerId;
    app.reviewedAt = new Date().toISOString();
    if (comments) app.reviewerComments = comments;
    app.updatedAt = new Date().toISOString();

    const rider = Array.from(this.riders.values()).find(r => r.userId === app.userId);
    if (rider) {
      rider.approvalStatus = status;
      rider.isApproved = status === 'approved';
      if (comments) rider.reviewerComments = comments;
      if (status !== 'approved') {
        rider.isAvailable = false; // Auto turn off availability if not approved
      }
    }
    return app;
  }

  // ============================================================================
  // STAFF, STEP-UP, TWO-PERSON APPROVAL & BREAK-GLASS HELPERS
  // ============================================================================
  public getStaffByUserId(userId: string): StaffProfile | undefined {
    return Array.from(this.staffProfiles.values()).find(s => s.userId === userId);
  }

  public getStaffByEmail(email: string): StaffProfile | undefined {
    return Array.from(this.staffProfiles.values()).find(s => s.email.toLowerCase() === email.toLowerCase());
  }

  public verifyTotpStepUp(userId: string, code: string): boolean {
    if (code === '123456') {
      const staff = this.getStaffByUserId(userId);
      if (staff) {
        staff.lastStepUpAt = new Date().toISOString();
        staff.updatedAt = new Date().toISOString();
        this.recordAudit(userId, 'STEP_UP_AUTHENTICATION_SUCCESS', 'staff', staff.id, {
          timestamp: staff.lastStepUpAt
        });
        return true;
      }
    }
    return false;
  }

  public isStepUpValid(userId: string, maxAgeMs = 10 * 60 * 1000): boolean {
    const staff = this.getStaffByUserId(userId);
    if (!staff || !staff.lastStepUpAt) return false;
    const elapsed = Date.now() - new Date(staff.lastStepUpAt).getTime();
    return elapsed >= 0 && elapsed <= maxAgeMs;
  }

  public createStaffUser(adminUserId: string, data: {
    fullName: string;
    email: string;
    phone: string;
    role: StaffRole;
    reason: string;
  }): StaffProfile {
    const userId = `usr-staff-${Date.now()}`;
    const user: User = {
      id: userId,
      phone: data.phone,
      fullName: data.fullName,
      role: data.role === 'admin' ? 'platform_admin' : data.role,
      isActive: true
    };
    this.users.set(user.id, user);

    const staff: StaffProfile = {
      id: `staff-${Date.now()}`,
      userId: user.id,
      email: data.email,
      fullName: data.fullName,
      role: data.role,
      isActive: true,
      isTotpEnabled: true,
      lastStepUpAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.staffProfiles.set(staff.id, staff);

    this.recordAudit(adminUserId, 'STAFF_ACCOUNT_CREATED', 'staff', staff.id, {
      email: data.email,
      role: data.role,
      reason: data.reason
    });

    return staff;
  }

  public updateStaffRole(adminUserId: string, staffId: string, newRole: StaffRole, reason: string): StaffProfile | undefined {
    const staff = this.staffProfiles.get(staffId);
    if (!staff) return undefined;

    const oldRole = staff.role;
    staff.role = newRole;
    staff.updatedAt = new Date().toISOString();

    const user = this.users.get(staff.userId);
    if (user) {
      user.role = newRole === 'admin' ? 'platform_admin' : newRole;
    }

    this.recordAudit(adminUserId, 'STAFF_ROLE_CHANGED', 'staff', staff.id, {
      oldRole,
      newRole,
      reason
    });

    return staff;
  }

  public requestTwoPersonApproval(
    requestedBy: string,
    actionType: ApprovalActionType,
    targetResourceId: string,
    reason: string,
    payload: any
  ): TwoPersonApproval {
    const approval: TwoPersonApproval = {
      id: `apr-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      actionType,
      targetResourceId,
      requestedBy,
      requestedReason: reason,
      payload,
      status: 'pending',
      stepUpVerified: false,
      createdAt: new Date().toISOString()
    };
    this.twoPersonApprovals.set(approval.id, approval);

    this.recordAudit(requestedBy, 'TWO_PERSON_APPROVAL_REQUESTED', 'approval', approval.id, {
      actionType,
      targetResourceId,
      reason
    });

    return approval;
  }

  public decideTwoPersonApproval(
    approvalId: string,
    decidedBy: string,
    decision: 'approved' | 'rejected',
    reason: string
  ): { success: boolean; approval?: TwoPersonApproval; error?: string } {
    const approval = this.twoPersonApprovals.get(approvalId);
    if (!approval) return { success: false, error: 'Approval request not found.' };
    if (approval.status !== 'pending') {
      return { success: false, error: `Approval already resolved as ${approval.status}.` };
    }

    // STRICT TWO-PERSON APPROVAL RULE: Cannot approve own request!
    if (approval.requestedBy === decidedBy) {
      return {
        success: false,
        error: 'TWO_PERSON_VIOLATION: An administrator cannot approve their own high-risk configuration change request.'
      };
    }

    // Role check
    const deciderStaff = this.getStaffByUserId(decidedBy);
    if (!deciderStaff || deciderStaff.role !== 'admin') {
      return { success: false, error: 'FORBIDDEN: Only Platform Administrators may decide high-risk approvals.' };
    }

    // Step-up check
    if (!this.isStepUpValid(decidedBy)) {
      return { success: false, error: 'STEP_UP_REQUIRED: Re-authenticate with TOTP before approving high-risk change.' };
    }

    approval.status = decision;
    approval.approvedBy = decidedBy;
    approval.approvalReason = reason;
    approval.stepUpVerified = true;
    approval.resolvedAt = new Date().toISOString();

    this.recordAudit(decidedBy, `TWO_PERSON_APPROVAL_${decision.toUpperCase()}`, 'approval', approval.id, {
      actionType: approval.actionType,
      targetResourceId: approval.targetResourceId,
      reason,
      requestedBy: approval.requestedBy
    });

    if (decision === 'approved') {
      this.executeTwoPersonApprovalPayload(approval);
    }

    return { success: true, approval };
  }

  public createBreakGlassSession(
    staffUserId: string,
    resourceId: string,
    reason: string
  ): { success: boolean; session?: BreakGlassSession; error?: string } {
    const staff = this.getStaffByUserId(staffUserId);
    if (!staff || staff.role !== 'admin') {
      return {
        success: false,
        error: 'FORBIDDEN: Break-glass access to prescription files is strictly reserved for Platform Administrators.'
      };
    }

    if (!this.isStepUpValid(staffUserId)) {
      return {
        success: false,
        error: 'STEP_UP_REQUIRED: Re-authenticate with TOTP to initiate break-glass PHI access.'
      };
    }

    const session: BreakGlassSession = {
      id: `bg-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      staffUserId,
      resourceType: 'prescription',
      resourceId,
      statedReason: reason,
      totpStepUpVerified: true,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes window
      createdAt: new Date().toISOString()
    };
    this.breakGlassSessions.set(session.id, session);

    this.recordAudit(staffUserId, 'BREAK_GLASS_PRESCRIPTION_ACCESS', 'prescription', resourceId, {
      sessionId: session.id,
      statedReason: reason,
      expiresAt: session.expiresAt
    });

    return { success: true, session };
  }

  // ============================================================================
  // FEATURE FLAGS MANAGEMENT
  // ============================================================================
  public getFeatureFlags(clientTarget?: string): FeatureFlag[] {
    const all = Array.from(this.featureFlags.values());
    if (!clientTarget) return all;
    return all.filter(f => f.clientTargets.includes(clientTarget));
  }

  public toggleFeatureFlag(adminUserId: string, key: string, isEnabled: boolean, reason: string): FeatureFlag | undefined {
    const flag = this.featureFlags.get(key);
    if (!flag) return undefined;

    const previousState = flag.isEnabled;
    flag.isEnabled = isEnabled;
    flag.updatedBy = adminUserId;
    flag.updatedAt = new Date().toISOString();

    this.recordAudit(adminUserId, 'FEATURE_FLAG_TOGGLED', 'feature_flag', flag.key, {
      previousState,
      newState: isEnabled,
      reason
    });

    return flag;
  }

  // ============================================================================
  // MILESTONE A2: ADMIN OVERVIEW KPIS, LIVE OPERATIONS MAP & ALERTS
  // ============================================================================
  public getAdminKpis(role: StaffRole): AdminKpiMetrics {
    const ordersList = Array.from(this.orders.values());
    const paymentsList = Array.from(this.payments.values());

    const awaitingPharmacyReview = ordersList.filter(o => 
      o.status === 'placed' || o.status === 'pending_pharmacist_review'
    ).length;

    const beingFulfilled = ordersList.filter(o => 
      o.status === 'pharmacist_approved' || o.status === 'packing'
    ).length;

    const deliveriesInProgress = ordersList.filter(o => 
      o.status === 'rider_assigned' || o.status === 'out_for_delivery'
    ).length;

    const failedAndCancelled = ordersList.filter(o => 
      o.status === 'cancelled' || o.status === 'failed'
    ).length;

    const totalOrders = ordersList.length;

    // Financial calculations
    const capturedRevenue = paymentsList
      .filter(p => p.status === 'captured')
      .reduce((sum, p) => sum + Math.round(p.amount * 100), 0);

    const refundedAmount = paymentsList
      .filter(p => p.status === 'refunded')
      .reduce((sum, p) => sum + Math.round(p.amount * 100), 0);

    const codOutstanding = Array.from(this.riders.values())
      .reduce((sum, r) => sum + Math.round((r.currentCashInHand || 0) * 100), 0);

    // Support Operators only have access to operational and ticket metrics, not financial revenue totals
    const isSupport = role === 'support_operator';

    return {
      ordersToday: totalOrders,
      awaitingPharmacyReview,
      beingFulfilled,
      deliveriesInProgress,
      failedAndCancelled,
      revenuePaise: isSupport ? 0 : capturedRevenue,
      refundsPaise: isSupport ? 0 : refundedAmount,
      codCashOutstandingPaise: isSupport ? 0 : codOutstanding
    };
  }

  public getLiveOperationsMap(filters?: { pharmacyId?: string; status?: string }): {
    pharmacies: LiveMapPharmacy[];
    riders: LiveMapRider[];
    activeDeliveries: LiveMapDelivery[];
  } {
    // 1. Pharmacies
    const pharmacies: LiveMapPharmacy[] = Array.from(this.pharmacies.values()).map(p => {
      const pendingCount = Array.from(this.orders.values()).filter(o => 
        o.pharmacyId === p.id && (o.status === 'placed' || o.status === 'pending_pharmacist_review' || o.status === 'packing')
      ).length;

      return {
        id: p.id,
        name: p.businessName,
        address: p.addressLine1,
        latitude: p.latitude,
        longitude: p.longitude,
        isActive: p.isActive,
        pendingOrdersCount: pendingCount
      };
    });

    // 2. Riders
    const riders: LiveMapRider[] = Array.from(this.riders.values()).map(r => {
      const user = this.users.get(r.userId);
      const loc = this.riderLocations.get(r.id);

      return {
        id: r.id,
        name: user?.name || 'Field Partner',
        phone: user?.phone || '+919876500000',
        latitude: loc?.latitude || 26.7606,
        longitude: loc?.longitude || 83.3732,
        isAvailable: r.isAvailable,
        currentLoad: Array.from(this.orders.values()).filter(o => o.riderId === r.id && (o.status === 'rider_assigned' || o.status === 'out_for_delivery')).length,
        cashInHandPaise: Math.round((r.currentCashInHand || 0) * 100),
        lastSeenSecondsAgo: loc ? Math.floor((Date.now() - new Date(loc.recordedAt).getTime()) / 1000) : 15,
        heading: loc?.heading
      };
    });

    // 3. Active Deliveries
    let deliveries: LiveMapDelivery[] = Array.from(this.orders.values())
      .filter(o => ['placed', 'pending_pharmacist_review', 'pharmacist_approved', 'packing', 'rider_assigned', 'out_for_delivery'].includes(o.status))
      .map(o => {
        const pharm = this.pharmacies.get(o.pharmacyId || 'pharm-gkp-1') || Array.from(this.pharmacies.values())[0];
        const rider = o.riderId ? this.riders.get(o.riderId) : undefined;
        const riderUser = rider ? this.users.get(rider.userId) : undefined;

        return {
          orderId: o.id,
          status: o.status,
          pharmacyId: pharm?.id || 'pharm-gkp-1',
          pharmacyName: pharm?.businessName || 'City Central Pharmacy',
          pharmacyLat: pharm?.latitude || 26.7606,
          pharmacyLng: pharm?.longitude || 83.3732,
          dropAddress: o.deliveryAddress?.addressLine1 || 'Gorakhpur Customer Address',
          dropLat: o.deliveryAddress?.latitude || 26.7580,
          dropLng: o.deliveryAddress?.longitude || 83.3700,
          riderId: o.riderId,
          riderName: riderUser?.name,
          etaMinutes: o.status === 'out_for_delivery' ? 12 : 22,
          isCod: o.paymentMethod === 'cod',
          codAmountPaise: o.paymentMethod === 'cod' ? Math.round(o.payableAmount * 100) : undefined
        };
      });

    if (filters?.pharmacyId) {
      deliveries = deliveries.filter(d => d.pharmacyId === filters.pharmacyId);
    }
    if (filters?.status) {
      deliveries = deliveries.filter(d => d.status === filters.status);
    }

    return { pharmacies, riders, activeDeliveries: deliveries };
  }

  public getOperationalAlerts(role: StaffRole, unreadOnly: boolean = false): OperationalAlert[] {
    let alerts = Array.from(this.operationalAlerts.values());

    if (unreadOnly) {
      alerts = alerts.filter(a => !a.isResolved);
    }

    // Role-based visibility scoping
    if (role === 'support_operator') {
      // Support operator only sees tickets and order delivery alerts
      alerts = alerts.filter(a => a.entityType === 'ticket' || a.entityType === 'order');
    } else if (role === 'dispatcher') {
      // Dispatcher sees delivery, rider, pharmacy responsiveness, and tickets
      alerts = alerts.filter(a => a.entityType === 'order' || a.entityType === 'rider' || a.entityType === 'pharmacy' || a.entityType === 'ticket');
    }

    // Sort: unresolved first, then critical severity first, then newest
    return alerts.sort((a, b) => {
      if (a.isResolved !== b.isResolved) return a.isResolved ? 1 : -1;
      const sevOrder: Record<string, number> = { critical: 0, warning: 1, info: 2 };
      const sevDiff = (sevOrder[a.severity] ?? 3) - (sevOrder[b.severity] ?? 3);
      if (sevDiff !== 0) return sevDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  public addOperationalAlert(data: Omit<OperationalAlert, 'id' | 'createdAt' | 'updatedAt' | 'isResolved'>): OperationalAlert {
    const alert: OperationalAlert = {
      id: `alt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...data,
      isResolved: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.operationalAlerts.set(alert.id, alert);
    return alert;
  }

  public acknowledgeAlert(staffUserId: string, alertId: string, notes: string): OperationalAlert | undefined {
    const alert = this.operationalAlerts.get(alertId);
    if (!alert) return undefined;

    alert.isResolved = true;
    alert.resolvedBy = staffUserId;
    alert.resolvedAt = new Date().toISOString();
    alert.resolutionNotes = notes;
    alert.updatedAt = new Date().toISOString();

    this.recordAudit(staffUserId, 'OPERATIONAL_ALERT_ACKNOWLEDGED', 'alert', alert.id, {
      alertType: alert.alertType,
      severity: alert.severity,
      entityId: alert.entityId,
      notes
    });

    return alert;
  }

  // ============================================================================
  // MILESTONE A3: DISPATCHER CONSOLE & RIDER ASSIGNMENT HELPERS
  // ============================================================================
  public getAssignmentSettings(zoneId: string = 'zone-gkp-central'): AssignmentSettings {
    const existing = this.assignmentSettings.get(zoneId);
    if (existing) return existing;

    const fallback: AssignmentSettings = {
      id: `set-${zoneId}`,
      zoneId,
      zoneName: 'Gorakhpur Central Urban Zone',
      mode: 'AUTO_WITH_MANUAL_FALLBACK',
      killSwitchEnabled: false,
      triggerPoint: 'on_packing',
      searchRadiusKm: 3.0,
      offerTimeoutSeconds: 45,
      maxEscalationOffers: 3,
      escalationTimeLimitSeconds: 180,
      maxConcurrentOrders: 1,
      maxCodCashPaise: 500000,
      radiusExpansionStepKm: 1.0,
      maxExpandedRadiusKm: 5.0,
      scoringWeights: {
        eta: 0.35,
        load: 0.20,
        idle: 0.15,
        acceptance: 0.15,
        rating: 0.15
      },
      updatedAt: new Date().toISOString()
    };
    this.assignmentSettings.set(zoneId, fallback);
    return fallback;
  }

  public updateAssignmentSettings(zoneId: string, updates: Partial<AssignmentSettings>, staffUserId?: string): AssignmentSettings {
    const current = this.getAssignmentSettings(zoneId);
    const updated: AssignmentSettings = {
      ...current,
      ...updates,
      scoringWeights: updates.scoringWeights ? { ...current.scoringWeights, ...updates.scoringWeights } : current.scoringWeights,
      updatedBy: staffUserId,
      updatedAt: new Date().toISOString()
    };
    this.assignmentSettings.set(zoneId, updated);

    if (staffUserId) {
      this.recordAudit(staffUserId, 'ASSIGNMENT_SETTINGS_UPDATED', 'assignment_settings', zoneId, {
        previousMode: current.mode,
        newMode: updated.mode,
        killSwitch: updated.killSwitchEnabled,
        updates
      });
    }

    return updated;
  }

  public getOrderOffers(orderId: string): RiderOffer[] {
    return Array.from(this.riderOffers.values())
      .filter(o => o.orderId === orderId)
      .sort((a, b) => new Date(b.offeredAt).getTime() - new Date(a.offeredAt).getTime());
  }

  public isAutoAssignmentPaused(orderId: string): boolean {
    return this.pausedAutoAssignmentOrders.has(orderId);
  }

  public toggleAutoAssignmentPause(orderId: string, paused?: boolean, staffUserId?: string, reason?: string): boolean {
    const shouldPause = paused !== undefined ? paused : !this.pausedAutoAssignmentOrders.has(orderId);
    if (shouldPause) {
      this.pausedAutoAssignmentOrders.add(orderId);
    } else {
      this.pausedAutoAssignmentOrders.delete(orderId);
    }

    if (staffUserId) {
      this.addDispatcherIntervention({
        orderId,
        staffUserId,
        interventionType: 'PAUSE_AUTO',
        targetEntity: `order:${orderId}`,
        notes: `${shouldPause ? 'Paused' : 'Resumed'} automatic assignment. ${reason ? `Reason: ${reason}` : ''}`
      });
    }

    return shouldPause;
  }

  public addDispatcherIntervention(data: Omit<DispatcherIntervention, 'id' | 'createdAt'>): DispatcherIntervention {
    const intervention: DispatcherIntervention = {
      id: `int-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...data,
      createdAt: new Date().toISOString()
    };
    this.dispatcherInterventions.set(intervention.id, intervention);
    return intervention;
  }

  public getDispatcherInterventions(orderId: string): DispatcherIntervention[] {
    return Array.from(this.dispatcherInterventions.values())
      .filter(i => i.orderId === orderId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Dispatcher Queue: Orders that need rider assignment or attention.
   * STRICT COMPLIANCE: Does not expose prescription files or medicine names to dispatchers.
   */
  public getDispatchQueue(filters?: { status?: string; search?: string }): DispatchQueueOrder[] {
    const ordersList = Array.from(this.orders.values());
    const now = Date.now();

    // Orders needing rider or in delivery states
    let relevantOrders = ordersList.filter(o => {
      const st = o.state;
      return st === 'PACKED' || st === 'PACKING' || st === 'RIDER_ASSIGNED' || st === 'PICKED_UP' || st === 'OUT_FOR_DELIVERY' || st === 'DELIVERY_FAILED';
    });

    if (filters?.status) {
      relevantOrders = relevantOrders.filter(o => o.state === filters.status);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      relevantOrders = relevantOrders.filter(o => 
        o.orderCode.toLowerCase().includes(q) ||
        (o.deliveryAddress?.city && o.deliveryAddress.city.toLowerCase().includes(q)) ||
        (o.deliveryAddress?.addressLine1 && o.deliveryAddress.addressLine1.toLowerCase().includes(q))
      );
    }

    return relevantOrders.map(o => {
      const pharm = this.pharmacies.get(o.pharmacyId) || Array.from(this.pharmacies.values())[0];
      const offers = this.getOrderOffers(o.id);
      const activeOffer = offers.find(off => off.status === 'offered');
      const assignedRider = o.riderId ? this.riderPresence.get(o.riderId) : undefined;
      const orderAgeMinutes = Math.floor((now - new Date(o.createdAt).getTime()) / 60000);

      let currentOfferData: DispatchQueueOrder['currentOffer'] = undefined;
      if (activeOffer) {
        const remaining = Math.max(0, Math.floor((new Date(activeOffer.expiresAt).getTime() - now) / 1000));
        currentOfferData = {
          offerId: activeOffer.id,
          riderId: activeOffer.riderId,
          riderName: activeOffer.riderName,
          expiresAt: activeOffer.expiresAt,
          secondsRemaining: remaining
        };
      }

      return {
        id: o.id,
        orderCode: o.orderCode,
        pharmacyId: pharm.id,
        pharmacyName: pharm.businessName,
        pharmacyAddress: pharm.addressLine1,
        pharmacyLat: pharm.latitude,
        pharmacyLng: pharm.longitude,
        dropArea: o.deliveryAddress?.landmark || o.deliveryAddress?.addressLine2 || 'Gorakhpur Central',
        dropAddress: o.deliveryAddress?.addressLine1 || 'Customer Delivery Address',
        dropLat: o.deliveryAddress?.latitude || 26.7606,
        dropLng: o.deliveryAddress?.longitude || 83.3732,
        packageCount: o.items?.reduce((sum, it) => sum + (it.quantity || 1), 0) || 1,
        paymentMode: o.paymentMode,
        codAmountPaise: o.paymentMode === 'COD' ? (o.payableAmountPaise || Math.round(o.payableAmount * 100)) : undefined,
        state: o.state,
        ageMinutes: orderAgeMinutes,
        escalationCount: offers.filter(off => off.status === 'declined' || off.status === 'expired').length,
        autoAssignmentPaused: this.isAutoAssignmentPaused(o.id),
        assignedRiderId: o.riderId,
        assignedRiderName: assignedRider?.fullName,
        currentOffer: currentOfferData
      };
    }).sort((a, b) => {
      // Prioritize unassigned/packed orders and older orders
      if (a.state === 'PACKED' && b.state !== 'PACKED') return -1;
      if (b.state === 'PACKED' && a.state !== 'PACKED') return 1;
      return b.ageMinutes - a.ageMinutes;
    });
  }

  /**
   * Rider list with distance to given pharmacy, current load, cash-in-hand, rating
   */
  public getDispatchRiders(pharmacyLat: number = 26.7598, pharmacyLng: number = 83.3725): Array<RiderPresence & { distanceKm: number; etaMinutes: number }> {
    const riders = Array.from(this.riderPresence.values());

    return riders.map(r => {
      // Haversine distance
      const R = 6371;
      const dLat = (pharmacyLat - r.currentLatitude) * Math.PI / 180;
      const dLon = (pharmacyLng - r.currentLongitude) * Math.PI / 180;
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(r.currentLatitude * Math.PI / 180) * Math.cos(pharmacyLat * Math.PI / 180) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distanceKm = Number((R * c).toFixed(2));
      const etaMinutes = Math.max(2, Math.ceil((distanceKm / 20) * 60) + 2);

      return {
        ...r,
        distanceKm,
        etaMinutes
      };
    }).sort((a, b) => {
      // Online first, then closer first
      if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
      return a.distanceKm - b.distanceKm;
    });
  }

  /**
   * Assignment metrics: time to assign, offer acceptance rate, escalations, no rider
   */
  public getDispatchMetrics(): {
    avgTimeToAssignSeconds: number;
    offerAcceptanceRate: number;
    escalationsToManualCount: number;
    ordersWithNoRiderAvailableCount: number;
  } {
    const allOffers = Array.from(this.riderOffers.values());
    const totalOffers = allOffers.length;
    const acceptedOffers = allOffers.filter(o => o.status === 'accepted').length;
    const offerAcceptanceRate = totalOffers > 0 ? Number((acceptedOffers / totalOffers).toFixed(2)) : 0.88;

    const allDecisions = Array.from(this.assignmentDecisions.values());
    const escalationsToManualCount = allDecisions.filter(d => d.outcome === 'ESCALATED').length;
    const ordersWithNoRiderAvailableCount = allDecisions.filter(d => d.outcome === 'NO_CANDIDATES').length;

    return {
      avgTimeToAssignSeconds: 54, // average 54 seconds
      offerAcceptanceRate,
      escalationsToManualCount,
      ordersWithNoRiderAvailableCount
    };
  }

  // ============================================================================
  // MILESTONE A4: PHARMACY AND RIDER MANAGEMENT METHODS
  // ============================================================================
  public getPharmacyChecklist(applicationId: string): PharmacyVerificationChecklist | undefined {
    return this.pharmacyChecklists.get(applicationId);
  }

  public updatePharmacyChecklist(applicationId: string, checklist: Partial<PharmacyVerificationChecklist>, verifiedBy: string): PharmacyVerificationChecklist {
    const existing = this.pharmacyChecklists.get(applicationId) || {
      id: `chk-${Date.now()}`,
      applicationId,
      licenceValidityVerified: false,
      registrationVerified: false,
      physicalAddressVerified: false,
      authorisedPersonsVerified: false,
      pharmacistCredentialsVerified: false,
      updatedAt: new Date().toISOString()
    };
    const updated: PharmacyVerificationChecklist = {
      ...existing,
      ...checklist,
      verifiedBy,
      updatedAt: new Date().toISOString()
    };
    this.pharmacyChecklists.set(applicationId, updated);
    return updated;
  }

  public reviewPharmacyApplication(
    applicationId: string, 
    decision: 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT', 
    reason: string, 
    reviewerId: string
  ): { success: boolean; message: string; status: string } {
    const app = this.onboardingApplications.get(applicationId);
    if (!app) {
      return { success: false, message: 'Pharmacy application not found', status: 'unknown' };
    }

    if (decision === 'APPROVE') {
      const checklist = this.pharmacyChecklists.get(applicationId);
      if (!checklist || !checklist.licenceValidityVerified || !checklist.registrationVerified || !checklist.physicalAddressVerified || !checklist.authorisedPersonsVerified || !checklist.pharmacistCredentialsVerified) {
        return { 
          success: false, 
          message: 'Cannot approve application: All 5 statutory verification checklist items must be verified before approval.', 
          status: app.status 
        };
      }
      app.status = 'verified';
      app.reviewedBy = reviewerId;
      app.reviewedAt = new Date().toISOString();
      app.reviewerComments = reason;
      app.updatedAt = new Date().toISOString();

      const pharmacyId = app.pharmacyId || `pharm-${Date.now()}`;
      app.pharmacyId = pharmacyId;
      const existingPharma = this.pharmacies.get(pharmacyId);
      if (existingPharma) {
        existingPharma.isActive = true;
        existingPharma.isVerified = true;
        existingPharma.licenceNumber = app.licenceForm20;
      } else {
        this.pharmacies.set(pharmacyId, {
          id: pharmacyId,
          businessName: app.businessName,
          legalEntityName: app.legalEntityName,
          contactPhone: app.authorisedRepresentativePhone,
          addressLine1: app.addressLine1,
          city: app.city,
          pincode: app.pincode,
          latitude: app.latitude,
          longitude: app.longitude,
          isActive: true,
          isVerified: true,
          operatingHours: app.operatingHours || { open: '08:00', close: '22:00' },
          licenceNumber: app.licenceForm20
        });
      }

      if (!this.pharmacyCommissions.has(pharmacyId)) {
        this.pharmacyCommissions.set(pharmacyId, {
          pharmacyId,
          commissionRatePct: 8.50,
          fixedPlatformFeePaise: 1500,
          payoutCycle: 'WEEKLY',
          minPayoutThresholdPaise: 50000,
          bankAccountMasked: app.bankAccountMasked,
          bankIfsc: app.bankIfsc,
          beneficiaryName: app.legalEntityName,
          isActive: true,
          updatedBy: reviewerId,
          updatedAt: new Date().toISOString()
        });
      }

      this.auditEvents.push({
        id: `aud-${Date.now()}`,
        actorId: reviewerId,
        action: 'PHARMACY_APPLICATION_APPROVED',
        resourceType: 'pharmacy_onboarding_application',
        resourceId: applicationId,
        details: { reason, pharmacyId, businessName: app.businessName },
        timestamp: new Date().toISOString()
      });

      return { success: true, message: `Application for ${app.businessName} approved and pharmacy activated.`, status: 'verified' };
    }

    if (decision === 'REQUEST_CHANGES') {
      app.status = 'needs_changes';
      app.reviewedBy = reviewerId;
      app.reviewedAt = new Date().toISOString();
      app.reviewerComments = reason;
      app.updatedAt = new Date().toISOString();

      this.auditEvents.push({
        id: `aud-${Date.now()}`,
        actorId: reviewerId,
        action: 'PHARMACY_APPLICATION_CHANGES_REQUESTED',
        resourceType: 'pharmacy_onboarding_application',
        resourceId: applicationId,
        details: { reason },
        timestamp: new Date().toISOString()
      });

      return { success: true, message: `Requested changes from ${app.businessName}. Reason: ${reason}`, status: 'needs_changes' };
    }

    // REJECT
    app.status = 'needs_changes';
    app.reviewedBy = reviewerId;
    app.reviewedAt = new Date().toISOString();
    app.reviewerComments = `REJECTED: ${reason}`;
    app.updatedAt = new Date().toISOString();

    if (app.pharmacyId && this.pharmacies.has(app.pharmacyId)) {
      const p = this.pharmacies.get(app.pharmacyId)!;
      p.isActive = false;
    }

    this.auditEvents.push({
      id: `aud-${Date.now()}`,
      actorId: reviewerId,
      action: 'PHARMACY_APPLICATION_REJECTED',
      resourceType: 'pharmacy_onboarding_application',
      resourceId: applicationId,
      details: { reason },
      timestamp: new Date().toISOString()
    });

    return { success: true, message: `Rejected application for ${app.businessName}.`, status: 'rejected' };
  }

  public setPharmacyLifecycle(
    pharmacyId: string, 
    action: 'ACTIVATE' | 'SUSPEND' | 'REINSTATE', 
    reason: string, 
    adminId: string
  ): { success: boolean; pharmacy: Pharmacy; affectedOrders: number } {
    const pharma = this.pharmacies.get(pharmacyId);
    if (!pharma) {
      throw new Error(`Pharmacy ${pharmacyId} not found`);
    }

    let affectedOrders = 0;
    if (action === 'SUSPEND') {
      pharma.isActive = false;
      for (const order of this.orders.values()) {
        if (order.pharmacyId === pharmacyId && (order.state === 'CREATED' || order.state === 'PHARMACY_REVIEW')) {
          order.state = 'CANCELLED';
          affectedOrders++;
        }
      }
    } else {
      pharma.isActive = true;
      pharma.isVerified = true;
    }

    this.auditEvents.push({
      id: `aud-${Date.now()}`,
      actorId: adminId,
      action: `PHARMACY_${action}`,
      resourceType: 'pharmacy',
      resourceId: pharmacyId,
      details: { reason, affectedOrders, previousActive: !pharma.isActive },
      timestamp: new Date().toISOString()
    });

    return { success: true, pharmacy: pharma, affectedOrders };
  }

  public checkAndEnforceLicenceExpiries(): { expiredCount: number; warningCount: number; details: any[] } {
    const today = new Date().toISOString().split('T')[0];
    let expiredCount = 0;
    let warningCount = 0;
    const details: any[] = [];

    for (const app of this.onboardingApplications.values()) {
      if (!app.pharmacyId || !this.pharmacies.has(app.pharmacyId)) continue;
      const pharma = this.pharmacies.get(app.pharmacyId)!;
      const expiry = app.licenceExpiryDate;
      const daysRemaining = Math.ceil((new Date(expiry).getTime() - new Date(today).getTime()) / (1000 * 3600 * 24));

      if (daysRemaining <= 0) {
        if (pharma.isActive) {
          pharma.isActive = false;
          expiredCount++;
          const alertId = `alt-lic-exp-${app.pharmacyId}`;
          if (!this.operationalAlerts.has(alertId)) {
            this.operationalAlerts.set(alertId, {
              id: alertId,
              alertType: 'LICENCE_EXPIRING',
              severity: 'critical',
              title: `Statutory Drug Licence Expired: ${pharma.businessName}`,
              description: `Drug Sale Licence Form 20 expired on ${expiry}. Pharmacy has been automatically hidden from catalogue & routing.`,
              entityType: 'pharmacy',
              entityId: pharma.id,
              isResolved: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          }
        }
        details.push({ pharmacyId: pharma.id, name: pharma.businessName, daysRemaining, status: 'EXPIRED' });
      } else if (daysRemaining <= 30) {
        warningCount++;
        details.push({ pharmacyId: pharma.id, name: pharma.businessName, daysRemaining, status: daysRemaining <= 7 ? 'EXPIRING_CRITICAL' : 'EXPIRING_SOON' });
      } else {
        details.push({ pharmacyId: pharma.id, name: pharma.businessName, daysRemaining, status: 'VALID' });
      }
    }
    return { expiredCount, warningCount, details };
  }

  public getPharmacyLicenceTracker(): Array<{ 
    pharmacyId: string; 
    businessName: string; 
    licenceNumber: string; 
    licenceExpiryDate: string; 
    daysRemaining: number; 
    status: 'VALID' | 'EXPIRING_SOON' | 'EXPIRING_CRITICAL' | 'EXPIRED'; 
    isActive: boolean;
  }> {
    const today = new Date().toISOString().split('T')[0];
    const results: any[] = [];
    for (const app of this.onboardingApplications.values()) {
      if (!app.pharmacyId) continue;
      const pharma = this.pharmacies.get(app.pharmacyId);
      const name = pharma ? pharma.businessName : app.businessName;
      const expiry = app.licenceExpiryDate || '2027-12-31';
      const daysRemaining = Math.ceil((new Date(expiry).getTime() - new Date(today).getTime()) / (1000 * 3600 * 24));
      
      let status: 'VALID' | 'EXPIRING_SOON' | 'EXPIRING_CRITICAL' | 'EXPIRED' = 'VALID';
      if (daysRemaining <= 0) status = 'EXPIRED';
      else if (daysRemaining <= 7) status = 'EXPIRING_CRITICAL';
      else if (daysRemaining <= 30) status = 'EXPIRING_SOON';

      results.push({
        pharmacyId: app.pharmacyId,
        businessName: name,
        licenceNumber: app.licenceForm20,
        licenceExpiryDate: expiry,
        daysRemaining,
        status,
        isActive: pharma ? pharma.isActive : false
      });
    }
    return results;
  }

  public getPharmacyCommission(pharmacyId: string): PharmacyCommissionSettings {
    const existing = this.pharmacyCommissions.get(pharmacyId);
    if (existing) return existing;
    const defaultSettings: PharmacyCommissionSettings = {
      pharmacyId,
      commissionRatePct: 8.50,
      fixedPlatformFeePaise: 1500,
      payoutCycle: 'WEEKLY',
      minPayoutThresholdPaise: 50000,
      isActive: true,
      updatedAt: new Date().toISOString()
    };
    this.pharmacyCommissions.set(pharmacyId, defaultSettings);
    return defaultSettings;
  }

  public updatePharmacyCommission(pharmacyId: string, settings: Partial<PharmacyCommissionSettings>, adminId: string): PharmacyCommissionSettings {
    const existing = this.getPharmacyCommission(pharmacyId);
    const updated: PharmacyCommissionSettings = {
      ...existing,
      ...settings,
      updatedBy: adminId,
      updatedAt: new Date().toISOString()
    };
    this.pharmacyCommissions.set(pharmacyId, updated);
    this.auditEvents.push({
      id: `aud-${Date.now()}`,
      actorId: adminId,
      action: 'PHARMACY_COMMISSION_UPDATED',
      resourceType: 'pharmacy_commission_settings',
      resourceId: pharmacyId,
      details: { previous: existing, updated },
      timestamp: new Date().toISOString()
    });
    return updated;
  }

  public getPharmacyScorecard(pharmacyId: string): PharmacyScorecard {
    const pharma = this.pharmacies.get(pharmacyId);
    const name = pharma ? pharma.businessName : 'Pharmacy';
    const app = Array.from(this.onboardingApplications.values()).find(a => a.pharmacyId === pharmacyId);
    const expiry = app ? app.licenceExpiryDate : '2027-12-31';
    const today = new Date().toISOString().split('T')[0];
    const daysToExpiry = Math.ceil((new Date(expiry).getTime() - new Date(today).getTime()) / (1000 * 3600 * 24));
    let activeLicenceStatus: 'VALID' | 'EXPIRING_SOON' | 'EXPIRING_CRITICAL' | 'EXPIRED' = 'VALID';
    if (daysToExpiry <= 0) activeLicenceStatus = 'EXPIRED';
    else if (daysToExpiry <= 7) activeLicenceStatus = 'EXPIRING_CRITICAL';
    else if (daysToExpiry <= 30) activeLicenceStatus = 'EXPIRING_SOON';

    return {
      pharmacyId,
      businessName: name,
      acceptanceRate: 97.2,
      avgAcceptMinutes: 1.4,
      avgPackMinutes: 3.8,
      rejectionReasons: [
        { reason: 'Out of Stock Batch', count: 2 },
        { reason: 'Clarification Needed on Strength', count: 1 }
      ],
      stockAccuracyRate: 99.4,
      complaintsCount: 0,
      activeLicenceStatus,
      licenceExpiryDate: expiry,
      daysToExpiry
    };
  }

  public getPharmacyStaffList(pharmacyId: string): Array<{ id: string; fullName: string; phone: string; role: string; isActive: boolean }> {
    return Array.from(this.users.values())
      .filter(u => ['pharmacy_owner', 'pharmacist', 'pharmacy_staff'].includes(u.role))
      .map(u => ({
        id: u.id,
        fullName: u.fullName,
        phone: u.phone,
        role: u.role,
        isActive: u.isActive
      }));
  }

  public getPharmacyComplianceExceptions(pharmacyId?: string): PharmacyComplianceException[] {
    const all = Array.from(this.pharmacyExceptions.values());
    if (pharmacyId) return all.filter(e => e.pharmacyId === pharmacyId);
    return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public createPharmacyComplianceException(data: Omit<PharmacyComplianceException, 'id' | 'createdAt' | 'isResolved'>): PharmacyComplianceException {
    const exception: PharmacyComplianceException = {
      ...data,
      id: `exc-${Date.now()}`,
      isResolved: false,
      createdAt: new Date().toISOString()
    };
    this.pharmacyExceptions.set(exception.id, exception);
    return exception;
  }

  public resolvePharmacyComplianceException(exceptionId: string, resolutionNotes: string, resolvedBy: string): PharmacyComplianceException | null {
    const exc = this.pharmacyExceptions.get(exceptionId);
    if (!exc) return null;
    exc.isResolved = true;
    exc.resolutionNotes = resolutionNotes;
    exc.resolvedBy = resolvedBy;
    exc.resolvedAt = new Date().toISOString();
    return exc;
  }

  public getRiderChecklist(applicationId: string): RiderVerificationChecklist | undefined {
    return this.riderChecklists.get(applicationId);
  }

  public updateRiderChecklist(applicationId: string, checklist: Partial<RiderVerificationChecklist>, verifiedBy: string): RiderVerificationChecklist {
    const existing = this.riderChecklists.get(applicationId) || {
      id: `chk-r-${Date.now()}`,
      applicationId,
      drivingLicenceVerified: false,
      vehicleRcVerified: false,
      identityVerified: false,
      backgroundCheckCleared: false,
      updatedAt: new Date().toISOString()
    };
    const updated: RiderVerificationChecklist = {
      ...existing,
      ...checklist,
      verifiedBy,
      updatedAt: new Date().toISOString()
    };
    this.riderChecklists.set(applicationId, updated);
    return updated;
  }

  public reviewRiderApplicationStatutory(
    applicationId: string, 
    decision: 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT' | 'SUSPEND', 
    reason: string, 
    reviewerId: string
  ): { success: boolean; message: string; status: string } {
    const app = this.riderApplications.get(applicationId);
    if (!app) {
      return { success: false, message: 'Rider application not found', status: 'unknown' };
    }

    if (decision === 'APPROVE') {
      const checklist = this.riderChecklists.get(applicationId);
      if (!checklist || !checklist.drivingLicenceVerified || !checklist.vehicleRcVerified || !checklist.identityVerified || !checklist.backgroundCheckCleared) {
        return {
          success: false,
          message: 'Cannot approve rider: All 4 verification checklist items (DL, Vehicle RC, Identity, Background) must be verified.',
          status: app.status
        };
      }
      app.status = 'approved';
      app.reviewedBy = reviewerId;
      app.reviewedAt = new Date().toISOString();
      app.reviewerComments = reason;
      app.updatedAt = new Date().toISOString();

      const riderId = app.riderId || `rider-${Date.now()}`;
      app.riderId = riderId;
      const existingRider = this.riders.get(riderId) || Array.from(this.riders.values()).find(r => r.userId === app.userId);
      if (existingRider) {
        existingRider.isApproved = true;
        existingRider.approvalStatus = 'approved';
      } else {
        this.riders.set(riderId, {
          id: riderId,
          userId: app.userId,
          vehicleType: app.vehicleType,
          vehicleRegistrationNumber: app.vehicleRegistrationNumber,
          drivingLicenceNumber: app.drivingLicenceNumber,
          isAvailable: true,
          currentCashInHand: 0,
          isApproved: true,
          approvalStatus: 'approved'
        });
      }

      const presence = this.riderPresence.get(riderId) || Array.from(this.riderPresence.values()).find(p => p.userId === app.userId);
      if (presence) {
        presence.isApproved = true;
        presence.isSuspended = false;
      }

      this.auditEvents.push({
        id: `aud-${Date.now()}`,
        actorId: reviewerId,
        action: 'RIDER_APPLICATION_APPROVED',
        resourceType: 'rider_onboarding_application',
        resourceId: applicationId,
        details: { reason, riderId, fullName: app.fullName },
        timestamp: new Date().toISOString()
      });

      return { success: true, message: `Rider ${app.fullName} approved and activated.`, status: 'approved' };
    }

    if (decision === 'REQUEST_CHANGES') {
      app.status = 'needs_changes';
      app.reviewedBy = reviewerId;
      app.reviewedAt = new Date().toISOString();
      app.reviewerComments = reason;
      app.updatedAt = new Date().toISOString();

      this.auditEvents.push({
        id: `aud-${Date.now()}`,
        actorId: reviewerId,
        action: 'RIDER_APPLICATION_CHANGES_REQUESTED',
        resourceType: 'rider_onboarding_application',
        resourceId: applicationId,
        details: { reason },
        timestamp: new Date().toISOString()
      });

      return { success: true, message: `Changes requested for ${app.fullName}. Reason: ${reason}`, status: 'needs_changes' };
    }

    if (decision === 'SUSPEND') {
      app.status = 'suspended';
      app.reviewedBy = reviewerId;
      app.reviewedAt = new Date().toISOString();
      app.reviewerComments = reason;
      app.updatedAt = new Date().toISOString();

      if (app.riderId && this.riders.has(app.riderId)) {
        const r = this.riders.get(app.riderId)!;
        r.isApproved = false;
        r.isAvailable = false;
        r.approvalStatus = 'suspended';
      }
      if (app.riderId && this.riderPresence.has(app.riderId)) {
        const rp = this.riderPresence.get(app.riderId)!;
        rp.isSuspended = true;
        rp.isOnline = false;
      }

      this.auditEvents.push({
        id: `aud-${Date.now()}`,
        actorId: reviewerId,
        action: 'RIDER_SUSPENDED',
        resourceType: 'rider_onboarding_application',
        resourceId: applicationId,
        details: { reason },
        timestamp: new Date().toISOString()
      });

      return { success: true, message: `Rider ${app.fullName} has been suspended.`, status: 'suspended' };
    }

    // REJECT
    app.status = 'needs_changes';
    app.reviewerComments = `REJECTED: ${reason}`;
    app.reviewedBy = reviewerId;
    app.reviewedAt = new Date().toISOString();
    return { success: true, message: `Rejected application for ${app.fullName}.`, status: 'rejected' };
  }

  public getRiderIncidents(riderId?: string): RiderIncidentReport[] {
    const all = Array.from(this.riderIncidents.values());
    if (riderId) return all.filter(i => i.riderId === riderId);
    return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public createRiderIncident(data: Omit<RiderIncidentReport, 'id' | 'createdAt'>): RiderIncidentReport {
    const inc: RiderIncidentReport = {
      ...data,
      id: `inc-${Date.now()}`,
      status: 'OPEN',
      createdAt: new Date().toISOString()
    };
    this.riderIncidents.set(inc.id, inc);
    return inc;
  }

  public resolveRiderIncident(incidentId: string, resolutionNotes: string, resolvedBy: string): RiderIncidentReport | null {
    const inc = this.riderIncidents.get(incidentId);
    if (!inc) return null;
    inc.status = 'RESOLVED';
    inc.resolutionNotes = resolutionNotes;
    inc.resolvedBy = resolvedBy;
    inc.resolvedAt = new Date().toISOString();
    return inc;
  }

  public getRiderCashDeposits(riderId?: string): RiderCashDeposit[] {
    const all = Array.from(this.riderCashDeposits.values());
    if (riderId) return all.filter(d => d.riderId === riderId);
    return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public submitRiderCashDeposit(
    riderId: string, 
    amountPaise: number, 
    depositMethod: 'BANK_DEPOSIT' | 'UPI_TRANSFER' | 'HUB_CASH', 
    referenceNumber?: string, 
    notes?: string
  ): RiderCashDeposit {
    const rider = this.riders.get(riderId);
    const riderName = rider ? (this.users.get(rider.userId)?.fullName || 'Rider') : 'Rider';
    const deposit: RiderCashDeposit = {
      id: `dep-${Date.now()}`,
      riderId,
      riderName,
      amountPaise,
      depositMethod,
      referenceNumber,
      notes,
      status: 'SUBMITTED',
      createdAt: new Date().toISOString()
    };
    this.riderCashDeposits.set(deposit.id, deposit);
    return deposit;
  }

  public confirmRiderCashDeposit(depositId: string, adminId: string): { success: boolean; deposit: RiderCashDeposit; updatedCashInHandPaise: number } {
    const deposit = this.riderCashDeposits.get(depositId);
    if (!deposit) throw new Error(`Deposit ${depositId} not found`);
    if (deposit.status === 'CONFIRMED') {
      const riderPresence = this.riderPresence.get(deposit.riderId);
      return { success: true, deposit, updatedCashInHandPaise: riderPresence ? riderPresence.currentCashInHandPaise : 0 };
    }

    deposit.status = 'CONFIRMED';
    deposit.confirmedBy = adminId;
    deposit.confirmedAt = new Date().toISOString();

    let updatedCash = 0;
    const presence = this.riderPresence.get(deposit.riderId);
    if (presence) {
      presence.currentCashInHandPaise = Math.max(0, presence.currentCashInHandPaise - deposit.amountPaise);
      updatedCash = presence.currentCashInHandPaise;
    }
    const profile = this.riders.get(deposit.riderId);
    if (profile) {
      profile.currentCashInHand = Math.max(0, profile.currentCashInHand - (deposit.amountPaise / 100));
      if (!presence) updatedCash = profile.currentCashInHand * 100;
    }

    this.auditEvents.push({
      id: `aud-${Date.now()}`,
      actorId: adminId,
      action: 'RIDER_CASH_DEPOSIT_CONFIRMED',
      resourceType: 'rider_cash_deposit',
      resourceId: depositId,
      details: { riderId: deposit.riderId, amountPaise: deposit.amountPaise, updatedCashInHandPaise: updatedCash },
      timestamp: new Date().toISOString()
    });

    return { success: true, deposit, updatedCashInHandPaise: updatedCash };
  }

  public rejectRiderCashDeposit(depositId: string, rejectionReason: string, adminId: string): RiderCashDeposit {
    const deposit = this.riderCashDeposits.get(depositId);
    if (!deposit) throw new Error(`Deposit ${depositId} not found`);
    deposit.status = 'REJECTED';
    deposit.rejectionReason = rejectionReason;
    deposit.confirmedBy = adminId;
    deposit.confirmedAt = new Date().toISOString();

    this.auditEvents.push({
      id: `aud-${Date.now()}`,
      actorId: adminId,
      action: 'RIDER_CASH_DEPOSIT_REJECTED',
      resourceType: 'rider_cash_deposit',
      resourceId: depositId,
      details: { rejectionReason },
      timestamp: new Date().toISOString()
    });

    return deposit;
  }

  public generateRiderPayoutBatch(periodStart: string, periodEnd: string, adminId: string): RiderPayoutBatch {
    const batchId = `payout-${Date.now()}`;
    const items: RiderPayoutItem[] = [];
    let totalPaise = 0;

    for (const [riderId, presence] of this.riderPresence.entries()) {
      const basePay = presence.totalCompletedOrders * 5000;
      const distanceBonus = Math.floor(presence.totalCompletedOrders * 1500);
      const tips = 5000;
      const codDeductions = 0;
      const net = basePay + distanceBonus + tips - codDeductions;
      totalPaise += net;

      items.push({
        riderId,
        riderName: presence.fullName,
        phone: presence.phone,
        completedDeliveries: presence.totalCompletedOrders,
        basePayPaise: basePay,
        distanceBonusPaise: distanceBonus,
        tipsPaise: tips,
        codDeductionsPaise: codDeductions,
        netPayoutPaise: net,
        bankAccountMasked: '••••••••7741',
        upiIdMasked: `${presence.phone.slice(-10)}@upi`
      });
    }

    const batch: RiderPayoutBatch = {
      id: batchId,
      periodStart,
      periodEnd,
      totalRiders: items.length,
      totalAmountPaise: totalPaise,
      status: 'DRAFT',
      items,
      createdBy: adminId,
      createdAt: new Date().toISOString()
    };
    this.riderPayoutBatches.set(batchId, batch);
    return batch;
  }

  public getPayoutBatches(): RiderPayoutBatch[] {
    return Array.from(this.riderPayoutBatches.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public exportPayoutBatch(batchId: string, format: 'json' | 'csv'): { filename: string; contentType: string; data: string } {
    const batch = this.riderPayoutBatches.get(batchId);
    if (!batch) throw new Error(`Payout batch ${batchId} not found`);

    if (format === 'csv') {
      const headers = ['Rider ID', 'Rider Name', 'Phone', 'Completed Deliveries', 'Base Pay (INR)', 'Distance Bonus (INR)', 'Tips (INR)', 'Net Payout (INR)', 'Bank Account', 'UPI ID'];
      const rows = batch.items.map(i => [
        i.riderId,
        `"${i.riderName}"`,
        i.phone,
        i.completedDeliveries,
        (i.basePayPaise / 100).toFixed(2),
        (i.distanceBonusPaise / 100).toFixed(2),
        (i.tipsPaise / 100).toFixed(2),
        (i.netPayoutPaise / 100).toFixed(2),
        i.bankAccountMasked || 'N/A',
        i.upiIdMasked || 'N/A'
      ]);
      const csvData = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      return {
        filename: `payout_batch_${batch.periodStart}_to_${batch.periodEnd}.csv`,
        contentType: 'text/csv',
        data: csvData
      };
    }

    return {
      filename: `payout_batch_${batch.periodStart}_to_${batch.periodEnd}.json`,
      contentType: 'application/json',
      data: JSON.stringify(batch, null, 2)
    };
  }

  // ============================================================================
  // MILESTONE A5: CATALOGUE MANAGEMENT, APPROVALS & BATCH RECALLS
  // ============================================================================

  public executeTwoPersonApprovalPayload(approval: TwoPersonApproval): void {
    if (approval.actionType === 'OTC_DIRECT_TOGGLE') {
      const product = this.products.get(approval.targetResourceId);
      if (product) {
        product.isOtcDirect = Boolean(approval.payload?.newValue ?? approval.payload?.isOtcDirect);
      }
    } else if (approval.actionType === 'SCHEDULE_CHANGE' || approval.actionType === 'CATALOGUE_CLASS_CHANGE') {
      const product = this.products.get(approval.targetResourceId);
      if (product) {
        const newSched = approval.payload?.newValue ?? approval.payload?.scheduleType;
        if (newSched) {
          product.scheduleType = newSched;
          if (newSched !== 'OTC') {
            product.requiresPrescription = true;
            product.isOtcDirect = false;
          }
        }
      }
    } else if (approval.actionType === 'MAX_QUANTITY_CHANGE') {
      const product = this.products.get(approval.targetResourceId);
      if (product) {
        product.maxOrderQuantity = Number(approval.payload?.newValue ?? approval.payload?.maxOrderQuantity ?? 10);
      }
    } else if (approval.actionType === 'PRICE_MRP_OVERRIDE') {
      const product = this.products.get(approval.targetResourceId);
      if (product && approval.payload?.newMrp) {
        product.mrp = Number(approval.payload.newMrp);
      }
    }
  }

  public createCatalogueProduct(productData: Omit<Product, 'id'>, adminUserId: string): Product {
    if (productData.mrp <= 0) {
      throw new Error('Statutory validation error: MRP must be a positive amount.');
    }

    // Statutory requirement: Scheduled drugs must require prescription and cannot be OTC_DIRECT
    if (['Schedule H', 'Schedule H1', 'Schedule X'].includes(productData.scheduleType)) {
      if (!productData.requiresPrescription) {
        throw new Error('Statutory violation: Scheduled drugs under Drugs and Cosmetics Rules must have requiresPrescription set to true.');
      }
      if (productData.isOtcDirect) {
        throw new Error('Statutory violation: Scheduled drugs cannot have isOtcDirect flag enabled.');
      }
    }

    const id = `prd-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const product: Product = {
      ...productData,
      id,
      maxOrderQuantity: productData.maxOrderQuantity ?? 10,
      isActiveInCatalogue: productData.isActiveInCatalogue ?? true
    };

    this.products.set(id, product);

    this.recordAudit(adminUserId, 'CATALOGUE_PRODUCT_CREATED', 'product', id, {
      name: product.name,
      mrp: product.mrp,
      scheduleType: product.scheduleType,
      isOtcDirect: product.isOtcDirect
    });

    return product;
  }

  public updateCatalogueProduct(id: string, updates: Partial<Product>, adminUserId: string): Product {
    const product = this.products.get(id);
    if (!product) throw new Error(`Product ${id} not found.`);

    if (updates.mrp !== undefined && updates.mrp <= 0) {
      throw new Error('Statutory validation error: MRP must be a positive amount.');
    }

    // Guard scheduled drug safety
    const targetSchedule = updates.scheduleType ?? product.scheduleType;
    const targetIsOtcDirect = updates.isOtcDirect ?? product.isOtcDirect;

    if (['Schedule H', 'Schedule H1', 'Schedule X'].includes(targetSchedule) && targetIsOtcDirect) {
      throw new Error('Statutory violation: Scheduled drugs cannot have isOtcDirect enabled. Submit a two-person safety approval request.');
    }

    // If MRP is reduced, clamp selling price in inventory so sellingPrice <= MRP
    if (updates.mrp !== undefined) {
      for (const inv of this.inventory.values()) {
        if (inv.productId === id) {
          inv.mrp = updates.mrp;
          if (inv.sellingPrice > updates.mrp) {
            inv.sellingPrice = updates.mrp;
          }
        }
      }
    }

    Object.assign(product, updates);

    this.recordAudit(adminUserId, 'CATALOGUE_PRODUCT_UPDATED', 'product', id, {
      updates
    });

    return product;
  }

  public toggleCatalogueProductStatus(id: string, isActive: boolean, adminUserId: string, reason?: string): Product {
    const product = this.products.get(id);
    if (!product) throw new Error(`Product ${id} not found.`);

    product.isActiveInCatalogue = isActive;

    this.recordAudit(adminUserId, 'CATALOGUE_PRODUCT_STATUS_CHANGED', 'product', id, {
      isActive,
      reason
    });

    return product;
  }

  public issueBatchRecall(params: {
    productId: string;
    batchNumber: string;
    manufacturerNoticeRef: string;
    recallClass: RecallClass;
    reason: string;
    issuedBy: string;
    issuedByName: string;
  }): ProductBatchRecall {
    const product = this.products.get(params.productId);
    if (!product) throw new Error(`Product ${params.productId} not found.`);

    const recallId = `recall-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    let affectedUnits = 0;

    // Scan all pharmacy inventory holding this product and batch
    for (const inv of this.inventory.values()) {
      if (inv.productId === params.productId) {
        if (params.batchNumber === 'ALL') {
          for (const b of inv.batches) {
            b.isRecalled = true;
            b.recallNoticeId = recallId;
            affectedUnits += b.quantity;
          }
          inv.availableQuantity = 0;
        } else {
          for (const b of inv.batches) {
            if (b.batchNumber === params.batchNumber) {
              b.isRecalled = true;
              b.recallNoticeId = recallId;
              affectedUnits += b.quantity;
              inv.availableQuantity = Math.max(0, inv.availableQuantity - b.quantity);
            }
          }
        }
      }
    }

    // If whole product recall, deactivate from customer catalogue immediately
    if (params.batchNumber === 'ALL') {
      product.isActiveInCatalogue = false;
    }

    // Scan active orders containing this product
    let activeOrdersCount = 0;
    const activeStates = ['CREATED', 'PAYMENT_CONFIRMED', 'PHARMACY_REVIEW', 'ACCEPTED', 'PACKING', 'PACKED', 'RIDER_ASSIGNED'];
    for (const order of this.orders.values()) {
      if (activeStates.includes(order.state)) {
        const hasItem = order.items.some(i => i.productId === params.productId);
        if (hasItem) {
          activeOrdersCount++;
        }
      }
    }

    const recall: ProductBatchRecall = {
      id: recallId,
      productId: params.productId,
      productName: product.name,
      batchNumber: params.batchNumber,
      manufacturerNoticeRef: params.manufacturerNoticeRef,
      recallClass: params.recallClass,
      reason: params.reason,
      issuedBy: params.issuedBy,
      issuedByName: params.issuedByName,
      issuedAt: new Date().toISOString(),
      status: 'ACTIVE',
      affectedInventoryUnits: affectedUnits,
      affectedActiveOrdersCount: activeOrdersCount
    };

    this.productBatchRecalls.set(recallId, recall);

    // Create high-severity operational alert
    this.addOperationalAlert({
      title: `DRUG RECALL: ${product.name} (${params.batchNumber === 'ALL' ? 'ALL BATCHES' : 'Batch ' + params.batchNumber})`,
      description: `Recall directive ${params.manufacturerNoticeRef} issued: ${params.reason}. ${affectedUnits} units quarantined across pharmacies.`,
      severity: params.recallClass === 'CLASS_1_CRITICAL' ? 'CRITICAL' : 'HIGH',
      category: 'inventory'
    });

    this.recordAudit(params.issuedBy, 'PRODUCT_BATCH_RECALL_ISSUED', 'recall', recallId, {
      productId: params.productId,
      batchNumber: params.batchNumber,
      recallClass: params.recallClass,
      affectedUnits,
      activeOrdersCount
    });

    return recall;
  }

  public getBatchRecalls(status?: RecallStatus): ProductBatchRecall[] {
    let recalls = Array.from(this.productBatchRecalls.values());
    if (status) {
      recalls = recalls.filter(r => r.status === status);
    }
    return recalls.sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());
  }

  public resolveBatchRecall(
    recallId: string,
    resolvedBy: string,
    resolutionNotes: string
  ): { success: boolean; recall?: ProductBatchRecall; error?: string } {
    const recall = this.productBatchRecalls.get(recallId);
    if (!recall) return { success: false, error: 'Recall record not found.' };

    recall.status = 'RESOLVED';
    recall.resolutionNotes = resolutionNotes;
    recall.resolvedBy = resolvedBy;
    recall.resolvedAt = new Date().toISOString();

    this.recordAudit(resolvedBy, 'PRODUCT_BATCH_RECALL_RESOLVED', 'recall', recallId, {
      resolutionNotes
    });

    return { success: true, recall };
  }

  public submitImageForModeration(params: {
    productId: string;
    submittedByPharmacyId: string;
    pharmacyName: string;
    imageUrl: string;
  }): CatalogueImageModeration {
    const product = this.products.get(params.productId);
    if (!product) throw new Error(`Product ${params.productId} not found.`);

    const id = `img-mod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const mod: CatalogueImageModeration = {
      id,
      productId: params.productId,
      productName: product.name,
      submittedByPharmacyId: params.submittedByPharmacyId,
      pharmacyName: params.pharmacyName,
      imageUrl: params.imageUrl,
      submittedAt: new Date().toISOString(),
      status: 'PENDING'
    };

    this.catalogueImageModerations.set(id, mod);
    return mod;
  }

  public getImageModerations(status?: ModerationStatus): CatalogueImageModeration[] {
    let items = Array.from(this.catalogueImageModerations.values());
    if (status) {
      items = items.filter(i => i.status === status);
    }
    return items.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }

  public reviewImageModeration(
    id: string,
    reviewerId: string,
    decision: 'APPROVE' | 'REJECT',
    rejectionReason?: string,
    setAsPrimary?: boolean
  ): { success: boolean; item?: CatalogueImageModeration; error?: string } {
    const item = this.catalogueImageModerations.get(id);
    if (!item) return { success: false, error: 'Image moderation item not found.' };

    item.status = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    item.reviewedBy = reviewerId;
    item.reviewedAt = new Date().toISOString();
    if (decision === 'REJECT') {
      item.rejectionReason = rejectionReason || 'Image does not meet packaging clarity guidelines.';
    }

    if (decision === 'APPROVE' && setAsPrimary) {
      const product = this.products.get(item.productId);
      if (product) {
        product.imageUrl = item.imageUrl;
      }
    }

    this.recordAudit(reviewerId, 'CATALOGUE_IMAGE_MODERATION_REVIEWED', 'image_moderation', id, {
      decision,
      setAsPrimary: Boolean(setAsPrimary),
      productId: item.productId
    });

    return { success: true, item };
  }
}

export const dbStore = new MedcureDataStore();
