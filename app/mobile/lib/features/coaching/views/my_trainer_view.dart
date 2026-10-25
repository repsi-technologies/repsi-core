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
import '../../../shared/widgets/repsi_error_state.dart';
import '../../../shared/widgets/repsi_skeleton.dart';
import '../../member/presentation/views/trainer_chat_view.dart';
import '../../nutrition/data/coaching_repository.dart';
import '../data/coaching_api.dart';
import '../data/coaching_models.dart';

/// Member: assigned trainer(s), chat, and requests for a trainer or personal training.
class MyTrainerView extends ConsumerWidget {
  const MyTrainerView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l = context.l10n;
    final palette = context.palette;
    final data = ref.watch(coachingOverviewProvider);

    return Scaffold(
      backgroundColor: palette.background,
      appBar: AppBar(
        backgroundColor: palette.background,
        title: Text(l.myTrainer, style: AppTypography.heading.copyWith(fontSize: 20, fontWeight: FontWeight.w700)),
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(coachingOverviewProvider);
          await ref.read(coachingOverviewProvider.future).then((_) {}, onError: (_) {});
        },
        child: data.when(
          loading: () => ListView(padding: AppSpacing.pagePadding, children: const [
            RepsiSkeleton(height: 180),
            SizedBox(height: 16),
            RepsiSkeleton(height: 96),
          ]),
          error: (e, _) => ListView(children: [
            const SizedBox(height: 80),
            RepsiErrorState(
              message: e is ApiError ? e.message : l.errorLoadTrainer,
              onRetry: () => ref.invalidate(coachingOverviewProvider),
            ),
          ]),
          data: (o) {
            final pending = o.pendingRequest;
            final history = o.requests.where((r) => !r.isPending).toList();
            var i = 0;
            return ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(AppSpacing.pageHorizontalPadding, 4, AppSpacing.pageHorizontalPadding, 32),
              children: [
                if (o.trainers.isEmpty && pending == null)
                  RepsiStaggerItem(index: i++, child: _NoTrainerHero(onRequest: () => showTrainerRequestSheet(context, ref))),
                for (final t in o.trainers)
                  RepsiStaggerItem(
                    index: i++,
                    child: Padding(padding: const EdgeInsets.only(bottom: 12), child: TrainerProfileCard(trainer: t)),
                  ),
                if (pending != null)
                  RepsiStaggerItem(index: i++, child: _PendingRequestCard(request: pending)),
                if (pending == null && o.trainers.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  RepsiStaggerItem(
                    index: i++,
                    child: _RequestMoreCard(onTap: () => showTrainerRequestSheet(context, ref, defaultKind: 'personal_training')),
                  ),
                ],
                if (history.isNotEmpty) ...[
                  const SizedBox(height: 24),
                  Text(l.requestHistory, style: AppTypography.sectionHeading.copyWith(color: palette.text)),
                  const SizedBox(height: 8),
                  for (final r in history)
                    RepsiStaggerItem(
                      index: i++,
                      child: Padding(padding: const EdgeInsets.only(bottom: 8), child: _HistoryRow(request: r)),
                    ),
                ],
              ],
            );
          },
        ),
      ),
    );
  }
}

class TrainerProfileCard extends ConsumerStatefulWidget {
  final CoachProfile trainer;
  const TrainerProfileCard({super.key, required this.trainer});

  @override
  ConsumerState<TrainerProfileCard> createState() => _TrainerProfileCardState();
}

class _TrainerProfileCardState extends ConsumerState<TrainerProfileCard> {
  bool _opening = false;

