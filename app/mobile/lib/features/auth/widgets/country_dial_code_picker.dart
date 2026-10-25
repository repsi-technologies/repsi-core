import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/repsi_palette.dart';
import '../../../shared/widgets/repsi_search_field.dart';

class CountryInfo {
  final String code; // ISO alpha-2, e.g. 'IN', 'US'
  final String dialCode; // e.g. '+91', '+1'
  final String name;
  final String flag;
  final int minLength;
  final int maxLength;
  final String sample;

  const CountryInfo({
    required this.code,
    required this.dialCode,
    required this.name,
    required this.flag,
    this.minLength = 6,
    this.maxLength = 15,
    this.sample = '98765 43210',
  });
}

const List<CountryInfo> kSupportedCountries = [
  CountryInfo(code: 'IN', dialCode: '+91', name: 'India', flag: '🇮🇳', minLength: 10, maxLength: 10, sample: '98765 43210'),
  CountryInfo(code: 'AE', dialCode: '+971', name: 'United Arab Emirates', flag: '🇦🇪', minLength: 9, maxLength: 9, sample: '50 123 4567'),
  CountryInfo(code: 'US', dialCode: '+1', name: 'United States', flag: '🇺🇸', minLength: 10, maxLength: 10, sample: '555 123 4567'),
  CountryInfo(code: 'GB', dialCode: '+44', name: 'United Kingdom', flag: '🇬🇧', minLength: 10, maxLength: 10, sample: '7911 123456'),
  CountryInfo(code: 'SG', dialCode: '+65', name: 'Singapore', flag: '🇸🇬', minLength: 8, maxLength: 8, sample: '8123 4567'),
  CountryInfo(code: 'SA', dialCode: '+966', name: 'Saudi Arabia', flag: '🇸🇦', minLength: 9, maxLength: 9, sample: '50 123 4567'),
  CountryInfo(code: 'AU', dialCode: '+61', name: 'Australia', flag: '🇦🇺', minLength: 9, maxLength: 9, sample: '412 345 678'),
  CountryInfo(code: 'CA', dialCode: '+1', name: 'Canada', flag: '🇨🇦', minLength: 10, maxLength: 10, sample: '555 123 4567'),
  CountryInfo(code: 'KW', dialCode: '+965', name: 'Kuwait', flag: '🇰🇼', minLength: 8, maxLength: 8, sample: '5123 4567'),
  CountryInfo(code: 'QA', dialCode: '+974', name: 'Qatar', flag: '🇶🇦', minLength: 8, maxLength: 8, sample: '3312 3456'),
  CountryInfo(code: 'OM', dialCode: '+968', name: 'Oman', flag: '🇴🇲', minLength: 8, maxLength: 8, sample: '9123 4567'),
  CountryInfo(code: 'BH', dialCode: '+973', name: 'Bahrain', flag: '🇧🇭', minLength: 8, maxLength: 8, sample: '3612 3456'),
  CountryInfo(code: 'MY', dialCode: '+60', name: 'Malaysia', flag: '🇲🇾', minLength: 9, maxLength: 10, sample: '12 345 6789'),
  CountryInfo(code: 'DE', dialCode: '+49', name: 'Germany', flag: '🇩🇪', minLength: 10, maxLength: 11, sample: '151 12345678'),
  CountryInfo(code: 'FR', dialCode: '+33', name: 'France', flag: '🇫🇷', minLength: 9, maxLength: 9, sample: '6 12 34 56 78'),
  CountryInfo(code: 'ZA', dialCode: '+27', name: 'South Africa', flag: '🇿🇦', minLength: 9, maxLength: 9, sample: '71 123 4567'),
  CountryInfo(code: 'NZ', dialCode: '+64', name: 'New Zealand', flag: '🇳🇿', minLength: 8, maxLength: 10, sample: '21 123 4567'),
  CountryInfo(code: 'LK', dialCode: '+94', name: 'Sri Lanka', flag: '🇱🇰', minLength: 9, maxLength: 9, sample: '71 234 5678'),
  CountryInfo(code: 'BD', dialCode: '+880', name: 'Bangladesh', flag: '🇧🇩', minLength: 10, maxLength: 10, sample: '1712 345678'),
  CountryInfo(code: 'NP', dialCode: '+977', name: 'Nepal', flag: '🇳🇵', minLength: 10, maxLength: 10, sample: '984 1234567'),
  CountryInfo(code: 'PH', dialCode: '+63', name: 'Philippines', flag: '🇵🇭', minLength: 10, maxLength: 10, sample: '917 123 4567'),
  CountryInfo(code: 'ID', dialCode: '+62', name: 'Indonesia', flag: '🇮🇩', minLength: 9, maxLength: 12, sample: '812 3456 789'),
  CountryInfo(code: 'IE', dialCode: '+353', name: 'Ireland', flag: '🇮🇪', minLength: 9, maxLength: 9, sample: '83 123 4567'),
  CountryInfo(code: 'JP', dialCode: '+81', name: 'Japan', flag: '🇯🇵', minLength: 10, maxLength: 10, sample: '90 1234 5678'),
];

