// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Hindi (`hi`).
class AppLocalizationsHi extends AppLocalizations {
  AppLocalizationsHi([String locale = 'hi']) : super(locale);

  @override
  String get commonCancel => 'रद्द करें';

  @override
  String get commonRetry => 'फिर कोशिश करें';

  @override
  String get commonTryAgain => 'फिर से कोशिश करें';

  @override
  String get commonContinue => 'जारी रखें';

  @override
  String get commonBack => 'वापस';

  @override
  String get commonClose => 'बंद करें';

  @override
  String get commonCopy => 'कॉपी करें';

  @override
  String get commonAdd => 'जोड़ें';

  @override
  String get commonClear => 'साफ़ करें';

  @override
  String get commonView => 'देखें';

  @override
  String get commonSearch => 'खोजें';

  @override
  String get commonSearchHint => 'खोजें…';

  @override
  String get commonAll => 'सभी';

  @override
  String get commonActive => 'सक्रिय';

  @override
  String get commonInactive => 'निष्क्रिय';

  @override
  String get commonExpired => 'समाप्त';

  @override
  String get commonSuspended => 'निलंबित';

  @override
  String get commonTotal => 'कुल';

  @override
  String get commonToday => 'आज';

  @override
  String get commonThisWeek => 'इस हफ़्ते';

  @override
  String get commonThisMonth => 'इस महीने';

  @override
  String get commonDayStreak => 'लगातार दिन';

  @override
  String get commonMember => 'सदस्य';

  @override
  String get commonMembers => 'सदस्य';

  @override
  String get commonTrainer => 'ट्रेनर';

  @override
  String get commonTrainers => 'ट्रेनर';

  @override
  String get commonOwner => 'मालिक';

  @override
  String get commonStaff => 'स्टाफ़';

  @override
  String get commonUser => 'उपयोगकर्ता';

  @override
  String get commonAttendance => 'उपस्थिति';

  @override
  String get commonPayments => 'भुगतान';

  @override
  String get commonPayment => 'भुगतान';

  @override
  String get commonMembership => 'मेंबरशिप';

  @override
  String get commonNotifications => 'सूचनाएं';

  @override
  String get commonSettings => 'सेटिंग्स';

  @override
  String get commonProfile => 'प्रोफ़ाइल';

  @override
  String get commonMore => 'और';

  @override
  String get commonHome => 'होम';

  @override
  String get commonFinance => 'वित्त';

  @override
  String get commonFrontDesk => 'फ्रंट डेस्क';

  @override
  String get commonSignOut => 'साइन आउट';

  @override
  String get commonEmail => 'ईमेल';

  @override
  String get commonPassword => 'पासवर्ड';

  @override
  String get commonMobileNumber => 'मोबाइल नंबर';

  @override
  String get commonEmailHint => 'name@example.com';

  @override
  String get commonAtLeast8Chars => 'कम से कम 8 अक्षर';

  @override
  String get commonUseAtLeast8Chars => 'कम से कम 8 अक्षर इस्तेमाल करें';

  @override
  String get commonEnterValidEmail => 'सही ईमेल पता डालें';

  @override
  String get commonEnterValidMobile => 'सही मोबाइल नंबर डालें';

  @override
  String get commonCheckConnection => 'अपना कनेक्शन जांचें और फिर कोशिश करें।';

  @override
  String get commonSomethingWentWrong =>
      'कुछ गड़बड़ हो गई। कृपया फिर कोशिश करें।';

  @override
  String get commonInTheGymNow => 'अभी जिम में';

  @override
  String get commonNoOneCheckedIn => 'अभी कोई चेक-इन नहीं है।';

  @override
  String get commonCheckIn => 'चेक-इन करें';

  @override
  String get commonCheckOut => 'चेक-आउट करें';

  @override
  String get commonCash => 'नकद';

  @override
  String get commonCard => 'कार्ड';

  @override
  String get commonNetBanking => 'नेट बैंकिंग';

  @override
  String get commonCheque => 'चेक';

  @override
  String get commonOther => 'अन्य';

