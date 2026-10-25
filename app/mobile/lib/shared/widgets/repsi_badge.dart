import 'package:flutter/material.dart';
import '../../app/theme/app_spacing.dart';
import '../../app/theme/app_typography.dart';
import '../../app/theme/repsi_palette.dart';

enum RepsiBadgeVariant {
  active,
  expiring,
  expired,
  frozen,
  cancelled,
  success,
  warning,
  error,
  info,
  neutral,
}

class RepsiBadge extends StatelessWidget {
  final String label;
  final RepsiBadgeVariant variant;
  final bool showDot;

  const RepsiBadge({
    super.key,
    required this.label,
    this.variant = RepsiBadgeVariant.neutral,
    this.showDot = true,
  });

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg;

    switch (variant) {
      case RepsiBadgeVariant.active:
      case RepsiBadgeVariant.success:
        bg = context.palette.badgeActiveBg;
        fg = context.palette.badgeActiveFg;
        break;
      case RepsiBadgeVariant.expiring:
      case RepsiBadgeVariant.warning:
        bg = context.palette.badgeExpiringBg;
        fg = context.palette.badgeExpiringFg;
        break;
      case RepsiBadgeVariant.expired:
      case RepsiBadgeVariant.error:
        bg = context.palette.badgeExpiredBg;
        fg = context.palette.badgeExpiredFg;
        break;
      case RepsiBadgeVariant.frozen:
        bg = context.palette.badgeFrozenBg;
        fg = context.palette.badgeFrozenFg;
        break;
      case RepsiBadgeVariant.cancelled:
        bg = context.palette.badgeCancelledBg;
        fg = context.palette.badgeCancelledFg;
        break;
      case RepsiBadgeVariant.info:
        bg = const Color(0xFFEFF6FF);
        fg = const Color(0xFF2563EB);
        break;
      case RepsiBadgeVariant.neutral:
        bg = context.palette.surfaceSubtle;
        fg = context.palette.textSecondary;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: AppSpacing.xs / 2,
      ),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (showDot) ...[
            Container(
              width: 6,
              height: 6,
              decoration: BoxDecoration(
                color: fg,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: AppSpacing.xs),
          ],
          Text(
            label,
            style: AppTypography.caption.copyWith(
              color: fg,
              fontWeight: FontWeight.w600,
              fontSize: 11,
            ),
          ),
        ],
      ),
    );
  }
}
