import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_spacing.dart';
import '../../app/theme/app_typography.dart';
import 'repsi_avatar.dart';
import 'repsi_bottom_sheet.dart';

import '../../l10n/l10n.dart';
/// A picked photo, already downscaled on the device (max 1024px, JPEG quality 85) so uploads stay
/// small on mobile data.
class PickedPhoto {
  final Uint8List bytes;
  final String filename;

  const PickedPhoto(this.bytes, this.filename);
}

/// Circular profile photo with a camera badge. Tapping it offers camera, gallery and (when there
/// is a photo) removal. The caller decides whether to upload right away or keep the bytes.
class RepsiAvatarPicker extends StatelessWidget {
  final String name;
  final String? imageUrl;
  final Uint8List? previewBytes;
  final double size;
  final bool busy;
  final ValueChanged<PickedPhoto> onPicked;
  final VoidCallback? onRemove;
  final String? caption;

  const RepsiAvatarPicker({
    super.key,
    required this.name,
    required this.onPicked,
    this.imageUrl,
    this.previewBytes,
    this.size = 96,
    this.busy = false,
    this.onRemove,
    this.caption,
  });

  bool get _hasPhoto => previewBytes != null || (imageUrl?.isNotEmpty ?? false);

  Future<void> _choose(BuildContext context) async {
    final source = await RepsiBottomSheet.show<Object>(
      context: context,
      title: context.l10n.avatarTitle,
      child: Builder(
        builder: (ctx) => Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _SheetAction(icon: Icons.photo_camera_outlined, label: context.l10n.avatarTakePhoto, onTap: () => Navigator.pop(ctx, ImageSource.camera)),
            _SheetAction(icon: Icons.photo_library_outlined, label: context.l10n.avatarChooseGallery, onTap: () => Navigator.pop(ctx, ImageSource.gallery)),
            if (_hasPhoto && onRemove != null)
              _SheetAction(icon: Icons.delete_outline_rounded, label: context.l10n.avatarRemove, destructive: true, onTap: () => Navigator.pop(ctx, 'remove')),
          ],
        ),
      ),
    );
    if (source == 'remove') {
      onRemove?.call();
      return;
    }
    if (source is! ImageSource) return;
    try {
      final file = await ImagePicker().pickImage(
        source: source,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 85,
        preferredCameraDevice: CameraDevice.front,
      );
      if (file == null) return;
      onPicked(PickedPhoto(await file.readAsBytes(), file.name));
    } catch (_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(source == ImageSource.camera
                ? context.l10n.avatarCameraError
                : context.l10n.avatarGalleryError),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final ring = isDark ? AppColors.darkBorderStrong : AppColors.borderStrong;

    final Widget face;
    if (previewBytes != null) {
      face = ClipOval(child: Image.memory(previewBytes!, width: size, height: size, fit: BoxFit.cover));
    } else if (_hasPhoto) {
      face = RepsiAvatar(name: name, imageUrl: imageUrl, size: size);
    } else {
      face = Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: isDark ? AppColors.darkSurface : AppColors.background,
          border: Border.all(color: ring),
        ),
        child: Icon(Icons.person_outline_rounded, size: size * 0.42, color: isDark ? AppColors.darkTextMuted : AppColors.textMuted),
      );
    }

    return Semantics(
      button: true,
      label: _hasPhoto ? context.l10n.avatarChange : context.l10n.avatarAdd,
      child: InkWell(
        onTap: busy ? null : () => _choose(context),
        borderRadius: BorderRadius.circular(size),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox.square(
              dimension: size,
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  ExcludeSemantics(child: face),
                  if (busy)
                    Positioned.fill(
                      child: DecoratedBox(
                        decoration: const BoxDecoration(shape: BoxShape.circle, color: Color(0x66000000)),
                        child: const Center(
                          child: SizedBox.square(
                            dimension: 24,
                            child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white),
                          ),
                        ),
                      ),
                    ),
                  Positioned(
                    right: -2,
                    bottom: -2,
                    child: Container(
                      width: size * 0.34,
                      height: size * 0.34,
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        shape: BoxShape.circle,
                        border: Border.all(color: isDark ? AppColors.darkBackground : AppColors.surface, width: 2.5),
                      ),
                      child: Icon(Icons.photo_camera_rounded, size: size * 0.17, color: Colors.white),
                    ),
                  ),
                ],
              ),
            ),
            if (caption != null) ...[
              const SizedBox(height: AppSpacing.sm),
              Text(
                caption!,
                style: AppTypography.caption.copyWith(color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _SheetAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool destructive;

  const _SheetAction({required this.icon, required this.label, required this.onTap, this.destructive = false});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final color = destructive ? AppColors.error : (isDark ? AppColors.darkText : AppColors.text);
    return ListTile(
      contentPadding: EdgeInsets.zero,
      minTileHeight: 52,
      leading: Icon(icon, color: color),
      title: Text(label, style: AppTypography.body.copyWith(color: color, fontWeight: FontWeight.w500)),
      onTap: onTap,
    );
  }
}
