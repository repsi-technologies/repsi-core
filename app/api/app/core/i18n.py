"""
Language registry and resolution. Mirrors app/web/lib/i18n/languages.ts and the mobile AppLanguage enum:
a code is accepted only once its UI catalogue exists ("beta" or "stable"); "planned" codes are reserved.

Resolution order for anything rendered for a person (UI defaults, notifications):
    user.preferred_language -> workspace.default_language -> Accept-Language -> "en"
"""
from __future__ import annotations

from typing import Iterable, Optional

DEFAULT_LANGUAGE = "en"

# code -> (English name, native name, status)
LANGUAGES: dict[str, tuple[str, str, str]] = {
    "en": ("English", "English", "stable"),
    "ta": ("Tamil", "தமிழ்", "beta"),
    "ml": ("Malayalam", "മലയാളം", "beta"),
    "hi": ("Hindi", "हिन्दी", "beta"),
    "kn": ("Kannada", "ಕನ್ನಡ", "beta"),
    "te": ("Telugu", "తెలుగు", "beta"),
    "mr": ("Marathi", "मराठी", "planned"),
    "bn": ("Bengali", "বাংলা", "planned"),
    "gu": ("Gujarati", "ગુજરાતી", "planned"),
    "pa": ("Punjabi", "ਪੰਜਾਬੀ", "planned"),
    "or": ("Odia", "ଓଡ଼ିଆ", "planned"),
    "ur": ("Urdu", "اردو", "planned"),
    "ar": ("Arabic", "العربية", "planned"),
}

SUPPORTED_LANGUAGES: tuple[str, ...] = tuple(code for code, (_, _, status) in LANGUAGES.items() if status != "planned")


def normalize_language(value: Optional[str]) -> Optional[str]:
    """'ta-IN' / ' TA ' -> 'ta'; None when the language isn't supported."""
    base = (value or "").strip().lower().replace("_", "-").split("-")[0]
    return base if base in SUPPORTED_LANGUAGES else None


def parse_accept_language(header: Optional[str]) -> Optional[str]:
    """Best supported language from an Accept-Language header, honouring q-values."""
    choices: list[tuple[float, int, str]] = []
    for index, part in enumerate((header or "").split(",")):
        tag, _, params = part.strip().partition(";")
        q = 1.0
        if params.strip().startswith("q="):
            try:
                q = float(params.strip()[2:])
            except ValueError:
                q = 0.0
        lang = normalize_language(tag)
        if lang and q > 0:
            choices.append((-q, index, lang))
    return min(choices)[2] if choices else None


def resolve_language(*candidates: Optional[str]) -> str:
    """First supported candidate, else English. Pass them in priority order."""
    for candidate in candidates:
        lang = normalize_language(candidate)
        if lang:
            return lang
    return DEFAULT_LANGUAGE


def fallback_chain(language: Optional[str], workspace_default: Optional[str] = None) -> list[str]:
    """Languages to try for a template, most preferred first, without duplicates."""
    chain: list[str] = []
    for code in (normalize_language(language), normalize_language(workspace_default), DEFAULT_LANGUAGE):
        if code and code not in chain:
            chain.append(code)
    return chain


def pick_by_language(items: Iterable, language: Optional[str], workspace_default: Optional[str] = None, attr: str = "language"):
    """The item whose `language` best matches the chain; items without a language count as English."""
    items = list(items)
    for code in fallback_chain(language, workspace_default):
        for item in items:
            if (getattr(item, attr, None) or DEFAULT_LANGUAGE) == code:
                return item
    return items[0] if items else None


