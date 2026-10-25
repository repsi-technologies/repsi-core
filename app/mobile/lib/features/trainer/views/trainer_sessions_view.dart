import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/repsi_palette.dart';
import '../../../core/api/api_error.dart';
import '../../../l10n/l10n.dart';
import '../../../shared/animations/repsi_stagger.dart';
import '../../../shared/widgets/repsi_card.dart';
import '../../../shared/widgets/repsi_empty_state.dart';
import '../../../shared/widgets/repsi_error_state.dart';
import '../../../shared/widgets/repsi_skeleton.dart';
import '../data/trainer_schedule.dart';
import 'trainer_home_view.dart' show SessionTile;

/// Trainer schedule from `/trainers/me/schedule`: upcoming and past PT sessions, plus classes.
class TrainerSessionsView extends ConsumerStatefulWidget {
  const TrainerSessionsView({super.key});

  @override
  ConsumerState<TrainerSessionsView> createState() => _TrainerSessionsViewState();
}

class _TrainerSessionsViewState extends ConsumerState<TrainerSessionsView> {
  bool _past = false;

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final palette = context.palette;
    final schedule = ref.watch(trainerScheduleProvider);
    return Scaffold(
      backgroundColor: palette.background,
      appBar: AppBar(
        backgroundColor: palette.background,
        title: Text(l.mySchedule, style: AppTypography.heading.copyWith(fontSize: 20, fontWeight: FontWeight.w700)),
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(trainerScheduleProvider);
          await ref.read(trainerScheduleProvider.future).then((_) {}, onError: (_) {});
        },
        child: schedule.when(
          loading: () => ListView(padding: AppSpacing.pagePadding, children: const [
            RepsiSkeleton(height: 44),
            SizedBox(height: 12),
            RepsiSkeleton(height: 72),
            SizedBox(height: 8),
            RepsiSkeleton(height: 72),
          ]),
          error: (e, _) => ListView(children: [
            const SizedBox(height: 80),
            RepsiErrorState(
                message: e is ApiError ? e.message : l.errorLoadSchedule, onRetry: () => ref.invalidate(trainerScheduleProvider)),
          ]),
          data: (s) {
            final now = DateTime.now();
            final upcoming = s.upcoming(now);
            final past = s.sessions.where((x) => !upcoming.contains(x)).toList().reversed.take(30).toList();
            final shown = _past ? past : upcoming;
            final groups = <DateTime, List<TrainerSessionItem>>{};
            for (final x in shown) {
              groups.putIfAbsent(DateTime(x.scheduledAt.year, x.scheduledAt.month, x.scheduledAt.day), () => []).add(x);
            }
            var i = 0;
            return ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(AppSpacing.pageHorizontalPadding, 4, AppSpacing.pageHorizontalPadding, 24),
              children: [
                SegmentedButton<bool>(
                  segments: [
                    ButtonSegment(value: false, label: Text(l.upcoming)),
                    ButtonSegment(value: true, label: Text(l.past)),
                  ],
                  selected: {_past},
                  showSelectedIcon: false,
                  onSelectionChanged: (v) => setState(() => _past = v.first),
                ),
                const SizedBox(height: 16),
                if (shown.isEmpty)
                  RepsiEmptyState(
                    icon: Icons.event_available_rounded,
                    title: _past ? l.noPastSessions : l.noUpcomingSessions,
                    message: l.sessionsBookedHint,
                  ),
                for (final entry in groups.entries) ...[
                  Padding(
                    padding: const EdgeInsets.only(top: 8, bottom: 8),
                    child: Text(_dayLabel(l, entry.key, now),
                        style: AppTypography.caption.copyWith(
                            color: palette.textSecondary, fontWeight: FontWeight.w800, letterSpacing: 0.6)),
                  ),
                  for (final x in entry.value)
                    RepsiStaggerItem(
                      index: i++,
                      delay: const Duration(milliseconds: 40),
                      child: Padding(padding: const EdgeInsets.only(bottom: 8), child: SessionTile(session: x)),
                    ),
                ],
                if (s.classes.isNotEmpty && !_past) ...[
                  const SizedBox(height: 16),
                  Text(l.myClasses, style: AppTypography.sectionHeading.copyWith(color: palette.text)),
                  const SizedBox(height: 8),
                  for (final c in s.classes)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: RepsiCard(
                        padding: const EdgeInsets.all(14),
                        child: Row(children: [
                          Icon(Icons.groups_rounded, color: palette.primaryDark),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Text(c.title, style: AppTypography.bodySmall.copyWith(fontWeight: FontWeight.w700, color: palette.text)),
                              Text([c.schedule, l.unitMinutes(c.durationMinutes), if (c.room != null) c.room!].join(' · '),
                                  style: AppTypography.caption.copyWith(color: palette.textSecondary)),
                            ]),
                          ),
                        ]),
                      ),
                    ),
                ],
              ],
            );
          },
        ),
      ),
    );
  }

  String _dayLabel(AppLocalizations l, DateTime day, DateTime now) {
    final today = DateTime(now.year, now.month, now.day);
    final diff = day.difference(today).inDays;
    if (diff == 0) return l.commonToday.toUpperCase();
    if (diff == 1) return l.tomorrow.toUpperCase();
    if (diff == -1) return l.yesterday.toUpperCase();
    return DateFormat.MMMEd(L10n.localeName).format(day).toUpperCase();
  }
}
