import 'package:dio/dio.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/api/api_error.dart';
import '../../../shared/models/user_model.dart';
import '../../../shared/models/workspace_model.dart';

import '../../../l10n/l10n.dart';
class AuthResponse {
  final String accessToken;
  final String? refreshToken;
  final String? tokenType;
  final String? workspaceId;
  final String? workspaceSlug;
  final String? gymName;
  final UserRole? role;
  final UserModel? user;
  final WorkspaceModel? workspace;

  const AuthResponse({
    required this.accessToken,
    this.refreshToken,
    this.tokenType,
    this.workspaceId,
    this.workspaceSlug,
    this.gymName,
    this.role,
    this.user,
    this.workspace,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      accessToken: json['access_token']?.toString() ?? '',
      refreshToken: json['refresh_token']?.toString(),
      tokenType: json['token_type'] as String?,
      workspaceId: json['workspace_id']?.toString(),
      workspaceSlug: json['workspace_slug']?.toString(),
      gymName: json['gym_name']?.toString(),
      role: json['role'] != null
          ? UserRole.fromString(json['role'] as String)
          : null,
      user: json['user'] != null
          ? UserModel.fromJson(json['user'] as Map<String, dynamic>)
          : null,
      workspace: json['workspace'] != null
          ? WorkspaceModel.fromJson(json['workspace'] as Map<String, dynamic>)
          : null,
    );
  }
}

/// A WhatsApp code was sent. [phone] is the normalised E.164 number to verify against.
class PhoneOtpChallenge {
  final String phone;
  final int expiresIn;
  final int resendIn;
  final bool testMode;

  const PhoneOtpChallenge({required this.phone, required this.expiresIn, required this.resendIn, this.testMode = false});

  factory PhoneOtpChallenge.fromJson(Map<String, dynamic> json) => PhoneOtpChallenge(
        phone: json['phone']?.toString() ?? '',
        expiresIn: (json['expires_in'] as num?)?.toInt() ?? 600,
        resendIn: (json['resend_in'] as num?)?.toInt() ?? 30,
        testMode: json['test_mode'] == true,
      );
}

/// Result of checking a WhatsApp code: either a session for an existing account, or a short-lived
/// registration token that proves the phone was verified, for finishing sign-up.
class PhoneVerification {
  final AuthResponse? session;
  final String? registrationToken;

  const PhoneVerification({this.session, this.registrationToken});

  bool get needsRegistration => session == null;
}

class AuthService {
  final ApiClient _apiClient;

  AuthService({required ApiClient apiClient}) : _apiClient = apiClient;

  Future<AuthResponse> login({
    required String email,
    required String password,
    String? workspaceSlug,
  }) async {
    try {
      final response = await _apiClient.post(
        ApiEndpoints.login,
        data: {
          'email': email.trim(),
          'password': password,
          if (workspaceSlug != null && workspaceSlug.isNotEmpty)
            'workspace_slug': workspaceSlug.trim(),
        },
      );
      return AuthResponse.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiError.fromDioException(e);
    }
  }

  Future<AuthResponse> loginWithGoogle({required String token}) async {
    try {
      final response = await _apiClient.post(
        ApiEndpoints.googleLogin,
        data: {'token': token},
      );
      return AuthResponse.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiError.fromDioException(e);
    }
  }

  Future<AuthResponse> register({
    required String fullName,
    required String email,
    required String password,
    required String gymName,
    String? gymPhone,
    String? gymCity,
  }) async {
    try {
      final response = await _apiClient.post(
        ApiEndpoints.register,
        data: {
          'full_name': fullName.trim(),
          'email': email.trim(),
          'password': password,
          'gym_name': gymName.trim(),
          if (gymPhone != null && gymPhone.isNotEmpty)
            'gym_phone': gymPhone.trim(),
          if (gymCity != null && gymCity.isNotEmpty) 'gym_city': gymCity.trim(),
        },
      );
      return AuthResponse.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiError.fromDioException(e);
    }
  }

