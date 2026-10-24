import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../core/api/api_error.dart';
import '../../../shared/models/member_model.dart';
import '../../../shared/widgets/repsi_avatar.dart';
import '../../../shared/widgets/repsi_bottom_sheet.dart';
import '../../../shared/widgets/repsi_button.dart';
import '../../../shared/widgets/repsi_error_state.dart';
import '../../../shared/widgets/repsi_skeleton.dart';
import '../../../shared/widgets/repsi_status_badge.dart';
import '../../../shared/widgets/repsi_text_field.dart';
import '../providers/member_detail_provider.dart';
import '../../../l10n/l10n.dart';

final _inr = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);
DateFormat get _day => DateFormat('d MMM yyyy', L10n.localeName);

/// Staff view of one member: membership, visits, payments, notes and the full lifecycle history,
/// with renew, record-payment and add-note actions. Every value comes from the API for [memberId].
class MemberDetailView extends ConsumerWidget {
  final String memberId;

  const MemberDetailView({super.key, required this.memberId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final member = ref.watch(memberDetailProvider(memberId));
    final canvas = isDark ? AppColors.darkBackground : AppColors.background;

    return Scaffold(
      backgroundColor: canvas,
      appBar: AppBar(backgroundColor: canvas, title: Text(context.l10n.commonMember)),
      body: member.when(
        loading: () => ListView(
          padding: const EdgeInsets.all(AppSpacing.xl),
          children: const [
            RepsiSkeleton(width: double.infinity, height: 120, borderRadius: BorderRadius.all(Radius.circular(AppSpacing.radiusCard))),
            SizedBox(height: AppSpacing.lg),
            RepsiSkeleton(width: double.infinity, height: 200, borderRadius: BorderRadius.all(Radius.circular(AppSpacing.radiusCard))),
          ],
        ),
        error: (e, _) => RepsiErrorState(
          title: context.l10n.errorLoadMember,
          message: e is ApiError ? e.message : context.l10n.commonCheckConnection,
          onRetry: () => ref.invalidate(memberDetailProvider(memberId)),
        ),
        data: (m) => DefaultTabController(
          length: 4,
          child: NestedScrollView(
            headerSliverBuilder: (context, _) => [
              SliverToBoxAdapter(child: _Header(member: m, isDark: isDark)),
              SliverPersistentHeader(pinned: true, delegate: _TabsHeader(isDark: isDark)),
            ],
            body: TabBarView(
              children: [
                _OverviewTab(member: m),
                _PaymentsTab(memberId: m.id),
                _VisitsTab(memberId: m.id),
                _HistoryTab(memberId: m.id),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// "+919000020069" reads as "+91 90000 20069"; anything else is shown as stored.
String _phone(String raw) {
  final digits = raw.replaceAll(RegExp(r'\D'), '');
  if (digits.length == 12 && digits.startsWith('91')) return '+91 ${digits.substring(2, 7)} ${digits.substring(7)}';
  if (digits.length == 10) return '${digits.substring(0, 5)} ${digits.substring(5)}';
  return raw;
}

Color _text(bool d) => d ? AppColors.darkText : AppColors.text;
Color _secondary(bool d) => d ? AppColors.darkTextSecondary : AppColors.textSecondary;
Color _surface(bool d) => d ? AppColors.darkSurface : AppColors.surface;
Color _border(bool d) => d ? AppColors.darkBorder : AppColors.border;

class _Header extends ConsumerWidget {
  final MemberModel member;
  final bool isDark;

  const _Header({required this.member, required this.isDark});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final name = member.fullName.isEmpty ? context.l10n.commonMember : member.fullName;
    final contact = [if (member.phone?.isNotEmpty == true) _phone(member.phone!), if (member.email.isNotEmpty) member.email];
    return Padding(
      padding: const EdgeInsets.fromLTRB(AppSpacing.xl, AppSpacing.sm, AppSpacing.xl, AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              RepsiAvatar(name: name, imageUrl: member.avatarUrl, size: 64),
              const SizedBox(width: AppSpacing.lg),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(name, style: AppTypography.heading.copyWith(fontSize: 22, color: _text(isDark), fontWeight: FontWeight.w700)),
                    const SizedBox(height: AppSpacing.xs),
                    RepsiStatusBadge(status: member.status),
                  ],
                ),
              ),
            ],
          ),
          if (contact.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.md),
            Wrap(
              spacing: AppSpacing.sm,
              runSpacing: AppSpacing.sm,
              children: [
                for (final c in contact)
                  ActionChip(
                    avatar: Icon(c.contains('@') ? Icons.mail_outline_rounded : Icons.call_outlined, size: 16, color: _secondary(isDark)),
                    label: Text(c, style: AppTypography.caption.copyWith(color: _text(isDark))),
                    tooltip: context.l10n.commonCopy,
                    backgroundColor: _surface(isDark),
                    side: BorderSide(color: _border(isDark)),
                    onPressed: () {
                      Clipboard.setData(ClipboardData(text: c));
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(context.l10n.memberCopied(c))));
                    },
                  ),
              ],
            ),
          ],
          const SizedBox(height: AppSpacing.lg),
          Row(
            children: [
              Expanded(
                child: RepsiButton(
                  text: context.l10n.renew,
                  leadingIcon: const Icon(Icons.autorenew_rounded, size: 18, color: Colors.white),
                  onPressed: () => _showRenew(context, ref, member),
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: RepsiButton(
                  text: context.l10n.commonPayment,
                  variant: RepsiButtonVariant.outline,
                  leadingIcon: Icon(Icons.currency_rupee_rounded, size: 18, color: _text(isDark)),
                  onPressed: () => _showRecordPayment(context, ref, member),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _TabsHeader extends SliverPersistentHeaderDelegate {
  final bool isDark;
  _TabsHeader({required this.isDark});

  @override
  double get minExtent => 48;
  @override
  double get maxExtent => 48;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: isDark ? AppColors.darkBackground : AppColors.background,
      child: TabBar(
        isScrollable: true,
        tabAlignment: TabAlignment.start,
        tabs: [Tab(text: context.l10n.overview), Tab(text: context.l10n.commonPayments), Tab(text: context.l10n.visits), Tab(text: context.l10n.history)],
      ),
    );
  }

  @override
  bool shouldRebuild(_TabsHeader old) => old.isDark != isDark;
}

class _Panel extends StatelessWidget {
  final String? title;
  final Widget child;
  final Widget? action;

  const _Panel({this.title, required this.child, this.action});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.lg),
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: _surface(isDark),
        borderRadius: BorderRadius.circular(AppSpacing.radiusCard),
        border: Border.all(color: _border(isDark)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (title != null) ...[
            Row(
              children: [
                Expanded(
                  child: Text(title!, style: AppTypography.labelLarge.copyWith(color: _text(isDark))),
                ),
                if (action != null) action!,
              ],
            ),
            const SizedBox(height: AppSpacing.md),
          ],
          child,
        ],
      ),
    );
  }
}

Widget _kv(String k, String v, bool isDark) => Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 120, child: Text(k, style: AppTypography.bodySmall.copyWith(color: _secondary(isDark)))),
          Expanded(child: Text(v, style: AppTypography.bodySmall.copyWith(color: _text(isDark), fontWeight: FontWeight.w500))),
        ],
      ),
    );

