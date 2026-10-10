import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { dbStore } from '../store';
import { OrderStateMachine } from '../services/orderStateMachine';
import { MedcureAIAssistant } from '../services/aiService';
import { Order, OrderItem, Prescription } from '../types';

export const apiRouter = Router();

// Gorakhpur Pilot Bounding Box (Latitude ~26.70 to 26.85, Longitude ~83.30 to 83.45)
const GORAKHPUR_BOUNDS = {
  minLat: 26.65,
  maxLat: 26.88,
  minLng: 83.25,
  maxLng: 83.48
};

// ============================================================================
// 1. AUTH & PROFILES
// ============================================================================
apiRouter.post('/auth/request-otp', (req: Request, res: Response) => {
  const schema = z.object({ phone: z.string().min(10) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Valid 10-digit phone number is required.' });
  }

  const sessionId = `sess-${Date.now()}`;
  // For pilot / test mode, OTP is deterministic '1234'
  return res.json({
    success: true,
    session_id: sessionId,
    expires_in: 300,
    message: 'OTP sent to mobile (Development test OTP: 1234)'
  });
});

apiRouter.post('/auth/verify-otp', (req: Request, res: Response) => {
  const schema = z.object({
    phone: z.string().min(10),
    otp: z.string().length(4)
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Valid phone and 4-digit OTP required.' });
  }

  if (parsed.data.otp !== '1234') {
    return res.status(401).json({ error: 'Invalid or expired OTP.' });
  }

  let user = Array.from(dbStore.users.values()).find(u => u.phone.includes(parsed.data.phone.slice(-10)));
  if (!user) {
    // Auto register as customer
    user = {
      id: `usr-${Date.now()}`,
      phone: parsed.data.phone,
      fullName: 'Medcure Customer',
      role: 'customer',
      isActive: true
    };
    dbStore.users.set(user.id, user);
  }

  const token = `jwt-mock-${user.id}-${Date.now()}`;
  return res.json({
    token,
    user
  });
});

apiRouter.get('/users/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const userId = authHeader ? authHeader.replace('Bearer ', '').split('-')[2] : 'usr-cust-1';
  const user = dbStore.users.get(userId) || dbStore.users.get('usr-cust-1');
  return res.json({ user });
});

// ============================================================================
// 2. SERVICEABILITY & CATALOGUE
// ============================================================================
apiRouter.get('/serviceability/check', (req: Request, res: Response) => {
  const lat = parseFloat(req.query.lat as string) || 26.7606;
  const lng = parseFloat(req.query.lng as string) || 83.3732;

  const inGorakhpur = 
    lat >= GORAKHPUR_BOUNDS.minLat && 
    lat <= GORAKHPUR_BOUNDS.maxLat && 
    lng >= GORAKHPUR_BOUNDS.minLng && 
    lng <= GORAKHPUR_BOUNDS.maxLng;

  if (!inGorakhpur) {
    return res.json({
      is_serviceable: false,
      city: 'Gorakhpur',
      message: 'Medcure is currently operational exclusively within Gorakhpur city zones.'
    });
  }

  const activePharmacies = Array.from(dbStore.pharmacies.values()).filter(p => p.isActive && p.isVerified);
  return res.json({
    is_serviceable: true,
    city: 'Gorakhpur',
    zone: 'Gorakhpur Urban Zone',
    partner_pharmacies_count: activePharmacies.length
  });
});

apiRouter.get(['/catalogue/products', '/products'], (req: Request, res: Response) => {
  const domain = req.query.domain as string; // 'human' or 'veterinary'
  const query = (req.query.query as string || '').toLowerCase();
  const categoryId = req.query.categoryId as string;

  let prods = Array.from(dbStore.products.values());

  if (domain === 'human' || domain === 'veterinary') {
    prods = prods.filter(p => p.categoryDomain === domain);
  }

  if (categoryId) {
    prods = prods.filter(p => p.categoryId === categoryId);
  }

  if (query) {
    prods = prods.filter(p => 
      p.name.toLowerCase().includes(query) ||
      (p.genericSaltName && p.genericSaltName.toLowerCase().includes(query)) ||
      p.brand.toLowerCase().includes(query)
    );
  }

  // Enrich with inventory pricing
  const enriched = prods.map(p => {
    const inv = Array.from(dbStore.inventory.values()).find(i => i.productId === p.id);
    return {
      ...p,
      selling_price: inv ? inv.sellingPrice : 0,
      mrp: inv ? inv.mrp : 0,
      available_quantity: inv ? inv.availableQuantity : 0,
      in_stock: inv ? inv.availableQuantity > 0 : false
    };
  });

  return res.json({ items: enriched, total: enriched.length });
});

apiRouter.get(['/catalogue/products/:id', '/products/:id'], (req: Request, res: Response) => {
  const product = dbStore.products.get(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found.' });
  }
  const inv = Array.from(dbStore.inventory.values()).find(i => i.productId === product.id);
  return res.json({
    product: {
      ...product,
      selling_price: inv ? inv.sellingPrice : 0,
      mrp: inv ? inv.mrp : 0,
      available_quantity: inv ? inv.availableQuantity : 0,
      in_stock: inv ? inv.availableQuantity > 0 : false
    }
  });
});

// ============================================================================
// 3. PRESCRIPTION VAULT
// ============================================================================
apiRouter.post('/prescriptions/upload-intent', (req: Request, res: Response) => {
  const schema = z.object({
    userId: z.string(),
    fileName: z.string(),
    doctorName: z.string().optional(),
    animalId: z.string().optional()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error });
  }

  const presId = `rx-${Date.now()}`;
  const pres: Prescription = {
    id: presId,
    userId: parsed.data.userId,
    animalId: parsed.data.animalId,
    documentVaultPath: `vault/prescriptions/${parsed.data.userId}/${presId}-${parsed.data.fileName}`,
    doctorName: parsed.data.doctorName,
    status: 'uploaded',
    createdAt: new Date().toISOString()
  };

  dbStore.prescriptions.set(pres.id, pres);
  dbStore.recordAudit(parsed.data.userId, 'UPLOAD_PRESCRIPTION', 'prescription', pres.id, { fileName: parsed.data.fileName });

  return res.json({
    prescription_id: pres.id,
    upload_url: `https://vault.medcure.in/signed/${pres.id}?token=mock-sas-15min`,
    expires_in_seconds: 900,
    status: pres.status
  });
});

