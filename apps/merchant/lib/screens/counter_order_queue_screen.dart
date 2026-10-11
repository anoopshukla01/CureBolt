import 'package:flutter/material.dart';
import 'package:core_models/core_models.dart';
import 'prescription_review_sheet.dart';
import 'order_packing_screen.dart';

class CounterOrderQueueScreen extends StatefulWidget {
  final String pharmacyName;
  final String pharmacistName;
  final String pharmacistRegNo;

  const CounterOrderQueueScreen({
    super.key,
    required this.pharmacyName,
    required this.pharmacistName,
    required this.pharmacistRegNo,
  });

  @override
  State<CounterOrderQueueScreen> createState() => _CounterOrderQueueScreenState();
}

class _CounterOrderQueueScreenState extends State<CounterOrderQueueScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _audioAlertEnabled = true;

  // Demo counter state
  late List<OrderModel> _incomingOrders;
  late List<OrderModel> _packingOrders;
  late List<OrderModel> _readyOrders;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);

    _incomingOrders = [
      OrderModel(
        id: 'ord-in-1',
        orderNumber: 'MED-99214',
        state: OrderState.pharmacyReview,
        paymentMode: PaymentMode.online,
        items: const [
          OrderItemModel(productId: 'prod-h-1', productName: 'Dolo 650 Tablets', quantity: 1, unitPrice: 30),
          OrderItemModel(productId: 'prod-h-2', productName: 'Azee 500 Tablets (Rx Required)', quantity: 1, unitPrice: 119),
        ],
        subtotal: 149.0,
        deliveryFee: 15.0,
        taxes: 0.0,
        total: 169.0,
        pharmacyId: 'pharma-gkp-1',
        pharmacyName: widget.pharmacyName,
        deliveryAddress: 'H.No 412, Rapti Nagar Phase 4, Gorakhpur',
        deliveryOtp: '4829',
        handoverOtp: '9182',
        createdAt: DateTime.now().subtract(const Duration(minutes: 2)),
      ),
    ];

    _packingOrders = [
      OrderModel(
        id: 'ord-pack-1',
        orderNumber: 'MED-99182',
        state: OrderState.packing,
        paymentMode: PaymentMode.cod,
        items: const [
          OrderItemModel(productId: 'prod-h-4', productName: 'Electral ORS Sachets', quantity: 3, unitPrice: 20),
          OrderItemModel(productId: 'prod-h-5', productName: 'Volini Pain Relief Gel', quantity: 1, unitPrice: 145),
        ],
        subtotal: 205.0,
        deliveryFee: 0.0,
        taxes: 0.0,
        total: 210.0,
        pharmacyId: 'pharma-gkp-1',
        pharmacyName: widget.pharmacyName,
        deliveryAddress: 'Shop #12, Golghar Market, Gorakhpur',
        deliveryOtp: '1120',
        handoverOtp: '3391',
        createdAt: DateTime.now().subtract(const Duration(minutes: 6)),
      ),
    ];

    _readyOrders = [];
  }

  void _openPrescriptionReview(OrderModel order) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => PrescriptionReviewSheet(
        orderNumber: order.orderNumber,
        patientName: 'Sunita Sharma (Gorakhpur)',
        pharmacistName: widget.pharmacistName,
        pharmacistRegNo: widget.pharmacistRegNo,
        onDecision: (approved) {
          if (approved) {
            setState(() {
              _incomingOrders.remove(order);
              _packingOrders.add(order);
              _tabController.animateTo(1);
            });
          }
        },
      ),
    );
  }

  void _openPacking(OrderModel order) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => OrderPackingScreen(
          order: order,
          onPacked: () {
            setState(() {
              _packingOrders.remove(order);
              _readyOrders.add(order);
              _tabController.animateTo(2);
            });
          },
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0284C7),
        foregroundColor: Colors.white,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.pharmacyName, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            Text('Pharmacist on Duty: ${widget.pharmacistName} (Reg: ${widget.pharmacistRegNo})', style: TextStyle(fontSize: 11, color: Colors.white.withOpacity(0.85))),
          ],
        ),
        actions: [
          Row(
            children: [
              const Icon(Icons.volume_up_rounded, size: 18),
              Switch(
                value: _audioAlertEnabled,
                activeColor: Colors.white,
                activeTrackColor: const Color(0xFF0369A1),
                onChanged: (v) => setState(() => _audioAlertEnabled = v),
              ),
            ],
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          indicatorWeight: 3,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          tabs: [
            Tab(text: 'Incoming (${_incomingOrders.length})'),
            Tab(text: 'Packing (${_packingOrders.length})'),
            Tab(text: 'Ready (${_readyOrders.length})'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildOrderList(_incomingOrders, isIncoming: true),
          _buildOrderList(_packingOrders, isPacking: true),
          _buildOrderList(_readyOrders, isReady: true),
        ],
      ),
    );
  }

  Widget _buildOrderList(List<OrderModel> orders, {bool isIncoming = false, bool isPacking = false, bool isReady = false}) {
    if (orders.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.check_circle_outline, size: 64, color: Colors.blueGrey.shade200),
            const SizedBox(height: 12),
            const Text('All orders cleared in this queue', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 4),
            const Text('New customer orders in Gorakhpur will appear here instantly.', style: TextStyle(color: Color(0xFF64748B))),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: orders.length,
      itemBuilder: (context, index) {
        final order = orders[index];
        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.03),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Order #${order.orderNumber}',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF0F9FF),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      '₹${order.total.toStringAsFixed(0)} • ${order.paymentMode.name.toUpperCase()}',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF0284C7)),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                'Drop: ${order.deliveryAddress}',
                style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
              ),
              const Divider(height: 20),

              ...order.items.map((item) {
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 2.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('• ${item.productName}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
                      Text('x${item.quantity}', style: const TextStyle(fontSize: 13, color: Color(0xFF64748B))),
                    ],
                  ),
                );
              }),
              const SizedBox(height: 16),

              if (isIncoming) ...[
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => _openPrescriptionReview(order),
                        icon: const Icon(Icons.document_scanner_outlined, size: 16),
                        label: const Text('Review Rx (Doctor Note)'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: const Color(0xFF0284C7),
                          side: const BorderSide(color: Color(0xFF0284C7)),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                          setState(() {
                            _incomingOrders.remove(order);
                            _packingOrders.add(order);
                            _tabController.animateTo(1);
                          });
                        },
                        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0284C7), foregroundColor: Colors.white),
                        child: const Text('Accept & Pack'),
                      ),
                    ),
                  ],
                ),
              ],

              if (isPacking) ...[
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () => _openPacking(order),
                    icon: const Icon(Icons.inventory_2_outlined),
                    label: const Text('FEFO Batch Allocation & Pack Bag'),
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0284C7), foregroundColor: Colors.white),
                  ),
                ),
              ],

              if (isReady) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFDCFCE7),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.two_wheeler_rounded, color: Color(0xFF16A34A)),
                          SizedBox(width: 8),
                          Text('Rider en route to counter', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF166534))),
                        ],
                      ),
                      Text(
                        'Handover PIN: ${order.handoverOtp ?? "9182"}',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF166534)),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        );
      },
    );
  }
}
