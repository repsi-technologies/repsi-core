import 'dart:async';

import 'package:flutter/foundation.dart';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../../../core/api/api_error.dart';
import '../../../core/providers/api_provider.dart';
import '../../../core/providers/storage_provider.dart';
import '../../../core/storage/secure_storage_service.dart';
import '../../../shared/models/user_model.dart';
import '../services/auth_service.dart';

enum AuthStatus {
  initial,
  loading,
  authenticated,
  unauthenticated,
  error,
}

class AuthState {
  final AuthStatus status;
  final UserModel? user;
  final String? token;
  final String? activeWorkspaceId;
  final String? activeWorkspaceSlug;
  final String? errorMessage;

  const AuthState({
    this.status = AuthStatus.initial,
    this.user,
    this.token,
    this.activeWorkspaceId,
    this.activeWorkspaceSlug,
    this.errorMessage,
  });

  bool get isAuthenticated =>
      status == AuthStatus.authenticated && token != null;

  AuthState copyWith({
    AuthStatus? status,
    UserModel? user,
    String? token,
    String? activeWorkspaceId,
    String? activeWorkspaceSlug,
    String? errorMessage,
    bool clearUser = false,
    bool clearError = false,
  }) {
    return AuthState(
      status: status ?? this.status,
      user: clearUser ? null : (user ?? this.user),
      token: clearUser ? null : (token ?? this.token),
      activeWorkspaceId:
          clearUser ? null : (activeWorkspaceId ?? this.activeWorkspaceId),
      activeWorkspaceSlug:
          clearUser ? null : (activeWorkspaceSlug ?? this.activeWorkspaceSlug),
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }
}

final Provider<AuthService> authServiceProvider = Provider<AuthService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return AuthService(apiClient: apiClient);
});

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthService _authService;
  final SecureStorageService _storage;
  bool _expiring = false;

  AuthNotifier({
    required AuthService authService,
    required SecureStorageService storage,
  })  : _authService = authService,
        _storage = storage,
        super(const AuthState()) {
    initSession();
  }

  /// Restores the saved session. The status stays `initial` until this resolves, so the router
  /// keeps showing the splash screen; `loading` is reserved for explicit sign-in attempts.
  Future<void> initSession() async {
    try {
      final token = await _storage.getToken();
      if (token == null || token.isEmpty) {
        state = state.copyWith(
            status: AuthStatus.unauthenticated, clearError: true);
        return;
      }
      state = state.copyWith(
        status: AuthStatus.authenticated,
        token: token,
        user: _storage.getCachedUser(),
        activeWorkspaceId: _storage.getActiveWorkspaceId(),
        activeWorkspaceSlug: _storage.getActiveWorkspaceSlug(),
      );
      // Non-blocking so startup never waits on the network; a revoked session is caught by the
      // interceptor (401 -> refresh -> expireSession).
      unawaited(_refreshUserProfile());
    } catch (_) {
      state =
          state.copyWith(status: AuthStatus.unauthenticated, clearError: true);
    }
  }

  Future<void> _refreshUserProfile() async {
    try {
      final me = await _authService.getMe();
      await _storage.saveUser(me);
      if (mounted && state.isAuthenticated) state = state.copyWith(user: me);
    } catch (_) {
      // Offline or transient failure: keep the cached profile.
    }
  }

  /// Persists a successful sign-in/registration and moves to `authenticated`.
  /// The user always comes from the server; a profile is never invented client-side.
  Future<void> _establishSession(AuthResponse response,
      {String? fallbackSlug}) async {
    if (response.accessToken.isEmpty) {
      throw ApiError(
          message: 'Sign-in did not return a session. Please try again.');
    }
    await _storage.saveToken(response.accessToken);
    final refresh = response.refreshToken;
    if (refresh != null && refresh.isNotEmpty) {
      await _storage.saveRefreshToken(refresh);
    }

    final workspaceId = response.workspaceId ?? response.workspace?.id;
    final slug =
        response.workspaceSlug ?? response.workspace?.slug ?? fallbackSlug;
    if (workspaceId != null && workspaceId.isNotEmpty) {
      await _storage.saveActiveWorkspaceId(workspaceId);
    }
    if (slug != null && slug.isNotEmpty) {
      await _storage.saveActiveWorkspaceSlug(slug);
    }

    final user = response.user ?? await _authService.getMe();
    await _storage.saveUser(user);

    state = AuthState(
      status: AuthStatus.authenticated,
      token: response.accessToken,
      user: user,
      activeWorkspaceId: workspaceId,
      activeWorkspaceSlug: slug,
    );
  }

  Future<bool> _guarded(
      Future<void> Function() action, String fallbackMessage) async {
    state = state.copyWith(status: AuthStatus.loading, clearError: true);
    try {
      await action();
      return true;
    } on ApiError catch (e) {
      await _storage.clearAll();
      state = AuthState(status: AuthStatus.error, errorMessage: e.message);
      return false;
    } catch (_) {
      await _storage.clearAll();
      state =
          AuthState(status: AuthStatus.error, errorMessage: fallbackMessage);
      return false;
    }
  }

  Future<bool> login({
    required String email,
    required String password,
    String? workspaceSlug,
  }) async {
    if (state.status == AuthStatus.loading) return false;
    return _guarded(() async {
      final response = await _authService.login(
          email: email, password: password, workspaceSlug: workspaceSlug);
      await _establishSession(response, fallbackSlug: workspaceSlug);
    }, 'Failed to sign in. Please check your credentials.');
  }

  Future<bool> loginWithGoogle() async {
    if (state.status == AuthStatus.loading) return false;
    state = state.copyWith(status: AuthStatus.loading, clearError: true);
    try {
      final googleSignIn = GoogleSignIn(scopes: const ['email', 'profile']);
      final account = await googleSignIn.signIn();
      if (account == null) {
        state = const AuthState(status: AuthStatus.unauthenticated);
        return false;
      }
      final auth = await account.authentication;
      // The backend validates an OAuth *access* token with Google (tokeninfo), not an ID token.
      final token = auth.accessToken;
      if (token == null || token.isEmpty) {
        throw ApiError(
            message:
                'Google did not return a sign-in token. Please try again.');
      }
      final response = await _authService.loginWithGoogle(token: token);
      await _establishSession(response);
      return true;
    } on ApiError catch (e) {
      await _storage.clearAll();
      state = AuthState(status: AuthStatus.error, errorMessage: e.message);
      return false;
    } catch (e) {
      // Type only: the exception text can carry account details.
      debugPrint('Google sign-in failed: ${e.runtimeType}');
      await _storage.clearAll();
      state = const AuthState(
        status: AuthStatus.error,
        errorMessage:
            'Google Sign-In failed. Please try again or use your email and password.',
      );
      return false;
    }
  }

  /// Checks a WhatsApp code. Signs in when the phone belongs to an account; otherwise returns the
  /// registration token for [completePhoneSignup] and leaves the user signed out.
  Future<PhoneVerification> verifyPhoneOtp({required String phone, required String code}) async {
    final result = await _authService.verifyPhoneOtp(phone: phone, code: code);
    final session = result.session;
    if (session != null) {
      try {
        await _establishSession(session);
      } catch (_) {
        await _storage.clearAll();
        rethrow;
      }
    }
    return result;
  }

  Future<bool> completePhoneSignup({
    required String registrationToken,
    required String fullName,
    required String email,
    required String password,
  }) {
    if (state.status == AuthStatus.loading) return Future.value(false);
    return _guarded(() async {
      final response = await _authService.signupWithVerifiedPhone(
        registrationToken: registrationToken,
        fullName: fullName,
        email: email,
        password: password,
      );
      await _establishSession(response);
    }, 'We could not create your account. Please try again.');
  }

  /// Replaces the profile photo; the server's copy of the profile becomes the cached one.
  Future<void> updateAvatar(List<int> bytes, String filename) async {
    final user = await _authService.uploadAvatar(bytes, filename);
    await _storage.saveUser(user);
    if (mounted && state.isAuthenticated) state = state.copyWith(user: user);
  }

  Future<void> removeAvatar() async {
    final user = await _authService.removeAvatar();
    await _storage.saveUser(user);
    if (mounted && state.isAuthenticated) state = state.copyWith(user: user);
  }

  Future<bool> register({
    required String fullName,
    required String email,
    required String password,
    required String gymName,
    String? gymPhone,
    String? gymCity,
  }) {
    return _guarded(() async {
      final response = await _authService.register(
        fullName: fullName,
        email: email,
        password: password,
        gymName: gymName,
        gymPhone: gymPhone,
        gymCity: gymCity,
      );
      await _establishSession(response);
    }, 'Registration failed. Please try again.');
  }

  Future<bool> registerMember({
    required String fullName,
    required String email,
    required String password,
    required String workspaceSlug,
    String? phone,
  }) {
    return _guarded(() async {
      final response = await _authService.registerMember(
        fullName: fullName,
        email: email,
        password: password,
        workspaceSlug: workspaceSlug,
        phone: phone,
      );
      await _establishSession(response, fallbackSlug: workspaceSlug);
    }, 'Registration failed. Please try again.');
  }

  Future<void> updateActiveWorkspace(String workspaceId, String slug) async {
    await _storage.saveActiveWorkspaceId(workspaceId);
    await _storage.saveActiveWorkspaceSlug(slug);
    state = state.copyWith(
      activeWorkspaceId: workspaceId,
      activeWorkspaceSlug: slug,
    );
  }

  /// Called by the network layer when the refresh token is rejected (revoked or expired session).
  Future<void> expireSession() async {
    if (_expiring || !state.isAuthenticated) return;
    _expiring = true;
    try {
      await _storage.clearAll();
      if (mounted) {
        state = const AuthState(
          status: AuthStatus.unauthenticated,
          errorMessage: 'Your session has expired. Please sign in again.',
        );
      }
    } finally {
      _expiring = false;
    }
  }

  /// Returns null on success, otherwise the message to show the user.
  Future<String?> deleteAccount({String? password, required String confirm}) async {
    try {
      await _authService.deleteAccount(password: password, confirm: confirm);
    } on ApiError catch (e) {
      return e.message;
    } catch (_) {
      return 'Could not delete your account. Please try again.';
    }
    try {
      await GoogleSignIn().signOut();
    } catch (_) {}
    await _storage.clearAll();
    state = const AuthState(status: AuthStatus.unauthenticated);
    return null;
  }

  Future<void> logout() async {
    await _authService.logout();
    try {
      await GoogleSignIn().signOut();
    } catch (_) {}
    await _storage.clearAll();
    state = const AuthState(status: AuthStatus.unauthenticated);
  }
}

final StateNotifierProvider<AuthNotifier, AuthState> authProvider =
    StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final authService = ref.watch(authServiceProvider);
  final storage = ref.watch(secureStorageServiceProvider);
  return AuthNotifier(authService: authService, storage: storage);
});