  Future<void> _message() async {
    setState(() => _opening = true);
    try {
      final conv = await ref.read(coachingRepositoryProvider).openWithTrainer(widget.trainer.id);
      if (!mounted) return;
      await Navigator.of(context).push(MaterialPageRoute(builder: (_) => ChatThreadView(conversation: conv, asTrainer: false)));
      ref.invalidate(conversationsProvider);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(e is ApiError ? e.message : context.l10n.errorOpenChat)));
      }
    } finally {
      if (mounted) setState(() => _opening = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final palette = context.palette;
    final t = widget.trainer;
    return Container(
      decoration: BoxDecoration(
        color: palette.surface,
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        border: Border.all(color: palette.border),
        boxShadow: [BoxShadow(color: palette.shadow, blurRadius: 16, offset: const Offset(0, 6))],
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            height: 64,
            decoration: const BoxDecoration(
              gradient: LinearGradient(colors: AppColors.energyGradient, begin: Alignment.topLeft, end: Alignment.bottomRight),
            ),
            alignment: Alignment.topRight,
            padding: const EdgeInsets.all(10),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.18), borderRadius: BorderRadius.circular(999)),
              child: Text(l.yourTrainer,
                  style: AppTypography.caption.copyWith(color: Colors.white, fontWeight: FontWeight.w700)),
            ),
          ),
          Transform.translate(
            offset: const Offset(0, -28),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: palette.surface, width: 4)),
                    child: RepsiAvatar(name: t.name, imageUrl: t.photoUrl, size: 64),
                  ),
                  const SizedBox(height: 8),
                  Text(t.name, style: AppTypography.heading.copyWith(fontSize: 20, fontWeight: FontWeight.w800, color: palette.text)),
                  if (t.specialization != null || t.experience != null) ...[
                    const SizedBox(height: 4),
                    Text([t.specialization, t.experience].whereType<String>().join(' · '),
                        style: AppTypography.bodySmall.copyWith(color: palette.textSecondary)),
                  ],
                  if (t.bio != null) ...[
                    const SizedBox(height: 10),
                    Text(t.bio!,
                        maxLines: 4,
                        overflow: TextOverflow.ellipsis,
                        style: AppTypography.bodySmall.copyWith(color: palette.text, height: 1.45)),
                  ],
                  const SizedBox(height: 14),
                  RepsiButton(
                    text: l.messageTrainer,
                    isFullWidth: true,
                    isLoading: _opening,
                    leadingIcon: const Icon(Icons.chat_bubble_rounded, size: 18),
                    onPressed: _message,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _NoTrainerHero extends StatelessWidget {
  final VoidCallback onRequest;
  const _NoTrainerHero({required this.onRequest});

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        gradient: const LinearGradient(colors: AppColors.inkGradient, begin: Alignment.topLeft, end: Alignment.bottomRight),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: const BoxDecoration(
                shape: BoxShape.circle, gradient: LinearGradient(colors: AppColors.energyGradient)),
            child: const Icon(Icons.sports_rounded, color: Colors.white, size: 26),
          ),
          const SizedBox(height: 16),
          Text(l.noTrainerTitle,
              style: AppTypography.heading.copyWith(color: AppColors.inkText, fontSize: 22, fontWeight: FontWeight.w800)),
          const SizedBox(height: 6),
          Text(l.noTrainerMessage, style: AppTypography.bodySmall.copyWith(color: AppColors.inkTextSecondary, height: 1.45)),
          const SizedBox(height: 16),
          for (final perk in [l.trainerPerkPlan, l.trainerPerkChat, l.trainerPerkProgress])
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(children: [
                const Icon(Icons.check_circle_rounded, color: AppColors.primaryBright, size: 18),
                const SizedBox(width: 8),
                Expanded(child: Text(perk, style: AppTypography.bodySmall.copyWith(color: AppColors.inkText))),
              ]),
            ),
          const SizedBox(height: 8),
          RepsiButton(
            text: l.requestATrainer,
            isFullWidth: true,
            leadingIcon: const Icon(Icons.person_add_alt_1_rounded, size: 18),
            onPressed: onRequest,
          ),
        ],
      ),
    );
  }
}

class _RequestMoreCard extends StatelessWidget {
  final VoidCallback onTap;
  const _RequestMoreCard({required this.onTap});

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final palette = context.palette;
    return Material(
      color: palette.surface,
      shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusCard), side: BorderSide(color: palette.border)),
      child: ListTile(
        onTap: onTap,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        leading: CircleAvatar(
            backgroundColor: palette.primarySoft, child: const Icon(Icons.bolt_rounded, color: AppColors.primary)),
        title: Text(l.requestPersonalTraining, style: AppTypography.bodySmall.copyWith(fontWeight: FontWeight.w700, color: palette.text)),
        subtitle: Text(l.requestPersonalTrainingHint, style: AppTypography.caption.copyWith(color: palette.textSecondary)),
        trailing: Icon(Icons.chevron_right_rounded, color: palette.textMuted),
      ),
    );
  }
}

class _PendingRequestCard extends ConsumerStatefulWidget {
  final TrainerRequestItem request;
  const _PendingRequestCard({required this.request});

  @override
  ConsumerState<_PendingRequestCard> createState() => _PendingRequestCardState();
}

class _PendingRequestCardState extends ConsumerState<_PendingRequestCard> {
  bool _busy = false;

