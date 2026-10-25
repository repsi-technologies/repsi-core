import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/repsi_palette.dart';
import '../../../core/api/api_error.dart';
import '../../../l10n/l10n.dart';
import '../../../shared/animations/repsi_stagger.dart';
import '../../../shared/widgets/repsi_avatar.dart';
import '../../../shared/widgets/repsi_button.dart';
import '../../../shared/widgets/repsi_empty_state.dart';
import '../../../shared/widgets/repsi_error_state.dart';
import '../../../shared/widgets/repsi_skeleton.dart';
import '../coaching_labels.dart';
import '../data/coaching_api.dart';
import '../data/coaching_models.dart';

final _gymTrainersProvider =
    FutureProvider.autoDispose<List<CoachProfile>>((ref) => ref.watch(coachingApiProvider).gymTrainers());

/// Owner / manager: members asking for a trainer or personal training.
class TrainerRequestsView extends ConsumerWidget {
  const TrainerRequestsView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l = context.l10n;
    final palette = context.palette;
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        backgroundColor: palette.background,
        appBar: AppBar(
          title: Text(l.trainerRequests),
          bottom: TabBar(tabs: [Tab(text: l.requestTabPending), Tab(text: l.requestTabAll)]),
        ),
        body: const TabBarView(children: [_RequestList(status: 'pending'), _RequestList(status: null)]),
      ),
    );
  }
}

class _RequestList extends ConsumerWidget {
  final String? status;
  const _RequestList({required this.status});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l = context.l10n;
    final page = ref.watch(trainerRequestsProvider(status));
    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(trainerRequestsProvider(status));
        await ref.read(trainerRequestsProvider(status).future).then((_) {}, onError: (_) {});
      },
      child: page.when(
        loading: () => ListView(padding: AppSpacing.pagePadding, children: const [
          RepsiSkeleton(height: 140),
          SizedBox(height: 12),
          RepsiSkeleton(height: 140),
        ]),
        error: (e, _) => ListView(children: [
          const SizedBox(height: 80),
          RepsiErrorState(
            message: e is ApiError ? e.message : l.errorGeneric,
            onRetry: () => ref.invalidate(trainerRequestsProvider(status)),
          ),
        ]),
        data: (p) => p.items.isEmpty
            ? ListView(children: [
                const SizedBox(height: 60),
                RepsiEmptyState(
                  icon: Icons.inbox_rounded,
                  title: status == 'pending' ? l.noPendingRequests : l.noRequests,
                  message: l.noRequestsMessage,
                ),
              ])
            : ListView.separated(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: AppSpacing.pagePadding,
                itemCount: p.items.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (_, i) => RepsiStaggerItem(index: i, child: _RequestCard(request: p.items[i])),
              ),
      ),
    );
  }
}

class _RequestCard extends ConsumerStatefulWidget {
  final TrainerRequestItem request;
  const _RequestCard({required this.request});

  @override
  ConsumerState<_RequestCard> createState() => _RequestCardState();
}

class _RequestCardState extends ConsumerState<_RequestCard> {
  bool _busy = false;

  void _refresh() {
    ref.invalidate(trainerRequestsProvider('pending'));
    ref.invalidate(trainerRequestsProvider(null));
  }

