import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../shared/animations/repsi_stagger.dart';
import '../../../../shared/widgets/repsi_badge.dart';
import '../../../../shared/widgets/repsi_button.dart';
import '../../../../shared/widgets/repsi_card.dart';

class MemberDocumentItem {
  final String id;
  final String title;
  final String category;
  final String signedDate;
  final bool isSigned;
  final String fileSize;
  final String description;

  const MemberDocumentItem({
    required this.id,
    required this.title,
    required this.category,
    required this.signedDate,
    required this.isSigned,
    required this.fileSize,
    required this.description,
  });

  MemberDocumentItem copyWith({
    bool? isSigned,
    String? signedDate,
  }) {
    return MemberDocumentItem(
      id: id,
      title: title,
      category: category,
      signedDate: signedDate ?? this.signedDate,
      isSigned: isSigned ?? this.isSigned,
      fileSize: fileSize,
      description: description,
    );
  }
}

class MemberDocumentsView extends StatefulWidget {
  const MemberDocumentsView({super.key});

  @override
  State<MemberDocumentsView> createState() => _MemberDocumentsViewState();
}

class _MemberDocumentsViewState extends State<MemberDocumentsView> {
  late List<MemberDocumentItem> _documents;

  @override
  void initState() {
    super.initState();
    _documents = [
      const MemberDocumentItem(
        id: 'doc-1',
        title: 'Gym Membership & Terms Agreement',
        category: 'Legal Contract',
        signedDate: 'Signed on 15 Jan 2026',
        isSigned: true,
        fileSize: '245 KB · PDF',
        description:
            'Standard gym terms of service, payment schedules, code of conduct, and facility access regulations.',
      ),
      const MemberDocumentItem(
        id: 'doc-2',
        title: 'PAR-Q Physical Activity Readiness Questionnaire',
        category: 'Health & Safety',
        signedDate: 'Signed on 15 Jan 2026',
        isSigned: true,
        fileSize: '180 KB · PDF',
        description:
            'Self-guided pre-participation health screening assessing readiness for moderate-to-vigorous physical exercise.',
      ),
      const MemberDocumentItem(
        id: 'doc-3',
        title: 'Personal Training Liability Release & Consent',
        category: 'Training Waiver',
        signedDate: 'Pending Sign-off',
        isSigned: false,
        fileSize: '150 KB · PDF',
        description:
            'Mandatory acknowledgement waiver required prior to commencing 1-on-1 coaching sessions with Coach Alex.',
      ),
      const MemberDocumentItem(
        id: 'doc-4',
        title: 'Locker Rental & Equipment Policy',
        category: 'Facility Rule',
        signedDate: 'Pending Sign-off',
        isSigned: false,
        fileSize: '95 KB · PDF',
        description:
            'Guidelines on digital locker allocation, overnight storage limits, and personal belongings liability.',
      ),
    ];
  }

