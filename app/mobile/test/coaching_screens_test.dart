import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:mobile/core/api/api_client.dart';
import 'package:mobile/core/providers/storage_provider.dart';
import 'package:mobile/core/storage/secure_storage_service.dart';
import 'package:mobile/features/auth/providers/auth_provider.dart';
import 'package:mobile/features/auth/services/auth_service.dart';
import 'package:mobile/features/member/presentation/views/member_profile_view.dart';
import 'package:mobile/features/more/views/more_view.dart';
import 'package:mobile/features/trainer/views/trainer_more_view.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:mobile/app/theme/app_theme.dart';
import 'package:mobile/core/localization/app_locale.dart';
import 'package:mobile/features/coaching/data/coaching_api.dart';
import 'package:mobile/features/coaching/data/coaching_models.dart';
import 'package:mobile/features/coaching/views/goal_setup_view.dart';
import 'package:mobile/features/coaching/views/my_trainer_view.dart';
import 'package:mobile/features/coaching/views/trainer_requests_view.dart';
import 'package:mobile/features/coaching/views/workout_plan_view.dart';
import 'package:mobile/features/coaching/views/workout_runner_view.dart';
import 'package:mobile/features/member/presentation/views/member_shell_view.dart';
import 'package:mobile/features/nutrition/data/coaching_repository.dart';
import 'package:mobile/features/trainer/data/trainer_schedule.dart';
import 'package:mobile/features/trainer/views/trainer_home_view.dart';
import 'package:mobile/features/trainer/views/trainer_sessions_view.dart';
import 'package:mobile/features/staff/data/staff_api.dart';
import 'package:mobile/features/staff/views/my_shift_view.dart';
import 'package:mobile/features/staff/views/staff_admin_views.dart';
import 'package:mobile/l10n/l10n.dart';
import 'package:mobile/shared/models/user_model.dart';
import 'package:mobile/shared/navigation/repsi_bottom_nav.dart';
import 'package:mobile/shared/widgets/language_selector_sheet.dart';

PlannedExercise _ex(String name, {int? seconds}) => PlannedExercise(
      exerciseId: name,
      name: name,
      category: seconds == null ? 'chest' : 'core',
      sets: 3,
      reps: seconds == null ? '8-12' : null,
      durationSeconds: seconds,
      restSeconds: 60,
      primaryMuscles: const ['upper_chest', 'triceps'],
      equipment: const ['dumbbell'],
      instructions: const ['Set the bench to 30 degrees.', 'Press up and lower slowly with control.'],
      description: 'Upper chest builder.',
    );

final _plan = WorkoutPlanSuggestion(
  goal: FitnessGoal.muscleGain,
  level: FitnessLevel.intermediate,
  daysPerWeek: 3,
  sessionMinutes: 45,
  days: [
    for (final focus in ['push', 'pull', 'conditioning'])
      PlannedDay(index: 1, focus: focus, estimatedMinutes: 45, exercises: [
        _ex('Incline Dumbbell Press with a Very Long Exercise Name'),
        _ex('Plank', seconds: 45),
        _ex('Triceps Rope Pushdown'),
      ]),
  ],
);

const _goal = MemberGoal(
    id: 'g1', goal: FitnessGoal.muscleGain, level: FitnessLevel.beginner, daysPerWeek: 4, sessionMinutes: 45,
    focusAreas: ['chest', 'arms']);

const _trainer = CoachProfile(
    id: 't1', name: 'Karthikeyan Subramaniam', specialization: 'Strength & conditioning', experience: '8 years',
    bio: 'Certified strength coach who loves helping beginners build confidence under the bar.');

final _pending = TrainerRequestItem(
    id: 'r1', memberId: 'm1', memberName: 'Asha Menon Radhakrishnan', kind: 'personal_training', status: 'pending',
    message: 'Evenings after 7 pm work best for me. Recovering from a knee strain.',
    preferredTrainerId: 't1', preferredTrainerName: 'Karthikeyan Subramaniam', createdAt: DateTime(2026, 10, 20),
    memberGoal: _goal);

final _declined = TrainerRequestItem(
    id: 'r0', memberId: 'm1', memberName: 'Asha Menon', kind: 'trainer', status: 'declined',
    resolutionNote: 'Trainers are full this month', createdAt: DateTime(2026, 9, 1));

