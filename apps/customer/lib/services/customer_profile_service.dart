import 'dart:convert';
import 'package:http/http.dart' as http;

class CustomerProfile {
  final String id;
  final String phone;
  final String fullName;
  final String? dateOfBirth;
  final String? termsVersion;
  final String? termsAcceptedAt;
  final bool isMinorBlocked;

  const CustomerProfile({
    required this.id,
    required this.phone,
    required this.fullName,
    this.dateOfBirth,
    this.termsVersion,
    this.termsAcceptedAt,
    this.isMinorBlocked = false,
  });

  bool get isProfileComplete =>
      fullName.isNotEmpty &&
      fullName != 'Medcure Customer' &&
      dateOfBirth != null &&
      dateOfBirth!.isNotEmpty &&
      termsAcceptedAt != null;

  factory CustomerProfile.fromJson(Map<String, dynamic> json) {
    return CustomerProfile(
      id: json['id'] as String? ?? '',
      phone: json['phone'] as String? ?? '',
      fullName: json['fullName'] as String? ?? '',
      dateOfBirth: json['dateOfBirth'] as String?,
      termsVersion: json['termsVersion'] as String?,
      termsAcceptedAt: json['termsAcceptedAt'] as String?,
      isMinorBlocked: json['isMinorBlocked'] as bool? ?? false,
    );
  }
}

class CustomerProfileService {
  final String baseUrl;
  final http.Client _client;

  CustomerProfileService({
    required this.baseUrl,
    http.Client? client,
  }) : _client = client ?? http.Client();

  static int calculateAge(DateTime dob, [DateTime? referenceDate]) {
    final today = referenceDate ?? DateTime.now();
    int age = today.year - dob.year;
    if (today.month < dob.month || (today.month == dob.month && today.day < dob.day)) {
      age--;
    }
    return age;
  }

  static bool isAdult(DateTime dob, [DateTime? referenceDate]) {
    return calculateAge(dob, referenceDate) >= 18;
  }

  static String? validateFullName(String? value) {
    if (value == null || value.trim().length < 2) {
      return 'Full name must be at least 2 characters';
    }
    if (value.trim().length > 60) {
      return 'Full name cannot exceed 60 characters';
    }
    final regex = RegExp(r"^[a-zA-Z\s.'-]+$");
    if (!regex.hasMatch(value.trim())) {
      return 'Name can only contain letters, spaces, full stops, apostrophes and hyphens';
    }
    return null;
  }

  static String? validateDateOfBirth(DateTime? dob) {
    if (dob == null) {
      return 'Date of birth is required';
    }
    final now = DateTime.now();
    if (dob.isAfter(now)) {
      return 'Date of birth cannot be in the future';
    }
    final age = calculateAge(dob, now);
    if (age > 120) {
      return 'Invalid date: exceeds 120 years';
    }
    if (age < 18) {
      return 'You must be at least 18 years old to use Medcure';
    }
    return null;
  }

  Future<CustomerProfile?> fetchProfile({required String token, String? userId}) async {
    try {
      final headers = <String, String>{
        'Authorization': 'Bearer $token',
        'Accept': 'application/json',
      };
      if (userId != null) headers['x-user-id'] = userId;

      final res = await _client.get(
        Uri.parse('$baseUrl/api/v1/me'),
        headers: headers,
      );

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body) as Map<String, dynamic>;
        if (data.containsKey('user')) {
          return CustomerProfile.fromJson(data['user'] as Map<String, dynamic>);
        }
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  Future<Map<String, dynamic>> updateProfile({
    required String token,
    required String fullName,
    required DateTime dateOfBirth,
    required bool termsAccepted,
    String? userId,
  }) async {
    try {
      final headers = <String, String>{
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      };
      if (userId != null) headers['x-user-id'] = userId;

      final formattedDob =
          '${dateOfBirth.year.toString().padLeft(4, '0')}-${dateOfBirth.month.toString().padLeft(2, '0')}-${dateOfBirth.day.toString().padLeft(2, '0')}';

      final res = await _client.put(
        Uri.parse('$baseUrl/api/v1/me/profile'),
        headers: headers,
        body: jsonEncode({
          'fullName': fullName.trim(),
          'dateOfBirth': formattedDob,
          'termsAccepted': termsAccepted,
          'termsVersion': 'v1.0.0',
        }),
      );

      final data = jsonDecode(res.body) as Map<String, dynamic>;
      if (res.statusCode == 200) {
        return {'success': true, 'user': data['user']};
      }
      return {
        'success': false,
        'status': res.statusCode,
        'error': data['error'] ?? 'Failed to update profile.',
      };
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }
}
