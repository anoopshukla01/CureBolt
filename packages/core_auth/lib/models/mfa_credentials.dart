class MfaEnrollmentResponse {
  final String secret;
  final String otpauthUrl;
  final List<String> backupCodes;

  const MfaEnrollmentResponse({
    required this.secret,
    required this.otpauthUrl,
    required this.backupCodes,
  });

  factory MfaEnrollmentResponse.fromJson(Map<String, dynamic> json) {
    return MfaEnrollmentResponse(
      secret: json['secret'] as String? ?? '',
      otpauthUrl: json['otpauthUrl'] as String? ?? '',
      backupCodes: (json['backupCodes'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
    );
  }
}

class MfaVerifyRequest {
  final String code; // 6-digit TOTP code or 8-digit backup code
  final String? secret;

  const MfaVerifyRequest({
    required this.code,
    this.secret,
  });

  Map<String, dynamic> toJson() => {
    'code': code,
    if (secret != null) 'secret': secret,
  };
}
