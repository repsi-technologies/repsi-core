import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/repsi_palette.dart';
import '../../../core/api/api_error.dart';
import '../../../l10n/l10n.dart';
import '../../../shared/widgets/repsi_avatar.dart';
import '../../../shared/widgets/repsi_button.dart';
import '../../../shared/widgets/repsi_card.dart';
import '../../../shared/widgets/repsi_empty_state.dart';
import '../../../shared/widgets/repsi_error_state.dart';
import '../../../shared/widgets/repsi_skeleton.dart';
import '../data/staff_api.dart';

String _err(BuildContext c, Object e) => e is ApiError ? e.message : c.l10n.errorGeneric;

/// Owner: trainers' shift hours (last 30 days) and correction requests awaiting review.
class StaffAttendanceView extends ConsumerWidget {
  const StaffAttendanceView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l = context.l10n;
    final palette = context.palette;
    final report = ref.watch(staffReportProvider);
    final pending = ref.watch(pendingCorrectionsProvider);
    return Scaffold(
      backgroundColor: palette.background,
      appBar: AppBar(backgroundColor: palette.background, title: Text(l.staffAttendance)),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(staffReportProvider);
          ref.invalidate(pendingCorrectionsProvider);
          await ref.read(staffReportProvider.future).then((_) {}, onError: (_) {});
        },
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: AppSpacing.pagePadding,
          children: [
            ...pending.when(
              loading: () => const [SizedBox.shrink()],
              error: (_, __) => const [SizedBox.shrink()],
              data: (rows) => [
                if (rows.isNotEmpty) ...[
                  Text(l.correctionRequests, style: AppTypography.sectionHeading.copyWith(color: palette.text)),
                  const SizedBox(height: 8),
                  for (final r in rows) Padding(padding: const EdgeInsets.only(bottom: 8), child: _CorrectionCard(request: r)),
                  const SizedBox(height: 12),
                ],
              ],
            ),
            Text(l.last30Days, style: AppTypography.sectionHeading.copyWith(color: palette.text)),
            const SizedBox(height: 8),
            ...report.when(
              loading: () => const [RepsiSkeleton(height: 72), SizedBox(height: 8), RepsiSkeleton(height: 72)],
              error: (e, _) => [RepsiErrorState(message: _err(context, e), onRetry: () => ref.invalidate(staffReportProvider))],
              data: (rows) => rows.isEmpty
                  ? [RepsiEmptyState(icon: LucideIcons.users, title: l.noActiveTrainers, message: l.staffAttendanceHint)]
                  : [
                      for (final t in rows)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: RepsiCard(
                            padding: const EdgeInsets.all(12),
                            child: Row(children: [
                              RepsiAvatar(name: t.name, size: 40, showStatus: true, isOnline: t.checkedIn),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                  Text(t.name,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: AppTypography.bodySmall.copyWith(fontWeight: FontWeight.w700, color: palette.text)),
                                  Text(
                                    [l.shiftCount(t.shifts), l.daysCount(t.days), if (t.checkedIn) l.onShiftNow].join(' · '),
                                    style: AppTypography.caption.copyWith(color: t.checkedIn ? palette.successDark : palette.textSecondary),
                                  ),
                                ]),
                              ),
                              Text(formatMinutes(t.minutes),
                                  style: AppTypography.bodySmall.copyWith(fontWeight: FontWeight.w800, color: palette.text)),
                            ]),
                          ),
                        ),
                    ],
            ),
          ],
        ),
      ),
    );
  }
}

class _CorrectionCard extends ConsumerStatefulWidget {
  final CorrectionRequest request;
  const _CorrectionCard({required this.request});

  @override
  ConsumerState<_CorrectionCard> createState() => _CorrectionCardState();
}

class _CorrectionCardState extends ConsumerState<_CorrectionCard> {
  bool _busy = false;