  Future<AuthResponse> registerMember({
    required String fullName,
    required String email,
    required String password,
    required String workspaceSlug,
    String? phone,
  }) async {
    try {
      final response = await _apiClient.post(
        ApiEndpoints.registerMember,
        data: {
          'full_name': fullName.trim(),
          'email': email.trim(),
          'password': password,
          'workspace_slug': workspaceSlug.trim(),
          if (phone != null && phone.isNotEmpty) 'phone': phone.trim(),
        },
      );
      return AuthResponse.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiError.fromDioException(e);
    }
  }

  Future<PhoneOtpChallenge> requestPhoneOtp({
    required String phone,
    String country = 'IN',
    String purpose = 'auth',
  }) async {
    final response = await _apiClient.post(
      ApiEndpoints.phoneOtpRequest,
      data: {'phone': phone.trim(), 'country': country, 'purpose': purpose},
    );
    return PhoneOtpChallenge.fromJson(response.data as Map<String, dynamic>);
  }

  Future<PhoneVerification> verifyPhoneOtp({required String phone, required String code, String country = 'IN'}) async {
    final response = await _apiClient.post(
      ApiEndpoints.phoneOtpVerify,
      data: {'phone': phone, 'country': country, 'code': code},
    );
    final data = response.data as Map<String, dynamic>;
    if (data['status'] == 'authenticated' && data['token'] is Map<String, dynamic>) {
      return PhoneVerification(session: AuthResponse.fromJson(data['token'] as Map<String, dynamic>));
    }
    final token = data['registration_token']?.toString();
    if (token == null || token.isEmpty) {
      throw ApiError(message: L10n.current.authVerificationIncomplete);
    }
    return PhoneVerification(registrationToken: token);
  }

  /// Creates the account for a phone verified with [verifyPhoneOtp].
  Future<AuthResponse> signupWithVerifiedPhone({
    required String registrationToken,
    required String fullName,
    required String email,
    required String password,
  }) async {
    final response = await _apiClient.post(
      ApiEndpoints.signup,
      data: {
        'registration_token': registrationToken,
        'full_name': fullName.trim(),
        'email': email.trim(),
        'password': password,
      },
    );
    return AuthResponse.fromJson(response.data as Map<String, dynamic>);
  }

  /// Uploads a profile photo (JPEG/PNG/WebP, already resized on the device) and returns the profile.
  Future<UserModel> uploadAvatar(List<int> bytes, String filename) async {
    final response = await _apiClient.post(
      ApiEndpoints.myAvatar,
      data: FormData.fromMap({'file': MultipartFile.fromBytes(bytes, filename: filename)}),
    );
    return UserModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<UserModel> removeAvatar() async {
    final response = await _apiClient.delete(ApiEndpoints.myAvatar);
    return UserModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<UserModel> getMe() async {
    try {
      final response = await _apiClient.get(ApiEndpoints.me);
      return UserModel.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiError.fromDioException(e);
    }
  }

  Future<void> forgotPassword(String email) async {
    try {
      await _apiClient.post(
        ApiEndpoints.forgotPassword,
        data: {'email': email.trim()},
      );
    } on DioException catch (e) {
      throw ApiError.fromDioException(e);
    }
  }

  Future<void> changePassword({required String current, required String next}) async {
    await _apiClient.put(
      ApiEndpoints.changePassword,
      data: {'current_password': current, 'new_password': next},
    );
  }

  Future<void> deleteAccount({String? password, required String confirm}) async {
    await _apiClient.delete(
      ApiEndpoints.deleteAccount,
      data: {if (password != null) 'password': password, 'confirm': confirm},
    );
  }

  Future<void> logout() async {
    try {
      await _apiClient.post(ApiEndpoints.logout);
    } catch (_) {
      // Ignore network errors on logout
    }
  }
}
