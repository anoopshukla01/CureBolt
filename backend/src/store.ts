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
  RiderLocationSnapshot
} from './types';

export class MedcureDataStore {
  public users: Map<string, User> = new Map();
  public addresses: Map<string, CustomerAddress> = new Map();
  public animals: Map<string, AnimalProfile> = new Map();
  public pharmacies: Map<string, Pharmacy> = new Map();
  public products: Map<string, Product> = new Map();
  public inventory: Map<string, PharmacyInventoryItem> = new Map();
  public prescriptions: Map<string, Prescription> = new Map();
  public orders: Map<string, Order> = new Map();
  public payments: Map<string, PaymentRecord> = new Map();
  public riders: Map<string, RiderProfile> = new Map();
  public codCollections: Map<string, CodCollectionRecord> = new Map();
  public codSettlements: Map<string, CodSettlementRecord> = new Map();
  public riderLocations: Map<string, RiderLocationSnapshot> = new Map();
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

  private seedGorakhpurData() {
    // 1. Users
    const seedUsers: User[] = [
      { id: 'usr-admin-1', phone: '+919876500001', fullName: 'Dr. Alok Verma', role: 'platform_admin', isActive: true },
      { id: 'usr-owner-1', phone: '+919876500002', fullName: 'Rajesh Gupta', role: 'pharmacy_owner', isActive: true },
      { id: 'usr-pharma-1', phone: '+919876500003', fullName: 'Sunil Kumar Sharma', role: 'pharmacist', isActive: true },
      { id: 'usr-staff-1', phone: '+919876500004', fullName: 'Amit Mishra', role: 'pharmacy_staff', isActive: true },
      { id: 'usr-rider-1', phone: '+919876500005', fullName: 'Vikas Yadav', role: 'delivery_partner', isActive: true },
      { id: 'usr-cust-1', phone: '+919876500006', fullName: 'Pooja Srivastava', role: 'customer', isActive: true }
    ];
    seedUsers.forEach(u => this.users.set(u.id, u));

    // Rider Profile
    const rider: RiderProfile = {
      id: 'rider-1',
      userId: 'usr-rider-1',
      vehicleType: 'Hero Splendor Plus (UP53-AB-1234)',
      vehicleRegistrationNumber: 'UP53-AB-1234',
      drivingLicenceNumber: 'UP5320210098765',
      isAvailable: true,
      currentCashInHand: 0
    };
    this.riders.set(rider.id, rider);

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
    prods.forEach(p => this.products.set(p.id, p));

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
}

export const dbStore = new MedcureDataStore();
