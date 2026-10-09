-- ============================================================================
-- MIGRATION: 002_seed_gorakhpur_pilot.sql
-- Seed Data for Gorakhpur Pilot Launch
-- Includes Human Healthcare & Veterinary Healthcare Products, Categories,
-- Verified Partner Pharmacies, and Test Accounts
-- ============================================================================

-- 1. SEED TEST USERS WITH SPECIFIC ROLES
INSERT INTO users (id, phone, email, full_name, role, is_active)
VALUES 
    ('11111111-1111-1111-1111-111111111111', '+919876500001', 'admin@medcure.in', 'Dr. Alok Verma', 'platform_admin', TRUE),
    ('22222222-2222-2222-2222-222222222222', '+919876500002', 'owner@gorakhpurmedico.in', 'Rajesh Gupta', 'pharmacy_owner', TRUE),
    ('33333333-3333-3333-3333-333333333333', '+919876500003', 'pharmacist@gorakhpurmedico.in', 'Sunil Kumar Sharma', 'pharmacist', TRUE),
    ('44444444-4444-4444-4444-444444444444', '+919876500004', 'staff@gorakhpurmedico.in', 'Amit Mishra', 'pharmacy_staff', TRUE),
    ('55555555-5555-5555-5555-555555555555', '+919876500005', 'rider.gkp@medcure.in', 'Vikas Yadav', 'delivery_partner', TRUE),
    ('66666666-6666-6666-6666-666666666666', '+919876500006', 'customer@gmail.com', 'Pooja Srivastava', 'customer', TRUE)
ON CONFLICT (phone) DO NOTHING;

-- 2. SEED CUSTOMER ADDRESS IN GORAKHPUR
INSERT INTO customer_addresses (id, user_id, address_line1, address_line2, landmark, city, state, pincode, latitude, longitude, is_default)
VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '66666666-6666-6666-6666-666666666666',
    'Flat 302, Royal Residency, Park Road',
    'Golghar Market',
    'Near City Mall',
    'Gorakhpur',
    'Uttar Pradesh',
    '273001',
    26.7606,
    83.3732,
    TRUE
) ON CONFLICT DO NOTHING;

-- Seed Customer Animal Profile (Pet dog & Dairy cow)
INSERT INTO animal_profiles (id, user_id, animal_name, species, breed, age_years, weight_kg, is_food_producing, allergies)
VALUES 
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '66666666-6666-6666-6666-666666666666', 'Sheru', 'Canine', 'German Shepherd', 3, 28.5, FALSE, 'None'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', '66666666-6666-6666-6666-666666666666', 'Gauri', 'Bovine', 'Sahiwal Cow', 5, 380.0, TRUE, 'Sulphonamides')
ON CONFLICT DO NOTHING;

-- 3. SEED VERIFIED PARTNER PHARMACIES IN GORAKHPUR
INSERT INTO pharmacies (id, business_name, legal_entity_name, contact_phone, contact_email, address_line1, city, pincode, latitude, longitude, is_active, is_verified, operating_hours)
VALUES 
    (
        'dddddddd-dddd-dddd-dddd-dddddddddddd',
        'Gorakhpur Medicos & Veterinary Care',
        'M/S Gorakhpur Healthcare & Animal Health LLP',
        '+919876500002',
        'support@gorakhpurmedico.in',
        'Shop 14, Cinema Road, Golghar',
        'Gorakhpur',
        '273001',
        26.7598,
        83.3725,
        TRUE,
        TRUE,
        '{"open": "08:00", "close": "22:00"}'::jsonb
    ),
    (
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        'Medical College Pharmacy & Surgical',
        'Medical Care Associates Gorakhpur',
        '+919876500010',
        'orders@medcollegepharmacy.in',
        'Near BRD Medical College Gate No. 2',
        'Gorakhpur',
        '273013',
        26.7872,
        83.3789,
        TRUE,
        TRUE,
        '{"open": "07:00", "close": "23:00"}'::jsonb
    )
ON CONFLICT DO NOTHING;

-- Pharmacy Licences (Form 20/21)
INSERT INTO pharmacy_licences (pharmacy_id, licence_type, licence_number, issued_by, valid_from, valid_until, document_vault_path, is_verified)
VALUES (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'Form 20 & 21 (Retail Drug Sale)',
    'UP-GKP-20-847291',
    'Food Safety & Drug Administration UP, Gorakhpur Division',
    '2024-01-01',
    '2029-12-31',
    'vault/licences/gkp_medico_form20.pdf',
    TRUE
);

