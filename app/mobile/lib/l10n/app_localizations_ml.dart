// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Malayalam (`ml`).
class AppLocalizationsMl extends AppLocalizations {
  AppLocalizationsMl([String locale = 'ml']) : super(locale);

  @override
  String get commonCancel => 'റദ്ദാക്കുക';

  @override
  String get commonRetry => 'വീണ്ടും ശ്രമിക്കുക';

  @override
  String get commonTryAgain => 'വീണ്ടും ശ്രമിക്കുക';

  @override
  String get commonContinue => 'തുടരുക';

  @override
  String get commonBack => 'തിരികെ';

  @override
  String get commonClose => 'അടയ്ക്കുക';

  @override
  String get commonCopy => 'പകർത്തുക';

  @override
  String get commonAdd => 'ചേർക്കുക';

  @override
  String get commonClear => 'മായ്ക്കുക';

  @override
  String get commonView => 'കാണുക';

  @override
  String get commonSearch => 'തിരയുക';

  @override
  String get commonSearchHint => 'തിരയുക…';

  @override
  String get commonAll => 'എല്ലാം';

  @override
  String get commonActive => 'സജീവം';

  @override
  String get commonInactive => 'നിഷ്ക്രിയം';

  @override
  String get commonExpired => 'കാലഹരണപ്പെട്ടു';

  @override
  String get commonSuspended => 'താൽക്കാലികമായി നിർത്തി';

  @override
  String get commonTotal => 'ആകെ';

  @override
  String get commonToday => 'ഇന്ന്';

  @override
  String get commonThisWeek => 'ഈ ആഴ്ച';

  @override
  String get commonThisMonth => 'ഈ മാസം';

  @override
  String get commonDayStreak => 'തുടർച്ചയായ ദിവസങ്ങൾ';

  @override
  String get commonMember => 'അംഗം';

  @override
  String get commonMembers => 'അംഗങ്ങൾ';

  @override
  String get commonTrainer => 'പരിശീലകൻ';

  @override
  String get commonTrainers => 'പരിശീലകർ';

  @override
  String get commonOwner => 'ഉടമ';

  @override
  String get commonStaff => 'സ്റ്റാഫ്';

  @override
  String get commonUser => 'ഉപയോക്താവ്';

  @override
  String get commonAttendance => 'ഹാജർ';

  @override
  String get commonPayments => 'പേയ്‌മെന്റുകൾ';

  @override
  String get commonPayment => 'പേയ്‌മെന്റ്';

  @override
  String get commonMembership => 'അംഗത്വം';

  @override
  String get commonNotifications => 'അറിയിപ്പുകൾ';

  @override
  String get commonSettings => 'ക്രമീകരണങ്ങൾ';

  @override
  String get commonProfile => 'പ്രൊഫൈൽ';

  @override
  String get commonMore => 'കൂടുതൽ';

  @override
  String get commonHome => 'ഹോം';

  @override
  String get commonFinance => 'സാമ്പത്തികം';

  @override
  String get commonFrontDesk => 'ഫ്രണ്ട് ഡെസ്ക്';

  @override
  String get commonSignOut => 'സൈൻ ഔട്ട്';

  @override
  String get commonEmail => 'ഇമെയിൽ';

  @override
  String get commonPassword => 'പാസ്‌വേഡ്';

  @override
  String get commonMobileNumber => 'മൊബൈൽ നമ്പർ';

  @override
  String get commonEmailHint => 'name@example.com';

  @override
  String get commonAtLeast8Chars => 'കുറഞ്ഞത് 8 അക്ഷരങ്ങൾ';

  @override
  String get commonUseAtLeast8Chars => 'കുറഞ്ഞത് 8 അക്ഷരങ്ങൾ ഉപയോഗിക്കുക';

  @override
  String get commonEnterValidEmail => 'ശരിയായ ഇമെയിൽ വിലാസം നൽകുക';

  @override
  String get commonEnterValidMobile => 'ശരിയായ മൊബൈൽ നമ്പർ നൽകുക';

  @override
  String get commonCheckConnection => 'കണക്ഷൻ പരിശോധിച്ച് വീണ്ടും ശ്രമിക്കുക.';

  @override
  String get commonSomethingWentWrong =>
      'എന്തോ കുഴപ്പം സംഭവിച്ചു. വീണ്ടും ശ്രമിക്കുക.';

  @override
  String get commonInTheGymNow => 'ഇപ്പോൾ ജിമ്മിൽ';

  @override
  String get commonNoOneCheckedIn => 'ഇപ്പോൾ ആരും ചെക്ക്-ഇൻ ചെയ്തിട്ടില്ല.';

  @override
  String get commonCheckIn => 'ചെക്ക്-ഇൻ';

  @override
  String get commonCheckOut => 'ചെക്ക്-ഔട്ട്';

  @override
  String get commonCash => 'പണം';

  @override
  String get commonCard => 'കാർഡ്';

  @override
  String get commonNetBanking => 'നെറ്റ് ബാങ്കിംഗ്';

  @override
  String get commonCheque => 'ചെക്ക്';

  @override
  String get commonOther => 'മറ്റുള്ളവ';

