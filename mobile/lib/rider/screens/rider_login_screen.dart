import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import '../services/rider_auth_service.dart';
import '../utils/rider_validators.dart';
import 'rider_application_status_screen.dart';
import 'rider_home_screen.dart';
import 'rider_onboarding_screen.dart';

class RiderLoginScreen extends StatefulWidget {
  final RiderAuthService authService;

  const RiderLoginScreen({super.key, required this.authService});

  @override
  State<RiderLoginScreen> createState() => _RiderLoginScreenState();
}

class _RiderLoginScreenState extends State<RiderLoginScreen> {
  final _phoneController = TextEditingController(text: '9876500005'); // Seeded rider phone
  final List<TextEditingController> _otpControllers = List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _otpFocusNodes = List.generate(6, (_) => FocusNode());

  bool _otpSent = false;
  String? _mockOtpHint;
  String? _phoneError;
  String? _generalError;
  bool _isSubmitting = false;

  @override
  void dispose() {
    _phoneController.dispose();
    for (var c in _otpControllers) {
      c.dispose();
    }
    for (var f in _otpFocusNodes) {
      f.dispose();
    }
    super.dispose();
  }

  Future<void> _handleRequestOtp() async {
    final validation = RiderValidators.validatePhone(_phoneController.text);
    if (validation != null) {
      setState(() => _phoneError = validation);
      return;
    }

    setState(() {
      _phoneError = null;
      _generalError = null;
      _isSubmitting = true;
    });

    final res = await widget.authService.requestOtp(_phoneController.text.trim());
    setState(() => _isSubmitting = false);

    if (res['success'] == true) {
      setState(() {
        _otpSent = true;
        _mockOtpHint = res['mockOtp'];
      });
      // Focus first OTP field
      _otpFocusNodes[0].requestFocus();
    } else {
      setState(() {
        _generalError = res['error'];
      });
    }
  }

  Future<void> _handleVerifyOtp() async {
    final otp = _otpControllers.map((c) => c.text).join();
    if (otp.length != 6) {
      setState(() => _generalError = 'Please enter complete 6-digit OTP');
      return;
    }

    setState(() {
      _isSubmitting = true;
      _generalError = null;
    });

    // Device fingerprint metadata
    final deviceModel = kIsWeb ? 'Web Browser' : (Platform.isAndroid ? 'Android Device' : 'iOS Device');
    final osVersion = kIsWeb ? 'HTML5/Web' : Platform.operatingSystemVersion;
    final fingerprint = 'fp-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}';

    final success = await widget.authService.login(
      phone: _phoneController.text.trim(),
      otp: otp,
      deviceFingerprint: fingerprint,
      deviceModel: deviceModel,
      osVersion: osVersion,
      appVersion: '1.0.0+1',
    );

    setState(() => _isSubmitting = false);

    if (success && mounted) {
      _navigatePostLogin();
    } else {
      setState(() {
        _generalError = widget.authService.errorMessage ?? 'OTP verification failed';
      });
    }
  }

  void _navigatePostLogin() {
    final profile = widget.authService.currentProfile;
    final app = widget.authService.currentApplication;

    if (profile != null && profile.isApproved) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => RiderHomeScreen(authService: widget.authService),
        ),
      );
    } else if (app != null) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => RiderApplicationStatusScreen(authService: widget.authService),
        ),
      );
    } else {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => RiderOnboardingScreen(authService: widget.authService),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Medcure Delivery Partner'),
        backgroundColor: Colors.white,
        elevation: 0.5,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // High-visibility partner badge
              Center(
                child: Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE8F5E9),
                    shape: BoxShape.circle,
                    border: Border.all(color: const Color(0xFF10B981), width: 2),
                  ),
                  child: const Icon(
                    Icons.two_wheeler_rounded,
                    size: 38,
                    color: Color(0xFF059669),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Delivery Partner Login',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF0B192C),
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Gorakhpur Quick-Commerce Medicine Fleet',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 14,
                  color: Color(0xFF64748B),
                ),
              ),
              const SizedBox(height: 20),

              // Operational security notice
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFCBD5E1)),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    Icon(Icons.shield_outlined, color: Color(0xFF0F766E), size: 20),
                    SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Controlled Fleet Access: Delivery partner accounts are provisioned exclusively by platform operations. Self-activation is prohibited.',
                        style: TextStyle(
                          fontSize: 12,
                          color: Color(0xFF334155),
                          height: 1.4,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              if (!_otpSent) ...[
                // Phone Number Entry
                const Text(
                  'Registered Mobile Number',
                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  maxLength: 10,
                  decoration: InputDecoration(
                    prefixIcon: const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                      child: Text(
                        '+91',
                        style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
                      ),
                    ),
                    hintText: '98765 00000',
                    counterText: '',
                    errorText: _phoneError,
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: _isSubmitting ? null : _handleRequestOtp,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF059669),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  child: _isSubmitting
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : const Text(
                          'Get OTP',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                ),
              ] else ...[
                // OTP Entry
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Enter OTP sent to +91 ${_phoneController.text}',
                      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                    ),
                    TextButton(
                      onPressed: () => setState(() => _otpSent = false),
                      child: const Text('Change', style: TextStyle(fontSize: 13)),
                    ),
                  ],
                ),
                const SizedBox(height: 8),

                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: List.generate(6, (index) {
                    return SizedBox(
                      width: 44,
                      height: 52,
                      child: TextField(
                        controller: _otpControllers[index],
                        focusNode: _otpFocusNodes[index],
                        keyboardType: TextInputType.number,
                        textAlign: TextAlign.center,
                        maxLength: 1,
                        style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                        decoration: InputDecoration(
                          counterText: '',
                          filled: true,
                          fillColor: Colors.white,
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                        onChanged: (val) {
                          if (val.isNotEmpty && index < 5) {
                            _otpFocusNodes[index + 1].requestFocus();
                          } else if (val.isEmpty && index > 0) {
                            _otpFocusNodes[index - 1].requestFocus();
                          }
                          if (index == 5 && val.isNotEmpty) {
                            _handleVerifyOtp();
                          }
                        },
                      ),
                    );
                  }),
                ),

                if (_mockOtpHint != null) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEF3C7),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      'Development / Test OTP: $_mockOtpHint',
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: Color(0xFFB45309), fontSize: 12, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],

                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: _isSubmitting ? null : _handleVerifyOtp,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF059669),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  child: _isSubmitting
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : const Text(
                          'Verify & Continue',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                ),
              ],

              if (_generalError != null) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEE2E2),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFFEF4444)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline, color: Color(0xFFDC2626), size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _generalError!,
                          style: const TextStyle(color: Color(0xFF991B1B), fontSize: 13),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
