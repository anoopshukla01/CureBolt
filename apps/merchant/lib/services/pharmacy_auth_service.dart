import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:core_api/core_api.dart';
import 'package:core_auth/core_auth.dart';

class PharmacyAuthService extends ChangeNotifier {
  static const String _keyToken = 'medcure_pharmacy_token';
  static const String _keyUser = 'medcure_pharmacy_user_json';

  PharmacyUser? _currentUser;
  String? _authToken;
  bool _isLoading = false;
  String? _errorMessage;
  List<UserSessionModel> _activeSessions = [];

  PharmacyUser? get currentUser => _currentUser;
  String? get authToken => _authToken;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _authToken != null && _currentUser != null;
  List<UserSessionModel> get activeSessions => _activeSessions;

  Future<void> initialize() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _authToken = prefs.getString(_keyToken);
      final userJson = prefs.getString(_keyUser);

      if (_authToken != null && userJson != null) {
        _currentUser = PharmacyUser.fromJson(jsonDecode(userJson) as Map<String, dynamic>);
        ApiClient.authToken = _authToken;
        ApiClient.currentUserId = _currentUser?.id;
        ApiClient.userRole = _currentUser?.role;
      }
      notifyListeners();
    } catch (e) {
      debugPrint('Error restoring pharmacy session: $e');
    }
  }

  /// Sign in with phone or email, requested role, and optional TOTP MFA
  Future<Map<String, dynamic>> login({
    required String phoneOrEmail,
    required String role,
    String? otpOrPassword,
    String? totpCode,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await ApiClient.post('/pharmacy/auth/login', body: {
        'phoneOrEmail': phoneOrEmail,
        'role': role,
        if (otpOrPassword != null) 'otpOrPassword': otpOrPassword,
        if (totpCode != null) 'totpCode': totpCode,
        'deviceInfo': defaultTargetPlatform.name == 'android'
            ? 'Pharmacy Counter Android Terminal'
            : 'Counter POS Device',
      });

      if (response['requiresMfa'] == true) {
        _isLoading = false;
        notifyListeners();
        return {'requiresMfa': true, 'userId': response['userId']};
      }

      final token = response['token'] as String;
      final userData = response['user'] as Map<String, dynamic>? ?? response;

      _authToken = token;
      _currentUser = PharmacyUser.fromJson(userData);

      ApiClient.authToken = _authToken;
      ApiClient.currentUserId = _currentUser?.id;
      ApiClient.userRole = _currentUser?.role;

      // Persist session
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_keyToken, token);
      await prefs.setString(_keyUser, jsonEncode(_currentUser!.toJson()));

      _isLoading = false;
      notifyListeners();
      return {'success': true, 'user': _currentUser};
    } on ApiException catch (e) {
      _isLoading = false;
      _errorMessage = e.message;
      notifyListeners();
      rethrow;
    } catch (e) {
      _isLoading = false;
      _errorMessage = e.toString();
      notifyListeners();
      rethrow;
    }
  }

  /// Logout current session
  Future<void> logout() async {
    try {
      if (_authToken != null) {
        await ApiClient.post('/pharmacy/auth/logout');
      }
    } catch (_) {
      // Best effort network call
    } finally {
      _authToken = null;
      _currentUser = null;
      ApiClient.authToken = null;
      ApiClient.currentUserId = null;
      ApiClient.userRole = null;

      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_keyToken);
      await prefs.remove(_keyUser);
      notifyListeners();
    }
  }

  /// Revoke all active sessions ("Sign out everywhere")
  Future<void> signOutEverywhere() async {
    _isLoading = true;
    notifyListeners();
    try {
      await ApiClient.post('/pharmacy/auth/revoke-all-sessions');
      await logout();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Load all devices bound to this user
  Future<List<UserSessionModel>> fetchActiveSessions() async {
    try {
      final res = await ApiClient.get('/pharmacy/auth/sessions');
      if (res['sessions'] is List) {
        _activeSessions = (res['sessions'] as List)
            .map((s) => UserSessionModel.fromJson(s as Map<String, dynamic>))
            .toList();
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Failed to load active sessions: $e');
    }
    return _activeSessions;
  }
}
