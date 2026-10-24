import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../core/api/api_error.dart';
import '../../../core/providers/api_provider.dart';
import '../../../shared/widgets/repsi_error_state.dart';
import '../../../shared/widgets/repsi_skeleton.dart';
import '../../../l10n/l10n.dart';

class BusinessInsights {
  final String summary;
  final List<String> highlights;
  final List<String> actions;
  final bool generatedByAi;
  final String? notice;

  const BusinessInsights({
    required this.summary,
    required this.highlights,
    required this.actions,
    required this.generatedByAi,
    this.notice,
  });
}

/// GET /ai/insights: a short read of the gym's own numbers, written by the AI model when it is
/// configured and by fixed rules otherwise (`source` says which).
final businessInsightsProvider = FutureProvider.autoDispose<BusinessInsights>((ref) async {
  final j = (await ref.watch(apiClientProvider).get('/ai/insights')).data as Map<String, dynamic>;
  List<String> list(Object? v) => (v as List<dynamic>? ?? const []).map((e) => e.toString()).toList();
  return BusinessInsights(
    summary: j['summary']?.toString() ?? '',
    highlights: list(j['highlights']),
    actions: list(j['actions']),
    generatedByAi: const {'ai', 'cached'}.contains(j['source']?.toString()),
    notice: j['notice']?.toString(),
  );
});

class AiInsightsView extends ConsumerWidget {
  const AiInsightsView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final d = Theme.of(context).brightness == Brightness.dark;
    final canvas = d ? AppColors.darkBackground : AppColors.background;
    final text = d ? AppColors.darkText : AppColors.text;
    final secondary = d ? AppColors.darkTextSecondary : AppColors.textSecondary;

    return Scaffold(
      backgroundColor: canvas,
      appBar: AppBar(backgroundColor: canvas, title: Text(context.l10n.businessInsights)),
      body: ref.watch(businessInsightsProvider).when(
            loading: () => ListView(
              padding: const EdgeInsets.all(AppSpacing.xl),
              children: const [
                RepsiSkeleton(width: double.infinity, height: 110, borderRadius: BorderRadius.all(Radius.circular(AppSpacing.radiusCard))),
                SizedBox(height: AppSpacing.lg),
                RepsiSkeleton(width: double.infinity, height: 180, borderRadius: BorderRadius.all(Radius.circular(AppSpacing.radiusCard))),
              ],
            ),
            error: (e, _) {
              final detail = e is ApiError ? e.details : null;
              final notInPlan = detail is Map && detail['error_code'] == 'FEATURE_NOT_IN_PLAN';
              return RepsiErrorState(
                title: notInPlan ? context.l10n.notOnPlan : context.l10n.errorLoadInsights,
                message: notInPlan
                    ? context.l10n.insightsUpgrade
                    : (e is ApiError ? e.message : context.l10n.commonCheckConnection),
                onRetry: notInPlan ? null : () => ref.invalidate(businessInsightsProvider),
              );
            },
            data: (i) => RefreshIndicator(
              color: AppColors.primary,
              onRefresh: () async => ref.invalidate(businessInsightsProvider),
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(AppSpacing.xl),
                children: [
                  Container(
                    padding: const EdgeInsets.all(AppSpacing.lg),
                    decoration: BoxDecoration(
                      color: d ? AppColors.darkPrimarySoft : AppColors.primarySoft,
                      borderRadius: BorderRadius.circular(AppSpacing.radiusCard),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(i.generatedByAi ? Icons.auto_awesome_rounded : Icons.insights_rounded,
                                size: 18, color: d ? AppColors.darkPrimaryLight : AppColors.primaryDark),
                            const SizedBox(width: AppSpacing.sm),
                            Text(i.generatedByAi ? context.l10n.summaryByAi : context.l10n.summary,
                                style: AppTypography.caption.copyWith(
                                    color: d ? AppColors.darkPrimaryLight : AppColors.primaryDark, fontWeight: FontWeight.w600)),
                          ],
                        ),
                        const SizedBox(height: AppSpacing.sm),
                        Text(i.summary, style: AppTypography.body.copyWith(color: text)),
                      ],
                    ),
                  ),
                  if (i.highlights.isNotEmpty) ...[
                    const SizedBox(height: AppSpacing.xxl),
                    Text(context.l10n.whatStandsOut, style: AppTypography.sectionHeading.copyWith(color: text, fontSize: 17)),
                    const SizedBox(height: AppSpacing.md),
                    for (final h in i.highlights) _Line(icon: Icons.circle, size: 6, text: h),
                  ],
                  if (i.actions.isNotEmpty) ...[
                    const SizedBox(height: AppSpacing.xxl),
                    Text(context.l10n.suggestedNextSteps, style: AppTypography.sectionHeading.copyWith(color: text, fontSize: 17)),
                    const SizedBox(height: AppSpacing.md),
                    for (final a in i.actions) _Line(icon: Icons.arrow_forward_rounded, size: 16, text: a),
                  ],
                  if (i.notice != null && i.notice!.isNotEmpty) ...[
                    const SizedBox(height: AppSpacing.xxl),
                    Text(i.notice!, style: AppTypography.caption.copyWith(color: secondary)),
                  ],
                ],
              ),
            ),
          ),
    );
  }
}

class _Line extends StatelessWidget {
  final IconData icon;
  final double size;
  final String text;

  const _Line({required this.icon, required this.size, required this.text});

  @override
  Widget build(BuildContext context) {
    final d = Theme.of(context).brightness == Brightness.dark;
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 22, child: Padding(padding: const EdgeInsets.only(top: 6), child: Icon(icon, size: size, color: AppColors.primary))),
          Expanded(child: Text(text, style: AppTypography.bodySmall.copyWith(color: d ? AppColors.darkText : AppColors.text))),
        ],
      ),
    );
  }
}