Widget _loadingList() => ListView(children: [for (var i = 0; i < 4; i++) RepsiSkeleton.memberListItem()]);

Widget _errorRetry(WidgetRef ref, ProviderOrFamily provider) => RepsiErrorState(
      title: L10n.current.errorLoadThis,
      message: L10n.current.commonCheckConnection,
      onRetry: () => ref.invalidate(provider),
    );

class _OverviewTab extends ConsumerWidget {
  final MemberModel member;

  const _OverviewTab({required this.member});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final visits = ref.watch(memberVisitsProvider(member.id));
    final notes = ref.watch(memberNotesProvider(member.id));
    final end = member.endDate;
    final joined = member.startDate;

    return ListView(
      padding: const EdgeInsets.all(AppSpacing.xl),
      children: [
        _Panel(
          title: context.l10n.commonMembership,
          child: Column(
            children: [
              _kv(context.l10n.plan, member.planName ?? context.l10n.noPlan, isDark),
              _kv(end != null && end.isBefore(DateTime.now()) ? context.l10n.ended : context.l10n.ends, end != null ? _day.format(end) : '—', isDark),
              _kv(context.l10n.memberSince, joined != null ? _day.format(joined) : '—', isDark),
              if (member.gender?.isNotEmpty == true) _kv(context.l10n.gender, member.gender![0].toUpperCase() + member.gender!.substring(1), isDark),
              if (member.emergencyContact?.isNotEmpty == true) _kv(context.l10n.emergencyContact, member.emergencyContact!, isDark),
            ],
          ),
        ),
        _Panel(
          title: context.l10n.visits,
          child: visits.when(
            loading: () => const SizedBox(height: 56, child: Center(child: CircularProgressIndicator(strokeWidth: 2))),
            error: (_, __) => Text(context.l10n.errorLoadVisits, style: AppTypography.bodySmall.copyWith(color: _secondary(isDark))),
            data: (v) => Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    _Stat(label: context.l10n.commonThisMonth, value: '${v.thisMonth}'),
                    _Stat(label: context.l10n.commonThisWeek, value: '${v.thisWeek}'),
                    _Stat(label: context.l10n.commonTotal, value: '${v.total}'),
                  ],
                ),
                const SizedBox(height: AppSpacing.md),
                Text(
                  v.insideNow
                      ? context.l10n.commonInTheGymNow
                      : v.lastVisit != null
                          ? context.l10n.memberLastVisit(DateFormat('d MMM, h:mm a').format(v.lastVisit!))
                          : context.l10n.noVisitsYet,
                  style: AppTypography.caption.copyWith(
                    color: v.insideNow ? (isDark ? AppColors.darkSuccess : AppColors.success) : _secondary(isDark),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ),
        _Panel(
          title: context.l10n.notes,
          action: TextButton.icon(
            onPressed: () => _showAddNote(context, ref, member.id),
            icon: const Icon(Icons.add_rounded, size: 18),
            label: Text(context.l10n.commonAdd),
          ),
          child: notes.when(
            loading: () => const SizedBox(height: 40),
            error: (_, __) => Text(context.l10n.errorLoadNotes, style: AppTypography.bodySmall.copyWith(color: _secondary(isDark))),
            data: (list) => list.isEmpty
                ? Text(context.l10n.noNotes,
                    style: AppTypography.bodySmall.copyWith(color: _secondary(isDark)))
                : Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      for (final n in list.take(5))
                        Padding(
                          padding: const EdgeInsets.only(bottom: AppSpacing.md),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(n.body, style: AppTypography.bodySmall.copyWith(color: _text(isDark))),
                              const SizedBox(height: 2),
                              Text(
                                context.l10n.memberNoteMeta(n.author ?? context.l10n.commonStaff, DateFormat('d MMM').format(n.createdAt)),
                                style: AppTypography.caption.copyWith(color: _secondary(isDark)),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
          ),
        ),
      ],
    );
  }
}

class _Stat extends StatelessWidget {
  final String label;
  final String value;

  const _Stat({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(value, style: AppTypography.tabularNumber(fontSize: 22, fontWeight: FontWeight.w700, color: _text(isDark))),
          Text(label, style: AppTypography.caption.copyWith(color: _secondary(isDark))),
        ],
      ),
    );
  }
}