  @override
  String commonMonths(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count മാസം',
      one: '1 മാസം',
    );
    return '$_temp0';
  }

  @override
  String commonDaysLeft(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count ദിവസം ബാക്കി',
      one: '1 ദിവസം ബാക്കി',
    );
    return '$_temp0';
  }

  @override
  String commonErrorWithDetail(String detail) {
    return 'പിശക്: $detail';
  }

  @override
  String get commonLinkCopied => 'ലിങ്ക് പകർത്തി: https://repsi.app';

  @override
  String get commonLanguage => 'ഭാഷ';

  @override
  String get appTagline => 'നിങ്ങളുടെ ജിം. നിങ്ങളുടെ പുരോഗതി.';

  @override
  String get errorTimeout =>
      'കണക്ഷൻ സമയം കഴിഞ്ഞു. ഇന്റർനെറ്റ് കണക്ഷൻ പരിശോധിക്കുക.';

  @override
  String get errorNoConnection =>
      'REPSI-യുമായി ബന്ധിപ്പിക്കാനായില്ല. ഇന്റർനെറ്റ് കണക്ഷനോ സെർവർ നിലയോ പരിശോധിക്കുക.';

  @override
  String get errorValidation => 'സാധൂകരണ പിശക് സംഭവിച്ചു.';

  @override
  String get errorGeneric => 'ഒരു പിശക് സംഭവിച്ചു';

  @override
  String get errorBadRequest => 'അഭ്യർത്ഥനയിലെ വിവരങ്ങൾ അസാധുവാണ്.';

  @override
  String get errorInvalidCredentials => 'ഇമെയിലോ പാസ്‌വേഡോ തെറ്റാണ്.';

  @override
  String get errorSessionExpired =>
      'നിങ്ങളുടെ സെഷൻ കാലഹരണപ്പെട്ടു. വീണ്ടും സൈൻ ഇൻ ചെയ്യുക.';

  @override
  String get errorForbidden => 'ഈ ജിം ആക്സസ് ചെയ്യാൻ നിങ്ങൾക്ക് അനുമതിയില്ല.';

  @override
  String get errorNotFound => 'അക്കൗണ്ടോ ജിമ്മോ കണ്ടെത്തിയില്ല.';

  @override
  String get errorRequestTimeout =>
      'അഭ്യർത്ഥനയുടെ സമയം കഴിഞ്ഞു. വീണ്ടും ശ്രമിക്കുക.';

  @override
  String get errorConflict =>
      'ഈ വിവരങ്ങളുള്ള ഒരു അക്കൗണ്ട് ഇതിനകം നിലവിലുണ്ട്.';

  @override
  String get errorCheckInputs =>
      'നൽകിയ വിവരങ്ങൾ പരിശോധിച്ച് വീണ്ടും ശ്രമിക്കുക.';

  @override
  String get errorTooManyAttempts =>
      'ഒരുപാട് ശ്രമങ്ങൾ. കുറച്ച് കഴിഞ്ഞ് വീണ്ടും ശ്രമിക്കുക.';

  @override
  String get errorServerUnavailable => 'REPSI താൽക്കാലികമായി ലഭ്യമല്ല.';

  @override
  String get errorUnknown =>
      'അഭ്യർത്ഥന പ്രോസസ്സ് ചെയ്യാനായില്ല. വീണ്ടും ശ്രമിക്കുക.';

  @override
  String get errorLoadAttendance => 'ഹാജർ ലോഡ് ചെയ്യാനായില്ല';

  @override
  String get authNoSession => 'സൈൻ ഇൻ ഒരു സെഷൻ നൽകിയില്ല. വീണ്ടും ശ്രമിക്കുക.';

  @override
  String get authSignInFailed =>
      'സൈൻ ഇൻ ചെയ്യാനായില്ല. നിങ്ങളുടെ വിവരങ്ങൾ പരിശോധിക്കുക.';

  @override
  String get authGoogleNoToken =>
      'Google സൈൻ-ഇൻ ടോക്കൺ നൽകിയില്ല. വീണ്ടും ശ്രമിക്കുക.';

  @override
  String get authGoogleFailed =>
      'Google സൈൻ-ഇൻ പരാജയപ്പെട്ടു. വീണ്ടും ശ്രമിക്കുക, അല്ലെങ്കിൽ ഇമെയിലും പാസ്‌വേഡും ഉപയോഗിക്കുക.';

  @override
  String get authCreateAccountFailed =>
      'നിങ്ങളുടെ അക്കൗണ്ട് സൃഷ്ടിക്കാനായില്ല. വീണ്ടും ശ്രമിക്കുക.';

  @override
  String get authRegistrationFailed =>
      'രജിസ്ട്രേഷൻ പരാജയപ്പെട്ടു. വീണ്ടും ശ്രമിക്കുക.';

  @override
  String get authDeleteFailed =>
      'നിങ്ങളുടെ അക്കൗണ്ട് ഇല്ലാതാക്കാനായില്ല. വീണ്ടും ശ്രമിക്കുക.';

  @override
  String get authVerificationIncomplete =>
      'സ്ഥിരീകരണം പൂർത്തിയായില്ല. പുതിയ കോഡ് ആവശ്യപ്പെടുക.';

  @override
  String get errorLoadDashboard => 'ഡാഷ്‌ബോർഡ് കണക്കുകൾ ലോഡ് ചെയ്യാനായില്ല';

  @override
  String get healthPermissionDenied =>
      'അനുമതി നൽകിയിട്ടില്ല. Health Connect ക്രമീകരണങ്ങളിൽ ആക്സസ് അനുവദിക്കാം.';

  @override
  String get healthConnectFailed =>
      'Health Connect-മായി ബന്ധിപ്പിക്കാനായില്ല. വീണ്ടും ശ്രമിക്കുക.';

  @override
  String get healthReadFailed =>
      'Health Connect-ൽ നിന്ന് നിങ്ങളുടെ പ്രവർത്തനം വായിക്കാനായില്ല.';

  @override
  String get errorLoadMembers => 'അംഗങ്ങളെ ലോഡ് ചെയ്യാനായില്ല';

  @override
  String get errorLoadNotifications =>
      'അറിയിപ്പുകൾ ലോഡ് ചെയ്യാനായില്ല. വീണ്ടും ശ്രമിക്കാൻ താഴേക്ക് വലിക്കുക.';

  @override
  String get notificationFallbackTitle => 'അറിയിപ്പ്';

  @override
  String get timeJustNow => 'ഇപ്പോൾ';

  @override
  String get errorLoadWorkspaces => 'നിങ്ങളുടെ ജിമ്മുകൾ ലോഡ് ചെയ്യാനായില്ല.';

  @override
  String get errorOnboarding => 'സജ്ജീകരണം പൂർത്തിയാക്കാനായില്ല';

  @override
  String get qrGymCheckIn => 'ജിം ചെക്ക്-ഇൻ';

  @override
  String get navClients => 'ക്ലയന്റുകൾ';

  @override
  String get navSchedule => 'ഷെഡ്യൂൾ';

  @override
  String get navPlans => 'പ്ലാനുകൾ';

  @override
  String get navGyms => 'ജിമ്മുകൾ';

  @override
  String get navUsers => 'ഉപയോക്താക്കൾ';

  @override
  String get navAnalytics => 'അനലിറ്റിക്സ്';

  @override
  String get navWorkout => 'വർക്കൗട്ട്';

  @override
  String get navProgress => 'പുരോഗതി';

  @override
  String get navClasses => 'ക്ലാസുകൾ';

  @override
  String get languageSheetTitle => 'ആപ്പ് ഭാഷ';

  @override
  String get languageSheetSubtitle =>
      'ഈ ഉപകരണത്തിൽ REPSI ഉപയോഗിക്കേണ്ട ഭാഷ തിരഞ്ഞെടുക്കുക.';

  @override
  String get signOutConfirmGeneric =>
      'ഈ ഉപകരണത്തിൽ REPSI-ൽ നിന്ന് സൈൻ ഔട്ട് ചെയ്യണോ?';

  @override
  String get switchWorkspace => 'ജിം മാറ്റുക';

  @override
  String get avatarTitle => 'പ്രൊഫൈൽ ഫോട്ടോ';

  @override
  String get avatarTakePhoto => 'ഫോട്ടോ എടുക്കുക';

  @override
  String get avatarChooseGallery => 'ഗാലറിയിൽ നിന്ന് തിരഞ്ഞെടുക്കുക';

  @override
  String get avatarRemove => 'ഫോട്ടോ നീക്കം ചെയ്യുക';

  @override
  String get avatarCameraError =>
      'ക്യാമറ തുറക്കാനായില്ല. ക്രമീകരണങ്ങളിൽ REPSI-യുടെ ക്യാമറ അനുമതി പരിശോധിക്കുക.';

  @override
  String get avatarGalleryError =>
      'നിങ്ങളുടെ ഫോട്ടോകൾ തുറക്കാനായില്ല. ക്രമീകരണങ്ങളിൽ REPSI-യുടെ ഫോട്ടോ അനുമതി പരിശോധിക്കുക.';

  @override
  String get avatarChange => 'പ്രൊഫൈൽ ഫോട്ടോ മാറ്റുക';

  @override
  String get avatarAdd => 'പ്രൊഫൈൽ ഫോട്ടോ ചേർക്കുക';

  @override
  String codeFieldLabel(int count) {
    return 'സ്ഥിരീകരണ കോഡ്, $count അക്കങ്ങൾ';
  }

  @override
  String get errorStateTitle => 'എന്തോ കുഴപ്പം സംഭവിച്ചു';

  @override
  String get ownerProfileTitle => 'ഉടമയുടെ പ്രൊഫൈൽ';

  @override
  String get gymOwner => 'ജിം ഉടമ';

  @override
  String get gymSettings => 'ജിം ക്രമീകരണങ്ങൾ';

  @override
  String get accountSettings => 'അക്കൗണ്ട് ക്രമീകരണങ്ങൾ';

  @override
  String get statusExpiring => 'ഉടൻ അവസാനിക്കും';

  @override
  String get statusFrozen => 'മരവിപ്പിച്ചു';

  @override
  String get statusCancelled => 'റദ്ദാക്കി';

  @override
  String get deleteAccountWarning =>
      'ഇത് നിങ്ങളുടെ ലോഗിൻ, പ്രൊഫൈൽ വിവരങ്ങൾ, സമന്വയിപ്പിച്ച പ്രവർത്തന ഡാറ്റ എന്നിവ സ്ഥിരമായി നീക്കം ചെയ്യും. നിങ്ങളുടെ ജിം അവരുടെ കണക്കുകൾക്ക് ആവശ്യമായ അംഗ രേഖകൾ (ഹാജർ, പേയ്‌മെന്റുകൾ) സൂക്ഷിക്കും. ഇത് പഴയപടിയാക്കാനാവില്ല.';

  @override
  String get ownerSignupExplainer =>
      'ജിം ബിസിനസുകൾ REPSI വെബ്സൈറ്റിലാണ് സൃഷ്ടിക്കുന്നത്; അവിടെ പ്ലാൻ തിരഞ്ഞെടുത്ത് ബ്രാഞ്ചുകൾ സജ്ജമാക്കാം. തയ്യാറായാൽ, അതേ മൊബൈൽ നമ്പർ ഉപയോഗിച്ച് ഇവിടെ സൈൻ ഇൻ ചെയ്യുക.';

  @override
  String resetLinkSent(String email) {
    return '$email എന്ന വിലാസത്തിന് REPSI അക്കൗണ്ട് ഉണ്ടെങ്കിൽ, റീസെറ്റ് ലിങ്ക് അയച്ചിട്ടുണ്ട്. പുതിയ പാസ്‌വേഡ് തിരഞ്ഞെടുക്കാൻ ഇത് ഈ ഫോണിലോ കമ്പ്യൂട്ടറിലോ തുറക്കുക.';
  }

  @override
  String otpSentTo(String number) {
    return '$number എന്ന നമ്പറിലേക്ക് WhatsApp-ൽ അയച്ച 6 അക്ക കോഡ് നൽകുക.';
  }

  @override
  String verifyEmailSentTo(String email) {
    return '$email എന്ന വിലാസത്തിലേക്ക് സ്ഥിരീകരണ ലിങ്ക് അയച്ചിട്ടുണ്ട്. ഇൻബോക്സ് പരിശോധിക്കുക.';
  }

  @override
  String get verifyEmailYourAddress => 'നിങ്ങളുടെ ഇമെയിൽ വിലാസം';

  @override
  String signupJoining(String slug) {
    return 'ചേരുന്നത്: $slug';
  }

  @override
  String get changePassword => 'പാസ്‌വേഡ് മാറ്റുക';

  @override
  String get currentPassword => 'നിലവിലെ പാസ്‌വേഡ്';

  @override
  String get enterCurrentPassword => 'നിലവിലെ പാസ്‌വേഡ് നൽകുക';

  @override
  String get newPassword => 'പുതിയ പാസ്‌വേഡ്';

  @override
  String get passwordMax72 => 'പരമാവധി 72 അക്ഷരങ്ങൾ ഉപയോഗിക്കുക';

  @override
  String get passwordChooseDifferent => 'മറ്റൊരു പാസ്‌വേഡ് തിരഞ്ഞെടുക്കുക';

  @override
  String get commonSaving => 'സംരക്ഷിക്കുന്നു…';

  @override
  String get commonUpdate => 'അപ്ഡേറ്റ് ചെയ്യുക';

  @override
  String get passwordUpdated =>
      'പാസ്‌വേഡ് അപ്ഡേറ്റ് ചെയ്തു. മറ്റ് ഉപകരണങ്ങളിൽ നിന്ന് സൈൻ ഔട്ട് ചെയ്തു.';

  @override
  String get deleteAccountTitle => 'നിങ്ങളുടെ അക്കൗണ്ട് ഇല്ലാതാക്കണോ?';

  @override
  String get deleteAccountPasswordLabel =>
      'പാസ്‌വേഡ് (Google മാത്രം ഉപയോഗിക്കുന്ന അക്കൗണ്ടാണെങ്കിൽ ശൂന്യമായി വിടുക)';

  @override
  String get deleteAccountTypeConfirm =>
      'സ്ഥിരീകരിക്കാൻ DELETE എന്ന് ടൈപ്പ് ചെയ്യുക';

  @override
  String get commonDeleting => 'ഇല്ലാതാക്കുന്നു…';

  @override
  String get deleteAccount => 'അക്കൗണ്ട് ഇല്ലാതാക്കുക';

  @override
  String get profilePhotoUploadFailed =>
      'അക്കൗണ്ട് സൃഷ്ടിച്ചു, പക്ഷേ ഫോട്ടോ അപ്‌ലോഡ് ആയില്ല. പ്രൊഫൈലിൽ നിന്ന് ചേർക്കാം.';

  @override
  String get completeProfileTitle => 'ഏകദേശം പൂർത്തിയായി!';

  @override
  String get completeProfileSubtitle =>
      'നിങ്ങളുടെ നമ്പർ സ്ഥിരീകരിച്ചു. അക്കൗണ്ട് സജ്ജീകരണം പൂർത്തിയാക്കാൻ കുറച്ച് വിവരങ്ങൾ ചേർക്കുക.';

  @override
  String get addProfilePhotoOptional => 'പ്രൊഫൈൽ ഫോട്ടോ ചേർക്കുക (ഓപ്ഷണൽ)';

  @override
  String get tapToChange => 'മാറ്റാൻ ടാപ്പ് ചെയ്യുക';

  @override
  String get fullName => 'മുഴുവൻ പേര്';

  @override
  String get fullNameHint => 'ജിമ്മിൽ അറിയപ്പെടുന്ന പേര്';

  @override
  String get enterFullName => 'നിങ്ങളുടെ മുഴുവൻ പേര് നൽകുക';

  @override
  String get uploadingPhoto => 'ഫോട്ടോ അപ്‌ലോഡ് ചെയ്യുന്നു…';

  @override
  String get emailSendFailed => 'ഇമെയിൽ അയയ്ക്കാനായില്ല. വീണ്ടും ശ്രമിക്കുക.';

  @override
  String get checkYourEmail => 'നിങ്ങളുടെ ഇമെയിൽ പരിശോധിക്കുക';

  @override
  String get backToSignIn => 'സൈൻ ഇന്നിലേക്ക് മടങ്ങുക';

  @override
  String get useDifferentEmail => 'മറ്റൊരു ഇമെയിൽ ഉപയോഗിക്കുക';

  @override
  String get resetPasswordTitle => 'പാസ്‌വേഡ് റീസെറ്റ് ചെയ്യുക';

  @override
  String get resetPasswordSubtitle =>
      'അക്കൗണ്ടിലെ ഇമെയിൽ നൽകുക; പുതിയ പാസ്‌വേഡ് സജ്ജമാക്കാൻ ഒരു ലിങ്ക് അയയ്ക്കാം.';

  @override
  String get sendResetLink => 'റീസെറ്റ് ലിങ്ക് അയയ്ക്കുക';

  @override
  String get codeSendFailed => 'കോഡ് അയയ്ക്കാനായില്ല. വീണ്ടും ശ്രമിക്കുക.';

  @override
  String get accountNotFoundPassword =>
      'ഈ വിവരങ്ങളുള്ള REPSI അക്കൗണ്ട് കണ്ടെത്തിയില്ല. ഇമെയിലോ മൊബൈൽ നമ്പറോ പരിശോധിക്കുക, അല്ലെങ്കിൽ WhatsApp കോഡ് ഉപയോഗിച്ച് സൈൻ ഇൻ ചെയ്യുക.';

  @override
  String get accountNotFoundGoogle =>
      'ഈ Google അക്കൗണ്ടുമായി ബന്ധിപ്പിച്ച REPSI അക്കൗണ്ട് കണ്ടെത്തിയില്ല. പകരം മൊബൈൽ നമ്പർ ഉപയോഗിച്ച് സൈൻ ഇൻ ചെയ്യുക.';

  @override
  String get accountNotFound => 'അക്കൗണ്ട് കണ്ടെത്തിയില്ല';

  @override
  String get useMobileNumber => 'മൊബൈൽ നമ്പർ ഉപയോഗിക്കുക';

  @override
  String get setUpNewGym => 'പുതിയ ജിം സജ്ജമാക്കുക';

  @override
  String get copyRepsiLink => 'repsi.app ലിങ്ക് പകർത്തുക';

  @override
  String get setUpNewGymQuestion => 'പുതിയ ജിം സജ്ജമാക്കുകയാണോ?';

  @override
  String get startOnRepsi => 'repsi.app-ൽ ആരംഭിക്കുക';

  @override
  String get welcomeBack => 'വീണ്ടും സ്വാഗതം';

  @override
  String get letsGetStarted => 'നമുക്ക് തുടങ്ങാം';

  @override
  String get loginPasswordSubtitle =>
      'അക്കൗണ്ടിലെ ഇമെയിലോ മൊബൈൽ നമ്പറോ പാസ്‌വേഡും ഉപയോഗിച്ച് സൈൻ ഇൻ ചെയ്യുക.';

  @override
  String get loginOtpSubtitle =>
      'മൊബൈൽ നമ്പർ നൽകുക; WhatsApp-ൽ സ്ഥിരീകരണ കോഡ് അയയ്ക്കാം.';

  @override
  String get continueWithGoogle => 'Google ഉപയോഗിച്ച് തുടരുക';

  @override
  String get useMobileInstead => 'പകരം മൊബൈൽ നമ്പർ ഉപയോഗിക്കുക';

  @override
  String get signInWithEmailPassword =>
      'ഇമെയിലും പാസ്‌വേഡും ഉപയോഗിച്ച് സൈൻ ഇൻ ചെയ്യുക';

  @override
  String get enterMobileNumber => 'മൊബൈൽ നമ്പർ നൽകുക';

  @override
  String get enterValid10Digit => 'ശരിയായ 10 അക്ക മൊബൈൽ നമ്പർ നൽകുക';

  @override
  String get sendCodeWhatsApp => 'WhatsApp-ൽ കോഡ് അയയ്ക്കുക';

  @override
  String get emailOrMobile => 'ഇമെയിൽ അല്ലെങ്കിൽ മൊബൈൽ നമ്പർ';

  @override
  String get emailOrMobileRequired => 'ഇമെയിലോ മൊബൈൽ നമ്പറോ ആവശ്യമാണ്';

  @override
  String get passwordRequired => 'പാസ്‌വേഡ് ആവശ്യമാണ്';

  @override
  String get forgotPassword => 'പാസ്‌വേഡ് മറന്നോ?';

  @override
  String get signIn => 'സൈൻ ഇൻ ചെയ്യുക';

  @override
  String get chooseWorkspace => 'നിങ്ങളുടെ വർക്ക്‌സ്‌പേസ് തിരഞ്ഞെടുക്കുക';

  @override
  String get chooseWorkspaceSubtitle =>
      'ആക്സസ് ചെയ്യേണ്ട സ്ഥാപനവും വർക്ക്‌സ്‌പേസും തിരഞ്ഞെടുക്കുക';

  @override
  String get roleOwnerTitle => 'Repsi Fitness — ഉടമ';

  @override
  String get roleOwnerDesc =>
      'ബിസിനസ് നിയന്ത്രണ കേന്ദ്രം: വരുമാനം, അംഗങ്ങൾ, ഹാജർ, പ്രവർത്തനങ്ങൾ';

  @override
  String get roleTrainerTitle => 'Repsi Fitness — പരിശീലകൻ';

  @override
  String get roleTrainerDesc =>
      'കോച്ചിംഗ് വർക്ക്‌സ്‌പേസ്: ക്ലയന്റ് പരിശീലനം, വർക്കൗട്ട് & ഡയറ്റ് ബിൽഡർ, ചാറ്റ്';

  @override
  String get roleTrainerBadge => 'സജീവ കോച്ച്';

  @override
  String get roleMemberTitle => 'Repsi Fitness — അംഗം';

  @override
  String get roleMemberDesc =>
      'വ്യക്തിഗത ഫിറ്റ്‌നസ് സഹായി: സ്ട്രീക്ക്, വർക്കൗട്ടുകൾ, QR ചെക്ക്-ഇൻ & പുരോഗതി';

  @override
  String get roleMemberBadge => 'ഗോൾഡ് അംഗം';

  @override
  String get roleAdminTitle => 'Repsi Platform — അഡ്മിൻ';

  @override
  String get roleAdminDesc =>
      'ആന്തരിക ഭരണം: ജിമ്മുകൾ, അക്കൗണ്ടുകൾ & സിസ്റ്റം മെട്രിക്സ്';

  @override
  String get roleAdminBadge => 'സൂപ്പർ അഡ്മിൻ';

  @override
  String get signOutFailed => 'സൈൻ ഔട്ട് ചെയ്യാനായില്ല. വീണ്ടും ശ്രമിക്കുക.';

  @override
  String get signOutTitle => 'സൈൻ ഔട്ട് ചെയ്യണോ?';

  @override
  String get signOutConfirmOwner =>
      'നിങ്ങളുടെ REPSI ഉടമ അക്കൗണ്ടിൽ നിന്ന് സൈൻ ഔട്ട് ചെയ്യണോ?';

  @override
  String get signingOut => 'സൈൻ ഔട്ട് ചെയ്യുന്നു…';

  @override
  String get createAccountTitle => 'നിങ്ങളുടെ അക്കൗണ്ട് സൃഷ്ടിക്കുക';

  @override
  String get joinGymTitle => 'നിങ്ങളുടെ ജിമ്മിൽ ചേരുക';

  @override
  String get signupStep1 => 'ഘട്ടം 1 / 2: അംഗ പ്രൊഫൈൽ';

  @override
  String get signupStep2 => 'ഘട്ടം 2 / 2: ജിമ്മിൽ ചേരുക';

  @override
  String get nameHintExample => 'Priya Sharma';

  @override
  String get fullNameRequired => 'മുഴുവൻ പേര് ആവശ്യമാണ്';

  @override
  String get emailRequired => 'ഇമെയിൽ ആവശ്യമാണ്';

  @override
  String get continueToGym => 'ജിമ്മിലേക്ക് തുടരുക';

  @override
  String get gymCode => 'ജിം ലിങ്ക് പേര്';

  @override
  String get gymCodeRequired => 'ജിം ലിങ്ക് പേര് ആവശ്യമാണ്';

  @override
  String get phoneOptional => 'ഫോൺ നമ്പർ (ഓപ്ഷണൽ)';

  @override
  String get cityOptional => 'നഗരം (ഓപ്ഷണൽ)';

  @override
  String get cityHint => 'ചെന്നൈ, കൊച്ചി, ഡൽഹി…';

  @override
  String get createMemberAccount => 'അംഗ അക്കൗണ്ട് സൃഷ്ടിക്കുക';

  @override
  String get verifyEmailTitle => 'ഇമെയിൽ സ്ഥിരീകരിക്കുക';

  @override
  String get continueToSetup => 'സജ്ജീകരണം തുടരുക';

  @override
  String get resendEmail => 'ഇമെയിൽ വീണ്ടും അയയ്ക്കുക';

  @override
  String get verificationEmailResent => 'സ്ഥിരീകരണ ഇമെയിൽ വീണ്ടും അയച്ചു!';

  @override
  String get codeVerifyFailed =>
      'കോഡ് സ്ഥിരീകരിക്കാനായില്ല. വീണ്ടും ശ്രമിക്കുക.';

  @override
  String get newCodeSent => 'പുതിയ കോഡ് WhatsApp-ലേക്ക് അയയ്ക്കുന്നു.';

  @override
  String get verifyNumberTitle => 'നിങ്ങളുടെ നമ്പർ സ്ഥിരീകരിക്കുക';

  @override
  String get changeNumber => 'നമ്പർ മാറ്റുക';

  @override
  String get didntGetCode => 'കിട്ടിയില്ലേ?';

  @override
  String resendIn(String time) {
    return '$time കഴിഞ്ഞ് വീണ്ടും അയയ്ക്കാം';
  }

  @override
  String get commonSending => 'അയയ്ക്കുന്നു…';

  @override
  String get resendCode => 'കോഡ് വീണ്ടും അയയ്ക്കുക';

  @override
  String get otpTestServerNotice =>
      'ടെസ്റ്റ് സെർവർ: WhatsApp ബന്ധിപ്പിച്ചിട്ടില്ല, അതിനാൽ സെർവറിന്റെ ടെസ്റ്റ് കോഡ് ഉപയോഗിക്കുക.';

  @override
  String get verify => 'സ്ഥിരീകരിക്കുക';

  @override
  String get photoUpdateFailed =>
      'ഫോട്ടോ അപ്ഡേറ്റ് ചെയ്യാനായില്ല. വീണ്ടും ശ്രമിക്കുക.';

  @override
  String get photoUpdated => 'പ്രൊഫൈൽ ഫോട്ടോ അപ്ഡേറ്റ് ചെയ്തു';

  @override
  String get photoRemoved => 'പ്രൊഫൈൽ ഫോട്ടോ നീക്കം ചെയ്തു';

  @override
  String get splashSlow =>
      'പതിവിലും കൂടുതൽ സമയമെടുക്കുന്നു · തുടരാൻ ടാപ്പ് ചെയ്യുക';

  @override
  String dashExpiringSoon(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: 'അടുത്ത 7 ദിവസത്തിനുള്ളിൽ $count അംഗത്വങ്ങൾ അവസാനിക്കും',
      one: 'അടുത്ത 7 ദിവസത്തിനുള്ളിൽ 1 അംഗത്വം അവസാനിക്കും',
    );
    return '$_temp0';
  }

  @override
  String dashPeakHour(String hour) {
    return 'തിരക്കേറിയ സമയം $hour';
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
    return 'അറിയിപ്പുകൾ, $count എണ്ണം വായിക്കാത്തവ';
  }

  @override
  String dashTrialDaysLeft(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other:
          'സൗജന്യ ട്രയലിൽ $count ദിവസം ബാക്കി. എപ്പോൾ വേണമെങ്കിലും repsi.app-ൽ പ്ലാൻ തിരഞ്ഞെടുക്കാം.',
      one:
          'സൗജന്യ ട്രയലിൽ 1 ദിവസം ബാക്കി. എപ്പോൾ വേണമെങ്കിലും repsi.app-ൽ പ്ലാൻ തിരഞ്ഞെടുക്കാം.',
    );
    return '$_temp0';
  }

  @override
  String dashRevenueSemantics(String amount, String percent) {
    return 'ഈ മാസത്തെ വരുമാനം $amount, കഴിഞ്ഞ മാസത്തേക്കാൾ $percent ശതമാനം കൂടുതൽ';
  }

  @override
  String dashRevenueSemanticsDown(String amount, String percent) {
    return 'ഈ മാസത്തെ വരുമാനം $amount, കഴിഞ്ഞ മാസത്തേക്കാൾ $percent ശതമാനം കുറവ്';
  }

  @override
  String dashVsLastMonth(String percent) {
    return 'കഴിഞ്ഞ മാസത്തെ അപേക്ഷിച്ച് $percent%';
  }

  @override
  String dashCheckinsChartSemantics(int days, String values) {
    return 'കഴിഞ്ഞ $days ദിവസത്തെ ചെക്ക്-ഇന്നുകൾ: $values';
  }

  @override
  String dashCheckinsCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count ചെക്ക്-ഇന്നുകൾ',
      one: '1 ചെക്ക്-ഇൻ',
    );
    return '$_temp0';
  }

  @override
  String dashCheckedInCount(int count) {
    return '$count പേർ അകത്ത്';
  }

  @override
  String dashInSince(String time) {
    return '$time മുതൽ അകത്ത്';
  }

  @override
  String dashSeeAll(int count) {
    return 'എല്ലാ $count-ഉം കാണുക';
  }

  @override
  String searchNoResults(String query) {
    return '\"$query\" എന്നതിന് ഫലങ്ങളില്ല';
  }

  @override
  String searchMembersHeader(int count) {
    return 'അംഗങ്ങൾ ($count)';
  }

  @override
  String searchTrainersHeader(int count) {
    return 'പരിശീലകർ ($count)';
  }

  @override
  String searchFeaturesHeader(int count) {
    return 'ഫീച്ചറുകളും ഷോർട്ട്കട്ടുകളും ($count)';
  }

  @override
  String financeMembersCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count അംഗങ്ങൾ',
      one: '1 അംഗം',
    );
    return '$_temp0';
  }

  @override
  String financeDaysOverdue(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count ദിവസം വൈകി',
      one: '1 ദിവസം വൈകി',
    );
    return '$_temp0';
  }

  @override
  String financeMoreOnWeb(int count) {
    return '+ $count എണ്ണം കൂടി. പൂർണ്ണ റിപ്പോർട്ട് repsi.app-ൽ';
  }

  @override
  String memberCopied(String value) {
    return '$value പകർത്തി';
  }

  @override
  String memberLastVisit(String when) {
    return 'അവസാന സന്ദർശനം $when';
  }

  @override
  String memberPaidAcross(String amount, int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count പേയ്‌മെന്റുകളിലായി $amount അടച്ചു',
      one: '1 പേയ്‌മെന്റിലായി $amount അടച്ചു',
    );
    return '$_temp0';
  }

  @override
  String memberInSince(String time) {
    return '$time മുതൽ അകത്ത്';
  }

  @override
  String memberHistoryUntil(String label, String date) {
    return '$label · $date വരെ';
  }

  @override
  String memberRenewedOn(String name, String plan) {
    return '$name $plan പ്ലാനിൽ പുതുക്കി. പണം ലഭിക്കുമ്പോൾ പേയ്‌മെന്റ് രേഖപ്പെടുത്തുക.';
  }

  @override
  String memberRenewFor(String amount) {
    return '$amount-ന് പുതുക്കുക';
  }

  @override
  String memberPaymentRecorded(String amount, String name) {
    return '$name-ന് $amount രേഖപ്പെടുത്തി';
  }

  @override
  String memberEnded(String when) {
    return '$when-ന് അവസാനിച്ചു';
  }

  @override
  String memberEnds(String when) {
    return '$when-ന് അവസാനിക്കും';
  }

  @override
  String timeMinutesAgo(int count) {
    return '$count മി. മുമ്പ്';
  }

  @override
  String timeHoursAgo(int count) {
    return '$count മ. മുമ്പ്';
  }

  @override
  String timeDaysAgo(int count) {
    return '$count ദി. മുമ്പ്';
  }

  @override
  String opsCheckedOut(String name) {
    return '$name ചെക്ക്-ഔട്ട് ചെയ്തു';
  }

  @override
  String opsCheckedIn(String name) {
    return '$name ചെക്ക്-ഇൻ ചെയ്തു';
  }

  @override
  String opsInAt(String time, String duration) {
    return '$time-ന് അകത്ത് · $duration';
  }

  @override
  String opsFollowUp(String date) {
    return '$date-ന് ഫോളോ-അപ്പ്';
  }

  @override
  String opsLeadAdded(String name) {
    return '$name ലീഡുകളിൽ ചേർത്തു';
  }

  @override
  String opsQrRotates(String when) {
    return '$when-ന് മാറും';
  }

  @override
  String opsTeamHeader(int count) {
    return 'സ്റ്റാഫും പരിശീലകരും ($count)';
  }

  @override
  String opsYou(String name) {
    return '$name (നിങ്ങൾ)';
  }

  @override
  String workspaceGreeting(String name) {
    return 'സുപ്രഭാതം, $name';
  }

  @override
  String workspaceSlug(String slug) {
    return 'ലിങ്ക്: $slug';
  }

  @override
  String get yourGym => 'നിങ്ങളുടെ ജിം';

  @override
  String get errorLoadDashboardTitle => 'ഡാഷ്‌ബോർഡ് ലോഡ് ചെയ്യാനായില്ല';

  @override
  String get needsAttention => 'ശ്രദ്ധ ആവശ്യമാണ്';

  @override
  String get remindToRenew => 'ആക്സസ് തീരും മുമ്പ് പുതുക്കാൻ ഓർമ്മിപ്പിക്കുക';

  @override
  String get checkIns => 'ചെക്ക്-ഇന്നുകൾ';

  @override
  String get greetingMorning => 'സുപ്രഭാതം';

  @override
  String get greetingAfternoon => 'ശുഭ ഉച്ച';

  @override
  String get greetingEvening => 'ശുഭ സന്ധ്യ';

  @override
  String get accountAndSettings => 'അക്കൗണ്ടും ക്രമീകരണങ്ങളും';

  @override
  String get trialEnded =>
      'നിങ്ങളുടെ സൗജന്യ ട്രയൽ അവസാനിച്ചു. REPSI തുടർന്നും ഉപയോഗിക്കാൻ repsi.app-ൽ ഒരു പ്ലാൻ തിരഞ്ഞെടുക്കുക.';

  @override
  String get revenueThisMonth => 'ഈ മാസത്തെ വരുമാനം';

  @override
  String get checkInsToday => 'ഇന്നത്തെ ചെക്ക്-ഇന്നുകൾ';

  @override
  String get activeMembers => 'സജീവ അംഗങ്ങൾ';

  @override
  String get renewalsDue => 'പുതുക്കാനുള്ളവ';

  @override
  String get addMember => 'അംഗത്തെ ചേർക്കുക';

  @override
  String get noCheckinsThisWeek =>
      'ഈ ആഴ്ച ഇതുവരെ ചെക്ക്-ഇന്നുകളൊന്നും രേഖപ്പെടുത്തിയിട്ടില്ല.';

  @override
  String get errorLoadCheckedIn => 'ആരൊക്കെ അകത്തുണ്ടെന്ന് ലോഡ് ചെയ്യാനായില്ല.';

  @override
  String get memberships => 'അംഗത്വങ്ങൾ';

  @override
  String get reports => 'റിപ്പോർട്ടുകൾ';

  @override
  String get searchAttendanceDesc =>
      'അംഗങ്ങളെ ചെക്ക്-ഇൻ/ഔട്ട് ചെയ്യുക, ആരൊക്കെ അകത്തുണ്ടെന്ന് കാണുക';

  @override
  String get searchMembersDesc => 'പ്രൊഫൈലുകൾ, അംഗത്വങ്ങൾ, പുതുക്കലുകൾ';

  @override
  String get leads => 'ലീഡുകൾ';

  @override
  String get searchLeadsDesc => 'അന്വേഷണങ്ങൾ, ട്രയലുകൾ, ഫോളോ-അപ്പുകൾ';

  @override
  String get searchFinanceDesc => 'പിരിവുകൾ, കുടിശ്ശിക, ചെലവുകൾ';

  @override
  String get businessInsights => 'ബിസിനസ് ഇൻസൈറ്റുകൾ';

  @override
  String get searchInsightsDesc => 'എന്ത് മാറി, ഇനി എന്ത് ചെയ്യണം';

  @override
  String get insights => 'ഇൻസൈറ്റുകൾ';

  @override
  String get searchNotificationsDesc => 'അലേർട്ടുകളും അറിയിപ്പുകളും';

  @override
  String get account => 'അക്കൗണ്ട്';

  @override
  String get searchSettingsDesc => 'പ്രൊഫൈൽ, ബ്രാഞ്ചുകൾ, പ്ലാനുകൾ, രൂപം';

  @override
  String get searchFailed =>
      'അംഗങ്ങളെയും പരിശീലകരെയും തിരയാനായില്ല. കണക്ഷൻ പരിശോധിക്കുക.';

  @override
  String get searchHint => 'അംഗങ്ങൾ, പരിശീലകർ, ഫീച്ചറുകൾ തിരയുക…';

  @override
  String get recent => 'സമീപകാലം';

  @override
  String get quickAccess => 'വേഗത്തിലുള്ള ആക്സസ്';

  @override
  String get searchUnavailable => 'തിരയൽ ലഭ്യമല്ല';

  @override
  String get searchEmptyHint =>
      'അംഗത്തിന്റെ പേര്, ഫോൺ നമ്പർ, അംഗ കോഡ്, അല്ലെങ്കിൽ ഹാജർ പോലുള്ള സ്ക്രീൻ തിരയുക.';

  @override
  String get memberIdLabel => 'അംഗ ഐഡി:';

  @override
  String get coach => 'കോച്ച്';

  @override
  String get specStrength => 'സ്ട്രെങ്ത് & കണ്ടീഷനിംഗ്';

  @override
  String get errorLoadFinance => 'സാമ്പത്തിക വിവരങ്ങൾ ലോഡ് ചെയ്യാനായില്ല';

  @override
  String get collectedThisMonth => 'ഈ മാസം പിരിച്ചത്';

  @override
  String get expenses => 'ചെലവുകൾ';

  @override
  String get net => 'അറ്റാദായം';

  @override
  String get duesToCollect => 'പിരിക്കാനുള്ള കുടിശ്ശിക';

  @override
  String get collections => 'പിരിവുകൾ';

  @override
  String get last6Months => 'കഴിഞ്ഞ 6 മാസം';

  @override
  String get noCollections =>
      'കഴിഞ്ഞ ആറ് മാസത്തിൽ പിരിവുകളൊന്നും രേഖപ്പെടുത്തിയിട്ടില്ല.';

  @override
  String get nothingOutstanding =>
      'കുടിശ്ശികയൊന്നുമില്ല. എല്ലാ ഇൻവോയ്സുകളും അടച്ചു.';

  @override
  String get dueNow => 'ഇപ്പോൾ അടയ്ക്കേണ്ടത്';

  @override
  String get recentExpenses => 'സമീപകാല ചെലവുകൾ';

  @override
  String get noExpenses => 'ഇതുവരെ ചെലവുകളൊന്നും രേഖപ്പെടുത്തിയിട്ടില്ല.';

  @override
  String get historyJoined => 'ചേർന്നു';

  @override
  String get historyStarted => 'അംഗത്വം ആരംഭിച്ചു';

  @override
  String get historyRenewed => 'അംഗത്വം പുതുക്കി';

  @override
  String get historyExpired => 'അംഗത്വം കാലഹരണപ്പെട്ടു';

  @override
  String get historyFrozen => 'അംഗത്വം മരവിപ്പിച്ചു';

  @override
  String get historyResumed => 'അംഗത്വം പുനരാരംഭിച്ചു';

  @override
  String get historyFreezeCancelled => 'മരവിപ്പിക്കൽ റദ്ദാക്കി';

  @override
  String get historyExtended => 'അംഗത്വം നീട്ടി';

  @override
  String get historyCancelled => 'അംഗത്വം റദ്ദാക്കി';

  @override
  String get historyStatusChanged => 'അക്കൗണ്ട് നില മാറി';

  @override
  String get historyNoteAdded => 'കുറിപ്പ് ചേർത്തു';

  @override
  String get historyNoteEdited => 'കുറിപ്പ് തിരുത്തി';

  @override
  String get historyNoteDeleted => 'കുറിപ്പ് ഇല്ലാതാക്കി';

  @override
  String get historyProfileUpdated => 'പ്രൊഫൈൽ അപ്ഡേറ്റ് ചെയ്തു';

  @override
  String get plan => 'പ്ലാൻ';

  @override
  String get memberAdded => 'അംഗത്തെ ചേർത്തു';

  @override
  String get memberAddFailed => 'അംഗത്തെ ചേർക്കാനായില്ല. വീണ്ടും ശ്രമിക്കുക.';

  @override
  String get addNewMember => 'പുതിയ അംഗത്തെ ചേർക്കുക';

  @override
  String get fullNameRequiredLabel => 'മുഴുവൻ പേര് *';

  @override
  String get nameRequired => 'പേര് ആവശ്യമാണ്';

  @override
  String get emailRequiredLabel => 'ഇമെയിൽ വിലാസം *';

  @override
  String get phoneNumber => 'ഫോൺ നമ്പർ';

  @override
  String get emergencyContactPhone => 'അടിയന്തര ബന്ധപ്പെടൽ നമ്പർ';

  @override
  String get membershipPlan => 'അംഗത്വ പ്ലാൻ';

  @override
  String get saveMember => 'അംഗത്തെ സംരക്ഷിക്കുക';

  @override
  String get errorLoadMember => 'ഈ അംഗത്തെ ലോഡ് ചെയ്യാനായില്ല';

  @override
  String get renew => 'പുതുക്കുക';

  @override
  String get overview => 'അവലോകനം';

  @override
  String get visits => 'സന്ദർശനങ്ങൾ';

  @override
  String get history => 'ചരിത്രം';

  @override
  String get errorLoadThis => 'ഈ ഭാഗം ലോഡ് ചെയ്യാനായില്ല';

  @override
  String get noPlan => 'പ്ലാൻ ഇല്ല';

  @override
  String get ended => 'അവസാനിച്ചു';

  @override
  String get ends => 'അവസാനിക്കുന്നത്';

  @override
  String get memberSince => 'അംഗമായത്';

  @override
  String get gender => 'ലിംഗഭേദം';

  @override
  String get emergencyContact => 'അടിയന്തര ബന്ധപ്പെടൽ';

  @override
  String get errorLoadVisits => 'സന്ദർശനങ്ങൾ ലോഡ് ചെയ്യാനായില്ല.';

  @override
  String get noVisitsYet => 'ഇതുവരെ സന്ദർശനങ്ങളില്ല';

  @override
  String get notes => 'കുറിപ്പുകൾ';

  @override
  String get errorLoadNotes => 'കുറിപ്പുകൾ ലോഡ് ചെയ്യാനായില്ല.';

  @override
  String get noNotes =>
      'ഇതുവരെ കുറിപ്പുകളില്ല. ഫ്രണ്ട് ഡെസ്ക് അറിയേണ്ട കാര്യങ്ങൾ ചേർക്കുക.';

  @override
  String get noPaymentsForMember =>
      'ഈ അംഗത്തിന് ഇതുവരെ പേയ്‌മെന്റുകളൊന്നും രേഖപ്പെടുത്തിയിട്ടില്ല.';

  @override
  String get noVisitsRecorded =>
      'ഇതുവരെ സന്ദർശനങ്ങളൊന്നും രേഖപ്പെടുത്തിയിട്ടില്ല.';

  @override
  String get noHistory => 'ഇതുവരെ ചരിത്രമില്ല.';

  @override
  String get system => 'സിസ്റ്റം';

  @override
  String get renewMembership => 'അംഗത്വം പുതുക്കുക';

  @override
  String get recordPayment => 'പേയ്‌മെന്റ് രേഖപ്പെടുത്തുക';

  @override
  String get amountRupees => 'തുക (₹)';

  @override
  String get enterAmountReceived => 'ലഭിച്ച തുക നൽകുക';

  @override
  String get noteOptional => 'കുറിപ്പ് (ഓപ്ഷണൽ)';

  @override
  String get paymentNoteHint => 'ഉദാ. ത്രൈമാസ പുതുക്കൽ, UPI റഫ്';

  @override
  String get savePayment => 'പേയ്‌മെന്റ് സംരക്ഷിക്കുക';

  @override
  String get addNote => 'കുറിപ്പ് ചേർക്കുക';

  @override
  String get noteHint => 'സ്റ്റാഫ് എന്താണ് അറിയേണ്ടത്?';

  @override
  String get saveNote => 'കുറിപ്പ് സംരക്ഷിക്കുക';

  @override
  String get endingSoon => 'ഉടൻ അവസാനിക്കുന്നവ';

  @override
  String get searchMembersHint => 'പേര്, ഫോൺ, ഇമെയിൽ തിരയുക';

  @override
  String get noMembersMatch => 'പൊരുത്തപ്പെടുന്ന അംഗങ്ങളില്ല';

  @override
  String get noMembersYet => 'ഇതുവരെ അംഗങ്ങളില്ല';

  @override
  String get tryAnotherSearch =>
      'മറ്റൊരു പേര്, ഫോൺ നമ്പർ അല്ലെങ്കിൽ ഫിൽട്ടർ പരീക്ഷിക്കുക.';

  @override
  String get addFirstMember =>
      'അംഗത്വങ്ങളും സന്ദർശനങ്ങളും ട്രാക്ക് ചെയ്യാൻ ആദ്യ അംഗത്തെ ചേർക്കുക.';

  @override
  String get branches => 'ബ്രാഞ്ചുകൾ';

  @override
  String get membershipPlans => 'അംഗത്വ പ്ലാനുകൾ';

  @override
  String get addTrainer => 'പരിശീലകനെ ചേർക്കുക';

  @override
  String get addTrainerDesc => 'ജിം കോച്ചിനെയോ പേഴ്സണൽ ട്രെയിനറെയോ ചേർക്കുക';

  @override
  String get app => 'ആപ്പ്';

  @override
  String get darkMode => 'ഡാർക്ക് മോഡ്';

  @override
  String get onTheWeb => 'വെബ്ബിൽ';

  @override
  String get onTheWebTitle =>
      'ബില്ലിംഗ്, സ്റ്റാഫ് റോളുകൾ, റിപ്പോർട്ടുകൾ, വെബ്സൈറ്റ്';

  @override
  String get manageOnWeb => 'ഇവ repsi.app-ൽ നിയന്ത്രിക്കുക';

  @override
  String get errorLoadBranches => 'ബ്രാഞ്ചുകൾ ലോഡ് ചെയ്യാനായില്ല.';

  @override
  String get branch => 'ബ്രാഞ്ച്';

  @override
  String get mainBranch => 'പ്രധാനം';

  @override
  String get editBranchesOnWeb =>
      'ബ്രാഞ്ചുകൾ repsi.app-ൽ ചേർക്കുകയോ തിരുത്തുകയോ ചെയ്യുക.';

  @override
  String get errorLoadPlans => 'പ്ലാനുകൾ ലോഡ് ചെയ്യാനായില്ല.';

  @override
  String get noPlansYet =>
      'ഇതുവരെ പ്ലാനുകളില്ല. repsi.app-ൽ പ്ലാനുകൾ സൃഷ്ടിക്കുക.';

  @override
  String get markAllRead => 'എല്ലാം വായിച്ചതായി അടയാളപ്പെടുത്തുക';

  @override
  String get unread => 'വായിക്കാത്തവ';

  @override
  String get billing => 'ബില്ലിംഗ്';

  @override
  String get announcements => 'പ്രഖ്യാപനങ്ങൾ';

  @override
  String get notificationsUnavailable => 'അറിയിപ്പുകൾ ലഭ്യമല്ല';

  @override
  String get noNotifications => 'അറിയിപ്പുകളില്ല';

  @override
  String get noNotificationsDesc =>
      'എല്ലാം കണ്ടുകഴിഞ്ഞു! ജിം അംഗത്വം, ക്ലാസുകൾ, പേയ്‌മെന്റുകൾ എന്നിവയെക്കുറിച്ചുള്ള അപ്ഡേറ്റുകൾ ഇവിടെ കാണാം.';

  @override
  String get leadNew => 'പുതിയത്';

  @override
  String get leadContacted => 'ബന്ധപ്പെട്ടു';

  @override
  String get leadVisitBooked => 'സന്ദർശനം ബുക്ക് ചെയ്തു';

  @override
  String get leadTrial => 'ട്രയൽ';

  @override
  String get leadNegotiating => 'ചർച്ചയിൽ';

  @override
  String get leadLost => 'നഷ്ടമായി';

  @override
  String get checkInQr => 'ചെക്ക്-ഇൻ QR';

  @override
  String get team => 'ടീം';

  @override
  String get errorLoadToday => 'ഇന്നത്തെ കണക്കുകൾ ലോഡ് ചെയ്യാനായില്ല.';

  @override
  String get insideNow => 'ഇപ്പോൾ അകത്ത്';

  @override
  String get avgStay => 'ശരാശരി സമയം';

  @override
  String get checkInMember => 'അംഗത്തെ ചെക്ക്-ഇൻ ചെയ്യുക';

  @override
  String get searchNameOrPhone => 'പേരോ ഫോണോ തിരയുക';

  @override
  String get typeTwoLetters =>
      'പേരിന്റെയോ ഫോൺ നമ്പറിന്റെയോ കുറഞ്ഞത് രണ്ട് അക്ഷരങ്ങൾ ടൈപ്പ് ചെയ്യുക.';

  @override
  String get errorLoadLeads => 'ലീഡുകൾ ലോഡ് ചെയ്യാനായില്ല';

  @override
  String get noLeadsYet => 'ഇതുവരെ ലീഡുകളില്ല';

  @override
  String get noLeadsInStage => 'ഈ ഘട്ടത്തിൽ ലീഡുകളില്ല';

  @override
  String get leadsEmptyDesc =>
      'ആരും വിട്ടുപോകാതിരിക്കാൻ വാക്ക്-ഇന്നുകളും അന്വേഷണങ്ങളും രേഖപ്പെടുത്തുക.';

  @override
  String get addLead => 'ലീഡ് ചേർക്കുക';

  @override
  String get newLead => 'പുതിയ ലീഡ്';

  @override
  String get sourceWalkIn => 'വാക്ക്-ഇൻ';

  @override
  String get sourceInstagram => 'Instagram';

  @override
  String get sourceWebsite => 'വെബ്സൈറ്റ്';

  @override
  String get sourceReferral => 'റഫറൽ';

  @override
  String get sourceGoogle => 'Google';

  @override
  String get sourcePhoneCall => 'ഫോൺ കോൾ';

  @override
  String get name => 'പേര്';

  @override
  String get enterTheirName => 'അവരുടെ പേര് നൽകുക';

  @override
  String get interestedIn => 'താൽപ്പര്യം (ഓപ്ഷണൽ)';

  @override
  String get interestedInHint => 'ഉദാ. ത്രൈമാസ പ്ലാൻ, PT';

  @override
  String get saveLead => 'ലീഡ് സംരക്ഷിക്കുക';

  @override
  String get errorLoadQr => 'ചെക്ക്-ഇൻ QR ലോഡ് ചെയ്യാനായില്ല';

  @override
  String get qrDesc =>
      'അംഗങ്ങൾ REPSI ആപ്പ് ഉപയോഗിച്ച് ഇത് സ്കാൻ ചെയ്ത് സ്വയം ചെക്ക്-ഇൻ ചെയ്യും. ഫ്രണ്ട് ഡെസ്കിൽ കാണിക്കുകയോ പ്രിന്റ് ചെയ്യുകയോ ചെയ്യുക.';

  @override
  String get qrSemantics => 'ജിം ചെക്ക്-ഇൻ QR കോഡ്';

  @override
  String get refresh => 'പുതുക്കുക';

  @override
  String get errorLoadTeam => 'നിങ്ങളുടെ ടീമിനെ ലോഡ് ചെയ്യാനായില്ല';

  @override
  String get teamDesc =>
      'ഫോണിൽ നിന്ന് തന്നെ പരിശീലകരെ ചേർക്കുകയും സ്റ്റാഫ് റോളുകൾ നിയന്ത്രിക്കുകയും ചെയ്യുക.';

  @override
  String get chooseGym => 'നിങ്ങളുടെ ജിം തിരഞ്ഞെടുക്കുക';

  @override
  String get chooseGymSubtitle =>
      'ഇന്ന് കാണാനും നിയന്ത്രിക്കാനും ആഗ്രഹിക്കുന്ന ജിം തിരഞ്ഞെടുക്കുക.';

  @override
  String get noGymsFound => 'ജിമ്മുകളൊന്നും കണ്ടെത്തിയില്ല';

  @override
  String get registerGymOnWeb =>
      'വർക്ക്‌സ്‌പേസ് സജീവമാക്കാൻ repsi.app-ൽ ജിം രജിസ്റ്റർ ചെയ്യുക.';

  @override
  String get gymWorkspace => 'ജിം';

  @override
  String get openWorkspace => 'തുറക്കുക';

  @override
  String get registerAnotherGym => 'മറ്റൊരു ജിം രജിസ്റ്റർ ചെയ്യണോ?';

  @override
  String get createGymOnDesktop =>
      'ജിമ്മുകൾ കമ്പ്യൂട്ടറിൽ നിന്ന് repsi.app-ൽ സൃഷ്ടിക്കണം.';

  @override
  String memberExpiredOn(String date) {
    return '$date-ന് കാലഹരണപ്പെട്ടു';
  }

  @override
  String memberValidUntil(String date) {
    return '$date വരെ സാധുവാണ്';
  }

  @override
  String memberCheckedInSince(String time) {
    return '$time മുതൽ ചെക്ക്-ഇൻ ചെയ്തിരിക്കുന്നു';
  }

  @override
  String healthAverageSteps(String steps) {
    return '7 ദിവസത്തെ ശരാശരി: $steps ചുവടുകൾ';
  }

  @override
  String healthSyncedAt(String time) {
    return '$time-ന് സമന്വയിപ്പിച്ചു';
  }

  @override
  String healthStepsSummary(String total, String average) {
    return 'ആകെ $total · ദിവസം $average';
  }

  @override
  String paymentRefLine(String ref, String method) {
    return 'റഫ്: $ref · $method';
  }

  @override
  String receiptNumberLine(String number) {
    return 'രസീത് നമ്പർ: $number';
  }

  @override
  String receiptDescriptionLine(String text) {
    return 'വിവരണം: $text';
  }

  @override
  String receiptAmountLine(String amount) {
    return 'അടച്ച തുക: $amount';
  }

  @override
  String receiptModeLine(String mode) {
    return 'പേയ്‌മെന്റ് രീതി: $mode';
  }

  @override
  String receiptStatusLine(String status) {
    return 'നില: $status';
  }

  @override
  String qrSince(String time) {
    return '$time മുതൽ';
  }

  @override
  String qrInAt(String time) {
    return '$time-ന് അകത്ത്';
  }

  @override
  String chatUnread(int count) {
    return '$count വായിക്കാത്തവ';
  }

  @override
  String chatNotSent(String error) {
    return 'അയച്ചില്ല: $error';
  }

  @override
  String get chatRead => 'വായിച്ചു';

  @override
  String workoutLogExercise(String name) {
    return '$name രേഖപ്പെടുത്തുക';
  }

  @override
  String weightKg(String value) {
    return '$value കി.ഗ്രാം';
  }

  @override
  String exPrimary(String muscle, String category) {
    return 'പ്രധാനം: $muscle ($category)';
  }

  @override
  String exSecondary(String muscle) {
    return 'ദ്വിതീയം: $muscle';
  }

  @override
  String exSetsCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count സെറ്റുകൾ',
      one: '1 സെറ്റ്',
    );
    return '$_temp0';
  }

  @override
  String exRepsCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count റെപ്പുകൾ',
      one: '1 റെപ്',
    );
    return '$_temp0';
  }

  @override
  String exSetsReps(int sets, int reps) {
    return '$sets സെറ്റുകൾ · $reps റെപ്പുകൾ';
  }

  @override
  String exAllCount(int count) {
    return 'എല്ലാം ($count)';
  }

  @override
  String exFavsCount(int count) {
    return 'പ്രിയപ്പെട്ടവ ($count)';
  }

  @override
  String exSelectedCount(int count) {
    return 'തിരഞ്ഞെടുത്ത വ്യായാമങ്ങൾ ($count)';
  }

  @override
  String exBasketCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count വ്യായാമങ്ങൾ തിരഞ്ഞെടുത്തു',
      one: '1 വ്യായാമം തിരഞ്ഞെടുത്തു',
    );
    return '$_temp0';
  }

  @override
  String exWorkoutSaved(String name) {
    return '\"$name\" വർക്കൗട്ട് എന്റെ വർക്കൗട്ടുകളിൽ സംരക്ഷിച്ചു!';
  }

  @override
  String exCoachNote(String note) {
    return 'കോച്ചിന്റെ കുറിപ്പ്: \"$note\"';
  }

  @override
  String exRestSeconds(int count) {
    return '$count സെ.';
  }

  @override
  String get myPass => 'എന്റെ പാസ്';

  @override
  String get aiCoach => 'AI കോച്ച്';

  @override
  String get errorLoadMembership => 'നിങ്ങളുടെ അംഗത്വം ലോഡ് ചെയ്യാനായില്ല.';

  @override
  String get noMembershipYet =>
      'ഇതുവരെ അംഗത്വമില്ല. ഒന്ന് സജ്ജമാക്കാൻ ജിമ്മിനോട് ആവശ്യപ്പെടുക.';

  @override
  String get errorLoadYourAttendance => 'നിങ്ങളുടെ ഹാജർ ലോഡ് ചെയ്യാനായില്ല.';

  @override
  String get checkInWithQr => 'QR ഉപയോഗിച്ച് ചെക്ക്-ഇൻ';

  @override
  String get healthAndroidOnly =>
      'Health Connect ഉള്ള Android ഫോണുകളിൽ പ്രവർത്തന ട്രാക്കിംഗ് ലഭ്യമാണ്.';

  @override
  String get healthConnectPitch =>
      'Google Fit-ലും മറ്റ് ആപ്പുകളിലും നിന്നുള്ള ചുവടുകൾ, ദൂരം, സജീവ കലോറി എന്നിവ കാണാൻ Health Connect ബന്ധിപ്പിക്കുക. ഈ മൂന്ന് ആകെത്തുകകൾ മാത്രമേ വായിക്കൂ; എപ്പോൾ വേണമെങ്കിലും വിച്ഛേദിച്ച് ഇല്ലാതാക്കാം.';

  @override
  String get healthConnectNeeded =>
      'Google Fit-ൽ നിന്നും മറ്റ് ഫിറ്റ്‌നസ് ആപ്പുകളിൽ നിന്നും ചുവടുകൾ വായിക്കാൻ Health Connect ആവശ്യമാണ്.';

  @override
  String get healthConnect => 'Health Connect ബന്ധിപ്പിക്കുക';

  @override
  String get healthUpdate => 'Health Connect അപ്ഡേറ്റ് ചെയ്യുക';

  @override
  String get healthInstall => 'Health Connect ഇൻസ്റ്റാൾ ചെയ്യുക';

  @override
  String get steps => 'ചുവടുകൾ';

  @override
  String get activeKcal => 'സജീവ kcal';

  @override
  String get syncNow => 'ഇപ്പോൾ സമന്വയിപ്പിക്കുക';

  @override
  String get disconnect => 'വിച്ഛേദിക്കുക';

  @override
  String get todaysActivity => 'ഇന്നത്തെ പ്രവർത്തനം';

  @override
  String get healthDisconnectTitle => 'Health Connect വിച്ഛേദിക്കണോ?';

  @override
  String get healthDisconnectBody =>
      'REPSI സമന്വയം നിർത്തുകയും നിങ്ങൾക്കായി സൂക്ഷിച്ച പ്രവർത്തന ആകെത്തുകകൾ ഇല്ലാതാക്കുകയും ചെയ്യും.';

  @override
  String get aiWorkoutCoach => 'AI വർക്കൗട്ട് കോച്ച്';

  @override
  String get paymentsAndInvoices => 'പേയ്‌മെന്റുകളും ഇൻവോയ്സുകളും';

  @override
  String get notificationsAndAlerts => 'അറിയിപ്പുകളും അലേർട്ടുകളും';

  @override
  String get membershipAndPayments => 'അംഗത്വവും പേയ്‌മെന്റുകളും';

  @override
  String get membershipDetails => 'അംഗത്വ വിവരങ്ങൾ';

  @override
  String get membershipDetailsUnavailable =>
      'നിലവിലെ പ്ലാനും പുതുക്കൽ ഓപ്ഷനുകളും ഇവിടെ ഇതുവരെ ലഭ്യമല്ല. അംഗത്വം ഉറപ്പാക്കാൻ ജിമ്മുമായി ബന്ധപ്പെടുക.';

  @override
  String get paymentHistoryHeader => 'പേയ്‌മെന്റ് ചരിത്രവും രസീതുകളും';

  @override
  String get digitalReceipt => 'പേയ്‌മെന്റ് രസീത്';

  @override
  String get scanMemberPass => 'അംഗ പാസ് സ്കാൻ ചെയ്യുക';

  @override
  String get scanGymQr => 'ജിം QR സ്കാൻ ചെയ്യുക';

  @override
  String get toggleFlashlight => 'ഫ്ലാഷ്‌ലൈറ്റ് ഓൺ/ഓഫ് ചെയ്യുക';

  @override
  String get cameraAccessOff => 'ക്യാമറ ആക്സസ് ഓഫാണ്';

  @override
  String get cameraUnavailable => 'ക്യാമറ ലഭ്യമല്ല';

  @override
  String get cameraAccessOffDesc =>
      'ജിം QR സ്കാൻ ചെയ്യാൻ ഫോൺ ക്രമീകരണങ്ങളിൽ REPSI-ക്ക് ക്യാമറ ആക്സസ് നൽകുക, അല്ലെങ്കിൽ ഫ്രണ്ട് ഡെസ്കിനോട് ചെക്ക്-ഇൻ ചെയ്യാൻ പറയുക.';

  @override
  String get cameraStartFailed =>
      'ക്യാമറ ആരംഭിക്കാനായില്ല. ഫ്രണ്ട് ഡെസ്കിനോട് ചെക്ക്-ഇൻ ചെയ്യാൻ പറയുക.';

  @override
  String get notRepsiQr =>
      'ഇത് REPSI ജിം QR കോഡ് അല്ല. ജിം പ്രവേശന കവാടത്തിലെ കോഡ് സ്കാൻ ചെയ്യുക.';

  @override
  String get checkedInGreat =>
      'ചെക്ക്-ഇൻ ചെയ്തു. നല്ലൊരു വർക്കൗട്ട് ആശംസിക്കുന്നു!';

  @override
  String get checkOutTitle => 'ചെക്ക്-ഔട്ട് ചെയ്യണോ?';

  @override
  String get checkOutBody => 'ഇത് നിലവിലെ ജിം സന്ദർശനം അവസാനിപ്പിക്കും.';

  @override
  String get checkedOutBye => 'ചെക്ക്-ഔട്ട് ചെയ്തു. വീണ്ടും കാണാം!';

  @override
  String get pointCamera =>
      'ജിം പ്രവേശന കവാടത്തിലെ QR കോഡിലേക്ക് ക്യാമറ നീട്ടുക.';

  @override
  String get youAreCheckedIn => 'നിങ്ങൾ ചെക്ക്-ഇൻ ചെയ്തിരിക്കുന്നു';

  @override
  String get youAreNotCheckedIn => 'നിങ്ങൾ ചെക്ക്-ഇൻ ചെയ്തിട്ടില്ല';

  @override
  String get noVisitsYetDesc =>
      'ഇതുവരെ സന്ദർശനങ്ങളില്ല. നിങ്ങളുടെ ചെക്ക്-ഇന്നുകൾ ഇവിടെ കാണാം.';

  @override
  String get recentVisits => 'സമീപകാല സന്ദർശനങ്ങൾ';

  @override
  String get memberPassSemantics => 'നിങ്ങളുടെ REPSI അംഗ പാസ് QR കോഡ്';

  @override
  String get showFrontDesk => 'ഇത് ഫ്രണ്ട് ഡെസ്കിൽ കാണിക്കുക';

  @override
  String get passRefreshNote =>
      'ഇത് സ്വയം പുതുക്കും, നിങ്ങളുടെ ജിമ്മിൽ മാത്രമേ പ്രവർത്തിക്കൂ. സ്ക്രീൻഷോട്ട് പങ്കിടരുത്.';

  @override
  String get scanMemberPassDesc =>
      'ചെക്ക്-ഇൻ അല്ലെങ്കിൽ ചെക്ക്-ഔട്ട് ചെയ്യാൻ അംഗത്തിന്റെ പാസ് സ്കാൻ ചെയ്യുക.';

  @override
  String get activity => 'പ്രവർത്തനം';

  @override
  String get errorLoadGymVisits =>
      'നിങ്ങളുടെ ജിം സന്ദർശനങ്ങൾ ലോഡ് ചെയ്യാനായില്ല.';

  @override
  String get gymVisits => 'ജിം സന്ദർശനങ്ങൾ';

  @override
  String get avgVisit => 'ശരാശരി സന്ദർശനം';

  @override
  String get noVisitsStartStreak =>
      'ഇതുവരെ സന്ദർശനങ്ങളില്ല. സ്ട്രീക്ക് തുടങ്ങാൻ ജിമ്മിൽ ചെക്ക്-ഇൻ ചെയ്യുക.';

  @override
  String get inProgress => 'നടന്നുകൊണ്ടിരിക്കുന്നു';

  @override
  String get healthStepsAndroidOnly =>
      'ചുവട് ട്രാക്കിംഗിന് Health Connect ഉള്ള Android ഫോൺ ആവശ്യമാണ്.';

  @override
  String get healthConnectFromHome =>
      'ചുവടുകൾ, ദൂരം, സജീവ കലോറി എന്നിവ ഇവിടെ കാണാൻ ഹോം ടാബിൽ നിന്ന് Health Connect ബന്ധിപ്പിക്കുക.';

  @override
  String get stepsThisWeek => 'ഈ ആഴ്ചത്തെ ചുവടുകൾ';

  @override
  String get stepsChartSemantics =>
      'കഴിഞ്ഞ ഏഴ് ദിവസത്തെ ചുവടുകളുടെ ബാർ ചാർട്ട്';

  @override
  String get messages => 'സന്ദേശങ്ങൾ';

  @override
  String get noConversationsTrainer =>
      'ഇതുവരെ സംഭാഷണങ്ങളില്ല. ഒരു ക്ലയന്റിനെ തുറന്ന് സന്ദേശം ടാപ്പ് ചെയ്യുക.';

  @override
  String get noConversationsMember =>
      'ഒരു പരിശീലകനെ നിയോഗിച്ചാൽ, ഇവിടെ സന്ദേശം അയയ്ക്കാം.';

  @override
  String get noMessagesYet => 'ഇതുവരെ സന്ദേശങ്ങളില്ല';

  @override
  String get sayHello => 'സംഭാഷണം തുടങ്ങാൻ ഹലോ പറയൂ.';

  @override
  String get writeMessage => 'ഒരു സന്ദേശം എഴുതുക…';

  @override
  String get sendMessage => 'സന്ദേശം അയയ്ക്കുക';

  @override
  String get chatReadOnly =>
      'ഈ പരിശീലകനെ ഇപ്പോൾ നിയോഗിച്ചിട്ടില്ല, അതിനാൽ സംഭാഷണം വായിക്കാൻ മാത്രം.';

  @override
  String get targetWeight => 'ലക്ഷ്യ ഭാരം';

  @override
  String get repsPerSet => 'ഒരു സെറ്റിലെ റെപ്പുകൾ';

  @override
  String get saveSets => 'സെറ്റുകൾ സംരക്ഷിക്കുക';

  @override
  String get todaysWorkout => 'ഇന്നത്തെ വർക്കൗട്ട്';

  @override
  String get workoutProgress => 'വർക്കൗട്ട് പുരോഗതി';

  @override
  String get targetSixExercises => 'ലക്ഷ്യം: 6 വ്യായാമങ്ങൾ';

  @override
  String get estDuration => 'ഏകദേശം 45–50 മിനിറ്റ്';

  @override
  String get logged => 'രേഖപ്പെടുത്തി';

  @override
  String get log => 'രേഖപ്പെടുത്തുക';

  @override
  String get completeWorkout => 'വർക്കൗട്ട് പൂർത്തിയാക്കുക';

  @override
  String get workoutSummary => 'വർക്കൗട്ട് സംഗ്രഹം';

  @override
  String get workoutComplete => 'വർക്കൗട്ട് പൂർത്തിയായി!';

  @override
  String get workoutRecorded =>
      'മികച്ച പ്രകടനം! Upper Body A നിങ്ങളുടെ ഫിറ്റ്‌നസ് പ്രൊഫൈലിൽ സംരക്ഷിച്ചു.';

  @override
  String get streakPlusOne => '+1 വർക്കൗട്ട് സ്ട്രീക്ക്';

  @override
  String get streakFive => 'ഗംഭീരം! തുടർച്ചയായി 5 ദിവസം.';

  @override
  String get activeBurn => 'സജീവമായി കത്തിച്ചത്';

  @override
  String get duration => 'ദൈർഘ്യം';

  @override
  String get exercises => 'വ്യായാമങ്ങൾ';

  @override
  String get totalVolume => 'ആകെ വോളിയം';

  @override
  String get newPersonalRecord => 'പുതിയ വ്യക്തിഗത റെക്കോർഡ്!';

  @override
  String get howDidItFeel => 'ഈ വർക്കൗട്ട് എങ്ങനെയുണ്ടായിരുന്നു?';

  @override
  String get saveAndReturn => 'സംരക്ഷിച്ച് മടങ്ങുക';

  @override
  String get workoutSavedSynced => 'വർക്കൗട്ട് സംരക്ഷിച്ചു.';

  @override
  String get targetMuscles => 'ലക്ഷ്യ പേശികൾ';

  @override
  String get sets => 'സെറ്റുകൾ';

  @override
  String get reps => 'റെപ്പുകൾ';

  @override
  String get rest => 'വിശ്രമം';

  @override
  String get whyThisExercise => 'എന്തിനാണ് ഈ വ്യായാമം? (കോച്ചിന്റെ കുറിപ്പ്)';

  @override
  String get howToPerform => 'ചെയ്യേണ്ട വിധം';

  @override
  String get favourited => 'പ്രിയപ്പെട്ടവയിൽ ചേർത്തു';

  @override
  String get favourite => 'പ്രിയപ്പെട്ടവയിൽ ചേർക്കുക';

  @override
  String get inWorkoutPlan => 'വർക്കൗട്ട് പ്ലാനിലുണ്ട്';

  @override
  String get addToWorkout => 'വർക്കൗട്ടിൽ ചേർക്കുക';

  @override
  String get workoutBuilder => 'വർക്കൗട്ട് ബിൽഡർ';

  @override
  String get routineName => 'റൂട്ടീൻ പേര്';

  @override
  String get noExercisesSelected =>
      'വ്യായാമങ്ങളൊന്നും തിരഞ്ഞെടുത്തിട്ടില്ല.\nഏതെങ്കിലും വ്യായാമ കാർഡിൽ \"വർക്കൗട്ടിൽ ചേർക്കുക\" ടാപ്പ് ചെയ്യുക.';

  @override
  String get saveWorkout => 'വർക്കൗട്ട് സംരക്ഷിക്കുക';

  @override
  String get exerciseLibrary => 'വ്യായാമ ലൈബ്രറി';

  @override
  String get searchExercises => 'വ്യായാമങ്ങൾ തിരയുക (ഉദാ. chest dumbbell)';

  @override
  String get trainerCues => 'പരിശീലകന്റെ നിർദ്ദേശങ്ങൾ';

  @override
  String get noExercisesMatch => 'ഫിൽട്ടറുകൾക്ക് യോജിക്കുന്ന വ്യായാമങ്ങളില്ല';

  @override
  String get resetFilters => 'ഫിൽട്ടറുകൾ റീസെറ്റ് ചെയ്യുക';

  @override
  String get demo => 'ഡെമോ';

  @override
  String get added => 'ചേർത്തു';

  @override
  String get readyToBuild => 'നിങ്ങളുടെ റൂട്ടീൻ നിർമ്മിക്കാൻ തയ്യാർ';

  @override
  String get buildWorkout => 'വർക്കൗട്ട് നിർമ്മിക്കുക';

  @override
  String trainerDietTitle(String name) {
    return '$name · ഡയറ്റ്';
  }

  @override
  String dietEatenToday(String calories, String protein) {
    return 'ഇന്ന് കഴിച്ചത്: $calories kcal · $protein ഗ്രാം പ്രോട്ടീൻ';
  }

  @override
  String dietOfTarget(String target) {
    return '$target kcal-ൽ';
  }

  @override
  String dietWater(String amount) {
    return 'വെള്ളം: $amount മി.ലി.';
  }

  @override
  String dietWaterOfTarget(String amount, String target) {
    return 'വെള്ളം: $amount / $target മി.ലി.';
  }

  @override
  String dietAdherence(
      String followed, String modified, String skipped, String notLogged) {
    return 'പാലിച്ചത് $followed · മാറ്റിയത് $modified · ഒഴിവാക്കിയത് $skipped · രേഖപ്പെടുത്താത്തത് $notLogged';
  }

  @override
  String get mealBreakfast => 'പ്രഭാതഭക്ഷണം';

  @override
  String get mealMorningSnack => 'രാവിലത്തെ ലഘുഭക്ഷണം';

  @override
  String get mealLunch => 'ഉച്ചഭക്ഷണം';

  @override
  String get mealEveningSnack => 'വൈകുന്നേരത്തെ ലഘുഭക്ഷണം';

  @override
  String get mealDinner => 'അത്താഴം';

  @override
  String get mealPreWorkout => 'വർക്കൗട്ടിന് മുമ്പ്';

  @override
  String get mealPostWorkout => 'വർക്കൗട്ടിന് ശേഷം';

  @override
  String trainerSessionStarted(String name) {
    return '$name-മായി സെഷൻ ആരംഭിച്ചു';
  }

  @override
  String trainerSessionStarting(String name) {
    return '$name-മായി സെഷൻ ആരംഭിക്കുന്നു';
  }

  @override
  String trainerWeightAttendance(String weight, String attendance) {
    return 'ഭാരം: $weight · ഹാജർ: $attendance';
  }

  @override
  String trainerAddedExercise(String name) {
    return '$name വർക്കൗട്ടിൽ ചേർത്തു';
  }

  @override
  String trainerAssignTo(String name) {
    return '\"$name\" ഇവർക്ക് നൽകുക:';
  }

  @override
  String trainerAssigned(String workout, String name) {
    return '$workout $name-ന് നൽകി';
  }

  @override
  String trainerExercisesCount(int count) {
    return 'വ്യായാമങ്ങൾ ($count)';
  }

  @override
  String trainerSetsRepsWeight(String sets, String reps, String weight) {
    return '$sets സെറ്റ് × $reps റെപ് · $weight';
  }

  @override
  String trainerRest(String value) {
    return 'വിശ്രമം: $value';
  }

  @override
  String trainerTempo(String value) {
    return 'ടെമ്പോ: $value';
  }

  @override
  String adminOwnerPlan(String owner, String plan) {
    return 'ഉടമ: $owner · $plan';
  }

  @override
  String comingSoon(String feature) {
    return '$feature ഉടൻ വരുന്നു';
  }

  @override
  String onboardingStep(int current, int total) {
    return 'ഘട്ടം $current / $total';
  }

  @override
  String get onboarding1Lead => 'നിയന്ത്രിക്കുക. പരിശീലിപ്പിക്കുക.';

  @override
  String get onboarding1Accent => 'വളരുക.';

  @override
  String get onboarding1Body =>
      'നിങ്ങളുടെ ജിമ്മിന് ഒരൊറ്റ ആപ്പ്: ചെക്ക്-ഇൻ, അംഗത്വം, പേയ്‌മെന്റുകൾ, പരിശീലനം — ഉടമകൾക്കും പരിശീലകർക്കും അംഗങ്ങൾക്കും.';

  @override
  String get onboarding2Lead => 'നിയന്ത്രിക്കുക';

  @override
  String get onboarding2Accent => 'അംഗങ്ങളെ';

  @override
  String get onboarding2Tail => 'എളുപ്പത്തിൽ';

  @override
  String get onboarding2Body =>
      'ഓരോ അംഗത്തിന്റെയും അംഗത്വം, ഹാജർ, കുടിശ്ശിക — കാലാവധി തീരും മുമ്പേ മുന്നറിയിപ്പ്.';

  @override
  String get onboarding3Lead => 'പ്രധാനപ്പെട്ട';

  @override
  String get onboarding3Accent => 'ഇൻസൈറ്റുകൾ';

  @override
  String get onboarding3Body =>
      'ചെക്ക്-ഇൻ, പുതുക്കലുകൾ, വരുമാനം ഒറ്റനോട്ടത്തിൽ — അംഗങ്ങൾ വിട്ടുപോകും മുമ്പേ നടപടിയെടുക്കാം.';

  @override
  String get trainerAdded => 'പരിശീലകനെ ചേർത്തു';

  @override
  String get trainerAddFailed =>
      'പരിശീലകനെ ചേർക്കാനായില്ല. വിവരങ്ങൾ പരിശോധിക്കുക.';

  @override
  String get addNewTrainer => 'പുതിയ പരിശീലകനെ ചേർക്കുക';

  @override
  String get trainerNameHint => 'ഉദാ. Arun Kumar';

  @override
  String get trainerNameRequired => 'പരിശീലകന്റെ പേര് ആവശ്യമാണ്';

  @override
  String get mobileRequiredLabel => 'മൊബൈൽ നമ്പർ *';

  @override
  String get mobileRequired => 'മൊബൈൽ നമ്പർ ആവശ്യമാണ്';

  @override
  String get emailOptional => 'ഇമെയിൽ വിലാസം (ഓപ്ഷണൽ)';

  @override
  String get specialization => 'സ്പെഷ്യലൈസേഷൻ';

  @override
  String get hourlyRateOptional => 'മണിക്കൂർ നിരക്ക് (₹) (ഓപ്ഷണൽ)';

  @override
  String get bioOptional => 'ബയോ / അനുഭവം (ഓപ്ഷണൽ)';

  @override
  String get bioHint => 'ഉദാ. 5+ വർഷം പരിചയമുള്ള സർട്ടിഫൈഡ് പരിശീലകൻ…';

  @override
  String get saveTrainer => 'പരിശീലകനെ സംരക്ഷിക്കുക';

  @override
  String get openFromMyClients =>
      'സന്ദേശം അയയ്ക്കാനോ ഡയറ്റ് കാണാനോ എന്റെ ക്ലയന്റുകളിൽ നിന്ന് ഈ ക്ലയന്റിനെ തുറക്കുക.';

  @override
  String get message => 'സന്ദേശം';

  @override
  String get dietPlan => 'ഡയറ്റ് പ്ലാൻ';

  @override
  String get errorLoadAdherence => 'ഡയറ്റ് പാലിക്കൽ ലോഡ് ചെയ്യാനായില്ല.';

  @override
  String get noDietPlan => 'ഡയറ്റ് പ്ലാൻ നൽകിയിട്ടില്ല.';

  @override
  String get dietAdherenceTitle => 'ഡയറ്റ് പാലിക്കൽ · കഴിഞ്ഞ 7 ദിവസം';

  @override
  String get myClients => 'എന്റെ ക്ലയന്റുകൾ';

  @override
  String get searchClients => 'ക്ലയന്റുകളെ തിരയുക';

  @override
  String get activeMembershipsOnly => 'സജീവ അംഗത്വങ്ങൾ മാത്രം';

  @override
  String get noClientsAssigned =>
      'ഇതുവരെ അംഗങ്ങളെ നിങ്ങൾക്ക് നിയോഗിച്ചിട്ടില്ല.';

  @override
  String get noClientsMatch => 'തിരയലിന് യോജിക്കുന്ന ക്ലയന്റുകളില്ല.';

  @override
  String get noDietPlanMember =>
      'നിങ്ങളുടെ പരിശീലകൻ ഇതുവരെ ഡയറ്റ് പ്ലാൻ നൽകിയിട്ടില്ല.';

  @override
  String get noDietPlanTrainer =>
      'ഡയറ്റ് പ്ലാൻ നൽകിയിട്ടില്ല. വെബ് ഡാഷ്‌ബോർഡിൽ നിന്ന് നൽകുക.';

  @override
  String get addWater => '+250 മി.ലി.';

  @override
  String get coachingWorkspace => 'കോച്ചിംഗ് വർക്ക്‌സ്‌പേസ്';

  @override
  String get todaysClients => 'ഇന്നത്തെ ക്ലയന്റുകൾ';

  @override
  String get pendingPlans => 'ബാക്കിയുള്ള പ്ലാനുകൾ';

  @override
  String get clientChat => 'ക്ലയന്റ് ചാറ്റ്';

  @override
  String get todaysSessions => 'ഇന്നത്തെ സെഷനുകൾ';

  @override
  String get fullSchedule => 'മുഴുവൻ ഷെഡ്യൂൾ →';

  @override
  String get nextUp => 'അടുത്തത്';

  @override
  String get startSession => 'സെഷൻ ആരംഭിക്കുക';

  @override
  String get myProfile => 'എന്റെ പ്രൊഫൈൽ';

  @override
  String get mySchedule => 'എന്റെ ഷെഡ്യൂൾ';

  @override
  String get workoutTemplates => 'വർക്കൗട്ട് ടെംപ്ലേറ്റുകൾ';

  @override
  String get dietTemplates => 'ഡയറ്റ് ടെംപ്ലേറ്റുകൾ';

  @override
  String get start => 'ആരംഭിക്കുക';

  @override
  String get upcoming => 'വരാനിരിക്കുന്നു';

  @override
  String get assignToClient => 'ക്ലയന്റിന് നൽകുക';

  @override
  String get assignNow => 'നൽകുക';

  @override
  String get programTitle => 'പ്രോഗ്രാം പേര്';

  @override
  String get addExercise => 'വ്യായാമം ചേർക്കുക';

  @override
  String get saveAsTemplate => 'ജിം ടെംപ്ലേറ്റായി സംരക്ഷിക്കുക';

  @override
  String get notOnPlan => 'നിങ്ങളുടെ പ്ലാനിൽ ഇല്ല';

  @override
  String get errorLoadInsights => 'ഇൻസൈറ്റുകൾ ലോഡ് ചെയ്യാനായില്ല';

  @override
  String get insightsUpgrade =>
      'ബിസിനസ് ഇൻസൈറ്റുകൾ ഉയർന്ന REPSI പ്ലാനുകളിലാണ് ഉള്ളത്. ഓണാക്കാൻ repsi.app-ൽ അപ്ഗ്രേഡ് ചെയ്യുക.';

  @override
  String get summaryByAi => 'AI തയ്യാറാക്കിയ സംഗ്രഹം';

  @override
  String get summary => 'സംഗ്രഹം';

  @override
  String get whatStandsOut => 'ശ്രദ്ധേയമായവ';

  @override
  String get suggestedNextSteps => 'നിർദ്ദേശിക്കുന്ന അടുത്ത ഘട്ടങ്ങൾ';

  @override
  String get goalMuscleGain => 'പേശി വളർച്ച';

  @override
  String get goalFatLoss => 'കൊഴുപ്പ് കുറയ്ക്കൽ';

  @override
  String get goalStrength => 'കരുത്ത്';

  @override
  String get goalEndurance => 'സഹനശക്തിയും സ്റ്റാമിനയും';

  @override
  String get goalWellness => 'പൊതു ആരോഗ്യം';

  @override
  String get expBeginner => 'തുടക്കക്കാരൻ (< 1 വർഷം)';

  @override
  String get expIntermediate => 'ഇടത്തരം (1–3 വർഷം)';

  @override
  String get expAdvanced => 'വിദഗ്ധൻ (3+ വർഷം)';

  @override
  String get equipFullGym => 'മുഴുവൻ ജിം';

  @override
  String get equipDumbbells => 'ഡംബെല്ലുകളും ബെഞ്ചും';

  @override
  String get equipBodyweight => 'വീട്ടിൽ ശരീരഭാര വ്യായാമം';

  @override
  String get safetyGuidelines => 'സുരക്ഷാ മാർഗ്ഗനിർദ്ദേശങ്ങൾ';

  @override
  String get aiPowered => 'AI അധിഷ്ഠിതം';

  @override
  String get tailoredRoutine => 'നിങ്ങളുടെ വ്യക്തിഗത റൂട്ടീൻ';

  @override
  String get aiCoachIntro =>
      'നിങ്ങളുടെ ഉപകരണങ്ങൾക്കും ലക്ഷ്യങ്ങൾക്കും അനുയോജ്യമായ പ്ലാൻ തയ്യാറാക്കാൻ കുറച്ച് ചോദ്യങ്ങൾക്ക് ഉത്തരം നൽകുക.';

  @override
  String get aiQ1 => '1. നിങ്ങളുടെ പ്രധാന ഫിറ്റ്‌നസ് ലക്ഷ്യം എന്താണ്?';

  @override
  String get aiQ2 => '2. പരിശീലന പരിചയം';

  @override
  String get aiQ3 => '3. ആഴ്ചയിലെ പരിശീലന ദിവസങ്ങൾ';

  @override
  String get aiQ4 => '4. ലഭ്യമായ ഉപകരണങ്ങൾ';

  @override
  String get generateRoutine => 'എന്റെ പ്ലാൻ തയ്യാറാക്കുക';

  @override
  String get personalizeAi => 'വ്യക്തിഗതമാക്കുക';

  @override
  String get noPlanForCriteria => 'ഈ തിരഞ്ഞെടുപ്പുകൾക്ക് പ്ലാൻ ലഭ്യമല്ല.';

  @override
  String get aiTailored => 'AI തയ്യാറാക്കിയത്';

  @override
  String get verifiedSplit => 'കോച്ച് പരിശോധിച്ച പ്ലാൻ';

  @override
  String get startThisWorkout => 'ഈ വർക്കൗട്ട് ആരംഭിക്കുക';

  @override
  String get coachTips => 'കോച്ചിന്റെ നിർദ്ദേശങ്ങൾ';

  @override
  String get safetyDisclaimerTitle => 'സുരക്ഷയും വൈദ്യ നിരാകരണവും';

  @override
  String get safetyDisclaimerBody =>
      'REPSI AI വർക്കൗട്ട് കോച്ച് സ്പോർട്സ് സയൻസിന്റെയും ഓട്ടോമേറ്റഡ് ജനറേഷന്റെയും അടിസ്ഥാനത്തിൽ പൊതുവായ വ്യായാമ നിർദ്ദേശങ്ങൾ നൽകുന്നു. ഇത് വ്യക്തിഗത വൈദ്യോപദേശത്തിനോ ഫിറ്റ്‌നസ് കൺസൾട്ടേഷനോ പകരമല്ല. തലകറക്കം, കഠിനമായ വേദന, ശ്വാസതടസ്സം എന്നിവ തോന്നിയാൽ ഉടൻ വ്യായാമം നിർത്തുക.';

  @override
  String get understood => 'മനസ്സിലായി';

  @override
  String get aiPlanUpperLowerTitle => '4 ദിവസത്തെ അപ്പർ / ലോവർ റൂട്ടീൻ';

  @override
  String get aiPlanUpperLowerBody =>
      'ക്രമേണ ഭാരം കൂട്ടുന്ന, സന്ധികൾക്ക് വിശ്രമിക്കാൻ സമയം നൽകുന്ന സന്തുലിത പേശി വളർച്ചാ റൂട്ടീൻ.';

  @override
  String get aiPlanFatLossTitle => 'മെറ്റബോളിക് കണ്ടീഷനിംഗ് സ്പ്ലിറ്റ്';

  @override
  String get aiPlanFatLossBody =>
      'പേശി നിലനിർത്തി കൂടുതൽ കലോറി കത്തിക്കാൻ, ചെറിയ വിശ്രമത്തോടെയുള്ള കോമ്പൗണ്ട് ലിഫ്റ്റുകൾ.';

  @override
  String get aiPlanStrengthTitle => 'അടിസ്ഥാന കരുത്ത് പ്ലാൻ';

  @override
  String get aiPlanStrengthBody =>
      'പരമാവധി കരുത്തിനായി RPE 8–9-ൽ ഒന്നിലധികം സന്ധികൾ ഉൾപ്പെടുന്ന ബാർബെൽ ലിഫ്റ്റുകൾ.';

  @override
  String get aiDay1 => 'ദിവസം 1: അപ്പർ ബോഡി പവർ';

  @override
  String get aiCueBench => 'കുതികാൽ അമർത്തി, നേരിയ വളവ് നിലനിർത്തുക';

  @override
  String get aiCueRow => 'നട്ടെല്ല് നേരെ വെച്ച്, നെഞ്ചെല്ലിലേക്ക് വലിക്കുക';

  @override
  String get aiDay2 => 'ദിവസം 2: ലോവർ ബോഡി പേശി വളർച്ച';

  @override
  String get aiCueSquat => 'കാൽമുട്ടും ഇടുപ്പും ഒരേസമയം മടക്കുക';

  @override
  String get aiCueRdl =>
      'കാൽമുട്ട് അൽപം മടക്കി ഇടുപ്പ് പിന്നോട്ട് തള്ളി, ഹാംസ്ട്രിംഗ് അനുഭവിക്കുക';

  @override
  String get aiDay3 => 'ദിവസം 3: അപ്പർ ബോഡിയും കൈകളും';

  @override
  String get aiDay4 => 'ദിവസം 4: ലോവർ ബോഡിയും കോറും';

  @override
  String get aiTipHydrate =>
      'പരിശീലനത്തിന് മുമ്പ് കുറഞ്ഞത് 500 മി.ലി. വെള്ളം കുടിക്കുക.';

  @override
  String get aiTipWarmup =>
      '5–10 മിനിറ്റ് മൊബിലിറ്റി വ്യായാമവും ഓരോ കോമ്പൗണ്ട് ലിഫ്റ്റിനും മുമ്പ് 2 ലഘു സെറ്റുകളും ചെയ്ത് വാം-അപ്പ് ചെയ്യുക.';

  @override
  String get aiTipProgress =>
      'ഓരോ 1–2 ആഴ്ചയിലും പ്രധാന ലിഫ്റ്റുകളിൽ ഭാരമോ റെപ്പുകളോ കൂട്ടാൻ ശ്രമിക്കുക.';

  @override
  String get aiPersonalisedNotice => 'REPSI AI വ്യക്തിഗതമാക്കിയത്';

  @override
  String get aiDisclaimer =>
      'പുതിയ വ്യായാമ റൂട്ടീൻ തുടങ്ങും മുമ്പ് എപ്പോഴും ഡോക്ടറെ സമീപിക്കുക. ശരീരം പറയുന്നത് ശ്രദ്ധിക്കുക, അസാധാരണ അസ്വസ്ഥത തോന്നിയാൽ നിർത്തുക.';

  @override
  String get aiWorkoutDay => 'വർക്കൗട്ട് ദിവസം';

  @override
  String get aiPersonalPlan => 'വ്യക്തിഗത വർക്കൗട്ട് പ്ലാൻ';

  @override
  String get aiDisclaimerShort =>
      'വ്യായാമ പ്രോഗ്രാം തുടങ്ങും മുമ്പ് എപ്പോഴും ഡോക്ടറെ സമീപിക്കുക.';

  @override
  String get platformAnalytics => 'പ്ലാറ്റ്ഫോം അനലിറ്റിക്സ്';

  @override
  String get platformMrrGrowth => 'പ്ലാറ്റ്ഫോം MRR വളർച്ച';

  @override
  String get platformHealth => 'പ്ലാറ്റ്ഫോം ആരോഗ്യം';

  @override
  String get apiResponseTime => 'API പ്രതികരണ സമയം (P95)';

  @override
  String get activeGymLicences => 'സജീവ ജിം ലൈസൻസുകൾ';

  @override
  String get totalCheckinsToday => 'ആകെ ചെക്ക്-ഇന്നുകൾ (ഇന്ന്)';

  @override
  String get systemAdmin => 'സിസ്റ്റം അഡ്മിൻ';

  @override
  String get platformMetrics => 'പ്ലാറ്റ്ഫോം മുഴുവനുമുള്ള കണക്കുകൾ';

  @override
  String get totalGyms => 'ആകെ ജിമ്മുകൾ';

  @override
  String get plusThreeThisMonth => 'ഈ മാസം +3';

  @override
  String get activeUsers => 'സജീവ ഉപയോക്താക്കൾ';

  @override
  String get payingMembers => 'പണമടയ്ക്കുന്ന അംഗങ്ങൾ';

  @override
  String get acrossAllGyms => 'എല്ലാ ജിമ്മുകളിലുമായി';

  @override
  String get platformRevenue => 'പ്ലാറ്റ്ഫോം വരുമാനം';

  @override
  String get mrrThisMonth => 'ഈ മാസത്തെ MRR';

  @override
  String get subscriptions => 'സബ്സ്ക്രിപ്ഷനുകൾ';

  @override
  String get allServicesOk => 'എല്ലാ സേവനങ്ങളും പ്രവർത്തിക്കുന്നു';

  @override
  String get searchGymsHint => 'പേരോ ഉടമയോ ഉപയോഗിച്ച് ജിമ്മുകൾ തിരയുക…';

  @override
  String get systemSettings => 'സിസ്റ്റം ക്രമീകരണങ്ങൾ';

  @override
  String get securityCompliance => 'സുരക്ഷയും നിയമപാലനവും';

  @override
  String get apiWebhooks => 'API & വെബ്ഹുക്കുകൾ';

  @override
  String get systemAlerts => 'സിസ്റ്റം അലേർട്ടുകൾ';

  @override
  String get platformSupport => 'പ്ലാറ്റ്ഫോം സപ്പോർട്ട്';

  @override
  String get systemAdminSettings => 'അഡ്മിൻ ക്രമീകരണങ്ങൾ';

  @override
  String get superAdministrator => 'സൂപ്പർ അഡ്മിനിസ്ട്രേറ്റർ';

  @override
  String get searchUsersHint => 'എല്ലാ ജിമ്മുകളിലും ഉപയോക്താക്കളെ തിരയുക…';

  @override
  String get skip => 'ഒഴിവാക്കുക';

  @override
  String get getStarted => 'ആരംഭിക്കുക';

  @override
  String get next => 'അടുത്തത്';

  @override
  String get gymPass => 'ജിം പാസ്';

  @override
  String get checkedIn => 'ചെക്ക്-ഇൻ ചെയ്തു';

  @override
  String get dashboard => 'ഡാഷ്‌ബോർഡ്';

  @override
  String get revenue => 'വരുമാനം';

  @override
  String get dailyCheckins => 'ദിവസേനയുള്ള ചെക്ക്-ഇന്നുകൾ';

  @override
  String get mealSnack => 'ലഘുഭക്ഷണം';

  @override
  String get mealStatusEaten => 'കഴിച്ചു';

  @override
  String get mealStatusModified => 'മാറ്റം വരുത്തി';

  @override
  String get mealStatusSkipped => 'ഒഴിവാക്കി';

  @override
  String dashTrendPercent(String value) {
    return '$value%';
  }

  @override
  String get myCustomRoutine => 'എന്റെ റൂട്ടീൻ';

  @override
  String get yourGymLinkPlaceholder => 'your-gym';

  @override
  String memberNoteMeta(String author, String date) {
    return '$author · $date';
  }

  @override
  String get membershipPayment => 'അംഗത്വ പേയ്‌മെന്റ്';

  @override
  String get languageMenuSubtitle => 'ആപ്പ് ഭാഷ തിരഞ്ഞെടുക്കുക';

  @override
  String get specPersonalTraining => 'പേഴ്സണൽ ട്രെയിനിംഗ്';

  @override
  String get specHiit => 'HIIT & ഫംഗ്ഷണൽ';

  @override
  String get specCrossfit => 'CrossFit';

  @override
  String get specYoga => 'യോഗയും മൊബിലിറ്റിയും';

  @override
  String get specRehab => 'പുനരധിവാസം';

  @override
  String get specGeneral => 'പൊതു ഫിറ്റ്‌നസ്';

  @override
  String get exCatChest => 'നെഞ്ച്';

  @override
  String get exCatBack => 'പുറം';

  @override
  String get exCatLegs => 'കാലുകൾ';

  @override
  String get exCatShoulders => 'തോളുകൾ';

  @override
  String get exCatArms => 'കൈകൾ';

  @override
  String get exCatCore => 'കോർ';

  @override
  String get exCatCardio => 'കാർഡിയോ';

  @override
  String get exCatFullBody => 'മുഴുവൻ ശരീരം';

  @override
  String get exEqAll => 'എല്ലാ ഉപകരണങ്ങളും';

  @override
  String get exEqNone => 'ഉപകരണമില്ല';

  @override
  String get exEqDumbbells => 'ഡംബെല്ലുകൾ';

  @override
  String get exEqBarbell => 'ബാർബെൽ';

  @override
  String get exEqCable => 'കേബിൾ';

  @override
  String get exEqMachine => 'മെഷീൻ';

  @override
  String get exEqKettlebell => 'കെറ്റിൽബെൽ';

  @override
  String get exEqBand => 'റെസിസ്റ്റൻസ് ബാൻഡ്';

  @override
  String get exEqSmith => 'സ്മിത്ത് മെഷീൻ';

  @override
  String get exLvlAll => 'എല്ലാ തലങ്ങളും';

  @override
  String get exLvlBeginner => 'തുടക്കക്കാരൻ';

  @override
  String get exLvlIntermediate => 'ഇടത്തരം';

  @override
  String get exLvlAdvanced => 'വിദഗ്ധൻ';

  @override
  String get exTypeStrength => 'കരുത്ത്';

  @override
  String get exTypeHypertrophy => 'പേശി വളർച്ച';

  @override
  String get exTypeEndurance => 'സഹനശക്തി';

  @override
  String get exMuscleMidChest => 'നെഞ്ചിന്റെ മധ്യം';

  @override
  String get exMuscleUpperChest => 'നെഞ്ചിന്റെ മുകൾഭാഗം';

  @override
  String get exMuscleFrontDelts => 'മുൻ തോൾ';

  @override
  String get exMuscleTriceps => 'ട്രൈസെപ്സ്';

  @override
  String get exMuscleBiceps => 'ബൈസെപ്സ്';

  @override
  String get exMuscleQuads => 'ക്വാഡ്രിസെപ്സ്';

  @override
  String get exMuscleHamstrings => 'ഹാംസ്ട്രിംഗ്സ്';

  @override
  String get exMuscleGlutes => 'ഗ്ലൂട്ടുകൾ';

  @override
  String get exMuscleLowerBack => 'താഴത്തെ പുറം';

  @override
  String get exMuscleLats => 'ലാറ്റ്സ്';

  @override
  String get exMuscleRearDelts => 'പിൻ തോൾ';

  @override
  String get exMuscleForearms => 'കൈത്തണ്ട';

  @override
  String get exMuscleLowerAbs => 'താഴത്തെ വയറ്';

  @override
  String get exMuscleGrip => 'പിടുത്ത ശക്തി';

  @override
  String get exMuscleUpperBack => 'മുകളിലെ പുറവും റോംബോയിഡുകളും';

  @override
  String get exMuscleTraps => 'ട്രാപ്സ്';

  @override
  String get exMuscleObliques => 'ഒബ്ലിക്സ്';

  @override
  String get exMuscleHipFlexors => 'ഹിപ് ഫ്ലെക്സറുകൾ';

  @override
  String get exStepBench1 =>
      'കണ്ണുകൾ ബാറിന് നേരെ താഴെ വരുന്ന രീതിയിൽ ബെഞ്ചിൽ കിടക്കുക.';

  @override
  String get exStepBench2 =>
      'തോളിന്റെ വീതിയേക്കാൾ അൽപം വീതിയിൽ ബാർബെൽ പിടിക്കുക.';

  @override
  String get exStepBench3 =>
      'ഭാരം റാക്കിൽ നിന്ന് എടുത്ത്, കോർ മുറുക്കി, ഷോൾഡർ ബ്ലേഡുകൾ ചേർത്ത് പിടിക്കുക.';

  @override
  String get exStepBench4 =>
      'നിയന്ത്രണത്തോടെ ബാർ നെഞ്ചെല്ലിന്റെ താഴ്ഭാഗത്തേക്ക് താഴ്ത്തുക.';

  @override
  String get exStepBench5 =>
      'ശക്തിയോടെ മുകളിലേക്ക് തള്ളി കൈകൾ പൂർണ്ണമായി നീട്ടുക.';

  @override
  String get exNoteBench =>
      'പാദങ്ങൾ നിലത്ത് ഉറപ്പിച്ച് അമർത്തി, പുറം സ്വാഭാവിക നിലയിൽ വെക്കുക.';

  @override
  String get exStepIncline1 =>
      'ക്രമീകരിക്കാവുന്ന ബെഞ്ച് 30 മുതൽ 45 ഡിഗ്രി ചരിവിൽ വെക്കുക.';

  @override
  String get exStepIncline2 =>
      'പിന്നിലേക്ക് ചാരുമ്പോൾ ഡംബെല്ലുകൾ തോളിന്റെ ഉയരത്തിലേക്ക് കൊണ്ടുവരിക.';

  @override
  String get exStepIncline3 =>
      'രണ്ട് ഡംബെല്ലുകളും നേരെ മുകളിലേക്ക് തള്ളി, മുകളിൽ നെഞ്ചിന്റെ മുകൾഭാഗം മുറുക്കുക.';

  @override
  String get exStepIncline4 =>
      'മുകൾകൈകൾ നിലത്തിന് സമാന്തരമാകുന്നതുവരെ നിയന്ത്രണത്തോടെ താഴ്ത്തുക.';

  @override
  String get exNoteIncline =>
      'തോളുകൾ സംരക്ഷിക്കാൻ കൈമുട്ടുകൾ ഏകദേശം 45 ഡിഗ്രിയിൽ ശരീരത്തോട് ചേർത്ത് വെക്കുക.';

  @override
  String get exStepSquat1 => 'ബാർബെൽ പുറത്തിന്റെ മുകൾഭാഗത്ത് വെക്കുക.';

  @override
  String get exStepSquat2 =>
      'പാദങ്ങൾ തോളിന്റെ വീതിയിൽ അകറ്റി, വിരലുകൾ അൽപം പുറത്തേക്ക് തിരിച്ച് നിൽക്കുക.';

  @override
  String get exStepSquat3 =>
      'ഇടുപ്പും കാൽമുട്ടും ഒരുമിച്ച് മടക്കി സ്ക്വാറ്റിലേക്ക് ഇരിക്കുക.';

  @override
  String get exStepSquat4 =>
      'തുടകൾ നിലത്തിന് സമാന്തരമാകുന്നതുവരെയോ അതിലും താഴെയോ ഇറങ്ങുക.';

  @override
  String get exStepSquat5 =>
      'പാദത്തിന്റെ മധ്യഭാഗം അമർത്തി തിരികെ എഴുന്നേൽക്കുക.';

  @override
  String get exNoteSquat =>
      'ആഴം സുഖകരമാണെങ്കിൽ, ഈ ആഴ്ച നിങ്ങളുടെ ഏറ്റവും ഭാരമുള്ള സെറ്റിൽ 5 കി.ഗ്രാം കൂട്ടുക.';

  @override
  String get exStepLat1 =>
      'തോളിന്റെ വീതിയേക്കാൾ വീതിയിൽ, ഓവർഹാൻഡ് ഗ്രിപ്പിൽ വീതിയുള്ള ബാർ പിടിക്കുക.';

  @override
  String get exStepLat2 =>
      'തുട പാഡുകൾ കാൽമുട്ടുകളിൽ ഉറച്ച് അമരുന്ന രീതിയിൽ നിവർന്ന് ഇരിക്കുക.';

  @override
  String get exStepLat3 =>
      'അൽപം (ഏകദേശം 10–15 ഡിഗ്രി) പിന്നിലേക്ക് ചാരി, ബാർ നെഞ്ചിന്റെ മുകൾഭാഗത്തേക്ക് വലിക്കുക.';

  @override
  String get exStepLat4 =>
      'താഴെ ലാറ്റുകൾ മുറുക്കി, പിന്നെ നിയന്ത്രണത്തോടെ തിരികെ പോകുക.';

  @override
  String get exStepOhp1 => 'പുറം താങ്ങുള്ള ബെഞ്ചിൽ നിവർന്ന് ഇരിക്കുക.';

  @override
  String get exStepOhp2 =>
      'കൈപ്പത്തികൾ മുന്നോട്ട് തിരിച്ച് ഡംബെല്ലുകൾ തോളിന്റെ ഉയരത്തിൽ പിടിക്കുക.';

  @override
  String get exStepOhp3 =>
      'കൈകൾ നീളുന്നതുവരെ ഡംബെല്ലുകൾ നേരെ തലയ്ക്ക് മുകളിലേക്ക് തള്ളുക.';

  @override
  String get exStepOhp4 =>
      'നിയന്ത്രണത്തോടെ തിരികെ തോളിന്റെ ഉയരത്തിലേക്ക് താഴ്ത്തുക.';

  @override
  String get exNoteOhp => 'താഴത്തെ പുറം ബെഞ്ച് പാഡിൽ നിന്ന് വളയ്ക്കരുത്.';

  @override
  String get exStepCurl1 => '45 ഡിഗ്രി ചരിവുള്ള ബെഞ്ചിൽ ചാരി ഇരിക്കുക.';

  @override
  String get exStepCurl2 =>
      'കൈപ്പത്തികൾ മുന്നോട്ട് തിരിച്ച് ഡംബെല്ലുകൾ വശങ്ങളിൽ നേരെ തൂങ്ങിക്കിടക്കട്ടെ.';

  @override
  String get exStepCurl3 => 'മുകൾകൈകൾ അനക്കാതെ ഭാരങ്ങൾ മുകളിലേക്ക് ചുരുട്ടുക.';

  @override
  String get exStepCurl4 =>
      'മുകളിൽ ഒന്ന് നിർത്തി, പിന്നെ 3 സെക്കൻഡ് കൊണ്ട് താഴ്ത്തുക.';

  @override
  String get exStepLegRaise1 => 'ഓവർഹാൻഡ് ഗ്രിപ്പിൽ പുൾ-അപ് ബാറിൽ തൂങ്ങുക.';

  @override
  String get exStepLegRaise2 =>
      'കാലുകൾ നേരെയോ കാൽമുട്ടിൽ അൽപം മടക്കിയോ വെക്കുക.';

  @override
  String get exStepLegRaise3 =>
      'ആടാതെ, വയറിലെ പേശികൾ ഉപയോഗിച്ച് കാലുകൾ അരക്കെട്ടിന്റെ ഉയരത്തിലേക്ക് ഉയർത്തുക.';

  @override
  String get exStepLegRaise4 => 'പതുക്കെ തിരികെ താഴ്ത്തുക.';

  @override
  String get exStepRow1 =>
      'പുറം നേരെ വെച്ച്, കാൽമുട്ട് അൽപം മടക്കി ഇടുപ്പിൽ നിന്ന് മുന്നോട്ട് കുനിയുക.';

  @override
  String get exStepRow2 =>
      'ഡംബെല്ലുകൾ തോളുകൾക്ക് നേരെ താഴെ തൂങ്ങിക്കിടക്കട്ടെ.';

  @override
  String get exStepRow3 =>
      'കൈമുട്ടുകൾ മുകളിലേക്ക് ഉയർത്തി ഡംബെല്ലുകൾ ഇടുപ്പിലേക്ക് വലിക്കുക.';

  @override
  String get exStepRow4 => 'മുകളിൽ ഷോൾഡർ ബ്ലേഡുകൾ ചേർത്ത് മുറുക്കുക.';

  @override
  String get exNoteRow =>
      'ലാറ്റുകൾ പ്രവർത്തിപ്പിക്കാൻ ബൈസെപ്സ് കൊണ്ടല്ല, കൈമുട്ടുകൾ കൊണ്ട് വലിക്കുക.';

  @override
  String get gymMachinesTitle => 'ജിം മെഷീനുകളും ഉപകരണങ്ങളും';

  @override
  String get machineStatusAvailable => 'ലഭ്യമാണ്';

  @override
  String get machineStatusInUse => 'ഉപയോഗത്തിലാണ്';

  @override
  String get machineStatusMaintenance => 'അറ്റകുറ്റപ്പണിയിൽ';

  @override
  String get machineStatusUnavailable => 'ലഭ്യമല്ല';

  @override
  String machineCategoryPrefix(String category, String targets) {
    return 'വിഭാഗം: $category · ലക്ഷ്യങ്ങൾ: $targets';
  }

  @override
  String get premiumPlan => 'പ്രീമിയം പ്ലാൻ';

  @override
  String get membershipStartDate => 'ആരംഭ തീയതി';

  @override
  String get membershipExpires => 'കാലഹരണപ്പെടുന്നത്';

  @override
  String get paymentHistory => 'പേയ്‌മെന്റ് ചരിത്രം';

  @override
  String get myProgress => 'എന്റെ പുരോഗതി';

  @override
  String get tabWeight => 'ഭാരം';

  @override
  String get tabMeasurements => 'അളവുകൾ';

  @override
  String get tabAttendance => 'ഹാജർ';

  @override
  String get tabPRs => 'റെക്കോർഡുകൾ';

  @override
  String get bmiTitle => 'ബിഎംഐ (BMI)';

  @override
  String calculatedHeight(String height) {
    return 'കണക്കാക്കിയത് ($height സെ.മീ)';
  }

  @override
  String get bmiHealthNote =>
      'ബിഎംഐ ഉയരവും ഭാരവും അടിസ്ഥാനമാക്കിയുള്ള ഒരു കണക്കുകൂട്ടലാണ്. കരുത്തും ശരീരഘടനയുമാണ് നിങ്ങളുടെ പ്രധാന ആരോഗ്യ സൂചകങ്ങൾ.';

  @override
  String get logMetricsButton => 'ഭാരവും ശരീര അളവുകളും രേഖപ്പെടുത്തുക';

  @override
  String startedWeightSubtitle(String weight, String date) {
    return '$weight കിലോയിൽ നിന്ന് (ആരംഭിച്ചത് $date)';
  }

  @override
  String get weightProgressTitle => 'ഭാര പുരോഗതി';

  @override
  String get measureChest => 'നെഞ്ച്';

  @override
  String get measureWaist => 'അരക്കെട്ട്';

  @override
  String get measureArms => 'കൈകൾ';

  @override
  String get measureThighs => 'തുടകൾ';

  @override
  String get benchPressExercise => 'ബെഞ്ച് പ്രസ്സ്';

  @override
  String get squatExercise => 'സ്ക്വാറ്റ്';

  @override
  String get deadliftExercise => 'ഡെഡ്‌ലിഫ്റ്റ്';

  @override
  String get outdoorRunningGps => 'ഔട്ട്ഡോർ റണ്ണിംഗ് ജിപിഎസ്';

  @override
  String get runDistance => 'ദൂരം';

  @override
  String get runKilometers => 'കിലോമീറ്ററുകൾ';

  @override
  String get runTime => 'സമയം';

  @override
  String get runPace => 'വേഗത';

  @override
  String get runCalories => 'കലോറികൾ';

  @override
  String get liveGpsMap => 'തത്സമയ ജിപിഎസ് റൂട്ട് മാപ്പ്';

  @override
  String get recentRunHistory => 'സമീപകാല ഓട്ട ചരിത്രം';

  @override
  String get morningRun => 'പ്രഭാത ഓട്ടം';

  @override
  String runPacePerKm(String pace) {
    return '$pace /കി.മീ';
  }

  @override
  String runHistorySummary(String time, String pace) {
    return 'സമയം: $time · ശരാശരി വേഗത: $pace /കി.മീ';
  }

  @override
  String get timeYesterday => 'ഇന്നലെ';

  @override
  String get pauseRun => 'റൺ താൽക്കാലികമായി നിർത്തുക';

  @override
  String get startRun => 'റൺ ആരംഭിക്കുക';

  @override
  String get workoutPlanTitle => 'വർക്ക്ഔട്ട് പ്ലാൻ';

  @override
  String exercisesCount(int count) {
    return 'വ്യായാമങ്ങൾ ($count)';
  }

  @override
  String exercisesDuration(int count, int duration) {
    return '$count വ്യായാമങ്ങൾ · $duration മിനിറ്റ്';
  }

  @override
  String adminUptime(String percent) {
    return '$percent% പ്രവർത്തന സമയം';
  }

  @override
  String adminMom(String percent) {
    return '$percent% പ്രതിമാസ വളർച്ച';
  }

  @override
  String adminTrialingCount(int count) {
    return '$count ട്രയൽ ചെയ്യുന്നവർ';
  }

  @override
  String adminFullAccess(String email) {
    return '$email · പൂർണ്ണ ആക്സസ്';
  }

  @override
  String get compoundHypertrophy => 'കോമ്പൗണ്ട് · മസിൽ വളർച്ച';

  @override
  String get commonSave => 'സംരക്ഷിക്കുക';

  @override
  String get commonSaved => 'സംരക്ഷിച്ചു';

  @override
  String get startWorkout => 'വർക്ക്ഔട്ട് ആരംഭിക്കുക';

  @override
  String get languageBeta => 'ബീറ്റ';

  @override
  String get languageBetaNote =>
      'ബീറ്റ എന്ന് അടയാളപ്പെടുത്തിയ ഭാഷകൾ പുതിയ വിവർത്തനങ്ങളാണ്; തെറ്റുകൾ ഉണ്ടാകാം. ഇംഗ്ലീഷ് എപ്പോഴും പൂർണ്ണമാണ്.';

  @override
  String get appearance => 'രൂപഭാവം';

  @override
  String get themeSystem => 'ഫോൺ ക്രമീകരണം';

  @override
  String get themeLight => 'ലൈറ്റ്';

  @override
  String get themeDark => 'ഡാർക്ക്';

  @override
  String get commonDone => 'പൂർത്തിയായി';

  @override
  String get letsTrain => 'നമുക്ക് പരിശീലിക്കാം';

  @override
  String get viewAll => 'എല്ലാം കാണുക';

  @override
  String get tomorrow => 'നാളെ';

  @override
  String get yesterday => 'ഇന്നലെ';

  @override
  String get thisWeek => 'ഈ ആഴ്ച';

  @override
  String get decline => 'നിരസിക്കുക';

  @override
  String get pause => 'താൽക്കാലികമായി നിർത്തുക';

  @override
  String get resume => 'തുടരുക';

  @override
  String get past => 'മുൻപത്തേത്';

  @override
  String get errorLoadPlan => 'നിങ്ങളുടെ വർക്ക്ഔട്ട് പ്ലാൻ ലോഡ് ചെയ്യാനായില്ല.';

  @override
  String get errorLoadTrainer => 'ട്രെയിനർ വിവരങ്ങൾ ലോഡ് ചെയ്യാനായില്ല.';

  @override
  String get errorOpenChat => 'ചാറ്റ് തുറക്കാനായില്ല.';

  @override
  String get errorLoadSchedule => 'ഷെഡ്യൂൾ ലോഡ് ചെയ്യാനായില്ല.';

  @override
  String get errorLoadMessages => 'സന്ദേശങ്ങൾ ലോഡ് ചെയ്യാനായില്ല.';

  @override
  String unitMinutes(int count) {
    return '$count മിനിറ്റ്';
  }

  @override
  String unitSeconds(int count) {
    return '$count സെ';
  }

  @override
  String restSeconds(int seconds) {
    return 'വിശ്രമം $seconds സെ';
  }

  @override
  String plusSeconds(int seconds) {
    return '+$seconds സെ';
  }

  @override
  String get goalGeneralFitness => 'ഫിറ്റും ആരോഗ്യവാനും';

  @override
  String get goalMobility => 'ചലനശേഷിയും വഴക്കവും';

  @override
  String get goalFatLossDesc =>
      'ശക്തി, കണ്ടീഷനിംഗ് പരിശീലനത്തിലൂടെ കൊഴുപ്പ് കുറയ്ക്കാം.';

  @override
  String get goalMuscleGainDesc => 'കേന്ദ്രീകൃത പരിശീലനത്തിലൂടെ പേശി വളർത്താം.';

  @override
  String get goalStrengthDesc =>
      'കുറഞ്ഞ റെപ്പ് കോമ്പൗണ്ട് ലിഫ്റ്റുകളിലൂടെ കൂടുതൽ ഭാരം ഉയർത്താം.';

  @override
  String get goalEnduranceDesc =>
      'കാർഡിയോയും സർക്യൂട്ടുകളും വഴി സ്റ്റാമിന കൂട്ടാം.';

  @override
  String get goalGeneralFitnessDesc =>
      'എല്ലാ ദിവസവും കരുത്തോടെ ഇരിക്കാൻ സന്തുലിതമായ മിശ്രണം.';

  @override
  String get goalMobilityDesc =>
      'നന്നായി ചലിക്കാം, മുറുക്കം കുറയ്ക്കാം, പരിക്ക് തടയാം.';

  @override
  String get levelBeginner => 'തുടക്കക്കാരൻ';

  @override
  String get levelIntermediate => 'ഇടത്തരം';

  @override
  String get levelAdvanced => 'അഡ്വാൻസ്ഡ്';

  @override
  String get levelBeginnerDesc =>
      'പരിശീലനത്തിൽ പുതിയവർ അല്ലെങ്കിൽ ഇടവേളയ്ക്ക് ശേഷം തിരിച്ചെത്തുന്നവർ.';

  @override
  String get levelIntermediateDesc =>
      '6 മാസമോ അതിലധികമോ സ്ഥിരമായി പരിശീലിക്കുന്നവർ.';

  @override
  String get levelAdvancedDesc => 'വർഷങ്ങളായി ചിട്ടയായ പരിശീലനം.';

  @override
  String get focusFullBody => 'മുഴുവൻ ശരീരം';

  @override
  String get focusUpperBody => 'മേൽ ശരീരം';

  @override
  String get focusLowerBody => 'കീഴ് ശരീരം';

  @override
  String get focusCore => 'കോർ & വയറ്';

  @override
  String get focusArms => 'കൈകൾ';

  @override
  String get focusBack => 'പുറം';

  @override
  String get focusChest => 'നെഞ്ച്';

  @override
  String get focusGlutes => 'ഗ്ലൂട്ട്സ്';

  @override
  String get focusCardio => 'കാർഡിയോ';

  @override
  String get focusFlexibility => 'വഴക്കം';

  @override
  String get dayFullBody => 'ഫുൾ ബോഡി';

  @override
  String get dayUpper => 'അപ്പർ ബോഡി';

  @override
  String get dayLower => 'ലോവർ ബോഡി';

  @override
  String get dayPush => 'പുഷ്';

  @override
  String get dayPull => 'പുൾ';

  @override
  String get dayLegs => 'കാലുകൾ';

  @override
  String get dayConditioning => 'കണ്ടീഷനിംഗ്';

  @override
  String get dayCardio => 'കാർഡിയോ';

  @override
  String get dayMobility => 'മൊബിലിറ്റി';

  @override
  String dayNumber(int number) {
    return 'ദിവസം $number';
  }

  @override
  String goalStepCounter(int current, int total) {
    return 'ഘട്ടം $current / $total';
  }

  @override
  String get goalQuestionTitle => 'നിങ്ങളുടെ പ്രധാന ലക്ഷ്യം എന്താണ്?';

  @override
  String get goalQuestionSubtitle =>
      'അതിനനുസരിച്ച് ആഴ്ചതോറുമുള്ള പ്ലാൻ ഒരുക്കാം. എപ്പോൾ വേണമെങ്കിലും മാറ്റാം.';

  @override
  String get levelQuestionTitle => 'നിങ്ങളുടെ പരിചയം എത്രയാണ്?';

  @override
  String get levelQuestionSubtitle =>
      'ഇതനുസരിച്ച് വ്യായാമങ്ങളും സെറ്റുകളും വിശ്രമവും ക്രമീകരിക്കും.';

  @override
  String get scheduleQuestionTitle => 'എത്ര തവണ പരിശീലിക്കാം?';

  @override
  String get scheduleQuestionSubtitle =>
      'നിങ്ങളുടെ ആഴ്ചയ്ക്ക് യോജിച്ചത് തിരഞ്ഞെടുക്കുക — സ്ഥിരതയാണ് പ്രധാനം.';

  @override
  String get daysPerWeekLabel => 'ആഴ്ചയിൽ ദിവസങ്ങൾ';

  @override
  String daysPerWeekValue(int count) {
    return 'ആഴ്ചയിൽ $count ദിവസം';
  }

  @override
  String get sessionLengthLabel => 'ഓരോ സെഷനും സമയം';

  @override
  String get focusQuestionTitle => 'പ്രത്യേക ശ്രദ്ധ വേണ്ടത് എന്തിലാണ്?';

  @override
  String get focusQuestionSubtitle =>
      'നിർബന്ധമില്ല. നിങ്ങളുടെ ട്രെയിനറും ഇത് കാണും.';

  @override
  String get buildMyPlan => 'എന്റെ പ്ലാൻ ഒരുക്കുക';

  @override
  String get goalSaveFailed =>
      'ലക്ഷ്യം സേവ് ചെയ്യാനായില്ല. വീണ്ടും ശ്രമിക്കുക.';

  @override
  String get goalSavedTitle => 'നിങ്ങളുടെ പ്ലാൻ തയ്യാർ';

  @override
  String get goalSavedSubtitle =>
      'നിങ്ങളുടെ ലക്ഷ്യവും ആഴ്ചയും അനുസരിച്ച് ഒരുക്കിയത്.';

  @override
  String get myWorkoutPlan => 'എന്റെ വർക്ക്ഔട്ട് പ്ലാൻ';

  @override
  String get editGoal => 'ലക്ഷ്യം മാറ്റുക';

  @override
  String get yourGoal => 'നിങ്ങളുടെ ലക്ഷ്യം';

  @override
  String get noGoalTitle => 'ആദ്യം നിങ്ങളുടെ ലക്ഷ്യം നിശ്ചയിക്കുക';

  @override
  String get noGoalMessage =>
      'എന്തിനാണ് പരിശീലിക്കുന്നതെന്ന് പറയൂ, ആഴ്ചതോറുമുള്ള പ്ലാൻ നിർദ്ദേശിക്കാം.';

  @override
  String get setMyGoal => 'എന്റെ ലക്ഷ്യം നിശ്ചയിക്കുക';

  @override
  String get setGoalCardTitle => 'എന്തിനാണ് നിങ്ങൾ പരിശീലിക്കുന്നത്?';

  @override
  String get setGoalCardBody =>
      '4 ചെറിയ ചോദ്യങ്ങൾക്ക് ഉത്തരം നൽകി നിങ്ങൾക്കായുള്ള പ്ലാൻ നേടൂ.';

  @override
  String exerciseCount(int count) {
    return '$count വ്യായാമങ്ങൾ';
  }

  @override
  String get howToDoIt => 'ചെയ്യേണ്ട വിധം';

  @override
  String get myGoalAndPlan => 'എന്റെ ലക്ഷ്യവും പ്ലാനും';

  @override
  String exerciseOfTotal(int current, int total) {
    return 'വ്യായാമം $current / $total';
  }

  @override
  String setOfTotal(int current, int total) {
    return 'സെറ്റ് $current / $total';
  }

  @override
  String nextUpName(String name) {
    return 'അടുത്തത്: $name';
  }

  @override
  String get restTime => 'വിശ്രമം';

  @override
  String get repsLabel => 'റെപ്പുകൾ';

  @override
  String get holdOrMove => 'തുടരുക';

  @override
  String get startSet => 'ആരംഭിക്കുക';

  @override
  String get setDone => 'സെറ്റ് പൂർത്തിയായി';

  @override
  String get skipRest => 'വിശ്രമം ഒഴിവാക്കുക';

  @override
  String get endWorkoutTitle => 'ഈ വർക്ക്ഔട്ട് അവസാനിപ്പിക്കണോ?';

  @override
  String get endWorkoutBody => 'ഈ സെഷനിലെ പുരോഗതി സൂക്ഷിക്കില്ല.';

  @override
  String get keepGoing => 'തുടരുക';

  @override
  String get endWorkout => 'വർക്ക്ഔട്ട് അവസാനിപ്പിക്കുക';

  @override
  String get workoutCompleteTitle => 'വർക്ക്ഔട്ട് പൂർത്തിയായി!';

  @override
  String workoutCompleteSubtitle(String focus) {
    return 'മികച്ച $focus സെഷൻ. നന്നായി വിശ്രമിച്ച് കൂടുതൽ കരുത്തോടെ വരൂ.';
  }

  @override
  String get statDuration => 'ദൈർഘ്യം';

  @override
  String get statExercises => 'വ്യായാമങ്ങൾ';

  @override
  String get statSets => 'സെറ്റുകൾ';

  @override
  String get myTrainer => 'എന്റെ ട്രെയിനർ';

  @override
  String get yourTrainer => 'നിങ്ങളുടെ ട്രെയിനർ';

  @override
  String get messageTrainer => 'ട്രെയിനർക്ക് സന്ദേശം';

  @override
  String get getATrainer => 'പേഴ്സണൽ ട്രെയിനറെ നേടൂ';

  @override
  String get getATrainerHint =>
      'നിങ്ങൾക്ക് ട്രെയിനറെ നിയോഗിക്കാൻ ജിമ്മിനോട് ആവശ്യപ്പെടുക.';

  @override
  String get noTrainerTitle => 'ഒരു കോച്ചിനൊപ്പം പരിശീലിക്കൂ';

  @override
  String get noTrainerMessage =>
      'ട്രെയിനറെയോ പേഴ്സണൽ ട്രെയിനിംഗോ അഭ്യർത്ഥിക്കുക. ജിം ഉടമ പരിശോധിച്ച് ഒരാളെ നിയോഗിക്കും.';

  @override
  String get trainerPerkPlan => 'നിങ്ങളുടെ ലക്ഷ്യത്തിന് യോജിച്ച പ്ലാൻ';

  @override
  String get trainerPerkChat => 'ആപ്പിൽ നേരിട്ട് ചാറ്റ്';

  @override
  String get trainerPerkProgress => 'ഫോം പരിശോധനയും പുരോഗതി അവലോകനവും';

  @override
  String get requestATrainer => 'ട്രെയിനറെ അഭ്യർത്ഥിക്കുക';

  @override
  String get requestPersonalTraining => 'പേഴ്സണൽ ട്രെയിനിംഗ് അഭ്യർത്ഥിക്കുക';

  @override
  String get requestPersonalTrainingHint => 'ജിം ഒരുക്കുന്ന വ്യക്തിഗത സെഷനുകൾ.';

  @override
  String get requestKindTrainer => 'ട്രെയിനർ';

  @override
  String get requestKindPt => 'പേഴ്സണൽ ട്രെയിനിംഗ്';

  @override
  String get requestSheetTitle => 'ട്രെയിനറെ ആവശ്യപ്പെടുക';

  @override
  String get requestSheetSubtitle =>
      'ഈ അഭ്യർത്ഥന ജിം ഉടമയ്ക്ക് ലഭിക്കും, അവർ ട്രെയിനറെ നിയോഗിക്കും.';

  @override
  String get preferredTrainerOptional => 'ഇഷ്ടപ്പെട്ട ട്രെയിനർ (നിർബന്ധമില്ല)';

  @override
  String get anyTrainer => 'ഏത് ട്രെയിനറും';

  @override
  String get anyTrainerHint => 'ഏറ്റവും അനുയോജ്യനെ ജിം തിരഞ്ഞെടുക്കട്ടെ';

  @override
  String get trainerFull => 'ബുക്കിംഗ് നിറഞ്ഞു';

  @override
  String get requestMessageHint => 'ജിം അറിയേണ്ടത്? സമയം, പരിക്കുകൾ…';

  @override
  String get sendRequest => 'അഭ്യർത്ഥന അയയ്ക്കുക';

  @override
  String get requestSent => 'അഭ്യർത്ഥന ജിമ്മിലേക്ക് അയച്ചു';

  @override
  String get requestPendingTitle => 'അഭ്യർത്ഥന പരിഗണനയിൽ';

  @override
  String get requestPendingShort =>
      'ജിം ട്രെയിനറെ നിയോഗിക്കാൻ കാത്തിരിക്കുന്നു.';

  @override
  String get requestPendingBody =>
      'ജിം ഉടൻ പരിശോധിക്കും. ട്രെയിനറെ നിയോഗിച്ചാൽ അറിയിപ്പ് ലഭിക്കും.';

  @override
  String get cancelRequest => 'അഭ്യർത്ഥന റദ്ദാക്കുക';

  @override
  String get cancelRequestTitle => 'ഈ അഭ്യർത്ഥന റദ്ദാക്കണോ?';

  @override
  String get cancelRequestBody =>
      'എപ്പോൾ വേണമെങ്കിലും പുതിയ അഭ്യർത്ഥന അയയ്ക്കാം.';

  @override
  String get requestHistory => 'മുൻ അഭ്യർത്ഥനകൾ';

  @override
  String get requestApproved => 'അംഗീകരിച്ചു';

  @override
  String get requestDeclined => 'നിരസിച്ചു';

  @override
  String get requestCancelled => 'റദ്ദാക്കി';

  @override
  String get requestStatusPending => 'പരിഗണനയിൽ';

  @override
  String preferredTrainerValue(String name) {
    return 'ഇഷ്ടം: $name';
  }

  @override
  String assignedTrainerValue(String name) {
    return '$name നിയോഗിക്കപ്പെട്ടു';
  }

  @override
  String get chatIntro =>
      'പ്ലാൻ, ഫോം, ഭക്ഷണം എന്നിവയെക്കുറിച്ച് ചോദിക്കൂ. ട്രെയിനർ ഇവിടെ മറുപടി നൽകും.';

  @override
  String get trainerRequests => 'ട്രെയിനർ അഭ്യർത്ഥനകൾ';

  @override
  String get trainerRequestsDesc => 'ട്രെയിനർ/PT ആവശ്യപ്പെടുന്ന അംഗങ്ങൾ';

  @override
  String get requestTabPending => 'പരിഗണനയിൽ';

  @override
  String get requestTabAll => 'എല്ലാം';

  @override
  String get noPendingRequests => 'പരിഗണനയിലുള്ള അഭ്യർത്ഥനകളില്ല';

  @override
  String get noRequests => 'ഇതുവരെ അഭ്യർത്ഥനകളില്ല';

  @override
  String get noRequestsMessage =>
      'അംഗങ്ങൾ ആപ്പിൽ ട്രെയിനറെ ആവശ്യപ്പെടുമ്പോൾ ഇവിടെ കാണാം.';

  @override
  String get assignTrainer => 'ട്രെയിനറെ നിയോഗിക്കുക';

  @override
  String get chooseTrainer => 'ട്രെയിനറെ തിരഞ്ഞെടുക്കുക';

  @override
  String get memberPreferred => 'അംഗത്തിന്റെ തിരഞ്ഞെടുപ്പ്';

  @override
  String get noActiveTrainers => 'സജീവ ട്രെയിനർമാരില്ല. ആദ്യം ഒരാളെ ചേർക്കുക.';

  @override
  String get declineRequestTitle => 'അഭ്യർത്ഥന നിരസിക്കുക';

  @override
  String get declineReasonHint => 'അംഗത്തിനുള്ള കാരണം (നിർബന്ധമില്ല)';

  @override
  String get requestApprovedToast => 'ട്രെയിനറെ നിയോഗിച്ചു. അംഗത്തെ അറിയിച്ചു.';

  @override
  String get requestDeclinedToast => 'അഭ്യർത്ഥന നിരസിച്ചു.';

  @override
  String get clientNoGoal => 'ഈ അംഗം ഇതുവരെ ആപ്പിൽ ലക്ഷ്യം നിശ്ചയിച്ചിട്ടില്ല.';

  @override
  String get sessionsToday => 'ഇന്നത്തെ സെഷനുകൾ';

  @override
  String get activeClients => 'സജീവ ക്ലയന്റുകൾ';

  @override
  String get unreadMessages => 'വായിക്കാത്ത സന്ദേശങ്ങൾ';

  @override
  String get noSessionsToday => 'ഇന്ന് സെഷനുകളൊന്നും ബുക്ക് ചെയ്തിട്ടില്ല.';

  @override
  String get noUpcomingSessions => 'വരാനിരിക്കുന്ന സെഷനുകളില്ല';

  @override
  String get noPastSessions => 'മുൻ സെഷനുകളില്ല';

  @override
  String get sessionsBookedHint =>
      'ജിമ്മോ അംഗങ്ങളോ ബുക്ക് ചെയ്ത സെഷനുകൾ ഇവിടെ കാണാം.';

  @override
  String get myClasses => 'എന്റെ ക്ലാസുകൾ';

  @override
  String get sessionScheduled => 'ഷെഡ്യൂൾ ചെയ്തു';

  @override
  String get sessionCompleted => 'പൂർത്തിയായി';

  @override
  String get sessionCancelled => 'റദ്ദാക്കി';

  @override
  String get sessionNoShow => 'വന്നില്ല';
}
