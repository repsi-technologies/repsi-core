import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/repsi_palette.dart';
import '../../../core/api/api_error.dart';
import '../../../l10n/l10n.dart';
import '../../../shared/widgets/repsi_card.dart';
import '../data/coaching_repository.dart';

/// Member diet builder: pick veg / egg / non-veg / vegan and the foods you have at home, get a
/// plan built from them, then follow it yourself or ask your trainer to make one. Same flow as
/// the website's My diet page.
class DietBuilderView extends ConsumerStatefulWidget {
  const DietBuilderView({super.key});

  @override
  ConsumerState<DietBuilderView> createState() => _DietBuilderViewState();
}

class _DietBuilderViewState extends ConsumerState<DietBuilderView> {
  static const _dietAllows = {
    'vegetarian': {'vegan', 'veg'},
    'eggetarian': {'vegan', 'veg', 'egg'},
    'non_vegetarian': {'vegan', 'veg', 'egg', 'nonveg'},
    'vegan': {'vegan'},
  };

  final _weight = TextEditingController();
  final _notes = TextEditingController();
  List<(String, String)> _goals = const [];
  List<(String, String)> _foods = const [];
  Map<String, String> _dietOf = const {};
  String _dietType = 'vegetarian';
  String _goal = 'general_fitness';
  int _meals = 4;
  final Set<String> _have = {};
  Map<String, dynamic>? _result;
  String? _busy;
  String? _error;
  bool _loading = true;

