import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/repsi_palette.dart';

/// Free, open-source exercise demonstration media catalog (jsDelivr CDN via ExerciseGymGifsDB)
class ExerciseMediaInfo {
  final String title;
  final String gifUrl;
  final String thumbUrl;
  final String primaryMuscle;
  final List<String> secondaryMuscles;
  final String equipment;
  final String category;

  const ExerciseMediaInfo({
    required this.title,
    required this.gifUrl,
    required this.thumbUrl,
    required this.primaryMuscle,
    this.secondaryMuscles = const [],
    required this.equipment,
    required this.category,
  });
}

const String _kCdnBase = 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main';

const Map<String, ExerciseMediaInfo> kExerciseMediaCatalog = {
  'barbell bench press': ExerciseMediaInfo(
    title: 'Barbell Bench Press',
    gifUrl: '$_kCdnBase/pectorals/barbell-bench-press.gif',
    thumbUrl: '$_kCdnBase/pectorals/barbell-bench-press.thumb.webp',
    primaryMuscle: 'Mid Chest',
    secondaryMuscles: ['Triceps', 'Front Delts'],
    equipment: 'Barbell',
    category: 'Chest',
  ),
  'incline dumbbell press': ExerciseMediaInfo(
    title: 'Incline Dumbbell Press',
    gifUrl: '$_kCdnBase/pectorals/dumbbell-incline-bench-press.gif',
    thumbUrl: '$_kCdnBase/pectorals/dumbbell-incline-bench-press.thumb.webp',
    primaryMuscle: 'Upper Chest',
    secondaryMuscles: ['Triceps', 'Anterior Deltoids'],
    equipment: 'Dumbbells',
    category: 'Chest',
  ),
  'push-up': ExerciseMediaInfo(
    title: 'Push-Up',
    gifUrl: '$_kCdnBase/pectorals/push-up.gif',
    thumbUrl: '$_kCdnBase/pectorals/push-up.thumb.webp',
    primaryMuscle: 'Chest',
    secondaryMuscles: ['Triceps', 'Core'],
    equipment: 'Bodyweight',
    category: 'Chest',
  ),
  'cable chest fly': ExerciseMediaInfo(
    title: 'Cable Chest Fly',
    gifUrl: '$_kCdnBase/pectorals/cable-middle-fly.gif',
    thumbUrl: '$_kCdnBase/pectorals/cable-middle-fly.thumb.webp',
    primaryMuscle: 'Pectorals',
    secondaryMuscles: ['Front Delts'],
    equipment: 'Cable',
    category: 'Chest',
  ),
  'barbell back squat': ExerciseMediaInfo(
    title: 'Barbell Back Squat',
    gifUrl: '$_kCdnBase/glutes/barbell-full-squat.gif',
    thumbUrl: '$_kCdnBase/glutes/barbell-full-squat.thumb.webp',
    primaryMuscle: 'Quadriceps',
    secondaryMuscles: ['Glutes', 'Hamstrings', 'Lower Back'],
    equipment: 'Barbell',
    category: 'Legs',
  ),
  'goblet squat': ExerciseMediaInfo(
    title: 'Goblet Squat',
    gifUrl: '$_kCdnBase/glutes/kettlebell-goblet-squat.gif',
    thumbUrl: '$_kCdnBase/glutes/kettlebell-goblet-squat.thumb.webp',
    primaryMuscle: 'Quadriceps',
    secondaryMuscles: ['Glutes', 'Core'],
    equipment: 'Kettlebell',
    category: 'Legs',
  ),
  'romanian deadlift': ExerciseMediaInfo(
    title: 'Romanian Deadlift',
    gifUrl: '$_kCdnBase/glutes/barbell-romanian-deadlift.gif',
    thumbUrl: '$_kCdnBase/glutes/barbell-romanian-deadlift.thumb.webp',
    primaryMuscle: 'Hamstrings',
    secondaryMuscles: ['Glutes', 'Lower Back'],
    equipment: 'Barbell',
    category: 'Legs',
  ),
  'conventional deadlift': ExerciseMediaInfo(
    title: 'Conventional Deadlift',
    gifUrl: '$_kCdnBase/glutes/barbell-deadlift.gif',
    thumbUrl: '$_kCdnBase/glutes/barbell-deadlift.thumb.webp',
    primaryMuscle: 'Glutes',
    secondaryMuscles: ['Hamstrings', 'Lower Back', 'Lats'],
    equipment: 'Barbell',
    category: 'Back',
  ),
  'walking lunge': ExerciseMediaInfo(
    title: 'Walking Lunge',
    gifUrl: '$_kCdnBase/glutes/walking-lunge.gif',
    thumbUrl: '$_kCdnBase/glutes/walking-lunge.thumb.webp',
    primaryMuscle: 'Quadriceps',
    secondaryMuscles: ['Glutes', 'Hamstrings'],
    equipment: 'Bodyweight',
    category: 'Legs',
  ),
  'leg press': ExerciseMediaInfo(
    title: 'Leg Press',
    gifUrl: '$_kCdnBase/glutes/sled-45-leg-press.gif',
    thumbUrl: '$_kCdnBase/glutes/sled-45-leg-press.thumb.webp',
    primaryMuscle: 'Quadriceps',
    secondaryMuscles: ['Glutes', 'Hamstrings'],
    equipment: 'Machine',
    category: 'Legs',
  ),
  'standing calf raise': ExerciseMediaInfo(
    title: 'Standing Calf Raise',
    gifUrl: '$_kCdnBase/calves/barbell-standing-calf-raise.gif',
    thumbUrl: '$_kCdnBase/calves/barbell-standing-calf-raise.thumb.webp',
    primaryMuscle: 'Calves',
    secondaryMuscles: ['Ankles'],
    equipment: 'Barbell',
    category: 'Legs',
  ),
  'pull-up': ExerciseMediaInfo(
    title: 'Pull-Up',
    gifUrl: '$_kCdnBase/lats/pull-up.gif',
    thumbUrl: '$_kCdnBase/lats/pull-up.thumb.webp',
    primaryMuscle: 'Lats',
    secondaryMuscles: ['Biceps', 'Rhomboids'],
    equipment: 'Pull-up Bar',
    category: 'Back',
  ),
  'lat pulldown': ExerciseMediaInfo(
    title: 'Lat Pulldown',
    gifUrl: '$_kCdnBase/lats/cable-lat-pulldown-full-range-of-motion.gif',
    thumbUrl: '$_kCdnBase/lats/cable-lat-pulldown-full-range-of-motion.thumb.webp',
    primaryMuscle: 'Lats',
    secondaryMuscles: ['Biceps', 'Upper Back'],
    equipment: 'Cable',
    category: 'Back',
  ),
  'bent-over barbell row': ExerciseMediaInfo(
    title: 'Bent-Over Barbell Row',
    gifUrl: '$_kCdnBase/upper-back/barbell-bent-over-row.gif',
    thumbUrl: '$_kCdnBase/upper-back/barbell-bent-over-row.thumb.webp',
    primaryMuscle: 'Upper Back',
    secondaryMuscles: ['Lats', 'Biceps', 'Lower Back'],
    equipment: 'Barbell',
    category: 'Back',
  ),
  'seated cable row': ExerciseMediaInfo(
    title: 'Seated Cable Row',
    gifUrl: '$_kCdnBase/upper-back/cable-low-seated-row.gif',
    thumbUrl: '$_kCdnBase/upper-back/cable-low-seated-row.thumb.webp',
    primaryMuscle: 'Rhomboids',
    secondaryMuscles: ['Lats', 'Biceps'],
    equipment: 'Cable',
    category: 'Back',
  ),
  'one-arm dumbbell row': ExerciseMediaInfo(
    title: 'One-Arm Dumbbell Row',
    gifUrl: '$_kCdnBase/upper-back/dumbbell-one-arm-bent-over-row.gif',
    thumbUrl: '$_kCdnBase/upper-back/dumbbell-one-arm-bent-over-row.thumb.webp',
    primaryMuscle: 'Lats',
    secondaryMuscles: ['Upper Back', 'Biceps'],
    equipment: 'Dumbbell',
    category: 'Back',
  ),
  'overhead press': ExerciseMediaInfo(
    title: 'Overhead Press',
    gifUrl: '$_kCdnBase/delts/barbell-seated-overhead-press.gif',
    thumbUrl: '$_kCdnBase/delts/barbell-seated-overhead-press.thumb.webp',
    primaryMuscle: 'Shoulders',
    secondaryMuscles: ['Triceps', 'Upper Chest'],
    equipment: 'Barbell',
    category: 'Shoulders',
  ),
  'dumbbell lateral raise': ExerciseMediaInfo(
    title: 'Dumbbell Lateral Raise',
    gifUrl: '$_kCdnBase/delts/dumbbell-lateral-raise.gif',
    thumbUrl: '$_kCdnBase/delts/dumbbell-lateral-raise.thumb.webp',
    primaryMuscle: 'Lateral Deltoids',
    secondaryMuscles: ['Traps'],
    equipment: 'Dumbbells',
    category: 'Shoulders',
  ),
  'face pull': ExerciseMediaInfo(
    title: 'Face Pull',
    gifUrl: '$_kCdnBase/delts/cable-standing-rear-delt-row-with-rope.gif',
    thumbUrl: '$_kCdnBase/delts/cable-standing-rear-delt-row-with-rope.thumb.webp',
    primaryMuscle: 'Rear Deltoids',
    secondaryMuscles: ['Rotator Cuff', 'Upper Back'],
    equipment: 'Cable',
    category: 'Shoulders',
  ),
  'barbell biceps curl': ExerciseMediaInfo(
    title: 'Barbell Biceps Curl',
    gifUrl: '$_kCdnBase/biceps/barbell-standing-wide-grip-biceps-curl.gif',
    thumbUrl: '$_kCdnBase/biceps/barbell-standing-wide-grip-biceps-curl.thumb.webp',
    primaryMuscle: 'Biceps',
    secondaryMuscles: ['Forearms'],
    equipment: 'Barbell',
    category: 'Arms',
  ),
  'incline dumbbell biceps curl': ExerciseMediaInfo(
    title: 'Incline Dumbbell Biceps Curl',
    gifUrl: '$_kCdnBase/biceps/barbell-standing-wide-grip-biceps-curl.gif',
    thumbUrl: '$_kCdnBase/biceps/barbell-standing-wide-grip-biceps-curl.thumb.webp',
    primaryMuscle: 'Biceps',
    secondaryMuscles: ['Forearms'],
    equipment: 'Dumbbells',
    category: 'Arms',
  ),
  'hammer curl': ExerciseMediaInfo(
    title: 'Hammer Curl',
    gifUrl: '$_kCdnBase/biceps/cable-hammer-curl-with-rope.gif',
    thumbUrl: '$_kCdnBase/biceps/cable-hammer-curl-with-rope.thumb.webp',
    primaryMuscle: 'Brachialis',
    secondaryMuscles: ['Biceps', 'Forearms'],
    equipment: 'Cable',
    category: 'Arms',
  ),
  'triceps rope pushdown': ExerciseMediaInfo(
    title: 'Triceps Rope Pushdown',
    gifUrl: '$_kCdnBase/triceps/cable-triceps-pushdown-v-bar.gif',
    thumbUrl: '$_kCdnBase/triceps/cable-triceps-pushdown-v-bar.thumb.webp',
    primaryMuscle: 'Triceps',
    secondaryMuscles: ['Forearms'],
    equipment: 'Cable',
    category: 'Arms',
  ),
  'bench dip': ExerciseMediaInfo(
    title: 'Bench Dip',
    gifUrl: '$_kCdnBase/triceps/bench-dip-knees-bent.gif',
    thumbUrl: '$_kCdnBase/triceps/bench-dip-knees-bent.thumb.webp',
    primaryMuscle: 'Triceps',
    secondaryMuscles: ['Front Delts', 'Chest'],
    equipment: 'Bodyweight',
    category: 'Arms',
  ),
  'plank': ExerciseMediaInfo(
    title: 'Plank',
    gifUrl: '$_kCdnBase/abs/weighted-front-plank.gif',
    thumbUrl: '$_kCdnBase/abs/weighted-front-plank.thumb.webp',
    primaryMuscle: 'Core',
    secondaryMuscles: ['Glutes', 'Shoulders'],
    equipment: 'Bodyweight',
    category: 'Core',
  ),
  'dead bug': ExerciseMediaInfo(
    title: 'Dead Bug',
    gifUrl: '$_kCdnBase/abs/dead-bug.gif',
    thumbUrl: '$_kCdnBase/abs/dead-bug.thumb.webp',
    primaryMuscle: 'Core',
    secondaryMuscles: ['Hip Flexors'],
    equipment: 'Bodyweight',
    category: 'Core',
  ),
  'hanging leg raise': ExerciseMediaInfo(
    title: 'Hanging Leg Raise',
    gifUrl: '$_kCdnBase/abs/assisted-hanging-knee-raise.gif',
    thumbUrl: '$_kCdnBase/abs/assisted-hanging-knee-raise.thumb.webp',
    primaryMuscle: 'Lower Abs',
    secondaryMuscles: ['Hip Flexors', 'Grip'],
    equipment: 'Pull-up Bar',
    category: 'Core',
  ),
  'russian twist': ExerciseMediaInfo(
    title: 'Russian Twist',
    gifUrl: '$_kCdnBase/abs/russian-twist.gif',
    thumbUrl: '$_kCdnBase/abs/russian-twist.thumb.webp',
    primaryMuscle: 'Obliques',
    secondaryMuscles: ['Core'],
    equipment: 'Bodyweight',
    category: 'Core',
  ),
  'hip thrust': ExerciseMediaInfo(
    title: 'Hip Thrust',
    gifUrl: '$_kCdnBase/glutes/barbell-glute-bridge-two-legs-on-bench-male.gif',
    thumbUrl: '$_kCdnBase/glutes/barbell-glute-bridge-two-legs-on-bench-male.thumb.webp',
    primaryMuscle: 'Glutes',
    secondaryMuscles: ['Hamstrings'],
    equipment: 'Barbell',
    category: 'Legs',
  ),
  'kettlebell swing': ExerciseMediaInfo(
    title: 'Kettlebell Swing',
    gifUrl: '$_kCdnBase/glutes/kettlebell-swing.gif',
    thumbUrl: '$_kCdnBase/glutes/kettlebell-swing.thumb.webp',
    primaryMuscle: 'Glutes',
    secondaryMuscles: ['Hamstrings', 'Lower Back', 'Core'],
    equipment: 'Kettlebell',
    category: 'Full Body',
  ),
  'burpee': ExerciseMediaInfo(
    title: 'Burpee',
    gifUrl: '$_kCdnBase/cardio/burpee.gif',
    thumbUrl: '$_kCdnBase/cardio/burpee.thumb.webp',
    primaryMuscle: 'Full Body',
    secondaryMuscles: ['Cardiovascular System'],
    equipment: 'Bodyweight',
    category: 'Cardio',
  ),
  'treadmill run': ExerciseMediaInfo(
    title: 'Treadmill Run',
    gifUrl: '$_kCdnBase/cardio/run-equipment.gif',
    thumbUrl: '$_kCdnBase/cardio/run-equipment.thumb.webp',
    primaryMuscle: 'Cardio',
    secondaryMuscles: ['Legs'],
    equipment: 'Machine',
    category: 'Cardio',
  ),
  'rowing machine': ExerciseMediaInfo(
    title: 'Rowing Machine',
    gifUrl: '$_kCdnBase/upper-back/cable-low-seated-row.gif',
    thumbUrl: '$_kCdnBase/upper-back/cable-low-seated-row.thumb.webp',
    primaryMuscle: 'Cardio & Back',
    secondaryMuscles: ['Legs', 'Arms'],
    equipment: 'Machine',
    category: 'Cardio',
  ),
  'stationary bike': ExerciseMediaInfo(
    title: 'Stationary Bike',
    gifUrl: '$_kCdnBase/cardio/stationary-bike-run-v-3.gif',
    thumbUrl: '$_kCdnBase/cardio/stationary-bike-run-v-3.thumb.webp',
    primaryMuscle: 'Quadriceps',
    secondaryMuscles: ['Calves', 'Cardio'],
    equipment: 'Machine',
    category: 'Cardio',
  ),
  'dumbbell bench press': ExerciseMediaInfo(
    title: 'Dumbbell Bench Press',
    gifUrl: '$_kCdnBase/pectorals/dumbbell-bench-press.gif',
    thumbUrl: '$_kCdnBase/pectorals/dumbbell-bench-press.thumb.webp',
    primaryMuscle: 'Mid Chest',
    secondaryMuscles: ['Triceps', 'Front Delts'],
    equipment: 'Dumbbells',
    category: 'Chest',
  ),
  'world\'s greatest stretch': ExerciseMediaInfo(
    title: 'World\'s Greatest Stretch',
    gifUrl: '$_kCdnBase/glutes/exercise-ball-hip-flexor-stretch.gif',
    thumbUrl: '$_kCdnBase/glutes/exercise-ball-hip-flexor-stretch.thumb.webp',
    primaryMuscle: 'Hip Flexors',
    secondaryMuscles: ['Hamstrings', 'Thoracic Spine', 'Glutes'],
    equipment: 'Bodyweight',
    category: 'Mobility',
  ),
  'cat-cow': ExerciseMediaInfo(
    title: 'Cat-Cow',
    gifUrl: '$_kCdnBase/spine/spine-stretch.gif',
    thumbUrl: '$_kCdnBase/spine/spine-stretch.thumb.webp',
    primaryMuscle: 'Spine & Lower Back',
    secondaryMuscles: ['Core', 'Neck'],
    equipment: 'Bodyweight',
    category: 'Mobility',
  ),
};