# Default lifecycle message wording per language (subject, body). English lives in app/services/notify.py.
# Missing events fall back to English. Placeholders are the same {{variables}} as the English copy.
LOCALIZED_COPY: dict[str, dict[str, tuple[str, str]]] = {
    "ta": {
        "welcome": ("{{gym_name}}-க்கு வரவேற்கிறோம்", "வணக்கம் {{first_name}}, {{gym_name}}-க்கு வரவேற்கிறோம்! உங்களுடன் இருப்பதில் மகிழ்ச்சி."),
        "payment_receipt": ("கட்டணம் பெறப்பட்டது – {{amount}}", "வணக்கம் {{first_name}}, {{date}} அன்று {{amount}} பெறப்பட்டது. ரசீது {{receipt_number}}. நன்றி!"),
        "membership_assigned": ("உங்கள் {{plan_name}} உறுப்பினர் திட்டம் உறுதிசெய்யப்பட்டது", "வணக்கம் {{first_name}}, உங்கள் {{plan_name}} திட்டம் {{start_date}} முதல் {{end_date}} வரை செல்லுபடியாகும்."),
        "membership_renewed": ("உறுப்பினர் திட்டம் புதுப்பிக்கப்பட்டது", "வணக்கம் {{first_name}}, உங்கள் {{plan_name}} திட்டம் {{end_date}} வரை புதுப்பிக்கப்பட்டது."),
        "membership_expiring": ("உங்கள் உறுப்பினர் திட்டம் {{days}} நாளில் முடிகிறது", "வணக்கம் {{first_name}}, {{gym_name}}-இல் உங்கள் {{plan_name}} திட்டம் {{end_date}} அன்று முடிகிறது. பயிற்சியைத் தொடர புதுப்பிக்கவும்."),
        "membership_expired": ("உங்கள் உறுப்பினர் திட்டம் முடிந்தது", "வணக்கம் {{first_name}}, உங்கள் {{plan_name}} திட்டம் {{end_date}} அன்று முடிந்தது. {{gym_name}}-இல் எப்போது வேண்டுமானாலும் புதுப்பிக்கலாம்."),
    },
    "ml": {
        "welcome": ("{{gym_name}}-ലേക്ക് സ്വാഗതം", "നമസ്കാരം {{first_name}}, {{gym_name}}-ലേക്ക് സ്വാഗതം! നിങ്ങളെ കിട്ടിയതിൽ സന്തോഷം."),
        "payment_receipt": ("പേയ്മെന്റ് ലഭിച്ചു – {{amount}}", "നമസ്കാരം {{first_name}}, {{date}}-ന് {{amount}} ലഭിച്ചു. രസീത് {{receipt_number}}. നന്ദി!"),
        "membership_assigned": ("നിങ്ങളുടെ {{plan_name}} അംഗത്വം സ്ഥിരീകരിച്ചു", "നമസ്കാരം {{first_name}}, നിങ്ങളുടെ {{plan_name}} അംഗത്വം {{start_date}} മുതൽ {{end_date}} വരെയാണ്."),
        "membership_renewed": ("അംഗത്വം പുതുക്കി", "നമസ്കാരം {{first_name}}, നിങ്ങളുടെ {{plan_name}} അംഗത്വം {{end_date}} വരെ പുതുക്കി."),
        "membership_expiring": ("നിങ്ങളുടെ അംഗത്വം {{days}} ദിവസത്തിനുള്ളിൽ അവസാനിക്കും", "നമസ്കാരം {{first_name}}, {{gym_name}}-ലെ നിങ്ങളുടെ {{plan_name}} അംഗത്വം {{end_date}}-ന് അവസാനിക്കും. പരിശീലനം തുടരാൻ പുതുക്കുക."),
        "membership_expired": ("നിങ്ങളുടെ അംഗത്വം അവസാനിച്ചു", "നമസ്കാരം {{first_name}}, നിങ്ങളുടെ {{plan_name}} അംഗത്വം {{end_date}}-ന് അവസാനിച്ചു. {{gym_name}}-ൽ എപ്പോൾ വേണമെങ്കിലും പുതുക്കാം."),
    },
    "hi": {
        "welcome": ("{{gym_name}} में आपका स्वागत है", "नमस्ते {{first_name}}, {{gym_name}} में आपका स्वागत है! आपके साथ जुड़कर हमें खुशी है।"),
        "payment_receipt": ("भुगतान प्राप्त हुआ – {{amount}}", "नमस्ते {{first_name}}, {{date}} को {{amount}} प्राप्त हुए। रसीद {{receipt_number}}। धन्यवाद!"),
        "membership_assigned": ("आपकी {{plan_name}} मेंबरशिप कन्फ़र्म हो गई है", "नमस्ते {{first_name}}, आपकी {{plan_name}} मेंबरशिप {{start_date}} से {{end_date}} तक है।"),
        "membership_renewed": ("मेंबरशिप रिन्यू हो गई", "नमस्ते {{first_name}}, आपकी {{plan_name}} मेंबरशिप {{end_date}} तक रिन्यू हो गई है।"),
        "membership_expiring": ("आपकी मेंबरशिप {{days}} दिन में खत्म हो रही है", "नमस्ते {{first_name}}, {{gym_name}} में आपकी {{plan_name}} मेंबरशिप {{end_date}} को खत्म हो रही है। ट्रेनिंग जारी रखने के लिए रिन्यू करें।"),
        "membership_expired": ("आपकी मेंबरशिप खत्म हो गई है", "नमस्ते {{first_name}}, आपकी {{plan_name}} मेंबरशिप {{end_date}} को खत्म हो गई। {{gym_name}} पर कभी भी रिन्यू करें।"),
    },
    "kn": {
        "welcome": ("{{gym_name}}ಗೆ ಸ್ವಾಗತ", "ನಮಸ್ಕಾರ {{first_name}}, {{gym_name}}ಗೆ ಸ್ವಾಗತ! ನೀವು ಸೇರಿದ್ದು ನಮಗೆ ಸಂತೋಷ."),
        "payment_receipt": ("ಪಾವತಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ – {{amount}}", "ನಮಸ್ಕಾರ {{first_name}}, {{date}} ರಂದು {{amount}} ಸ್ವೀಕರಿಸಲಾಗಿದೆ. ರಸೀದಿ {{receipt_number}}. ಧನ್ಯವಾದಗಳು!"),
        "membership_expiring": ("ನಿಮ್ಮ ಸದಸ್ಯತ್ವ {{days}} ದಿನಗಳಲ್ಲಿ ಮುಗಿಯುತ್ತದೆ", "ನಮಸ್ಕಾರ {{first_name}}, {{gym_name}}ನಲ್ಲಿ ನಿಮ್ಮ {{plan_name}} ಸದಸ್ಯತ್ವ {{end_date}} ರಂದು ಮುಗಿಯುತ್ತದೆ. ತರಬೇತಿ ಮುಂದುವರಿಸಲು ನವೀಕರಿಸಿ."),
        "membership_expired": ("ನಿಮ್ಮ ಸದಸ್ಯತ್ವ ಮುಗಿದಿದೆ", "ನಮಸ್ಕಾರ {{first_name}}, ನಿಮ್ಮ {{plan_name}} ಸದಸ್ಯತ್ವ {{end_date}} ರಂದು ಮುಗಿದಿದೆ. {{gym_name}}ನಲ್ಲಿ ಯಾವಾಗ ಬೇಕಾದರೂ ನವೀಕರಿಸಿ."),
    },
    "te": {
        "welcome": ("{{gym_name}}కి స్వాగతం", "నమస్కారం {{first_name}}, {{gym_name}}కి స్వాగతం! మీరు చేరినందుకు సంతోషం."),
        "payment_receipt": ("చెల్లింపు అందింది – {{amount}}", "నమస్కారం {{first_name}}, {{date}}న {{amount}} అందింది. రసీదు {{receipt_number}}. ధన్యవాదాలు!"),
        "membership_expiring": ("మీ సభ్యత్వం {{days}} రోజుల్లో ముగుస్తుంది", "నమస్కారం {{first_name}}, {{gym_name}}లో మీ {{plan_name}} సభ్యత్వం {{end_date}}న ముగుస్తుంది. శిక్షణ కొనసాగించడానికి పునరుద్ధరించండి."),
        "membership_expired": ("మీ సభ్యత్వం ముగిసింది", "నమస్కారం {{first_name}}, మీ {{plan_name}} సభ్యత్వం {{end_date}}న ముగిసింది. {{gym_name}}లో ఎప్పుడైనా పునరుద్ధరించండి."),
    },
}


def default_copy(event_type: str, language: str, english: dict[str, tuple[str, str]]) -> tuple[str, str]:
    """Default (subject, body) for an event in the given language, falling back to English."""
    localized = LOCALIZED_COPY.get(language, {}).get(event_type)
    return localized or english.get(event_type, (event_type.replace("_", " ").title(), ""))