  Future<void> _run(Future<void> Function() action, String done) async {
    setState(() => _busy = true);
    try {
      await action();
      _refresh();
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(done)));
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(e is ApiError ? e.message : context.l10n.errorGeneric)));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _approve() async {
    final l = context.l10n;
    final trainerId = await showModalBottomSheet<String>(
      context: context,
      useSafeArea: true,
      isScrollControlled: true,
      backgroundColor: context.palette.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(AppSpacing.radiusSheet))),
      builder: (_) => _PickTrainerSheet(preferredId: widget.request.preferredTrainerId),
    );
    if (trainerId == null) return;
    await _run(() => ref.read(coachingApiProvider).approve(widget.request.id, trainerId), l.requestApprovedToast);
  }

  Future<void> _decline() async {
    final l = context.l10n;
    final note = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(l.declineRequestTitle),
        content: TextField(
          controller: note,
          maxLength: 1000,
          minLines: 2,
          maxLines: 4,
          decoration: InputDecoration(hintText: l.declineReasonHint),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(l.commonCancel)),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: Text(l.decline)),
        ],
      ),
    );
    final text = note.text.trim();
    note.dispose();
    if (ok != true) return;
    await _run(() => ref.read(coachingApiProvider).decline(widget.request.id, note: text), l.requestDeclinedToast);
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final palette = context.palette;
    final r = widget.request;
    final g = r.memberGoal;
    final (statusLabel, fg, bg) = switch (r.status) {
      'pending' => (l.requestStatusPending, palette.warningDark, palette.warningSoft),
      'approved' => (l.requestApproved, palette.successDark, palette.successSoft),
      'declined' => (l.requestDeclined, palette.errorDark, palette.errorSoft),
      _ => (l.requestCancelled, palette.textSecondary, palette.surfaceSecondary),
    };
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: palette.surface,
        borderRadius: BorderRadius.circular(AppSpacing.radiusCard),
        border: Border.all(color: palette.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            RepsiAvatar(name: r.memberName, size: 40),
            const SizedBox(width: 12),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(r.memberName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppTypography.sectionHeading.copyWith(fontSize: 16, color: palette.text)),
                Text(
                  [r.isPersonalTraining ? l.requestKindPt : l.requestKindTrainer, if (r.createdAt != null) L10n.date(r.createdAt!)]
                      .join(' · '),
                  style: AppTypography.caption.copyWith(color: palette.textSecondary),
                ),
              ]),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(999)),
              child: Text(statusLabel, style: AppTypography.caption.copyWith(color: fg, fontWeight: FontWeight.w700)),
            ),
          ]),
          if (g != null) ...[
            const SizedBox(height: 12),
            Wrap(spacing: 6, runSpacing: 6, children: [
              _Chip(icon: g.goal.icon, text: g.goal.label(l), color: g.goal.color),
              _Chip(icon: Icons.signal_cellular_alt_rounded, text: g.level.label(l)),
              _Chip(icon: Icons.calendar_today_rounded, text: l.daysPerWeekValue(g.daysPerWeek)),
            ]),
          ],
          if (r.preferredTrainerName != null) ...[
            const SizedBox(height: 10),
            Text(l.preferredTrainerValue(r.preferredTrainerName!),
                style: AppTypography.bodySmall.copyWith(color: palette.text)),
          ],
          if (r.assignedTrainerName != null) ...[
            const SizedBox(height: 6),
            Text(l.assignedTrainerValue(r.assignedTrainerName!),
                style: AppTypography.bodySmall.copyWith(color: palette.successDark, fontWeight: FontWeight.w600)),
          ],
          if (r.message != null) ...[
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: palette.surfaceSecondary, borderRadius: BorderRadius.circular(10)),
              child: Text(r.message!, style: AppTypography.bodySmall.copyWith(color: palette.text, height: 1.4)),
            ),
          ],
          if (r.isPending) ...[
            const SizedBox(height: 14),
            Row(children: [
              Expanded(
                child: RepsiButton(
                  text: l.decline,
                  variant: RepsiButtonVariant.outline,
                  onPressed: _busy ? null : _decline,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: RepsiButton(
                  text: l.assignTrainer,
                  isLoading: _busy,
                  onPressed: _busy ? null : _approve,
                ),
              ),
            ]),
          ],
        ],
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  final IconData icon;
  final String text;
  final Color? color;
  const _Chip({required this.icon, required this.text, this.color});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final c = color ?? palette.textSecondary;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(color: c.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(999)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, size: 14, color: c),
        const SizedBox(width: 4),
        Text(text, style: AppTypography.caption.copyWith(color: color ?? palette.text, fontWeight: FontWeight.w600)),
      ]),
    );
  }
}

class _PickTrainerSheet extends ConsumerStatefulWidget {
  final String? preferredId;
  const _PickTrainerSheet({this.preferredId});

  @override
  ConsumerState<_PickTrainerSheet> createState() => _PickTrainerSheetState();
}

class _PickTrainerSheetState extends ConsumerState<_PickTrainerSheet> {
  late String? _selected = widget.preferredId;

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final palette = context.palette;
    final trainers = ref.watch(_gymTrainersProvider);
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(l.chooseTrainer, style: AppTypography.heading.copyWith(fontSize: 20, fontWeight: FontWeight.w800, color: palette.text)),
            const SizedBox(height: 12),
            Flexible(
              child: trainers.when(
                loading: () => const RepsiSkeleton(height: 120),
                error: (e, _) => Text(e is ApiError ? e.message : l.errorGeneric),
                data: (list) => list.isEmpty
                    ? Text(l.noActiveTrainers, style: AppTypography.bodySecondary)
                    : ListView(
                        shrinkWrap: true,
                        children: [
                          for (final t in list)
                            ListTile(
                              onTap: () => setState(() => _selected = t.id),
                              selected: _selected == t.id,
                              contentPadding: EdgeInsets.zero,
                              leading: RepsiAvatar(name: t.name, imageUrl: t.photoUrl, size: 36),
                              title: Text(t.name),
                              subtitle: Text([
                                if (t.id == widget.preferredId) l.memberPreferred,
                                if (t.specialization != null) t.specialization!,
                              ].join(' · ')),
                              trailing: Icon(
                                _selected == t.id ? Icons.radio_button_checked_rounded : Icons.radio_button_off_rounded,
                                color: _selected == t.id ? AppColors.primary : palette.textMuted,
                              ),
                            ),
                        ],
                      ),
              ),
            ),
            const SizedBox(height: 12),
            RepsiButton(
              text: l.assignTrainer,
              isFullWidth: true,
              onPressed: _selected == null ? null : () => Navigator.of(context).pop(_selected),
            ),
          ],
        ),
      ),
    );
  }
}
