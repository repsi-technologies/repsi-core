import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_typography.dart';
import 'repsi_skeleton.dart';
import '../../app/theme/repsi_palette.dart';

class RepsiAvatar extends StatelessWidget {
  final String name;
  final String? imageUrl;
  final double size;
  final bool showStatus;
  final bool isOnline;

  const RepsiAvatar({
    super.key,
    required this.name,
    this.imageUrl,
    this.size = 40,
    this.showStatus = false,
    this.isOnline = false,
  });

  String get _initials {
    // Grapheme-safe: Tamil/Devanagari names must not be split mid-character.
    final parts = name.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
    if (parts.isEmpty) return 'R';
    if (parts.length == 1) return parts[0].characters.first.toUpperCase();
    return '${parts[0].characters.first}${parts[1].characters.first}'.toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    Widget avatarWidget = Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkSurfaceElevated : context.palette.surfaceSubtle,
        shape: BoxShape.circle,
        border: Border.all(
          color: isDark ? AppColors.darkBorder : context.palette.border,
          width: 1.5,
        ),
      ),
      alignment: Alignment.center,
      child: imageUrl != null && imageUrl!.isNotEmpty
          ? ClipOval(
              child: CachedNetworkImage(
                imageUrl: imageUrl!,
                width: size,
                height: size,
                memCacheWidth: (size * 2.5).toInt(),
                memCacheHeight: (size * 2.5).toInt(),
                fit: BoxFit.cover,
                placeholder: (context, url) => RepsiSkeleton.circular(size: size),
                errorWidget: (context, error, stackTrace) => _buildInitials(isDark),
              ),
            )
          : _buildInitials(isDark),
    );

    if (!showStatus) return avatarWidget;

    return Stack(
      children: [
        avatarWidget,
        Positioned(
          right: 0,
          bottom: 0,
          child: Container(
            width: size * 0.28,
            height: size * 0.28,
            decoration: BoxDecoration(
              color: isOnline ? context.palette.success : AppColors.darkTextMuted,
              shape: BoxShape.circle,
              border: Border.all(
                color: isDark ? AppColors.darkSurface : context.palette.surface,
                width: 2,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildInitials(bool isDark) {
    return Text(
      _initials,
      style: TextStyle(
        fontSize: size * 0.38,
        fontWeight: FontWeight.w600,
        color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
        fontFamily: AppTypography.fontFamily,
      ),
    );
  }
}
