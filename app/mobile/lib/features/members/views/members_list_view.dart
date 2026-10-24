import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../app/routes/route_names.dart';
import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../shared/models/member_model.dart';
import '../../../shared/widgets/repsi_avatar.dart';
import '../../../shared/widgets/repsi_empty_state.dart';
import '../../../shared/widgets/repsi_error_state.dart';
import '../../../shared/widgets/repsi_search_field.dart';
import '../../../shared/widgets/repsi_skeleton.dart';
import '../../../shared/widgets/repsi_status_badge.dart';
import '../providers/member_provider.dart';
import '../../../l10n/l10n.dart';

/// Member directory: search (name, phone, email), membership-state filters, paged rows.
class MembersListView extends ConsumerStatefulWidget {
  const MembersListView({super.key});

  @override
  ConsumerState<MembersListView> createState() => _MembersListViewState();
}

class _MembersListViewState extends ConsumerState<MembersListView> {
  List<(String, String)> get _filters => [('ALL', context.l10n.commonAll), ('ACTIVE', context.l10n.commonActive), ('EXPIRING', context.l10n.endingSoon), ('EXPIRED', context.l10n.commonExpired), ('FROZEN', context.l10n.statusFrozen)];
  final _scroll = ScrollController();
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    _scroll.addListener(() {
      if (_scroll.position.extentAfter < 400) ref.read(memberListProvider.notifier).loadMore();
    });
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _scroll.dispose();
    super.dispose();
  }

  void _onSearch(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 300), () => ref.read(memberListProvider.notifier).setSearchQuery(value));
  }

  Future<void> _addMember() async {
    await context.push(RouteNames.addMember);
    if (mounted) ref.read(memberListProvider.notifier).fetchMembers();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final state = ref.watch(memberListProvider);
    final notifier = ref.read(memberListProvider.notifier);
    final text = isDark ? AppColors.darkText : AppColors.text;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.background,
      appBar: AppBar(
        backgroundColor: isDark ? AppColors.darkBackground : AppColors.background,
        title: Text(context.l10n.commonMembers, style: AppTypography.heading.copyWith(color: text, fontWeight: FontWeight.w700)),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: AppSpacing.md),
            child: FilledButton.icon(
              onPressed: _addMember,
              icon: const Icon(Icons.person_add_alt_1_rounded, size: 18),
              label: Text(context.l10n.commonAdd),
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                minimumSize: const Size(0, 40),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSpacing.radiusButton)),
              ),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(AppSpacing.xl, AppSpacing.xs, AppSpacing.xl, AppSpacing.md),
            child: RepsiSearchField(
              hintText: context.l10n.searchMembersHint,
              onChanged: _onSearch,
              onClear: () => notifier.setSearchQuery(''),
            ),
          ),
          SizedBox(
            height: 40,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
              itemCount: _filters.length,
              separatorBuilder: (_, __) => const SizedBox(width: AppSpacing.sm),
              itemBuilder: (context, i) {
                final (key, label) = _filters[i];
                final selected = state.selectedStatusFilter == key;
                return ChoiceChip(
                  label: Text(label),
                  selected: selected,
                  showCheckmark: false,
                  onSelected: (_) => notifier.setStatusFilter(key),
                  labelStyle: AppTypography.caption.copyWith(
                    fontWeight: FontWeight.w600,
                    color: selected ? Colors.white : text,
                  ),
                  selectedColor: AppColors.primary,
                  backgroundColor: isDark ? AppColors.darkSurface : AppColors.surface,
                  side: BorderSide(color: selected ? AppColors.primary : (isDark ? AppColors.darkBorder : AppColors.border)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSpacing.radiusPill)),
                );
              },
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Expanded(child: _body(state, notifier, isDark)),
        ],
      ),
    );
  }

  Widget _body(MemberListState state, MemberListNotifier notifier, bool isDark) {
    if (state.isLoading && state.members.isEmpty) {
      return ListView(children: [for (var i = 0; i < 8; i++) RepsiSkeleton.memberListItem()]);
    }
    if (state.errorMessage != null && state.members.isEmpty) {
      return RepsiErrorState(title: context.l10n.errorLoadMembers, message: state.errorMessage!, onRetry: notifier.fetchMembers);
    }
    if (state.members.isEmpty) {
      final filtered = state.searchQuery.isNotEmpty || state.selectedStatusFilter != 'ALL';
      return RepsiEmptyState(
        icon: filtered ? Icons.search_off_rounded : Icons.group_add_outlined,
        title: filtered ? context.l10n.noMembersMatch : context.l10n.noMembersYet,
        message: filtered ? context.l10n.tryAnotherSearch : context.l10n.addFirstMember,
        actionLabel: filtered ? null : context.l10n.addMember,
        onAction: filtered ? null : _addMember,
      );
    }
    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: notifier.fetchMembers,
      child: ListView.separated(
        controller: _scroll,
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.only(bottom: AppSpacing.xxxl),
        itemCount: state.members.length + (state.isLoadingMore ? 1 : 0),
        separatorBuilder: (_, __) => Divider(height: 1, indent: 76, color: isDark ? AppColors.darkBorder : AppColors.border),
        itemBuilder: (context, i) {
          if (i >= state.members.length) {
            return const Padding(
              padding: EdgeInsets.all(AppSpacing.lg),
              child: Center(child: SizedBox.square(dimension: 22, child: CircularProgressIndicator(strokeWidth: 2.2))),
            );
          }
          return _MemberRow(member: state.members[i], isDark: isDark);
        },
      ),
    );
  }
}

class _MemberRow extends StatelessWidget {
  final MemberModel member;
  final bool isDark;

  const _MemberRow({required this.member, required this.isDark});

  String? _membershipLine(BuildContext context) {
    final end = member.endDate;
    final plan = member.planName;
    if (end == null) return plan;
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final when = DateFormat('d MMM').format(end);
    final ending = end.isBefore(today) ? context.l10n.memberEnded(when) : context.l10n.memberEnds(when);
    return plan == null ? ending[0].toUpperCase() + ending.substring(1) : '$plan · $ending';
  }

  @override
  Widget build(BuildContext context) {
    final name = member.fullName.isEmpty ? context.l10n.commonMember : member.fullName;
    final line = _membershipLine(context) ?? member.phone ?? member.email;
    return InkWell(
      onTap: () => context.push('/members/${member.id}'),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl, vertical: AppSpacing.md),
        child: Row(
          children: [
            RepsiAvatar(name: name, imageUrl: member.avatarUrl, size: 44),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppTypography.body.copyWith(
                      color: isDark ? AppColors.darkText : AppColors.text,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  if (line.isNotEmpty)
                    Text(
                      line,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppTypography.caption.copyWith(color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary),
                    ),
                ],
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
            RepsiStatusBadge(status: member.status),
          ],
        ),
      ),
    );
  }
}