/// Alias resolution map
const Map<String, String> _kAliases = {
  // Chest
  'bench press': 'barbell bench press',
  'flat bench press': 'barbell bench press',
  'flat barbell bench press': 'barbell bench press',
  'barbell bench press': 'barbell bench press',
  'dumbbell bench press': 'dumbbell bench press',
  'flat dumbbell press': 'dumbbell bench press',
  'incline dumbbell press': 'incline dumbbell press',
  'incline bench press': 'incline dumbbell press',
  'dumbbell incline press': 'incline dumbbell press',
  'dumbbell incline bench press': 'incline dumbbell press',
  'incline press': 'incline dumbbell press',
  'push up': 'push-up',
  'push ups': 'push-up',
  'pushup': 'push-up',
  'pushups': 'push-up',
  'standard push-up': 'push-up',
  'cable fly': 'cable chest fly',
  'cable flyes': 'cable chest fly',
  'cable chest fly': 'cable chest fly',
  'chest fly': 'cable chest fly',
  'standing cable fly': 'cable chest fly',

  // Legs
  'squat': 'barbell back squat',
  'squats': 'barbell back squat',
  'back squat': 'barbell back squat',
  'barbell squat': 'barbell back squat',
  'barbell back squat': 'barbell back squat',
  'goblet squat': 'goblet squat',
  'kettlebell goblet squat': 'goblet squat',
  'kettlebell squat': 'goblet squat',
  'deadlift': 'conventional deadlift',
  'deadlifts': 'conventional deadlift',
  'barbell deadlift': 'conventional deadlift',
  'conventional deadlift': 'conventional deadlift',
  'rdl': 'romanian deadlift',
  'romanian deadlift': 'romanian deadlift',
  'barbell rdl': 'romanian deadlift',
  'stiff leg deadlift': 'romanian deadlift',
  'lunge': 'walking lunge',
  'lunges': 'walking lunge',
  'walking lunge': 'walking lunge',
  'walking lunges': 'walking lunge',
  'leg press': 'leg press',
  '45 leg press': 'leg press',
  'machine leg press': 'leg press',
  'calf raise': 'standing calf raise',
  'calf raises': 'standing calf raise',
  'standing calf raise': 'standing calf raise',
  'standing calf raises': 'standing calf raise',
  'hip thrust': 'hip thrust',
  'barbell hip thrust': 'hip thrust',
  'glute bridge': 'hip thrust',

  // Back
  'pull up': 'pull-up',
  'pull ups': 'pull-up',
  'pullup': 'pull-up',
  'pullups': 'pull-up',
  'pull-up': 'pull-up',
  'chin up': 'pull-up',
  'lat pulldown': 'lat pulldown',
  'lat pulldown wide grip': 'lat pulldown',
  'wide grip lat pulldown': 'lat pulldown',
  'cable lat pulldown': 'lat pulldown',
  'bent over row': 'bent-over barbell row',
  'barbell bent-over row': 'bent-over barbell row',
  'barbell bent over row': 'bent-over barbell row',
  'barbell row': 'bent-over barbell row',
  'seated row': 'seated cable row',
  'seated cable row': 'seated cable row',
  'cable row': 'seated cable row',
  'low cable row': 'seated cable row',
  'dumbbell bent-over row': 'one-arm dumbbell row',
  'one arm dumbbell row': 'one-arm dumbbell row',
  'one-arm dumbbell row': 'one-arm dumbbell row',
  'dumbbell row': 'one-arm dumbbell row',
  'single arm dumbbell row': 'one-arm dumbbell row',

  // Shoulders
  'shoulder press': 'overhead press',
  'overhead press': 'overhead press',
  'overhead dumbbell shoulder press': 'overhead press',
  'dumbbell shoulder press': 'overhead press',
  'barbell shoulder press': 'overhead press',
  'military press': 'overhead press',
  'strict press': 'overhead press',
  'lateral raise': 'dumbbell lateral raise',
  'lateral raises': 'dumbbell lateral raise',
  'side lateral raise': 'dumbbell lateral raise',
  'dumbbell lateral raise': 'dumbbell lateral raise',
  'side raise': 'dumbbell lateral raise',
  'face pull': 'face pull',
  'face pulls': 'face pull',
  'rope face pull': 'face pull',
  'cable face pull': 'face pull',

  // Arms
  'bicep curl': 'barbell biceps curl',
  'biceps curl': 'barbell biceps curl',
  'bicep curls': 'barbell biceps curl',
  'biceps curls': 'barbell biceps curl',
  'barbell curl': 'barbell biceps curl',
  'barbell biceps curl': 'barbell biceps curl',
  'incline dumbbell curl': 'incline dumbbell biceps curl',
  'incline dumbbell biceps curl': 'incline dumbbell biceps curl',
  'hammer curl': 'hammer curl',
  'hammer curls': 'hammer curl',
  'dumbbell hammer curl': 'hammer curl',
  'triceps pushdown': 'triceps rope pushdown',
  'tricep pushdown': 'triceps rope pushdown',
  'tricep rope pushdown': 'triceps rope pushdown',
  'triceps rope pushdown': 'triceps rope pushdown',
  'cable triceps pushdown': 'triceps rope pushdown',
  'bench dip': 'bench dip',
  'bench dips': 'bench dip',
  'dips': 'bench dip',
  'tricep dips': 'bench dip',

  // Core
  'plank': 'plank',
  'front plank': 'plank',
  'forearm plank': 'plank',
  'weighted front plank': 'plank',
  'dead bug': 'dead bug',
  'deadbug': 'dead bug',
  'hanging leg raise': 'hanging leg raise',
  'hanging leg raises': 'hanging leg raise',
  'hanging knee raise': 'hanging leg raise',
  'hanging knee raises': 'hanging leg raise',
  'leg raises': 'hanging leg raise',
  'russian twist': 'russian twist',
  'russian twists': 'russian twist',

  // Cardio / Full Body
  'kettlebell swing': 'kettlebell swing',
  'kb swing': 'kettlebell swing',
  'burpee': 'burpee',
  'burpees': 'burpee',
  'treadmill run': 'treadmill run',
  'treadmill': 'treadmill run',
  'running': 'treadmill run',
  'jogging': 'treadmill run',
  'rowing machine': 'rowing machine',
  'rowing': 'rowing machine',
  'stationary bike': 'stationary bike',
  'exercise bike': 'stationary bike',
  'cycling': 'stationary bike',
  'spin bike': 'stationary bike',

  // Mobility
  'worlds greatest stretch': 'world\'s greatest stretch',
  'world greatest stretch': 'world\'s greatest stretch',
  'hip flexor stretch': 'world\'s greatest stretch',
  'cat cow': 'cat-cow',
  'spine stretch': 'cat-cow',
};