  void _showSignDialog(MemberDocumentItem doc) {
    bool agreed = false;
    final nameController = TextEditingController(text: 'Rahul Sharma');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setModalState) {
            final isDark = Theme.of(ctx).brightness == Brightness.dark;

            return Container(
              padding: EdgeInsets.only(
                top: 20,
                left: 20,
                right: 20,
                bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
              ),
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkSurface : AppColors.surface,
                borderRadius:
                    const BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 36,
                      height: 4,
                      decoration: BoxDecoration(
                        color: isDark ? AppColors.darkBorder : AppColors.border,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppColors.primarySoft,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(LucideIcons.fileSignature,
                            color: AppColors.primaryDark, size: 20),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Digital Document Sign-Off',
                              style: AppTypography.headingSmall.copyWith(
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            Text(
                              doc.title,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: AppTypography.caption
                                  .copyWith(color: AppColors.textSecondary),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isDark
                          ? AppColors.darkSurfaceElevated
                          : AppColors.surfaceSubtle,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      doc.description,
                      style: AppTypography.caption.copyWith(
                        fontSize: 12,
                        color: isDark
                            ? AppColors.darkTextSecondary
                            : AppColors.textSecondary,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Full Name for Digital Signature',
                    style: AppTypography.caption
                        .copyWith(fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 6),
                  TextField(
                    controller: nameController,
                    decoration: const InputDecoration(
                      hintText: 'Enter your legal full name',
                      prefixIcon: Icon(LucideIcons.user, size: 18),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Checkbox(
                        value: agreed,
                        activeColor: AppColors.primary,
                        onChanged: (val) =>
                            setModalState(() => agreed = val ?? false),
                      ),
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setModalState(() => agreed = !agreed),
                          child: Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: Text(
                              'I have read and agree to all terms stated in this document. This digital signature carries the same legal weight as a handwritten signature.',
                              style: AppTypography.caption.copyWith(
                                fontSize: 11.5,
                                color: isDark
                                    ? AppColors.darkTextSecondary
                                    : AppColors.textSecondary,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),
                  RepsiButton(
                    text: 'Sign & Accept Document',
                    onPressed: (!agreed || nameController.text.trim().isEmpty)
                        ? null
                        : () {
                            HapticFeedback.mediumImpact();
                            Navigator.pop(ctx);
                            setState(() {
                              _documents = _documents.map((d) {
                                if (d.id == doc.id) {
                                  return d.copyWith(
                                    isSigned: true,
                                    signedDate:
                                        'Signed on ${DateTime.now().day}/${DateTime.now().month}/${DateTime.now().year}',
                                  );
                                }
                                return d;
                              }).toList();
                            });
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content:
                                    Text('${doc.title} signed successfully!'),
                                backgroundColor: AppColors.primary,
                              ),
                            );
                          },
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.background,
      appBar: AppBar(
        title: Text(
          'Documents & Waivers',
          style: AppTypography.headingSmall.copyWith(
            fontWeight: FontWeight.w700,
            color: isDark ? AppColors.darkText : AppColors.text,
          ),
        ),
      ),
      body: SafeArea(
        child: ListView.separated(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.pageHorizontalPadding,
            vertical: 16,
          ),
          itemCount: _documents.length,
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemBuilder: (context, index) {
            final doc = _documents[index];

            return RepsiStaggerItem(
              index: index,
              child: RepsiCard(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 42,
                          height: 42,
                          decoration: BoxDecoration(
                            color: doc.isSigned
                                ? AppColors.badgeActiveBg
                                : (isDark
                                    ? AppColors.darkSurfaceElevated
                                    : AppColors.surfaceSubtle),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(
                            doc.isSigned
                                ? LucideIcons.fileCheck2
                                : LucideIcons.fileText,
                            color: doc.isSigned
                                ? AppColors.success
                                : AppColors.textSecondary,
                            size: 22,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                doc.title,
                                style: AppTypography.headingSmall.copyWith(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w700,
                                  color: isDark
                                      ? AppColors.darkText
                                      : AppColors.text,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                '${doc.category} · ${doc.fileSize}',
                                style: AppTypography.caption.copyWith(
                                  fontSize: 11.5,
                                  color: isDark
                                      ? AppColors.darkTextMuted
                                      : AppColors.textMuted,
                                ),
                              ),
                            ],
                          ),
                        ),
                        RepsiBadge(
                          label: doc.isSigned ? 'SIGNED' : 'PENDING',
                          variant: doc.isSigned
                              ? RepsiBadgeVariant.success
                              : RepsiBadgeVariant.warning,
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      doc.description,
                      style: AppTypography.bodySecondary.copyWith(
                        fontSize: 12.5,
                        color: isDark
                            ? AppColors.darkTextSecondary
                            : AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 12),
                    const Divider(height: 1),
                    const SizedBox(height: 10),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          doc.signedDate,
                          style: AppTypography.caption.copyWith(
                            fontSize: 11.5,
                            fontWeight: FontWeight.w600,
                            color: doc.isSigned
                                ? AppColors.success
                                : AppColors.warning,
                          ),
                        ),
                        if (!doc.isSigned)
                          ElevatedButton.icon(
                            onPressed: () => _showSignDialog(doc),
                            icon: const Icon(LucideIcons.penTool, size: 14),
                            label: const Text('Sign Now'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primary,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 14, vertical: 8),
                              minimumSize: Size.zero,
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                          )
                        else
                          OutlinedButton.icon(
                            onPressed: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                    content:
                                        Text('Downloading ${doc.title}...')),
                              );
                            },
                            icon: const Icon(LucideIcons.download, size: 14),
                            label: const Text('Download PDF'),
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 12, vertical: 6),
                              minimumSize: Size.zero,
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                              side: BorderSide(
                                color: isDark
                                    ? AppColors.darkBorder
                                    : AppColors.border,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
