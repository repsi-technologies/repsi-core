
import '../../l10n/l10n.dart';/// What staff need to see at a glance: membership state for active accounts (from the real end
/// date), or the account state when the account itself is blocked.
enum MemberStatus { active, expiring, expired, frozen, cancelled, inactive, suspended }

extension MemberStatusLabels on MemberStatus {
  String get displayName {
    switch (this) {
      case MemberStatus.active:
        return L10n.current.commonActive;
      case MemberStatus.expiring:
        return L10n.current.statusExpiring;
      case MemberStatus.expired:
        return L10n.current.commonExpired;
      case MemberStatus.frozen:
        return L10n.current.statusFrozen;
      case MemberStatus.cancelled:
        return L10n.current.statusCancelled;
      case MemberStatus.inactive:
        return L10n.current.commonInactive;
      case MemberStatus.suspended:
        return L10n.current.commonSuspended;
    }
  }
}

class MemberModel {
  final String id;
  final String firstName;
  final String lastName;
  final String email;
  final String? phone;
  final String? avatarUrl;
  final String? gender;
  final String? dateOfBirth;
  final String? emergencyContact;
  final MemberStatus status;
  final String? joinedDate;
  final String? trainerId;
  final String? notes;
  final String? planName;
  final String? expiryDate;

  String? get photoUrl => avatarUrl;
  String? get membershipPlanName => planName;
  DateTime? get startDate => joinedDate == null ? null : DateTime.tryParse(joinedDate!);
  DateTime? get endDate => expiryDate == null ? null : DateTime.tryParse(expiryDate!);
  String? get assignedTrainerName => null;
  String? get emergencyContactPhone => emergencyContact;
  String? get emergencyContactName => null;

  MemberModel({
    required this.id,
    required this.firstName,
    required this.lastName,
    this.email = '',
    this.phone,
    this.avatarUrl,
    this.gender,
    this.dateOfBirth,
    this.emergencyContact,
    this.status = MemberStatus.active,
    this.joinedDate,
    this.trainerId,
    this.notes,
    this.planName,
    this.expiryDate,
  });

  String get fullName => '$firstName $lastName'.trim();

  String get initials {
    final first = firstName.isNotEmpty ? firstName[0] : '';
    final last = lastName.isNotEmpty ? lastName[0] : '';
    return '$first$last'.toUpperCase();
  }

  factory MemberModel.fromJson(Map<String, dynamic> json) {
    return MemberModel(
      id: json['id']?.toString() ?? '',
      firstName: json['first_name']?.toString() ?? '',
      lastName: json['last_name']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      phone: json['phone']?.toString(),
      avatarUrl: json['avatar_url']?.toString(),
      gender: json['gender']?.toString(),
      dateOfBirth: json['date_of_birth']?.toString(),
      emergencyContact: json['emergency_contact']?.toString(),
      status: _statusFromJson(json['status']?.toString(), _endDate(json)),
      joinedDate: json['joined_date']?.toString(),
      trainerId: json['trainer_id']?.toString(),
      notes: json['notes']?.toString(),
      planName: json['plan_name']?.toString(),
      // The API sends `membership_end_date` (yyyy-MM-dd); never invent one when it is missing.
      expiryDate: (json['membership_end_date'] ?? json['expiry_date'])?.toString(),
    );
  }

  static DateTime? _endDate(Map<String, dynamic> json) =>
      DateTime.tryParse((json['membership_end_date'] ?? json['expiry_date'])?.toString() ?? '');

  static MemberStatus _statusFromJson(String? value, DateTime? endDate) {
    switch (value?.toUpperCase()) {
      case 'INACTIVE':
      case 'ARCHIVED':
        return MemberStatus.inactive;
      case 'SUSPENDED':
        return MemberStatus.suspended;
      case 'FROZEN':
        return MemberStatus.frozen;
      case 'CANCELLED':
        return MemberStatus.cancelled;
      case 'EXPIRED':
        return MemberStatus.expired;
      case 'EXPIRING':
        return MemberStatus.expiring;
    }
    if (endDate != null) {
      final now = DateTime.now();
      final today = DateTime(now.year, now.month, now.day);
      if (endDate.isBefore(today)) return MemberStatus.expired;
      if (!endDate.isAfter(today.add(const Duration(days: 7)))) return MemberStatus.expiring;
    }
    return MemberStatus.active;
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'first_name': firstName,
      'last_name': lastName,
      'email': email,
      'phone': phone,
      'avatar_url': avatarUrl,
      'gender': gender,
      'date_of_birth': dateOfBirth,
      'emergency_contact': emergencyContact,
        'status': status.name.toUpperCase(),
      'joined_date': joinedDate,
      'trainer_id': trainerId,
      'notes': notes,
    };
  }
}