String _normalizeText(String s) {
  return s
      .toLowerCase()
      .replaceAll(RegExp(r'[^a-z0-9\s]'), ' ')
      .replaceAll(RegExp(r'\s+'), ' ')
      .trim();
}

ExerciseMediaInfo? findExerciseDemonstration(String? name) {
  if (name == null || name.trim().isEmpty) return null;
  final clean = _normalizeText(name);

  // 1. Direct match on catalog keys
  for (final entry in kExerciseMediaCatalog.entries) {
    if (_normalizeText(entry.key) == clean) {
      return entry.value;
    }
  }

  // 2. Direct match on aliases
  for (final entry in _kAliases.entries) {
    if (_normalizeText(entry.key) == clean) {
      final target = entry.value;
      if (kExerciseMediaCatalog.containsKey(target)) {
        return kExerciseMediaCatalog[target];
      }
    }
  }

  // 3. Substring matching
  for (final entry in kExerciseMediaCatalog.entries) {
    final normKey = _normalizeText(entry.key);
    if (clean.contains(normKey) || normKey.contains(clean)) {
      return entry.value;
    }
  }

  for (final entry in _kAliases.entries) {
    final normKey = _normalizeText(entry.key);
    if (clean.contains(normKey) || normKey.contains(clean)) {
      final target = entry.value;
      if (kExerciseMediaCatalog.containsKey(target)) {
        return kExerciseMediaCatalog[target];
      }
    }
  }

  // 4. Token overlap matching (best fit for variations)
  final cleanTokens = clean.split(' ').where((t) => t.length > 2).toSet();
  ExerciseMediaInfo? best;
  int maxOverlap = 0;

  for (final entry in kExerciseMediaCatalog.entries) {
    final keyTokens = _normalizeText(entry.key).split(' ');
    int count = 0;
    for (final t in keyTokens) {
      if (cleanTokens.contains(t)) count++;
    }
    if (count > maxOverlap) {
      maxOverlap = count;
      best = entry.value;
    }
  }

  if (best != null && maxOverlap >= 1) {
    return best;
  }

  return null;
}

