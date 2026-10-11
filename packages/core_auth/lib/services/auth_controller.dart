import 'package:flutter/foundation.dart';
import '../models/auth_state.dart';
import 'auth_api_client.dart';
import 'token_storage.dart';

class AuthController extends ChangeNotifier {
  final AuthApiClient _apiClient;
  final AuthTokenStorage _storage;

  AuthState _state = const AuthState();
  AuthState get state => _state;

  AuthController({
    required AuthApiClient apiClient,
    AuthTokenStorage? storage,
  })  : _apiClient = apiClient,
        _storage = storage ?? InMemoryAuthTokenStorage();

  Future<void> initialize({
    required String appId,
    required String appVersion,
  }) async {
    final token = await _storage.getToken();
    final userId = await _storage.getUserId();

    if (token == null) {
      _state = const AuthState(status: AuthStatus.unauthenticated);
      notifyListeners();
      return;
    }

    _state = _state.copyWith(
      status: AuthStatus.verifyingSession,
      token: token,
      userId: userId,
    );
    notifyListeners();

    final sessionRes = await _apiClient.verifyAppSession(
      appId: appId,
      appVersion: appVersion,
      token: token,
      userId: userId,
    );

    if (sessionRes.sessionValid) {
      _state = _state.copyWith(
        status: AuthStatus.authenticated,
        role: sessionRes.role,
        userId: sessionRes.userId ?? userId,
      );
    } else {
      // Role rejection or invalid session
      await _storage.clear();
      if (sessionRes.error?.contains("can't use this app") == true ||
          sessionRes.error?.contains("not authorized") == true) {
        _state = _state.copyWith(
          status: AuthStatus.roleRejected,
          roleRejectionTitle: "This account can't use this app",
          roleRejectionMessage: sessionRes.message ??
              "Your account role is not permitted in this app. Please log in using the correct Medcure application.",
          errorMessage: sessionRes.error,
        );
      } else {
        _state = const AuthState(status: AuthStatus.unauthenticated);
      }
    }
    notifyListeners();
  }

  Future<bool> requestOtp(String phone) async {
    _state = _state.copyWith(
      status: AuthStatus.requestingOtp,
      phone: phone,
      errorMessage: null,
    );
    notifyListeners();

    final res = await _apiClient.requestOtp(phone: phone);
    if (res.success) {
      _state = _state.copyWith(
        status: AuthStatus.otpSent,
        errorMessage: null,
      );
      notifyListeners();
      return true;
    } else {
      _state = _state.copyWith(
        status: AuthStatus.error,
        errorMessage: res.error ?? 'Failed to send OTP.',
      );
      notifyListeners();
      return false;
    }
  }

  Future<bool> verifyOtpAndCheckAppRole({
    required String phone,
    required String otp,
    required String appId,
    required String appVersion,
  }) async {
    _state = _state.copyWith(
      status: AuthStatus.verifyingOtp,
      errorMessage: null,
    );
    notifyListeners();

    final verifyRes = await _apiClient.verifyOtp(phone: phone, otp: otp);
    if (!verifyRes.success || verifyRes.token == null) {
      _state = _state.copyWith(
        status: AuthStatus.error,
        errorMessage: verifyRes.error ?? 'Verification failed.',
      );
      notifyListeners();
      return false;
    }

    final token = verifyRes.token!;
    final userId = verifyRes.userId;

    _state = _state.copyWith(
      status: AuthStatus.verifyingSession,
      token: token,
      userId: userId,
      role: verifyRes.role,
      isNewUser: verifyRes.isNewUser,
    );
    notifyListeners();

    // Verify role permissions for this specific app
    final sessionRes = await _apiClient.verifyAppSession(
      appId: appId,
      appVersion: appVersion,
      token: token,
      userId: userId,
    );

    if (sessionRes.sessionValid) {
      await _storage.saveToken(token);
      if (userId != null) await _storage.saveUserId(userId);
      if (sessionRes.role != null) await _storage.saveUserRole(sessionRes.role!);

      _state = _state.copyWith(
        status: AuthStatus.authenticated,
        role: sessionRes.role,
        userId: sessionRes.userId ?? userId,
      );
      notifyListeners();
      return true;
    } else {
      // Role rejection from server
      await _storage.clear();
      _state = _state.copyWith(
        status: AuthStatus.roleRejected,
        roleRejectionTitle: "This account can't use this app",
        roleRejectionMessage: sessionRes.message ??
            "Your account is not authorized to access this Medcure app.",
        errorMessage: sessionRes.error,
      );
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await _storage.clear();
    _state = const AuthState(status: AuthStatus.unauthenticated);
    notifyListeners();
  }

  void resetError() {
    _state = _state.copyWith(errorMessage: null);
    notifyListeners();
  }
}
