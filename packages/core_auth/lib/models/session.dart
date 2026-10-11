class UserSessionModel {
  final String id;
  final String deviceInfo;
  final String ipAddress;
  final DateTime lastActiveAt;
  final DateTime expiresAt;
  final bool isCurrent;

  const UserSessionModel({
    required this.id,
    required this.deviceInfo,
    required this.ipAddress,
    required this.lastActiveAt,
    required this.expiresAt,
    required this.isCurrent,
  });

  factory UserSessionModel.fromJson(Map<String, dynamic> json, {String? currentSessionId}) {
    final id = json['id'] as String? ?? '';
    return UserSessionModel(
      id: id,
      deviceInfo: json['deviceInfo'] as String? ?? 'Counter Tablet / Phone',
      ipAddress: json['ipAddress'] as String? ?? '127.0.0.1',
      lastActiveAt: json['lastActiveAt'] != null
          ? DateTime.tryParse(json['lastActiveAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
      expiresAt: json['expiresAt'] != null
          ? DateTime.tryParse(json['expiresAt'].toString()) ?? DateTime.now().add(const Duration(days: 7))
          : DateTime.now().add(const Duration(days: 7)),
      isCurrent: id == currentSessionId || (json['isCurrent'] as bool? ?? false),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'deviceInfo': deviceInfo,
    'ipAddress': ipAddress,
    'lastActiveAt': lastActiveAt.toIso8601String(),
    'expiresAt': expiresAt.toIso8601String(),
    'isCurrent': isCurrent,
  };
}
