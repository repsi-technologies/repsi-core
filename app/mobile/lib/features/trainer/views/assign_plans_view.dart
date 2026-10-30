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
import '../../../shared/widgets/repsi_button.dart';
import '../../../shared/widgets/repsi_card.dart';
import '../../../shared/widgets/repsi_empty_state.dart';
import '../../../shared/widgets/repsi_error_state.dart';
import '../../../shared/widgets/repsi_skeleton.dart';
import '../data/assign_api.dart';

/// Trainer: assign a workout program or a diet plan (including an AI-suggested one) to a client.
class AssignPlansView extends StatelessWidget {
  final String memberId;
  final String memberName;
  final int initialTab;
  const AssignPlansView({super.key, required this.memberId, required this.memberName, this.initialTab = 0});

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    return DefaultTabController(
      length: 2,
      initialIndex: initialTab,
      child: Scaffold(
        backgroundColor: context.palette.background,
        appBar: AppBar(
          title: Text(l.assignTo(memberName), maxLines: 1, overflow: TextOverflow.ellipsis),
          bottom: TabBar(tabs: [
            Tab(icon: const Icon(LucideIcons.dumbbell, size: 18), text: l.navWorkout),
            Tab(icon: const Icon(LucideIcons.salad, size: 18), text: l.dietPlan),
          ]),
        ),
        body: TabBarView(children: [
          _WorkoutTab(memberId: memberId),
          _DietTab(memberId: memberId),
        ]),
      ),
    );
  }
}

// ─── Workout ────────────────────────────────────────────────────────────

class _WorkoutTab extends ConsumerStatefulWidget {
  final String memberId;
  const _WorkoutTab({required this.memberId});

  @override
  ConsumerState<_WorkoutTab> createState() => _WorkoutTabState();
}

class _WorkoutTabState extends ConsumerState<_WorkoutTab> {
  String? _selected;
  DateTime _start = DateTime.now();
  bool _saving = false;

  Future<void> _assign() async {
    if (_selected == null) return;
    setState(() => _saving = true);
    try {
      await ref.read(assignApiProvider).assignWorkout(programId: _selected!, memberId: widget.memberId, startDate: _start);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(context.l10n.workoutAssigned)));
        Navigator.of(context).pop(true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(e is ApiError ? e.message : context.l10n.errorGeneric)));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final palette = context.palette;
    final programs = ref.watch(assignableProgramsProvider);
    return Column(
      children: [
        Expanded(
          child: programs.when(
            loading: () => ListView(padding: AppSpacing.pagePadding, children: const [RepsiSkeleton(height: 76), SizedBox(height: 8), RepsiSkeleton(height: 76)]),
            error: (e, _) => RepsiErrorState(message: e is ApiError ? e.message : l.errorGeneric, onRetry: () => ref.invalidate(assignableProgramsProvider)),
            data: (rows) => rows.isEmpty
                ? RepsiEmptyState(icon: LucideIcons.dumbbell, title: l.noProgramsYet, message: l.noProgramsHint)
                : ListView(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                    children: [
                      Text(l.chooseProgram, style: AppTypography.sectionHeading.copyWith(color: palette.text)),
                      const SizedBox(height: 8),
                      for (final p in rows)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: _SelectTile(
                            selected: _selected == p.id,
                            icon: LucideIcons.dumbbell,
                            title: p.name,
                            subtitle: [
                              if (p.objective != null) p.objective!.replaceAll('_', ' '),
                              l.programDays(p.trainingDays),
                              if (p.durationWeeks != null) l.programWeeks(p.durationWeeks!),
                            ].join(' · '),
                            onTap: () => setState(() => _selected = p.id),
                          ),
                        ),
                      const SizedBox(height: 8),
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: Icon(LucideIcons.calendarDays, color: palette.textSecondary),
                        title: Text(l.startDate, style: AppTypography.bodySmall.copyWith(color: palette.text)),
                        trailing: Text(DateFormat.yMMMEd(L10n.localeName).format(_start),
                            style: AppTypography.bodySmall.copyWith(fontWeight: FontWeight.w700, color: palette.text)),
                        onTap: () async {
                          final picked = await showDatePicker(
                            context: context,
                            initialDate: _start,
                            firstDate: DateTime.now().subtract(const Duration(days: 7)),
                            lastDate: DateTime.now().add(const Duration(days: 180)),
                          );
                          if (picked != null) setState(() => _start = picked);
                        },
                      ),
                      const SizedBox(height: 12),
                      RepsiCard(
                        onTap: () {
                          final selectedProg = rows.where((p) => p.id == _selected).firstOrNull;
                          Navigator.of(context).push(MaterialPageRoute(
                            builder: (_) => _DietSuggestView(
                              memberId: widget.memberId,
                              initialGoal: selectedProg?.objective ?? 'muscle_gain',
                              workoutName: selectedProg?.name,
                            ),
                          ));
                        },
                        padding: const EdgeInsets.all(14),
                        child: Row(children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(colors: AppColors.energyGradient),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Icon(LucideIcons.brainCircuit, color: Colors.white, size: 18),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Text('AI Diet Plan for this Workout',
                                  style: AppTypography.caption.copyWith(fontWeight: FontWeight.w700, color: palette.text)),
                              const SizedBox(height: 2),
                              Text('Generate nutrition targets matched to this training plan',
                                  style: AppTypography.caption.copyWith(color: palette.textSecondary, fontSize: 11)),
                            ]),
                          ),
                          Icon(LucideIcons.chevronRight, size: 18, color: palette.textMuted),
                        ]),
                      ),
                      const SizedBox(height: 16),
                    ],
                  ),
          ),
        ),
        _BottomBar(
          child: RepsiButton(
            text: l.assignWorkoutBtn,
            isFullWidth: true,
            isLoading: _saving,
            onPressed: _selected == null || _saving ? null : _assign,
          ),
        ),
      ],
    );
  }
}

