enum AuthStatus {
  unauthenticated,
  requestingOtp,
  otpSent,
  verifyingOtp,
  verifyingSession,
  authenticated,
  roleRejected,
  error,
}

class AuthState {
  final AuthStatus status;
  final String? token;
  final String? userId;
  final String? role;
  final String? phone;
  final String? errorMessage;
  final String? roleRejectionTitle;
  final String? roleRejectionMessage;
  final bool isNewUser;

  const AuthState({
    this.status = AuthStatus.unauthenticated,
    this.token,
    this.userId,
    this.role,
    this.phone,
    this.errorMessage,
    this.roleRejectionTitle,
    this.roleRejectionMessage,
    this.isNewUser = false,
  });

  bool get isAuthenticated => status == AuthStatus.authenticated;
  bool get isRoleRejected => status == AuthStatus.roleRejected;
  bool get isLoading =>
      status == AuthStatus.requestingOtp ||
      status == AuthStatus.verifyingOtp ||
      status == AuthStatus.verifyingSession;

  AuthState copyWith({
    AuthStatus? status,
    String? token,
    String? userId,
    String? role,
    String? phone,
    String? errorMessage,
    String? roleRejectionTitle,
    String? roleRejectionMessage,
    bool? isNewUser,
  }) {
    return AuthState(
      status: status ?? this.status,
      token: token ?? this.token,
      userId: userId ?? this.userId,
      role: role ?? this.role,
      phone: phone ?? this.phone,
      errorMessage: errorMessage ?? this.errorMessage,
      roleRejectionTitle: roleRejectionTitle ?? this.roleRejectionTitle,
      roleRejectionMessage: roleRejectionMessage ?? this.roleRejectionMessage,
      isNewUser: isNewUser ?? this.isNewUser,
    );
  }
}
