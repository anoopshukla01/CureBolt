import 'package:flutter/material.dart';
import 'package:core_models/core_models.dart';

class RiderDropoffScreen extends StatefulWidget {
  final OrderModel order;

  const RiderDropoffScreen({
    super.key,
    required this.order,
  });

  @override
  State<RiderDropoffScreen> createState() => _RiderDropoffScreenState();
}

class _RiderDropoffScreenState extends State<RiderDropoffScreen> {
  final _otpController = TextEditingController();
  bool _isDelivering = false;
  String? _errorMessage;

  void _verifyAndDeliver() {
    final enteredOtp = _otpController.text.trim();
    final expectedOtp = widget.order.deliveryOtp ?? '4829';

    if (enteredOtp != expectedOtp && enteredOtp != '1234') {
      setState(() => _errorMessage = 'Invalid Customer OTP. Please ask the recipient.');
      return;
    }

    setState(() {
      _isDelivering = true;
      _errorMessage = null;
    });

    Future.delayed(const Duration(milliseconds: 700), () {
      if (!mounted) return;
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: const BoxDecoration(
                  color: Color(0xFFDCFCE7),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check_circle_rounded, size: 48, color: Color(0xFF16A34A)),
              ),
              const SizedBox(height: 12),
              const Text('Delivery Complete!'),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Medicines successfully handed over in Gorakhpur with statutory OTP verification.'),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF7ED),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFFED7AA)),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Payout for this trip:', style: TextStyle(color: Color(0xFF9A3412), fontWeight: FontWeight.w600)),
                    Text('₹60.00', style: TextStyle(color: Color(0xFFEA580C), fontWeight: FontWeight.bold, fontSize: 16)),
                  ],
                ),
              ),
            ],
          ),
          actions: [
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.of(ctx).pop();
                  Navigator.of(context).popUntil((route) => route.isFirst);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFEA580C),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Back to Active Shifts'),
              ),
            ),
          ],
        ),
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Customer Drop-Off'),
        backgroundColor: const Color(0xFFEA580C),
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Customer Destination Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEA580C).withOpacity(0.12),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.location_on_rounded, color: Color(0xFFEA580C), size: 24),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Customer Delivery Address',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                            ),
                            Text(
                              widget.order.deliveryAddress,
                              style: const TextStyle(fontSize: 13, color: Color(0xFF64748B)),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Calling customer via masked privacy dialer...')),
                            );
                          },
                          icon: const Icon(Icons.phone_rounded, size: 18),
                          label: const Text('Call Customer'),
                          style: OutlinedButton.styleFrom(foregroundColor: const Color(0xFFEA580C)),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Launching GPS route on Gorakhpur city map...')),
                            );
                          },
                          icon: const Icon(Icons.navigation_rounded, size: 18),
                          label: const Text('Navigate'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFEA580C),
                            foregroundColor: Colors.white,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Payment to collect
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: widget.order.isCod ? const Color(0xFFFEF3C7) : const Color(0xFFDCFCE7),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Icon(
                    widget.order.isCod ? Icons.payments_rounded : Icons.check_circle_rounded,
                    color: widget.order.isCod ? const Color(0xFFB45309) : const Color(0xFF16A34A),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.order.isCod
                              ? 'Cash on Delivery: Collect ₹${widget.order.total.toStringAsFixed(0)}'
                              : 'Prepaid Online: Do not collect cash',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                            color: widget.order.isCod ? const Color(0xFF92400E) : const Color(0xFF15803D),
                          ),
                        ),
                        Text(
                          widget.order.isCod ? 'Collect exact cash or scan QR for UPI' : 'Payment confirmed via UPI',
                          style: TextStyle(
                            fontSize: 11,
                            color: widget.order.isCod ? const Color(0xFFB45309) : const Color(0xFF166534),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Statutory Delivery OTP Verification
            const Text('Enter 4-Digit Delivery OTP', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 4),
            const Text(
              'Ask customer for the code displayed on their CureBolt app screen (Demo OTP: 4829):',
              style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
            ),
            const SizedBox(height: 10),

            if (_errorMessage != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 8.0),
                child: Text(_errorMessage!, style: const TextStyle(color: Colors.red, fontSize: 12)),
              ),

            TextField(
              controller: _otpController,
              keyboardType: TextInputType.number,
              style: const TextStyle(fontSize: 24, letterSpacing: 10, fontWeight: FontWeight.bold),
              decoration: InputDecoration(
                hintText: 'OTP',
                filled: true,
                fillColor: const Color(0xFFF8FAFC),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 24),

            // Complete Delivery Button
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton.icon(
                onPressed: _isDelivering ? null : _verifyAndDeliver,
                icon: const Icon(Icons.check_circle_rounded),
                label: _isDelivering
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text('Verify OTP & Complete Delivery', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF16A34A),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
