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
import '../../../shared/animations/repsi_stagger.dart';
import '../../../shared/widgets/repsi_card.dart';
import '../../../shared/widgets/repsi_error_state.dart';
import '../../../shared/widgets/repsi_skeleton.dart';
import '../data/staff_api.dart';

/// Trainer's own shift attendance: check in/out, hours, history and correction requests.
/// Separate from members' visits — marking a member present never shows up here.
class MyShiftView extends ConsumerStatefulWidget {
  const MyShiftView({super.key});

  @override
  ConsumerState<MyShiftView> createState() => _MyShiftViewState();
}

class _MyShiftViewState extends ConsumerState<MyShiftView> {
  bool _busy = false;

  Future<void> _toggle(bool checkedIn) async {
    setState(() => _busy = true);
    try {
      final api = ref.read(staffApiProvider);
      checkedIn ? await api.checkOut() : await api.checkIn();
      ref.invalidate(myShiftProvider);
    } catch (e) {
      if (mounted) _snack(e is ApiError ? e.message : context.l10n.errorGeneric);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _snack(String text) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final palette = context.palette;
    final shift = ref.watch(myShiftProvider);
    return Scaffold(
      backgroundColor: palette.background,
      appBar: AppBar(backgroundColor: palette.background, title: Text(l.myShiftAttendance)),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(myShiftProvider);
          await ref.read(myShiftProvider.future).then((_) {}, onError: (_) {});
        },
        child: shift.when(
          loading: () => ListView(padding: AppSpacing.pagePadding, children: const [
            RepsiSkeleton(height: 170),
            SizedBox(height: 12),
            RepsiSkeleton(height: 72),
          ]),
          error: (e, _) => ListView(children: [
            const SizedBox(height: 80),
            RepsiErrorState(message: e is ApiError ? e.message : l.errorGeneric, onRetry: () => ref.invalidate(myShiftProvider)),
          ]),
          data: (s) {
            final active = s.active;
            final fmt = DateFormat.jm(L10n.localeName);
            var i = 0;
            return ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(AppSpacing.pageHorizontalPadding, 4, AppSpacing.pageHorizontalPadding, 24),
              children: [
                RepsiStaggerItem(
                  index: i++,
                  child: Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
                      gradient: LinearGradient(
                        colors: active != null ? AppColors.energyGradient : AppColors.inkGradient,
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(children: [
                        Icon(active != null ? LucideIcons.circleCheck : LucideIcons.clock3, color: Colors.white, size: 18),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(active != null ? l.onShiftSince(fmt.format(active.checkIn)) : l.offShift,
                              style: AppTypography.bodySmall.copyWith(color: Colors.white, fontWeight: FontWeight.w700)),
                        ),
                      ]),
                      const SizedBox(height: 16),
                      Row(children: [
                        _Stat(value: formatMinutes(s.weekMinutes), label: l.commonThisWeek),
                        _Stat(value: formatMinutes(s.monthMinutes), label: l.commonThisMonth),
                        _Stat(value: '${s.monthDays}', label: l.daysWorked),
                      ]),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton.icon(
                          style: FilledButton.styleFrom(
                            backgroundColor: Colors.white,
                            foregroundColor: active != null ? AppColors.primaryDark : AppColors.ink,
                            minimumSize: const Size.fromHeight(50),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSpacing.radiusButton)),
                          ),
                          onPressed: _busy ? null : () => _toggle(active != null),
                          icon: _busy
                              ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                              : Icon(active != null ? LucideIcons.logOut : LucideIcons.logIn, size: 18),
                          label: Text(active != null ? l.checkOutShift : l.checkInShift,
                              style: const TextStyle(fontWeight: FontWeight.w700)),
                        ),
                      ),
                    ]),
                  ),
                ),
                if (s.requests.any((r) => r.status == 'pending')) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: palette.warningSoft, borderRadius: BorderRadius.circular(12)),
                    child: Row(children: [
                      Icon(LucideIcons.hourglass, size: 18, color: palette.warningDark),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(l.correctionsPending(s.requests.where((r) => r.status == 'pending').length),
                            style: AppTypography.bodySmall.copyWith(color: palette.text)),
                      ),
                    ]),
                  ),
                ],
                const SizedBox(height: 20),
                Text(l.shiftHistory, style: AppTypography.sectionHeading.copyWith(color: palette.text)),
                const SizedBox(height: 8),
                if (s.records.isEmpty)
                  Text(l.noShiftsYet, style: AppTypography.bodySmall.copyWith(color: palette.textSecondary)),
                for (final r in s.records)
                  RepsiStaggerItem(
                    index: i++,
                    delay: const Duration(milliseconds: 40),
                    child: Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: RepsiCard(
                        padding: const EdgeInsets.all(12),
                        child: Row(children: [
                          Container(
                            width: 44,
                            height: 44,
                            alignment: Alignment.center,
                            decoration: BoxDecoration(color: palette.surfaceSecondary, borderRadius: BorderRadius.circular(10)),
                            child: Text(DateFormat.d(L10n.localeName).format(r.checkIn),
                                style: AppTypography.sectionHeading.copyWith(color: palette.text)),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Text(DateFormat.MMMEd(L10n.localeName).format(r.checkIn),
                                  style: AppTypography.bodySmall.copyWith(fontWeight: FontWeight.w700, color: palette.text)),
                              Text(
                                '${fmt.format(r.checkIn)} – ${r.checkOut == null ? l.inProgress : fmt.format(r.checkOut!)}'
                                '${r.corrected ? ' · ${l.corrected}' : ''}',
                                style: AppTypography.caption.copyWith(color: palette.textSecondary),
                              ),
                            ]),
                          ),
                          Text(formatMinutes(r.minutes),
                              style: AppTypography.bodySmall.copyWith(fontWeight: FontWeight.w700, color: palette.text)),
                          IconButton(
                            tooltip: l.requestCorrection,
                            icon: Icon(LucideIcons.pencilLine, size: 18, color: palette.textMuted),
                            onPressed: () => _requestCorrection(r),
                          ),
                        ]),
                      ),
                    ),
                  ),
              ],
            );
          },
        ),
      ),
    );
  }

  Future<void> _requestCorrection(ShiftRecord r) async {
    final l = context.l10n;
    DateTime inTime = r.checkIn;
    DateTime? outTime = r.checkOut;
    final reason = TextEditingController();
    Future<DateTime?> pick(BuildContext ctx, DateTime base) async {
      final t = await showTimePicker(context: ctx, initialTime: TimeOfDay.fromDateTime(base));
      return t == null ? null : DateTime(base.year, base.month, base.day, t.hour, t.minute);
    }

    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setLocal) => AlertDialog(
          title: Text(l.requestCorrection),
          content: SingleChildScrollView(
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(LucideIcons.logIn),
                title: Text(l.checkInTime),
                trailing: Text(TimeOfDay.fromDateTime(inTime).format(ctx)),
                onTap: () async {
                  final v = await pick(ctx, inTime);
                  if (v != null) setLocal(() => inTime = v);
                },
              ),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(LucideIcons.logOut),
                title: Text(l.checkOutTime),
                trailing: Text(outTime == null ? '—' : TimeOfDay.fromDateTime(outTime!).format(ctx)),
                onTap: () async {
                  final v = await pick(ctx, outTime ?? inTime);
                  if (v != null) setLocal(() => outTime = v);
                },
              ),
              TextField(
                controller: reason,
                maxLength: 500,
                minLines: 2,
                maxLines: 4,
                decoration: InputDecoration(hintText: l.correctionReasonHint),
              ),
            ]),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(l.commonCancel)),
            FilledButton(onPressed: () => Navigator.pop(ctx, true), child: Text(l.sendRequest)),
          ],
        ),
      ),
    );
    final text = reason.text.trim();
    reason.dispose();
    if (ok != true) return;
    try {
      await ref.read(staffApiProvider).requestCorrection(r.id, text,
          checkIn: inTime != r.checkIn ? inTime : null, checkOut: outTime != r.checkOut ? outTime : null);
      ref.invalidate(myShiftProvider);
      if (mounted) _snack(l.requestSent);
    } catch (e) {
      if (mounted) _snack(e is ApiError ? e.message : l.errorGeneric);
    }
  }
}

class _Stat extends StatelessWidget {
  final String value;
  final String label;
  const _Stat({required this.value, required this.label});

  @override
  Widget build(BuildContext context) => Expanded(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          FittedBox(
            child: Text(value, style: AppTypography.heading.copyWith(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w800)),
          ),
          Text(label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppTypography.caption.copyWith(color: Colors.white.withValues(alpha: 0.85))),
        ]),
      );
}
