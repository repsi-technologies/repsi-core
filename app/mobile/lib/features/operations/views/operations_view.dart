import 'dart:async';

import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../../app/routes/route_names.dart';
import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../core/api/api_error.dart';
import '../../../shared/models/member_model.dart';
import '../../../shared/widgets/repsi_avatar.dart';
import '../../../shared/widgets/repsi_bottom_sheet.dart';
import '../../../shared/widgets/repsi_button.dart';
import '../../../shared/widgets/repsi_empty_state.dart';
import '../../../shared/widgets/repsi_error_state.dart';
import '../../../shared/widgets/repsi_search_field.dart';
import '../../../shared/widgets/repsi_skeleton.dart';
import '../../../shared/widgets/repsi_text_field.dart';
import '../../members/providers/member_provider.dart';
import '../providers/operations_provider.dart';
import '../../../l10n/l10n.dart';
import '../../../app/theme/repsi_palette.dart';

/// Front desk: today's attendance with check-in/check-out, the sales pipeline, the gym's live
/// check-in QR and the team. Everything is read from and written to the API.
class OperationsView extends ConsumerWidget {
  const OperationsView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final canvas = isDark ? AppColors.darkBackground : context.palette.background;
    return DefaultTabController(
      length: 4,
      child: Scaffold(
        backgroundColor: canvas,
        appBar: AppBar(
          backgroundColor: canvas,
          title: Text(context.l10n.commonFrontDesk, style: AppTypography.heading.copyWith(color: _text(isDark), fontWeight: FontWeight.w700)),
          bottom: TabBar(
            isScrollable: true,
            tabAlignment: TabAlignment.start,
            tabs: [Tab(text: context.l10n.commonAttendance), Tab(text: context.l10n.leads), Tab(text: context.l10n.checkInQr), Tab(text: context.l10n.team)],
          ),
        ),
        body: const TabBarView(children: [_AttendanceTab(), _LeadsTab(), _QrTab(), _TeamTab()]),
      ),
    );
  }
}

Color _text(bool d) => d ? AppColors.darkText : AppColors.text;
Color _secondary(bool d) => d ? AppColors.darkTextSecondary : AppColors.textSecondary;
Color _surface(bool d) => d ? AppColors.darkSurface : AppColors.surface;
Color _border(bool d) => d ? AppColors.darkBorder : AppColors.border;

String _err(Object e) => e is ApiError ? e.message : L10n.current.commonSomethingWentWrong;

Widget _skeletonList() => ListView(children: [for (var i = 0; i < 5; i++) RepsiSkeleton.memberListItem()]);

// ─── Attendance ──────────────────────────────────────────────────────────────

class _AttendanceTab extends ConsumerWidget {
  const _AttendanceTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final today = ref.watch(attendanceTodayProvider);
    final inside = ref.watch(insideListProvider);

