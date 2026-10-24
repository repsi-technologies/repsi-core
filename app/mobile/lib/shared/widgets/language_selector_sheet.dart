import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/localization/app_locale.dart';
import '../../core/localization/locale_provider.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_typography.dart';
import '../../l10n/l10n.dart';

/// Language picker. Each language is listed in its own script (English and Tamil first), and
/// the choice applies immediately: no restart, kept across sign-out and gym switches.
class LanguageSelectorSheet extends ConsumerWidget {
  const LanguageSelectorSheet({super.key});

  static void show(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: isDark ? AppColors.darkSurface : AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => const LanguageSelectorSheet(),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentLang = ref.watch(localeNotifierProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final text = isDark ? AppColors.darkText : AppColors.text;
    final secondary = isDark ? AppColors.darkTextSecondary : AppColors.textSecondary;

    return SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Text(
                    context.l10n.languageSheetTitle,
                    style: AppTypography.headingSmall.copyWith(fontWeight: FontWeight.w700, color: text),
                  ),
                ),
                IconButton(
                  tooltip: context.l10n.commonClose,
                  icon: Icon(Icons.close, size: 20, color: secondary),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              context.l10n.languageSheetSubtitle,
              style: AppTypography.caption.copyWith(color: secondary),
            ),
            const SizedBox(height: 16),
            for (final lang in AppLanguage.values)
              _LanguageTile(
                language: lang,
                selected: lang == currentLang,
                onTap: () {
                  ref.read(localeNotifierProvider.notifier).setLanguage(lang);
                  Navigator.pop(context);
                },
              ),
            const SizedBox(height: 4),
          ],
        ),
      ),
    );
  }
}

class _LanguageTile extends StatelessWidget {
  final AppLanguage language;
  final bool selected;
  final VoidCallback onTap;

  const _LanguageTile({required this.language, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final border = isDark ? AppColors.darkBorder : AppColors.border;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Semantics(
        selected: selected,
        button: true,
        child: Material(
          color: selected ? AppColors.primarySoft : Colors.transparent,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: BorderSide(color: selected ? AppColors.primary : border, width: selected ? 1.5 : 1),
          ),
          child: InkWell(
            borderRadius: BorderRadius.circular(12),
            onTap: onTap,
            child: ConstrainedBox(
              constraints: const BoxConstraints(minHeight: 56),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                child: Row(
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: selected ? AppColors.primary : Colors.transparent,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: border),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        language.badge,
                        locale: language.locale,
                        style: TextStyle(
                          color: selected ? Colors.white : AppColors.primaryDark,
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            language.nativeName,
                            locale: language.locale,
                            style: TextStyle(
                              fontWeight: selected ? FontWeight.w700 : FontWeight.w600,
                              color: selected ? AppColors.primaryDark : (isDark ? AppColors.darkText : AppColors.text),
                              fontSize: 15,
                              height: 1.4,
                            ),
                          ),
                          if (language != AppLanguage.en)
                            Text(
                              language.englishName,
                              style: AppTypography.caption.copyWith(
                                color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                                fontSize: 12,
                              ),
                            ),
                        ],
                      ),
                    ),
                    if (selected) const Icon(Icons.check_circle_rounded, color: AppColors.primary, size: 20),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Compact language switch for screens without a settings menu (sign-in, onboarding).
class LanguageButton extends ConsumerWidget {
  /// Text colour; defaults to the theme's text colour.
  final Color? color;

  const LanguageButton({super.key, this.color});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(localeNotifierProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final color = this.color ?? (isDark ? AppColors.darkText : AppColors.text);
    return Tooltip(
      message: '${context.l10n.languageSheetTitle}: ${lang.nativeName}',
      child: TextButton.icon(
        onPressed: () => LanguageSelectorSheet.show(context),
        style: TextButton.styleFrom(
          minimumSize: const Size(48, 44),
          foregroundColor: color,
          padding: const EdgeInsets.symmetric(horizontal: 10),
        ),
        icon: const Icon(Icons.translate_rounded, size: 18),
        // The short script badge (EN, த, മ, हि) keeps headers from overflowing on small phones.
        label: Text(lang.badge, locale: lang.locale, style: AppTypography.bodySmall.copyWith(color: color, fontWeight: FontWeight.w700)),
      ),
    );
  }
}
