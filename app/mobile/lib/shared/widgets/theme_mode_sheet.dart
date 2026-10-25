import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app/theme/app_colors.dart';
import '../../app/theme/app_typography.dart';
import '../../app/theme/repsi_palette.dart';
import '../../core/providers/theme_provider.dart';
import '../../l10n/l10n.dart';

/// Appearance picker shared by the member, trainer and owner menus.
class ThemeModeSheet extends ConsumerWidget {
  const ThemeModeSheet({super.key});

  static void show(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: context.palette.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => const ThemeModeSheet(),
    );
  }

  static String label(AppLocalizations l, AppThemeMode mode) => switch (mode) {
        AppThemeMode.system => l.themeSystem,
        AppThemeMode.light => l.themeLight,
        AppThemeMode.dark => l.themeDark,
      };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l = context.l10n;
    final palette = context.palette;
    final current = ref.watch(themeNotifierProvider);
    const options = [
      (AppThemeMode.system, Icons.brightness_auto_rounded),
      (AppThemeMode.light, Icons.light_mode_rounded),
      (AppThemeMode.dark, Icons.dark_mode_rounded),
    ];
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(l.appearance, style: AppTypography.headingSmall.copyWith(fontWeight: FontWeight.w700, color: palette.text)),
            const SizedBox(height: 16),
            Row(
              children: [
                for (final (i, (mode, icon)) in options.indexed) ...[
                  if (i > 0) const SizedBox(width: 10),
                  Expanded(
                    child: Semantics(
                      button: true,
                      selected: current == mode,
                      child: InkWell(
                        borderRadius: BorderRadius.circular(14),
                        onTap: () => ref.read(themeNotifierProvider.notifier).setTheme(mode),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 6),
                          decoration: BoxDecoration(
                            color: current == mode ? palette.primarySoft : palette.surfaceSecondary,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: current == mode ? AppColors.primary : Colors.transparent, width: 1.5),
                          ),
                          child: Column(children: [
                            Icon(icon, color: current == mode ? AppColors.primary : palette.textSecondary),
                            const SizedBox(height: 8),
                            Text(label(l, mode),
                                textAlign: TextAlign.center,
                                maxLines: 2,
                                style: AppTypography.caption.copyWith(
                                    color: palette.text, fontWeight: current == mode ? FontWeight.w700 : FontWeight.w500)),
                          ]),
                        ),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}