class _PaymentsTab extends ConsumerWidget {
  final String memberId;

  const _PaymentsTab({required this.memberId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return ref.watch(memberPaymentsListProvider(memberId)).when(
          loading: _loadingList,
          error: (_, __) => _errorRetry(ref, memberPaymentsListProvider(memberId)),
          data: (list) {
            if (list.isEmpty) {
              return _EmptyTab(icon: Icons.receipt_long_outlined, text: context.l10n.noPaymentsForMember);
            }
            final total = list.where((p) => p.status == 'success').fold<double>(0, (s, p) => s + p.amount);
            return ListView(
              padding: const EdgeInsets.all(AppSpacing.xl),
              children: [
                Text(context.l10n.memberPaidAcross(_inr.format(total), list.length),
                    style: AppTypography.caption.copyWith(color: _secondary(isDark))),
                const SizedBox(height: AppSpacing.md),
                _Panel(
                  child: Column(
                    children: [
                      for (var i = 0; i < list.length; i++) ...[
                        if (i > 0) Divider(height: AppSpacing.xl, color: _border(isDark)),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    '${_day.format(list[i].paidAt)} · ${_method(list[i].method)}',
                                    style: AppTypography.bodySmall.copyWith(color: _text(isDark), fontWeight: FontWeight.w600),
                                  ),
                                  Text(
                                    [if (list[i].receiptNumber != null) list[i].receiptNumber!, if (list[i].notes != null) list[i].notes!]
                                        .join(' · '),
                                    style: AppTypography.caption.copyWith(color: _secondary(isDark)),
                                  ),
                                ],
                              ),
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(_inr.format(list[i].amount),
                                    style: AppTypography.tabularNumber(fontSize: 15, fontWeight: FontWeight.w700, color: _text(isDark))),
                                if (list[i].status != 'success')
                                  Text(list[i].status[0].toUpperCase() + list[i].status.substring(1),
                                      style: AppTypography.caption.copyWith(color: isDark ? AppColors.darkError : AppColors.error)),
                              ],
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            );
          },
        );
  }

  static String _method(String m) => {
        'upi': 'UPI',
        'card': L10n.current.commonCard,
        'cash': L10n.current.commonCash,
        'netbanking': L10n.current.commonNetBanking,
        'cheque': L10n.current.commonCheque,
      }[m] ??
      m;
}

class _VisitsTab extends ConsumerWidget {
  final String memberId;

  const _VisitsTab({required this.memberId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return ref.watch(memberVisitsProvider(memberId)).when(
          loading: _loadingList,
          error: (_, __) => _errorRetry(ref, memberVisitsProvider(memberId)),
          data: (v) {
            if (v.recent.isEmpty) return _EmptyTab(icon: Icons.event_available_outlined, text: context.l10n.noVisitsRecorded);
            return ListView.separated(
              padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
              itemCount: v.recent.length,
              separatorBuilder: (_, __) => Divider(height: 1, indent: AppSpacing.xl, color: _border(isDark)),
              itemBuilder: (context, i) {
                final s = v.recent[i];
                final time = DateFormat('h:mm a');
                return ListTile(
                  contentPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
                  title: Text(DateFormat('EEE, d MMM').format(s.checkIn),
                      style: AppTypography.bodySmall.copyWith(color: _text(isDark), fontWeight: FontWeight.w600)),
                  subtitle: Text(
                    s.checkOut == null ? context.l10n.memberInSince(time.format(s.checkIn)) : '${time.format(s.checkIn)} – ${time.format(s.checkOut!)}',
                    style: AppTypography.caption.copyWith(color: _secondary(isDark)),
                  ),
                  trailing: Text(s.duration,
                      style: AppTypography.tabularNumber(fontSize: 13, fontWeight: FontWeight.w500, color: _secondary(isDark))),
                );
              },
            );
          },
        );
  }
}

class _HistoryTab extends ConsumerWidget {
  final String memberId;

  const _HistoryTab({required this.memberId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return ref.watch(memberHistoryProvider(memberId)).when(
          loading: _loadingList,
          error: (_, __) => _errorRetry(ref, memberHistoryProvider(memberId)),
          data: (list) {
            if (list.isEmpty) return _EmptyTab(icon: Icons.history_rounded, text: context.l10n.noHistory);
            return ListView.builder(
              padding: const EdgeInsets.all(AppSpacing.xl),
              itemCount: list.length,
              itemBuilder: (context, i) {
                final e = list[i];
                final last = i == list.length - 1;
                return IntrinsicHeight(
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      SizedBox(
                        width: 20,
                        child: Column(
                          children: [
                            Container(
                              margin: const EdgeInsets.only(top: 4),
                              width: 10,
                              height: 10,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: e.source == 'membership' ? AppColors.primary : _border(isDark),
                              ),
                            ),
                            if (!last) Expanded(child: Container(width: 2, color: _border(isDark))),
                          ],
                        ),
                      ),
                      const SizedBox(width: AppSpacing.md),
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.only(bottom: AppSpacing.lg),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                e.newEndDate != null ? context.l10n.memberHistoryUntil(e.label, _day.format(e.newEndDate!)) : e.label,
                                style: AppTypography.bodySmall.copyWith(color: _text(isDark), fontWeight: FontWeight.w600),
                              ),
                              Text(
                                [DateFormat('d MMM yyyy, h:mm a').format(e.createdAt), e.actorName ?? context.l10n.system, if (e.reason != null) e.reason!]
                                    .join(' · '),
                                style: AppTypography.caption.copyWith(color: _secondary(isDark)),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              },
            );
          },
        );
  }
}

class _EmptyTab extends StatelessWidget {
  final IconData icon;
  final String text;

  const _EmptyTab({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xxxl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 36, color: _secondary(isDark)),
            const SizedBox(height: AppSpacing.md),
            Text(text, textAlign: TextAlign.center, style: AppTypography.bodySmall.copyWith(color: _secondary(isDark))),
          ],
        ),
      ),
    );
  }
}

