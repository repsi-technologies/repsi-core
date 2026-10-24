import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_typography.dart';
import '../../../shared/widgets/repsi_card.dart';
import '../../member/presentation/views/trainer_chat_view.dart';
import '../../nutrition/data/coaching_repository.dart';
import 'trainer_diet_plan_view.dart';

/// An assigned client: contact, diet adherence and shortcuts to chat and the diet plan.
/// `client['client_id']` is the member id; without it (legacy callers) the actions are hidden.
class TrainerClientDetailView extends ConsumerWidget {
  final Map<String, String> client;
  const TrainerClientDetailView({super.key, required this.client});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final id = client['client_id'];
    final name = client['name'] ?? '';
    final contact = [client['phone'], client['email']].whereType<String>().join(' · ');

    return Scaffold(
      appBar: AppBar(title: Text(name)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          RepsiCard(
            child: Row(children: [
              CircleAvatar(
                radius: 28,
                backgroundColor: AppColors.primarySoft,
                child: Text(name.isEmpty ? '?' : name.characters.first,
                    style: const TextStyle(color: AppColors.primary, fontSize: 22)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(name, style: AppTypography.heading),
                  if ((client['status'] ?? '').isNotEmpty) Text(client['status']!, style: AppTypography.caption),
                  if (contact.isNotEmpty) Text(contact, style: AppTypography.caption),
                ]),
              ),
            ]),
          ),
          const SizedBox(height: 12),
          if (id == null)
            Text('Open this client from My clients to message them or see their diet.', style: AppTypography.bodySecondary)
          else ...[
            Row(children: [
              Expanded(
                child: FilledButton.icon(
                  icon: const Icon(Icons.chat_bubble_outline),
                  label: const Text('Message'),
                  onPressed: () => Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => TrainerChatView(memberId: id, asTrainer: true))),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton.icon(
                  icon: const Icon(Icons.restaurant_menu),
                  label: const Text('Diet plan'),
                  onPressed: () => Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => TrainerDietPlanView(memberId: id, memberName: name))),
                ),
              ),
            ]),
            const SizedBox(height: 12),
            FutureBuilder<Map<String, dynamic>?>(
              future: ref.read(coachingRepositoryProvider).adherence(id),
              builder: (context, snap) {
                final a = snap.data;
                if (snap.connectionState != ConnectionState.done) return const LinearProgressIndicator();
                if (snap.hasError) return Text('Couldn\'t load diet adherence.', style: AppTypography.caption);
                if (a == null || (a['planned_meals'] as num? ?? 0) == 0) {
                  return Text('No diet plan assigned.', style: AppTypography.bodySecondary);
                }
                return RepsiCard(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('Diet adherence · last 7 days', style: AppTypography.sectionHeading),
                    const SizedBox(height: 4),
                    Text('${a['adherence_pct'] ?? '—'}%', style: AppTypography.display),
                    Text(
                      'Followed ${a['followed']} · Modified ${a['modified']} · Skipped ${a['skipped']} · Not logged ${a['not_logged']}',
                      style: AppTypography.caption,
                    ),
                  ]),
                );
              },
            ),
          ],
        ],
      ),
    );
  }
}
