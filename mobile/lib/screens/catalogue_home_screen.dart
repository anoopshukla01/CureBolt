import 'package:flutter/material.dart';
import '../models/product.dart';
import '../services/api_service.dart';

class CatalogueHomeScreen extends StatefulWidget {
  final String domain;
  final String domainTitle;

  const CatalogueHomeScreen({
    super.key,
    required this.domain,
    required this.domainTitle,
  });

  @override
  State<CatalogueHomeScreen> createState() => _CatalogueHomeScreenState();
}

class _CatalogueHomeScreenState extends State<CatalogueHomeScreen> {
  List<Product> _products = [];
  bool _isLoading = true;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _loadProducts();
  }

  Future<void> _loadProducts() async {
    setState(() => _isLoading = true);
    final results = await ApiService.fetchProducts(widget.domain, query: _searchQuery);
    setState(() {
      _products = results.isNotEmpty ? results : _getFallbackProducts();
      _isLoading = false;
    });
  }

  List<Product> _getFallbackProducts() {
    if (widget.domain == 'human') {
      return [
        Product(
          id: 'prd-dolo-650',
          name: 'Dolo 650mg Tablet',
          brand: 'Micro Labs',
          genericSaltName: 'Paracetamol (650mg)',
          categoryDomain: 'human',
          formulation: 'Tablet',
          strength: '650mg',
          packSize: '15 Tablets',
          manufacturer: 'Micro Labs Ltd',
          requiresPrescription: false,
          scheduleType: 'OTC',
          sellingPrice: 30.50,
          mrp: 34.00,
          availableQuantity: 150,
          inStock: true,
        ),
        Product(
          id: 'prd-glycomet-500',
          name: 'Glycomet 500 SR Tablet',
          brand: 'USV Ltd',
          genericSaltName: 'Metformin Hydrochloride (500mg)',
          categoryDomain: 'human',
          formulation: 'Tablet',
          strength: '500mg',
          packSize: '20 Tablets',
          manufacturer: 'USV Private Limited',
          requiresPrescription: true,
          scheduleType: 'Schedule H',
          sellingPrice: 46.80,
          mrp: 52.00,
          availableQuantity: 80,
          inStock: true,
        ),
      ];
    } else {
      return [
        Product(
          id: 'prd-himcal-1l',
          name: 'HimCal Liquid Calcium (Cattle/Buffalo)',
          brand: 'Himalaya Animal Health',
          genericSaltName: 'Calcium, Phosphorus & Vit D3',
          categoryDomain: 'veterinary',
          formulation: 'Liquid Suspension',
          strength: 'High Calcium',
          packSize: '1 Litre Bottle',
          manufacturer: 'The Himalaya Drug Company',
          requiresPrescription: false,
          scheduleType: 'OTC',
          sellingPrice: 216.00,
          mrp: 240.00,
          availableQuantity: 30,
          inStock: true,
          speciesRestrictions: [
            SpeciesRestriction(speciesName: 'Cattle', withdrawalPeriodDays: 0, precautions: 'Zero milk withdrawal.')
          ],
        ),
      ];
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(widget.domainTitle),
        actions: [
          IconButton(
            icon: const Icon(Icons.shopping_bag_outlined),
            onPressed: () {},
          )
        ],
      ),
      body: Column(
        children: [
          // Search Bar
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Search medicines, generic salts...',
                prefixIcon: const Icon(Icons.search, color: Color(0xFF94A3B8)),
                filled: true,
                fillColor: Colors.white,
                contentPadding: const EdgeInsets.symmetric(horizontal: 16),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                ),
              ),
              onChanged: (val) {
                _searchQuery = val;
                _loadProducts();
              },
            ),
          ),

          // Gorakhpur Partner Pharmacy Banner
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 16),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: const Color(0xFFEFF6FF),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFFDBEAFE)),
            ),
            child: const Row(
              children: [
                Icon(Icons.storefront_rounded, color: Color(0xFF1D4ED8), size: 18),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Fulfilled by: Gorakhpur Medicos & Vet Care (Golghar)',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF1E40AF)),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 12),

          // Products List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF028391)))
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _products.length,
                    itemBuilder: (context, index) {
                      final product = _products[index];
                      return Container(
                        margin: const EdgeInsets.only(bottom: 16),
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
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: [
                                    if (product.requiresPrescription)
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFFEE2E2),
                                          borderRadius: BorderRadius.circular(6),
                                        ),
                                        child: const Text('Rx Required', style: TextStyle(color: Color(0xFFB91C1C), fontSize: 10, fontWeight: FontWeight.w800)),
                                      )
                                    else
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFECFDF5),
                                          borderRadius: BorderRadius.circular(6),
                                        ),
                                        child: const Text('OTC', style: TextStyle(color: Color(0xFF047857), fontSize: 10, fontWeight: FontWeight.w800)),
                                      ),
                                    const SizedBox(width: 6),
                                    Text(product.scheduleType, style: const TextStyle(fontSize: 11, color: Color(0xFF64748B), fontWeight: FontWeight.w600)),
                                  ],
                                ),
                                Text(
                                  product.inStock ? 'In Stock' : 'Out of Stock',
                                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: product.inStock ? const Color(0xFF16A34A) : Colors.red),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(product.name, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFF0B192C))),
                            if (product.genericSaltName != null) ...[
                              const SizedBox(height: 2),
                              Text(product.genericSaltName!, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF028391))),
                            ],
                            const SizedBox(height: 4),
                            Text('${product.packSize} • ${product.manufacturer}', style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),

                            // Species Restriction Notice
                            if (product.speciesRestrictions != null && product.speciesRestrictions!.isNotEmpty) ...[
                              const SizedBox(height: 10),
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFFFFBEB),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: const Color(0xFFFEF3C7)),
                                ),
                                child: Text(
                                  'Species: ${product.speciesRestrictions!.map((s) => s.speciesName).join(', ')} | Withdrawal: ${product.speciesRestrictions![0].withdrawalPeriodDays} Days',
                                  style: const TextStyle(fontSize: 11, color: Color(0xFFB45309), fontWeight: FontWeight.w600),
                                ),
                              ),
                            ],

                            const SizedBox(height: 14),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: [
                                    Text('₹${product.sellingPrice.toStringAsFixed(2)}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFF0B192C))),
                                    if (product.mrp > product.sellingPrice) ...[
                                      const SizedBox(width: 6),
                                      Text('₹${product.mrp.toStringAsFixed(2)}', style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8), decoration: TextDecoration.lineThrough)),
                                    ],
                                  ],
                                ),
                                ElevatedButton(
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF028391),
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                  ),
                                  onPressed: () {},
                                  child: const Text('+ Add', style: TextStyle(fontWeight: FontWeight.w700)),
                                ),
                              ],
                            ),
                          ],
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