    Future<void> refresh() async {
      ref.invalidate(attendanceTodayProvider);
      ref.invalidate(insideListProvider);
      await ref.read(insideListProvider.future).catchError((_) => <InsidePerson>[]);
    }

    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: refresh,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(AppSpacing.xl),
        children: [
          Container(
            padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
            decoration: BoxDecoration(
              color: _surface(isDark),
              borderRadius: BorderRadius.circular(AppSpacing.radiusCard),
              border: Border.all(color: _border(isDark)),
            ),
            child: today.when(
              loading: () => const SizedBox(height: 52),
              error: (_, __) => Padding(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                child: Text(context.l10n.errorLoadToday, style: AppTypography.bodySmall.copyWith(color: _secondary(isDark))),
              ),
              data: (t) => IntrinsicHeight(
                child: Row(
                  children: [
                    _Figure(context.l10n.insideNow, '${t.inside}'),
                    VerticalDivider(color: _border(isDark), width: 1),
                    _Figure(context.l10n.commonToday, '${t.total}'),
                    VerticalDivider(color: _border(isDark), width: 1),
                    _Figure(context.l10n.avgStay, t.averageMinutes > 0 ? '${t.averageMinutes}m' : '—'),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          RepsiButton(
            text: context.l10n.checkInMember,
            isFullWidth: true,
            leadingIcon: const Icon(Icons.how_to_reg_rounded, size: 20, color: Colors.white),
            onPressed: () => RepsiBottomSheet.show<void>(context: context, title: context.l10n.commonCheckIn, child: const _CheckInSheet()),
          ),
          const SizedBox(height: AppSpacing.xxl),
          Text(context.l10n.commonInTheGymNow, style: AppTypography.sectionHeading.copyWith(color: _text(isDark), fontSize: 17)),
          const SizedBox(height: AppSpacing.md),
          inside.when(
            loading: () => Column(children: [for (var i = 0; i < 3; i++) RepsiSkeleton.memberListItem()]),
            error: (e, _) => RepsiErrorState(title: context.l10n.errorLoadAttendance, message: _err(e), onRetry: refresh),
            data: (people) => people.isEmpty
                ? Padding(
                    padding: const EdgeInsets.symmetric(vertical: AppSpacing.xl),
                    child: Text(context.l10n.commonNoOneCheckedIn,
                        textAlign: TextAlign.center, style: AppTypography.bodySmall.copyWith(color: _secondary(isDark))),
                  )
                : Container(
                    decoration: BoxDecoration(
                      color: _surface(isDark),
                      borderRadius: BorderRadius.circular(AppSpacing.radiusCard),
                      border: Border.all(color: _border(isDark)),
                    ),
                    child: Column(
                      children: [
                        for (var i = 0; i < people.length; i++) ...[
                          if (i > 0) Divider(height: 1, indent: 64, color: _border(isDark)),
                          _InsideRow(key: ValueKey(people[i].attendanceId), person: people[i]),
                        ],
                      ],
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

class _Figure extends StatelessWidget {
  final String label;
  final String value;

  const _Figure(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Expanded(
      child: Column(
        children: [
          Text(value, style: AppTypography.tabularNumber(fontSize: 22, fontWeight: FontWeight.w700, color: _text(isDark))),
          Text(label, style: AppTypography.caption.copyWith(color: _secondary(isDark))),
        ],
      ),
    );
  }
}

class _InsideRow extends ConsumerStatefulWidget {
  final InsidePerson person;

  const _InsideRow({super.key, required this.person});

  @override
  ConsumerState<_InsideRow> createState() => _InsideRowState();
}

class _InsideRowState extends ConsumerState<_InsideRow> {
  bool _busy = false;

  Future<void> _checkOut() async {
    setState(() => _busy = true);
    final messenger = ScaffoldMessenger.of(context);
    try {
      await ref.read(frontDeskActionsProvider).checkOut(widget.person.attendanceId);
      HapticFeedback.lightImpact();
      messenger.showSnackBar(SnackBar(content: Text(L10n.current.opsCheckedOut(widget.person.name))));
    } catch (e) {
      messenger.showSnackBar(SnackBar(content: Text(_err(e))));
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final p = widget.person;
    return ListTile(
      contentPadding: const EdgeInsets.only(left: AppSpacing.lg, right: AppSpacing.sm),
      leading: RepsiAvatar(name: p.name, imageUrl: p.avatarUrl, size: 36),
      title: Text(p.name,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: AppTypography.bodySmall.copyWith(color: _text(isDark), fontWeight: FontWeight.w600)),
      subtitle: Text(context.l10n.opsInAt(DateFormat.jm().format(p.checkIn), p.duration),
          style: AppTypography.caption.copyWith(color: _secondary(isDark))),
      trailing: _busy
          ? const SizedBox.square(dimension: 20, child: CircularProgressIndicator(strokeWidth: 2))
          : TextButton(onPressed: _checkOut, child: Text(context.l10n.commonCheckOut)),
    );
  }
}

class _CheckInSheet extends ConsumerStatefulWidget {
  const _CheckInSheet();

  @override
  ConsumerState<_CheckInSheet> createState() => _CheckInSheetState();
}

class _CheckInSheetState extends ConsumerState<_CheckInSheet> {
  Timer? _debounce;
  List<MemberModel> _results = const [];
  bool _searching = false;
  String? _busyId;
  String? _error;

  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }

  void _search(String q) {
    _debounce?.cancel();
    if (q.trim().length < 2) {
      setState(() => _results = const []);
      return;
    }
    _debounce = Timer(const Duration(milliseconds: 300), () async {
      setState(() => _searching = true);
      try {
        final list = await ref.read(memberServiceProvider).getMembers(search: q, limit: 20);
        if (mounted) setState(() => _results = list);
      } catch (e) {
        if (mounted) setState(() => _error = _err(e));
      } finally {
        if (mounted) setState(() => _searching = false);
      }
    });
  }

  Future<void> _checkIn(MemberModel m) async {
    setState(() {
      _busyId = m.id;
      _error = null;
    });
    try {
      await ref.read(frontDeskActionsProvider).checkIn(m.id);
      HapticFeedback.mediumImpact();
      if (!mounted) return;
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(L10n.current.opsCheckedIn(m.fullName))));
    } catch (e) {
      // Access rules (expired membership, already inside) come back as a clear message.
      if (mounted) setState(() => _error = _err(e));
    } finally {
      if (mounted) setState(() => _busyId = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return SizedBox(
      height: MediaQuery.sizeOf(context).height * 0.6,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          RepsiSearchField(hintText: context.l10n.searchNameOrPhone, onChanged: _search),
          if (_error != null) ...[
            const SizedBox(height: AppSpacing.md),
            Text(_error!, style: AppTypography.caption.copyWith(color: isDark ? AppColors.darkError : context.palette.error)),
          ],
          const SizedBox(height: AppSpacing.sm),
          Expanded(
            child: _searching
                ? const Center(child: CircularProgressIndicator(strokeWidth: 2))
                : _results.isEmpty
                    ? Center(
                        child: Text(context.l10n.typeTwoLetters,
                            textAlign: TextAlign.center, style: AppTypography.bodySmall.copyWith(color: _secondary(isDark))),
                      )
                    : ListView.builder(
                        itemCount: _results.length,
                        itemBuilder: (context, i) {
                          final m = _results[i];
                          return ListTile(
                            contentPadding: EdgeInsets.zero,
                            leading: RepsiAvatar(name: m.fullName, imageUrl: m.avatarUrl, size: 36),
                            title: Text(m.fullName, style: AppTypography.bodySmall.copyWith(color: _text(isDark), fontWeight: FontWeight.w600)),
                            subtitle: Text(m.status.displayName, style: AppTypography.caption.copyWith(color: _secondary(isDark))),
                            trailing: _busyId == m.id
                                ? const SizedBox.square(dimension: 20, child: CircularProgressIndicator(strokeWidth: 2))
                                : FilledButton.tonal(onPressed: _busyId == null ? () => _checkIn(m) : null, child: Text(context.l10n.commonCheckIn)),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}

// ─── Leads ───────────────────────────────────────────────────────────────────

class _LeadsTab extends ConsumerStatefulWidget {
  const _LeadsTab();

  @override
  ConsumerState<_LeadsTab> createState() => _LeadsTabState();
}

class _LeadsTabState extends ConsumerState<_LeadsTab> {
  String _stage = '';
  String _searchQuery = '';
  String _quickFilter = 'all'; // 'all', 'high_priority', 'due_today'
  final _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final leads = ref.watch(leadsProvider(_stage));
    final metricsAsync = ref.watch(crmMetricsProvider);

    return Column(
      children: [
        // Top CRM Metrics Carousel
        metricsAsync.when(
          data: (m) => Container(
            height: 82,
            margin: const EdgeInsets.fromLTRB(AppSpacing.xl, AppSpacing.sm, AppSpacing.xl, 4),
            child: ListView(
              scrollDirection: Axis.horizontal,
              children: [
                _KpiMiniCard(
                  title: 'Total Leads',
                  value: '${m.totalLeads}',
                  subtext: '+${m.newLeads} this mo',
                  icon: Icons.groups_rounded,
                  color: AppColors.primary,
                  isDark: isDark,
                ),
                const SizedBox(width: 8),
                _KpiMiniCard(
                  title: 'Follow-ups',
                  value: '${m.followUpsDueToday}',
                  subtext: '${m.overdueFollowUps} overdue',
                  icon: Icons.access_time_rounded,
                  color: const Color(0xFFF59E0B),
                  isDark: isDark,
                ),
                const SizedBox(width: 8),
                _KpiMiniCard(
                  title: 'Active Trials',
                  value: '${m.trials}',
                  subtext: 'Free sessions',
                  icon: Icons.flash_on_rounded,
                  color: const Color(0xFF8B5CF6),
                  isDark: isDark,
                ),
                const SizedBox(width: 8),
                _KpiMiniCard(
                  title: 'Pipeline Est.',
                  value: m.estimatedPipelineValue > 0 ? '₹${(m.estimatedPipelineValue / 1000).toStringAsFixed(1)}k' : '₹0',
                  subtext: 'Potential',
                  icon: Icons.account_balance_wallet_outlined,
                  color: const Color(0xFF10B981),
                  isDark: isDark,
                ),
                const SizedBox(width: 8),
                _KpiMiniCard(
                  title: 'Conversion',
                  value: '${m.conversionRate.toStringAsFixed(1)}%',
                  subtext: 'Lead to member',
                  icon: Icons.trending_up_rounded,
                  color: const Color(0xFF06B6D4),
                  isDark: isDark,
                ),
              ],
            ),
          ),
          loading: () => const SizedBox.shrink(),
          error: (_, __) => const SizedBox.shrink(),
        ),

        // Search & Quick Filter Row
        Padding(
          padding: const EdgeInsets.fromLTRB(AppSpacing.xl, 4, AppSpacing.xl, 4),
          child: Row(
            children: [
              Expanded(
                child: SizedBox(
                  height: 38,
                  child: TextField(
                    controller: _searchController,
                    onChanged: (q) => setState(() => _searchQuery = q.trim().toLowerCase()),
                    style: AppTypography.caption.copyWith(color: _text(isDark)),
                    decoration: InputDecoration(
                      hintText: 'Search leads, phone, plan...',
                      hintStyle: AppTypography.caption.copyWith(color: _secondary(isDark)),
                      prefixIcon: Icon(Icons.search, size: 18, color: _secondary(isDark)),
                      suffixIcon: _searchQuery.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear, size: 16),
                              onPressed: () {
                                _searchController.clear();
                                setState(() => _searchQuery = '');
                              },
                            )
                          : null,
                      filled: true,
                      fillColor: _surface(isDark),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 0),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: BorderSide(color: _border(isDark)),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: BorderSide(color: _border(isDark)),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              ChoiceChip(
                label: const Text('🔥 Hot'),
                selected: _quickFilter == 'high_priority',
                onSelected: (_) => setState(() => _quickFilter = _quickFilter == 'high_priority' ? 'all' : 'high_priority'),
                selectedColor: AppColors.primary.withValues(alpha: 0.2),
                labelStyle: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: _quickFilter == 'high_priority' ? AppColors.primary : _secondary(isDark),
                ),
                side: BorderSide(color: _quickFilter == 'high_priority' ? AppColors.primary : _border(isDark)),
                backgroundColor: _surface(isDark),
              ),
            ],
          ),
        ),

        // Stage Choice Chips
        SizedBox(
          height: 48,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.fromLTRB(AppSpacing.xl, 4, AppSpacing.xl, 4),
            itemCount: leadStages.length,
            separatorBuilder: (_, __) => const SizedBox(width: AppSpacing.sm),
            itemBuilder: (context, i) {
              final (key, _) = leadStages[i];
              final label = leadStageLabel(key);
              final selected = key == _stage;
              return ChoiceChip(
                label: Text(label),
                selected: selected,
                showCheckmark: false,
                onSelected: (_) => setState(() => _stage = key),
                selectedColor: AppColors.primary,
                labelStyle: AppTypography.caption.copyWith(fontWeight: FontWeight.w600, color: selected ? Colors.white : _text(isDark)),
                backgroundColor: _surface(isDark),
                side: BorderSide(color: selected ? AppColors.primary : _border(isDark)),
                shape: const StadiumBorder(),
              );
            },
          ),
        ),

        // Leads List
        Expanded(
          child: leads.when(
            loading: _skeletonList,
            error: (e, _) => RepsiErrorState(
                title: context.l10n.errorLoadLeads, message: _err(e), onRetry: () => ref.invalidate(leadsProvider(_stage))),
            data: (list) {
              var filtered = list;
              if (_quickFilter == 'high_priority') {
                filtered = filtered.where((l) => l.priority.toLowerCase() == 'high' || l.priority.toLowerCase() == 'urgent').toList();
              }
              if (_searchQuery.isNotEmpty) {
                filtered = filtered.where((l) {
                  final name = l.name.toLowerCase();
                  final phone = l.phone.toLowerCase();
                  final interest = (l.interest ?? '').toLowerCase();
                  final source = l.source.toLowerCase();
                  return name.contains(_searchQuery) ||
                      phone.contains(_searchQuery) ||
                      interest.contains(_searchQuery) ||
                      source.contains(_searchQuery);
                }).toList();
              }

              return RefreshIndicator(
                color: AppColors.primary,
                onRefresh: () async {
                  ref.invalidate(leadsProvider(_stage));
                  ref.invalidate(crmMetricsProvider);
                },
                child: filtered.isEmpty
                    ? ListView(children: [
                        const SizedBox(height: AppSpacing.xxxl),
                        RepsiEmptyState(
                          icon: Icons.person_search_outlined,
                          title: _searchQuery.isNotEmpty
                              ? 'No matching leads'
                              : (_stage.isEmpty ? context.l10n.noLeadsYet : context.l10n.noLeadsInStage),
                          message: context.l10n.leadsEmptyDesc,
                          actionLabel: context.l10n.addLead,
                          onAction: () => _addLead(context),
                        ),
                      ])
                    : ListView.separated(
                        padding: const EdgeInsets.fromLTRB(AppSpacing.xl, 4, AppSpacing.xl, 96),
                        itemCount: filtered.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 8),
                        itemBuilder: (context, i) => _LeadCard(lead: filtered[i]),
                      ),
              );
            },
          ),
        ),

        SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(AppSpacing.xl, AppSpacing.sm, AppSpacing.xl, AppSpacing.md),
            child: RepsiButton(
              text: context.l10n.addLead,
              isFullWidth: true,
              variant: RepsiButtonVariant.primary,
              leadingIcon: const Icon(Icons.add_rounded, size: 20, color: Colors.white),
              onPressed: () => _addLead(context),
            ),
          ),
        ),
      ],
    );
  }

  void _addLead(BuildContext context) {
    RepsiBottomSheet.show<void>(context: context, title: context.l10n.newLead, child: const _AddLeadSheet());
  }
}

class _KpiMiniCard extends StatelessWidget {
  final String title;
  final String value;
  final String subtext;
  final IconData icon;
  final Color color;
  final bool isDark;

  const _KpiMiniCard({
    required this.title,
    required this.value,
    required this.subtext,
    required this.icon,
    required this.color,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 114,
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: _surface(isDark),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: _border(isDark)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title, style: AppTypography.caption.copyWith(fontSize: 10, color: _secondary(isDark), fontWeight: FontWeight.w600)),
              Icon(icon, size: 14, color: color),
            ],
          ),
          const SizedBox(height: 2),
          Text(value, style: AppTypography.bodySmall.copyWith(fontSize: 16, fontWeight: FontWeight.w800, color: _text(isDark))),
          Text(subtext, maxLines: 1, overflow: TextOverflow.ellipsis, style: AppTypography.caption.copyWith(fontSize: 9, color: color, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

class _LeadCard extends ConsumerWidget {
  final LeadItem lead;

  const _LeadCard({required this.lead});

  Future<void> _openUrl(BuildContext context, Uri uri) async {
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication) && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(context.l10n.errorGeneric)));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final l = context.l10n;
    final digits = lead.phone.replaceAll(RegExp(r'[^0-9]'), '');
    final followUp = lead.nextFollowUp;
    final isOverdue = followUp != null && followUp.isBefore(DateTime.now()) && lead.status != 'converted' && lead.status != 'lost';
    final isDueToday = followUp != null && !isOverdue &&
        followUp.year == DateTime.now().year &&
        followUp.month == DateTime.now().month &&
        followUp.day == DateTime.now().day;
    final isHot = lead.priority.toLowerCase() == 'high' || lead.priority.toLowerCase() == 'urgent';

    return Material(
      color: _surface(isDark),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: BorderSide(
          color: isOverdue
              ? const Color(0xFFEF4444).withValues(alpha: 0.5)
              : (isDueToday ? const Color(0xFFF59E0B).withValues(alpha: 0.5) : _border(isDark)),
        ),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: () => RepsiBottomSheet.show<void>(
          context: context,
          title: lead.name.isEmpty ? lead.phone : lead.name,
          child: _LeadActionsSheet(lead: lead),
        ),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  RepsiAvatar(name: lead.name, size: 42),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Flexible(
                              child: Text(
                                lead.name.isEmpty ? lead.phone : lead.name,
                                style: AppTypography.bodySmall.copyWith(
                                  color: _text(isDark),
                                  fontWeight: FontWeight.w700,
                                  fontSize: 15,
                                ),
                              ),
                            ),
                            if (isHot) ...[
                              const SizedBox(width: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFEF4444).withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: const Text(
                                  '🔥 HOT',
                                  style: TextStyle(color: Color(0xFFEF4444), fontSize: 9, fontWeight: FontWeight.w800),
                                ),
                              ),
                            ],
                          ],
                        ),
                        const SizedBox(height: 2),
                        Row(
                          children: [
                            Text(lead.phone, style: AppTypography.caption.copyWith(color: _secondary(isDark), fontSize: 12)),
                            if (lead.expectedValue > 0) ...[
                              const Text(' · ', style: TextStyle(color: Colors.grey)),
                              Text(
                                '₹${lead.expectedValue.toStringAsFixed(0)}',
                                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 11, color: Color(0xFF10B981)),
                              ),
                            ],
                          ],
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: isDark ? AppColors.darkSurfaceElevated : context.palette.surfaceSecondary,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      leadStageLabel(lead.status),
                      style: AppTypography.caption.copyWith(
                        color: _text(isDark),
                        fontWeight: FontWeight.w700,
                        fontSize: 11,
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 8),

              // Badges & Meta
              Wrap(
                spacing: 6,
                runSpacing: 4,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.05),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(lead.source, style: AppTypography.caption.copyWith(fontSize: 10, color: _secondary(isDark))),
                  ),
                  if (lead.interest != null && lead.interest!.isNotEmpty)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        lead.interest!,
                        style: const TextStyle(fontSize: 10, color: AppColors.primary, fontWeight: FontWeight.w600),
                      ),
                    ),
                  if (followUp != null && lead.status != 'lost' && lead.status != 'converted')
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: (isOverdue ? const Color(0xFFEF4444) : (isDueToday ? const Color(0xFFF59E0B) : const Color(0xFF10B981)))
                            .withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.calendar_today_rounded,
                            size: 10,
                            color: isOverdue ? const Color(0xFFEF4444) : (isDueToday ? const Color(0xFFF59E0B) : const Color(0xFF10B981)),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            isOverdue
                                ? 'Overdue (${DateFormat('d MMM').format(followUp)})'
                                : (isDueToday ? 'Due Today' : DateFormat('d MMM').format(followUp)),
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: isOverdue ? const Color(0xFFEF4444) : (isDueToday ? const Color(0xFFF59E0B) : const Color(0xFF10B981)),
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),

              const SizedBox(height: 10),
              const Divider(height: 1),
              const SizedBox(height: 6),

              // Interactive Quick Action Buttons
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  IconButton.filledTonal(
                    tooltip: 'Call lead',
                    style: IconButton.styleFrom(
                      padding: EdgeInsets.zero,
                      minimumSize: const Size(34, 34),
                      backgroundColor: isDark ? AppColors.darkSurfaceElevated : context.palette.surfaceSecondary,
                    ),
                    onPressed: digits.isEmpty ? null : () => _openUrl(context, Uri(scheme: 'tel', path: digits)),
                    icon: const Icon(Icons.call_rounded, size: 16),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filledTonal(
                    tooltip: 'WhatsApp lead',
                    style: IconButton.styleFrom(
                      padding: EdgeInsets.zero,
                      minimumSize: const Size(34, 34),
                      backgroundColor: const Color(0xFF25D366).withValues(alpha: 0.15),
                    ),
                    onPressed: digits.isEmpty
                        ? null
                        : () {
                            final greeting = Uri.encodeComponent(
                              'Hi ${lead.name.isNotEmpty ? lead.name : "there"}! Reaching out from the gym regarding your inquiry. How can we help you achieve your fitness goals?',
                            );
                            _openUrl(context, Uri.parse('https://wa.me/$digits?text=$greeting'));
                          },
                    icon: const Icon(Icons.chat_bubble_rounded, size: 16, color: Color(0xFF25D366)),
                  ),
                  const SizedBox(width: 8),
                  FilledButton.tonal(
                    style: FilledButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      minimumSize: const Size(0, 34),
                    ),
                    onPressed: () => RepsiBottomSheet.show<void>(
                      context: context,
                      title: lead.name.isEmpty ? lead.phone : lead.name,
                      child: _LeadActionsSheet(lead: lead),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(l.crmMoveStage, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700)),
                        const SizedBox(width: 4),
                        const Icon(Icons.arrow_forward_rounded, size: 14),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Everything you do with a lead from the phone: call, WhatsApp, move stage, schedule a follow-up.
class _LeadActionsSheet extends ConsumerStatefulWidget {
  final LeadItem lead;
  const _LeadActionsSheet({required this.lead});

  @override
  ConsumerState<_LeadActionsSheet> createState() => _LeadActionsSheetState();
}

class _LeadActionsSheetState extends ConsumerState<_LeadActionsSheet> {
  late String _status = widget.lead.status;
  bool _busy = false;

  Future<void> _open(Uri uri) async {
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication) && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(context.l10n.errorGeneric)));
    }
  }

  Future<void> _run(Future<void> Function() action, String done) async {
    setState(() => _busy = true);
    try {
      await action();
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(done)));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(_err(e))));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final lead = widget.lead;
    final digits = lead.phone.replaceAll(RegExp(r'[^0-9]'), '');
    final actions = ref.read(frontDeskActionsProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final stagesOrder = ['new', 'contacted', 'visit_scheduled', 'trial', 'negotiation', 'converted'];
    final curIndex = stagesOrder.indexOf(_status.toLowerCase());

    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, mainAxisSize: MainAxisSize.min, children: [
      Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(lead.phone, style: AppTypography.bodySmall.copyWith(fontWeight: FontWeight.w600, color: _secondary(isDark))),
          if (lead.expectedValue > 0)
            Text('Deal Value: ₹${lead.expectedValue.toStringAsFixed(0)}',
                style: const TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF10B981), fontSize: 13)),
        ],
      ),
      if (lead.interest != null && lead.interest!.isNotEmpty) ...[
        const SizedBox(height: 4),
        Text('Interested in: ${lead.interest}', style: AppTypography.caption.copyWith(color: AppColors.primary, fontWeight: FontWeight.w600)),
      ],
      if (lead.notes != null && lead.notes!.isNotEmpty) ...[
        const SizedBox(height: 6),
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.04), borderRadius: BorderRadius.circular(8)),
          child: Text(lead.notes!, style: AppTypography.caption.copyWith(color: _text(isDark))),
        ),
      ],
      const SizedBox(height: 12),

      // Visual Pipeline Stepper
      Text('Sales Pipeline Progress', style: AppTypography.caption.copyWith(fontWeight: FontWeight.w800, letterSpacing: 0.5)),
      const SizedBox(height: 8),
      ClipRRect(
        borderRadius: BorderRadius.circular(6),
        child: LinearProgressIndicator(
          value: curIndex >= 0 ? (curIndex + 1) / stagesOrder.length : 0.1,
          minHeight: 6,
          backgroundColor: isDark ? Colors.white12 : Colors.black12,
          valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
        ),
      ),
      const SizedBox(height: 16),

      Row(children: [
        Expanded(
          child: OutlinedButton.icon(
            onPressed: digits.isEmpty ? null : () => _open(Uri(scheme: 'tel', path: digits)),
            icon: const Icon(Icons.call_outlined, size: 18),
            label: Text(l.crmCall),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: OutlinedButton.icon(
            onPressed: digits.isEmpty
                ? null
                : () {
                    final greeting = Uri.encodeComponent(
                      'Hi ${lead.name.isNotEmpty ? lead.name : "there"}! Reaching out from the gym regarding your fitness goals.',
                    );
                    _open(Uri.parse('https://wa.me/$digits?text=$greeting'));
                  },
            icon: const Icon(Icons.chat_outlined, size: 18, color: Color(0xFF25D366)),
            label: const Text('WhatsApp'),
          ),
        ),
      ]),
      const SizedBox(height: 16),
      Text(l.crmMoveStage, style: AppTypography.bodySmall.copyWith(fontWeight: FontWeight.w700)),
      const SizedBox(height: 8),
      Wrap(spacing: 8, runSpacing: 8, children: [
        for (final (key, _) in leadStages.where((s) => s.$1.isNotEmpty && s.$1 != 'converted'))
          ChoiceChip(
            label: Text(leadStageLabel(key)),
            selected: _status == key,
            onSelected: _busy || _status == key
                ? null
                : (_) => _run(() async {
                      await actions.moveLead(lead.id, key);
                      if (mounted) setState(() => _status = key);
                    }, l.crmMoved(leadStageLabel(key))),
          ),
      ]),
      const SizedBox(height: 16),
      FilledButton.icon(
        onPressed: _busy
            ? null
            : () async {
                final day = await showDatePicker(
                  context: context,
                  initialDate: DateTime.now().add(const Duration(days: 1)),
                  firstDate: DateTime.now(),
                  lastDate: DateTime.now().add(const Duration(days: 365)),
                );
                if (day != null) await _run(() => actions.scheduleFollowUp(lead.id, day), l.crmFollowUpSet(DateFormat('d MMM').format(day)));
              },
        style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
        icon: const Icon(Icons.event_outlined, size: 18),
        label: Text(l.crmScheduleFollowUp),
      ),
    ]);
  }
}