/// Dynamic, responsive exercise demonstration GIF widget with:
/// - Looping GIF playback
/// - Play/Pause controls
/// - WebP thumbnail fallback
/// - Clean SVG/Icon placeholder when unavailable
/// - Form & attribution badges
class ExerciseDemonstrationMedia extends StatefulWidget {
  final String? mediaUrl;
  final String? exerciseName;
  final double? width;
  final double? height;
  final BorderRadius? borderRadius;
  final BoxFit fit;
  final bool autoPlay;
  final bool showControls;
  final bool showBadge;
  final String? badgeText;
  final VoidCallback? onTap;

  const ExerciseDemonstrationMedia({
    super.key,
    this.mediaUrl,
    this.exerciseName,
    this.width,
    this.height,
    this.borderRadius,
    this.fit = BoxFit.cover,
    this.autoPlay = true,
    this.showControls = false,
    this.showBadge = false,
    this.badgeText,
    this.onTap,
  });

  @override
  State<ExerciseDemonstrationMedia> createState() => _ExerciseDemonstrationMediaState();
}

class _ExerciseDemonstrationMediaState extends State<ExerciseDemonstrationMedia> {
  late bool _isPlaying;
  bool _hasError = false;
  bool _attemptedFallback = false;

  @override
  void initState() {
    super.initState();
    _isPlaying = widget.autoPlay;
  }

