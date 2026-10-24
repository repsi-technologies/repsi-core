// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Tamil (`ta`).
class AppLocalizationsTa extends AppLocalizations {
  AppLocalizationsTa([String locale = 'ta']) : super(locale);

  @override
  String get commonCancel => 'ரத்து செய்';

  @override
  String get commonRetry => 'மீண்டும் முயல்';

  @override
  String get commonTryAgain => 'மீண்டும் முயலவும்';

  @override
  String get commonContinue => 'தொடரவும்';

  @override
  String get commonBack => 'பின் செல்';

  @override
  String get commonClose => 'மூடு';

  @override
  String get commonCopy => 'நகலெடு';

  @override
  String get commonAdd => 'சேர்';

  @override
  String get commonClear => 'அழி';

  @override
  String get commonView => 'பார்';

  @override
  String get commonSearch => 'தேடு';

  @override
  String get commonSearchHint => 'தேடு…';

  @override
  String get commonAll => 'அனைத்தும்';

  @override
  String get commonActive => 'செயலில்';

  @override
  String get commonInactive => 'செயலற்றது';

  @override
  String get commonExpired => 'காலாவதியானது';

  @override
  String get commonSuspended => 'இடைநிறுத்தப்பட்டது';

  @override
  String get commonTotal => 'மொத்தம்';

  @override
  String get commonToday => 'இன்று';

  @override
  String get commonThisWeek => 'இந்த வாரம்';

  @override
  String get commonThisMonth => 'இந்த மாதம்';

  @override
  String get commonDayStreak => 'தொடர் நாட்கள்';

  @override
  String get commonMember => 'உறுப்பினர்';

  @override
  String get commonMembers => 'உறுப்பினர்கள்';

  @override
  String get commonTrainer => 'பயிற்சியாளர்';

  @override
  String get commonTrainers => 'பயிற்சியாளர்கள்';

  @override
  String get commonOwner => 'உரிமையாளர்';

  @override
  String get commonStaff => 'ஊழியர்';

  @override
  String get commonUser => 'பயனர்';

  @override
  String get commonAttendance => 'வருகைப் பதிவு';

  @override
  String get commonPayments => 'கட்டணங்கள்';

  @override
  String get commonPayment => 'கட்டணம்';

  @override
  String get commonMembership => 'மெம்பர்ஷிப்';

  @override
  String get commonNotifications => 'அறிவிப்புகள்';

  @override
  String get commonSettings => 'அமைப்புகள்';

  @override
  String get commonProfile => 'சுயவிவரம்';

  @override
  String get commonMore => 'மேலும்';

  @override
  String get commonHome => 'முகப்பு';

  @override
  String get commonFinance => 'நிதி';

  @override
  String get commonFrontDesk => 'வரவேற்பு மேசை';

  @override
  String get commonSignOut => 'வெளியேறு';

  @override
  String get commonEmail => 'மின்னஞ்சல்';

  @override
  String get commonPassword => 'கடவுச்சொல்';

  @override
  String get commonMobileNumber => 'மொபைல் எண்';

  @override
  String get commonEmailHint => 'name@example.com';

  @override
  String get commonAtLeast8Chars => 'குறைந்தது 8 எழுத்துகள்';

  @override
  String get commonUseAtLeast8Chars =>
      'குறைந்தது 8 எழுத்துகளைப் பயன்படுத்தவும்';

  @override
  String get commonEnterValidEmail => 'சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்';

  @override
  String get commonEnterValidMobile => 'சரியான மொபைல் எண்ணை உள்ளிடவும்';

  @override
  String get commonCheckConnection =>
      'இணைய இணைப்பைச் சரிபார்த்து மீண்டும் முயலவும்.';

  @override
  String get commonSomethingWentWrong => 'ஏதோ தவறு நடந்தது. மீண்டும் முயலவும்.';

  @override
  String get commonInTheGymNow => 'இப்போது ஜிம்மில்';

  @override
  String get commonNoOneCheckedIn => 'இப்போது யாரும் செக்-இன் செய்யவில்லை.';

  @override
  String get commonCheckIn => 'செக்-இன்';

  @override
  String get commonCheckOut => 'செக்-அவுட்';

  @override
  String get commonCash => 'ரொக்கம்';

  @override
  String get commonCard => 'கார்டு';

  @override
  String get commonNetBanking => 'நெட் பேங்கிங்';

  @override
  String get commonCheque => 'காசோலை';

  @override
  String get commonOther => 'மற்றவை';

