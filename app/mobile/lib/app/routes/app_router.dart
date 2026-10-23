import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/admin/views/admin_shell_view.dart';
import '../../features/ai/views/ai_insights_view.dart';
import '../../features/ai/views/ai_workout_coach_view.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/auth/views/forgot_password_view.dart';
import '../../features/auth/views/login_view.dart';
import '../../features/auth/views/set_new_password_view.dart';
import '../../features/auth/views/signup_view.dart';
import '../../features/auth/views/verify_otp_view.dart';
import '../../features/dashboard/views/dashboard_view.dart';
import '../../features/finance/views/owner_finance_view.dart';
import '../../features/member/presentation/views/exercise_library_view.dart';
import '../../features/member/presentation/views/member_documents_view.dart';
import '../../features/member/presentation/views/member_shell_view.dart';
import '../../features/member/presentation/views/qr_attendance_view.dart';
import '../../features/members/views/add_member_view.dart';
import '../../features/members/views/member_detail_view.dart';
import '../../features/members/views/members_list_view.dart';
import '../../features/more/views/more_view.dart';
import '../../features/notifications/views/notification_inbox_view.dart';
import '../../features/onboarding/views/onboarding_view.dart';
import '../../features/operations/views/operations_view.dart';
import '../../features/operations/views/website_builder_mobile_view.dart';
import '../../features/shell/views/app_shell_view.dart';
import '../../features/splash/views/splash_view.dart';
import '../../features/trainer/views/trainer_shell_view.dart';
import '../../features/workspaces/views/workspace_selection_view.dart';
import '../../shared/animations/repsi_page_transition.dart';
import 'route_names.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  // One router for the app's lifetime: rebuilding it on every auth change would reset the
  // navigation stack (e.g. when the profile refreshes in the background).
  final refresh = ValueNotifier<int>(0);
  ref.listen(authProvider, (_, __) => refresh.value++);
  ref.onDispose(refresh.dispose);

  return GoRouter(
    initialLocation: RouteNames.splash,
    refreshListenable: refresh,
    redirect: (context, state) {
      final auth = ref.read(authProvider);
      final location = state.matchedLocation;
      final isAuthRoute =
          location.startsWith('/auth') || location == RouteNames.onboarding;

      // Only the initial session restore parks users on the splash; a sign-in attempt
      // (`loading`) must leave the login form on screen.
      if (auth.status == AuthStatus.initial) {
        return location == RouteNames.splash ? null : RouteNames.splash;
      }

      if (!auth.isAuthenticated) {
        return isAuthRoute || location == RouteNames.splash
            ? null
            : RouteNames.login;
      }

      if (auth.isAuthenticated &&
          (location == RouteNames.login ||
              location == RouteNames.splash ||
              location == RouteNames.selectRole)) {
        return RouteNames.roleDashboard(auth.user?.role);
      }

      // Enforce server-side role authorization
      final role = auth.user?.role.toUpperCase();
      final isAdmin = auth.user?.isSuperadmin == true ||
          role == 'SUPER_ADMIN' ||
          role == 'ADMIN';
      final isTrainer = role == 'TRAINER' || role == 'STAFF';
      final isMember = role == 'USER' || role == 'MEMBER';

      // Protect Super Admin routes
      if (location.startsWith('/admin') && !isAdmin) {
        return RouteNames.roleDashboard(auth.user?.role);
      }

      // If user is member, restrict access to owner-only routes
      if (isMember &&
          (location == RouteNames.ownerDashboard ||
              location == RouteNames.more ||
              location == RouteNames.operations ||
              location == RouteNames.finance)) {
        return RouteNames.userDashboard;
      }

      // If user is trainer, restrict access to owner business/finance routes
      if (isTrainer &&
          (location == RouteNames.ownerDashboard ||
              location == RouteNames.more ||
              location == RouteNames.finance)) {
        return RouteNames.trainerDashboard;
      }

      return null;
    },
    routes: [
      GoRoute(
        path: RouteNames.splash,
        pageBuilder: (context, state) => buildRepsiPageTransition(
          context: context,
          state: state,
          child: const SplashView(),
        ),
      ),
      GoRoute(
        path: RouteNames.onboarding,
        pageBuilder: (context, state) => buildRepsiPageTransition(
          context: context,
          state: state,
          child: const OnboardingView(),
        ),
      ),
      GoRoute(
        path: RouteNames.login,
        pageBuilder: (context, state) => buildRepsiPageTransition(
          context: context,
          state: state,
          child: const LoginView(),
        ),
      ),
      GoRoute(
        path: RouteNames.signup,
        pageBuilder: (context, state) => buildRepsiPageTransition(
          context: context,
          state: state,
          child: const SignupView(),
        ),
      ),
      GoRoute(
        path: RouteNames.forgotPassword,
        pageBuilder: (context, state) => buildRepsiPageTransition(
          context: context,
          state: state,
          child: const ForgotPasswordView(),
        ),
      ),
      GoRoute(
        path: RouteNames.verifyOtp,
        pageBuilder: (context, state) => buildRepsiPageTransition(
          context: context,
          state: state,
          child: VerifyOtpView(email: state.extra as String?),
        ),
      ),
      GoRoute(
        path: RouteNames.setNewPassword,
        pageBuilder: (context, state) => buildRepsiPageTransition(
          context: context,
          state: state,
          child: const SetNewPasswordView(),
        ),
      ),
      GoRoute(
        path: RouteNames.selectWorkspace,
        pageBuilder: (context, state) => buildRepsiPageTransition(
          context: context,
          state: state,
          child: const WorkspaceSelectionView(),
        ),
      ),

      // Direct Role Shell Routes
      GoRoute(
        path: RouteNames.userDashboard,
        pageBuilder: (context, state) => buildRepsiPageTransition(
          context: context,
          state: state,
          child: const MemberShellView(),
        ),
      ),
      GoRoute(
        path: RouteNames.trainerDashboard,
        pageBuilder: (context, state) => buildRepsiPageTransition(
          context: context,
          state: state,
          child: const TrainerShellView(),
        ),
      ),
      GoRoute(
        path: RouteNames.adminDashboard,
        pageBuilder: (context, state) => buildRepsiPageTransition(
          context: context,
          state: state,
          child: const AdminShellView(),
        ),
      ),

      // Check-in shortcut
      GoRoute(
        path: RouteNames.checkIn,
        pageBuilder: (context, state) => buildRepsiPageTransition(
          context: context,
          state: state,
          child: const QrAttendanceView(),
        ),
      ),

      // Add Member shortcut
      GoRoute(
        path: RouteNames.addMember,
        pageBuilder: (context, state) => buildRepsiPageTransition(
          context: context,
          state: state,
          child: const AddMemberView(),
        ),
      ),

      // Exercise Library route
      GoRoute(
        path: RouteNames.exerciseLibrary,
        pageBuilder: (context, state) => buildRepsiPageTransition(
          context: context,
          state: state,
          child: const ExerciseLibraryView(),
        ),
      ),

      // Website Builder route
      GoRoute(
        path: RouteNames.websiteBuilder,
        pageBuilder: (context, state) => buildRepsiPageTransition(
          context: context,
          state: state,
          child: const WebsiteBuilderMobileView(),
        ),
      ),

      // Notifications route
      GoRoute(
        path: RouteNames.notifications,
        pageBuilder: (context, state) => buildRepsiPageTransition(
          context: context,
          state: state,
          child: const NotificationInboxView(),
        ),
      ),

      // AI Coach route
      GoRoute(
        path: RouteNames.aiCoach,
        pageBuilder: (context, state) => buildRepsiPageTransition(
          context: context,
          state: state,
          child: const AiWorkoutCoachView(),
        ),
      ),

      // AI Insights route
      GoRoute(
        path: RouteNames.aiInsights,
        pageBuilder: (context, state) => buildRepsiPageTransition(
          context: context,
          state: state,
          child: const AiInsightsView(),
        ),
      ),

      // Member Documents route
      GoRoute(
        path: RouteNames.memberDocuments,
        pageBuilder: (context, state) => buildRepsiPageTransition(
          context: context,
          state: state,
          child: const MemberDocumentsView(),
        ),
      ),

      // Member Detail route
      GoRoute(
        path: RouteNames.memberDetail,
        pageBuilder: (context, state) {
          final id = state.pathParameters['id'] ?? '';
          return buildRepsiPageTransition(
            context: context,
            state: state,
            child: MemberDetailView(memberId: id),
          );
        },
      ),

      // Owner App Shell Route
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) =>
            AppShellView(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: RouteNames.dashboard,
                builder: (_, __) => const DashboardView(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: RouteNames.members,
                builder: (_, __) => const MembersListView(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: RouteNames.operations,
                builder: (_, __) => const OperationsView(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: RouteNames.finance,
                builder: (_, __) => const OwnerFinanceView(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: RouteNames.more,
                builder: (_, __) => const MoreView(),
              ),
            ],
          ),
        ],
      ),
    ],
  );
});
