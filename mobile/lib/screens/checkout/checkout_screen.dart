import 'package:flutter/material.dart';
import '../../models/order.dart';
import '../../services/auth_service.dart';
import '../../services/order_service.dart';

class CheckoutScreen extends StatefulWidget {
  final AuthService authService;
  final String pharmacyId;
  final String pharmacyName;
  final String deliveryAddressId;
  final String addressTitle;
  final String addressSubtitle;
  final String receiverName;
  final String receiverPhone;
  final String categoryDomain;
  final List<Map<String, dynamic>> cartItems;
  final String? attachedPrescriptionId;
  final bool hasRxPendingItems;

  const CheckoutScreen({
    super.key,
    required this.authService,
    required this.pharmacyId,
    required this.pharmacyName,
    required this.deliveryAddressId,
    required this.addressTitle,
    required this.addressSubtitle,
    required this.receiverName,
    required this.receiverPhone,
    required this.categoryDomain,
    required this.cartItems,
    this.attachedPrescriptionId,
    this.hasRxPendingItems = false,
  });

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  late final OrderService _orderService;
  final _deliveryNoteController = TextEditingController();

  String _paymentMode = 'ONLINE'; // 'ONLINE' or 'COD'
  bool _isSubmitting = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _orderService = OrderService(authService: widget.authService);
  }

  @override
  void dispose() {
    _deliveryNoteController.dispose();
    super.dispose();
  }

  int get _itemTotalPaise {
    int total = 0;
    for (final it in widget.cartItems) {
      final pricePaise = it['unitPricePaise'] as int? ??
          (((it['price'] as num? ?? it['sellingPrice'] as num? ?? 0) * 100).round());
      final qty = it['quantity'] as int? ?? 1;
      total += pricePaise * qty;
    }
    return total;
  }

  int get _deliveryFeePaise => _itemTotalPaise >= 50000 ? 0 : 2500;
  int get _handlingFeePaise => 500; // ₹5 platform & packaging fee
  int get _grandTotalPaise => _itemTotalPaise + _deliveryFeePaise + _handlingFeePaise;

  String _formatPaise(int paise) => '₹${(paise / 100.0).toStringAsFixed(2)}';

  Future<void> _handlePlaceOrder() async {
    // Medical instructions check
    final note = _deliveryNoteController.text.trim();
    if (note.isNotEmpty) {
      final lower = note.toLowerCase();
      if (lower.contains('dosage') ||
          lower.contains('mg') ||
          lower.contains('prescribe') ||
          lower.contains('substitute')) {
        setState(() {
          _errorMessage =
              'Delivery notes cannot contain medical advice, substitution requests, or dosage changes.';
        });
        return;
      }
    }

    if (widget.hasRxPendingItems && widget.attachedPrescriptionId == null) {
      setState(() {
        _errorMessage =
            'Prescription is mandatory for Schedule H items. Please attach a valid prescription before placing the order.';
      });
      return;
    }

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    final orderPayloadItems = widget.cartItems.map((it) {
      return {
        'productId': it['id'] ?? it['productId'],
        'quantity': it['quantity'] ?? 1,
      };
    }).toList();

    final result = await _orderService.placeOrder(
      pharmacyId: widget.pharmacyId,
      deliveryAddressId: widget.deliveryAddressId,
      categoryDomain: widget.categoryDomain,
      paymentMode: _paymentMode,
      items: orderPayloadItems,
      prescriptionId: widget.attachedPrescriptionId,
      deliveryNote: note.isNotEmpty ? note : null,
      receiverName: widget.receiverName,
      receiverPhone: widget.receiverPhone,
    );

    if (!mounted) return;

    setState(() {
      _isSubmitting = false;
    });

    if (result.success && result.order != null) {
      _showSuccessDialog(result.order!);
    } else {
      setState(() {
        _errorMessage = result.error ?? 'Order placement was rejected.';
      });
    }
  }

  void _showSuccessDialog(OrderModel order) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: const BoxDecoration(
                color: Color(0xFFE6F4F1),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.check_circle_rounded,
                  color: Color(0xFF028391), size: 28),
            ),
            const SizedBox(width: 12),
            const Text('Order Placed!'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Order Code: ${order.orderCode}',
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(height: 6),
            Text(
              'Fulfilled by: ${order.pharmacyName}',
              style: const TextStyle(fontSize: 13, color: Color(0xFF64748B)),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Total Payable:', style: TextStyle(fontSize: 14)),
                      Text(order.formattedGrandTotal,
                          style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 15,
                              color: Color(0xFF0B192C))),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Handover OTP:', style: TextStyle(fontSize: 13)),
                      Text(order.deliveryOtp,
                          style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF028391))),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pop(context); // Return back to home
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF028391),
              foregroundColor: Colors.white,
            ),
            child: const Text('Back to Home'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final bool canPlaceOrder =
        !widget.hasRxPendingItems || widget.attachedPrescriptionId != null;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Checkout & Review'),
        elevation: 0.5,
        backgroundColor: Colors.white,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. Delivery Address Card
              Container(
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
                        const Icon(Icons.location_on_rounded,
                            color: Color(0xFF028391), size: 22),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            widget.addressTitle,
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF0B192C),
                            ),
                          ),
                        ),
                        TextButton(
                          onPressed: () {
                            // Address change callback hook
                          },
                          child: const Text('Change',
                              style: TextStyle(
                                  fontSize: 13, color: Color(0xFF028391))),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      widget.addressSubtitle,
                      style: const TextStyle(
                          fontSize: 13, color: Color(0xFF64748B), height: 1.3),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Receiver: ${widget.receiverName} (${widget.receiverPhone})',
                      style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF334155)),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // 2. Pharmacy Info
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: const Color(0xFFE6F4F1),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFB2DFDB)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.storefront_rounded,
                        color: Color(0xFF028391), size: 20),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Fulfilled by verified retail pharmacy:',
                            style: TextStyle(
                                fontSize: 11, color: Color(0xFF00695C)),
                          ),
                          Text(
                            widget.pharmacyName,
                            style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF0B192C)),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // 3. Items Summary
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Items in Order',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF0B192C),
                      ),
                    ),
                    const SizedBox(height: 12),
                    ...widget.cartItems.map((item) {
                      final name = item['name'] as String? ?? 'Medicine Item';
                      final pack = item['packSize'] as String? ?? '';
                      final qty = item['quantity'] as int? ?? 1;
                      final pricePaise = item['unitPricePaise'] as int? ??
                          (((item['price'] as num? ?? item['sellingPrice'] as num? ?? 0) * 100).round());
                      final lineTotalPaise = pricePaise * qty;
                      final requiresRx = item['requiresPrescription'] as bool? ?? false;

                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              width: 38,
                              height: 38,
                              decoration: BoxDecoration(
                                color: const Color(0xFFF1F5F9),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: const Icon(Icons.medication_rounded,
                                  color: Color(0xFF028391), size: 22),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    name,
                                    style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                      color: Color(0xFF0B192C),
                                    ),
                                  ),
                                  if (pack.isNotEmpty)
                                    Text(
                                      pack,
                                      style: const TextStyle(
                                          fontSize: 12,
                                          color: Color(0xFF64748B)),
                                    ),
                                  if (requiresRx) ...[
                                    const SizedBox(height: 4),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFFEF2F2),
                                        borderRadius: BorderRadius.circular(4),
                                        border: Border.all(
                                            color: const Color(0xFFFCA5A5)),
                                      ),
                                      child: const Text(
                                        'Rx Required',
                                        style: TextStyle(
                                            fontSize: 10,
                                            fontWeight: FontWeight.bold,
                                            color: Color(0xFFDC2626)),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  '${qty}x ${_formatPaise(pricePaise)}',
                                  style: const TextStyle(
                                      fontSize: 12, color: Color(0xFF64748B)),
                                ),
                                Text(
                                  _formatPaise(lineTotalPaise),
                                  style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                      color: Color(0xFF0B192C)),
                                ),
                              ],
                            ),
                          ],
                        ),
                      );
                    }).toList(),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // 4. Delivery Instructions (No Medical Requests)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Delivery Note (Optional)',
                      style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF0B192C)),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'e.g. Leave at door, call on arrival (max 200 chars). No medical advice or dosage requests allowed.',
                      style: TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _deliveryNoteController,
                      maxLength: 200,
                      maxLines: 2,
                      decoration: InputDecoration(
                        hintText: 'Add instructions for delivery partner...',
                        hintStyle: const TextStyle(fontSize: 13),
                        contentPadding: const EdgeInsets.all(12),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // 5. Payment Method Selection
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Payment Method',
                      style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF0B192C)),
                    ),
                    const SizedBox(height: 8),
                    RadioListTile<String>(
                      value: 'ONLINE',
                      groupValue: _paymentMode,
                      title: const Text('Online Payment (UPI, Cards, Netbanking)',
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                      subtitle: const Text('Pay securely via Razorpay gateway',
                          style: TextStyle(fontSize: 12)),
                      activeColor: const Color(0xFF028391),
                      onChanged: (val) => setState(() => _paymentMode = val!),
                    ),
                    RadioListTile<String>(
                      value: 'COD',
                      groupValue: _paymentMode,
                      title: const Text('Cash on Delivery (COD)',
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                      subtitle: Text(
                          'Pay ${_formatPaise(_grandTotalPaise)} in cash to the delivery partner',
                          style: const TextStyle(fontSize: 12)),
                      activeColor: const Color(0xFF028391),
                      onChanged: (val) => setState(() => _paymentMode = val!),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // 6. Bill Summary (Strict Integer Paise)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Bill Summary',
                      style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF0B192C)),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Item Total',
                            style: TextStyle(fontSize: 13, color: Color(0xFF64748B))),
                        Text(_formatPaise(_itemTotalPaise),
                            style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF0B192C))),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Delivery Fee',
                            style: TextStyle(fontSize: 13, color: Color(0xFF64748B))),
                        Text(
                          _deliveryFeePaise == 0 ? 'FREE' : _formatPaise(_deliveryFeePaise),
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: _deliveryFeePaise == 0
                                ? const Color(0xFF10B981)
                                : const Color(0xFF0B192C),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Packaging & Handling Fee',
                            style: TextStyle(fontSize: 13, color: Color(0xFF64748B))),
                        Text(_formatPaise(_handlingFeePaise),
                            style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF0B192C))),
                      ],
                    ),
                    const SizedBox(height: 8),
                    const Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Medicine Taxes',
                            style: TextStyle(fontSize: 13, color: Color(0xFF64748B))),
                        Text('Included in MRP',
                            style: TextStyle(
                                fontSize: 12,
                                fontStyle: FontStyle.italic,
                                color: Color(0xFF64748B))),
                      ],
                    ),
                    const Divider(height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Grand Total',
                          style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF0B192C)),
                        ),
                        Text(
                          _formatPaise(_grandTotalPaise),
                          style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF028391)),
                        ),
                      ],
                    ),
                  ],
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
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline,
                          color: Color(0xFFDC2626), size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _errorMessage!,
                          style: const TextStyle(
                              color: Color(0xFFDC2626), fontSize: 13),
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              const SizedBox(height: 24),

              // 7. Place Order Action
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: (!canPlaceOrder || _isSubmitting)
                      ? null
                      : _handlePlaceOrder,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF028391),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    disabledBackgroundColor: const Color(0xFFCBD5E1),
                  ),
                  child: _isSubmitting
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(
                              strokeWidth: 2.5, color: Colors.white),
                        )
                      : Text(
                          canPlaceOrder
                              ? 'Place Order • ${_formatPaise(_grandTotalPaise)}'
                              : 'Prescription Approval Required',
                          style: const TextStyle(
                              fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                ),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}
