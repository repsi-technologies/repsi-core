import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_endpoints.dart';
import '../../../core/providers/api_provider.dart';

class SelfMembership {
  final String planName;
  final DateTime endDate;
  final String status;

  const SelfMembership(
      {required this.planName, required this.endDate, required this.status});

  bool get isActive => status.toUpperCase() == 'ACTIVE' && !daysLeft.isNegative;

  /// Whole days until the membership ends (negative once expired).
  Duration get daysLeft => endDate.difference(DateTime.now());

  factory SelfMembership.fromJson(Map<String, dynamic> json) => SelfMembership(
        planName: json['plan_name']?.toString() ?? 'Membership',
        endDate: DateTime.parse(json['end_date'].toString()),
        status: json['status']?.toString() ?? '',
      );
}

/// The signed-in member's own profile (`GET /members/me`). The server scopes it to the caller.
class MemberSelf {
  final String firstName;
  final String status;
  final SelfMembership? membership;

  const MemberSelf(
      {required this.firstName, required this.status, this.membership});

  factory MemberSelf.fromJson(Map<String, dynamic> json) {
    final all = [
      for (final m in (json['memberships'] as List? ?? const []))
        if (m is Map<String, dynamic>) SelfMembership.fromJson(m),
    ]..sort((a, b) => b.endDate.compareTo(a.endDate));
    final current = all.where((m) => m.isActive).firstOrNull ?? all.firstOrNull;
    return MemberSelf(
      firstName: json['first_name']?.toString() ?? '',
      status: json['status']?.toString() ?? '',
      membership: current,
    );
  }
}

final memberSelfProvider = FutureProvider.autoDispose<MemberSelf>((ref) async {
  final response =
      await ref.watch(apiClientProvider).get(ApiEndpoints.myMemberProfile);
  return MemberSelf.fromJson(response.data as Map<String, dynamic>);
});