  Future<void> _cancel() async {
    final l = context.l10n;
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(l.cancelRequestTitle),
        content: Text(l.cancelRequestBody),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(l.commonBack)),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: Text(l.cancelRequest)),
        ],
      ),
    );
    if (ok != true) return;
    setState(() => _busy = true);
    try {
      await ref.read(coachingApiProvider).cancelRequest(widget.request.id);
      ref.invalidate(coachingOverviewProvider);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e is ApiError ? e.message : l.errorGeneric)));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final palette = context.palette;
    final r = widget.request;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: palette.warningSoft,
        borderRadius: BorderRadius.circular(AppSpacing.radiusCard),
        border: Border.all(color: palette.warning.withValues(alpha: 0.35)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            _PulsingDot(color: palette.warningDark),
            const SizedBox(width: 10),
            Expanded(
              child: Text(l.requestPendingTitle,
                  style: AppTypography.sectionHeading.copyWith(fontSize: 16, color: palette.text)),
            ),
          ]),
          const SizedBox(height: 8),
          Text(
            [
              r.isPersonalTraining ? l.requestKindPt : l.requestKindTrainer,
              if (r.preferredTrainerName != null) l.preferredTrainerValue(r.preferredTrainerName!),
              if (r.createdAt != null) L10n.date(r.createdAt!),
            ].join(' · '),
            style: AppTypography.caption.copyWith(color: palette.textSecondary),
          ),
          const SizedBox(height: 6),
          Text(l.requestPendingBody, style: AppTypography.bodySmall.copyWith(color: palette.text, height: 1.4)),
          const SizedBox(height: 10),
          Align(
            alignment: AlignmentDirectional.centerEnd,
            child: TextButton(onPressed: _busy ? null : _cancel, child: Text(l.cancelRequest)),
          ),
        ],
      ),
    );
  }
}

class _PulsingDot extends StatefulWidget {
  final Color color;
  const _PulsingDot({required this.color});

  @override
  State<_PulsingDot> createState() => _PulsingDotState();
}

class _PulsingDotState extends State<_PulsingDot> with SingleTickerProviderStateMixin {
  late final AnimationController _c =
      AnimationController(vsync: this, duration: const Duration(milliseconds: 1200))..repeat();

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => SizedBox.square(
        dimension: 18,
        child: AnimatedBuilder(
          animation: _c,
          builder: (_, __) => Stack(alignment: Alignment.center, children: [
            Container(
              width: 8 + 10 * _c.value,
              height: 8 + 10 * _c.value,
              decoration: BoxDecoration(shape: BoxShape.circle, color: widget.color.withValues(alpha: 0.35 * (1 - _c.value))),
            ),
            Container(width: 8, height: 8, decoration: BoxDecoration(shape: BoxShape.circle, color: widget.color)),
          ]),
        ),
      );
}

class _HistoryRow extends StatelessWidget {
  final TrainerRequestItem request;
  const _HistoryRow({required this.request});

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final palette = context.palette;
    final r = request;
    final (label, fg, bg) = switch (r.status) {
      'approved' => (l.requestApproved, palette.successDark, palette.successSoft),
      'declined' => (l.requestDeclined, palette.errorDark, palette.errorSoft),
      _ => (l.requestCancelled, palette.textSecondary, palette.surfaceSecondary),
    };
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: palette.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: palette.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Expanded(
              child: Text(r.isPersonalTraining ? l.requestKindPt : l.requestKindTrainer,
                  style: AppTypography.bodySmall.copyWith(fontWeight: FontWeight.w700, color: palette.text)),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(999)),
              child: Text(label, style: AppTypography.caption.copyWith(color: fg, fontWeight: FontWeight.w700)),
            ),
          ]),
          if (r.createdAt != null) ...[
            const SizedBox(height: 2),
            Text(L10n.date(r.createdAt!), style: AppTypography.caption.copyWith(color: palette.textSecondary)),
          ],
          if (r.assignedTrainerName != null) ...[
            const SizedBox(height: 6),
            Text(l.assignedTrainerValue(r.assignedTrainerName!),
                style: AppTypography.bodySmall.copyWith(color: palette.text)),
          ],
          if (r.resolutionNote != null && r.status == 'declined') ...[
            const SizedBox(height: 6),
            Text('“${r.resolutionNote!}”', style: AppTypography.bodySmall.copyWith(color: palette.textSecondary)),
          ],
        ],
      ),
    );
  }
}

/// Bottom sheet to ask the gym for a trainer or personal training, optionally naming a trainer.
Future<void> showTrainerRequestSheet(BuildContext context, WidgetRef ref, {String defaultKind = 'trainer'}) async {
  final sent = await showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: context.palette.surface,
    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(AppSpacing.radiusSheet))),
    builder: (_) => _RequestSheet(defaultKind: defaultKind),
  );
  if (sent == true && context.mounted) {
    ref.invalidate(coachingOverviewProvider);
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(context.l10n.requestSent)));
  }
}

