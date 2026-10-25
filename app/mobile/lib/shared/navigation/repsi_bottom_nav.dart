import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_typography.dart';
import '../../shared/models/user_model.dart';
import '../animations/repsi_motion.dart';

import '../../l10n/l10n.dart';
import '../../app/theme/repsi_palette.dart';
class RepsiNavItem {
  final IconData icon;
  final IconData? activeIcon;
  final String label;

  const RepsiNavItem({
    required this.icon,
    this.activeIcon,
    required this.label,
  });
}

class RepsiBottomNav extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;
  final UserRole role;
  final List<RepsiNavItem>? customItems;

  const RepsiBottomNav({
    super.key,
    required this.currentIndex,
    required this.onTap,
    this.role = UserRole.user,
    this.customItems,
  });

  static List<RepsiNavItem> getItemsForRole(BuildContext context, UserRole role) {
    switch (role) {
      case UserRole.trainer:
        return [
          RepsiNavItem(icon: LucideIcons.house, label: context.l10n.commonHome),
          RepsiNavItem(icon: LucideIcons.users, label: context.l10n.navClients),
          RepsiNavItem(icon: LucideIcons.calendarDays, label: context.l10n.navSchedule),
          RepsiNavItem(icon: LucideIcons.messageSquare, label: context.l10n.messages),
          RepsiNavItem(icon: LucideIcons.ellipsis, label: context.l10n.commonMore),
        ];
      case UserRole.owner:
      case UserRole.manager:
        return [
          RepsiNavItem(icon: LucideIcons.house, label: context.l10n.commonHome),
          RepsiNavItem(icon: LucideIcons.users, label: context.l10n.commonMembers),
          RepsiNavItem(icon: LucideIcons.scanLine, label: context.l10n.commonFrontDesk),
          RepsiNavItem(icon: LucideIcons.indianRupee, label: context.l10n.commonFinance),
          RepsiNavItem(icon: LucideIcons.ellipsis, label: context.l10n.commonMore),
        ];
      case UserRole.admin:
      case UserRole.superAdmin:
        return [
          RepsiNavItem(icon: LucideIcons.layoutDashboard, label: context.l10n.commonHome),
          RepsiNavItem(icon: LucideIcons.dumbbell, label: context.l10n.navGyms),
          RepsiNavItem(icon: LucideIcons.users, label: context.l10n.navUsers),
          RepsiNavItem(icon: LucideIcons.chartNoAxesColumn, label: context.l10n.navAnalytics),
          RepsiNavItem(icon: LucideIcons.settings, label: context.l10n.commonMore),
        ];
      case UserRole.user:
      case UserRole.staff:
        return [
          RepsiNavItem(icon: LucideIcons.house, label: context.l10n.commonHome),
          RepsiNavItem(icon: LucideIcons.dumbbell, label: context.l10n.navWorkout),
          RepsiNavItem(icon: LucideIcons.activity, label: context.l10n.navProgress),
          RepsiNavItem(icon: LucideIcons.calendarDays, label: context.l10n.navClasses),
          RepsiNavItem(icon: LucideIcons.ellipsis, label: context.l10n.commonMore),
        ];
    }
  }

  @override
  Widget build(BuildContext context) {
    final items = customItems ?? getItemsForRole(context, role);
    final palette = context.palette;

    return DecoratedBox(
      decoration: BoxDecoration(
        color: palette.surface,
        border: Border(top: BorderSide(color: palette.border, width: 1.0)),
        boxShadow: [BoxShadow(color: palette.shadow, blurRadius: 16, offset: const Offset(0, -4))],
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 68,
          child: LayoutBuilder(
            builder: (context, constraints) {
              final slot = constraints.maxWidth / items.length;
              final pillWidth = (slot - 16).clamp(40.0, 72.0);
              return Stack(
                children: [
                  // Sliding pill behind the selected icon.
                  AnimatedPositioned(
                    duration: RepsiMotion.nav,
                    curve: RepsiMotion.easeOut,
                    top: 8,
                    left: slot * currentIndex + (slot - pillWidth) / 2,
                    width: pillWidth,
                    height: 32,
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        color: palette.primarySoft,
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                  ),
                  Row(
                    children: List.generate(items.length, (index) {
                      return Expanded(
                        child: _RepsiNavItemWidget(
                          item: items[index],
                          isSelected: currentIndex == index,
                          onTap: () {
                            HapticFeedback.selectionClick();
                            onTap(index);
                          },
                        ),
                      );
                    }),
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}

class _RepsiNavItemWidget extends StatelessWidget {
  final RepsiNavItem item;
  final bool isSelected;
  final VoidCallback onTap;

  const _RepsiNavItemWidget({
    required this.item,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final color = isSelected ? (context.isDarkMode ? AppColors.primaryBright : AppColors.primary) : palette.textMuted;

    return Semantics(
      selected: isSelected,
      button: true,
      label: item.label,
      excludeSemantics: true,
      child: InkResponse(
        onTap: onTap,
        radius: 36,
        highlightShape: BoxShape.rectangle,
        containedInkWell: false,
        child: Padding(
          padding: const EdgeInsets.only(top: 12, bottom: 6),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AnimatedScale(
                scale: isSelected ? 1.1 : 1.0,
                duration: RepsiMotion.nav,
                curve: RepsiMotion.easeBack,
                child: AnimatedSwitcher(
                  duration: RepsiMotion.icon,
                  child: Icon(
                    isSelected ? (item.activeIcon ?? item.icon) : item.icon,
                    key: ValueKey(isSelected),
                    size: 22,
                    color: color,
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 2),
                child: AnimatedDefaultTextStyle(
                  duration: RepsiMotion.nav,
                  curve: RepsiMotion.easeOut,
                  style: AppTypography.caption.copyWith(
                    fontSize: 11,
                    height: 1.2,
                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                    color: color,
                  ),
                  // Tamil/Malayalam labels are long: one line, shrink before clipping.
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text(item.label, maxLines: 1, softWrap: false),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