-- Link Pharmacist with UP Pharmacy Council Registration
INSERT INTO pharmacy_users (pharmacy_id, user_id, pharmacist_reg_number, reg_council)
VALUES (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '33333333-3333-3333-3333-333333333333',
    'UP-PCR-78421',
    'Uttar Pradesh Pharmacy Council, Lucknow'
) ON CONFLICT DO NOTHING;

-- 4. SEED PRODUCT CATEGORIES (HUMAN & VETERINARY)
INSERT INTO product_categories (id, name, slug, category_domain, icon_url)
VALUES 
    -- Human Categories
    ('10000000-0000-0000-0000-000000000001', 'Fever & Pain Relief', 'human-fever-pain', 'human', '/icons/pain.svg'),
    ('10000000-0000-0000-0000-000000000002', 'Diabetes Care', 'human-diabetes', 'human', '/icons/diabetes.svg'),
    ('10000000-0000-0000-0000-000000000003', 'Cardiac & Hypertension', 'human-cardiac', 'human', '/icons/heart.svg'),
    ('10000000-0000-0000-0000-000000000004', 'First Aid & Antiseptics', 'human-first-aid', 'human', '/icons/bandaid.svg'),
    -- Veterinary Categories
    ('20000000-0000-0000-0000-000000000001', 'Cattle & Livestock Nutrition', 'vet-cattle-nutrition', 'veterinary', '/icons/cow.svg'),
    ('20000000-0000-0000-0000-000000000002', 'Pet Dewormers & Parasiticides', 'vet-pet-dewormer', 'veterinary', '/icons/paw.svg'),
    ('20000000-0000-0000-0000-000000000003', 'Veterinary Antibiotics & Bolus', 'vet-antibiotics-bolus', 'veterinary', '/icons/medicine.svg'),
    ('20000000-0000-0000-0000-000000000004', 'Pet Grooming & Skin Care', 'vet-pet-grooming', 'veterinary', '/icons/grooming.svg')
ON CONFLICT (slug) DO NOTHING;

-- 5. SEED INITIAL PRODUCTS
-- Human Products
INSERT INTO products (id, name, brand, generic_salt_name, category_id, category_domain, formulation, strength, pack_size, manufacturer, requires_prescription, schedule_type, image_url, storage_instructions)
VALUES 
    (
        'f1000000-0000-0000-0000-000000000001',
        'Dolo 650mg Tablet',
        'Micro Labs',
        'Paracetamol (650mg)',
        '10000000-0000-0000-0000-000000000001',
        'human',
        'Tablet',
        '650mg',
        '15 Tablets',
        'Micro Labs Ltd',
        FALSE,
        'OTC',
        '/products/dolo650.jpg',
        'Store in a cool and dry place away from sunlight.'
    ),
    (
        'f1000000-0000-0000-0000-000000000002',
        'Glycomet 500 SR Tablet',
        'USV Ltd',
        'Metformin Hydrochloride (500mg)',
        '10000000-0000-0000-0000-000000000002',
        'human',
        'Tablet (Extended Release)',
        '500mg',
        '20 Tablets',
        'USV Private Limited',
        TRUE,
        'Schedule H',
        '/products/glycomet500.jpg',
        'Store below 25°C. Protect from moisture.'
    ),
    (
        'f1000000-0000-0000-0000-000000000003',
        'Betadine 10% Ointment',
        'Win-Medicare',
        'Povidone Iodine (10% w/w)',
        '10000000-0000-0000-0000-000000000004',
        'human',
        'Topical Ointment',
        '10% w/w',
        '20g Tube',
        'Win-Medicare Pvt Ltd',
        FALSE,
        'OTC',
        '/products/betadine.jpg',
        'Store at room temperature.'
    ),
    -- Veterinary Products
    (
        'f2000000-0000-0000-0000-000000000001',
        'HimCal Liquid Calcium (Cattle/Buffalo)',
        'Himalaya Animal Health',
        'Calcium, Phosphorus & Vitamin D3 Tonic',
        '20000000-0000-0000-0000-000000000001',
        'veterinary',
        'Liquid Suspension',
        'High Calcium with Herbs',
        '1 Litre Bottle',
        'The Himalaya Drug Company',
        FALSE,
        'OTC',
        '/products/himcal.jpg',
        'Shake well before use. Store in dark cool place.'
    ),
    (
        'f2000000-0000-0000-0000-000000000002',
        'Drontal Plus Dewormer for Dogs',
        'Elanco',
        'Praziquantel, Pyrantel Embonate, Febantel',
        '20000000-0000-0000-0000-000000000002',
        'veterinary',
        'Flavoured Chewable Tablet',
        'Bone Shape',
        '1 Tablet per 10kg bodyweight',
        'Elanco Animal Health',
        FALSE,
        'OTC',
        '/products/drontal.jpg',
        'Store dry below 30°C.'
    ),
    (
        'f2000000-0000-0000-0000-000000000003',
        'Intacef Tazo 4.5g Veterinary Injectable',
        'Intas Animal Health',
        'Ceftriaxone Sodium & Tazobactam Sodium',
        '20000000-0000-0000-0000-000000000003',
        'veterinary',
        'Injectable Powder with WFI',
        '4.5g',
        'Vial with 20ml sterile water',
        'Intas Pharmaceuticals Ltd',
        TRUE,
        'Schedule H',
        '/products/intacef.jpg',
        'Strictly for veterinary use. Reconstituted solution must be used immediately.'
    )
