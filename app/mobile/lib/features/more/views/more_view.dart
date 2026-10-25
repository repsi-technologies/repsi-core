import '../../coaching/data/coaching_api.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../staff/views/staff_admin_views.dart';
import '../../coaching/views/trainer_requests_view.dart';
import '../../../shared/widgets/theme_mode_sheet.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../app/routes/route_names.dart';
import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../core/providers/api_provider.dart';
import '../../../core/providers/theme_provider.dart';
import '../../../shared/widgets/repsi_bottom_sheet.dart';
import '../../auth/providers/auth_provider.dart';
import '../../auth/views/sign_out_dialog.dart';
import '../../auth/widgets/my_profile_photo.dart';
import '../../members/providers/member_detail_provider.dart';
import '../../workspaces/providers/workspace_provider.dart';
import '../../../l10n/l10n.dart';
import '../../../core/localization/locale_provider.dart';
import '../../../shared/widgets/language_selector_sheet.dart';
import '../../../app/theme/repsi_palette.dart';

final _branchesProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final list = (await ref.watch(apiClientProvider).get('/branches')).data as List<dynamic>? ?? const [];
  return list.whereType<Map<String, dynamic>>().toList();
});

/// Owner account and settings. Only destinations that exist in the app are listed; everything
/// that is managed on the web is one clearly labelled link.
class MoreView extends ConsumerWidget {
  const MoreView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final d = Theme.of(context).brightness == Brightness.dark;
    final canvas = d ? AppColors.darkBackground : context.palette.background;
    final user = ref.watch(authProvider).user;
    final gym = ref.watch(workspaceProvider).activeWorkspace?.name ?? user?.gymName;
    final theme = ref.watch(themeNotifierProvider);

    return Scaffold(
      backgroundColor: canvas,
      appBar: AppBar(
        backgroundColor: canvas,
        title: Text(context.l10n.commonMore, style: AppTypography.heading.copyWith(color: _text(d), fontWeight: FontWeight.w700)),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(AppSpacing.xl, AppSpacing.xs, AppSpacing.xl, AppSpacing.xxxl),
        children: [
          Row(
            children: [
              const MyProfilePhoto(size: 60),
              const SizedBox(width: AppSpacing.lg),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(user?.fullName ?? '',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppTypography.sectionHeading.copyWith(color: _text(d))),
                    Text(
                      [if (gym != null) gym, _role(user?.role)].join(' · '),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppTypography.caption.copyWith(color: _secondary(d)),
                    ),
                    if (user?.email.isNotEmpty == true)
                      Text(user!.email, style: AppTypography.caption.copyWith(color: _secondary(d))),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.xxl),
          _Group(title: context.l10n.yourGym, items: [
            _Item(Icons.insights_rounded, context.l10n.businessInsights, onTap: () => context.push(RouteNames.aiInsights)),
            _Item(Icons.notifications_none_rounded, context.l10n.commonNotifications, onTap: () => context.push(RouteNames.notifications)),
            _Item(Icons.store_mall_directory_outlined, context.l10n.branches, onTap: () => _showBranches(context)),
            _Item(Icons.card_membership_outlined, context.l10n.membershipPlans, onTap: () => _showPlans(context)),
            _Item(
              Icons.how_to_reg_outlined,
              context.l10n.trainerRequests,
              subtitle: context.l10n.trainerRequestsDesc,
              trailing: _PendingRequestsBadge(),
              onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const TrainerRequestsView())),
            ),
            _Item(LucideIcons.shieldCheck, context.l10n.staffAndPermissions, subtitle: context.l10n.staffAndPermissionsDesc,
                onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const StaffPermissionsView()))),
            _Item(LucideIcons.clock3, context.l10n.staffAttendance, subtitle: context.l10n.staffAttendanceDesc,
                onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const StaffAttendanceView()))),
            _Item(Icons.person_add_outlined, context.l10n.addTrainer, subtitle: context.l10n.addTrainerDesc, onTap: () => context.push(RouteNames.addTrainer)),
          ]),
          _Group(title: context.l10n.app, items: [
            _Item(
              Icons.translate_rounded,
              context.l10n.commonLanguage,
              subtitle: ref.watch(localeNotifierProvider).nativeName,
              onTap: () => LanguageSelectorSheet.show(context),
            ),
            _Item(
              Icons.contrast_rounded,
              context.l10n.appearance,
              subtitle: ThemeModeSheet.label(context.l10n, theme),
              onTap: () => ThemeModeSheet.show(context),
            ),
          ]),
          _Group(title: context.l10n.onTheWeb, items: [
            _Item(
              Icons.open_in_new_rounded,
              context.l10n.onTheWebTitle,
              subtitle: context.l10n.manageOnWeb,
              onTap: () {
                Clipboard.setData(const ClipboardData(text: 'https://repsi.app'));
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(context.l10n.commonLinkCopied)));
              },
            ),
          ]),
          const SizedBox(height: AppSpacing.sm),
          OutlinedButton.icon(
            onPressed: () => SignOutDialog.show(context),
            icon: Icon(Icons.logout_rounded, color: d ? AppColors.darkError : context.palette.error),
            label: Text(context.l10n.commonSignOut, style: AppTypography.button.copyWith(color: d ? AppColors.darkError : context.palette.error)),
            style: OutlinedButton.styleFrom(side: BorderSide(color: _border(d))),
          ),
        ],
      ),
    );
  }

  static String _role(String? role) {
    final r = (role ?? '').toLowerCase().replaceAll('_', ' ');
    return r.isEmpty ? '' : r[0].toUpperCase() + r.substring(1);
  }

  void _showBranches(BuildContext context) {
    RepsiBottomSheet.show<void>(
      context: context,
      title: context.l10n.branches,
      child: Consumer(
        builder: (context, ref, _) {
          final d = Theme.of(context).brightness == Brightness.dark;
          return ref.watch(_branchesProvider).when(
                loading: () => const Padding(padding: EdgeInsets.all(AppSpacing.xl), child: Center(child: CircularProgressIndicator())),
                error: (_, __) => Text(context.l10n.errorLoadBranches, style: AppTypography.bodySmall.copyWith(color: _secondary(d))),
                data: (list) => Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    for (final b in list)
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: Icon(Icons.store_mall_directory_outlined, color: _secondary(d)),
                        title: Text(b['name']?.toString() ?? context.l10n.branch,
                            style: AppTypography.body.copyWith(color: _text(d), fontWeight: FontWeight.w600)),
                        subtitle: Text(
                          [b['address_line1'], b['city']].where((v) => v != null && v.toString().isNotEmpty).join(' · '),
                          style: AppTypography.caption.copyWith(color: _secondary(d)),
                        ),
                        trailing: b['is_primary'] == true
                            ? Text(context.l10n.mainBranch, style: AppTypography.caption.copyWith(color: _secondary(d), fontWeight: FontWeight.w600))
                            : null,
                      ),
                    const SizedBox(height: AppSpacing.sm),
                    Text(context.l10n.editBranchesOnWeb, style: AppTypography.caption.copyWith(color: _secondary(d))),
                  ],
                ),
              );
        },
      ),
    );
  }

  void _showPlans(BuildContext context) {
    final inr = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);
    RepsiBottomSheet.show<void>(
      context: context,
      title: context.l10n.membershipPlans,
      child: Consumer(
        builder: (context, ref, _) {
          final d = Theme.of(context).brightness == Brightness.dark;
          return ref.watch(membershipPlansProvider).when(
                loading: () => const Padding(padding: EdgeInsets.all(AppSpacing.xl), child: Center(child: CircularProgressIndicator())),
                error: (_, __) => Text(context.l10n.errorLoadPlans, style: AppTypography.bodySmall.copyWith(color: _secondary(d))),
                data: (plans) => Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (plans.isEmpty)
                      Text(context.l10n.noPlansYet, style: AppTypography.bodySmall.copyWith(color: _secondary(d))),
                    for (final p in plans)
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        title: Text(p.name, style: AppTypography.body.copyWith(color: _text(d), fontWeight: FontWeight.w600)),
                        subtitle: Text(context.l10n.commonMonths(p.months),
                            style: AppTypography.caption.copyWith(color: _secondary(d))),
                        trailing: Text(inr.format(p.price),
                            style: AppTypography.tabularNumber(fontSize: 15, fontWeight: FontWeight.w600, color: _text(d))),
                      ),
                  ],
                ),
              );
        },
      ),
    );
  }
}