apiRouter.get('/prescriptions/:id', (req: Request, res: Response) => {
  const pres = dbStore.prescriptions.get(req.params.id);
  if (!pres) {
    return res.status(404).json({ error: 'Prescription not found.' });
  }
  return res.json({ prescription: pres });
});

// Assistive Prescription OCR Scanner (Human-in-the-Loop review aid)
apiRouter.post('/prescriptions/:id/ocr', (req: Request, res: Response) => {
  const pres = dbStore.prescriptions.get(req.params.id);
  if (!pres) {
    return res.status(404).json({ error: 'Prescription not found.' });
  }

  // Simulated optical character parsing for pilot doctor slip
  const ocrText = [
    'Dr. K. N. Rao, MBBS, MD (Medicine)',
    'Reg No: UP-MCI-48291 | Golghar Clinic, Gorakhpur',
    'Patient: Pooja Srivastava | Date: 10-Oct-2026',
    'Rx:',
    '1. Tab. Dolo 650mg - 1 tab TDS after meals (3 days)',
    '2. Tab. Glycomet 500mg SR - 1 tab OD after breakfast',
    '3. Drontal Plus Bone - 1 strip for Canine deworming'
  ].join('\n');

  pres.ocrExtractedText = ocrText;

  // Fuzzy match against catalogue medicines
  const candidateMatches: { productId: string; productName: string; confidence: number }[] = [];
  for (const prod of Array.from(dbStore.products.values())) {
    const textLower = ocrText.toLowerCase();
    const nameLower = prod.name.toLowerCase();
    const saltLower = (prod.genericSaltName || '').toLowerCase();

    if (textLower.includes(nameLower.split(' ')[0]) || (saltLower && textLower.includes(saltLower.split(' ')[0]))) {
      const confidence = prod.id === 'prd-dolo-650' ? 0.94 : prod.id === 'prd-glycomet-500' ? 0.89 : 0.81;
      candidateMatches.push({
        productId: prod.id,
        productName: prod.name,
        confidence
      });
    }
  }

  pres.candidateMatches = candidateMatches;
  pres.status = 'ocr_processed';
  dbStore.recordAudit(pres.userId, 'ASSISTIVE_OCR_EXTRACT', 'prescription', pres.id, {
    matchesFound: candidateMatches.length
  });

  return res.json({
    prescription_id: pres.id,
    status: pres.status,
    extracted_text: pres.ocrExtractedText,
    candidate_matches: candidateMatches
  });
});

