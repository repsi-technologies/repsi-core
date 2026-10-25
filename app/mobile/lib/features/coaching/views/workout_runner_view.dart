import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/repsi_palette.dart';
import '../../../l10n/l10n.dart';
import '../../../shared/animations/repsi_motion.dart';
import '../../../shared/widgets/repsi_button.dart';
import '../coaching_labels.dart';
import '../data/coaching_models.dart';
import '../../member/presentation/exercise_media_widget.dart';
import 'workout_plan_view.dart' show showExerciseSheet;

enum _Phase { work, rest, done }

/// Guided session for one suggested day: one set at a time, with a countdown for timed sets and
/// rest periods. It runs on the phone only; nothing is sent to the gym.
class WorkoutRunnerView extends StatefulWidget {
  final PlannedDay day;
  const WorkoutRunnerView({super.key, required this.day});

  @override
  State<WorkoutRunnerView> createState() => _WorkoutRunnerViewState();
}

class _WorkoutRunnerViewState extends State<WorkoutRunnerView> {
  Timer? _ticker;
  int _exercise = 0;
  int _set = 1;
  _Phase _phase = _Phase.work;
  int _elapsed = 0;
  int _remaining = 0; // countdown for timed work or rest
  int _countdownTotal = 1;
  bool _running = false; // countdown running
  int _setsDone = 0;

  List<PlannedExercise> get _exercises => widget.day.exercises;
  PlannedExercise get _current => _exercises[_exercise];
  int get _totalSets => _exercises.fold(0, (sum, e) => sum + e.sets);

  @override
  void initState() {
    super.initState();
    _ticker = Timer.periodic(const Duration(seconds: 1), (_) => _tick());
    _prepareWork();
  }

  @override
  void dispose() {
    _ticker?.cancel();
    super.dispose();
  }

  void _tick() {
    if (!mounted || _phase == _Phase.done) return;
    setState(() {
      _elapsed++;
      if (_running && _remaining > 0) {
        _remaining--;
        if (_remaining <= 3 && _remaining > 0) HapticFeedback.selectionClick();
        if (_remaining == 0) {
          _running = false;
          HapticFeedback.heavyImpact();
          if (_phase == _Phase.rest) {
            _prepareWork();
          } else {
            _completeSet();
          }
        }
      }
    });
  }

  void _prepareWork() {
    _phase = _Phase.work;
    if (_current.isTimed) {
      _remaining = _current.durationSeconds!;
      _countdownTotal = _remaining;
    }
    _running = false;
  }

  void _completeSet() {
    _setsDone++;
    final lastSet = _set >= _current.sets;
    final lastExercise = _exercise >= _exercises.length - 1;
    if (lastSet && lastExercise) {
      _phase = _Phase.done;
      HapticFeedback.heavyImpact();
      return;
    }
    if (lastSet) {
      _exercise++;
      _set = 1;
    } else {
      _set++;
    }
    final rest = _exercises[lastSet ? _exercise - 1 : _exercise].restSeconds;
    _phase = _Phase.rest;
    _remaining = rest;
    _countdownTotal = math.max(1, rest);
    _running = true;
  }

  void _skipRest() => setState(_prepareWork);

  void _addRest() => setState(() {
        _remaining += 15;
        _countdownTotal += 15;
      });

  void _onPrimary() {
    HapticFeedback.mediumImpact();
    setState(() {
      if (_phase == _Phase.work && _current.isTimed && !_running && _remaining > 0) {
        _running = true;
      } else if (_phase == _Phase.work && _current.isTimed && _running) {
        _running = false;
      } else if (_phase == _Phase.work) {
        _completeSet();
      }
    });
  }

