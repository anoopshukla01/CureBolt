import 'package:flutter/material.dart';
import 'package:core_models/core_models.dart';
import 'rider_dropoff_screen.dart';

class RiderPickupScreen extends StatefulWidget {
  final OrderModel order;

  const RiderPickupScreen({
    super.key,
    required this.order,
  });

  @override
  State<RiderPickupScreen> createState() => _RiderPickupScreenState();
}

class _RiderPickupScreenState extends State<RiderPickupScreen> {
  final _pinController = TextEditingController();
  bool _coldChainVerified = true;
  bool _isConfirming = false;
  String? _errorMessage;

  void _confirmPickup() {
    final pin = _pinController.text.trim();
    if (pin.length < 4) {
      setState(() => _errorMessage = 'Enter 4-digit Pharmacy Handover PIN');
      return;
    }

    setState(() {
      _isConfirming = true;
      _errorMessage = null;
    });

    Future.delayed(const Duration(milliseconds: 700), () {
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => RiderDropoffScreen(order: widget.order),
        ),
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Pharmacy Counter Pickup'),
        backgroundColor: const Color(0xFFEA580C),
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Pharmacy Pickup Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF7ED),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFFED7AA)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEA580C),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.storefront_rounded, color: Colors.white, size: 24),
                      ),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Apollo Pharmacy — Golghar Hub',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF9A3412)),
                            ),
                            Text(
                              'Shop #12, Golghar Main Road, Gorakhpur',
                              style: TextStyle(fontSize: 12, color: Color(0xFFC2410C)),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  const Divider(color: Color(0xFFFED7AA)),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Distance to Pharmacy:', style: TextStyle(fontSize: 12, color: Color(0xFF9A3412))),
                      const Text('0.8 km (Arrived)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF9A3412))),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Order package checklist
            const Text('Package Verification', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Order #${widget.order.orderNumber}', style: const TextStyle(fontWeight: FontWeight.bold)),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(color: const Color(0xFFDCFCE7), borderRadius: BorderRadius.circular(6)),
                        child: const Text('SEALED BAG', style: TextStyle(color: Color(0xFF16A34A), fontWeight: FontWeight.bold, fontSize: 10)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  const Text('1. Paracetamol 650mg (1 Strip)', style: TextStyle(fontSize: 13)),
                  const Text('2. Azee 500mg (1 Strip • Schedule H)', style: TextStyle(fontSize: 13)),
                  const SizedBox(height: 8),
                  const Text('Tamper-evident seal barcode: #CB-GKP-882190', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Statutory Cold Chain Temperature Check
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFEFF6FF),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFBFDBFE)),
              ),
              child: Row(
                children: [
                  Checkbox(
                    value: _coldChainVerified,
                    onChanged: (val) => setState(() => _coldChainVerified = val ?? true),
                    activeColor: const Color(0xFF2563EB),
                  ),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Cold-Chain Insulated Box Verified',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF1E40AF)),
                        ),
                        Text(
                          'Statutory compliance: Temperature insulated delivery box active for thermal sensitive medicines.',
                          style: TextStyle(fontSize: 11, color: Color(0xFF3B82F6)),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Handover PIN verification
            const Text('Enter Pharmacy Handover Code', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 6),
            const Text('Ask the pharmacist at the counter for the 4-digit handover PIN:', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
            const SizedBox(height: 10),

            if (_errorMessage != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 8.0),
                child: Text(_errorMessage!, style: const TextStyle(color: Colors.red, fontSize: 12)),
              ),

            TextField(
              controller: _pinController,
              keyboardType: TextInputType.number,
              style: const TextStyle(fontSize: 22, letterSpacing: 8, fontWeight: FontWeight.bold),
              decoration: InputDecoration(
                hintText: 'PIN (e.g. 9182)',
                filled: true,
                fillColor: const Color(0xFFF8FAFC),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 24),

            // Confirm pickup button
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton.icon(
                onPressed: _isConfirming ? null : _confirmPickup,
                icon: const Icon(Icons.check_circle_outline_rounded),
                label: _isConfirming
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text('Confirm Pickup & Start Customer Delivery', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFEA580C),
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