  @override
  String commonMonths(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count மாதங்கள்',
      one: '1 மாதம்',
    );
    return '$_temp0';
  }

  @override
  String commonDaysLeft(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count நாட்கள் மீதம்',
      one: '1 நாள் மீதம்',
    );
    return '$_temp0';
  }

  @override
  String commonErrorWithDetail(String detail) {
    return 'பிழை: $detail';
  }

  @override
  String get commonLinkCopied => 'இணைப்பு நகலெடுக்கப்பட்டது: https://repsi.app';

  @override
  String get commonLanguage => 'மொழி';

  @override
  String get appTagline => 'உங்கள் ஜிம். உங்கள் முன்னேற்றம்.';

  @override
  String get errorTimeout =>
      'இணைப்பு நேரம் கடந்தது. உங்கள் இணைய இணைப்பைச் சரிபார்க்கவும்.';

  @override
  String get errorNoConnection =>
      'REPSI-உடன் இணைக்க முடியவில்லை. இணைய இணைப்பு அல்லது சர்வர் நிலையைச் சரிபார்க்கவும்.';

  @override
  String get errorValidation => 'சரிபார்ப்புப் பிழை ஏற்பட்டது.';

  @override
  String get errorGeneric => 'ஒரு பிழை ஏற்பட்டது';

  @override
  String get errorBadRequest => 'கோரிக்கை விவரங்கள் தவறானவை.';

  @override
  String get errorInvalidCredentials => 'மின்னஞ்சல் அல்லது கடவுச்சொல் தவறானது.';

  @override
  String get errorSessionExpired =>
      'உங்கள் அமர்வு காலாவதியானது. மீண்டும் உள்நுழையவும்.';

  @override
  String get errorForbidden => 'இந்த ஜிம்மை அணுக உங்களுக்கு அனுமதி இல்லை.';

  @override
  String get errorNotFound => 'கணக்கு அல்லது ஜிம் கிடைக்கவில்லை.';

  @override
  String get errorRequestTimeout =>
      'கோரிக்கை நேரம் கடந்தது. மீண்டும் முயலவும்.';

  @override
  String get errorConflict => 'இந்த விவரங்களுடன் ஏற்கனவே ஒரு கணக்கு உள்ளது.';

  @override
  String get errorCheckInputs =>
      'நீங்கள் உள்ளிட்டவற்றைச் சரிபார்த்து மீண்டும் முயலவும்.';

  @override
  String get errorTooManyAttempts =>
      'பல முறை முயற்சித்துவிட்டீர்கள். சிறிது நேரம் கழித்து முயலவும்.';

  @override
  String get errorServerUnavailable => 'REPSI தற்காலிகமாகக் கிடைக்கவில்லை.';

  @override
  String get errorUnknown =>
      'கோரிக்கையைச் செயல்படுத்த முடியவில்லை. மீண்டும் முயலவும்.';

  @override
  String get errorLoadAttendance => 'வருகைப் பதிவை ஏற்ற முடியவில்லை';

  @override
  String get authNoSession =>
      'உள்நுழைவு அமர்வை உருவாக்கவில்லை. மீண்டும் முயலவும்.';

  @override
  String get authSignInFailed =>
      'உள்நுழைய முடியவில்லை. உங்கள் விவரங்களைச் சரிபார்க்கவும்.';

  @override
  String get authGoogleNoToken =>
      'Google உள்நுழைவு டோக்கனை வழங்கவில்லை. மீண்டும் முயலவும்.';

  @override
  String get authGoogleFailed =>
      'Google மூலம் உள்நுழைவு தோல்வியடைந்தது. மீண்டும் முயலவும் அல்லது மின்னஞ்சல், கடவுச்சொல்லைப் பயன்படுத்தவும்.';

  @override
  String get authCreateAccountFailed =>
      'உங்கள் கணக்கை உருவாக்க முடியவில்லை. மீண்டும் முயலவும்.';

  @override
  String get authRegistrationFailed =>
      'பதிவு தோல்வியடைந்தது. மீண்டும் முயலவும்.';

  @override
  String get authDeleteFailed =>
      'உங்கள் கணக்கை நீக்க முடியவில்லை. மீண்டும் முயலவும்.';

  @override
  String get authVerificationIncomplete =>
      'சரிபார்ப்பு முடியவில்லை. புதிய குறியீட்டைக் கோரவும்.';

  @override
  String get errorLoadDashboard => 'டாஷ்போர்டு விவரங்களை ஏற்ற முடியவில்லை';

  @override
  String get healthPermissionDenied =>
      'அனுமதி வழங்கப்படவில்லை. Health Connect அமைப்புகளில் அனுமதிக்கலாம்.';

  @override
  String get healthConnectFailed =>
      'Health Connect-உடன் இணைக்க முடியவில்லை. மீண்டும் முயலவும்.';

  @override
  String get healthReadFailed =>
      'Health Connect-இலிருந்து உங்கள் செயல்பாட்டைப் படிக்க முடியவில்லை.';

  @override
  String get errorLoadMembers => 'உறுப்பினர்களை ஏற்ற முடியவில்லை';

  @override
  String get errorLoadNotifications =>
      'அறிவிப்புகளை ஏற்ற முடியவில்லை. மீண்டும் முயல கீழே இழுக்கவும்.';

  @override
  String get notificationFallbackTitle => 'அறிவிப்பு';

  @override
  String get timeJustNow => 'இப்போது';

  @override
  String get errorLoadWorkspaces => 'உங்கள் ஜிம்களை ஏற்ற முடியவில்லை.';

  @override
  String get errorOnboarding => 'அமைப்பை முடிக்க முடியவில்லை';

  @override
  String get qrGymCheckIn => 'ஜிம் செக்-இன்';

  @override
  String get navClients => 'வாடிக்கையாளர்கள்';

  @override
  String get navSchedule => 'அட்டவணை';

  @override
  String get navPlans => 'திட்டங்கள்';

  @override
  String get navGyms => 'ஜிம்கள்';

  @override
  String get navUsers => 'பயனர்கள்';

  @override
  String get navAnalytics => 'பகுப்பாய்வு';

  @override
  String get navWorkout => 'உடற்பயிற்சி';

  @override
  String get navProgress => 'முன்னேற்றம்';

  @override
  String get navClasses => 'வகுப்புகள்';

  @override
  String get languageSheetTitle => 'ஆப் மொழி';

  @override
  String get languageSheetSubtitle =>
      'இந்தச் சாதனத்தில் REPSI பயன்படுத்தும் மொழியைத் தேர்ந்தெடுக்கவும்.';

  @override
  String get signOutConfirmGeneric =>
      'இந்தச் சாதனத்தில் REPSI-இலிருந்து வெளியேறவா?';

  @override
  String get switchWorkspace => 'ஜிம்மை மாற்று';

  @override
  String get avatarTitle => 'சுயவிவரப் படம்';

  @override
  String get avatarTakePhoto => 'படம் எடு';

  @override
  String get avatarChooseGallery => 'கேலரியிலிருந்து தேர்ந்தெடு';

  @override
  String get avatarRemove => 'படத்தை அகற்று';

  @override
  String get avatarCameraError =>
      'கேமராவைத் திறக்க முடியவில்லை. அமைப்புகளில் REPSI-க்கான கேமரா அனுமதியைச் சரிபார்க்கவும்.';

  @override
  String get avatarGalleryError =>
      'உங்கள் படங்களைத் திறக்க முடியவில்லை. அமைப்புகளில் REPSI-க்கான புகைப்பட அனுமதியைச் சரிபார்க்கவும்.';

  @override
  String get avatarChange => 'சுயவிவரப் படத்தை மாற்று';

  @override
  String get avatarAdd => 'சுயவிவரப் படத்தைச் சேர்';

  @override
  String codeFieldLabel(int count) {
    return 'சரிபார்ப்புக் குறியீடு, $count இலக்கங்கள்';
  }

  @override
  String get errorStateTitle => 'ஏதோ தவறு நடந்தது';

  @override
  String get ownerProfileTitle => 'உரிமையாளர் சுயவிவரம்';

  @override
  String get gymOwner => 'ஜிம் உரிமையாளர்';

  @override
  String get gymSettings => 'ஜிம் அமைப்புகள்';

  @override
  String get accountSettings => 'கணக்கு அமைப்புகள்';

  @override
  String get statusExpiring => 'விரைவில் முடியும்';

  @override
  String get statusFrozen => 'முடக்கப்பட்டது';

  @override
  String get statusCancelled => 'ரத்துசெய்யப்பட்டது';

  @override
  String get deleteAccountWarning =>
      'இது உங்கள் உள்நுழைவு, சுயவிவர விவரங்கள் மற்றும் ஒத்திசைக்கப்பட்ட செயல்பாட்டுத் தரவை நிரந்தரமாக நீக்கும். உங்கள் ஜிம் தன் கணக்குகளுக்குத் தேவையான உறுப்பினர் பதிவுகளை (வருகை, கட்டணங்கள்) வைத்திருக்கும். இதைத் திரும்பப் பெற முடியாது.';

  @override
  String get ownerSignupExplainer =>
      'ஜிம் வணிகங்கள் REPSI இணையதளத்தில் உருவாக்கப்படுகின்றன; அங்கே திட்டத்தைத் தேர்ந்தெடுத்து கிளைகளை அமைக்கலாம். தயாரானதும், அதே மொபைல் எண்ணுடன் இங்கே உள்நுழையவும்.';

  @override
  String resetLinkSent(String email) {
    return '$email என்ற முகவரிக்கு REPSI கணக்கு இருந்தால், மீட்டமைப்பு இணைப்பு அனுப்பப்படுகிறது. புதிய கடவுச்சொல்லைத் தேர்ந்தெடுக்க அதை இந்தத் தொலைபேசியிலோ கணினியிலோ திறக்கவும்.';
  }

  @override
  String otpSentTo(String number) {
    return '$number எண்ணுக்கு WhatsApp-இல் அனுப்பிய 6 இலக்கக் குறியீட்டை உள்ளிடவும்.';
  }

  @override
  String verifyEmailSentTo(String email) {
    return '$email முகவரிக்கு சரிபார்ப்பு இணைப்பை அனுப்பியுள்ளோம். உங்கள் இன்பாக்ஸைப் பார்க்கவும்.';
  }

  @override
  String get verifyEmailYourAddress => 'உங்கள் மின்னஞ்சல் முகவரி';

  @override
  String signupJoining(String slug) {
    return 'சேரும் ஜிம்: $slug';
  }

  @override
  String get changePassword => 'கடவுச்சொல்லை மாற்று';

  @override
  String get currentPassword => 'தற்போதைய கடவுச்சொல்';

  @override
  String get enterCurrentPassword => 'உங்கள் தற்போதைய கடவுச்சொல்லை உள்ளிடவும்';

  @override
  String get newPassword => 'புதிய கடவுச்சொல்';

  @override
  String get passwordMax72 => 'அதிகபட்சம் 72 எழுத்துகளைப் பயன்படுத்தவும்';

  @override
  String get passwordChooseDifferent => 'வேறு கடவுச்சொல்லைத் தேர்ந்தெடுக்கவும்';

  @override
  String get commonSaving => 'சேமிக்கிறது…';

  @override
  String get commonUpdate => 'புதுப்பி';

  @override
  String get passwordUpdated =>
      'கடவுச்சொல் மாற்றப்பட்டது. மற்ற சாதனங்களிலிருந்து வெளியேற்றப்பட்டது.';

  @override
  String get deleteAccountTitle => 'உங்கள் கணக்கை நீக்கவா?';

  @override
  String get deleteAccountPasswordLabel =>
      'கடவுச்சொல் (Google கணக்கு மட்டும் என்றால் காலியாக விடவும்)';

  @override
  String get deleteAccountTypeConfirm =>
      'உறுதிப்படுத்த DELETE என தட்டச்சு செய்யவும்';

  @override
  String get commonDeleting => 'நீக்குகிறது…';

  @override
  String get deleteAccount => 'கணக்கை நீக்கு';

  @override
  String get profilePhotoUploadFailed =>
      'கணக்கு உருவாக்கப்பட்டது, ஆனால் படம் பதிவேறவில்லை. சுயவிவரத்திலிருந்து சேர்க்கலாம்.';

  @override
  String get completeProfileTitle => 'கிட்டத்தட்ட முடிந்தது!';

  @override
  String get completeProfileSubtitle =>
      'உங்கள் எண் சரிபார்க்கப்பட்டது. கணக்கை அமைத்து முடிக்க சில விவரங்களைச் சேர்க்கவும்.';

  @override
  String get addProfilePhotoOptional =>
      'சுயவிவரப் படத்தைச் சேர்க்கவும் (விருப்பத்தேர்வு)';

  @override
  String get tapToChange => 'மாற்ற தட்டவும்';

  @override
  String get fullName => 'முழுப் பெயர்';

  @override
  String get fullNameHint => 'உங்கள் ஜிம்மில் உள்ளபடி';

  @override
  String get enterFullName => 'உங்கள் முழுப் பெயரை உள்ளிடவும்';

  @override
  String get uploadingPhoto => 'படம் பதிவேறுகிறது…';

  @override
  String get emailSendFailed =>
      'மின்னஞ்சலை அனுப்ப முடியவில்லை. மீண்டும் முயலவும்.';

  @override
  String get checkYourEmail => 'உங்கள் மின்னஞ்சலைப் பார்க்கவும்';

  @override
  String get backToSignIn => 'உள்நுழைவுக்குத் திரும்பு';

  @override
  String get useDifferentEmail => 'வேறு மின்னஞ்சலைப் பயன்படுத்து';

  @override
  String get resetPasswordTitle => 'உங்கள் கடவுச்சொல்லை மீட்டமைக்கவும்';

  @override
  String get resetPasswordSubtitle =>
      'உங்கள் கணக்கின் மின்னஞ்சலை உள்ளிடவும்; புதிய கடவுச்சொல்லை அமைக்க இணைப்பை அனுப்புவோம்.';

  @override
  String get sendResetLink => 'மீட்டமைப்பு இணைப்பை அனுப்பு';

  @override
  String get codeSendFailed =>
      'குறியீட்டை அனுப்ப முடியவில்லை. மீண்டும் முயலவும்.';

  @override
  String get accountNotFoundPassword =>
      'இந்த விவரங்களுடன் REPSI கணக்கு எதுவும் கிடைக்கவில்லை. மின்னஞ்சல் அல்லது மொபைல் எண்ணைச் சரிபார்க்கவும், அல்லது WhatsApp குறியீட்டுடன் உள்நுழையவும்.';

  @override
  String get accountNotFoundGoogle =>
      'இந்த Google கணக்குடன் இணைக்கப்பட்ட REPSI கணக்கு கிடைக்கவில்லை. பதிலாக உங்கள் மொபைல் எண்ணுடன் உள்நுழையவும்.';

  @override
  String get accountNotFound => 'கணக்கு கிடைக்கவில்லை';

  @override
  String get useMobileNumber => 'மொபைல் எண்ணைப் பயன்படுத்து';

  @override
  String get setUpNewGym => 'புதிய ஜிம்மை அமைக்கவும்';

  @override
  String get copyRepsiLink => 'repsi.app இணைப்பை நகலெடு';

  @override
  String get setUpNewGymQuestion => 'புதிய ஜிம்மை அமைக்கிறீர்களா?';

  @override
  String get startOnRepsi => 'repsi.app-இல் தொடங்கவும்';

  @override
  String get welcomeBack => 'மீண்டும் வருக';

  @override
  String get letsGetStarted => 'தொடங்கலாம்';

  @override
  String get loginPasswordSubtitle =>
      'உங்கள் கணக்கின் மின்னஞ்சல் அல்லது மொபைல் எண் மற்றும் கடவுச்சொல்லுடன் உள்நுழையவும்.';

  @override
  String get loginOtpSubtitle =>
      'உங்கள் மொபைல் எண்ணை உள்ளிடவும்; WhatsApp-இல் சரிபார்ப்புக் குறியீட்டை அனுப்புவோம்.';

  @override
  String get continueWithGoogle => 'Google மூலம் தொடரவும்';

  @override
  String get useMobileInstead => 'பதிலாக மொபைல் எண்ணைப் பயன்படுத்து';

  @override
  String get signInWithEmailPassword => 'மின்னஞ்சல், கடவுச்சொல்லுடன் உள்நுழை';

  @override
  String get enterMobileNumber => 'உங்கள் மொபைல் எண்ணை உள்ளிடவும்';

  @override
  String get enterValid10Digit => 'சரியான 10 இலக்க மொபைல் எண்ணை உள்ளிடவும்';

  @override
  String get sendCodeWhatsApp => 'WhatsApp-இல் குறியீட்டை அனுப்பு';

  @override
  String get emailOrMobile => 'மின்னஞ்சல் அல்லது மொபைல் எண்';

  @override
  String get emailOrMobileRequired => 'மின்னஞ்சல் அல்லது மொபைல் எண் தேவை';

  @override
  String get passwordRequired => 'கடவுச்சொல் தேவை';

  @override
  String get forgotPassword => 'கடவுச்சொல் மறந்துவிட்டதா?';

  @override
  String get signIn => 'உள்நுழை';

  @override
  String get chooseWorkspace => 'உங்கள் பணியிடத்தைத் தேர்ந்தெடுக்கவும்';

  @override
  String get chooseWorkspaceSubtitle =>
      'நீங்கள் அணுக விரும்பும் நிறுவனம் மற்றும் பணியிடத்தைத் தேர்ந்தெடுக்கவும்';

  @override
  String get roleOwnerTitle => 'Repsi Fitness — உரிமையாளர்';

  @override
  String get roleOwnerDesc =>
      'வணிகக் கட்டுப்பாட்டு மையம்: வருவாய், உறுப்பினர்கள், வருகை மற்றும் செயல்பாடுகள்';

  @override
  String get roleTrainerTitle => 'Repsi Fitness — பயிற்சியாளர்';

  @override
  String get roleTrainerDesc =>
      'பயிற்சிப் பணியிடம்: வாடிக்கையாளர் பயிற்சி, உடற்பயிற்சி & உணவுத் திட்டம், அரட்டை';

  @override
  String get roleTrainerBadge => 'செயலில் உள்ள பயிற்சியாளர்';

  @override
  String get roleMemberTitle => 'Repsi Fitness — உறுப்பினர்';

  @override
  String get roleMemberDesc =>
      'தனிப்பட்ட உடற்பயிற்சித் துணை: தொடர் நாட்கள், உடற்பயிற்சிகள், QR செக்-இன் & முன்னேற்றம்';

  @override
  String get roleMemberBadge => 'தங்க உறுப்பினர்';

  @override
  String get roleAdminTitle => 'Repsi Platform — நிர்வாகி';

  @override
  String get roleAdminDesc =>
      'உள் நிர்வாகம்: ஜிம்கள், கணக்குகள் & கணினி அளவீடுகள்';

  @override
  String get roleAdminBadge => 'சூப்பர் நிர்வாகி';

  @override
  String get signOutFailed => 'வெளியேற முடியவில்லை. மீண்டும் முயலவும்.';

  @override
  String get signOutTitle => 'வெளியேறவா?';

  @override
  String get signOutConfirmOwner =>
      'உங்கள் REPSI உரிமையாளர் கணக்கிலிருந்து வெளியேற விரும்புகிறீர்களா?';

  @override
  String get signingOut => 'வெளியேறுகிறது…';

  @override
  String get createAccountTitle => 'உங்கள் கணக்கை உருவாக்கவும்';

  @override
  String get joinGymTitle => 'உங்கள் ஜிம்மில் சேரவும்';

  @override
  String get signupStep1 => 'படி 1 / 2: உறுப்பினர் சுயவிவரம்';

  @override
  String get signupStep2 => 'படி 2 / 2: உங்கள் ஜிம்மில் சேரவும்';

  @override
  String get nameHintExample => 'Priya Sharma';

  @override
  String get fullNameRequired => 'முழுப் பெயர் தேவை';

  @override
  String get emailRequired => 'மின்னஞ்சல் தேவை';

  @override
  String get continueToGym => 'ஜிம்முக்குத் தொடரவும்';

  @override
  String get gymCode => 'ஜிம் இணைப்புப் பெயர்';

  @override
  String get gymCodeRequired => 'ஜிம் இணைப்புப் பெயர் தேவை';

  @override
  String get phoneOptional => 'தொலைபேசி எண் (விருப்பத்தேர்வு)';

  @override
  String get cityOptional => 'நகரம் (விருப்பத்தேர்வு)';

  @override
  String get cityHint => 'சென்னை, கொச்சி, டெல்லி…';

  @override
  String get createMemberAccount => 'உறுப்பினர் கணக்கை உருவாக்கு';

  @override
  String get verifyEmailTitle => 'உங்கள் மின்னஞ்சலைச் சரிபார்க்கவும்';

  @override
  String get continueToSetup => 'அமைப்பைத் தொடரவும்';

  @override
  String get resendEmail => 'மின்னஞ்சலை மீண்டும் அனுப்பு';

  @override
  String get verificationEmailResent =>
      'சரிபார்ப்பு மின்னஞ்சல் மீண்டும் அனுப்பப்பட்டது!';

  @override
  String get codeVerifyFailed =>
      'குறியீட்டைச் சரிபார்க்க முடியவில்லை. மீண்டும் முயலவும்.';

  @override
  String get newCodeSent => 'புதிய குறியீடு WhatsApp-க்கு அனுப்பப்படுகிறது.';

  @override
  String get verifyNumberTitle => 'உங்கள் எண்ணைச் சரிபார்க்கவும்';

  @override
  String get changeNumber => 'எண்ணை மாற்று';

  @override
  String get didntGetCode => 'கிடைக்கவில்லையா?';

  @override
  String resendIn(String time) {
    return '$time-இல் மீண்டும் அனுப்பலாம்';
  }

  @override
  String get commonSending => 'அனுப்புகிறது…';

  @override
  String get resendCode => 'குறியீட்டை மீண்டும் அனுப்பு';

  @override
  String get otpTestServerNotice =>
      'சோதனை சர்வர்: WhatsApp இணைக்கப்படவில்லை, எனவே சர்வரின் சோதனைக் குறியீட்டைப் பயன்படுத்தவும்.';

  @override
  String get verify => 'சரிபார்';

  @override
  String get photoUpdateFailed =>
      'படத்தைப் புதுப்பிக்க முடியவில்லை. மீண்டும் முயலவும்.';

  @override
  String get photoUpdated => 'சுயவிவரப் படம் புதுப்பிக்கப்பட்டது';

  @override
  String get photoRemoved => 'சுயவிவரப் படம் அகற்றப்பட்டது';

  @override
  String get splashSlow => 'வழக்கத்தைவிட நேரமாகிறது · தொடர தட்டவும்';

  @override
  String dashExpiringSoon(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: 'அடுத்த 7 நாட்களில் $count மெம்பர்ஷிப்கள் முடிகின்றன',
      one: 'அடுத்த 7 நாட்களில் 1 மெம்பர்ஷிப் முடிகிறது',
    );
    return '$_temp0';
  }

  @override
  String dashPeakHour(String hour) {
    return 'அதிக நேரம் $hour';
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
    return 'அறிவிப்புகள், $count படிக்காதவை';
  }

  @override
  String dashTrialDaysLeft(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other:
          'உங்கள் இலவச சோதனைக் காலத்தில் $count நாட்கள் மீதம் உள்ளன. எப்போது வேண்டுமானாலும் repsi.app-இல் திட்டத்தைத் தேர்ந்தெடுக்கலாம்.',
      one:
          'உங்கள் இலவச சோதனைக் காலத்தில் 1 நாள் மீதம் உள்ளது. எப்போது வேண்டுமானாலும் repsi.app-இல் திட்டத்தைத் தேர்ந்தெடுக்கலாம்.',
    );
    return '$_temp0';
  }

  @override
  String dashRevenueSemantics(String amount, String percent) {
    return 'இந்த மாத வருவாய் $amount, கடந்த மாதத்தைவிட $percent சதவீதம் அதிகம்';
  }

  @override
  String dashRevenueSemanticsDown(String amount, String percent) {
    return 'இந்த மாத வருவாய் $amount, கடந்த மாதத்தைவிட $percent சதவீதம் குறைவு';
  }

  @override
  String dashVsLastMonth(String percent) {
    return 'கடந்த மாதத்துடன் ஒப்பிட $percent%';
  }

  @override
  String dashCheckinsChartSemantics(int days, String values) {
    return 'கடந்த $days நாட்களின் செக்-இன்கள்: $values';
  }

  @override
  String dashCheckinsCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count செக்-இன்கள்',
      one: '1 செக்-இன்',
    );
    return '$_temp0';
  }

  @override
  String dashCheckedInCount(int count) {
    return '$count பேர் உள்ளே';
  }

  @override
  String dashInSince(String time) {
    return '$time முதல் உள்ளே';
  }

  @override
  String dashSeeAll(int count) {
    return 'அனைத்து $count-ஐயும் பார்';
  }

  @override
  String searchNoResults(String query) {
    return '\"$query\"-க்கு முடிவுகள் இல்லை';
  }

  @override
  String searchMembersHeader(int count) {
    return 'உறுப்பினர்கள் ($count)';
  }

  @override
  String searchTrainersHeader(int count) {
    return 'பயிற்சியாளர்கள் ($count)';
  }

  @override
  String searchFeaturesHeader(int count) {
    return 'வசதிகள் & குறுக்குவழிகள் ($count)';
  }

  @override
  String financeMembersCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count உறுப்பினர்கள்',
      one: '1 உறுப்பினர்',
    );
    return '$_temp0';
  }

  @override
  String financeDaysOverdue(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count நாட்கள் தாமதம்',
      one: '1 நாள் தாமதம்',
    );
    return '$_temp0';
  }

  @override
  String financeMoreOnWeb(int count) {
    return '+ மேலும் $count. முழு அறிக்கை repsi.app-இல்';
  }

  @override
  String memberCopied(String value) {
    return '$value நகலெடுக்கப்பட்டது';
  }

  @override
  String memberLastVisit(String when) {
    return 'கடைசி வருகை $when';
  }

  @override
  String memberPaidAcross(String amount, int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count கட்டணங்களில் $amount செலுத்தப்பட்டது',
      one: '1 கட்டணத்தில் $amount செலுத்தப்பட்டது',
    );
    return '$_temp0';
  }

  @override
  String memberInSince(String time) {
    return '$time முதல் உள்ளே';
  }

  @override
  String memberHistoryUntil(String label, String date) {
    return '$label · $date வரை';
  }

  @override
  String memberRenewedOn(String name, String plan) {
    return '$name $plan திட்டத்தில் புதுப்பிக்கப்பட்டார். கட்டணம் வசூலானதும் பதிவு செய்யவும்.';
  }

  @override
  String memberRenewFor(String amount) {
    return '$amount-க்குப் புதுப்பி';
  }

  @override
  String memberPaymentRecorded(String amount, String name) {
    return '$name-க்கு $amount பதிவு செய்யப்பட்டது';
  }

  @override
  String memberEnded(String when) {
    return '$when அன்று முடிந்தது';
  }

  @override
  String memberEnds(String when) {
    return '$when அன்று முடிகிறது';
  }

  @override
  String timeMinutesAgo(int count) {
    return '$count நி. முன்';
  }

  @override
  String timeHoursAgo(int count) {
    return '$count மணி முன்';
  }

  @override
  String timeDaysAgo(int count) {
    return '$count நா. முன்';
  }

  @override
  String opsCheckedOut(String name) {
    return '$name செக்-அவுட் செய்தார்';
  }

  @override
  String opsCheckedIn(String name) {
    return '$name செக்-இன் செய்தார்';
  }

  @override
  String opsInAt(String time, String duration) {
    return '$time-க்கு உள்ளே · $duration';
  }

  @override
  String opsFollowUp(String date) {
    return '$date அன்று பின்தொடர்க';
  }

  @override
  String opsLeadAdded(String name) {
    return '$name லீட்களில் சேர்க்கப்பட்டார்';
  }

  @override
  String opsQrRotates(String when) {
    return '$when அன்று மாறும்';
  }

  @override
  String opsTeamHeader(int count) {
    return 'ஊழியர்கள் & பயிற்சியாளர்கள் ($count)';
  }

  @override
  String opsYou(String name) {
    return '$name (நீங்கள்)';
  }

  @override
  String workspaceGreeting(String name) {
    return 'காலை வணக்கம், $name';
  }

  @override
  String workspaceSlug(String slug) {
    return 'இணைப்பு: $slug';
  }

  @override
  String get yourGym => 'உங்கள் ஜிம்';

  @override
  String get errorLoadDashboardTitle => 'உங்கள் டாஷ்போர்டை ஏற்ற முடியவில்லை';

  @override
  String get needsAttention => 'கவனம் தேவை';

  @override
  String get remindToRenew => 'அனுமதி முடியும் முன் புதுப்பிக்க நினைவூட்டவும்';

  @override
  String get checkIns => 'செக்-இன்கள்';

  @override
  String get greetingMorning => 'காலை வணக்கம்';

  @override
  String get greetingAfternoon => 'மதிய வணக்கம்';

  @override
  String get greetingEvening => 'மாலை வணக்கம்';

  @override
  String get accountAndSettings => 'கணக்கு மற்றும் அமைப்புகள்';

  @override
  String get trialEnded =>
      'உங்கள் இலவச சோதனைக் காலம் முடிந்தது. REPSI-ஐத் தொடர்ந்து பயன்படுத்த repsi.app-இல் திட்டத்தைத் தேர்ந்தெடுக்கவும்.';

  @override
  String get revenueThisMonth => 'இந்த மாத வருவாய்';

  @override
  String get checkInsToday => 'இன்றைய செக்-இன்கள்';

  @override
  String get activeMembers => 'செயலில் உள்ள உறுப்பினர்கள்';

  @override
  String get renewalsDue => 'புதுப்பிக்க வேண்டியவை';

  @override
  String get addMember => 'உறுப்பினரைச் சேர்';

  @override
  String get noCheckinsThisWeek =>
      'இந்த வாரம் இன்னும் செக்-இன் எதுவும் பதிவாகவில்லை.';

  @override
  String get errorLoadCheckedIn =>
      'யார் உள்ளே உள்ளனர் என்பதை ஏற்ற முடியவில்லை.';

  @override
  String get memberships => 'மெம்பர்ஷிப்கள்';

  @override
  String get reports => 'அறிக்கைகள்';

  @override
  String get searchAttendanceDesc =>
      'உறுப்பினர்களை உள்ளே/வெளியே பதிவு செய்து, யார் உள்ளே உள்ளனர் எனப் பாருங்கள்';

  @override
  String get searchMembersDesc =>
      'சுயவிவரங்கள், மெம்பர்ஷிப்கள் மற்றும் புதுப்பித்தல்கள்';

  @override
  String get leads => 'லீட்கள்';

  @override
  String get searchLeadsDesc =>
      'விசாரணைகள், சோதனை வருகைகள் மற்றும் பின்தொடர்தல்கள்';

  @override
  String get searchFinanceDesc => 'வசூல், நிலுவைகள் மற்றும் செலவுகள்';

  @override
  String get businessInsights => 'வணிக நுண்ணறிவு';

  @override
  String get searchInsightsDesc => 'என்ன மாறியது, அடுத்து என்ன செய்வது';

  @override
  String get insights => 'நுண்ணறிவு';

  @override
  String get searchNotificationsDesc => 'எச்சரிக்கைகள் மற்றும் அறிவிப்புகள்';

  @override
  String get account => 'கணக்கு';

  @override
  String get searchSettingsDesc =>
      'சுயவிவரம், கிளைகள், திட்டங்கள் மற்றும் தோற்றம்';

  @override
  String get searchFailed =>
      'உறுப்பினர்கள், பயிற்சியாளர்களைத் தேட முடியவில்லை. இணைய இணைப்பைச் சரிபார்க்கவும்.';

  @override
  String get searchHint => 'உறுப்பினர்கள், பயிற்சியாளர்கள், வசதிகளைத் தேடு…';

  @override
  String get recent => 'சமீபத்தியவை';

  @override
  String get quickAccess => 'விரைவு அணுகல்';

  @override
  String get searchUnavailable => 'தேடல் இப்போது இல்லை';

  @override
  String get searchEmptyHint =>
      'உறுப்பினர் பெயர், தொலைபேசி எண் அல்லது உறுப்பினர் குறியீடு, அல்லது வருகைப் பதிவு போன்ற திரையைத் தேடவும்.';

  @override
  String get memberIdLabel => 'உறுப்பினர் எண்:';

  @override
  String get coach => 'பயிற்சியாளர்';

  @override
  String get specStrength => 'வலிமை & கண்டிஷனிங்';

  @override
  String get errorLoadFinance => 'நிதி விவரங்களை ஏற்ற முடியவில்லை';

  @override
  String get collectedThisMonth => 'இந்த மாதம் வசூலானது';

  @override
  String get expenses => 'செலவுகள்';

  @override
  String get net => 'நிகரம்';

  @override
  String get duesToCollect => 'வசூலிக்க வேண்டிய நிலுவை';

  @override
  String get collections => 'வசூல்';

  @override
  String get last6Months => 'கடந்த 6 மாதங்கள்';

  @override
  String get noCollections =>
      'கடந்த ஆறு மாதங்களில் வசூல் எதுவும் பதிவாகவில்லை.';

  @override
  String get nothingOutstanding =>
      'நிலுவை எதுவும் இல்லை. அனைத்து விலைப்பட்டியல்களும் செலுத்தப்பட்டன.';

  @override
  String get dueNow => 'இப்போது செலுத்த வேண்டியது';

  @override
  String get recentExpenses => 'சமீபத்திய செலவுகள்';

  @override
  String get noExpenses => 'இன்னும் செலவுகள் எதுவும் பதிவாகவில்லை.';

  @override
  String get historyJoined => 'சேர்ந்தார்';

  @override
  String get historyStarted => 'மெம்பர்ஷிப் தொடங்கியது';

  @override
  String get historyRenewed => 'மெம்பர்ஷிப் புதுப்பிக்கப்பட்டது';

  @override
  String get historyExpired => 'மெம்பர்ஷிப் காலாவதியானது';

  @override
  String get historyFrozen => 'மெம்பர்ஷிப் முடக்கப்பட்டது';

  @override
  String get historyResumed => 'மெம்பர்ஷிப் மீண்டும் தொடங்கியது';

  @override
  String get historyFreezeCancelled => 'முடக்கம் ரத்துசெய்யப்பட்டது';

  @override
  String get historyExtended => 'மெம்பர்ஷிப் நீட்டிக்கப்பட்டது';

  @override
  String get historyCancelled => 'மெம்பர்ஷிப் ரத்துசெய்யப்பட்டது';

  @override
  String get historyStatusChanged => 'கணக்கு நிலை மாற்றப்பட்டது';

  @override
  String get historyNoteAdded => 'குறிப்பு சேர்க்கப்பட்டது';

  @override
  String get historyNoteEdited => 'குறிப்பு திருத்தப்பட்டது';

  @override
  String get historyNoteDeleted => 'குறிப்பு நீக்கப்பட்டது';

  @override
  String get historyProfileUpdated => 'சுயவிவரம் புதுப்பிக்கப்பட்டது';

  @override
  String get plan => 'திட்டம்';

  @override
  String get memberAdded => 'உறுப்பினர் சேர்க்கப்பட்டார்';

  @override
  String get memberAddFailed =>
      'உறுப்பினரைச் சேர்க்க முடியவில்லை. மீண்டும் முயலவும்.';

  @override
  String get addNewMember => 'புதிய உறுப்பினரைச் சேர்';

  @override
  String get fullNameRequiredLabel => 'முழுப் பெயர் *';

  @override
  String get nameRequired => 'பெயர் தேவை';

  @override
  String get emailRequiredLabel => 'மின்னஞ்சல் முகவரி *';

  @override
  String get phoneNumber => 'தொலைபேசி எண்';

  @override
  String get emergencyContactPhone => 'அவசரத் தொடர்பு எண்';

  @override
  String get membershipPlan => 'மெம்பர்ஷிப் திட்டம்';

  @override
  String get saveMember => 'உறுப்பினரைச் சேமி';

  @override
  String get errorLoadMember => 'இந்த உறுப்பினரை ஏற்ற முடியவில்லை';

  @override
  String get renew => 'புதுப்பி';

  @override
  String get overview => 'கண்ணோட்டம்';

  @override
  String get visits => 'வருகைகள்';

  @override
  String get history => 'வரலாறு';

  @override
  String get errorLoadThis => 'இந்தப் பகுதியை ஏற்ற முடியவில்லை';

  @override
  String get noPlan => 'திட்டம் இல்லை';

  @override
  String get ended => 'முடிந்தது';

  @override
  String get ends => 'முடிவு';

  @override
  String get memberSince => 'உறுப்பினரான நாள்';

  @override
  String get gender => 'பாலினம்';

  @override
  String get emergencyContact => 'அவசரத் தொடர்பு';

  @override
  String get errorLoadVisits => 'வருகைகளை ஏற்ற முடியவில்லை.';

  @override
  String get noVisitsYet => 'இன்னும் வருகைகள் இல்லை';

  @override
  String get notes => 'குறிப்புகள்';

  @override
  String get errorLoadNotes => 'குறிப்புகளை ஏற்ற முடியவில்லை.';

  @override
  String get noNotes =>
      'இன்னும் குறிப்புகள் இல்லை. வரவேற்பு மேசைக்குத் தெரிய வேண்டியதைச் சேர்க்கவும்.';

  @override
  String get noPaymentsForMember =>
      'இந்த உறுப்பினருக்கு இன்னும் கட்டணம் எதுவும் பதிவாகவில்லை.';

  @override
  String get noVisitsRecorded => 'இன்னும் வருகைகள் எதுவும் பதிவாகவில்லை.';

  @override
  String get noHistory => 'இன்னும் வரலாறு இல்லை.';

  @override
  String get system => 'கணினி';

  @override
  String get renewMembership => 'மெம்பர்ஷிப்பைப் புதுப்பி';

  @override
  String get recordPayment => 'கட்டணத்தைப் பதிவு செய்';

  @override
  String get amountRupees => 'தொகை (₹)';

  @override
  String get enterAmountReceived => 'பெற்ற தொகையை உள்ளிடவும்';

  @override
  String get noteOptional => 'குறிப்பு (விருப்பத்தேர்வு)';

  @override
  String get paymentNoteHint =>
      'எ.கா. காலாண்டு புதுப்பித்தல், UPI குறிப்பு எண்';

  @override
  String get savePayment => 'கட்டணத்தைச் சேமி';

  @override
  String get addNote => 'குறிப்பைச் சேர்';

  @override
  String get noteHint => 'ஊழியர்கள் என்ன தெரிந்துகொள்ள வேண்டும்?';

  @override
  String get saveNote => 'குறிப்பைச் சேமி';

  @override
  String get endingSoon => 'விரைவில் முடிவது';

  @override
  String get searchMembersHint => 'பெயர், தொலைபேசி அல்லது மின்னஞ்சலைத் தேடு';

  @override
  String get noMembersMatch => 'பொருந்தும் உறுப்பினர்கள் இல்லை';

  @override
  String get noMembersYet => 'இன்னும் உறுப்பினர்கள் இல்லை';

  @override
  String get tryAnotherSearch =>
      'வேறு பெயர், தொலைபேசி எண் அல்லது வடிகட்டியை முயலவும்.';

  @override
  String get addFirstMember =>
      'மெம்பர்ஷிப்கள், வருகைகளைக் கண்காணிக்க உங்கள் முதல் உறுப்பினரைச் சேர்க்கவும்.';

  @override
  String get branches => 'கிளைகள்';

  @override
  String get membershipPlans => 'மெம்பர்ஷிப் திட்டங்கள்';

  @override
  String get addTrainer => 'பயிற்சியாளரைச் சேர்';

  @override
  String get addTrainerDesc =>
      'ஜிம் பயிற்சியாளர் அல்லது தனிப் பயிற்சியாளரைச் சேர்க்கவும்';

  @override
  String get app => 'ஆப்';

  @override
  String get darkMode => 'இருண்ட பயன்முறை';

  @override
  String get onTheWeb => 'இணையத்தில்';

  @override
  String get onTheWebTitle =>
      'பில்லிங், ஊழியர் பொறுப்புகள், அறிக்கைகள் மற்றும் இணையதளம்';

  @override
  String get manageOnWeb => 'இவற்றை repsi.app-இல் நிர்வகிக்கவும்';

  @override
  String get errorLoadBranches => 'கிளைகளை ஏற்ற முடியவில்லை.';

  @override
  String get branch => 'கிளை';

  @override
  String get mainBranch => 'முதன்மை';

  @override
  String get editBranchesOnWeb =>
      'கிளைகளை repsi.app-இல் சேர்க்கவும் அல்லது திருத்தவும்.';

  @override
  String get errorLoadPlans => 'திட்டங்களை ஏற்ற முடியவில்லை.';

  @override
  String get noPlansYet =>
      'இன்னும் திட்டங்கள் இல்லை. repsi.app-இல் திட்டங்களை உருவாக்கவும்.';

  @override
  String get markAllRead => 'அனைத்தையும் படித்ததாகக் குறி';

  @override
  String get unread => 'படிக்காதவை';

  @override
  String get billing => 'பில்லிங்';

  @override
  String get announcements => 'அறிவிப்புகள்';

  @override
  String get notificationsUnavailable => 'அறிவிப்புகள் இப்போது கிடைக்கவில்லை';

  @override
  String get noNotifications => 'அறிவிப்புகள் இல்லை';

  @override
  String get noNotificationsDesc =>
      'அனைத்தையும் பார்த்துவிட்டீர்கள்! உங்கள் ஜிம் மெம்பர்ஷிப், வகுப்புகள், கட்டணங்கள் பற்றிய தகவல்கள் இங்கே தோன்றும்.';

  @override
  String get leadNew => 'புதியது';

  @override
  String get leadContacted => 'தொடர்பு கொள்ளப்பட்டது';

  @override
  String get leadVisitBooked => 'வருகை பதிவானது';

  @override
  String get leadTrial => 'சோதனை';

  @override
  String get leadNegotiating => 'பேச்சுவார்த்தை';

  @override
  String get leadLost => 'இழந்தது';

  @override
  String get checkInQr => 'செக்-இன் QR';

  @override
  String get team => 'குழு';

  @override
  String get errorLoadToday => 'இன்றைய எண்ணிக்கைகளை ஏற்ற முடியவில்லை.';

  @override
  String get insideNow => 'இப்போது உள்ளே';

  @override
  String get avgStay => 'சராசரி நேரம்';

  @override
  String get checkInMember => 'உறுப்பினரை செக்-இன் செய்';

  @override
  String get searchNameOrPhone => 'பெயர் அல்லது தொலைபேசியைத் தேடு';

  @override
  String get typeTwoLetters =>
      'பெயர் அல்லது தொலைபேசி எண்ணின் குறைந்தது இரண்டு எழுத்துகளை உள்ளிடவும்.';

  @override
  String get errorLoadLeads => 'லீட்களை ஏற்ற முடியவில்லை';

  @override
  String get noLeadsYet => 'இன்னும் லீட்கள் இல்லை';

  @override
  String get noLeadsInStage => 'இந்த நிலையில் லீட்கள் இல்லை';

  @override
  String get leadsEmptyDesc =>
      'யாரும் தவறிவிடாமல் இருக்க நேரில் வருபவர்களையும் விசாரணைகளையும் பதிவு செய்யவும்.';

  @override
  String get addLead => 'லீடைச் சேர்';

  @override
  String get newLead => 'புதிய லீட்';

  @override
  String get sourceWalkIn => 'நேரில் வந்தவர்';

  @override
  String get sourceInstagram => 'Instagram';

  @override
  String get sourceWebsite => 'இணையதளம்';

  @override
  String get sourceReferral => 'பரிந்துரை';

  @override
  String get sourceGoogle => 'Google';

  @override
  String get sourcePhoneCall => 'தொலைபேசி அழைப்பு';

  @override
  String get name => 'பெயர்';

  @override
  String get enterTheirName => 'அவர்களின் பெயரை உள்ளிடவும்';

  @override
  String get interestedIn => 'ஆர்வம் உள்ளது (விருப்பத்தேர்வு)';

  @override
  String get interestedInHint => 'எ.கா. காலாண்டுத் திட்டம், PT';

  @override
  String get saveLead => 'லீடைச் சேமி';

  @override
  String get errorLoadQr => 'செக்-இன் QR-ஐ ஏற்ற முடியவில்லை';

  @override
  String get qrDesc =>
      'உறுப்பினர்கள் REPSI ஆப் மூலம் இதை ஸ்கேன் செய்து தாங்களே செக்-இன் செய்யலாம். வரவேற்பு மேசையில் காட்டவும் அல்லது அச்சிடவும்.';

  @override
  String get qrSemantics => 'ஜிம் செக்-இன் QR குறியீடு';

  @override
  String get refresh => 'புதுப்பி';

  @override
  String get errorLoadTeam => 'உங்கள் குழுவை ஏற்ற முடியவில்லை';

  @override
  String get teamDesc =>
      'உங்கள் தொலைபேசியிலிருந்தே பயிற்சியாளர்களைச் சேர்த்து ஊழியர் பொறுப்புகளை நிர்வகிக்கவும்.';

  @override
  String get chooseGym => 'உங்கள் ஜிம்மைத் தேர்ந்தெடுக்கவும்';

  @override
  String get chooseGymSubtitle =>
      'இன்று பார்க்கவும் நிர்வகிக்கவும் விரும்பும் ஜிம் கிளையைத் தேர்ந்தெடுக்கவும்.';

  @override
  String get noGymsFound => 'ஜிம்கள் எதுவும் கிடைக்கவில்லை';

  @override
  String get registerGymOnWeb =>
      'உங்கள் பணியிடத்தைச் செயல்படுத்த repsi.app-இல் உங்கள் ஜிம்மைப் பதிவு செய்யவும்.';

  @override
  String get gymWorkspace => 'ஜிம்';

  @override
  String get openWorkspace => 'திற';

  @override
  String get registerAnotherGym =>
      'இன்னொரு ஜிம் கிளையைப் பதிவு செய்ய வேண்டுமா?';

  @override
  String get createGymOnDesktop =>
      'ஜிம்கள் கணினியிலிருந்து repsi.app இணையதளத்தில் உருவாக்கப்படுகின்றன.';

  @override
  String memberExpiredOn(String date) {
    return '$date அன்று காலாவதியானது';
  }

  @override
  String memberValidUntil(String date) {
    return '$date வரை செல்லுபடியாகும்';
  }

  @override
  String memberCheckedInSince(String time) {
    return '$time முதல் உள்ளே';
  }

  @override
  String healthAverageSteps(String steps) {
    return '7 நாள் சராசரி: $steps அடிகள்';
  }

  @override
  String healthSyncedAt(String time) {
    return '$time-க்கு ஒத்திசைக்கப்பட்டது';
  }

  @override
  String healthStepsSummary(String total, String average) {
    return 'மொத்தம் $total · நாளுக்கு $average';
  }

  @override
  String paymentRefLine(String ref, String method) {
    return 'குறிப்பு: $ref · $method';
  }

  @override
  String receiptNumberLine(String number) {
    return 'ரசீது எண்: $number';
  }

  @override
  String receiptDescriptionLine(String text) {
    return 'விவரம்: $text';
  }

  @override
  String receiptAmountLine(String amount) {
    return 'செலுத்திய தொகை: $amount';
  }

  @override
  String receiptModeLine(String mode) {
    return 'கட்டண முறை: $mode';
  }

  @override
  String receiptStatusLine(String status) {
    return 'நிலை: $status';
  }

  @override
  String qrSince(String time) {
    return '$time முதல்';
  }

  @override
  String qrInAt(String time) {
    return '$time-க்கு உள்ளே';
  }

  @override
  String chatUnread(int count) {
    return '$count படிக்காதவை';
  }

  @override
  String chatNotSent(String error) {
    return 'அனுப்பப்படவில்லை: $error';
  }

  @override
  String get chatRead => 'படிக்கப்பட்டது';

  @override
  String workoutLogExercise(String name) {
    return '$name-ஐப் பதிவு செய்';
  }

  @override
  String weightKg(String value) {
    return '$value கி.கி.';
  }

  @override
  String exPrimary(String muscle, String category) {
    return 'முதன்மை: $muscle ($category)';
  }

  @override
  String exSecondary(String muscle) {
    return 'இரண்டாம் நிலை: $muscle';
  }

  @override
  String exSetsCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count செட்கள்',
      one: '1 செட்',
    );
    return '$_temp0';
  }

  @override
  String exRepsCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count முறைகள்',
      one: '1 முறை',
    );
    return '$_temp0';
  }

  @override
  String exSetsReps(int sets, int reps) {
    return '$sets செட்கள் · $reps முறைகள்';
  }

  @override
  String exAllCount(int count) {
    return 'அனைத்தும் ($count)';
  }

  @override
  String exFavsCount(int count) {
    return 'பிடித்தவை ($count)';
  }

  @override
  String exSelectedCount(int count) {
    return 'தேர்ந்தெடுத்த பயிற்சிகள் ($count)';
  }

  @override
  String exBasketCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count பயிற்சிகள் தேர்ந்தெடுக்கப்பட்டன',
      one: '1 பயிற்சி தேர்ந்தெடுக்கப்பட்டது',
    );
    return '$_temp0';
  }

  @override
  String exWorkoutSaved(String name) {
    return '\"$name\" உடற்பயிற்சி என் உடற்பயிற்சிகளில் சேமிக்கப்பட்டது!';
  }

  @override
  String exCoachNote(String note) {
    return 'பயிற்சியாளர் குறிப்பு: \"$note\"';
  }

  @override
  String exRestSeconds(int count) {
    return '$count வி.';
  }

  @override
  String get myPass => 'என் பாஸ்';

  @override
  String get aiCoach => 'AI பயிற்சியாளர்';

  @override
  String get errorLoadMembership => 'உங்கள் மெம்பர்ஷிப்பை ஏற்ற முடியவில்லை.';

  @override
  String get noMembershipYet =>
      'இன்னும் மெம்பர்ஷிப் இல்லை. உங்களுக்கு ஒன்றை அமைக்கும்படி உங்கள் ஜிம்மிடம் கேளுங்கள்.';

  @override
  String get errorLoadYourAttendance =>
      'உங்கள் வருகைப் பதிவை ஏற்ற முடியவில்லை.';

  @override
  String get checkInWithQr => 'QR மூலம் செக்-இன்';

  @override
  String get healthAndroidOnly =>
      'Health Connect உள்ள Android தொலைபேசிகளில் செயல்பாட்டுக் கண்காணிப்பு கிடைக்கும்.';

  @override
  String get healthConnectPitch =>
      'Google Fit மற்றும் பிற ஆப்களிலிருந்து உங்கள் அடிகள், தூரம், செயலில் எரித்த கலோரிகளைக் காண Health Connect-ஐ இணைக்கவும். இந்த மூன்று மொத்தங்கள் மட்டுமே படிக்கப்படும்; எப்போது வேண்டுமானாலும் துண்டித்து நீக்கலாம்.';

  @override
  String get healthConnectNeeded =>
      'Google Fit மற்றும் பிற உடற்பயிற்சி ஆப்களிலிருந்து உங்கள் அடிகளைப் படிக்க Health Connect தேவை.';

  @override
  String get healthConnect => 'Health Connect-ஐ இணை';

  @override
  String get healthUpdate => 'Health Connect-ஐப் புதுப்பி';

  @override
  String get healthInstall => 'Health Connect-ஐ நிறுவு';

  @override
  String get steps => 'அடிகள்';

  @override
  String get activeKcal => 'செயலில் kcal';

  @override
  String get syncNow => 'இப்போது ஒத்திசை';

  @override
  String get disconnect => 'துண்டி';

  @override
  String get todaysActivity => 'இன்றைய செயல்பாடு';

  @override
  String get healthDisconnectTitle => 'Health Connect-ஐத் துண்டிக்கவா?';

  @override
  String get healthDisconnectBody =>
      'REPSI ஒத்திசைப்பதை நிறுத்தி, உங்களுக்காகச் சேமித்த செயல்பாட்டு மொத்தங்களை நீக்கும்.';

  @override
  String get aiWorkoutCoach => 'AI உடற்பயிற்சி பயிற்சியாளர்';

  @override
  String get paymentsAndInvoices => 'கட்டணங்கள் & விலைப்பட்டியல்கள்';

  @override
  String get notificationsAndAlerts => 'அறிவிப்புகள் & எச்சரிக்கைகள்';

  @override
  String get membershipAndPayments => 'மெம்பர்ஷிப் & கட்டணங்கள்';

  @override
  String get membershipDetails => 'மெம்பர்ஷிப் விவரங்கள்';

  @override
  String get membershipDetailsUnavailable =>
      'உங்கள் தற்போதைய திட்டமும் புதுப்பிப்பு விருப்பங்களும் இன்னும் இங்கே கிடைக்கவில்லை. உங்கள் மெம்பர்ஷிப்பை உறுதிப்படுத்த ஜிம்மைத் தொடர்பு கொள்ளவும்.';

  @override
  String get paymentHistoryHeader => 'கட்டண வரலாறு & ரசீதுகள்';

  @override
  String get digitalReceipt => 'கட்டண ரசீது';

  @override
  String get scanMemberPass => 'உறுப்பினர் பாஸை ஸ்கேன் செய்';

  @override
  String get scanGymQr => 'ஜிம் QR-ஐ ஸ்கேன் செய்';

  @override
  String get toggleFlashlight => 'டார்ச்சை ஆன்/ஆஃப் செய்';

  @override
  String get cameraAccessOff => 'கேமரா அனுமதி முடக்கப்பட்டுள்ளது';

  @override
  String get cameraUnavailable => 'கேமரா கிடைக்கவில்லை';

  @override
  String get cameraAccessOffDesc =>
      'ஜிம் QR-ஐ ஸ்கேன் செய்ய தொலைபேசி அமைப்புகளில் REPSI-க்குக் கேமரா அனுமதி வழங்கவும், அல்லது வரவேற்பு மேசையில் செக்-இன் செய்யச் சொல்லவும்.';

  @override
  String get cameraStartFailed =>
      'கேமராவைத் தொடங்க முடியவில்லை. வரவேற்பு மேசையில் செக்-இன் செய்யச் சொல்லவும்.';

  @override
  String get notRepsiQr =>
      'இது REPSI ஜிம் QR குறியீடு அல்ல. உங்கள் ஜிம் நுழைவாயிலில் உள்ள குறியீட்டை ஸ்கேன் செய்யவும்.';

  @override
  String get checkedInGreat => 'செக்-இன் ஆனது. நல்ல உடற்பயிற்சி அமையட்டும்!';

  @override
  String get checkOutTitle => 'செக்-அவுட் செய்யவா?';

  @override
  String get checkOutBody => 'இது உங்கள் தற்போதைய ஜிம் வருகையை முடிக்கும்.';

  @override
  String get checkedOutBye => 'செக்-அவுட் ஆனது. மீண்டும் சந்திப்போம்!';

  @override
  String get pointCamera =>
      'உங்கள் ஜிம் நுழைவாயிலில் உள்ள QR குறியீட்டை நோக்கிக் கேமராவைக் காட்டவும்.';

  @override
  String get youAreCheckedIn => 'நீங்கள் உள்ளே உள்ளீர்கள்';

  @override
  String get youAreNotCheckedIn => 'நீங்கள் செக்-இன் செய்யவில்லை';

  @override
  String get noVisitsYetDesc =>
      'இன்னும் வருகைகள் இல்லை. உங்கள் செக்-இன்கள் இங்கே தோன்றும்.';

  @override
  String get recentVisits => 'சமீபத்திய வருகைகள்';

  @override
  String get memberPassSemantics => 'உங்கள் REPSI உறுப்பினர் பாஸ் QR குறியீடு';

  @override
  String get showFrontDesk => 'இதை வரவேற்பு மேசையில் காட்டவும்';

  @override
  String get passRefreshNote =>
      'இது தானாகவே புதுப்பிக்கப்படும், உங்கள் ஜிம்மில் மட்டுமே செயல்படும். ஸ்கிரீன்ஷாட்டைப் பகிர வேண்டாம்.';

  @override
  String get scanMemberPassDesc =>
      'செக்-இன் அல்லது செக்-அவுட் செய்ய உறுப்பினரின் பாஸை ஸ்கேன் செய்யவும்.';

  @override
  String get activity => 'செயல்பாடு';

  @override
  String get errorLoadGymVisits => 'உங்கள் ஜிம் வருகைகளை ஏற்ற முடியவில்லை.';

  @override
  String get gymVisits => 'ஜிம் வருகைகள்';

  @override
  String get avgVisit => 'சராசரி வருகை';

  @override
  String get noVisitsStartStreak =>
      'இன்னும் வருகைகள் இல்லை. தொடர் நாட்களைத் தொடங்க உங்கள் ஜிம்மில் செக்-இன் செய்யவும்.';

  @override
  String get inProgress => 'நடைபெறுகிறது';

  @override
  String get healthStepsAndroidOnly =>
      'அடி கண்காணிப்புக்கு Health Connect உள்ள Android தொலைபேசி தேவை.';

  @override
  String get healthConnectFromHome =>
      'உங்கள் அடிகள், தூரம், செயலில் எரித்த கலோரிகளை இங்கே காண முகப்புத் தாவலில் Health Connect-ஐ இணைக்கவும்.';

  @override
  String get stepsThisWeek => 'இந்த வார அடிகள்';

  @override
  String get stepsChartSemantics =>
      'கடந்த ஏழு நாட்களின் அடிகளுக்கான பட்டை வரைபடம்';

  @override
  String get messages => 'செய்திகள்';

  @override
  String get noConversationsTrainer =>
      'இன்னும் உரையாடல்கள் இல்லை. ஒரு வாடிக்கையாளரைத் திறந்து செய்தி என்பதைத் தட்டவும்.';

  @override
  String get noConversationsMember =>
      'உங்களுக்கு ஒரு பயிற்சியாளர் ஒதுக்கப்பட்டதும், இங்கே அவருக்குச் செய்தி அனுப்பலாம்.';

  @override
  String get noMessagesYet => 'இன்னும் செய்திகள் இல்லை';

  @override
  String get sayHello => 'உரையாடலைத் தொடங்க வணக்கம் சொல்லுங்கள்.';

  @override
  String get writeMessage => 'செய்தியை எழுதவும்…';

  @override
  String get sendMessage => 'செய்தியை அனுப்பு';

  @override
  String get chatReadOnly =>
      'இந்தப் பயிற்சியாளர் இனி ஒதுக்கப்படவில்லை, எனவே உரையாடலைப் படிக்க மட்டுமே முடியும்.';

  @override
  String get targetWeight => 'இலக்கு எடை';

  @override
  String get repsPerSet => 'ஒரு செட்டுக்கு முறைகள்';

  @override
  String get saveSets => 'செட்களைச் சேமி';

  @override
  String get todaysWorkout => 'இன்றைய உடற்பயிற்சி';

  @override
  String get workoutProgress => 'உடற்பயிற்சி முன்னேற்றம்';

  @override
  String get targetSixExercises => 'இலக்கு: 6 பயிற்சிகள்';

  @override
  String get estDuration => 'சுமார் 45–50 நிமிடம்';

  @override
  String get logged => 'பதிவானது';

  @override
  String get log => 'பதிவு செய்';

  @override
  String get completeWorkout => 'உடற்பயிற்சியை முடி';

  @override
  String get workoutSummary => 'உடற்பயிற்சி சுருக்கம்';

  @override
  String get workoutComplete => 'உடற்பயிற்சி முடிந்தது!';

  @override
  String get workoutRecorded =>
      'அருமை! Upper Body A உங்கள் உடற்பயிற்சி சுயவிவரத்தில் சேமிக்கப்பட்டது.';

  @override
  String get streakPlusOne => '+1 தொடர் உடற்பயிற்சி நாள்';

  @override
  String get streakFive => 'அசத்துகிறீர்கள்! தொடர்ந்து 5 நாட்கள்.';

  @override
  String get activeBurn => 'செயலில் எரித்தது';

  @override
  String get duration => 'கால அளவு';

  @override
  String get exercises => 'பயிற்சிகள்';

  @override
  String get totalVolume => 'மொத்த அளவு';

  @override
  String get newPersonalRecord => 'புதிய தனிப்பட்ட சாதனை!';

  @override
  String get howDidItFeel => 'இந்த உடற்பயிற்சி எப்படி இருந்தது?';

  @override
  String get saveAndReturn => 'சேமித்துத் திரும்பு';

  @override
  String get workoutSavedSynced => 'உடற்பயிற்சி சேமிக்கப்பட்டது.';

  @override
  String get targetMuscles => 'இலக்குத் தசைகள்';

  @override
  String get sets => 'செட்கள்';

  @override
  String get reps => 'முறைகள்';

  @override
  String get rest => 'ஓய்வு';

  @override
  String get whyThisExercise => 'ஏன் இந்தப் பயிற்சி? (பயிற்சியாளர் குறிப்பு)';

  @override
  String get howToPerform => 'செய்யும் முறை';

  @override
  String get favourited => 'பிடித்தவையில் சேர்க்கப்பட்டது';

  @override
  String get favourite => 'பிடித்தவையில் சேர்';

  @override
  String get inWorkoutPlan => 'உடற்பயிற்சித் திட்டத்தில் உள்ளது';

  @override
  String get addToWorkout => 'உடற்பயிற்சியில் சேர்';

  @override
  String get workoutBuilder => 'உடற்பயிற்சி உருவாக்கி';

  @override
  String get routineName => 'பயிற்சித் திட்டப் பெயர்';

  @override
  String get noExercisesSelected =>
      'பயிற்சிகள் எதுவும் தேர்ந்தெடுக்கப்படவில்லை.\nஏதேனும் பயிற்சி அட்டையில் \"உடற்பயிற்சியில் சேர்\" என்பதைத் தட்டவும்.';

  @override
  String get saveWorkout => 'உடற்பயிற்சியைச் சேமி';

  @override
  String get exerciseLibrary => 'பயிற்சி நூலகம்';

  @override
  String get searchExercises => 'பயிற்சிகளைத் தேடு (எ.கா. chest dumbbell)';

  @override
  String get trainerCues => 'பயிற்சியாளர் குறிப்புகள்';

  @override
  String get noExercisesMatch =>
      'உங்கள் வடிகட்டிகளுக்குப் பொருந்தும் பயிற்சிகள் இல்லை';

  @override
  String get resetFilters => 'வடிகட்டிகளை மீட்டமை';

  @override
  String get demo => 'டெமோ';

  @override
  String get added => 'சேர்க்கப்பட்டது';

  @override
  String get readyToBuild => 'உங்கள் பயிற்சித் திட்டத்தை உருவாக்கத் தயார்';

  @override
  String get buildWorkout => 'உடற்பயிற்சியை உருவாக்கு';

  @override
  String trainerDietTitle(String name) {
    return '$name · உணவுத் திட்டம்';
  }

  @override
  String dietEatenToday(String calories, String protein) {
    return 'இன்று உண்டது: $calories kcal · $protein கி புரதம்';
  }

  @override
  String dietOfTarget(String target) {
    return '$target kcal-இல்';
  }

  @override
  String dietWater(String amount) {
    return 'தண்ணீர்: $amount மி.லி.';
  }

  @override
  String dietWaterOfTarget(String amount, String target) {
    return 'தண்ணீர்: $amount / $target மி.லி.';
  }

  @override
  String dietAdherence(
      String followed, String modified, String skipped, String notLogged) {
    return 'பின்பற்றியது $followed · மாற்றியது $modified · தவிர்த்தது $skipped · பதிவு இல்லை $notLogged';
  }

  @override
  String get mealBreakfast => 'காலை உணவு';

  @override
  String get mealMorningSnack => 'காலைச் சிற்றுண்டி';

  @override
  String get mealLunch => 'மதிய உணவு';

  @override
  String get mealEveningSnack => 'மாலைச் சிற்றுண்டி';

  @override
  String get mealDinner => 'இரவு உணவு';

  @override
  String get mealPreWorkout => 'உடற்பயிற்சிக்கு முன்';

  @override
  String get mealPostWorkout => 'உடற்பயிற்சிக்குப் பின்';

  @override
  String trainerSessionStarted(String name) {
    return '$name உடன் அமர்வு தொடங்கியது';
  }

  @override
  String trainerSessionStarting(String name) {
    return '$name உடன் அமர்வு தொடங்குகிறது';
  }

  @override
  String trainerWeightAttendance(String weight, String attendance) {
    return 'எடை: $weight · வருகை: $attendance';
  }

  @override
  String trainerAddedExercise(String name) {
    return '$name உடற்பயிற்சியில் சேர்க்கப்பட்டது';
  }

  @override
  String trainerAssignTo(String name) {
    return '\"$name\"-ஐ இவருக்கு ஒதுக்கு:';
  }

  @override
  String trainerAssigned(String workout, String name) {
    return '$workout $name-க்கு ஒதுக்கப்பட்டது';
  }

  @override
  String trainerExercisesCount(int count) {
    return 'பயிற்சிகள் ($count)';
  }

  @override
  String trainerSetsRepsWeight(String sets, String reps, String weight) {
    return '$sets செட் × $reps முறை · $weight';
  }

  @override
  String trainerRest(String value) {
    return 'ஓய்வு: $value';
  }

  @override
  String trainerTempo(String value) {
    return 'வேகம்: $value';
  }

  @override
  String adminOwnerPlan(String owner, String plan) {
    return 'உரிமையாளர்: $owner · $plan';
  }

  @override
  String comingSoon(String feature) {
    return '$feature விரைவில் வரும்';
  }

  @override
  String onboardingStep(int current, int total) {
    return 'படி $current / $total';
  }

  @override
  String get onboarding1Lead => 'நிர்வகி. பயிற்சி செய்.';

  @override
  String get onboarding1Accent => 'வளர்.';

  @override
  String get onboarding1Body =>
      'உங்கள் ஜிம்முக்கு ஒரே ஆப்: செக்-இன், மெம்பர்ஷிப், கட்டணங்கள், பயிற்சி — உரிமையாளர்கள், பயிற்சியாளர்கள், உறுப்பினர்கள் அனைவருக்கும்.';

  @override
  String get onboarding2Lead => 'நிர்வகியுங்கள்';

  @override
  String get onboarding2Accent => 'உறுப்பினர்களை';

  @override
  String get onboarding2Tail => 'எளிதாக';

  @override
  String get onboarding2Body =>
      'ஒவ்வொரு உறுப்பினருக்கும் மெம்பர்ஷிப், வருகை, நிலுவைகள் — காலாவதியாகும் முன்பே எச்சரிக்கை.';

  @override
  String get onboarding3Lead => 'முக்கியமான';

  @override
  String get onboarding3Accent => 'நுண்ணறிவுகள்';

  @override
  String get onboarding3Body =>
      'செக்-இன், புதுப்பித்தல், வருவாய் ஒரே பார்வையில் — உறுப்பினர்கள் விலகும் முன்பே செயல்படலாம்.';

  @override
  String get trainerAdded => 'பயிற்சியாளர் சேர்க்கப்பட்டார்';

  @override
  String get trainerAddFailed =>
      'பயிற்சியாளரைச் சேர்க்க முடியவில்லை. விவரங்களைச் சரிபார்க்கவும்.';

  @override
  String get addNewTrainer => 'புதிய பயிற்சியாளரைச் சேர்';

  @override
  String get trainerNameHint => 'எ.கா. Arun Kumar';

  @override
  String get trainerNameRequired => 'பயிற்சியாளர் பெயர் தேவை';

  @override
  String get mobileRequiredLabel => 'மொபைல் எண் *';

  @override
  String get mobileRequired => 'மொபைல் எண் தேவை';

  @override
  String get emailOptional => 'மின்னஞ்சல் முகவரி (விருப்பத்தேர்வு)';

  @override
  String get specialization => 'சிறப்புத் துறை';

  @override
  String get hourlyRateOptional => 'மணிநேரக் கட்டணம் (₹) (விருப்பத்தேர்வு)';

  @override
  String get bioOptional => 'சுயவிவரம் / அனுபவம் (விருப்பத்தேர்வு)';

  @override
  String get bioHint =>
      'எ.கா. 5+ ஆண்டு அனுபவமுள்ள சான்றிதழ் பெற்ற பயிற்சியாளர்…';

  @override
  String get saveTrainer => 'பயிற்சியாளரைச் சேமி';

  @override
  String get openFromMyClients =>
      'செய்தி அனுப்ப அல்லது உணவுத் திட்டத்தைப் பார்க்க, என் வாடிக்கையாளர்கள் பகுதியிலிருந்து இவரைத் திறக்கவும்.';

  @override
  String get message => 'செய்தி';

  @override
  String get dietPlan => 'உணவுத் திட்டம்';

  @override
  String get errorLoadAdherence =>
      'உணவுத் திட்டப் பின்பற்றலை ஏற்ற முடியவில்லை.';

  @override
  String get noDietPlan => 'உணவுத் திட்டம் எதுவும் ஒதுக்கப்படவில்லை.';

  @override
  String get dietAdherenceTitle =>
      'உணவுத் திட்டப் பின்பற்றல் · கடந்த 7 நாட்கள்';

  @override
  String get myClients => 'என் வாடிக்கையாளர்கள்';

  @override
  String get searchClients => 'வாடிக்கையாளர்களைத் தேடு';

  @override
  String get activeMembershipsOnly => 'செயலில் உள்ள மெம்பர்ஷிப்கள் மட்டும்';

  @override
  String get noClientsAssigned =>
      'இன்னும் உங்களுக்கு உறுப்பினர்கள் யாரும் ஒதுக்கப்படவில்லை.';

  @override
  String get noClientsMatch =>
      'உங்கள் தேடலுக்குப் பொருந்தும் வாடிக்கையாளர்கள் இல்லை.';

  @override
  String get noDietPlanMember =>
      'உங்கள் பயிற்சியாளர் இன்னும் உணவுத் திட்டத்தை ஒதுக்கவில்லை.';

  @override
  String get noDietPlanTrainer =>
      'உணவுத் திட்டம் எதுவும் ஒதுக்கப்படவில்லை. இணைய டாஷ்போர்டிலிருந்து ஒதுக்கவும்.';

  @override
  String get addWater => '+250 மி.லி.';

  @override
  String get coachingWorkspace => 'பயிற்சிப் பணியிடம்';

  @override
  String get todaysClients => 'இன்றைய வாடிக்கையாளர்கள்';

  @override
  String get pendingPlans => 'நிலுவையில் உள்ள திட்டங்கள்';

  @override
  String get clientChat => 'வாடிக்கையாளர் அரட்டை';

  @override
  String get todaysSessions => 'இன்றைய அமர்வுகள்';

  @override
  String get fullSchedule => 'முழு அட்டவணை →';

  @override
  String get nextUp => 'அடுத்தது';

  @override
  String get startSession => 'அமர்வைத் தொடங்கு';

  @override
  String get myProfile => 'என் சுயவிவரம்';

  @override
  String get mySchedule => 'என் அட்டவணை';

  @override
  String get workoutTemplates => 'உடற்பயிற்சி மாதிரிகள்';

  @override
  String get dietTemplates => 'உணவுத் திட்ட மாதிரிகள்';

  @override
  String get start => 'தொடங்கு';

  @override
  String get upcoming => 'வரவிருக்கிறது';

  @override
  String get assignToClient => 'வாடிக்கையாளருக்கு ஒதுக்கு';

  @override
  String get assignNow => 'ஒதுக்கு';

  @override
  String get programTitle => 'திட்டத்தின் தலைப்பு';

  @override
  String get addExercise => 'பயிற்சியைச் சேர்';

  @override
  String get saveAsTemplate => 'ஜிம் மாதிரியாகச் சேமி';

  @override
  String get notOnPlan => 'உங்கள் திட்டத்தில் இல்லை';

  @override
  String get errorLoadInsights => 'நுண்ணறிவுகளை ஏற்ற முடியவில்லை';

  @override
  String get insightsUpgrade =>
      'வணிக நுண்ணறிவுகள் உயர் REPSI திட்டங்களில் கிடைக்கும். இவற்றை இயக்க repsi.app-இல் மேம்படுத்தவும்.';

  @override
  String get summaryByAi => 'AI உருவாக்கிய சுருக்கம்';

  @override
  String get summary => 'சுருக்கம்';

  @override
  String get whatStandsOut => 'கவனிக்க வேண்டியவை';

  @override
  String get suggestedNextSteps => 'பரிந்துரைக்கப்படும் அடுத்த படிகள்';

  @override
  String get goalMuscleGain => 'தசை வளர்ச்சி';

  @override
  String get goalFatLoss => 'கொழுப்புக் குறைப்பு';

  @override
  String get goalStrength => 'வலிமை';

  @override
  String get goalEndurance => 'சகிப்புத்தன்மை & ஸ்டாமினா';

  @override
  String get goalWellness => 'பொது உடல்நலம்';

  @override
  String get expBeginner => 'தொடக்கநிலை (< 1 ஆண்டு)';

  @override
  String get expIntermediate => 'இடைநிலை (1–3 ஆண்டுகள்)';

  @override
  String get expAdvanced => 'மேம்பட்டநிலை (3+ ஆண்டுகள்)';

  @override
  String get equipFullGym => 'முழு ஜிம்';

  @override
  String get equipDumbbells => 'டம்பெல்ஸ் & பெஞ்ச்';

  @override
  String get equipBodyweight => 'வீட்டில் உடல் எடைப் பயிற்சி';

  @override
  String get safetyGuidelines => 'பாதுகாப்பு வழிகாட்டுதல்கள்';

  @override
  String get aiPowered => 'AI இயக்கம்';

  @override
  String get tailoredRoutine => 'உங்கள் தனிப்பட்ட பயிற்சித் திட்டம்';

  @override
  String get aiCoachIntro =>
      'உங்கள் உபகரணங்கள் மற்றும் இலக்குகளுக்கு ஏற்ற படிப்படியான திட்டத்தை உருவாக்க சில கேள்விகளுக்குப் பதிலளிக்கவும்.';

  @override
  String get aiQ1 => '1. உங்கள் முக்கிய உடற்பயிற்சி இலக்கு என்ன?';

  @override
  String get aiQ2 => '2. பயிற்சி அனுபவம்';

  @override
  String get aiQ3 => '3. வாரத்திற்குப் பயிற்சி நாட்கள்';

  @override
  String get aiQ4 => '4. கிடைக்கும் உபகரணங்கள்';

  @override
  String get generateRoutine => 'என் திட்டத்தை உருவாக்கு';

  @override
  String get personalizeAi => 'தனிப்பயனாக்கு';

  @override
  String get noPlanForCriteria => 'இந்தத் தேர்வுகளுக்குத் திட்டம் இல்லை.';

  @override
  String get aiTailored => 'AI உருவாக்கியது';

  @override
  String get verifiedSplit => 'பயிற்சியாளர் சரிபார்த்த திட்டம்';

  @override
  String get startThisWorkout => 'இந்த உடற்பயிற்சியைத் தொடங்கு';

  @override
  String get coachTips => 'பயிற்சியாளர் குறிப்புகள்';

  @override
  String get safetyDisclaimerTitle => 'பாதுகாப்பு & மருத்துவ மறுப்புரை';

  @override
  String get safetyDisclaimerBody =>
      'REPSI AI உடற்பயிற்சி பயிற்சியாளர் விளையாட்டு அறிவியல் மற்றும் தானியங்கி உருவாக்கத்தின் அடிப்படையில் பொதுவான பயிற்சிப் பரிந்துரைகளை வழங்குகிறது. இது தனிப்பட்ட மருத்துவ ஆலோசனை அல்லது உடற்பயிற்சி ஆலோசனைக்கு மாற்றல்ல. தலைச்சுற்றல், கூர்மையான வலி அல்லது மூச்சுத் திணறல் ஏற்பட்டால் உடனே பயிற்சியை நிறுத்தவும்.';

  @override
  String get understood => 'புரிந்தது';

  @override
  String get aiPlanUpperLowerTitle =>
      '4 நாள் மேல் / கீழ் உடல் பயிற்சித் திட்டம்';

  @override
  String get aiPlanUpperLowerBody =>
      'படிப்படியாகச் சுமையை அதிகரிக்கும், மூட்டுகள் மீள நேரம் தரும் சமநிலையான தசை வளர்ச்சித் திட்டம்.';

  @override
  String get aiPlanFatLossTitle => 'வளர்சிதை மாற்றப் பயிற்சித் திட்டம்';

  @override
  String get aiPlanFatLossBody =>
      'தசையைத் தக்கவைத்து அதிகக் கலோரிகளை எரிக்க, குறுகிய ஓய்வுடன் கூடிய கூட்டுப் பயிற்சிகள்.';

  @override
  String get aiPlanStrengthTitle => 'அடிப்படை வலிமைத் திட்டம்';

  @override
  String get aiPlanStrengthBody =>
      'அதிகபட்ச வலிமைக்காக RPE 8–9 அளவில் பல மூட்டுகளை இயக்கும் பார்பெல் பயிற்சிகள்.';

  @override
  String get aiDay1 => 'நாள் 1: மேல் உடல் சக்தி';

  @override
  String get aiCueBench =>
      'குதிகால் வழியாக அழுத்தி, முதுகில் லேசான வளைவைப் பராமரிக்கவும்';

  @override
  String get aiCueRow =>
      'முதுகுத்தண்டை நேராக வைத்து, மார்பெலும்பு நோக்கி இழுக்கவும்';

  @override
  String get aiDay2 => 'நாள் 2: கீழ் உடல் தசை வளர்ச்சி';

  @override
  String get aiCueSquat =>
      'முழங்கால்களையும் இடுப்பையும் ஒரே நேரத்தில் மடக்கவும்';

  @override
  String get aiCueRdl =>
      'முழங்கால்களை லேசாக மடக்கி இடுப்பைப் பின்னால் தள்ளி, தொடைப் பின்தசைகளில் உணரவும்';

  @override
  String get aiDay3 => 'நாள் 3: மேல் உடல் & கைகள்';

  @override
  String get aiDay4 => 'நாள் 4: கீழ் உடல் & மையத் தசைகள்';

  @override
  String get aiTipHydrate =>
      'பயிற்சிக்கு முன் குறைந்தது 500 மி.லி. தண்ணீர் குடிக்கவும்.';

  @override
  String get aiTipWarmup =>
      '5–10 நிமிட அசைவுப் பயிற்சி மற்றும் ஒவ்வொரு கூட்டுப் பயிற்சிக்கும் 2 லேசான செட்களுடன் வார்ம்-அப் செய்யவும்.';

  @override
  String get aiTipProgress =>
      'ஒவ்வொரு 1–2 வாரத்திற்கும் முக்கியப் பயிற்சிகளில் எடை அல்லது முறைகளை அதிகரிக்க முயலவும்.';

  @override
  String get aiPersonalisedNotice => 'REPSI AI மூலம் தனிப்பயனாக்கப்பட்டது';

  @override
  String get aiDisclaimer =>
      'புதிய பயிற்சித் திட்டத்தைத் தொடங்கும் முன் எப்போதும் மருத்துவரை அணுகவும். உடலின் சமிக்ஞைகளைக் கவனித்து, அசாதாரண அசௌகரியம் இருந்தால் நிறுத்தவும்.';

  @override
  String get aiWorkoutDay => 'உடற்பயிற்சி நாள்';

  @override
  String get aiPersonalPlan => 'தனிப்பட்ட உடற்பயிற்சித் திட்டம்';

  @override
  String get aiDisclaimerShort =>
      'உடற்பயிற்சித் திட்டத்தைத் தொடங்கும் முன் எப்போதும் மருத்துவரை அணுகவும்.';

  @override
  String get platformAnalytics => 'தள பகுப்பாய்வு';

  @override
  String get platformMrrGrowth => 'தள MRR வளர்ச்சி';

  @override
  String get platformHealth => 'தளத்தின் நிலை';

  @override
  String get apiResponseTime => 'API பதில் நேரம் (P95)';

  @override
  String get activeGymLicences => 'செயலில் உள்ள ஜிம் உரிமங்கள்';

  @override
  String get totalCheckinsToday => 'மொத்த செக்-இன்கள் (இன்று)';

  @override
  String get systemAdmin => 'கணினி நிர்வாகி';

  @override
  String get platformMetrics => 'தளம் முழுவதுமான அளவீடுகள்';

  @override
  String get totalGyms => 'மொத்த ஜிம்கள்';

  @override
  String get plusThreeThisMonth => 'இந்த மாதம் +3';

  @override
  String get activeUsers => 'செயலில் உள்ள பயனர்கள்';

  @override
  String get payingMembers => 'கட்டணம் செலுத்தும் உறுப்பினர்கள்';

  @override
  String get acrossAllGyms => 'அனைத்து ஜிம்களிலும்';

  @override
  String get platformRevenue => 'தள வருவாய்';

  @override
  String get mrrThisMonth => 'இந்த மாத MRR';

  @override
  String get subscriptions => 'சந்தாக்கள்';

  @override
  String get allServicesOk => 'அனைத்துச் சேவைகளும் இயங்குகின்றன';

  @override
  String get searchGymsHint => 'பெயர் அல்லது உரிமையாளர் மூலம் ஜிம்களைத் தேடு…';

  @override
  String get systemSettings => 'கணினி அமைப்புகள்';

  @override
  String get securityCompliance => 'பாதுகாப்பு & இணக்கம்';

  @override
  String get apiWebhooks => 'API & வெப்ஹூக்குகள்';

  @override
  String get systemAlerts => 'கணினி எச்சரிக்கைகள்';

  @override
  String get platformSupport => 'தள ஆதரவு';

  @override
  String get systemAdminSettings => 'நிர்வாக அமைப்புகள்';

  @override
  String get superAdministrator => 'சூப்பர் நிர்வாகி';

  @override
  String get searchUsersHint => 'அனைத்து ஜிம்களிலும் பயனர்களைத் தேடு…';

  @override
  String get skip => 'தவிர்';

  @override
  String get getStarted => 'தொடங்குங்கள்';

  @override
  String get next => 'அடுத்து';

  @override
  String get gymPass => 'ஜிம் பாஸ்';

  @override
  String get checkedIn => 'செக்-இன் ஆனது';

  @override
  String get dashboard => 'டாஷ்போர்டு';

  @override
  String get revenue => 'வருவாய்';

  @override
  String get dailyCheckins => 'தினசரி செக்-இன்கள்';

  @override
  String get mealSnack => 'சிற்றுண்டி';

  @override
  String get mealStatusEaten => 'உண்டது';

  @override
  String get mealStatusModified => 'மாற்றப்பட்டது';

  @override
  String get mealStatusSkipped => 'தவிர்க்கப்பட்டது';

  @override
  String dashTrendPercent(String value) {
    return '$value%';
  }

  @override
  String get myCustomRoutine => 'என் பயிற்சித் திட்டம்';

  @override
  String get yourGymLinkPlaceholder => 'your-gym';

  @override
  String memberNoteMeta(String author, String date) {
    return '$author · $date';
  }

  @override
  String get membershipPayment => 'மெம்பர்ஷிப் கட்டணம்';

  @override
  String get languageMenuSubtitle => 'ஆப் மொழியைத் தேர்ந்தெடுக்கவும்';

  @override
  String get specPersonalTraining => 'தனிப்பட்ட பயிற்சி';

  @override
  String get specHiit => 'HIIT & ஃபங்க்ஷனல்';

  @override
  String get specCrossfit => 'CrossFit';

  @override
  String get specYoga => 'யோகா & நெகிழ்வுத்தன்மை';

  @override
  String get specRehab => 'மறுவாழ்வுப் பயிற்சி';

  @override
  String get specGeneral => 'பொது உடற்தகுதி';

  @override
  String get exCatChest => 'மார்பு';

  @override
  String get exCatBack => 'முதுகு';

  @override
  String get exCatLegs => 'கால்கள்';

  @override
  String get exCatShoulders => 'தோள்கள்';

  @override
  String get exCatArms => 'கைகள்';

  @override
  String get exCatCore => 'மையத் தசைகள்';

  @override
  String get exCatCardio => 'கார்டியோ';

  @override
  String get exCatFullBody => 'முழு உடல்';

  @override
  String get exEqAll => 'அனைத்து உபகரணங்கள்';

  @override
  String get exEqNone => 'உபகரணம் இல்லை';

  @override
  String get exEqDumbbells => 'டம்பெல்ஸ்';

  @override
  String get exEqBarbell => 'பார்பெல்';

  @override
  String get exEqCable => 'கேபிள்';

  @override
  String get exEqMachine => 'இயந்திரம்';

  @override
  String get exEqKettlebell => 'கெட்டில்பெல்';

  @override
  String get exEqBand => 'ரெசிஸ்டன்ஸ் பேண்ட்';

  @override
  String get exEqSmith => 'ஸ்மித் இயந்திரம்';

  @override
  String get exLvlAll => 'அனைத்து நிலைகள்';

  @override
  String get exLvlBeginner => 'தொடக்கநிலை';

  @override
  String get exLvlIntermediate => 'இடைநிலை';

  @override
  String get exLvlAdvanced => 'மேம்பட்டநிலை';

  @override
  String get exTypeStrength => 'வலிமை';

  @override
  String get exTypeHypertrophy => 'தசை வளர்ச்சி';

  @override
  String get exTypeEndurance => 'சகிப்புத்தன்மை';

  @override
  String get exMuscleMidChest => 'நடு மார்பு';

  @override
  String get exMuscleUpperChest => 'மேல் மார்பு';

  @override
  String get exMuscleFrontDelts => 'முன் தோள்';

  @override
  String get exMuscleTriceps => 'ட்ரைசெப்ஸ்';

  @override
  String get exMuscleBiceps => 'பைசெப்ஸ்';

  @override
  String get exMuscleQuads => 'முன் தொடைத் தசை';

  @override
  String get exMuscleHamstrings => 'பின் தொடைத் தசை';

  @override
  String get exMuscleGlutes => 'பிட்டத் தசைகள்';

  @override
  String get exMuscleLowerBack => 'கீழ் முதுகு';

  @override
  String get exMuscleLats => 'லாட்ஸ்';

  @override
  String get exMuscleRearDelts => 'பின் தோள்';

  @override
  String get exMuscleForearms => 'முன்கைகள்';

  @override
  String get exMuscleLowerAbs => 'கீழ் வயிற்றுத் தசை';

  @override
  String get exMuscleGrip => 'பிடி வலிமை';

  @override
  String get exMuscleUpperBack => 'மேல் முதுகு & ரோம்பாய்ட்ஸ்';

  @override
  String get exMuscleTraps => 'ட்ரேப்ஸ்';

  @override
  String get exMuscleObliques => 'பக்க வயிற்றுத் தசை';

  @override
  String get exMuscleHipFlexors => 'இடுப்பு மடக்கும் தசைகள்';

  @override
  String get exStepBench1 =>
      'கண்கள் பாருக்கு நேர் கீழே இருக்கும்படி பெஞ்சில் படுக்கவும்.';

  @override
  String get exStepBench2 =>
      'தோள் அகலத்தைவிடச் சற்று அகலமாகப் பார்பெல்லைப் பிடிக்கவும்.';

  @override
  String get exStepBench3 =>
      'எடையை ரேக்கிலிருந்து எடுத்து, மையத் தசைகளை இறுக்கி, தோள்பட்டை எலும்புகளை ஒன்றாக அழுத்தவும்.';

  @override
  String get exStepBench4 =>
      'கட்டுப்பாட்டுடன் பாரை மார்பெலும்பின் கீழ்ப்பகுதி நோக்கி இறக்கவும்.';

  @override
  String get exStepBench5 => 'வேகமாக மேலே அழுத்தி கைகளை முழுமையாக நீட்டவும்.';

  @override
  String get exNoteBench =>
      'பாதங்களைத் தரையில் உறுதியாக அழுத்தி, முதுகை இயல்பான நிலையில் வைக்கவும்.';

  @override
  String get exStepIncline1 =>
      'சரிசெய்யக்கூடிய பெஞ்சை 30 முதல் 45 டிகிரி சாய்வில் அமைக்கவும்.';

  @override
  String get exStepIncline2 =>
      'பின்னால் சாயும்போது டம்பெல்களைத் தோள் உயரத்துக்குக் கொண்டு வரவும்.';

  @override
  String get exStepIncline3 =>
      'இரண்டு டம்பெல்களையும் நேராக மேலே அழுத்தி, உச்சியில் மேல் மார்பை இறுக்கவும்.';

  @override
  String get exStepIncline4 =>
      'மேல் கைகள் தரைக்கு இணையாகும் வரை கட்டுப்பாட்டுடன் இறக்கவும்.';

  @override
  String get exNoteIncline =>
      'தோள்களைப் பாதுகாக்க முழங்கைகளைச் சுமார் 45 டிகிரியில் உடலுக்கு அருகே வைக்கவும்.';

  @override
  String get exStepSquat1 => 'பார்பெல்லை மேல் முதுகின் மீது வைக்கவும்.';

  @override
  String get exStepSquat2 =>
      'பாதங்களைத் தோள் அகலத்துக்கு விரித்து, கால்விரல்கள் சற்று வெளிநோக்கி இருக்கும்படி நிற்கவும்.';

  @override
  String get exStepSquat3 =>
      'இடுப்பையும் முழங்கால்களையும் ஒன்றாக மடக்கி ஸ்குவாட் நிலைக்கு இறங்கவும்.';

  @override
  String get exStepSquat4 =>
      'தொடைகள் தரைக்கு இணையாகும் வரை அல்லது அதற்குக் கீழே இறங்கவும்.';

  @override
  String get exStepSquat5 =>
      'நடுப்பாதம் வழியாக அழுத்தி மீண்டும் எழுந்து நிற்கவும்.';

  @override
  String get exNoteSquat =>
      'ஆழம் வசதியாக இருந்தால், இந்த வாரம் உங்கள் அதிக எடை செட்டில் 5 கி.கி. சேர்க்கவும்.';

  @override
  String get exStepLat1 =>
      'தோள் அகலத்தைவிட அகலமாக, உள்ளங்கை கீழ்நோக்கிய பிடியில் அகலமான பாரைப் பிடிக்கவும்.';

  @override
  String get exStepLat2 =>
      'தொடைப் பட்டைகள் முழங்கால்களை உறுதியாக அழுத்தும்படி நேராக அமரவும்.';

  @override
  String get exStepLat3 =>
      'சற்று (சுமார் 10–15 டிகிரி) பின்னால் சாய்ந்து, பாரை மேல் மார்பு நோக்கி இழுக்கவும்.';

  @override
  String get exStepLat4 =>
      'கீழ் நிலையில் லாட் தசைகளை இறுக்கி, பின் கட்டுப்பாட்டுடன் திரும்பவும்.';

  @override
  String get exStepOhp1 => 'முதுகுத் தாங்கியுள்ள பெஞ்சில் நேராக அமரவும்.';

  @override
  String get exStepOhp2 =>
      'உள்ளங்கைகள் முன்னோக்கி இருக்கும்படி டம்பெல்களைத் தோள் உயரத்தில் பிடிக்கவும்.';

  @override
  String get exStepOhp3 =>
      'கைகள் நீளும் வரை டம்பெல்களை நேராகத் தலைக்கு மேலே அழுத்தவும்.';

  @override
  String get exStepOhp4 =>
      'கட்டுப்பாட்டுடன் மீண்டும் தோள் உயரத்துக்கு இறக்கவும்.';

  @override
  String get exNoteOhp =>
      'கீழ் முதுகைப் பெஞ்சிலிருந்து விலக்கி வளைக்க வேண்டாம்.';

  @override
  String get exStepCurl1 => '45 டிகிரி சாய்வுப் பெஞ்சில் சாய்ந்து அமரவும்.';

  @override
  String get exStepCurl2 =>
      'உள்ளங்கைகள் முன்னோக்கி இருக்கும்படி டம்பெல்கள் பக்கவாட்டில் நேராகத் தொங்கட்டும்.';

  @override
  String get exStepCurl3 => 'மேல் கைகளை அசைக்காமல் எடைகளை மேலே மடக்கவும்.';

  @override
  String get exStepCurl4 =>
      'உச்சியில் சற்று நிறுத்தி, பின் 3 விநாடிகளில் இறக்கவும்.';

  @override
  String get exStepLegRaise1 =>
      'உள்ளங்கை கீழ்நோக்கிய பிடியில் புல்-அப் பாரில் தொங்கவும்.';

  @override
  String get exStepLegRaise2 =>
      'கால்களை நேராகவோ முழங்காலில் சற்று மடக்கியோ வைக்கவும்.';

  @override
  String get exStepLegRaise3 =>
      'ஆடாமல், வயிற்றுத் தசைகளைப் பயன்படுத்திக் கால்களை இடுப்பு உயரத்துக்கு உயர்த்தவும்.';

  @override
  String get exStepLegRaise4 => 'மெதுவாக மீண்டும் இறக்கவும்.';

  @override
  String get exStepRow1 =>
      'முதுகை நேராக வைத்து, முழங்கால்களைச் சற்று மடக்கி இடுப்பிலிருந்து முன்னோக்கிக் குனியவும்.';

  @override
  String get exStepRow2 => 'டம்பெல்கள் தோள்களுக்கு நேர் கீழே தொங்கட்டும்.';

  @override
  String get exStepRow3 =>
      'முழங்கைகளை மேலே உயர்த்தி, டம்பெல்களை இடுப்பு நோக்கி இழுக்கவும்.';

  @override
  String get exStepRow4 => 'உச்சியில் தோள்பட்டை எலும்புகளை ஒன்றாக அழுத்தவும்.';

  @override
  String get exNoteRow =>
      'லாட் தசைகளுக்கு வேலை கொடுக்க, பைசெப்ஸால் அல்ல, முழங்கைகளால் இழுக்கவும்.';

  @override
  String get gymMachinesTitle => 'உடற்பயிற்சி இயந்திரங்கள் & உபகரணங்கள்';

  @override
  String get machineStatusAvailable => 'கிடைக்கக்கூடியது';

  @override
  String get machineStatusInUse => 'பயன்பாட்டில் உள்ளது';

  @override
  String get machineStatusMaintenance => 'பராமரிப்பில் உள்ளது';

  @override
  String get machineStatusUnavailable => 'கிடைக்கவில்லை';

  @override
  String machineCategoryPrefix(String category, String targets) {
    return 'வகை: $category · இலக்குகள்: $targets';
  }

  @override
  String get premiumPlan => 'பிரீமியம் திட்டம்';

  @override
  String get membershipStartDate => 'தொடக்க தேதி';

  @override
  String get membershipExpires => 'காலாவதியாகிறது';

  @override
  String get paymentHistory => 'கட்டண வரலாறு';

  @override
  String get myProgress => 'என் முன்னேற்றம்';

  @override
  String get tabWeight => 'எடை';

  @override
  String get tabMeasurements => 'அளவீடுகள்';

  @override
  String get tabAttendance => 'வருகை';

  @override
  String get tabPRs => 'சாதனைகள்';

  @override
  String get bmiTitle => 'பிஎம்ஐ (BMI)';

  @override
  String calculatedHeight(String height) {
    return 'கணக்கிடப்பட்டது ($height செ.மீ)';
  }

  @override
  String get bmiHealthNote =>
      'BMI என்பது உயரம் & எடையை அடிப்படையாகக் கொண்ட ஒரு மதிப்பீடு. வலிமை மற்றும் உடற்கட்டமைப்பு ஆகியவை உங்கள் முதன்மை ஆரோக்கிய குறிகாட்டிகள்.';

  @override
  String get logMetricsButton => 'எடை & உடல் அளவுகளைப் பதிவு செய்';

  @override
  String startedWeightSubtitle(String weight, String date) {
    return '$weight கிலோவிலிருந்து (தொடங்கியது $date)';
  }

  @override
  String get weightProgressTitle => 'எடை முன்னேற்றம்';

  @override
  String get measureChest => 'மார்பு';

  @override
  String get measureWaist => 'இடுப்பு';

  @override
  String get measureArms => 'கைகள்';

  @override
  String get measureThighs => 'தொடைகள்';

  @override
  String get benchPressExercise => 'பெஞ்ச் பிரஸ்';

  @override
  String get squatExercise => 'ஸ்குவாட்';

  @override
  String get deadliftExercise => 'டெட்லிஃப்ட்';

  @override
  String get outdoorRunningGps => 'வெளிப்புற ஓட்ட ஜிபிஎஸ்';

  @override
  String get runDistance => 'தூரம்';

  @override
  String get runKilometers => 'கிலோமீட்டர்கள்';

  @override
  String get runTime => 'நேரம்';

  @override
  String get runPace => 'வேகம்';

  @override
  String get runCalories => 'கலோரிகள்';

  @override
  String get liveGpsMap => 'நேரலை ஜிபிஎஸ் வரைபடக் காட்சி';

  @override
  String get recentRunHistory => 'சமீபத்திய ஓட்ட வரலாறு';

  @override
  String get morningRun => 'காலை ஓட்டம்';

  @override
  String runPacePerKm(String pace) {
    return '$pace /கி.மீ';
  }

  @override
  String runHistorySummary(String time, String pace) {
    return 'நேரம்: $time · சராசரி வேகம்: $pace /கி.மீ';
  }

  @override
  String get timeYesterday => 'நேற்று';

  @override
  String get pauseRun => 'ஓட்டத்தை இடைநிறுத்து';

  @override
  String get startRun => 'ஓடத் தொடங்கு';

  @override
  String get workoutPlanTitle => 'உடற்பயிற்சி திட்டம்';

  @override
  String exercisesCount(int count) {
    return 'பயிற்சிகள் ($count)';
  }

  @override
  String exercisesDuration(int count, int duration) {
    return '$count பயிற்சிகள் · $duration நிமிடம்';
  }

  @override
  String adminUptime(String percent) {
    return '$percent% இயங்கு நேரம்';
  }

  @override
  String adminMom(String percent) {
    return '$percent% மாத வளர்ச்சி (MoM)';
  }

  @override
  String adminTrialingCount(int count) {
    return '$count சோதனைக் கணக்குகள்';
  }

  @override
  String adminFullAccess(String email) {
    return '$email · முழு அனுமதி';
  }

  @override
  String get compoundHypertrophy => 'கூட்டுப் பயிற்சி · தசை வளர்ச்சி';

  @override
  String get commonSave => 'சேமி';

  @override
  String get commonSaved => 'சேமிக்கப்பட்டது';

  @override
  String get startWorkout => 'பயிற்சியைத் தொடங்கு';
}