class _AddLeadSheet extends ConsumerStatefulWidget {
  const _AddLeadSheet();

  @override
  ConsumerState<_AddLeadSheet> createState() => _AddLeadSheetState();
}

class _AddLeadSheetState extends ConsumerState<_AddLeadSheet> {
  final _form = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _phone = TextEditingController();
  final _interest = TextEditingController();
  String _source = 'Walk-in';
  bool _busy = false;

  // Stored on the lead as-is (the web dashboard reports on these values); only the chip label is translated.
  static const _sources = ['Walk-in', 'Instagram', 'Website', 'Referral', 'Google', 'Phone call'];

  String _sourceLabel(String s) => switch (s) {
        'Walk-in' => context.l10n.sourceWalkIn,
        'Website' => context.l10n.sourceWebsite,
        'Referral' => context.l10n.sourceReferral,
        'Phone call' => context.l10n.sourcePhoneCall,
        _ => s,
      };

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    _interest.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_busy || !_form.currentState!.validate()) return;
    setState(() => _busy = true);
    try {
      await ref.read(frontDeskActionsProvider).addLead(name: _name.text, phone: _phone.text, source: _source, interest: _interest.text);
      if (!mounted) return;
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(L10n.current.opsLeadAdded(_name.text.trim()))));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(_err(e))));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: Form(
        key: _form,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            RepsiTextField(
              label: context.l10n.name,
              controller: _name,
              textCapitalization: TextCapitalization.words,
              textInputAction: TextInputAction.next,
              validator: (v) => (v ?? '').trim().length < 2 ? context.l10n.enterTheirName : null,
            ),
            const SizedBox(height: AppSpacing.lg),
            RepsiTextField(
              label: context.l10n.commonMobileNumber,
              controller: _phone,
              keyboardType: TextInputType.phone,
              textInputAction: TextInputAction.next,
              inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9+ ]'))],
              validator: (v) => (v ?? '').replaceAll(RegExp(r'\D'), '').length < 10 ? context.l10n.commonEnterValidMobile : null,
            ),
            const SizedBox(height: AppSpacing.lg),
            RepsiTextField(label: context.l10n.interestedIn, controller: _interest, hintText: context.l10n.interestedInHint),
            const SizedBox(height: AppSpacing.lg),
            Wrap(
              spacing: AppSpacing.sm,
              runSpacing: AppSpacing.sm,
              children: [
                for (final s in _sources)
                  ChoiceChip(label: Text(_sourceLabel(s)), selected: s == _source, onSelected: (_) => setState(() => _source = s)),
              ],
            ),
            const SizedBox(height: AppSpacing.xl),
            RepsiButton(text: context.l10n.saveLead, isFullWidth: true, isLoading: _busy, onPressed: _busy ? null : _save),
          ],
        ),
      ),
    );
  }
}

