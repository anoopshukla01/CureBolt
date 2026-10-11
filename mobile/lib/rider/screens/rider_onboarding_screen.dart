import 'package:flutter/material.dart';
import '../services/rider_auth_service.dart';
import '../utils/rider_validators.dart';
import 'rider_application_status_screen.dart';

class RiderOnboardingScreen extends StatefulWidget {
  final RiderAuthService authService;

  const RiderOnboardingScreen({super.key, required this.authService});

  @override
  State<RiderOnboardingScreen> createState() => _RiderOnboardingScreenState();
}

class _RiderOnboardingScreenState extends State<RiderOnboardingScreen> {
  int _currentStep = 0;
  final _formKey = GlobalKey<FormState>();

  // Form Fields
  final _fullNameController = TextEditingController(text: 'Vikas Yadav');
  final _phoneController = TextEditingController();
  final _govIdNumberController = TextEditingController(text: '1234-5678-9012');
  final _dlNumberController = TextEditingController(text: 'UP5320210098765');
  final _vehicleRegController = TextEditingController(text: 'UP53-AB-1234');
  final _emergencyNameController = TextEditingController(text: 'Ramesh Yadav');
  final _emergencyPhoneController = TextEditingController(text: '9876511111');
  final _emergencyRelationController = TextEditingController(text: 'Brother');
  final _bankAccountController = TextEditingController(text: '123456789012');
  final _bankIfscController = TextEditingController(text: 'SBIN0000123');
  final _upiIdController = TextEditingController(text: 'vikas@oksbi');

  String _govIdType = 'aadhaar';
  String _vehicleType = 'motorcycle';
  DateTime _dlExpiryDate = DateTime.now().add(const Duration(days: 365 * 4));

