class User {
  final String id;
  final String phone;
  final String? email;
  final String fullName;
  final String role;
  final bool isActive;
  final String? dateOfBirth;
  final String? termsVersion;
  final String? termsAcceptedAt;

  const User({
    required this.id,
    required this.phone,
    this.email,
    required this.fullName,
    required this.role,
    this.isActive = true,
    this.dateOfBirth,
    this.termsVersion,
    this.termsAcceptedAt,
  });

  bool get isProfileComplete =>
      fullName.isNotEmpty &&
      fullName != 'Medcure Customer' &&
      dateOfBirth != null &&
      dateOfBirth!.isNotEmpty;

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String? ?? '',
      phone: json['phone'] as String? ?? '',
      email: json['email'] as String?,
      fullName: json['fullName'] as String? ?? json['full_name'] as String? ?? '',
      role: json['role'] as String? ?? 'customer',
      isActive: json['isActive'] as bool? ?? json['is_active'] as bool? ?? true,
      dateOfBirth: json['dateOfBirth'] as String? ?? json['date_of_birth'] as String?,
      termsVersion: json['termsVersion'] as String? ?? json['terms_version'] as String?,
      termsAcceptedAt: json['termsAcceptedAt'] as String? ?? json['terms_accepted_at'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'phone': phone,
      'email': email,
      'fullName': fullName,
      'role': role,
      'isActive': isActive,
      'dateOfBirth': dateOfBirth,
      'termsVersion': termsVersion,
      'termsAcceptedAt': termsAcceptedAt,
    };
  }

  User copyWith({
    String? id,
    String? phone,
    String? email,
    String? fullName,
    String? role,
    bool? isActive,
    String? dateOfBirth,
    String? termsVersion,
    String? termsAcceptedAt,
  }) {
    return User(
      id: id ?? this.id,
      phone: phone ?? this.phone,
      email: email ?? this.email,
      fullName: fullName ?? this.fullName,
      role: role ?? this.role,
      isActive: isActive ?? this.isActive,
      dateOfBirth: dateOfBirth ?? this.dateOfBirth,
      termsVersion: termsVersion ?? this.termsVersion,
      termsAcceptedAt: termsAcceptedAt ?? this.termsAcceptedAt,
    );
  }
}
