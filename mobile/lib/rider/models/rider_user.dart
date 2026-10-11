/// Models for Delivery Partner (Rider) Authentication and Onboarding

class RiderUser {
  final String id;
  final String fullName;
  final String phone;
  final String role;

  const RiderUser({
    required this.id,
    required this.fullName,
    required this.phone,
    required this.role,
  });

  factory RiderUser.fromJson(Map<String, dynamic> json) {
    return RiderUser(
      id: json['id'] as String,
      fullName: json['fullName'] as String,
      phone: json['phone'] as String,
      role: json['role'] as String? ?? 'delivery_partner',
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'fullName': fullName,
    'phone': phone,
    'role': role,
  };
}

class RiderProfileModel {
  final String id;
  final String userId;
  final String vehicleType;
  final String vehicleRegistrationNumber;
  final String drivingLicenceNumber;
  final bool isAvailable;
  final int currentCashInHand;
  final bool isApproved;
  final String approvalStatus; // submitted, needs_changes, approved, suspended
  final String? onboardingApplicationId;
  final String? reviewerComments;

  const RiderProfileModel({
    required this.id,
    required this.userId,
    required this.vehicleType,
    required this.vehicleRegistrationNumber,
    required this.drivingLicenceNumber,
    required this.isAvailable,
    required this.currentCashInHand,
    required this.isApproved,
    required this.approvalStatus,
    this.onboardingApplicationId,
    this.reviewerComments,
  });

  factory RiderProfileModel.fromJson(Map<String, dynamic> json) {
    return RiderProfileModel(
      id: json['id'] as String,
      userId: json['userId'] as String,
      vehicleType: json['vehicleType'] as String? ?? 'Motorcycle',
      vehicleRegistrationNumber: json['vehicleRegistrationNumber'] as String? ?? '',
      drivingLicenceNumber: json['drivingLicenceNumber'] as String? ?? '',
      isAvailable: json['isAvailable'] as bool? ?? false,
      currentCashInHand: (json['currentCashInHand'] as num?)?.toInt() ?? 0,
      isApproved: json['isApproved'] as bool? ?? false,
      approvalStatus: json['approvalStatus'] as String? ?? 'submitted',
      onboardingApplicationId: json['onboardingApplicationId'] as String?,
      reviewerComments: json['reviewerComments'] as String?,
    );
  }
}

class RiderOnboardingApplicationModel {
  final String id;
  final String userId;
  final String fullName;
  final String phone;
  final String govIdType;
  final String govIdNumber;
  final String drivingLicenceNumber;
  final String drivingLicenceExpiryDate;
  final String vehicleType;
  final String vehicleRegistrationNumber;
  final String emergencyContactName;
  final String emergencyContactPhone;
  final String emergencyContactRelation;
  final String? bankAccountMasked;
  final String? bankIfsc;
  final String? upiIdMasked;
  final String status;
  final String? reviewerComments;
  final String createdAt;

  const RiderOnboardingApplicationModel({
    required this.id,
    required this.userId,
    required this.fullName,
    required this.phone,
    required this.govIdType,
    required this.govIdNumber,
    required this.drivingLicenceNumber,
    required this.drivingLicenceExpiryDate,
    required this.vehicleType,
    required this.vehicleRegistrationNumber,
    required this.emergencyContactName,
    required this.emergencyContactPhone,
    required this.emergencyContactRelation,
    this.bankAccountMasked,
    this.bankIfsc,
    this.upiIdMasked,
    required this.status,
    this.reviewerComments,
    required this.createdAt,
  });

  factory RiderOnboardingApplicationModel.fromJson(Map<String, dynamic> json) {
    return RiderOnboardingApplicationModel(
      id: json['id'] as String,
      userId: json['userId'] as String,
      fullName: json['fullName'] as String,
      phone: json['phone'] as String,
      govIdType: json['govIdType'] as String? ?? 'aadhaar',
      govIdNumber: json['govIdNumber'] as String? ?? '',
      drivingLicenceNumber: json['drivingLicenceNumber'] as String? ?? '',
      drivingLicenceExpiryDate: json['drivingLicenceExpiryDate'] as String? ?? '',
      vehicleType: json['vehicleType'] as String? ?? 'motorcycle',
      vehicleRegistrationNumber: json['vehicleRegistrationNumber'] as String? ?? '',
      emergencyContactName: json['emergencyContactName'] as String? ?? '',
      emergencyContactPhone: json['emergencyContactPhone'] as String? ?? '',
      emergencyContactRelation: json['emergencyContactRelation'] as String? ?? '',
      bankAccountMasked: json['bankAccountMasked'] as String?,
      bankIfsc: json['bankIfsc'] as String?,
      upiIdMasked: json['upiIdMasked'] as String?,
      status: json['status'] as String? ?? 'submitted',
      reviewerComments: json['reviewerComments'] as String?,
      createdAt: json['createdAt'] as String? ?? '',
    );
  }
}

class RiderDeviceModel {
  final String id;
  final String deviceFingerprint;
  final String deviceModel;
  final String osVersion;
  final String appVersion;
  final bool isActive;
  final String lastActiveAt;

  const RiderDeviceModel({
    required this.id,
    required this.deviceFingerprint,
    required this.deviceModel,
    required this.osVersion,
    required this.appVersion,
    required this.isActive,
    required this.lastActiveAt,
  });

  factory RiderDeviceModel.fromJson(Map<String, dynamic> json) {
    return RiderDeviceModel(
      id: json['id'] as String,
      deviceFingerprint: json['deviceFingerprint'] as String,
      deviceModel: json['deviceModel'] as String,
      osVersion: json['osVersion'] as String,
      appVersion: json['appVersion'] as String,
      isActive: json['isActive'] as bool? ?? true,
      lastActiveAt: json['lastActiveAt'] as String? ?? '',
    );
  }
}
