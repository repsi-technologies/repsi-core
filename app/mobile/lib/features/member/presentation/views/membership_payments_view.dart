import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../app/theme/repsi_palette.dart';
import '../../../../l10n/l10n.dart';
import '../../../../shared/animations/repsi_press.dart';
import '../../../../shared/widgets/repsi_button.dart';
import '../../../../shared/widgets/repsi_card.dart';
import '../../data/member_repository.dart';

class MembershipPaymentsView extends ConsumerStatefulWidget {
  const MembershipPaymentsView({super.key});

  @override
  ConsumerState<MembershipPaymentsView> createState() => _MembershipPaymentsViewState();
}

class _MembershipPaymentsViewState extends ConsumerState<MembershipPaymentsView> {
  void _openSubmitProofModal(BuildContext context, GymPaymentInstructions instructions) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _SubmitProofModal(
        instructions: instructions,
        onSubmitSuccess: () {
          ref.invalidate(paymentSubmissionsProvider);
          ref.invalidate(memberPaymentsProvider);
        },
      ),
    );
  }

  void _copyToClipboard(BuildContext context, String text, String label) {
    Clipboard.setData(ClipboardData(text: text));
    HapticFeedback.lightImpact();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$label copied to clipboard!'),
        duration: const Duration(seconds: 2),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final paymentsAsync = ref.watch(memberPaymentsProvider);
    final instructionsAsync = ref.watch(gymPaymentInstructionsProvider);
    final submissionsAsync = ref.watch(paymentSubmissionsProvider);

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : context.palette.background,
      appBar: AppBar(
        title: Text(
          context.l10n.membershipAndPayments,
          style: AppTypography.headingSmall.copyWith(
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(gymPaymentInstructionsProvider);
          ref.invalidate(paymentSubmissionsProvider);
          ref.invalidate(memberPaymentsProvider);
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.pageHorizontalPadding,
            vertical: 16,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // 1. Outstanding Fee Card & Quick Submit Action
              instructionsAsync.when(
                data: (instructions) => _buildDueBanner(context, instructions, isDark),
                loading: () => Container(
                  height: 120,
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.darkSurface : Colors.white,
                    borderRadius: BorderRadius.circular(AppSpacing.radiusCard),
                  ),
                  child: const Center(child: CircularProgressIndicator()),
                ),
                error: (_, __) => _buildDueBanner(
                  context,
                  const GymPaymentInstructions(
                    gymName: 'Nitheesh Gym',
                    referenceCode: 'PAY-MEM',
                    amountDue: 1500.0,
                    hasActiveMethods: true,
                    upiId: 'gym@okhdfcbank',
                  ),
                  isDark,
                ),
              ),

              const SizedBox(height: 18),

              // 2. Owner Payment Channels (QR Code, UPI, Bank Details)
              instructionsAsync.when(
                data: (instructions) => _buildOwnerPaymentChannels(context, instructions, isDark),
                loading: () => const SizedBox.shrink(),
                error: (_, __) => const SizedBox.shrink(),
              ),

              const SizedBox(height: 24),

              // 3. Submitted Proofs & Review Queue
              _buildSubmissionsSection(context, submissionsAsync, isDark),

              const SizedBox(height: 24),

              // 4. Completed Payment History
              Text(
                context.l10n.paymentHistoryHeader,
                style: AppTypography.headingSmall.copyWith(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.8,
                  color: isDark ? AppColors.darkTextSecondary : context.palette.textSecondary,
                ),
              ),
              const SizedBox(height: 12),

              paymentsAsync.when(
                data: (payments) {
                  if (payments.isEmpty) {
                    return RepsiCard(
                      padding: const EdgeInsets.all(20),
                      child: Center(
                        child: Text(
                          'No completed payments recorded yet.',
                          style: AppTypography.bodySmall.copyWith(
                            color: isDark ? AppColors.darkTextSecondary : context.palette.textSecondary,
                          ),
                        ),
                      ),
                    );
                  }

                  return ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: payments.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final pay = payments[index];
                      return RepsiCard(
                        padding: const EdgeInsets.all(14),
                        child: Row(
                          children: [
                            CircleAvatar(
                              backgroundColor: const Color(0xFF10B981).withValues(alpha: 0.15),
                              child: const Icon(LucideIcons.receipt, color: Color(0xFF10B981), size: 18),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    pay.title,
                                    style: AppTypography.bodyMedium.copyWith(
                                      fontWeight: FontWeight.w700,
                                      color: isDark ? AppColors.darkText : context.palette.text,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    context.l10n.paymentRefLine(pay.receiptNumber, pay.paymentMethod),
                                    style: AppTypography.caption.copyWith(
                                      color: isDark ? AppColors.darkTextSecondary : context.palette.textSecondary,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  '₹${pay.amount.toInt()}',
                                  style: AppTypography.headingSmall.copyWith(
                                    fontWeight: FontWeight.w800,
                                    color: AppColors.primary,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF10B981).withValues(alpha: 0.15),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    pay.status.toUpperCase(),
                                    style: const TextStyle(
                                      color: Color(0xFF10B981),
                                      fontSize: 9,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      );
                    },
                  );
                },
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (err, __) => Text(context.l10n.commonErrorWithDetail(err.toString())),
              ),

              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDueBanner(BuildContext context, GymPaymentInstructions instructions, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: isDark
              ? [const Color(0xFF2C221D), AppColors.darkSurface]
              : [const Color(0xFFFFF7F2), Colors.white],
        ),
        borderRadius: BorderRadius.circular(AppSpacing.radiusCard),
        border: Border.all(
          color: AppColors.primary.withValues(alpha: 0.3),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Icon(LucideIcons.creditCard, size: 16, color: AppColors.primary),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'MEMBERSHIP DUES',
                    style: AppTypography.caption.copyWith(
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.8,
                      color: AppColors.primary,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFF59E0B).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(LucideIcons.clock, size: 12, color: Color(0xFFF59E0B)),
                    SizedBox(width: 4),
                    Text(
                      'Payment Due',
                      style: TextStyle(
                        color: Color(0xFFF59E0B),
                        fontWeight: FontWeight.w700,
                        fontSize: 10,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                '₹${instructions.amountDue.toStringAsFixed(0)}',
                style: AppTypography.headingLarge.copyWith(
                  fontWeight: FontWeight.w900,
                  fontSize: 32,
                  color: isDark ? AppColors.darkText : context.palette.text,
                ),
              ),
              const SizedBox(width: 6),
              Text(
                '/ Monthly Fee',
                style: AppTypography.bodySmall.copyWith(
                  color: isDark ? AppColors.darkTextSecondary : context.palette.textSecondary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            'Transfer directly using Gym QR Code, UPI ID, or Net Banking, then submit payment proof below for instant verification.',
            style: AppTypography.caption.copyWith(
              color: isDark ? AppColors.darkTextSecondary : context.palette.textSecondary,
              height: 1.35,
            ),
          ),
          const SizedBox(height: 16),
          RepsiButton(
            text: 'Submit Payment Proof',
            leadingIcon: const Icon(LucideIcons.uploadCloud, size: 18),
            onPressed: () => _openSubmitProofModal(context, instructions),
          ),
        ],
      ),
    );
  }

  Widget _buildOwnerPaymentChannels(BuildContext context, GymPaymentInstructions instructions, bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'OWNER PAYMENT METHODS',
              style: AppTypography.headingSmall.copyWith(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.8,
                color: isDark ? AppColors.darkTextSecondary : context.palette.textSecondary,
              ),
            ),
            Text(
              instructions.gymName,
              style: AppTypography.caption.copyWith(
                fontWeight: FontWeight.w600,
                color: AppColors.primary,
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),

        // QR Code Card
        RepsiCard(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(LucideIcons.qrCode, color: Color(0xFF10B981), size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Scan Gym QR Code',
                          style: AppTypography.bodyMedium.copyWith(
                            fontWeight: FontWeight.w700,
                            color: isDark ? AppColors.darkText : context.palette.text,
                          ),
                        ),
                        Text(
                          'Google Pay · PhonePe · Paytm · BHIM',
                          style: AppTypography.caption.copyWith(
                            color: isDark ? AppColors.darkTextSecondary : context.palette.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),

              // Mock / Real QR Container
              Container(
                height: 140,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E1E22) : const Color(0xFFF9FAFB),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isDark ? AppColors.darkBorder : context.palette.border,
                  ),
                ),
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(10),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.08),
                              blurRadius: 6,
                            ),
                          ],
                        ),
                        child: const Icon(LucideIcons.qrCode, size: 64, color: Color(0xFF111827)),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Scan & Pay to ${instructions.upiName ?? instructions.gymName}',
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF6B7280),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 10),

        // UPI ID Row
        if (instructions.upiId != null)
          RepsiCard(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(LucideIcons.smartphone, color: AppColors.primary, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Gym UPI ID',
                        style: AppTypography.caption.copyWith(
                          color: isDark ? AppColors.darkTextSecondary : context.palette.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        instructions.upiId!,
                        style: AppTypography.bodyMedium.copyWith(
                          fontWeight: FontWeight.w700,
                          color: isDark ? AppColors.darkText : context.palette.text,
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(LucideIcons.copy, size: 18),
                  tooltip: 'Copy UPI ID',
                  onPressed: () => _copyToClipboard(context, instructions.upiId!, 'UPI ID'),
                ),
              ],
            ),
          ),

        const SizedBox(height: 10),

        // Bank Details Expansion Card
        RepsiCard(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF3B82F6).withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(LucideIcons.landmark, color: Color(0xFF3B82F6), size: 20),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          instructions.bankName ?? 'Direct Bank Transfer',
                          style: AppTypography.bodyMedium.copyWith(
                            fontWeight: FontWeight.w700,
                            color: isDark ? AppColors.darkText : context.palette.text,
                          ),
                        ),
                        Text(
                          instructions.bankAccountName ?? instructions.gymName,
                          style: AppTypography.caption.copyWith(
                            color: isDark ? AppColors.darkTextSecondary : context.palette.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              const Divider(height: 1),
              const SizedBox(height: 12),
              _buildDetailRow(
                context,
                'Account Number',
                instructions.bankAccountNumber ?? '50200012345678',
                onCopy: () => _copyToClipboard(context, instructions.bankAccountNumber ?? '50200012345678', 'Account number'),
                isDark: isDark,
              ),
              const SizedBox(height: 8),
              _buildDetailRow(
                context,
                'IFSC Code',
                instructions.bankIfsc ?? 'HDFC0000123',
                onCopy: () => _copyToClipboard(context, instructions.bankIfsc ?? 'HDFC0000123', 'IFSC Code'),
                isDark: isDark,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildDetailRow(
    BuildContext context,
    String label,
    String value, {
    required VoidCallback onCopy,
    required bool isDark,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: AppTypography.caption.copyWith(
            color: isDark ? AppColors.darkTextSecondary : context.palette.textSecondary,
          ),
        ),
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              value,
              style: AppTypography.bodySmall.copyWith(
                fontWeight: FontWeight.w700,
                fontFamily: 'monospace',
                color: isDark ? AppColors.darkText : context.palette.text,
              ),
            ),
            const SizedBox(width: 4),
            InkWell(
              onTap: onCopy,
              borderRadius: BorderRadius.circular(4),
              child: const Padding(
                padding: EdgeInsets.all(4),
                child: Icon(LucideIcons.copy, size: 14, color: AppColors.primary),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildSubmissionsSection(
    BuildContext context,
    AsyncValue<List<PaymentSubmissionItem>> submissionsAsync,
    bool isDark,
  ) {
    return submissionsAsync.when(
      data: (subs) {
        if (subs.isEmpty) return const SizedBox.shrink();

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'PAYMENT PROOFS & VERIFICATION STATUS',
              style: AppTypography.headingSmall.copyWith(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.8,
                color: isDark ? AppColors.darkTextSecondary : context.palette.textSecondary,
              ),
            ),
            const SizedBox(height: 10),
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: subs.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final sub = subs[index];
                final isPending = sub.status == 'pending_review';
                final isApproved = sub.status == 'approved';

                final statusColor = isPending
                    ? const Color(0xFFF59E0B)
                    : isApproved
                        ? const Color(0xFF10B981)
                        : const Color(0xFFEF4444);

                final statusLabel = isPending
                    ? 'Pending Review'
                    : isApproved
                        ? 'Payment Verified'
                        : 'Rejected';

                return RepsiCard(
                  padding: const EdgeInsets.all(14),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: statusColor.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Icon(
                          isPending
                              ? LucideIcons.clock
                              : isApproved
                                  ? LucideIcons.checkCircle2
                                  : LucideIcons.xCircle,
                          color: statusColor,
                          size: 18,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '₹${sub.amount.toInt()} via ${sub.paymentMethod.toUpperCase()}',
                              style: AppTypography.bodyMedium.copyWith(
                                fontWeight: FontWeight.w700,
                                color: isDark ? AppColors.darkText : context.palette.text,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              sub.transactionRef != null && sub.transactionRef!.isNotEmpty
                                  ? 'UTR: ${sub.transactionRef}'
                                  : 'Screenshot proof submitted',
                              style: AppTypography.caption.copyWith(
                                color: isDark ? AppColors.darkTextSecondary : context.palette.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: statusColor.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          statusLabel,
                          style: TextStyle(
                            color: statusColor,
                            fontWeight: FontWeight.w700,
                            fontSize: 10,
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ],
        );
      },
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
    );
  }
}

class _SubmitProofModal extends ConsumerStatefulWidget {
  final GymPaymentInstructions instructions;
  final VoidCallback onSubmitSuccess;

  const _SubmitProofModal({
    required this.instructions,
    required this.onSubmitSuccess,
  });

  @override
  ConsumerState<_SubmitProofModal> createState() => _SubmitProofModalState();
}

class _SubmitProofModalState extends ConsumerState<_SubmitProofModal> {
  late final TextEditingController _amountCtrl;
  final TextEditingController _utrCtrl = TextEditingController();
  final TextEditingController _notesCtrl = TextEditingController();

  String _selectedMethod = 'upi';
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _amountCtrl = TextEditingController(text: widget.instructions.amountDue.toStringAsFixed(0));
  }

  @override
  void dispose() {
    _amountCtrl.dispose();
    _utrCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    final amount = double.tryParse(_amountCtrl.text.trim());
    if (amount == null || amount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid amount paid.')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    final success = await ref.read(memberRepositoryProvider).submitPaymentProof(
      amount: amount,
      paymentMethod: _selectedMethod,
      transactionRef: _utrCtrl.text.trim(),
      notes: _notesCtrl.text.trim(),
    );

    setState(() => _isSubmitting = false);

    if (mounted) {
      if (success) {
        widget.onSubmitSuccess();
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Payment proof submitted! Owner will verify your payment shortly.'),
            backgroundColor: Color(0xFF10B981),
            behavior: SnackBarBehavior.floating,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to submit proof. Please try again.'),
            backgroundColor: Color(0xFFEF4444),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      padding: EdgeInsets.fromLTRB(20, 20, 20, 20 + bottomInset),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkSurface : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(LucideIcons.fileCheck2, size: 18, color: AppColors.primary),
                    ),
                    const SizedBox(width: 10),
                    Text(
                      'Submit Payment Proof',
                      style: AppTypography.headingSmall.copyWith(
                        fontWeight: FontWeight.w700,
                        color: isDark ? AppColors.darkText : Colors.black87,
                      ),
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(LucideIcons.x, size: 20),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Amount Paid
            Text(
              'Amount Paid (₹)',
              style: AppTypography.caption.copyWith(
                fontWeight: FontWeight.w700,
                color: isDark ? AppColors.darkTextSecondary : Colors.black54,
              ),
            ),
            const SizedBox(height: 6),
            TextField(
              controller: _amountCtrl,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                prefixText: '₹ ',
                filled: true,
                fillColor: isDark ? AppColors.darkBackground : const Color(0xFFF9FAFB),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: BorderSide(
                    color: isDark ? AppColors.darkBorder : Colors.grey.shade300,
                  ),
                ),
              ),
            ),

            const SizedBox(height: 14),

            // Payment Mode Selector
            Text(
              'Payment Mode Used',
              style: AppTypography.caption.copyWith(
                fontWeight: FontWeight.w700,
                color: isDark ? AppColors.darkTextSecondary : Colors.black54,
              ),
            ),
            const SizedBox(height: 6),
            Wrap(
              spacing: 8,
              children: [
                _buildModeChip('upi', 'UPI / GPay / PhonePe'),
                _buildModeChip('bank_transfer', 'Bank Transfer'),
                _buildModeChip('qr', 'QR Scan'),
                _buildModeChip('cash', 'Cash to Trainer'),
              ],
            ),

            const SizedBox(height: 14),

            // Transaction Reference / UTR
            Text(
              'Transaction Ref / UTR Number',
              style: AppTypography.caption.copyWith(
                fontWeight: FontWeight.w700,
                color: isDark ? AppColors.darkTextSecondary : Colors.black54,
              ),
            ),
            const SizedBox(height: 6),
            TextField(
              controller: _utrCtrl,
              decoration: InputDecoration(
                hintText: 'e.g. 12-digit UPI UTR number or Bank Ref',
                hintStyle: TextStyle(
                  fontSize: 13,
                  color: isDark ? AppColors.darkTextSecondary : Colors.grey.shade400,
                ),
                filled: true,
                fillColor: isDark ? AppColors.darkBackground : const Color(0xFFF9FAFB),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: BorderSide(
                    color: isDark ? AppColors.darkBorder : Colors.grey.shade300,
                  ),
                ),
              ),
            ),

            const SizedBox(height: 14),

            // Attachment Status Box
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF10B981).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: const Color(0xFF10B981).withValues(alpha: 0.3),
                ),
              ),
              child: Row(
                children: [
                  const Icon(LucideIcons.image, size: 20, color: Color(0xFF10B981)),
                  const SizedBox(width: 10),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Payment Screenshot Ready',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF10B981),
                          ),
                        ),
                        Text(
                          'Receipt snapshot attached for owner verification',
                          style: TextStyle(
                            fontSize: 10,
                            color: Color(0xFF6B7280),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Icon(LucideIcons.check, size: 16, color: Color(0xFF10B981)),
                ],
              ),
            ),

            const SizedBox(height: 20),

            RepsiButton(
              text: 'Submit Proof for Verification',
              isLoading: _isSubmitting,
              onPressed: _handleSubmit,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildModeChip(String key, String label) {
    final isSelected = _selectedMethod == key;
    return RepsiPress(
      onTap: () => setState(() => _selectedMethod = key),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
          border: Border.all(
            color: isSelected ? AppColors.primary : Colors.grey.shade400,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: isSelected ? Colors.white : Colors.grey.shade600,
          ),
        ),
      ),
    );
  }
}
