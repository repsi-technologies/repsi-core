import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../l10n/l10n.dart';
import '../../../../shared/models/fitness_models.dart';
import '../../data/member_repository.dart';

class GymMachinesView extends ConsumerWidget {
  const GymMachinesView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final machinesAsync = ref.watch(gymMachinesProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(context.l10n.gymMachinesTitle),
      ),
      body: machinesAsync.when(
        data: (machines) => ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: machines.length,
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemBuilder: (context, index) {
            final item = machines[index];
            return Card(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            item.name,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        _buildStatusBadge(context, item.status),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      context.l10n.machineCategoryPrefix(item.category, item.targetMuscles),
                      style: const TextStyle(color: Colors.grey, fontSize: 12),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      item.description,
                      style: const TextStyle(fontSize: 13),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        const Icon(Icons.info_outline, size: 16, color: Colors.blue),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            item.instructions,
                            style: const TextStyle(
                              fontSize: 12,
                              color: Colors.blueAccent,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          },
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, __) => Center(child: Text(context.l10n.commonSomethingWentWrong)),
      ),
    );
  }

  Widget _buildStatusBadge(BuildContext context, MachineStatus status) {
    Color bg;
    Color text;
    String label;

    switch (status) {
      case MachineStatus.available:
        bg = AppColors.success.withValues(alpha: 0.15);
        text = AppColors.success;
        label = context.l10n.machineStatusAvailable.toUpperCase();
        break;
      case MachineStatus.inUse:
        bg = AppColors.info.withValues(alpha: 0.15);
        text = AppColors.info;
        label = context.l10n.machineStatusInUse.toUpperCase();
        break;
      case MachineStatus.maintenance:
        bg = AppColors.error.withValues(alpha: 0.15);
        text = AppColors.error;
        label = context.l10n.machineStatusMaintenance.toUpperCase();
        break;
      case MachineStatus.unavailable:
        bg = Colors.grey.withValues(alpha: 0.15);
        text = Colors.grey;
        label = context.l10n.machineStatusUnavailable.toUpperCase();
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: text,
          fontSize: 10,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}