// ─── Actions ─────────────────────────────────────────────────────────────────

void _showError(BuildContext context, Object e) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text(e is ApiError ? e.message : context.l10n.commonSomethingWentWrong)),
  );
}

Future<void> _showRenew(BuildContext context, WidgetRef ref, MemberModel member) async {
  final plans = await ref.read(membershipPlansProvider.future).catchError((Object e) {
    if (context.mounted) _showError(context, e);
    return <PlanOption>[];
  });
  if (!context.mounted || plans.isEmpty) return;
  final current = plans.where((p) => p.name == member.planName).firstOrNull ?? plans.first;
  await RepsiBottomSheet.show<void>(
    context: context,
    title: context.l10n.renewMembership,
    child: _RenewSheet(member: member, plans: plans, initial: current),
  );
}

class _RenewSheet extends ConsumerStatefulWidget {
  final MemberModel member;
  final List<PlanOption> plans;
  final PlanOption initial;

  const _RenewSheet({required this.member, required this.plans, required this.initial});

  @override
  ConsumerState<_RenewSheet> createState() => _RenewSheetState();
}

class _RenewSheetState extends ConsumerState<_RenewSheet> {
  late PlanOption _plan = widget.initial;
  bool _busy = false;

  Future<void> _confirm() async {
    setState(() => _busy = true);
    try {
      await ref.read(memberActionsProvider).renew(widget.member.id, _plan.id);
      if (!mounted) return;
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(L10n.current.memberRenewedOn(widget.member.firstName, _plan.name))),
      );
    } catch (e) {
      if (mounted) _showError(context, e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        RadioGroup<PlanOption>(
          groupValue: _plan,
          onChanged: (p) => setState(() => _plan = p ?? _plan),
          child: Column(
            children: [
              for (final p in widget.plans)
                RadioListTile<PlanOption>(
                  value: p,
                  contentPadding: EdgeInsets.zero,
                  title: Text(p.name, style: AppTypography.body.copyWith(color: _text(isDark), fontWeight: FontWeight.w600)),
                  subtitle: Text(context.l10n.commonMonths(p.months),
                      style: AppTypography.caption.copyWith(color: _secondary(isDark))),
                  secondary: Text(_inr.format(p.price),
                      style: AppTypography.tabularNumber(fontSize: 15, fontWeight: FontWeight.w600, color: _text(isDark))),
                ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.lg),
        RepsiButton(text: context.l10n.memberRenewFor(_inr.format(_plan.price)), isFullWidth: true, isLoading: _busy, onPressed: _busy ? null : _confirm),
      ],
    );
  }
}

Future<void> _showRecordPayment(BuildContext context, WidgetRef ref, MemberModel member) {
  return RepsiBottomSheet.show<void>(
    context: context,
    title: context.l10n.recordPayment,
    child: _PaymentSheet(member: member),
  );
}

class _PaymentSheet extends ConsumerStatefulWidget {
  final MemberModel member;

  const _PaymentSheet({required this.member});

  @override
  ConsumerState<_PaymentSheet> createState() => _PaymentSheetState();
}

class _PaymentSheetState extends ConsumerState<_PaymentSheet> {
  final _form = GlobalKey<FormState>();
  final _amount = TextEditingController();
  final _notes = TextEditingController();
  String _method = 'upi';
  bool _busy = false;

  @override
  void dispose() {
    _amount.dispose();
    _notes.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_busy || !_form.currentState!.validate()) return;
    setState(() => _busy = true);
    try {
      final amount = double.parse(_amount.text.trim());
      await ref.read(memberActionsProvider).recordPayment(widget.member.id, amount, _method, notes: _notes.text);
      if (!mounted) return;
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(L10n.current.memberPaymentRecorded(_inr.format(amount), widget.member.firstName))));
    } catch (e) {
      if (mounted) _showError(context, e);
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
              label: context.l10n.amountRupees,
              controller: _amount,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'^\d*\.?\d{0,2}'))],
              validator: (v) {
                final n = double.tryParse((v ?? '').trim());
                return n == null || n <= 0 ? context.l10n.enterAmountReceived : null;
              },
            ),
            const SizedBox(height: AppSpacing.lg),
            SegmentedButton<String>(
              segments: [
                ButtonSegment(value: 'upi', label: Text('UPI')),
                ButtonSegment(value: 'cash', label: Text(context.l10n.commonCash)),
                ButtonSegment(value: 'card', label: Text(context.l10n.commonCard)),
              ],
              selected: {_method},
              onSelectionChanged: (s) => setState(() => _method = s.first),
              showSelectedIcon: false,
            ),
            const SizedBox(height: AppSpacing.lg),
            RepsiTextField(label: context.l10n.noteOptional, controller: _notes, hintText: context.l10n.paymentNoteHint),
            const SizedBox(height: AppSpacing.xl),
            RepsiButton(text: context.l10n.savePayment, isFullWidth: true, isLoading: _busy, onPressed: _busy ? null : _save),
          ],
        ),
      ),
    );
  }
}

Future<void> _showAddNote(BuildContext context, WidgetRef ref, String memberId) {
  final controller = TextEditingController();
  return RepsiBottomSheet.show<void>(
    context: context,
    title: context.l10n.addNote,
    child: Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          RepsiTextField(controller: controller, hintText: context.l10n.noteHint, maxLines: 4, minLines: 3),
          const SizedBox(height: AppSpacing.lg),
          Builder(
            builder: (ctx) => RepsiButton(
              text: context.l10n.saveNote,
              isFullWidth: true,
              onPressed: () async {
                if (controller.text.trim().isEmpty) return;
                try {
                  await ref.read(memberActionsProvider).addNote(memberId, controller.text);
                  if (ctx.mounted) Navigator.pop(ctx);
                } catch (e) {
                  if (ctx.mounted) _showError(ctx, e);
                }
              },
            ),
          ),
        ],
      ),
    ),
  ).whenComplete(controller.dispose);
}