// ============================================================================
// 4. CART & ORDERS
// ============================================================================
apiRouter.post('/cart/validate', (req: Request, res: Response) => {
  const schema = z.object({
    pharmacyId: z.string(),
    items: z.array(z.object({
      productId: z.string(),
      quantity: z.number().int().positive()
    })),
    prescriptionId: z.string().optional()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error });
  }

  let subtotal = 0;
  let totalMrp = 0;
  let requiresRx = false;

  for (const item of parsed.data.items) {
    const product = dbStore.products.get(item.productId);
    if (!product) {
      return res.status(400).json({ error: `Product ${item.productId} not found.` });
    }
    if (product.requiresPrescription) {
      requiresRx = true;
    }
    const inv = Array.from(dbStore.inventory.values()).find(
      i => i.pharmacyId === parsed.data.pharmacyId && i.productId === item.productId
    );
    if (!inv || inv.availableQuantity < item.quantity) {
      return res.status(400).json({ error: `Insufficient stock for ${product.name}.` });
    }
    subtotal += inv.sellingPrice * item.quantity;
    totalMrp += inv.mrp * item.quantity;
  }

  const deliveryFee = subtotal > 500 ? 0 : 25; // Free delivery over ₹500 in Gorakhpur
  const taxes = Number((subtotal * 0.05).toFixed(2)); // 5% GST on eligible healthcare items
  const payable = Number((subtotal + deliveryFee + taxes).toFixed(2));

  return res.json({
    valid: true,
    subtotal,
    totalMrp,
    deliveryFee,
    taxes,
    payableAmount: payable,
    requiresPrescription: requiresRx,
    prescriptionLinked: !!parsed.data.prescriptionId
  });
});

apiRouter.post('/orders', (req: Request, res: Response) => {
  const schema = z.object({
    userId: z.string(),
    pharmacyId: z.string(),
    deliveryAddressId: z.string(),
    categoryDomain: z.enum(['human', 'veterinary']),
    paymentMode: z.enum(['ONLINE', 'COD']).default('ONLINE'),
    items: z.array(z.object({
      productId: z.string(),
      quantity: z.number().int().positive()
    })),
    prescriptionId: z.string().optional()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error });
  }

  const paymentMode = parsed.data.paymentMode;

  // Check Rx Requirement
  let requiresRx = false;
  for (const it of parsed.data.items) {
    const prod = dbStore.products.get(it.productId);
    if (prod?.requiresPrescription) requiresRx = true;
  }

  if (requiresRx && !parsed.data.prescriptionId) {
    return res.status(400).json({
      error: 'Order contains prescription-required products (Schedule H/Veterinary). A valid prescription must be attached.'
    });
  }

  // Atomically reserve inventory
  const reserved = dbStore.reserveInventory(parsed.data.pharmacyId, parsed.data.items);
  if (!reserved) {
    return res.status(409).json({ error: 'One or more items are out of stock or over-allocated.' });
  }

  let subtotal = 0;
  let totalMrp = 0;
  const orderItems: OrderItem[] = [];

  for (const it of parsed.data.items) {
    const prod = dbStore.products.get(it.productId)!;
    const inv = Array.from(dbStore.inventory.values()).find(
      i => i.pharmacyId === parsed.data.pharmacyId && i.productId === it.productId
    )!;
    subtotal += inv.sellingPrice * it.quantity;
    totalMrp += inv.mrp * it.quantity;
    orderItems.push({
      productId: prod.id,
      productName: prod.name,
      unitPrice: inv.sellingPrice,
      quantity: it.quantity
    });
  }

  const deliveryFee = subtotal > 500 ? 0 : 25;
  const taxes = Number((subtotal * 0.05).toFixed(2));
  const payable = Number((subtotal + deliveryFee + taxes).toFixed(2));

  // Determine Initial State
  // If Prescription is attached, order moves to PHARMACY_REVIEW before payment!
  // If COD without Rx, moves directly to ACCEPTED (prepared for packing)
  // If ONLINE without Rx, moves to PAYMENT_PENDING
  let initialState: any;
  if (requiresRx) {
    initialState = 'PHARMACY_REVIEW';
  } else if (paymentMode === 'COD') {
    initialState = 'ACCEPTED';
  } else {
    initialState = 'PAYMENT_PENDING';
  }

  const orderId = `ord-${Date.now()}`;
  const randomOtp = Math.floor(1000 + Math.random() * 9000).toString();

  const newOrder: Order = {
    id: orderId,
    orderCode: `MC-GKP-${Math.floor(10000 + Math.random() * 90000)}`,
    userId: parsed.data.userId,
    pharmacyId: parsed.data.pharmacyId,
    deliveryAddressId: parsed.data.deliveryAddressId,
    categoryDomain: parsed.data.categoryDomain,
    paymentMode,
    state: initialState,
    items: orderItems,
    prescriptionId: parsed.data.prescriptionId,
    totalMrp,
    totalDiscount: totalMrp - subtotal,
    deliveryFee,
    taxes,
    payableAmount: payable,
    deliveryOtp: randomOtp,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  dbStore.orders.set(newOrder.id, newOrder);
  dbStore.recordAudit(parsed.data.userId, 'CREATE_ORDER', 'order', newOrder.id, {
    state: initialState,
    paymentMode,
    itemsCount: orderItems.length
  });

  return res.status(201).json({ order: newOrder });
});

