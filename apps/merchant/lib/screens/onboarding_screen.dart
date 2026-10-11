import 'package:flutter/material.dart';
import 'package:core_ui/core_ui.dart';
import '../services/pharmacy_onboarding_service.dart';
import 'onboarding_status_screen.dart';

class OnboardingScreen extends StatefulWidget {
  final PharmacyOnboardingService onboardingService;
  final String ownerUserId;

  const OnboardingScreen({
    Key? key,
    required this.onboardingService,
    required this.ownerUserId,
  }) : super(key: key);

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  int _currentStep = 0;
  final _formKey = GlobalKey<FormState>();

  // Form Controllers
  final _businessNameController = TextEditingController(text: 'Shukla Medicos & Vet Care');
  final _legalEntityController = TextEditingController(text: 'M/S Shukla Healthcare Pvt Ltd');
  final _gstinController = TextEditingController(text: '09AABCS1234F1Z1');
  final _addressController = TextEditingController(text: 'Civil Lines, Gorakhpur');
  final _pincodeController = TextEditingController(text: '273001');
  final _repNameController = TextEditingController(text: 'Anoop Shukla');
  final _repPhoneController = TextEditingController(text: '+919876500099');

  final _licenceForm20Controller = TextEditingController(text: 'UP-GKP-20-998877');
  final _licenceForm21Controller = TextEditingController(text: 'UP-GKP-21-998878');
  DateTime _expiryDate = DateTime.now().add(const Duration(days: 730)); // 2 years out

  final _pharmacistNameController = TextEditingController(text: 'Ramesh Chandra');
  final _pharmacistRegController = TextEditingController(text: 'UP-PH-99120');
  final _pharmacistCouncilController = TextEditingController(text: 'Uttar Pradesh Pharmacy Council');

  final _bankAccountController = TextEditingController(text: 'XXXXXX5678');
  final _ifscController = TextEditingController(text: 'SBIN0001234');

  bool _isSubmitting = false;

  @override
  void dispose() {
    _businessNameController.dispose();
    _legalEntityController.dispose();
    _gstinController.dispose();
    _addressController.dispose();
    _pincodeController.dispose();
    _repNameController.dispose();
    _repPhoneController.dispose();
    _licenceForm20Controller.dispose();
    _licenceForm21Controller.dispose();
    _pharmacistNameController.dispose();
    _pharmacistRegController.dispose();
    _pharmacistCouncilController.dispose();
    _bankAccountController.dispose();
    _ifscController.dispose();
    super.dispose();
  }

  Map<String, dynamic> _buildPayload() {
    return {
      'ownerUserId': widget.ownerUserId,
      'businessName': _businessNameController.text.trim(),
      'legalEntityName': _legalEntityController.text.trim(),
      'gstin': _gstinController.text.trim(),
      'addressLine1': _addressController.text.trim(),
      'city': 'Gorakhpur',
      'pincode': _pincodeController.text.trim(),
      'latitude': 26.7580,
      'longitude': 83.3750,
      'deliveryRadiusM': 5000,
      'operatingHours': {'open': '08:00', 'close': '22:00'},
      'authorisedRepresentativeName': _repNameController.text.trim(),
      'authorisedRepresentativePhone': _repPhoneController.text.trim(),
      'licenceForm20': _licenceForm20Controller.text.trim(),
      'licenceForm21': _licenceForm21Controller.text.trim(),
      'licenceExpiryDate': _expiryDate.toIso8601String().split('T')[0],
      'licenceDocPath': 'docs/licences/form20_up_gkp_signed.pdf',
      'premisesDocPath': 'docs/premises/civil_lines_layout.pdf',
      'idDocPath': 'docs/id/representative_aadhaar.pdf',
      'pharmacistName': _pharmacistNameController.text.trim(),
      'pharmacistRegNumber': _pharmacistRegController.text.trim(),
      'pharmacistCouncil': _pharmacistCouncilController.text.trim(),
      'pharmacistRegDocPath': 'docs/pharmacist/up_council_reg.pdf',
      'bankAccountMasked': _bankAccountController.text.trim(),
      'bankIfsc': _ifscController.text.trim(),
    };
  }

