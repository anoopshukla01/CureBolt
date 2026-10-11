import 'package:flutter/material.dart';
import 'package:core_ui/core_ui.dart';
import 'package:core_l10n/core_l10n.dart';
import '../services/pharmacy_auth_service.dart';
import 'merchant_home_screen.dart';

class LoginScreen extends StatefulWidget {
  final PharmacyAuthService authService;

  const LoginScreen({Key? key, required this.authService}) : super(key: key);

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _phoneOrEmailController = TextEditingController(text: '+919876500002');
  final _otpController = TextEditingController(text: '123456');
  final _totpController = TextEditingController();

  String _selectedRole = 'pharmacy_owner';
  bool _showMfaField = false;
  String? _errorMessage;
  bool _isLoading = false;

  @override
  void dispose() {
    _phoneOrEmailController.dispose();
    _otpController.dispose();
    _totpController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final res = await widget.authService.login(
        phoneOrEmail: _phoneOrEmailController.text.trim(),
        role: _selectedRole,
        otpOrPassword: _otpController.text.trim(),
        totpCode: _showMfaField ? _totpController.text.trim() : null,
      );

      if (res['requiresMfa'] == true) {
        setState(() {
          _showMfaField = true;
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Multi-Factor Authentication required. Enter your 6-digit TOTP code.'),
            backgroundColor: PharmacyColors.warning,
          ),
        );
        return;
      }

      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => MerchantHomeScreen(authService: widget.authService)),
        );
      }
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceAll('ApiException', '').trim();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: PharmacyColors.background,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 480),
              child: Card(
                elevation: 2,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: const BorderSide(color: PharmacyColors.cardBorder),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(28.0),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // Header
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: PharmacyColors.primaryLight,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(Icons.local_pharmacy, color: PharmacyColors.primary, size: 28),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    PharmacyStrings.appTitle,
                                    style: const TextStyle(
                                      fontSize: 20,
                                      fontWeight: FontWeight.w800,
                                      color: PharmacyColors.textPrimary,
                                    ),
                                  ),
                                  const Text(
                                    'Partner Counter Terminal (Gorakhpur)',
                                    style: TextStyle(
                                      fontSize: 13,
                                      color: PharmacyColors.textSecondary,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 24),

                        // Error Banner
                        if (_errorMessage != null) ...[
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: PharmacyColors.dangerBg,
                              borderRadius: BorderRadius.circular(8),
                              border: BorderSide(color: PharmacyColors.danger.withOpacity(0.3)),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.error_outline, color: PharmacyColors.danger, size: 20),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Text(
                                    _errorMessage!,
                                    style: const TextStyle(
                                      color: PharmacyColors.danger,
                                      fontSize: 13,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 16),
                        ],

                        // Role Selector Pills
                        const Text(
                          'Select Operating Role',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: PharmacyColors.textSecondary,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            _buildRoleChip('pharmacy_owner', 'Owner / Admin', Icons.admin_panel_settings),
                            _buildRoleChip('pharmacist', 'Pharmacist (Rx)', Icons.verified_user),
                            _buildRoleChip('pharmacy_staff', 'Counter Staff', Icons.badge),
                          ],
                        ),
                        const SizedBox(height: 20),

                        // Phone/Email Field
                        TextFormField(
                          controller: _phoneOrEmailController,
                          decoration: const InputDecoration(
                            labelText: 'Registered Mobile or Email',
                            prefixIcon: Icon(Icons.phone_android, size: 20),
                            hintText: '+919876500002',
                          ),
                          validator: (v) => (v == null || v.isEmpty) ? 'Enter mobile or email' : null,
                        ),
                        const SizedBox(height: 16),

                        // OTP / Password Field
                        TextFormField(
                          controller: _otpController,
                          obscureText: true,
                          decoration: const InputDecoration(
                            labelText: 'Security PIN / Password / OTP',
                            prefixIcon: Icon(Icons.lock_outline, size: 20),
                          ),
                          validator: (v) => (v == null || v.isEmpty) ? 'Enter PIN or password' : null,
                        ),

                        // MFA Field
                        if (_showMfaField) ...[
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _totpController,
                            keyboardType: TextInputType.number,
                            maxLength: 6,
                            decoration: const InputDecoration(
                              labelText: '6-Digit TOTP Authenticator Code',
                              prefixIcon: Icon(Icons.security, size: 20),
                              hintText: '123456',
                              counterText: '',
                            ),
                            validator: (v) => (_showMfaField && (v == null || v.length < 6))
                                ? 'Enter 6-digit TOTP code'
                                : null,
                          ),
                        ],

                        const SizedBox(height: 24),

                        // Submit Button
                        ElevatedButton(
                          onPressed: _isLoading ? null : _handleLogin,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: PharmacyColors.primary,
                            minimumSize: const Size(double.infinity, 52),
                          ),
                          child: _isLoading
                              ? const SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                )
                              : const Text('SIGN IN TO COUNTER TERMINAL', style: TextStyle(fontWeight: FontWeight.w700)),
                        ),

                        const SizedBox(height: 16),
                        const Center(
                          child: Text(
                            'Statutory Notice: Strict server-enforced RBAC. Customer accounts are prohibited.',
                            textAlign: TextAlign.center,
                            style: TextStyle(fontSize: 11, color: PharmacyColors.textMuted),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildRoleChip(String role, String label, IconData icon) {
    final isSelected = _selectedRole == role;
    return ChoiceChip(
      selected: isSelected,
      onSelected: (_) => setState(() => _selectedRole = role),
      avatar: Icon(icon, size: 16, color: isSelected ? Colors.white : PharmacyColors.textSecondary),
      label: Text(label),
      labelStyle: TextStyle(
        fontSize: 12,
        fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
        color: isSelected ? Colors.white : PharmacyColors.textPrimary,
      ),
      selectedColor: PharmacyColors.primary,
      backgroundColor: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: BorderSide(
          color: isSelected ? PharmacyColors.primary : PharmacyColors.cardBorder,
        ),
      ),
    );
  }
}
