import 'dart:async';
import 'package:flutter/material.dart';
import 'package:core_auth/core_auth.dart';
import '../services/customer_profile_service.dart';

class CustomerAuthScreen extends StatefulWidget {
  final AuthController authController;
  final CustomerProfileService profileService;
  final Function(String token, String? userId, String phone) onNeedsProfileSetup;
  final Function(CustomerProfile profile) onAuthComplete;

  const CustomerAuthScreen({
    super.key,
    required this.authController,
    required this.profileService,
    required this.onNeedsProfileSetup,
    required this.onAuthComplete,
  });

  @override
  State<CustomerAuthScreen> createState() => _CustomerAuthScreenState();
}

class _CustomerAuthScreenState extends State<CustomerAuthScreen> {
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _otpController = TextEditingController();

  int _resendCooldown = 0;
  Timer? _timer;
  String? _phoneValidationError;

  @override
  void initState() {
    super.initState();
    widget.authController.addListener(_onAuthStateChanged);
  }

  @override
  void dispose() {
    widget.authController.removeListener(_onAuthStateChanged);
    _phoneController.dispose();
    _otpController.dispose();
    _timer?.cancel();
    super.dispose();
  }

  void _onAuthStateChanged() async {
    final state = widget.authController.state;
    if (state.isAuthenticated && state.token != null) {
      final profile = await widget.profileService.fetchProfile(
        token: state.token!,
        userId: state.userId,
      );

      if (profile != null && profile.isProfileComplete && !profile.isMinorBlocked) {
        widget.onAuthComplete(profile);
      } else {
        widget.onNeedsProfileSetup(
          state.token!,
          state.userId,
          state.phone ?? _phoneController.text,
        );
      }
    }
  }

  void _startTimer() {
    setState(() => _resendCooldown = 30);
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_resendCooldown > 0) {
        setState(() => _resendCooldown--);
      } else {
        timer.cancel();
      }
    });
  }

  void _validatePhone(String val) {
    final trimmed = val.trim();
    if (trimmed.isEmpty) {
      setState(() => _phoneValidationError = null);
      return;
    }
    if (trimmed.length != 10) {
      setState(() => _phoneValidationError = 'Enter a 10-digit mobile number');
      return;
    }
    final firstChar = trimmed[0];
    if (!['6', '7', '8', '9'].contains(firstChar)) {
      setState(() => _phoneValidationError = 'Indian mobile numbers must start with 6, 7, 8 or 9');
      return;
    }
    setState(() => _phoneValidationError = null);
  }

  Future<void> _handleSendOtp() async {
    final phone = _phoneController.text.trim();
    _validatePhone(phone);
    if (_phoneValidationError != null || phone.length != 10) {
      return;
    }

    final formatted = '+91$phone';
    final success = await widget.authController.requestOtp(formatted);
    if (success && mounted) {
      _startTimer();
    }
  }

  Future<void> _handleVerifyOtp() async {
    final otp = _otpController.text.trim();
    if (otp.length < 4) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter the 6-digit OTP')),
      );
      return;
    }

    final formatted = '+91${_phoneController.text.trim()}';
    await widget.authController.verifyOtpAndCheckAppRole(
      phone: formatted,
      otp: otp,
      appId: 'com.medcure.customer',
      appVersion: '1.0.0',
    );
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: widget.authController,
      builder: (context, _) {
        final state = widget.authController.state;
        final isOtpStep = state.status == AuthStatus.otpSent ||
            state.status == AuthStatus.verifyingOtp ||
            state.status == AuthStatus.verifyingSession;

        return Scaffold(
          backgroundColor: Colors.white,
          body: SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 32.0),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 420),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Header icon & branding
                      Center(
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF0FDFA),
                            shape: BoxShape.circle,
                            border: Border.all(color: const Color(0xFFCCFBF1)),
                          ),
                          child: const Icon(
                            Icons.local_hospital_rounded,
                            size: 40,
                            color: Color(0xFF0D9488),
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),
                      Text(
                        isOtpStep ? 'Verify Mobile Number' : 'Medicine Delivery in Minutes',
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        isOtpStep
                            ? 'Enter the 6-digit verification code sent to +91 ${_phoneController.text}'
                            : 'Log in or sign up to order genuine medicines in Gorakhpur',
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 14,
                          color: Color(0xFF64748B),
                          height: 1.4,
                        ),
                      ),
                      const SizedBox(height: 32),

                      if (!isOtpStep) ...[
                        // Phone input
                        TextField(
                          controller: _phoneController,
                          keyboardType: TextInputType.phone,
                          maxLength: 10,
                          onChanged: _validatePhone,
                          decoration: InputDecoration(
                            counterText: '',
                            labelText: 'Mobile Number',
                            prefixIcon: const Icon(Icons.phone_android_rounded, color: Color(0xFF0D9488)),
                            prefixText: '+91 ',
                            prefixStyle: const TextStyle(
                              color: Color(0xFF0F172A),
                              fontWeight: FontWeight.w600,
                              fontSize: 16,
                            ),
                            errorText: _phoneValidationError,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                        ),
                        const SizedBox(height: 20),
                        ElevatedButton(
                          onPressed: state.isLoading ? null : _handleSendOtp,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF0D9488),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            elevation: 0,
                          ),
                          child: state.isLoading
                              ? const SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                  ),
                                )
                              : const Text(
                                  'Get OTP',
                                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                                ),
                        ),
                        const SizedBox(height: 24),
                        const Text(
                          'By proceeding, you agree to our Terms of Service and Privacy Policy.',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                        ),
                      ] else ...[
                        // 6-digit OTP input
                        TextField(
                          controller: _otpController,
                          keyboardType: TextInputType.number,
                          maxLength: 6,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontSize: 26,
                            letterSpacing: 10,
                            fontWeight: FontWeight.bold,
                          ),
                          decoration: InputDecoration(
                            counterText: '',
                            hintText: '••••••',
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                        ),
                        const SizedBox(height: 20),
                        ElevatedButton(
                          onPressed: state.isLoading ? null : _handleVerifyOtp,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF0D9488),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            elevation: 0,
                          ),
                          child: state.isLoading
                              ? const SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                  ),
                                )
                              : const Text(
                                  'Verify & Continue',
                                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                                ),
                        ),
                        const SizedBox(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            TextButton(
                              onPressed: () {
                                widget.authController.logout();
                                _otpController.clear();
                              },
                              child: const Text('Change Number'),
                            ),
                            TextButton(
                              onPressed: _resendCooldown > 0 ? null : _handleSendOtp,
                              child: Text(
                                _resendCooldown > 0
                                    ? 'Resend in ${_resendCooldown}s'
                                    : 'Resend OTP',
                              ),
                            ),
                          ],
                        ),
                      ],

                      if (state.errorMessage != null) ...[
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFEF2F2),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: const Color(0xFFFCA5A5)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.error_outline_rounded, color: Color(0xFFDC2626)),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  state.errorMessage!,
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
            ),
          ),
        );
      },
    );
  }
}
