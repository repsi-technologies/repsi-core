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
    final canvas = d ? AppColors.darkBackground : AppColors.background;
    final user = ref.watch(authProvider).user;
    final gym = ref.watch(workspaceProvider).activeWorkspace?.name ?? user?.gymName;
    final theme = ref.watch(themeNotifierProvider);

    return Scaffold(
      backgroundColor: canvas,
      appBar: AppBar(
        backgroundColor: canvas,
        title: Text('More', style: AppTypography.heading.copyWith(color: _text(d), fontWeight: FontWeight.w700)),
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
          _Group(title: 'Your gym', items: [
            _Item(Icons.insights_rounded, 'Business insights', onTap: () => context.push(RouteNames.aiInsights)),
            _Item(Icons.notifications_none_rounded, 'Notifications', onTap: () => context.push(RouteNames.notifications)),
            _Item(Icons.store_mall_directory_outlined, 'Branches', onTap: () => _showBranches(context)),
            _Item(Icons.card_membership_outlined, 'Membership plans', onTap: () => _showPlans(context)),
          ]),
          _Group(title: 'App', items: [
            _Item(
              Icons.dark_mode_outlined,
              'Dark mode',
              trailing: Switch(
                value: theme == AppThemeMode.dark,
                onChanged: (on) => ref.read(themeNotifierProvider.notifier).setTheme(on ? AppThemeMode.dark : AppThemeMode.light),
              ),
            ),
          ]),
          _Group(title: 'On the web', items: [
            _Item(
              Icons.open_in_new_rounded,
              'Billing, staff roles, reports and website',
              subtitle: 'Manage these on repsi.app',
              onTap: () {
                Clipboard.setData(const ClipboardData(text: 'https://repsi.app'));
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Link copied: https://repsi.app')));
              },
            ),
          ]),
          const SizedBox(height: AppSpacing.sm),
          OutlinedButton.icon(
            onPressed: () => SignOutDialog.show(context),
            icon: Icon(Icons.logout_rounded, color: d ? AppColors.darkError : AppColors.error),
            label: Text('Sign out', style: AppTypography.button.copyWith(color: d ? AppColors.darkError : AppColors.error)),
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
      title: 'Branches',
      child: Consumer(
        builder: (context, ref, _) {
          final d = Theme.of(context).brightness == Brightness.dark;
          return ref.watch(_branchesProvider).when(
                loading: () => const Padding(padding: EdgeInsets.all(AppSpacing.xl), child: Center(child: CircularProgressIndicator())),
                error: (_, __) => Text("Couldn't load branches.", style: AppTypography.bodySmall.copyWith(color: _secondary(d))),
                data: (list) => Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    for (final b in list)
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: Icon(Icons.store_mall_directory_outlined, color: _secondary(d)),
                        title: Text(b['name']?.toString() ?? 'Branch',
                            style: AppTypography.body.copyWith(color: _text(d), fontWeight: FontWeight.w600)),
                        subtitle: Text(
                          [b['address_line1'], b['city']].where((v) => v != null && v.toString().isNotEmpty).join(' · '),
                          style: AppTypography.caption.copyWith(color: _secondary(d)),
                        ),
                        trailing: b['is_primary'] == true
                            ? Text('Main', style: AppTypography.caption.copyWith(color: _secondary(d), fontWeight: FontWeight.w600))
                            : null,
                      ),
                    const SizedBox(height: AppSpacing.sm),
                    Text('Add or edit branches on repsi.app.', style: AppTypography.caption.copyWith(color: _secondary(d))),
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
      title: 'Membership plans',
      child: Consumer(
        builder: (context, ref, _) {
          final d = Theme.of(context).brightness == Brightness.dark;
          return ref.watch(membershipPlansProvider).when(
                loading: () => const Padding(padding: EdgeInsets.all(AppSpacing.xl), child: Center(child: CircularProgressIndicator())),
                error: (_, __) => Text("Couldn't load plans.", style: AppTypography.bodySmall.copyWith(color: _secondary(d))),
                data: (plans) => Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (plans.isEmpty)
                      Text('No plans yet. Create plans on repsi.app.', style: AppTypography.bodySmall.copyWith(color: _secondary(d))),
                    for (final p in plans)
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        title: Text(p.name, style: AppTypography.body.copyWith(color: _text(d), fontWeight: FontWeight.w600)),
                        subtitle: Text('${p.months} ${p.months == 1 ? 'month' : 'months'}',
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
            color: d ? AppColors.darkSurface : AppColors.surface,
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