  Future<void> _resolve(bool approve) async {
    setState(() => _busy = true);
    try {
      await ref.read(staffApiProvider).resolveCorrection(widget.request.id, approve: approve);
      ref.invalidate(pendingCorrectionsProvider);
      ref.invalidate(staffReportProvider);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(_err(context, e))));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final palette = context.palette;
    final r = widget.request;
    final fmt = DateFormat.MMMd(L10n.localeName).add_jm();
    return RepsiCard(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(r.trainerName ?? '', style: AppTypography.bodySmall.copyWith(fontWeight: FontWeight.w700, color: palette.text)),
        const SizedBox(height: 4),
        if (r.requestedIn != null)
          Text('${l.checkInTime}: ${fmt.format(r.requestedIn!)}', style: AppTypography.caption.copyWith(color: palette.text)),
        if (r.requestedOut != null)
          Text('${l.checkOutTime}: ${fmt.format(r.requestedOut!)}', style: AppTypography.caption.copyWith(color: palette.text)),
        const SizedBox(height: 6),
        Text('“${r.reason}”', style: AppTypography.bodySmall.copyWith(color: palette.textSecondary)),
        const SizedBox(height: 10),
        Row(children: [
          Expanded(
            child: RepsiButton(
                text: l.decline, variant: RepsiButtonVariant.outline, onPressed: _busy ? null : () => _resolve(false)),
          ),
          const SizedBox(width: 10),
          Expanded(child: RepsiButton(text: l.approve, isLoading: _busy, onPressed: _busy ? null : () => _resolve(true))),
        ]),
      ]),
    );
  }
}

/// Owner: trainers and staff; tap one to grant or revoke individual permissions.
class StaffPermissionsView extends ConsumerWidget {
  const StaffPermissionsView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l = context.l10n;
    final palette = context.palette;
    final team = ref.watch(teamProvider);
    return Scaffold(
      backgroundColor: palette.background,
      appBar: AppBar(backgroundColor: palette.background, title: Text(l.staffAndPermissions)),
      body: team.when(
        loading: () => ListView(padding: AppSpacing.pagePadding, children: const [RepsiSkeleton(height: 64)]),
        error: (e, _) => RepsiErrorState(message: _err(context, e), onRetry: () => ref.invalidate(teamProvider)),
        data: (rows) {
          final staff = rows.where((m) => m.role != 'USER' && m.role != 'MEMBER').toList();
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(teamProvider),
            child: ListView.separated(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: AppSpacing.pagePadding,
              itemCount: staff.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (_, i) {
                final m = staff[i];
                final locked = m.isSelf || m.role == 'OWNER';
                return RepsiCard(
                  padding: const EdgeInsets.all(12),
                  onTap: locked
                      ? null
                      : () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => _PermissionEditor(member: m))),
                  child: Row(children: [
                    RepsiAvatar(name: m.name, size: 40),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(m.name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: AppTypography.bodySmall.copyWith(fontWeight: FontWeight.w700, color: palette.text)),
                        Text('${_roleLabel(m.role)}${m.isActive ? '' : ' · ${l.commonInactive}'}',
                            style: AppTypography.caption.copyWith(color: palette.textSecondary)),
                      ]),
                    ),
                    Icon(locked ? LucideIcons.lock : LucideIcons.chevronRight, size: 18, color: palette.textMuted),
                  ]),
                );
              },
            ),
          );
        },
      ),
    );
  }
}

String _roleLabel(String role) => role.isEmpty ? '' : role[0] + role.substring(1).toLowerCase().replaceAll('_', ' ');

/// Permission groups shown in the editor; keys are the API's permission keys.
const _groups = <(IconData, String, List<String>)>[
  (LucideIcons.users, 'members', ['members.view', 'members.manage', 'trainers.assign']),
  (LucideIcons.scanLine, 'attendance', ['attendance.record', 'attendance.view', 'attendance.correct', 'attendance.override']),
  (LucideIcons.dumbbell, 'training', ['workouts.assign', 'programs.manage', 'exercises.manage', 'nutrition.manage', 'nutrition.assign']),
  (LucideIcons.messageSquare, 'communication', ['chat.use', 'communications.manage']),
  (LucideIcons.calendarDays, 'schedule', ['schedules.manage', 'bookings.manage', 'classes.manage']),
  (LucideIcons.chartNoAxesColumn, 'admin', ['reports.view', 'records.export', 'trainers.manage', 'staff.manage', 'payments.view', 'payments.manage', 'plans.manage']),
];

class _PermissionEditor extends ConsumerStatefulWidget {
  final TeamMember member;
  const _PermissionEditor({required this.member});

  @override
  ConsumerState<_PermissionEditor> createState() => _PermissionEditorState();
}

