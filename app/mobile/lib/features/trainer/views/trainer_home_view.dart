import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../app/routes/route_names.dart';
import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/repsi_palette.dart';
import '../../../l10n/l10n.dart';
import '../../../shared/animations/repsi_stagger.dart';
import '../../../shared/widgets/repsi_avatar.dart';
import '../../../shared/widgets/repsi_card.dart';
import '../../../shared/widgets/repsi_skeleton.dart';
import '../../auth/providers/auth_provider.dart';
import '../../member/presentation/views/trainer_chat_view.dart';
import '../../nutrition/data/coaching_repository.dart';
import '../data/trainer_schedule.dart';
import 'trainer_client_detail_view.dart';

/// Trainer dashboard: today's sessions, unread messages and clients, all from the API.
class TrainerHomeView extends ConsumerWidget {
  /// Switches the trainer shell to another tab (1 clients, 2 schedule, 3 messages).
  final ValueChanged<int>? onSelectTab;

  const TrainerHomeView({super.key, this.onSelectTab});

  String _greeting(AppLocalizations l) {
    final hour = DateTime.now().hour;
    if (hour < 12) return l.greetingMorning;
    if (hour < 17) return l.greetingAfternoon;
    return l.greetingEvening;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l = context.l10n;
    final palette = context.palette;
    final name = ref.watch(authProvider.select((s) => s.user?.fullName)) ?? '';
    final firstName = name.trim().split(' ').firstOrNull ?? '';
    final schedule = ref.watch(trainerScheduleProvider);
    final clients = ref.watch(trainerClientsProvider);
    final convs = ref.watch(conversationsProvider);
    final now = DateTime.now();
    final today = schedule.valueOrNull?.sessionsOn(now) ?? const <TrainerSessionItem>[];
    final unread = convs.valueOrNull?.fold<int>(0, (s, c) => s + c.unread) ?? 0;
    var i = 0;

    return Scaffold(
      backgroundColor: palette.background,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(trainerScheduleProvider);
            ref.invalidate(trainerClientsProvider);
            ref.invalidate(conversationsProvider);
            await ref.read(trainerScheduleProvider.future).then((_) {}, onError: (_) {});
          },
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(AppSpacing.pageHorizontalPadding, 12, AppSpacing.pageHorizontalPadding, 24),
            children: [
              RepsiStaggerItem(
                index: i++,
                child: Row(children: [
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(_greeting(l),
                          style: AppTypography.caption.copyWith(color: palette.textSecondary, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 2),
                      Text(firstName.isEmpty ? l.commonTrainer : firstName,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppTypography.heading.copyWith(fontSize: 26, fontWeight: FontWeight.w800, color: palette.text)),
                    ]),
                  ),
                  IconButton.filledTonal(
                    tooltip: l.commonNotifications,
                    style: IconButton.styleFrom(backgroundColor: palette.surface, minimumSize: const Size(48, 48)),
                    onPressed: () => context.push(RouteNames.notifications),
                    icon: Icon(Icons.notifications_none_rounded, color: palette.text),
                  ),
                ]),
              ),
              const SizedBox(height: 16),
              RepsiStaggerItem(
                index: i++,
                child: Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
                    gradient: const LinearGradient(
                        colors: AppColors.energyGradient, begin: Alignment.topLeft, end: Alignment.bottomRight),
                    boxShadow: [BoxShadow(color: AppColors.primary.withValues(alpha: 0.3), blurRadius: 24, offset: const Offset(0, 10))],
                  ),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(DateFormat.MMMMEEEEd(L10n.localeName).format(now),
                        style: AppTypography.caption.copyWith(color: Colors.white.withValues(alpha: 0.85), fontWeight: FontWeight.w600)),
                    const SizedBox(height: 14),
                    Row(children: [
                      _HeroStat(value: schedule.hasValue ? '${today.where((s) => s.isScheduled).length}' : '–', label: l.sessionsToday,
                          onTap: () => onSelectTab?.call(2)),
                      _HeroStat(value: clients.hasValue ? '${clients.value!.length}' : '–', label: l.activeClients,
                          onTap: () => onSelectTab?.call(1)),
                      _HeroStat(value: convs.hasValue ? '$unread' : '–', label: l.unreadMessages, onTap: () => onSelectTab?.call(3)),
                    ]),
                  ]),
                ),
              ),
              const SizedBox(height: 22),
              _SectionHeader(title: l.todaysSessions, action: l.viewAll, onAction: () => onSelectTab?.call(2)),
              const SizedBox(height: 8),
              schedule.when(
                loading: () => const RepsiSkeleton(height: 72),
                error: (_, __) => _InlineNote(text: l.errorLoadSchedule, onRetry: () => ref.invalidate(trainerScheduleProvider)),
                data: (_) => today.isEmpty
                    ? _InlineNote(text: l.noSessionsToday)
                    : Column(children: [
                        for (final s in today)
                          RepsiStaggerItem(
                            index: i++,
                            child: Padding(padding: const EdgeInsets.only(bottom: 8), child: SessionTile(session: s)),
                          ),
                      ]),
              ),
              const SizedBox(height: 18),
              _SectionHeader(title: l.messages, action: l.viewAll, onAction: () => onSelectTab?.call(3)),
              const SizedBox(height: 8),
              convs.when(
                loading: () => const RepsiSkeleton(height: 64),
                error: (_, __) => _InlineNote(text: l.errorLoadMessages, onRetry: () => ref.invalidate(conversationsProvider)),
                data: (rows) => rows.isEmpty
                    ? _InlineNote(text: l.noConversationsTrainer)
                    : Column(children: [
                        for (final c in rows.take(3))
                          Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: RepsiCard(
                              padding: const EdgeInsets.all(12),
                              onTap: () async {
                                await Navigator.of(context)
                                    .push(MaterialPageRoute(builder: (_) => ChatThreadView(conversation: c, asTrainer: true)));
                                ref.invalidate(conversationsProvider);
                              },
                              child: Row(children: [
                                RepsiAvatar(name: c.memberName, size: 40),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                    Text(c.memberName,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: AppTypography.bodySmall.copyWith(fontWeight: FontWeight.w700, color: palette.text)),
                                    Text(c.lastMessage ?? l.noMessagesYet,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: AppTypography.caption.copyWith(color: palette.textSecondary)),
                                  ]),
                                ),
                                if (c.unread > 0) UnreadBadge(count: c.unread),
                              ]),
                            ),
                          ),
                      ]),
              ),
              const SizedBox(height: 18),
              _SectionHeader(title: l.myClients, action: l.viewAll, onAction: () => onSelectTab?.call(1)),
              const SizedBox(height: 8),
              clients.when(
                loading: () => const RepsiSkeleton(height: 96),
                error: (_, __) => _InlineNote(text: l.errorGeneric, onRetry: () => ref.invalidate(trainerClientsProvider)),
                data: (rows) => rows.isEmpty
                    ? _InlineNote(text: l.noClientsAssigned)
                    : SizedBox(
                        height: 96,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          itemCount: rows.length,
                          separatorBuilder: (_, __) => const SizedBox(width: 12),
                          itemBuilder: (_, n) {
                            final c = rows[n];
                            final clientName = c['name'] as String? ?? '';
                            return InkWell(
                              borderRadius: BorderRadius.circular(12),
                              onTap: () => Navigator.of(context).push(MaterialPageRoute(
                                  builder: (_) => TrainerClientDetailView(client: clientArgs(c)))),
                              child: SizedBox(
                                width: 72,
                                child: Column(children: [
                                  RepsiAvatar(name: clientName, size: 56),
                                  const SizedBox(height: 6),
                                  Text(clientName.split(' ').first,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: AppTypography.caption.copyWith(color: palette.text, fontWeight: FontWeight.w600)),
                                ]),
                              ),
                            );
                          },
                        ),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Arguments TrainerClientDetailView expects, from a `/trainers/me/clients` row.
Map<String, String> clientArgs(Map<String, dynamic> c) => {
      'client_id': c['client_id'] as String? ?? '',
      'name': c['name'] as String? ?? '',
      'status': c['membership_status'] as String? ?? '',
      if (c['phone'] != null) 'phone': c['phone'] as String,
      if (c['email'] != null) 'email': c['email'] as String,
    };

class UnreadBadge extends StatelessWidget {
  final int count;
  const UnreadBadge({super.key, required this.count});

  @override
  Widget build(BuildContext context) => Semantics(
        label: context.l10n.chatUnread(count),
        excludeSemantics: true,
        child: Container(
          constraints: const BoxConstraints(minWidth: 22),
          height: 22,
          padding: const EdgeInsets.symmetric(horizontal: 6),
          alignment: Alignment.center,
          decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(11)),
          child: Text(count > 99 ? '99+' : '$count',
              style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700)),
        ),
      );
}

