import 'package:flutter/material.dart';
import '../services/customer_profile_service.dart';

class ProfileSetupScreen extends StatefulWidget {
  final String token;
  final String? userId;
  final String phone;
  final CustomerProfileService profileService;
  final Function(CustomerProfile profile) onProfileSaved;
  final VoidCallback onCancel;

  const ProfileSetupScreen({
    super.key,
    required this.token,
    this.userId,
    required this.phone,
    required this.profileService,
    required this.onProfileSaved,
    required this.onCancel,
  });

  @override
  State<ProfileSetupScreen> createState() => _ProfileSetupScreenState();
}

class _ProfileSetupScreenState extends State<ProfileSetupScreen> {
  final TextEditingController _nameController = TextEditingController();
  DateTime? _selectedDob;
  bool _termsAccepted = false;
  bool _isLoading = false;
  String? _errorMessage;
  String? _nameError;
  String? _dobError;

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  void _validateName(String val) {
    setState(() {
      _nameError = CustomerProfileService.validateFullName(val);
    });
  }

  Future<void> _pickDateOfBirth() async {
    final now = DateTime.now();
    final eighteenYearsAgo = DateTime(now.year - 18, now.month, now.day);
    final initialDate = _selectedDob ?? eighteenYearsAgo;

    final picked = await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: DateTime(now.year - 120, 1, 1),
      lastDate: now,
      helpText: 'SELECT YOUR DATE OF BIRTH',
      fieldLabelText: 'Date of Birth (DD/MM/YYYY)',
    );

    if (picked != null) {
      final dobErr = CustomerProfileService.validateDateOfBirth(picked);
      setState(() {
        _selectedDob = picked;
        _dobError = dobErr;
      });

      if (!CustomerProfileService.isAdult(picked)) {
        _showUnderageDialog();
      }
    }
  }

  void _showUnderageDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.shield_outlined, color: Color(0xFFDC2626)),
            SizedBox(width: 8),
            Text('Age Requirement', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
          ],
        ),
        content: const Text(
          'Medcure medicine delivery is strictly available to individuals aged 18 and older in compliance with pharmaceutical delivery regulations.\n\nAccess cannot be granted to minors.',
          style: TextStyle(color: Color(0xFF475569), height: 1.4),
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              setState(() {
                _selectedDob = null;
                _dobError = 'You must be at least 18 years old to proceed.';
              });
            },
            child: const Text('Understood'),
          ),
        ],
      ),
    );
  }

  Future<void> _handleSubmit() async {
    final name = _nameController.text.trim();
    _validateName(name);

    if (_selectedDob == null) {
      setState(() => _dobError = 'Please select your Date of Birth');
      return;
    }

    if (!CustomerProfileService.isAdult(_selectedDob!)) {
      _showUnderageDialog();
      return;
    }

    if (!_termsAccepted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please accept the Terms of Service & Privacy Policy')),
      );
      return;
    }

    if (_nameError != null || _dobError != null) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final res = await widget.profileService.updateProfile(
      token: widget.token,
      userId: widget.userId,
      fullName: name,
      dateOfBirth: _selectedDob!,
      termsAccepted: _termsAccepted,
    );

    setState(() => _isLoading = false);

    if (res['success'] == true && res['user'] != null) {
      final updatedProfile = CustomerProfile.fromJson(res['user'] as Map<String, dynamic>);
      widget.onProfileSaved(updatedProfile);
    } else {
      if (res['status'] == 403) {
        _showUnderageDialog();
      } else {
        setState(() {
          _errorMessage = res['error']?.toString() ?? 'Failed to save profile. Please try again.';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final dobText = _selectedDob != null
        ? '${_selectedDob!.day.toString().padLeft(2, '0')}/${_selectedDob!.month.toString().padLeft(2, '0')}/${_selectedDob!.year}'
        : 'Select Date of Birth (DD/MM/YYYY)';

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Complete Your Profile'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: widget.onCancel,
        ),
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20.0),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 480),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text(
                  'One-Time Profile Setup',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Required for regulatory compliance and prescription delivery',
                  style: TextStyle(color: Color(0xFF64748B), fontSize: 14),
                ),
                const SizedBox(height: 28),

                // Full Name
                TextField(
                  controller: _nameController,
                  textCapitalization: TextCapitalization.words,
                  onChanged: _validateName,
                  decoration: InputDecoration(
                    labelText: 'Full Name (as per ID)',
                    hintText: 'e.g. Rahul Sharma',
                    prefixIcon: const Icon(Icons.person_outline_rounded, color: Color(0xFF0D9488)),
                    errorText: _nameError,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
                const Padding(
                  padding: EdgeInsets.only(top: 4.0, left: 12.0),
                  child: Text(
                    'Used for order receipts and verified pharmacy delivery',
                    style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                  ),
                ),
                const SizedBox(height: 20),

                // Date of Birth Field
                InkWell(
                  onTap: _pickDateOfBirth,
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    decoration: BoxDecoration(
                      border: Border.all(
                        color: _dobError != null ? const Color(0xFFDC2626) : const Color(0xFFCBD5E1),
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.cake_outlined, color: Color(0xFF0D9488)),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            dobText,
                            style: TextStyle(
                              fontSize: 16,
                              color: _selectedDob != null ? const Color(0xFF0F172A) : const Color(0xFF94A3B8),
                            ),
                          ),
                        ),
                        const Icon(Icons.calendar_month_rounded, color: Color(0xFF64748B)),
                      ],
                    ),
                  ),
                ),
                if (_dobError != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 4.0, left: 12.0),
                    child: Text(
                      _dobError!,
                      style: const TextStyle(fontSize: 12, color: Color(0xFFDC2626)),
                    ),
                  ),
                const Padding(
                  padding: EdgeInsets.only(top: 4.0, left: 12.0),
                  child: Text(
                    'Collected solely for statutory 18+ age gating. Never shared with delivery riders.',
                    style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                  ),
                ),

                const SizedBox(height: 24),

                // Checkbox: Terms & Privacy
                CheckboxListTile(
                  value: _termsAccepted,
                  onChanged: (val) => setState(() => _termsAccepted = val ?? false),
                  contentPadding: EdgeInsets.zero,
                  controlAffinity: ListTileControlAffinity.leading,
                  title: const Text(
                    'I confirm that I am at least 18 years old and accept the Terms of Service and Privacy Policy (v1.0.0).',
                    style: TextStyle(fontSize: 13, color: Color(0xFF334155)),
                  ),
                ),

                if (_errorMessage != null) ...[
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEF2F2),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFFFCA5A5)),
                    ),
                    child: Text(
                      _errorMessage!,
                      style: const TextStyle(color: Color(0xFF991B1B), fontSize: 13),
                    ),
                  ),
                ],

                const SizedBox(height: 32),

                // Submit button
                ElevatedButton(
                  onPressed: _isLoading ? null : _handleSubmit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0D9488),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    elevation: 0,
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : const Text(
                          'Save & Continue',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