// ─── Diet ───────────────────────────────────────────────────────────────

class _DietTab extends ConsumerWidget {
  final String memberId;
  const _DietTab({required this.memberId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l = context.l10n;
    final palette = context.palette;
    final plans = ref.watch(assignableDietPlansProvider);
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      children: [
        // AI suggestion entry point, placed above the existing plans.
        RepsiCard(
          onTap: () => Navigator.of(context).push(MaterialPageRoute(
              builder: (_) => _DietSuggestView(memberId: memberId))),
          padding: const EdgeInsets.all(16),
          child: Row(children: [
            Container(
              width: 46,
              height: 46,
              decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: AppColors.energyGradient), borderRadius: BorderRadius.circular(12)),
              child: const Icon(LucideIcons.brainCircuit, color: Colors.white),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(l.aiDietSuggestion, style: AppTypography.sectionHeading.copyWith(fontSize: 16, color: palette.text)),
                const SizedBox(height: 2),
                Text(l.aiDietSuggestionHint, style: AppTypography.caption.copyWith(color: palette.textSecondary)),
              ]),
            ),
            Icon(LucideIcons.chevronRight, color: palette.textMuted),
          ]),
        ),
        const SizedBox(height: 20),
        Text(l.existingPlans, style: AppTypography.sectionHeading.copyWith(color: palette.text)),
        const SizedBox(height: 8),
        ...plans.when(
          loading: () => const [RepsiSkeleton(height: 64)],
          error: (e, _) => [RepsiErrorState(message: e is ApiError ? e.message : l.errorGeneric, onRetry: () => ref.invalidate(assignableDietPlansProvider))],
          data: (rows) => rows.isEmpty
              ? [Padding(padding: const EdgeInsets.all(8), child: Text(l.noDietPlansYet, style: AppTypography.bodySmall.copyWith(color: palette.textSecondary)))]
              : [
                  for (final p in rows)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: _AssignPlanTile(memberId: memberId, plan: p),
                    ),
                ],
        ),
      ],
    );
  }
}

class _AssignPlanTile extends ConsumerStatefulWidget {
  final String memberId;
  final DietPlanSummary plan;
  const _AssignPlanTile({required this.memberId, required this.plan});

  @override
  ConsumerState<_AssignPlanTile> createState() => _AssignPlanTileState();
}

class _AssignPlanTileState extends ConsumerState<_AssignPlanTile> {
  bool _busy = false;

