class PharmacyCapabilities {
  final bool canManageProfileAndStaff;
  final bool canViewAndDecidePrescriptions;
  final bool canAcceptOrders;
  final bool canPickAndPack;
  final bool canManageInventoryAndPrices;
  final bool canViewReportsAndSettlements;

  const PharmacyCapabilities({
    required this.canManageProfileAndStaff,
    required this.canViewAndDecidePrescriptions,
    required this.canAcceptOrders,
    required this.canPickAndPack,
    required this.canManageInventoryAndPrices,
    required this.canViewReportsAndSettlements,
  });

  factory PharmacyCapabilities.fromRole(String role, {bool isOwnerAlsoPharmacist = false}) {
    switch (role.toLowerCase()) {
      case 'pharmacy_owner':
      case 'owner':
        return PharmacyCapabilities(
          canManageProfileAndStaff: true,
          canViewAndDecidePrescriptions: isOwnerAlsoPharmacist,
          canAcceptOrders: true,
          canPickAndPack: true,
          canManageInventoryAndPrices: true,
          canViewReportsAndSettlements: true,
        );
      case 'pharmacist':
        return const PharmacyCapabilities(
          canManageProfileAndStaff: false,
          canViewAndDecidePrescriptions: true,
          canAcceptOrders: true,
          canPickAndPack: true,
          canManageInventoryAndPrices: true,
          canViewReportsAndSettlements: false,
        );
      case 'pharmacy_staff':
      case 'staff':
      default:
        return const PharmacyCapabilities(
          canManageProfileAndStaff: false,
          canViewAndDecidePrescriptions: false,
          canAcceptOrders: false, // only non-Rx if explicitly enabled
          canPickAndPack: true,
          canManageInventoryAndPrices: false, // count adjustments only
          canViewReportsAndSettlements: false,
        );
    }
  }

  factory PharmacyCapabilities.fromJson(Map<String, dynamic> json) {
    return PharmacyCapabilities(
      canManageProfileAndStaff: json['canManageStaff'] ?? json['canManageProfileAndStaff'] ?? false,
      canViewAndDecidePrescriptions: json['canReviewPrescriptions'] ?? json['canViewAndDecidePrescriptions'] ?? false,
      canAcceptOrders: json['canAcceptOrders'] ?? true,
      canPickAndPack: json['canPickAndPack'] ?? true,
      canManageInventoryAndPrices: json['canManageInventoryAndPrices'] ?? false,
      canViewReportsAndSettlements: json['canViewReports'] ?? json['canViewReportsAndSettlements'] ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
    'canManageProfileAndStaff': canManageProfileAndStaff,
    'canViewAndDecidePrescriptions': canViewAndDecidePrescriptions,
    'canAcceptOrders': canAcceptOrders,
    'canPickAndPack': canPickAndPack,
    'canManageInventoryAndPrices': canManageInventoryAndPrices,
    'canViewReportsAndSettlements': canViewReportsAndSettlements,
  };
}

class PharmacyUser {
  final String id;
  final String phoneOrEmail;
  final String name;
  final String role; // 'pharmacy_owner', 'pharmacist', 'pharmacy_staff'
  final String? pharmacyId;
  final String? pharmacyName;
  final bool isMfaEnrolled;
  final String? registrationNumber; // For Pharmacist: UP-PH-XXXX
  final PharmacyCapabilities capabilities;

  const PharmacyUser({
    required this.id,
    required this.phoneOrEmail,
    required this.name,
    required this.role,
    this.pharmacyId,
    this.pharmacyName,
    required this.isMfaEnrolled,
    this.registrationNumber,
    required this.capabilities,
  });

  bool get isOwner => role == 'pharmacy_owner' || role == 'owner';
  bool get isPharmacist => role == 'pharmacist';
  bool get isStaff => role == 'pharmacy_staff' || role == 'staff';

  factory PharmacyUser.fromJson(Map<String, dynamic> json) {
    final role = json['role'] as String? ?? 'pharmacy_staff';
    return PharmacyUser(
      id: json['id'] as String? ?? json['userId'] as String? ?? '',
      phoneOrEmail: json['phoneOrEmail'] as String? ?? json['phone'] as String? ?? '',
      name: json['name'] as String? ?? 'Pharmacy Team Member',
      role: role,
      pharmacyId: json['pharmacyId'] as String?,
      pharmacyName: json['pharmacyName'] as String?,
      isMfaEnrolled: json['isMfaEnrolled'] as bool? ?? false,
      registrationNumber: json['registrationNumber'] as String?,
      capabilities: json['capabilities'] != null
          ? PharmacyCapabilities.fromJson(json['capabilities'] as Map<String, dynamic>)
          : PharmacyCapabilities.fromRole(role),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'phoneOrEmail': phoneOrEmail,
    'name': name,
    'role': role,
    'pharmacyId': pharmacyId,
    'pharmacyName': pharmacyName,
    'isMfaEnrolled': isMfaEnrolled,
    'registrationNumber': registrationNumber,
    'capabilities': capabilities.toJson(),
  };
}
