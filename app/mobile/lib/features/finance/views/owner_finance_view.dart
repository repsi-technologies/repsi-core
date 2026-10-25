import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../core/api/api_error.dart';
import '../../../shared/widgets/repsi_avatar.dart';
import '../../../shared/widgets/repsi_error_state.dart';
import '../../../shared/widgets/repsi_skeleton.dart';
import '../providers/finance_provider.dart';
import '../../../l10n/l10n.dart';
import '../../../app/theme/repsi_palette.dart';

final _inr = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);
final _compact = NumberFormat.compactCurrency(locale: 'en_IN', symbol: '₹', decimalDigits: 1);

/// Owner finance: this month's money in and out, who owes what, collections by month and method,
/// and recent expenses. Payments are recorded from a member's profile.
class OwnerFinanceView extends ConsumerWidget {
  const OwnerFinanceView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final canvas = isDark ? AppColors.darkBackground : context.palette.background;

    Future<void> refresh() async {
      ref.invalidate(financeSummaryProvider);
      ref.invalidate(duesProvider);
      ref.invalidate(revenueReportProvider);
      ref.invalidate(expensesProvider);
      await ref.read(financeSummaryProvider.future).catchError((_) => const FinanceSummary(revenue: 0, expenses: 0, net: 0, pendingDues: 0));
    }

    return Scaffold(
      backgroundColor: canvas,
      appBar: AppBar(
        backgroundColor: canvas,
        title: Text(context.l10n.commonFinance, style: AppTypography.heading.copyWith(color: _text(isDark), fontWeight: FontWeight.w700)),
      ),
      body: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: refresh,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(AppSpacing.xl, AppSpacing.xs, AppSpacing.xl, AppSpacing.xxxl),
          children: const [
            _SummarySection(),
            SizedBox(height: AppSpacing.xxl),
            _CollectionsSection(),
            SizedBox(height: AppSpacing.xxl),
            _DuesSection(),
            SizedBox(height: AppSpacing.xxl),
            _ExpensesSection(),
          ],
        ),
      ),
    );
  }
}

Color _text(bool d) => d ? AppColors.darkText : AppColors.text;
Color _secondary(bool d) => d ? AppColors.darkTextSecondary : AppColors.textSecondary;
Color _surface(bool d) => d ? AppColors.darkSurface : AppColors.surface;
Color _border(bool d) => d ? AppColors.darkBorder : AppColors.border;

String _err(Object e) => e is ApiError ? e.message : L10n.current.commonCheckConnection;

BoxDecoration _panel(bool d) => BoxDecoration(
      color: _surface(d),
      borderRadius: BorderRadius.circular(AppSpacing.radiusCard),
      border: Border.all(color: _border(d)),
    );

Widget _title(String text, bool d, {String? trailing}) => Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Row(
        children: [
          Expanded(
            child: Semantics(header: true, child: Text(text, style: AppTypography.sectionHeading.copyWith(color: _text(d), fontSize: 17))),
          ),
          if (trailing != null) Text(trailing, style: AppTypography.caption.copyWith(color: _secondary(d))),
        ],
      ),
    );

class _SummarySection extends ConsumerWidget {
  const _SummarySection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final d = Theme.of(context).brightness == Brightness.dark;
    return ref.watch(financeSummaryProvider).when(
          loading: () => const RepsiSkeleton(
              width: double.infinity, height: 170, borderRadius: BorderRadius.all(Radius.circular(AppSpacing.radiusCard))),
          error: (e, _) => RepsiErrorState(
              title: context.l10n.errorLoadFinance, message: _err(e), onRetry: () => ref.invalidate(financeSummaryProvider)),
          data: (s) => Container(
            padding: const EdgeInsets.all(AppSpacing.lg),
            decoration: _panel(d),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(context.l10n.collectedThisMonth, style: AppTypography.caption.copyWith(color: _secondary(d))),
                FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerLeft,
                  child: Text(_inr.format(s.revenue),
                      style: AppTypography.tabularNumber(fontSize: 32, fontWeight: FontWeight.w700, color: _text(d)).copyWith(letterSpacing: -0.8)),
                ),
                const SizedBox(height: AppSpacing.lg),
                Divider(height: 1, color: _border(d)),
                const SizedBox(height: AppSpacing.md),
                Row(
                  children: [
                    _Mini(context.l10n.expenses, _inr.format(s.expenses), _text(d)),
                    _Mini(context.l10n.net, _inr.format(s.net), s.net >= 0 ? (d ? AppColors.darkSuccess : context.palette.success) : (d ? AppColors.darkError : context.palette.error)),
                    _Mini(context.l10n.duesToCollect, _inr.format(s.pendingDues), s.pendingDues > 0 ? (d ? AppColors.darkWarning : context.palette.warning) : _text(d)),
                  ],
                ),
              ],
            ),
          ),
        );
  }
}