// ─── Check-in QR ─────────────────────────────────────────────────────────────

class _QrTab extends ConsumerWidget {
  const _QrTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return ref.watch(gymQrProvider).when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => RepsiErrorState(title: context.l10n.errorLoadQr, message: _err(e), onRetry: () => ref.invalidate(gymQrProvider)),
          data: (qr) => ListView(
            padding: const EdgeInsets.all(AppSpacing.xl),
            children: [
              Text(
                context.l10n.qrDesc,
                style: AppTypography.bodySmall.copyWith(color: _secondary(isDark)),
              ),
              const SizedBox(height: AppSpacing.xl),
              Center(
                child: Container(
                  padding: const EdgeInsets.all(AppSpacing.xl),
                  decoration: BoxDecoration(
                    color: Colors.white, // QR codes need a light quiet zone in either theme
                    borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
                    border: Border.all(color: _border(isDark)),
                  ),
                  child: Semantics(
                    label: context.l10n.qrSemantics,
                    image: true,
                    child: QrImageView(data: qr.payload, size: 232, backgroundColor: Colors.white, gapless: true),
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              Text(qr.label, textAlign: TextAlign.center, style: AppTypography.labelLarge.copyWith(color: _text(isDark))),
              if (qr.expiresAt != null)
                Text(context.l10n.opsQrRotates(DateFormat('d MMM, h:mm a').format(qr.expiresAt!)),
                    textAlign: TextAlign.center, style: AppTypography.caption.copyWith(color: _secondary(isDark))),
              const SizedBox(height: AppSpacing.xl),
              TextButton.icon(
                onPressed: () => ref.invalidate(gymQrProvider),
                icon: const Icon(Icons.refresh_rounded),
                label: Text(context.l10n.refresh),
              ),
            ],
          ),
        );
  }
}

// ─── Team ────────────────────────────────────────────────────────────────────

class _TeamTab extends ConsumerWidget {
  const _TeamTab();