apiRouter.get('/orders/:id', (req: Request, res: Response) => {
  const order = dbStore.orders.get(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }
  const pharmacy = dbStore.pharmacies.get(order.pharmacyId);
  const address = dbStore.addresses.get(order.deliveryAddressId);
  return res.json({ order, pharmacy, address });
});

// ============================================================================
// 5. PHARMACY OPERATIONS & PRESCRIPTION REVIEW
// ============================================================================
apiRouter.get('/pharmacy/orders', (req: Request, res: Response) => {
  const pharmacyId = req.query.pharmacyId as string || 'pharm-gkp-1';
  const orders = Array.from(dbStore.orders.values())
    .filter(o => o.pharmacyId === pharmacyId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json({ orders });
});

apiRouter.post('/pharmacy/orders/:id/review-prescription', (req: Request, res: Response) => {
  const schema = z.object({
    pharmacistId: z.string(),
    pharmacistRegNumber: z.string().min(4),
    decision: z.enum(['approved', 'rejected']),
    notes: z.string().optional()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error });
  }

  const order = dbStore.orders.get(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  if (order.state !== 'PHARMACY_REVIEW') {
    return res.status(400).json({ error: `Order is not in PHARMACY_REVIEW state. Current: ${order.state}` });
  }

  if (parsed.data.decision === 'rejected') {
    OrderStateMachine.validateTransition(order.state, 'REJECTED');
    order.state = 'REJECTED';
    order.rejectionReason = parsed.data.notes || 'Prescription rejected by dispensing pharmacist.';
    order.updatedAt = new Date().toISOString();
    
    // Release reserved inventory
    dbStore.releaseReservation(order.pharmacyId, order.items.map(i => ({ productId: i.productId, quantity: i.quantity })));
    dbStore.recordAudit(parsed.data.pharmacistId, 'REJECT_PRESCRIPTION', 'order', order.id, {
      councilReg: parsed.data.pharmacistRegNumber,
      notes: parsed.data.notes
    });

    return res.json({ success: true, order });
  }

  // Approved
  OrderStateMachine.validateTransition(order.state, 'ACCEPTED');
  order.state = 'ACCEPTED';
  order.updatedAt = new Date().toISOString();

  // If online payment, next move to PAYMENT_PENDING. If COD, stays in ACCEPTED ready for packing.
  if (order.paymentMode !== 'COD') {
    OrderStateMachine.validateTransition(order.state, 'PAYMENT_PENDING');
    order.state = 'PAYMENT_PENDING';
  }

  if (order.prescriptionId) {
    const rx = dbStore.prescriptions.get(order.prescriptionId);
    if (rx) {
      rx.status = 'approved';
      rx.reviewedBy = parsed.data.pharmacistId;
      rx.pharmacistRegNumber = parsed.data.pharmacistRegNumber;
    }
  }

  dbStore.recordAudit(parsed.data.pharmacistId, 'APPROVE_PRESCRIPTION', 'order', order.id, {
    councilReg: parsed.data.pharmacistRegNumber,
    notes: parsed.data.notes
  });

  return res.json({ success: true, order });
});

apiRouter.post('/pharmacy/orders/:id/pack', (req: Request, res: Response) => {
  const schema = z.object({
    staffId: z.string(),
    batchAllocations: z.array(z.object({
      productId: z.string(),
      batchNumber: z.string(),
      expiryDate: z.string()
    }))
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error });
  }

  const order = dbStore.orders.get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  // Update batch details on order items
  for (const alloc of parsed.data.batchAllocations) {
    const it = order.items.find(i => i.productId === alloc.productId);
    if (it) {
      it.batchNumberAssigned = alloc.batchNumber;
      it.expiryDateAssigned = alloc.expiryDate;
    }
  }

  // State transitions: PAYMENT_CONFIRMED -> PACKING -> PACKED
  if (order.state === 'PAYMENT_CONFIRMED' || order.state === 'ACCEPTED') {
    order.state = 'PACKED';
  } else {
    OrderStateMachine.validateTransition(order.state, 'PACKED');
    order.state = 'PACKED';
  }

  order.updatedAt = new Date().toISOString();
  dbStore.recordAudit(parsed.data.staffId, 'PACK_ORDER', 'order', order.id, { batches: parsed.data.batchAllocations });

  return res.json({ success: true, order });
});

