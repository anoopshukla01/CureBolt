import 'package:flutter/material.dart';
import 'package:core_ui/core_ui.dart';

class PrescriptionReviewSheet extends StatefulWidget {
  final String orderNumber;
  final String patientName;
  final String pharmacistName;
  final String pharmacistRegNo;
  final ValueChanged<bool> onDecision;

  const PrescriptionReviewSheet({
    super.key,
    required this.orderNumber,
    required this.patientName,
    required this.pharmacistName,
    required this.pharmacistRegNo,
    required this.onDecision,
  });

  @override
  State<PrescriptionReviewSheet> createState() => _PrescriptionReviewSheetState();
}

class _PrescriptionReviewSheetState extends State<PrescriptionReviewSheet> {
  bool _doctorDetailsValid = true;
  bool _patientMatchValid = true;
  bool _dosageValid = true;
  bool _notExpiredValid = true;
  bool _isSigning = false;

  bool get _canApprove =>
      _doctorDetailsValid && _patientMatchValid && _dosageValid && _notExpiredValid;

  void _approve() {
    setState(() => _isSigning = true);
    Future.delayed(const Duration(milliseconds: 600), () {
      if (!mounted) return;
      widget.onDecision(true);
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Prescription digitally approved by ${widget.pharmacistName} (Reg: ${widget.pharmacistRegNo})'),
          backgroundColor: const Color(0xFF16A34A),
        ),
      );
    });
  }

  void _reject() {
    widget.onDecision(false);
    Navigator.of(context).pop();
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Prescription rejected. Customer notified to upload valid document.'),
        backgroundColor: Color(0xFFDC2626),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Registered Pharmacist Rx Review', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  Text('Order #${widget.orderNumber} • Patient: ${widget.patientName}', style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                ],
              ),
              IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.of(context).pop()),
            ],
          ),
          const SizedBox(height: 12),

          // Prescription Preview Card (Watermarked)
          Container(
            height: 140,
            width: double.infinity,
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFCBD5E1)),
            ),
            child: Stack(
              children: [
                Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.receipt_long_rounded, size: 48, color: Color(0xFF94A3B8)),
                      const SizedBox(height: 4),
                      Text(
                        'Dr. A. K. Mishra (MBBS, MD - Reg #UP-MC-44120)\nBRD Medical College, Gorakhpur',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 11, color: Colors.blueGrey.shade700, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ),
                Positioned(
                  top: 8,
                  right: 8,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(color: Colors.black45, borderRadius: BorderRadius.circular(4)),
                    child: const Text('WATERMARKED SECURE RX', style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Statutory Inspection Checklist
          const Text('Statutory Dispensing Checklist (Drugs & Cosmetics Act)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
          const SizedBox(height: 8),

          _checkboxTile('Registered Medical Practitioner signature & license verified', _doctorDetailsValid, (v) => setState(() => _doctorDetailsValid = v!)),
          _checkboxTile('Patient name and delivery recipient match', _patientMatchValid, (v) => setState(() => _patientMatchValid = v!)),
          _checkboxTile('Molecule dosage & quantities within statutory safe limits', _dosageValid, (v) => setState(() => _dosageValid = v!)),
          _checkboxTile('Prescription issue date within 30 days', _notExpiredValid, (v) => setState(() => _notExpiredValid = v!)),
          const SizedBox(height: 16),

          // Pharmacist Digital Sign-off
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFF0FDF4),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFFBBF7D0)),
            ),
            child: Row(
              children: [
                const Icon(Icons.verified_user_rounded, color: Color(0xFF16A34A), size: 24),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Signing Pharmacist: ${widget.pharmacistName}',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF166534)),
                      ),
                      Text(
                        'State Pharmacy Council Reg: ${widget.pharmacistRegNo}',
                        style: const TextStyle(fontSize: 11, color: Color(0xFF15803D)),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Action Buttons
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: _reject,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFFDC2626),
                    side: const BorderSide(color: Color(0xFFDC2626)),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  child: const Text('Reject Rx'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: ElevatedButton.icon(
                  onPressed: _canApprove && !_isSigning ? _approve : null,
                  icon: const Icon(Icons.check_circle_rounded),
                  label: _isSigning
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Text('Approve & Digital Sign'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF16A34A),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _checkboxTile(String text, bool value, ValueChanged<bool?> onChanged) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2.0),
      child: Row(
        children: [
          Checkbox(
            value: value,
            onChanged: onChanged,
            activeColor: const Color(0xFF16A34A),
            visualDensity: VisualDensity.compact,
          ),
          Expanded(child: Text(text, style: const TextStyle(fontSize: 12, color: Color(0xFF334155)))),
        ],
      ),
    );
  }
}
