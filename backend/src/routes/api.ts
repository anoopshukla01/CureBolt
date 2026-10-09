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

apiRouter.get('/catalogue/products', (req: Request, res: Response) => {
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

apiRouter.get('/catalogue/products/:id', (req: Request, res: Response) => {
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
  const initialState = requiresRx ? 'PHARMACY_REVIEW' : 'PAYMENT_PENDING';
  const orderId = `ord-${Date.now()}`;
  const randomOtp = Math.floor(1000 + Math.random() * 9000).toString();

  const newOrder: Order = {
    id: orderId,
    orderCode: `MC-GKP-${Math.floor(10000 + Math.random() * 90000)}`,
    userId: parsed.data.userId,
    pharmacyId: parsed.data.pharmacyId,
    deliveryAddressId: parsed.data.deliveryAddressId,
    categoryDomain: parsed.data.categoryDomain,
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
  dbStore.recordAudit(parsed.data.userId, 'CREATE_ORDER', 'order', newOrder.id, { state: initialState, itemsCount: orderItems.length });

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

  // Next move to PAYMENT_PENDING
  OrderStateMachine.validateTransition(order.state, 'PAYMENT_PENDING');
  order.state = 'PAYMENT_PENDING';

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

apiRouter.post('/rider/orders/:id/complete-delivery', (req: Request, res: Response) => {
  const schema = z.object({ deliveryOtp: z.string().length(4) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Valid 4-digit OTP is required.' });

  const order = dbStore.orders.get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  if (order.deliveryOtp !== parsed.data.deliveryOtp) {
    return res.status(400).json({ error: 'Incorrect delivery OTP verification code.' });
  }

  OrderStateMachine.validateTransition(order.state, 'DELIVERED');
  order.state = 'DELIVERED';
  order.updatedAt = new Date().toISOString();
  dbStore.recordAudit(order.riderId, 'DELIVERY_COMPLETED', 'order', order.id, { completedAt: order.updatedAt });

  return res.json({ success: true, message: 'Package handed over and order delivered.', order });
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
// 9. AUDIT & SYSTEM STATUS
// ============================================================================
apiRouter.get('/admin/audit-logs', (_req: Request, res: Response) => {
  return res.json({ logs: dbStore.auditEvents });
});