  Future<void> _handleSaveDraft() async {
    setState(() => _isSubmitting = true);
    try {
      final app = await widget.onboardingService.saveDraft(_buildPayload());
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Onboarding draft saved successfully.'), backgroundColor: PharmacyColors.success),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error saving draft: $e'), backgroundColor: PharmacyColors.danger),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isSubmitting = true);
    try {
      // 1. Save draft
      final draft = await widget.onboardingService.saveDraft(_buildPayload());
      // 2. Submit for verification
      final submitted = await widget.onboardingService.submitApplication(draft.id);
      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (_) => OnboardingStatusScreen(
              onboardingService: widget.onboardingService,
              application: submitted,
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Submission failed: $e'), backgroundColor: PharmacyColors.danger),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Partner Pharmacy Onboarding'),
        actions: [
          TextButton(
            onPressed: _isSubmitting ? null : _handleSaveDraft,
            child: const Text('Save Draft', style: TextStyle(color: PharmacyColors.primary, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: Stepper(
          currentStep: _currentStep,
          onStepContinue: () {
            if (_currentStep < 3) {
              setState(() => _currentStep += 1);
            } else {
              _handleSubmit();
            }
          },
          onStepCancel: () {
            if (_currentStep > 0) {
              setState(() => _currentStep -= 1);
            }
          },
          controlsBuilder: (context, details) {
            final isLastStep = _currentStep == 3;
            return Padding(
              padding: const EdgeInsets.only(top: 20.0),
              child: Row(
                children: [
                  ElevatedButton(
                    onPressed: _isSubmitting ? null : details.onStepContinue,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: PharmacyColors.primary,
                      minimumSize: const Size(160, 48),
                    ),
                    child: _isSubmitting
                        ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : Text(isLastStep ? 'SUBMIT FOR VERIFICATION' : 'NEXT STEP'),
                  ),
                  if (_currentStep > 0) ...[
                    const SizedBox(width: 12),
                    OutlinedButton(
                      onPressed: details.onStepCancel,
                      style: OutlinedButton.styleFrom(minimumSize: const Size(100, 48)),
                      child: const Text('BACK'),
                    ),
                  ],
                ],
              ),
            );
          },
          steps: [
            // STEP 1: Pharmacy Entity & Address
            Step(
              title: const Text('Pharmacy & Premises'),
              subtitle: const Text('Gorakhpur Location, Entity & GSTIN'),
              isActive: _currentStep >= 0,
              content: Column(
                children: [
                  TextFormField(
                    controller: _businessNameController,
                    decoration: const InputDecoration(labelText: 'Trade / Pharmacy Name'),
                    validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _legalEntityController,
                    decoration: const InputDecoration(labelText: 'Legal Entity Name'),
                    validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _gstinController,
                          decoration: const InputDecoration(labelText: 'GSTIN (Optional)'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextFormField(
                          controller: _pincodeController,
                          decoration: const InputDecoration(labelText: 'Pincode (Gorakhpur)'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _addressController,
                    decoration: const InputDecoration(labelText: 'Premises Address Line 1'),
                  ),
                ],
              ),
            ),

            // STEP 2: Statutory Drug Licences
            Step(
              title: const Text('Drug Sale Licences'),
              subtitle: const Text('UP FDA Form 20 & Form 21 Registration'),
              isActive: _currentStep >= 1,
              content: Column(
                children: [
                  TextFormField(
                    controller: _licenceForm20Controller,
                    decoration: const InputDecoration(
                      labelText: 'Form 20 Licence Number (Retail Allopathic)',
                      hintText: 'UP-GKP-20-XXXXXX',
                    ),
                    validator: (v) => (v == null || v.isEmpty) ? 'Required for medicine delivery' : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _licenceForm21Controller,
                    decoration: const InputDecoration(
                      labelText: 'Form 21 Licence Number (Specified C/C1 Drugs)',
                      hintText: 'UP-GKP-21-XXXXXX',
                    ),
                  ),
                  const SizedBox(height: 12),
                  ListTile(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                      side: const BorderSide(color: PharmacyColors.cardBorder),
                    ),
                    title: const Text('Licence Validity Expiry Date', style: TextStyle(fontSize: 14)),
                    subtitle: Text(
                      _expiryDate.toIso8601String().split('T')[0],
                      style: const TextStyle(fontWeight: FontWeight.w700, color: PharmacyColors.primary),
                    ),
                    trailing: const Icon(Icons.calendar_month, color: PharmacyColors.primary),
                    onTap: () async {
                      final picked = await showDatePicker(
                        context: context,
                        initialDate: _expiryDate,
                        firstDate: DateTime.now(),
                        lastDate: DateTime.now().add(const Duration(days: 3650)),
                      );
                      if (picked != null) setState(() => _expiryDate = picked);
                    },
                  ),
                  const SizedBox(height: 12),
                  _buildUploadTile('Form 20/21 Certificate PDF', 'form20_up_gkp_signed.pdf', Icons.verified),
                  const SizedBox(height: 8),
                  _buildUploadTile('Premises Inspection Blueprint', 'civil_lines_layout.pdf', Icons.storefront),
                ],
              ),
            ),

            // STEP 3: Registered Dispensing Pharmacist
            Step(
              title: const Text('Registered Pharmacist'),
              subtitle: const Text('State Pharmacy Council Credentials'),
              isActive: _currentStep >= 2,
              content: Column(
                children: [
                  TextFormField(
                    controller: _pharmacistNameController,
                    decoration: const InputDecoration(labelText: 'Qualified Pharmacist Full Name'),
                    validator: (v) => (v == null || v.isEmpty) ? 'Pharmacist name is required by law' : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _pharmacistRegController,
                    decoration: const InputDecoration(
                      labelText: 'Pharmacy Council Registration Number',
                      hintText: 'UP-PH-99120',
                    ),
                    validator: (v) => (v == null || v.isEmpty) ? 'State registration number is required' : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _pharmacistCouncilController,
                    decoration: const InputDecoration(labelText: 'Registering State Pharmacy Council'),
                  ),
                  const SizedBox(height: 12),
                  _buildUploadTile('Pharmacist Registration Certificate', 'up_council_reg.pdf', Icons.badge),
                ],
              ),
            ),

            // STEP 4: Settlement Details
            Step(
              title: const Text('Settlement & KYC'),
              subtitle: const Text('Encrypted Bank Payout Details'),
              isActive: _currentStep >= 3,
              content: Column(
                children: [
                  TextFormField(
                    controller: _bankAccountController,
                    decoration: const InputDecoration(labelText: 'Bank Account Number (Masked in UI)'),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _ifscController,
                    decoration: const InputDecoration(labelText: 'Bank IFSC Code'),
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: PharmacyColors.infoBg,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Text(
                      'Security Notice: Bank accounts and tax identifiers are stored with field-level encryption. The pharmacy stays invisible to customers until approved by Platform Admin.',
                      style: TextStyle(fontSize: 12, color: PharmacyColors.info, height: 1.3),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildUploadTile(String label, String fileName, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(8),
        border: BorderSide(color: Colors.grey.shade300),
      ),
      child: Row(
        children: [
          Icon(icon, color: PharmacyColors.primary, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                Text(fileName, style: TextStyle(fontSize: 11, color: Colors.grey.shade600)),
              ],
            ),
          ),
          const Icon(Icons.check_circle, color: PharmacyColors.success, size: 18),
        ],
      ),
    );
  }
}
