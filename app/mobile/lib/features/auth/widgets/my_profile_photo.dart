import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_error.dart';
import '../../../shared/widgets/repsi_avatar_picker.dart';
import '../providers/auth_provider.dart';

import '../../../l10n/l10n.dart';
/// The signed-in user's photo, editable in place: picking a photo uploads it right away, and the
/// profile everywhere updates from the server's response.
class MyProfilePhoto extends ConsumerStatefulWidget {
  final double size;

  const MyProfilePhoto({super.key, this.size = 56});

  @override
  ConsumerState<MyProfilePhoto> createState() => _MyProfilePhotoState();
}

class _MyProfilePhotoState extends ConsumerState<MyProfilePhoto> {
  bool _busy = false;

  Future<void> _run(Future<void> Function() action, String success) async {
    setState(() => _busy = true);
    final messenger = ScaffoldMessenger.of(context);
    final failed = context.l10n.photoUpdateFailed;
    try {
      await action();
      messenger.showSnackBar(SnackBar(content: Text(success)));
    } on ApiError catch (e) {
      messenger.showSnackBar(SnackBar(content: Text(e.message)));
    } catch (_) {
      messenger.showSnackBar(SnackBar(content: Text(failed)));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider.select((s) => s.user));
    final notifier = ref.read(authProvider.notifier);
    return RepsiAvatarPicker(
      name: user?.fullName ?? '',
      imageUrl: user?.avatarUrl,
      size: widget.size,
      busy: _busy,
      onPicked: (p) => _run(() => notifier.updateAvatar(p.bytes, p.filename), context.l10n.photoUpdated),
      onRemove: () => _run(notifier.removeAvatar, context.l10n.photoRemoved),
    );
  }
}
