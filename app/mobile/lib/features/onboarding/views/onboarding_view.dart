import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../../../app/routes/route_names.dart';
import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../shared/widgets/repsi_white_logo.dart';
import '../../../l10n/l10n.dart';
import '../../../shared/widgets/language_selector_sheet.dart';

/// Three-step introduction on the ink canvas. Each slide shows a small preview of the real
/// product (drawn in Flutter, so it stays crisp and on-brand) instead of stock imagery.
class OnboardingView extends StatefulWidget {
  const OnboardingView({super.key});

  @override
  State<OnboardingView> createState() => _OnboardingViewState();
}

class _OnboardingViewState extends State<OnboardingView> {
  final PageController _pageController = PageController();
  int _page = 0;

  List<_Slide> get _slides {
    final l = context.l10n;
    return [
      _Slide(lead: '${l.onboarding1Lead}\n', accent: l.onboarding1Accent, body: l.onboarding1Body, preview: const _PassPreview()),
      _Slide(lead: '${l.onboarding2Lead}\n', accent: l.onboarding2Accent, tail: ' ${l.onboarding2Tail}', body: l.onboarding2Body, preview: const _MembersPreview()),
      _Slide(lead: '${l.onboarding3Lead}\n', accent: l.onboarding3Accent, body: l.onboarding3Body, preview: const _InsightsPreview()),
    ];
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  bool get _reduceMotion => MediaQuery.maybeDisableAnimationsOf(context) ?? false;

  void _finish() => context.go(RouteNames.login);

  void _goTo(int page) {
    HapticFeedback.selectionClick();
    if (_reduceMotion) {
      _pageController.jumpToPage(page);
    } else {
      _pageController.animateToPage(page, duration: const Duration(milliseconds: 320), curve: Curves.easeOutCubic);
    }
  }

  void _next() => _page < _slides.length - 1 ? _goTo(_page + 1) : _finish();

  @override
  Widget build(BuildContext context) {
    final isLast = _page == _slides.length - 1;
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light.copyWith(
        statusBarColor: Colors.transparent,
        systemNavigationBarColor: AppColors.ink,
      ),
      child: Scaffold(
        backgroundColor: AppColors.ink,
        body: SafeArea(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(AppSpacing.xxl, AppSpacing.sm, AppSpacing.sm, 0),
                child: SizedBox(
                  height: 48,
                  child: Row(
                    children: [
                      const RepsiWhiteLogo(height: 34),
                      const Spacer(),
                      const LanguageButton(color: AppColors.inkText),
                      if (!isLast)
                        TextButton(
                          onPressed: _finish,
                          style:
                              TextButton.styleFrom(foregroundColor: AppColors.inkText, minimumSize: const Size(56, 44)),
                          child: Text(context.l10n.skip, style: AppTypography.button.copyWith(color: AppColors.inkTextSecondary)),
                        ),
                    ],
                  ),
                ),
              ),
              Expanded(
                child: PageView.builder(
                  controller: _pageController,
                  itemCount: _slides.length,
                  onPageChanged: (i) => setState(() => _page = i),
                  itemBuilder: (context, i) => _SlidePage(slide: _slides[i], index: i, count: _slides.length),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(AppSpacing.xxl, AppSpacing.lg, AppSpacing.xxl, AppSpacing.xxl),
                child: SizedBox(
                  height: 56,
                  child: Row(
                    children: [
                      AnimatedSwitcher(
                        duration: const Duration(milliseconds: 180),
                        child: _page == 0
                            ? const SizedBox(width: 0)
                            : Padding(
                                padding: const EdgeInsets.only(right: AppSpacing.lg),
                                child: _RoundButton(
                                  tooltip: context.l10n.commonBack,
                                  icon: Icons.arrow_back_rounded,
                                  filled: false,
                                  onPressed: () => _goTo(_page - 1),
                                ),
                              ),
                      ),
                      Expanded(
                        child: AnimatedSwitcher(
                          duration: const Duration(milliseconds: 220),
                          layoutBuilder: (current, previous) => Stack(
                            alignment: Alignment.centerRight,
                            children: [...previous, if (current != null) current],
                          ),
                          transitionBuilder: (child, anim) => FadeTransition(opacity: anim, child: child),
                          child: isLast
                              ? FilledButton.icon(
                                  key: const ValueKey('start'),
                                  onPressed: _finish,
                                  iconAlignment: IconAlignment.end,
                                  icon: const Icon(Icons.arrow_forward_rounded, size: 20),
                                  label: Text(context.l10n.getStarted, maxLines: 1, overflow: TextOverflow.ellipsis),
                                  style: FilledButton.styleFrom(
                                    backgroundColor: AppColors.primary,
                                    foregroundColor: Colors.white,
                                    minimumSize: const Size(0, 56),
                                    padding: const EdgeInsets.symmetric(horizontal: 24),
                                    textStyle: AppTypography.buttonLarge,
                                    shape: const StadiumBorder(),
                                  ),
                                )
                              : _RoundButton(
                                  key: const ValueKey('next'),
                                  tooltip: context.l10n.next,
                                  icon: Icons.arrow_forward_rounded,
                                  filled: true,
                                  onPressed: _next,
                                ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Slide {
  final String lead;
  final String accent;
  final String tail;
  final String body;
  final Widget preview;

  const _Slide({required this.lead, required this.accent, this.tail = '', required this.body, required this.preview});
}

class _SlidePage extends StatelessWidget {
  final _Slide slide;
  final int index;
  final int count;

  const _SlidePage({required this.slide, required this.index, required this.count});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final copy = Padding(
          padding: const EdgeInsets.fromLTRB(AppSpacing.xxl, AppSpacing.sm, AppSpacing.xxl, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              _Progress(count: count, index: index),
              const SizedBox(height: AppSpacing.xl),
              Semantics(
                header: true,
                child: Text.rich(
                  TextSpan(children: [
                    TextSpan(text: slide.lead),
                    TextSpan(text: slide.accent, style: const TextStyle(color: AppColors.primaryBright)),
                    TextSpan(text: slide.tail),
                  ]),
                  // Indic scripts need taller lines and no negative tracking; their words are longer too.
                  style: AppTypography.display.copyWith(
                    fontSize: (constraints.maxHeight < 460 ? 28 : 34) - (AppTypography.isIndic ? 6 : 0),
                    height: AppTypography.isIndic ? 1.4 : 1.1,
                    fontWeight: FontWeight.w700,
                    letterSpacing: AppTypography.isIndic ? 0 : -1.0,
                    color: AppColors.inkText,
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              Text(slide.body, style: AppTypography.body.copyWith(color: AppColors.inkTextSecondary)),
            ],
          ),
        );

        // Very short screens (or very large text): a fixed, smaller preview and a scrolling page.
        if (constraints.maxHeight < 440) {
          return SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [SizedBox(height: 170, child: _PreviewStage(preview: slide.preview)), copy],
            ),
          );
        }
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [Expanded(child: _PreviewStage(preview: slide.preview)), copy],
        );
      },
    );
  }
}

/// The preview on a soft glow, faded into the canvas at the bottom like a photo bleeding off the page.
class _PreviewStage extends StatelessWidget {
  final Widget preview;

  const _PreviewStage({required this.preview});

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        const DecoratedBox(
          decoration: BoxDecoration(
            gradient: RadialGradient(
              center: Alignment(0.2, 0.1),
              radius: 0.75,
              colors: [Color(0x33E25822), Color(0x00101114)],
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(AppSpacing.xxl, AppSpacing.xl, AppSpacing.xxl, AppSpacing.xxl),
          // Sample data in an illustration: hidden from screen readers, and scaled as a whole
          // rather than by the system text size.
          child: ExcludeSemantics(
            child: MediaQuery.withNoTextScaling(
              child: FittedBox(fit: BoxFit.contain, child: preview),
            ),
          ),
        ),
        const Positioned(
          left: 0,
          right: 0,
          bottom: 0,
          height: 40,
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Color(0x00101114), AppColors.ink],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _Progress extends StatelessWidget {
  final int count;
  final int index;

  const _Progress({required this.count, required this.index});

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: context.l10n.onboardingStep(index + 1, count),
      child: Row(
        children: [
          for (var i = 0; i < count; i++)
            AnimatedContainer(
              duration: const Duration(milliseconds: 240),
              curve: Curves.easeOutCubic,
              margin: const EdgeInsets.only(right: 6),
              width: i == index ? 28 : 12,
              height: 4,
              decoration: BoxDecoration(
                color: i <= index ? AppColors.primaryBright : AppColors.inkBorder,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
        ],
      ),
    );
  }
}

class _RoundButton extends StatelessWidget {
  final String tooltip;
  final IconData icon;
  final bool filled;
  final VoidCallback onPressed;

  const _RoundButton(
      {super.key, required this.tooltip, required this.icon, required this.filled, required this.onPressed});

  @override
  Widget build(BuildContext context) {
    return IconButton(
      tooltip: tooltip,
      onPressed: onPressed,
      style: IconButton.styleFrom(
        fixedSize: const Size.square(56),
        backgroundColor: filled ? AppColors.primary : Colors.transparent,
        foregroundColor: filled ? Colors.white : AppColors.inkText,
        side: filled ? null : const BorderSide(color: AppColors.inkBorder),
      ),
      icon: Icon(icon, size: 22),
    );
  }
}

// ─── Product previews ────────────────────────────────────────────────────────
// Fixed-size compositions scaled by FittedBox. Numbers and names are illustrative only.

const _previewWidth = 320.0;

TextStyle _t(double size, FontWeight weight, Color color) =>
    AppTypography.body.copyWith(fontSize: size, fontWeight: weight, color: color, height: 1.25);

class _PreviewCard extends StatelessWidget {
  final Widget child;
  final EdgeInsets padding;

  const _PreviewCard({required this.child, this.padding = const EdgeInsets.all(16)});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: _previewWidth,
      padding: padding,
      decoration: BoxDecoration(
        color: AppColors.inkSurface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.inkBorder),
        boxShadow: const [BoxShadow(color: Color(0x66000000), blurRadius: 40, offset: Offset(0, 24))],
      ),
      child: child,
    );
  }
}

class _Chip extends StatelessWidget {
  final String label;
  final Color color;
  final IconData? icon;

  const _Chip(this.label, this.color, {this.icon});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.14), borderRadius: BorderRadius.circular(6)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[Icon(icon, size: 12, color: color), const SizedBox(width: 4)],
          Text(label, style: _t(11, FontWeight.w600, color)),
        ],
      ),
    );
  }
}

class _Initials extends StatelessWidget {
  final String text;
  final Color tint;

  const _Initials(this.text, this.tint);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 36,
      height: 36,
      alignment: Alignment.center,
      decoration: BoxDecoration(shape: BoxShape.circle, color: tint.withValues(alpha: 0.18)),
      child: Text(text, style: _t(13, FontWeight.w600, tint)),
    );
  }
}

/// Slide 1: a member's gym pass with a check-in confirmation.
class _PassPreview extends StatelessWidget {
  const _PassPreview();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: _previewWidth + 20,
      height: 340,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Positioned(
            left: 10,
            top: 0,
            child: _PreviewCard(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(context.l10n.gymPass, style: _t(13, FontWeight.w600, AppColors.inkTextSecondary)),
                      const Spacer(),
                      _Chip(context.l10n.commonActive, Color(0xFF34D399), icon: Icons.check_circle_rounded),
                    ],
                  ),
                  const SizedBox(height: 18),
                  Center(
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
                      child: const SizedBox.square(dimension: 132, child: CustomPaint(painter: _QrPainter())),
                    ),
                  ),
                  const SizedBox(height: 18),
                  Text('Priya Sharma', style: _t(18, FontWeight.w700, AppColors.inkText)),
                  const SizedBox(height: 4),
                  Text('Quarterly plan · valid till 14 Jan',
                      style: _t(13, FontWeight.w400, AppColors.inkTextSecondary)),
                ],
              ),
            ),
          ),
          Positioned(
            right: 0,
            bottom: 8,
            child: Container(
              padding: const EdgeInsets.fromLTRB(10, 10, 14, 10),
              decoration: BoxDecoration(
                color: const Color(0xFF22252B),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.inkBorder),
                boxShadow: const [BoxShadow(color: Color(0x80000000), blurRadius: 24, offset: Offset(0, 12))],
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(9)),
                    child: const Icon(Icons.login_rounded, size: 18, color: Colors.white),
                  ),
                  const SizedBox(width: 10),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(context.l10n.checkedIn, style: _t(13, FontWeight.w600, AppColors.inkText)),
                      Text('6:02 AM · Main branch', style: _t(11, FontWeight.w400, AppColors.inkTextSecondary)),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _QrPainter extends CustomPainter {
  const _QrPainter();

  @override
  void paint(Canvas canvas, Size size) {
    const n = 21;
    final cell = size.width / n;
    final paint = Paint()..color = AppColors.ink;
    bool finder(int x, int y) {
      bool inBox(int ox, int oy) {
        final dx = x - ox, dy = y - oy;
        if (dx < 0 || dy < 0 || dx > 6 || dy > 6) return false;
        return dx == 0 || dy == 0 || dx == 6 || dy == 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4);
      }

      return inBox(0, 0) || inBox(n - 7, 0) || inBox(0, n - 7);
    }

    bool reserved(int x, int y) => (x < 8 && y < 8) || (x >= n - 8 && y < 8) || (x < 8 && y >= n - 8);
    for (var y = 0; y < n; y++) {
      for (var x = 0; x < n; x++) {
        final on = reserved(x, y) ? finder(x, y) : (((x * 73856093) ^ (y * 19349663) ^ (x * y * 83492791)) & 0xff) < 112;
        if (on) canvas.drawRect(Rect.fromLTWH(x * cell, y * cell, cell + 0.4, cell + 0.4), paint);
      }
    }
  }

  @override
  bool shouldRepaint(_QrPainter old) => false;
}

