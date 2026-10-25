// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get commonCancel => 'Cancel';

  @override
  String get commonRetry => 'Retry';

  @override
  String get commonTryAgain => 'Try again';

  @override
  String get commonContinue => 'Continue';

  @override
  String get commonBack => 'Back';

  @override
  String get commonClose => 'Close';

  @override
  String get commonCopy => 'Copy';

  @override
  String get commonAdd => 'Add';

  @override
  String get commonClear => 'Clear';

  @override
  String get commonView => 'View';

  @override
  String get commonSearch => 'Search';

  @override
  String get commonSearchHint => 'Search…';

  @override
  String get commonAll => 'All';

  @override
  String get commonActive => 'Active';

  @override
  String get commonInactive => 'Inactive';

  @override
  String get commonExpired => 'Expired';

  @override
  String get commonSuspended => 'Suspended';

  @override
  String get commonTotal => 'Total';

  @override
  String get commonToday => 'Today';

  @override
  String get commonThisWeek => 'This week';

  @override
  String get commonThisMonth => 'This month';

  @override
  String get commonDayStreak => 'Day streak';

  @override
  String get commonMember => 'Member';

  @override
  String get commonMembers => 'Members';

  @override
  String get commonTrainer => 'Trainer';

  @override
  String get commonTrainers => 'Trainers';

  @override
  String get commonOwner => 'Owner';

  @override
  String get commonStaff => 'Staff';

  @override
  String get commonUser => 'User';

  @override
  String get commonAttendance => 'Attendance';

  @override
  String get commonPayments => 'Payments';

  @override
  String get commonPayment => 'Payment';

  @override
  String get commonMembership => 'Membership';

  @override
  String get commonNotifications => 'Notifications';

  @override
  String get commonSettings => 'Settings';

  @override
  String get commonProfile => 'Profile';

  @override
  String get commonMore => 'More';

  @override
  String get commonHome => 'Home';

  @override
  String get commonFinance => 'Finance';

  @override
  String get commonFrontDesk => 'Front desk';

  @override
  String get commonSignOut => 'Sign out';

  @override
  String get commonEmail => 'Email';

  @override
  String get commonPassword => 'Password';

  @override
  String get commonMobileNumber => 'Mobile number';

  @override
  String get commonEmailHint => 'name@example.com';

  @override
  String get commonAtLeast8Chars => 'At least 8 characters';

  @override
  String get commonUseAtLeast8Chars => 'Use at least 8 characters';

  @override
  String get commonEnterValidEmail => 'Enter a valid email address';

  @override
  String get commonEnterValidMobile => 'Enter a valid mobile number';

  @override
  String get commonCheckConnection => 'Check your connection and try again.';

  @override
  String get commonSomethingWentWrong =>
      'Something went wrong. Please try again.';

  @override
  String get commonInTheGymNow => 'In the gym now';

  @override
  String get commonNoOneCheckedIn => 'No one is checked in right now.';

  @override
  String get commonCheckIn => 'Check in';

  @override
  String get commonCheckOut => 'Check out';

  @override
  String get commonCash => 'Cash';

  @override
  String get commonCard => 'Card';

  @override
  String get commonNetBanking => 'Net banking';

  @override
  String get commonCheque => 'Cheque';

  @override
  String get commonOther => 'Other';

  @override
  String commonMonths(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count months',
      one: '1 month',
    );
    return '$_temp0';
  }

  @override
  String commonDaysLeft(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count days left',
      one: '1 day left',
    );
    return '$_temp0';
  }

  @override
  String commonErrorWithDetail(String detail) {
    return 'Error: $detail';
  }

  @override
  String get commonLinkCopied => 'Link copied: https://repsi.app';

  @override
  String get commonLanguage => 'Language';

  @override
  String get appTagline => 'Your gym. Your progress.';

  @override
  String get errorTimeout =>
      'Connection timed out. Please check your internet connection.';

  @override
  String get errorNoConnection =>
      'Unable to connect to REPSI. Check your internet connection or server status.';

  @override
  String get errorValidation => 'Validation error occurred.';

  @override
  String get errorGeneric => 'An error occurred';

  @override
  String get errorBadRequest => 'Invalid request parameters.';

  @override
  String get errorInvalidCredentials => 'Invalid email or password.';

  @override
  String get errorSessionExpired =>
      'Your session has expired. Please sign in again.';

  @override
  String get errorForbidden => 'You don\'t have permission to access this gym.';

  @override
  String get errorNotFound => 'Account or gym not found.';

  @override
  String get errorRequestTimeout => 'Request timed out. Please try again.';

  @override
  String get errorConflict => 'Account with these details already exists.';

  @override
  String get errorCheckInputs => 'Please check your inputs and try again.';

  @override
  String get errorTooManyAttempts =>
      'Too many attempts. Please try again later.';

  @override
  String get errorServerUnavailable => 'REPSI is temporarily unavailable.';

  @override
  String get errorUnknown => 'Unable to process request. Please try again.';

  @override
  String get errorLoadAttendance => 'Couldn\'t load attendance';

  @override
  String get authNoSession =>
      'Sign-in did not return a session. Please try again.';

  @override
  String get authSignInFailed =>
      'Couldn\'t sign in. Please check your details.';

  @override
  String get authGoogleNoToken =>
      'Google did not return a sign-in token. Please try again.';

  @override
  String get authGoogleFailed =>
      'Google Sign-In failed. Please try again or use your email and password.';

  @override
  String get authCreateAccountFailed =>
      'We could not create your account. Please try again.';

  @override
  String get authRegistrationFailed => 'Registration failed. Please try again.';

  @override
  String get authDeleteFailed =>
      'Could not delete your account. Please try again.';

  @override
  String get authVerificationIncomplete =>
      'Verification did not complete. Please request a new code.';

  @override
  String get errorLoadDashboard => 'Couldn\'t load dashboard figures';

  @override
  String get healthPermissionDenied =>
      'Permission was not granted. You can allow access in Health Connect settings.';

  @override
  String get healthConnectFailed =>
      'Could not connect to Health Connect. Please try again.';

  @override
  String get healthReadFailed =>
      'Could not read your activity from Health Connect.';

  @override
  String get errorLoadMembers => 'Couldn\'t load members';

  @override
  String get errorLoadNotifications =>
      'Couldn\'t load notifications. Pull to try again.';

  @override
  String get notificationFallbackTitle => 'Notification';

  @override
  String get timeJustNow => 'Just now';

  @override
  String get errorLoadWorkspaces => 'Couldn\'t load your gyms.';

  @override
  String get errorOnboarding => 'Couldn\'t finish setting up';

  @override
  String get qrGymCheckIn => 'Gym check-in';

  @override
  String get navClients => 'Clients';

  @override
  String get navSchedule => 'Schedule';

  @override
  String get navPlans => 'Plans';

  @override
  String get navGyms => 'Gyms';

  @override
  String get navUsers => 'Users';

  @override
  String get navAnalytics => 'Analytics';

  @override
  String get navWorkout => 'Workout';

  @override
  String get navProgress => 'Progress';

  @override
  String get navClasses => 'Classes';

  @override
  String get languageSheetTitle => 'App language';

  @override
  String get languageSheetSubtitle =>
      'Choose the language REPSI uses on this device.';

  @override
  String get signOutConfirmGeneric => 'Sign out of REPSI on this device?';

  @override
  String get switchWorkspace => 'Switch gym';

  @override
  String get avatarTitle => 'Profile photo';

  @override
  String get avatarTakePhoto => 'Take a photo';

  @override
  String get avatarChooseGallery => 'Choose from gallery';

  @override
  String get avatarRemove => 'Remove photo';

  @override
  String get avatarCameraError =>
      'Couldn\'t open the camera. Check REPSI\'s camera permission in Settings.';

  @override
  String get avatarGalleryError =>
      'Couldn\'t open your photos. Check REPSI\'s photo permission in Settings.';

  @override
  String get avatarChange => 'Change profile photo';

  @override
  String get avatarAdd => 'Add profile photo';

  @override
  String codeFieldLabel(int count) {
    return 'Verification code, $count digits';
  }

  @override
  String get errorStateTitle => 'Something went wrong';

  @override
  String get ownerProfileTitle => 'Owner Profile';

  @override
  String get gymOwner => 'Gym Owner';

  @override
  String get gymSettings => 'Gym Settings';

  @override
  String get accountSettings => 'Account Settings';

  @override
  String get statusExpiring => 'Expiring';

  @override
  String get statusFrozen => 'Frozen';

  @override
  String get statusCancelled => 'Cancelled';

  @override
  String get deleteAccountWarning =>
      'This permanently removes your login, profile details and synced activity data. Your gym keeps its own member records (attendance and payments) as required for its accounts. This cannot be undone.';

  @override
  String get ownerSignupExplainer =>
      'Gym businesses are created on the REPSI website, where you choose a plan and set up your branches. Once it is ready, sign in here with the same mobile number.';

  @override
  String resetLinkSent(String email) {
    return 'If $email has a REPSI account, a reset link is on its way. Open it on this phone or a computer to choose a new password.';
  }

  @override
  String otpSentTo(String number) {
    return 'Enter the 6-digit code we sent on WhatsApp to $number.';
  }

  @override
  String verifyEmailSentTo(String email) {
    return 'We have sent a verification link to $email. Please check your inbox.';
  }

  @override
  String get verifyEmailYourAddress => 'your email address';

  @override
  String signupJoining(String slug) {
    return 'Joining: $slug';
  }

  @override
  String get changePassword => 'Change password';

  @override
  String get currentPassword => 'Current password';

  @override
  String get enterCurrentPassword => 'Enter your current password';

  @override
  String get newPassword => 'New password';

  @override
  String get passwordMax72 => 'Use at most 72 characters';

  @override
  String get passwordChooseDifferent => 'Choose a different password';

  @override
  String get commonSaving => 'Saving…';

  @override
  String get commonUpdate => 'Update';

  @override
  String get passwordUpdated =>
      'Password updated. Other devices were signed out.';

  @override
  String get deleteAccountTitle => 'Delete your account?';

  @override
  String get deleteAccountPasswordLabel =>
      'Password (leave empty for Google-only accounts)';

  @override
  String get deleteAccountTypeConfirm => 'Type DELETE to confirm';

  @override
  String get commonDeleting => 'Deleting…';

  @override
  String get deleteAccount => 'Delete account';

  @override
  String get profilePhotoUploadFailed =>
      'Account created, but your photo didn\'t upload. You can add it from your profile.';

  @override
  String get completeProfileTitle => 'Almost there!';

  @override
  String get completeProfileSubtitle =>
      'Your number is verified. Add a few details to finish setting up your account.';

  @override
  String get addProfilePhotoOptional => 'Add a profile photo (optional)';

  @override
  String get tapToChange => 'Tap to change';

  @override
  String get fullName => 'Full name';

  @override
  String get fullNameHint => 'As your gym knows you';

  @override
  String get enterFullName => 'Enter your full name';

  @override
  String get uploadingPhoto => 'Uploading photo…';

  @override
  String get emailSendFailed =>
      'We couldn\'t send the email. Please try again.';

  @override
  String get checkYourEmail => 'Check your email';

  @override
  String get backToSignIn => 'Back to sign in';

  @override
  String get useDifferentEmail => 'Use a different email';

  @override
  String get resetPasswordTitle => 'Reset your password';

  @override
  String get resetPasswordSubtitle =>
      'Enter the email on your account and we\'ll send you a link to set a new password.';

  @override
  String get sendResetLink => 'Send reset link';

  @override
  String get codeSendFailed => 'We couldn\'t send the code. Please try again.';

  @override
  String get accountNotFoundPassword =>
      'We couldn\'t find a REPSI account with those details. Check your email or mobile number, or sign in with a WhatsApp code.';

  @override
  String get accountNotFoundGoogle =>
      'We couldn\'t find a REPSI account linked to this Google account. Sign in with your mobile number instead.';

  @override
  String get accountNotFound => 'Account not found';

  @override
  String get useMobileNumber => 'Use mobile number';

  @override
  String get setUpNewGym => 'Set up a new gym';

  @override
  String get copyRepsiLink => 'Copy repsi.app link';

  @override
  String get setUpNewGymQuestion => 'Setting up a new gym?';

  @override
  String get startOnRepsi => 'Start on repsi.app';

  @override
  String get welcomeBack => 'Welcome back';

  @override
  String get letsGetStarted => 'Let\'s get started';

  @override
  String get loginPasswordSubtitle =>
      'Sign in with the email or mobile number and password on your account.';

  @override
  String get loginOtpSubtitle =>
      'Enter your mobile number and we\'ll send a verification code on WhatsApp.';

  @override
  String get continueWithGoogle => 'Continue with Google';

  @override
  String get useMobileInstead => 'Use mobile number instead';

  @override
  String get signInWithEmailPassword => 'Sign in with email and password';

  @override
  String get enterMobileNumber => 'Enter your mobile number';

  @override
  String get enterValid10Digit => 'Enter a valid 10-digit mobile number';

  @override
  String get sendCodeWhatsApp => 'Send code on WhatsApp';

  @override
  String get emailOrMobile => 'Email or mobile number';

  @override
  String get emailOrMobileRequired => 'Email or mobile number is required';

  @override
  String get passwordRequired => 'Password is required';

  @override
  String get forgotPassword => 'Forgot password?';

  @override
  String get signIn => 'Sign in';

  @override
  String get chooseWorkspace => 'Choose your workspace';

  @override
  String get chooseWorkspaceSubtitle =>
      'Select the organization and workspace you\'d like to access';

  @override
  String get roleOwnerTitle => 'Repsi Fitness — Owner';

  @override
  String get roleOwnerDesc =>
      'Business command center: revenue, members, attendance & ops';

  @override
  String get roleTrainerTitle => 'Repsi Fitness — Trainer';

  @override
  String get roleTrainerDesc =>
      'Coaching workspace: client training, workout & diet builder, chat';

  @override
  String get roleTrainerBadge => 'Active Coach';

  @override
  String get roleMemberTitle => 'Repsi Fitness — Member';

  @override
  String get roleMemberDesc =>
      'Personal fitness companion: streak, workouts, QR check-in & progress';

  @override
  String get roleMemberBadge => 'Gold Member';

  @override
  String get roleAdminTitle => 'Repsi Platform — Admin';

  @override
  String get roleAdminDesc =>
      'Internal administration: gym tenants, accounts & system metrics';

  @override
  String get roleAdminBadge => 'Superadmin';

  @override
  String get signOutFailed => 'Couldn\'t sign out. Please try again.';

  @override
  String get signOutTitle => 'Sign out?';

  @override
  String get signOutConfirmOwner =>
      'Are you sure you want to sign out of your REPSI owner account?';

  @override
  String get signingOut => 'Signing out…';

  @override
  String get createAccountTitle => 'Create your account';

  @override
  String get joinGymTitle => 'Join your gym';

  @override
  String get signupStep1 => 'Step 1 of 2: Member profile';

  @override
  String get signupStep2 => 'Step 2 of 2: Join your gym';

  @override
  String get nameHintExample => 'Priya Sharma';

  @override
  String get fullNameRequired => 'Full name is required';

  @override
  String get emailRequired => 'Email is required';

  @override
  String get continueToGym => 'Continue to Gym';

  @override
  String get gymCode => 'Gym link name';

  @override
  String get gymCodeRequired => 'Gym link name is required';

  @override
  String get phoneOptional => 'Phone number (optional)';

  @override
  String get cityOptional => 'City (optional)';

  @override
  String get cityHint => 'Chennai, Kochi, Delhi…';

  @override
  String get createMemberAccount => 'Create member account';

  @override
  String get verifyEmailTitle => 'Verify your email';

  @override
  String get continueToSetup => 'Continue setup';

  @override
  String get resendEmail => 'Resend email';

  @override
  String get verificationEmailResent => 'Verification email resent!';

  @override
  String get codeVerifyFailed =>
      'We couldn\'t verify the code. Please try again.';

  @override
  String get newCodeSent => 'A new code is on its way to WhatsApp.';

  @override
  String get verifyNumberTitle => 'Verify your number';

  @override
  String get changeNumber => 'Change number';

  @override
  String get didntGetCode => 'Didn\'t get it?';

  @override
  String resendIn(String time) {
    return 'Resend in $time';
  }

  @override
  String get commonSending => 'Sending…';

  @override
  String get resendCode => 'Resend code';

  @override
  String get otpTestServerNotice =>
      'Test server: WhatsApp is not connected, so use the server\'s test code.';

  @override
  String get verify => 'Verify';

  @override
  String get photoUpdateFailed =>
      'Couldn\'t update your photo. Please try again.';

  @override
  String get photoUpdated => 'Profile photo updated';

  @override
  String get photoRemoved => 'Profile photo removed';

  @override
  String get splashSlow => 'Taking longer than usual · Tap to continue';

  @override
  String dashExpiringSoon(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count memberships end in the next 7 days',
      one: '1 membership ends in the next 7 days',
    );
    return '$_temp0';
  }

  @override
  String dashPeakHour(String hour) {
    return 'Peak $hour';
  }

  @override
  String dashGreetingLine(String greeting, String date) {
    return '$greeting · $date';
  }

  @override
  String dashGreetingNameLine(String greeting, String name, String date) {
    return '$greeting, $name · $date';
  }

  @override
  String dashNotificationsUnread(int count) {
    return 'Notifications, $count unread';
  }

  @override
  String dashTrialDaysLeft(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other:
          '$count days left in your free trial. Choose a plan on repsi.app anytime.',
      one: '1 day left in your free trial. Choose a plan on repsi.app anytime.',
    );
    return '$_temp0';
  }

  @override
  String dashRevenueSemantics(String amount, String percent) {
    return 'Revenue this month $amount, up $percent percent versus last month';
  }

  @override
  String dashRevenueSemanticsDown(String amount, String percent) {
    return 'Revenue this month $amount, down $percent percent versus last month';
  }

  @override
  String dashVsLastMonth(String percent) {
    return '$percent% vs last month';
  }

  @override
  String dashCheckinsChartSemantics(int days, String values) {
    return 'Check-ins over the last $days days: $values';
  }

  @override
  String dashCheckinsCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count check-ins',
      one: '1 check-in',
    );
    return '$_temp0';
  }

  @override
  String dashCheckedInCount(int count) {
    return '$count checked in';
  }

  @override
  String dashInSince(String time) {
    return 'in since $time';
  }

  @override
  String dashSeeAll(int count) {
    return 'See all $count';
  }

  @override
  String searchNoResults(String query) {
    return 'No results for \"$query\"';
  }

  @override
  String searchMembersHeader(int count) {
    return 'MEMBERS ($count)';
  }

  @override
  String searchTrainersHeader(int count) {
    return 'TRAINERS ($count)';
  }

  @override
  String searchFeaturesHeader(int count) {
    return 'FEATURES & SHORTCUTS ($count)';
  }

  @override
  String financeMembersCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count members',
      one: '1 member',
    );
    return '$_temp0';
  }

  @override
  String financeDaysOverdue(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count days overdue',
      one: '1 day overdue',
    );
    return '$_temp0';
  }

  @override
  String financeMoreOnWeb(int count) {
    return '+ $count more. Full report on repsi.app';
  }

  @override
  String memberCopied(String value) {
    return 'Copied $value';
  }

  @override
  String memberLastVisit(String when) {
    return 'Last visit $when';
  }

  @override
  String memberPaidAcross(String amount, int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$amount paid across $count payments',
      one: '$amount paid across 1 payment',
    );
    return '$_temp0';
  }

  @override
  String memberInSince(String time) {
    return 'In since $time';
  }

  @override
  String memberHistoryUntil(String label, String date) {
    return '$label · until $date';
  }

  @override
  String memberRenewedOn(String name, String plan) {
    return '$name renewed on $plan. Record the payment when it is collected.';
  }

  @override
  String memberRenewFor(String amount) {
    return 'Renew for $amount';
  }

  @override
  String memberPaymentRecorded(String amount, String name) {
    return '$amount recorded for $name';
  }

  @override
  String memberEnded(String when) {
    return 'ended $when';
  }

  @override
  String memberEnds(String when) {
    return 'ends $when';
  }

  @override
  String timeMinutesAgo(int count) {
    return '${count}m ago';
  }

  @override
  String timeHoursAgo(int count) {
    return '${count}h ago';
  }

  @override
  String timeDaysAgo(int count) {
    return '${count}d ago';
  }

  @override
  String opsCheckedOut(String name) {
    return '$name checked out';
  }

  @override
  String opsCheckedIn(String name) {
    return '$name checked in';
  }

  @override
  String opsInAt(String time, String duration) {
    return 'In at $time · $duration';
  }

  @override
  String opsFollowUp(String date) {
    return 'follow up $date';
  }

  @override
  String opsLeadAdded(String name) {
    return '$name added to leads';
  }

  @override
  String opsQrRotates(String when) {
    return 'Rotates $when';
  }

  @override
  String opsTeamHeader(int count) {
    return 'Staff & Trainers ($count)';
  }

  @override
  String opsYou(String name) {
    return '$name (you)';
  }

  @override
  String workspaceGreeting(String name) {
    return 'Good morning, $name';
  }

  @override
  String workspaceSlug(String slug) {
    return 'Link: $slug';
  }

  @override
  String get yourGym => 'Your gym';

  @override
  String get errorLoadDashboardTitle => 'Couldn\'t load your dashboard';

  @override
  String get needsAttention => 'Needs attention';

  @override
  String get remindToRenew => 'Remind them to renew before access lapses';

  @override
  String get checkIns => 'Check-ins';

  @override
  String get greetingMorning => 'Good morning';

  @override
  String get greetingAfternoon => 'Good afternoon';

  @override
  String get greetingEvening => 'Good evening';

  @override
  String get accountAndSettings => 'Account and settings';

  @override
  String get trialEnded =>
      'Your free trial has ended. Choose a plan on repsi.app to keep using REPSI.';

  @override
  String get revenueThisMonth => 'Revenue this month';

  @override
  String get checkInsToday => 'Check-ins today';

  @override
  String get activeMembers => 'Active members';

  @override
  String get renewalsDue => 'Renewals due';

  @override
  String get addMember => 'Add member';

  @override
  String get noCheckinsThisWeek => 'No check-ins recorded this week yet.';

  @override
  String get errorLoadCheckedIn => 'Couldn\'t load who\'s checked in.';

  @override
  String get memberships => 'Memberships';

  @override
  String get reports => 'Reports';

  @override
  String get searchAttendanceDesc =>
      'Check members in and out, see who is inside';

  @override
  String get searchMembersDesc => 'Profiles, memberships and renewals';

  @override
  String get leads => 'Leads';

  @override
  String get searchLeadsDesc => 'Enquiries, trials and follow-ups';

  @override
  String get searchFinanceDesc => 'Collections, dues and expenses';

  @override
  String get businessInsights => 'Business insights';

  @override
  String get searchInsightsDesc => 'What changed and what to do next';

  @override
  String get insights => 'Insights';

  @override
  String get searchNotificationsDesc => 'Alerts and announcements';

  @override
  String get account => 'Account';

  @override
  String get searchSettingsDesc => 'Profile, branches, plans and appearance';

  @override
  String get searchFailed =>
      'Couldn\'t search members and trainers. Check your connection.';

  @override
  String get searchHint => 'Search members, trainers, features…';

  @override
  String get recent => 'Recent';

  @override
  String get quickAccess => 'Quick access';

  @override
  String get searchUnavailable => 'Search unavailable';

  @override
  String get searchEmptyHint =>
      'Search by member name, phone number or member code, or a screen like Attendance.';

  @override
  String get memberIdLabel => 'Member ID:';

  @override
  String get coach => 'Coach';

  @override
  String get specStrength => 'Strength & Conditioning';

  @override
  String get errorLoadFinance => 'Couldn\'t load finance';

  @override
  String get collectedThisMonth => 'Collected this month';

  @override
  String get expenses => 'Expenses';

  @override
  String get net => 'Net';

  @override
  String get duesToCollect => 'Dues to collect';

  @override
  String get collections => 'Collections';

  @override
  String get last6Months => 'Last 6 months';

  @override
  String get noCollections => 'No collections recorded in the last six months.';

  @override
  String get nothingOutstanding =>
      'Nothing outstanding. Every invoice is paid.';

  @override
  String get dueNow => 'Due now';

  @override
  String get recentExpenses => 'Recent expenses';

  @override
  String get noExpenses => 'No expenses recorded yet.';

  @override
  String get historyJoined => 'Joined';

  @override
  String get historyStarted => 'Membership started';

  @override
  String get historyRenewed => 'Membership renewed';

  @override
  String get historyExpired => 'Membership expired';

  @override
  String get historyFrozen => 'Membership frozen';

  @override
  String get historyResumed => 'Membership resumed';

  @override
  String get historyFreezeCancelled => 'Freeze cancelled';

  @override
  String get historyExtended => 'Membership extended';

  @override
  String get historyCancelled => 'Membership cancelled';

  @override
  String get historyStatusChanged => 'Account status changed';

  @override
  String get historyNoteAdded => 'Note added';

  @override
  String get historyNoteEdited => 'Note edited';

  @override
  String get historyNoteDeleted => 'Note deleted';

  @override
  String get historyProfileUpdated => 'Profile updated';

  @override
  String get plan => 'Plan';

  @override
  String get memberAdded => 'Member added';

  @override
  String get memberAddFailed => 'Couldn\'t add the member. Please try again.';

  @override
  String get addNewMember => 'Add new member';

  @override
  String get fullNameRequiredLabel => 'Full name *';

  @override
  String get nameRequired => 'Name is required';

  @override
  String get emailRequiredLabel => 'Email address *';

  @override
  String get phoneNumber => 'Phone number';

  @override
  String get emergencyContactPhone => 'Emergency contact phone';

  @override
  String get membershipPlan => 'Membership plan';

  @override
  String get saveMember => 'Save member';

  @override
  String get errorLoadMember => 'Couldn\'t load this member';

  @override
  String get renew => 'Renew';

  @override
  String get overview => 'Overview';

  @override
  String get visits => 'Visits';

  @override
  String get history => 'History';

  @override
  String get errorLoadThis => 'Couldn\'t load this section';

  @override
  String get noPlan => 'No plan';

  @override
  String get ended => 'Ended';

  @override
  String get ends => 'Ends';

  @override
  String get memberSince => 'Member since';

  @override
  String get gender => 'Gender';

  @override
  String get emergencyContact => 'Emergency contact';

  @override
  String get errorLoadVisits => 'Couldn\'t load visits.';

  @override
  String get noVisitsYet => 'No visits yet';

  @override
  String get notes => 'Notes';

  @override
  String get errorLoadNotes => 'Couldn\'t load notes.';

  @override
  String get noNotes => 'No notes yet. Add context the front desk should know.';

  @override
  String get noPaymentsForMember => 'No payments recorded for this member yet.';

  @override
  String get noVisitsRecorded => 'No visits recorded yet.';

  @override
  String get noHistory => 'No history yet.';

  @override
  String get system => 'System';

  @override
  String get renewMembership => 'Renew membership';

  @override
  String get recordPayment => 'Record payment';

  @override
  String get amountRupees => 'Amount (₹)';

  @override
  String get enterAmountReceived => 'Enter the amount received';

  @override
  String get noteOptional => 'Note (optional)';

  @override
  String get paymentNoteHint => 'e.g. Quarterly renewal, UPI ref';

  @override
  String get savePayment => 'Save payment';

  @override
  String get addNote => 'Add note';

  @override
  String get noteHint => 'What should staff know?';

  @override
  String get saveNote => 'Save note';

  @override
  String get endingSoon => 'Ending soon';

  @override
  String get searchMembersHint => 'Search name, phone or email';

  @override
  String get noMembersMatch => 'No members match';

  @override
  String get noMembersYet => 'No members yet';

  @override
  String get tryAnotherSearch => 'Try another name, phone number or filter.';

  @override
  String get addFirstMember =>
      'Add your first member to start tracking memberships and visits.';

  @override
  String get branches => 'Branches';

  @override
  String get membershipPlans => 'Membership plans';

  @override
  String get addTrainer => 'Add trainer';

  @override
  String get addTrainerDesc => 'Onboard gym coach or PT';

  @override
  String get app => 'App';

  @override
  String get darkMode => 'Dark mode';

  @override
  String get onTheWeb => 'On the web';

  @override
  String get onTheWebTitle => 'Billing, staff roles, reports and website';

  @override
  String get manageOnWeb => 'Manage these on repsi.app';

  @override
  String get errorLoadBranches => 'Couldn\'t load branches.';

  @override
  String get branch => 'Branch';

  @override
  String get mainBranch => 'Main';

  @override
  String get editBranchesOnWeb => 'Add or edit branches on repsi.app.';

  @override
  String get errorLoadPlans => 'Couldn\'t load plans.';

  @override
  String get noPlansYet => 'No plans yet. Create plans on repsi.app.';

  @override
  String get markAllRead => 'Mark all read';

  @override
  String get unread => 'Unread';

  @override
  String get billing => 'Billing';

  @override
  String get announcements => 'Announcements';

  @override
  String get notificationsUnavailable => 'Notifications unavailable';

  @override
  String get noNotifications => 'No notifications';

  @override
  String get noNotificationsDesc =>
      'You are all caught up! Updates about your gym membership, classes, and payments will appear here.';

  @override
  String get leadNew => '-';

  @override
  String get leadContacted => '-';

  @override
  String get leadVisitBooked => '-';

  @override
  String get leadTrial => '-';

  @override
  String get leadNegotiating => '-';

  @override
  String get leadLost => '-';

  @override
  String get checkInQr => 'Check-in QR';

  @override
  String get team => 'Team';

  @override
  String get errorLoadToday => 'Couldn\'t load today\'s numbers.';

  @override
  String get insideNow => 'Inside now';

  @override
  String get avgStay => 'Avg. stay';

  @override
  String get checkInMember => 'Check in a member';

  @override
  String get searchNameOrPhone => 'Search name or phone';

  @override
  String get typeTwoLetters =>
      'Type at least two letters of a name or phone number.';

  @override
  String get errorLoadLeads => 'Couldn\'t load leads';

  @override
  String get noLeadsYet => 'No leads yet';

  @override
  String get noLeadsInStage => 'No leads in this stage';

  @override
  String get leadsEmptyDesc =>
      'Capture walk-ins and enquiries so nobody slips through.';

  @override
  String get addLead => 'Add lead';

  @override
  String get newLead => 'New lead';

  @override
  String get sourceWalkIn => 'Walk-in';

  @override
  String get sourceInstagram => 'Instagram';

  @override
  String get sourceWebsite => 'Website';

  @override
  String get sourceReferral => 'Referral';

  @override
  String get sourceGoogle => 'Google';

  @override
  String get sourcePhoneCall => 'Phone call';

  @override
  String get name => 'Name';

  @override
  String get enterTheirName => 'Enter their name';

  @override
  String get interestedIn => 'Interested in (optional)';

  @override
  String get interestedInHint => 'e.g. Quarterly plan, PT';

  @override
  String get saveLead => 'Save lead';

  @override
  String get errorLoadQr => 'Couldn\'t load the check-in QR';

  @override
  String get qrDesc =>
      'Members scan this with the REPSI app to check themselves in. Show it at the front desk or print it.';

  @override
  String get qrSemantics => 'Gym check-in QR code';

  @override
  String get refresh => 'Refresh';

  @override
  String get errorLoadTeam => 'Couldn\'t load your team';

  @override
  String get teamDesc =>
      'Add trainers and manage staff roles directly from your phone.';

  @override
  String get chooseGym => 'Choose your gym';

  @override
  String get chooseGymSubtitle =>
      'Select which gym location you would like to view and manage today.';

  @override
  String get noGymsFound => 'No gyms found';

  @override
  String get registerGymOnWeb =>
      'Register your gym on repsi.app to activate your workspace.';

  @override
  String get gymWorkspace => 'Gym';

  @override
  String get openWorkspace => 'Open';

  @override
  String get registerAnotherGym => 'Want to register another gym location?';

  @override
  String get createGymOnDesktop =>
      'Gyms are created on repsi.app from a computer.';

  @override
  String memberExpiredOn(String date) {
    return 'Expired on $date';
  }

  @override
  String memberValidUntil(String date) {
    return 'Valid until $date';
  }

  @override
  String memberCheckedInSince(String time) {
    return 'Checked in since $time';
  }

  @override
  String healthAverageSteps(String steps) {
    return '7-day average: $steps steps';
  }

  @override
  String healthSyncedAt(String time) {
    return 'synced $time';
  }

  @override
  String healthStepsSummary(String total, String average) {
    return '$total total · $average per day';
  }

  @override
  String paymentRefLine(String ref, String method) {
    return 'Ref: $ref · $method';
  }

  @override
  String receiptNumberLine(String number) {
    return 'Receipt #: $number';
  }

  @override
  String receiptDescriptionLine(String text) {
    return 'Description: $text';
  }

  @override
  String receiptAmountLine(String amount) {
    return 'Amount paid: $amount';
  }

  @override
  String receiptModeLine(String mode) {
    return 'Payment mode: $mode';
  }

  @override
  String receiptStatusLine(String status) {
    return 'Status: $status';
  }

  @override
  String qrSince(String time) {
    return 'Since $time';
  }

  @override
  String qrInAt(String time) {
    return 'In at $time';
  }

  @override
  String chatUnread(int count) {
    return '$count unread';
  }

  @override
  String chatNotSent(String error) {
    return 'Not sent: $error';
  }

  @override
  String get chatRead => 'Read';

  @override
  String workoutLogExercise(String name) {
    return 'Log $name';
  }

  @override
  String weightKg(String value) {
    return '$value kg';
  }

  @override
  String exPrimary(String muscle, String category) {
    return 'Primary: $muscle ($category)';
  }

  @override
  String exSecondary(String muscle) {
    return 'Secondary: $muscle';
  }

  @override
  String exSetsCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count sets',
      one: '1 set',
    );
    return '$_temp0';
  }

  @override
  String exRepsCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count reps',
      one: '1 rep',
    );
    return '$_temp0';
  }

  @override
  String exSetsReps(int sets, int reps) {
    return '$sets sets · $reps reps';
  }

  @override
  String exAllCount(int count) {
    return 'All ($count)';
  }

  @override
  String exFavsCount(int count) {
    return 'Favourites ($count)';
  }

  @override
  String exSelectedCount(int count) {
    return 'Selected exercises ($count)';
  }

  @override
  String exBasketCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count exercises selected',
      one: '1 exercise selected',
    );
    return '$_temp0';
  }

  @override
  String exWorkoutSaved(String name) {
    return 'Workout \"$name\" saved to My Workouts!';
  }

  @override
  String exCoachNote(String note) {
    return 'Coach\'s note: \"$note\"';
  }

  @override
  String exRestSeconds(int count) {
    return '${count}s';
  }

  @override
  String get myPass => 'My pass';

  @override
  String get aiCoach => 'AI coach';

  @override
  String get errorLoadMembership => 'Couldn\'t load your membership.';

  @override
  String get noMembershipYet =>
      'No membership yet. Ask your gym to set one up for you.';

  @override
  String get errorLoadYourAttendance => 'Couldn\'t load your attendance.';

  @override
  String get checkInWithQr => 'Check in with QR';

  @override
  String get healthAndroidOnly =>
      'Activity tracking is available on Android phones with Health Connect.';

  @override
  String get healthConnectPitch =>
      'Connect Health Connect to see your steps, distance and active calories from Google Fit and other apps. Only these three totals are read, and you can disconnect and delete them any time.';

  @override
  String get healthConnectNeeded =>
      'Health Connect is needed to read your steps from Google Fit and other fitness apps.';

  @override
  String get healthConnect => 'Connect Health Connect';

  @override
  String get healthUpdate => 'Update Health Connect';

  @override
  String get healthInstall => 'Install Health Connect';

  @override
  String get steps => 'Steps';

  @override
  String get activeKcal => 'Active kcal';

  @override
  String get syncNow => 'Sync now';

  @override
  String get disconnect => 'Disconnect';

  @override
  String get todaysActivity => 'Today\'s activity';

  @override
  String get healthDisconnectTitle => 'Disconnect Health Connect?';

  @override
  String get healthDisconnectBody =>
      'REPSI will stop syncing and delete the activity totals it has stored for you.';

  @override
  String get aiWorkoutCoach => 'AI Workout Coach';

  @override
  String get paymentsAndInvoices => 'Payments & Invoices';

  @override
  String get notificationsAndAlerts => 'Notifications & Alerts';

  @override
  String get membershipAndPayments => 'Membership & Payments';

  @override
  String get membershipDetails => 'Membership details';

  @override
  String get membershipDetailsUnavailable =>
      'Your current plan and renewal options are not available here yet. Contact your gym to confirm your membership.';

  @override
  String get paymentHistoryHeader => 'Payment history & receipts';

  @override
  String get digitalReceipt => 'Payment receipt';

  @override
  String get scanMemberPass => 'Scan member pass';

  @override
  String get scanGymQr => 'Scan gym QR';

  @override
  String get toggleFlashlight => 'Toggle flashlight';

  @override
  String get cameraAccessOff => 'Camera access is off';

  @override
  String get cameraUnavailable => 'Camera unavailable';

  @override
  String get cameraAccessOffDesc =>
      'Allow camera access for REPSI in your phone settings to scan the gym QR, or ask the front desk to check you in.';

  @override
  String get cameraStartFailed =>
      'We couldn\'t start the camera. Ask the front desk to check you in.';

  @override
  String get notRepsiQr =>
      'That is not a REPSI gym QR code. Scan the code shown at your gym entrance.';

  @override
  String get checkedInGreat => 'Checked in. Have a great workout!';

  @override
  String get checkOutTitle => 'Check out?';

  @override
  String get checkOutBody => 'This ends your current gym visit.';

  @override
  String get checkedOutBye => 'Checked out. See you next time!';

  @override
  String get pointCamera =>
      'Point your camera at the QR code at your gym entrance.';

  @override
  String get youAreCheckedIn => 'You are checked in';

  @override
  String get youAreNotCheckedIn => 'You are not checked in';

  @override
  String get noVisitsYetDesc =>
      'No visits yet. Your check-ins will show up here.';

  @override
  String get recentVisits => 'Recent visits';

  @override
  String get memberPassSemantics => 'Your REPSI member pass QR code';

  @override
  String get showFrontDesk => 'Show this to the front desk';

  @override
  String get passRefreshNote =>
      'It refreshes automatically and only works at your gym. Do not share a screenshot.';

  @override
  String get scanMemberPassDesc =>
      'Scan a member\'s pass to check them in or out.';

  @override
  String get activity => 'Activity';

  @override
  String get errorLoadGymVisits => 'Couldn\'t load your gym visits.';

  @override
  String get gymVisits => 'Gym visits';

  @override
  String get avgVisit => 'Avg. visit';

  @override
  String get noVisitsStartStreak =>
      'No visits yet. Check in at your gym to start your streak.';

  @override
  String get inProgress => 'In progress';

  @override
  String get healthStepsAndroidOnly =>
      'Step tracking needs an Android phone with Health Connect.';

  @override
  String get healthConnectFromHome =>
      'Connect Health Connect from the Home tab to see your steps, distance and active calories here.';

  @override
  String get stepsThisWeek => 'Steps this week';

  @override
  String get stepsChartSemantics =>
      'Bar chart of steps for the last seven days';

  @override
  String get messages => 'Messages';

  @override
  String get noConversationsTrainer =>
      'No conversations yet. Open a client and tap Message.';

  @override
  String get noConversationsMember =>
      'Once a trainer is assigned to you, you can message them here.';

  @override
  String get noMessagesYet => 'No messages yet';

  @override
  String get sayHello => 'Say hello to start the conversation.';

  @override
  String get writeMessage => 'Write a message…';

  @override
  String get sendMessage => 'Send message';

  @override
  String get chatReadOnly =>
      'This trainer is no longer assigned, so the conversation is read-only.';

  @override
  String get targetWeight => 'Target weight';

  @override
  String get repsPerSet => 'Reps per set';

  @override
  String get saveSets => 'Save sets';

  @override
  String get todaysWorkout => 'Today\'s workout';

  @override
  String get workoutProgress => 'Workout progress';

  @override
  String get targetSixExercises => 'Target: 6 exercises';

  @override
  String get estDuration => 'Est. 45–50 min';

  @override
  String get logged => 'Logged';

  @override
  String get log => 'Log';

  @override
  String get completeWorkout => 'Complete workout';

  @override
  String get workoutSummary => 'Workout summary';

  @override
  String get workoutComplete => 'Workout complete!';

  @override
  String get workoutRecorded =>
      'Great work! Upper Body A is saved to your fitness profile.';

  @override
  String get streakPlusOne => '+1 workout streak';

  @override
  String get streakFive => 'You\'re on fire! 5 days in a row.';

  @override
  String get activeBurn => 'Active burn';

  @override
  String get duration => 'Duration';

  @override
  String get exercises => 'Exercises';

  @override
  String get totalVolume => 'Total volume';

  @override
  String get newPersonalRecord => 'New personal record!';

  @override
  String get howDidItFeel => 'How did this workout feel?';

  @override
  String get saveAndReturn => 'Save and go back';

  @override
  String get workoutSavedSynced => 'Workout saved.';

  @override
  String get targetMuscles => 'Target muscles';

  @override
  String get sets => 'Sets';

  @override
  String get reps => 'Reps';

  @override
  String get rest => 'Rest';

  @override
  String get whyThisExercise => 'Why this exercise? (Coach\'s note)';

  @override
  String get howToPerform => 'How to do it';

  @override
  String get favourited => 'Saved to favourites';

  @override
  String get favourite => 'Add to favourites';

  @override
  String get inWorkoutPlan => 'In workout plan';

  @override
  String get addToWorkout => 'Add to workout';

  @override
  String get workoutBuilder => 'Workout builder';

  @override
  String get routineName => 'Routine name';

  @override
  String get noExercisesSelected =>
      'No exercises selected.\nTap \"Add to workout\" on any exercise card.';

  @override
  String get saveWorkout => 'Save workout';

  @override
  String get exerciseLibrary => 'Exercise library';

  @override
  String get searchExercises => 'Search exercises (e.g. chest dumbbell)';

  @override
  String get trainerCues => 'Trainer tips';

  @override
  String get noExercisesMatch => 'No exercises match your filters';

  @override
  String get resetFilters => 'Reset filters';

  @override
  String get demo => 'Demo';

  @override
  String get added => 'Added';

  @override
  String get readyToBuild => 'Ready to build your routine';

  @override
  String get buildWorkout => 'Build workout';

  @override
  String trainerDietTitle(String name) {
    return '$name · Diet';
  }

  @override
  String dietEatenToday(String calories, String protein) {
    return 'Eaten today: $calories kcal · $protein g protein';
  }

  @override
  String dietOfTarget(String target) {
    return 'of $target kcal';
  }

  @override
  String dietWater(String amount) {
    return 'Water: $amount ml';
  }

  @override
  String dietWaterOfTarget(String amount, String target) {
    return 'Water: $amount / $target ml';
  }

  @override
  String dietAdherence(
      String followed, String modified, String skipped, String notLogged) {
    return 'Followed $followed · Modified $modified · Skipped $skipped · Not logged $notLogged';
  }

  @override
  String get mealBreakfast => 'Breakfast';

  @override
  String get mealMorningSnack => 'Morning snack';

  @override
  String get mealLunch => 'Lunch';

  @override
  String get mealEveningSnack => 'Evening snack';

  @override
  String get mealDinner => 'Dinner';

  @override
  String get mealPreWorkout => 'Pre-workout';

  @override
  String get mealPostWorkout => 'Post-workout';

  @override
  String trainerSessionStarted(String name) {
    return 'Session started with $name';
  }

  @override
  String trainerSessionStarting(String name) {
    return 'Starting session with $name';
  }

  @override
  String trainerWeightAttendance(String weight, String attendance) {
    return 'Weight: $weight · Attendance: $attendance';
  }

  @override
  String trainerAddedExercise(String name) {
    return 'Added $name to workout';
  }

  @override
  String trainerAssignTo(String name) {
    return 'Assign \"$name\" to:';
  }

  @override
  String trainerAssigned(String workout, String name) {
    return '$workout assigned to $name';
  }

  @override
  String trainerExercisesCount(int count) {
    return 'Exercises ($count)';
  }

  @override
  String trainerSetsRepsWeight(String sets, String reps, String weight) {
    return '$sets sets × $reps reps · $weight';
  }

  @override
  String trainerRest(String value) {
    return 'Rest: $value';
  }

  @override
  String trainerTempo(String value) {
    return 'Tempo: $value';
  }

  @override
  String adminOwnerPlan(String owner, String plan) {
    return 'Owner: $owner · $plan';
  }

  @override
  String comingSoon(String feature) {
    return '$feature is coming soon';
  }

  @override
  String onboardingStep(int current, int total) {
    return 'Step $current of $total';
  }

  @override
  String get onboarding1Lead => 'Manage. Train.';

  @override
  String get onboarding1Accent => 'Grow.';

  @override
  String get onboarding1Body =>
      'One app for your gym: check-ins, memberships, payments and training, for owners, trainers and members.';

  @override
  String get onboarding2Lead => 'Manage';

  @override
  String get onboarding2Accent => 'members';

  @override
  String get onboarding2Tail => 'easily';

  @override
  String get onboarding2Body =>
      'Memberships, attendance and dues for every member, with expiries flagged before they lapse.';

  @override
  String get onboarding3Lead => 'Insights that';

  @override
  String get onboarding3Accent => 'matter';

  @override
  String get onboarding3Body =>
      'Check-ins, renewals and revenue at a glance, so you can act before members drop off.';

  @override
  String get trainerAdded => 'Trainer added';

  @override
  String get trainerAddFailed =>
      'Couldn\'t add the trainer. Please check the details.';

  @override
  String get addNewTrainer => 'Add new trainer';

  @override
  String get trainerNameHint => 'e.g. Arun Kumar';

  @override
  String get trainerNameRequired => 'Trainer name is required';

  @override
  String get mobileRequiredLabel => 'Mobile number *';

  @override
  String get mobileRequired => 'Mobile number is required';

  @override
  String get emailOptional => 'Email address (optional)';

  @override
  String get specialization => 'Specialisation';

  @override
  String get hourlyRateOptional => 'Hourly rate (₹) (optional)';

  @override
  String get bioOptional => 'Bio / experience (optional)';

  @override
  String get bioHint => 'e.g. Certified trainer with 5+ years of experience…';

  @override
  String get saveTrainer => 'Save trainer';

  @override
  String get openFromMyClients =>
      'Open this client from My clients to message them or see their diet.';

  @override
  String get message => 'Message';

  @override
  String get dietPlan => 'Diet plan';

  @override
  String get errorLoadAdherence => 'Couldn\'t load diet adherence.';

  @override
  String get noDietPlan => 'No diet plan assigned.';

  @override
  String get dietAdherenceTitle => 'Diet adherence · last 7 days';

  @override
  String get myClients => 'My clients';

  @override
  String get searchClients => 'Search clients';

  @override
  String get activeMembershipsOnly => 'Active memberships only';

  @override
  String get noClientsAssigned => 'No members are assigned to you yet.';

  @override
  String get noClientsMatch => 'No clients match your search.';

  @override
  String get noDietPlanMember =>
      'Your trainer hasn\'t assigned a diet plan yet.';

  @override
  String get noDietPlanTrainer =>
      'No diet plan assigned. Assign one from the web dashboard.';

  @override
  String get addWater => '+250 ml';

  @override
  String get coachingWorkspace => 'Coaching workspace';

  @override
  String get todaysClients => 'Today\'s clients';

  @override
  String get pendingPlans => 'Pending plans';

  @override
  String get clientChat => 'Client chat';

  @override
  String get todaysSessions => 'Today\'s sessions';

  @override
  String get fullSchedule => 'Full schedule →';

  @override
  String get nextUp => 'Next up';

  @override
  String get startSession => 'Start session';

  @override
  String get myProfile => 'My profile';

  @override
  String get mySchedule => 'My schedule';

  @override
  String get workoutTemplates => 'Workout templates';

  @override
  String get dietTemplates => 'Diet templates';

  @override
  String get start => 'Start';

  @override
  String get upcoming => 'Upcoming';

  @override
  String get assignToClient => 'Assign to client';

  @override
  String get assignNow => 'Assign';

  @override
  String get programTitle => 'Program title';

  @override
  String get addExercise => 'Add exercise';

  @override
  String get saveAsTemplate => 'Save as gym template';

  @override
  String get notOnPlan => 'Not on your plan';

  @override
  String get errorLoadInsights => 'Couldn\'t load insights';

  @override
  String get insightsUpgrade =>
      'Business insights are part of higher REPSI plans. Upgrade on repsi.app to turn them on.';

  @override
  String get summaryByAi => 'Summary by AI';

  @override
  String get summary => 'Summary';

  @override
  String get whatStandsOut => 'What stands out';

  @override
  String get suggestedNextSteps => 'Suggested next steps';

  @override
  String get goalMuscleGain => 'Muscle gain';

  @override
  String get goalFatLoss => 'Fat loss & tone';

  @override
  String get goalStrength => 'Strength';

  @override
  String get goalEndurance => 'Endurance & stamina';

  @override
  String get goalWellness => 'General wellness';

  @override
  String get expBeginner => 'Beginner (< 1 yr)';

  @override
  String get expIntermediate => 'Intermediate (1–3 yrs)';

  @override
  String get expAdvanced => 'Advanced (3+ yrs)';

  @override
  String get equipFullGym => 'Full gym';

  @override
  String get equipDumbbells => 'Dumbbells & bench';

  @override
  String get equipBodyweight => 'Bodyweight at home';

  @override
  String get safetyGuidelines => 'Safety guidelines';

  @override
  String get aiPowered => 'AI powered';

  @override
  String get tailoredRoutine => 'Your personal routine';

  @override
  String get aiCoachIntro =>
      'Answer a few questions to build a progressive plan for your equipment and goals.';

  @override
  String get aiQ1 => '1. What is your main fitness goal?';

  @override
  String get aiQ2 => '2. Training experience';

  @override
  String get aiQ3 => '3. Training days per week';

  @override
  String get aiQ4 => '4. Equipment available';

  @override
  String get generateRoutine => 'Create my plan';

  @override
  String get personalizeAi => 'Personalise';

  @override
  String get noPlanForCriteria => 'No plan is available for these choices.';

  @override
  String get aiTailored => 'Made by AI';

  @override
  String get verifiedSplit => 'Coach-verified plan';

  @override
  String get startThisWorkout => 'Start this workout';

  @override
  String get coachTips => 'Coach tips';

  @override
  String get safetyDisclaimerTitle => 'Safety & medical disclaimer';

  @override
  String get safetyDisclaimerBody =>
      'REPSI AI Workout Coach gives general exercise suggestions based on sports science and automated generation. It does not replace personal medical advice or a fitness consultation. Stop exercising immediately if you feel dizzy, have sharp pain or are short of breath.';

  @override
  String get understood => 'Understood';

  @override
  String get aiPlanUpperLowerTitle => '4-day upper / lower routine';

  @override
  String get aiPlanUpperLowerBody =>
      'A balanced muscle-building routine with progressive overload and enough time for joints to recover.';

  @override
  String get aiPlanFatLossTitle => 'Metabolic conditioning split';

  @override
  String get aiPlanFatLossBody =>
      'Compound lifts with short rests to keep muscle while burning more calories.';

  @override
  String get aiPlanStrengthTitle => 'Compound strength foundation';

  @override
  String get aiPlanStrengthBody =>
      'Heavy multi-joint barbell lifts at RPE 8–9 to build maximum strength.';

  @override
  String get aiDay1 => 'Day 1: Upper body power';

  @override
  String get aiCueBench => 'Drive through your heels and keep a slight arch';

  @override
  String get aiCueRow => 'Keep a neutral spine and pull to your sternum';

  @override
  String get aiDay2 => 'Day 2: Lower body muscle building';

  @override
  String get aiCueSquat => 'Bend at the knees and hips together';

  @override
  String get aiCueRdl => 'Hinge back with soft knees and feel your hamstrings';

  @override
  String get aiDay3 => 'Day 3: Upper body & arms';

  @override
  String get aiDay4 => 'Day 4: Lower body & core';

  @override
  String get aiTipHydrate => 'Drink at least 500 ml of water before training.';

  @override
  String get aiTipWarmup =>
      'Warm up with 5–10 minutes of mobility work and 2 light sets before each compound lift.';

  @override
  String get aiTipProgress =>
      'Try to add weight or reps on your main lifts every 1–2 weeks.';

  @override
  String get aiPersonalisedNotice => 'Personalised by REPSI AI';

  @override
  String get aiDisclaimer =>
      'Always check with your doctor before starting a new exercise routine. Listen to your body and stop if you feel unusual discomfort.';

  @override
  String get aiWorkoutDay => 'Workout day';

  @override
  String get aiPersonalPlan => 'Personal workout plan';

  @override
  String get aiDisclaimerShort =>
      'Always check with your doctor before starting an exercise programme.';

  @override
  String get platformAnalytics => 'Platform analytics';

  @override
  String get platformMrrGrowth => 'Platform MRR growth';

  @override
  String get platformHealth => 'Platform health';

  @override
  String get apiResponseTime => 'API response time (P95)';

  @override
  String get activeGymLicences => 'Active gym licences';

  @override
  String get totalCheckinsToday => 'Total check-ins (today)';

  @override
  String get systemAdmin => 'System Admin';

  @override
  String get platformMetrics => 'Platform-wide metrics';

  @override
  String get totalGyms => 'Total gyms';

  @override
  String get plusThreeThisMonth => '+3 this month';

  @override
  String get activeUsers => 'Active users';

  @override
  String get payingMembers => 'Paying members';

  @override
  String get acrossAllGyms => 'Across all gyms';

  @override
  String get platformRevenue => 'Platform revenue';

  @override
  String get mrrThisMonth => 'MRR this month';

  @override
  String get subscriptions => 'Subscriptions';

  @override
  String get allServicesOk => 'All platform services are running';

  @override
  String get searchGymsHint => 'Search gyms by name or owner…';

  @override
  String get systemSettings => 'System settings';

  @override
  String get securityCompliance => 'Security & compliance';

  @override
  String get apiWebhooks => 'API & webhooks';

  @override
  String get systemAlerts => 'System alerts';

  @override
  String get platformSupport => 'Platform support';

  @override
  String get systemAdminSettings => 'Admin settings';

  @override
  String get superAdministrator => 'Super Administrator';

  @override
  String get searchUsersHint => 'Search users across all gyms…';

  @override
  String get skip => 'Skip';

  @override
  String get getStarted => 'Get started';

  @override
  String get next => 'Next';

  @override
  String get gymPass => 'Gym pass';

  @override
  String get checkedIn => 'Checked in';

  @override
  String get dashboard => 'Dashboard';

  @override
  String get revenue => 'Revenue';

  @override
  String get dailyCheckins => 'Daily check-ins';

  @override
  String get mealSnack => 'Snack';

  @override
  String get mealStatusEaten => 'Eaten';

  @override
  String get mealStatusModified => 'Modified';

  @override
  String get mealStatusSkipped => 'Skipped';

  @override
  String dashTrendPercent(String value) {
    return '$value%';
  }

  @override
  String get myCustomRoutine => 'My routine';

  @override
  String get yourGymLinkPlaceholder => 'your-gym';

  @override
  String memberNoteMeta(String author, String date) {
    return '$author · $date';
  }

  @override
  String get membershipPayment => 'Membership payment';

  @override
  String get languageMenuSubtitle => 'Choose the app language';

  @override
  String get specPersonalTraining => 'Personal Training';

  @override
  String get specHiit => 'HIIT & Functional';

  @override
  String get specCrossfit => 'CrossFit';

  @override
  String get specYoga => 'Yoga & Mobility';

  @override
  String get specRehab => 'Rehabilitation';

  @override
  String get specGeneral => 'General Fitness';

  @override
  String get exCatChest => 'Chest';

  @override
  String get exCatBack => 'Back';

  @override
  String get exCatLegs => 'Legs';

  @override
  String get exCatShoulders => 'Shoulders';

  @override
  String get exCatArms => 'Arms';

  @override
  String get exCatCore => 'Core';

  @override
  String get exCatCardio => 'Cardio';

  @override
  String get exCatFullBody => 'Full Body';

  @override
  String get exEqAll => 'All equipment';

  @override
  String get exEqNone => 'No equipment';

  @override
  String get exEqDumbbells => 'Dumbbells';

  @override
  String get exEqBarbell => 'Barbell';

  @override
  String get exEqCable => 'Cable';

  @override
  String get exEqMachine => 'Machine';

  @override
  String get exEqKettlebell => 'Kettlebell';

  @override
  String get exEqBand => 'Resistance band';

  @override
  String get exEqSmith => 'Smith machine';

  @override
  String get exLvlAll => 'All levels';

  @override
  String get exLvlBeginner => 'Beginner';

  @override
  String get exLvlIntermediate => 'Intermediate';

  @override
  String get exLvlAdvanced => 'Advanced';

  @override
  String get exTypeStrength => 'Strength';

  @override
  String get exTypeHypertrophy => 'Muscle building';

  @override
  String get exTypeEndurance => 'Endurance';

  @override
  String get exMuscleMidChest => 'Mid chest';

  @override
  String get exMuscleUpperChest => 'Upper chest';

  @override
  String get exMuscleFrontDelts => 'Front shoulders';

  @override
  String get exMuscleTriceps => 'Triceps';

  @override
  String get exMuscleBiceps => 'Biceps';

  @override
  String get exMuscleQuads => 'Quadriceps';

  @override
  String get exMuscleHamstrings => 'Hamstrings';

  @override
  String get exMuscleGlutes => 'Glutes';

  @override
  String get exMuscleLowerBack => 'Lower back';

  @override
  String get exMuscleLats => 'Lats';

  @override
  String get exMuscleRearDelts => 'Rear shoulders';

  @override
  String get exMuscleForearms => 'Forearms';

  @override
  String get exMuscleLowerAbs => 'Lower abs';

  @override
  String get exMuscleGrip => 'Grip strength';

  @override
  String get exMuscleUpperBack => 'Upper back & rhomboids';

  @override
  String get exMuscleTraps => 'Traps';

  @override
  String get exMuscleObliques => 'Obliques';

  @override
  String get exMuscleHipFlexors => 'Hip flexors';

  @override
  String get exStepBench1 =>
      'Lie flat on the bench with your eyes directly under the bar.';

  @override
  String get exStepBench2 =>
      'Grip the barbell slightly wider than shoulder-width.';

  @override
  String get exStepBench3 =>
      'Unrack the weight and brace your core, pinching your shoulder blades together.';

  @override
  String get exStepBench4 =>
      'Lower the bar under control toward your lower sternum.';

  @override
  String get exStepBench5 => 'Press explosively back up to full lockout.';

  @override
  String get exNoteBench =>
      'Drive your feet firmly into the ground and keep your back neutral.';

  @override
  String get exStepIncline1 =>
      'Set an adjustable bench to a 30 to 45 degree incline.';

  @override
  String get exStepIncline2 =>
      'Kick the dumbbells up to shoulder level as you sit back.';

  @override
  String get exStepIncline3 =>
      'Press both dumbbells straight up, squeezing your upper chest at the top.';

  @override
  String get exStepIncline4 =>
      'Lower under control until your upper arms are parallel to the floor.';

  @override
  String get exNoteIncline =>
      'Keep your elbows tucked at about 45 degrees to protect your shoulders.';

  @override
  String get exStepSquat1 => 'Rest the barbell across your upper back.';

  @override
  String get exStepSquat2 =>
      'Stand with feet shoulder-width apart, toes pointing slightly out.';

  @override
  String get exStepSquat3 =>
      'Bend at the hips and knees together to sit down into the squat.';

  @override
  String get exStepSquat4 =>
      'Go down until your thighs are parallel to the ground or lower.';

  @override
  String get exStepSquat5 => 'Drive through your mid-foot to stand back up.';

  @override
  String get exNoteSquat =>
      'Add 5 kg to your top set this week if the depth feels comfortable.';

  @override
  String get exStepLat1 =>
      'Hold the wide bar with an overhand grip, wider than shoulder-width.';

  @override
  String get exStepLat2 =>
      'Sit upright with the thigh pads pressing firmly on your knees.';

  @override
  String get exStepLat3 =>
      'Lean back slightly (about 10–15 degrees) and pull the bar down to your upper chest.';

  @override
  String get exStepLat4 =>
      'Squeeze your lats at the bottom, then return under control.';

  @override
  String get exStepOhp1 => 'Sit upright on a bench with back support.';

  @override
  String get exStepOhp2 =>
      'Hold the dumbbells at shoulder height, palms facing forward.';

  @override
  String get exStepOhp3 =>
      'Press the dumbbells straight overhead until your arms are extended.';

  @override
  String get exStepOhp4 => 'Lower under control back to shoulder level.';

  @override
  String get exNoteOhp =>
      'Don\'t arch your lower back away from the bench pad.';

  @override
  String get exStepCurl1 => 'Sit back on an incline bench set to 45 degrees.';

  @override
  String get exStepCurl2 =>
      'Let the dumbbells hang straight down at your sides, palms forward.';

  @override
  String get exStepCurl3 =>
      'Curl the weights up while keeping your upper arms still.';

  @override
  String get exStepCurl4 => 'Pause at the top, then lower over 3 seconds.';

  @override
  String get exStepLegRaise1 =>
      'Hang from a pull-up bar with an overhand grip.';

  @override
  String get exStepLegRaise2 =>
      'Keep your legs straight or slightly bent at the knees.';

  @override
  String get exStepLegRaise3 =>
      'Raise your legs to waist height using your abs, without swinging.';

  @override
  String get exStepLegRaise4 => 'Lower back down slowly.';

  @override
  String get exStepRow1 =>
      'Hinge forward at the hips with a flat back and soft knees.';

  @override
  String get exStepRow2 =>
      'Let the dumbbells hang straight down below your shoulders.';

  @override
  String get exStepRow3 =>
      'Row the dumbbells toward your hips, driving your elbows up.';

  @override
  String get exStepRow4 => 'Squeeze your shoulder blades together at the top.';

  @override
  String get exNoteRow =>
      'Pull with your elbows, not your biceps, to work your lats.';

  @override
  String get gymMachinesTitle => 'Gym Machines & Equipment';

  @override
  String get machineStatusAvailable => 'Available';

  @override
  String get machineStatusInUse => 'In use';

  @override
  String get machineStatusMaintenance => 'Maintenance';

  @override
  String get machineStatusUnavailable => 'Unavailable';

  @override
  String machineCategoryPrefix(String category, String targets) {
    return 'Category: $category · Targets: $targets';
  }

  @override
  String get premiumPlan => 'Premium plan';

  @override
  String get membershipStartDate => 'Start date';

  @override
  String get membershipExpires => 'Expires';

  @override
  String get paymentHistory => 'Payment history';

  @override
  String get myProgress => 'My progress';

  @override
  String get tabWeight => 'Weight';

  @override
  String get tabMeasurements => 'Measurements';

  @override
  String get tabAttendance => 'Attendance';

  @override
  String get tabPRs => 'PRs';

  @override
  String get bmiTitle => 'BMI';

  @override
  String calculatedHeight(String height) {
    return 'Calculated ($height cm)';
  }

  @override
  String get bmiHealthNote =>
      'BMI is an epidemiological estimate based on height & weight. Strength and body composition are your primary health indicators.';

  @override
  String get logMetricsButton => 'Log weight & body metrics';

  @override
  String startedWeightSubtitle(String weight, String date) {
    return 'From $weight kg (Started $date)';
  }

  @override
  String get weightProgressTitle => 'Weight progress';

  @override
  String get measureChest => 'Chest';

  @override
  String get measureWaist => 'Waist';

  @override
  String get measureArms => 'Arms';

  @override
  String get measureThighs => 'Thighs';

  @override
  String get benchPressExercise => 'Bench press';

  @override
  String get squatExercise => 'Squat';

  @override
  String get deadliftExercise => 'Deadlift';

  @override
  String get outdoorRunningGps => 'Outdoor Running GPS';

  @override
  String get runDistance => 'Distance';

  @override
  String get runKilometers => 'Kilometers';

  @override
  String get runTime => 'Time';

  @override
  String get runPace => 'Pace';

  @override
  String get runCalories => 'Calories';

  @override
  String get liveGpsMap => 'Live GPS route map view';

  @override
  String get recentRunHistory => 'Recent run history';

  @override
  String get morningRun => 'Morning run';

  @override
  String runPacePerKm(String pace) {
    return '$pace /km';
  }

  @override
  String runHistorySummary(String time, String pace) {
    return 'Time: $time · Avg pace: $pace /km';
  }

  @override
  String get timeYesterday => 'Yesterday';

  @override
  String get pauseRun => 'Pause run';

  @override
  String get startRun => 'Start run';

  @override
  String get workoutPlanTitle => 'Workout plan';

  @override
  String exercisesCount(int count) {
    return 'Exercises ($count)';
  }

  @override
  String exercisesDuration(int count, int duration) {
    return '$count exercises · $duration min';
  }

  @override
  String adminUptime(String percent) {
    return '$percent% uptime';
  }

  @override
  String adminMom(String percent) {
    return '$percent% MoM';
  }

  @override
  String adminTrialingCount(int count) {
    return '$count trialing';
  }

  @override
  String adminFullAccess(String email) {
    return '$email · Full access';
  }

  @override
  String get compoundHypertrophy => 'Compound · Hypertrophy';

  @override
  String get commonSave => 'Save';

  @override
  String get commonSaved => 'Saved';

  @override
  String get startWorkout => 'Start workout';

  @override
  String get languageBeta => 'Beta';

  @override
  String get languageBetaNote =>
      'Languages marked Beta are new translations and may contain mistakes. English is always complete.';

  @override
  String get appearance => 'Appearance';

  @override
  String get themeSystem => 'Use phone setting';

  @override
  String get themeLight => 'Light';

  @override
  String get themeDark => 'Dark';

  @override
  String get commonDone => 'Done';

  @override
  String get letsTrain => 'Let\'s train';

  @override
  String get viewAll => 'View all';

  @override
  String get tomorrow => 'Tomorrow';

  @override
  String get yesterday => 'Yesterday';

  @override
  String get thisWeek => 'This week';

  @override
  String get decline => 'Decline';

  @override
  String get pause => 'Pause';

  @override
  String get resume => 'Resume';

  @override
  String get past => 'Past';

  @override
  String get errorLoadPlan => 'Couldn\'t load your workout plan.';

  @override
  String get errorLoadTrainer => 'Couldn\'t load your trainer details.';

  @override
  String get errorOpenChat => 'Couldn\'t open the chat.';

  @override
  String get errorLoadSchedule => 'Couldn\'t load your schedule.';

  @override
  String get errorLoadMessages => 'Couldn\'t load messages.';

  @override
  String unitMinutes(int count) {
    return '$count min';
  }

  @override
  String unitSeconds(int count) {
    return '$count s';
  }

  @override
  String restSeconds(int seconds) {
    return 'Rest $seconds s';
  }

  @override
  String plusSeconds(int seconds) {
    return '+$seconds s';
  }

  @override
  String get goalGeneralFitness => 'Stay fit & healthy';

  @override
  String get goalMobility => 'Mobility & flexibility';

  @override
  String get goalFatLossDesc =>
      'Burn fat and get leaner with strength and conditioning.';

  @override
  String get goalMuscleGainDesc =>
      'Build size with focused hypertrophy training.';

  @override
  String get goalStrengthDesc => 'Lift heavier with low-rep compound lifts.';

  @override
  String get goalEnduranceDesc => 'Boost stamina with cardio and circuits.';

  @override
  String get goalGeneralFitnessDesc =>
      'A balanced mix to feel strong every day.';

  @override
  String get goalMobilityDesc =>
      'Move better, ease stiffness and prevent injury.';

  @override
  String get levelBeginner => 'Beginner';

  @override
  String get levelIntermediate => 'Intermediate';

  @override
  String get levelAdvanced => 'Advanced';

  @override
  String get levelBeginnerDesc =>
      'New to training or coming back after a break.';

  @override
  String get levelIntermediateDesc =>
      'Training regularly for 6 months or more.';

  @override
  String get levelAdvancedDesc => 'Years of consistent, structured training.';

  @override
  String get focusFullBody => 'Full body';

  @override
  String get focusUpperBody => 'Upper body';

  @override
  String get focusLowerBody => 'Lower body';

  @override
  String get focusCore => 'Core & abs';

  @override
  String get focusArms => 'Arms';

  @override
  String get focusBack => 'Back';

  @override
  String get focusChest => 'Chest';

  @override
  String get focusGlutes => 'Glutes';

  @override
  String get focusCardio => 'Cardio';

  @override
  String get focusFlexibility => 'Flexibility';

  @override
  String get dayFullBody => 'Full body';

  @override
  String get dayUpper => 'Upper body';

  @override
  String get dayLower => 'Lower body';

  @override
  String get dayPush => 'Push';

  @override
  String get dayPull => 'Pull';

  @override
  String get dayLegs => 'Legs';

  @override
  String get dayConditioning => 'Conditioning';

  @override
  String get dayCardio => 'Cardio';

  @override
  String get dayMobility => 'Mobility';

  @override
  String dayNumber(int number) {
    return 'Day $number';
  }

  @override
  String goalStepCounter(int current, int total) {
    return 'Step $current of $total';
  }

  @override
  String get goalQuestionTitle => 'What\'s your main goal?';

  @override
  String get goalQuestionSubtitle =>
      'We\'ll build a weekly plan around it. You can change it any time.';

  @override
  String get levelQuestionTitle => 'How experienced are you?';

  @override
  String get levelQuestionSubtitle =>
      'This sets the exercises, sets and rest for you.';

  @override
  String get scheduleQuestionTitle => 'How often can you train?';

  @override
  String get scheduleQuestionSubtitle =>
      'Pick what fits your week — consistency beats intensity.';

  @override
  String get daysPerWeekLabel => 'Days per week';

  @override
  String daysPerWeekValue(int count) {
    return '$count days a week';
  }

  @override
  String get sessionLengthLabel => 'Time per session';

  @override
  String get focusQuestionTitle => 'Anything to focus on?';

  @override
  String get focusQuestionSubtitle => 'Optional. Your trainer sees this too.';

  @override
  String get buildMyPlan => 'Build my plan';

  @override
  String get goalSaveFailed => 'Couldn\'t save your goal. Please try again.';

  @override
  String get goalSavedTitle => 'Your plan is ready';

  @override
  String get goalSavedSubtitle => 'Built around your goal and your week.';

  @override
  String get myWorkoutPlan => 'My workout plan';

  @override
  String get editGoal => 'Edit goal';

  @override
  String get yourGoal => 'Your goal';

  @override
  String get noGoalTitle => 'Set your goal first';

  @override
  String get noGoalMessage =>
      'Tell us what you\'re training for and we\'ll suggest a weekly plan.';

  @override
  String get setMyGoal => 'Set my goal';

  @override
  String get setGoalCardTitle => 'What are you training for?';

  @override
  String get setGoalCardBody =>
      'Answer 4 quick questions and get a weekly plan made for you.';

  @override
  String exerciseCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count exercises',
      one: '1 exercise',
    );
    return '$_temp0';
  }

  @override
  String get howToDoIt => 'How to do it';

  @override
  String get myGoalAndPlan => 'My goal & plan';

  @override
  String exerciseOfTotal(int current, int total) {
    return 'Exercise $current of $total';
  }

  @override
  String setOfTotal(int current, int total) {
    return 'Set $current of $total';
  }

  @override
  String nextUpName(String name) {
    return 'Next: $name';
  }

  @override
  String get restTime => 'Rest';

  @override
  String get repsLabel => 'reps';

  @override
  String get holdOrMove => 'keep going';

  @override
  String get startSet => 'Start';

  @override
  String get setDone => 'Set done';

  @override
  String get skipRest => 'Skip rest';

  @override
  String get endWorkoutTitle => 'End this workout?';

  @override
  String get endWorkoutBody => 'Your progress in this session won\'t be kept.';

  @override
  String get keepGoing => 'Keep going';

  @override
  String get endWorkout => 'End workout';

  @override
  String get workoutCompleteTitle => 'Workout complete!';

  @override
  String workoutCompleteSubtitle(String focus) {
    return 'Great $focus session. Rest well and come back stronger.';
  }

  @override
  String get statDuration => 'Duration';

  @override
  String get statExercises => 'Exercises';

  @override
  String get statSets => 'Sets';

  @override
  String get myTrainer => 'My trainer';

  @override
  String get yourTrainer => 'Your trainer';

  @override
  String get messageTrainer => 'Message trainer';

  @override
  String get getATrainer => 'Get a personal trainer';

  @override
  String get getATrainerHint => 'Ask your gym to assign a trainer to you.';

  @override
  String get noTrainerTitle => 'Train with a coach';

  @override
  String get noTrainerMessage =>
      'Request a trainer or personal training. Your gym owner will review it and assign someone.';

  @override
  String get trainerPerkPlan => 'A plan tuned to your goal';

  @override
  String get trainerPerkChat => 'Chat directly in the app';

  @override
  String get trainerPerkProgress => 'Form checks and progress reviews';

  @override
  String get requestATrainer => 'Request a trainer';

  @override
  String get requestPersonalTraining => 'Request personal training';

  @override
  String get requestPersonalTrainingHint =>
      'One-on-one sessions, arranged by your gym.';

  @override
  String get requestKindTrainer => 'Trainer';

  @override
  String get requestKindPt => 'Personal training';

  @override
  String get requestSheetTitle => 'Ask for a trainer';

  @override
  String get requestSheetSubtitle =>
      'Your gym owner gets this request and assigns a trainer.';

  @override
  String get preferredTrainerOptional => 'Preferred trainer (optional)';

  @override
  String get anyTrainer => 'Any trainer';

  @override
  String get anyTrainerHint => 'Let the gym pick the best match';

  @override
  String get trainerFull => 'Fully booked';

  @override
  String get requestMessageHint =>
      'Anything the gym should know? Timings, injuries…';

  @override
  String get sendRequest => 'Send request';

  @override
  String get requestSent => 'Request sent to your gym';

  @override
  String get requestPendingTitle => 'Request pending';

  @override
  String get requestPendingShort => 'Waiting for your gym to assign a trainer.';

  @override
  String get requestPendingBody =>
      'Your gym will review it soon. You\'ll get a notification when a trainer is assigned.';

  @override
  String get cancelRequest => 'Cancel request';

  @override
  String get cancelRequestTitle => 'Cancel this request?';

  @override
  String get cancelRequestBody => 'You can send a new request any time.';

  @override
  String get requestHistory => 'Past requests';

  @override
  String get requestApproved => 'Approved';

  @override
  String get requestDeclined => 'Declined';

  @override
  String get requestCancelled => 'Cancelled';

  @override
  String get requestStatusPending => 'Pending';

  @override
  String preferredTrainerValue(String name) {
    return 'Preferred: $name';
  }

  @override
  String assignedTrainerValue(String name) {
    return 'Assigned to $name';
  }

  @override
  String get chatIntro =>
      'Ask about your plan, form or diet. Your trainer replies here.';

  @override
  String get trainerRequests => 'Trainer requests';

  @override
  String get trainerRequestsDesc => 'Members asking for a trainer or PT';

  @override
  String get requestTabPending => 'Pending';

  @override
  String get requestTabAll => 'All';

  @override
  String get noPendingRequests => 'No pending requests';

  @override
  String get noRequests => 'No requests yet';

  @override
  String get noRequestsMessage =>
      'When members ask for a trainer or personal training from the app, it shows up here.';

  @override
  String get assignTrainer => 'Assign trainer';

  @override
  String get chooseTrainer => 'Choose a trainer';

  @override
  String get memberPreferred => 'Member\'s choice';

  @override
  String get noActiveTrainers => 'No active trainers. Add one first.';

  @override
  String get declineRequestTitle => 'Decline request';

  @override
  String get declineReasonHint => 'Reason for the member (optional)';

  @override
  String get requestApprovedToast =>
      'Trainer assigned. The member has been notified.';

  @override
  String get requestDeclinedToast => 'Request declined.';

  @override
  String get clientNoGoal => 'This member hasn\'t set a goal in the app yet.';

  @override
  String get sessionsToday => 'Sessions today';

  @override
  String get activeClients => 'Active clients';

  @override
  String get unreadMessages => 'Unread messages';

  @override
  String get noSessionsToday => 'No sessions booked for today.';

  @override
  String get noUpcomingSessions => 'No upcoming sessions';

  @override
  String get noPastSessions => 'No past sessions';

  @override
  String get sessionsBookedHint =>
      'Sessions booked by your gym or members appear here.';

  @override
  String get myClasses => 'My classes';

  @override
  String get sessionScheduled => 'Scheduled';

  @override
  String get sessionCompleted => 'Completed';

  @override
  String get sessionCancelled => 'Cancelled';

  @override
  String get sessionNoShow => 'No-show';

  @override
  String get navChat => 'Chat';

  @override
  String get approve => 'Approve';

  @override
  String get saveChanges => 'Save changes';

  @override
  String get myShiftAttendance => 'My shift attendance';

  @override
  String get markMemberAttendance => 'Mark member attendance';

  @override
  String get checkInShift => 'Start shift';

  @override
  String get checkOutShift => 'End shift';

  @override
  String get offShift => 'You\'re not on shift';

  @override
  String onShiftSince(String time) {
    return 'On shift since $time';
  }

  @override
  String get onShiftNow => 'On shift';

  @override
  String get daysWorked => 'Days worked';

  @override
  String get shiftHistory => 'Shift history';

  @override
  String get noShiftsYet => 'No shifts recorded yet.';

  @override
  String get corrected => 'corrected';

  @override
  String get requestCorrection => 'Request correction';

  @override
  String get correctionReasonHint =>
      'What happened? (e.g. forgot to check out)';

  @override
  String get checkInTime => 'Check-in';

  @override
  String get checkOutTime => 'Check-out';

  @override
  String correctionsPending(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count correction requests waiting for review',
      one: '1 correction request waiting for review',
    );
    return '$_temp0';
  }

  @override
  String get correctionRequests => 'Correction requests';

  @override
  String get staffAttendance => 'Staff attendance';

  @override
  String get staffAttendanceDesc => 'Trainer shifts, hours and corrections';

  @override
  String get staffAttendanceHint =>
      'Trainers\' shift check-ins appear here. Member visits are counted separately.';

  @override
  String get last30Days => 'Last 30 days';

  @override
  String shiftCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count shifts',
      one: '1 shift',
    );
    return '$_temp0';
  }

  @override
  String daysCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count days',
      one: '1 day',
    );
    return '$_temp0';
  }

  @override
  String get staffAndPermissions => 'Staff & permissions';

  @override
  String get staffAndPermissionsDesc => 'Choose what each trainer can do';

  @override
  String get permissionsIntro =>
      'Turn individual permissions on or off. Trainers only see members assigned to them unless \'View member profiles\' is on.';

  @override
  String get permissionPresets => 'Quick presets';

  @override
  String get permissionsSaved => 'Permissions updated';

  @override
  String get permissionsAuditNote =>
      'Every change is recorded in the audit log with who made it and when.';

  @override
  String get roleDefault => 'Included with this role';

  @override
  String get permGroupMembers => 'Members';

  @override
  String get permGroupAttendance => 'Attendance';

  @override
  String get permGroupTraining => 'Training & diet';

  @override
  String get permGroupCommunication => 'Communication';

  @override
  String get permGroupSchedule => 'Sessions & classes';

  @override
  String get permGroupAdmin => 'Administration';
}
