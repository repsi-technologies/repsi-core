import 'dart:async';

import 'package:flutter/material.dart';
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

/// Front desk: today's attendance with check-in/check-out, the sales pipeline, the gym's live
/// check-in QR and the team. Everything is read from and written to the API.
class OperationsView extends ConsumerWidget {
  const OperationsView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final canvas = isDark ? AppColors.darkBackground : AppColors.background;
    return DefaultTabController(
      length: 4,
      child: Scaffold(
        backgroundColor: canvas,
        appBar: AppBar(
          backgroundColor: canvas,
          title: Text('Front desk', style: AppTypography.heading.copyWith(color: _text(isDark), fontWeight: FontWeight.w700)),
          bottom: const TabBar(
            isScrollable: true,
            tabAlignment: TabAlignment.start,
            tabs: [Tab(text: 'Attendance'), Tab(text: 'Leads'), Tab(text: 'Check-in QR'), Tab(text: 'Team')],
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

String _err(Object e) => e is ApiError ? e.message : 'Something went wrong. Please try again.';

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
                child: Text("Couldn't load today's numbers.", style: AppTypography.bodySmall.copyWith(color: _secondary(isDark))),
              ),
              data: (t) => IntrinsicHeight(
                child: Row(
                  children: [
                    _Figure('Inside now', '${t.inside}'),
                    VerticalDivider(color: _border(isDark), width: 1),
                    _Figure('Today', '${t.total}'),
                    VerticalDivider(color: _border(isDark), width: 1),
                    _Figure('Avg. stay', t.averageMinutes > 0 ? '${t.averageMinutes}m' : '—'),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          RepsiButton(
            text: 'Check in a member',
            isFullWidth: true,
            leadingIcon: const Icon(Icons.how_to_reg_rounded, size: 20, color: Colors.white),
            onPressed: () => RepsiBottomSheet.show<void>(context: context, title: 'Check in', child: const _CheckInSheet()),
          ),
          const SizedBox(height: AppSpacing.xxl),
          Text('In the gym now', style: AppTypography.sectionHeading.copyWith(color: _text(isDark), fontSize: 17)),
          const SizedBox(height: AppSpacing.md),
          inside.when(
            loading: () => Column(children: [for (var i = 0; i < 3; i++) RepsiSkeleton.memberListItem()]),
            error: (e, _) => RepsiErrorState(title: "Couldn't load attendance", message: _err(e), onRetry: refresh),
            data: (people) => people.isEmpty
                ? Padding(
                    padding: const EdgeInsets.symmetric(vertical: AppSpacing.xl),
                    child: Text('No one is checked in right now.',
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
      messenger.showSnackBar(SnackBar(content: Text('${widget.person.name} checked out')));
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
      subtitle: Text('In at ${DateFormat.jm().format(p.checkIn)} · ${p.duration}',
          style: AppTypography.caption.copyWith(color: _secondary(isDark))),
      trailing: _busy
          ? const SizedBox.square(dimension: 20, child: CircularProgressIndicator(strokeWidth: 2))
          : TextButton(onPressed: _checkOut, child: const Text('Check out')),
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
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('${m.fullName} checked in')));
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
          RepsiSearchField(hintText: 'Search name or phone', onChanged: _search),
          if (_error != null) ...[
            const SizedBox(height: AppSpacing.md),
            Text(_error!, style: AppTypography.caption.copyWith(color: isDark ? AppColors.darkError : AppColors.error)),
          ],
          const SizedBox(height: AppSpacing.sm),
          Expanded(
            child: _searching
                ? const Center(child: CircularProgressIndicator(strokeWidth: 2))
                : _results.isEmpty
                    ? Center(
                        child: Text('Type at least two letters of a name or phone number.',
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
                                : FilledButton.tonal(onPressed: _busyId == null ? () => _checkIn(m) : null, child: const Text('Check in')),
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

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final leads = ref.watch(leadsProvider(_stage));
    return Column(
      children: [
        SizedBox(
          height: 56,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.fromLTRB(AppSpacing.xl, AppSpacing.md, AppSpacing.xl, AppSpacing.xs),
            itemCount: leadStages.length,
            separatorBuilder: (_, __) => const SizedBox(width: AppSpacing.sm),
            itemBuilder: (context, i) {
              final (key, label) = leadStages[i];
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
        Expanded(
          child: leads.when(
            loading: _skeletonList,
            error: (e, _) => RepsiErrorState(
                title: "Couldn't load leads", message: _err(e), onRetry: () => ref.invalidate(leadsProvider(_stage))),
            data: (list) => RefreshIndicator(
              color: AppColors.primary,
              onRefresh: () async => ref.invalidate(leadsProvider(_stage)),
              child: list.isEmpty
                  ? ListView(children: [
                      const SizedBox(height: AppSpacing.xxxl),
                      RepsiEmptyState(
                        icon: Icons.person_search_outlined,
                        title: _stage.isEmpty ? 'No leads yet' : 'No leads in this stage',
                        message: 'Capture walk-ins and enquiries so nobody slips through.',
                        actionLabel: 'Add lead',
                        onAction: () => _addLead(context),
                      ),
                    ])
                  : ListView.separated(
                      padding: const EdgeInsets.only(bottom: 96),
                      itemCount: list.length,
                      separatorBuilder: (_, __) => Divider(height: 1, indent: AppSpacing.xl, color: _border(isDark)),
                      itemBuilder: (context, i) => _LeadRow(lead: list[i]),
                    ),
            ),
          ),
        ),
        SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(AppSpacing.xl, AppSpacing.sm, AppSpacing.xl, AppSpacing.md),
            child: RepsiButton(
              text: 'Add lead',
              isFullWidth: true,
              variant: RepsiButtonVariant.outline,
              leadingIcon: Icon(Icons.add_rounded, size: 20, color: _text(isDark)),
              onPressed: () => _addLead(context),
            ),
          ),
        ),
      ],
    );
  }

  void _addLead(BuildContext context) {
    RepsiBottomSheet.show<void>(context: context, title: 'New lead', child: const _AddLeadSheet());
  }
}

class _LeadRow extends StatelessWidget {
  final LeadItem lead;

  const _LeadRow({required this.lead});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final followUp = lead.nextFollowUp;
    final overdue = followUp != null && followUp.isBefore(DateTime.now()) && lead.status != 'converted' && lead.status != 'lost';
    final meta = [
      if (lead.interest != null) lead.interest!,
      lead.source,
      if (followUp != null && lead.status != 'lost') 'follow up ${DateFormat('d MMM').format(followUp)}',
    ].join(' · ');
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl, vertical: 2),
      leading: RepsiAvatar(name: lead.name, size: 40),
      title: Text(lead.name.isEmpty ? lead.phone : lead.name,
          style: AppTypography.bodySmall.copyWith(color: _text(isDark), fontWeight: FontWeight.w600)),
      subtitle: Text(meta,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: AppTypography.caption.copyWith(
            color: overdue ? (isDark ? AppColors.darkWarning : AppColors.warning) : _secondary(isDark),
          )),
      trailing: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: isDark ? AppColors.darkSurfaceElevated : AppColors.surfaceSecondary,
          borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
        ),
        child: Text(leadStageLabel(lead.status), style: AppTypography.caption.copyWith(color: _text(isDark), fontWeight: FontWeight.w600)),
      ),
    );
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

  static const _sources = ['Walk-in', 'Instagram', 'Website', 'Referral', 'Google', 'Phone call'];

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
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('${_name.text.trim()} added to leads')));
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
              label: 'Name',
              controller: _name,
              textCapitalization: TextCapitalization.words,
              textInputAction: TextInputAction.next,
              validator: (v) => (v ?? '').trim().length < 2 ? 'Enter their name' : null,
            ),
            const SizedBox(height: AppSpacing.lg),
            RepsiTextField(
              label: 'Mobile number',
              controller: _phone,
              keyboardType: TextInputType.phone,
              textInputAction: TextInputAction.next,
              inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9+ ]'))],
              validator: (v) => (v ?? '').replaceAll(RegExp(r'\D'), '').length < 10 ? 'Enter a valid mobile number' : null,
            ),
            const SizedBox(height: AppSpacing.lg),
            RepsiTextField(label: 'Interested in (optional)', controller: _interest, hintText: 'e.g. Quarterly plan, PT'),
            const SizedBox(height: AppSpacing.lg),
            Wrap(
              spacing: AppSpacing.sm,
              runSpacing: AppSpacing.sm,
              children: [
                for (final s in _sources)
                  ChoiceChip(label: Text(s), selected: s == _source, onSelected: (_) => setState(() => _source = s)),
              ],
            ),
            const SizedBox(height: AppSpacing.xl),
            RepsiButton(text: 'Save lead', isFullWidth: true, isLoading: _busy, onPressed: _busy ? null : _save),
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
          error: (e, _) => RepsiErrorState(title: "Couldn't load the check-in QR", message: _err(e), onRetry: () => ref.invalidate(gymQrProvider)),
          data: (qr) => ListView(
            padding: const EdgeInsets.all(AppSpacing.xl),
            children: [
              Text(
                'Members scan this with the REPSI app to check themselves in. Show it at the front desk or print it.',
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
                    label: 'Gym check-in QR code',
                    image: true,
                    child: QrImageView(data: qr.payload, size: 232, backgroundColor: Colors.white, gapless: true),
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              Text(qr.label, textAlign: TextAlign.center, style: AppTypography.labelLarge.copyWith(color: _text(isDark))),
              if (qr.expiresAt != null)
                Text('Rotates ${DateFormat('d MMM, h:mm a').format(qr.expiresAt!)}',
                    textAlign: TextAlign.center, style: AppTypography.caption.copyWith(color: _secondary(isDark))),
              const SizedBox(height: AppSpacing.xl),
              TextButton.icon(
                onPressed: () => ref.invalidate(gymQrProvider),
                icon: const Icon(Icons.refresh_rounded),
                label: const Text('Refresh'),
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
          error: (e, _) => RepsiErrorState(title: "Couldn't load your team", message: _err(e), onRetry: () => ref.invalidate(teamProvider)),
          data: (team) => ListView(
            padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl, vertical: AppSpacing.sm),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Staff & Trainers (${team.length})',
                      style: AppTypography.headingSmall.copyWith(color: _text(isDark), fontWeight: FontWeight.bold),
                    ),
                    ElevatedButton.icon(
                      onPressed: () => context.push(RouteNames.addTrainer),
                      icon: const Icon(Icons.person_add_rounded, size: 16),
                      label: const Text('Add trainer'),
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
                  title: Text(p.isSelf ? '${p.name} (you)' : p.name,
                      style: AppTypography.bodySmall.copyWith(color: _text(isDark), fontWeight: FontWeight.w600)),
                  subtitle: Text(p.email, style: AppTypography.caption.copyWith(color: _secondary(isDark))),
                  trailing: Text(p.active ? _role(p.role) : 'Inactive',
                      style: AppTypography.caption.copyWith(color: _secondary(isDark), fontWeight: FontWeight.w600)),
                ),
              Padding(
                padding: const EdgeInsets.all(AppSpacing.xl),
                child: Text('Add trainers and manage staff roles directly from your phone.',
                    textAlign: TextAlign.center, style: AppTypography.caption.copyWith(color: _secondary(isDark))),
              ),
            ],
          ),
        );
  }
}