/// Pending trainer requests count; hidden when zero or unavailable (no permission).
class _PendingRequestsBadge extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final count = ref.watch(trainerRequestsProvider('pending')).valueOrNull?.pendingCount ?? 0;
    if (count == 0) return Icon(Icons.chevron_right_rounded, color: context.palette.textMuted);
    // No `alignment`: inside a ListTile trailing slot it would stretch to the full tile width.
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(12)),
      child: Text('$count', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 12)),
    );
  }
}

Color _text(bool d) => d ? AppColors.darkText : AppColors.text;
Color _secondary(bool d) => d ? AppColors.darkTextSecondary : AppColors.textSecondary;
Color _border(bool d) => d ? AppColors.darkBorder : AppColors.border;

class _Item {
  final IconData icon;
  final String title;
  final String? subtitle;
  final VoidCallback? onTap;
  final Widget? trailing;

  const _Item(this.icon, this.title, {this.subtitle, this.onTap, this.trailing});
}

class _Group extends StatelessWidget {
  final String title;
  final List<_Item> items;

  const _Group({required this.title, required this.items});

  @override
  Widget build(BuildContext context) {
    final d = Theme.of(context).brightness == Brightness.dark;
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.xl),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: AppSpacing.xs, bottom: AppSpacing.sm),
            child: Semantics(
              header: true,
              child: Text(title, style: AppTypography.caption.copyWith(color: _secondary(d), fontWeight: FontWeight.w600)),
            ),
          ),
          Material(
            color: d ? AppColors.darkSurface : context.palette.surface,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppSpacing.radiusCard),
              side: BorderSide(color: _border(d)),
            ),
            clipBehavior: Clip.antiAlias,
            child: Column(
              children: [
                for (var i = 0; i < items.length; i++) ...[
                  if (i > 0) Divider(height: 1, indent: 56, color: _border(d)),
                  ListTile(
                    onTap: items[i].onTap,
                    leading: Icon(items[i].icon, color: _secondary(d)),
                    title: Text(items[i].title, style: AppTypography.body.copyWith(color: _text(d), fontWeight: FontWeight.w500)),
                    subtitle: items[i].subtitle == null
                        ? null
                        : Text(items[i].subtitle!, style: AppTypography.caption.copyWith(color: _secondary(d))),
                    trailing: items[i].trailing ?? (items[i].onTap != null ? Icon(Icons.chevron_right_rounded, color: _secondary(d)) : null),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