  Future<void> _assign() async {
    setState(() => _busy = true);
    try {
      await ref.read(assignApiProvider).assignDiet(memberId: widget.memberId, planId: widget.plan.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(context.l10n.dietAssigned)));
        Navigator.of(context).pop(true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e is ApiError ? e.message : context.l10n.errorGeneric)));
        setState(() => _busy = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    return RepsiCard(
      padding: const EdgeInsets.all(12),
      child: Row(children: [
        Icon(LucideIcons.salad, color: palette.primaryDark),
        const SizedBox(width: 12),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(widget.plan.name, maxLines: 2, overflow: TextOverflow.ellipsis,
                style: AppTypography.bodySmall.copyWith(fontWeight: FontWeight.w700, color: palette.text)),
            if (widget.plan.goal != null || widget.plan.dietType != null)
              Text([widget.plan.goal, widget.plan.dietType].whereType<String>().map((s) => s.replaceAll('_', ' ')).join(' · '),
                  style: AppTypography.caption.copyWith(color: palette.textSecondary)),
          ]),
        ),
        _busy
            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
            : TextButton(onPressed: _assign, child: Text(context.l10n.assignBtn)),
      ]),
    );
  }
}

// ─── AI diet suggestion ───────────────────────────────────────────────────

class _DietSuggestView extends ConsumerStatefulWidget {
  final String memberId;
  final String? initialGoal;
  final String? workoutName;
  const _DietSuggestView({required this.memberId, this.initialGoal, this.workoutName});

  @override
  ConsumerState<_DietSuggestView> createState() => _DietSuggestViewState();
}

class _DietSuggestViewState extends ConsumerState<_DietSuggestView> {
  static const _goals = ['fat_loss', 'muscle_gain', 'strength', 'endurance', 'general_fitness', 'mobility'];
  static const _diets = ['vegetarian', 'vegan', 'eggetarian', 'non_vegetarian'];
  String _goal = 'muscle_gain';
  String _diet = 'vegetarian';
  int _meals = 4;
  final _weight = TextEditingController();
  bool _useAi = false;
  bool _loading = false;
  bool _saving = false;
  Map<String, dynamic>? _plan;
  String? _safety;
  String? _source;

  @override
  void initState() {
    super.initState();
    if (widget.initialGoal != null && _goals.contains(widget.initialGoal)) {
      _goal = widget.initialGoal!;
    }
  }

  @override
  void dispose() {
    _weight.dispose();
    super.dispose();
  }