/// Slide 2: the member list with plan and status at a glance.
class _MembersPreview extends StatelessWidget {
  const _MembersPreview();

  static const _rows = [
    ('AK', 'Arjun Kumar', 'Monthly · 21 days left', 'Active', Color(0xFF34D399), Color(0xFF60A5FA)),
    ('NS', 'Neha Singh', 'Quarterly · ends Friday', 'Expiring', Color(0xFFFACC15), Color(0xFFF472B6)),
    ('RV', 'Rahul Verma', 'Annual · ₹1,500 due', 'Payment due', Color(0xFFFF8A4C), Color(0xFFA78BFA)),
    ('SM', 'Sana Mirza', 'Monthly · 9 days left', 'Active', Color(0xFF34D399), Color(0xFF2DD4BF)),
  ];

  @override
  Widget build(BuildContext context) {
    return _PreviewCard(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              Text(context.l10n.commonMembers, style: _t(17, FontWeight.w700, AppColors.inkText)),
              const SizedBox(width: 8),
              Text('642', style: _t(13, FontWeight.w500, AppColors.inkTextSecondary)),
              const Spacer(),
              Container(
                width: 30,
                height: 30,
                decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(8)),
                child: const Icon(Icons.add_rounded, size: 18, color: Colors.white),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            height: 38,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              color: AppColors.ink,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppColors.inkBorder),
            ),
            child: Row(
              children: [
                const Icon(Icons.search_rounded, size: 16, color: AppColors.inkTextSecondary),
                const SizedBox(width: 8),
                Flexible(
                  child: Text(context.l10n.searchNameOrPhone,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: _t(12, FontWeight.w400, AppColors.inkTextSecondary)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 4),
          for (final (initials, name, plan, status, statusColor, tint) in _rows)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 11),
              decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: AppColors.inkBorder))),
              child: Row(
                children: [
                  _Initials(initials, tint),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(name, style: _t(14, FontWeight.w600, AppColors.inkText)),
                        const SizedBox(height: 2),
                        Text(plan, style: _t(12, FontWeight.w400, AppColors.inkTextSecondary)),
                      ],
                    ),
                  ),
                  _Chip(status, statusColor),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

