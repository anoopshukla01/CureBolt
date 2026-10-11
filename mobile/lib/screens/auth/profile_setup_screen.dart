import 'package:flutter/material.dart';
import '../../services/auth_service.dart';
import '../../utils/validators.dart';

class ProfileSetupScreen extends StatefulWidget {
  final AuthService authService;
  final String phone;

  const ProfileSetupScreen({
    super.key,
    required this.authService,
    required this.phone,
  });

  @override
  State<ProfileSetupScreen> createState() => _ProfileSetupScreenState();
}

class _ProfileSetupScreenState extends State<ProfileSetupScreen> {
  final _nameController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  DateTime? _selectedDob;
  bool _termsAccepted = false;
  bool _isSaving = false;
  String? _nameError;
  String? _dobError;
  String? _termsError;

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _pickDateOfBirth() async {
    final now = DateTime.now();
    final eighteenYearsAgo = DateTime(now.year - 18, now.month, now.day);
    final earliestDate = DateTime(now.year - 120, 1, 1);

    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDob ?? eighteenYearsAgo,
      firstDate: earliestDate,
      lastDate: now,
      helpText: 'SELECT YOUR DATE OF BIRTH',
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: Color(0xFF028391),
              onPrimary: Colors.white,
              onSurface: Color(0xFF0B192C),
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() {
        _selectedDob = picked;
        _dobError = Validators.validateDateOfBirth(picked);
      });
    }
  }

  Future<void> _handleSaveProfile() async {
    setState(() {
      _nameError = Validators.validateFullName(_nameController.text);
      _dobError = Validators.validateDateOfBirth(_selectedDob);
      _termsError = _termsAccepted
          ? null
          : 'You must accept the Terms of Service & Privacy Policy to continue.';
    });

    if (_nameError != null || _dobError != null || _termsError != null) {
      return;
    }

    // Verify age >= 18 gating
    final age = Validators.calculateAge(_selectedDob!);
    if (age < 18) {
      _showUnderageDialog();
      return;
    }

    setState(() {
      _isSaving = true;
    });

    try {
      final success = await widget.authService.updateProfile(
        fullName: _nameController.text.trim(),
        dateOfBirth: _selectedDob!,
        termsAccepted: _termsAccepted,
      );

      if (!mounted) return;
      setState(() {
        _isSaving = false;
      });

      if (success) {
        // Successfully completed profile setup!
        Navigator.popUntil(context, (route) => route.isFirst);
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isSaving = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceAll('Exception: ', '')),
          backgroundColor: Colors.red.shade700,
        ),
      );
    }
  }

  void _showUnderageDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.shield_outlined, color: Color(0xFFD97706), size: 26),
            SizedBox(width: 8),
            Text('Age Requirement (18+)'),
          ],
        ),
        content: const Text(
          'Medcure is a medicine and pharmaceutical delivery platform. Under Indian pharmaceutical regulations and platform policy, our delivery services are reserved for adults aged 18 and older.\n\nWe cannot create an active profile for minors. An adult family member or guardian may place the order instead.',
          style: TextStyle(fontSize: 14, height: 1.5, color: Color(0xFF334155)),
        ),
        actions: [
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF028391),
              foregroundColor: Colors.white,
            ),
            child: const Text('Understand'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Complete Profile'),
        elevation: 0,
        backgroundColor: Colors.white,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Set up your details',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF0B192C),
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'We require this information to comply with medicine dispensing standards.',
                  style: TextStyle(
                    fontSize: 14,
                    color: Color(0xFF64748B),
                  ),
                ),
                const SizedBox(height: 28),

                // 1. Full Name Input
                const Text(
                  'Full Name',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF0B192C),
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Used on receipts and to confirm delivery handover.',
                  style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _nameController,
                  textCapitalization: TextCapitalization.words,
                  decoration: InputDecoration(
                    hintText: 'e.g. Pooja Srivastava',
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: const BorderSide(color: Color(0xFF028391), width: 2),
                    ),
                    errorText: _nameError,
                  ),
                  onChanged: (_) {
                    if (_nameError != null) {
                      setState(() {
                        _nameError = null;
                      });
                    }
                  },
                ),
                const SizedBox(height: 24),

                // 2. Date of Birth Picker
                const Text(
                  'Date of Birth',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF0B192C),
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Required for statutory age gating (18+). Never shared with delivery riders.',
                  style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                ),
                const SizedBox(height: 8),
                InkWell(
                  onTap: _pickDateOfBirth,
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    decoration: BoxDecoration(
                      border: Border.all(
                        color: _dobError != null ? Colors.red.shade400 : const Color(0xFFCBD5E1),
                      ),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          _selectedDob == null
                              ? 'DD / MM / YYYY'
                              : '${_selectedDob!.day.toString().padLeft(2, '0')}/${_selectedDob!.month.toString().padLeft(2, '0')}/${_selectedDob!.year}',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: _selectedDob == null ? FontWeight.normal : FontWeight.w600,
                            color: _selectedDob == null
                                ? const Color(0xFF94A3B8)
                                : const Color(0xFF0B192C),
                          ),
                        ),
                        const Icon(
                          Icons.calendar_today_rounded,
                          size: 20,
                          color: Color(0xFF028391),
                        ),
                      ],
                    ),
                  ),
                ),
                if (_dobError != null) ...[
                  const SizedBox(height: 6),
                  Text(
                    _dobError!,
                    style: const TextStyle(color: Colors.red, fontSize: 12),
                  ),
                ],
                const SizedBox(height: 28),

                // 3. Terms & Privacy Checkbox
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SizedBox(
                      width: 24,
                      height: 24,
                      child: Checkbox(
                        value: _termsAccepted,
                        activeColor: const Color(0xFF028391),
                        onChanged: (val) {
                          setState(() {
                            _termsAccepted = val ?? false;
                            if (_termsAccepted) _termsError = null;
                          });
                        },
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Text(
                        'I confirm I am at least 18 years old and agree to the Terms of Service and Privacy Policy (v1.0-2026).',
                        style: TextStyle(
                          fontSize: 13,
                          height: 1.4,
                          color: Color(0xFF334155),
                        ),
                      ),
                    ),
                  ],
                ),
                if (_termsError != null) ...[
                  const SizedBox(height: 6),
                  Text(
                    _termsError!,
                    style: const TextStyle(color: Colors.red, fontSize: 12),
                  ),
                ],

                const SizedBox(height: 36),

                // Save Profile Button
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton(
                    onPressed: _isSaving ? null : _handleSaveProfile,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF028391),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: _isSaving
                        ? const SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.5,
                              color: Colors.white,
                            ),
                          )
                        : const Text(
                            'Save & Continue',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
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
