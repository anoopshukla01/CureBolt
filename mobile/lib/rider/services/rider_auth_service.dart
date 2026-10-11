import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/rider_user.dart';

class RiderAuthService extends ChangeNotifier {
  static const String _keyToken = 'medcure_rider_token';
  static const String _keyUser = 'medcure_rider_user_json';
  static const String _keyRiderProfile = 'medcure_rider_profile_json';

  static String get baseUrl {
    if (kIsWeb) return 'http://localhost:4000/api/v1';
    if (defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:4000/api/v1';
    }
    return 'http://localhost:4000/api/v1';
  }

  RiderUser? _currentUser;
  RiderProfileModel? _currentProfile;
  RiderOnboardingApplicationModel? _currentApplication;
  List<RiderDeviceModel> _boundDevices = [];
  String? _authToken;
  bool _isLoading = false;
  String? _errorMessage;

  RiderUser? get currentUser => _currentUser;
  RiderProfileModel? get currentProfile => _currentProfile;
  RiderOnboardingApplicationModel? get currentApplication => _currentApplication;
  List<RiderDeviceModel> get boundDevices => _boundDevices;
  String? get authToken => _authToken;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _authToken != null && _currentUser != null;

  /// Initialize and load cached session
  Future<void> initialize() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _authToken = prefs.getString(_keyToken);
      final userJson = prefs.getString(_keyUser);
      final profileJson = prefs.getString(_keyRiderProfile);

