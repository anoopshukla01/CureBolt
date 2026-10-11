import 'enums.dart';

class ProductModel {
  final String id;
  final String name;
  final String brand;
  final String? composition;
  final String? strength;
  final String? formulation;
  final String packSize;
  final double mrp;
  final double sellingPrice;
  final bool isOtcDirect;
  final bool requiresPrescription;
  final HealthcareDomain domain;
  final String? targetSpecies;
  final int? withdrawalPeriodDays;
  final List<String> images;
  final StockBadge stockBadge;
  final int availableQuantity;
  final int maxOrderQuantity;

  const ProductModel({
    required this.id,
    required this.name,
    required this.brand,
    this.composition,
    this.strength,
    this.formulation,
    required this.packSize,
    required this.mrp,
    required this.sellingPrice,
    this.isOtcDirect = false,
    this.requiresPrescription = false,
    this.domain = HealthcareDomain.human,
    this.targetSpecies,
    this.withdrawalPeriodDays,
    this.images = const [],
    this.stockBadge = StockBadge.inStock,
    this.availableQuantity = 10,
    this.maxOrderQuantity = 10,
  }) : assert(sellingPrice <= mrp, 'Statutory safety violation: Selling price cannot exceed MRP');

  bool get isVeterinary => domain == HealthcareDomain.veterinary;
  bool get isHuman => domain == HealthcareDomain.human;
  bool get isAvailable => stockBadge != StockBadge.outOfStock && availableQuantity > 0;

  double get discountPercent {
    if (mrp <= 0 || sellingPrice >= mrp) return 0;
    return ((mrp - sellingPrice) / mrp) * 100;
  }

  factory ProductModel.fromJson(Map<String, dynamic> json) {
    final rawMrp = (json['mrp'] as num?)?.toDouble() ?? 0.0;
    final rawPrice = (json['sellingPrice'] as num?)?.toDouble() ?? (json['price'] as num?)?.toDouble() ?? rawMrp;
    // Enforce safety ceiling locally
    final validPrice = rawPrice > rawMrp ? rawMrp : rawPrice;

    return ProductModel(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      brand: json['brand'] as String? ?? '',
      composition: json['composition'] as String? ?? json['activeIngredient'] as String?,
      strength: json['strength'] as String?,
      formulation: json['formulation'] as String?,
      packSize: json['packSize'] as String? ?? '1 Pack',
      mrp: rawMrp,
      sellingPrice: validPrice,
      isOtcDirect: json['isOtcDirect'] as bool? ?? false,
      requiresPrescription: json['requiresPrescription'] as bool? ?? false,
      domain: HealthcareDomain.fromString(json['domain'] as String? ?? 'human'),
      targetSpecies: json['targetSpecies'] as String?,
      withdrawalPeriodDays: json['withdrawalPeriodDays'] as int?,
      images: (json['images'] as List<dynamic>?)?.map((e) => e.toString()).toList() ??
          (json['imageUrl'] != null ? [json['imageUrl'].toString()] : []),
      stockBadge: StockBadge.fromString(json['stockBadge'] as String? ?? 'in_stock'),
      availableQuantity: json['availableQuantity'] as int? ?? 10,
      maxOrderQuantity: json['maxOrderQuantity'] as int? ?? 10,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'brand': brand,
    'composition': composition,
    'strength': strength,
    'formulation': formulation,
    'packSize': packSize,
    'mrp': mrp,
    'sellingPrice': sellingPrice,
    'isOtcDirect': isOtcDirect,
    'requiresPrescription': requiresPrescription,
    'domain': domain.name,
    'targetSpecies': targetSpecies,
    'withdrawalPeriodDays': withdrawalPeriodDays,
    'images': images,
    'stockBadge': stockBadge.name,
    'availableQuantity': availableQuantity,
    'maxOrderQuantity': maxOrderQuantity,
  };
}
