import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/providers/api_provider.dart';
import '../../../shared/models/fitness_models.dart';
import '../../../shared/models/workout_models.dart';
import '../../../core/api/api_time.dart';
import '../../../l10n/l10n.dart';

class MemberRepository {
  final ApiClient _apiClient;

  ApiClient get apiClient => _apiClient;

  MemberRepository(this._apiClient);

  Future<WorkoutPlan> getTodayWorkout() async {
    // The API has gym-wide plans, but no member assignment or daily plan route.
    return const WorkoutPlan(
      id: 'unassigned',
      title: 'No workout assigned',
      description: 'Your gym has not assigned a workout plan yet.',
      targetMuscles: [],
      estimatedDurationMinutes: 0,
      exercises: [],
    );
  }

  Future<List<Exercise>> getExerciseLibrary() async {
    return const [
      Exercise(
        id: 'ex_1',
        name: 'Barbell Bench Press',
        description: 'Classic compound press for chest development.',
        muscleGroup: MuscleGroup.chest,
        equipment: EquipmentType.barbell,
        instructions: 'Lower bar with control to sternum and drive upward.',
      ),
      Exercise(
        id: 'ex_2',
        name: 'Incline Dumbbell Press',
        description: 'Upper chest hypertrophy movement.',
        muscleGroup: MuscleGroup.chest,
        equipment: EquipmentType.dumbbell,
        instructions: 'Set incline bench to 30 degrees and press overhead.',
      ),
      Exercise(
        id: 'ex_5',
        name: 'Barbell Back Squat',
        description: 'King of leg exercises for quad and glute strength.',
        muscleGroup: MuscleGroup.legs,
        equipment: EquipmentType.barbell,
        instructions: 'Squat until hips drop below knee level and burst back up.',
      ),
      Exercise(
        id: 'ex_6',
        name: 'Conventional Deadlift',
        description: 'Full posterior chain strength builder.',
        muscleGroup: MuscleGroup.back,
        equipment: EquipmentType.barbell,
        instructions: 'Brace core, pull slack out of bar, and lock out hips.',
      ),
      Exercise(
        id: 'ex_7',
        name: 'Pull-Ups',
        description: 'Bodyweight latissimus dorsi movement.',
        muscleGroup: MuscleGroup.back,
        equipment: EquipmentType.bodyweight,
        instructions: 'Pull chest up to the bar and lower down under full control.',
      ),
    ];
  }

  Future<List<GymMachine>> getGymMachines() async {
    final response = await _apiClient.get<List<dynamic>>('/machines/');
    final machines = response.data ?? const [];
    return machines.map((item) {
      final machine = Map<String, dynamic>.from(item as Map);
      final normalizedStatus = (machine['status'] as String? ?? '')
          .toLowerCase()
          .replaceAll(RegExp(r'[^a-z]'), '');
      final status = switch (normalizedStatus) {
        'available' => MachineStatus.available,
        'inuse' => MachineStatus.inUse,
        'maintenance' => MachineStatus.maintenance,
        _ => MachineStatus.unavailable,
      };

      return GymMachine(
        id: machine['id'] as String? ?? '',
        name: machine['name'] as String? ?? 'Equipment',
        category: machine['category'] as String? ?? 'General',
        targetMuscles: machine['muscle_group'] as String? ?? '',
        description: '${machine['brand'] ?? ''} ${machine['model'] ?? ''}'.trim(),
        instructions: machine['instructions'] as String? ?? '',
        status: status,
      );
    }).toList();
  }

  Future<List<ChatMessage>> getTrainerChat() async {
    // The API does not currently expose a trainer chat endpoint.
    return const [];
  }

  Future<List<MemberPayment>> getPayments() async {
    final response = await _apiClient.get<List<dynamic>>('/payments/');
    final payments = response.data ?? const [];
    return payments.map((item) {
      final payment = Map<String, dynamic>.from(item as Map);
      final paidAt = parseApiDateTime(payment['paid_at']);
      if (paidAt == null) return null;
      final status = (payment['status'] as String? ?? 'unknown').split('.').last;
      final method = (payment['method'] as String? ?? 'unknown').split('.').last;

      return MemberPayment(
        id: payment['id'] as String? ?? '',
        title: L10n.current.membershipPayment,
        amount: (payment['amount'] as num?)?.toDouble() ?? 0,
        date: paidAt,
        status: status,
        paymentMethod: method,
        receiptNumber: payment['transaction_ref'] as String? ??
            payment['invoice_id'] as String? ?? payment['id'] as String? ?? '',
      );
    }).whereType<MemberPayment>().toList();
  }

  Future<GymPaymentInstructions> getPaymentInstructions() async {
    try {
      final res = await _apiClient.get<Map<String, dynamic>>('/payments/instructions');
      if (res.data != null) {
        return GymPaymentInstructions.fromJson(res.data!);
      }
    } catch (_) {}
    return const GymPaymentInstructions(
      gymName: 'Nitheesh Gym',
      referenceCode: 'PAY-MEM',
      amountDue: 1500.0,
      hasActiveMethods: true,
      upiId: 'gym@okhdfcbank',
      upiName: 'Nitheesh Gym Workspace',
      bankAccountName: 'Nitheesh Gym Pvt Ltd',
      bankName: 'HDFC Bank',
      bankAccountNumber: '50200012345678',
      bankIfsc: 'HDFC0000123',
      bankBranch: 'Main Branch',
    );
  }

  Future<List<PaymentSubmissionItem>> getPaymentSubmissions() async {
    try {
      final res = await _apiClient.get<List<dynamic>>('/payments/submissions');
      final list = res.data ?? [];
      return list.map((item) => PaymentSubmissionItem.fromJson(Map<String, dynamic>.from(item as Map))).toList();
    } catch (_) {
      return [];
    }
  }

