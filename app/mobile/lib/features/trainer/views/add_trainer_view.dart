import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../core/api/api_error.dart';
import '../../../core/providers/api_provider.dart';
import '../../../shared/widgets/repsi_button.dart';
import '../../../shared/widgets/repsi_text_field.dart';
import '../../operations/providers/operations_provider.dart';

class AddTrainerView extends ConsumerStatefulWidget {
  const AddTrainerView({super.key});

  @override
  ConsumerState<AddTrainerView> createState() => _AddTrainerViewState();
}

class _AddTrainerViewState extends ConsumerState<AddTrainerView> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _bioController = TextEditingController();
  final _hourlyRateController = TextEditingController();

  String _selectedSpecialization = 'Strength & Conditioning';
  bool _isLoading = false;

  final List<String> _specializations = [
    'Strength & Conditioning',
    'Personal Training',
    'HIIT & Functional',
    'CrossFit',
    'Yoga & Mobility',
    'Rehabilitation',
    'General Fitness',
  ];

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _bioController.dispose();
    _hourlyRateController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);

    final data = <String, dynamic>{
      'name': _nameController.text.trim(),
      'phone': _phoneController.text.trim(),
      if (_emailController.text.trim().isNotEmpty) 'email': _emailController.text.trim(),
      'specialization': _selectedSpecialization,
      if (_hourlyRateController.text.trim().isNotEmpty)
        'hourly_rate': double.tryParse(_hourlyRateController.text.trim()) ?? 0.0,
      if (_bioController.text.trim().isNotEmpty) 'bio': _bioController.text.trim(),
    };

    try {
      await ref.read(apiClientProvider).post('/trainers', data: data);
      ref.invalidate(teamProvider);
      if (mounted) {
        setState(() => _isLoading = false);
        context.pop(true);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Trainer added successfully!')),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        final msg = e is ApiError ? e.message : 'Failed to add trainer. Please check details.';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(msg)),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text(
          'Add New Trainer',
          style: AppTypography.headingSmall.copyWith(
            color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
          ),
        ),
        leading: IconButton(
          icon: Icon(
            LucideIcons.arrowLeft,
            color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
          ),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                RepsiTextField(
                  label: 'Full Name *',
                  hintText: 'e.g. Vikram Rathore',
                  controller: _nameController,
                  prefixIcon: const Icon(LucideIcons.user, size: 18),
                  validator: (val) =>
                      val == null || val.trim().length < 2 ? 'Trainer name is required' : null,
                ),
                const SizedBox(height: AppSpacing.md),
                RepsiTextField(
                  label: 'Mobile Number *',
                  hintText: '+91 98765 43210',
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  prefixIcon: const Icon(LucideIcons.phone, size: 18),
                  validator: (val) {
                    if (val == null || val.trim().isEmpty) return 'Mobile number is required';
                    if (val.replaceAll(RegExp(r'\D'), '').length < 8) {
                      return 'Enter a valid mobile number';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: AppSpacing.md),
                RepsiTextField(
                  label: 'Email Address (Optional)',
                  hintText: 'trainer@example.com',
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  prefixIcon: const Icon(LucideIcons.mail, size: 18),
                  validator: (val) {
                    if (val != null && val.trim().isNotEmpty && !val.contains('@')) {
                      return 'Enter a valid email address';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: AppSpacing.lg),
                Text(
                  'Specialization / Track',
                  style: AppTypography.labelMedium.copyWith(
                    color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: AppSpacing.xs),
                Wrap(
                  spacing: AppSpacing.sm,
                  runSpacing: AppSpacing.xs,
                  children: _specializations.map((spec) {
                    final isSelected = _selectedSpecialization == spec;
                    return ChoiceChip(
                      label: Text(spec),
                      selected: isSelected,
                      onSelected: (selected) {
                        if (selected) setState(() => _selectedSpecialization = spec);
                      },
                      selectedColor: AppColors.primarySoft,
                      backgroundColor: isDark ? AppColors.darkSurface : AppColors.surface,
                      labelStyle: TextStyle(
                        color: isSelected
                            ? AppColors.primary
                            : (isDark ? AppColors.darkTextPrimary : AppColors.textPrimary),
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                        fontSize: 12,
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: AppSpacing.md),
                RepsiTextField(
                  label: 'Hourly Rate (₹) (Optional)',
                  hintText: 'e.g. 800',
                  controller: _hourlyRateController,
                  keyboardType: TextInputType.number,
                  prefixIcon: const Icon(LucideIcons.indianRupee, size: 18),
                ),
                const SizedBox(height: AppSpacing.md),
                RepsiTextField(
                  label: 'Bio / Experience (Optional)',
                  hintText: 'e.g. Certified ACE Trainer with 5+ years experience...',
                  controller: _bioController,
                  maxLines: 3,
                  prefixIcon: const Icon(LucideIcons.fileText, size: 18),
                ),
                const SizedBox(height: AppSpacing.xl),
                RepsiButton(
                  text: 'Save & Onboard Trainer',
                  isLoading: _isLoading,
                  isFullWidth: true,
                  onPressed: _handleSubmit,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
