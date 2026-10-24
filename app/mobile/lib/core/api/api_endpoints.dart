class ApiEndpoints {
  // Auth
  static const String login = '/auth/login';
  static const String googleLogin = '/auth/google';
  static const String register = '/auth/register';
  static const String registerMember = '/auth/register/member';
  static const String me = '/auth/me';
  static const String forgotPassword = '/auth/forgot-password';
  static const String logout = '/auth/logout';
  static const String changePassword = '/auth/me/password';
  static const String deleteAccount = '/auth/me';
  static const String phoneOtpRequest = '/auth/otp/request';
  static const String phoneOtpVerify = '/auth/otp/verify';
  static const String signup = '/auth/signup';
  static const String myAvatar = '/auth/me/avatar';

  // Workspaces
  static const String workspaces = '/workspaces';
  static String workspaceDetail(String id) => '/workspaces/$id';
  static const String completeOnboarding = '/workspaces/onboarding/complete';

  // Dashboard
  static const String dashboardMetrics = '/dashboard/metrics';

  // Members
  static const String members = '/members';
  static String memberDetail(String id) => '/members/$id';
  static String memberDocuments(String id) => '/members/$id/documents';

  // Memberships
  static const String memberships = '/memberships';
  static String membershipDetail(String id) => '/memberships/$id';
  static const String membershipPlans = '/memberships/plans';

  // Attendance
  static const String checkIn = '/attendance/check-in';
  static const String checkOut = '/attendance/check-out';
  static const String attendanceCheckIn = checkIn;
  static const String attendanceCheckOut = checkOut;
  static const String attendanceSummary = '/attendance/summary';
  static const String attendanceCurrentlyInside = '/attendance/currently-inside';
  static const String trialStatus = '/billing/trial-status';
  static const String attendanceScanQr = '/attendance/scan-qr';
  static const String myAttendance = '/attendance/member/me';
  static const String myAttendancePass = '/attendance/member/me/pass';
  static const String myMemberProfile = '/members/me';

  // Health sync
  static const String healthDaily = '/health/daily';

  // Payments & Expenses
  static const String payments = '/payments';
  static const String paymentsSummary = '/payments/summary';
  static const String expenses = '/expenses';

  // Trainers & Classes & Workouts
  static const String trainers = '/trainers';
  static String trainerDetail(String id) => '/trainers/$id';
  static const String classes = '/classes';
  static String classDetail(String id) => '/classes/$id';
  static const String workoutPlans = '/workouts/plans';

  // Notifications
  static const String notifications = '/notifications';
  static String markNotificationRead(String id) => '/notifications/$id/read';
  static const String markAllNotificationsRead = '/notifications/mark-all-read';
  static const String notificationPreferences = '/notifications/preferences';
  static const String registerDevice = '/notifications/devices';

  // AI & Smart Engine
  static const String aiStatus = '/ai/status';
  static const String aiAssistant = '/ai/assistant';
  static const String aiWorkoutQuestions = '/ai/workout/questions';
  static const String aiWorkoutSuggest = '/ai/workout/suggest';
  static const String aiInsights = '/ai/insights';
  static const String aiReminders = '/ai/reminders';

  // Reports
  static const String reportsSummary = '/reports/summary';
  static const String revenueTrends = '/reports/revenue-trends';

  // Global Search
  static const String globalSearch = '/search/global';

  // Website Builder
  static const String website = '/website';

  // Users & Staff
  static const String users = '/users';
}