  @override
  void didUpdateWidget(ExerciseDemonstrationMedia oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.mediaUrl != widget.mediaUrl || oldWidget.exerciseName != widget.exerciseName) {
      _hasError = false;
      _attemptedFallback = false;
    }
  }

  void _showAttributionModal() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(22),
        decoration: BoxDecoration(
          color: context.palette.surface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.verified_rounded, color: AppColors.primary, size: 20),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Open-Source Exercise Demonstrations',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: context.palette.text,
                        ),
                      ),
                      Text(
                        'ExerciseGymGifsDB · jsDelivr CDN Edge Delivery',
                        style: TextStyle(
                          fontSize: 12,
                          color: context.palette.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Text(
              'REPSI provides high-definition, animated exercise demonstrations showing humans performing correct movement patterns and proper biomechanical form. All demonstration media is delivered free, legally licensed under open-source fitness community archives without paid subscriptions.',
              style: TextStyle(
                fontSize: 13,
                height: 1.45,
                color: context.palette.textSecondary,
              ),
            ),
            const SizedBox(height: 18),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(ctx),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Got it', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final info = findExerciseDemonstration(widget.exerciseName);
    final effectiveUrl = (widget.mediaUrl != null && widget.mediaUrl!.isNotEmpty)
        ? widget.mediaUrl!
        : (info?.gifUrl ?? '');
    final thumbUrl = info?.thumbUrl;

    final radius = widget.borderRadius ?? BorderRadius.circular(12);

    Widget content;

    if (_hasError || effectiveUrl.isEmpty) {
      // Clean modern placeholder with retry capability
      content = Container(
        width: widget.width,
        height: widget.height ?? 160,
        decoration: BoxDecoration(
          borderRadius: radius,
          gradient: LinearGradient(
            colors: [
              context.palette.surfaceSecondary,
              context.palette.surface,
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          border: Border.all(color: context.palette.border),
        ),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.fitness_center_rounded,
                color: context.palette.textMuted,
                size: (widget.height != null && widget.height! < 80) ? 20 : 28,
              ),
              if (widget.height != null && widget.height! >= 100) ...[
                const SizedBox(height: 6),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: Text(
                    widget.exerciseName ?? 'Exercise Demo',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: context.palette.textMuted,
                    ),
                    textAlign: TextAlign.center,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                if (_hasError) ...[
                  const SizedBox(height: 4),
                  GestureDetector(
                    onTap: () {
                      setState(() {
                        _hasError = false;
                        _attemptedFallback = true;
                      });
                    },
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.refresh_rounded, size: 13, color: AppColors.primary),
                        const SizedBox(width: 4),
                        Text(
                          'Retry Demo',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: AppColors.primary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ],
          ),
        ),
      );
    } else {
      // Active GIF or WebP thumbnail with automatic fallback
      final activeSrc = (_isPlaying || thumbUrl == null || _attemptedFallback) ? effectiveUrl : thumbUrl;

      content = ClipRRect(
        borderRadius: radius,
        child: Stack(
          fit: StackFit.expand,
          children: [
            Image.network(
              activeSrc,
              fit: widget.fit,
              gaplessPlayback: true,
              loadingBuilder: (context, child, progress) {
                if (progress == null) return child;
                return Container(
                  color: context.palette.surfaceSecondary,
                  child: Center(
                    child: SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary.withValues(alpha: 0.7)),
                      ),
                    ),
                  ),
                );
              },
              errorBuilder: (context, error, stackTrace) {
                WidgetsBinding.instance.addPostFrameCallback((_) {
                  if (mounted) {
                    if (!_attemptedFallback && activeSrc != effectiveUrl && effectiveUrl.isNotEmpty) {
                      setState(() {
                        _attemptedFallback = true;
                      });
                    } else if (!_hasError) {
                      setState(() => _hasError = true);
                    }
                  }
                });
                return const SizedBox.shrink();
              },
            ),

            // Top Badges
            if (widget.showBadge || widget.badgeText != null)
              Positioned(
                top: 8,
                left: 8,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.65),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: Colors.white24, width: 0.8),
                  ),
                  child: Text(
                    widget.badgeText ?? info?.category ?? 'Form Demo',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.4,
                    ),
                  ),
                ),
              ),

            // Controls overlay (Play / Pause & Attribution)
            if (widget.showControls)
              Positioned(
                bottom: 8,
                right: 8,
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    GestureDetector(
                      onTap: () => setState(() => _isPlaying = !_isPlaying),
                      child: Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.7),
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white30, width: 0.8),
                        ),
                        child: Icon(
                          _isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded,
                          color: Colors.white,
                          size: 16,
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),
                    GestureDetector(
                      onTap: _showAttributionModal,
                      child: Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.7),
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white30, width: 0.8),
                        ),
                        child: const Icon(
                          Icons.info_outline_rounded,
                          color: Colors.white,
                          size: 16,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
      );
    }

    if (widget.width != null && widget.height != null) {
      content = SizedBox(
        width: widget.width,
        height: widget.height,
        child: content,
      );
    } else if (widget.height != null) {
      content = SizedBox(
        width: widget.width ?? double.infinity,
        height: widget.height,
        child: content,
      );
    } else if (widget.width != null) {
      content = SizedBox(
        width: widget.width,
        height: (widget.width! < 100) ? widget.width : 160,
        child: content,
      );
    } else {
      content = AspectRatio(
        aspectRatio: 16 / 9,
        child: content,
      );
    }

    if (widget.onTap != null) {
      return GestureDetector(
        onTap: widget.onTap,
        child: content,
      );
    }

    return content;
  }
}
