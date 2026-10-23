import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../../../app/routes/route_names.dart';
import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_typography.dart';
import '../../../shared/widgets/repsi_white_logo.dart';

/// Three-step introduction. Illustrations are drawn in Flutter (no bitmap assets) so they stay
/// crisp on every density and match the brand palette.
class OnboardingView extends StatefulWidget {
  const OnboardingView({super.key});

  @override
  State<OnboardingView> createState() => _OnboardingViewState();
}

class _OnboardingViewState extends State<OnboardingView> {
  static const _ink = Color(0xFF111214);

  final PageController _pageController = PageController();
  int _page = 0;

  static const _slides = [
    _Slide(
      icon: Icons.qr_code_scanner_rounded,
      chipIcon: Icons.check_circle_rounded,
      chip: 'Checked in',
      title: 'Walk in. Scan.\nStart training.',
      body: 'Check in at your gym with a quick QR scan. No cards, no queues at the desk.',
    ),
    _Slide(
      icon: Icons.directions_walk_rounded,
      chipIcon: Icons.sync_rounded,
      chip: 'Synced from Health Connect',
      title: 'Every step\ncounts.',
      body: 'Connect Health Connect to bring in steps, distance and calories from Google Fit and your other fitness apps.',
    ),
    _Slide(
      icon: Icons.card_membership_rounded,
      chipIcon: Icons.event_available_rounded,
      chip: 'Membership active',
      title: 'Your membership,\nalways with you.',
      body: 'See your plan, expiry date, visits and payments in one place.',
    ),
  ];

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _finish() => context.go(RouteNames.login);

  void _next() {
    HapticFeedback.selectionClick();
    if (_page < _slides.length - 1) {
      _pageController.nextPage(duration: const Duration(milliseconds: 350), curve: Curves.easeOutCubic);
    } else {
      _finish();
    }
  }

  @override
  Widget build(BuildContext context) {
    final isLast = _page == _slides.length - 1;
    return Scaffold(
      backgroundColor: _ink,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 8, 12, 0),
              child: Row(
                children: [
                  const RepsiWhiteLogo(height: 34),
                  const Spacer(),
                  AnimatedOpacity(
                    duration: const Duration(milliseconds: 200),
                    opacity: isLast ? 0 : 1,
                    child: TextButton(
                      onPressed: isLast ? null : _finish,
                      child: Text('Skip', style: AppTypography.bodySmall.copyWith(color: Colors.white70, fontWeight: FontWeight.w600)),
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: PageView.builder(
                controller: _pageController,
                itemCount: _slides.length,
                onPageChanged: (i) => setState(() => _page = i),
                itemBuilder: (context, i) => _SlidePage(slide: _slides[i]),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
              child: Row(
                children: [
                  Semantics(
                    label: 'Step ${_page + 1} of ${_slides.length}',
                    child: Row(
                      children: [
                        for (var i = 0; i < _slides.length; i++)
                          AnimatedContainer(
                            duration: const Duration(milliseconds: 250),
                            curve: Curves.easeOutCubic,
                            margin: const EdgeInsets.only(right: 6),
                            width: i == _page ? 26 : 8,
                            height: 8,
                            decoration: BoxDecoration(
                              color: i == _page ? AppColors.primary : Colors.white24,
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ),
                      ],
                    ),
                  ),
                  const Spacer(),
                  SizedBox(
                    height: 54,
                    child: FilledButton(
                      onPressed: _next,
                      style: FilledButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: EdgeInsets.symmetric(horizontal: isLast ? 28 : 20),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(isLast ? 'Get started' : 'Next', style: AppTypography.button.copyWith(color: Colors.white)),
                          const SizedBox(width: 8),
                          const Icon(Icons.arrow_forward_rounded, size: 20),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Slide {
  final IconData icon;
  final IconData chipIcon;
  final String chip;
  final String title;
  final String body;

  const _Slide({required this.icon, required this.chipIcon, required this.chip, required this.title, required this.body});
}

class _SlidePage extends StatelessWidget {
  final _Slide slide;

  const _SlidePage({required this.slide});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        // Short phones (and landscape) get a smaller illustration instead of overflowing.
        final art = (constraints.maxHeight * 0.46).clamp(150.0, 320.0);
        return SingleChildScrollView(
          physics: const ClampingScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: ConstrainedBox(
            constraints: BoxConstraints(minHeight: constraints.maxHeight),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(child: _Illustration(slide: slide, size: art)),
                const SizedBox(height: 32),
                Text(
                  slide.title,
                  style: AppTypography.display.copyWith(
                    fontSize: 32,
                    height: 1.15,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                    letterSpacing: -0.8,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  slide.body,
                  style: AppTypography.body.copyWith(fontSize: 15.5, height: 1.5, color: Colors.white70),
                ),
                const SizedBox(height: 8),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _Illustration extends StatelessWidget {
  final _Slide slide;
  final double size;

  const _Illustration({required this.slide, required this.size});

  @override
  Widget build(BuildContext context) {
    final core = size * 0.46;
    return ExcludeSemantics(
      child: SizedBox(
        width: size,
        height: size,
        child: Stack(
          alignment: Alignment.center,
          children: [
            for (final f in const [1.0, 0.76, 0.52])
              Container(
                width: size * f,
                height: size * f,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.primary.withValues(alpha: 0.10 + (1 - f) * 0.35)),
                  color: AppColors.primary.withValues(alpha: 0.04 + (1 - f) * 0.08),
                ),
              ),
            Container(
              width: core,
              height: core,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(core * 0.3),
                gradient: const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Color(0xFFFF7A3D), AppColors.primary],
                ),
                boxShadow: [BoxShadow(color: AppColors.primary.withValues(alpha: 0.45), blurRadius: 36, offset: const Offset(0, 14))],
              ),
              child: Icon(slide.icon, size: core * 0.52, color: Colors.white),
            ),
            Positioned(
              bottom: size * 0.08,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
                decoration: BoxDecoration(
                  color: const Color(0xFF1C1E22),
                  borderRadius: BorderRadius.circular(30),
                  border: Border.all(color: Colors.white12),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(slide.chipIcon, size: 16, color: AppColors.primary),
                    const SizedBox(width: 6),
                    Text(slide.chip, style: AppTypography.caption.copyWith(color: Colors.white, fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
