abstract class AuthTokenStorage {
  Future<void> saveToken(String token);
  Future<String?> getToken();
  Future<void> saveUserId(String userId);
  Future<String?> getUserId();
  Future<void> saveUserRole(String role);
  Future<String?> getUserRole();
  Future<void> clear();
}

class InMemoryAuthTokenStorage implements AuthTokenStorage {
  String? _token;
  String? _userId;
  String? _role;

  @override
  Future<void> saveToken(String token) async {
    _token = token;
  }

  @override
  Future<String?> getToken() async => _token;

  @override
  Future<void> saveUserId(String userId) async {
    _userId = userId;
  }

  @override
  Future<String?> getUserId() async => _userId;

  @override
  Future<void> saveUserRole(String role) async {
    _role = role;
  }

  @override
  Future<String?> getUserRole() async => _role;

  @override
  Future<void> clear() async {
    _token = null;
    _userId = null;
    _role = null;
  }
}
