import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_typography.dart';
import '../../../shared/widgets/repsi_card.dart';
import '../../../shared/widgets/repsi_search_field.dart';
import '../../nutrition/data/coaching_repository.dart';
import 'trainer_client_detail_view.dart';

/// Members currently assigned to the signed-in trainer (from /trainers/me/clients).
class TrainerClientsView extends ConsumerStatefulWidget {
  const TrainerClientsView({super.key});

  @override
  ConsumerState<TrainerClientsView> createState() => _TrainerClientsViewState();
}

class _TrainerClientsViewState extends ConsumerState<TrainerClientsView> {
  String _query = '';
  bool _activeOnly = false;

  @override
  Widget build(BuildContext context) {
    final clients = ref.watch(trainerClientsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('My clients')),
      body: clients.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Padding(padding: const EdgeInsets.all(16), child: Text(e.toString(), textAlign: TextAlign.center)),
            OutlinedButton(onPressed: () => ref.invalidate(trainerClientsProvider), child: const Text('Try again')),
          ]),
        ),
        data: (rows) {
          final q = _query.toLowerCase();
          final shown = rows.where((c) {
            if (_activeOnly && c['membership_status'] != 'ACTIVE') return false;
            return q.isEmpty || '${c['name']} ${c['phone'] ?? ''}'.toLowerCase().contains(q);
          }).toList();
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(trainerClientsProvider),
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                RepsiSearchField(hintText: 'Search clients', onChanged: (v) => setState(() => _query = v)),
                const SizedBox(height: 8),
                FilterChip(
                  label: const Text('Active memberships only'),
                  selected: _activeOnly,
                  onSelected: (v) => setState(() => _activeOnly = v),
                ),
                const SizedBox(height: 8),
                if (shown.isEmpty)
                  Padding(
                    padding: const EdgeInsets.all(24),
                    child: Text(
                      rows.isEmpty ? 'No members are assigned to you yet.' : 'No clients match your search.',
                      textAlign: TextAlign.center,
                      style: AppTypography.bodySecondary,
                    ),
                  ),
                for (final c in shown)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: RepsiCard(
                      onTap: () => Navigator.of(context).push(MaterialPageRoute(
                        builder: (_) => TrainerClientDetailView(client: {
                          'client_id': c['client_id'] as String,
                          'name': c['name'] as String? ?? '',
                          'status': c['membership_status'] as String? ?? '',
                          if (c['phone'] != null) 'phone': c['phone'] as String,
                          if (c['email'] != null) 'email': c['email'] as String,
                        }),
                      )),
                      child: Row(children: [
                        CircleAvatar(
                          backgroundColor: AppColors.primarySoft,
                          child: Text((c['name'] as String? ?? '?').characters.first,
                              style: const TextStyle(color: AppColors.primary)),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Text(c['name'] as String? ?? '', style: AppTypography.sectionHeading),
                            Text(
                              [c['membership_status'], (c['last_workout'] as Map?)?['title']]
                                  .whereType<String>()
                                  .join(' · '),
                              style: AppTypography.caption,
                            ),
                          ]),
                        ),
                        const Icon(Icons.chevron_right),
                      ]),
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }
}