  @override
  String commonMonths(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count महीने',
      one: '1 महीना',
    );
    return '$_temp0';
  }

  @override
  String commonDaysLeft(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count दिन बाकी',
      one: '1 दिन बाकी',
    );
    return '$_temp0';
  }

  @override
  String commonErrorWithDetail(String detail) {
    return 'त्रुटि: $detail';
  }

  @override
  String get commonLinkCopied => 'लिंक कॉपी हो गया: https://repsi.app';

  @override
  String get commonLanguage => 'भाषा';

  @override
  String get appTagline => 'आपका जिम। आपकी प्रगति।';

  @override
  String get errorTimeout =>
      'कनेक्शन का समय खत्म हो गया। अपना इंटरनेट कनेक्शन जांचें।';

  @override
  String get errorNoConnection =>
      'REPSI से कनेक्ट नहीं हो सका। अपना इंटरनेट कनेक्शन या सर्वर की स्थिति जांचें।';

  @override
  String get errorValidation => 'जानकारी की जांच में त्रुटि हुई।';

  @override
  String get errorGeneric => 'एक त्रुटि हुई';

  @override
  String get errorBadRequest => 'अनुरोध की जानकारी अमान्य है।';

  @override
  String get errorInvalidCredentials => 'ईमेल या पासवर्ड गलत है।';

  @override
  String get errorSessionExpired =>
      'आपका सेशन खत्म हो गया है। कृपया फिर से साइन इन करें।';

  @override
  String get errorForbidden => 'आपको इस जिम को देखने की अनुमति नहीं है।';

  @override
  String get errorNotFound => 'खाता या जिम नहीं मिला।';

  @override
  String get errorRequestTimeout =>
      'अनुरोध का समय खत्म हो गया। कृपया फिर कोशिश करें।';

  @override
  String get errorConflict => 'इन विवरणों वाला खाता पहले से मौजूद है।';

  @override
  String get errorCheckInputs => 'अपनी जानकारी जांचें और फिर कोशिश करें।';

  @override
  String get errorTooManyAttempts =>
      'बहुत ज़्यादा कोशिशें। कृपया कुछ देर बाद फिर कोशिश करें।';

  @override
  String get errorServerUnavailable => 'REPSI अभी उपलब्ध नहीं है।';

  @override
  String get errorUnknown => 'अनुरोध पूरा नहीं हो सका। कृपया फिर कोशिश करें।';

  @override
  String get errorLoadAttendance => 'उपस्थिति लोड नहीं हो सकी';

  @override
  String get authNoSession =>
      'साइन इन से सेशन नहीं मिला। कृपया फिर कोशिश करें।';

  @override
  String get authSignInFailed => 'साइन इन नहीं हो सका। अपनी जानकारी जांचें।';

  @override
  String get authGoogleNoToken =>
      'Google से साइन-इन टोकन नहीं मिला। कृपया फिर कोशिश करें।';

  @override
  String get authGoogleFailed =>
      'Google साइन-इन नहीं हुआ। फिर कोशिश करें या अपना ईमेल और पासवर्ड इस्तेमाल करें।';

  @override
  String get authCreateAccountFailed =>
      'आपका खाता नहीं बन सका। कृपया फिर कोशिश करें।';

  @override
  String get authRegistrationFailed =>
      'रजिस्ट्रेशन नहीं हो सका। कृपया फिर कोशिश करें।';

  @override
  String get authDeleteFailed =>
      'आपका खाता हटाया नहीं जा सका। कृपया फिर कोशिश करें।';

  @override
  String get authVerificationIncomplete =>
      'सत्यापन पूरा नहीं हुआ। कृपया नया कोड मंगाएं।';

  @override
  String get errorLoadDashboard => 'डैशबोर्ड के आंकड़े लोड नहीं हो सके';

  @override
  String get healthPermissionDenied =>
      'अनुमति नहीं मिली। आप Health Connect सेटिंग्स में अनुमति दे सकते हैं।';

  @override
  String get healthConnectFailed =>
      'Health Connect से कनेक्ट नहीं हो सका। कृपया फिर कोशिश करें।';

  @override
  String get healthReadFailed =>
      'Health Connect से आपकी गतिविधि नहीं पढ़ी जा सकी।';

  @override
  String get errorLoadMembers => 'सदस्य लोड नहीं हो सके';

  @override
  String get errorLoadNotifications =>
      'सूचनाएं लोड नहीं हो सकीं। फिर कोशिश करने के लिए नीचे खींचें।';

  @override
  String get notificationFallbackTitle => 'सूचना';

  @override
  String get timeJustNow => 'अभी';

  @override
  String get errorLoadWorkspaces => 'आपके जिम लोड नहीं हो सके।';

  @override
  String get errorOnboarding => 'सेटअप पूरा नहीं हो सका';

  @override
  String get qrGymCheckIn => 'जिम चेक-इन';

  @override
  String get navClients => 'क्लाइंट';

  @override
  String get navSchedule => 'शेड्यूल';

  @override
  String get navPlans => 'प्लान';

  @override
  String get navGyms => 'जिम';

  @override
  String get navUsers => 'उपयोगकर्ता';

  @override
  String get navAnalytics => 'एनालिटिक्स';

  @override
  String get navWorkout => 'वर्कआउट';

  @override
  String get navProgress => 'प्रगति';

  @override
  String get navClasses => 'क्लासेस';

  @override
  String get languageSheetTitle => 'ऐप की भाषा';

  @override
  String get languageSheetSubtitle =>
      'इस डिवाइस पर REPSI किस भाषा में दिखे, चुनें।';

  @override
  String get signOutConfirmGeneric => 'इस डिवाइस पर REPSI से साइन आउट करें?';

  @override
  String get switchWorkspace => 'जिम बदलें';

  @override
  String get avatarTitle => 'प्रोफ़ाइल फ़ोटो';

  @override
  String get avatarTakePhoto => 'फ़ोटो लें';

  @override
  String get avatarChooseGallery => 'गैलरी से चुनें';

  @override
  String get avatarRemove => 'फ़ोटो हटाएं';

  @override
  String get avatarCameraError =>
      'कैमरा नहीं खुल सका। सेटिंग्स में REPSI की कैमरा अनुमति जांचें।';

  @override
  String get avatarGalleryError =>
      'आपकी फ़ोटो नहीं खुल सकीं। सेटिंग्स में REPSI की फ़ोटो अनुमति जांचें।';

  @override
  String get avatarChange => 'प्रोफ़ाइल फ़ोटो बदलें';

  @override
  String get avatarAdd => 'प्रोफ़ाइल फ़ोटो जोड़ें';

  @override
  String codeFieldLabel(int count) {
    return 'सत्यापन कोड, $count अंक';
  }

  @override
  String get errorStateTitle => 'कुछ गड़बड़ हो गई';

  @override
  String get ownerProfileTitle => 'मालिक की प्रोफ़ाइल';

  @override
  String get gymOwner => 'जिम मालिक';

  @override
  String get gymSettings => 'जिम सेटिंग्स';

  @override
  String get accountSettings => 'खाता सेटिंग्स';

  @override
  String get statusExpiring => 'जल्द खत्म';

  @override
  String get statusFrozen => 'फ़्रीज़';

  @override
  String get statusCancelled => 'रद्द';

  @override
  String get deleteAccountWarning =>
      'इससे आपका लॉगिन, प्रोफ़ाइल विवरण और सिंक किया गया गतिविधि डेटा हमेशा के लिए हट जाएगा। आपका जिम अपने हिसाब-किताब के लिए ज़रूरी सदस्य रिकॉर्ड (उपस्थिति और भुगतान) रखेगा। इसे वापस नहीं किया जा सकता।';

  @override
  String get ownerSignupExplainer =>
      'जिम का बिज़नेस REPSI वेबसाइट पर बनाया जाता है, जहां आप प्लान चुनते हैं और ब्रांच सेट करते हैं। तैयार होने पर उसी मोबाइल नंबर से यहां साइन इन करें।';

  @override
  String resetLinkSent(String email) {
    return 'अगर $email का REPSI खाता है, तो रीसेट लिंक भेजा जा रहा है। नया पासवर्ड चुनने के लिए इसे इस फ़ोन या कंप्यूटर पर खोलें।';
  }

  @override
  String otpSentTo(String number) {
    return '$number पर WhatsApp से भेजा गया 6 अंकों का कोड डालें।';
  }

  @override
  String verifyEmailSentTo(String email) {
    return 'हमने $email पर सत्यापन लिंक भेजा है। कृपया अपना इनबॉक्स देखें।';
  }

  @override
  String get verifyEmailYourAddress => 'आपका ईमेल पता';

  @override
  String signupJoining(String slug) {
    return 'जुड़ रहे हैं: $slug';
  }

  @override
  String get changePassword => 'पासवर्ड बदलें';

  @override
  String get currentPassword => 'मौजूदा पासवर्ड';

  @override
  String get enterCurrentPassword => 'अपना मौजूदा पासवर्ड डालें';

  @override
  String get newPassword => 'नया पासवर्ड';

  @override
  String get passwordMax72 => 'ज़्यादा से ज़्यादा 72 अक्षर इस्तेमाल करें';

  @override
  String get passwordChooseDifferent => 'कोई दूसरा पासवर्ड चुनें';

  @override
  String get commonSaving => 'सेव हो रहा है…';

  @override
  String get commonUpdate => 'अपडेट करें';

  @override
  String get passwordUpdated =>
      'पासवर्ड बदल गया। दूसरे डिवाइस से साइन आउट कर दिया गया।';

  @override
  String get deleteAccountTitle => 'अपना खाता हटाएं?';

  @override
  String get deleteAccountPasswordLabel =>
      'पासवर्ड (सिर्फ़ Google खाते के लिए खाली छोड़ें)';

  @override
  String get deleteAccountTypeConfirm => 'पुष्टि के लिए DELETE लिखें';

  @override
  String get commonDeleting => 'हटाया जा रहा है…';

  @override
  String get deleteAccount => 'खाता हटाएं';

  @override
  String get profilePhotoUploadFailed =>
      'खाता बन गया, लेकिन फ़ोटो अपलोड नहीं हुई। आप इसे प्रोफ़ाइल से जोड़ सकते हैं।';

  @override
  String get completeProfileTitle => 'बस थोड़ा और!';

  @override
  String get completeProfileSubtitle =>
      'आपका नंबर सत्यापित हो गया। खाता सेट करने के लिए कुछ विवरण जोड़ें।';

  @override
  String get addProfilePhotoOptional => 'प्रोफ़ाइल फ़ोटो जोड़ें (वैकल्पिक)';

  @override
  String get tapToChange => 'बदलने के लिए टैप करें';

  @override
  String get fullName => 'पूरा नाम';

  @override
  String get fullNameHint => 'जैसा आपका जिम आपको जानता है';

  @override
  String get enterFullName => 'अपना पूरा नाम डालें';

  @override
  String get uploadingPhoto => 'फ़ोटो अपलोड हो रही है…';

  @override
  String get emailSendFailed => 'ईमेल नहीं भेजा जा सका। कृपया फिर कोशिश करें।';

  @override
  String get checkYourEmail => 'अपना ईमेल देखें';

  @override
  String get backToSignIn => 'साइन इन पर वापस जाएं';

  @override
  String get useDifferentEmail => 'दूसरा ईमेल इस्तेमाल करें';

  @override
  String get resetPasswordTitle => 'अपना पासवर्ड रीसेट करें';

  @override
  String get resetPasswordSubtitle =>
      'अपने खाते का ईमेल डालें, नया पासवर्ड सेट करने का लिंक हम भेज देंगे।';

  @override
  String get sendResetLink => 'रीसेट लिंक भेजें';

  @override
  String get codeSendFailed => 'कोड नहीं भेजा जा सका। कृपया फिर कोशिश करें।';

  @override
  String get accountNotFoundPassword =>
      'इन विवरणों वाला कोई REPSI खाता नहीं मिला। अपना ईमेल या मोबाइल नंबर जांचें, या WhatsApp कोड से साइन इन करें।';

  @override
  String get accountNotFoundGoogle =>
      'इस Google खाते से जुड़ा कोई REPSI खाता नहीं मिला। इसके बजाय अपने मोबाइल नंबर से साइन इन करें।';

  @override
  String get accountNotFound => 'खाता नहीं मिला';

  @override
  String get useMobileNumber => 'मोबाइल नंबर इस्तेमाल करें';

  @override
  String get setUpNewGym => 'नया जिम सेट करें';

  @override
  String get copyRepsiLink => 'repsi.app लिंक कॉपी करें';

  @override
  String get setUpNewGymQuestion => 'नया जिम सेट कर रहे हैं?';

  @override
  String get startOnRepsi => 'repsi.app पर शुरू करें';

  @override
  String get welcomeBack => 'फिर से स्वागत है';

  @override
  String get letsGetStarted => 'चलिए शुरू करें';

  @override
  String get loginPasswordSubtitle =>
      'अपने खाते के ईमेल या मोबाइल नंबर और पासवर्ड से साइन इन करें।';

  @override
  String get loginOtpSubtitle =>
      'अपना मोबाइल नंबर डालें, हम WhatsApp पर सत्यापन कोड भेजेंगे।';

  @override
  String get continueWithGoogle => 'Google से जारी रखें';

  @override
  String get useMobileInstead => 'इसके बजाय मोबाइल नंबर इस्तेमाल करें';

  @override
  String get signInWithEmailPassword => 'ईमेल और पासवर्ड से साइन इन करें';

  @override
  String get enterMobileNumber => 'अपना मोबाइल नंबर डालें';

  @override
  String get enterValid10Digit => 'सही 10 अंकों का मोबाइल नंबर डालें';

  @override
  String get sendCodeWhatsApp => 'WhatsApp पर कोड भेजें';

  @override
  String get emailOrMobile => 'ईमेल या मोबाइल नंबर';

  @override
  String get emailOrMobileRequired => 'ईमेल या मोबाइल नंबर ज़रूरी है';

  @override
  String get passwordRequired => 'पासवर्ड ज़रूरी है';

  @override
  String get forgotPassword => 'पासवर्ड भूल गए?';

  @override
  String get signIn => 'साइन इन करें';

  @override
  String get chooseWorkspace => 'अपना वर्कस्पेस चुनें';

  @override
  String get chooseWorkspaceSubtitle =>
      'जिस संस्था और वर्कस्पेस में जाना है, उसे चुनें';

  @override
  String get roleOwnerTitle => 'Repsi Fitness — मालिक';

  @override
  String get roleOwnerDesc =>
      'बिज़नेस कंट्रोल सेंटर: आमदनी, सदस्य, उपस्थिति और संचालन';

  @override
  String get roleTrainerTitle => 'Repsi Fitness — ट्रेनर';

  @override
  String get roleTrainerDesc =>
      'कोचिंग वर्कस्पेस: क्लाइंट ट्रेनिंग, वर्कआउट और डाइट बिल्डर, चैट';

  @override
  String get roleTrainerBadge => 'सक्रिय कोच';

  @override
  String get roleMemberTitle => 'Repsi Fitness — सदस्य';

  @override
  String get roleMemberDesc =>
      'पर्सनल फ़िटनेस साथी: स्ट्रीक, वर्कआउट, QR चेक-इन और प्रगति';

  @override
  String get roleMemberBadge => 'गोल्ड सदस्य';

  @override
  String get roleAdminTitle => 'Repsi Platform — एडमिन';

  @override
  String get roleAdminDesc => 'आंतरिक प्रशासन: जिम, खाते और सिस्टम मेट्रिक्स';

  @override
  String get roleAdminBadge => 'सुपर एडमिन';

  @override
  String get signOutFailed => 'साइन आउट नहीं हो सका। कृपया फिर कोशिश करें।';

  @override
  String get signOutTitle => 'साइन आउट करें?';

  @override
  String get signOutConfirmOwner =>
      'क्या आप अपने REPSI मालिक खाते से साइन आउट करना चाहते हैं?';

  @override
  String get signingOut => 'साइन आउट हो रहा है…';

  @override
  String get createAccountTitle => 'अपना खाता बनाएं';

  @override
  String get joinGymTitle => 'अपने जिम से जुड़ें';

  @override
  String get signupStep1 => 'चरण 1 / 2: सदस्य प्रोफ़ाइल';

  @override
  String get signupStep2 => 'चरण 2 / 2: अपने जिम से जुड़ें';

  @override
  String get nameHintExample => 'Priya Sharma';

  @override
  String get fullNameRequired => 'पूरा नाम ज़रूरी है';

  @override
  String get emailRequired => 'ईमेल ज़रूरी है';

  @override
  String get continueToGym => 'जिम पर आगे बढ़ें';

  @override
  String get gymCode => 'जिम लिंक नाम';

  @override
  String get gymCodeRequired => 'जिम लिंक नाम ज़रूरी है';

  @override
  String get phoneOptional => 'फ़ोन नंबर (वैकल्पिक)';

  @override
  String get cityOptional => 'शहर (वैकल्पिक)';

  @override
  String get cityHint => 'चेन्नई, कोच्चि, दिल्ली…';

  @override
  String get createMemberAccount => 'सदस्य खाता बनाएं';

  @override
  String get verifyEmailTitle => 'अपना ईमेल सत्यापित करें';

  @override
  String get continueToSetup => 'सेटअप जारी रखें';

  @override
  String get resendEmail => 'ईमेल दोबारा भेजें';

  @override
  String get verificationEmailResent => 'सत्यापन ईमेल दोबारा भेज दिया गया!';

  @override
  String get codeVerifyFailed =>
      'कोड सत्यापित नहीं हो सका। कृपया फिर कोशिश करें।';

  @override
  String get newCodeSent => 'नया कोड WhatsApp पर भेजा जा रहा है।';

  @override
  String get verifyNumberTitle => 'अपना नंबर सत्यापित करें';

  @override
  String get changeNumber => 'नंबर बदलें';

  @override
  String get didntGetCode => 'कोड नहीं मिला?';

  @override
  String resendIn(String time) {
    return '$time में दोबारा भेजें';
  }

  @override
  String get commonSending => 'भेजा जा रहा है…';

  @override
  String get resendCode => 'कोड दोबारा भेजें';

  @override
  String get otpTestServerNotice =>
      'टेस्ट सर्वर: WhatsApp कनेक्ट नहीं है, इसलिए सर्वर का टेस्ट कोड इस्तेमाल करें।';

  @override
  String get verify => 'सत्यापित करें';

  @override
  String get photoUpdateFailed =>
      'फ़ोटो अपडेट नहीं हो सकी। कृपया फिर कोशिश करें।';

  @override
  String get photoUpdated => 'प्रोफ़ाइल फ़ोटो अपडेट हो गई';

  @override
  String get photoRemoved => 'प्रोफ़ाइल फ़ोटो हटा दी गई';

  @override
  String get splashSlow =>
      'सामान्य से ज़्यादा समय लग रहा है · जारी रखने के लिए टैप करें';

  @override
  String dashExpiringSoon(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: 'अगले 7 दिनों में $count मेंबरशिप खत्म हो रही हैं',
      one: 'अगले 7 दिनों में 1 मेंबरशिप खत्म हो रही है',
    );
    return '$_temp0';
  }

  @override
  String dashPeakHour(String hour) {
    return 'सबसे व्यस्त $hour';
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
    return 'सूचनाएं, $count अनपढ़ी';
  }

  @override
  String dashTrialDaysLeft(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other:
          'आपके फ़्री ट्रायल में $count दिन बाकी हैं। repsi.app पर कभी भी प्लान चुनें।',
      one:
          'आपके फ़्री ट्रायल में 1 दिन बाकी है। repsi.app पर कभी भी प्लान चुनें।',
    );
    return '$_temp0';
  }

  @override
  String dashRevenueSemantics(String amount, String percent) {
    return 'इस महीने की आमदनी $amount, पिछले महीने से $percent प्रतिशत ज़्यादा';
  }

  @override
  String dashRevenueSemanticsDown(String amount, String percent) {
    return 'इस महीने की आमदनी $amount, पिछले महीने से $percent प्रतिशत कम';
  }

  @override
  String dashVsLastMonth(String percent) {
    return 'पिछले महीने की तुलना में $percent%';
  }

  @override
  String dashCheckinsChartSemantics(int days, String values) {
    return 'पिछले $days दिनों के चेक-इन: $values';
  }

  @override
  String dashCheckinsCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count चेक-इन',
      one: '1 चेक-इन',
    );
    return '$_temp0';
  }

  @override
  String dashCheckedInCount(int count) {
    return '$count अंदर';
  }

  @override
  String dashInSince(String time) {
    return '$time से अंदर';
  }

  @override
  String dashSeeAll(int count) {
    return 'सभी $count देखें';
  }

  @override
  String searchNoResults(String query) {
    return '\"$query\" के लिए कोई नतीजा नहीं';
  }

  @override
  String searchMembersHeader(int count) {
    return 'सदस्य ($count)';
  }

  @override
  String searchTrainersHeader(int count) {
    return 'ट्रेनर ($count)';
  }

  @override
  String searchFeaturesHeader(int count) {
    return 'फ़ीचर और शॉर्टकट ($count)';
  }

  @override
  String financeMembersCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count सदस्य',
      one: '1 सदस्य',
    );
    return '$_temp0';
  }

  @override
  String financeDaysOverdue(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count दिन की देरी',
      one: '1 दिन की देरी',
    );
    return '$_temp0';
  }

  @override
  String financeMoreOnWeb(int count) {
    return '+ $count और। पूरी रिपोर्ट repsi.app पर';
  }

  @override
  String memberCopied(String value) {
    return '$value कॉपी हो गया';
  }

  @override
  String memberLastVisit(String when) {
    return 'आख़िरी विज़िट $when';
  }

  @override
  String memberPaidAcross(String amount, int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count भुगतानों में $amount चुकाए',
      one: '1 भुगतान में $amount चुकाए',
    );
    return '$_temp0';
  }

  @override
  String memberInSince(String time) {
    return '$time से अंदर';
  }

  @override
  String memberHistoryUntil(String label, String date) {
    return '$label · $date तक';
  }

  @override
  String memberRenewedOn(String name, String plan) {
    return '$name की मेंबरशिप $plan पर रिन्यू हो गई। पैसा मिलने पर भुगतान दर्ज करें।';
  }

  @override
  String memberRenewFor(String amount) {
    return '$amount में रिन्यू करें';
  }

  @override
  String memberPaymentRecorded(String amount, String name) {
    return '$name के लिए $amount दर्ज किया गया';
  }

  @override
  String memberEnded(String when) {
    return '$when को खत्म हुई';
  }

  @override
  String memberEnds(String when) {
    return '$when को खत्म होगी';
  }

  @override
  String timeMinutesAgo(int count) {
    return '$count मि. पहले';
  }

  @override
  String timeHoursAgo(int count) {
    return '$count घं. पहले';
  }

  @override
  String timeDaysAgo(int count) {
    return '$count दिन पहले';
  }

  @override
  String opsCheckedOut(String name) {
    return '$name ने चेक-आउट किया';
  }

  @override
  String opsCheckedIn(String name) {
    return '$name ने चेक-इन किया';
  }

  @override
  String opsInAt(String time, String duration) {
    return '$time पर अंदर · $duration';
  }

  @override
  String opsFollowUp(String date) {
    return '$date को फ़ॉलो-अप';
  }

  @override
  String opsLeadAdded(String name) {
    return '$name लीड्स में जोड़ा गया';
  }

  @override
  String opsQrRotates(String when) {
    return '$when को बदलेगा';
  }

  @override
  String opsTeamHeader(int count) {
    return 'स्टाफ़ और ट्रेनर ($count)';
  }

  @override
  String opsYou(String name) {
    return '$name (आप)';
  }

  @override
  String workspaceGreeting(String name) {
    return 'सुप्रभात, $name';
  }

  @override
  String workspaceSlug(String slug) {
    return 'लिंक: $slug';
  }

  @override
  String get yourGym => 'आपका जिम';

  @override
  String get errorLoadDashboardTitle => 'आपका डैशबोर्ड लोड नहीं हो सका';

  @override
  String get needsAttention => 'ध्यान दें';

  @override
  String get remindToRenew =>
      'एक्सेस खत्म होने से पहले रिन्यू करने की याद दिलाएं';

  @override
  String get checkIns => 'चेक-इन';

  @override
  String get greetingMorning => 'सुप्रभात';

  @override
  String get greetingAfternoon => 'नमस्कार';

  @override
  String get greetingEvening => 'शुभ संध्या';

  @override
  String get accountAndSettings => 'खाता और सेटिंग्स';

  @override
  String get trialEnded =>
      'आपका फ़्री ट्रायल खत्म हो गया है। REPSI इस्तेमाल करते रहने के लिए repsi.app पर प्लान चुनें।';

  @override
  String get revenueThisMonth => 'इस महीने की आमदनी';

  @override
  String get checkInsToday => 'आज के चेक-इन';

  @override
  String get activeMembers => 'सक्रिय सदस्य';

  @override
  String get renewalsDue => 'रिन्यूअल बाकी';

  @override
  String get addMember => 'सदस्य जोड़ें';

  @override
  String get noCheckinsThisWeek => 'इस हफ़्ते अभी तक कोई चेक-इन दर्ज नहीं हुआ।';

  @override
  String get errorLoadCheckedIn => 'कौन अंदर है, यह लोड नहीं हो सका।';

  @override
  String get memberships => 'मेंबरशिप';

  @override
  String get reports => 'रिपोर्ट';

  @override
  String get searchAttendanceDesc =>
      'सदस्यों का चेक-इन/चेक-आउट करें, देखें कौन अंदर है';

  @override
  String get searchMembersDesc => 'प्रोफ़ाइल, मेंबरशिप और रिन्यूअल';

  @override
  String get leads => 'लीड्स';

  @override
  String get searchLeadsDesc => 'पूछताछ, ट्रायल और फ़ॉलो-अप';

  @override
  String get searchFinanceDesc => 'वसूली, बकाया और खर्च';

  @override
  String get businessInsights => 'बिज़नेस इनसाइट्स';

  @override
  String get searchInsightsDesc => 'क्या बदला और आगे क्या करें';

  @override
  String get insights => 'इनसाइट्स';

  @override
  String get searchNotificationsDesc => 'अलर्ट और घोषणाएं';

  @override
  String get account => 'खाता';

  @override
  String get searchSettingsDesc => 'प्रोफ़ाइल, ब्रांच, प्लान और दिखावट';

  @override
  String get searchFailed =>
      'सदस्य और ट्रेनर नहीं खोजे जा सके। अपना कनेक्शन जांचें।';

  @override
  String get searchHint => 'सदस्य, ट्रेनर, फ़ीचर खोजें…';

  @override
  String get recent => 'हाल के';

  @override
  String get quickAccess => 'क्विक एक्सेस';

  @override
  String get searchUnavailable => 'खोज उपलब्ध नहीं है';

  @override
  String get searchEmptyHint =>
      'सदस्य का नाम, फ़ोन नंबर, सदस्य कोड या उपस्थिति जैसी स्क्रीन खोजें।';

  @override
  String get memberIdLabel => 'सदस्य आईडी:';

  @override
  String get coach => 'कोच';

  @override
  String get specStrength => 'स्ट्रेंथ और कंडीशनिंग';

  @override
  String get errorLoadFinance => 'वित्त विवरण लोड नहीं हो सका';

  @override
  String get collectedThisMonth => 'इस महीने वसूला गया';

  @override
  String get expenses => 'खर्च';

  @override
  String get net => 'शुद्ध';

  @override
  String get duesToCollect => 'वसूलने वाला बकाया';

  @override
  String get collections => 'वसूली';

  @override
  String get last6Months => 'पिछले 6 महीने';

  @override
  String get noCollections => 'पिछले छह महीनों में कोई वसूली दर्ज नहीं हुई।';

  @override
  String get nothingOutstanding =>
      'कुछ बकाया नहीं। हर इनवॉइस का भुगतान हो चुका है।';

  @override
  String get dueNow => 'अभी देय';

  @override
  String get recentExpenses => 'हाल के खर्च';

  @override
  String get noExpenses => 'अभी तक कोई खर्च दर्ज नहीं हुआ।';

  @override
  String get historyJoined => 'जुड़े';

  @override
  String get historyStarted => 'मेंबरशिप शुरू हुई';

  @override
  String get historyRenewed => 'मेंबरशिप रिन्यू हुई';

  @override
  String get historyExpired => 'मेंबरशिप खत्म हुई';

  @override
  String get historyFrozen => 'मेंबरशिप फ़्रीज़ हुई';

  @override
  String get historyResumed => 'मेंबरशिप फिर शुरू हुई';

  @override
  String get historyFreezeCancelled => 'फ़्रीज़ रद्द हुआ';

  @override
  String get historyExtended => 'मेंबरशिप बढ़ाई गई';

  @override
  String get historyCancelled => 'मेंबरशिप रद्द हुई';

  @override
  String get historyStatusChanged => 'खाते की स्थिति बदली';

  @override
  String get historyNoteAdded => 'नोट जोड़ा गया';

  @override
  String get historyNoteEdited => 'नोट बदला गया';

  @override
  String get historyNoteDeleted => 'नोट हटाया गया';

  @override
  String get historyProfileUpdated => 'प्रोफ़ाइल अपडेट हुई';

  @override
  String get plan => 'प्लान';

  @override
  String get memberAdded => 'सदस्य जोड़ा गया';

  @override
  String get memberAddFailed =>
      'सदस्य नहीं जोड़ा जा सका। कृपया फिर कोशिश करें।';

  @override
  String get addNewMember => 'नया सदस्य जोड़ें';

  @override
  String get fullNameRequiredLabel => 'पूरा नाम *';

  @override
  String get nameRequired => 'नाम ज़रूरी है';

  @override
  String get emailRequiredLabel => 'ईमेल पता *';

  @override
  String get phoneNumber => 'फ़ोन नंबर';

  @override
  String get emergencyContactPhone => 'आपातकालीन संपर्क नंबर';

  @override
  String get membershipPlan => 'मेंबरशिप प्लान';

  @override
  String get saveMember => 'सदस्य सेव करें';

  @override
  String get errorLoadMember => 'यह सदस्य लोड नहीं हो सका';

  @override
  String get renew => 'रिन्यू करें';

  @override
  String get overview => 'सारांश';

  @override
  String get visits => 'विज़िट';

  @override
  String get history => 'इतिहास';

  @override
  String get errorLoadThis => 'यह हिस्सा लोड नहीं हो सका';

  @override
  String get noPlan => 'कोई प्लान नहीं';

  @override
  String get ended => 'खत्म हुई';

  @override
  String get ends => 'खत्म होगी';

  @override
  String get memberSince => 'सदस्य कब से';

  @override
  String get gender => 'लिंग';

  @override
  String get emergencyContact => 'आपातकालीन संपर्क';

  @override
  String get errorLoadVisits => 'विज़िट लोड नहीं हो सकीं।';

  @override
  String get noVisitsYet => 'अभी तक कोई विज़िट नहीं';

  @override
  String get notes => 'नोट्स';

  @override
  String get errorLoadNotes => 'नोट्स लोड नहीं हो सके।';

  @override
  String get noNotes =>
      'अभी कोई नोट नहीं। फ्रंट डेस्क को जो पता होना चाहिए, वह जोड़ें।';

  @override
  String get noPaymentsForMember =>
      'इस सदस्य का अभी तक कोई भुगतान दर्ज नहीं हुआ।';

  @override
  String get noVisitsRecorded => 'अभी तक कोई विज़िट दर्ज नहीं हुई।';

  @override
  String get noHistory => 'अभी कोई इतिहास नहीं।';

  @override
  String get system => 'सिस्टम';

  @override
  String get renewMembership => 'मेंबरशिप रिन्यू करें';

  @override
  String get recordPayment => 'भुगतान दर्ज करें';

  @override
  String get amountRupees => 'राशि (₹)';

  @override
  String get enterAmountReceived => 'मिली हुई राशि डालें';

  @override
  String get noteOptional => 'नोट (वैकल्पिक)';

  @override
  String get paymentNoteHint => 'जैसे तिमाही रिन्यूअल, UPI रेफ़';

  @override
  String get savePayment => 'भुगतान सेव करें';

  @override
  String get addNote => 'नोट जोड़ें';

  @override
  String get noteHint => 'स्टाफ़ को क्या पता होना चाहिए?';

  @override
  String get saveNote => 'नोट सेव करें';

  @override
  String get endingSoon => 'जल्द खत्म';

  @override
  String get searchMembersHint => 'नाम, फ़ोन या ईमेल खोजें';

  @override
  String get noMembersMatch => 'कोई सदस्य मेल नहीं खाता';

  @override
  String get noMembersYet => 'अभी कोई सदस्य नहीं';

  @override
  String get tryAnotherSearch => 'कोई दूसरा नाम, फ़ोन नंबर या फ़िल्टर आज़माएं।';

  @override
  String get addFirstMember =>
      'मेंबरशिप और विज़िट ट्रैक करने के लिए अपना पहला सदस्य जोड़ें।';

  @override
  String get branches => 'ब्रांच';

  @override
  String get membershipPlans => 'मेंबरशिप प्लान';

  @override
  String get addTrainer => 'ट्रेनर जोड़ें';

  @override
  String get addTrainerDesc => 'जिम कोच या पर्सनल ट्रेनर जोड़ें';

  @override
  String get app => 'ऐप';

  @override
  String get darkMode => 'डार्क मोड';

  @override
  String get onTheWeb => 'वेब पर';

  @override
  String get onTheWebTitle => 'बिलिंग, स्टाफ़ रोल, रिपोर्ट और वेबसाइट';

  @override
  String get manageOnWeb => 'इन्हें repsi.app पर मैनेज करें';

  @override
  String get errorLoadBranches => 'ब्रांच लोड नहीं हो सकीं।';

  @override
  String get branch => 'ब्रांच';

  @override
  String get mainBranch => 'मुख्य';

  @override
  String get editBranchesOnWeb => 'ब्रांच repsi.app पर जोड़ें या बदलें।';

  @override
  String get errorLoadPlans => 'प्लान लोड नहीं हो सके।';

  @override
  String get noPlansYet => 'अभी कोई प्लान नहीं। repsi.app पर प्लान बनाएं।';

  @override
  String get markAllRead => 'सभी को पढ़ा हुआ मार्क करें';

  @override
  String get unread => 'अनपढ़ी';

  @override
  String get billing => 'बिलिंग';

  @override
  String get announcements => 'घोषणाएं';

  @override
  String get notificationsUnavailable => 'सूचनाएं उपलब्ध नहीं हैं';

  @override
  String get noNotifications => 'कोई सूचना नहीं';

  @override
  String get noNotificationsDesc =>
      'आपने सब देख लिया! जिम मेंबरशिप, क्लास और भुगतान से जुड़ी जानकारी यहां दिखेगी।';

  @override
  String get leadNew => 'नया';

  @override
  String get leadContacted => 'संपर्क हुआ';

  @override
  String get leadVisitBooked => 'विज़िट बुक';

  @override
  String get leadTrial => 'ट्रायल';

  @override
  String get leadNegotiating => 'बातचीत जारी';

  @override
  String get leadLost => 'हाथ से निकला';

  @override
  String get checkInQr => 'चेक-इन QR';

  @override
  String get team => 'टीम';

  @override
  String get errorLoadToday => 'आज के आंकड़े लोड नहीं हो सके।';

  @override
  String get insideNow => 'अभी अंदर';

  @override
  String get avgStay => 'औसत ठहराव';

  @override
  String get checkInMember => 'सदस्य का चेक-इन करें';

  @override
  String get searchNameOrPhone => 'नाम या फ़ोन खोजें';

  @override
  String get typeTwoLetters => 'नाम या फ़ोन नंबर के कम से कम दो अक्षर लिखें।';

  @override
  String get errorLoadLeads => 'लीड्स लोड नहीं हो सकीं';

  @override
  String get noLeadsYet => 'अभी कोई लीड नहीं';

  @override
  String get noLeadsInStage => 'इस चरण में कोई लीड नहीं';

  @override
  String get leadsEmptyDesc => 'वॉक-इन और पूछताछ दर्ज करें ताकि कोई छूट न जाए।';

  @override
  String get addLead => 'लीड जोड़ें';

  @override
  String get newLead => 'नई लीड';

  @override
  String get sourceWalkIn => 'वॉक-इन';

  @override
  String get sourceInstagram => 'Instagram';

  @override
  String get sourceWebsite => 'वेबसाइट';

  @override
  String get sourceReferral => 'रेफ़रल';

  @override
  String get sourceGoogle => 'Google';

  @override
  String get sourcePhoneCall => 'फ़ोन कॉल';

  @override
  String get name => 'नाम';

  @override
  String get enterTheirName => 'उनका नाम डालें';

  @override
  String get interestedIn => 'किसमें रुचि है (वैकल्पिक)';

  @override
  String get interestedInHint => 'जैसे तिमाही प्लान, PT';

  @override
  String get saveLead => 'लीड सेव करें';

  @override
  String get errorLoadQr => 'चेक-इन QR लोड नहीं हो सका';

  @override
  String get qrDesc =>
      'सदस्य REPSI ऐप से इसे स्कैन करके खुद चेक-इन करते हैं। इसे फ्रंट डेस्क पर दिखाएं या प्रिंट करें।';

  @override
  String get qrSemantics => 'जिम चेक-इन QR कोड';

  @override
  String get refresh => 'रीफ़्रेश करें';

  @override
  String get errorLoadTeam => 'आपकी टीम लोड नहीं हो सकी';

  @override
  String get teamDesc =>
      'अपने फ़ोन से ही ट्रेनर जोड़ें और स्टाफ़ रोल मैनेज करें।';

  @override
  String get chooseGym => 'अपना जिम चुनें';

  @override
  String get chooseGymSubtitle =>
      'आज कौन-सा जिम देखना और मैनेज करना है, चुनें।';

  @override
  String get noGymsFound => 'कोई जिम नहीं मिला';

  @override
  String get registerGymOnWeb =>
      'अपना वर्कस्पेस चालू करने के लिए repsi.app पर अपना जिम रजिस्टर करें।';

  @override
  String get gymWorkspace => 'जिम';

  @override
  String get openWorkspace => 'खोलें';

  @override
  String get registerAnotherGym => 'एक और जिम रजिस्टर करना है?';

  @override
  String get createGymOnDesktop =>
      'जिम कंप्यूटर से repsi.app पर बनाए जाते हैं।';

  @override
  String memberExpiredOn(String date) {
    return '$date को खत्म हो गई';
  }

  @override
  String memberValidUntil(String date) {
    return '$date तक मान्य';
  }

  @override
  String memberCheckedInSince(String time) {
    return '$time से चेक-इन';
  }

  @override
  String healthAverageSteps(String steps) {
    return '7 दिन का औसत: $steps कदम';
  }

  @override
  String healthSyncedAt(String time) {
    return '$time पर सिंक हुआ';
  }

  @override
  String healthStepsSummary(String total, String average) {
    return 'कुल $total · रोज़ $average';
  }

  @override
  String paymentRefLine(String ref, String method) {
    return 'रेफ़: $ref · $method';
  }

  @override
  String receiptNumberLine(String number) {
    return 'रसीद नंबर: $number';
  }

  @override
  String receiptDescriptionLine(String text) {
    return 'विवरण: $text';
  }

  @override
  String receiptAmountLine(String amount) {
    return 'चुकाई गई राशि: $amount';
  }

  @override
  String receiptModeLine(String mode) {
    return 'भुगतान का तरीका: $mode';
  }

  @override
  String receiptStatusLine(String status) {
    return 'स्थिति: $status';
  }

  @override
  String qrSince(String time) {
    return '$time से';
  }

  @override
  String qrInAt(String time) {
    return '$time पर अंदर';
  }

  @override
  String chatUnread(int count) {
    return '$count अनपढ़ी';
  }

  @override
  String chatNotSent(String error) {
    return 'नहीं भेजा गया: $error';
  }

  @override
  String get chatRead => 'पढ़ लिया';

  @override
  String workoutLogExercise(String name) {
    return '$name दर्ज करें';
  }

  @override
  String weightKg(String value) {
    return '$value कि.ग्रा.';
  }

  @override
  String exPrimary(String muscle, String category) {
    return 'मुख्य: $muscle ($category)';
  }

  @override
  String exSecondary(String muscle) {
    return 'सहायक: $muscle';
  }

  @override
  String exSetsCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count सेट',
      one: '1 सेट',
    );
    return '$_temp0';
  }

  @override
  String exRepsCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count रेप',
      one: '1 रेप',
    );
    return '$_temp0';
  }

  @override
  String exSetsReps(int sets, int reps) {
    return '$sets सेट · $reps रेप';
  }

  @override
  String exAllCount(int count) {
    return 'सभी ($count)';
  }

  @override
  String exFavsCount(int count) {
    return 'पसंदीदा ($count)';
  }

  @override
  String exSelectedCount(int count) {
    return 'चुनी गई एक्सरसाइज़ ($count)';
  }

  @override
  String exBasketCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count एक्सरसाइज़ चुनी गईं',
      one: '1 एक्सरसाइज़ चुनी गई',
    );
    return '$_temp0';
  }

  @override
  String exWorkoutSaved(String name) {
    return 'वर्कआउट \"$name\" मेरे वर्कआउट में सेव हो गया!';
  }

  @override
  String exCoachNote(String note) {
    return 'कोच का नोट: \"$note\"';
  }

  @override
  String exRestSeconds(int count) {
    return '$count से.';
  }

  @override
  String get myPass => 'मेरा पास';

  @override
  String get aiCoach => 'AI कोच';

  @override
  String get errorLoadMembership => 'आपकी मेंबरशिप लोड नहीं हो सकी।';

  @override
  String get noMembershipYet =>
      'अभी कोई मेंबरशिप नहीं। अपने जिम से इसे सेट करने को कहें।';

  @override
  String get errorLoadYourAttendance => 'आपकी उपस्थिति लोड नहीं हो सकी।';

  @override
  String get checkInWithQr => 'QR से चेक-इन करें';

  @override
  String get healthAndroidOnly =>
      'गतिविधि ट्रैकिंग Health Connect वाले Android फ़ोन पर उपलब्ध है।';

  @override
  String get healthConnectPitch =>
      'Google Fit और दूसरे ऐप से अपने कदम, दूरी और सक्रिय कैलोरी देखने के लिए Health Connect जोड़ें। सिर्फ़ ये तीन कुल आंकड़े पढ़े जाते हैं, और आप इन्हें कभी भी डिस्कनेक्ट करके हटा सकते हैं।';

  @override
  String get healthConnectNeeded =>
      'Google Fit और दूसरे फ़िटनेस ऐप से आपके कदम पढ़ने के लिए Health Connect ज़रूरी है।';

  @override
  String get healthConnect => 'Health Connect जोड़ें';

  @override
  String get healthUpdate => 'Health Connect अपडेट करें';

  @override
  String get healthInstall => 'Health Connect इंस्टॉल करें';

  @override
  String get steps => 'कदम';

  @override
  String get activeKcal => 'सक्रिय kcal';

  @override
  String get syncNow => 'अभी सिंक करें';

  @override
  String get disconnect => 'डिस्कनेक्ट करें';

  @override
  String get todaysActivity => 'आज की गतिविधि';

  @override
  String get healthDisconnectTitle => 'Health Connect डिस्कनेक्ट करें?';

  @override
  String get healthDisconnectBody =>
      'REPSI सिंक करना बंद कर देगा और आपके लिए सेव किए गए गतिविधि आंकड़े हटा देगा।';

  @override
  String get aiWorkoutCoach => 'AI वर्कआउट कोच';

  @override
  String get paymentsAndInvoices => 'भुगतान और इनवॉइस';

  @override
  String get notificationsAndAlerts => 'सूचनाएं और अलर्ट';

  @override
  String get membershipAndPayments => 'मेंबरशिप और भुगतान';

  @override
  String get membershipDetails => 'मेंबरशिप विवरण';

  @override
  String get membershipDetailsUnavailable =>
      'आपका मौजूदा प्लान और रिन्यूअल विकल्प अभी यहां उपलब्ध नहीं हैं। अपनी मेंबरशिप की पुष्टि के लिए जिम से संपर्क करें।';

  @override
  String get paymentHistoryHeader => 'भुगतान इतिहास और रसीदें';

  @override
  String get digitalReceipt => 'भुगतान रसीद';

  @override
  String get scanMemberPass => 'सदस्य पास स्कैन करें';

  @override
  String get scanGymQr => 'जिम QR स्कैन करें';

  @override
  String get toggleFlashlight => 'फ़्लैशलाइट चालू/बंद करें';

  @override
  String get cameraAccessOff => 'कैमरा की अनुमति बंद है';

  @override
  String get cameraUnavailable => 'कैमरा उपलब्ध नहीं है';

  @override
  String get cameraAccessOffDesc =>
      'जिम QR स्कैन करने के लिए फ़ोन सेटिंग्स में REPSI को कैमरा की अनुमति दें, या फ्रंट डेस्क से चेक-इन करवाएं।';

  @override
  String get cameraStartFailed =>
      'कैमरा शुरू नहीं हो सका। फ्रंट डेस्क से चेक-इन करवाएं।';

  @override
  String get notRepsiQr =>
      'यह REPSI जिम का QR कोड नहीं है। अपने जिम के प्रवेश पर लगा कोड स्कैन करें।';

  @override
  String get checkedInGreat => 'चेक-इन हो गया। आपका वर्कआउट शानदार रहे!';

  @override
  String get checkOutTitle => 'चेक-आउट करें?';

  @override
  String get checkOutBody => 'इससे आपकी मौजूदा जिम विज़िट खत्म हो जाएगी।';

  @override
  String get checkedOutBye => 'चेक-आउट हो गया। फिर मिलेंगे!';

  @override
  String get pointCamera =>
      'अपने जिम के प्रवेश पर लगे QR कोड की ओर कैमरा करें।';

  @override
  String get youAreCheckedIn => 'आपका चेक-इन हो गया है';

  @override
  String get youAreNotCheckedIn => 'आपका चेक-इन नहीं हुआ है';

  @override
  String get noVisitsYetDesc =>
      'अभी कोई विज़िट नहीं। आपके चेक-इन यहां दिखेंगे।';

  @override
  String get recentVisits => 'हाल की विज़िट';

  @override
  String get memberPassSemantics => 'आपका REPSI सदस्य पास QR कोड';

  @override
  String get showFrontDesk => 'इसे फ्रंट डेस्क पर दिखाएं';

  @override
  String get passRefreshNote =>
      'यह अपने-आप बदलता है और सिर्फ़ आपके जिम में काम करता है। स्क्रीनशॉट शेयर न करें।';

  @override
  String get scanMemberPassDesc =>
      'चेक-इन या चेक-आउट के लिए सदस्य का पास स्कैन करें।';

  @override
  String get activity => 'गतिविधि';

  @override
  String get errorLoadGymVisits => 'आपकी जिम विज़िट लोड नहीं हो सकीं।';

  @override
  String get gymVisits => 'जिम विज़िट';

  @override
  String get avgVisit => 'औसत विज़िट';

  @override
  String get noVisitsStartStreak =>
      'अभी कोई विज़िट नहीं। स्ट्रीक शुरू करने के लिए जिम में चेक-इन करें।';

  @override
  String get inProgress => 'जारी है';

  @override
  String get healthStepsAndroidOnly =>
      'कदम ट्रैक करने के लिए Health Connect वाला Android फ़ोन चाहिए।';

  @override
  String get healthConnectFromHome =>
      'अपने कदम, दूरी और सक्रिय कैलोरी यहां देखने के लिए होम टैब से Health Connect जोड़ें।';

  @override
  String get stepsThisWeek => 'इस हफ़्ते के कदम';

  @override
  String get stepsChartSemantics => 'पिछले सात दिनों के कदमों का बार चार्ट';

  @override
  String get messages => 'संदेश';

  @override
  String get noConversationsTrainer =>
      'अभी कोई बातचीत नहीं। किसी क्लाइंट को खोलें और संदेश पर टैप करें।';

  @override
  String get noConversationsMember =>
      'ट्रेनर मिलने के बाद आप उन्हें यहां संदेश भेज सकते हैं।';

  @override
  String get noMessagesYet => 'अभी कोई संदेश नहीं';

  @override
  String get sayHello => 'बातचीत शुरू करने के लिए नमस्ते कहें।';

  @override
  String get writeMessage => 'संदेश लिखें…';

  @override
  String get sendMessage => 'संदेश भेजें';

  @override
  String get chatReadOnly =>
      'यह ट्रेनर अब आपको असाइन नहीं है, इसलिए बातचीत सिर्फ़ पढ़ी जा सकती है।';

  @override
  String get targetWeight => 'लक्ष्य वज़न';

  @override
  String get repsPerSet => 'हर सेट में रेप';

  @override
  String get saveSets => 'सेट सेव करें';

  @override
  String get todaysWorkout => 'आज का वर्कआउट';

  @override
  String get workoutProgress => 'वर्कआउट प्रगति';

  @override
  String get targetSixExercises => 'लक्ष्य: 6 एक्सरसाइज़';

  @override
  String get estDuration => 'लगभग 45–50 मिनट';

  @override
  String get logged => 'दर्ज';

  @override
  String get log => 'दर्ज करें';

  @override
  String get completeWorkout => 'वर्कआउट पूरा करें';

  @override
  String get workoutSummary => 'वर्कआउट सारांश';

  @override
  String get workoutComplete => 'वर्कआउट पूरा हुआ!';

  @override
  String get workoutRecorded =>
      'बहुत बढ़िया! Upper Body A आपकी फ़िटनेस प्रोफ़ाइल में सेव हो गया।';

  @override
  String get streakPlusOne => '+1 वर्कआउट स्ट्रीक';

  @override
  String get streakFive => 'कमाल है! लगातार 5 दिन।';

  @override
  String get activeBurn => 'सक्रिय बर्न';

  @override
  String get duration => 'अवधि';

  @override
  String get exercises => 'एक्सरसाइज़';

  @override
  String get totalVolume => 'कुल वॉल्यूम';

  @override
  String get newPersonalRecord => 'नया पर्सनल रिकॉर्ड!';

  @override
  String get howDidItFeel => 'यह वर्कआउट कैसा लगा?';

  @override
  String get saveAndReturn => 'सेव करके वापस जाएं';

  @override
  String get workoutSavedSynced => 'वर्कआउट सेव हो गया।';

  @override
  String get targetMuscles => 'लक्षित मांसपेशियां';

  @override
  String get sets => 'सेट';

  @override
  String get reps => 'रेप';

  @override
  String get rest => 'आराम';

  @override
  String get whyThisExercise => 'यह एक्सरसाइज़ क्यों? (कोच का नोट)';

  @override
  String get howToPerform => 'कैसे करें';

  @override
  String get favourited => 'पसंदीदा में जोड़ा';

  @override
  String get favourite => 'पसंदीदा में जोड़ें';

  @override
  String get inWorkoutPlan => 'वर्कआउट प्लान में है';

  @override
  String get addToWorkout => 'वर्कआउट में जोड़ें';

  @override
  String get workoutBuilder => 'वर्कआउट बिल्डर';

  @override
  String get routineName => 'रूटीन का नाम';

  @override
  String get noExercisesSelected =>
      'कोई एक्सरसाइज़ नहीं चुनी गई।\nकिसी भी एक्सरसाइज़ कार्ड पर \"वर्कआउट में जोड़ें\" टैप करें।';

  @override
  String get saveWorkout => 'वर्कआउट सेव करें';

  @override
  String get exerciseLibrary => 'एक्सरसाइज़ लाइब्रेरी';

  @override
  String get searchExercises => 'एक्सरसाइज़ खोजें (जैसे chest dumbbell)';

  @override
  String get trainerCues => 'ट्रेनर के टिप्स';

  @override
  String get noExercisesMatch => 'आपके फ़िल्टर से कोई एक्सरसाइज़ मेल नहीं खाती';

  @override
  String get resetFilters => 'फ़िल्टर रीसेट करें';

  @override
  String get demo => 'डेमो';

  @override
  String get added => 'जोड़ा गया';

  @override
  String get readyToBuild => 'आपका रूटीन बनाने के लिए तैयार';

  @override
  String get buildWorkout => 'वर्कआउट बनाएं';

  @override
  String trainerDietTitle(String name) {
    return '$name · डाइट';
  }

  @override
  String dietEatenToday(String calories, String protein) {
    return 'आज खाया: $calories kcal · $protein ग्रा. प्रोटीन';
  }

  @override
  String dietOfTarget(String target) {
    return '$target kcal में से';
  }

  @override
  String dietWater(String amount) {
    return 'पानी: $amount मि.ली.';
  }

  @override
  String dietWaterOfTarget(String amount, String target) {
    return 'पानी: $amount / $target मि.ली.';
  }

  @override
  String dietAdherence(
      String followed, String modified, String skipped, String notLogged) {
    return 'पालन किया $followed · बदला $modified · छोड़ा $skipped · दर्ज नहीं $notLogged';
  }

  @override
  String get mealBreakfast => 'नाश्ता';

  @override
  String get mealMorningSnack => 'सुबह का नाश्ता';

  @override
  String get mealLunch => 'दोपहर का खाना';

  @override
  String get mealEveningSnack => 'शाम का नाश्ता';

  @override
  String get mealDinner => 'रात का खाना';

  @override
  String get mealPreWorkout => 'वर्कआउट से पहले';

  @override
  String get mealPostWorkout => 'वर्कआउट के बाद';

  @override
  String trainerSessionStarted(String name) {
    return '$name के साथ सेशन शुरू हुआ';
  }

  @override
  String trainerSessionStarting(String name) {
    return '$name के साथ सेशन शुरू हो रहा है';
  }

  @override
  String trainerWeightAttendance(String weight, String attendance) {
    return 'वज़न: $weight · उपस्थिति: $attendance';
  }

  @override
  String trainerAddedExercise(String name) {
    return '$name वर्कआउट में जोड़ा गया';
  }

  @override
  String trainerAssignTo(String name) {
    return '\"$name\" इन्हें असाइन करें:';
  }

  @override
  String trainerAssigned(String workout, String name) {
    return '$workout $name को असाइन किया गया';
  }

  @override
  String trainerExercisesCount(int count) {
    return 'एक्सरसाइज़ ($count)';
  }

  @override
  String trainerSetsRepsWeight(String sets, String reps, String weight) {
    return '$sets सेट × $reps रेप · $weight';
  }

  @override
  String trainerRest(String value) {
    return 'आराम: $value';
  }

  @override
  String trainerTempo(String value) {
    return 'टेम्पो: $value';
  }

  @override
  String adminOwnerPlan(String owner, String plan) {
    return 'मालिक: $owner · $plan';
  }

  @override
  String comingSoon(String feature) {
    return '$feature जल्द आ रहा है';
  }

  @override
  String onboardingStep(int current, int total) {
    return 'चरण $current / $total';
  }

  @override
  String get onboarding1Lead => 'मैनेज करें। ट्रेन करें।';

  @override
  String get onboarding1Accent => 'आगे बढ़ें।';

  @override
  String get onboarding1Body =>
      'आपके जिम के लिए एक ऐप: चेक-इन, मेंबरशिप, भुगतान और ट्रेनिंग — मालिकों, ट्रेनरों और सदस्यों के लिए।';

  @override
  String get onboarding2Lead => 'मैनेज करें';

  @override
  String get onboarding2Accent => 'सदस्यों को';

  @override
  String get onboarding2Tail => 'आसानी से';

  @override
  String get onboarding2Body =>
      'हर सदस्य की मेंबरशिप, उपस्थिति और बकाया — खत्म होने से पहले ही चेतावनी।';

  @override
  String get onboarding3Lead => 'ज़रूरी';

  @override
  String get onboarding3Accent => 'इनसाइट्स';

  @override
  String get onboarding3Body =>
      'चेक-इन, रिन्यूअल और आमदनी एक नज़र में, ताकि सदस्यों के छोड़ने से पहले कदम उठा सकें।';

  @override
  String get trainerAdded => 'ट्रेनर जोड़ा गया';

  @override
  String get trainerAddFailed => 'ट्रेनर नहीं जोड़ा जा सका। विवरण जांचें।';

  @override
  String get addNewTrainer => 'नया ट्रेनर जोड़ें';

  @override
  String get trainerNameHint => 'जैसे Arun Kumar';

  @override
  String get trainerNameRequired => 'ट्रेनर का नाम ज़रूरी है';

  @override
  String get mobileRequiredLabel => 'मोबाइल नंबर *';

  @override
  String get mobileRequired => 'मोबाइल नंबर ज़रूरी है';

  @override
  String get emailOptional => 'ईमेल पता (वैकल्पिक)';

  @override
  String get specialization => 'विशेषज्ञता';

  @override
  String get hourlyRateOptional => 'घंटे का रेट (₹) (वैकल्पिक)';

  @override
  String get bioOptional => 'परिचय / अनुभव (वैकल्पिक)';

  @override
  String get bioHint => 'जैसे 5+ साल के अनुभव वाले सर्टिफ़ाइड ट्रेनर…';

  @override
  String get saveTrainer => 'ट्रेनर सेव करें';

  @override
  String get openFromMyClients =>
      'संदेश भेजने या डाइट देखने के लिए इस क्लाइंट को मेरे क्लाइंट से खोलें।';

  @override
  String get message => 'संदेश';

  @override
  String get dietPlan => 'डाइट प्लान';

  @override
  String get errorLoadAdherence => 'डाइट पालन की जानकारी लोड नहीं हो सकी।';

  @override
  String get noDietPlan => 'कोई डाइट प्लान असाइन नहीं है।';

  @override
  String get dietAdherenceTitle => 'डाइट पालन · पिछले 7 दिन';

  @override
  String get myClients => 'मेरे क्लाइंट';

  @override
  String get searchClients => 'क्लाइंट खोजें';

  @override
  String get activeMembershipsOnly => 'सिर्फ़ सक्रिय मेंबरशिप';

  @override
  String get noClientsAssigned => 'अभी आपको कोई सदस्य असाइन नहीं है।';

  @override
  String get noClientsMatch => 'आपकी खोज से कोई क्लाइंट मेल नहीं खाता।';

  @override
  String get noDietPlanMember =>
      'आपके ट्रेनर ने अभी तक कोई डाइट प्लान असाइन नहीं किया है।';

  @override
  String get noDietPlanTrainer =>
      'कोई डाइट प्लान असाइन नहीं है। वेब डैशबोर्ड से असाइन करें।';

  @override
  String get addWater => '+250 मि.ली.';

  @override
  String get coachingWorkspace => 'कोचिंग वर्कस्पेस';

  @override
  String get todaysClients => 'आज के क्लाइंट';

  @override
  String get pendingPlans => 'बाकी प्लान';

  @override
  String get clientChat => 'क्लाइंट चैट';

  @override
  String get todaysSessions => 'आज के सेशन';

  @override
  String get fullSchedule => 'पूरा शेड्यूल →';

  @override
  String get nextUp => 'अगला';

  @override
  String get startSession => 'सेशन शुरू करें';

  @override
  String get myProfile => 'मेरी प्रोफ़ाइल';

  @override
  String get mySchedule => 'मेरा शेड्यूल';

  @override
  String get workoutTemplates => 'वर्कआउट टेम्पलेट';

  @override
  String get dietTemplates => 'डाइट टेम्पलेट';

  @override
  String get start => 'शुरू करें';

  @override
  String get upcoming => 'आने वाला';

  @override
  String get assignToClient => 'क्लाइंट को असाइन करें';

  @override
  String get assignNow => 'असाइन करें';

  @override
  String get programTitle => 'प्रोग्राम का नाम';

  @override
  String get addExercise => 'एक्सरसाइज़ जोड़ें';

  @override
  String get saveAsTemplate => 'जिम टेम्पलेट के रूप में सेव करें';

  @override
  String get notOnPlan => 'आपके प्लान में नहीं है';

  @override
  String get errorLoadInsights => 'इनसाइट्स लोड नहीं हो सकीं';

  @override
  String get insightsUpgrade =>
      'बिज़नेस इनसाइट्स ऊंचे REPSI प्लान में मिलती हैं। इन्हें चालू करने के लिए repsi.app पर अपग्रेड करें।';

  @override
  String get summaryByAi => 'AI का सारांश';

  @override
  String get summary => 'सारांश';

  @override
  String get whatStandsOut => 'खास बातें';

  @override
  String get suggestedNextSteps => 'सुझाए गए अगले कदम';

  @override
  String get goalMuscleGain => 'मसल गेन';

  @override
  String get goalFatLoss => 'फ़ैट लॉस और टोन';

  @override
  String get goalStrength => 'ताकत';

  @override
  String get goalEndurance => 'सहनशक्ति और स्टैमिना';

  @override
  String get goalWellness => 'सामान्य फ़िटनेस';

  @override
  String get expBeginner => 'शुरुआती (< 1 साल)';

  @override
  String get expIntermediate => 'मध्यम (1–3 साल)';

  @override
  String get expAdvanced => 'एडवांस्ड (3+ साल)';

  @override
  String get equipFullGym => 'पूरा जिम';

  @override
  String get equipDumbbells => 'डंबल और बेंच';

  @override
  String get equipBodyweight => 'घर पर बॉडीवेट';

  @override
  String get safetyGuidelines => 'सुरक्षा दिशानिर्देश';

  @override
  String get aiPowered => 'AI से संचालित';

  @override
  String get tailoredRoutine => 'आपका पर्सनल रूटीन';

  @override
  String get aiCoachIntro =>
      'अपने उपकरण और लक्ष्य के हिसाब से प्लान बनाने के लिए कुछ सवालों के जवाब दें।';

  @override
  String get aiQ1 => '1. आपका मुख्य फ़िटनेस लक्ष्य क्या है?';

  @override
  String get aiQ2 => '2. ट्रेनिंग का अनुभव';

  @override
  String get aiQ3 => '3. हफ़्ते में ट्रेनिंग के दिन';

  @override
  String get aiQ4 => '4. उपलब्ध उपकरण';

  @override
  String get generateRoutine => 'मेरा प्लान बनाएं';

  @override
  String get personalizeAi => 'पर्सनलाइज़ करें';

  @override
  String get noPlanForCriteria =>
      'इन विकल्पों के लिए कोई प्लान उपलब्ध नहीं है।';

  @override
  String get aiTailored => 'AI द्वारा बनाया गया';

  @override
  String get verifiedSplit => 'कोच द्वारा जांचा गया प्लान';

  @override
  String get startThisWorkout => 'यह वर्कआउट शुरू करें';

  @override
  String get coachTips => 'कोच के टिप्स';

  @override
  String get safetyDisclaimerTitle => 'सुरक्षा और मेडिकल अस्वीकरण';

  @override
  String get safetyDisclaimerBody =>
      'REPSI AI वर्कआउट कोच स्पोर्ट्स साइंस और ऑटोमेटेड जनरेशन के आधार पर सामान्य एक्सरसाइज़ सुझाव देता है। यह व्यक्तिगत मेडिकल सलाह या फ़िटनेस परामर्श की जगह नहीं लेता। चक्कर, तेज़ दर्द या सांस फूलने पर तुरंत एक्सरसाइज़ रोक दें।';

  @override
  String get understood => 'समझ गया';

  @override
  String get aiPlanUpperLowerTitle => '4 दिन का अपर / लोअर रूटीन';

  @override
  String get aiPlanUpperLowerBody =>
      'धीरे-धीरे वज़न बढ़ाने वाला संतुलित मसल-बिल्डिंग रूटीन, जिसमें जोड़ों को आराम का पूरा समय मिलता है।';

  @override
  String get aiPlanFatLossTitle => 'मेटाबॉलिक कंडीशनिंग स्प्लिट';

  @override
  String get aiPlanFatLossBody =>
      'कम आराम के साथ कंपाउंड लिफ़्ट, ताकि मसल बनी रहे और ज़्यादा कैलोरी बर्न हो।';

  @override
  String get aiPlanStrengthTitle => 'कंपाउंड स्ट्रेंथ फ़ाउंडेशन';

  @override
  String get aiPlanStrengthBody =>
      'ज़्यादा से ज़्यादा ताकत के लिए RPE 8–9 पर मल्टी-जॉइंट बारबेल लिफ़्ट।';

  @override
  String get aiDay1 => 'दिन 1: अपर बॉडी पावर';

  @override
  String get aiCueBench => 'एड़ियों से ज़ोर लगाएं और हल्का आर्च बनाए रखें';

  @override
  String get aiCueRow => 'रीढ़ सीधी रखें और छाती की हड्डी तक खींचें';

  @override
  String get aiDay2 => 'दिन 2: लोअर बॉडी मसल बिल्डिंग';

  @override
  String get aiCueSquat => 'घुटनों और कूल्हों को एक साथ मोड़ें';

  @override
  String get aiCueRdl =>
      'घुटने हल्के मोड़कर कूल्हे पीछे ले जाएं और हैमस्ट्रिंग में खिंचाव महसूस करें';

  @override
  String get aiDay3 => 'दिन 3: अपर बॉडी और बाजू';

  @override
  String get aiDay4 => 'दिन 4: लोअर बॉडी और कोर';

  @override
  String get aiTipHydrate => 'ट्रेनिंग से पहले कम से कम 500 मि.ली. पानी पिएं।';

  @override
  String get aiTipWarmup =>
      '5–10 मिनट मोबिलिटी और हर कंपाउंड लिफ़्ट से पहले 2 हल्के सेट से वार्म-अप करें।';

  @override
  String get aiTipProgress =>
      'हर 1–2 हफ़्ते में मुख्य लिफ़्ट में वज़न या रेप बढ़ाने की कोशिश करें।';

  @override
  String get aiPersonalisedNotice => 'REPSI AI द्वारा पर्सनलाइज़ किया गया';

  @override
  String get aiDisclaimer =>
      'कोई नया एक्सरसाइज़ रूटीन शुरू करने से पहले हमेशा डॉक्टर से सलाह लें। अपने शरीर की सुनें और असामान्य तकलीफ़ हो तो रुक जाएं।';

  @override
  String get aiWorkoutDay => 'वर्कआउट दिन';

  @override
  String get aiPersonalPlan => 'पर्सनल वर्कआउट प्लान';

  @override
  String get aiDisclaimerShort =>
      'एक्सरसाइज़ प्रोग्राम शुरू करने से पहले हमेशा डॉक्टर से सलाह लें।';

  @override
  String get platformAnalytics => 'प्लेटफ़ॉर्म एनालिटिक्स';

  @override
  String get platformMrrGrowth => 'प्लेटफ़ॉर्म MRR ग्रोथ';

  @override
  String get platformHealth => 'प्लेटफ़ॉर्म की सेहत';

  @override
  String get apiResponseTime => 'API रिस्पॉन्स टाइम (P95)';

  @override
  String get activeGymLicences => 'सक्रिय जिम लाइसेंस';

  @override
  String get totalCheckinsToday => 'कुल चेक-इन (आज)';

  @override
  String get systemAdmin => 'सिस्टम एडमिन';

  @override
  String get platformMetrics => 'पूरे प्लेटफ़ॉर्म के आंकड़े';

  @override
  String get totalGyms => 'कुल जिम';

  @override
  String get plusThreeThisMonth => 'इस महीने +3';

  @override
  String get activeUsers => 'सक्रिय उपयोगकर्ता';

  @override
  String get payingMembers => 'भुगतान करने वाले सदस्य';

  @override
  String get acrossAllGyms => 'सभी जिम में';

  @override
  String get platformRevenue => 'प्लेटफ़ॉर्म आमदनी';

  @override
  String get mrrThisMonth => 'इस महीने का MRR';

  @override
  String get subscriptions => 'सब्सक्रिप्शन';

  @override
  String get allServicesOk => 'सभी सेवाएं चल रही हैं';

  @override
  String get searchGymsHint => 'नाम या मालिक से जिम खोजें…';

  @override
  String get systemSettings => 'सिस्टम सेटिंग्स';

  @override
  String get securityCompliance => 'सुरक्षा और अनुपालन';

  @override
  String get apiWebhooks => 'API और वेबहुक';

  @override
  String get systemAlerts => 'सिस्टम अलर्ट';

  @override
  String get platformSupport => 'प्लेटफ़ॉर्म सपोर्ट';

  @override
  String get systemAdminSettings => 'एडमिन सेटिंग्स';

  @override
  String get superAdministrator => 'सुपर एडमिनिस्ट्रेटर';

  @override
  String get searchUsersHint => 'सभी जिम में उपयोगकर्ता खोजें…';

  @override
  String get skip => 'छोड़ें';

  @override
  String get getStarted => 'शुरू करें';

  @override
  String get next => 'आगे';

  @override
  String get gymPass => 'जिम पास';

  @override
  String get checkedIn => 'चेक-इन हुआ';

  @override
  String get dashboard => 'डैशबोर्ड';

  @override
  String get revenue => 'आमदनी';

  @override
  String get dailyCheckins => 'रोज़ के चेक-इन';

  @override
  String get mealSnack => 'नाश्ता';

  @override
  String get mealStatusEaten => 'खाया';

  @override
  String get mealStatusModified => 'बदला';

  @override
  String get mealStatusSkipped => 'छोड़ा';

  @override
  String dashTrendPercent(String value) {
    return '$value%';
  }

  @override
  String get myCustomRoutine => 'मेरा रूटीन';

  @override
  String get yourGymLinkPlaceholder => 'your-gym';

  @override
  String memberNoteMeta(String author, String date) {
    return '$author · $date';
  }

  @override
  String get membershipPayment => 'मेंबरशिप भुगतान';

  @override
  String get languageMenuSubtitle => 'ऐप की भाषा चुनें';

  @override
  String get specPersonalTraining => 'पर्सनल ट्रेनिंग';

  @override
  String get specHiit => 'HIIT और फ़ंक्शनल';

  @override
  String get specCrossfit => 'CrossFit';

  @override
  String get specYoga => 'योग और मोबिलिटी';

  @override
  String get specRehab => 'रिहैबिलिटेशन';

  @override
  String get specGeneral => 'सामान्य फ़िटनेस';

  @override
  String get exCatChest => 'छाती';

  @override
  String get exCatBack => 'पीठ';

  @override
  String get exCatLegs => 'पैर';

  @override
  String get exCatShoulders => 'कंधे';

  @override
  String get exCatArms => 'बाजू';

  @override
  String get exCatCore => 'कोर';

  @override
  String get exCatCardio => 'कार्डियो';

  @override
  String get exCatFullBody => 'फ़ुल बॉडी';

  @override
  String get exEqAll => 'सभी उपकरण';

  @override
  String get exEqNone => 'बिना उपकरण';

  @override
  String get exEqDumbbells => 'डंबल';

  @override
  String get exEqBarbell => 'बारबेल';

  @override
  String get exEqCable => 'केबल';

  @override
  String get exEqMachine => 'मशीन';

  @override
  String get exEqKettlebell => 'केटलबेल';

  @override
  String get exEqBand => 'रेज़िस्टेंस बैंड';

  @override
  String get exEqSmith => 'स्मिथ मशीन';

  @override
  String get exLvlAll => 'सभी लेवल';

  @override
  String get exLvlBeginner => 'शुरुआती';

  @override
  String get exLvlIntermediate => 'मध्यम';

  @override
  String get exLvlAdvanced => 'एडवांस्ड';

  @override
  String get exTypeStrength => 'ताकत';

  @override
  String get exTypeHypertrophy => 'मसल बिल्डिंग';

  @override
  String get exTypeEndurance => 'सहनशक्ति';

  @override
  String get exMuscleMidChest => 'मिड चेस्ट';

  @override
  String get exMuscleUpperChest => 'अपर चेस्ट';

  @override
  String get exMuscleFrontDelts => 'आगे के कंधे';

  @override
  String get exMuscleTriceps => 'ट्राइसेप्स';

  @override
  String get exMuscleBiceps => 'बाइसेप्स';

  @override
  String get exMuscleQuads => 'क्वाड्रिसेप्स';

  @override
  String get exMuscleHamstrings => 'हैमस्ट्रिंग';

  @override
  String get exMuscleGlutes => 'ग्लूट्स';

  @override
  String get exMuscleLowerBack => 'निचली पीठ';

  @override
  String get exMuscleLats => 'लैट्स';

  @override
  String get exMuscleRearDelts => 'पीछे के कंधे';

  @override
  String get exMuscleForearms => 'फ़ोरआर्म';

  @override
  String get exMuscleLowerAbs => 'निचला पेट';

  @override
  String get exMuscleGrip => 'ग्रिप स्ट्रेंथ';

  @override
  String get exMuscleUpperBack => 'ऊपरी पीठ और रॉमबॉइड्स';

  @override
  String get exMuscleTraps => 'ट्रैप्स';

  @override
  String get exMuscleObliques => 'ऑब्लिक्स';

  @override
  String get exMuscleHipFlexors => 'हिप फ़्लेक्सर्स';

  @override
  String get exStepBench1 => 'बेंच पर ऐसे लेटें कि आंखें बार के ठीक नीचे हों।';

  @override
  String get exStepBench2 => 'बारबेल को कंधों से थोड़ा चौड़ा पकड़ें।';

  @override
  String get exStepBench3 =>
      'वज़न रैक से उठाएं, कोर कसें और कंधे की हड्डियों को आपस में दबाएं।';

  @override
  String get exStepBench4 =>
      'बार को नियंत्रण के साथ छाती की हड्डी के निचले हिस्से तक लाएं।';

  @override
  String get exStepBench5 => 'ज़ोर से ऊपर धकेलें और हाथ पूरी तरह सीधे करें।';

  @override
  String get exNoteBench =>
      'पैरों को ज़मीन पर मज़बूती से दबाएं और पीठ को सामान्य स्थिति में रखें।';

  @override
  String get exStepIncline1 =>
      'एडजस्टेबल बेंच को 30 से 45 डिग्री के झुकाव पर रखें।';

  @override
  String get exStepIncline2 => 'पीछे टिकते हुए डंबल को कंधे की ऊंचाई तक लाएं।';

  @override
  String get exStepIncline3 =>
      'दोनों डंबल सीधे ऊपर धकेलें और ऊपर पहुंचकर ऊपरी छाती को कसें।';

  @override
  String get exStepIncline4 =>
      'ऊपरी बाजू ज़मीन के समानांतर होने तक नियंत्रण के साथ नीचे लाएं।';

  @override
  String get exNoteIncline =>
      'कंधों की सुरक्षा के लिए कोहनियों को लगभग 45 डिग्री पर शरीर के पास रखें।';

  @override
  String get exStepSquat1 => 'बारबेल को ऊपरी पीठ पर टिकाएं।';

  @override
  String get exStepSquat2 =>
      'पैरों को कंधों जितना खोलकर खड़े हों, पंजे थोड़े बाहर की ओर।';

  @override
  String get exStepSquat3 =>
      'कूल्हों और घुटनों को एक साथ मोड़कर स्क्वाट में बैठें।';

  @override
  String get exStepSquat4 =>
      'जांघें ज़मीन के समानांतर या उससे नीचे आने तक बैठें।';

  @override
  String get exStepSquat5 =>
      'पैर के बीच वाले हिस्से से ज़ोर लगाकर वापस खड़े हों।';

  @override
  String get exNoteSquat =>
      'अगर गहराई आरामदायक लगे, तो इस हफ़्ते अपने सबसे भारी सेट में 5 कि.ग्रा. जोड़ें।';

  @override
  String get exStepLat1 =>
      'चौड़े बार को कंधों से ज़्यादा चौड़ाई पर ओवरहैंड ग्रिप से पकड़ें।';

  @override
  String get exStepLat2 =>
      'सीधे बैठें और जांघ के पैड घुटनों पर मज़बूती से टिके रहें।';

  @override
  String get exStepLat3 =>
      'थोड़ा (लगभग 10–15 डिग्री) पीछे झुकें और बार को ऊपरी छाती तक खींचें।';

  @override
  String get exStepLat4 => 'नीचे लैट्स को कसें, फिर नियंत्रण के साथ वापस जाएं।';

  @override
  String get exStepOhp1 => 'पीठ के सहारे वाली बेंच पर सीधे बैठें।';

  @override
  String get exStepOhp2 =>
      'डंबल को कंधे की ऊंचाई पर पकड़ें, हथेलियां आगे की ओर।';

  @override
  String get exStepOhp3 => 'हाथ सीधे होने तक डंबल को सिर के ऊपर धकेलें।';

  @override
  String get exStepOhp4 => 'नियंत्रण के साथ वापस कंधे की ऊंचाई तक लाएं।';

  @override
  String get exNoteOhp => 'निचली पीठ को बेंच से हटाकर न मोड़ें।';

  @override
  String get exStepCurl1 => '45 डिग्री वाली इनक्लाइन बेंच पर टिककर बैठें।';

  @override
  String get exStepCurl2 =>
      'डंबल को बगल में सीधा लटकने दें, हथेलियां आगे की ओर।';

  @override
  String get exStepCurl3 => 'ऊपरी बाजू को स्थिर रखते हुए वज़न ऊपर मोड़ें।';

  @override
  String get exStepCurl4 => 'ऊपर रुकें, फिर 3 सेकंड में नीचे लाएं।';

  @override
  String get exStepLegRaise1 => 'ओवरहैंड ग्रिप से पुल-अप बार पर लटकें।';

  @override
  String get exStepLegRaise2 => 'पैर सीधे रखें या घुटनों से थोड़े मोड़ें।';

  @override
  String get exStepLegRaise3 =>
      'बिना झूले, पेट की मांसपेशियों से पैर कमर की ऊंचाई तक उठाएं।';

  @override
  String get exStepLegRaise4 => 'धीरे-धीरे वापस नीचे लाएं।';

  @override
  String get exStepRow1 =>
      'पीठ सीधी रखकर और घुटने हल्के मोड़कर कूल्हों से आगे झुकें।';

  @override
  String get exStepRow2 => 'डंबल को कंधों के ठीक नीचे लटकने दें।';

  @override
  String get exStepRow3 =>
      'कोहनियों को ऊपर ले जाते हुए डंबल को कूल्हों की ओर खींचें।';

  @override
  String get exStepRow4 => 'ऊपर पहुंचकर कंधे की हड्डियों को आपस में दबाएं।';

  @override
  String get exNoteRow =>
      'लैट्स पर काम के लिए बाइसेप्स से नहीं, कोहनियों से खींचें।';

  @override
  String get gymMachinesTitle => 'जिम मशीनें और उपकरण';

  @override
  String get machineStatusAvailable => 'उपलब्ध';

  @override
  String get machineStatusInUse => 'उपयोग में';

  @override
  String get machineStatusMaintenance => 'रखरखाव में';

  @override
  String get machineStatusUnavailable => 'अनुपलब्ध';

  @override
  String machineCategoryPrefix(String category, String targets) {
    return 'श्रेणी: $category · लक्ष्य: $targets';
  }

  @override
  String get premiumPlan => 'प्रीमियम प्लान';

  @override
  String get membershipStartDate => 'प्रारंभ तिथि';

  @override
  String get membershipExpires => 'समाप्त होने की तिथि';

  @override
  String get paymentHistory => 'भुगतान इतिहास';

  @override
  String get myProgress => 'मेरी प्रगति';

  @override
  String get tabWeight => 'वजन';

  @override
  String get tabMeasurements => 'माप';

  @override
  String get tabAttendance => 'उपस्थिति';

  @override
  String get tabPRs => 'व्यक्तिगत रिकॉर्ड';

  @override
  String get bmiTitle => 'बीएमआई (BMI)';

  @override
  String calculatedHeight(String height) {
    return 'गणना की गई ($height सेमी)';
  }

  @override
  String get bmiHealthNote =>
      'बीएमआई ऊंचाई और वजन पर आधारित एक अनुमान है। ताकत और शरीर की बनावट आपके प्राथमिक स्वास्थ्य संकेतक हैं।';

  @override
  String get logMetricsButton => 'वजन और शरीर के माप दर्ज करें';

  @override
  String startedWeightSubtitle(String weight, String date) {
    return '$weight किलो से ($date से शुरू)';
  }

  @override
  String get weightProgressTitle => 'वजन प्रगति';

  @override
  String get measureChest => 'सीना';

  @override
  String get measureWaist => 'कमर';

  @override
  String get measureArms => 'भुजाएँ';

  @override
  String get measureThighs => 'जांघें';

  @override
  String get benchPressExercise => 'बेंच प्रेस';

  @override
  String get squatExercise => 'स्क्वैट';

  @override
  String get deadliftExercise => 'डेडलिफ्ट';

  @override
  String get outdoorRunningGps => 'आउटडोर रनिंग जीपीएस';

  @override
  String get runDistance => 'दूरी';

  @override
  String get runKilometers => 'किलोमीटर';

  @override
  String get runTime => 'समय';

  @override
  String get runPace => 'गति';

  @override
  String get runCalories => 'कैलोरी';

  @override
  String get liveGpsMap => 'लाइव जीपीएस रूट मैप';

  @override
  String get recentRunHistory => 'हाल का रन इतिहास';

  @override
  String get morningRun => 'सुबह की दौड़';

  @override
  String runPacePerKm(String pace) {
    return '$pace /किमी';
  }

  @override
  String runHistorySummary(String time, String pace) {
    return 'समय: $time · औसत गति: $pace /किमी';
  }

  @override
  String get timeYesterday => 'कल';

  @override
  String get pauseRun => 'दौड़ रोकें';

  @override
  String get startRun => 'दौड़ शुरू करें';

  @override
  String get workoutPlanTitle => 'वर्कआउट प्लान';

  @override
  String exercisesCount(int count) {
    return 'व्यायाम ($count)';
  }

  @override
  String exercisesDuration(int count, int duration) {
    return '$count व्यायाम · $duration मिनट';
  }

  @override
  String adminUptime(String percent) {
    return '$percent% अपटाइम';
  }

  @override
  String adminMom(String percent) {
    return '$percent% मासिक वृद्धि';
  }

  @override
  String adminTrialingCount(int count) {
    return '$count ट्रायल पर';
  }

  @override
  String adminFullAccess(String email) {
    return '$email · पूर्ण पहुंच';
  }

  @override
  String get compoundHypertrophy => 'कंपाउंड · मांसपेशी वृद्धि';

  @override
  String get commonSave => 'सहेजें';

  @override
  String get commonSaved => 'सहेजा गया';

  @override
  String get startWorkout => 'वर्कआउट शुरू करें';
}