  Future<bool> _confirmLeave() async {
    if (_phase == _Phase.done || _setsDone == 0) return true;
    final l = context.l10n;
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(l.endWorkoutTitle),
        content: Text(l.endWorkoutBody),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(l.keepGoing)),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: Text(l.endWorkout)),
        ],
      ),
    );
    return ok == true;
  }

  String _clock(int seconds) {
    final m = seconds ~/ 60, s = seconds % 60;
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    if (_phase == _Phase.done) {
      return _WorkoutDone(day: widget.day, seconds: _elapsed, sets: _setsDone);
    }
    final l = context.l10n;
    final palette = context.palette;
    final e = _current;
    final isRest = _phase == _Phase.rest;
    final next = _set < e.sets
        ? null
        : (_exercise + 1 < _exercises.length ? _exercises[_exercise + 1] : null);

    final String primaryLabel;
    if (e.isTimed && !isRest) {
      primaryLabel = _running ? l.pause : (_remaining == _countdownTotal ? l.startSet : l.resume);
    } else {
      primaryLabel = l.setDone;
    }

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) async {
        if (didPop) return;
        if (await _confirmLeave() && context.mounted) Navigator.of(context).pop();
      },
      child: Scaffold(
        backgroundColor: palette.background,
        appBar: AppBar(
          backgroundColor: palette.background,
          leading: IconButton(
            tooltip: l.commonClose,
            icon: const Icon(Icons.close_rounded),
            onPressed: () async {
              if (await _confirmLeave() && context.mounted) Navigator.of(context).pop();
            },
          ),
          title: Text(dayFocusLabel(l, widget.day.focus)),
          actions: [
            Center(
              child: Padding(
                padding: const EdgeInsets.only(right: 16),
                child: Row(children: [
                  Icon(Icons.timer_outlined, size: 18, color: palette.textSecondary),
                  const SizedBox(width: 4),
                  Text(_clock(_elapsed),
                      style: AppTypography.bodySmall.copyWith(
                          fontFeatures: const [FontFeature.tabularFigures()], fontWeight: FontWeight.w700, color: palette.text)),
                ]),
              ),
            ),
          ],
          bottom: PreferredSize(
            preferredSize: const Size.fromHeight(6),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.pageHorizontalPadding),
              child: TweenAnimationBuilder<double>(
                tween: Tween(end: _setsDone / math.max(1, _totalSets)),
                duration: RepsiMotion.card,
                builder: (_, v, __) => ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: v,
                    minHeight: 6,
                    backgroundColor: palette.surfaceSecondary,
                    valueColor: const AlwaysStoppedAnimation(AppColors.primary),
                  ),
                ),
              ),
            ),
          ),
        ),
        body: SafeArea(
          child: LayoutBuilder(builder: (context, c) {
            final ring = math.min(c.maxWidth * 0.62, c.maxHeight * 0.38).clamp(160.0, 280.0);
            return Column(
              children: [
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: AppSpacing.pageHorizontalPadding, vertical: 16),
                    child: AnimatedSwitcher(
                      duration: RepsiMotion.card,
                      transitionBuilder: (child, a) => FadeTransition(
                        opacity: a,
                        child: ScaleTransition(scale: Tween(begin: 0.96, end: 1.0).animate(a), child: child),
                      ),
                      child: Column(
                        key: ValueKey('$_exercise-$_set-${_phase.name}'),
                        children: [
                          Text(
                            isRest ? l.restTime.toUpperCase() : l.exerciseOfTotal(_exercise + 1, _exercises.length).toUpperCase(),
                            style: AppTypography.caption.copyWith(
                                letterSpacing: 1.2,
                                fontWeight: FontWeight.w800,
                                color: isRest ? AppColors.accentTeal : AppColors.primary),
                          ),
                          const SizedBox(height: 8),
                          Text(isRest ? l.nextUpName(e.name) : e.name,
                              textAlign: TextAlign.center,
                              style: AppTypography.heading.copyWith(fontSize: 26, fontWeight: FontWeight.w800, color: palette.text)),
                          const SizedBox(height: 6),
                          if (!isRest)
                            Text(l.setOfTotal(_set, e.sets),
                                style: AppTypography.bodySecondary.copyWith(color: palette.textSecondary)),
                          const SizedBox(height: 14),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(16),
                            child: SizedBox(
                              height: 140,
                              width: double.infinity,
                              child: ExerciseDemonstrationMedia(
                                mediaUrl: e.mediaUrl,
                                exerciseName: e.name,
                                height: 140,
                                width: double.infinity,
                                borderRadius: BorderRadius.circular(16),
                                showControls: true,
                                showBadge: true,
                                badgeText: isRest ? 'Next Up Movement' : 'Form Guidance',
                              ),
                            ),
                          ),
                          const SizedBox(height: 18),
                          SizedBox.square(
                            dimension: ring,
                            child: _ProgressRing(
                              progress: (isRest || e.isTimed) ? _remaining / math.max(1, _countdownTotal) : 1,
                              color: isRest ? AppColors.accentTeal : AppColors.primary,
                              track: palette.surfaceSecondary,
                              pulsing: !isRest && !e.isTimed,
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  FittedBox(
                                    child: Text(
                                      (isRest || e.isTimed) ? _clock(_remaining) : (e.reps ?? ''),
                                      style: AppTypography.heading.copyWith(
                                          fontSize: 48,
                                          fontWeight: FontWeight.w900,
                                          color: palette.text,
                                          fontFeatures: const [FontFeature.tabularFigures()]),
                                    ),
                                  ),
                                  Text(
                                    isRest ? l.restTime : (e.isTimed ? l.holdOrMove : l.repsLabel),
                                    style: AppTypography.caption.copyWith(color: palette.textSecondary),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 20),
                          if (!isRest)
                            TextButton.icon(
                              onPressed: () => showExerciseSheet(context, e),
                              icon: const Icon(Icons.menu_book_rounded, size: 18),
                              label: Text(l.howToDoIt),
                            ),
                          if (isRest)
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                OutlinedButton.icon(
                                  style: OutlinedButton.styleFrom(minimumSize: const Size(0, 44)),
                                  onPressed: _addRest,
                                  icon: const Icon(Icons.add_rounded, size: 18),
                                  label: Text(l.plusSeconds(15)),
                                ),
                              ],
                            ),
                          if (next != null && !isRest) ...[
                            const SizedBox(height: 16),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                              decoration: BoxDecoration(
                                color: palette.surface,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: palette.border),
                              ),
                              child: Row(children: [
                                Icon(Icons.skip_next_rounded, color: palette.textMuted),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(l.nextUpName(next.name),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: AppTypography.bodySmall.copyWith(color: palette.textSecondary)),
                                ),
                              ]),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(AppSpacing.pageHorizontalPadding, 8, AppSpacing.pageHorizontalPadding, 16),
                  child: isRest
                      ? RepsiButton(
                          text: l.skipRest,
                          isFullWidth: true,
                          variant: RepsiButtonVariant.outline,
                          trailingIcon: const Icon(Icons.fast_forward_rounded, size: 18),
                          onPressed: _skipRest,
                        )
                      : RepsiButton(
                          text: primaryLabel,
                          isFullWidth: true,
                          leadingIcon: Icon(
                              e.isTimed ? (_running ? Icons.pause_rounded : Icons.play_arrow_rounded) : Icons.check_rounded,
                              size: 20),
                          onPressed: _onPrimary,
                        ),
                ),
              ],
            );
          }),
        ),
      ),
    );
  }
}