  Future<void> _suggest() async {
    final w = double.tryParse(_weight.text.trim()) ?? 70.0;
    setState(() {
      _loading = true;
      _plan = null;
      _safety = null;
    });
    try {
      final res = await ref.read(assignApiProvider).suggestDiet(
          {
            'goal': _goal,
            'diet_type': _diet,
            'weight_kg': w,
            'meals_per_day': _meals,
            if (widget.workoutName != null) 'workout_context': widget.workoutName,
          },
          useAi: _useAi);
      setState(() {
        _plan = res['plan'] as Map<String, dynamic>?;
        _safety = res['safety_message'] as String?;
        _source = res['source'] as String?;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e is ApiError ? e.message : context.l10n.errorGeneric)));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _saveAndAssign() async {
    final plan = _plan;
    if (plan == null) return;
    setState(() => _saving = true);
    try {
      final api = ref.read(assignApiProvider);
      final planId = await api.createDietPlan({
        'name': plan['name'],
        'goal': plan['goal'],
        'diet_type': plan['diet_type'],
        'calories_target': plan['calories_target'],
        'protein_target': plan['protein_target'],
        'carbs_target': plan['carbs_target'],
        'fat_target': plan['fat_target'],
        'water_ml_target': plan['water_ml_target'],
        'meals': plan['meals'],
        if (plan['notes'] != null) 'notes': plan['notes'],
      });
      await api.assignDiet(memberId: widget.memberId, planId: planId);
      ref.invalidate(assignableDietPlansProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(context.l10n.dietAssigned)));
        Navigator.of(context).pop(true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e is ApiError ? e.message : context.l10n.errorGeneric)));
        setState(() => _saving = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final palette = context.palette;
    final plan = _plan;
    return Scaffold(
      backgroundColor: palette.background,
      appBar: AppBar(title: Text(l.aiDietSuggestion)),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        children: [
          if (widget.workoutName != null) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: palette.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: palette.border),
              ),
              child: Row(children: [
                const Icon(LucideIcons.dumbbell, size: 18, color: AppColors.primary),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Matched to: ${widget.workoutName}',
                    style: AppTypography.caption.copyWith(fontWeight: FontWeight.w600, color: palette.text),
                  ),
                ),
              ]),
            ),
            const SizedBox(height: 14),
          ],
          Text(l.goalQuestionTitle, style: AppTypography.sectionHeading.copyWith(fontSize: 15, color: palette.text)),
          const SizedBox(height: 8),
          Wrap(spacing: 8, runSpacing: 8, children: [
            for (final g in _goals) _chip(_goalLabel(l, g), _goal == g, () => setState(() => _goal = g)),
          ]),
          const SizedBox(height: 16),
          Text(l.foodPreference, style: AppTypography.sectionHeading.copyWith(fontSize: 15, color: palette.text)),
          const SizedBox(height: 8),
          Wrap(spacing: 8, runSpacing: 8, children: [
            for (final d in _diets) _chip(_dietLabel(l, d), _diet == d, () => setState(() => _diet = d)),
          ]),
          const SizedBox(height: 16),
          Row(children: [
            Expanded(
              child: TextField(
                controller: _weight,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: InputDecoration(labelText: l.bodyWeightKg, prefixIcon: const Icon(LucideIcons.weight)),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: DropdownButtonFormField<int>(
                initialValue: _meals,
                decoration: InputDecoration(labelText: l.mealsPerDay),
                items: [for (final m in [3, 4, 5]) DropdownMenuItem(value: m, child: Text('$m'))],
                onChanged: (v) => setState(() => _meals = v ?? 4),
              ),
            ),
          ]),
          SwitchListTile.adaptive(
            contentPadding: EdgeInsets.zero,
            value: _useAi,
            activeTrackColor: AppColors.primary,
            title: Text(l.personaliseWithAi, style: AppTypography.bodySmall.copyWith(color: palette.text)),
            subtitle: Text(l.personaliseWithAiHint, style: AppTypography.caption.copyWith(color: palette.textSecondary)),
            onChanged: (v) => setState(() => _useAi = v),
          ),
          const SizedBox(height: 4),
          RepsiButton(
            text: l.generatePlan,
            isFullWidth: true,
            isLoading: _loading,
            leadingIcon: const Icon(LucideIcons.brainCircuit, size: 18),
            onPressed: _loading ? null : _suggest,
          ),
          if (_safety != null) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(color: palette.warningSoft, borderRadius: BorderRadius.circular(12)),
              child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Icon(LucideIcons.triangleAlert, size: 18, color: palette.warningDark),
                const SizedBox(width: 10),
                Expanded(child: Text(_safety!, style: AppTypography.bodySmall.copyWith(color: palette.text, height: 1.4))),
              ]),
            ),
          ],
          if (plan != null) ...[
            const SizedBox(height: 20),
            _PlanPreview(plan: plan, aiPersonalised: _source == 'ai' || _source == 'cached'),
            const SizedBox(height: 16),
            RepsiButton(
              text: l.saveAndAssign,
              isFullWidth: true,
              isLoading: _saving,
              leadingIcon: const Icon(LucideIcons.check, size: 18),
              onPressed: _saving ? null : _saveAndAssign,
            ),
          ],
        ],
      ),
    );
  }

  Widget _chip(String label, bool selected, VoidCallback onTap) {
    final palette = context.palette;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
        decoration: BoxDecoration(
          color: selected ? AppColors.primary : palette.surface,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: selected ? AppColors.primary : palette.border),
        ),
        child: Text(label, style: AppTypography.bodySmall.copyWith(fontWeight: FontWeight.w600, color: selected ? Colors.white : palette.text)),
      ),
    );
  }

  String _goalLabel(AppLocalizations l, String g) => switch (g) {
        'fat_loss' => l.goalFatLoss,
        'muscle_gain' => l.goalMuscleGain,
        'strength' => l.goalStrength,
        'endurance' => l.goalEndurance,
        'mobility' => l.goalMobility,
        _ => l.goalGeneralFitness,
      };

  String _dietLabel(AppLocalizations l, String d) => switch (d) {
        'vegetarian' => l.dietVegetarian,
        'vegan' => l.dietVegan,
        'eggetarian' => l.dietEggetarian,
        _ => l.dietNonVegetarian,
      };
}

