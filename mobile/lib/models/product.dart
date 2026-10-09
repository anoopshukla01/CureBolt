class Product {
  final String id;
  final String name;
  final String brand;
  final String? genericSaltName;
  final String categoryDomain; // 'human' or 'veterinary'
  final String formulation;
  final String? strength;
  final String packSize;
  final String manufacturer;
  final bool requiresPrescription;
  final String scheduleType;
  final double sellingPrice;
  final double mrp;
  final int availableQuantity;
  final bool inStock;
  final List<SpeciesRestriction>? speciesRestrictions;

  Product({
    required this.id,
    required this.name,
    required this.brand,
    this.genericSaltName,
    required this.categoryDomain,
    required this.formulation,
    this.strength,
    required this.packSize,
    required this.manufacturer,
    required this.requiresPrescription,
    required this.scheduleType,
    required this.sellingPrice,
    required this.mrp,
    required this.availableQuantity,
    required this.inStock,
    this.speciesRestrictions,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      brand: json['brand'] ?? '',
      genericSaltName: json['generic_salt_name'],
      categoryDomain: json['category_domain'] ?? 'human',
      formulation: json['formulation'] ?? '',
      strength: json['strength'],
      packSize: json['pack_size'] ?? '',
      manufacturer: json['manufacturer'] ?? '',
      requiresPrescription: json['requires_prescription'] ?? false,
      scheduleType: json['schedule_type'] ?? 'OTC',
      sellingPrice: (json['selling_price'] as num?)?.toDouble() ?? 0.0,
      mrp: (json['mrp'] as num?)?.toDouble() ?? 0.0,
      availableQuantity: json['available_quantity'] ?? 0,
      inStock: json['in_stock'] ?? false,
      speciesRestrictions: json['species_restrictions'] != null
          ? (json['species_restrictions'] as List)
              .map((s) => SpeciesRestriction.fromJson(s))
              .toList()
          : null,
    );
  }
}

class SpeciesRestriction {
  final String speciesName;
  final int withdrawalPeriodDays;
  final String precautions;

  SpeciesRestriction({
    required this.speciesName,
    required this.withdrawalPeriodDays,
    required this.precautions,
  });

  factory SpeciesRestriction.fromJson(Map<String, dynamic> json) {
    return SpeciesRestriction(
      speciesName: json['speciesName'] ?? '',
      withdrawalPeriodDays: json['withdrawalPeriodDays'] ?? 0,
      precautions: json['precautions'] ?? '',
    );
  }
}
