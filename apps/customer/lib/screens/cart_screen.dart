import 'package:flutter/material.dart';
import 'package:core_models/core_models.dart';
import '../models/cart_model.dart';
import 'location_picker_screen.dart';
import 'live_order_tracking_screen.dart';

class CartScreen extends StatefulWidget {
  final CartModel cart;
  final DeliveryLocation deliveryLocation;
  final String? customerPhone;

  const CartScreen({
    super.key,
    required this.cart,
    required this.deliveryLocation,
    this.customerPhone,
  });

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  PaymentMode _selectedPaymentMode = PaymentMode.online;
  bool _isPlacingOrder = false;

  void _attachMockPrescription() {
    widget.cart.attachPrescription('rx_upload_gorakhpur_${DateTime.now().millisecondsSinceEpoch}.jpg');
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Prescription attached. Registered Pharmacist will verify before packing.'),
        backgroundColor: Color(0xFF0D9488),
      ),
    );
  }

  Future<void> _placeOrder() async {
    if (widget.cart.items.isEmpty) return;

    if (widget.cart.requiresPrescription && !widget.cart.hasValidPrescription) {
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Prescription Required'),
          content: const Text(
            'Your cart includes Schedule H/H1 regulated medicines. Statutory Indian drug compliance requires a valid doctor’s prescription before dispatch.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('Cancel'),
            ),
            ElevatedButton.icon(
              onPressed: () {
                Navigator.of(ctx).pop();
                _attachMockPrescription();
              },
              icon: const Icon(Icons.upload_file_rounded),
              label: const Text('Upload Prescription'),
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0D9488), foregroundColor: Colors.white),
            ),
          ],
        ),
      );
      return;
    }

    setState(() => _isPlacingOrder = true);

    // Simulate backend order creation
    await Future.delayed(const Duration(milliseconds: 900));

    final placedOrder = OrderModel(
      id: 'ord-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}',
      orderNumber: 'MED-${DateTime.now().millisecondsSinceEpoch.toString().substring(8)}',
      state: OrderState.created,
      paymentMode: _selectedPaymentMode,
      items: widget.cart.items.values.map((i) => OrderItemModel(
        productId: i.product.id,
        productName: i.product.name,
        quantity: i.quantity,
        unitPrice: i.product.sellingPrice,
      )).toList(),
      subtotal: widget.cart.subtotal,
      deliveryFee: widget.cart.deliveryFee,
      taxes: 0.0,
      total: widget.cart.total,
      pharmacyId: 'pharma-gkp-1',
      pharmacyName: 'Apollo Pharmacy — Golghar Hub',
      deliveryAddress: '${widget.deliveryLocation.fullAddress} (PIN: ${widget.deliveryLocation.pinCode})',
      deliveryOtp: '4829',
      handoverOtp: '9182',
      createdAt: DateTime.now(),
    );

    widget.cart.clear();

    if (!mounted) return;
    setState(() => _isPlacingOrder = false);

    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) => LiveOrderTrackingScreen(
          order: placedOrder,
          location: widget.deliveryLocation,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Review Cart & Bill'),
      ),
      body: AnimatedBuilder(
        animation: widget.cart,
        builder: (context, _) {
          if (widget.cart.items.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.shopping_bag_outlined, size: 72, color: Color(0xFF94A3B8)),
                  const SizedBox(height: 16),
                  const Text('Your cart is empty', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  const Text('Add medicines for 10-minute delivery in Gorakhpur', style: TextStyle(color: Color(0xFF64748B))),
                  const SizedBox(height: 20),
                  ElevatedButton(
                    onPressed: () => Navigator.of(context).pop(),
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0D9488), foregroundColor: Colors.white),
                    child: const Text('Browse Catalogue'),
                  ),
                ],
              ),
            );
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Delivery address header
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.location_on_rounded, color: Color(0xFF0D9488)),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Delivering to ${widget.deliveryLocation.label}',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF0F172A)),
                            ),
                            Text(
                              widget.deliveryLocation.fullAddress,
                              style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFDCFCE7),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          widget.deliveryLocation.estimatedEtaMinutes,
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF16A34A)),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Prescription Upload banner if required
                if (widget.cart.requiresPrescription) ...[
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: widget.cart.hasValidPrescription ? const Color(0xFFF0FDF4) : const Color(0xFFFEF2F2),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: widget.cart.hasValidPrescription ? const Color(0xFF86EFAC) : const Color(0xFFFCA5A5),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(
                              widget.cart.hasValidPrescription ? Icons.verified_rounded : Icons.medical_services_rounded,
                              color: widget.cart.hasValidPrescription ? const Color(0xFF16A34A) : const Color(0xFFDC2626),
                              size: 20,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              widget.cart.hasValidPrescription
                                  ? 'Doctor’s Prescription Attached'
                                  : 'Prescription Required for Regulated Drugs',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                                color: widget.cart.hasValidPrescription ? const Color(0xFF166534) : const Color(0xFF991B1B),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          widget.cart.hasValidPrescription
                            ? 'Our Registered Pharmacist in Gorakhpur will review this before dispatch.'
                            : 'Required under statutory Drugs & Cosmetics Rules for Schedule H/H1 items in your cart.',
                          style: TextStyle(
                            fontSize: 12,
                            color: widget.cart.hasValidPrescription ? const Color(0xFF15803D) : const Color(0xFFB91C1C),
                          ),
                        ),
                        const SizedBox(height: 10),
                        widget.cart.hasValidPrescription
                            ? TextButton.icon(
                                onPressed: widget.cart.clearPrescription,
                                icon: const Icon(Icons.delete_outline, size: 16, color: Color(0xFFDC2626)),
                                label: const Text('Remove or re-upload', style: TextStyle(fontSize: 12, color: Color(0xFFDC2626))),
                              )
                            : OutlinedButton.icon(
                                onPressed: _attachMockPrescription,
                                icon: const Icon(Icons.upload_file_rounded, size: 16),
                                label: const Text('Attach Doctor Prescription'),
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: const Color(0xFFDC2626),
                                  side: const BorderSide(color: Color(0xFFDC2626)),
                                ),
                              ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // Items list
                const Text('Medicines in Order', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 10),
                ...widget.cart.items.values.map((item) {
                  return Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item.product.name,
                                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                item.product.packSize,
                                style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '₹${item.product.sellingPrice.toStringAsFixed(0)} each',
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF0F172A)),
                              ),
                            ],
                          ),
                        ),
                        // Quantity stepper
                        Container(
                          decoration: BoxDecoration(
                            color: const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            children: [
                              IconButton(
                                icon: const Icon(Icons.remove, size: 16),
                                onPressed: () => widget.cart.remove(item.product.id),
                                constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                                padding: EdgeInsets.zero,
                              ),
                              Text(
                                '${item.quantity}',
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                              ),
                              IconButton(
                                icon: const Icon(Icons.add, size: 16),
                                onPressed: () => widget.cart.add(item.product),
                                constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                                padding: EdgeInsets.zero,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  );
                }),
                const SizedBox(height: 16),

                // Payment mode selector
                const Text('Payment Method', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: RadioListTile<PaymentMode>(
                        title: const Text('UPI / Online', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                        subtitle: const Text('GPay, PhonePe, Cards', style: TextStyle(fontSize: 11)),
                        value: PaymentMode.online,
                        groupValue: _selectedPaymentMode,
                        onChanged: (val) => setState(() => _selectedPaymentMode = val!),
                        activeColor: const Color(0xFF0D9488),
                        contentPadding: EdgeInsets.zero,
                      ),
                    ),
                    Expanded(
                      child: RadioListTile<PaymentMode>(
                        title: const Text('Cash on Delivery', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                        subtitle: const Text('Pay rider at doorstep', style: TextStyle(fontSize: 11)),
                        value: PaymentMode.cod,
                        groupValue: _selectedPaymentMode,
                        onChanged: (val) => setState(() => _selectedPaymentMode = val!),
                        activeColor: const Color(0xFF0D9488),
                        contentPadding: EdgeInsets.zero,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Bill details
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Bill Summary', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                      const SizedBox(height: 10),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Item Total', style: TextStyle(color: Color(0xFF64748B))),
                          Text('₹${widget.cart.subtotal.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.w600)),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Delivery Fee (10-Min Fast Track)', style: TextStyle(color: Color(0xFF64748B))),
                          Text(
                            widget.cart.deliveryFee == 0 ? 'FREE' : '₹${widget.cart.deliveryFee.toStringAsFixed(0)}',
                            style: TextStyle(
                              fontWeight: FontWeight.w600,
                              color: widget.cart.deliveryFee == 0 ? const Color(0xFF16A34A) : Colors.black,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Medical Packaging & Handling', style: TextStyle(color: Color(0xFF64748B))),
                          Text('₹${widget.cart.packagingFee.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.w600)),
                        ],
                      ),
                      if (widget.cart.totalSavings > 0) ...[
                        const SizedBox(height: 6),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('MRP Discount Savings', style: TextStyle(color: Color(0xFF16A34A), fontWeight: FontWeight.w600)),
                            Text('-₹${widget.cart.totalSavings.toStringAsFixed(0)}', style: const TextStyle(color: Color(0xFF16A34A), fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ],
                      const Divider(height: 20),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('To Pay', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                          Text(
                            '₹${widget.cart.total.toStringAsFixed(0)}',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20, color: Color(0xFF0D9488)),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Place Order Button
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton(
                    onPressed: _isPlacingOrder ? null : _placeOrder,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0D9488),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: _isPlacingOrder
                        ? const CircularProgressIndicator(color: Colors.white)
                        : Text(
                            'Place Order • ₹${widget.cart.total.toStringAsFixed(0)}',
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                  ),
                ),
                const SizedBox(height: 16),
              ],
            ),
          );
        },
      ),
    );
  }
}