  bool _isSubmitting = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    final user = widget.authService.currentUser;
    if (user != null) {
      _phoneController.text = user.phone;
      _fullNameController.text = user.fullName;
    }
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _phoneController.dispose();
    _govIdNumberController.dispose();
    _dlNumberController.dispose();
    _vehicleRegController.dispose();
    _emergencyNameController.dispose();
    _emergencyPhoneController.dispose();
    _emergencyRelationController.dispose();
    _bankAccountController.dispose();
    _bankIfscController.dispose();
    _upiIdController.dispose();
    super.dispose();
  }

  Future<void> _selectExpiryDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _dlExpiryDate,
      firstDate: DateTime.now().add(const Duration(days: 1)),
      lastDate: DateTime.now().add(const Duration(days: 365 * 25)),
    );
    if (picked != null) {
      setState(() => _dlExpiryDate = picked);
    }
  }

  Future<void> _handleSubmit() async {
    // Validate current step
    final dlError = RiderValidators.validateDrivingLicence(_dlNumberController.text);
    if (dlError != null) {
      setState(() => _errorMessage = dlError);
      return;
    }

    final dlExpiryError = RiderValidators.validateLicenceExpiry(_dlExpiryDate);
    if (dlExpiryError != null) {
      setState(() => _errorMessage = dlExpiryError);
      return;
    }

    final vehicleError = RiderValidators.validateVehicleRegistration(_vehicleRegController.text);
    if (vehicleError != null) {
      setState(() => _errorMessage = vehicleError);
      return;
    }

    final emergencyError = RiderValidators.validateEmergencyContact(
      riderPhone: _phoneController.text,
      emergencyPhone: _emergencyPhoneController.text,
      emergencyName: _emergencyNameController.text,
    );
    if (emergencyError != null) {
      setState(() => _errorMessage = emergencyError);
      return;
    }

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    final success = await widget.authService.submitOnboarding(
      fullName: _fullNameController.text.trim(),
      phone: _phoneController.text.trim(),
      selfieDocPath: '/secure/riders/${widget.authService.currentUser?.id}/selfie.jpg',
      govIdType: _govIdType,
      govIdNumber: _govIdNumberController.text.trim(),
      govIdDocPath: '/secure/riders/${widget.authService.currentUser?.id}/govid.pdf',
      drivingLicenceNumber: _dlNumberController.text.trim(),
      drivingLicenceDocPath: '/secure/riders/${widget.authService.currentUser?.id}/dl.pdf',
      drivingLicenceExpiryDate: _dlExpiryDate.toIso8601String().substring(0, 10),
      vehicleType: _vehicleType,
      vehicleRegistrationNumber: _vehicleRegController.text.trim().toUpperCase(),
      vehicleRcDocPath: '/secure/riders/${widget.authService.currentUser?.id}/rc.pdf',
      emergencyContactName: _emergencyNameController.text.trim(),
      emergencyContactPhone: _emergencyPhoneController.text.trim(),
      emergencyContactRelation: _emergencyRelationController.text.trim(),
      bankAccount: _bankAccountController.text.trim(),
      bankIfsc: _bankIfscController.text.trim().toUpperCase(),
      upiId: _upiIdController.text.trim(),
    );

    setState(() => _isSubmitting = false);

    if (success && mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => RiderApplicationStatusScreen(authService: widget.authService),
        ),
      );
    } else {
      setState(() {
        _errorMessage = widget.authService.errorMessage ?? 'Submission failed. Please check your details.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Rider Onboarding Verification'),
        backgroundColor: Colors.white,
        elevation: 0.5,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Notice banner
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFEFF6FF),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFBFDBFE)),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.verified_user_outlined, color: Color(0xFF1D4ED8), size: 22),
                    SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Documents are verified directly with regional RTO and platform compliance before dispatch authorization.',
                        style: TextStyle(fontSize: 12, color: Color(0xFF1E3A8A)),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Section 1: Personal Details & Live Photo
              _buildSectionCard(
                title: '1. Personal & Identity Documents',
                icon: Icons.person_outline,
                children: [
                  _buildTextField('Full Name', _fullNameController),
                  const SizedBox(height: 12),
                  _buildTextField('Mobile Phone', _phoneController, readOnly: true),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    value: _govIdType,
                    decoration: InputDecoration(
                      labelText: 'Government ID Type',
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    items: const [
                      DropdownMenuItem(value: 'aadhaar', child: Text('Aadhaar Card')),
                      DropdownMenuItem(value: 'pan', child: Text('PAN Card')),
                      DropdownMenuItem(value: 'voter_id', child: Text('Voter Identity Card')),
                    ],
                    onChanged: (v) => setState(() => _govIdType = v!),
                  ),
                  const SizedBox(height: 12),
                  _buildTextField('Government ID Number', _govIdNumberController),
                  const SizedBox(height: 12),
                  _buildUploadTile('Live Verification Selfie', 'Captured & Stored in Private Bucket', Icons.camera_alt),
                  const SizedBox(height: 8),
                  _buildUploadTile('Government ID Document', 'Encrypted PDF / Image', Icons.file_present),
                ],
              ),
              const SizedBox(height: 16),

              // Section 2: Driving Licence & Vehicle
              _buildSectionCard(
                title: '2. Vehicle & Driving Credentials',
                icon: Icons.two_wheeler,
                children: [
                  _buildTextField('Driving Licence Number', _dlNumberController),
                  const SizedBox(height: 12),
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Licence Expiry Date', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                    subtitle: Text(
                      '${_dlExpiryDate.day}/${_dlExpiryDate.month}/${_dlExpiryDate.year}',
                      style: const TextStyle(fontSize: 15, color: Color(0xFF0F766E), fontWeight: FontWeight.w700),
                    ),
                    trailing: OutlinedButton(
                      onPressed: _selectExpiryDate,
                      child: const Text('Change Date'),
                    ),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    value: _vehicleType,
                    decoration: InputDecoration(
                      labelText: 'Vehicle Category',
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    items: const [
                      DropdownMenuItem(value: 'motorcycle', child: Text('Motorcycle (Petrol)')),
                      DropdownMenuItem(value: 'scooter', child: Text('Scooter (Petrol)')),
                      DropdownMenuItem(value: 'ev_scooter', child: Text('Electric Two-Wheeler (EV)')),
                      DropdownMenuItem(value: 'bicycle', child: Text('Bicycle')),
                    ],
                    onChanged: (v) => setState(() => _vehicleType = v!),
                  ),
                  const SizedBox(height: 12),
                  _buildTextField('Vehicle Registration Number', _vehicleRegController, hint: 'UP53-AB-1234'),
                  const SizedBox(height: 8),
                  _buildUploadTile('Vehicle RC & Insurance Copy', 'Verified with VAHAN API', Icons.fact_check),
                ],
              ),
              const SizedBox(height: 16),

              // Section 3: Emergency Contact
              _buildSectionCard(
                title: '3. Emergency Contact (SOS)',
                icon: Icons.emergency,
                children: [
                  _buildTextField('Contact Name', _emergencyNameController),
                  const SizedBox(height: 12),
                  _buildTextField('Relationship', _emergencyRelationController, hint: 'Parent, Sibling, Spouse'),
                  const SizedBox(height: 12),
                  _buildTextField(
                    'Emergency Mobile Phone',
                    _emergencyPhoneController,
                    hint: 'Must be different from rider phone',
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Section 4: Payout Details (Encrypted)
              _buildSectionCard(
                title: '4. Direct Settlement & Payout Details',
                icon: Icons.account_balance,
                children: [
                  const Text(
                    'Bank and UPI credentials are encrypted at rest and masked in operator views.',
                    style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                  ),
                  const SizedBox(height: 12),
                  _buildTextField('Bank Account Number', _bankAccountController),
                  const SizedBox(height: 12),
                  _buildTextField('Bank IFSC Code', _bankIfscController, hint: 'SBIN0000123'),
                  const SizedBox(height: 12),
                  _buildTextField('UPI ID (Optional)', _upiIdController, hint: 'user@bank'),
                ],
              ),
              const SizedBox(height: 20),

              if (_errorMessage != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEE2E2),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFFEF4444)),
                  ),
                  child: Text(
                    _errorMessage!,
                    style: const TextStyle(color: Color(0xFF991B1B), fontSize: 13),
                  ),
                ),
                const SizedBox(height: 16),
              ],

              ElevatedButton(
                onPressed: _isSubmitting ? null : _handleSubmit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF059669),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                child: _isSubmitting
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text(
                        'Submit Application For Verification',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionCard({
    required String title,
    required IconData icon,
    required List<Widget> children,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: const Color(0xFF0F766E), size: 20),
              const SizedBox(width: 8),
              Text(
                title,
                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: Color(0xFF0B192C)),
              ),
            ],
          ),
          const Divider(height: 24),
          ...children,
        ],
      ),
    );
  }

  Widget _buildTextField(String label, TextEditingController controller, {bool readOnly = false, String? hint}) {
    return TextField(
      controller: controller,
      readOnly: readOnly,
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        filled: true,
        fillColor: readOnly ? const Color(0xFFF1F5F9) : Colors.white,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
      ),
    );
  }

  Widget _buildUploadTile(String label, String subtitle, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFCBD5E1)),
      ),
      child: Row(
        children: [
          Icon(icon, color: const Color(0xFF059669), size: 22),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                Text(subtitle, style: const TextStyle(color: Color(0xFF64748B), fontSize: 11)),
              ],
            ),
          ),
          const Icon(Icons.check_circle, color: Color(0xFF10B981), size: 20),
        ],
      ),
    );
  }
}
