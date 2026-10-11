# Medcure Three-App Monorepo Architecture

## 1. Executive Summary
Medcure is a quick-commerce healthcare delivery platform serving Gorakhpur, Uttar Pradesh, India. The platform is architected as a **single monorepo** supporting three independent mobile applications and an admin web command center:

| App | Bundle ID | Audience | Primary Accent | Accent Purpose |
|---|---|---|---|---|
| **Customer App** | `com.medcure.customer` | Patients & Pet Owners | Deep Teal (`#0D9488`) | Calming, healthcare trust |
| **Delivery Partner App** | `com.medcure.rider` | Approved Fleet Riders | Vivid Amber (`#EA580C`) | High visibility, quick action |
| **Shopkeeper Counter App** | `com.medcure.shop` | Pharmacists & Staff | Ocean Sky (`#0284C7`) | Clean clinical counter |
| **Admin Operations Web** | Next.js Web App | Dispatchers, Support & Compliance | Slate Blue (`#1E293B`) | Mission-control telemetry |

---

## 2. Monorepo Dependency Rules

```
                      +-----------------------------+
                      |          Apps Layer         |
                      |  customer | rider | merchant |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |     Shared Packages Layer    |
                      | core_models | core_ui | ... |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |         Backend API         |
                      |   PostgreSQL / PostGIS / RLS|
                      +-----------------------------+
```

1. **Apps depend on Packages.** Packages **NEVER** depend on Apps.
2. **Apps NEVER import peer Apps.**
3. **Packages contain NO hardcoded secrets**, NO service-role keys, and NO app-specific business screens.
4. **Enforced via CI**: `node scripts/check_dependency_rules.js` validates all imports on every pull request.

---

## 3. Separate Login Scopes & Role Gate (`POST /api/v1/auth/app-session`)

Every application authenticates via OTP against the unified auth backend, but immediately calls `POST /api/v1/auth/app-session` with its bundle ID:
- If `usr-rider-1` tries to open `com.medcure.customer`, the server responds with **HTTP 403**: `"This account can't use this app"`.
- If `usr-cust-1` tries to open `com.medcure.rider`, the server responds with **HTTP 403**.
- If `usr-staff-1` opens `com.medcure.shop`, the server approves session establishment with authorized scopes.

---

## 4. Statutory Safety & Data Minimisation

- **Statutory Pricing Rule**: `sellingPrice <= mrp` is enforced both in the Flutter models (`packages/core_models`) and in database constraints. Selling price can never legally exceed Maximum Retail Price.
- **Rider Data Minimisation**: Delivery partners receive pickup and drop-off coordinates, recipient phone, and parcel ID. They **NEVER** receive prescription images, patient age, diagnosis notes, or medicine item lists.
- **Prescription Gate**: Schedule H, H1, and X medicines cannot proceed through checkout without signed pharmacist verification.
- **Human vs Veterinary Segregation**: The platform features separate category taxonomies and visual cues for human and animal healthcare products.
