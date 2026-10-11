import 'dart:convert';
import 'package:http/http.dart' as http;

class OtpRequestResult {
  final bool success;
  final String? message;
  final String? error;
  final int cooldownSeconds;

  const OtpRequestResult({
    required this.success,
    this.message,
    this.error,
    this.cooldownSeconds = 30,
  });
}

class OtpVerifyResult {
  final bool success;
  final String? token;
  final String? userId;
  final String? role;
  final bool isNewUser;
  final String? error;

  const OtpVerifyResult({
    required this.success,
    this.token,
    this.userId,
    this.role,
    this.isNewUser = false,
    this.error,
  });
}

class AppSessionResult {
  final bool sessionValid;
  final String? userId;
  final String? role;
  final List<String> allowedScopes;
  final String? error;
  final String? message;

  const AppSessionResult({
    required this.sessionValid,
    this.userId,
    this.role,
    this.allowedScopes = const [],
    this.error,
    this.message,
  });
}

abstract class AuthApiClient {
  Future<OtpRequestResult> requestOtp({required String phone});
  Future<OtpVerifyResult> verifyOtp({required String phone, required String otp});
  Future<AppSessionResult> verifyAppSession({
    required String appId,
    required String appVersion,
    required String token,
    String? userId,
  });
}

class HttpAuthApiClient implements AuthApiClient {
  final String baseUrl;
  final http.Client _client;

  HttpAuthApiClient({
    required this.baseUrl,
    http.Client? client,
  }) : _client = client ?? http.Client();

  @override
  Future<OtpRequestResult> requestOtp({required String phone}) async {
    try {
      final res = await _client.post(
        Uri.parse('$baseUrl/api/v1/auth/request-otp'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'phone': phone}),
      );
      final data = jsonDecode(res.body) as Map<String, dynamic>;
      if (res.statusCode >= 200 && res.statusCode < 300) {
        return OtpRequestResult(
          success: true,
          message: data['message'] as String?,
          cooldownSeconds: data['cooldown_seconds'] as int? ?? 30,
        );
      }
      return OtpRequestResult(
        success: false,
        error: data['error']?.toString() ?? 'Failed to send OTP.',
      );
    } catch (e) {
      return OtpRequestResult(success: false, error: e.toString());
    }
  }

  @override
  Future<OtpVerifyResult> verifyOtp({required String phone, required String otp}) async {
    try {
      final res = await _client.post(
        Uri.parse('$baseUrl/api/v1/auth/verify-otp'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'phone': phone, 'otp': otp}),
      );
      final data = jsonDecode(res.body) as Map<String, dynamic>;
      if (res.statusCode >= 200 && res.statusCode < 300) {
        final user = data['user'] as Map<String, dynamic>?;
        return OtpVerifyResult(
          success: true,
          token: data['token'] as String?,
          userId: user?['id'] as String?,
          role: user?['role'] as String?,
          isNewUser: data['is_new_user'] as bool? ?? false,
        );
      }
      return OtpVerifyResult(
        success: false,
        error: data['error']?.toString() ?? 'Invalid verification code.',
      );
    } catch (e) {
      return OtpVerifyResult(success: false, error: e.toString());
    }
  }

  @override
  Future<AppSessionResult> verifyAppSession({
    required String appId,
    required String appVersion,
    required String token,
    String? userId,
  }) async {
    try {
      final headers = <String, String>{
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      };
      if (userId != null) {
        headers['x-user-id'] = userId;
      }

      final res = await _client.post(
        Uri.parse('$baseUrl/api/v1/auth/app-session'),
        headers: headers,
        body: jsonEncode({
          'appId': appId,
          'appVersion': appVersion,
          'platform': 'android',
        }),
      );
      final data = jsonDecode(res.body) as Map<String, dynamic>;
      if (res.statusCode == 200) {
        final user = data['user'] as Map<String, dynamic>?;
        final scopes = (data['allowedScopes'] as List<dynamic>?)?.map((s) => s.toString()).toList() ?? [];
        return AppSessionResult(
          sessionValid: true,
          userId: user?['id'] as String?,
          role: user?['role'] as String?,
          allowedScopes: scopes,
        );
      }
      return AppSessionResult(
        sessionValid: false,
        error: data['error']?.toString() ?? "This account can't use this app",
        message: data['message']?.toString(),
      );
    } catch (e) {
      return AppSessionResult(sessionValid: false, error: e.toString());
    }
  }
}