class _Mini extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _Mini(this.label, this.value, this.color);

  @override
  Widget build(BuildContext context) {
    final d = Theme.of(context).brightness == Brightness.dark;
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: Text(value, style: AppTypography.tabularNumber(fontSize: 16, fontWeight: FontWeight.w700, color: color)),
          ),
          Text(label, style: AppTypography.caption.copyWith(color: _secondary(d))),
        ],
      ),
    );
  }
}

class _CollectionsSection extends ConsumerWidget {
  const _CollectionsSection();

  static Map<String, String> _methods(BuildContext context) => {'upi': 'UPI', 'cash': context.l10n.commonCash, 'card': context.l10n.commonCard, 'netbanking': context.l10n.commonNetBanking, 'cheque': context.l10n.commonCheque};

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final d = Theme.of(context).brightness == Brightness.dark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _title(context.l10n.collections, d, trailing: context.l10n.last6Months),
        ref.watch(revenueReportProvider).when(
              loading: () => RepsiSkeleton.chartSkeleton(),
              error: (e, _) => Text(_err(e), style: AppTypography.bodySmall.copyWith(color: _secondary(d))),
              data: (r) {
                final periods = r.periods.length > 6 ? r.periods.sublist(r.periods.length - 6) : r.periods;
                final maxV = periods.fold<double>(0, (m, p) => p.collected > m ? p.collected : m);
                final methodTotal = r.byMethod.values.fold<double>(0, (s, v) => s + v);
                if (periods.isEmpty || maxV == 0) {
                  return Container(
                    padding: const EdgeInsets.all(AppSpacing.lg),
                    decoration: _panel(d),
                    child: Text(context.l10n.noCollections, style: AppTypography.bodySmall.copyWith(color: _secondary(d))),
                  );
                }
                return Container(
                  padding: const EdgeInsets.all(AppSpacing.lg),
                  decoration: _panel(d),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Semantics(
                        label: periods.map((p) => '${_monthLabel(p.period)} ${_inr.format(p.collected)}').join(', '),
                        child: ExcludeSemantics(
                          child: SizedBox(
                            height: 140,
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                for (var i = 0; i < periods.length; i++)
                                  Expanded(
                                    child: Padding(
                                      padding: const EdgeInsets.symmetric(horizontal: 6),
                                      child: Column(
                                        mainAxisAlignment: MainAxisAlignment.end,
                                        children: [
                                          Text(_compact.format(periods[i].collected),
                                              maxLines: 1,
                                              style: AppTypography.caption.copyWith(color: _secondary(d), fontSize: 10.5)),
                                          const SizedBox(height: 4),
                                          Container(
                                            height: 4 + 88 * (periods[i].collected / maxV),
                                            decoration: BoxDecoration(
                                              color: i == periods.length - 1 ? AppColors.primary : AppColors.primary.withValues(alpha: 0.35),
                                              borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                                            ),
                                          ),
                                          const SizedBox(height: 6),
                                          Text(_monthLabel(periods[i].period), style: AppTypography.caption.copyWith(color: _secondary(d), fontSize: 11)),
                                        ],
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        ),
                      ),
                      if (methodTotal > 0) ...[
                        const SizedBox(height: AppSpacing.lg),
                        Divider(height: 1, color: _border(d)),
                        const SizedBox(height: AppSpacing.md),
                        for (final e in (r.byMethod.entries.toList()..sort((a, b) => b.value.compareTo(a.value))))
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 5),
                            child: Row(
                              children: [
                                SizedBox(width: 92, child: Text(_methods(context)[e.key] ?? e.key, style: AppTypography.bodySmall.copyWith(color: _text(d)))),
                                Expanded(
                                  child: ClipRRect(
                                    borderRadius: BorderRadius.circular(3),
                                    child: LinearProgressIndicator(
                                      value: e.value / methodTotal,
                                      minHeight: 6,
                                      color: AppColors.primary,
                                      backgroundColor: d ? AppColors.darkSurfaceElevated : context.palette.surfaceSecondary,
                                    ),
                                  ),
                                ),
                                SizedBox(
                                  width: 48,
                                  child: Text('${(100 * e.value / methodTotal).round()}%',
                                      textAlign: TextAlign.right, style: AppTypography.tabularNumber(fontSize: 12, fontWeight: FontWeight.w500, color: _secondary(d))),
                                ),
                              ],
                            ),
                          ),
                      ],
                    ],
                  ),
                );
              },
            ),
      ],
    );
  }

  static String _monthLabel(String period) {
    final dt = DateTime.tryParse('$period-01');
    return dt == null ? period : DateFormat('MMM').format(dt);
  }
}

