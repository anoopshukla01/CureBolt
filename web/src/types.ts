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
  prescriptionId?: string;
  totalMrp: number;
  payableAmount: number;
  deliveryOtp: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}
