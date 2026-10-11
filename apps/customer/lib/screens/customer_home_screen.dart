import 'package:flutter/material.dart';
import 'package:core_models/core_models.dart';
import 'package:core_auth/core_auth.dart';
import '../models/cart_model.dart';
import '../services/customer_catalogue_service.dart';
import '../services/customer_profile_service.dart';
import 'location_picker_screen.dart';
import 'product_detail_sheet.dart';
import 'cart_screen.dart';

class CustomerHomeScreen extends StatefulWidget {
  final AuthController controller;
  final CustomerProfile? profile;
  final String apiBaseUrl;

  const CustomerHomeScreen({
    super.key,
    required this.controller,
    this.profile,
    this.apiBaseUrl = 'http://localhost:3000',
  });

  @override
  State<CustomerHomeScreen> createState() => _CustomerHomeScreenState();
}

class _CustomerHomeScreenState extends State<CustomerHomeScreen> {
  late CustomerCatalogueService _catalogueService;
  final CartModel _cart = CartModel();

  DeliveryLocation _currentLocation = LocationPickerScreen.popularGorakhpurZones.first;
  HealthcareDomain _activeDomain = HealthcareDomain.human;
  String _searchQuery = '';
  List<ProductModel> _products = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _catalogueService = CustomerCatalogueService(baseUrl: widget.apiBaseUrl);
    _loadProducts();
  }

  Future<void> _loadProducts() async {
    setState(() => _isLoading = true);
    final items = await _catalogueService.getProducts(
      domain: _activeDomain,
      query: _searchQuery,
    );
    if (!mounted) return;
    setState(() {
      _products = items;
      _isLoading = false;
    });
  }

  void _switchDomain(HealthcareDomain domain) {
    if (_activeDomain == domain) return;
    setState(() {
      _activeDomain = domain;
    });
    _loadProducts();
  }

  void _openLocationPicker() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => LocationPickerScreen(
          currentLocation: _currentLocation,
          onLocationSelected: (loc) {
            setState(() => _currentLocation = loc);
          },
        ),
      ),
    );
  }

  void _openProductDetail(ProductModel product) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => ProductDetailSheet(product: product, cart: _cart),
    );
  }

  void _openCart() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => CartScreen(
          cart: _cart,
          deliveryLocation: _currentLocation,
          customerPhone: widget.controller.state.phone ?? widget.profile?.phone,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isVet = _activeDomain == HealthcareDomain.veterinary;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: isVet ? const Color(0xFF78350F) : const Color(0xFF0F766E),
        elevation: 0,
        titleSpacing: 12,
        title: InkWell(
          onTap: _openLocationPicker,
          child: Row(
            children: [
              const Icon(Icons.location_on_rounded, color: Colors.white, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          _currentLocation.label,
                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                        const Icon(Icons.keyboard_arrow_down_rounded, color: Colors.white, size: 16),
                      ],
                    ),
                    Text(
                      '${_currentLocation.estimatedEtaMinutes} to ${_currentLocation.pinCode}',
                      style: TextStyle(fontSize: 11, color: Colors.white.withOpacity(0.85)),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.person_outline_rounded, color: Colors.white),
            tooltip: 'Sign Out',
            onPressed: () => widget.controller.logout(),
          ),
        ],
      ),
      body: Stack(
        children: [
          CustomScrollView(
            slivers: [
              // Top Search & Domain Selector Bar
              SliverToBoxAdapter(
                child: Container(
                  color: isVet ? const Color(0xFF78350F) : const Color(0xFF0F766E),
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
                  child: Column(
                    children: [
                      // Search bar
                      Container(
                        height: 44,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.06),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: TextField(
                          onChanged: (val) {
                            _searchQuery = val;
                            _loadProducts();
                          },
                          decoration: const InputDecoration(
                            hintText: 'Search medicines, molecules, cattle care...',
                            prefixIcon: Icon(Icons.search_rounded, size: 20, color: Color(0xFF64748B)),
                            border: InputBorder.none,
                            contentPadding: EdgeInsets.symmetric(vertical: 10),
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),

                      // Dual-domain Tab Selector (as seen on CureBolt box)
                      Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.18),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: InkWell(
                                onTap: () => _switchDomain(HealthcareDomain.human),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(vertical: 8),
                                  decoration: BoxDecoration(
                                    color: !isVet ? Colors.white : Colors.transparent,
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(
                                        Icons.person_rounded,
                                        size: 16,
                                        color: !isVet ? const Color(0xFF0F766E) : Colors.white,
                                      ),
                                      const SizedBox(width: 6),
                                      Text(
                                        'FOR HUMANS',
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 12,
                                          color: !isVet ? const Color(0xFF0F766E) : Colors.white,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                            Expanded(
                              child: InkWell(
                                onTap: () => _switchDomain(HealthcareDomain.veterinary),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(vertical: 8),
                                  decoration: BoxDecoration(
                                    color: isVet ? Colors.white : Colors.transparent,
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(
                                        Icons.pets_rounded,
                                        size: 16,
                                        color: isVet ? const Color(0xFF78350F) : Colors.white,
                                      ),
                                      const SizedBox(width: 6),
                                      Text(
                                        'FOR ANIMALS',
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 12,
                                          color: isVet ? const Color(0xFF78350F) : Colors.white,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Trust banner
              SliverToBoxAdapter(
                child: Container(
                  margin: const EdgeInsets.all(16),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.verified_user_rounded, color: Color(0xFF0D9488), size: 20),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          isVet
                              ? '100% Genuine Vet Drugs • Cold Chain Maintained for Cattle & Pets'
                              : 'Licensed Pharmacies in Gorakhpur • 10-Min Delivery Guarantee',
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF334155)),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Products Grid
              if (_isLoading)
                const SliverToBoxAdapter(
                  child: Center(
                    child: Padding(
                      padding: EdgeInsets.all(48.0),
                      child: CircularProgressIndicator(),
                    ),
                  ),
                )
              else if (_products.isEmpty)
                const SliverToBoxAdapter(
                  child: Center(
                    child: Padding(
                      padding: EdgeInsets.all(48.0),
                      child: Text('No medicines found matching your search.'),
                    ),
                  ),
                )
              else
                SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  sliver: SliverGrid(
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      mainAxisSpacing: 12,
                      crossAxisSpacing: 12,
                      childAspectRatio: 0.65,
                    ),
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final product = _products[index];
                        return _buildProductCard(product);
                      },
                      childCount: _products.length,
                    ),
                  ),
                ),

              // Bottom padding so items aren't obscured by the Cart Bar
              const SliverToBoxAdapter(
                child: SizedBox(height: 100),
              ),
            ],
          ),

          // Persistent Floating Cart Bar (Blinkit style)
          AnimatedBuilder(
            animation: _cart,
            builder: (context, _) {
              if (_cart.itemCount == 0) return const SizedBox.shrink();

              return Positioned(
                bottom: 16,
                left: 16,
                right: 16,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0F172A),
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.25),
                        blurRadius: 16,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFF0D9488),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          '${_cart.itemCount} ${_cart.itemCount == 1 ? "ITEM" : "ITEMS"}',
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            '₹${_cart.subtotal.toStringAsFixed(0)}',
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                          ),
                          if (_cart.totalSavings > 0)
                            Text(
                              'Saved ₹${_cart.totalSavings.toStringAsFixed(0)}',
                              style: const TextStyle(color: Color(0xFF4ADE80), fontSize: 11, fontWeight: FontWeight.w600),
                            ),
                        ],
                      ),
                      const Spacer(),
                      ElevatedButton.icon(
                        onPressed: _openCart,
                        icon: const Icon(Icons.arrow_forward_rounded, size: 16),
                        label: const Text('View Cart'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF0D9488),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildProductCard(ProductModel product) {
    return AnimatedBuilder(
      animation: _cart,
      builder: (context, _) {
        final qty = _cart.getQuantity(product.id);

        return InkWell(
          onTap: () => _openProductDetail(product),
          borderRadius: BorderRadius.circular(16),
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.02),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Image container & Rx badge
                Stack(
                  children: [
                    Container(
                      height: 100,
                      width: double.infinity,
                      decoration: const BoxDecoration(
                        color: Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.vertical(top: Radius.circular(15)),
                      ),
                      child: const Center(
                        child: Icon(Icons.medication_rounded, size: 48, color: Color(0xFF94A3B8)),
                      ),
                    ),
                    if (product.requiresPrescription)
                      Positioned(
                        top: 6,
                        left: 6,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFFDC2626),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text(
                            'Rx',
                            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 10),
                          ),
                        ),
                      ),
                    if (product.discountPercent > 0)
                      Positioned(
                        top: 6,
                        right: 6,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFF16A34A),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            '${product.discountPercent.toStringAsFixed(0)}% OFF',
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 10),
                          ),
                        ),
                      ),
                  ],
                ),

                // Content
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.all(10.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          product.name,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, height: 1.2),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          product.packSize,
                          style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                        ),
                        const Spacer(),

                        // Pricing & Stepper
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '₹${product.sellingPrice.toStringAsFixed(0)}',
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Color(0xFF0F172A)),
                                ),
                                if (product.mrp > product.sellingPrice)
                                  Text(
                                    '₹${product.mrp.toStringAsFixed(0)}',
                                    style: const TextStyle(
                                      fontSize: 11,
                                      color: Color(0xFF94A3B8),
                                      decoration: TextDecoration.lineThrough,
                                    ),
                                  ),
                              ],
                            ),

                            // Stepper or Add button
                            qty == 0
                                ? SizedBox(
                                    height: 32,
                                    child: OutlinedButton(
                                      onPressed: () => _cart.add(product),
                                      style: OutlinedButton.styleFrom(
                                        padding: const EdgeInsets.symmetric(horizontal: 12),
                                        side: const BorderSide(color: Color(0xFF0D9488)),
                                        foregroundColor: const Color(0xFF0D9488),
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                      ),
                                      child: const Text('ADD', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                                    ),
                                  )
                                : Container(
                                    height: 32,
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF0D9488),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        InkWell(
                                          onTap: () => _cart.remove(product.id),
                                          child: const Padding(
                                            padding: EdgeInsets.symmetric(horizontal: 6),
                                            child: Icon(Icons.remove, size: 14, color: Colors.white),
                                          ),
                                        ),
                                        Text(
                                          '$qty',
                                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                                        ),
                                        InkWell(
                                          onTap: () => _cart.add(product),
                                          child: const Padding(
                                            padding: EdgeInsets.symmetric(horizontal: 6),
                                            child: Icon(Icons.add, size: 14, color: Colors.white),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