  CoachingRepository get _repo => ref.read(coachingRepositoryProvider);

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _weight.dispose();
    _notes.dispose();
    super.dispose();
  }

  List<(String, String)> _options(Map q) =>
      [for (final o in (q['options'] as List? ?? const [])) ('${(o as List)[0]}', '${o[1]}')];

  Future<void> _load() async {
    try {
      final data = await _repo.dietQuestions();
      final qs = (data['questions'] as List? ?? const []).cast<Map>();
      final ingredientsQ = qs.firstWhere((q) => q['key'] == 'ingredients', orElse: () => const {});
      final goalQ = qs.firstWhere((q) => q['key'] == 'goal', orElse: () => const {});
      final prefs = await _repo.myDietPreferences().then<Map<String, dynamic>?>((p) => p, onError: (_) => null);
      if (!mounted) return;
      setState(() {
        _foods = _options(ingredientsQ);
        _goals = _options(goalQ);
        _dietOf = {for (final e in ((ingredientsQ['diet_of'] as Map?) ?? const {}).entries) '${e.key}': '${e.value}'};
        if (prefs != null) {
          _dietType = prefs['diet_type'] as String? ?? _dietType;
          _goal = prefs['goal'] as String? ?? _goal;
          _have.addAll([for (final k in (prefs['ingredients'] as List? ?? const [])) '$k']);
          _notes.text = prefs['notes'] as String? ?? '';
        }
        _loading = false;
      });
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = _message(e);
          _loading = false;
        });
      }
    }
  }

  String _message(Object e) => e is ApiError ? e.message : context.l10n.errorGeneric;

  List<(String, String)> get _visibleFoods =>
      [for (final f in _foods) if (_dietAllows[_dietType]!.contains(_dietOf[f.$1] ?? 'vegan')) f];

  List<String> get _selected => [for (final f in _visibleFoods) if (_have.contains(f.$1)) f.$1];

  double? get _weightKg {
    final w = double.tryParse(_weight.text.trim());
    return w != null && w >= 25 && w <= 250 ? w : null;
  }

  Future<void> _run(String key, Future<void> Function() action) async {
    setState(() {
      _busy = key;
      _error = null;
    });
    try {
      await action();
    } catch (e) {
      if (mounted) setState(() => _error = _message(e));
    } finally {
      if (mounted) setState(() => _busy = null);
    }
  }

  Future<void> _suggest({bool ai = false}) => _run(ai ? 'ai' : 'rules', () async {
        final r = await _repo.suggestDiet({
          'goal': _goal,
          'diet_type': _dietType,
          'weight_kg': _weightKg,
          'meals_per_day': _meals,
          'ingredients': _selected,
          if (_notes.text.trim().isNotEmpty) 'notes': _notes.text.trim(),
        }, useAi: ai);
        if (mounted) setState(() => _result = r);
      });

  void _toast(String text) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));

  Future<void> _usePlan() => _run('save', () async {
        final plan = Map<String, dynamic>.from(_result!['plan'] as Map);
        await _repo.chooseMyDietPlan(plan);
        await _repo.saveDietPreferences(dietType: _dietType, goal: _goal, ingredients: _selected, notes: _notes.text);
        ref.invalidate(nutritionDayProvider(null));
        if (!mounted) return;
        _toast(context.l10n.dietNowFollowing);
        Navigator.of(context).pop();
      });

  Future<void> _askTrainer() => _run('ask', () async {
        final n = await _repo.saveDietPreferences(
            dietType: _dietType, goal: _goal, ingredients: _selected, notes: _notes.text, askTrainer: true);
        if (mounted) _toast(n > 0 ? context.l10n.dietTrainerAsked : context.l10n.dietNoTrainer);
      });

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final palette = context.palette;
    final dietLabels = {
      'vegetarian': l.dietTypeVegetarian,
      'eggetarian': l.dietTypeEggetarian,
      'non_vegetarian': l.dietTypeNonVeg,
      'vegan': l.dietTypeVegan,
    };
    final plan = _result?['plan'] as Map?;
    final safety = _result?['safety_message'] as String?;

    Widget label(String text) => Padding(
          padding: const EdgeInsets.only(top: 16, bottom: 8),
          child: Text(text, style: AppTypography.bodySmall.copyWith(fontWeight: FontWeight.w700, color: palette.text)),
        );

    return Scaffold(
      appBar: AppBar(title: Text(l.dietBuildTitle)),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.fromLTRB(AppSpacing.pageHorizontalPadding, 8, AppSpacing.pageHorizontalPadding, 32),
              children: [
                if (_error != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Text(_error!, style: AppTypography.bodySmall.copyWith(color: palette.errorDark)),
                  ),
                label(l.dietFoodPreference),
                Wrap(spacing: 8, runSpacing: 8, children: [
                  for (final e in dietLabels.entries)
                    ChoiceChip(label: Text(e.value), selected: _dietType == e.key, onSelected: (_) => setState(() => _dietType = e.key)),
                ]),
                label(l.dietFoodsYouHave),
                Wrap(spacing: 8, runSpacing: 8, children: [
                  for (final f in _visibleFoods)
                    FilterChip(
                      label: Text(f.$2),
                      selected: _have.contains(f.$1),
                      onSelected: (on) => setState(() => on ? _have.add(f.$1) : _have.remove(f.$1)),
                    ),
                ]),
                label(l.dietGoal),
                DropdownButtonFormField<String>(
                  initialValue: _goals.any((g) => g.$1 == _goal) ? _goal : null,
                  isExpanded: true,
                  items: [for (final g in _goals) DropdownMenuItem(value: g.$1, child: Text(g.$2))],
                  onChanged: (v) => setState(() => _goal = v ?? _goal),
                ),
                Row(children: [
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.only(top: 12),
                      child: TextField(
                        controller: _weight,
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        decoration: InputDecoration(labelText: l.dietWeightKg),
                        onChanged: (_) => setState(() {}),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.only(top: 12),
                      child: DropdownButtonFormField<int>(
                        initialValue: _meals,
                        decoration: InputDecoration(labelText: l.dietMealsPerDay),
                        items: [for (final n in const [3, 4, 5]) DropdownMenuItem(value: n, child: Text('$n'))],
                        onChanged: (v) => setState(() => _meals = v ?? _meals),
                      ),
                    ),
                  ),
                ]),
                const SizedBox(height: 12),
                TextField(controller: _notes, maxLength: 200, decoration: InputDecoration(labelText: l.dietAvoid)),
                const SizedBox(height: 8),
                FilledButton(
                  onPressed: _weightKg == null || _busy != null ? null : _suggest,
                  style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
                  child: _busy == 'rules' ? const _Spinner() : Text(l.dietSuggest),
                ),
                if (_weightKg == null)
                  Padding(
                    padding: const EdgeInsets.only(top: 6),
                    child: Text(l.dietEnterWeight, style: AppTypography.caption.copyWith(color: palette.textSecondary)),
                  ),
                const SizedBox(height: 8),
                OutlinedButton(
                  onPressed: _busy != null ? null : _askTrainer,
                  style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(48)),
                  child: _busy == 'ask' ? const _Spinner() : Text(l.dietAskTrainer),
                ),
                if (safety != null) ...[
                  const SizedBox(height: 16),
                  RepsiCard(child: Text(safety, style: AppTypography.bodySmall.copyWith(color: palette.text))),
                ],
                if (plan != null) ...[
                  const SizedBox(height: 20),
                  Text('${plan['name']}', style: AppTypography.sectionHeading.copyWith(color: palette.text)),
                  const SizedBox(height: 8),
                  for (final meal in (plan['meals'] as List? ?? const []))
                    Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: RepsiCard(
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text('${meal['title'] ?? meal['slot']}${meal['time'] != null ? ' · ${meal['time']}' : ''}',
                              style: AppTypography.bodySmall.copyWith(fontWeight: FontWeight.w700, color: palette.text)),
                          for (final it in (meal['items'] as List? ?? const []))
                            Padding(
                              padding: const EdgeInsets.only(top: 4),
                              child: Text('• ${it['food']} — ${it['portion']} (${it['calories']} kcal)',
                                  style: AppTypography.bodySmall.copyWith(color: palette.textSecondary)),
                            ),
                        ]),
                      ),
                    ),
                  FilledButton(
                    onPressed: _busy != null ? null : _usePlan,
                    style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
                    child: _busy == 'save' ? const _Spinner() : Text(l.dietUseThisPlan),
                  ),
                  const SizedBox(height: 8),
                  OutlinedButton(
                    onPressed: _busy != null ? null : () => _suggest(ai: true),
                    style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(48)),
                    child: _busy == 'ai' ? const _Spinner() : Text(l.dietPersonaliseAi),
                  ),
                ],
              ],
            ),
    );
  }
}

class _Spinner extends StatelessWidget {
  const _Spinner();

  @override
  Widget build(BuildContext context) =>
      const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2));
}