  static String _role(String r) => r.isEmpty ? '' : r[0] + r.substring(1).toLowerCase().replaceAll('_', ' ');

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return ref.watch(teamProvider).when(
          loading: _skeletonList,
          error: (e, _) => RepsiErrorState(title: context.l10n.errorLoadTeam, message: _err(e), onRetry: () => ref.invalidate(teamProvider)),
          data: (team) => ListView(
            padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl, vertical: AppSpacing.sm),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      context.l10n.opsTeamHeader(team.length),
                      style: AppTypography.headingSmall.copyWith(color: _text(isDark), fontWeight: FontWeight.bold),
                    ),
                    ElevatedButton.icon(
                      onPressed: () => context.push(RouteNames.addTrainer),
                      icon: const Icon(Icons.person_add_rounded, size: 16),
                      label: Text(context.l10n.addTrainer),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.sm),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSpacing.radiusSm)),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.xs),
              for (final p in team)
                ListTile(
                  contentPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
                  leading: RepsiAvatar(name: p.name, size: 40),
                  title: Text(p.isSelf ? context.l10n.opsYou(p.name) : p.name,
                      style: AppTypography.bodySmall.copyWith(color: _text(isDark), fontWeight: FontWeight.w600)),
                  subtitle: Text(p.email, style: AppTypography.caption.copyWith(color: _secondary(isDark))),
                  trailing: Text(p.active ? _role(p.role) : context.l10n.commonInactive,
                      style: AppTypography.caption.copyWith(color: _secondary(isDark), fontWeight: FontWeight.w600)),
                ),
              Padding(
                padding: const EdgeInsets.all(AppSpacing.xl),
                child: Text(context.l10n.teamDesc,
                    textAlign: TextAlign.center, style: AppTypography.caption.copyWith(color: _secondary(isDark))),
              ),
            ],
          ),
        );
  }
}