class SessionTile extends StatelessWidget {
  final TrainerSessionItem session;
  const SessionTile({super.key, required this.session});

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final palette = context.palette;
    final s = session;
    final (label, fg, bg) = switch (s.status) {
      'COMPLETED' => (l.sessionCompleted, palette.successDark, palette.successSoft),
      'CANCELLED' => (l.sessionCancelled, palette.textSecondary, palette.surfaceSecondary),
      'NO_SHOW' => (l.sessionNoShow, palette.errorDark, palette.errorSoft),
      _ => (l.sessionScheduled, palette.primaryDark, palette.primarySoft),
    };
    return RepsiCard(
      padding: const EdgeInsets.all(12),
      child: Row(children: [
        Container(
          width: 64,
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(color: palette.surfaceSecondary, borderRadius: BorderRadius.circular(10)),
          child: Column(children: [
            Text(DateFormat.jm(L10n.localeName).format(s.scheduledAt),
                textAlign: TextAlign.center,
                style: AppTypography.caption.copyWith(fontWeight: FontWeight.w800, color: palette.text)),
            Text(l.unitMinutes(s.durationMinutes), style: AppTypography.caption.copyWith(fontSize: 10, color: palette.textSecondary)),
          ]),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(s.clientName ?? s.title,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AppTypography.bodySmall.copyWith(fontWeight: FontWeight.w700, color: palette.text, fontSize: 15)),
            if (s.clientName != null)
              Text(s.title,
                  maxLines: 1, overflow: TextOverflow.ellipsis, style: AppTypography.caption.copyWith(color: palette.textSecondary)),
            const SizedBox(height: 6),
            // Under the title, not trailing: Indic status words are too wide for a 320px row.
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(999)),
              child: Text(label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppTypography.caption.copyWith(color: fg, fontWeight: FontWeight.w700)),
            ),
          ]),
        ),
      ]),
    );
  }
}