// ============================================================================
// 6. PAYMENTS & WEBHOOKS
// ============================================================================
apiRouter.post('/payments/create-order', (req: Request, res: Response) => {
  const schema = z.object({ orderId: z.string() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const order = dbStore.orders.get(parsed.data.orderId);
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  const gatewayOrderId = `rzp_ord_${Date.now()}`;
  const paymentRecord: PaymentRecord = {
    id: `pay-${Date.now()}`,
    orderId: order.id,
    gatewayOrderId,
    amount: order.payableAmount,
    status: 'initiated',
    idempotencyKey: `idemp-${order.id}-${Date.now()}`,
    signatureVerified: false,
    createdAt: new Date().toISOString()
  };

  dbStore.payments.set(paymentRecord.id, paymentRecord);

  return res.json({
    razorpay_order_id: gatewayOrderId,
    amount: Math.round(order.payableAmount * 100), // in paise
    currency: 'INR',
    key_id: 'rzp_test_MedcureGorakhpurPilot'
  });
});

apiRouter.post('/payments/webhook', (req: Request, res: Response) => {
  const { event, payload } = req.body;
  if (!event || !payload?.payment?.entity) {
    return res.status(400).json({ error: 'Invalid webhook payload.' });
  }

  const rzpOrderId = payload.payment.entity.order_id;
  const payment = Array.from(dbStore.payments.values()).find(p => p.gatewayOrderId === rzpOrderId);
  if (!payment) return res.status(404).json({ error: 'Payment record not found.' });

  if (event === 'order.paid' || event === 'payment.captured') {
    payment.status = 'captured';
    payment.signatureVerified = true;
    payment.gatewayPaymentId = payload.payment.entity.id;

    const order = dbStore.orders.get(payment.orderId);
    if (order && order.state === 'PAYMENT_PENDING') {
      order.state = 'PAYMENT_CONFIRMED';
      order.updatedAt = new Date().toISOString();
      dbStore.recordAudit(undefined, 'PAYMENT_CONFIRMED', 'order', order.id, { rzpPaymentId: payment.gatewayPaymentId });
    }
  }

  return res.json({ status: 'ok', processed: true });
});

// ============================================================================
// 7. RIDER DISPATCH & OTP VERIFICATION
// ============================================================================
apiRouter.post('/dispatch/assign-rider', (req: Request, res: Response) => {
  const schema = z.object({ orderId: z.string(), riderId: z.string() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const order = dbStore.orders.get(parsed.data.orderId);
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  OrderStateMachine.validateTransition(order.state, 'RIDER_ASSIGNED');
  order.state = 'RIDER_ASSIGNED';
  order.riderId = parsed.data.riderId;
  order.updatedAt = new Date().toISOString();

  return res.json({ success: true, order });
});

apiRouter.post('/rider/orders/:id/pickup', (req: Request, res: Response) => {
  const order = dbStore.orders.get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  OrderStateMachine.validateTransition(order.state, 'PICKED_UP');
  order.state = 'PICKED_UP';
  order.updatedAt = new Date().toISOString();

  // Immediately transition to OUT_FOR_DELIVERY
  OrderStateMachine.validateTransition(order.state, 'OUT_FOR_DELIVERY');
  order.state = 'OUT_FOR_DELIVERY';

  return res.json({ success: true, order });
});

apiRouter.post('/rider/location-update', (req: Request, res: Response) => {
  const schema = z.object({
    riderId: z.string(),
    orderId: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    speedKmh: z.number().optional(),
    heading: z.number().optional()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const snapshot = {
    riderId: parsed.data.riderId,
    orderId: parsed.data.orderId,
    latitude: parsed.data.latitude,
    longitude: parsed.data.longitude,
    speedKmh: parsed.data.speedKmh || 22,
    heading: parsed.data.heading || 45,
    recordedAt: new Date().toISOString()
  };

  dbStore.updateRiderLocation(snapshot);
  return res.json({ success: true, snapshot });
});

apiRouter.get('/orders/:id/tracking', (req: Request, res: Response) => {
  const order = dbStore.orders.get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  const pharmacy = dbStore.pharmacies.get(order.pharmacyId);
  const address = dbStore.addresses.get(order.deliveryAddressId);
  const rider = order.riderId ? dbStore.riders.get(order.riderId) : undefined;
  let riderLoc = dbStore.getRiderLocation(order.id);

  // If order is out for delivery and no GPS snapshot yet, generate near pharmacy
  if (!riderLoc && pharmacy) {
    riderLoc = {
      riderId: order.riderId || 'rider-1',
      orderId: order.id,
      latitude: pharmacy.latitude + 0.003,
      longitude: pharmacy.longitude + 0.002,
      speedKmh: 20,
      heading: 45,
      recordedAt: new Date().toISOString()
    };
  }

  // Calculate distance in km (Haversine)
  let distanceKm = 1.2;
  if (riderLoc && address) {
    const R = 6371; // km
    const dLat = (address.latitude - riderLoc.latitude) * Math.PI / 180;
    const dLng = (address.longitude - riderLoc.longitude) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(riderLoc.latitude * Math.PI / 180) * Math.cos(address.latitude * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    distanceKm = Number((R * c).toFixed(2));
  }

  // Dynamic ETA with Golghar traffic buffer
  const speed = riderLoc?.speedKmh && riderLoc.speedKmh > 5 ? riderLoc.speedKmh : 20;
  const transitMinutes = Math.ceil((distanceKm / speed) * 60) + 3;
  const etaMinutes = order.state === 'DELIVERED' ? 0 : Math.max(1, transitMinutes);

  // Stale warning if location update is > 60 seconds old
  const ageSeconds = riderLoc ? Math.floor((Date.now() - new Date(riderLoc.recordedAt).getTime()) / 1000) : 0;
  const isStale = ageSeconds > 60;

  return res.json({
    order_id: order.id,
    order_code: order.orderCode,
    state: order.state,
    eta_minutes: etaMinutes,
    eta_display: order.state === 'DELIVERED' ? 'Delivered' : `Arriving in about ${etaMinutes} mins`,
    distance_km: distanceKm,
    is_stale: isStale,
    stale_warning: isStale ? 'Updating rider location...' : null,
    traffic_status: etaMinutes > 15 ? 'Heavy Traffic' : 'Smooth Transit',
    rider: rider ? {
      id: rider.id,
      name: 'Vikas Yadav',
      phone: '+919876500005',
      vehicle: rider.vehicleType,
      current_cash_in_hand: rider.currentCashInHand
    } : null,
    rider_location: riderLoc,
    pharmacy_location: pharmacy ? { latitude: pharmacy.latitude, longitude: pharmacy.longitude, name: pharmacy.businessName } : null,
    customer_location: address ? { latitude: address.latitude, longitude: address.longitude, address: address.addressLine1 } : null
  });
});

apiRouter.post('/rider/orders/:id/complete-delivery', (req: Request, res: Response) => {
  const schema = z.object({ deliveryOtp: z.string().length(4) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Valid 4-digit OTP is required.' });

  const order = dbStore.orders.get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  if (order.deliveryOtp !== parsed.data.deliveryOtp) {
    return res.status(400).json({ error: 'Incorrect delivery OTP verification code.' });
  }

  // Handle COD cash collection
  let codRecord = null;
  if (order.paymentMode === 'COD') {
    const riderId = order.riderId || 'rider-1';
    codRecord = dbStore.recordCodCollection(order.id, riderId, order.payableAmount);
  }

  OrderStateMachine.validateTransition(order.state, 'DELIVERED');
  order.state = 'DELIVERED';
  order.updatedAt = new Date().toISOString();
  dbStore.recordAudit(order.riderId, 'DELIVERY_COMPLETED', 'order', order.id, {
    completedAt: order.updatedAt,
    paymentMode: order.paymentMode,
    codRecord
  });

  return res.json({
    success: true,
    message: 'Package handed over and order delivered.',
    order,
    cod_collection: codRecord
  });
});

// ============================================================================
// 8. AI ASSISTANT (STRICT DOMAIN BOUNDARY)
// ============================================================================
apiRouter.post('/ai/chat', async (req: Request, res: Response) => {
  const schema = z.object({
    prompt: z.string().min(1),
    userId: z.string().optional()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const result = await MedcureAIAssistant.processCustomerPrompt(parsed.data.prompt, parsed.data.userId);
  return res.json(result);
});

// ============================================================================
// 9. AUDIT & COD RECONCILIATION
// ============================================================================
apiRouter.get('/admin/cod/reconciliation', (_req: Request, res: Response) => {
  const riders = Array.from(dbStore.riders.values()).map(r => {
    const user = dbStore.users.get(r.userId);
    return {
      ...r,
      name: user?.fullName || 'Vikas Yadav',
      phone: user?.phone || '+919876500005'
    };
  });
  const collections = Array.from(dbStore.codCollections.values());
  const settlements = Array.from(dbStore.codSettlements.values());
  const totalOutstandingCash = riders.reduce((sum, r) => sum + r.currentCashInHand, 0);

  return res.json({
    total_outstanding_cash: totalOutstandingCash,
    riders,
    collections,
    settlements
  });
});

apiRouter.post('/admin/cod/settle', (req: Request, res: Response) => {
  const schema = z.object({
    riderId: z.string(),
    amount: z.number().positive(),
    depositReference: z.string().min(3),
    verifiedBy: z.string().default('usr-admin-1')
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const rider = dbStore.riders.get(parsed.data.riderId);
  if (!rider) return res.status(404).json({ error: 'Rider not found.' });

  if (parsed.data.amount > rider.currentCashInHand) {
    return res.status(400).json({
      error: `Deposit amount ₹${parsed.data.amount} exceeds current cash-in-hand ₹${rider.currentCashInHand}.`
    });
  }

  const record = dbStore.recordCodSettlement(
    parsed.data.riderId,
    parsed.data.amount,
    parsed.data.depositReference,
    parsed.data.verifiedBy
  );

  dbStore.recordAudit(parsed.data.verifiedBy, 'COD_SETTLEMENT', 'rider', rider.id, record);

  return res.json({
    success: true,
    message: `₹${record.amountDeposited} settled successfully for rider ${rider.vehicleRegistrationNumber}.`,
    settlement: record,
    remaining_cash_in_hand: rider.currentCashInHand
  });
});

apiRouter.get('/admin/audit-logs', (_req: Request, res: Response) => {
  return res.json({ logs: dbStore.auditEvents });
});