/// Clickable dial code prefix with flag and chevron that opens a country picker sheet.
class CountryDialCodePicker extends StatelessWidget {
  final CountryInfo selected;
  final ValueChanged<CountryInfo> onSelect;
  final bool enabled;

  const CountryDialCodePicker({
    super.key,
    required this.selected,
    required this.onSelect,
    this.enabled = true,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? AppColors.darkText : context.palette.text;

    return InkWell(
      onTap: enabled
          ? () {
              HapticFeedback.selectionClick();
              CountrySelectorSheet.show(
                context,
                selected: selected,
                onSelect: onSelect,
              );
            }
          : null,
      borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
      child: Padding(
        padding: const EdgeInsets.only(left: 12, right: 8),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              selected.flag,
              style: const TextStyle(fontSize: 18),
            ),
            const SizedBox(width: 6),
            Text(
              selected.dialCode,
              style: AppTypography.body.copyWith(
                fontWeight: FontWeight.w600,
                color: textColor,
                fontFeatures: const [FontFeature.tabularFigures()],
              ),
            ),
            const SizedBox(width: 2),
            Icon(
              Icons.arrow_drop_down_rounded,
              size: 20,
              color: isDark ? AppColors.darkTextSecondary : context.palette.textSecondary,
            ),
            const SizedBox(width: 6),
            Container(
              width: 1,
              height: 22,
              color: isDark ? AppColors.darkBorder : context.palette.border,
            ),
          ],
        ),
      ),
    );
  }
}

/// Searchable sheet to choose country code.
class CountrySelectorSheet extends StatefulWidget {
  final CountryInfo selected;
  final ValueChanged<CountryInfo> onSelect;

  const CountrySelectorSheet({
    super.key,
    required this.selected,
    required this.onSelect,
  });

  static Future<void> show(
    BuildContext context, {
    required CountryInfo selected,
    required ValueChanged<CountryInfo> onSelect,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: isDark ? AppColors.darkSurface : context.palette.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => CountrySelectorSheet(
        selected: selected,
        onSelect: onSelect,
      ),
    );
  }

  @override
  State<CountrySelectorSheet> createState() => _CountrySelectorSheetState();
}

class _CountrySelectorSheetState extends State<CountrySelectorSheet> {
  String _query = '';

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? AppColors.darkText : context.palette.text;
    final secondary = isDark ? AppColors.darkTextSecondary : context.palette.textSecondary;

    final q = _query.trim().toLowerCase();
    final filtered = kSupportedCountries.where((c) {
      if (q.isEmpty) return true;
      return c.name.toLowerCase().contains(q) ||
          c.dialCode.contains(q) ||
          c.code.toLowerCase().contains(q);
    }).toList();

    return SafeArea(
      child: ConstrainedBox(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.75,
        ),
        child: Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 12, 12),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Select Country Code',
                        style: AppTypography.headingSmall.copyWith(
                          fontWeight: FontWeight.w700,
                          color: textColor,
                        ),
                      ),
                    ),
                    IconButton(
                      icon: Icon(Icons.close_rounded, color: secondary),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: RepsiSearchField(
                  hintText: 'Search country or code (+91, UAE...)',
                  onChanged: (val) => setState(() => _query = val),
                ),
              ),
              const SizedBox(height: 8),
              Flexible(
                child: ListView.separated(
                  shrinkWrap: true,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  itemCount: filtered.length,
                  separatorBuilder: (_, __) => Divider(
                    height: 1,
                    color: isDark ? AppColors.darkBorder : context.palette.border,
                  ),
                  itemBuilder: (ctx, index) {
                    final item = filtered[index];
                    final isSelected = item.code == widget.selected.code;
                    return InkWell(
                      borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
                      onTap: () {
                        HapticFeedback.lightImpact();
                        widget.onSelect(item);
                        Navigator.pop(ctx);
                      },
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
                        child: Row(
                          children: [
                            Text(item.flag, style: const TextStyle(fontSize: 22)),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Text(
                                item.name,
                                style: AppTypography.body.copyWith(
                                  color: textColor,
                                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w400,
                                ),
                              ),
                            ),
                            Text(
                              item.dialCode,
                              style: AppTypography.bodySmall.copyWith(
                                color: secondary,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            if (isSelected) ...[
                              const SizedBox(width: 10),
                              Icon(
                                Icons.check_rounded,
                                size: 18,
                                color: context.palette.primaryDark,
                              ),
                            ],
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
