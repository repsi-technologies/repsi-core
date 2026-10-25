import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_typography.dart';
import '../../../shared/widgets/repsi_avatar.dart';
import '../../../shared/widgets/repsi_card.dart';
import '../../coaching/coaching_labels.dart';
import '../../coaching/data/coaching_api.dart';
import '../../member/presentation/views/trainer_chat_view.dart';
import '../../nutrition/data/coaching_repository.dart';
import 'assign_plans_view.dart';
import 'trainer_diet_plan_view.dart';
import '../../../l10n/l10n.dart';
import '../../../app/theme/repsi_palette.dart';

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
              RepsiAvatar(name: name, size: 56),
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
            Text(context.l10n.openFromMyClients, style: AppTypography.bodySecondary)
          else ...[
            _ClientGoalCard(memberId: id),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(
                child: FilledButton.icon(
                  icon: const Icon(Icons.chat_bubble_outline),
                  label: Text(context.l10n.message),
                  onPressed: () => Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => TrainerChatView(memberId: id, asTrainer: true))),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton.icon(
                  icon: const Icon(Icons.restaurant_menu),
                  label: Text(context.l10n.dietPlan),
                  onPressed: () => Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => TrainerDietPlanView(memberId: id, memberName: name))),
                ),
              ),
            ]),
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                icon: const Icon(Icons.assignment_add),
                label: Text(context.l10n.assignPlans),
                onPressed: () => Navigator.of(context).push(MaterialPageRoute(
                    builder: (_) => AssignPlansView(memberId: id, memberName: name))),
              ),
            ),
            const SizedBox(height: 12),
            FutureBuilder<Map<String, dynamic>?>(
              future: ref.read(coachingRepositoryProvider).adherence(id),
              builder: (context, snap) {
                final a = snap.data;
                if (snap.connectionState != ConnectionState.done) return const LinearProgressIndicator();
                if (snap.hasError) return Text(context.l10n.errorLoadAdherence, style: AppTypography.caption);
                if (a == null || (a['planned_meals'] as num? ?? 0) == 0) {
                  return Text(context.l10n.noDietPlan, style: AppTypography.bodySecondary);
                }
                return RepsiCard(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(context.l10n.dietAdherenceTitle, style: AppTypography.sectionHeading),
                    const SizedBox(height: 4),
                    Text('${a['adherence_pct'] ?? '—'}%', style: AppTypography.display),
                    Text(
                      context.l10n.dietAdherence('${a['followed']}', '${a['modified']}', '${a['skipped']}', '${a['not_logged']}'),
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


/// The member's current goal, as they set it in the app.
class _ClientGoalCard extends ConsumerWidget {
  final String memberId;
  const _ClientGoalCard({required this.memberId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l = context.l10n;
    final palette = context.palette;
    final goal = ref.watch(memberGoalProvider(memberId));
    return RepsiCard(
      child: goal.when(
        loading: () => const SizedBox(height: 40, child: Center(child: CircularProgressIndicator(strokeWidth: 2))),
        error: (_, __) => Text(l.errorGeneric, style: AppTypography.caption),
        data: (g) => g == null
            ? Row(children: [
                Icon(Icons.flag_outlined, color: palette.textMuted),
                const SizedBox(width: 10),
                Expanded(child: Text(l.clientNoGoal, style: AppTypography.bodySecondary.copyWith(color: palette.textSecondary))),
              ])
            : Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(l.yourGoal.toUpperCase(),
                    style: AppTypography.caption.copyWith(
                        color: palette.textSecondary, fontWeight: FontWeight.w700, letterSpacing: 0.8)),
                const SizedBox(height: 6),
                Row(children: [
                  Icon(g.goal.icon, color: g.goal.color),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(g.goal.label(l),
                        style: AppTypography.sectionHeading.copyWith(fontSize: 17, color: palette.text)),
                  ),
                ]),
                const SizedBox(height: 8),
                Text(
                  [g.level.label(l), l.daysPerWeekValue(g.daysPerWeek), l.unitMinutes(g.sessionMinutes)].join(' · '),
                  style: AppTypography.caption.copyWith(color: palette.textSecondary),
                ),
                if (g.focusAreas.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Wrap(spacing: 6, runSpacing: 6, children: [
                    for (final f in g.focusAreas)
                      Chip(
                        label: Text(focusAreaLabel(l, f)),
                        visualDensity: VisualDensity.compact,
                        materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                  ]),
                ],
              ]),
      ),
    );
  }
}
