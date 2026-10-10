export type HealthcareDomain = 'human' | 'veterinary';

export interface Product {
  id: string;
  name: string;
  brand: string;
  generic_salt_name?: string;
  category_domain: HealthcareDomain;
  formulation: string;
  strength?: string;
  pack_size: string;
  manufacturer: string;
  requires_prescription: boolean;
  schedule_type: string;
  selling_price: number;
  mrp: number;
  discount_percent?: number;
  available_quantity: number;
  in_stock: boolean;
  species_restrictions?: {
    speciesName: string;
    withdrawalPeriodDays: number;
    precautions: string;
  }[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  orderCode: string;
  userId: string;
  pharmacyId: string;
  deliveryAddressId: string;
  categoryDomain: HealthcareDomain;
  state: string;
  items: {
    productId: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    batchNumberAssigned?: string;
    expiryDateAssigned?: string;
  }[];
  paymentMode?: 'ONLINE' | 'COD';
  prescriptionId?: string;
  totalMrp: number;
  payableAmount: number;
  deliveryOtp: string;
  rejectionReason?: string;
  riderId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrackingData {
  order_id: string;
  order_code: string;
  state: string;
  eta_minutes: number;
  eta_display: string;
  distance_km: number;
  is_stale: boolean;
  stale_warning: string | null;
  traffic_status: string;
  rider: {
    id: string;
    name: string;
    phone: string;
    vehicle: string;
    current_cash_in_hand: number;
  } | null;
  rider_location: {
    latitude: number;
    longitude: number;
    speedKmh: number;
    heading: number;
    recordedAt: string;
  } | null;
  pharmacy_location: { latitude: number; longitude: number; name: string } | null;
  customer_location: { latitude: number; longitude: number; address: string } | null;
}

export interface CodReconciliationData {
  total_outstanding_cash: number;
  riders: {
    id: string;
    userId: string;
    name: string;
    phone: string;
    vehicleType: string;
    vehicleRegistrationNumber: string;
    currentCashInHand: number;
  }[];
  collections: {
    id: string;
    orderId: string;
    riderId: string;
    amountCollected: number;
    receiptNumber: string;
    collectedAt: string;
  }[];
  settlements: {
    id: string;
    riderId: string;
    amountDeposited: number;
    depositReference: string;
    verifiedBy: string;
    settledAt: string;
  }[];
}