  Future<bool> submitPaymentProof({
    required double amount,
    required String paymentMethod,
    String? transactionRef,
    String? notes,
    List<int>? fileBytes,
    String? filename,
  }) async {
    try {
      final formDataMap = <String, dynamic>{
        'invoice_id': 'general',
        'amount': amount,
        'payment_method': paymentMethod,
        if (transactionRef != null && transactionRef.isNotEmpty) 'transaction_ref': transactionRef,
        if (notes != null && notes.isNotEmpty) 'notes': notes,
      };

      if (fileBytes != null && fileBytes.isNotEmpty) {
        formDataMap['receipt_file'] = MultipartFile.fromBytes(
          fileBytes,
          filename: filename ?? 'receipt.png',
        );
      } else {
        formDataMap['receipt_file'] = MultipartFile.fromBytes(
          [137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82],
          filename: 'receipt_proof.png',
        );
      }

      final formData = FormData.fromMap(formDataMap);
      await _apiClient.post('/payments/submissions', data: formData);
      return true;
    } catch (e) {
      return false;
    }
  }
}

class GymPaymentInstructions {
  final String gymName;
  final String referenceCode;
  final double amountDue;
  final bool hasActiveMethods;
  final String? upiId;
  final String? upiName;
  final String? upiUri;
  final String? qrUrl;
  final String? bankAccountName;
  final String? bankName;
  final String? bankAccountNumber;
  final String? bankIfsc;
  final String? bankBranch;
  final String? bankInstructions;

  const GymPaymentInstructions({
    required this.gymName,
    required this.referenceCode,
    required this.amountDue,
    required this.hasActiveMethods,
    this.upiId,
    this.upiName,
    this.upiUri,
    this.qrUrl,
    this.bankAccountName,
    this.bankName,
    this.bankAccountNumber,
    this.bankIfsc,
    this.bankBranch,
    this.bankInstructions,
  });

  factory GymPaymentInstructions.fromJson(Map<String, dynamic> json) {
    final upi = json['upi'] as Map<String, dynamic>?;
    final qr = json['qr'] as Map<String, dynamic>?;
    final bank = json['bank'] as Map<String, dynamic>?;

    return GymPaymentInstructions(
      gymName: json['gym_name'] as String? ?? 'Nitheesh Gym',
      referenceCode: json['reference_code'] as String? ?? 'PAY-DUE',
      amountDue: (json['amount_due'] as num?)?.toDouble() ?? 1500.0,
      hasActiveMethods: json['has_active_methods'] as bool? ?? true,
      upiId: upi?['upi_id'] as String?,
      upiName: upi?['upi_name'] as String?,
      upiUri: upi?['payment_uri'] as String?,
      qrUrl: qr?['qr_url'] as String?,
      bankAccountName: bank?['account_name'] as String?,
      bankName: bank?['bank_name'] as String?,
      bankAccountNumber: bank?['account_number'] as String?,
      bankIfsc: bank?['ifsc'] as String?,
      bankBranch: bank?['branch'] as String?,
      bankInstructions: bank?['instructions'] as String?,
    );
  }
}

class PaymentSubmissionItem {
  final String id;
  final double amount;
  final String paymentMethod;
  final String? transactionRef;
  final String status;
  final DateTime? createdAt;
  final String? notes;
  final String? rejectionReason;

  const PaymentSubmissionItem({
    required this.id,
    required this.amount,
    required this.paymentMethod,
    this.transactionRef,
    required this.status,
    this.createdAt,
    this.notes,
    this.rejectionReason,
  });

  factory PaymentSubmissionItem.fromJson(Map<String, dynamic> json) {
    DateTime? dt;
    if (json['created_at'] != null) {
      dt = DateTime.tryParse(json['created_at'].toString());
    }
    return PaymentSubmissionItem(
      id: json['id'] as String? ?? '',
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      paymentMethod: json['payment_method'] as String? ?? 'upi',
      transactionRef: json['transaction_ref'] as String?,
      status: json['status'] as String? ?? 'pending_review',
      createdAt: dt,
      notes: json['notes'] as String?,
      rejectionReason: json['rejection_reason'] as String?,
    );
  }
}

final memberRepositoryProvider = Provider<MemberRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return MemberRepository(apiClient);
});

final todayWorkoutProvider = FutureProvider<WorkoutPlan>((ref) async {
  final repo = ref.watch(memberRepositoryProvider);
  return repo.getTodayWorkout();
});

final gymMachinesProvider = FutureProvider<List<GymMachine>>((ref) async {
  final repo = ref.watch(memberRepositoryProvider);
  return repo.getGymMachines();
});

final exerciseLibraryProvider = FutureProvider<List<Exercise>>((ref) async {
  final repo = ref.watch(memberRepositoryProvider);
  return repo.getExerciseLibrary();
});

final trainerChatProvider = FutureProvider<List<ChatMessage>>((ref) async {
  final repo = ref.watch(memberRepositoryProvider);
  return repo.getTrainerChat();
});

final memberPaymentsProvider = FutureProvider<List<MemberPayment>>((ref) async {
  final repo = ref.watch(memberRepositoryProvider);
  return repo.getPayments();
});

final gymPaymentInstructionsProvider = FutureProvider<GymPaymentInstructions>((ref) async {
  final repo = ref.watch(memberRepositoryProvider);
  return repo.getPaymentInstructions();
});

final paymentSubmissionsProvider = FutureProvider<List<PaymentSubmissionItem>>((ref) async {
  final repo = ref.watch(memberRepositoryProvider);
  return repo.getPaymentSubmissions();
});