class _ProgressRing extends StatefulWidget {
  final double progress;
  final Color color;
  final Color track;
  final bool pulsing;
  final Widget child;
  const _ProgressRing(
      {required this.progress, required this.color, required this.track, required this.pulsing, required this.child});

  @override
  State<_ProgressRing> createState() => _ProgressRingState();
}

class _ProgressRingState extends State<_ProgressRing> with SingleTickerProviderStateMixin {
  late final AnimationController _pulse =
      AnimationController(vsync: this, duration: const Duration(milliseconds: 1600));

  @override
  void initState() {
    super.initState();
    if (widget.pulsing) _pulse.repeat(reverse: true);
  }

  @override
  void didUpdateWidget(covariant _ProgressRing old) {
    super.didUpdateWidget(old);
    if (widget.pulsing && !_pulse.isAnimating) {
      _pulse.repeat(reverse: true);
    } else if (!widget.pulsing && _pulse.isAnimating) {
      _pulse.stop();
      _pulse.value = 0;
    }
  }

  @override
  void dispose() {
    _pulse.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final reduceMotion = MediaQuery.maybeDisableAnimationsOf(context) ?? false;
    return AnimatedBuilder(
      animation: _pulse,
      builder: (context, child) {
        final glow = reduceMotion ? 0.0 : _pulse.value;
        return TweenAnimationBuilder<double>(
          tween: Tween(end: widget.progress.clamp(0.0, 1.0)),
          duration: const Duration(milliseconds: 900),
          curve: Curves.linear,
          builder: (_, value, __) => CustomPaint(
            painter: _RingPainter(value: value, color: widget.color, track: widget.track, glow: glow),
            child: Center(child: child),
          ),
        );
      },
      child: widget.child,
    );
  }
}

class _RingPainter extends CustomPainter {
  final double value;
  final Color color;
  final Color track;
  final double glow;
  _RingPainter({required this.value, required this.color, required this.track, required this.glow});

  @override
  void paint(Canvas canvas, Size size) {
    final stroke = size.width * 0.07;
    final rect = Offset.zero & size;
    final arcRect = rect.deflate(stroke / 2 + 6);
    if (glow > 0) {
      canvas.drawCircle(rect.center, arcRect.width / 2,
          Paint()
            ..color = color.withValues(alpha: 0.10 + 0.12 * glow)
            ..maskFilter = MaskFilter.blur(BlurStyle.normal, 10 + 12 * glow));
    }
    canvas.drawArc(arcRect, 0, math.pi * 2, false,
        Paint()
          ..color = track
          ..style = PaintingStyle.stroke
          ..strokeWidth = stroke);
    canvas.drawArc(arcRect, -math.pi / 2, math.pi * 2 * value, false,
        Paint()
          ..shader = SweepGradient(
            startAngle: -math.pi / 2,
            endAngle: math.pi * 1.5,
            colors: [color.withValues(alpha: 0.6), color],
          ).createShader(arcRect)
          ..style = PaintingStyle.stroke
          ..strokeCap = StrokeCap.round
          ..strokeWidth = stroke);
  }