class _RequestSheet extends ConsumerStatefulWidget {
  final String defaultKind;
  const _RequestSheet({required this.defaultKind});

  @override
  ConsumerState<_RequestSheet> createState() => _RequestSheetState();
}

class _RequestSheetState extends ConsumerState<_RequestSheet> {
  late String _kind = widget.defaultKind;
  String? _trainerId;
  final _message = TextEditingController();
  bool _sending = false;

  @override
  void dispose() {
    _message.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    setState(() => _sending = true);
    try {
      await ref.read(coachingApiProvider).createRequest(kind: _kind, trainerId: _trainerId, message: _message.text);
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) return;
      setState(() => _sending = false);
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(e is ApiError ? e.message : context.l10n.errorGeneric)));
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final palette = context.palette;
    final trainers = ref.watch(availableTrainersProvider);
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                  width: 40, height: 4, decoration: BoxDecoration(color: palette.border, borderRadius: BorderRadius.circular(2))),
            ),
            const SizedBox(height: 16),
            Text(l.requestSheetTitle, style: AppTypography.heading.copyWith(fontSize: 20, fontWeight: FontWeight.w800, color: palette.text)),
            const SizedBox(height: 4),
            Text(l.requestSheetSubtitle, style: AppTypography.caption.copyWith(color: palette.textSecondary)),
            const SizedBox(height: 16),
            SegmentedButton<String>(
              segments: [
                ButtonSegment(value: 'trainer', label: Text(l.requestKindTrainer), icon: const Icon(Icons.person_rounded)),
                ButtonSegment(value: 'personal_training', label: Text(l.requestKindPt), icon: const Icon(Icons.bolt_rounded)),
              ],
              selected: {_kind},
              showSelectedIcon: false,
              onSelectionChanged: (s) => setState(() => _kind = s.first),
            ),
            const SizedBox(height: 20),
            Text(l.preferredTrainerOptional, style: AppTypography.sectionHeading.copyWith(fontSize: 15, color: palette.text)),
            const SizedBox(height: 8),
            trainers.when(
              loading: () => const RepsiSkeleton(height: 56),
              error: (e, _) => Text(e is ApiError ? e.message : l.errorGeneric,
                  style: AppTypography.caption.copyWith(color: palette.error)),
              data: (list) => Column(children: [
                _TrainerOption(
                  title: l.anyTrainer,
                  subtitle: l.anyTrainerHint,
                  selected: _trainerId == null,
                  onTap: () => setState(() => _trainerId = null),
                ),
                for (final t in list)
                  _TrainerOption(
                    title: t.name,
                    subtitle: [t.specialization, if (!t.acceptingClients) l.trainerFull].whereType<String>().join(' · '),
                    avatar: RepsiAvatar(name: t.name, imageUrl: t.photoUrl, size: 36),
                    selected: _trainerId == t.id,
                    onTap: () => setState(() => _trainerId = t.id),
                  ),
              ]),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _message,
              maxLength: 1000,
              minLines: 2,
              maxLines: 4,
              decoration: InputDecoration(hintText: l.requestMessageHint, counterText: ''),
            ),
            const SizedBox(height: 16),
            RepsiButton(
              text: l.sendRequest,
              isFullWidth: true,
              isLoading: _sending,
              leadingIcon: const Icon(Icons.send_rounded, size: 18),
              onPressed: _send,
            ),
          ],
        ),
      ),
    );
  }
}

class _TrainerOption extends StatelessWidget {
  final String title;
  final String subtitle;
  final Widget? avatar;
  final bool selected;
  final VoidCallback onTap;
  const _TrainerOption({required this.title, required this.subtitle, this.avatar, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Material(
        color: selected ? palette.primarySoft : Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(color: selected ? AppColors.primary : palette.border, width: selected ? 1.5 : 1),
        ),
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            child: Row(children: [
              avatar ??
                  CircleAvatar(
                      radius: 18,
                      backgroundColor: palette.surfaceSecondary,
                      child: Icon(Icons.shuffle_rounded, size: 18, color: palette.textSecondary)),
              const SizedBox(width: 12),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(title, style: AppTypography.bodySmall.copyWith(fontWeight: FontWeight.w700, color: palette.text)),
                  if (subtitle.isNotEmpty)
                    Text(subtitle,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppTypography.caption.copyWith(color: palette.textSecondary)),
                ]),
              ),
              Icon(selected ? Icons.radio_button_checked_rounded : Icons.radio_button_off_rounded,
                  color: selected ? AppColors.primary : palette.textMuted),
            ]),
          ),
        ),
      ),
    );
  }
}
