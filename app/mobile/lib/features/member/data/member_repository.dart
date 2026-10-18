import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/providers/api_provider.dart';
import '../../../shared/models/fitness_models.dart';
import '../../../shared/models/workout_models.dart';

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
      final paidAt = DateTime.tryParse(payment['paid_at'] as String? ?? '');
      if (paidAt == null) return null;
      final status = (payment['status'] as String? ?? 'unknown').split('.').last;
      final method = (payment['method'] as String? ?? 'unknown').split('.').last;

      return MemberPayment(
        id: payment['id'] as String? ?? '',
        title: 'Membership payment',
        amount: (payment['amount'] as num?)?.toDouble() ?? 0,
        date: paidAt,
        status: status,
        paymentMethod: method,
        receiptNumber: payment['transaction_ref'] as String? ??
            payment['invoice_id'] as String? ?? payment['id'] as String? ?? '',
      );
    }).whereType<MemberPayment>().toList();
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
