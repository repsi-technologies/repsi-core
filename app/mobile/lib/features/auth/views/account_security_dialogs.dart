import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../app/routes/route_names.dart';
import '../../../core/api/api_error.dart';
import '../providers/auth_provider.dart';

import '../../../l10n/l10n.dart';
/// Change-password dialog. Other devices are signed out by the server; this one stays signed in.
Future<void> showChangePasswordDialog(BuildContext context, WidgetRef ref) async {
  final current = TextEditingController();
  final next = TextEditingController();
  final formKey = GlobalKey<FormState>();
  String? error;
  var busy = false;

  final changed = await showDialog<bool>(
    context: context,
    barrierDismissible: false,
    builder: (ctx) => StatefulBuilder(
      builder: (ctx, setState) => AlertDialog(
        title: Text(context.l10n.changePassword),
        content: Form(
          key: formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(
                controller: current,
                obscureText: true,
                autofillHints: const [AutofillHints.password],
                decoration: InputDecoration(labelText: context.l10n.currentPassword),
                validator: (v) => (v == null || v.isEmpty) ? context.l10n.enterCurrentPassword : null,
              ),
              TextFormField(
                controller: next,
                obscureText: true,
                autofillHints: const [AutofillHints.newPassword],
                decoration: InputDecoration(labelText: context.l10n.newPassword, helperText: context.l10n.commonAtLeast8Chars),
                validator: (v) {
                  if (v == null || v.length < 8) return context.l10n.commonUseAtLeast8Chars;
                  if (v.length > 72) return context.l10n.passwordMax72;
                  if (v == current.text) return context.l10n.passwordChooseDifferent;
                  return null;
                },
              ),
              if (error != null)
                Padding(
                  padding: const EdgeInsets.only(top: 12),
                  child: Text(error!, style: TextStyle(color: Theme.of(ctx).colorScheme.error)),
                ),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: busy ? null : () => Navigator.pop(ctx, false), child: Text(context.l10n.commonCancel)),
          FilledButton(
            onPressed: busy
                ? null
                : () async {
                    if (!formKey.currentState!.validate()) return;
                    setState(() {
                      busy = true;
                      error = null;
                    });
                    try {
                      await ref.read(authServiceProvider).changePassword(current: current.text, next: next.text);
                      if (ctx.mounted) Navigator.pop(ctx, true);
                    } on ApiError catch (e) {
                      setState(() {
                        busy = false;
                        error = e.message;
                      });
                    }
                  },
            child: Text(busy ? context.l10n.commonSaving : context.l10n.commonUpdate),
          ),
        ],
      ),
    ),
  );

  current.dispose();
  next.dispose();
  if (changed == true && context.mounted) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(context.l10n.passwordUpdated)),
    );
  }
}

/// Permanent account deletion (store policy requires this in-app). Requires the password for
/// accounts that have one, plus typing DELETE. Gym owners are told to close their gym on the web.
Future<void> showDeleteAccountDialog(BuildContext context, WidgetRef ref) async {
  final password = TextEditingController();
  final confirm = TextEditingController();
  String? error;
  var busy = false;

  final deleted = await showDialog<bool>(
    context: context,
    barrierDismissible: false,
    builder: (ctx) => StatefulBuilder(
      builder: (ctx, setState) => AlertDialog(
        title: Text(context.l10n.deleteAccountTitle),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(context.l10n.deleteAccountWarning),
              TextField(
                controller: password,
                obscureText: true,
                decoration: InputDecoration(labelText: context.l10n.deleteAccountPasswordLabel),
              ),
              TextField(
                controller: confirm,
                textCapitalization: TextCapitalization.characters,
                decoration: InputDecoration(labelText: context.l10n.deleteAccountTypeConfirm),
                onChanged: (_) => setState(() {}),
              ),
              if (error != null)
                Padding(
                  padding: const EdgeInsets.only(top: 12),
                  child: Text(error!, style: TextStyle(color: Theme.of(ctx).colorScheme.error)),
                ),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: busy ? null : () => Navigator.pop(ctx, false), child: Text(context.l10n.commonCancel)),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Theme.of(ctx).colorScheme.error),
            onPressed: busy || confirm.text.trim().toUpperCase() != 'DELETE'
                ? null
                : () async {
                    setState(() {
                      busy = true;
                      error = null;
                    });
                    final message = await ref.read(authProvider.notifier).deleteAccount(
                          password: password.text.isEmpty ? null : password.text,
                          confirm: confirm.text.trim(),
                        );
                    if (message == null) {
                      if (ctx.mounted) Navigator.pop(ctx, true);
                    } else {
                      setState(() {
                        busy = false;
                        error = message;
                      });
                    }
                  },
            child: Text(busy ? context.l10n.commonDeleting : context.l10n.deleteAccount),
          ),
        ],
      ),
    ),
  );

  password.dispose();
  confirm.dispose();
  if (deleted == true && context.mounted) context.go(RouteNames.login);
}