class _PermissionEditorState extends ConsumerState<_PermissionEditor> {
  MemberPermissions? _loaded;
  Set<String>? _draft;
  Object? _error;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final p = await ref.read(staffApiProvider).permissionsOf(widget.member.id);
      if (mounted) setState(() => (_loaded = p, _draft = {...p.effective}, _error = null));
    } catch (e) {
      if (mounted) setState(() => _error = e);
    }
  }

  Future<void> _save({String? preset}) async {
    setState(() => _saving = true);
    try {
      final p = await ref.read(staffApiProvider).savePermissions(widget.member.id,
          effective: _draft, preset: preset, roleDefaults: _loaded!.roleDefaults);
      if (!mounted) return;
      setState(() => (_loaded = p, _draft = {...p.effective}));
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(context.l10n.permissionsSaved)));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(_err(context, e))));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  String _groupLabel(AppLocalizations l, String g) => switch (g) {
        'members' => l.permGroupMembers,
        'attendance' => l.permGroupAttendance,
        'training' => l.permGroupTraining,
        'communication' => l.permGroupCommunication,
        'schedule' => l.permGroupSchedule,
        _ => l.permGroupAdmin,
      };

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final palette = context.palette;
    final catalog = ref.watch(permissionCatalogProvider).valueOrNull;
    final draft = _draft;
    final dirty = draft != null && _loaded != null && !(draft.length == _loaded!.effective.length && draft.containsAll(_loaded!.effective));
    return Scaffold(
      backgroundColor: palette.background,
      appBar: AppBar(backgroundColor: palette.background, title: Text(widget.member.name)),
      body: _error != null
          ? RepsiErrorState(message: _err(context, _error!), onRetry: _load)
          : draft == null
              ? const Center(child: CircularProgressIndicator())
              : ListView(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
                  children: [
                    Text(l.permissionsIntro, style: AppTypography.bodySmall.copyWith(color: palette.textSecondary)),
                    if (widget.member.role == 'TRAINER' && (catalog?.trainerPresets.isNotEmpty ?? false)) ...[
                      const SizedBox(height: 14),
                      Text(l.permissionPresets, style: AppTypography.sectionHeading.copyWith(fontSize: 15, color: palette.text)),
                      const SizedBox(height: 8),
                      Wrap(spacing: 8, runSpacing: 8, children: [
                        for (final p in catalog!.trainerPresets)
                          ActionChip(
                            avatar: const Icon(LucideIcons.sparkles, size: 14),
                            label: Text(p.label),
                            onPressed: _saving ? null : () => _save(preset: p.key),
                          ),
                      ]),
                    ],
                    for (final (icon, key, perms) in _groups) ...[
                      const SizedBox(height: 18),
                      Row(children: [
                        Icon(icon, size: 16, color: palette.primaryDark),
                        const SizedBox(width: 8),
                        Text(_groupLabel(l, key).toUpperCase(),
                            style: AppTypography.caption.copyWith(color: palette.textSecondary, fontWeight: FontWeight.w800, letterSpacing: 0.8)),
                      ]),
                      const SizedBox(height: 6),
                      Material(
                        color: palette.surface,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(AppSpacing.radiusCard), side: BorderSide(color: palette.border)),
                        clipBehavior: Clip.antiAlias,
                        child: Column(children: [
                          for (final p in perms.where((p) => catalog == null || catalog.labels.containsKey(p)))
                            SwitchListTile.adaptive(
                              value: draft.contains(p),
                              activeTrackColor: AppColors.primary,
                              onChanged: _saving || _loaded!.locked
                                  ? null
                                  : (on) => setState(() => on ? draft.add(p) : draft.remove(p)),
                              title: Text(catalog?.labels[p] ?? p, style: AppTypography.bodySmall.copyWith(color: palette.text)),
                              subtitle: _loaded!.roleDefaults.contains(p)
                                  ? Text(l.roleDefault, style: AppTypography.caption.copyWith(color: palette.textMuted))
                                  : null,
                            ),
                        ]),
                      ),
                    ],
                    const SizedBox(height: 14),
                    Row(children: [
                      Icon(LucideIcons.shieldCheck, size: 16, color: palette.textMuted),
                      const SizedBox(width: 8),
                      Expanded(child: Text(l.permissionsAuditNote, style: AppTypography.caption.copyWith(color: palette.textMuted))),
                    ]),
                  ],
                ),
      bottomNavigationBar: draft == null
          ? null
          : SafeArea(
              minimum: const EdgeInsets.all(16),
              child: RepsiButton(
                text: l.saveChanges,
                isFullWidth: true,
                isLoading: _saving,
                onPressed: dirty && !_saving ? () => _save() : null,
              ),
            ),
    );
  }
}