      if (userJson != null) {
        _currentUser = RiderUser.fromJson(jsonDecode(userJson) as Map<String, dynamic>);
      }
      if (profileJson != null) {
        _currentProfile = RiderProfileModel.fromJson(jsonDecode(profileJson) as Map<String, dynamic>);
      }
      if (_currentUser != null) {
        await refreshOnboardingStatus();
      }
      notifyListeners();
    } catch (e) {
      debugPrint('Error restoring rider session: $e');
    }
  }

  /// Request OTP for phone number (Only approved delivery partners)
  Future<Map<String, dynamic>> requestOtp(String phone) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await http.post(
        Uri.parse('$baseUrl/rider/auth/request-otp'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'phone': phone}),
      );

      final data = jsonDecode(res.body) as Map<String, dynamic>;
      _isLoading = false;
      notifyListeners();

      if (res.statusCode == 200) {
        return {'success': true, 'mockOtp': data['mockOtp'] ?? '123456'};
      } else {
        _errorMessage = data['message'] ?? data['error'] ?? 'Authentication failed';
        return {'success': false, 'error': _errorMessage};
      }
    } catch (e) {
      _isLoading = false;
      _errorMessage = 'Network connection failed: $e';
      notifyListeners();
      return {'success': false, 'error': _errorMessage};
    }
  }

  /// Login with phone, OTP, and device fingerprint binding
  Future<bool> login({
    required String phone,
    required String otp,
    required String deviceFingerprint,
    required String deviceModel,
    required String osVersion,
    required String appVersion,
    String? pushToken,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await http.post(
        Uri.parse('$baseUrl/rider/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'phone': phone,
          'otp': otp,
          'deviceFingerprint': deviceFingerprint,
          'deviceModel': deviceModel,
          'osVersion': osVersion,
          'appVersion': appVersion,
          if (pushToken != null) 'pushToken': pushToken,
        }),
      );

      final data = jsonDecode(res.body) as Map<String, dynamic>;
      _isLoading = false;

      if (res.statusCode == 200 && data['success'] == true) {
        _authToken = data['token'] as String;
        _currentUser = RiderUser.fromJson(data['user'] as Map<String, dynamic>);
        if (data['rider'] != null) {
          _currentProfile = RiderProfileModel.fromJson(data['rider'] as Map<String, dynamic>);
        }
        if (data['onboardingApplication'] != null) {
          _currentApplication = RiderOnboardingApplicationModel.fromJson(
            data['onboardingApplication'] as Map<String, dynamic>,
          );
        }
        if (data['boundDevices'] is List) {
          _boundDevices = (data['boundDevices'] as List)
              .map((d) => RiderDeviceModel.fromJson(d as Map<String, dynamic>))
              .toList();
        }

        // Cache session
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_keyToken, _authToken!);
        await prefs.setString(_keyUser, jsonEncode(_currentUser!.toJson()));
        if (data['rider'] != null) {
          await prefs.setString(_keyRiderProfile, jsonEncode(data['rider']));
        }

        notifyListeners();
        return true;
      } else {
        _errorMessage = data['message'] ?? data['error'] ?? 'Sign in failed';
        notifyListeners();
        return false;
      }
    } catch (e) {
      _isLoading = false;
      _errorMessage = 'Network error: $e';
      notifyListeners();
      return false;
    }
  }

  /// Submit Onboarding Application
  Future<bool> submitOnboarding({
    required String fullName,
    required String phone,
    required String selfieDocPath,
    required String govIdType,
    required String govIdNumber,
    required String govIdDocPath,
    required String drivingLicenceNumber,
    required String drivingLicenceDocPath,
    required String drivingLicenceExpiryDate,
    required String vehicleType,
    required String vehicleRegistrationNumber,
    required String vehicleRcDocPath,
    String? vehicleInsuranceDocPath,
    required String emergencyContactName,
    required String emergencyContactPhone,
    required String emergencyContactRelation,
    String? bankAccount,
    String? bankIfsc,
    String? upiId,
  }) async {
    if (_currentUser == null) return false;

    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await http.post(
        Uri.parse('$baseUrl/rider/onboarding/submit'),
        headers: {
          'Content-Type': 'application/json',
          if (_authToken != null) 'Authorization': 'Bearer $_authToken',
        },
        body: jsonEncode({
          'userId': _currentUser!.id,
          'fullName': fullName,
          'phone': phone,
          'selfieDocPath': selfieDocPath,
          'govIdType': govIdType,
          'govIdNumber': govIdNumber,
          'govIdDocPath': govIdDocPath,
          'drivingLicenceNumber': drivingLicenceNumber,
          'drivingLicenceDocPath': drivingLicenceDocPath,
          'drivingLicenceExpiryDate': drivingLicenceExpiryDate,
          'vehicleType': vehicleType,
          'vehicleRegistrationNumber': vehicleRegistrationNumber,
          'vehicleRcDocPath': vehicleRcDocPath,
          if (vehicleInsuranceDocPath != null) 'vehicleInsuranceDocPath': vehicleInsuranceDocPath,
          'emergencyContactName': emergencyContactName,
          'emergencyContactPhone': emergencyContactPhone,
          'emergencyContactRelation': emergencyContactRelation,
          if (bankAccount != null && bankAccount.isNotEmpty) 'bankAccount': bankAccount,
          if (bankIfsc != null && bankIfsc.isNotEmpty) 'bankIfsc': bankIfsc,
          if (upiId != null && upiId.isNotEmpty) 'upiId': upiId,
        }),
      );

      final data = jsonDecode(res.body) as Map<String, dynamic>;
      _isLoading = false;

      if (res.statusCode == 200 && data['success'] == true) {
        _currentApplication = RiderOnboardingApplicationModel.fromJson(
          data['application'] as Map<String, dynamic>,
        );
        notifyListeners();
        return true;
      } else {
        _errorMessage = data['message'] ?? data['error'] ?? 'Submission failed';
        notifyListeners();
        return false;
      }
    } catch (e) {
      _isLoading = false;
      _errorMessage = 'Submission failed: $e';
      notifyListeners();
      return false;
    }
  }

  /// Refresh onboarding status from server
  Future<void> refreshOnboardingStatus() async {
    if (_currentUser == null) return;

    try {
      final res = await http.get(
        Uri.parse('$baseUrl/rider/onboarding/status?userId=${_currentUser!.id}'),
      );

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body) as Map<String, dynamic>;
        if (data['application'] != null) {
          _currentApplication = RiderOnboardingApplicationModel.fromJson(
            data['application'] as Map<String, dynamic>,
          );
        }
        if (_currentProfile != null) {
          _currentProfile = RiderProfileModel(
            id: _currentProfile!.id,
            userId: _currentProfile!.userId,
            vehicleType: _currentProfile!.vehicleType,
            vehicleRegistrationNumber: _currentProfile!.vehicleRegistrationNumber,
            drivingLicenceNumber: _currentProfile!.drivingLicenceNumber,
            isAvailable: _currentProfile!.isAvailable,
            currentCashInHand: _currentProfile!.currentCashInHand,
            isApproved: data['isApproved'] as bool? ?? false,
            approvalStatus: data['approvalStatus'] as String? ?? 'submitted',
            onboardingApplicationId: _currentApplication?.id,
            reviewerComments: data['reviewerComments'] as String?,
          );
        }
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Error refreshing onboarding status: $e');
    }
  }

  /// Toggle Online/Offline Availability (Enforces server verification & cash limit)
  Future<Map<String, dynamic>> toggleAvailability(bool isAvailable) async {
    if (_currentProfile == null) {
      return {'success': false, 'error': 'Rider profile not found'};
    }

    try {
      final res = await http.post(
        Uri.parse('$baseUrl/rider/availability'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'riderId': _currentProfile!.id,
          'isAvailable': isAvailable,
        }),
      );

      final data = jsonDecode(res.body) as Map<String, dynamic>;
      if (res.statusCode == 200) {
        _currentProfile = RiderProfileModel.fromJson(data['rider'] as Map<String, dynamic>);
        notifyListeners();
        return {'success': true, 'isAvailable': _currentProfile!.isAvailable};
      } else {
        return {'success': false, 'error': data['message'] ?? data['error']};
      }
    } catch (e) {
      return {'success': false, 'error': 'Network error: $e'};
    }
  }

  /// Sign Out and revoke session
  Future<void> signOut({String? deviceFingerprint}) async {
    try {
      if (_currentUser != null) {
        await http.post(
          Uri.parse('$baseUrl/rider/auth/signout'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'userId': _currentUser!.id,
            if (deviceFingerprint != null) 'deviceFingerprint': deviceFingerprint,
          }),
        );
      }
    } catch (_) {}

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyToken);
    await prefs.remove(_keyUser);
    await prefs.remove(_keyRiderProfile);

    _currentUser = null;
    _currentProfile = null;
    _currentApplication = null;
    _authToken = null;
    notifyListeners();
  }
}
