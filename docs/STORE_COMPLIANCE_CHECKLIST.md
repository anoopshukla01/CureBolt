# App Store & Google Play Store Compliance Checklist

## 1. Indian Pharmaceutical & Telemedicine Regulatory Requirements
- [ ] **Retail Drug Licence Verification**: Verified partner pharmacies must hold active Form 20B/21B retail drug licences issued by the Uttar Pradesh Food Safety and Drug Administration.
- [ ] **Prescription Gating**: Apps must not allow ordering Schedule H / H1 / X medications without registered human pharmacist approval.
- [ ] **Prohibition of Medical Advice**: The application explicitly disclaims offering medical consultations or diagnostics.
- [ ] **Veterinary Medicine Separation**: Veterinary medications must disclose withdrawal periods, food-producing animal restrictions, and target species.

## 2. Google Play Store Specific Policies
- [ ] **Health & Medicine App Declaration**: Complete Health Apps Declaration on Google Play Console.
- [ ] **Location Permission Rationale**:
  - Customer App: Foreground location only ("While using the app") for delivery pin setting.
  - Rider App: Background location disclosure with explicit in-app prompt and prominent disclosure.
- [ ] **SMS Permission Compliance**: Use SMS Retriever API or SMS User Consent API; never request sensitive `READ_SMS` permission.
- [ ] **High-Importance Notification Channel**: Order dispatch alerts configured under `com.medcure.shop.orders` with proper notification importance.

## 3. Apple App Store Guidelines
- [ ] **Guideline 1.4.3 (Medical Research & Services)**: Provide documentation demonstrating retail drug partner affiliations.
- [ ] **Privacy Nutrition Labels**:
  - Accurate data collection categorization (Contact Info, Location for fulfilment).
  - Explicit disclosure that health and prescription documents are never linked for third-party tracking.
- [ ] **Sign in with Apple**: Ensure account deletion and privacy-preserving login options are available where third-party OAuth is exposed.
- [ ] **Age Rating**: App rated 17+ or 18+ due to pharmacy/medicine delivery nature.

## 4. Telecom & SMS Transactional Compliance (India)
- [ ] **DLT Registration**: Enterprise registration on Telecom Commercial Communications Customer Preference Regulations (TCCCPR) DLT portal (e.g. Jio / Airtel / Vil DLT).
- [ ] **Registered Sender ID**: 6-character alphabetic sender header (e.g., `MEDCUR`).
- [ ] **Approved Message Templates**: Transactional OTP templates registered verbatim:
  - `Your Medcure verification code is {#var#}. Valid for 5 minutes. Do not share with anyone. - Medcure Healthcare`