class _SignedIn extends AuthNotifier {
  _SignedIn(SecureStorageService storage, String role)
      : super(authService: AuthService(apiClient: ApiClient(storage: storage)), storage: storage) {
    state = AuthState(
      status: AuthStatus.authenticated,
      token: 't',
      user: UserModel(
          id: 'u1', email: 'asha.menon.radhakrishnan@example.com', fullName: 'Asha Menon Radhakrishnan',
          isSuperadmin: false, isActive: true, role: role, gymName: 'Iron Paradise Fitness Studio Kochi'),
    );
  }

  @override
  Future<void> initSession() async {}
}

class _Harness extends StatelessWidget {
  final Widget home;
  final AppLanguage lang;
  final bool dark;
  const _Harness({required this.home, required this.lang, required this.dark});

  @override
  Widget build(BuildContext context) => MaterialApp(
        locale: lang.locale,
        supportedLocales: AppLocalizations.supportedLocales,
        localizationsDelegates: const [
          AppLocalizations.delegate,
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        theme: AppTheme.light(),
        darkTheme: AppTheme.dark(),
        themeMode: dark ? ThemeMode.dark : ThemeMode.light,
        home: home,
      );
}

List<Override> _overrides({CoachingOverview? overview}) => [
      coachingOverviewProvider.overrideWith((ref) => Future.value(overview ??
          CoachingOverview(memberId: 'm1', goal: _goal, trainers: const [_trainer], requests: [_pending, _declined],
              hasPendingRequest: true))),
      workoutSuggestionsProvider.overrideWith((ref) => Future.value(_plan)),
      availableTrainersProvider.overrideWith((ref) => Future.value(const [_trainer])),
      trainerRequestsProvider.overrideWith((ref, status) => Future.value(
          TrainerRequestPage(items: status == null ? [_pending, _declined] : [_pending], pendingCount: 1))),
      trainerScheduleProvider.overrideWith((ref) => Future.value(TrainerSchedule(sessions: [
            TrainerSessionItem(
                id: 's1', title: 'Personal training — lower body', scheduledAt: DateTime.now(), durationMinutes: 60,
                status: 'SCHEDULED', clientName: 'Asha Menon Radhakrishnan'),
          ], classes: const [
            TrainerClassItem(id: 'c1', title: 'Morning HIIT', schedule: 'Mon/Wed/Fri 07:00', durationMinutes: 45, room: 'Studio 1'),
          ]))),
      trainerClientsProvider.overrideWith((ref) => Future.value([
            {'client_id': 'm1', 'name': 'Asha Menon', 'membership_status': 'ACTIVE'},
            {'client_id': 'm2', 'name': '', 'membership_status': 'ACTIVE'},
          ])),
      myPermissionsProvider.overrideWith((ref) => Future.value({'attendance.record'})),
      myShiftProvider.overrideWith((ref) => Future.value(MyShift(
            active: ShiftRecord(id: 'a1', checkIn: DateTime.now().subtract(const Duration(hours: 2)), minutes: 120, corrected: false),
            weekMinutes: 1235, monthMinutes: 9870, monthDays: 21,
            records: [ShiftRecord(id: 'a0', checkIn: DateTime(2026, 10, 20, 6), checkOut: DateTime(2026, 10, 20, 14, 5), minutes: 485, corrected: true)],
            requests: const [CorrectionRequest(id: 'q1', attendanceId: 'a0', reason: 'Forgot to check out', status: 'pending')]))),
      staffReportProvider.overrideWith((ref) => Future.value(const [
            StaffHours(trainerId: 't1', name: 'Karthikeyan Subramaniam', shifts: 22, days: 21, minutes: 9870, checkedIn: true, pendingCorrections: 1),
          ])),
      pendingCorrectionsProvider.overrideWith((ref) => Future.value([
            CorrectionRequest(id: 'q1', attendanceId: 'a0', trainerName: 'Karthikeyan Subramaniam', reason: 'Forgot to check out after the evening batch',
                status: 'pending', requestedOut: DateTime(2026, 10, 20, 21, 30)),
          ])),
      teamProvider.overrideWith((ref) => Future.value(const [
            TeamMember(id: 'w1', name: 'Asha Owner', email: 'o@x.in', role: 'OWNER', isSelf: true, isActive: true),
            TeamMember(id: 'w2', name: 'Karthikeyan Subramaniam', email: 't@x.in', role: 'TRAINER', isSelf: false, isActive: true),
          ])),
      conversationsProvider.overrideWith((ref) => Future.value(const [
            Conversation(id: 'c1', memberId: 'm1', memberName: 'Asha Menon', trainerName: 'Karthik', lastMessage: 'See you at 7!',
                unread: 2, canSend: true),
          ])),
    ];

Future<void> _settle(WidgetTester tester) async {
  // Some widgets pulse forever, so pump a fixed time instead of pumpAndSettle.
  for (var i = 0; i < 12; i++) {
    await tester.pump(const Duration(milliseconds: 150));
  }
}

void main() {
  GoogleFonts.config.allowRuntimeFetching = false;

  group('coaching screens fit small phones in every language and theme', () {
    for (final lang in [AppLanguage.en, AppLanguage.ta, AppLanguage.ml]) {
      for (final size in const [Size(320, 640), Size(412, 915)]) {
        for (final dark in [false, true]) {
          final label = '${lang.code} ${size.width.toInt()}px ${dark ? 'dark' : 'light'}';

          testWidgets('$label: member screens do not overflow', (tester) async {
            tester.view.physicalSize = size;
            tester.view.devicePixelRatio = 1;
            addTearDown(tester.view.reset);
            final l = lookupAppLocalizations(lang.locale);

            Future<void> show(Widget screen, {CoachingOverview? overview}) async {
              await tester.pumpWidget(ProviderScope(
                  overrides: _overrides(overview: overview), child: _Harness(home: screen, lang: lang, dark: dark)));
              await _settle(tester);
              expect(tester.takeException(), isNull, reason: '${screen.runtimeType} $label');
            }

            await show(const WorkoutPlanView());
            await tester.ensureVisible(find.text(l.dayPull).first);
            await tester.tap(find.text(l.dayPull).first);
            await _settle(tester);
            expect(tester.takeException(), isNull, reason: 'plan day switch $label');

            await show(const MyTrainerView());
            await show(const MyTrainerView(),
                overview: const CoachingOverview(memberId: 'm1', trainers: [], requests: [], hasPendingRequest: false));

            // Goal wizard: every step.
            await show(const GoalSetupView(openPlanWhenDone: false));
            await tester.ensureVisible(find.text(l.goalStrength).first);
            await tester.tap(find.text(l.goalStrength).first);
            await _settle(tester);
            for (var step = 0; step < 3; step++) {
              await tester.tap(find.text(l.commonContinue));
              await _settle(tester);
              expect(tester.takeException(), isNull, reason: 'goal step ${step + 2} $label');
            }
            expect(find.text(l.buildMyPlan), findsOneWidget);

            // Runner: work phase, then rest after a set.
            await show(WorkoutRunnerView(day: _plan.days.first));
            await tester.tap(find.text(l.setDone));
            await _settle(tester);
            expect(find.text(l.skipRest), findsOneWidget);
            expect(tester.takeException(), isNull, reason: 'runner rest $label');
            await tester.pumpWidget(const SizedBox());
          });

          testWidgets('$label: owner and trainer screens do not overflow', (tester) async {
            tester.view.physicalSize = size;
            tester.view.devicePixelRatio = 1;
            addTearDown(tester.view.reset);
            for (final screen in const [TrainerRequestsView(), TrainerHomeView(), TrainerSessionsView(), MyShiftView(), StaffAttendanceView(), StaffPermissionsView()]) {
              await tester.pumpWidget(
                  ProviderScope(overrides: _overrides(), child: _Harness(home: screen, lang: lang, dark: dark)));
              await _settle(tester);
              expect(tester.takeException(), isNull, reason: '${screen.runtimeType} $label');
            }
            await tester.pumpWidget(const SizedBox());
          });

          testWidgets('$label: More menus for member, trainer and owner do not overflow', (tester) async {
            tester.view.physicalSize = size;
            tester.view.devicePixelRatio = 1;
            addTearDown(tester.view.reset);
            FlutterSecureStorage.setMockInitialValues({});
            final storage = SecureStorageService();
            for (final (role, screen) in const [
              ('USER', MemberProfileView()),
              ('TRAINER', TrainerMoreView()),
              ('OWNER', MoreView()),
            ]) {
              await tester.pumpWidget(ProviderScope(
                overrides: [
                  ..._overrides(),
                  secureStorageServiceProvider.overrideWithValue(storage),
                  authProvider.overrideWith((ref) => _SignedIn(storage, role)),
                ],
                child: _Harness(home: screen, lang: lang, dark: dark),
              ));
              await _settle(tester);
              expect(tester.takeException(), isNull, reason: '$role ${screen.runtimeType} $label');
            }
            await tester.pumpWidget(const SizedBox());
          });

          testWidgets('$label: bottom navigation labels fit', (tester) async {
            tester.view.physicalSize = size;
            tester.view.devicePixelRatio = 1;
            addTearDown(tester.view.reset);
            for (final role in [UserRole.trainer, UserRole.owner, UserRole.user]) {
              await tester.pumpWidget(_Harness(
                lang: lang,
                dark: dark,
                home: Builder(
                  builder: (context) => Scaffold(
                    bottomNavigationBar: RepsiBottomNav(
                      currentIndex: 1,
                      onTap: (_) {},
                      role: role,
                      customItems: role == UserRole.user ? memberNavItems(context) : null,
                    ),
                  ),
                ),
              ));
              await _settle(tester);
              expect(tester.takeException(), isNull, reason: 'nav $role $label');
            }
          });
        }
      }
    }
  });

  testWidgets('every language except English is labelled Beta', (tester) async {
    await tester.pumpWidget(ProviderScope(
      child: _Harness(
        lang: AppLanguage.en,
        dark: false,
        home: Builder(
          builder: (context) => Scaffold(
            body: Center(
              child: TextButton(onPressed: () => LanguageSelectorSheet.show(context), child: const Text('open')),
            ),
          ),
        ),
      ),
    ));
    await tester.tap(find.text('open'));
    await _settle(tester);
    expect(find.byType(BetaBadge), findsNWidgets(AppLanguage.values.length - 1));
    expect(AppLanguage.values.where((l) => l.isBeta).map((l) => l.code), ['ta', 'ml', 'hi']);
    expect(AppLanguage.en.isBeta, isFalse);
  });

  test('goal draft and suggestion payloads match the API', () {
    final draft = GoalDraft(goal: FitnessGoal.fatLoss, level: FitnessLevel.advanced, daysPerWeek: 5, sessionMinutes: 60)
      ..focusAreas.addAll(['core', 'cardio']);
    expect(draft.toJson(), {
      'goal': 'fat_loss',
      'fitness_level': 'advanced',
      'days_per_week': 5,
      'session_minutes': 60,
      'focus_areas': ['core', 'cardio'],
    });

    final plan = WorkoutPlanSuggestion.fromJson({
      'goal': 'strength',
      'fitness_level': 'beginner',
      'days_per_week': 2,
      'session_minutes': 30,
      'days': [
        {
          'index': 1,
          'focus': 'full_body',
          'estimated_minutes': 30,
          'exercises': [
            {'exercise_id': 'e1', 'name': 'Goblet Squat', 'category': 'legs', 'sets': 4, 'reps': '5', 'rest_seconds': 150},
            {'exercise_id': 'e2', 'name': 'Plank', 'category': 'core', 'sets': 4, 'duration_seconds': 30, 'rest_seconds': 150},
          ],
        },
      ],
    });
    expect(plan.goal, FitnessGoal.strength);
    expect(plan.days.single.exercises.last.isTimed, isTrue);
    expect(plan.days.single.exercises.first.reps, '5');

    final overview = CoachingOverview.fromJson({
      'member_id': 'm1',
      'goal': null,
      'trainers': [],
      'requests': [
        {'id': 'r1', 'status': 'pending', 'kind': 'trainer'},
        {'id': 'r0', 'status': 'declined', 'kind': 'trainer'},
      ],
      'has_pending_request': true,
    });
    expect(overview.pendingRequest?.id, 'r1');
    expect(const CoachProfile(id: 'x', name: '  ').initials, '?');
  });
}
