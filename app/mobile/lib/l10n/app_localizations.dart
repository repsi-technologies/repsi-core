import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_hi.dart';
import 'app_localizations_ml.dart';
import 'app_localizations_ta.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
      : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
    delegate,
    GlobalMaterialLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
  ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('ta'),
    Locale('ml'),
    Locale('hi')
  ];

  /// No description provided for @commonCancel.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get commonCancel;

  /// No description provided for @commonRetry.
  ///
  /// In en, this message translates to:
  /// **'Retry'**
  String get commonRetry;

  /// No description provided for @commonTryAgain.
  ///
  /// In en, this message translates to:
  /// **'Try again'**
  String get commonTryAgain;

  /// No description provided for @commonContinue.
  ///
  /// In en, this message translates to:
  /// **'Continue'**
  String get commonContinue;

  /// No description provided for @commonBack.
  ///
  /// In en, this message translates to:
  /// **'Back'**
  String get commonBack;

  /// No description provided for @commonClose.
  ///
  /// In en, this message translates to:
  /// **'Close'**
  String get commonClose;

  /// No description provided for @commonCopy.
  ///
  /// In en, this message translates to:
  /// **'Copy'**
  String get commonCopy;

  /// No description provided for @commonAdd.
  ///
  /// In en, this message translates to:
  /// **'Add'**
  String get commonAdd;

  /// No description provided for @commonClear.
  ///
  /// In en, this message translates to:
  /// **'Clear'**
  String get commonClear;

  /// No description provided for @commonView.
  ///
  /// In en, this message translates to:
  /// **'View'**
  String get commonView;

  /// No description provided for @commonSearch.
  ///
  /// In en, this message translates to:
  /// **'Search'**
  String get commonSearch;

  /// No description provided for @commonSearchHint.
  ///
  /// In en, this message translates to:
  /// **'Search…'**
  String get commonSearchHint;

  /// No description provided for @commonAll.
  ///
  /// In en, this message translates to:
  /// **'All'**
  String get commonAll;

  /// No description provided for @commonActive.
  ///
  /// In en, this message translates to:
  /// **'Active'**
  String get commonActive;

  /// No description provided for @commonInactive.
  ///
  /// In en, this message translates to:
  /// **'Inactive'**
  String get commonInactive;

  /// No description provided for @commonExpired.
  ///
  /// In en, this message translates to:
  /// **'Expired'**
  String get commonExpired;

  /// No description provided for @commonSuspended.
  ///
  /// In en, this message translates to:
  /// **'Suspended'**
  String get commonSuspended;

  /// No description provided for @commonTotal.
  ///
  /// In en, this message translates to:
  /// **'Total'**
  String get commonTotal;

  /// No description provided for @commonToday.
  ///
  /// In en, this message translates to:
  /// **'Today'**
  String get commonToday;

  /// No description provided for @commonThisWeek.
  ///
  /// In en, this message translates to:
  /// **'This week'**
  String get commonThisWeek;

  /// No description provided for @commonThisMonth.
  ///
  /// In en, this message translates to:
  /// **'This month'**
  String get commonThisMonth;

  /// No description provided for @commonDayStreak.
  ///
  /// In en, this message translates to:
  /// **'Day streak'**
  String get commonDayStreak;

  /// No description provided for @commonMember.
  ///
  /// In en, this message translates to:
  /// **'Member'**
  String get commonMember;

  /// No description provided for @commonMembers.
  ///
  /// In en, this message translates to:
  /// **'Members'**
  String get commonMembers;

  /// No description provided for @commonTrainer.
  ///
  /// In en, this message translates to:
  /// **'Trainer'**
  String get commonTrainer;

  /// No description provided for @commonTrainers.
  ///
  /// In en, this message translates to:
  /// **'Trainers'**
  String get commonTrainers;

  /// No description provided for @commonOwner.
  ///
  /// In en, this message translates to:
  /// **'Owner'**
  String get commonOwner;

  /// No description provided for @commonStaff.
  ///
  /// In en, this message translates to:
  /// **'Staff'**
  String get commonStaff;

  /// No description provided for @commonUser.
  ///
  /// In en, this message translates to:
  /// **'User'**
  String get commonUser;

  /// No description provided for @commonAttendance.
  ///
  /// In en, this message translates to:
  /// **'Attendance'**
  String get commonAttendance;

  /// No description provided for @commonPayments.
  ///
  /// In en, this message translates to:
  /// **'Payments'**
  String get commonPayments;

  /// No description provided for @commonPayment.
  ///
  /// In en, this message translates to:
  /// **'Payment'**
  String get commonPayment;

  /// No description provided for @commonMembership.
  ///
  /// In en, this message translates to:
  /// **'Membership'**
  String get commonMembership;

  /// No description provided for @commonNotifications.
  ///
  /// In en, this message translates to:
  /// **'Notifications'**
  String get commonNotifications;

  /// No description provided for @commonSettings.
  ///
  /// In en, this message translates to:
  /// **'Settings'**
  String get commonSettings;

  /// No description provided for @commonProfile.
  ///
  /// In en, this message translates to:
  /// **'Profile'**
  String get commonProfile;

  /// No description provided for @commonMore.
  ///
  /// In en, this message translates to:
  /// **'More'**
  String get commonMore;

  /// No description provided for @commonHome.
  ///
  /// In en, this message translates to:
  /// **'Home'**
  String get commonHome;

  /// No description provided for @commonFinance.
  ///
  /// In en, this message translates to:
  /// **'Finance'**
  String get commonFinance;

  /// No description provided for @commonFrontDesk.
  ///
  /// In en, this message translates to:
  /// **'Front desk'**
  String get commonFrontDesk;

  /// No description provided for @commonSignOut.
  ///
  /// In en, this message translates to:
  /// **'Sign out'**
  String get commonSignOut;

  /// No description provided for @commonEmail.
  ///
  /// In en, this message translates to:
  /// **'Email'**
  String get commonEmail;

  /// No description provided for @commonPassword.
  ///
  /// In en, this message translates to:
  /// **'Password'**
  String get commonPassword;

  /// No description provided for @commonMobileNumber.
  ///
  /// In en, this message translates to:
  /// **'Mobile number'**
  String get commonMobileNumber;

  /// No description provided for @commonEmailHint.
  ///
  /// In en, this message translates to:
  /// **'name@example.com'**
  String get commonEmailHint;

  /// No description provided for @commonAtLeast8Chars.
  ///
  /// In en, this message translates to:
  /// **'At least 8 characters'**
  String get commonAtLeast8Chars;

  /// No description provided for @commonUseAtLeast8Chars.
  ///
  /// In en, this message translates to:
  /// **'Use at least 8 characters'**
  String get commonUseAtLeast8Chars;

  /// No description provided for @commonEnterValidEmail.
  ///
  /// In en, this message translates to:
  /// **'Enter a valid email address'**
  String get commonEnterValidEmail;

  /// No description provided for @commonEnterValidMobile.
  ///
  /// In en, this message translates to:
  /// **'Enter a valid mobile number'**
  String get commonEnterValidMobile;

  /// No description provided for @commonCheckConnection.
  ///
  /// In en, this message translates to:
  /// **'Check your connection and try again.'**
  String get commonCheckConnection;

  /// No description provided for @commonSomethingWentWrong.
  ///
  /// In en, this message translates to:
  /// **'Something went wrong. Please try again.'**
  String get commonSomethingWentWrong;

  /// No description provided for @commonInTheGymNow.
  ///
  /// In en, this message translates to:
  /// **'In the gym now'**
  String get commonInTheGymNow;

  /// No description provided for @commonNoOneCheckedIn.
  ///
  /// In en, this message translates to:
  /// **'No one is checked in right now.'**
  String get commonNoOneCheckedIn;

  /// No description provided for @commonCheckIn.
  ///
  /// In en, this message translates to:
  /// **'Check in'**
  String get commonCheckIn;

  /// No description provided for @commonCheckOut.
  ///
  /// In en, this message translates to:
  /// **'Check out'**
  String get commonCheckOut;

  /// No description provided for @commonCash.
  ///
  /// In en, this message translates to:
  /// **'Cash'**
  String get commonCash;

  /// No description provided for @commonCard.
  ///
  /// In en, this message translates to:
  /// **'Card'**
  String get commonCard;

  /// No description provided for @commonNetBanking.
  ///
  /// In en, this message translates to:
  /// **'Net banking'**
  String get commonNetBanking;

  /// No description provided for @commonCheque.
  ///
  /// In en, this message translates to:
  /// **'Cheque'**
  String get commonCheque;

  /// No description provided for @commonOther.
  ///
  /// In en, this message translates to:
  /// **'Other'**
  String get commonOther;

  /// No description provided for @commonMonths.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{1 month} other{{count} months}}'**
  String commonMonths(int count);

  /// No description provided for @commonDaysLeft.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{1 day left} other{{count} days left}}'**
  String commonDaysLeft(int count);

  /// No description provided for @commonErrorWithDetail.
  ///
  /// In en, this message translates to:
  /// **'Error: {detail}'**
  String commonErrorWithDetail(String detail);

  /// No description provided for @commonLinkCopied.
  ///
  /// In en, this message translates to:
  /// **'Link copied: https://repsi.app'**
  String get commonLinkCopied;

  /// No description provided for @commonLanguage.
  ///
  /// In en, this message translates to:
  /// **'Language'**
  String get commonLanguage;

  /// No description provided for @appTagline.
  ///
  /// In en, this message translates to:
  /// **'Your gym. Your progress.'**
  String get appTagline;

  /// No description provided for @errorTimeout.
  ///
  /// In en, this message translates to:
  /// **'Connection timed out. Please check your internet connection.'**
  String get errorTimeout;

  /// No description provided for @errorNoConnection.
  ///
  /// In en, this message translates to:
  /// **'Unable to connect to REPSI. Check your internet connection or server status.'**
  String get errorNoConnection;

  /// No description provided for @errorValidation.
  ///
  /// In en, this message translates to:
  /// **'Validation error occurred.'**
  String get errorValidation;

  /// No description provided for @errorGeneric.
  ///
  /// In en, this message translates to:
  /// **'An error occurred'**
  String get errorGeneric;

  /// No description provided for @errorBadRequest.
  ///
  /// In en, this message translates to:
  /// **'Invalid request parameters.'**
  String get errorBadRequest;

  /// No description provided for @errorInvalidCredentials.
  ///
  /// In en, this message translates to:
  /// **'Invalid email or password.'**
  String get errorInvalidCredentials;

  /// No description provided for @errorSessionExpired.
  ///
  /// In en, this message translates to:
  /// **'Your session has expired. Please sign in again.'**
  String get errorSessionExpired;

  /// No description provided for @errorForbidden.
  ///
  /// In en, this message translates to:
  /// **'You don\'t have permission to access this gym.'**
  String get errorForbidden;

  /// No description provided for @errorNotFound.
  ///
  /// In en, this message translates to:
  /// **'Account or gym not found.'**
  String get errorNotFound;

  /// No description provided for @errorRequestTimeout.
  ///
  /// In en, this message translates to:
  /// **'Request timed out. Please try again.'**
  String get errorRequestTimeout;

  /// No description provided for @errorConflict.
  ///
  /// In en, this message translates to:
  /// **'Account with these details already exists.'**
  String get errorConflict;

  /// No description provided for @errorCheckInputs.
  ///
  /// In en, this message translates to:
  /// **'Please check your inputs and try again.'**
  String get errorCheckInputs;

  /// No description provided for @errorTooManyAttempts.
  ///
  /// In en, this message translates to:
  /// **'Too many attempts. Please try again later.'**
  String get errorTooManyAttempts;

  /// No description provided for @errorServerUnavailable.
  ///
  /// In en, this message translates to:
  /// **'REPSI is temporarily unavailable.'**
  String get errorServerUnavailable;

  /// No description provided for @errorUnknown.
  ///
  /// In en, this message translates to:
  /// **'Unable to process request. Please try again.'**
  String get errorUnknown;

  /// No description provided for @errorLoadAttendance.
  ///
  /// In en, this message translates to:
  /// **'Couldn\'t load attendance'**
  String get errorLoadAttendance;

  /// No description provided for @authNoSession.
  ///
  /// In en, this message translates to:
  /// **'Sign-in did not return a session. Please try again.'**
  String get authNoSession;

  /// No description provided for @authSignInFailed.
  ///
  /// In en, this message translates to:
  /// **'Couldn\'t sign in. Please check your details.'**
  String get authSignInFailed;

  /// No description provided for @authGoogleNoToken.
  ///
  /// In en, this message translates to:
  /// **'Google did not return a sign-in token. Please try again.'**
  String get authGoogleNoToken;

  /// No description provided for @authGoogleFailed.
  ///
  /// In en, this message translates to:
  /// **'Google Sign-In failed. Please try again or use your email and password.'**
  String get authGoogleFailed;

  /// No description provided for @authCreateAccountFailed.
  ///
  /// In en, this message translates to:
  /// **'We could not create your account. Please try again.'**
  String get authCreateAccountFailed;

  /// No description provided for @authRegistrationFailed.
  ///
  /// In en, this message translates to:
  /// **'Registration failed. Please try again.'**
  String get authRegistrationFailed;

  /// No description provided for @authDeleteFailed.
  ///
  /// In en, this message translates to:
  /// **'Could not delete your account. Please try again.'**
  String get authDeleteFailed;

  /// No description provided for @authVerificationIncomplete.
  ///
  /// In en, this message translates to:
  /// **'Verification did not complete. Please request a new code.'**
  String get authVerificationIncomplete;

  /// No description provided for @errorLoadDashboard.
  ///
  /// In en, this message translates to:
  /// **'Couldn\'t load dashboard figures'**
  String get errorLoadDashboard;

  /// No description provided for @healthPermissionDenied.
  ///
  /// In en, this message translates to:
  /// **'Permission was not granted. You can allow access in Health Connect settings.'**
  String get healthPermissionDenied;

  /// No description provided for @healthConnectFailed.
  ///
  /// In en, this message translates to:
  /// **'Could not connect to Health Connect. Please try again.'**
  String get healthConnectFailed;

  /// No description provided for @healthReadFailed.
  ///
  /// In en, this message translates to:
  /// **'Could not read your activity from Health Connect.'**
  String get healthReadFailed;

  /// No description provided for @errorLoadMembers.
  ///
  /// In en, this message translates to:
  /// **'Couldn\'t load members'**
  String get errorLoadMembers;

  /// No description provided for @errorLoadNotifications.
  ///
  /// In en, this message translates to:
  /// **'Couldn\'t load notifications. Pull to try again.'**
  String get errorLoadNotifications;

  /// No description provided for @notificationFallbackTitle.
  ///
  /// In en, this message translates to:
  /// **'Notification'**
  String get notificationFallbackTitle;

  /// No description provided for @timeJustNow.
  ///
  /// In en, this message translates to:
  /// **'Just now'**
  String get timeJustNow;

  /// No description provided for @errorLoadWorkspaces.
  ///
  /// In en, this message translates to:
  /// **'Couldn\'t load your gyms.'**
  String get errorLoadWorkspaces;

  /// No description provided for @errorOnboarding.
  ///
  /// In en, this message translates to:
  /// **'Couldn\'t finish setting up'**
  String get errorOnboarding;

  /// No description provided for @qrGymCheckIn.
  ///
  /// In en, this message translates to:
  /// **'Gym check-in'**
  String get qrGymCheckIn;

  /// No description provided for @navClients.
  ///
  /// In en, this message translates to:
  /// **'Clients'**
  String get navClients;

  /// No description provided for @navSchedule.
  ///
  /// In en, this message translates to:
  /// **'Schedule'**
  String get navSchedule;

  /// No description provided for @navPlans.
  ///
  /// In en, this message translates to:
  /// **'Plans'**
  String get navPlans;

  /// No description provided for @navGyms.
  ///
  /// In en, this message translates to:
  /// **'Gyms'**
  String get navGyms;

  /// No description provided for @navUsers.
  ///
  /// In en, this message translates to:
  /// **'Users'**
  String get navUsers;

  /// No description provided for @navAnalytics.
  ///
  /// In en, this message translates to:
  /// **'Analytics'**
  String get navAnalytics;

  /// No description provided for @navWorkout.
  ///
  /// In en, this message translates to:
  /// **'Workout'**
  String get navWorkout;

  /// No description provided for @navProgress.
  ///
  /// In en, this message translates to:
  /// **'Progress'**
  String get navProgress;

  /// No description provided for @navClasses.
  ///
  /// In en, this message translates to:
  /// **'Classes'**
  String get navClasses;

  /// No description provided for @languageSheetTitle.
  ///
  /// In en, this message translates to:
  /// **'App language'**
  String get languageSheetTitle;

  /// No description provided for @languageSheetSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Choose the language REPSI uses on this device.'**
  String get languageSheetSubtitle;

  /// No description provided for @signOutConfirmGeneric.
  ///
  /// In en, this message translates to:
  /// **'Sign out of REPSI on this device?'**
  String get signOutConfirmGeneric;

  /// No description provided for @switchWorkspace.
  ///
  /// In en, this message translates to:
  /// **'Switch gym'**
  String get switchWorkspace;

  /// No description provided for @avatarTitle.
  ///
  /// In en, this message translates to:
  /// **'Profile photo'**
  String get avatarTitle;

  /// No description provided for @avatarTakePhoto.
  ///
  /// In en, this message translates to:
  /// **'Take a photo'**
  String get avatarTakePhoto;

  /// No description provided for @avatarChooseGallery.
  ///
  /// In en, this message translates to:
  /// **'Choose from gallery'**
  String get avatarChooseGallery;

  /// No description provided for @avatarRemove.
  ///
  /// In en, this message translates to:
  /// **'Remove photo'**
  String get avatarRemove;

  /// No description provided for @avatarCameraError.
  ///
  /// In en, this message translates to:
  /// **'Couldn\'t open the camera. Check REPSI\'s camera permission in Settings.'**
  String get avatarCameraError;

  /// No description provided for @avatarGalleryError.
  ///
  /// In en, this message translates to:
  /// **'Couldn\'t open your photos. Check REPSI\'s photo permission in Settings.'**
  String get avatarGalleryError;

  /// No description provided for @avatarChange.
  ///
  /// In en, this message translates to:
  /// **'Change profile photo'**
  String get avatarChange;

  /// No description provided for @avatarAdd.
  ///
  /// In en, this message translates to:
  /// **'Add profile photo'**
  String get avatarAdd;

  /// No description provided for @codeFieldLabel.
  ///
  /// In en, this message translates to:
  /// **'Verification code, {count} digits'**
  String codeFieldLabel(int count);

  /// No description provided for @errorStateTitle.
  ///
  /// In en, this message translates to:
  /// **'Something went wrong'**
  String get errorStateTitle;

  /// No description provided for @ownerProfileTitle.
  ///
  /// In en, this message translates to:
  /// **'Owner Profile'**
  String get ownerProfileTitle;

  /// No description provided for @gymOwner.
  ///
  /// In en, this message translates to:
  /// **'Gym Owner'**
  String get gymOwner;

  /// No description provided for @gymSettings.
  ///
  /// In en, this message translates to:
  /// **'Gym Settings'**
  String get gymSettings;

  /// No description provided for @accountSettings.
  ///
  /// In en, this message translates to:
  /// **'Account Settings'**
  String get accountSettings;

  /// No description provided for @statusExpiring.
  ///
  /// In en, this message translates to:
  /// **'Expiring'**
  String get statusExpiring;

  /// No description provided for @statusFrozen.
  ///
  /// In en, this message translates to:
  /// **'Frozen'**
  String get statusFrozen;

  /// No description provided for @statusCancelled.
  ///
  /// In en, this message translates to:
  /// **'Cancelled'**
  String get statusCancelled;

  /// No description provided for @deleteAccountWarning.
  ///
  /// In en, this message translates to:
  /// **'This permanently removes your login, profile details and synced activity data. Your gym keeps its own member records (attendance and payments) as required for its accounts. This cannot be undone.'**
  String get deleteAccountWarning;

  /// No description provided for @ownerSignupExplainer.
  ///
  /// In en, this message translates to:
  /// **'Gym businesses are created on the REPSI website, where you choose a plan and set up your branches. Once it is ready, sign in here with the same mobile number.'**
  String get ownerSignupExplainer;

  /// No description provided for @resetLinkSent.
  ///
  /// In en, this message translates to:
  /// **'If {email} has a REPSI account, a reset link is on its way. Open it on this phone or a computer to choose a new password.'**
  String resetLinkSent(String email);

  /// No description provided for @otpSentTo.
  ///
  /// In en, this message translates to:
  /// **'Enter the 6-digit code we sent on WhatsApp to {number}.'**
  String otpSentTo(String number);

  /// No description provided for @verifyEmailSentTo.
  ///
  /// In en, this message translates to:
  /// **'We have sent a verification link to {email}. Please check your inbox.'**
  String verifyEmailSentTo(String email);

  /// No description provided for @verifyEmailYourAddress.
  ///
  /// In en, this message translates to:
  /// **'your email address'**
  String get verifyEmailYourAddress;

  /// No description provided for @signupJoining.
  ///
  /// In en, this message translates to:
  /// **'Joining: {slug}'**
  String signupJoining(String slug);

  /// No description provided for @changePassword.
  ///
  /// In en, this message translates to:
  /// **'Change password'**
  String get changePassword;

  /// No description provided for @currentPassword.
  ///
  /// In en, this message translates to:
  /// **'Current password'**
  String get currentPassword;

  /// No description provided for @enterCurrentPassword.
  ///
  /// In en, this message translates to:
  /// **'Enter your current password'**
  String get enterCurrentPassword;

  /// No description provided for @newPassword.
  ///
  /// In en, this message translates to:
  /// **'New password'**
  String get newPassword;

  /// No description provided for @passwordMax72.
  ///
  /// In en, this message translates to:
  /// **'Use at most 72 characters'**
  String get passwordMax72;

  /// No description provided for @passwordChooseDifferent.
  ///
  /// In en, this message translates to:
  /// **'Choose a different password'**
  String get passwordChooseDifferent;

  /// No description provided for @commonSaving.
  ///
  /// In en, this message translates to:
  /// **'Saving…'**
  String get commonSaving;

  /// No description provided for @commonUpdate.
  ///
  /// In en, this message translates to:
  /// **'Update'**
  String get commonUpdate;

  /// No description provided for @passwordUpdated.
  ///
  /// In en, this message translates to:
  /// **'Password updated. Other devices were signed out.'**
  String get passwordUpdated;

  /// No description provided for @deleteAccountTitle.
  ///
  /// In en, this message translates to:
  /// **'Delete your account?'**
  String get deleteAccountTitle;

  /// No description provided for @deleteAccountPasswordLabel.
  ///
  /// In en, this message translates to:
  /// **'Password (leave empty for Google-only accounts)'**
  String get deleteAccountPasswordLabel;

  /// No description provided for @deleteAccountTypeConfirm.
  ///
  /// In en, this message translates to:
  /// **'Type DELETE to confirm'**
  String get deleteAccountTypeConfirm;

  /// No description provided for @commonDeleting.
  ///
  /// In en, this message translates to:
  /// **'Deleting…'**
  String get commonDeleting;

  /// No description provided for @deleteAccount.
  ///
  /// In en, this message translates to:
  /// **'Delete account'**
  String get deleteAccount;

  /// No description provided for @profilePhotoUploadFailed.
  ///
  /// In en, this message translates to:
  /// **'Account created, but your photo didn\'t upload. You can add it from your profile.'**
  String get profilePhotoUploadFailed;

  /// No description provided for @completeProfileTitle.
  ///
  /// In en, this message translates to:
  /// **'Almost there!'**
  String get completeProfileTitle;

  /// No description provided for @completeProfileSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Your number is verified. Add a few details to finish setting up your account.'**
  String get completeProfileSubtitle;

  /// No description provided for @addProfilePhotoOptional.
  ///
  /// In en, this message translates to:
  /// **'Add a profile photo (optional)'**
  String get addProfilePhotoOptional;

  /// No description provided for @tapToChange.
  ///
  /// In en, this message translates to:
  /// **'Tap to change'**
  String get tapToChange;

  /// No description provided for @fullName.
  ///
  /// In en, this message translates to:
  /// **'Full name'**
  String get fullName;

  /// No description provided for @fullNameHint.
  ///
  /// In en, this message translates to:
  /// **'As your gym knows you'**
  String get fullNameHint;

  /// No description provided for @enterFullName.
  ///
  /// In en, this message translates to:
  /// **'Enter your full name'**
  String get enterFullName;

  /// No description provided for @uploadingPhoto.
  ///
  /// In en, this message translates to:
  /// **'Uploading photo…'**
  String get uploadingPhoto;

  /// No description provided for @emailSendFailed.
  ///
  /// In en, this message translates to:
  /// **'We couldn\'t send the email. Please try again.'**
  String get emailSendFailed;

  /// No description provided for @checkYourEmail.
  ///
  /// In en, this message translates to:
  /// **'Check your email'**
  String get checkYourEmail;

  /// No description provided for @backToSignIn.
  ///
  /// In en, this message translates to:
  /// **'Back to sign in'**
  String get backToSignIn;

  /// No description provided for @useDifferentEmail.
  ///
  /// In en, this message translates to:
  /// **'Use a different email'**
  String get useDifferentEmail;

  /// No description provided for @resetPasswordTitle.
  ///
  /// In en, this message translates to:
  /// **'Reset your password'**
  String get resetPasswordTitle;

  /// No description provided for @resetPasswordSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Enter the email on your account and we\'ll send you a link to set a new password.'**
  String get resetPasswordSubtitle;

  /// No description provided for @sendResetLink.
  ///
  /// In en, this message translates to:
  /// **'Send reset link'**
  String get sendResetLink;

  /// No description provided for @codeSendFailed.
  ///
  /// In en, this message translates to:
  /// **'We couldn\'t send the code. Please try again.'**
  String get codeSendFailed;

  /// No description provided for @accountNotFoundPassword.
  ///
  /// In en, this message translates to:
  /// **'We couldn\'t find a REPSI account with those details. Check your email or mobile number, or sign in with a WhatsApp code.'**
  String get accountNotFoundPassword;

  /// No description provided for @accountNotFoundGoogle.
  ///
  /// In en, this message translates to:
  /// **'We couldn\'t find a REPSI account linked to this Google account. Sign in with your mobile number instead.'**
  String get accountNotFoundGoogle;

  /// No description provided for @accountNotFound.
  ///
  /// In en, this message translates to:
  /// **'Account not found'**
  String get accountNotFound;

  /// No description provided for @useMobileNumber.
  ///
  /// In en, this message translates to:
  /// **'Use mobile number'**
  String get useMobileNumber;

  /// No description provided for @setUpNewGym.
  ///
  /// In en, this message translates to:
  /// **'Set up a new gym'**
  String get setUpNewGym;

  /// No description provided for @copyRepsiLink.
  ///
  /// In en, this message translates to:
  /// **'Copy repsi.app link'**
  String get copyRepsiLink;

  /// No description provided for @setUpNewGymQuestion.
  ///
  /// In en, this message translates to:
  /// **'Setting up a new gym?'**
  String get setUpNewGymQuestion;

  /// No description provided for @startOnRepsi.
  ///
  /// In en, this message translates to:
  /// **'Start on repsi.app'**
  String get startOnRepsi;

  /// No description provided for @welcomeBack.
  ///
  /// In en, this message translates to:
  /// **'Welcome back'**
  String get welcomeBack;

  /// No description provided for @letsGetStarted.
  ///
  /// In en, this message translates to:
  /// **'Let\'s get started'**
  String get letsGetStarted;

  /// No description provided for @loginPasswordSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Sign in with the email or mobile number and password on your account.'**
  String get loginPasswordSubtitle;

  /// No description provided for @loginOtpSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Enter your mobile number and we\'ll send a verification code on WhatsApp.'**
  String get loginOtpSubtitle;

  /// No description provided for @continueWithGoogle.
  ///
  /// In en, this message translates to:
  /// **'Continue with Google'**
  String get continueWithGoogle;

  /// No description provided for @useMobileInstead.
  ///
  /// In en, this message translates to:
  /// **'Use mobile number instead'**
  String get useMobileInstead;

  /// No description provided for @signInWithEmailPassword.
  ///
  /// In en, this message translates to:
  /// **'Sign in with email and password'**
  String get signInWithEmailPassword;

  /// No description provided for @enterMobileNumber.
  ///
  /// In en, this message translates to:
  /// **'Enter your mobile number'**
  String get enterMobileNumber;

  /// No description provided for @enterValid10Digit.
  ///
  /// In en, this message translates to:
  /// **'Enter a valid 10-digit mobile number'**
  String get enterValid10Digit;

  /// No description provided for @sendCodeWhatsApp.
  ///
  /// In en, this message translates to:
  /// **'Send code on WhatsApp'**
  String get sendCodeWhatsApp;

  /// No description provided for @emailOrMobile.
  ///
  /// In en, this message translates to:
  /// **'Email or mobile number'**
  String get emailOrMobile;

  /// No description provided for @emailOrMobileRequired.
  ///
  /// In en, this message translates to:
  /// **'Email or mobile number is required'**
  String get emailOrMobileRequired;

  /// No description provided for @passwordRequired.
  ///
  /// In en, this message translates to:
  /// **'Password is required'**
  String get passwordRequired;

  /// No description provided for @forgotPassword.
  ///
  /// In en, this message translates to:
  /// **'Forgot password?'**
  String get forgotPassword;

  /// No description provided for @signIn.
  ///
  /// In en, this message translates to:
  /// **'Sign in'**
  String get signIn;

  /// No description provided for @chooseWorkspace.
  ///
  /// In en, this message translates to:
  /// **'Choose your workspace'**
  String get chooseWorkspace;

  /// No description provided for @chooseWorkspaceSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Select the organization and workspace you\'d like to access'**
  String get chooseWorkspaceSubtitle;

  /// No description provided for @roleOwnerTitle.
  ///
  /// In en, this message translates to:
  /// **'Repsi Fitness — Owner'**
  String get roleOwnerTitle;

  /// No description provided for @roleOwnerDesc.
  ///
  /// In en, this message translates to:
  /// **'Business command center: revenue, members, attendance & ops'**
  String get roleOwnerDesc;

  /// No description provided for @roleTrainerTitle.
  ///
  /// In en, this message translates to:
  /// **'Repsi Fitness — Trainer'**
  String get roleTrainerTitle;

  /// No description provided for @roleTrainerDesc.
  ///
  /// In en, this message translates to:
  /// **'Coaching workspace: client training, workout & diet builder, chat'**
  String get roleTrainerDesc;

  /// No description provided for @roleTrainerBadge.
  ///
  /// In en, this message translates to:
  /// **'Active Coach'**
  String get roleTrainerBadge;

  /// No description provided for @roleMemberTitle.
  ///
  /// In en, this message translates to:
  /// **'Repsi Fitness — Member'**
  String get roleMemberTitle;

  /// No description provided for @roleMemberDesc.
  ///
  /// In en, this message translates to:
  /// **'Personal fitness companion: streak, workouts, QR check-in & progress'**
  String get roleMemberDesc;

  /// No description provided for @roleMemberBadge.
  ///
  /// In en, this message translates to:
  /// **'Gold Member'**
  String get roleMemberBadge;

  /// No description provided for @roleAdminTitle.
  ///
  /// In en, this message translates to:
  /// **'Repsi Platform — Admin'**
  String get roleAdminTitle;

  /// No description provided for @roleAdminDesc.
  ///
  /// In en, this message translates to:
  /// **'Internal administration: gym tenants, accounts & system metrics'**
  String get roleAdminDesc;

  /// No description provided for @roleAdminBadge.
  ///
  /// In en, this message translates to:
  /// **'Superadmin'**
  String get roleAdminBadge;

  /// No description provided for @signOutFailed.
  ///
  /// In en, this message translates to:
  /// **'Couldn\'t sign out. Please try again.'**
  String get signOutFailed;

  /// No description provided for @signOutTitle.
  ///
  /// In en, this message translates to:
  /// **'Sign out?'**
  String get signOutTitle;

  /// No description provided for @signOutConfirmOwner.
  ///
  /// In en, this message translates to:
  /// **'Are you sure you want to sign out of your REPSI owner account?'**
  String get signOutConfirmOwner;

  /// No description provided for @signingOut.
  ///
  /// In en, this message translates to:
  /// **'Signing out…'**
  String get signingOut;

  /// No description provided for @createAccountTitle.
  ///
  /// In en, this message translates to:
  /// **'Create your account'**
  String get createAccountTitle;

  /// No description provided for @joinGymTitle.
  ///
  /// In en, this message translates to:
  /// **'Join your gym'**
  String get joinGymTitle;

  /// No description provided for @signupStep1.
  ///
  /// In en, this message translates to:
  /// **'Step 1 of 2: Member profile'**
  String get signupStep1;

  /// No description provided for @signupStep2.
  ///
  /// In en, this message translates to:
  /// **'Step 2 of 2: Join your gym'**
  String get signupStep2;

  /// No description provided for @nameHintExample.
  ///
  /// In en, this message translates to:
  /// **'Priya Sharma'**
  String get nameHintExample;

  /// No description provided for @fullNameRequired.
  ///
  /// In en, this message translates to:
  /// **'Full name is required'**
  String get fullNameRequired;

  /// No description provided for @emailRequired.
  ///
  /// In en, this message translates to:
  /// **'Email is required'**
  String get emailRequired;

  /// No description provided for @continueToGym.
  ///
  /// In en, this message translates to:
  /// **'Continue to Gym'**
  String get continueToGym;

  /// No description provided for @gymCode.
  ///
  /// In en, this message translates to:
  /// **'Gym link name'**
  String get gymCode;

  /// No description provided for @gymCodeRequired.
  ///
  /// In en, this message translates to:
  /// **'Gym link name is required'**
  String get gymCodeRequired;

  /// No description provided for @phoneOptional.
  ///
  /// In en, this message translates to:
  /// **'Phone number (optional)'**
  String get phoneOptional;

  /// No description provided for @cityOptional.
  ///
  /// In en, this message translates to:
  /// **'City (optional)'**
  String get cityOptional;

  /// No description provided for @cityHint.
  ///
  /// In en, this message translates to:
  /// **'Chennai, Kochi, Delhi…'**
  String get cityHint;

  /// No description provided for @createMemberAccount.
  ///
  /// In en, this message translates to:
  /// **'Create member account'**
  String get createMemberAccount;

  /// No description provided for @verifyEmailTitle.
  ///
  /// In en, this message translates to:
  /// **'Verify your email'**
  String get verifyEmailTitle;

  /// No description provided for @continueToSetup.
  ///
  /// In en, this message translates to:
  /// **'Continue setup'**
  String get continueToSetup;

  /// No description provided for @resendEmail.
  ///
  /// In en, this message translates to:
  /// **'Resend email'**
  String get resendEmail;

  /// No description provided for @verificationEmailResent.
  ///
  /// In en, this message translates to:
  /// **'Verification email resent!'**
  String get verificationEmailResent;

  /// No description provided for @codeVerifyFailed.
  ///
  /// In en, this message translates to:
  /// **'We couldn\'t verify the code. Please try again.'**
  String get codeVerifyFailed;

  /// No description provided for @newCodeSent.
  ///
  /// In en, this message translates to:
  /// **'A new code is on its way to WhatsApp.'**
  String get newCodeSent;

  /// No description provided for @verifyNumberTitle.
  ///
  /// In en, this message translates to:
  /// **'Verify your number'**
  String get verifyNumberTitle;

  /// No description provided for @changeNumber.
  ///
  /// In en, this message translates to:
  /// **'Change number'**
  String get changeNumber;

  /// No description provided for @didntGetCode.
  ///
  /// In en, this message translates to:
  /// **'Didn\'t get it?'**
  String get didntGetCode;

  /// No description provided for @resendIn.
  ///
  /// In en, this message translates to:
  /// **'Resend in {time}'**
  String resendIn(String time);

  /// No description provided for @commonSending.
  ///
  /// In en, this message translates to:
  /// **'Sending…'**
  String get commonSending;

  /// No description provided for @resendCode.
  ///
  /// In en, this message translates to:
  /// **'Resend code'**
  String get resendCode;

  /// No description provided for @otpTestServerNotice.
  ///
  /// In en, this message translates to:
  /// **'Test server: WhatsApp is not connected, so use the server\'s test code.'**
  String get otpTestServerNotice;

  /// No description provided for @verify.
  ///
  /// In en, this message translates to:
  /// **'Verify'**
  String get verify;

  /// No description provided for @photoUpdateFailed.
  ///
  /// In en, this message translates to:
  /// **'Couldn\'t update your photo. Please try again.'**
  String get photoUpdateFailed;

  /// No description provided for @photoUpdated.
  ///
  /// In en, this message translates to:
  /// **'Profile photo updated'**
  String get photoUpdated;

  /// No description provided for @photoRemoved.
  ///
  /// In en, this message translates to:
  /// **'Profile photo removed'**
  String get photoRemoved;

  /// No description provided for @splashSlow.
  ///
  /// In en, this message translates to:
  /// **'Taking longer than usual · Tap to continue'**
  String get splashSlow;

  /// No description provided for @dashExpiringSoon.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{1 membership ends in the next 7 days} other{{count} memberships end in the next 7 days}}'**
  String dashExpiringSoon(int count);

  /// No description provided for @dashPeakHour.
  ///
  /// In en, this message translates to:
  /// **'Peak {hour}'**
  String dashPeakHour(String hour);

  /// No description provided for @dashGreetingLine.
  ///
  /// In en, this message translates to:
  /// **'{greeting} · {date}'**
  String dashGreetingLine(String greeting, String date);

  /// No description provided for @dashGreetingNameLine.
  ///
  /// In en, this message translates to:
  /// **'{greeting}, {name} · {date}'**
  String dashGreetingNameLine(String greeting, String name, String date);

  /// No description provided for @dashNotificationsUnread.
  ///
  /// In en, this message translates to:
  /// **'Notifications, {count} unread'**
  String dashNotificationsUnread(int count);

  /// No description provided for @dashTrialDaysLeft.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{1 day left in your free trial. Choose a plan on repsi.app anytime.} other{{count} days left in your free trial. Choose a plan on repsi.app anytime.}}'**
  String dashTrialDaysLeft(int count);

  /// No description provided for @dashRevenueSemantics.
  ///
  /// In en, this message translates to:
  /// **'Revenue this month {amount}, up {percent} percent versus last month'**
  String dashRevenueSemantics(String amount, String percent);

  /// No description provided for @dashRevenueSemanticsDown.
  ///
  /// In en, this message translates to:
  /// **'Revenue this month {amount}, down {percent} percent versus last month'**
  String dashRevenueSemanticsDown(String amount, String percent);

  /// No description provided for @dashVsLastMonth.
  ///
  /// In en, this message translates to:
  /// **'{percent}% vs last month'**
  String dashVsLastMonth(String percent);

  /// No description provided for @dashCheckinsChartSemantics.
  ///
  /// In en, this message translates to:
  /// **'Check-ins over the last {days} days: {values}'**
  String dashCheckinsChartSemantics(int days, String values);

  /// No description provided for @dashCheckinsCount.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{1 check-in} other{{count} check-ins}}'**
  String dashCheckinsCount(int count);

  /// No description provided for @dashCheckedInCount.
  ///
  /// In en, this message translates to:
  /// **'{count} checked in'**
  String dashCheckedInCount(int count);

  /// No description provided for @dashInSince.
  ///
  /// In en, this message translates to:
  /// **'in since {time}'**
  String dashInSince(String time);

  /// No description provided for @dashSeeAll.
  ///
  /// In en, this message translates to:
  /// **'See all {count}'**
  String dashSeeAll(int count);

  /// No description provided for @searchNoResults.
  ///
  /// In en, this message translates to:
  /// **'No results for \"{query}\"'**
  String searchNoResults(String query);

  /// No description provided for @searchMembersHeader.
  ///
  /// In en, this message translates to:
  /// **'MEMBERS ({count})'**
  String searchMembersHeader(int count);

  /// No description provided for @searchTrainersHeader.
  ///
  /// In en, this message translates to:
  /// **'TRAINERS ({count})'**
  String searchTrainersHeader(int count);

  /// No description provided for @searchFeaturesHeader.
  ///
  /// In en, this message translates to:
  /// **'FEATURES & SHORTCUTS ({count})'**
  String searchFeaturesHeader(int count);

  /// No description provided for @financeMembersCount.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{1 member} other{{count} members}}'**
  String financeMembersCount(int count);

  /// No description provided for @financeDaysOverdue.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{1 day overdue} other{{count} days overdue}}'**
  String financeDaysOverdue(int count);

  /// No description provided for @financeMoreOnWeb.
  ///
  /// In en, this message translates to:
  /// **'+ {count} more. Full report on repsi.app'**
  String financeMoreOnWeb(int count);

  /// No description provided for @memberCopied.
  ///
  /// In en, this message translates to:
  /// **'Copied {value}'**
  String memberCopied(String value);

  /// No description provided for @memberLastVisit.
  ///
  /// In en, this message translates to:
  /// **'Last visit {when}'**
  String memberLastVisit(String when);

  /// No description provided for @memberPaidAcross.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{{amount} paid across 1 payment} other{{amount} paid across {count} payments}}'**
  String memberPaidAcross(String amount, int count);

  /// No description provided for @memberInSince.
  ///
  /// In en, this message translates to:
  /// **'In since {time}'**
  String memberInSince(String time);

  /// No description provided for @memberHistoryUntil.
  ///
  /// In en, this message translates to:
  /// **'{label} · until {date}'**
  String memberHistoryUntil(String label, String date);

  /// No description provided for @memberRenewedOn.
  ///
  /// In en, this message translates to:
  /// **'{name} renewed on {plan}. Record the payment when it is collected.'**
  String memberRenewedOn(String name, String plan);

  /// No description provided for @memberRenewFor.
  ///
  /// In en, this message translates to:
  /// **'Renew for {amount}'**
  String memberRenewFor(String amount);

  /// No description provided for @memberPaymentRecorded.
  ///
  /// In en, this message translates to:
  /// **'{amount} recorded for {name}'**
  String memberPaymentRecorded(String amount, String name);

  /// No description provided for @memberEnded.
  ///
  /// In en, this message translates to:
  /// **'ended {when}'**
  String memberEnded(String when);

  /// No description provided for @memberEnds.
  ///
  /// In en, this message translates to:
  /// **'ends {when}'**
  String memberEnds(String when);

  /// No description provided for @timeMinutesAgo.
  ///
  /// In en, this message translates to:
  /// **'{count}m ago'**
  String timeMinutesAgo(int count);

  /// No description provided for @timeHoursAgo.
  ///
  /// In en, this message translates to:
  /// **'{count}h ago'**
  String timeHoursAgo(int count);

  /// No description provided for @timeDaysAgo.
  ///
  /// In en, this message translates to:
  /// **'{count}d ago'**
  String timeDaysAgo(int count);

  /// No description provided for @opsCheckedOut.
  ///
  /// In en, this message translates to:
  /// **'{name} checked out'**
  String opsCheckedOut(String name);

  /// No description provided for @opsCheckedIn.
  ///
  /// In en, this message translates to:
  /// **'{name} checked in'**
  String opsCheckedIn(String name);

  /// No description provided for @opsInAt.
  ///
  /// In en, this message translates to:
  /// **'In at {time} · {duration}'**
  String opsInAt(String time, String duration);

  /// No description provided for @opsFollowUp.
  ///
  /// In en, this message translates to:
  /// **'follow up {date}'**
  String opsFollowUp(String date);

  /// No description provided for @opsLeadAdded.
  ///
  /// In en, this message translates to:
  /// **'{name} added to leads'**
  String opsLeadAdded(String name);

  /// No description provided for @opsQrRotates.
  ///
  /// In en, this message translates to:
  /// **'Rotates {when}'**
  String opsQrRotates(String when);

  /// No description provided for @opsTeamHeader.
  ///
  /// In en, this message translates to:
  /// **'Staff & Trainers ({count})'**
  String opsTeamHeader(int count);

  /// No description provided for @opsYou.
  ///
  /// In en, this message translates to:
  /// **'{name} (you)'**
  String opsYou(String name);

  /// No description provided for @workspaceGreeting.
  ///
  /// In en, this message translates to:
  /// **'Good morning, {name}'**
  String workspaceGreeting(String name);

  /// No description provided for @workspaceSlug.
  ///
  /// In en, this message translates to:
  /// **'Link: {slug}'**
  String workspaceSlug(String slug);

  /// No description provided for @yourGym.
  ///
  /// In en, this message translates to:
  /// **'Your gym'**
  String get yourGym;

  /// No description provided for @errorLoadDashboardTitle.
  ///
  /// In en, this message translates to:
  /// **'Couldn\'t load your dashboard'**
  String get errorLoadDashboardTitle;

  /// No description provided for @needsAttention.
  ///
  /// In en, this message translates to:
  /// **'Needs attention'**
  String get needsAttention;

  /// No description provided for @remindToRenew.
  ///
  /// In en, this message translates to:
  /// **'Remind them to renew before access lapses'**
  String get remindToRenew;

  /// No description provided for @checkIns.
  ///
  /// In en, this message translates to:
  /// **'Check-ins'**
  String get checkIns;

  /// No description provided for @greetingMorning.
  ///
  /// In en, this message translates to:
  /// **'Good morning'**
  String get greetingMorning;

  /// No description provided for @greetingAfternoon.
  ///
  /// In en, this message translates to:
  /// **'Good afternoon'**
  String get greetingAfternoon;

  /// No description provided for @greetingEvening.
  ///
  /// In en, this message translates to:
  /// **'Good evening'**
  String get greetingEvening;

  /// No description provided for @accountAndSettings.
  ///
  /// In en, this message translates to:
  /// **'Account and settings'**
  String get accountAndSettings;

  /// No description provided for @trialEnded.
  ///
  /// In en, this message translates to:
  /// **'Your free trial has ended. Choose a plan on repsi.app to keep using REPSI.'**
  String get trialEnded;

  /// No description provided for @subscriptionManageOnWeb.
  ///
  /// In en, this message translates to:
  /// **'Your REPSI subscription needs attention. Manage your subscription at repsi.app.'**
  String get subscriptionManageOnWeb;

  /// No description provided for @revenueThisMonth.
  ///
  /// In en, this message translates to:
  /// **'Revenue this month'**
  String get revenueThisMonth;

  /// No description provided for @checkInsToday.
  ///
  /// In en, this message translates to:
  /// **'Check-ins today'**
  String get checkInsToday;

  /// No description provided for @activeMembers.
  ///
  /// In en, this message translates to:
  /// **'Active members'**
  String get activeMembers;

  /// No description provided for @renewalsDue.
  ///
  /// In en, this message translates to:
  /// **'Renewals due'**
  String get renewalsDue;

  /// No description provided for @addMember.
  ///
  /// In en, this message translates to:
  /// **'Add member'**
  String get addMember;

  /// No description provided for @noCheckinsThisWeek.
  ///
  /// In en, this message translates to:
  /// **'No check-ins recorded this week yet.'**
  String get noCheckinsThisWeek;

  /// No description provided for @errorLoadCheckedIn.
  ///
  /// In en, this message translates to:
  /// **'Couldn\'t load who\'s checked in.'**
  String get errorLoadCheckedIn;

  /// No description provided for @memberships.
  ///
  /// In en, this message translates to:
  /// **'Memberships'**
  String get memberships;

  /// No description provided for @reports.
  ///
  /// In en, this message translates to:
  /// **'Reports'**
  String get reports;

  /// No description provided for @searchAttendanceDesc.
  ///
  /// In en, this message translates to:
  /// **'Check members in and out, see who is inside'**
  String get searchAttendanceDesc;

  /// No description provided for @searchMembersDesc.
  ///
  /// In en, this message translates to:
  /// **'Profiles, memberships and renewals'**
  String get searchMembersDesc;

  /// No description provided for @leads.
  ///
  /// In en, this message translates to:
  /// **'Leads'**
  String get leads;

  /// No description provided for @searchLeadsDesc.
  ///
  /// In en, this message translates to:
  /// **'Enquiries, trials and follow-ups'**
  String get searchLeadsDesc;

  /// No description provided for @searchFinanceDesc.
  ///
  /// In en, this message translates to:
  /// **'Collections, dues and expenses'**
  String get searchFinanceDesc;

  /// No description provided for @businessInsights.
  ///
  /// In en, this message translates to:
  /// **'Business insights'**
  String get businessInsights;

  /// No description provided for @searchInsightsDesc.
  ///
  /// In en, this message translates to:
  /// **'What changed and what to do next'**
  String get searchInsightsDesc;

  /// No description provided for @insights.
  ///
  /// In en, this message translates to:
  /// **'Insights'**
  String get insights;

  /// No description provided for @searchNotificationsDesc.
  ///
  /// In en, this message translates to:
  /// **'Alerts and announcements'**
  String get searchNotificationsDesc;

  /// No description provided for @account.
  ///
  /// In en, this message translates to:
  /// **'Account'**
  String get account;

  /// No description provided for @searchSettingsDesc.
  ///
  /// In en, this message translates to:
  /// **'Profile, branches, plans and appearance'**
  String get searchSettingsDesc;

  /// No description provided for @searchFailed.
  ///
  /// In en, this message translates to:
  /// **'Couldn\'t search members and trainers. Check your connection.'**
  String get searchFailed;

  /// No description provided for @searchHint.
  ///
  /// In en, this message translates to:
  /// **'Search members, trainers, features…'**
  String get searchHint;

  /// No description provided for @recent.
  ///
  /// In en, this message translates to:
  /// **'Recent'**
  String get recent;

  /// No description provided for @quickAccess.
  ///
  /// In en, this message translates to:
  /// **'Quick access'**
  String get quickAccess;

  /// No description provided for @searchUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Search unavailable'**
  String get searchUnavailable;

  /// No description provided for @searchEmptyHint.
  ///
  /// In en, this message translates to:
  /// **'Search by member name, phone number or member code, or a screen like Attendance.'**
  String get searchEmptyHint;

  /// No description provided for @memberIdLabel.
  ///
  /// In en, this message translates to:
  /// **'Member ID:'**
  String get memberIdLabel;

  /// No description provided for @coach.
  ///
  /// In en, this message translates to:
  /// **'Coach'**
  String get coach;

  /// No description provided for @specStrength.
  ///
  /// In en, this message translates to:
  /// **'Strength & Conditioning'**
  String get specStrength;

  /// No description provided for @errorLoadFinance.
  ///
  /// In en, this message translates to:
  /// **'Couldn\'t load finance'**
  String get errorLoadFinance;

  /// No description provided for @collectedThisMonth.
  ///
  /// In en, this message translates to:
  /// **'Collected this month'**
  String get collectedThisMonth;

  /// No description provided for @expenses.
  ///
  /// In en, this message translates to:
  /// **'Expenses'**
  String get expenses;

  /// No description provided for @net.
  ///
  /// In en, this message translates to:
  /// **'Net'**
  String get net;

  /// No description provided for @duesToCollect.
  ///
  /// In en, this message translates to:
  /// **'Dues to collect'**
  String get duesToCollect;

  /// No description provided for @collections.
  ///
  /// In en, this message translates to:
  /// **'Collections'**
  String get collections;

  /// No description provided for @last6Months.
  ///
  /// In en, this message translates to:
  /// **'Last 6 months'**
  String get last6Months;

  /// No description provided for @noCollections.
  ///
  /// In en, this message translates to:
  /// **'No collections recorded in the last six months.'**
  String get noCollections;

  /// No description provided for @nothingOutstanding.
  ///
  /// In en, this message translates to:
  /// **'Nothing outstanding. Every invoice is paid.'**
  String get nothingOutstanding;

  /// No description provided for @dueNow.
  ///
  /// In en, this message translates to:
  /// **'Due now'**
  String get dueNow;

  /// No description provided for @recentExpenses.
  ///
  /// In en, this message translates to:
  /// **'Recent expenses'**
  String get recentExpenses;

  /// No description provided for @noExpenses.
  ///
  /// In en, this message translates to:
  /// **'No expenses recorded yet.'**
  String get noExpenses;

  /// No description provided for @historyJoined.
  ///
  /// In en, this message translates to:
  /// **'Joined'**
  String get historyJoined;

  /// No description provided for @historyStarted.
  ///
  /// In en, this message translates to:
  /// **'Membership started'**
  String get historyStarted;

  /// No description provided for @historyRenewed.
  ///
  /// In en, this message translates to:
  /// **'Membership renewed'**
  String get historyRenewed;

  /// No description provided for @historyExpired.
  ///
  /// In en, this message translates to:
  /// **'Membership expired'**
  String get historyExpired;

  /// No description provided for @historyFrozen.
  ///
  /// In en, this message translates to:
  /// **'Membership frozen'**
  String get historyFrozen;

  /// No description provided for @historyResumed.
  ///
  /// In en, this message translates to:
  /// **'Membership resumed'**
  String get historyResumed;

  /// No description provided for @historyFreezeCancelled.
  ///
  /// In en, this message translates to:
  /// **'Freeze cancelled'**
  String get historyFreezeCancelled;

  /// No description provided for @historyExtended.
  ///
  /// In en, this message translates to:
  /// **'Membership extended'**
  String get historyExtended;

  /// No description provided for @historyCancelled.
  ///
  /// In en, this message translates to:
  /// **'Membership cancelled'**
  String get historyCancelled;

  /// No description provided for @historyStatusChanged.
  ///
  /// In en, this message translates to:
  /// **'Account status changed'**
  String get historyStatusChanged;

  /// No description provided for @historyNoteAdded.
  ///
  /// In en, this message translates to:
  /// **'Note added'**
  String get historyNoteAdded;

  /// No description provided for @historyNoteEdited.
  ///
  /// In en, this message translates to:
  /// **'Note edited'**
  String get historyNoteEdited;

  /// No description provided for @historyNoteDeleted.
  ///
  /// In en, this message translates to:
  /// **'Note deleted'**
  String get historyNoteDeleted;

  /// No description provided for @historyProfileUpdated.
  ///
  /// In en, this message translates to:
  /// **'Profile updated'**
  String get historyProfileUpdated;

  /// No description provided for @plan.
  ///
  /// In en, this message translates to:
  /// **'Plan'**
  String get plan;

  /// No description provided for @memberAdded.
  ///
  /// In en, this message translates to:
  /// **'Member added'**
  String get memberAdded;

  /// No description provided for @memberAddFailed.
  ///
  /// In en, this message translates to:
  /// **'Couldn\'t add the member. Please try again.'**
  String get memberAddFailed;

  /// No description provided for @addNewMember.
  ///
  /// In en, this message translates to:
  /// **'Add new member'**
  String get addNewMember;

  /// No description provided for @fullNameRequiredLabel.
  ///
  /// In en, this message translates to:
  /// **'Full name *'**
  String get fullNameRequiredLabel;

  /// No description provided for @nameRequired.
  ///
  /// In en, this message translates to:
  /// **'Name is required'**
  String get nameRequired;

  /// No description provided for @emailRequiredLabel.
  ///
  /// In en, this message translates to:
  /// **'Email address *'**
  String get emailRequiredLabel;

  /// No description provided for @phoneNumber.
  ///
  /// In en, this message translates to:
  /// **'Phone number'**
  String get phoneNumber;

  /// No description provided for @emergencyContactPhone.
  ///
  /// In en, this message translates to:
  /// **'Emergency contact phone'**
  String get emergencyContactPhone;

  /// No description provided for @membershipPlan.
  ///
  /// In en, this message translates to:
  /// **'Membership plan'**
  String get membershipPlan;

  /// No description provided for @saveMember.
  ///
  /// In en, this message translates to:
  /// **'Save member'**
  String get saveMember;

  /// No description provided for @errorLoadMember.
  ///
  /// In en, this message translates to:
  /// **'Couldn\'t load this member'**
  String get errorLoadMember;

  /// No description provided for @renew.
  ///
  /// In en, this message translates to:
  /// **'Renew'**
  String get renew;

  /// No description provided for @overview.
  ///
  /// In en, this message translates to:
  /// **'Overview'**
  String get overview;

  /// No description provided for @visits.
  ///
  /// In en, this message translates to:
  /// **'Visits'**
  String get visits;

  /// No description provided for @history.
  ///
  /// In en, this message translates to:
  /// **'History'**
  String get history;

  /// No description provided for @errorLoadThis.
  ///
  /// In en, this message translates to:
  /// **'Couldn\'t load this section'**
  String get errorLoadThis;

  /// No description provided for @noPlan.
  ///
  /// In en, this message translates to:
  /// **'No plan'**
  String get noPlan;

  /// No description provided for @ended.
  ///
  /// In en, this message translates to:
  /// **'Ended'**
  String get ended;

  /// No description provided for @ends.
  ///
  /// In en, this message translates to:
  /// **'Ends'**
  String get ends;

  /// No description provided for @memberSince.
  ///
  /// In en, this message translates to:
  /// **'Member since'**
  String get memberSince;

  /// No description provided for @gender.
  ///
  /// In en, this message translates to:
  /// **'Gender'**
  String get gender;

  /// No description provided for @emergencyContact.
  ///
  /// In en, this message translates to:
  /// **'Emergency contact'**
  String get emergencyContact;

  /// No description provided for @errorLoadVisits.
  ///
  /// In en, this message translates to:
  /// **'Couldn\'t load visits.'**
  String get errorLoadVisits;

  /// No description provided for @noVisitsYet.
  ///
  /// In en, this message translates to:
  /// **'No visits yet'**
  String get noVisitsYet;

  /// No description provided for @notes.
  ///
  /// In en, this message translates to:
  /// **'Notes'**
  String get notes;

  /// No description provided for @errorLoadNotes.
  ///
  /// In en, this message translates to:
  /// **'Couldn\'t load notes.'**
  String get errorLoadNotes;

  /// No description provided for @noNotes.
  ///
  /// In en, this message translates to:
  /// **'No notes yet. Add context the front desk should know.'**
  String get noNotes;

  /// No description provided for @noPaymentsForMember.
  ///
  /// In en, this message translates to:
  /// **'No payments recorded for this member yet.'**
  String get noPaymentsForMember;

  /// No description provided for @noVisitsRecorded.
  ///
  /// In en, this message translates to:
  /// **'No visits recorded yet.'**
  String get noVisitsRecorded;

  /// No description provided for @noHistory.
  ///
  /// In en, this message translates to:
  /// **'No history yet.'**
  String get noHistory;

  /// No description provided for @system.
  ///
  /// In en, this message translates to:
  /// **'System'**
  String get system;

  /// No description provided for @renewMembership.
  ///
  /// In en, this message translates to:
  /// **'Renew membership'**
  String get renewMembership;

  /// No description provided for @recordPayment.
  ///
  /// In en, this message translates to:
  /// **'Record payment'**
  String get recordPayment;

  /// No description provided for @amountRupees.
  ///
  /// In en, this message translates to:
  /// **'Amount (₹)'**
  String get amountRupees;

  /// No description provided for @enterAmountReceived.
  ///
  /// In en, this message translates to:
  /// **'Enter the amount received'**
  String get enterAmountReceived;

  /// No description provided for @noteOptional.
  ///
  /// In en, this message translates to:
  /// **'Note (optional)'**
  String get noteOptional;

  /// No description provided for @paymentNoteHint.
  ///
  /// In en, this message translates to:
  /// **'e.g. Quarterly renewal, UPI ref'**
  String get paymentNoteHint;

  /// No description provided for @savePayment.
  ///
  /// In en, this message translates to:
  /// **'Save payment'**
  String get savePayment;

  /// No description provided for @addNote.
  ///
  /// In en, this message translates to:
  /// **'Add note'**
  String get addNote;

  /// No description provided for @noteHint.
  ///
  /// In en, this message translates to:
  /// **'What should staff know?'**
  String get noteHint;

  /// No description provided for @saveNote.
  ///
  /// In en, this message translates to:
  /// **'Save note'**
  String get saveNote;

  /// No description provided for @endingSoon.
  ///
  /// In en, this message translates to:
  /// **'Ending soon'**
  String get endingSoon;

  /// No description provided for @searchMembersHint.
  ///
  /// In en, this message translates to:
  /// **'Search name, phone or email'**
  String get searchMembersHint;

  /// No description provided for @noMembersMatch.
  ///
  /// In en, this message translates to:
  /// **'No members match'**
  String get noMembersMatch;

  /// No description provided for @noMembersYet.
  ///
  /// In en, this message translates to:
  /// **'No members yet'**
  String get noMembersYet;

  /// No description provided for @tryAnotherSearch.
  ///
  /// In en, this message translates to:
  /// **'Try another name, phone number or filter.'**
  String get tryAnotherSearch;

  /// No description provided for @addFirstMember.
  ///
  /// In en, this message translates to:
  /// **'Add your first member to start tracking memberships and visits.'**
  String get addFirstMember;

  /// No description provided for @branches.
  ///
  /// In en, this message translates to:
  /// **'Branches'**
  String get branches;

  /// No description provided for @membershipPlans.
  ///
  /// In en, this message translates to:
  /// **'Membership plans'**
  String get membershipPlans;

  /// No description provided for @addTrainer.
  ///
  /// In en, this message translates to:
  /// **'Add trainer'**
  String get addTrainer;

  /// No description provided for @addTrainerDesc.
  ///
  /// In en, this message translates to:
  /// **'Onboard gym coach or PT'**
  String get addTrainerDesc;

  /// No description provided for @app.
  ///
  /// In en, this message translates to:
  /// **'App'**
  String get app;

  /// No description provided for @darkMode.
  ///
  /// In en, this message translates to:
  /// **'Dark mode'**
  String get darkMode;

  /// No description provided for @onTheWeb.
  ///
  /// In en, this message translates to:
  /// **'On the web'**
  String get onTheWeb;

  /// No description provided for @onTheWebTitle.
  ///
  /// In en, this message translates to:
  /// **'Billing, staff roles, reports and website'**
  String get onTheWebTitle;

  /// No description provided for @manageOnWeb.
  ///
  /// In en, this message translates to:
  /// **'Manage these on repsi.app'**
  String get manageOnWeb;

  /// No description provided for @errorLoadBranches.
  ///
  /// In en, this message translates to:
  /// **'Couldn\'t load branches.'**
  String get errorLoadBranches;

  /// No description provided for @branch.
  ///
  /// In en, this message translates to:
  /// **'Branch'**
  String get branch;

  /// No description provided for @mainBranch.
  ///
  /// In en, this message translates to:
  /// **'Main'**
  String get mainBranch;

  /// No description provided for @editBranchesOnWeb.
  ///
  /// In en, this message translates to:
  /// **'Add or edit branches on repsi.app.'**
  String get editBranchesOnWeb;

  /// No description provided for @errorLoadPlans.
  ///
  /// In en, this message translates to:
  /// **'Couldn\'t load plans.'**
  String get errorLoadPlans;

  /// No description provided for @noPlansYet.
  ///
  /// In en, this message translates to:
  /// **'No plans yet. Create plans on repsi.app.'**
  String get noPlansYet;

  /// No description provided for @markAllRead.
  ///
  /// In en, this message translates to:
  /// **'Mark all read'**
  String get markAllRead;

  /// No description provided for @unread.
  ///
  /// In en, this message translates to:
  /// **'Unread'**
  String get unread;

  /// No description provided for @billing.
  ///
  /// In en, this message translates to:
  /// **'Billing'**
  String get billing;

  /// No description provided for @announcements.
  ///
  /// In en, this message translates to:
  /// **'Announcements'**
  String get announcements;

  /// No description provided for @notificationsUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Notifications unavailable'**
  String get notificationsUnavailable;

  /// No description provided for @noNotifications.
  ///
  /// In en, this message translates to:
  /// **'No notifications'**
  String get noNotifications;

  /// No description provided for @noNotificationsDesc.
  ///
  /// In en, this message translates to:
  /// **'You are all caught up! Updates about your gym membership, classes, and payments will appear here.'**
  String get noNotificationsDesc;

  /// No description provided for @leadNew.
  ///
  /// In en, this message translates to:
  /// **'-'**
  String get leadNew;

  /// No description provided for @leadContacted.
  ///
  /// In en, this message translates to:
  /// **'-'**
  String get leadContacted;

  /// No description provided for @leadVisitBooked.
  ///
  /// In en, this message translates to:
  /// **'-'**
  String get leadVisitBooked;

  /// No description provided for @leadTrial.
  ///
  /// In en, this message translates to:
  /// **'-'**
  String get leadTrial;

  /// No description provided for @leadNegotiating.
  ///
  /// In en, this message translates to:
  /// **'-'**
  String get leadNegotiating;

  /// No description provided for @leadLost.
  ///
  /// In en, this message translates to:
  /// **'-'**
  String get leadLost;

  /// No description provided for @checkInQr.
  ///
  /// In en, this message translates to:
  /// **'Check-in QR'**
  String get checkInQr;

  /// No description provided for @team.
  ///
  /// In en, this message translates to:
  /// **'Team'**
  String get team;

  /// No description provided for @errorLoadToday.
  ///
  /// In en, this message translates to:
  /// **'Couldn\'t load today\'s numbers.'**
  String get errorLoadToday;

  /// No description provided for @insideNow.
  ///
  /// In en, this message translates to:
  /// **'Inside now'**
  String get insideNow;

  /// No description provided for @avgStay.
  ///
  /// In en, this message translates to:
  /// **'Avg. stay'**
  String get avgStay;

  /// No description provided for @checkInMember.
  ///
  /// In en, this message translates to:
  /// **'Check in a member'**
  String get checkInMember;

  /// No description provided for @searchNameOrPhone.
  ///
  /// In en, this message translates to:
  /// **'Search name or phone'**
  String get searchNameOrPhone;

  /// No description provided for @typeTwoLetters.
  ///
  /// In en, this message translates to:
  /// **'Type at least two letters of a name or phone number.'**
  String get typeTwoLetters;

  /// No description provided for @errorLoadLeads.
  ///
  /// In en, this message translates to:
  /// **'Couldn\'t load leads'**
  String get errorLoadLeads;

  /// No description provided for @noLeadsYet.
  ///
  /// In en, this message translates to:
  /// **'No leads yet'**
  String get noLeadsYet;

  /// No description provided for @noLeadsInStage.
  ///
  /// In en, this message translates to:
  /// **'No leads in this stage'**
  String get noLeadsInStage;

  /// No description provided for @leadsEmptyDesc.
  ///
  /// In en, this message translates to:
  /// **'Capture walk-ins and enquiries so nobody slips through.'**
  String get leadsEmptyDesc;

  /// No description provided for @addLead.
  ///
  /// In en, this message translates to:
  /// **'Add lead'**
  String get addLead;

  /// No description provided for @newLead.
  ///
  /// In en, this message translates to:
  /// **'New lead'**
  String get newLead;

  /// No description provided for @sourceWalkIn.
  ///
  /// In en, this message translates to:
  /// **'Walk-in'**
  String get sourceWalkIn;

  /// No description provided for @sourceInstagram.
  ///
  /// In en, this message translates to:
  /// **'Instagram'**
  String get sourceInstagram;

  /// No description provided for @sourceWebsite.
  ///
  /// In en, this message translates to:
  /// **'Website'**
  String get sourceWebsite;

  /// No description provided for @sourceReferral.
  ///
  /// In en, this message translates to:
  /// **'Referral'**
  String get sourceReferral;

  /// No description provided for @sourceGoogle.
  ///
  /// In en, this message translates to:
  /// **'Google'**
  String get sourceGoogle;

  /// No description provided for @sourcePhoneCall.
  ///
  /// In en, this message translates to:
  /// **'Phone call'**
  String get sourcePhoneCall;

  /// No description provided for @name.
  ///
  /// In en, this message translates to:
  /// **'Name'**
  String get name;

  /// No description provided for @enterTheirName.
  ///
  /// In en, this message translates to:
  /// **'Enter their name'**
  String get enterTheirName;

  /// No description provided for @interestedIn.
  ///
  /// In en, this message translates to:
  /// **'Interested in (optional)'**
  String get interestedIn;

  /// No description provided for @interestedInHint.
  ///
  /// In en, this message translates to:
  /// **'e.g. Quarterly plan, PT'**
  String get interestedInHint;

  /// No description provided for @saveLead.
  ///
  /// In en, this message translates to:
  /// **'Save lead'**
  String get saveLead;

  /// No description provided for @errorLoadQr.
  ///
  /// In en, this message translates to:
  /// **'Couldn\'t load the check-in QR'**
  String get errorLoadQr;

  /// No description provided for @qrDesc.
  ///
  /// In en, this message translates to:
  /// **'Members scan this with the REPSI app to check themselves in. Show it at the front desk or print it.'**
  String get qrDesc;

  /// No description provided for @qrSemantics.
  ///
  /// In en, this message translates to:
  /// **'Gym check-in QR code'**
  String get qrSemantics;

  /// No description provided for @refresh.
  ///
  /// In en, this message translates to:
  /// **'Refresh'**
  String get refresh;

  /// No description provided for @errorLoadTeam.
  ///
  /// In en, this message translates to:
  /// **'Couldn\'t load your team'**
  String get errorLoadTeam;

  /// No description provided for @teamDesc.
  ///
  /// In en, this message translates to:
  /// **'Add trainers and manage staff roles directly from your phone.'**
  String get teamDesc;

  /// No description provided for @chooseGym.
  ///
  /// In en, this message translates to:
  /// **'Choose your gym'**
  String get chooseGym;

  /// No description provided for @chooseGymSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Select which gym location you would like to view and manage today.'**
  String get chooseGymSubtitle;

  /// No description provided for @noGymsFound.
  ///
  /// In en, this message translates to:
  /// **'No gyms found'**
  String get noGymsFound;

  /// No description provided for @registerGymOnWeb.
  ///
  /// In en, this message translates to:
  /// **'Register your gym on repsi.app to activate your workspace.'**
  String get registerGymOnWeb;

  /// No description provided for @gymWorkspace.
  ///
  /// In en, this message translates to:
  /// **'Gym'**
  String get gymWorkspace;

  /// No description provided for @openWorkspace.
  ///
  /// In en, this message translates to:
  /// **'Open'**
  String get openWorkspace;

  /// No description provided for @registerAnotherGym.
  ///
  /// In en, this message translates to:
  /// **'Want to register another gym location?'**
  String get registerAnotherGym;

  /// No description provided for @createGymOnDesktop.
  ///
  /// In en, this message translates to:
  /// **'Gyms are created on repsi.app from a computer.'**
  String get createGymOnDesktop;

  /// No description provided for @memberExpiredOn.
  ///
  /// In en, this message translates to:
  /// **'Expired on {date}'**
  String memberExpiredOn(String date);

  /// No description provided for @memberValidUntil.
  ///
  /// In en, this message translates to:
  /// **'Valid until {date}'**
  String memberValidUntil(String date);

  /// No description provided for @memberCheckedInSince.
  ///
  /// In en, this message translates to:
  /// **'Checked in since {time}'**
  String memberCheckedInSince(String time);

  /// No description provided for @healthAverageSteps.
  ///
  /// In en, this message translates to:
  /// **'7-day average: {steps} steps'**
  String healthAverageSteps(String steps);

  /// No description provided for @healthSyncedAt.
  ///
  /// In en, this message translates to:
  /// **'synced {time}'**
  String healthSyncedAt(String time);

  /// No description provided for @healthStepsSummary.
  ///
  /// In en, this message translates to:
  /// **'{total} total · {average} per day'**
  String healthStepsSummary(String total, String average);

  /// No description provided for @paymentRefLine.
  ///
  /// In en, this message translates to:
  /// **'Ref: {ref} · {method}'**
  String paymentRefLine(String ref, String method);

  /// No description provided for @receiptNumberLine.
  ///
  /// In en, this message translates to:
  /// **'Receipt #: {number}'**
  String receiptNumberLine(String number);

  /// No description provided for @receiptDescriptionLine.
  ///
  /// In en, this message translates to:
  /// **'Description: {text}'**
  String receiptDescriptionLine(String text);

  /// No description provided for @receiptAmountLine.
  ///
  /// In en, this message translates to:
  /// **'Amount paid: {amount}'**
  String receiptAmountLine(String amount);

  /// No description provided for @receiptModeLine.
  ///
  /// In en, this message translates to:
  /// **'Payment mode: {mode}'**
  String receiptModeLine(String mode);

  /// No description provided for @receiptStatusLine.
  ///
  /// In en, this message translates to:
  /// **'Status: {status}'**
  String receiptStatusLine(String status);

  /// No description provided for @qrSince.
  ///
  /// In en, this message translates to:
  /// **'Since {time}'**
  String qrSince(String time);

  /// No description provided for @qrInAt.
  ///
  /// In en, this message translates to:
  /// **'In at {time}'**
  String qrInAt(String time);

  /// No description provided for @chatUnread.
  ///
  /// In en, this message translates to:
  /// **'{count} unread'**
  String chatUnread(int count);

  /// No description provided for @chatNotSent.
  ///
  /// In en, this message translates to:
  /// **'Not sent: {error}'**
  String chatNotSent(String error);

  /// No description provided for @chatRead.
  ///
  /// In en, this message translates to:
  /// **'Read'**
  String get chatRead;

  /// No description provided for @workoutLogExercise.
  ///
  /// In en, this message translates to:
  /// **'Log {name}'**
  String workoutLogExercise(String name);

  /// No description provided for @weightKg.
  ///
  /// In en, this message translates to:
  /// **'{value} kg'**
  String weightKg(String value);

  /// No description provided for @exPrimary.
  ///
  /// In en, this message translates to:
  /// **'Primary: {muscle} ({category})'**
  String exPrimary(String muscle, String category);

  /// No description provided for @exSecondary.
  ///
  /// In en, this message translates to:
  /// **'Secondary: {muscle}'**
  String exSecondary(String muscle);

  /// No description provided for @exSetsCount.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{1 set} other{{count} sets}}'**
  String exSetsCount(int count);

  /// No description provided for @exRepsCount.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{1 rep} other{{count} reps}}'**
  String exRepsCount(int count);

  /// No description provided for @exSetsReps.
  ///
  /// In en, this message translates to:
  /// **'{sets} sets · {reps} reps'**
  String exSetsReps(int sets, int reps);

  /// No description provided for @exAllCount.
  ///
  /// In en, this message translates to:
  /// **'All ({count})'**
  String exAllCount(int count);

  /// No description provided for @exFavsCount.
  ///
  /// In en, this message translates to:
  /// **'Favourites ({count})'**
  String exFavsCount(int count);

  /// No description provided for @exSelectedCount.
  ///
  /// In en, this message translates to:
  /// **'Selected exercises ({count})'**
  String exSelectedCount(int count);

  /// No description provided for @exBasketCount.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{1 exercise selected} other{{count} exercises selected}}'**
  String exBasketCount(int count);

  /// No description provided for @exWorkoutSaved.
  ///
  /// In en, this message translates to:
  /// **'Workout \"{name}\" saved to My Workouts!'**
  String exWorkoutSaved(String name);

  /// No description provided for @exCoachNote.
  ///
  /// In en, this message translates to:
  /// **'Coach\'s note: \"{note}\"'**
  String exCoachNote(String note);

  /// No description provided for @exRestSeconds.
  ///
  /// In en, this message translates to:
  /// **'{count}s'**
  String exRestSeconds(int count);

  /// No description provided for @myPass.
  ///
  /// In en, this message translates to:
  /// **'My pass'**
  String get myPass;

  /// No description provided for @aiCoach.
  ///
  /// In en, this message translates to:
  /// **'AI coach'**
  String get aiCoach;

  /// No description provided for @errorLoadMembership.
  ///
  /// In en, this message translates to:
  /// **'Couldn\'t load your membership.'**
  String get errorLoadMembership;

  /// No description provided for @noMembershipYet.
  ///
  /// In en, this message translates to:
  /// **'No membership yet. Ask your gym to set one up for you.'**
  String get noMembershipYet;

  /// No description provided for @errorLoadYourAttendance.
  ///
  /// In en, this message translates to:
  /// **'Couldn\'t load your attendance.'**
  String get errorLoadYourAttendance;

  /// No description provided for @checkInWithQr.
  ///
  /// In en, this message translates to:
  /// **'Check in with QR'**
  String get checkInWithQr;

  /// No description provided for @healthAndroidOnly.
  ///
  /// In en, this message translates to:
  /// **'Activity tracking is available on Android phones with Health Connect.'**
  String get healthAndroidOnly;

  /// No description provided for @healthConnectPitch.
  ///
  /// In en, this message translates to:
  /// **'Connect Health Connect to see your steps, distance and active calories from Google Fit and other apps. Only these three totals are read, and you can disconnect and delete them any time.'**
  String get healthConnectPitch;

  /// No description provided for @healthConnectNeeded.
  ///
  /// In en, this message translates to:
  /// **'Health Connect is needed to read your steps from Google Fit and other fitness apps.'**
  String get healthConnectNeeded;

  /// No description provided for @healthConnect.
  ///
  /// In en, this message translates to:
  /// **'Connect Health Connect'**
  String get healthConnect;

  /// No description provided for @healthUpdate.
  ///
  /// In en, this message translates to:
  /// **'Update Health Connect'**
  String get healthUpdate;

  /// No description provided for @healthInstall.
  ///
  /// In en, this message translates to:
  /// **'Install Health Connect'**
  String get healthInstall;

  /// No description provided for @steps.
  ///
  /// In en, this message translates to:
  /// **'Steps'**
  String get steps;

  /// No description provided for @activeKcal.
  ///
  /// In en, this message translates to:
  /// **'Active kcal'**
  String get activeKcal;

  /// No description provided for @syncNow.
  ///
  /// In en, this message translates to:
  /// **'Sync now'**
  String get syncNow;

  /// No description provided for @disconnect.
  ///
  /// In en, this message translates to:
  /// **'Disconnect'**
  String get disconnect;

  /// No description provided for @todaysActivity.
  ///
  /// In en, this message translates to:
  /// **'Today\'s activity'**
  String get todaysActivity;

  /// No description provided for @healthDisconnectTitle.
  ///
  /// In en, this message translates to:
  /// **'Disconnect Health Connect?'**
  String get healthDisconnectTitle;

  /// No description provided for @healthDisconnectBody.
  ///
  /// In en, this message translates to:
  /// **'REPSI will stop syncing and delete the activity totals it has stored for you.'**
  String get healthDisconnectBody;

  /// No description provided for @aiWorkoutCoach.
  ///
  /// In en, this message translates to:
  /// **'AI Workout Coach'**
  String get aiWorkoutCoach;

  /// No description provided for @paymentsAndInvoices.
  ///
  /// In en, this message translates to:
  /// **'Payments & Invoices'**
  String get paymentsAndInvoices;

  /// No description provided for @notificationsAndAlerts.
  ///
  /// In en, this message translates to:
  /// **'Notifications & Alerts'**
  String get notificationsAndAlerts;

  /// No description provided for @membershipAndPayments.
  ///
  /// In en, this message translates to:
  /// **'Membership & Payments'**
  String get membershipAndPayments;

  /// No description provided for @membershipDetails.
  ///
  /// In en, this message translates to:
  /// **'Membership details'**
  String get membershipDetails;

  /// No description provided for @membershipDetailsUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Your current plan and renewal options are not available here yet. Contact your gym to confirm your membership.'**
  String get membershipDetailsUnavailable;

  /// No description provided for @paymentHistoryHeader.
  ///
  /// In en, this message translates to:
  /// **'Payment history & receipts'**
  String get paymentHistoryHeader;

  /// No description provided for @digitalReceipt.
  ///
  /// In en, this message translates to:
  /// **'Payment receipt'**
  String get digitalReceipt;

  /// No description provided for @scanMemberPass.
  ///
  /// In en, this message translates to:
  /// **'Scan member pass'**
  String get scanMemberPass;

  /// No description provided for @scanGymQr.
  ///
  /// In en, this message translates to:
  /// **'Scan gym QR'**
  String get scanGymQr;

  /// No description provided for @toggleFlashlight.
  ///
  /// In en, this message translates to:
  /// **'Toggle flashlight'**
  String get toggleFlashlight;

  /// No description provided for @cameraAccessOff.
  ///
  /// In en, this message translates to:
  /// **'Camera access is off'**
  String get cameraAccessOff;

  /// No description provided for @cameraUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Camera unavailable'**
  String get cameraUnavailable;

  /// No description provided for @cameraAccessOffDesc.
  ///
  /// In en, this message translates to:
  /// **'Allow camera access for REPSI in your phone settings to scan the gym QR, or ask the front desk to check you in.'**
  String get cameraAccessOffDesc;

  /// No description provided for @cameraStartFailed.
  ///
  /// In en, this message translates to:
  /// **'We couldn\'t start the camera. Ask the front desk to check you in.'**
  String get cameraStartFailed;

  /// No description provided for @notRepsiQr.
  ///
  /// In en, this message translates to:
  /// **'That is not a REPSI gym QR code. Scan the code shown at your gym entrance.'**
  String get notRepsiQr;

  /// No description provided for @checkedInGreat.
  ///
  /// In en, this message translates to:
  /// **'Checked in. Have a great workout!'**
  String get checkedInGreat;

  /// No description provided for @checkOutTitle.
  ///
  /// In en, this message translates to:
  /// **'Check out?'**
  String get checkOutTitle;

  /// No description provided for @checkOutBody.
  ///
  /// In en, this message translates to:
  /// **'This ends your current gym visit.'**
  String get checkOutBody;

  /// No description provided for @checkedOutBye.
  ///
  /// In en, this message translates to:
  /// **'Checked out. See you next time!'**
  String get checkedOutBye;

  /// No description provided for @pointCamera.
  ///
  /// In en, this message translates to:
  /// **'Point your camera at the QR code at your gym entrance.'**
  String get pointCamera;

  /// No description provided for @youAreCheckedIn.
  ///
  /// In en, this message translates to:
  /// **'You are checked in'**
  String get youAreCheckedIn;

  /// No description provided for @youAreNotCheckedIn.
  ///
  /// In en, this message translates to:
  /// **'You are not checked in'**
  String get youAreNotCheckedIn;

  /// No description provided for @noVisitsYetDesc.
  ///
  /// In en, this message translates to:
  /// **'No visits yet. Your check-ins will show up here.'**
  String get noVisitsYetDesc;

  /// No description provided for @recentVisits.
  ///
  /// In en, this message translates to:
  /// **'Recent visits'**
  String get recentVisits;

  /// No description provided for @memberPassSemantics.
  ///
  /// In en, this message translates to:
  /// **'Your REPSI member pass QR code'**
  String get memberPassSemantics;

  /// No description provided for @showFrontDesk.
  ///
  /// In en, this message translates to:
  /// **'Show this to the front desk'**
  String get showFrontDesk;

  /// No description provided for @passRefreshNote.
  ///
  /// In en, this message translates to:
  /// **'It refreshes automatically and only works at your gym. Do not share a screenshot.'**
  String get passRefreshNote;

  /// No description provided for @scanMemberPassDesc.
  ///
  /// In en, this message translates to:
  /// **'Scan a member\'s pass to check them in or out.'**
  String get scanMemberPassDesc;

  /// No description provided for @activity.
  ///
  /// In en, this message translates to:
  /// **'Activity'**
  String get activity;

  /// No description provided for @errorLoadGymVisits.
  ///
  /// In en, this message translates to:
  /// **'Couldn\'t load your gym visits.'**
  String get errorLoadGymVisits;

  /// No description provided for @gymVisits.
  ///
  /// In en, this message translates to:
  /// **'Gym visits'**
  String get gymVisits;

  /// No description provided for @avgVisit.
  ///
  /// In en, this message translates to:
  /// **'Avg. visit'**
  String get avgVisit;

  /// No description provided for @noVisitsStartStreak.
  ///
  /// In en, this message translates to:
  /// **'No visits yet. Check in at your gym to start your streak.'**
  String get noVisitsStartStreak;

  /// No description provided for @inProgress.
  ///
  /// In en, this message translates to:
  /// **'In progress'**
  String get inProgress;

  /// No description provided for @healthStepsAndroidOnly.
  ///
  /// In en, this message translates to:
  /// **'Step tracking needs an Android phone with Health Connect.'**
  String get healthStepsAndroidOnly;

  /// No description provided for @healthConnectFromHome.
  ///
  /// In en, this message translates to:
  /// **'Connect Health Connect from the Home tab to see your steps, distance and active calories here.'**
  String get healthConnectFromHome;

  /// No description provided for @stepsThisWeek.
  ///
  /// In en, this message translates to:
  /// **'Steps this week'**
  String get stepsThisWeek;

  /// No description provided for @stepsChartSemantics.
  ///
  /// In en, this message translates to:
  /// **'Bar chart of steps for the last seven days'**
  String get stepsChartSemantics;

  /// No description provided for @messages.
  ///
  /// In en, this message translates to:
  /// **'Messages'**
  String get messages;

  /// No description provided for @noConversationsTrainer.
  ///
  /// In en, this message translates to:
  /// **'No conversations yet. Open a client and tap Message.'**
  String get noConversationsTrainer;

  /// No description provided for @noConversationsMember.
  ///
  /// In en, this message translates to:
  /// **'Once a trainer is assigned to you, you can message them here.'**
  String get noConversationsMember;

  /// No description provided for @noMessagesYet.
  ///
  /// In en, this message translates to:
  /// **'No messages yet'**
  String get noMessagesYet;

  /// No description provided for @sayHello.
  ///
  /// In en, this message translates to:
  /// **'Say hello to start the conversation.'**
  String get sayHello;

  /// No description provided for @writeMessage.
  ///
  /// In en, this message translates to:
  /// **'Write a message…'**
  String get writeMessage;

  /// No description provided for @sendMessage.
  ///
  /// In en, this message translates to:
  /// **'Send message'**
  String get sendMessage;

  /// No description provided for @chatReadOnly.
  ///
  /// In en, this message translates to:
  /// **'This trainer is no longer assigned, so the conversation is read-only.'**
  String get chatReadOnly;

  /// No description provided for @targetWeight.
  ///
  /// In en, this message translates to:
  /// **'Target weight'**
  String get targetWeight;

  /// No description provided for @repsPerSet.
  ///
  /// In en, this message translates to:
  /// **'Reps per set'**
  String get repsPerSet;

  /// No description provided for @saveSets.
  ///
  /// In en, this message translates to:
  /// **'Save sets'**
  String get saveSets;

  /// No description provided for @todaysWorkout.
  ///
  /// In en, this message translates to:
  /// **'Today\'s workout'**
  String get todaysWorkout;

  /// No description provided for @workoutProgress.
  ///
  /// In en, this message translates to:
  /// **'Workout progress'**
  String get workoutProgress;

  /// No description provided for @targetSixExercises.
  ///
  /// In en, this message translates to:
  /// **'Target: 6 exercises'**
  String get targetSixExercises;

  /// No description provided for @estDuration.
  ///
  /// In en, this message translates to:
  /// **'Est. 45–50 min'**
  String get estDuration;

  /// No description provided for @logged.
  ///
  /// In en, this message translates to:
  /// **'Logged'**
  String get logged;

  /// No description provided for @log.
  ///
  /// In en, this message translates to:
  /// **'Log'**
  String get log;

  /// No description provided for @completeWorkout.
  ///
  /// In en, this message translates to:
  /// **'Complete workout'**
  String get completeWorkout;

  /// No description provided for @workoutSummary.
  ///
  /// In en, this message translates to:
  /// **'Workout summary'**
  String get workoutSummary;

  /// No description provided for @workoutComplete.
  ///
  /// In en, this message translates to:
  /// **'Workout complete!'**
  String get workoutComplete;

  /// No description provided for @workoutRecorded.
  ///
  /// In en, this message translates to:
  /// **'Great work! Upper Body A is saved to your fitness profile.'**
  String get workoutRecorded;

  /// No description provided for @streakPlusOne.
  ///
  /// In en, this message translates to:
  /// **'+1 workout streak'**
  String get streakPlusOne;

  /// No description provided for @streakFive.
  ///
  /// In en, this message translates to:
  /// **'You\'re on fire! 5 days in a row.'**
  String get streakFive;

  /// No description provided for @activeBurn.
  ///
  /// In en, this message translates to:
  /// **'Active burn'**
  String get activeBurn;

  /// No description provided for @duration.
  ///
  /// In en, this message translates to:
  /// **'Duration'**
  String get duration;

  /// No description provided for @exercises.
  ///
  /// In en, this message translates to:
  /// **'Exercises'**
  String get exercises;

  /// No description provided for @totalVolume.
  ///
  /// In en, this message translates to:
  /// **'Total volume'**
  String get totalVolume;

  /// No description provided for @newPersonalRecord.
  ///
  /// In en, this message translates to:
  /// **'New personal record!'**
  String get newPersonalRecord;

  /// No description provided for @howDidItFeel.
  ///
  /// In en, this message translates to:
  /// **'How did this workout feel?'**
  String get howDidItFeel;

  /// No description provided for @saveAndReturn.
  ///
  /// In en, this message translates to:
  /// **'Save and go back'**
  String get saveAndReturn;

  /// No description provided for @workoutSavedSynced.
  ///
  /// In en, this message translates to:
  /// **'Workout saved.'**
  String get workoutSavedSynced;

  /// No description provided for @targetMuscles.
  ///
  /// In en, this message translates to:
  /// **'Target muscles'**
  String get targetMuscles;

  /// No description provided for @sets.
  ///
  /// In en, this message translates to:
  /// **'Sets'**
  String get sets;

  /// No description provided for @reps.
  ///
  /// In en, this message translates to:
  /// **'Reps'**
  String get reps;

  /// No description provided for @rest.
  ///
  /// In en, this message translates to:
  /// **'Rest'**
  String get rest;

  /// No description provided for @whyThisExercise.
  ///
  /// In en, this message translates to:
  /// **'Why this exercise? (Coach\'s note)'**
  String get whyThisExercise;

  /// No description provided for @howToPerform.
  ///
  /// In en, this message translates to:
  /// **'How to do it'**
  String get howToPerform;

  /// No description provided for @favourited.
  ///
  /// In en, this message translates to:
  /// **'Saved to favourites'**
  String get favourited;

  /// No description provided for @favourite.
  ///
  /// In en, this message translates to:
  /// **'Add to favourites'**
  String get favourite;

  /// No description provided for @inWorkoutPlan.
  ///
  /// In en, this message translates to:
  /// **'In workout plan'**
  String get inWorkoutPlan;

  /// No description provided for @addToWorkout.
  ///
  /// In en, this message translates to:
  /// **'Add to workout'**
  String get addToWorkout;

  /// No description provided for @workoutBuilder.
  ///
  /// In en, this message translates to:
  /// **'Workout builder'**
  String get workoutBuilder;

  /// No description provided for @routineName.
  ///
  /// In en, this message translates to:
  /// **'Routine name'**
  String get routineName;

  /// No description provided for @noExercisesSelected.
  ///
  /// In en, this message translates to:
  /// **'No exercises selected.\nTap \"Add to workout\" on any exercise card.'**
  String get noExercisesSelected;

  /// No description provided for @saveWorkout.
  ///
  /// In en, this message translates to:
  /// **'Save workout'**
  String get saveWorkout;

  /// No description provided for @exerciseLibrary.
  ///
  /// In en, this message translates to:
  /// **'Exercise library'**
  String get exerciseLibrary;

  /// No description provided for @searchExercises.
  ///
  /// In en, this message translates to:
  /// **'Search exercises (e.g. chest dumbbell)'**
  String get searchExercises;

  /// No description provided for @trainerCues.
  ///
  /// In en, this message translates to:
  /// **'Trainer tips'**
  String get trainerCues;

  /// No description provided for @noExercisesMatch.
  ///
  /// In en, this message translates to:
  /// **'No exercises match your filters'**
  String get noExercisesMatch;

  /// No description provided for @resetFilters.
  ///
  /// In en, this message translates to:
  /// **'Reset filters'**
  String get resetFilters;

  /// No description provided for @demo.
  ///
  /// In en, this message translates to:
  /// **'Demo'**
  String get demo;

  /// No description provided for @added.
  ///
  /// In en, this message translates to:
  /// **'Added'**
  String get added;

  /// No description provided for @readyToBuild.
  ///
  /// In en, this message translates to:
  /// **'Ready to build your routine'**
  String get readyToBuild;

  /// No description provided for @buildWorkout.
  ///
  /// In en, this message translates to:
  /// **'Build workout'**
  String get buildWorkout;

  /// No description provided for @trainerDietTitle.
  ///
  /// In en, this message translates to:
  /// **'{name} · Diet'**
  String trainerDietTitle(String name);

  /// No description provided for @dietEatenToday.
  ///
  /// In en, this message translates to:
  /// **'Eaten today: {calories} kcal · {protein} g protein'**
  String dietEatenToday(String calories, String protein);

  /// No description provided for @dietOfTarget.
  ///
  /// In en, this message translates to:
  /// **'of {target} kcal'**
  String dietOfTarget(String target);

  /// No description provided for @dietWater.
  ///
  /// In en, this message translates to:
  /// **'Water: {amount} ml'**
  String dietWater(String amount);

  /// No description provided for @dietWaterOfTarget.
  ///
  /// In en, this message translates to:
  /// **'Water: {amount} / {target} ml'**
  String dietWaterOfTarget(String amount, String target);

  /// No description provided for @dietAdherence.
  ///
  /// In en, this message translates to:
  /// **'Followed {followed} · Modified {modified} · Skipped {skipped} · Not logged {notLogged}'**
  String dietAdherence(
      String followed, String modified, String skipped, String notLogged);

  /// No description provided for @mealBreakfast.
  ///
  /// In en, this message translates to:
  /// **'Breakfast'**
  String get mealBreakfast;

  /// No description provided for @mealMorningSnack.
  ///
  /// In en, this message translates to:
  /// **'Morning snack'**
  String get mealMorningSnack;

  /// No description provided for @mealLunch.
  ///
  /// In en, this message translates to:
  /// **'Lunch'**
  String get mealLunch;

  /// No description provided for @mealEveningSnack.
  ///
  /// In en, this message translates to:
  /// **'Evening snack'**
  String get mealEveningSnack;

  /// No description provided for @mealDinner.
  ///
  /// In en, this message translates to:
  /// **'Dinner'**
  String get mealDinner;

  /// No description provided for @mealPreWorkout.
  ///
  /// In en, this message translates to:
  /// **'Pre-workout'**
  String get mealPreWorkout;

  /// No description provided for @mealPostWorkout.
  ///
  /// In en, this message translates to:
  /// **'Post-workout'**
  String get mealPostWorkout;

  /// No description provided for @trainerSessionStarted.
  ///
  /// In en, this message translates to:
  /// **'Session started with {name}'**
  String trainerSessionStarted(String name);

  /// No description provided for @trainerSessionStarting.
  ///
  /// In en, this message translates to:
  /// **'Starting session with {name}'**
  String trainerSessionStarting(String name);

  /// No description provided for @trainerWeightAttendance.
  ///
  /// In en, this message translates to:
  /// **'Weight: {weight} · Attendance: {attendance}'**
  String trainerWeightAttendance(String weight, String attendance);

  /// No description provided for @trainerAddedExercise.
  ///
  /// In en, this message translates to:
  /// **'Added {name} to workout'**
  String trainerAddedExercise(String name);

  /// No description provided for @trainerAssignTo.
  ///
  /// In en, this message translates to:
  /// **'Assign \"{name}\" to:'**
  String trainerAssignTo(String name);

  /// No description provided for @trainerAssigned.
  ///
  /// In en, this message translates to:
  /// **'{workout} assigned to {name}'**
  String trainerAssigned(String workout, String name);

  /// No description provided for @trainerExercisesCount.
  ///
  /// In en, this message translates to:
  /// **'Exercises ({count})'**
  String trainerExercisesCount(int count);

  /// No description provided for @trainerSetsRepsWeight.
  ///
  /// In en, this message translates to:
  /// **'{sets} sets × {reps} reps · {weight}'**
  String trainerSetsRepsWeight(String sets, String reps, String weight);

  /// No description provided for @trainerRest.
  ///
  /// In en, this message translates to:
  /// **'Rest: {value}'**
  String trainerRest(String value);

  /// No description provided for @trainerTempo.
  ///
  /// In en, this message translates to:
  /// **'Tempo: {value}'**
  String trainerTempo(String value);

  /// No description provided for @adminOwnerPlan.
  ///
  /// In en, this message translates to:
  /// **'Owner: {owner} · {plan}'**
  String adminOwnerPlan(String owner, String plan);

  /// No description provided for @comingSoon.
  ///
  /// In en, this message translates to:
  /// **'{feature} is coming soon'**
  String comingSoon(String feature);

  /// No description provided for @onboardingStep.
  ///
  /// In en, this message translates to:
  /// **'Step {current} of {total}'**
  String onboardingStep(int current, int total);

  /// No description provided for @onboarding1Lead.
  ///
  /// In en, this message translates to:
  /// **'Manage. Train.'**
  String get onboarding1Lead;

  /// No description provided for @onboarding1Accent.
  ///
  /// In en, this message translates to:
  /// **'Grow.'**
  String get onboarding1Accent;

  /// No description provided for @onboarding1Body.
  ///
  /// In en, this message translates to:
  /// **'One app for your gym: check-ins, memberships, payments and training, for owners, trainers and members.'**
  String get onboarding1Body;

  /// No description provided for @onboarding2Lead.
  ///
  /// In en, this message translates to:
  /// **'Manage'**
  String get onboarding2Lead;

  /// No description provided for @onboarding2Accent.
  ///
  /// In en, this message translates to:
  /// **'members'**
  String get onboarding2Accent;

  /// No description provided for @onboarding2Tail.
  ///
  /// In en, this message translates to:
  /// **'easily'**
  String get onboarding2Tail;

  /// No description provided for @onboarding2Body.
  ///
  /// In en, this message translates to:
  /// **'Memberships, attendance and dues for every member, with expiries flagged before they lapse.'**
  String get onboarding2Body;

  /// No description provided for @onboarding3Lead.
  ///
  /// In en, this message translates to:
  /// **'Insights that'**
  String get onboarding3Lead;

  /// No description provided for @onboarding3Accent.
  ///
  /// In en, this message translates to:
  /// **'matter'**
  String get onboarding3Accent;

  /// No description provided for @onboarding3Body.
  ///
  /// In en, this message translates to:
  /// **'Check-ins, renewals and revenue at a glance, so you can act before members drop off.'**
  String get onboarding3Body;

  /// No description provided for @trainerAdded.
  ///
  /// In en, this message translates to:
  /// **'Trainer added'**
  String get trainerAdded;

  /// No description provided for @trainerAddFailed.
  ///
  /// In en, this message translates to:
  /// **'Couldn\'t add the trainer. Please check the details.'**
  String get trainerAddFailed;

  /// No description provided for @addNewTrainer.
  ///
  /// In en, this message translates to:
  /// **'Add new trainer'**
  String get addNewTrainer;

  /// No description provided for @trainerNameHint.
  ///
  /// In en, this message translates to:
  /// **'e.g. Arun Kumar'**
  String get trainerNameHint;

  /// No description provided for @trainerNameRequired.
  ///
  /// In en, this message translates to:
  /// **'Trainer name is required'**
  String get trainerNameRequired;

  /// No description provided for @mobileRequiredLabel.
  ///
  /// In en, this message translates to:
  /// **'Mobile number *'**
  String get mobileRequiredLabel;

  /// No description provided for @mobileRequired.
  ///
  /// In en, this message translates to:
  /// **'Mobile number is required'**
  String get mobileRequired;

  /// No description provided for @emailOptional.
  ///
  /// In en, this message translates to:
  /// **'Email address (optional)'**
  String get emailOptional;

  /// No description provided for @specialization.
  ///
  /// In en, this message translates to:
  /// **'Specialisation'**
  String get specialization;

  /// No description provided for @hourlyRateOptional.
  ///
  /// In en, this message translates to:
  /// **'Hourly rate (₹) (optional)'**
  String get hourlyRateOptional;

  /// No description provided for @bioOptional.
  ///
  /// In en, this message translates to:
  /// **'Bio / experience (optional)'**
  String get bioOptional;

  /// No description provided for @bioHint.
  ///
  /// In en, this message translates to:
  /// **'e.g. Certified trainer with 5+ years of experience…'**
  String get bioHint;

  /// No description provided for @saveTrainer.
  ///
  /// In en, this message translates to:
  /// **'Save trainer'**
  String get saveTrainer;

  /// No description provided for @openFromMyClients.
  ///
  /// In en, this message translates to:
  /// **'Open this client from My clients to message them or see their diet.'**
  String get openFromMyClients;

  /// No description provided for @message.
  ///
  /// In en, this message translates to:
  /// **'Message'**
  String get message;

  /// No description provided for @dietPlan.
  ///
  /// In en, this message translates to:
  /// **'Diet plan'**
  String get dietPlan;

  /// No description provided for @errorLoadAdherence.
  ///
  /// In en, this message translates to:
  /// **'Couldn\'t load diet adherence.'**
  String get errorLoadAdherence;

  /// No description provided for @noDietPlan.
  ///
  /// In en, this message translates to:
  /// **'No diet plan assigned.'**
  String get noDietPlan;

  /// No description provided for @dietAdherenceTitle.
  ///
  /// In en, this message translates to:
  /// **'Diet adherence · last 7 days'**
  String get dietAdherenceTitle;

  /// No description provided for @myClients.
  ///
  /// In en, this message translates to:
  /// **'My clients'**
  String get myClients;

  /// No description provided for @searchClients.
  ///
  /// In en, this message translates to:
  /// **'Search clients'**
  String get searchClients;

  /// No description provided for @activeMembershipsOnly.
  ///
  /// In en, this message translates to:
  /// **'Active memberships only'**
  String get activeMembershipsOnly;

  /// No description provided for @noClientsAssigned.
  ///
  /// In en, this message translates to:
  /// **'No members are assigned to you yet.'**
  String get noClientsAssigned;

  /// No description provided for @noClientsMatch.
  ///
  /// In en, this message translates to:
  /// **'No clients match your search.'**
  String get noClientsMatch;

  /// No description provided for @noDietPlanMember.
  ///
  /// In en, this message translates to:
  /// **'Your trainer hasn\'t assigned a diet plan yet.'**
  String get noDietPlanMember;

  /// No description provided for @noDietPlanTrainer.
  ///
  /// In en, this message translates to:
  /// **'No diet plan assigned. Assign one from the web dashboard.'**
  String get noDietPlanTrainer;

  /// No description provided for @addWater.
  ///
  /// In en, this message translates to:
  /// **'+250 ml'**
  String get addWater;

  /// No description provided for @coachingWorkspace.
  ///
  /// In en, this message translates to:
  /// **'Coaching workspace'**
  String get coachingWorkspace;

  /// No description provided for @todaysClients.
  ///
  /// In en, this message translates to:
  /// **'Today\'s clients'**
  String get todaysClients;

  /// No description provided for @pendingPlans.
  ///
  /// In en, this message translates to:
  /// **'Pending plans'**
  String get pendingPlans;

  /// No description provided for @clientChat.
  ///
  /// In en, this message translates to:
  /// **'Client chat'**
  String get clientChat;

  /// No description provided for @todaysSessions.
  ///
  /// In en, this message translates to:
  /// **'Today\'s sessions'**
  String get todaysSessions;

  /// No description provided for @fullSchedule.
  ///
  /// In en, this message translates to:
  /// **'Full schedule →'**
  String get fullSchedule;

  /// No description provided for @nextUp.
  ///
  /// In en, this message translates to:
  /// **'Next up'**
  String get nextUp;

  /// No description provided for @startSession.
  ///
  /// In en, this message translates to:
  /// **'Start session'**
  String get startSession;

  /// No description provided for @myProfile.
  ///
  /// In en, this message translates to:
  /// **'My profile'**
  String get myProfile;

  /// No description provided for @mySchedule.
  ///
  /// In en, this message translates to:
  /// **'My schedule'**
  String get mySchedule;

  /// No description provided for @workoutTemplates.
  ///
  /// In en, this message translates to:
  /// **'Workout templates'**
  String get workoutTemplates;

  /// No description provided for @dietTemplates.
  ///
  /// In en, this message translates to:
  /// **'Diet templates'**
  String get dietTemplates;

  /// No description provided for @start.
  ///
  /// In en, this message translates to:
  /// **'Start'**
  String get start;

  /// No description provided for @upcoming.
  ///
  /// In en, this message translates to:
  /// **'Upcoming'**
  String get upcoming;

  /// No description provided for @assignToClient.
  ///
  /// In en, this message translates to:
  /// **'Assign to client'**
  String get assignToClient;

  /// No description provided for @assignNow.
  ///
  /// In en, this message translates to:
  /// **'Assign'**
  String get assignNow;

  /// No description provided for @programTitle.
  ///
  /// In en, this message translates to:
  /// **'Program title'**
  String get programTitle;

  /// No description provided for @addExercise.
  ///
  /// In en, this message translates to:
  /// **'Add exercise'**
  String get addExercise;

  /// No description provided for @saveAsTemplate.
  ///
  /// In en, this message translates to:
  /// **'Save as gym template'**
  String get saveAsTemplate;

  /// No description provided for @notOnPlan.
  ///
  /// In en, this message translates to:
  /// **'Not on your plan'**
  String get notOnPlan;

  /// No description provided for @errorLoadInsights.
  ///
  /// In en, this message translates to:
  /// **'Couldn\'t load insights'**
  String get errorLoadInsights;

  /// No description provided for @insightsUpgrade.
  ///
  /// In en, this message translates to:
  /// **'Business insights are part of higher REPSI plans. Upgrade on repsi.app to turn them on.'**
  String get insightsUpgrade;

  /// No description provided for @summaryByAi.
  ///
  /// In en, this message translates to:
  /// **'Summary by AI'**
  String get summaryByAi;

  /// No description provided for @summary.
  ///
  /// In en, this message translates to:
  /// **'Summary'**
  String get summary;

  /// No description provided for @whatStandsOut.
  ///
  /// In en, this message translates to:
  /// **'What stands out'**
  String get whatStandsOut;

  /// No description provided for @suggestedNextSteps.
  ///
  /// In en, this message translates to:
  /// **'Suggested next steps'**
  String get suggestedNextSteps;

  /// No description provided for @goalMuscleGain.
  ///
  /// In en, this message translates to:
  /// **'Muscle gain'**
  String get goalMuscleGain;

  /// No description provided for @goalFatLoss.
  ///
  /// In en, this message translates to:
  /// **'Fat loss & tone'**
  String get goalFatLoss;

  /// No description provided for @goalStrength.
  ///
  /// In en, this message translates to:
  /// **'Strength'**
  String get goalStrength;

  /// No description provided for @goalEndurance.
  ///
  /// In en, this message translates to:
  /// **'Endurance & stamina'**
  String get goalEndurance;

  /// No description provided for @goalWellness.
  ///
  /// In en, this message translates to:
  /// **'General wellness'**
  String get goalWellness;

  /// No description provided for @expBeginner.
  ///
  /// In en, this message translates to:
  /// **'Beginner (< 1 yr)'**
  String get expBeginner;

  /// No description provided for @expIntermediate.
  ///
  /// In en, this message translates to:
  /// **'Intermediate (1–3 yrs)'**
  String get expIntermediate;

  /// No description provided for @expAdvanced.
  ///
  /// In en, this message translates to:
  /// **'Advanced (3+ yrs)'**
  String get expAdvanced;

  /// No description provided for @equipFullGym.
  ///
  /// In en, this message translates to:
  /// **'Full gym'**
  String get equipFullGym;

  /// No description provided for @equipDumbbells.
  ///
  /// In en, this message translates to:
  /// **'Dumbbells & bench'**
  String get equipDumbbells;

  /// No description provided for @equipBodyweight.
  ///
  /// In en, this message translates to:
  /// **'Bodyweight at home'**
  String get equipBodyweight;

  /// No description provided for @safetyGuidelines.
  ///
  /// In en, this message translates to:
  /// **'Safety guidelines'**
  String get safetyGuidelines;

  /// No description provided for @aiPowered.
  ///
  /// In en, this message translates to:
  /// **'AI powered'**
  String get aiPowered;

  /// No description provided for @tailoredRoutine.
  ///
  /// In en, this message translates to:
  /// **'Your personal routine'**
  String get tailoredRoutine;

  /// No description provided for @aiCoachIntro.
  ///
  /// In en, this message translates to:
  /// **'Answer a few questions to build a progressive plan for your equipment and goals.'**
  String get aiCoachIntro;

  /// No description provided for @aiQ1.
  ///
  /// In en, this message translates to:
  /// **'1. What is your main fitness goal?'**
  String get aiQ1;

  /// No description provided for @aiQ2.
  ///
  /// In en, this message translates to:
  /// **'2. Training experience'**
  String get aiQ2;

  /// No description provided for @aiQ3.
  ///
  /// In en, this message translates to:
  /// **'3. Training days per week'**
  String get aiQ3;

  /// No description provided for @aiQ4.
  ///
  /// In en, this message translates to:
  /// **'4. Equipment available'**
  String get aiQ4;

  /// No description provided for @generateRoutine.
  ///
  /// In en, this message translates to:
  /// **'Create my plan'**
  String get generateRoutine;

  /// No description provided for @personalizeAi.
  ///
  /// In en, this message translates to:
  /// **'Personalise'**
  String get personalizeAi;

  /// No description provided for @noPlanForCriteria.
  ///
  /// In en, this message translates to:
  /// **'No plan is available for these choices.'**
  String get noPlanForCriteria;

  /// No description provided for @aiTailored.
  ///
  /// In en, this message translates to:
  /// **'Made by AI'**
  String get aiTailored;

  /// No description provided for @verifiedSplit.
  ///
  /// In en, this message translates to:
  /// **'Coach-verified plan'**
  String get verifiedSplit;

  /// No description provided for @startThisWorkout.
  ///
  /// In en, this message translates to:
  /// **'Start this workout'**
  String get startThisWorkout;

  /// No description provided for @coachTips.
  ///
  /// In en, this message translates to:
  /// **'Coach tips'**
  String get coachTips;

  /// No description provided for @safetyDisclaimerTitle.
  ///
  /// In en, this message translates to:
  /// **'Safety & medical disclaimer'**
  String get safetyDisclaimerTitle;

  /// No description provided for @safetyDisclaimerBody.
  ///
  /// In en, this message translates to:
  /// **'REPSI AI Workout Coach gives general exercise suggestions based on sports science and automated generation. It does not replace personal medical advice or a fitness consultation. Stop exercising immediately if you feel dizzy, have sharp pain or are short of breath.'**
  String get safetyDisclaimerBody;

  /// No description provided for @understood.
  ///
  /// In en, this message translates to:
  /// **'Understood'**
  String get understood;

  /// No description provided for @aiPlanUpperLowerTitle.
  ///
  /// In en, this message translates to:
  /// **'4-day upper / lower routine'**
  String get aiPlanUpperLowerTitle;

  /// No description provided for @aiPlanUpperLowerBody.
  ///
  /// In en, this message translates to:
  /// **'A balanced muscle-building routine with progressive overload and enough time for joints to recover.'**
  String get aiPlanUpperLowerBody;

  /// No description provided for @aiPlanFatLossTitle.
  ///
  /// In en, this message translates to:
  /// **'Metabolic conditioning split'**
  String get aiPlanFatLossTitle;

  /// No description provided for @aiPlanFatLossBody.
  ///
  /// In en, this message translates to:
  /// **'Compound lifts with short rests to keep muscle while burning more calories.'**
  String get aiPlanFatLossBody;

  /// No description provided for @aiPlanStrengthTitle.
  ///
  /// In en, this message translates to:
  /// **'Compound strength foundation'**
  String get aiPlanStrengthTitle;

  /// No description provided for @aiPlanStrengthBody.
  ///
  /// In en, this message translates to:
  /// **'Heavy multi-joint barbell lifts at RPE 8–9 to build maximum strength.'**
  String get aiPlanStrengthBody;

  /// No description provided for @aiDay1.
  ///
  /// In en, this message translates to:
  /// **'Day 1: Upper body power'**
  String get aiDay1;

  /// No description provided for @aiCueBench.
  ///
  /// In en, this message translates to:
  /// **'Drive through your heels and keep a slight arch'**
  String get aiCueBench;

  /// No description provided for @aiCueRow.
  ///
  /// In en, this message translates to:
  /// **'Keep a neutral spine and pull to your sternum'**
  String get aiCueRow;

  /// No description provided for @aiDay2.
  ///
  /// In en, this message translates to:
  /// **'Day 2: Lower body muscle building'**
  String get aiDay2;

  /// No description provided for @aiCueSquat.
  ///
  /// In en, this message translates to:
  /// **'Bend at the knees and hips together'**
  String get aiCueSquat;

  /// No description provided for @aiCueRdl.
  ///
  /// In en, this message translates to:
  /// **'Hinge back with soft knees and feel your hamstrings'**
  String get aiCueRdl;

  /// No description provided for @aiDay3.
  ///
  /// In en, this message translates to:
  /// **'Day 3: Upper body & arms'**
  String get aiDay3;

  /// No description provided for @aiDay4.
  ///
  /// In en, this message translates to:
  /// **'Day 4: Lower body & core'**
  String get aiDay4;

  /// No description provided for @aiTipHydrate.
  ///
  /// In en, this message translates to:
  /// **'Drink at least 500 ml of water before training.'**
  String get aiTipHydrate;

  /// No description provided for @aiTipWarmup.
  ///
  /// In en, this message translates to:
  /// **'Warm up with 5–10 minutes of mobility work and 2 light sets before each compound lift.'**
  String get aiTipWarmup;

  /// No description provided for @aiTipProgress.
  ///
  /// In en, this message translates to:
  /// **'Try to add weight or reps on your main lifts every 1–2 weeks.'**
  String get aiTipProgress;

  /// No description provided for @aiPersonalisedNotice.
  ///
  /// In en, this message translates to:
  /// **'Personalised by REPSI AI'**
  String get aiPersonalisedNotice;

  /// No description provided for @aiDisclaimer.
  ///
  /// In en, this message translates to:
  /// **'Always check with your doctor before starting a new exercise routine. Listen to your body and stop if you feel unusual discomfort.'**
  String get aiDisclaimer;

  /// No description provided for @aiWorkoutDay.
  ///
  /// In en, this message translates to:
  /// **'Workout day'**
  String get aiWorkoutDay;

  /// No description provided for @aiPersonalPlan.
  ///
  /// In en, this message translates to:
  /// **'Personal workout plan'**
  String get aiPersonalPlan;

  /// No description provided for @aiDisclaimerShort.
  ///
  /// In en, this message translates to:
  /// **'Always check with your doctor before starting an exercise programme.'**
  String get aiDisclaimerShort;

  /// No description provided for @platformAnalytics.
  ///
  /// In en, this message translates to:
  /// **'Platform analytics'**
  String get platformAnalytics;

  /// No description provided for @platformMrrGrowth.
  ///
  /// In en, this message translates to:
  /// **'Platform MRR growth'**
  String get platformMrrGrowth;

  /// No description provided for @platformHealth.
  ///
  /// In en, this message translates to:
  /// **'Platform health'**
  String get platformHealth;

  /// No description provided for @apiResponseTime.
  ///
  /// In en, this message translates to:
  /// **'API response time (P95)'**
  String get apiResponseTime;

  /// No description provided for @activeGymLicences.
  ///
  /// In en, this message translates to:
  /// **'Active gym licences'**
  String get activeGymLicences;

  /// No description provided for @totalCheckinsToday.
  ///
  /// In en, this message translates to:
  /// **'Total check-ins (today)'**
  String get totalCheckinsToday;

  /// No description provided for @systemAdmin.
  ///
  /// In en, this message translates to:
  /// **'System Admin'**
  String get systemAdmin;

  /// No description provided for @platformMetrics.
  ///
  /// In en, this message translates to:
  /// **'Platform-wide metrics'**
  String get platformMetrics;

  /// No description provided for @totalGyms.
  ///
  /// In en, this message translates to:
  /// **'Total gyms'**
  String get totalGyms;

  /// No description provided for @plusThreeThisMonth.
  ///
  /// In en, this message translates to:
  /// **'+3 this month'**
  String get plusThreeThisMonth;

  /// No description provided for @activeUsers.
  ///
  /// In en, this message translates to:
  /// **'Active users'**
  String get activeUsers;

  /// No description provided for @payingMembers.
  ///
  /// In en, this message translates to:
  /// **'Paying members'**
  String get payingMembers;

  /// No description provided for @acrossAllGyms.
  ///
  /// In en, this message translates to:
  /// **'Across all gyms'**
  String get acrossAllGyms;

  /// No description provided for @platformRevenue.
  ///
  /// In en, this message translates to:
  /// **'Platform revenue'**
  String get platformRevenue;

  /// No description provided for @mrrThisMonth.
  ///
  /// In en, this message translates to:
  /// **'MRR this month'**
  String get mrrThisMonth;

  /// No description provided for @subscriptions.
  ///
  /// In en, this message translates to:
  /// **'Subscriptions'**
  String get subscriptions;

  /// No description provided for @allServicesOk.
  ///
  /// In en, this message translates to:
  /// **'All platform services are running'**
  String get allServicesOk;

  /// No description provided for @searchGymsHint.
  ///
  /// In en, this message translates to:
  /// **'Search gyms by name or owner…'**
  String get searchGymsHint;

  /// No description provided for @systemSettings.
  ///
  /// In en, this message translates to:
  /// **'System settings'**
  String get systemSettings;

  /// No description provided for @securityCompliance.
  ///
  /// In en, this message translates to:
  /// **'Security & compliance'**
  String get securityCompliance;

  /// No description provided for @apiWebhooks.
  ///
  /// In en, this message translates to:
  /// **'API & webhooks'**
  String get apiWebhooks;

  /// No description provided for @systemAlerts.
  ///
  /// In en, this message translates to:
  /// **'System alerts'**
  String get systemAlerts;

  /// No description provided for @platformSupport.
  ///
  /// In en, this message translates to:
  /// **'Platform support'**
  String get platformSupport;

  /// No description provided for @systemAdminSettings.
  ///
  /// In en, this message translates to:
  /// **'Admin settings'**
  String get systemAdminSettings;

  /// No description provided for @superAdministrator.
  ///
  /// In en, this message translates to:
  /// **'Super Administrator'**
  String get superAdministrator;

  /// No description provided for @searchUsersHint.
  ///
  /// In en, this message translates to:
  /// **'Search users across all gyms…'**
  String get searchUsersHint;

  /// No description provided for @skip.
  ///
  /// In en, this message translates to:
  /// **'Skip'**
  String get skip;

  /// No description provided for @getStarted.
  ///
  /// In en, this message translates to:
  /// **'Get started'**
  String get getStarted;

  /// No description provided for @next.
  ///
  /// In en, this message translates to:
  /// **'Next'**
  String get next;

  /// No description provided for @gymPass.
  ///
  /// In en, this message translates to:
  /// **'Gym pass'**
  String get gymPass;

  /// No description provided for @checkedIn.
  ///
  /// In en, this message translates to:
  /// **'Checked in'**
  String get checkedIn;

  /// No description provided for @dashboard.
  ///
  /// In en, this message translates to:
  /// **'Dashboard'**
  String get dashboard;

  /// No description provided for @revenue.
  ///
  /// In en, this message translates to:
  /// **'Revenue'**
  String get revenue;

  /// No description provided for @dailyCheckins.
  ///
  /// In en, this message translates to:
  /// **'Daily check-ins'**
  String get dailyCheckins;

  /// No description provided for @mealSnack.
  ///
  /// In en, this message translates to:
  /// **'Snack'**
  String get mealSnack;

  /// No description provided for @mealStatusEaten.
  ///
  /// In en, this message translates to:
  /// **'Eaten'**
  String get mealStatusEaten;

  /// No description provided for @mealStatusModified.
  ///
  /// In en, this message translates to:
  /// **'Modified'**
  String get mealStatusModified;

  /// No description provided for @mealStatusSkipped.
  ///
  /// In en, this message translates to:
  /// **'Skipped'**
  String get mealStatusSkipped;

  /// No description provided for @dashTrendPercent.
  ///
  /// In en, this message translates to:
  /// **'{value}%'**
  String dashTrendPercent(String value);

  /// No description provided for @myCustomRoutine.
  ///
  /// In en, this message translates to:
  /// **'My routine'**
  String get myCustomRoutine;

  /// No description provided for @yourGymLinkPlaceholder.
  ///
  /// In en, this message translates to:
  /// **'your-gym'**
  String get yourGymLinkPlaceholder;

  /// No description provided for @memberNoteMeta.
  ///
  /// In en, this message translates to:
  /// **'{author} · {date}'**
  String memberNoteMeta(String author, String date);

  /// No description provided for @membershipPayment.
  ///
  /// In en, this message translates to:
  /// **'Membership payment'**
  String get membershipPayment;

  /// No description provided for @languageMenuSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Choose the app language'**
  String get languageMenuSubtitle;

  /// No description provided for @specPersonalTraining.
  ///
  /// In en, this message translates to:
  /// **'Personal Training'**
  String get specPersonalTraining;

  /// No description provided for @specHiit.
  ///
  /// In en, this message translates to:
  /// **'HIIT & Functional'**
  String get specHiit;

  /// No description provided for @specCrossfit.
  ///
  /// In en, this message translates to:
  /// **'CrossFit'**
  String get specCrossfit;

  /// No description provided for @specYoga.
  ///
  /// In en, this message translates to:
  /// **'Yoga & Mobility'**
  String get specYoga;

  /// No description provided for @specRehab.
  ///
  /// In en, this message translates to:
  /// **'Rehabilitation'**
  String get specRehab;

  /// No description provided for @specGeneral.
  ///
  /// In en, this message translates to:
  /// **'General Fitness'**
  String get specGeneral;

  /// No description provided for @exCatChest.
  ///
  /// In en, this message translates to:
  /// **'Chest'**
  String get exCatChest;

  /// No description provided for @exCatBack.
  ///
  /// In en, this message translates to:
  /// **'Back'**
  String get exCatBack;

  /// No description provided for @exCatLegs.
  ///
  /// In en, this message translates to:
  /// **'Legs'**
  String get exCatLegs;

  /// No description provided for @exCatShoulders.
  ///
  /// In en, this message translates to:
  /// **'Shoulders'**
  String get exCatShoulders;

  /// No description provided for @exCatArms.
  ///
  /// In en, this message translates to:
  /// **'Arms'**
  String get exCatArms;

  /// No description provided for @exCatCore.
  ///
  /// In en, this message translates to:
  /// **'Core'**
  String get exCatCore;

  /// No description provided for @exCatCardio.
  ///
  /// In en, this message translates to:
  /// **'Cardio'**
  String get exCatCardio;

  /// No description provided for @exCatFullBody.
  ///
  /// In en, this message translates to:
  /// **'Full Body'**
  String get exCatFullBody;

  /// No description provided for @exEqAll.
  ///
  /// In en, this message translates to:
  /// **'All equipment'**
  String get exEqAll;

  /// No description provided for @exEqNone.
  ///
  /// In en, this message translates to:
  /// **'No equipment'**
  String get exEqNone;

  /// No description provided for @exEqDumbbells.
  ///
  /// In en, this message translates to:
  /// **'Dumbbells'**
  String get exEqDumbbells;

  /// No description provided for @exEqBarbell.
  ///
  /// In en, this message translates to:
  /// **'Barbell'**
  String get exEqBarbell;

  /// No description provided for @exEqCable.
  ///
  /// In en, this message translates to:
  /// **'Cable'**
  String get exEqCable;

  /// No description provided for @exEqMachine.
  ///
  /// In en, this message translates to:
  /// **'Machine'**
  String get exEqMachine;

  /// No description provided for @exEqKettlebell.
  ///
  /// In en, this message translates to:
  /// **'Kettlebell'**
  String get exEqKettlebell;

  /// No description provided for @exEqBand.
  ///
  /// In en, this message translates to:
  /// **'Resistance band'**
  String get exEqBand;

  /// No description provided for @exEqSmith.
  ///
  /// In en, this message translates to:
  /// **'Smith machine'**
  String get exEqSmith;

  /// No description provided for @exLvlAll.
  ///
  /// In en, this message translates to:
  /// **'All levels'**
  String get exLvlAll;

  /// No description provided for @exLvlBeginner.
  ///
  /// In en, this message translates to:
  /// **'Beginner'**
  String get exLvlBeginner;

  /// No description provided for @exLvlIntermediate.
  ///
  /// In en, this message translates to:
  /// **'Intermediate'**
  String get exLvlIntermediate;

  /// No description provided for @exLvlAdvanced.
  ///
  /// In en, this message translates to:
  /// **'Advanced'**
  String get exLvlAdvanced;

  /// No description provided for @exTypeStrength.
  ///
  /// In en, this message translates to:
  /// **'Strength'**
  String get exTypeStrength;

  /// No description provided for @exTypeHypertrophy.
  ///
  /// In en, this message translates to:
  /// **'Muscle building'**
  String get exTypeHypertrophy;

  /// No description provided for @exTypeEndurance.
  ///
  /// In en, this message translates to:
  /// **'Endurance'**
  String get exTypeEndurance;

  /// No description provided for @exMuscleMidChest.
  ///
  /// In en, this message translates to:
  /// **'Mid chest'**
  String get exMuscleMidChest;

  /// No description provided for @exMuscleUpperChest.
  ///
  /// In en, this message translates to:
  /// **'Upper chest'**
  String get exMuscleUpperChest;

  /// No description provided for @exMuscleFrontDelts.
  ///
  /// In en, this message translates to:
  /// **'Front shoulders'**
  String get exMuscleFrontDelts;

  /// No description provided for @exMuscleTriceps.
  ///
  /// In en, this message translates to:
  /// **'Triceps'**
  String get exMuscleTriceps;

  /// No description provided for @exMuscleBiceps.
  ///
  /// In en, this message translates to:
  /// **'Biceps'**
  String get exMuscleBiceps;

  /// No description provided for @exMuscleQuads.
  ///
  /// In en, this message translates to:
  /// **'Quadriceps'**
  String get exMuscleQuads;

  /// No description provided for @exMuscleHamstrings.
  ///
  /// In en, this message translates to:
  /// **'Hamstrings'**
  String get exMuscleHamstrings;

  /// No description provided for @exMuscleGlutes.
  ///
  /// In en, this message translates to:
  /// **'Glutes'**
  String get exMuscleGlutes;

  /// No description provided for @exMuscleLowerBack.
  ///
  /// In en, this message translates to:
  /// **'Lower back'**
  String get exMuscleLowerBack;

  /// No description provided for @exMuscleLats.
  ///
  /// In en, this message translates to:
  /// **'Lats'**
  String get exMuscleLats;

  /// No description provided for @exMuscleRearDelts.
  ///
  /// In en, this message translates to:
  /// **'Rear shoulders'**
  String get exMuscleRearDelts;

  /// No description provided for @exMuscleForearms.
  ///
  /// In en, this message translates to:
  /// **'Forearms'**
  String get exMuscleForearms;

  /// No description provided for @exMuscleLowerAbs.
  ///
  /// In en, this message translates to:
  /// **'Lower abs'**
  String get exMuscleLowerAbs;

  /// No description provided for @exMuscleGrip.
  ///
  /// In en, this message translates to:
  /// **'Grip strength'**
  String get exMuscleGrip;

  /// No description provided for @exMuscleUpperBack.
  ///
  /// In en, this message translates to:
  /// **'Upper back & rhomboids'**
  String get exMuscleUpperBack;

  /// No description provided for @exMuscleTraps.
  ///
  /// In en, this message translates to:
  /// **'Traps'**
  String get exMuscleTraps;

  /// No description provided for @exMuscleObliques.
  ///
  /// In en, this message translates to:
  /// **'Obliques'**
  String get exMuscleObliques;

  /// No description provided for @exMuscleHipFlexors.
  ///
  /// In en, this message translates to:
  /// **'Hip flexors'**
  String get exMuscleHipFlexors;

  /// No description provided for @exStepBench1.
  ///
  /// In en, this message translates to:
  /// **'Lie flat on the bench with your eyes directly under the bar.'**
  String get exStepBench1;

  /// No description provided for @exStepBench2.
  ///
  /// In en, this message translates to:
  /// **'Grip the barbell slightly wider than shoulder-width.'**
  String get exStepBench2;

  /// No description provided for @exStepBench3.
  ///
  /// In en, this message translates to:
  /// **'Unrack the weight and brace your core, pinching your shoulder blades together.'**
  String get exStepBench3;

  /// No description provided for @exStepBench4.
  ///
  /// In en, this message translates to:
  /// **'Lower the bar under control toward your lower sternum.'**
  String get exStepBench4;

  /// No description provided for @exStepBench5.
  ///
  /// In en, this message translates to:
  /// **'Press explosively back up to full lockout.'**
  String get exStepBench5;

  /// No description provided for @exNoteBench.
  ///
  /// In en, this message translates to:
  /// **'Drive your feet firmly into the ground and keep your back neutral.'**
  String get exNoteBench;

  /// No description provided for @exStepIncline1.
  ///
  /// In en, this message translates to:
  /// **'Set an adjustable bench to a 30 to 45 degree incline.'**
  String get exStepIncline1;

  /// No description provided for @exStepIncline2.
  ///
  /// In en, this message translates to:
  /// **'Kick the dumbbells up to shoulder level as you sit back.'**
  String get exStepIncline2;

  /// No description provided for @exStepIncline3.
  ///
  /// In en, this message translates to:
  /// **'Press both dumbbells straight up, squeezing your upper chest at the top.'**
  String get exStepIncline3;

  /// No description provided for @exStepIncline4.
  ///
  /// In en, this message translates to:
  /// **'Lower under control until your upper arms are parallel to the floor.'**
  String get exStepIncline4;

  /// No description provided for @exNoteIncline.
  ///
  /// In en, this message translates to:
  /// **'Keep your elbows tucked at about 45 degrees to protect your shoulders.'**
  String get exNoteIncline;

  /// No description provided for @exStepSquat1.
  ///
  /// In en, this message translates to:
  /// **'Rest the barbell across your upper back.'**
  String get exStepSquat1;

  /// No description provided for @exStepSquat2.
  ///
  /// In en, this message translates to:
  /// **'Stand with feet shoulder-width apart, toes pointing slightly out.'**
  String get exStepSquat2;

  /// No description provided for @exStepSquat3.
  ///
  /// In en, this message translates to:
  /// **'Bend at the hips and knees together to sit down into the squat.'**
  String get exStepSquat3;

  /// No description provided for @exStepSquat4.
  ///
  /// In en, this message translates to:
  /// **'Go down until your thighs are parallel to the ground or lower.'**
  String get exStepSquat4;

  /// No description provided for @exStepSquat5.
  ///
  /// In en, this message translates to:
  /// **'Drive through your mid-foot to stand back up.'**
  String get exStepSquat5;

  /// No description provided for @exNoteSquat.
  ///
  /// In en, this message translates to:
  /// **'Add 5 kg to your top set this week if the depth feels comfortable.'**
  String get exNoteSquat;

  /// No description provided for @exStepLat1.
  ///
  /// In en, this message translates to:
  /// **'Hold the wide bar with an overhand grip, wider than shoulder-width.'**
  String get exStepLat1;

  /// No description provided for @exStepLat2.
  ///
  /// In en, this message translates to:
  /// **'Sit upright with the thigh pads pressing firmly on your knees.'**
  String get exStepLat2;

  /// No description provided for @exStepLat3.
  ///
  /// In en, this message translates to:
  /// **'Lean back slightly (about 10–15 degrees) and pull the bar down to your upper chest.'**
  String get exStepLat3;

  /// No description provided for @exStepLat4.
  ///
  /// In en, this message translates to:
  /// **'Squeeze your lats at the bottom, then return under control.'**
  String get exStepLat4;

  /// No description provided for @exStepOhp1.
  ///
  /// In en, this message translates to:
  /// **'Sit upright on a bench with back support.'**
  String get exStepOhp1;

  /// No description provided for @exStepOhp2.
  ///
  /// In en, this message translates to:
  /// **'Hold the dumbbells at shoulder height, palms facing forward.'**
  String get exStepOhp2;

  /// No description provided for @exStepOhp3.
  ///
  /// In en, this message translates to:
  /// **'Press the dumbbells straight overhead until your arms are extended.'**
  String get exStepOhp3;

  /// No description provided for @exStepOhp4.
  ///
  /// In en, this message translates to:
  /// **'Lower under control back to shoulder level.'**
  String get exStepOhp4;

  /// No description provided for @exNoteOhp.
  ///
  /// In en, this message translates to:
  /// **'Don\'t arch your lower back away from the bench pad.'**
  String get exNoteOhp;

  /// No description provided for @exStepCurl1.
  ///
  /// In en, this message translates to:
  /// **'Sit back on an incline bench set to 45 degrees.'**
  String get exStepCurl1;

  /// No description provided for @exStepCurl2.
  ///
  /// In en, this message translates to:
  /// **'Let the dumbbells hang straight down at your sides, palms forward.'**
  String get exStepCurl2;

  /// No description provided for @exStepCurl3.
  ///
  /// In en, this message translates to:
  /// **'Curl the weights up while keeping your upper arms still.'**
  String get exStepCurl3;

  /// No description provided for @exStepCurl4.
  ///
  /// In en, this message translates to:
  /// **'Pause at the top, then lower over 3 seconds.'**
  String get exStepCurl4;

  /// No description provided for @exStepLegRaise1.
  ///
  /// In en, this message translates to:
  /// **'Hang from a pull-up bar with an overhand grip.'**
  String get exStepLegRaise1;

  /// No description provided for @exStepLegRaise2.
  ///
  /// In en, this message translates to:
  /// **'Keep your legs straight or slightly bent at the knees.'**
  String get exStepLegRaise2;

  /// No description provided for @exStepLegRaise3.
  ///
  /// In en, this message translates to:
  /// **'Raise your legs to waist height using your abs, without swinging.'**
  String get exStepLegRaise3;

  /// No description provided for @exStepLegRaise4.
  ///
  /// In en, this message translates to:
  /// **'Lower back down slowly.'**
  String get exStepLegRaise4;

  /// No description provided for @exStepRow1.
  ///
  /// In en, this message translates to:
  /// **'Hinge forward at the hips with a flat back and soft knees.'**
  String get exStepRow1;

  /// No description provided for @exStepRow2.
  ///
  /// In en, this message translates to:
  /// **'Let the dumbbells hang straight down below your shoulders.'**
  String get exStepRow2;

  /// No description provided for @exStepRow3.
  ///
  /// In en, this message translates to:
  /// **'Row the dumbbells toward your hips, driving your elbows up.'**
  String get exStepRow3;

  /// No description provided for @exStepRow4.
  ///
  /// In en, this message translates to:
  /// **'Squeeze your shoulder blades together at the top.'**
  String get exStepRow4;

  /// No description provided for @exNoteRow.
  ///
  /// In en, this message translates to:
  /// **'Pull with your elbows, not your biceps, to work your lats.'**
  String get exNoteRow;

  /// No description provided for @gymMachinesTitle.
  ///
  /// In en, this message translates to:
  /// **'Gym Machines & Equipment'**
  String get gymMachinesTitle;

  /// No description provided for @machineStatusAvailable.
  ///
  /// In en, this message translates to:
  /// **'Available'**
  String get machineStatusAvailable;

  /// No description provided for @machineStatusInUse.
  ///
  /// In en, this message translates to:
  /// **'In use'**
  String get machineStatusInUse;

  /// No description provided for @machineStatusMaintenance.
  ///
  /// In en, this message translates to:
  /// **'Maintenance'**
  String get machineStatusMaintenance;

  /// No description provided for @machineStatusUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Unavailable'**
  String get machineStatusUnavailable;

  /// No description provided for @machineCategoryPrefix.
  ///
  /// In en, this message translates to:
  /// **'Category: {category} · Targets: {targets}'**
  String machineCategoryPrefix(String category, String targets);

  /// No description provided for @premiumPlan.
  ///
  /// In en, this message translates to:
  /// **'Premium plan'**
  String get premiumPlan;

  /// No description provided for @membershipStartDate.
  ///
  /// In en, this message translates to:
  /// **'Start date'**
  String get membershipStartDate;

  /// No description provided for @membershipExpires.
  ///
  /// In en, this message translates to:
  /// **'Expires'**
  String get membershipExpires;

  /// No description provided for @paymentHistory.
  ///
  /// In en, this message translates to:
  /// **'Payment history'**
  String get paymentHistory;

  /// No description provided for @myProgress.
  ///
  /// In en, this message translates to:
  /// **'My progress'**
  String get myProgress;

  /// No description provided for @tabWeight.
  ///
  /// In en, this message translates to:
  /// **'Weight'**
  String get tabWeight;

  /// No description provided for @tabMeasurements.
  ///
  /// In en, this message translates to:
  /// **'Measurements'**
  String get tabMeasurements;

  /// No description provided for @tabAttendance.
  ///
  /// In en, this message translates to:
  /// **'Attendance'**
  String get tabAttendance;

  /// No description provided for @tabPRs.
  ///
  /// In en, this message translates to:
  /// **'PRs'**
  String get tabPRs;

  /// No description provided for @bmiTitle.
  ///
  /// In en, this message translates to:
  /// **'BMI'**
  String get bmiTitle;

  /// No description provided for @calculatedHeight.
  ///
  /// In en, this message translates to:
  /// **'Calculated ({height} cm)'**
  String calculatedHeight(String height);

  /// No description provided for @bmiHealthNote.
  ///
  /// In en, this message translates to:
  /// **'BMI is an epidemiological estimate based on height & weight. Strength and body composition are your primary health indicators.'**
  String get bmiHealthNote;

  /// No description provided for @logMetricsButton.
  ///
  /// In en, this message translates to:
  /// **'Log weight & body metrics'**
  String get logMetricsButton;

  /// No description provided for @startedWeightSubtitle.
  ///
  /// In en, this message translates to:
  /// **'From {weight} kg (Started {date})'**
  String startedWeightSubtitle(String weight, String date);

  /// No description provided for @weightProgressTitle.
  ///
  /// In en, this message translates to:
  /// **'Weight progress'**
  String get weightProgressTitle;

  /// No description provided for @measureChest.
  ///
  /// In en, this message translates to:
  /// **'Chest'**
  String get measureChest;

  /// No description provided for @measureWaist.
  ///
  /// In en, this message translates to:
  /// **'Waist'**
  String get measureWaist;

  /// No description provided for @measureArms.
  ///
  /// In en, this message translates to:
  /// **'Arms'**
  String get measureArms;

  /// No description provided for @measureThighs.
  ///
  /// In en, this message translates to:
  /// **'Thighs'**
  String get measureThighs;

  /// No description provided for @benchPressExercise.
  ///
  /// In en, this message translates to:
  /// **'Bench press'**
  String get benchPressExercise;

  /// No description provided for @squatExercise.
  ///
  /// In en, this message translates to:
  /// **'Squat'**
  String get squatExercise;

  /// No description provided for @deadliftExercise.
  ///
  /// In en, this message translates to:
  /// **'Deadlift'**
  String get deadliftExercise;

  /// No description provided for @outdoorRunningGps.
  ///
  /// In en, this message translates to:
  /// **'Outdoor Running GPS'**
  String get outdoorRunningGps;

  /// No description provided for @runDistance.
  ///
  /// In en, this message translates to:
  /// **'Distance'**
  String get runDistance;

  /// No description provided for @runKilometers.
  ///
  /// In en, this message translates to:
  /// **'Kilometers'**
  String get runKilometers;

  /// No description provided for @runTime.
  ///
  /// In en, this message translates to:
  /// **'Time'**
  String get runTime;

  /// No description provided for @runPace.
  ///
  /// In en, this message translates to:
  /// **'Pace'**
  String get runPace;

  /// No description provided for @runCalories.
  ///
  /// In en, this message translates to:
  /// **'Calories'**
  String get runCalories;

  /// No description provided for @liveGpsMap.
  ///
  /// In en, this message translates to:
  /// **'Live GPS route map view'**
  String get liveGpsMap;

  /// No description provided for @recentRunHistory.
  ///
  /// In en, this message translates to:
  /// **'Recent run history'**
  String get recentRunHistory;

  /// No description provided for @morningRun.
  ///
  /// In en, this message translates to:
  /// **'Morning run'**
  String get morningRun;

  /// No description provided for @runPacePerKm.
  ///
  /// In en, this message translates to:
  /// **'{pace} /km'**
  String runPacePerKm(String pace);

  /// No description provided for @runHistorySummary.
  ///
  /// In en, this message translates to:
  /// **'Time: {time} · Avg pace: {pace} /km'**
  String runHistorySummary(String time, String pace);

  /// No description provided for @timeYesterday.
  ///
  /// In en, this message translates to:
  /// **'Yesterday'**
  String get timeYesterday;

  /// No description provided for @pauseRun.
  ///
  /// In en, this message translates to:
  /// **'Pause run'**
  String get pauseRun;

  /// No description provided for @startRun.
  ///
  /// In en, this message translates to:
  /// **'Start run'**
  String get startRun;

  /// No description provided for @workoutPlanTitle.
  ///
  /// In en, this message translates to:
  /// **'Workout plan'**
  String get workoutPlanTitle;

  /// No description provided for @exercisesCount.
  ///
  /// In en, this message translates to:
  /// **'Exercises ({count})'**
  String exercisesCount(int count);

  /// No description provided for @exercisesDuration.
  ///
  /// In en, this message translates to:
  /// **'{count} exercises · {duration} min'**
  String exercisesDuration(int count, int duration);

  /// No description provided for @adminUptime.
  ///
  /// In en, this message translates to:
  /// **'{percent}% uptime'**
  String adminUptime(String percent);

  /// No description provided for @adminMom.
  ///
  /// In en, this message translates to:
  /// **'{percent}% MoM'**
  String adminMom(String percent);

  /// No description provided for @adminTrialingCount.
  ///
  /// In en, this message translates to:
  /// **'{count} trialing'**
  String adminTrialingCount(int count);

  /// No description provided for @adminFullAccess.
  ///
  /// In en, this message translates to:
  /// **'{email} · Full access'**
  String adminFullAccess(String email);

  /// No description provided for @compoundHypertrophy.
  ///
  /// In en, this message translates to:
  /// **'Compound · Hypertrophy'**
  String get compoundHypertrophy;

  /// No description provided for @commonSave.
  ///
  /// In en, this message translates to:
  /// **'Save'**
  String get commonSave;

  /// No description provided for @commonSaved.
  ///
  /// In en, this message translates to:
  /// **'Saved'**
  String get commonSaved;

  /// No description provided for @startWorkout.
  ///
  /// In en, this message translates to:
  /// **'Start workout'**
  String get startWorkout;

  /// No description provided for @languageBeta.
  ///
  /// In en, this message translates to:
  /// **'Beta'**
  String get languageBeta;

  /// No description provided for @languageBetaNote.
  ///
  /// In en, this message translates to:
  /// **'Languages marked Beta are new translations and may contain mistakes. English is always complete.'**
  String get languageBetaNote;

  /// No description provided for @appearance.
  ///
  /// In en, this message translates to:
  /// **'Appearance'**
  String get appearance;

  /// No description provided for @themeSystem.
  ///
  /// In en, this message translates to:
  /// **'Use phone setting'**
  String get themeSystem;

  /// No description provided for @themeLight.
  ///
  /// In en, this message translates to:
  /// **'Light'**
  String get themeLight;

  /// No description provided for @themeDark.
  ///
  /// In en, this message translates to:
  /// **'Dark'**
  String get themeDark;

  /// No description provided for @commonDone.
  ///
  /// In en, this message translates to:
  /// **'Done'**
  String get commonDone;

  /// No description provided for @letsTrain.
  ///
  /// In en, this message translates to:
  /// **'Let\'s train'**
  String get letsTrain;

  /// No description provided for @viewAll.
  ///
  /// In en, this message translates to:
  /// **'View all'**
  String get viewAll;

  /// No description provided for @tomorrow.
  ///
  /// In en, this message translates to:
  /// **'Tomorrow'**
  String get tomorrow;

  /// No description provided for @yesterday.
  ///
  /// In en, this message translates to:
  /// **'Yesterday'**
  String get yesterday;

  /// No description provided for @thisWeek.
  ///
  /// In en, this message translates to:
  /// **'This week'**
  String get thisWeek;

  /// No description provided for @decline.
  ///
  /// In en, this message translates to:
  /// **'Decline'**
  String get decline;

  /// No description provided for @pause.
  ///
  /// In en, this message translates to:
  /// **'Pause'**
  String get pause;

  /// No description provided for @resume.
  ///
  /// In en, this message translates to:
  /// **'Resume'**
  String get resume;

  /// No description provided for @past.
  ///
  /// In en, this message translates to:
  /// **'Past'**
  String get past;

  /// No description provided for @errorLoadPlan.
  ///
  /// In en, this message translates to:
  /// **'Couldn\'t load your workout plan.'**
  String get errorLoadPlan;

  /// No description provided for @errorLoadTrainer.
  ///
  /// In en, this message translates to:
  /// **'Couldn\'t load your trainer details.'**
  String get errorLoadTrainer;

  /// No description provided for @errorOpenChat.
  ///
  /// In en, this message translates to:
  /// **'Couldn\'t open the chat.'**
  String get errorOpenChat;

  /// No description provided for @errorLoadSchedule.
  ///
  /// In en, this message translates to:
  /// **'Couldn\'t load your schedule.'**
  String get errorLoadSchedule;

  /// No description provided for @errorLoadMessages.
  ///
  /// In en, this message translates to:
  /// **'Couldn\'t load messages.'**
  String get errorLoadMessages;

  /// No description provided for @unitMinutes.
  ///
  /// In en, this message translates to:
  /// **'{count} min'**
  String unitMinutes(int count);

  /// No description provided for @unitSeconds.
  ///
  /// In en, this message translates to:
  /// **'{count} s'**
  String unitSeconds(int count);

  /// No description provided for @restSeconds.
  ///
  /// In en, this message translates to:
  /// **'Rest {seconds} s'**
  String restSeconds(int seconds);

  /// No description provided for @plusSeconds.
  ///
  /// In en, this message translates to:
  /// **'+{seconds} s'**
  String plusSeconds(int seconds);

  /// No description provided for @goalGeneralFitness.
  ///
  /// In en, this message translates to:
  /// **'Stay fit & healthy'**
  String get goalGeneralFitness;

  /// No description provided for @goalMobility.
  ///
  /// In en, this message translates to:
  /// **'Mobility & flexibility'**
  String get goalMobility;

  /// No description provided for @goalFatLossDesc.
  ///
  /// In en, this message translates to:
  /// **'Burn fat and get leaner with strength and conditioning.'**
  String get goalFatLossDesc;

  /// No description provided for @goalMuscleGainDesc.
  ///
  /// In en, this message translates to:
  /// **'Build size with focused hypertrophy training.'**
  String get goalMuscleGainDesc;

  /// No description provided for @goalStrengthDesc.
  ///
  /// In en, this message translates to:
  /// **'Lift heavier with low-rep compound lifts.'**
  String get goalStrengthDesc;

  /// No description provided for @goalEnduranceDesc.
  ///
  /// In en, this message translates to:
  /// **'Boost stamina with cardio and circuits.'**
  String get goalEnduranceDesc;

  /// No description provided for @goalGeneralFitnessDesc.
  ///
  /// In en, this message translates to:
  /// **'A balanced mix to feel strong every day.'**
  String get goalGeneralFitnessDesc;

  /// No description provided for @goalMobilityDesc.
  ///
  /// In en, this message translates to:
  /// **'Move better, ease stiffness and prevent injury.'**
  String get goalMobilityDesc;

  /// No description provided for @levelBeginner.
  ///
  /// In en, this message translates to:
  /// **'Beginner'**
  String get levelBeginner;

  /// No description provided for @levelIntermediate.
  ///
  /// In en, this message translates to:
  /// **'Intermediate'**
  String get levelIntermediate;

  /// No description provided for @levelAdvanced.
  ///
  /// In en, this message translates to:
  /// **'Advanced'**
  String get levelAdvanced;

  /// No description provided for @levelBeginnerDesc.
  ///
  /// In en, this message translates to:
  /// **'New to training or coming back after a break.'**
  String get levelBeginnerDesc;

  /// No description provided for @levelIntermediateDesc.
  ///
  /// In en, this message translates to:
  /// **'Training regularly for 6 months or more.'**
  String get levelIntermediateDesc;

  /// No description provided for @levelAdvancedDesc.
  ///
  /// In en, this message translates to:
  /// **'Years of consistent, structured training.'**
  String get levelAdvancedDesc;

  /// No description provided for @focusFullBody.
  ///
  /// In en, this message translates to:
  /// **'Full body'**
  String get focusFullBody;

  /// No description provided for @focusUpperBody.
  ///
  /// In en, this message translates to:
  /// **'Upper body'**
  String get focusUpperBody;

  /// No description provided for @focusLowerBody.
  ///
  /// In en, this message translates to:
  /// **'Lower body'**
  String get focusLowerBody;

  /// No description provided for @focusCore.
  ///
  /// In en, this message translates to:
  /// **'Core & abs'**
  String get focusCore;

  /// No description provided for @focusArms.
  ///
  /// In en, this message translates to:
  /// **'Arms'**
  String get focusArms;

  /// No description provided for @focusBack.
  ///
  /// In en, this message translates to:
  /// **'Back'**
  String get focusBack;

  /// No description provided for @focusChest.
  ///
  /// In en, this message translates to:
  /// **'Chest'**
  String get focusChest;

  /// No description provided for @focusGlutes.
  ///
  /// In en, this message translates to:
  /// **'Glutes'**
  String get focusGlutes;

  /// No description provided for @focusCardio.
  ///
  /// In en, this message translates to:
  /// **'Cardio'**
  String get focusCardio;

  /// No description provided for @focusFlexibility.
  ///
  /// In en, this message translates to:
  /// **'Flexibility'**
  String get focusFlexibility;

  /// No description provided for @dayFullBody.
  ///
  /// In en, this message translates to:
  /// **'Full body'**
  String get dayFullBody;

  /// No description provided for @dayUpper.
  ///
  /// In en, this message translates to:
  /// **'Upper body'**
  String get dayUpper;

  /// No description provided for @dayLower.
  ///
  /// In en, this message translates to:
  /// **'Lower body'**
  String get dayLower;

  /// No description provided for @dayPush.
  ///
  /// In en, this message translates to:
  /// **'Push'**
  String get dayPush;

  /// No description provided for @dayPull.
  ///
  /// In en, this message translates to:
  /// **'Pull'**
  String get dayPull;

  /// No description provided for @dayLegs.
  ///
  /// In en, this message translates to:
  /// **'Legs'**
  String get dayLegs;

  /// No description provided for @dayConditioning.
  ///
  /// In en, this message translates to:
  /// **'Conditioning'**
  String get dayConditioning;

  /// No description provided for @dayCardio.
  ///
  /// In en, this message translates to:
  /// **'Cardio'**
  String get dayCardio;

  /// No description provided for @dayMobility.
  ///
  /// In en, this message translates to:
  /// **'Mobility'**
  String get dayMobility;

  /// No description provided for @dayNumber.
  ///
  /// In en, this message translates to:
  /// **'Day {number}'**
  String dayNumber(int number);

  /// No description provided for @goalStepCounter.
  ///
  /// In en, this message translates to:
  /// **'Step {current} of {total}'**
  String goalStepCounter(int current, int total);

  /// No description provided for @goalQuestionTitle.
  ///
  /// In en, this message translates to:
  /// **'What\'s your main goal?'**
  String get goalQuestionTitle;

  /// No description provided for @goalQuestionSubtitle.
  ///
  /// In en, this message translates to:
  /// **'We\'ll build a weekly plan around it. You can change it any time.'**
  String get goalQuestionSubtitle;

  /// No description provided for @levelQuestionTitle.
  ///
  /// In en, this message translates to:
  /// **'How experienced are you?'**
  String get levelQuestionTitle;

  /// No description provided for @levelQuestionSubtitle.
  ///
  /// In en, this message translates to:
  /// **'This sets the exercises, sets and rest for you.'**
  String get levelQuestionSubtitle;

  /// No description provided for @scheduleQuestionTitle.
  ///
  /// In en, this message translates to:
  /// **'How often can you train?'**
  String get scheduleQuestionTitle;

  /// No description provided for @scheduleQuestionSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Pick what fits your week — consistency beats intensity.'**
  String get scheduleQuestionSubtitle;

  /// No description provided for @daysPerWeekLabel.
  ///
  /// In en, this message translates to:
  /// **'Days per week'**
  String get daysPerWeekLabel;

  /// No description provided for @daysPerWeekValue.
  ///
  /// In en, this message translates to:
  /// **'{count} days a week'**
  String daysPerWeekValue(int count);

  /// No description provided for @sessionLengthLabel.
  ///
  /// In en, this message translates to:
  /// **'Time per session'**
  String get sessionLengthLabel;

  /// No description provided for @focusQuestionTitle.
  ///
  /// In en, this message translates to:
  /// **'Anything to focus on?'**
  String get focusQuestionTitle;

  /// No description provided for @focusQuestionSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Optional. Your trainer sees this too.'**
  String get focusQuestionSubtitle;

  /// No description provided for @buildMyPlan.
  ///
  /// In en, this message translates to:
  /// **'Build my plan'**
  String get buildMyPlan;

  /// No description provided for @goalSaveFailed.
  ///
  /// In en, this message translates to:
  /// **'Couldn\'t save your goal. Please try again.'**
  String get goalSaveFailed;

  /// No description provided for @goalSavedTitle.
  ///
  /// In en, this message translates to:
  /// **'Your plan is ready'**
  String get goalSavedTitle;

  /// No description provided for @goalSavedSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Built around your goal and your week.'**
  String get goalSavedSubtitle;

  /// No description provided for @myWorkoutPlan.
  ///
  /// In en, this message translates to:
  /// **'My workout plan'**
  String get myWorkoutPlan;

  /// No description provided for @editGoal.
  ///
  /// In en, this message translates to:
  /// **'Edit goal'**
  String get editGoal;

  /// No description provided for @yourGoal.
  ///
  /// In en, this message translates to:
  /// **'Your goal'**
  String get yourGoal;

  /// No description provided for @noGoalTitle.
  ///
  /// In en, this message translates to:
  /// **'Set your goal first'**
  String get noGoalTitle;

  /// No description provided for @noGoalMessage.
  ///
  /// In en, this message translates to:
  /// **'Tell us what you\'re training for and we\'ll suggest a weekly plan.'**
  String get noGoalMessage;

  /// No description provided for @setMyGoal.
  ///
  /// In en, this message translates to:
  /// **'Set my goal'**
  String get setMyGoal;

  /// No description provided for @setGoalCardTitle.
  ///
  /// In en, this message translates to:
  /// **'What are you training for?'**
  String get setGoalCardTitle;

  /// No description provided for @setGoalCardBody.
  ///
  /// In en, this message translates to:
  /// **'Answer 4 quick questions and get a weekly plan made for you.'**
  String get setGoalCardBody;

  /// No description provided for @exerciseCount.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{1 exercise} other{{count} exercises}}'**
  String exerciseCount(int count);

  /// No description provided for @howToDoIt.
  ///
  /// In en, this message translates to:
  /// **'How to do it'**
  String get howToDoIt;

  /// No description provided for @myGoalAndPlan.
  ///
  /// In en, this message translates to:
  /// **'My goal & plan'**
  String get myGoalAndPlan;

  /// No description provided for @exerciseOfTotal.
  ///
  /// In en, this message translates to:
  /// **'Exercise {current} of {total}'**
  String exerciseOfTotal(int current, int total);

  /// No description provided for @setOfTotal.
  ///
  /// In en, this message translates to:
  /// **'Set {current} of {total}'**
  String setOfTotal(int current, int total);

  /// No description provided for @nextUpName.
  ///
  /// In en, this message translates to:
  /// **'Next: {name}'**
  String nextUpName(String name);

  /// No description provided for @restTime.
  ///
  /// In en, this message translates to:
  /// **'Rest'**
  String get restTime;

  /// No description provided for @repsLabel.
  ///
  /// In en, this message translates to:
  /// **'reps'**
  String get repsLabel;

  /// No description provided for @holdOrMove.
  ///
  /// In en, this message translates to:
  /// **'keep going'**
  String get holdOrMove;

  /// No description provided for @startSet.
  ///
  /// In en, this message translates to:
  /// **'Start'**
  String get startSet;

  /// No description provided for @setDone.
  ///
  /// In en, this message translates to:
  /// **'Set done'**
  String get setDone;

  /// No description provided for @skipRest.
  ///
  /// In en, this message translates to:
  /// **'Skip rest'**
  String get skipRest;

  /// No description provided for @endWorkoutTitle.
  ///
  /// In en, this message translates to:
  /// **'End this workout?'**
  String get endWorkoutTitle;

  /// No description provided for @endWorkoutBody.
  ///
  /// In en, this message translates to:
  /// **'Your progress in this session won\'t be kept.'**
  String get endWorkoutBody;

  /// No description provided for @keepGoing.
  ///
  /// In en, this message translates to:
  /// **'Keep going'**
  String get keepGoing;

  /// No description provided for @endWorkout.
  ///
  /// In en, this message translates to:
  /// **'End workout'**
  String get endWorkout;

  /// No description provided for @workoutCompleteTitle.
  ///
  /// In en, this message translates to:
  /// **'Workout complete!'**
  String get workoutCompleteTitle;

  /// No description provided for @workoutCompleteSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Great {focus} session. Rest well and come back stronger.'**
  String workoutCompleteSubtitle(String focus);

  /// No description provided for @statDuration.
  ///
  /// In en, this message translates to:
  /// **'Duration'**
  String get statDuration;

  /// No description provided for @statExercises.
  ///
  /// In en, this message translates to:
  /// **'Exercises'**
  String get statExercises;

  /// No description provided for @statSets.
  ///
  /// In en, this message translates to:
  /// **'Sets'**
  String get statSets;

  /// No description provided for @myTrainer.
  ///
  /// In en, this message translates to:
  /// **'My trainer'**
  String get myTrainer;

  /// No description provided for @yourTrainer.
  ///
  /// In en, this message translates to:
  /// **'Your trainer'**
  String get yourTrainer;

  /// No description provided for @messageTrainer.
  ///
  /// In en, this message translates to:
  /// **'Message trainer'**
  String get messageTrainer;

  /// No description provided for @getATrainer.
  ///
  /// In en, this message translates to:
  /// **'Get a personal trainer'**
  String get getATrainer;

  /// No description provided for @getATrainerHint.
  ///
  /// In en, this message translates to:
  /// **'Ask your gym to assign a trainer to you.'**
  String get getATrainerHint;

  /// No description provided for @noTrainerTitle.
  ///
  /// In en, this message translates to:
  /// **'Train with a coach'**
  String get noTrainerTitle;

  /// No description provided for @noTrainerMessage.
  ///
  /// In en, this message translates to:
  /// **'Request a trainer or personal training. Your gym owner will review it and assign someone.'**
  String get noTrainerMessage;

  /// No description provided for @trainerPerkPlan.
  ///
  /// In en, this message translates to:
  /// **'A plan tuned to your goal'**
  String get trainerPerkPlan;

  /// No description provided for @trainerPerkChat.
  ///
  /// In en, this message translates to:
  /// **'Chat directly in the app'**
  String get trainerPerkChat;

  /// No description provided for @trainerPerkProgress.
  ///
  /// In en, this message translates to:
  /// **'Form checks and progress reviews'**
  String get trainerPerkProgress;

  /// No description provided for @requestATrainer.
  ///
  /// In en, this message translates to:
  /// **'Request a trainer'**
  String get requestATrainer;

  /// No description provided for @requestPersonalTraining.
  ///
  /// In en, this message translates to:
  /// **'Request personal training'**
  String get requestPersonalTraining;

  /// No description provided for @requestPersonalTrainingHint.
  ///
  /// In en, this message translates to:
  /// **'One-on-one sessions, arranged by your gym.'**
  String get requestPersonalTrainingHint;

  /// No description provided for @requestKindTrainer.
  ///
  /// In en, this message translates to:
  /// **'Trainer'**
  String get requestKindTrainer;

  /// No description provided for @requestKindPt.
  ///
  /// In en, this message translates to:
  /// **'Personal training'**
  String get requestKindPt;

  /// No description provided for @requestSheetTitle.
  ///
  /// In en, this message translates to:
  /// **'Ask for a trainer'**
  String get requestSheetTitle;

  /// No description provided for @requestSheetSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Your gym owner gets this request and assigns a trainer.'**
  String get requestSheetSubtitle;

  /// No description provided for @preferredTrainerOptional.
  ///
  /// In en, this message translates to:
  /// **'Preferred trainer (optional)'**
  String get preferredTrainerOptional;

  /// No description provided for @anyTrainer.
  ///
  /// In en, this message translates to:
  /// **'Any trainer'**
  String get anyTrainer;

  /// No description provided for @anyTrainerHint.
  ///
  /// In en, this message translates to:
  /// **'Let the gym pick the best match'**
  String get anyTrainerHint;

  /// No description provided for @trainerFull.
  ///
  /// In en, this message translates to:
  /// **'Fully booked'**
  String get trainerFull;

  /// No description provided for @requestMessageHint.
  ///
  /// In en, this message translates to:
  /// **'Anything the gym should know? Timings, injuries…'**
  String get requestMessageHint;

  /// No description provided for @sendRequest.
  ///
  /// In en, this message translates to:
  /// **'Send request'**
  String get sendRequest;

  /// No description provided for @requestSent.
  ///
  /// In en, this message translates to:
  /// **'Request sent to your gym'**
  String get requestSent;

  /// No description provided for @requestPendingTitle.
  ///
  /// In en, this message translates to:
  /// **'Request pending'**
  String get requestPendingTitle;

  /// No description provided for @requestPendingShort.
  ///
  /// In en, this message translates to:
  /// **'Waiting for your gym to assign a trainer.'**
  String get requestPendingShort;

  /// No description provided for @requestPendingBody.
  ///
  /// In en, this message translates to:
  /// **'Your gym will review it soon. You\'ll get a notification when a trainer is assigned.'**
  String get requestPendingBody;

  /// No description provided for @cancelRequest.
  ///
  /// In en, this message translates to:
  /// **'Cancel request'**
  String get cancelRequest;

  /// No description provided for @cancelRequestTitle.
  ///
  /// In en, this message translates to:
  /// **'Cancel this request?'**
  String get cancelRequestTitle;

  /// No description provided for @cancelRequestBody.
  ///
  /// In en, this message translates to:
  /// **'You can send a new request any time.'**
  String get cancelRequestBody;

  /// No description provided for @requestHistory.
  ///
  /// In en, this message translates to:
  /// **'Past requests'**
  String get requestHistory;

  /// No description provided for @requestApproved.
  ///
  /// In en, this message translates to:
  /// **'Approved'**
  String get requestApproved;

  /// No description provided for @requestDeclined.
  ///
  /// In en, this message translates to:
  /// **'Declined'**
  String get requestDeclined;

  /// No description provided for @requestCancelled.
  ///
  /// In en, this message translates to:
  /// **'Cancelled'**
  String get requestCancelled;

  /// No description provided for @requestStatusPending.
  ///
  /// In en, this message translates to:
  /// **'Pending'**
  String get requestStatusPending;

  /// No description provided for @preferredTrainerValue.
  ///
  /// In en, this message translates to:
  /// **'Preferred: {name}'**
  String preferredTrainerValue(String name);

  /// No description provided for @assignedTrainerValue.
  ///
  /// In en, this message translates to:
  /// **'Assigned to {name}'**
  String assignedTrainerValue(String name);

  /// No description provided for @chatIntro.
  ///
  /// In en, this message translates to:
  /// **'Ask about your plan, form or diet. Your trainer replies here.'**
  String get chatIntro;

  /// No description provided for @trainerRequests.
  ///
  /// In en, this message translates to:
  /// **'Trainer requests'**
  String get trainerRequests;

  /// No description provided for @trainerRequestsDesc.
  ///
  /// In en, this message translates to:
  /// **'Members asking for a trainer or PT'**
  String get trainerRequestsDesc;

  /// No description provided for @requestTabPending.
  ///
  /// In en, this message translates to:
  /// **'Pending'**
  String get requestTabPending;

  /// No description provided for @requestTabAll.
  ///
  /// In en, this message translates to:
  /// **'All'**
  String get requestTabAll;

  /// No description provided for @noPendingRequests.
  ///
  /// In en, this message translates to:
  /// **'No pending requests'**
  String get noPendingRequests;

  /// No description provided for @noRequests.
  ///
  /// In en, this message translates to:
  /// **'No requests yet'**
  String get noRequests;

  /// No description provided for @noRequestsMessage.
  ///
  /// In en, this message translates to:
  /// **'When members ask for a trainer or personal training from the app, it shows up here.'**
  String get noRequestsMessage;

  /// No description provided for @assignTrainer.
  ///
  /// In en, this message translates to:
  /// **'Assign trainer'**
  String get assignTrainer;

  /// No description provided for @chooseTrainer.
  ///
  /// In en, this message translates to:
  /// **'Choose a trainer'**
  String get chooseTrainer;

  /// No description provided for @memberPreferred.
  ///
  /// In en, this message translates to:
  /// **'Member\'s choice'**
  String get memberPreferred;

  /// No description provided for @noActiveTrainers.
  ///
  /// In en, this message translates to:
  /// **'No active trainers. Add one first.'**
  String get noActiveTrainers;

  /// No description provided for @declineRequestTitle.
  ///
  /// In en, this message translates to:
  /// **'Decline request'**
  String get declineRequestTitle;

  /// No description provided for @declineReasonHint.
  ///
  /// In en, this message translates to:
  /// **'Reason for the member (optional)'**
  String get declineReasonHint;

  /// No description provided for @requestApprovedToast.
  ///
  /// In en, this message translates to:
  /// **'Trainer assigned. The member has been notified.'**
  String get requestApprovedToast;

  /// No description provided for @requestDeclinedToast.
  ///
  /// In en, this message translates to:
  /// **'Request declined.'**
  String get requestDeclinedToast;

  /// No description provided for @clientNoGoal.
  ///
  /// In en, this message translates to:
  /// **'This member hasn\'t set a goal in the app yet.'**
  String get clientNoGoal;

  /// No description provided for @sessionsToday.
  ///
  /// In en, this message translates to:
  /// **'Sessions today'**
  String get sessionsToday;

  /// No description provided for @activeClients.
  ///
  /// In en, this message translates to:
  /// **'Active clients'**
  String get activeClients;

  /// No description provided for @unreadMessages.
  ///
  /// In en, this message translates to:
  /// **'Unread messages'**
  String get unreadMessages;

  /// No description provided for @noSessionsToday.
  ///
  /// In en, this message translates to:
  /// **'No sessions booked for today.'**
  String get noSessionsToday;

  /// No description provided for @noUpcomingSessions.
  ///
  /// In en, this message translates to:
  /// **'No upcoming sessions'**
  String get noUpcomingSessions;

  /// No description provided for @noPastSessions.
  ///
  /// In en, this message translates to:
  /// **'No past sessions'**
  String get noPastSessions;

  /// No description provided for @sessionsBookedHint.
  ///
  /// In en, this message translates to:
  /// **'Sessions booked by your gym or members appear here.'**
  String get sessionsBookedHint;

  /// No description provided for @myClasses.
  ///
  /// In en, this message translates to:
  /// **'My classes'**
  String get myClasses;

  /// No description provided for @sessionScheduled.
  ///
  /// In en, this message translates to:
  /// **'Scheduled'**
  String get sessionScheduled;

  /// No description provided for @sessionCompleted.
  ///
  /// In en, this message translates to:
  /// **'Completed'**
  String get sessionCompleted;

  /// No description provided for @sessionCancelled.
  ///
  /// In en, this message translates to:
  /// **'Cancelled'**
  String get sessionCancelled;

  /// No description provided for @sessionNoShow.
  ///
  /// In en, this message translates to:
  /// **'No-show'**
  String get sessionNoShow;

  /// No description provided for @navChat.
  ///
  /// In en, this message translates to:
  /// **'Chat'**
  String get navChat;

  /// No description provided for @approve.
  ///
  /// In en, this message translates to:
  /// **'Approve'**
  String get approve;

  /// No description provided for @saveChanges.
  ///
  /// In en, this message translates to:
  /// **'Save changes'**
  String get saveChanges;

  /// No description provided for @myShiftAttendance.
  ///
  /// In en, this message translates to:
  /// **'My shift attendance'**
  String get myShiftAttendance;

  /// No description provided for @markMemberAttendance.
  ///
  /// In en, this message translates to:
  /// **'Mark member attendance'**
  String get markMemberAttendance;

  /// No description provided for @checkInShift.
  ///
  /// In en, this message translates to:
  /// **'Start shift'**
  String get checkInShift;

  /// No description provided for @checkOutShift.
  ///
  /// In en, this message translates to:
  /// **'End shift'**
  String get checkOutShift;

  /// No description provided for @offShift.
  ///
  /// In en, this message translates to:
  /// **'You\'re not on shift'**
  String get offShift;

  /// No description provided for @onShiftSince.
  ///
  /// In en, this message translates to:
  /// **'On shift since {time}'**
  String onShiftSince(String time);

  /// No description provided for @onShiftNow.
  ///
  /// In en, this message translates to:
  /// **'On shift'**
  String get onShiftNow;

  /// No description provided for @daysWorked.
  ///
  /// In en, this message translates to:
  /// **'Days worked'**
  String get daysWorked;

  /// No description provided for @shiftHistory.
  ///
  /// In en, this message translates to:
  /// **'Shift history'**
  String get shiftHistory;

  /// No description provided for @noShiftsYet.
  ///
  /// In en, this message translates to:
  /// **'No shifts recorded yet.'**
  String get noShiftsYet;

  /// No description provided for @corrected.
  ///
  /// In en, this message translates to:
  /// **'corrected'**
  String get corrected;

  /// No description provided for @requestCorrection.
  ///
  /// In en, this message translates to:
  /// **'Request correction'**
  String get requestCorrection;

  /// No description provided for @correctionReasonHint.
  ///
  /// In en, this message translates to:
  /// **'What happened? (e.g. forgot to check out)'**
  String get correctionReasonHint;

  /// No description provided for @checkInTime.
  ///
  /// In en, this message translates to:
  /// **'Check-in'**
  String get checkInTime;

  /// No description provided for @checkOutTime.
  ///
  /// In en, this message translates to:
  /// **'Check-out'**
  String get checkOutTime;

  /// No description provided for @correctionsPending.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{1 correction request waiting for review} other{{count} correction requests waiting for review}}'**
  String correctionsPending(int count);

  /// No description provided for @correctionRequests.
  ///
  /// In en, this message translates to:
  /// **'Correction requests'**
  String get correctionRequests;

  /// No description provided for @staffAttendance.
  ///
  /// In en, this message translates to:
  /// **'Staff attendance'**
  String get staffAttendance;

  /// No description provided for @staffAttendanceDesc.
  ///
  /// In en, this message translates to:
  /// **'Trainer shifts, hours and corrections'**
  String get staffAttendanceDesc;

  /// No description provided for @staffAttendanceHint.
  ///
  /// In en, this message translates to:
  /// **'Trainers\' shift check-ins appear here. Member visits are counted separately.'**
  String get staffAttendanceHint;

  /// No description provided for @last30Days.
  ///
  /// In en, this message translates to:
  /// **'Last 30 days'**
  String get last30Days;

  /// No description provided for @shiftCount.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{1 shift} other{{count} shifts}}'**
  String shiftCount(int count);

  /// No description provided for @daysCount.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{1 day} other{{count} days}}'**
  String daysCount(int count);

  /// No description provided for @staffAndPermissions.
  ///
  /// In en, this message translates to:
  /// **'Staff & permissions'**
  String get staffAndPermissions;

  /// No description provided for @staffAndPermissionsDesc.
  ///
  /// In en, this message translates to:
  /// **'Choose what each trainer can do'**
  String get staffAndPermissionsDesc;

  /// No description provided for @permissionsIntro.
  ///
  /// In en, this message translates to:
  /// **'Turn individual permissions on or off. Trainers only see members assigned to them unless \'View member profiles\' is on.'**
  String get permissionsIntro;

  /// No description provided for @permissionPresets.
  ///
  /// In en, this message translates to:
  /// **'Quick presets'**
  String get permissionPresets;

  /// No description provided for @permissionsSaved.
  ///
  /// In en, this message translates to:
  /// **'Permissions updated'**
  String get permissionsSaved;

  /// No description provided for @permissionsAuditNote.
  ///
  /// In en, this message translates to:
  /// **'Every change is recorded in the audit log with who made it and when.'**
  String get permissionsAuditNote;

  /// No description provided for @roleDefault.
  ///
  /// In en, this message translates to:
  /// **'Included with this role'**
  String get roleDefault;

  /// No description provided for @permGroupMembers.
  ///
  /// In en, this message translates to:
  /// **'Members'**
  String get permGroupMembers;

  /// No description provided for @permGroupAttendance.
  ///
  /// In en, this message translates to:
  /// **'Attendance'**
  String get permGroupAttendance;

  /// No description provided for @permGroupTraining.
  ///
  /// In en, this message translates to:
  /// **'Training & diet'**
  String get permGroupTraining;

  /// No description provided for @permGroupCommunication.
  ///
  /// In en, this message translates to:
  /// **'Communication'**
  String get permGroupCommunication;

  /// No description provided for @permGroupSchedule.
  ///
  /// In en, this message translates to:
  /// **'Sessions & classes'**
  String get permGroupSchedule;

  /// No description provided for @permGroupAdmin.
  ///
  /// In en, this message translates to:
  /// **'Administration'**
  String get permGroupAdmin;

  /// No description provided for @assignPlans.
  ///
  /// In en, this message translates to:
  /// **'Assign a plan'**
  String get assignPlans;

  /// No description provided for @assignTo.
  ///
  /// In en, this message translates to:
  /// **'Assign to {name}'**
  String assignTo(String name);

  /// No description provided for @assignBtn.
  ///
  /// In en, this message translates to:
  /// **'Assign'**
  String get assignBtn;

  /// No description provided for @assignWorkoutBtn.
  ///
  /// In en, this message translates to:
  /// **'Assign workout'**
  String get assignWorkoutBtn;

  /// No description provided for @workoutAssigned.
  ///
  /// In en, this message translates to:
  /// **'Workout plan assigned'**
  String get workoutAssigned;

  /// No description provided for @dietAssigned.
  ///
  /// In en, this message translates to:
  /// **'Diet plan assigned'**
  String get dietAssigned;

  /// No description provided for @chooseProgram.
  ///
  /// In en, this message translates to:
  /// **'Choose a workout program'**
  String get chooseProgram;

  /// No description provided for @noProgramsYet.
  ///
  /// In en, this message translates to:
  /// **'No published programs'**
  String get noProgramsYet;

  /// No description provided for @noProgramsHint.
  ///
  /// In en, this message translates to:
  /// **'Create and publish a workout program on the web, then assign it here.'**
  String get noProgramsHint;

  /// No description provided for @programDays.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{1 day} other{{count} days}}'**
  String programDays(int count);

  /// No description provided for @programWeeks.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{1 week} other{{count} weeks}}'**
  String programWeeks(int count);

  /// No description provided for @startDate.
  ///
  /// In en, this message translates to:
  /// **'Start date'**
  String get startDate;

  /// No description provided for @aiDietSuggestion.
  ///
  /// In en, this message translates to:
  /// **'AI diet suggestion'**
  String get aiDietSuggestion;

  /// No description provided for @aiDietSuggestionHint.
  ///
  /// In en, this message translates to:
  /// **'Generate a meal plan from goal and weight'**
  String get aiDietSuggestionHint;

  /// No description provided for @existingPlans.
  ///
  /// In en, this message translates to:
  /// **'Existing plans'**
  String get existingPlans;

  /// No description provided for @noDietPlansYet.
  ///
  /// In en, this message translates to:
  /// **'No diet plans yet. Use the AI suggestion above to create one.'**
  String get noDietPlansYet;

  /// No description provided for @enterWeight.
  ///
  /// In en, this message translates to:
  /// **'Enter a valid body weight.'**
  String get enterWeight;

  /// No description provided for @foodPreference.
  ///
  /// In en, this message translates to:
  /// **'Food preference'**
  String get foodPreference;

  /// No description provided for @bodyWeightKg.
  ///
  /// In en, this message translates to:
  /// **'Weight (kg)'**
  String get bodyWeightKg;

  /// No description provided for @mealsPerDay.
  ///
  /// In en, this message translates to:
  /// **'Meals/day'**
  String get mealsPerDay;

  /// No description provided for @personaliseWithAi.
  ///
  /// In en, this message translates to:
  /// **'Personalise with AI'**
  String get personaliseWithAi;

  /// No description provided for @personaliseWithAiHint.
  ///
  /// In en, this message translates to:
  /// **'Uses your gym\'s AI quota. Off = instant rule-based plan.'**
  String get personaliseWithAiHint;

  /// No description provided for @generatePlan.
  ///
  /// In en, this message translates to:
  /// **'Generate plan'**
  String get generatePlan;

  /// No description provided for @saveAndAssign.
  ///
  /// In en, this message translates to:
  /// **'Save & assign'**
  String get saveAndAssign;

  /// No description provided for @kcal.
  ///
  /// In en, this message translates to:
  /// **'kcal'**
  String get kcal;

  /// No description provided for @protein.
  ///
  /// In en, this message translates to:
  /// **'protein'**
  String get protein;

  /// No description provided for @carbs.
  ///
  /// In en, this message translates to:
  /// **'carbs'**
  String get carbs;

  /// No description provided for @fat.
  ///
  /// In en, this message translates to:
  /// **'fat'**
  String get fat;

  /// No description provided for @dietVegetarian.
  ///
  /// In en, this message translates to:
  /// **'Vegetarian'**
  String get dietVegetarian;

  /// No description provided for @dietVegan.
  ///
  /// In en, this message translates to:
  /// **'Vegan'**
  String get dietVegan;

  /// No description provided for @dietEggetarian.
  ///
  /// In en, this message translates to:
  /// **'Eggetarian'**
  String get dietEggetarian;

  /// No description provided for @dietNonVegetarian.
  ///
  /// In en, this message translates to:
  /// **'Non-veg'**
  String get dietNonVegetarian;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'hi', 'ml', 'ta'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'hi':
      return AppLocalizationsHi();
    case 'ml':
      return AppLocalizationsMl();
    case 'ta':
      return AppLocalizationsTa();
  }

  throw FlutterError(
      'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
      'an issue with the localizations generation tool. Please file an issue '
      'on GitHub with a reproducible sample app and the gen-l10n configuration '
      'that was used.');
}