class _HeroStat extends StatelessWidget {
  final String value;
  final String label;
  final VoidCallback? onTap;
  const _HeroStat({required this.value, required this.label, this.onTap});

  @override
  Widget build(BuildContext context) => Expanded(
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(10),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 2),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              TweenAnimationBuilder<double>(
                tween: Tween(begin: 0.6, end: 1),
                duration: const Duration(milliseconds: 500),
                curve: Curves.easeOutBack,
                builder: (_, v, child) => Transform.scale(scale: v, alignment: Alignment.centerLeft, child: child),
                child: Text(value,
                    style: AppTypography.heading.copyWith(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w900)),
              ),
              Text(label,
                  maxLines: 2,
                  style: AppTypography.caption.copyWith(color: Colors.white.withValues(alpha: 0.9), height: 1.2)),
            ]),
          ),
        ),
      );
}

class _SectionHeader extends StatelessWidget {
  final String title;
  final String action;
  final VoidCallback onAction;
  const _SectionHeader({required this.title, required this.action, required this.onAction});

  @override
  Widget build(BuildContext context) => Row(children: [
        Expanded(
          child: Text(title, style: AppTypography.sectionHeading.copyWith(fontSize: 16, color: context.palette.text)),
        ),
        TextButton(onPressed: onAction, child: Text(action)),
      ]);
}

class _InlineNote extends StatelessWidget {
  final String text;
  final VoidCallback? onRetry;
  const _InlineNote({required this.text, this.onRetry});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: palette.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: palette.border),
      ),
      child: Row(children: [
        Expanded(child: Text(text, style: AppTypography.bodySmall.copyWith(color: palette.textSecondary))),
        if (onRetry != null) TextButton(onPressed: onRetry, child: Text(context.l10n.commonRetry)),
      ]),
    );
  }
}