  @override
  bool shouldRepaint(covariant _RingPainter old) =>
      old.value != value || old.color != color || old.glow != glow || old.track != track;
}

class _WorkoutDone extends StatefulWidget {
  final PlannedDay day;
  final int seconds;
  final int sets;
  const _WorkoutDone({required this.day, required this.seconds, required this.sets});

  @override
  State<_WorkoutDone> createState() => _WorkoutDoneState();
}

class _WorkoutDoneState extends State<_WorkoutDone> with SingleTickerProviderStateMixin {
  late final AnimationController _burst =
      AnimationController(vsync: this, duration: const Duration(milliseconds: 1400))..forward();

  @override
  void dispose() {
    _burst.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final minutes = math.max(1, (widget.seconds / 60).round());
    return Scaffold(
      backgroundColor: AppColors.ink,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              const Spacer(),
              SizedBox(
                width: 220,
                height: 220,
                child: AnimatedBuilder(
                  animation: _burst,
                  builder: (_, child) => CustomPaint(
                    painter: _BurstPainter(_burst.value),
                    child: Center(
                      child: Transform.scale(
                        scale: Curves.elasticOut.transform(_burst.value.clamp(0.0, 1.0)),
                        child: child,
                      ),
                    ),
                  ),
                  child: Container(
                    width: 104,
                    height: 104,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: const LinearGradient(colors: AppColors.energyGradient),
                      boxShadow: [BoxShadow(color: AppColors.primary.withValues(alpha: 0.5), blurRadius: 40)],
                    ),
                    child: const Icon(Icons.emoji_events_rounded, color: Colors.white, size: 52),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text(l.workoutCompleteTitle,
                  textAlign: TextAlign.center,
                  style: AppTypography.heading.copyWith(color: AppColors.inkText, fontSize: 28, fontWeight: FontWeight.w900)),
              const SizedBox(height: 8),
              Text(l.workoutCompleteSubtitle(dayFocusLabel(l, widget.day.focus)),
                  textAlign: TextAlign.center, style: AppTypography.bodySecondary.copyWith(color: AppColors.inkTextSecondary)),
              const SizedBox(height: 28),
              Row(children: [
                _DoneStat(value: l.unitMinutes(minutes), label: l.statDuration),
                const SizedBox(width: 10),
                _DoneStat(value: '${widget.day.exercises.length}', label: l.statExercises),
                const SizedBox(width: 10),
                _DoneStat(value: '${widget.sets}', label: l.statSets),
              ]),
              const Spacer(),
              RepsiButton(text: l.commonDone, isFullWidth: true, onPressed: () => Navigator.of(context).pop()),
            ],
          ),
        ),
      ),
    );
  }
}

class _DoneStat extends StatelessWidget {
  final String value;
  final String label;
  const _DoneStat({required this.value, required this.label});

  @override
  Widget build(BuildContext context) => Expanded(
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
          decoration: BoxDecoration(
            color: AppColors.inkSurface,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.inkBorder),
          ),
          child: Column(children: [
            FittedBox(
              child: Text(value,
                  style: AppTypography.heading.copyWith(color: AppColors.inkText, fontSize: 20, fontWeight: FontWeight.w800)),
            ),
            const SizedBox(height: 2),
            Text(label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AppTypography.caption.copyWith(color: AppColors.inkTextSecondary)),
          ]),
        ),
      );
}

class _BurstPainter extends CustomPainter {
  final double t;
  _BurstPainter(this.t);

  static const _colors = [
    AppColors.primaryBright, AppColors.accentAmber, AppColors.accentPink, AppColors.accentTeal, AppColors.accentViolet,
  ];

  @override
  void paint(Canvas canvas, Size size) {
    final center = size.center(Offset.zero);
    final eased = Curves.easeOutCubic.transform(t);
    final fade = (1 - t).clamp(0.0, 1.0);
    for (var i = 0; i < 18; i++) {
      final angle = (math.pi * 2 / 18) * i;
      final distance = 50 + 60 * eased + (i.isEven ? 10 : 0);
      final p = center + Offset(math.cos(angle), math.sin(angle)) * distance;
      canvas.drawCircle(p, i.isEven ? 4 : 3, Paint()..color = _colors[i % _colors.length].withValues(alpha: fade));
    }
  }

  @override
  bool shouldRepaint(covariant _BurstPainter old) => old.t != t;
}
