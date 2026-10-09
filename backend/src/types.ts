export type UserRole = 
  | 'customer'
  | 'pharmacy_owner'
  | 'pharmacist'
  | 'pharmacy_staff'
  | 'delivery_partner'
  | 'platform_admin'
  | 'support_operator';

export type HealthcareDomain = 'human' | 'veterinary';

export type OrderState = 
  | 'CREATED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_CONFIRMED'
  | 'PHARMACY_REVIEW'
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
  requiresPrescription: boolean;
  scheduleType: 'OTC' | 'Schedule H' | 'Schedule H1' | 'Schedule X';
  imageUrl: string;
  storageInstructions?: string;
  speciesRestrictions?: {
    speciesName: string;
    withdrawalPeriodDays: number;
    precautions: string;
  }[];
}

export interface PharmacyInventoryItem {
  id: string;
  pharmacyId: string;
  productId: string;
  availableQuantity: number;
  reservedQuantity: number;
  mrp: number;
  sellingPrice: number;
  batches: {
    batchNumber: string;
    mfgDate: string;
    expiryDate: string;
    quantity: number;
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
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  batchNumberAssigned?: string;
  expiryDateAssigned?: string;
}

export interface Order {
  id: string;
  orderCode: string;
  userId: string;
  pharmacyId: string;
  deliveryAddressId: string;
  categoryDomain: HealthcareDomain;
  state: OrderState;
  items: OrderItem[];
  prescriptionId?: string;
  totalMrp: number;
  totalDiscount: number;
  deliveryFee: number;
  taxes: number;
  payableAmount: number;
  deliveryOtp: string;
  rejectionReason?: string;
  riderId?: string;
  createdAt: string;
  updatedAt: string;
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
