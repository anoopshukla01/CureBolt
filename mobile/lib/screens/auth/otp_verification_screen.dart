import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../services/auth_service.dart';
import 'profile_setup_screen.dart';

class OtpVerificationScreen extends StatefulWidget {
  final AuthService authService;
  final String phone;
  final int initialCooldown;

  const OtpVerificationScreen({
    super.key,
    required this.authService,
    required this.phone,
    this.initialCooldown = 30,
  });

  @override
  State<OtpVerificationScreen> createState() => _OtpVerificationScreenState();
}

class _OtpVerificationScreenState extends State<OtpVerificationScreen> {
  final List<TextEditingController> _controllers =
      List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _focusNodes = List.generate(6, (_) => FocusNode());

  int _cooldownSeconds = 30;
  int _expirySeconds = 300; // 5 minutes
  Timer? _cooldownTimer;
  Timer? _expiryTimer;

  bool _isVerifying = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _cooldownSeconds = widget.initialCooldown;
    _startCooldownTimer();
    _startExpiryTimer();
  }

  @override
  void dispose() {
    _cooldownTimer?.cancel();
    _expiryTimer?.cancel();
    for (final c in _controllers) {
      c.dispose();
    }
    for (final fn in _focusNodes) {
      fn.dispose();
    }
    super.dispose();
  }

  void _startCooldownTimer() {
    _cooldownTimer?.cancel();
    _cooldownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_cooldownSeconds > 0) {
        setState(() {
          _cooldownSeconds--;
        });
      } else {
        timer.cancel();
      }
    });
  }

  void _startExpiryTimer() {
    _expiryTimer?.cancel();
    _expiryTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_expirySeconds > 0) {
        setState(() {
          _expirySeconds--;
        });
      } else {
        timer.cancel();
        setState(() {
          _errorMessage = 'OTP has expired. Please tap Resend to get a new code.';
        });
      }
    });
  }

  String _getEnteredOtp() {
    return _controllers.map((c) => c.text).join();
  }

  Future<void> _handleVerify() async {
    final otp = _getEnteredOtp();
    if (otp.length != 6) {
      setState(() {
        _errorMessage = 'Please enter all 6 digits of the OTP.';
      });
      return;
    }

    if (_expirySeconds <= 0) {
      setState(() {
        _errorMessage = 'This OTP has expired. Please request a new one.';
      });
      return;
    }

    setState(() {
      _isVerifying = true;
      _errorMessage = null;
    });

    final result = await widget.authService.verifyOtp(widget.phone, otp);

    if (!mounted) return;

    setState(() {
      _isVerifying = false;
    });

    if (result.success) {
      if (result.isNewUser || !(result.user?.isProfileComplete ?? false)) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => ProfileSetupScreen(
              authService: widget.authService,
              phone: widget.phone,
            ),
          ),
        );
      } else {
        // Profile is complete: proceed to next milestone (Location or Home)
        Navigator.popUntil(context, (route) => route.isFirst);
      }
    } else {
      setState(() {
        _errorMessage = result.error ?? 'Invalid OTP code.';
      });
      // Clear inputs for retry
      for (final c in _controllers) {
        c.clear();
      }
      _focusNodes[0].requestFocus();
    }
  }

  Future<void> _handleResend() async {
    if (_cooldownSeconds > 0) return;

    setState(() {
      _errorMessage = null;
    });

    final res = await widget.authService.requestOtp(widget.phone);
    if (!mounted) return;

    if (res.success) {
      setState(() {
        _cooldownSeconds = res.cooldownSeconds;
        _expirySeconds = res.expiresIn;
      });
      _startCooldownTimer();
      _startExpiryTimer();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('A new 6-digit OTP has been sent.'),
          backgroundColor: Color(0xFF028391),
        ),
      );
    } else {
      setState(() {
        _errorMessage = res.error ?? res.message;
      });
    }
  }

  void _onDigitChanged(int index, String value) {
    if (value.length > 1) {
      // Handles paste event of multiple digits
      final digits = value.replaceAll(RegExp(r'\D'), '');
      for (int i = 0; i < 6 && i < digits.length; i++) {
        _controllers[i].text = digits[i];
      }
      if (digits.length >= 6) {
        _focusNodes[5].unfocus();
        _handleVerify();
      } else {
        _focusNodes[digits.length].requestFocus();
      }
      return;
    }

    if (value.isNotEmpty) {
      if (index < 5) {
        _focusNodes[index + 1].requestFocus();
      } else {
        _focusNodes[index].unfocus();
        if (_getEnteredOtp().length == 6) {
          _handleVerify();
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final expiryMinutes = _expirySeconds ~/ 60;
    final expiryRemainingSec = _expirySeconds % 60;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Verify Phone'),
        elevation: 0,
        backgroundColor: Colors.white,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Enter 6-digit code',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF0B192C),
                ),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Text(
                    'Code sent to +91 ${widget.phone.length >= 10 ? widget.phone.substring(widget.phone.length - 10) : widget.phone}',
                    style: const TextStyle(
                      fontSize: 14,
                      color: Color(0xFF64748B),
                    ),
                  ),
                  const SizedBox(width: 6),
                  GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: const Text(
                      'Edit',
                      style: TextStyle(
                        fontSize: 14,
                        color: Color(0xFF028391),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Development Mode Banner
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.info_outline, size: 18, color: Color(0xFF028391)),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Development Pilot: Enter 123456 as verification code.',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: Color(0xFF334155),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 28),

              // 6-digit Input Boxes
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: List.generate(6, (index) {
                  return SizedBox(
                    width: 48,
                    height: 56,
                    child: KeyboardListener(
                      focusNode: FocusNode(),
                      onKeyEvent: (event) {
                        if (event is KeyDownEvent &&
                            event.logicalKey == LogicalKeyboardKey.backspace &&
                            _controllers[index].text.isEmpty &&
                            index > 0) {
                          _focusNodes[index - 1].requestFocus();
                        }
                      },
                      child: TextFormField(
                        controller: _controllers[index],
                        focusNode: _focusNodes[index],
                        keyboardType: TextInputType.number,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF0B192C),
                        ),
                        inputFormatters: [
                          FilteringTextInputFormatter.digitsOnly,
                        ],
                        decoration: InputDecoration(
                          contentPadding: EdgeInsets.zero,
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: const BorderSide(
                              color: Color(0xFFCBD5E1),
                              width: 1.5,
                            ),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: const BorderSide(
                              color: Color(0xFF028391),
                              width: 2,
                            ),
                          ),
                        ),
                        onChanged: (val) => _onDigitChanged(index, val),
                      ),
                    ),
                  );
                }),
              ),

              // Error display
              if (_errorMessage != null) ...[
                const SizedBox(height: 14),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.error_outline, size: 16, color: Colors.red),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        _errorMessage!,
                        style: const TextStyle(
                          color: Colors.red,
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              ],

              const SizedBox(height: 20),

              // Expiry & Resend Controls
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.timer_outlined, size: 16, color: Color(0xFF64748B)),
                      const SizedBox(width: 4),
                      Text(
                        'Expires in ${expiryMinutes.toString().padLeft(2, '0')}:${expiryRemainingSec.toString().padLeft(2, '0')}',
                        style: const TextStyle(fontSize: 13, color: Color(0xFF64748B)),
                      ),
                    ],
                  ),
                  TextButton(
                    onPressed: _cooldownSeconds == 0 ? _handleResend : null,
                    child: Text(
                      _cooldownSeconds > 0
                          ? 'Resend in ${_cooldownSeconds}s'
                          : 'Resend OTP',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: _cooldownSeconds > 0
                            ? const Color(0xFF94A3B8)
                            : const Color(0xFF028391),
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 28),

              // Verify Primary Button
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: _isVerifying ? null : _handleVerify,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF028391),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: _isVerifying
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.5,
                            color: Colors.white,
                          ),
                        )
                      : const Text(
                          'Verify and Proceed',
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
    );
  }
}