/// Slide 3: the owner dashboard with key numbers and a week of check-ins.
class _InsightsPreview extends StatelessWidget {
  const _InsightsPreview();

  static const _week = [0.46, 0.62, 0.55, 0.78, 0.7, 0.92, 0.38];
  static const _days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  Widget _metric(String label, String value, String delta, {bool up = true}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: _t(12, FontWeight.w500, AppColors.inkTextSecondary)),
        const SizedBox(height: 6),
        Text(
          value,
          style: _t(22, FontWeight.w700, AppColors.inkText)
              .copyWith(fontFeatures: const [FontFeature.tabularFigures()], letterSpacing: -0.4),
        ),
        const SizedBox(height: 4),
        Row(
          children: [
            Icon(up ? Icons.arrow_upward_rounded : Icons.arrow_downward_rounded,
                size: 12, color: up ? const Color(0xFF34D399) : const Color(0xFFFACC15)),
            const SizedBox(width: 2),
            Flexible(
              child: Text(
                delta,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: _t(11, FontWeight.w500, up ? const Color(0xFF34D399) : const Color(0xFFFACC15)),
              ),
            ),
          ],
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return _PreviewCard(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              Text(context.l10n.dashboard, style: _t(17, FontWeight.w700, AppColors.inkText)),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                    border: Border.all(color: AppColors.inkBorder), borderRadius: BorderRadius.circular(6)),
                child: Text(context.l10n.commonThisWeek, style: _t(11, FontWeight.w500, AppColors.inkTextSecondary)),
              ),
            ],
          ),
          const SizedBox(height: 18),
          Row(
            children: [
              Expanded(child: _metric(context.l10n.checkIns, '1,284', '12% vs last week')),
              Container(width: 1, height: 64, color: AppColors.inkBorder),
              const SizedBox(width: 16),
              Expanded(child: _metric(context.l10n.revenue, '₹84,200', '8% vs last week')),
            ],
          ),
          const SizedBox(height: 16),
          const Divider(color: AppColors.inkBorder, height: 1),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(child: _metric(context.l10n.activeMembers, '642', '18 joined')),
              Container(width: 1, height: 64, color: AppColors.inkBorder),
              const SizedBox(width: 16),
              Expanded(child: _metric(context.l10n.renewalsDue, '23', 'next 7 days', up: false)),
            ],
          ),
          const SizedBox(height: 20),
          Text(context.l10n.dailyCheckins, style: _t(12, FontWeight.w500, AppColors.inkTextSecondary)),
          const SizedBox(height: 10),
          SizedBox(
            height: 92,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                for (var i = 0; i < _week.length; i++) ...[
                  if (i > 0) const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        Container(
                          height: 70 * _week[i],
                          decoration: BoxDecoration(
                            color: i == 5 ? AppColors.primaryBright : AppColors.primary.withValues(alpha: 0.38),
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(_days[i], style: _t(11, FontWeight.w500, AppColors.inkTextSecondary)),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