class _DuesSection extends ConsumerWidget {
  const _DuesSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final d = Theme.of(context).brightness == Brightness.dark;
    final dues = ref.watch(duesProvider);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _title(context.l10n.duesToCollect, d, trailing: dues.valueOrNull == null ? null : context.l10n.financeMembersCount(dues.value!.length)),
        dues.when(
          loading: () => Column(children: [for (var i = 0; i < 3; i++) RepsiSkeleton.memberListItem()]),
          error: (e, _) => Text(_err(e), style: AppTypography.bodySmall.copyWith(color: _secondary(d))),
          data: (list) => list.isEmpty
              ? Container(
                  padding: const EdgeInsets.all(AppSpacing.lg),
                  decoration: _panel(d),
                  child: Text(context.l10n.nothingOutstanding, style: AppTypography.bodySmall.copyWith(color: _secondary(d))),
                )
              : Container(
                  decoration: _panel(d),
                  child: Column(
                    children: [
                      for (var i = 0; i < list.length && i < 8; i++) ...[
                        if (i > 0) Divider(height: 1, indent: 64, color: _border(d)),
                        ListTile(
                          contentPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                          leading: RepsiAvatar(name: list[i].member, size: 36),
                          title: Text(list[i].member, style: AppTypography.bodySmall.copyWith(color: _text(d), fontWeight: FontWeight.w600)),
                          subtitle: Text(
                            list[i].daysOverdue > 0 ? context.l10n.financeDaysOverdue(list[i].daysOverdue) : context.l10n.dueNow,
                            style: AppTypography.caption.copyWith(
                                color: list[i].daysOverdue > 14 ? (d ? AppColors.darkError : context.palette.error) : _secondary(d)),
                          ),
                          trailing: Text(_inr.format(list[i].balance),
                              style: AppTypography.tabularNumber(fontSize: 15, fontWeight: FontWeight.w700, color: _text(d))),
                        ),
                      ],
                      if (list.length > 8)
                        Padding(
                          padding: const EdgeInsets.all(AppSpacing.md),
                          child: Text(context.l10n.financeMoreOnWeb(list.length - 8),
                              style: AppTypography.caption.copyWith(color: _secondary(d))),
                        ),
                    ],
                  ),
                ),
        ),
      ],
    );
  }
}

class _ExpensesSection extends ConsumerWidget {
  const _ExpensesSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final d = Theme.of(context).brightness == Brightness.dark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _title(context.l10n.recentExpenses, d),
        ref.watch(expensesProvider).when(
              loading: () => Column(children: [for (var i = 0; i < 3; i++) RepsiSkeleton.memberListItem()]),
              error: (e, _) => Text(_err(e), style: AppTypography.bodySmall.copyWith(color: _secondary(d))),
              data: (list) => list.isEmpty
                  ? Container(
                      padding: const EdgeInsets.all(AppSpacing.lg),
                      decoration: _panel(d),
                      child: Text(context.l10n.noExpenses, style: AppTypography.bodySmall.copyWith(color: _secondary(d))),
                    )
                  : Container(
                      decoration: _panel(d),
                      child: Column(
                        children: [
                          for (var i = 0; i < list.length && i < 8; i++) ...[
                            if (i > 0) Divider(height: 1, indent: AppSpacing.lg, color: _border(d)),
                            ListTile(
                              contentPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                              title: Text(list[i].title, style: AppTypography.bodySmall.copyWith(color: _text(d), fontWeight: FontWeight.w600)),
                              subtitle: Text(
                                '${list[i].category[0].toUpperCase()}${list[i].category.substring(1)} · ${DateFormat('d MMM').format(list[i].date)}',
                                style: AppTypography.caption.copyWith(color: _secondary(d)),
                              ),
                              trailing: Text(_inr.format(list[i].amount),
                                  style: AppTypography.tabularNumber(fontSize: 14, fontWeight: FontWeight.w600, color: _text(d))),
                            ),
                          ],
                        ],
                      ),
                    ),
            ),
      ],
    );
  }
}
