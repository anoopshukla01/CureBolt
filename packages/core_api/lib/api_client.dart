import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

class ApiException implements Exception {
  final int statusCode;
  final String message;
  final dynamic details;

  ApiException(this.statusCode, this.message, [this.details]);

  @override
  String toString() => 'ApiException($statusCode): $message';
}

class ApiClient {
  final String? _instanceBaseUrl;
  final String? _instanceAuthToken;
  final String? _instanceUserId;
  final String? _instanceUserRole;
  final String? _instanceAppId;

  // Backwards compatible static fields
  static String? customBaseUrl;
  static String? authToken;
  static String? currentUserId;
  static String? userRole;

  ApiClient({
    String? baseUrl,
    String? authToken,
    String? userId,
    String? userRole,
    String? appId,
  })  : _instanceBaseUrl = baseUrl,
        _instanceAuthToken = authToken,
        _instanceUserId = userId,
        _instanceUserRole = userRole,
        _instanceAppId = appId;

  static String get defaultBaseUrl {
    if (customBaseUrl != null && customBaseUrl!.isNotEmpty) {
      return customBaseUrl!;
    }
    if (kIsWeb) {
      return 'http://localhost:3000/api/v1';
    }
    if (defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:3000/api/v1';
    }
    return 'http://localhost:3000/api/v1';
  }

  String get baseUrl => _instanceBaseUrl ?? defaultBaseUrl;

  Map<String, String> _buildHeaders({Map<String, String>? extraHeaders}) {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Client-Platform': defaultTargetPlatform.name,
      'X-App-Id': _instanceAppId ?? 'com.medcure.customer',
    };

    final token = _instanceAuthToken ?? authToken;
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }

    final uid = _instanceUserId ?? currentUserId;
    if (uid != null) {
      headers['X-User-Id'] = uid;
    }

    final role = _instanceUserRole ?? userRole;
    if (role != null) {
      headers['X-User-Role'] = role;
    }

    if (extraHeaders != null) {
      headers.addAll(extraHeaders);
    }
    return headers;
  }

  Future<dynamic> get(String path, {Map<String, String>? headers}) async {
    final uri = Uri.parse('$baseUrl$path');
    final response = await http.get(uri, headers: _buildHeaders(extraHeaders: headers));
    return _handleResponse(response);
  }

  Future<dynamic> post(String path, {dynamic body, Map<String, String>? headers}) async {
    final uri = Uri.parse('$baseUrl$path');
    final response = await http.post(
      uri,
      headers: _buildHeaders(extraHeaders: headers),
      body: body != null ? jsonEncode(body) : null,
    );
    return _handleResponse(response);
  }

  Future<dynamic> put(String path, {dynamic body, Map<String, String>? headers}) async {
    final uri = Uri.parse('$baseUrl$path');
    final response = await http.put(
      uri,
      headers: _buildHeaders(extraHeaders: headers),
      body: body != null ? jsonEncode(body) : null,
    );
    return _handleResponse(response);
  }

  Future<dynamic> patch(String path, {dynamic body, Map<String, String>? headers}) async {
    final uri = Uri.parse('$baseUrl$path');
    final response = await http.patch(
      uri,
      headers: _buildHeaders(extraHeaders: headers),
      body: body != null ? jsonEncode(body) : null,
    );
    return _handleResponse(response);
  }

  Future<dynamic> delete(String path, {Map<String, String>? headers}) async {
    final uri = Uri.parse('$baseUrl$path');
    final response = await http.delete(uri, headers: _buildHeaders(extraHeaders: headers));
    return _handleResponse(response);
  }

  static dynamic _handleResponse(http.Response response) {
    dynamic decoded;
    try {
      decoded = response.body.isNotEmpty ? jsonDecode(response.body) : {};
    } catch (_) {
      decoded = {'message': response.body};
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return decoded;
    }

    String errorMsg = 'An error occurred';
    if (decoded is Map<String, dynamic>) {
      errorMsg = decoded['error'] ?? decoded['message'] ?? 'Error ${response.statusCode}';
    }
    throw ApiException(response.statusCode, errorMsg, decoded);
  }
}
