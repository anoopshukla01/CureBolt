import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { dbStore } from '../store';
import { OrderStateMachine } from '../services/orderStateMachine';
import { AssignmentEngine } from '../services/assignmentEngine';
import { MedcureAIAssistant } from '../services/aiService';
import { Order, OrderItem, Prescription } from '../types';
import { authRateLimiter, searchRateLimiter, paymentRateLimiter, aiRateLimiter } from '../middleware/security';

export const apiRouter = Router();

// Gorakhpur Pilot Bounding Box (Latitude ~26.70 to 26.85, Longitude ~83.30 to 83.45)
const GORAKHPUR_BOUNDS = {
  minLat: 26.65,
  maxLat: 26.88,
  minLng: 83.25,
  maxLng: 83.48
};

// ============================================================================
// ============================================================================
// 1. AUTH & PROFILES (Milestone 1)
// ============================================================================

interface OtpTracker {
  code: string;
  createdAt: number;
  resendAttemptsThisHour: number;
  lastResentAt: number;
  failedAttempts: number;
  lockedUntil: number;
}
const otpState = new Map<string, OtpTracker>();

function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  const tenDigits = digits.length >= 10 ? digits.slice(-10) : digits;
  if (/^[6-9]\d{9}$/.test(tenDigits)) {
    return `+91${tenDigits}`;
  }
  return null;
}