ON CONFLICT (id) DO NOTHING;

-- Veterinary Species Rules & Withdrawal Periods
INSERT INTO product_species (product_id, species_name, withdrawal_period_days, precautions)
VALUES 
    ('f2000000-0000-0000-0000-000000000001', 'Cattle', 0, 'Dietary supplement. Zero milk withdrawal.'),
    ('f2000000-0000-0000-0000-000000000001', 'Buffalo', 0, 'Dietary supplement. Zero milk withdrawal.'),
    ('f2000000-0000-0000-0000-000000000002', 'Dog', 0, 'Administer according to weight. Not for puppies under 2 weeks.'),
    ('f2000000-0000-0000-0000-000000000003', 'Cattle', 7, 'Milk withdrawal period: 7 days. Meat withdrawal: 28 days. Avoid in animals sensitive to cephalosporins.')
ON CONFLICT DO NOTHING;

-- 6. SEED INITIAL INVENTORY & BATCH DETAILS
-- Inventory for Gorakhpur Medicos & Veterinary Care
INSERT INTO pharmacy_inventory (id, pharmacy_id, product_id, available_quantity, reserved_quantity, mrp, selling_price)
VALUES 
    ('e1000000-0000-0000-0000-000000000001', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'f1000000-0000-0000-0000-000000000001', 150, 0, 34.00, 30.50),
    ('e1000000-0000-0000-0000-000000000002', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'f1000000-0000-0000-0000-000000000002', 80, 0, 52.00, 46.80),
    ('e1000000-0000-0000-0000-000000000003', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'f1000000-0000-0000-0000-000000000003', 45, 0, 115.00, 103.50),
    ('e2000000-0000-0000-0000-000000000001', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'f2000000-0000-0000-0000-000000000001', 30, 0, 240.00, 216.00),
    ('e2000000-0000-0000-0000-000000000002', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'f2000000-0000-0000-0000-000000000002', 60, 0, 130.00, 120.00),
    ('e2000000-0000-0000-0000-000000000003', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'f2000000-0000-0000-0000-000000000003', 25, 0, 485.00, 436.50)
ON CONFLICT (pharmacy_id, product_id) DO NOTHING;

-- Batch Records
INSERT INTO inventory_batches (inventory_id, batch_number, mfg_date, expiry_date, quantity, is_quarantined)
VALUES 
    ('e1000000-0000-0000-0000-000000000001', 'DL-24A91', '2024-03-01', '2027-02-28', 150, FALSE),
    ('e1000000-0000-0000-0000-000000000002', 'GLY-8490', '2024-06-15', '2026-11-30', 80, FALSE),
    ('e1000000-0000-0000-0000-000000000003', 'BT-77210', '2024-01-10', '2026-12-31', 45, FALSE),
    ('e2000000-0000-0000-0000-000000000001', 'HC-202409', '2024-09-01', '2026-08-31', 30, FALSE),
    ('e2000000-0000-0000-0000-000000000002', 'DR-1934', '2024-04-01', '2027-03-31', 60, FALSE),
    ('e2000000-0000-0000-0000-000000000003', 'INT-9921', '2024-08-01', '2026-07-31', 25, FALSE);
