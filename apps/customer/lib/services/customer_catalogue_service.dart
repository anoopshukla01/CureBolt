import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:core_models/core_models.dart';

class CustomerCatalogueService {
  final String baseUrl;
  final http.Client _client;

  CustomerCatalogueService({
    required this.baseUrl,
    http.Client? client,
  }) : _client = client ?? http.Client();

  /// Curated demo catalogue for Gorakhpur quick medicine delivery
  static final List<ProductModel> seedProducts = [
    // --- HUMAN HEALTHCARE ---
    const ProductModel(
      id: 'prod-h-1',
      name: 'Dolo 650 Paracetamol Tablets',
      brand: 'Micro Labs',
      composition: 'Paracetamol IP 650 mg',
      packSize: '15 Tablets Strip',
      mrp: 34.0,
      sellingPrice: 30.0,
      isOtcDirect: true,
      requiresPrescription: false,
      domain: HealthcareDomain.human,
      images: ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400'],
      stockBadge: StockBadge.inStock,
      availableQuantity: 45,
    ),
    const ProductModel(
      id: 'prod-h-2',
      name: 'Azee 500 Tablets',
      brand: 'Cipla',
      composition: 'Azithromycin IP 500 mg',
      packSize: '5 Tablets Strip',
      mrp: 132.0,
      sellingPrice: 119.0,
      isOtcDirect: false,
      requiresPrescription: true,
      domain: HealthcareDomain.human,
      images: ['https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400'],
      stockBadge: StockBadge.inStock,
      availableQuantity: 20,
    ),
    const ProductModel(
      id: 'prod-h-3',
      name: 'Pan-D Gastro-Resistant Capsule',
      brand: 'Alkem Laboratories',
      composition: 'Pantoprazole 40mg + Domperidone 30mg',
      packSize: '15 Capsules Strip',
      mrp: 210.0,
      sellingPrice: 185.0,
      isOtcDirect: false,
      requiresPrescription: true,
      domain: HealthcareDomain.human,
      images: ['https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400'],
      stockBadge: StockBadge.inStock,
      availableQuantity: 30,
    ),
    const ProductModel(
      id: 'prod-h-4',
      name: 'Electral ORS Powder (WHO Formula)',
      brand: 'FDC Limited',
      composition: 'Sodium Chloride + Potassium Chloride + Dextrose',
      packSize: '21.8 g Sachet',
      mrp: 22.5,
      sellingPrice: 20.0,
      isOtcDirect: true,
      requiresPrescription: false,
      domain: HealthcareDomain.human,
      images: ['https://images.unsplash.com/photo-1550572017-ed240562e153?w=400'],
      stockBadge: StockBadge.inStock,
      availableQuantity: 80,
    ),
    const ProductModel(
      id: 'prod-h-5',
      name: 'Volini Pain Relief Gel',
      brand: 'Sun Pharma',
      composition: 'Diclofenac Diethylamine + Methyl Salicylate',
      packSize: '50 g Tube',
      mrp: 165.0,
      sellingPrice: 145.0,
      isOtcDirect: true,
      requiresPrescription: false,
      domain: HealthcareDomain.human,
      images: ['https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=400'],
      stockBadge: StockBadge.inStock,
      availableQuantity: 25,
    ),

    // --- VETERINARY HEALTHCARE ---
    const ProductModel(
      id: 'prod-v-1',
      name: 'Albomar Dewormer Suspension (Vet)',
      brand: 'Virbac Animal Health',
      composition: 'Albendazole IP 2.5% w/v',
      packSize: '100 ml Bottle',
      mrp: 125.0,
      sellingPrice: 110.0,
      isOtcDirect: true,
      requiresPrescription: false,
      domain: HealthcareDomain.veterinary,
      targetSpecies: 'Cattle, Sheep, Goats',
      withdrawalPeriodDays: 14,
      images: ['https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400'],
      stockBadge: StockBadge.inStock,
      availableQuantity: 18,
    ),
    const ProductModel(
      id: 'prod-v-2',
      name: 'Intacef Vet 3g Injection',
      brand: 'Intas Pharmaceuticals',
      composition: 'Ceftriaxone Sodium Sterile 3g',
      packSize: 'Vial with Water for Inj',
      mrp: 220.0,
      sellingPrice: 198.0,
      isOtcDirect: false,
      requiresPrescription: true,
      domain: HealthcareDomain.veterinary,
      targetSpecies: 'Large Animals / Cattle',
      withdrawalPeriodDays: 7,
      images: ['https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400'],
      stockBadge: StockBadge.inStock,
      availableQuantity: 12,
    ),
    const ProductModel(
      id: 'prod-v-3',
      name: 'Calshake Oral Calcium Gel for Cows',
      brand: 'Cargill Animal Nutrition',
      composition: 'Chelated Calcium + Phosphorus + Vit D3',
      packSize: '300 g Tube',
      mrp: 195.0,
      sellingPrice: 175.0,
      isOtcDirect: true,
      requiresPrescription: false,
      domain: HealthcareDomain.veterinary,
      targetSpecies: 'Dairy Cattle / Buffaloes',
      images: ['https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?w=400'],
      stockBadge: StockBadge.inStock,
      availableQuantity: 30,
    ),
    const ProductModel(
      id: 'prod-v-4',
      name: 'Notix Anti-Tick & Flea Pet Shampoo',
      brand: 'Petcare',
      composition: 'Propoxur 0.1% w/w',
      packSize: '150 ml Bottle',
      mrp: 240.0,
      sellingPrice: 215.0,
      isOtcDirect: true,
      requiresPrescription: false,
      domain: HealthcareDomain.veterinary,
      targetSpecies: 'Dogs & Cats',
      images: ['https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400'],
      stockBadge: StockBadge.inStock,
      availableQuantity: 22,
    ),
  ];

  Future<List<ProductModel>> getProducts({
    HealthcareDomain? domain,
    String? query,
    String? category,
  }) async {
    try {
      final uri = Uri.parse('$baseUrl/api/v1/customer/products').replace(
        queryParameters: {
          if (domain != null) 'domain': domain.name,
          if (query != null && query.isNotEmpty) 'q': query,
          if (category != null && category.isNotEmpty) 'category': category,
        },
      );
      final response = await _client.get(uri).timeout(const Duration(seconds: 3));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final list = (data['items'] ?? data['products']) as List<dynamic>?;
        if (list != null && list.isNotEmpty) {
          return list.map((json) => ProductModel.fromJson(json as Map<String, dynamic>)).toList();
        }
      }
    } catch (_) {
      // Fallback to offline seed database
    }

    var result = List<ProductModel>.from(seedProducts);
    if (domain != null) {
      result = result.where((p) => p.domain == domain).toList();
    }
    if (query != null && query.trim().isNotEmpty) {
      final q = query.trim().toLowerCase();
      result = result.where((p) =>
        p.name.toLowerCase().contains(q) ||
        p.brand.toLowerCase().contains(q) ||
        (p.composition?.toLowerCase().contains(q) ?? false) ||
        (p.targetSpecies?.toLowerCase().contains(q) ?? false)
      ).toList();
    }
    return result;
  }
}