function handleOtpRequest(req: Request, res: Response) {
  const schema = z.object({ phone: z.string().min(10) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Valid 10-digit Indian mobile number starting with 6-9 is required.' });
  }

  const normalized = normalizePhone(parsed.data.phone);
  if (!normalized) {
    return res.status(400).json({ 
      error: 'Invalid phone number format. Must be a valid 10-digit number starting with 6, 7, 8, or 9.' 
    });
  }

  const now = Date.now();
  let tracker = otpState.get(normalized);

  if (tracker) {
    if (tracker.lockedUntil > now) {
      const waitMinutes = Math.ceil((tracker.lockedUntil - now) / 60000);
      return res.status(429).json({ 
        error: `Too many failed attempts. Mobile number locked for ${waitMinutes} more minute(s).` 
      });
    }

    // 30 seconds cooldown between resends
    if (now - tracker.lastResentAt < 30000) {
      const waitSeconds = Math.ceil((30000 - (now - tracker.lastResentAt)) / 1000);
      return res.status(429).json({ 
        error: `Please wait ${waitSeconds}s before requesting a new OTP.` 
      });
    }

    // At most 5 resends per hour
    if (now - tracker.createdAt < 3600000 && tracker.resendAttemptsThisHour >= 5) {
      return res.status(429).json({ 
        error: 'Exceeded maximum 5 OTP requests per hour. Please try again later.' 
      });
    }
  }

  const otpCode = '123456'; // Deterministic test OTP for development/pilot
  const attempts = tracker && (now - tracker.createdAt < 3600000) ? tracker.resendAttemptsThisHour + 1 : 1;

  otpState.set(normalized, {
    code: otpCode,
    createdAt: now,
    resendAttemptsThisHour: attempts,
    lastResentAt: now,
    failedAttempts: 0,
    lockedUntil: 0
  });

  return res.json({
    success: true,
    session_id: `sess-${Date.now()}`,
    expires_in: 300,
    cooldown_seconds: 30,
    message: 'OTP sent successfully (Development Test OTP: 123456 / 1234)'
  });
}

function handleOtpVerify(req: Request, res: Response) {
  const schema = z.object({
    phone: z.string().min(10),
    otp: z.string().min(4).max(6)
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Valid phone and OTP required.' });
  }

  const normalized = normalizePhone(parsed.data.phone);
  if (!normalized) {
    return res.status(400).json({ error: 'Invalid phone number format.' });
  }

  const now = Date.now();
  const tracker = otpState.get(normalized);

  if (tracker && tracker.lockedUntil > now) {
    const waitMinutes = Math.ceil((tracker.lockedUntil - now) / 60000);
    return res.status(429).json({ 
      error: `Too many failed attempts. Mobile number locked for ${waitMinutes} more minute(s).` 
    });
  }

  // Check expiration (valid for 5 minutes = 300s)
  if (tracker && (now - tracker.lastResentAt > 300000)) {
    return res.status(401).json({ error: 'OTP has expired. Please request a new OTP.' });
  }

  const isDevCode = parsed.data.otp === '123456' || parsed.data.otp === '1234';
  const isMatch = isDevCode || (tracker && tracker.code === parsed.data.otp);

  if (!isMatch) {
    if (tracker) {
      tracker.failedAttempts += 1;
      if (tracker.failedAttempts >= 5) {
        tracker.lockedUntil = now + 15 * 60 * 1000; // 15-minute lockout
        return res.status(429).json({ 
          error: 'Maximum 5 wrong attempts reached. Account locked for 15 minutes.' 
        });
      }
    }
    const remaining = tracker ? 5 - tracker.failedAttempts : 4;
    return res.status(401).json({ 
      error: `Invalid OTP code. ${remaining} attempt(s) remaining before temporary lockout.` 
    });
  }

  // Reset failed attempts on success
  if (tracker) {
    tracker.failedAttempts = 0;
  }

  let user = Array.from(dbStore.users.values()).find(u => u.phone.includes(normalized.slice(-10)));
  const isNewUser = !user || !user.fullName || user.fullName === 'Medcure Customer';

  if (!user) {
    user = {
      id: `usr-${Date.now()}`,
      phone: normalized,
      fullName: 'Medcure Customer',
      role: 'customer',
      isActive: true
    };
    dbStore.users.set(user.id, user);
  }

  const token = `jwt-mock-${user.id}-${Date.now()}`;
  return res.json({
    token,
    user,
    is_new_user: isNewUser
  });
}

apiRouter.post('/auth/request-otp', authRateLimiter.getMiddleware(), handleOtpRequest);
apiRouter.post('/auth/otp/request', authRateLimiter.getMiddleware(), handleOtpRequest);

apiRouter.post('/auth/verify-otp', authRateLimiter.getMiddleware(), handleOtpVerify);
apiRouter.post('/auth/otp/verify', authRateLimiter.getMiddleware(), handleOtpVerify);

// Milestone B1: Remote App Config & Force-Update Checker
apiRouter.get('/config/app', (req: Request, res: Response) => {
  const appId = (req.query.appId as string) || 'com.medcure.customer';
  const clientVersion = (req.query.version as string) || '1.0.0';

  const config = dbStore.appConfigs.get(appId) || dbStore.appConfigs.get('com.medcure.customer');
  if (!config) {
    return res.status(404).json({ error: `Configuration for app ${appId} not found.` });
  }

  const isOlder = (v1: string, v2: string) => {
    const parts1 = v1.split('.').map(s => parseInt(s, 10) || 0);
    const parts2 = v2.split('.').map(s => parseInt(s, 10) || 0);
    for (let i = 0; i < 3; i++) {
      const p1 = parts1[i] ?? 0;
      const p2 = parts2[i] ?? 0;
      if (p1 < p2) return true;
      if (p1 > p2) return false;
    }
    return false;
  };

  const updateRequired = isOlder(clientVersion, config.minSupportedVersion);

  return res.json({
    appId: config.appId,
    appName: config.appName,
    minSupportedVersion: config.minSupportedVersion,
    latestVersion: config.latestVersion,
    clientVersion,
    updateRequired,
    forceUpdateTitle: config.forceUpdateTitle,
    forceUpdateMessage: config.forceUpdateMessage,
    storeUrl: req.query.platform === 'ios' ? config.storeUrlIos : config.storeUrlAndroid,
    maintenanceMode: config.maintenanceMode,
    maintenanceMessage: config.maintenanceMode ? 'System maintenance in progress' : null
  });
});

// Milestone B1: Multi-App Separate Login Scope & Role Gate
apiRouter.post('/auth/app-session', (req: Request, res: Response) => {
  const schema = z.object({
    appId: z.enum(['com.medcure.customer', 'com.medcure.rider', 'com.medcure.shop', 'in.medcure.merchant']),
    appVersion: z.string().default('1.0.0'),
    platform: z.enum(['android', 'ios', 'web']).default('android'),
    deviceInfo: z.string().default('Mobile Device')
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Valid appId and appVersion required for app session verification.' });
  }

  const authHeader = req.headers.authorization;
  let userId = (req.headers['x-user-id'] as string) || null;
  if (!userId && authHeader) {
    const raw = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (raw.startsWith('jwt-mock-')) {
      const rest = raw.slice('jwt-mock-'.length);
      const lastHyphen = rest.lastIndexOf('-');
      userId = lastHyphen !== -1 ? rest.substring(0, lastHyphen) : rest;
    } else {
      userId = raw;
    }
  }

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required to validate app session.' });
  }

  const user = dbStore.users.get(userId);
  if (!user) {
    return res.status(404).json({ error: 'User account not found.' });
  }

  const config = dbStore.appConfigs.get(parsed.data.appId);
  if (!config) {
    return res.status(404).json({ error: 'App configuration not found.' });
  }

  // Strictly check if account holds an allowed role in this specific app
  if (!config.allowedRoles.includes(user.role)) {
    return res.status(403).json({
      error: "This account can't use this app",
      message: `Your account role '${user.role}' is not authorized to access ${config.appName}. Please sign in to the appropriate Medcure app.`,
      currentRole: user.role,
      allowedRoles: config.allowedRoles
    });
  }

  return res.json({
    sessionValid: true,
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      phone: user.phone
    },
    appId: parsed.data.appId,
    appVersion: parsed.data.appVersion,
    allowedScopes: config.allowedRoles
  });
});

function getUserIdFromRequest(req: Request): string | null {
  if (req.headers['x-user-id']) return req.headers['x-user-id'] as string;
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const raw = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (raw.startsWith('jwt-mock-')) {
    const rest = raw.slice('jwt-mock-'.length);
    const lastHyphen = rest.lastIndexOf('-');
    return lastHyphen !== -1 ? rest.substring(0, lastHyphen) : rest;
  }
  return raw;
}

function handleGetMe(req: Request, res: Response) {
  const userId = getUserIdFromRequest(req) || 'usr-cust-1';
  const user = dbStore.users.get(userId) || dbStore.users.get('usr-cust-1');
  return res.json({ user });
}

apiRouter.get('/users/me', handleGetMe);
apiRouter.get('/me', handleGetMe);

apiRouter.put('/me/profile', (req: Request, res: Response) => {
  const userId = getUserIdFromRequest(req) || 'usr-cust-1';
  let user = dbStore.users.get(userId);

  if (!user) {
    return res.status(404).json({ error: 'User profile not found.' });
  }

  const schema = z.object({
    fullName: z.string().min(2).max(60).regex(/^[a-zA-Z\s.'-]+$/, 'Name can only contain letters, spaces, full stops, apostrophes and hyphens'),
    dateOfBirth: z.string(), // ISO string YYYY-MM-DD or DD/MM/YYYY
    termsAccepted: z.boolean(),
    termsVersion: z.string().optional().default('v1.0-2026')
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid profile data.' });
  }

  if (!parsed.data.termsAccepted) {
    return res.status(400).json({ error: 'You must accept the Terms of Service and Privacy Policy to continue.' });
  }

  // Parse DOB and validate age >= 18
  let dob: Date;
  if (parsed.data.dateOfBirth.includes('/')) {
    const parts = parsed.data.dateOfBirth.split('/');
    dob = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
  } else {
    dob = new Date(parsed.data.dateOfBirth);
  }

  if (isNaN(dob.getTime())) {
    return res.status(400).json({ error: 'Invalid Date of Birth format.' });
  }

  const today = new Date();
  if (dob > today) {
    return res.status(400).json({ error: 'Date of Birth cannot be in the future.' });
  }

  // Calculate age accurately across leap years and day boundaries
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  if (age < 18) {
    user.isMinorBlocked = true;
    dbStore.users.set(user.id, user);
    dbStore.recordAudit(user.id, 'UNDERAGE_REGISTRATION_REJECTED', 'user', user.id, {
      calculatedAge: age,
      dob: dob.toISOString().split('T')[0]
    });
    return res.status(403).json({
      error: 'You must be at least 18 years of age to use Medcure medicine delivery services. Access cannot be granted to minors.'
    });
  }

  if (age > 120) {
    return res.status(400).json({ error: 'Date of Birth exceeds maximum valid human age (120 years).' });
  }

  const formattedDob = dob.toISOString().split('T')[0];

  // Statutory data-minimization & immutability: DOB change requires support request
  if (user.dateOfBirth && user.dateOfBirth !== formattedDob) {
    return res.status(400).json({
      error: 'Date of Birth cannot be modified directly once established. Please submit a compliance support ticket to request a date of birth change.'
    });
  }

  // Update profile
  const action = user.dateOfBirth ? 'CUSTOMER_PROFILE_UPDATED' : 'CUSTOMER_PROFILE_CREATED';
  user.fullName = parsed.data.fullName.trim();
  user.dateOfBirth = formattedDob;
  user.termsVersion = parsed.data.termsVersion || 'v1.0.0';
  user.termsAcceptedAt = new Date().toISOString();
  dbStore.users.set(user.id, user);

  dbStore.recordAudit(user.id, action, 'user', user.id, {
    fullName: user.fullName,
    termsVersion: user.termsVersion,
    calculatedAge: age
  });

  return res.json({
    success: true,
    user,
    message: 'Profile updated successfully.'
  });
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

apiRouter.get(['/catalogue/products', '/products'], searchRateLimiter.getMiddleware(), (req: Request, res: Response) => {
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
});apiRouter.post('/orders', (req: Request, res: Response) => {
  // Idempotency check
  const idempotencyKey = req.header('Idempotency-Key') || req.header('idempotency-key');
  if (idempotencyKey) {
    const cached = dbStore.idempotencyKeys.get(idempotencyKey);
    if (cached) {
      return res.status(cached.statusCode).json(cached.body);
    }
  }

  const schema = z.object({
    userId: z.string(),
    pharmacyId: z.string(),
    deliveryAddressId: z.string(),
    categoryDomain: z.enum(['human', 'veterinary']),
    paymentMode: z.enum(['ONLINE', 'COD']).default('ONLINE'),
    deliveryNote: z.string().max(200).optional(),
    receiverName: z.string().optional(),
    receiverPhone: z.string().optional(),
    items: z.array(z.object({
      productId: z.string(),
      quantity: z.number().int().positive()
    })),
    prescriptionId: z.string().optional()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid order payload' });
  }

  // 1. Authenticate user & age rule
  const user = dbStore.users.get(parsed.data.userId);
  if (user && user.dateOfBirth) {
    const dob = new Date(user.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    if (age < 18) {
      return res.status(403).json({ error: 'Customer is under minimum age (18+) for medicine delivery.' });
    }
  }

  // 2. Validate Pharmacy
  const pharmacy = dbStore.pharmacies.get(parsed.data.pharmacyId);
  if (!pharmacy || !pharmacy.isActive || !pharmacy.isVerified) {
    return res.status(400).json({ error: 'Selected pharmacy is inactive, suspended, or unverified.' });
  }

  // 3. Validate Address & Serviceability in Gorakhpur
  const address = dbStore.addresses.get(parsed.data.deliveryAddressId);
  if (address) {
    const inGorakhpur = 
      address.latitude >= GORAKHPUR_BOUNDS.minLat && 
      address.latitude <= GORAKHPUR_BOUNDS.maxLat && 
      address.longitude >= GORAKHPUR_BOUNDS.minLng && 
      address.longitude <= GORAKHPUR_BOUNDS.maxLng;
    if (!inGorakhpur) {
      return res.status(400).json({ error: 'Delivery address is outside Gorakhpur serviceable zones.' });
    }
  }

  // 4. Validate Delivery Note (no medical dosage instructions allowed)
  if (parsed.data.deliveryNote) {
    const noteLower = parsed.data.deliveryNote.toLowerCase();
    if (noteLower.includes('dosage') || noteLower.includes('mg') || noteLower.includes('prescribe') || noteLower.includes('substitute')) {
      return res.status(400).json({ 
        error: 'Delivery note cannot contain medical advice, substitution requests, or dosage instructions.' 
      });
    }
  }

  const paymentMode = parsed.data.paymentMode;

  // 5. Check Prescription requirement
  let requiresRx = false;
  const perItemErrors: Array<{ productId: string; error: string }> = [];

  for (const it of parsed.data.items) {
    const prod = dbStore.products.get(it.productId);
    if (!prod) {
      perItemErrors.push({ productId: it.productId, error: 'Product not found in verified catalogue.' });
      continue;
    }
    if (prod.requiresPrescription) {
      requiresRx = true;
    }

    const inv = Array.from(dbStore.inventory.values()).find(
      i => i.pharmacyId === parsed.data.pharmacyId && i.productId === it.productId
    );
    if (!inv || inv.availableQuantity < it.quantity) {
      perItemErrors.push({ 
        productId: it.productId, 
        error: `Insufficient stock available at ${pharmacy.businessName}.` 
      });
    } else if (inv.sellingPrice > inv.mrp) {
      perItemErrors.push({ 
        productId: it.productId, 
        error: 'Statutory violation: Selling price exceeds MRP.' 
      });
    }
  }

  if (perItemErrors.length > 0) {
    return res.status(400).json({ 
      error: 'Order validation failed for one or more items.',
      itemErrors: perItemErrors 
    });
  }

  if (requiresRx && !parsed.data.prescriptionId) {
    return res.status(400).json({
      error: 'Order contains prescription-required products (Schedule H/Veterinary). A valid prescription must be attached.'
    });
  }

  // 6. Atomically reserve inventory & create reservation rows
  const reserved = dbStore.reserveInventory(parsed.data.pharmacyId, parsed.data.items);
  if (!reserved) {
    return res.status(409).json({ error: 'One or more items are out of stock or over-allocated.' });
  }

  const orderId = `ord-${Date.now()}`;
  const reservationExpiry = new Date(Date.now() + (paymentMode === 'ONLINE' ? 10 : 30) * 60 * 1000).toISOString();

  for (const it of parsed.data.items) {
    const resId = `res-${orderId}-${it.productId}`;
    dbStore.reservations.set(resId, {
      id: resId,
      orderId,
      pharmacyId: parsed.data.pharmacyId,
      productId: it.productId,
      quantity: it.quantity,
      expiresAt: reservationExpiry,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    });
  }

  // 7. Money Rule: Strict Integer Calculations in PAISE
  let itemTotalPaise = 0;
  let totalMrpPaise = 0;
  const orderItems: OrderItem[] = [];

  for (const it of parsed.data.items) {
    const prod = dbStore.products.get(it.productId)!;
    const inv = Array.from(dbStore.inventory.values()).find(
      i => i.pharmacyId === parsed.data.pharmacyId && i.productId === it.productId
    )!;

    const unitPricePaise = Math.round(inv.sellingPrice * 100);
    const unitMrpPaise = Math.round(inv.mrp * 100);
    const lineTotalPaise = unitPricePaise * it.quantity;

    itemTotalPaise += lineTotalPaise;
    totalMrpPaise += unitMrpPaise * it.quantity;

    orderItems.push({
      productId: prod.id,
      productName: prod.name,
      packSizeSnapshot: prod.packSize,
      unitPrice: inv.sellingPrice,
      unitPricePaise,
      unitMrpPaise,
      quantity: it.quantity,
      lineTotalPaise,
      requiresPrescription: prod.requiresPrescription
    });
  }

  // Delivery fee: Free over ₹500 (50,000 paise), else ₹25 (2,500 paise)
  const deliveryFeePaise = itemTotalPaise >= 50000 ? 0 : 2500;
  const handlingFeePaise = 500; // ₹5 platform & handling fee
  const discountPaise = totalMrpPaise > itemTotalPaise ? totalMrpPaise - itemTotalPaise : 0;
  const payableAmountPaise = itemTotalPaise + deliveryFeePaise + handlingFeePaise;

  // Rupee conversions for display compatibility
  const subtotal = itemTotalPaise / 100;
  const totalMrp = totalMrpPaise / 100;
  const deliveryFee = deliveryFeePaise / 100;
  const payable = payableAmountPaise / 100;

  // Determine initial state
  let initialState: any;
  if (requiresRx) {
    initialState = 'PHARMACY_REVIEW';
  } else if (paymentMode === 'COD') {
    initialState = 'ACCEPTED';
  } else {
    initialState = 'PAYMENT_PENDING';
  }

  const randomOtp = Math.floor(1000 + Math.random() * 9000).toString();
  const orderCode = `MC-GKP-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

  const newOrder: Order = {
    id: orderId,
    orderCode,
    userId: parsed.data.userId,
    pharmacyId: parsed.data.pharmacyId,
    pharmacyNameSnapshot: pharmacy.businessName,
    deliveryAddressId: parsed.data.deliveryAddressId,
    deliveryAddressSnapshot: address ? {
      line1: address.addressLine1,
      line2: address.addressLine2,
      landmark: address.landmark,
      city: address.city,
      pincode: address.pincode
    } : undefined,
    receiverName: parsed.data.receiverName || user?.fullName || 'Customer',
    receiverPhone: parsed.data.receiverPhone || user?.phone || '',
    deliveryNote: parsed.data.deliveryNote,
    categoryDomain: parsed.data.categoryDomain,
    paymentMode,
    state: initialState,
    items: orderItems,
    prescriptionId: parsed.data.prescriptionId,
    totalMrp,
    totalDiscount: discountPaise / 100,
    deliveryFee,
    taxes: 0, // Medicine MRP is statutory tax-inclusive
    payableAmount: payable,
    // Integer Paise fields
    itemTotalPaise,
    deliveryFeePaise,
    handlingFeePaise,
    discountPaise,
    payableAmountPaise,
    deliveryOtp: randomOtp,
    idempotencyKey,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  dbStore.orders.set(newOrder.id, newOrder);

  // 8. Order Status History Entry
  const historyEntries = dbStore.orderStatusHistory.get(newOrder.id) || [];
  historyEntries.push({
    id: `osh-${Date.now()}`,
    orderId: newOrder.id,
    fromState: undefined,
    toState: initialState,
    actorId: parsed.data.userId,
    actorRole: 'customer',
    reason: 'Initial order placement at checkout',
    createdAt: new Date().toISOString()
  });
  dbStore.orderStatusHistory.set(newOrder.id, historyEntries);

  // Audit event
  dbStore.recordAudit(parsed.data.userId, 'CREATE_ORDER', 'order', newOrder.id, {
    state: initialState,
    paymentMode,
    itemsCount: orderItems.length,
    payableAmountPaise
  });

  const responseBody = { order: newOrder };

  // 9. Cache in Idempotency store if key was provided
  if (idempotencyKey) {
    dbStore.idempotencyKeys.set(idempotencyKey, {
      userId: parsed.data.userId,
      statusCode: 201,
      body: responseBody,
      createdAt: Date.now()
    });
  }

  return res.status(201).json(responseBody);
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
// 5A. MERCHANT (PHARMACY) AUTH, ONBOARDING & VERIFICATION (Milestone P1)
// ============================================================================

apiRouter.post('/pharmacy/auth/login', authRateLimiter.getMiddleware(), (req: Request, res: Response) => {
  const schema = z.object({
    phoneOrEmail: z.string().min(5),
    role: z.enum(['pharmacy_owner', 'pharmacist', 'pharmacy_staff']).optional(),
    deviceInfo: z.string().default('Web Browser / Counter PC')
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Valid phone/email required for merchant sign-in.' });
  }

  // Find user among seeded pharmacy users
  let user = Array.from(dbStore.users.values()).find(
    u => (u.phone.includes(parsed.data.phoneOrEmail) || (u.email && u.email.includes(parsed.data.phoneOrEmail)))
  );

  // If role was explicitly specified, find or match
  if (parsed.data.role && (!user || user.role !== parsed.data.role)) {
    user = Array.from(dbStore.users.values()).find(u => u.role === parsed.data.role);
  }

  if (!user || !['pharmacy_owner', 'pharmacist', 'pharmacy_staff', 'platform_admin'].includes(user.role)) {
    return res.status(403).json({ 
      error: 'Access denied. Account is not registered as a pharmacy merchant or authorised professional.' 
    });
  }

  const token = `jwt-pharm-${user.id}-${Date.now()}`;
  const sessionId = `sess-${Date.now()}`;

  dbStore.userSessions.set(sessionId, {
    id: sessionId,
    userId: user.id,
    deviceInfo: parsed.data.deviceInfo,
    tokenHash: Buffer.from(token).toString('base64'),
    expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // 12-hour shift session
    isRevoked: false,
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString()
  });

  return res.json({
    token,
    user,
    pharmacyId: 'pharm-gkp-1',
    role: user.role,
    capabilities: {
      canManageStaff: user.role === 'pharmacy_owner',
      canReviewPrescriptions: user.role === 'pharmacist' || (user.role === 'pharmacy_owner' && user.id === 'usr-owner-1'),
      canAcceptOrders: true,
      canPackOrders: true,
      canViewReports: user.role === 'pharmacy_owner',
      canManageInventory: user.role === 'pharmacy_owner' || user.role === 'pharmacist'
    }
  });
});

apiRouter.post('/pharmacy/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const userId = authHeader ? authHeader.replace('Bearer ', '').split('-')[2] : 'usr-owner-1';
  for (const session of dbStore.userSessions.values()) {
    if (session.userId === userId) {
      session.isRevoked = true;
    }
  }
  return res.json({ success: true, message: 'Logged out successfully.' });
});

apiRouter.get('/pharmacy/auth/sessions', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const userId = (req.headers['x-user-id'] as string) || (authHeader ? authHeader.replace('Bearer ', '').split('-')[2] : 'usr-owner-1');
  const sessions = Array.from(dbStore.userSessions.values())
    .filter(s => s.userId === userId && !s.isRevoked)
    .map(s => ({
      id: s.id,
      deviceInfo: s.deviceInfo,
      ipAddress: '127.0.0.1',
      lastActiveAt: s.lastActiveAt,
      expiresAt: s.expiresAt,
      isCurrent: true
    }));
  return res.json({ sessions });
});

apiRouter.post('/pharmacy/auth/revoke-all-sessions', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const userId = (req.headers['x-user-id'] as string) || (authHeader ? authHeader.replace('Bearer ', '').split('-')[2] : 'usr-owner-1');
  let revokedCount = 0;
  for (const session of dbStore.userSessions.values()) {
    if (session.userId === userId) {
      session.isRevoked = true;
      revokedCount++;
    }
  }
  return res.json({ success: true, message: `Revoked ${revokedCount} session(s).` });
});

apiRouter.get('/pharmacy/onboarding/application', (req: Request, res: Response) => {
  const pharmacyId = (req.query.pharmacyId as string) || 'pharm-gkp-1';
  let app = Array.from(dbStore.onboardingApplications.values()).find(
    a => a.pharmacyId === pharmacyId
  );

  if (!app) {
    app = Array.from(dbStore.onboardingApplications.values())[0];
  }

  if (!app) {
    return res.status(404).json({ error: 'Onboarding application not found.' });
  }

  // Calculate licence expiry warnings
  const expiryDate = new Date(app.licenceExpiryDate);
  const now = new Date();
  const diffTime = expiryDate.getTime() - now.getTime();
  const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let expiryStatus = 'valid';
  let warningMessage: string | null = null;

  if (daysUntilExpiry <= 0) {
    expiryStatus = 'expired';
    warningMessage = 'CRITICAL: Drug sale licence has expired. Partner visibility has been suspended.';
  } else if (daysUntilExpiry <= 7) {
    expiryStatus = 'urgent_warning';
    warningMessage = `URGENT: Licence expires in ${daysUntilExpiry} days. Auto-suspension occurs upon expiry.`;
  } else if (daysUntilExpiry <= 30) {
    expiryStatus = 'warning_30d';
    warningMessage = `Notice: Licence expires in ${daysUntilExpiry} days. Please renew with UP FDA.`;
  } else if (daysUntilExpiry <= 60) {
    expiryStatus = 'notice_60d';
    warningMessage = `Advance Notice: Licence renewal due in ${daysUntilExpiry} days.`;
  }

  return res.json({
    application: app,
    licenceStatus: {
      daysUntilExpiry,
      expiryStatus,
      warningMessage,
      isExpired: daysUntilExpiry <= 0
    }
  });
});

apiRouter.post('/pharmacy/onboarding/application', (req: Request, res: Response) => {
  const schema = z.object({
    businessName: z.string().min(3),
    legalEntityName: z.string().min(3),
    gstin: z.string().optional(),
    addressLine1: z.string().min(5),
    city: z.string().default('Gorakhpur'),
    pincode: z.string().min(6),
    latitude: z.number(),
    longitude: z.number(),
    authorisedRepresentativeName: z.string().min(2),
    authorisedRepresentativePhone: z.string().min(10),
    licenceForm20: z.string().min(5),
    licenceForm21: z.string().optional(),
    licenceExpiryDate: z.string(),
    pharmacistName: z.string().min(2),
    pharmacistRegNumber: z.string().min(4),
    pharmacistCouncil: z.string().default('Uttar Pradesh Pharmacy Council'),
    bankAccountMasked: z.string().optional(),
    bankIfsc: z.string().optional()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid application payload' });
  }

  const appId = `app-${Date.now()}`;
  const newApp: PharmacyOnboardingApplication = {
    id: appId,
    ownerUserId: 'usr-owner-1',
    businessName: parsed.data.businessName,
    legalEntityName: parsed.data.legalEntityName,
    gstin: parsed.data.gstin,
    addressLine1: parsed.data.addressLine1,
    city: parsed.data.city,
    pincode: parsed.data.pincode,
    latitude: parsed.data.latitude,
    longitude: parsed.data.longitude,
    operatingHours: { open: '08:00', close: '22:00' },
    deliveryRadiusM: 5000,
    authorisedRepresentativeName: parsed.data.authorisedRepresentativeName,
    authorisedRepresentativePhone: parsed.data.authorisedRepresentativePhone,
    licenceForm20: parsed.data.licenceForm20,
    licenceForm21: parsed.data.licenceForm21,
    licenceExpiryDate: parsed.data.licenceExpiryDate,
    licenceDocPath: '/vault/draft_licence.pdf',
    premisesDocPath: '/vault/draft_premises.pdf',
    idDocPath: '/vault/draft_id.pdf',
    pharmacistName: parsed.data.pharmacistName,
    pharmacistRegNumber: parsed.data.pharmacistRegNumber,
    pharmacistCouncil: parsed.data.pharmacistCouncil,
    pharmacistRegDocPath: '/vault/draft_reg.pdf',
    bankAccountMasked: parsed.data.bankAccountMasked,
    bankIfsc: parsed.data.bankIfsc,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  dbStore.onboardingApplications.set(newApp.id, newApp);
  return res.status(201).json({ success: true, application: newApp });
});

apiRouter.post('/pharmacy/onboarding/submit', (req: Request, res: Response) => {
  const schema = z.object({ applicationId: z.string() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Valid applicationId required.' });
  }

  const app = dbStore.onboardingApplications.get(parsed.data.applicationId);
  if (!app) {
    return res.status(404).json({ error: 'Application not found.' });
  }

  if (app.status === 'verified') {
    return res.status(400).json({ error: 'Application is already verified.' });
  }

  app.status = 'submitted';
  app.updatedAt = new Date().toISOString();
  dbStore.recordAudit('usr-owner-1', 'SUBMIT_ONBOARDING_APPLICATION', 'pharmacy_application', app.id, {
    status: 'submitted'
  });

  return res.json({
    success: true,
    message: 'Application submitted for platform compliance review.',
    application: app
  });
});

apiRouter.post('/admin/pharmacy-applications/:id/review', (req: Request, res: Response) => {
  const schema = z.object({
    status: z.enum(['verified', 'needs_changes', 'suspended']),
    reviewerComments: z.string().min(5)
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Valid status decision and reviewer comments required.' });
  }

  const app = dbStore.onboardingApplications.get(req.params.id);
  if (!app) {
    return res.status(404).json({ error: 'Application not found.' });
  }

  app.status = parsed.data.status;
  app.reviewerComments = parsed.data.reviewerComments;
  app.reviewedBy = 'usr-admin-1';
  app.reviewedAt = new Date().toISOString();
  app.updatedAt = new Date().toISOString();

  // If verified, activate pharmacy
  if (app.pharmacyId && parsed.data.status === 'verified') {
    const pharm = dbStore.pharmacies.get(app.pharmacyId);
    if (pharm) {
      pharm.isVerified = true;
      pharm.isActive = true;
    }
  } else if (app.pharmacyId && parsed.data.status === 'suspended') {
    const pharm = dbStore.pharmacies.get(app.pharmacyId);
    if (pharm) {
      pharm.isActive = false;
    }
  }

  dbStore.recordAudit('usr-admin-1', 'REVIEW_PHARMACY_APPLICATION', 'pharmacy_application', app.id, {
    status: parsed.data.status,
    comments: parsed.data.reviewerComments
  });

  return res.json({ success: true, application: app });
});

// ============================================================================
// 5B. PHARMACY OPERATIONS & PRESCRIPTION REVIEW
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
// 5B. PHARMACY INVENTORY & MEDICINE IMPORTER
// ============================================================================
apiRouter.get('/pharmacy/inventory', (req: Request, res: Response) => {
  const pharmacyId = req.query.pharmacyId as string || 'pharm-gkp-1';
  const inv = Array.from(dbStore.inventory.values()).filter(i => i.pharmacyId === pharmacyId);
  const items = inv.map(i => {
    const product = dbStore.products.get(i.productId);
    return {
      inventoryId: i.id,
      pharmacyId: i.pharmacyId,
      productId: i.productId,
      product,
      availableQuantity: i.availableQuantity,
      reservedQuantity: i.reservedQuantity,
      mrp: i.mrp,
      sellingPrice: i.sellingPrice,
      isAvailableOverride: i.isAvailableOverride,
      batches: i.batches
    };
  });
  return res.json({ items, total: items.length });
});

apiRouter.post('/pharmacy/products/create', (req: Request, res: Response) => {
  const schema = z.object({
    pharmacyId: z.string().default('pharm-gkp-1'),
    name: z.string().min(2),
    brand: z.string().min(1),
    genericSaltName: z.string().optional(),
    categoryDomain: z.enum(['human', 'veterinary']),
    categoryId: z.string().default('cat-general'),
    formulation: z.string().default('Tablet'),
    strength: z.string().optional(),
    packSize: z.string().default('1 Strip'),
    manufacturer: z.string().min(1),
    mrp: z.number().positive(),
    sellingPrice: z.number().positive(),
    availableQuantity: z.number().int().nonnegative(),
    scheduleType: z.enum(['OTC', 'Schedule H', 'Schedule H1', 'Schedule X']).default('OTC'),
    requiresPrescription: z.boolean().default(false),
    batchNumber: z.string().default(`BATCH-${Date.now().toString().slice(-6)}`),
    expiryDate: z.string().default('2027-12-31'),
    speciesRestrictions: z.array(z.object({
      speciesName: z.string(),
      withdrawalPeriodDays: z.number(),
      precautions: z.string()
    })).optional()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error });
  }

  const data = parsed.data;

  // Strict check constraint: sellingPrice <= mrp
  if (data.sellingPrice > data.mrp) {
    return res.status(400).json({ 
      error: `Statutory violation: Selling price (₹${data.sellingPrice}) cannot exceed MRP (₹${data.mrp}).` 
    });
  }

  const prodId = `prd-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const product: Product = {
    id: prodId,
    name: data.name,
    brand: data.brand,
    genericSaltName: data.genericSaltName,
    categoryId: data.categoryId,
    categoryDomain: data.categoryDomain,
    formulation: data.formulation,
    strength: data.strength,
    packSize: data.packSize,
    manufacturer: data.manufacturer,
    mrp: data.mrp,
    requiresPrescription: data.requiresPrescription || (data.scheduleType !== 'OTC'),
    isOtcDirect: data.scheduleType === 'OTC' && !data.requiresPrescription,
    scheduleType: data.scheduleType,
    imageUrl: `/products/${data.categoryDomain === 'veterinary' ? 'vet-default.png' : 'pharma-default.png'}`,
    speciesRestrictions: data.speciesRestrictions
  };

  dbStore.products.set(product.id, product);

  const invItem: PharmacyInventoryItem = {
    id: `inv-${Date.now()}`,
    pharmacyId: data.pharmacyId,
    productId: product.id,
    availableQuantity: data.availableQuantity,
    reservedQuantity: 0,
    mrp: data.mrp,
    sellingPrice: data.sellingPrice,
    isAvailableOverride: false,
    batches: [{
      batchNumber: data.batchNumber,
      mfgDate: '2024-01-01',
      expiryDate: data.expiryDate,
      quantity: data.availableQuantity
    }]
  };

  dbStore.inventory.set(invItem.id, invItem);
  dbStore.recordAudit('pharm-gkp-1', 'LIST_PRODUCT', 'product', product.id, {
    name: product.name,
    mrp: data.mrp,
    sellingPrice: data.sellingPrice,
    quantity: data.availableQuantity
  });

  return res.status(201).json({
    success: true,
    message: `Medicine '${product.name}' listed successfully on Medcure Gorakhpur.`,
    product,
    inventory: invItem
  });
});

apiRouter.post('/pharmacy/products/bulk-import', (req: Request, res: Response) => {
  const schema = z.object({
    pharmacyId: z.string().default('pharm-gkp-1'),
    medicines: z.array(z.object({
      name: z.string().min(2),
      brand: z.string().min(1),
      genericSaltName: z.string().optional(),
      categoryDomain: z.enum(['human', 'veterinary']).default('human'),
      categoryId: z.string().default('cat-general'),
      formulation: z.string().default('Tablet'),
      strength: z.string().optional(),
      packSize: z.string().default('1 Strip'),
      manufacturer: z.string().min(1),
      mrp: z.number().positive(),
      sellingPrice: z.number().positive(),
      availableQuantity: z.number().int().nonnegative().default(50),
      scheduleType: z.enum(['OTC', 'Schedule H', 'Schedule H1', 'Schedule X']).default('OTC'),
      requiresPrescription: z.boolean().default(false),
      batchNumber: z.string().optional(),
      expiryDate: z.string().default('2027-12-31')
    }))
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error });
  }

  const { pharmacyId, medicines } = parsed.data;
  const imported: Product[] = [];

  for (const m of medicines) {
    const finalSellingPrice = m.sellingPrice > m.mrp ? m.mrp : m.sellingPrice;
    const prodId = `prd-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    const product: Product = {
      id: prodId,
      name: m.name,
      brand: m.brand,
      genericSaltName: m.genericSaltName,
      categoryId: m.categoryId,
      categoryDomain: m.categoryDomain,
      formulation: m.formulation,
      strength: m.strength,
      packSize: m.packSize,
      manufacturer: m.manufacturer,
      mrp: m.mrp,
      requiresPrescription: m.requiresPrescription || (m.scheduleType !== 'OTC'),
      isOtcDirect: m.scheduleType === 'OTC' && !m.requiresPrescription,
      scheduleType: m.scheduleType,
      imageUrl: `/products/${m.categoryDomain === 'veterinary' ? 'vet-default.png' : 'pharma-default.png'}`
    };

    dbStore.products.set(product.id, product);

    const invItem: PharmacyInventoryItem = {
      id: `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      pharmacyId,
      productId: product.id,
      availableQuantity: m.availableQuantity,
      reservedQuantity: 0,
      mrp: m.mrp,
      sellingPrice: finalSellingPrice,
      isAvailableOverride: false,
      batches: [{
        batchNumber: m.batchNumber || `BATCH-${Date.now().toString().slice(-6)}`,
        mfgDate: '2024-01-01',
        expiryDate: m.expiryDate,
        quantity: m.availableQuantity
      }]
    };

    dbStore.inventory.set(invItem.id, invItem);
    imported.push(product);
  }

  return res.json({
    success: true,
    imported_count: imported.length,
    message: `Successfully imported and listed ${imported.length} medicines on Medcure storefront.`,
    products: imported
  });
});

apiRouter.patch('/pharmacy/inventory/:productId', (req: Request, res: Response) => {
  const { productId } = req.params;
  const pharmacyId = (req.body.pharmacyId as string) || 'pharm-gkp-1';
  const { availableQuantity, sellingPrice, isAvailableOverride } = req.body;

  const inv = Array.from(dbStore.inventory.values()).find(
    i => i.pharmacyId === pharmacyId && i.productId === productId
  );

  if (!inv) {
    return res.status(404).json({ error: 'Inventory record not found.' });
  }

  if (availableQuantity !== undefined) inv.availableQuantity = availableQuantity;
  if (isAvailableOverride !== undefined) inv.isAvailableOverride = isAvailableOverride;
  if (sellingPrice !== undefined) {
    if (sellingPrice > inv.mrp) {
      return res.status(400).json({ error: `Selling price cannot exceed MRP (₹${inv.mrp}).` });
    }
    inv.sellingPrice = sellingPrice;
  }

  return res.json({ success: true, inventory: inv });
});

// ============================================================================
// 6. PAYMENTS & WEBHOOKS
// ============================================================================
apiRouter.post('/payments/create-order', paymentRateLimiter.getMiddleware(), (req: Request, res: Response) => {
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

apiRouter.post('/rider/location', (req: Request, res: Response) => {
  const schema = z.object({
    latitude: z.number(),
    longitude: z.number(),
    riderId: z.string().optional(),
    speed: z.number().optional(),
    heading: z.number().optional(),
    batteryLevel: z.number().optional()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const riderId = parsed.data.riderId || (req.headers['x-user-id'] as string) || 'usr-rider-1';
  dbStore.updateRiderLocation({
    riderId,
    orderId: 'active-pool',
    latitude: parsed.data.latitude,
    longitude: parsed.data.longitude,
    speedKmh: parsed.data.speed || 25,
    heading: parsed.data.heading || 0,
    recordedAt: new Date().toISOString()
  });
  return res.json({ success: true, riderId, latitude: parsed.data.latitude, longitude: parsed.data.longitude });
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
// 7.1. RIDER (DELIVERY PARTNER) APP MILESTONE R1: AUTH, ONBOARDING & DEVICES
// ============================================================================
apiRouter.post('/rider/auth/request-otp', authRateLimiter.getMiddleware(), (req: Request, res: Response) => {
  const schema = z.object({
    phone: z.string().min(10)
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  // Normalise phone to 10 digits
  const rawDigits = parsed.data.phone.replace(/\D/g, '');
  const tenDigits = rawDigits.length >= 10 ? rawDigits.slice(-10) : rawDigits;
  const normalizedPhone = `+91${tenDigits}`;

  // Enforce: NO self-activation. Account must already exist with role 'delivery_partner'
  const user = Array.from(dbStore.users.values()).find(
    u => u.phone === normalizedPhone && u.role === 'delivery_partner'
  );

  if (!user) {
    dbStore.recordAudit(undefined, 'RIDER_UNAUTHORIZED_LOGIN_ATTEMPT', 'auth', normalizedPhone, {
      attemptedPhone: normalizedPhone,
      reason: 'No delivery partner account found or user not authorized by operations.'
    });
    return res.status(403).json({
      error: 'ACCOUNT_NOT_FOUND_OR_UNAPPROVED',
      message: 'No registered delivery partner account found with this phone number. Delivery partners must be registered and approved by platform operations.'
    });
  }

  dbStore.recordAudit(user.id, 'RIDER_OTP_REQUESTED', 'auth', user.id, {
    phone: normalizedPhone
  });

  return res.json({
    success: true,
    message: `OTP sent successfully to ${normalizedPhone}.`,
    mockOtp: '123456'
  });
});

apiRouter.post('/rider/auth/login', authRateLimiter.getMiddleware(), (req: Request, res: Response) => {
  const schema = z.object({
    phone: z.string().min(10),
    otp: z.string().length(6),
    deviceFingerprint: z.string().min(3),
    deviceModel: z.string().min(2),
    osVersion: z.string().min(1),
    appVersion: z.string().min(1),
    pushToken: z.string().optional()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const rawDigits = parsed.data.phone.replace(/\D/g, '');
  const tenDigits = rawDigits.length >= 10 ? rawDigits.slice(-10) : rawDigits;
  const normalizedPhone = `+91${tenDigits}`;

  if (parsed.data.otp !== '123456') {
    return res.status(401).json({ error: 'INVALID_OTP', message: 'Incorrect OTP entered.' });
  }

  const user = Array.from(dbStore.users.values()).find(
    u => u.phone === normalizedPhone && u.role === 'delivery_partner'
  );

  if (!user) {
    return res.status(403).json({
      error: 'ACCOUNT_NOT_FOUND_OR_UNAPPROVED',
      message: 'No delivery partner account found with this phone number.'
    });
  }

  // Find or link rider profile
  let rider = Array.from(dbStore.riders.values()).find(r => r.userId === user.id);
  if (!rider) {
    rider = {
      id: `rider-${Date.now()}`,
      userId: user.id,
      vehicleType: 'Hero Splendor Plus',
      vehicleRegistrationNumber: 'UP53-PENDING',
      drivingLicenceNumber: 'PENDING',
      isAvailable: false,
      currentCashInHand: 0,
      isApproved: false,
      approvalStatus: 'submitted'
    };
    dbStore.riders.set(rider.id, rider);
  }

  // Bind Device
  const boundDevice = dbStore.bindRiderDevice(user.id, rider.id, {
    deviceFingerprint: parsed.data.deviceFingerprint,
    deviceModel: parsed.data.deviceModel,
    osVersion: parsed.data.osVersion,
    appVersion: parsed.data.appVersion,
    pushToken: parsed.data.pushToken
  });

  // Get onboarding application if any
  const application = Array.from(dbStore.riderApplications.values()).find(a => a.userId === user.id);

  dbStore.recordAudit(user.id, 'RIDER_DEVICE_LOGIN', 'device', boundDevice.id, {
    deviceModel: parsed.data.deviceModel,
    fingerprint: parsed.data.deviceFingerprint
  });

  return res.json({
    success: true,
    token: `rider-jwt-session-${user.id}-${Date.now()}`,
    user: {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role
    },
    rider,
    onboardingApplication: application || null,
    boundDevices: dbStore.getRiderDevices(user.id)
  });
});

apiRouter.post('/rider/onboarding/submit', (req: Request, res: Response) => {
  const schema = z.object({
    userId: z.string(),
    fullName: z.string().min(2),
    phone: z.string().min(10),
    selfieDocPath: z.string().min(3),
    govIdType: z.enum(['aadhaar', 'pan', 'voter_id']),
    govIdNumber: z.string().min(4),
    govIdDocPath: z.string().min(3),
    drivingLicenceNumber: z.string().min(5),
    drivingLicenceDocPath: z.string().min(3),
    drivingLicenceExpiryDate: z.string(),
    vehicleType: z.enum(['motorcycle', 'scooter', 'ev_scooter', 'bicycle']),
    vehicleRegistrationNumber: z.string().min(3),
    vehicleRcDocPath: z.string().min(3),
    vehicleInsuranceDocPath: z.string().optional(),
    emergencyContactName: z.string().min(2),
    emergencyContactPhone: z.string().min(10),
    emergencyContactRelation: z.string().min(2),
    bankAccount: z.string().optional(),
    bankIfsc: z.string().optional(),
    upiId: z.string().optional()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const data = parsed.data;

  // Validate Emergency contact cannot be same as rider phone
  const riderDigits = data.phone.replace(/\D/g, '').slice(-10);
  const emDigits = data.emergencyContactPhone.replace(/\D/g, '').slice(-10);
  if (riderDigits === emDigits) {
    return res.status(400).json({
      error: 'EMERGENCY_CONTACT_INVALID',
      message: 'Emergency contact number cannot be the same as the delivery partner mobile number.'
    });
  }

  // Validate driving licence expiry date
  const dlExpiry = new Date(data.drivingLicenceExpiryDate);
  if (isNaN(dlExpiry.getTime()) || dlExpiry <= new Date()) {
    return res.status(400).json({
      error: 'EXPIRED_LICENCE',
      message: 'Driving licence expiry date must be a valid future date.'
    });
  }

  // Mask sensitive financial details
  let bankAccountMasked: string | undefined;
  if (data.bankAccount && data.bankAccount.length >= 4) {
    bankAccountMasked = `••••••••${data.bankAccount.slice(-4)}`;
  }
  let upiIdMasked: string | undefined;
  if (data.upiId && data.upiId.includes('@')) {
    const parts = data.upiId.split('@');
    upiIdMasked = `${parts[0].slice(0, 2)}••••@${parts[1]}`;
  }

  // Find linked rider profile
  const rider = Array.from(dbStore.riders.values()).find(r => r.userId === data.userId);

  const application = dbStore.submitRiderApplication({
    userId: data.userId,
    riderId: rider?.id,
    fullName: data.fullName,
    phone: data.phone,
    selfieDocPath: data.selfieDocPath,
    govIdType: data.govIdType,
    govIdNumber: data.govIdNumber,
    govIdDocPath: data.govIdDocPath,
    drivingLicenceNumber: data.drivingLicenceNumber,
    drivingLicenceDocPath: data.drivingLicenceDocPath,
    drivingLicenceExpiryDate: data.drivingLicenceExpiryDate,
    vehicleType: data.vehicleType,
    vehicleRegistrationNumber: data.vehicleRegistrationNumber,
    vehicleRcDocPath: data.vehicleRcDocPath,
    vehicleInsuranceDocPath: data.vehicleInsuranceDocPath,
    emergencyContactName: data.emergencyContactName,
    emergencyContactPhone: data.emergencyContactPhone,
    emergencyContactRelation: data.emergencyContactRelation,
    bankAccountMasked,
    bankIfsc: data.bankIfsc?.toUpperCase(),
    upiIdMasked
  });

  // Update vehicle info on rider profile
  if (rider) {
    rider.vehicleType = data.vehicleType;
    rider.vehicleRegistrationNumber = data.vehicleRegistrationNumber;
    rider.drivingLicenceNumber = data.drivingLicenceNumber;
    rider.isApproved = false; // Remains false until admin approves
    rider.approvalStatus = 'submitted';
  }

  dbStore.recordAudit(data.userId, 'RIDER_ONBOARDING_SUBMITTED', 'rider_application', application.id, {
    fullName: data.fullName,
    vehicleType: data.vehicleType
  });

  return res.json({
    success: true,
    message: 'Onboarding application submitted for platform verification.',
    application
  });
});

apiRouter.get('/rider/onboarding/status', (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  if (!userId) return res.status(400).json({ error: 'userId is required.' });

  const app = Array.from(dbStore.riderApplications.values()).find(a => a.userId === userId);
  const rider = Array.from(dbStore.riders.values()).find(r => r.userId === userId);

  return res.json({
    hasApplication: !!app,
    application: app || null,
    isApproved: rider?.isApproved || false,
    approvalStatus: rider?.approvalStatus || (app ? app.status : 'not_started'),
    canGoOnline: (rider?.isApproved === true) && ((rider?.currentCashInHand || 0) < 5000),
    reviewerComments: app?.reviewerComments || null
  });
});

apiRouter.get('/rider/devices', (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  if (!userId) return res.status(400).json({ error: 'userId is required.' });

  const devices = dbStore.getRiderDevices(userId);
  return res.json({ devices });
});

apiRouter.post('/rider/devices/:id/revoke', (req: Request, res: Response) => {
  const success = dbStore.revokeRiderDevice(req.params.id);
  if (!success) return res.status(404).json({ error: 'Device not found.' });

  dbStore.recordAudit(undefined, 'RIDER_DEVICE_REVOKED', 'device', req.params.id, {});
  return res.json({ success: true, message: 'Device session revoked.' });
});

apiRouter.post('/rider/auth/signout', (req: Request, res: Response) => {
  const { userId, deviceFingerprint } = req.body;
  if (userId && deviceFingerprint) {
    const devices = dbStore.getRiderDevices(userId);
    const target = devices.find(d => d.deviceFingerprint === deviceFingerprint);
    if (target) {
      dbStore.revokeRiderDevice(target.id);
    }
  }

  dbStore.recordAudit(userId, 'RIDER_SIGNOUT', 'auth', userId || 'unknown', {});
  return res.json({ success: true, message: 'Signed out successfully.' });
});

apiRouter.post('/rider/availability', (req: Request, res: Response) => {
  const schema = z.object({
    riderId: z.string(),
    isAvailable: z.boolean()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const rider = dbStore.riders.get(parsed.data.riderId);
  if (!rider) return res.status(404).json({ error: 'Rider profile not found.' });

  // STRICT COMPLIANCE RULE: Until Approved, the rider cannot go online
  if (parsed.data.isAvailable && (!rider.isApproved || rider.approvalStatus !== 'approved')) {
    return res.status(403).json({
      error: 'RIDER_NOT_APPROVED_CANNOT_GO_ONLINE',
      message: 'You cannot go online until your onboarding application has been verified and approved by platform operations.'
    });
  }

  // CASH-IN-HAND LIMIT RULE
  if (parsed.data.isAvailable && rider.currentCashInHand >= 5000) {
    return res.status(403).json({
      error: 'CASH_LIMIT_EXCEEDED',
      message: `Cash in hand (₹${rider.currentCashInHand}) exceeds platform threshold limit of ₹5000. Deposit cash before taking new deliveries.`
    });
  }

  rider.isAvailable = parsed.data.isAvailable;
  dbStore.recordAudit(rider.userId, 'RIDER_AVAILABILITY_CHANGED', 'rider', rider.id, {
    isAvailable: rider.isAvailable
  });

  return res.json({
    success: true,
    isAvailable: rider.isAvailable,
    rider
  });
});

apiRouter.post('/admin/rider-applications/:id/review', (req: Request, res: Response) => {
  const schema = z.object({
    status: z.enum(['approved', 'needs_changes', 'suspended']),
    comments: z.string().optional(),
    reviewerId: z.string().default('usr-admin-1')
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const app = dbStore.reviewRiderApplication(
    req.params.id,
    parsed.data.reviewerId,
    parsed.data.status,
    parsed.data.comments
  );

  if (!app) return res.status(404).json({ error: 'Rider onboarding application not found.' });

  dbStore.recordAudit(parsed.data.reviewerId, 'RIDER_APPLICATION_REVIEWED', 'rider_application', app.id, {
    status: parsed.data.status,
    comments: parsed.data.comments
  });

  return res.json({
    success: true,
    message: `Application marked as ${parsed.data.status}.`,
    application: app
  });
});


// ============================================================================
// 8. AI ASSISTANT (STRICT DOMAIN BOUNDARY)
// ============================================================================
apiRouter.post('/ai/chat', aiRateLimiter.getMiddleware(), async (req: Request, res: Response) => {
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

// ============================================================================
// 9. ADMIN, DISPATCHER & SUPPORT DASHBOARD MILESTONE A1: AUTH & RBAC
// ============================================================================
function getPermissionsForRole(role: 'admin' | 'dispatcher' | 'support_operator') {
  return {
    role,
    canViewAnalytics: role === 'admin' ? 'full' : role === 'dispatcher' ? 'operational' : 'tickets',
    canVerifyPartners: role === 'admin',
    canManageCatalogue: role === 'admin',
    canRecallProducts: role === 'admin',
    canOverrideOrders: role === 'admin',
    canAssignRiders: role === 'admin' || role === 'dispatcher',
    canBreakGlassPrescriptions: role === 'admin',
    canManageSettings: role === 'admin',
    canResolveTickets: role === 'admin' || role === 'support_operator',
    canViewCustomerPII: role === 'admin' ? 'masked' : role === 'dispatcher' ? 'delivery_only' : 'masked_phone'
  };
}

apiRouter.post('/admin/auth/login', (req: Request, res: Response) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().optional(),
    totpCode: z.string().length(6)
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const staff = dbStore.getStaffByEmail(parsed.data.email);
  if (!staff || !staff.isActive) {
    return res.status(403).json({
      error: 'ACCOUNT_NOT_AUTHORIZED',
      message: 'No active platform staff account found for this email.'
    });
  }

  // TOTP verification
  if (parsed.data.totpCode !== '123456') {
    return res.status(401).json({
      error: 'INVALID_TOTP',
      message: 'Invalid two-factor authentication code.'
    });
  }

  staff.lastStepUpAt = new Date().toISOString();
  dbStore.recordAudit(staff.userId, 'STAFF_LOGIN_SUCCESS', 'staff', staff.id, {
    role: staff.role,
    email: staff.email
  });

  return res.json({
    success: true,
    token: `staff-jwt-${staff.id}-${Date.now()}`,
    staff,
    permissions: getPermissionsForRole(staff.role)
  });
});

apiRouter.post('/admin/auth/step-up', authRateLimiter.getMiddleware(), (req: Request, res: Response) => {
  const schema = z.object({
    userId: z.string(),
    totpCode: z.string().length(6)
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const staff = dbStore.getStaffByUserId(parsed.data.userId);
  if (!staff) return res.status(404).json({ error: 'Staff account not found.' });

  const valid = dbStore.verifyTotpStepUp(staff.userId, parsed.data.totpCode);
  if (!valid) {
    return res.status(401).json({
      error: 'STEP_UP_FAILED',
      message: 'Invalid TOTP code for step-up verification.'
    });
  }

  return res.json({
    success: true,
    message: 'Step-up authentication verified.',
    verifiedAt: staff.lastStepUpAt,
    expiresInSeconds: 600
  });
});

apiRouter.get('/admin/staff', (_req: Request, res: Response) => {
  const list = Array.from(dbStore.staffProfiles.values());
  return res.json({ staff: list });
});

apiRouter.post('/admin/staff/create', (req: Request, res: Response) => {
  const schema = z.object({
    adminUserId: z.string(),
    fullName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(10),
    role: z.enum(['admin', 'dispatcher', 'support_operator']),
    reason: z.string().min(5)
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const caller = dbStore.getStaffByUserId(parsed.data.adminUserId);
  if (!caller || caller.role !== 'admin') {
    return res.status(403).json({
      error: 'FORBIDDEN',
      message: 'Only Platform Administrators may create staff accounts.'
    });
  }

  const existing = dbStore.getStaffByEmail(parsed.data.email);
  if (existing) {
    return res.status(400).json({ error: 'A staff member with this email already exists.' });
  }

  const staff = dbStore.createStaffUser(caller.userId, {
    fullName: parsed.data.fullName,
    email: parsed.data.email,
    phone: parsed.data.phone,
    role: parsed.data.role,
    reason: parsed.data.reason
  });

  return res.json({ success: true, staff });
});

apiRouter.post('/admin/staff/:id/role', (req: Request, res: Response) => {
  const schema = z.object({
    adminUserId: z.string(),
    newRole: z.enum(['admin', 'dispatcher', 'support_operator']),
    reason: z.string().min(5),
    totpCode: z.string().optional()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const caller = dbStore.getStaffByUserId(parsed.data.adminUserId);
  if (!caller || caller.role !== 'admin') {
    return res.status(403).json({ error: 'Only Platform Administrators may modify roles.' });
  }

  // STEP-UP ENFORCEMENT: Role change is a sensitive action
  if (!dbStore.isStepUpValid(caller.userId)) {
    if (parsed.data.totpCode) {
      const verified = dbStore.verifyTotpStepUp(caller.userId, parsed.data.totpCode);
      if (!verified) {
        return res.status(401).json({ error: 'STEP_UP_FAILED', message: 'Invalid TOTP code for step-up.' });
      }
    } else {
      return res.status(403).json({
        error: 'STEP_UP_REQUIRED',
        message: 'Re-authenticate with TOTP before performing role modifications.'
      });
    }
  }

  const updated = dbStore.updateStaffRole(
    caller.userId,
    req.params.id,
    parsed.data.newRole,
    parsed.data.reason
  );
  if (!updated) return res.status(404).json({ error: 'Staff member not found.' });

  return res.json({ success: true, staff: updated });
});

apiRouter.get(['/admin/approvals', '/admin/two-person-approvals'], (_req: Request, res: Response) => {
  const approvals = Array.from(dbStore.twoPersonApprovals.values()).reverse();
  return res.json({ approvals });
});

apiRouter.post(['/admin/approvals/request', '/admin/two-person-approvals/request'], (req: Request, res: Response) => {
  const schema = z.object({
    requestedBy: z.string(),
    actionType: z.enum([
      'CATALOGUE_CLASS_CHANGE',
      'OTC_DIRECT_TOGGLE',
      'SCHEDULE_CHANGE',
      'MAX_QUANTITY_CHANGE',
      'PRICE_MRP_OVERRIDE',
      'REFUND_LIMIT_CHANGE',
      'PHARMACY_DEACTIVATE'
    ]),
    targetResourceId: z.string(),
    reason: z.string().min(5),
    payload: z.any()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const caller = dbStore.getStaffByUserId(parsed.data.requestedBy);
  if (!caller || caller.role !== 'admin') {
    return res.status(403).json({ error: 'Only Platform Administrators may submit two-person approval requests.' });
  }

  const approval = dbStore.requestTwoPersonApproval(
    caller.userId,
    parsed.data.actionType,
    parsed.data.targetResourceId,
    parsed.data.reason,
    parsed.data.payload
  );

  // Enrich with resource name if target is a product
  const targetProduct = dbStore.products.get(parsed.data.targetResourceId);
  if (targetProduct) {
    approval.targetResourceName = targetProduct.name;
  }
  const userObj = dbStore.users.get(caller.userId);
  if (userObj) {
    approval.requestedByName = userObj.fullName;
  }

  return res.json({ success: true, approval });
});

apiRouter.post(['/admin/approvals/:id/decide', '/admin/two-person-approvals/:id/review', '/admin/two-person-approvals/:id/decide'], (req: Request, res: Response) => {
  const schema = z.object({
    decidedBy: z.string().optional(),
    reviewerId: z.string().optional(),
    decision: z.enum(['approved', 'rejected']),
    reason: z.string().min(5).optional(),
    rejectionReason: z.string().optional(),
    totpCode: z.string().optional()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const deciderId = parsed.data.decidedBy || parsed.data.reviewerId;
  if (!deciderId) {
    return res.status(400).json({ error: 'Decider user ID (decidedBy or reviewerId) is required.' });
  }
  const decisionReason = parsed.data.reason || parsed.data.rejectionReason || 'Reviewed according to platform safety guidelines.';

  // If step-up expired, check totpCode
  if (!dbStore.isStepUpValid(deciderId)) {
    if (parsed.data.totpCode) {
      const verified = dbStore.verifyTotpStepUp(deciderId, parsed.data.totpCode);
      if (!verified) {
        return res.status(401).json({ error: 'STEP_UP_FAILED', message: 'Invalid TOTP code for step-up.' });
      }
    } else {
      return res.status(403).json({
        error: 'STEP_UP_REQUIRED',
        message: 'Re-authenticate with TOTP before approving high-risk configuration change.'
      });
    }
  }

  const result = dbStore.decideTwoPersonApproval(
    req.params.id,
    deciderId,
    parsed.data.decision,
    decisionReason
  );

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  return res.json({ success: true, approval: result.approval });
});

apiRouter.post('/admin/prescriptions/:id/break-glass', (req: Request, res: Response) => {
  const schema = z.object({
    staffUserId: z.string(),
    reason: z.string().min(10),
    totpCode: z.string().optional()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const staff = dbStore.getStaffByUserId(parsed.data.staffUserId);
  if (!staff || staff.role !== 'admin') {
    return res.status(403).json({
      error: 'ROLE_FORBIDDEN',
      message: 'Prescription documents are protected by medical confidentiality. Break-glass access is strictly restricted to Platform Administrators and is prohibited for Dispatcher and Support roles.'
    });
  }

  // Verify Step-up
  if (!dbStore.isStepUpValid(staff.userId)) {
    if (parsed.data.totpCode) {
      const verified = dbStore.verifyTotpStepUp(staff.userId, parsed.data.totpCode);
      if (!verified) {
        return res.status(401).json({ error: 'STEP_UP_FAILED', message: 'Invalid TOTP code for break-glass re-authentication.' });
      }
    } else {
      return res.status(403).json({
        error: 'STEP_UP_REQUIRED',
        message: 'Re-authenticate with TOTP before opening break-glass prescription session.'
      });
    }
  }

  const result = dbStore.createBreakGlassSession(staff.userId, req.params.id, parsed.data.reason);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  const prescription = dbStore.prescriptions.get(req.params.id);

  return res.json({
    success: true,
    message: 'Time-limited break-glass session created and audited.',
    session: result.session,
    prescription: prescription || {
      id: req.params.id,
      patientName: 'Confidential Patient',
      imageUrl: '/secure/prescriptions/audit-sample.jpg',
      verificationStatus: 'approved'
    }
  });
});

// ============================================================================
// 10. PLATFORM SERVICE S1: FEATURE FLAGS API
// ============================================================================
apiRouter.get('/feature-flags', (req: Request, res: Response) => {
  const clientTarget = req.query.clientTarget as string | undefined;
  const flags = dbStore.getFeatureFlags(clientTarget);
  return res.json({
    success: true,
    count: flags.length,
    flags
  });
});

apiRouter.put('/admin/feature-flags/:key', (req: Request, res: Response) => {
  const schema = z.object({
    adminUserId: z.string().optional(),
    isEnabled: z.boolean(),
    reason: z.string().min(5, 'A justification reason of at least 5 characters is required.')
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const adminUserId = parsed.data.adminUserId || (req.headers['x-admin-user-id'] as string) || (req.headers['x-user-id'] as string);
  if (!adminUserId) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Admin user identification required (adminUserId or x-admin-user-id header).'
    });
  }

  const caller = dbStore.getStaffByUserId(adminUserId);
  if (!caller || caller.role !== 'admin') {
    return res.status(403).json({
      error: 'FORBIDDEN',
      message: 'Only Platform Administrators can toggle platform feature flags.'
    });
  }

  const updated = dbStore.toggleFeatureFlag(
    caller.userId,
    req.params.key,
    parsed.data.isEnabled,
    parsed.data.reason
  );

  if (!updated) {
    return res.status(404).json({
      error: 'FLAG_NOT_FOUND',
      message: `Feature flag with key '${req.params.key}' does not exist.`
    });
  }

  return res.json({
    success: true,
    message: `Feature flag '${req.params.key}' successfully set to ${parsed.data.isEnabled ? 'ENABLED' : 'DISABLED'}.`,
    flag: updated
  });
});

// ============================================================================
// 11. PLATFORM ADMIN MILESTONE A2: OVERVIEW KPIS, LIVE OPERATIONS MAP & ALERTS
// ============================================================================
apiRouter.get('/admin/overview/kpis', (req: Request, res: Response) => {
  const staffUserId = (req.headers['x-admin-user-id'] || req.headers['x-staff-user-id'] || req.query.staffUserId) as string;
  const staff = staffUserId ? dbStore.getStaffByUserId(staffUserId) : undefined;
  const role = staff ? staff.role : 'admin';

  const kpis = dbStore.getAdminKpis(role);
  return res.json({
    success: true,
    role,
    kpis
  });
});

apiRouter.get('/admin/operations/live-map', (req: Request, res: Response) => {
  const pharmacyId = req.query.pharmacyId as string | undefined;
  const status = req.query.status as string | undefined;

  const data = dbStore.getLiveOperationsMap({ pharmacyId, status });
  return res.json({
    success: true,
    city: 'Gorakhpur, Uttar Pradesh',
    bounds: GORAKHPUR_BOUNDS,
    ...data
  });
});

apiRouter.get('/admin/operations/alerts', (req: Request, res: Response) => {
  const staffUserId = (req.headers['x-admin-user-id'] || req.headers['x-staff-user-id'] || req.query.staffUserId) as string;
  const unreadOnly = req.query.unreadOnly === 'true';
  const staff = staffUserId ? dbStore.getStaffByUserId(staffUserId) : undefined;
  const role = staff ? staff.role : 'admin';

  const alerts = dbStore.getOperationalAlerts(role, unreadOnly);
  return res.json({
    success: true,
    role,
    count: alerts.length,
    alerts
  });
});

apiRouter.post('/admin/operations/alerts/:id/acknowledge', (req: Request, res: Response) => {
  const schema = z.object({
    staffUserId: z.string().optional(),
    notes: z.string().min(5, 'Resolution notes of at least 5 characters required.')
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const staffUserId = parsed.data.staffUserId || (req.headers['x-staff-user-id'] as string) || (req.headers['x-admin-user-id'] as string) || 'usr-admin-1';
  const staff = dbStore.getStaffByUserId(staffUserId);

  if (staff && staff.role === 'support_operator') {
    return res.status(403).json({
      error: 'FORBIDDEN',
      message: 'Support operators cannot resolve operational infrastructure alerts; escalation to Admin or Dispatcher required.'
    });
  }

  const updated = dbStore.acknowledgeAlert(staffUserId, req.params.id, parsed.data.notes);
  if (!updated) {
    return res.status(404).json({ error: 'ALERT_NOT_FOUND', message: `Operational alert '${req.params.id}' not found.` });
  }

  return res.json({
    success: true,
    message: 'Alert acknowledged and recorded in immutable audit log.',
    alert: updated
  });
});

// ============================================================================
// 12. MILESTONE A3: DISPATCHER CONSOLE & RIDER ASSIGNMENT ENDPOINTS
// ============================================================================

function getStaffIdentity(req: Request) {
  const staffUserId = (req.headers['x-staff-user-id'] || req.headers['x-admin-user-id'] || req.headers['x-dispatcher-user-id'] || req.query.staffUserId) as string || 'usr-dispatch-1';
  const staff = dbStore.getStaffByUserId(staffUserId);
  return {
    staffUserId,
    staff,
    role: staff ? staff.role : 'dispatcher'
  };
}

// 1. Dispatch Orders Queue (Orders needing rider or active in delivery)
apiRouter.get('/dispatch/queue', (req: Request, res: Response) => {
  const { role } = getStaffIdentity(req);
  const status = req.query.status as string | undefined;
  const search = req.query.search as string | undefined;

  const queue = dbStore.getDispatchQueue({ status, search });

  return res.json({
    success: true,
    role,
    count: queue.length,
    orders: queue
  });
});

// 2. Dispatch Rider Roster (Real-time telemetry, load, cash-in-hand, proximity)
apiRouter.get('/dispatch/riders', (req: Request, res: Response) => {
  const pharmacyLat = req.query.pharmacyLat ? parseFloat(req.query.pharmacyLat as string) : 26.7598;
  const pharmacyLng = req.query.pharmacyLng ? parseFloat(req.query.pharmacyLng as string) : 83.3725;

  const riders = dbStore.getDispatchRiders(pharmacyLat, pharmacyLng);

  return res.json({
    success: true,
    count: riders.length,
    riders
  });
});

// 3. Manual Assign Rider (Atomically cancels outstanding offers)
apiRouter.post('/dispatch/assign', (req: Request, res: Response) => {
  const schema = z.object({
    orderId: z.string(),
    riderId: z.string(),
    reason: z.string().min(5, 'Mandatory reason of at least 5 characters required for manual assignment'),
    staffUserId: z.string().optional()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const identity = getStaffIdentity(req);
  const staffUserId = parsed.data.staffUserId || identity.staffUserId;

  if (identity.role === 'support_operator') {
    return res.status(403).json({
      error: 'FORBIDDEN',
      message: 'Support operators cannot assign riders; only Dispatchers and Administrators can assign.'
    });
  }

  try {
    const result = AssignmentEngine.manualAssign(
      parsed.data.orderId,
      parsed.data.riderId,
      staffUserId,
      parsed.data.reason
    );

    return res.json({
      success: true,
      message: `Order assigned to rider ${result.rider.fullName} by dispatcher.`,
      order: result.order,
      rider: result.rider
    });
  } catch (err: any) {
    return res.status(400).json({ error: 'ASSIGNMENT_ERROR', message: err.message });
  }
});

// 4. Reassign Rider
apiRouter.post('/dispatch/reassign', (req: Request, res: Response) => {
  const schema = z.object({
    orderId: z.string(),
    newRiderId: z.string(),
    reason: z.string().min(5, 'Mandatory reason of at least 5 characters required for reassignment'),
    staffUserId: z.string().optional()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const identity = getStaffIdentity(req);
  const staffUserId = parsed.data.staffUserId || identity.staffUserId;

  if (identity.role === 'support_operator') {
    return res.status(403).json({
      error: 'FORBIDDEN',
      message: 'Support operators cannot reassign riders.'
    });
  }

  try {
    const result = AssignmentEngine.manualAssign(
      parsed.data.orderId,
      parsed.data.newRiderId,
      staffUserId,
      `Reassigned: ${parsed.data.reason}`
    );

    return res.json({
      success: true,
      message: `Order successfully reassigned to ${result.rider.fullName}.`,
      order: result.order,
      rider: result.rider
    });
  } catch (err: any) {
    return res.status(400).json({ error: 'REASSIGNMENT_ERROR', message: err.message });
  }
});

// 5. Unassign Rider
apiRouter.post('/dispatch/unassign', (req: Request, res: Response) => {
  const schema = z.object({
    orderId: z.string(),
    reason: z.string().min(5, 'Mandatory reason of at least 5 characters required to unassign rider'),
    staffUserId: z.string().optional()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const identity = getStaffIdentity(req);
  const staffUserId = parsed.data.staffUserId || identity.staffUserId;

  if (identity.role === 'support_operator') {
    return res.status(403).json({
      error: 'FORBIDDEN',
      message: 'Support operators cannot unassign riders.'
    });
  }

  try {
    const result = AssignmentEngine.manualUnassign(
      parsed.data.orderId,
      staffUserId,
      parsed.data.reason
    );

    return res.json({
      success: true,
      message: 'Rider unassigned; order returned to dispatcher queue.',
      order: result.order
    });
  } catch (err: any) {
    return res.status(400).json({ error: 'UNASSIGNMENT_ERROR', message: err.message });
  }
});

// 6. Pause / Resume Auto-Assignment for a Single Order
apiRouter.post('/dispatch/pause-auto', (req: Request, res: Response) => {
  const schema = z.object({
    orderId: z.string(),
    paused: z.boolean().optional(),
    reason: z.string().optional(),
    staffUserId: z.string().optional()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const identity = getStaffIdentity(req);
  const staffUserId = parsed.data.staffUserId || identity.staffUserId;

  if (identity.role === 'support_operator') {
    return res.status(403).json({
      error: 'FORBIDDEN',
      message: 'Support operators cannot pause automatic assignment.'
    });
  }

  const isPaused = dbStore.toggleAutoAssignmentPause(
    parsed.data.orderId,
    parsed.data.paused,
    staffUserId,
    parsed.data.reason
  );

  return res.json({
    success: true,
    orderId: parsed.data.orderId,
    autoAssignmentPaused: isPaused,
    message: `Automatic assignment ${isPaused ? 'paused' : 'resumed'} for order.`
  });
});

// 7. Log Dispatcher Contact Intervention (Call rider / Call pharmacy)
apiRouter.post('/dispatch/contact', (req: Request, res: Response) => {
  const schema = z.object({
    orderId: z.string(),
    interventionType: z.enum(['CALL_RIDER', 'CALL_PHARMACY', 'CALL_CUSTOMER']),
    targetEntity: z.string(),
    notes: z.string().min(3, 'Contact notes required')
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const identity = getStaffIdentity(req);
  const intervention = dbStore.addDispatcherIntervention({
    orderId: parsed.data.orderId,
    staffUserId: identity.staffUserId,
    interventionType: parsed.data.interventionType,
    targetEntity: parsed.data.targetEntity,
    notes: parsed.data.notes
  });

  return res.json({
    success: true,
    message: 'Contact intervention logged in operational audit trail.',
    intervention
  });
});

// 8. Handle Failed Deliveries (Redelivery, Return to Pharmacy, Cancellation)
apiRouter.post('/dispatch/failed-delivery', (req: Request, res: Response) => {
  const schema = z.object({
    orderId: z.string(),
    action: z.enum(['redelivery', 'return_to_pharmacy', 'cancel_order']),
    reason: z.string().min(5, 'Detailed reason required for failed delivery resolution'),
    staffUserId: z.string().optional()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const identity = getStaffIdentity(req);
  const staffUserId = parsed.data.staffUserId || identity.staffUserId;

  const order = dbStore.orders.get(parsed.data.orderId);
  if (!order) {
    return res.status(404).json({ error: 'ORDER_NOT_FOUND', message: `Order ${parsed.data.orderId} not found` });
  }

  // Release current rider if assigned
  if (order.riderId) {
    const r = dbStore.riderPresence.get(order.riderId);
    if (r) {
      r.currentLoad = Math.max(0, r.currentLoad - 1);
    }
  }

  if (parsed.data.action === 'redelivery') {
    order.state = 'PACKED';
    order.riderId = undefined;
    order.updatedAt = new Date().toISOString();
  } else if (parsed.data.action === 'return_to_pharmacy') {
    order.state = 'CANCELLED';
    order.rejectionReason = `Returned to Pharmacy: ${parsed.data.reason}`;
    order.updatedAt = new Date().toISOString();
  } else {
    order.state = 'CANCELLED';
    order.rejectionReason = `Cancelled by Dispatcher: ${parsed.data.reason}`;
    order.updatedAt = new Date().toISOString();
  }

  dbStore.addDispatcherIntervention({
    orderId: order.id,
    staffUserId,
    interventionType: 'FAILED_DELIVERY_RESOLUTION',
    targetEntity: `order:${order.id}`,
    notes: `Failed delivery resolution: ${parsed.data.action}. Reason: ${parsed.data.reason}`
  });

  dbStore.recordAudit(staffUserId, 'FAILED_DELIVERY_HANDLED', 'order', order.id, {
    action: parsed.data.action,
    reason: parsed.data.reason,
    newState: order.state
  });

  return res.json({
    success: true,
    message: `Delivery issue resolved via ${parsed.data.action}.`,
    order
  });
});

// 9. Dispatch Metrics
apiRouter.get('/dispatch/metrics', (_req: Request, res: Response) => {
  const metrics = dbStore.getDispatchMetrics();
  return res.json({
    success: true,
    metrics
  });
});

// 10. Assignment Settings
apiRouter.get('/dispatch/settings', (req: Request, res: Response) => {
  const zoneId = (req.query.zoneId as string) || 'zone-gkp-central';
  const settings = dbStore.getAssignmentSettings(zoneId);
  return res.json({
    success: true,
    settings
  });
});

// 11. Update Assignment Settings (Includes Platform Kill Switch)
apiRouter.post('/dispatch/settings', (req: Request, res: Response) => {
  const identity = getStaffIdentity(req);
  if (identity.role === 'support_operator') {
    return res.status(403).json({
      error: 'FORBIDDEN',
      message: 'Support operators cannot modify rider assignment settings.'
    });
  }

  const zoneId = req.body.zoneId || 'zone-gkp-central';
  const updated = dbStore.updateAssignmentSettings(zoneId, req.body, identity.staffUserId);

  return res.json({
    success: true,
    message: 'Assignment settings updated successfully.',
    settings: updated
  });
});

// 12. Explainability: Get Assignment Decisions for an Order
apiRouter.get('/dispatch/assignment-decisions/:orderId', (req: Request, res: Response) => {
  const decisions = Array.from(dbStore.assignmentDecisions.values())
    .filter(d => d.orderId === req.params.orderId)
    .sort((a, b) => new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime());

  return res.json({
    success: true,
    orderId: req.params.orderId,
    count: decisions.length,
    decisions
  });
});

// 13. Trigger Assignment Engine Evaluation
apiRouter.post('/dispatch/engine/evaluate', (req: Request, res: Response) => {
  const schema = z.object({
    orderId: z.string(),
    zoneId: z.string().optional()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  try {
    const decision = AssignmentEngine.evaluateOrder(parsed.data.orderId, parsed.data.zoneId);
    return res.json({
      success: true,
      decision
    });
  } catch (err: any) {
    return res.status(400).json({ error: 'EVALUATION_ERROR', message: err.message });
  }
});

// 14. Respond to Offer (Accept / Decline)
apiRouter.post('/dispatch/offers/:offerId/respond', (req: Request, res: Response) => {
  const schema = z.object({
    action: z.enum(['accept', 'decline']),
    reason: z.string().optional()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  try {
    const result = AssignmentEngine.respondToOffer(
      req.params.offerId,
      parsed.data.action,
      parsed.data.reason
    );
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: 'OFFER_RESPONSE_ERROR', message: err.message });
  }
});

// ============================================================================
// MILESTONE A4: PHARMACY AND RIDER MANAGEMENT ENDPOINTS
// ============================================================================

// 1. Get Pharmacy Applications Queue
apiRouter.get('/admin/pharmacy-applications', (_req: Request, res: Response) => {
  const apps = Array.from(dbStore.onboardingApplications.values()).map(app => {
    const checklist = dbStore.getPharmacyChecklist(app.id);
    return {
      ...app,
      checklist
    };
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return res.json({ applications: apps });
});

// 2. Get Single Pharmacy Application Details
apiRouter.get('/admin/pharmacy-applications/:id', (req: Request, res: Response) => {
  const app = dbStore.onboardingApplications.get(req.params.id);
  if (!app) return res.status(404).json({ error: 'Application not found' });
  const checklist = dbStore.getPharmacyChecklist(app.id);
  return res.json({ application: app, checklist });
});

// 3. Update Pharmacy Verification Checklist
apiRouter.put('/admin/pharmacy-applications/:id/checklist', (req: Request, res: Response) => {
  const schema = z.object({
    licenceValidityVerified: z.boolean().optional(),
    registrationVerified: z.boolean().optional(),
    physicalAddressVerified: z.boolean().optional(),
    authorisedPersonsVerified: z.boolean().optional(),
    pharmacistCredentialsVerified: z.boolean().optional(),
    verificationNotes: z.string().optional()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const staffId = (req as any).user?.id || 'usr-admin-1';
  const updated = dbStore.updatePharmacyChecklist(req.params.id, parsed.data, staffId);
  return res.json({ success: true, checklist: updated });
});

// 4. Pharmacy Application Decision (APPROVE / REQUEST_CHANGES / REJECT)
apiRouter.post('/admin/pharmacy-applications/:id/decide', (req: Request, res: Response) => {
  const schema = z.object({
    decision: z.enum(['APPROVE', 'REQUEST_CHANGES', 'REJECT']),
    reason: z.string().min(5, 'Mandatory reason (min 5 characters) is required for statutory review decisions')
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const staffId = (req as any).user?.id || 'usr-admin-1';
  const result = dbStore.reviewPharmacyApplication(req.params.id, parsed.data.decision, parsed.data.reason, staffId);
  if (!result.success) {
    return res.status(400).json(result);
  }
  return res.json(result);
});

// 5. Pharmacy Lifecycle Control (ACTIVATE / SUSPEND / REINSTATE)
apiRouter.post('/admin/pharmacies/:id/lifecycle', (req: Request, res: Response) => {
  const schema = z.object({
    action: z.enum(['ACTIVATE', 'SUSPEND', 'REINSTATE']),
    reason: z.string().min(5, 'Mandatory recorded reason required for lifecycle changes')
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const adminId = (req as any).user?.id || 'usr-admin-1';
  try {
    const result = dbStore.setPharmacyLifecycle(req.params.id, parsed.data.action, parsed.data.reason, adminId);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// 6. List Verified Pharmacies with Status & Licences
apiRouter.get('/admin/pharmacies', (_req: Request, res: Response) => {
  const list = Array.from(dbStore.pharmacies.values()).map(pharma => {
    const commission = dbStore.getPharmacyCommission(pharma.id);
    const scorecard = dbStore.getPharmacyScorecard(pharma.id);
    return {
      ...pharma,
      commission,
      scorecard
    };
  });
  return res.json({ pharmacies: list });
});

// 7. Pharmacy Licence Expiry Tracker
apiRouter.get('/admin/pharmacies/licence-tracker', (_req: Request, res: Response) => {
  const tracker = dbStore.getPharmacyLicenceTracker();
  return res.json({ licences: tracker });
});

// 8. Enforce Licence Expiries (Auto-hide on expiry)
apiRouter.post('/admin/pharmacies/enforce-licence-expiries', (_req: Request, res: Response) => {
  const result = dbStore.checkAndEnforceLicenceExpiries();
  return res.json({ success: true, ...result });
});

// 9. Pharmacy Commission Settings
apiRouter.get('/admin/pharmacies/:id/commission', (req: Request, res: Response) => {
  const commission = dbStore.getPharmacyCommission(req.params.id);
  return res.json({ commission });
});

apiRouter.put('/admin/pharmacies/:id/commission', (req: Request, res: Response) => {
  const schema = z.object({
    commissionRatePct: z.number().min(0).max(50).optional(),
    fixedPlatformFeePaise: z.number().min(0).optional(),
    payoutCycle: z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY']).optional(),
    minPayoutThresholdPaise: z.number().min(0).optional(),
    bankAccountMasked: z.string().optional(),
    bankIfsc: z.string().optional(),
    upiIdMasked: z.string().optional(),
    beneficiaryName: z.string().optional()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const adminId = (req as any).user?.id || 'usr-admin-1';
  const updated = dbStore.updatePharmacyCommission(req.params.id, parsed.data, adminId);
  return res.json({ success: true, commission: updated });
});

// 10. Pharmacy Scorecard
apiRouter.get('/admin/pharmacies/:id/scorecard', (req: Request, res: Response) => {
  const scorecard = dbStore.getPharmacyScorecard(req.params.id);
  return res.json({ scorecard });
});

// 11. Pharmacy Staff List
apiRouter.get('/admin/pharmacies/:id/staff', (req: Request, res: Response) => {
  const staff = dbStore.getPharmacyStaffList(req.params.id);
  return res.json({ staff });
});

// 12. Pharmacy Compliance Exceptions
apiRouter.get('/admin/pharmacy-exceptions', (req: Request, res: Response) => {
  const pharmacyId = req.query.pharmacyId as string | undefined;
  const exceptions = dbStore.getPharmacyComplianceExceptions(pharmacyId);
  return res.json({ exceptions });
});

apiRouter.post('/admin/pharmacy-exceptions', (req: Request, res: Response) => {
  const schema = z.object({
    pharmacyId: z.string(),
    orderId: z.string().optional(),
    exceptionType: z.enum([
      'DISPENSING_DISCREPANCY',
      'MISSING_PHARMACIST_SIGNATURE',
      'TEMPERATURE_EXCURSION',
      'DELAYED_HANDOVER',
      'STOCK_MISMATCH',
      'EXPIRED_STOCK_ATTEMPT',
      'CUSTOMER_COMPLAINT',
      'REGULATORY_NOTICE'
    ]),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    description: z.string().min(5)
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const staffId = (req as any).user?.id || 'usr-admin-1';
  const pharma = dbStore.pharmacies.get(parsed.data.pharmacyId);
  const exception = dbStore.createPharmacyComplianceException({
    ...parsed.data,
    pharmacyName: pharma?.businessName || 'Pharmacy',
    reportedBy: staffId
  });
  return res.status(201).json({ success: true, exception });
});

apiRouter.post('/admin/pharmacy-exceptions/:id/resolve', (req: Request, res: Response) => {
  const schema = z.object({
    resolutionNotes: z.string().min(5)
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const staffId = (req as any).user?.id || 'usr-admin-1';
  const result = dbStore.resolvePharmacyComplianceException(req.params.id, parsed.data.resolutionNotes, staffId);
  if (!result) return res.status(404).json({ error: 'Exception not found' });
  return res.json({ success: true, exception: result });
});

// 13. Rider Applications Queue & Checklist
apiRouter.get('/admin/rider-applications', (_req: Request, res: Response) => {
  const apps = Array.from(dbStore.riderApplications.values()).map(app => {
    const checklist = dbStore.getRiderChecklist(app.id);
    return {
      ...app,
      checklist
    };
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return res.json({ applications: apps });
});

apiRouter.get('/admin/rider-applications/:id', (req: Request, res: Response) => {
  const app = dbStore.riderApplications.get(req.params.id);
  if (!app) return res.status(404).json({ error: 'Rider application not found' });
  const checklist = dbStore.getRiderChecklist(app.id);
  return res.json({ application: app, checklist });
});

apiRouter.put('/admin/rider-applications/:id/checklist', (req: Request, res: Response) => {
  const schema = z.object({
    drivingLicenceVerified: z.boolean().optional(),
    vehicleRcVerified: z.boolean().optional(),
    identityVerified: z.boolean().optional(),
    backgroundCheckCleared: z.boolean().optional(),
    verificationNotes: z.string().optional()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const staffId = (req as any).user?.id || 'usr-admin-1';
  const updated = dbStore.updateRiderChecklist(req.params.id, parsed.data, staffId);
  return res.json({ success: true, checklist: updated });
});

apiRouter.post('/admin/rider-applications/:id/decide', (req: Request, res: Response) => {
  const schema = z.object({
    decision: z.enum(['APPROVE', 'REQUEST_CHANGES', 'REJECT', 'SUSPEND']),
    reason: z.string().min(5, 'Mandatory reason required')
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const staffId = (req as any).user?.id || 'usr-admin-1';
  const result = dbStore.reviewRiderApplicationStatutory(req.params.id, parsed.data.decision, parsed.data.reason, staffId);
  if (!result.success) return res.status(400).json(result);
  return res.json(result);
});

// 14. Rider Incident Reports
apiRouter.get('/admin/rider-incidents', (req: Request, res: Response) => {
  const riderId = req.query.riderId as string | undefined;
  const incidents = dbStore.getRiderIncidents(riderId);
  return res.json({ incidents });
});

apiRouter.post('/admin/rider-incidents', (req: Request, res: Response) => {
  const schema = z.object({
    riderId: z.string(),
    orderId: z.string().optional(),
    incidentType: z.enum([
      'ACCIDENT',
      'SPILL_DAMAGE',
      'CUSTOMER_DISPUTE',
      'DELAYED_DELIVERY',
      'VEHICLE_BREAKDOWN',
      'CASH_DISCREPANCY',
      'BEHAVIOURAL_ISSUE',
      'OTHER'
    ]),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    description: z.string().min(5)
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const staffId = (req as any).user?.id || 'usr-admin-1';
  const rider = dbStore.riders.get(parsed.data.riderId);
  const riderName = rider ? (dbStore.users.get(rider.userId)?.fullName || 'Rider') : 'Rider';
  const incident = dbStore.createRiderIncident({
    ...parsed.data,
    riderName,
    reportedBy: staffId
  });
  return res.status(201).json({ success: true, incident });
});

apiRouter.post('/admin/rider-incidents/:id/resolve', (req: Request, res: Response) => {
  const schema = z.object({
    resolutionNotes: z.string().min(5)
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const staffId = (req as any).user?.id || 'usr-admin-1';
  const result = dbStore.resolveRiderIncident(req.params.id, parsed.data.resolutionNotes, staffId);
  if (!result) return res.status(404).json({ error: 'Incident not found' });
  return res.json({ success: true, incident: result });
});

// 15. Rider Cash Deposits & Settlement Confirmation
apiRouter.get('/admin/rider-cash-deposits', (req: Request, res: Response) => {
  const riderId = req.query.riderId as string | undefined;
  const deposits = dbStore.getRiderCashDeposits(riderId);
  return res.json({ deposits });
});

apiRouter.post('/admin/rider-cash-deposits', (req: Request, res: Response) => {
  const schema = z.object({
    riderId: z.string(),
    amountPaise: z.number().positive(),
    depositMethod: z.enum(['BANK_DEPOSIT', 'UPI_TRANSFER', 'HUB_CASH']),
    referenceNumber: z.string().optional(),
    notes: z.string().optional()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const deposit = dbStore.submitRiderCashDeposit(
    parsed.data.riderId,
    parsed.data.amountPaise,
    parsed.data.depositMethod,
    parsed.data.referenceNumber,
    parsed.data.notes
  );
  return res.status(201).json({ success: true, deposit });
});

apiRouter.post('/admin/rider-cash-deposits/:id/confirm', (req: Request, res: Response) => {
  const adminId = (req as any).user?.id || 'usr-admin-1';
  try {
    const result = dbStore.confirmRiderCashDeposit(req.params.id, adminId);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/admin/rider-cash-deposits/:id/reject', (req: Request, res: Response) => {
  const schema = z.object({
    rejectionReason: z.string().min(5)
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const adminId = (req as any).user?.id || 'usr-admin-1';
  try {
    const result = dbStore.rejectRiderCashDeposit(req.params.id, parsed.data.rejectionReason, adminId);
    return res.json({ success: true, deposit: result });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// 16. Rider Payout Batches & Export
apiRouter.get('/admin/rider-payouts', (_req: Request, res: Response) => {
  const batches = dbStore.getPayoutBatches();
  return res.json({ batches });
});

apiRouter.post('/admin/rider-payouts/generate', (req: Request, res: Response) => {
  const schema = z.object({
    periodStart: z.string(),
    periodEnd: z.string()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const adminId = (req as any).user?.id || 'usr-admin-1';
  const batch = dbStore.generateRiderPayoutBatch(parsed.data.periodStart, parsed.data.periodEnd, adminId);
  return res.status(201).json({ success: true, batch });
});

apiRouter.get('/admin/rider-payouts/:id/export', (req: Request, res: Response) => {
  const format = (req.query.format as string) === 'csv' ? 'csv' : 'json';
  try {
    const result = dbStore.exportPayoutBatch(req.params.id, format);
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    return res.send(result.data);
  } catch (err: any) {
    return res.status(404).json({ error: err.message });
  }
});

// ============================================================================
// 17. MILESTONE A5: MASTER CATALOGUE MANAGEMENT & STATUTORY CONTROLS
// ============================================================================

// A. List & Filter Master Products
apiRouter.get('/admin/catalogue/products', (req: Request, res: Response) => {
  const domain = req.query.domain as string; // 'human' | 'veterinary'
  const scheduleType = req.query.scheduleType as string; // 'OTC' | 'Schedule H' | ...
  const isOtcDirect = req.query.isOtcDirect !== undefined ? req.query.isOtcDirect === 'true' : undefined;
  const status = req.query.status as string; // 'active' | 'inactive' | 'all'
  const query = (req.query.query as string || req.query.search as string || '').toLowerCase().trim();

  let prods = Array.from(dbStore.products.values());

  if (domain && domain !== 'all') {
    prods = prods.filter(p => p.categoryDomain === domain);
  }
  if (scheduleType && scheduleType !== 'all') {
    prods = prods.filter(p => p.scheduleType === scheduleType);
  }
  if (isOtcDirect !== undefined) {
    prods = prods.filter(p => p.isOtcDirect === isOtcDirect);
  }
  if (status === 'active') {
    prods = prods.filter(p => p.isActiveInCatalogue !== false);
  } else if (status === 'inactive') {
    prods = prods.filter(p => p.isActiveInCatalogue === false);
  }
  if (query) {
    prods = prods.filter(p =>
      p.name.toLowerCase().includes(query) ||
      (p.genericSaltName && p.genericSaltName.toLowerCase().includes(query)) ||
      p.brand.toLowerCase().includes(query)
    );
  }

  // Enrich with inventory metrics
  const items = prods.map(p => {
    const invList = Array.from(dbStore.inventory.values()).filter(i => i.productId === p.id);
    const totalStock = invList.reduce((acc, i) => acc + i.availableQuantity, 0);
    const activeRecalls = dbStore.getBatchRecalls('ACTIVE').filter(r => r.productId === p.id);
    return {
      ...p,
      totalInventoryQuantity: totalStock,
      hasActiveRecall: activeRecalls.length > 0,
      activeRecallNotices: activeRecalls.map(r => r.batchNumber)
    };
  });

  const allProducts = Array.from(dbStore.products.values());
  const summary = {
    total: allProducts.length,
    humanCount: allProducts.filter(p => p.categoryDomain === 'human').length,
    veterinaryCount: allProducts.filter(p => p.categoryDomain === 'veterinary').length,
    otcDirectCount: allProducts.filter(p => p.isOtcDirect).length,
    scheduleHCount: allProducts.filter(p => p.scheduleType === 'Schedule H' || p.scheduleType === 'Schedule H1').length,
    recalledCount: allProducts.filter(p => dbStore.getBatchRecalls('ACTIVE').some(r => r.productId === p.id)).length
  };

  return res.json({ items, total: items.length, summary });
});

// B. Create Master Product
apiRouter.post('/admin/catalogue/products', (req: Request, res: Response) => {
  const schema = z.object({
    name: z.string().min(2),
    brand: z.string().min(2),
    genericSaltName: z.string().optional(),
    categoryId: z.string(),
    categoryDomain: z.enum(['human', 'veterinary']),
    formulation: z.string(),
    strength: z.string().optional(),
    packSize: z.string(),
    manufacturer: z.string(),
    mrp: z.number().positive(),
    requiresPrescription: z.boolean(),
    isOtcDirect: z.boolean(),
    scheduleType: z.enum(['OTC', 'Schedule H', 'Schedule H1', 'Schedule X']),
    imageUrl: z.string(),
    storageInstructions: z.string().optional(),
    speciesRestrictions: z.array(z.object({
      speciesName: z.string(),
      withdrawalPeriodDays: z.number(),
      precautions: z.string()
    })).optional(),
    maxOrderQuantity: z.number().positive().optional()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const adminId = (req as any).user?.id || 'usr-admin-1';
  try {
    const product = dbStore.createCatalogueProduct(parsed.data as any, adminId);
    return res.status(201).json({ success: true, product });
  } catch (err: any) {
    return res.status(422).json({ error: err.message });
  }
});

// C. Update Master Product Details & Enforce MRP Clamp
apiRouter.put('/admin/catalogue/products/:id', (req: Request, res: Response) => {
  const adminId = (req as any).user?.id || 'usr-admin-1';
  try {
    const product = dbStore.updateCatalogueProduct(req.params.id, req.body, adminId);
    return res.json({ success: true, product });
  } catch (err: any) {
    return res.status(422).json({ error: err.message });
  }
});

// D. Toggle Catalogue Active Status
apiRouter.patch('/admin/catalogue/products/:id/status', (req: Request, res: Response) => {
  const schema = z.object({
    isActive: z.boolean(),
    reason: z.string().optional()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const adminId = (req as any).user?.id || 'usr-admin-1';
  try {
    const product = dbStore.toggleCatalogueProductStatus(req.params.id, parsed.data.isActive, adminId, parsed.data.reason);
    return res.json({ success: true, product });
  } catch (err: any) {
    return res.status(404).json({ error: err.message });
  }
});

// E. Batch & Product Recalls
apiRouter.get('/admin/recalls', (req: Request, res: Response) => {
  const status = req.query.status as any;
  const recalls = dbStore.getBatchRecalls(status);
  return res.json({ recalls });
});

apiRouter.post('/admin/recalls', (req: Request, res: Response) => {
  const schema = z.object({
    productId: z.string(),
    batchNumber: z.string(),
    manufacturerNoticeRef: z.string().min(2),
    recallClass: z.enum(['CLASS_1_CRITICAL', 'CLASS_2_DEFECT', 'CLASS_3_MINOR']),
    reason: z.string().min(5),
    issuedBy: z.string().optional(),
    issuedByName: z.string().optional()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const adminId = parsed.data.issuedBy || (req as any).user?.id || 'usr-admin-1';
  const adminName = parsed.data.issuedByName || 'Medcure Central Safety Desk';

  try {
    const recall = dbStore.issueBatchRecall({
      productId: parsed.data.productId,
      batchNumber: parsed.data.batchNumber,
      manufacturerNoticeRef: parsed.data.manufacturerNoticeRef,
      recallClass: parsed.data.recallClass,
      reason: parsed.data.reason,
      issuedBy: adminId,
      issuedByName: adminName
    });
    return res.status(201).json({ success: true, recall });
  } catch (err: any) {
    return res.status(422).json({ error: err.message });
  }
});

apiRouter.post('/admin/recalls/:id/resolve', (req: Request, res: Response) => {
  const schema = z.object({
    resolutionNotes: z.string().min(5)
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const adminId = (req as any).user?.id || 'usr-admin-1';
  const result = dbStore.resolveBatchRecall(req.params.id, adminId, parsed.data.resolutionNotes);
  if (!result.success) return res.status(404).json({ error: result.error });
  return res.json({ success: true, recall: result.recall });
});

// F. Catalogue Image Moderation Queue
apiRouter.get('/admin/image-moderations', (req: Request, res: Response) => {
  const status = req.query.status as any;
  const items = dbStore.getImageModerations(status);
  return res.json({ items });
});

apiRouter.post('/admin/image-moderations/submit', (req: Request, res: Response) => {
  const schema = z.object({
    productId: z.string(),
    submittedByPharmacyId: z.string(),
    pharmacyName: z.string(),
    imageUrl: z.string().url()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  try {
    const item = dbStore.submitImageForModeration(parsed.data);
    return res.status(201).json({ success: true, item });
  } catch (err: any) {
    return res.status(404).json({ error: err.message });
  }
});

apiRouter.post('/admin/image-moderations/:id/review', (req: Request, res: Response) => {
  const schema = z.object({
    decision: z.enum(['APPROVE', 'REJECT']),
    rejectionReason: z.string().optional(),
    setAsPrimary: z.boolean().optional()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const adminId = (req as any).user?.id || 'usr-admin-1';
  const result = dbStore.reviewImageModeration(
    req.params.id,
    adminId,
    parsed.data.decision,
    parsed.data.rejectionReason,
    parsed.data.setAsPrimary
  );

  if (!result.success) return res.status(404).json({ error: result.error });
  return res.json({ success: true, item: result.item });
});

