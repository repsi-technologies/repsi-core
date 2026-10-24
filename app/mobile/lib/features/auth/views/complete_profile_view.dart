import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../shared/widgets/repsi_avatar_picker.dart';
import '../../../shared/widgets/repsi_button.dart';
import '../../../shared/widgets/repsi_error_banner.dart';
import '../../../shared/widgets/repsi_text_field.dart';
import '../post_sign_in.dart';
import '../providers/auth_provider.dart';
import '../widgets/auth_layout.dart';

class CompleteProfileArgs {
  final String registrationToken;
  final String phone;

  const CompleteProfileArgs({required this.registrationToken, required this.phone});
}

/// Step 3 for a new number: name, email and password create the account (the phone is already
/// verified); an optional photo is uploaded once the account exists. Any gym records that staff
/// created with this phone are linked by the server.
class CompleteProfileView extends ConsumerStatefulWidget {
  final CompleteProfileArgs args;

  const CompleteProfileView({super.key, required this.args});

  @override
  ConsumerState<CompleteProfileView> createState() => _CompleteProfileViewState();
}

class _CompleteProfileViewState extends ConsumerState<CompleteProfileView> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  PickedPhoto? _photo;
  bool _uploadingPhoto = false;

  static final _emailPattern = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    FocusScope.of(context).unfocus();
    HapticFeedback.lightImpact();
    final notifier = ref.read(authProvider.notifier);
    final created = await notifier.completePhoneSignup(
      registrationToken: widget.args.registrationToken,
      fullName: _name.text,
      email: _email.text,
      password: _password.text,
    );
    if (!created || !mounted) return;

    final photo = _photo;
    if (photo != null) {
      setState(() => _uploadingPhoto = true);
      try {
        await notifier.updateAvatar(photo.bytes, photo.filename);
      } catch (_) {
        // The account exists; only the photo is missing. Say so instead of blocking sign-in.
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text("Account created, but your photo didn't upload. You can add it from your profile.")),
          );
        }
      }
      if (!mounted) return;
      setState(() => _uploadingPhoto = false);
    }
    goAfterSignIn(context, ref.read(authProvider));
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    final busy = auth.status == AuthStatus.loading || _uploadingPhoto;
    final error = auth.status == AuthStatus.error ? auth.errorMessage : null;

    return AuthLayout(
      child: Form(
        key: _formKey,
        child: AutofillGroup(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const AuthHeading(
                title: 'Almost there!',
                subtitle: Text('Your number is verified. Add a few details to finish setting up your account.'),
              ),
              const SizedBox(height: AppSpacing.xxl),
              Center(
                child: ListenableBuilder(
                  listenable: _name,
                  builder: (context, _) => RepsiAvatarPicker(
                    name: _name.text,
                    previewBytes: _photo?.bytes,
                    busy: _uploadingPhoto,
                    caption: _photo == null ? 'Add a profile photo (optional)' : 'Tap to change',
                    onPicked: (p) => setState(() => _photo = p),
                    onRemove: () => setState(() => _photo = null),
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.xxl),
              if (error != null) ...[
                RepsiErrorBanner(icon: Icons.info_outline_rounded, message: error),
                const SizedBox(height: AppSpacing.lg),
              ],
              RepsiTextField(
                label: 'Full name',
                hintText: 'As your gym knows you',
                controller: _name,
                textInputAction: TextInputAction.next,
                textCapitalization: TextCapitalization.words,
                autofillHints: const [AutofillHints.name],
                prefixIcon: const Icon(Icons.person_outline_rounded, size: 20),
                validator: (v) => (v ?? '').trim().length < 2 ? 'Enter your full name' : null,
              ),
              const SizedBox(height: AppSpacing.lg),
              RepsiTextField(
                label: 'Email',
                hintText: 'name@example.com',
                controller: _email,
                keyboardType: TextInputType.emailAddress,
                textInputAction: TextInputAction.next,
                autofillHints: const [AutofillHints.email],
                prefixIcon: const Icon(Icons.mail_outline_rounded, size: 20),
                validator: (v) => _emailPattern.hasMatch((v ?? '').trim()) ? null : 'Enter a valid email address',
              ),
              const SizedBox(height: AppSpacing.lg),
              RepsiTextField(
                label: 'Password',
                hintText: 'At least 8 characters',
                controller: _password,
                isPassword: true,
                textInputAction: TextInputAction.done,
                autofillHints: const [AutofillHints.newPassword],
                prefixIcon: const Icon(Icons.lock_outline_rounded, size: 20),
                onSubmitted: (_) => _submit(),
                validator: (v) => (v ?? '').length < 8 ? 'Use at least 8 characters' : null,
              ),
              const SizedBox(height: AppSpacing.xxl),
              RepsiButton(
                text: _uploadingPhoto ? 'Uploading photo…' : 'Continue',
                isFullWidth: true,
                isLoading: busy,
                onPressed: busy ? null : _submit,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