class _PlanPreview extends StatelessWidget {
  final Map<String, dynamic> plan;
  final bool aiPersonalised;
  const _PlanPreview({required this.plan, required this.aiPersonalised});

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final palette = context.palette;
    final meals = (plan['meals'] as List?) ?? const [];
    num t(String k) => (plan[k] as num?) ?? 0;
    return Container(
      decoration: BoxDecoration(
        color: palette.surface,
        borderRadius: BorderRadius.circular(AppSpacing.radiusCard),
        border: Border.all(color: palette.border),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(14),
          color: palette.primarySoft,
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Expanded(
                child: Text(plan['name']?.toString() ?? '',
                    style: AppTypography.sectionHeading.copyWith(color: palette.text)),
              ),
              if (aiPersonalised)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(999)),
                  child: const Text('AI', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 11)),
                ),
            ]),
            const SizedBox(height: 10),
            Wrap(spacing: 8, runSpacing: 8, children: [
              _macro(context, '${t('calories_target').round()}', l.kcal),
              _macro(context, '${t('protein_target').round()}g', l.protein),
              _macro(context, '${t('carbs_target').round()}g', l.carbs),
              _macro(context, '${t('fat_target').round()}g', l.fat),
            ]),
          ]),
        ),
        for (final m in meals) _mealRow(context, Map<String, dynamic>.from(m as Map)),
      ]),
    );
  }

  Widget _macro(BuildContext context, String value, String label) {
    final palette = context.palette;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(color: palette.surface, borderRadius: BorderRadius.circular(10)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Text(value, style: AppTypography.bodySmall.copyWith(fontWeight: FontWeight.w800, color: palette.text)),
        const SizedBox(width: 4),
        Text(label, style: AppTypography.caption.copyWith(color: palette.textSecondary)),
      ]),
    );
  }

  Widget _mealRow(BuildContext context, Map<String, dynamic> m) {
    final palette = context.palette;
    final items = (m['items'] as List?) ?? const [];
    return Padding(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 4),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Text(m['title']?.toString() ?? m['slot']?.toString() ?? '',
              style: AppTypography.bodySmall.copyWith(fontWeight: FontWeight.w700, color: palette.text)),
          const SizedBox(width: 8),
          if (m['time'] != null) Text(m['time'].toString(), style: AppTypography.caption.copyWith(color: palette.textMuted)),
        ]),
        const SizedBox(height: 4),
        for (final it in items)
          Padding(
            padding: const EdgeInsets.only(bottom: 3),
            child: Row(children: [
              Expanded(
                child: Text('${(it as Map)['food']} · ${it['portion']}',
                    style: AppTypography.caption.copyWith(color: palette.textSecondary)),
              ),
              Text('${(it['calories'] as num?)?.round() ?? 0} kcal',
                  style: AppTypography.caption.copyWith(color: palette.textMuted)),
            ]),
          ),
        Divider(height: 14, color: palette.border),
      ]),
    );
  }
}

// ─── shared bits ──────────────────────────────────────────────────────────

class _SelectTile extends StatelessWidget {
  final bool selected;
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  const _SelectTile({required this.selected, required this.icon, required this.title, required this.subtitle, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    return Material(
      color: selected ? palette.primarySoft : palette.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppSpacing.radiusCard),
        side: BorderSide(color: selected ? AppColors.primary : palette.border, width: selected ? 1.5 : 1),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(AppSpacing.radiusCard),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(children: [
            Icon(icon, color: selected ? AppColors.primary : palette.textSecondary),
            const SizedBox(width: 12),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(title, maxLines: 2, overflow: TextOverflow.ellipsis,
                    style: AppTypography.bodySmall.copyWith(fontWeight: FontWeight.w700, color: palette.text)),
                if (subtitle.isNotEmpty)
                  Text(subtitle, maxLines: 1, overflow: TextOverflow.ellipsis,
                      style: AppTypography.caption.copyWith(color: palette.textSecondary)),
              ]),
            ),
            Icon(selected ? Icons.radio_button_checked_rounded : Icons.radio_button_off_rounded,
                color: selected ? AppColors.primary : palette.textMuted),
          ]),
        ),
      ),
    );
  }
}

class _BottomBar extends StatelessWidget {
  final Widget child;
  const _BottomBar({required this.child});

  @override
  Widget build(BuildContext context) => SafeArea(
        minimum: const EdgeInsets.all(16),
        child: child,
      );
}
