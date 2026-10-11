class PharmacyOnboardingModel {
  final String id;
  final String? pharmacyId;
  final String ownerUserId;
  final String businessName;
  final String legalEntityName;
  final String? gstin;
  final String addressLine1;
  final String city;
  final String pincode;
  final double latitude;
  final double longitude;
  final Map<String, dynamic> operatingHours;
  final int deliveryRadiusM;
  final String authorisedRepresentativeName;
  final String authorisedRepresentativePhone;
  final String licenceForm20;
  final String? licenceForm21;
  final DateTime licenceExpiryDate;
  final String licenceDocPath;
  final String premisesDocPath;
  final String idDocPath;
  final String pharmacistName;
  final String pharmacistRegNumber;
  final String pharmacistCouncil;
  final String pharmacistRegDocPath;
  final String? bankAccountMasked;
  final String? bankIfsc;
  final String status; // 'draft', 'submitted', 'needs_changes', 'verified', 'suspended'
  final String? reviewerComments;
  final DateTime? reviewedAt;

  PharmacyOnboardingModel({
    required this.id,
    this.pharmacyId,
    required this.ownerUserId,
    required this.businessName,
    required this.legalEntityName,
    this.gstin,
    required this.addressLine1,
    this.city = 'Gorakhpur',
    required this.pincode,
    required this.latitude,
    required this.longitude,
    required this.operatingHours,
    this.deliveryRadiusM = 5000,
    required this.authorisedRepresentativeName,
    required this.authorisedRepresentativePhone,
    required this.licenceForm20,
    this.licenceForm21,
    required this.licenceExpiryDate,
    required this.licenceDocPath,
    required this.premisesDocPath,
    required this.idDocPath,
    required this.pharmacistName,
    required this.pharmacistRegNumber,
    this.pharmacistCouncil = 'Uttar Pradesh Pharmacy Council',
    required this.pharmacistRegDocPath,
    this.bankAccountMasked,
    this.bankIfsc,
    this.status = 'draft',
    this.reviewerComments,
    this.reviewedAt,
  });

  bool get isVerified => status == 'verified';
  bool get isSuspended => status == 'suspended';
  bool get isSubmitted => status == 'submitted';
  bool get isDraft => status == 'draft';
  bool get needsChanges => status == 'needs_changes';

  int get daysUntilExpiry {
    final now = DateTime.now();
    return licenceExpiryDate.difference(now).inDays;
  }

  bool get isLicenceExpired => daysUntilExpiry <= 0;

  factory PharmacyOnboardingModel.fromJson(Map<String, dynamic> json) {
    return PharmacyOnboardingModel(
      id: json['id'] as String? ?? '',
      pharmacyId: json['pharmacyId'] as String?,
      ownerUserId: json['ownerUserId'] as String? ?? '',
      businessName: json['businessName'] as String? ?? '',
      legalEntityName: json['legalEntityName'] as String? ?? '',
      gstin: json['gstin'] as String?,
      addressLine1: json['addressLine1'] as String? ?? '',
      city: json['city'] as String? ?? 'Gorakhpur',
      pincode: json['pincode'] as String? ?? '273001',
      latitude: (json['latitude'] as num?)?.toDouble() ?? 26.7606,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 83.3732,
      operatingHours: json['operatingHours'] is Map
          ? Map<String, dynamic>.from(json['operatingHours'] as Map)
          : {'open': '08:00', 'close': '22:00'},
      deliveryRadiusM: json['deliveryRadiusM'] as int? ?? 5000,
      authorisedRepresentativeName: json['authorisedRepresentativeName'] as String? ?? '',
      authorisedRepresentativePhone: json['authorisedRepresentativePhone'] as String? ?? '',
      licenceForm20: json['licenceForm20'] as String? ?? '',
      licenceForm21: json['licenceForm21'] as String?,
      licenceExpiryDate: json['licenceExpiryDate'] != null
          ? DateTime.tryParse(json['licenceExpiryDate'].toString()) ?? DateTime.now().add(const Duration(days: 365))
          : DateTime.now().add(const Duration(days: 365)),
      licenceDocPath: json['licenceDocPath'] as String? ?? '',
      premisesDocPath: json['premisesDocPath'] as String? ?? '',
      idDocPath: json['idDocPath'] as String? ?? '',
      pharmacistName: json['pharmacistName'] as String? ?? '',
      pharmacistRegNumber: json['pharmacistRegNumber'] as String? ?? '',
      pharmacistCouncil: json['pharmacistCouncil'] as String? ?? 'Uttar Pradesh Pharmacy Council',
      pharmacistRegDocPath: json['pharmacistRegDocPath'] as String? ?? '',
      bankAccountMasked: json['bankAccountMasked'] as String?,
      bankIfsc: json['bankIfsc'] as String?,
      status: json['status'] as String? ?? 'draft',
      reviewerComments: json['reviewerComments'] as String?,
      reviewedAt: json['reviewedAt'] != null ? DateTime.tryParse(json['reviewedAt'].toString()) : null,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    if (pharmacyId != null) 'pharmacyId': pharmacyId,
    'ownerUserId': ownerUserId,
    'businessName': businessName,
    'legalEntityName': legalEntityName,
    'gstin': gstin,
    'addressLine1': addressLine1,
    'city': city,
    'pincode': pincode,
    'latitude': latitude,
    'longitude': longitude,
    'operatingHours': operatingHours,
    'deliveryRadiusM': deliveryRadiusM,
    'authorisedRepresentativeName': authorisedRepresentativeName,
    'authorisedRepresentativePhone': authorisedRepresentativePhone,
    'licenceForm20': licenceForm20,
    'licenceForm21': licenceForm21,
    'licenceExpiryDate': licenceExpiryDate.toIso8601String().split('T')[0],
    'licenceDocPath': licenceDocPath,
    'premisesDocPath': premisesDocPath,
    'idDocPath': idDocPath,
    'pharmacistName': pharmacistName,
    'pharmacistRegNumber': pharmacistRegNumber,
    'pharmacistCouncil': pharmacistCouncil,
    'pharmacistRegDocPath': pharmacistRegDocPath,
    'bankAccountMasked': bankAccountMasked,
    'bankIfsc': bankIfsc,
    'status': status,
  };
}
