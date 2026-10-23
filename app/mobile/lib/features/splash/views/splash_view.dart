import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../app/routes/route_names.dart';
import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_typography.dart';
import '../../../shared/widgets/repsi_white_logo.dart';
import '../../auth/providers/auth_provider.dart';

/// Brand splash shown while the saved session is restored. It never blocks: a minimum display
/// time keeps the animation from flashing, and a safety timer guarantees we move on.
class SplashView extends ConsumerStatefulWidget {
  const SplashView({super.key});

  @override
  ConsumerState<SplashView> createState() => _SplashViewState();
}

class _SplashViewState extends ConsumerState<SplashView> with SingleTickerProviderStateMixin {
  static const _backdrop = Color(0xFF111214);

  late final AnimationController _controller;
  late final Animation<double> _fade;
  late final Animation<double> _scale;
  late final Animation<double> _taglineFade;

  bool _minTimeElapsed = false;
  bool _hasNavigated = false;
  bool _showSlowHint = false;

  Timer? _minTimer;
  Timer? _slowTimer;
  Timer? _safetyTimer;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 900));
    _fade = CurvedAnimation(parent: _controller, curve: const Interval(0, 0.55, curve: Curves.easeOut));
    _scale = Tween<double>(begin: 0.92, end: 1).animate(
      CurvedAnimation(parent: _controller, curve: const Interval(0, 0.7, curve: Curves.easeOutCubic)),
    );
    _taglineFade = CurvedAnimation(parent: _controller, curve: const Interval(0.45, 1, curve: Curves.easeOut));
    _controller.forward();

    _minTimer = Timer(const Duration(milliseconds: 1100), () {
      _minTimeElapsed = true;
      _navigateIfReady();
    });
    _slowTimer = Timer(const Duration(milliseconds: 3000), () {
      if (mounted && !_hasNavigated) setState(() => _showSlowHint = true);
    });
    _safetyTimer = Timer(const Duration(milliseconds: 5000), _navigate);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    precacheImage(const AssetImage('assets/logos/repsi_reverse_white.png'), context).catchError((_) {});
  }

  void _navigateIfReady() {
    if (!mounted || !_minTimeElapsed) return;
    if (ref.read(authProvider).status == AuthStatus.initial) return;
    _navigate();
  }

  void _navigate() {
    if (_hasNavigated || !mounted) return;
    _hasNavigated = true;
    _minTimer?.cancel();
    _slowTimer?.cancel();
    _safetyTimer?.cancel();

    final auth = ref.read(authProvider);
    if (auth.isAuthenticated) {
      context.go(RouteNames.roleDashboard(auth.user?.role));
    } else {
      context.go(RouteNames.onboarding);
    }
  }

  @override
  void dispose() {
    _minTimer?.cancel();
    _slowTimer?.cancel();
    _safetyTimer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    ref.listen<AuthState>(authProvider, (_, __) => _navigateIfReady());

    return Scaffold(
      backgroundColor: _backdrop,
      body: Stack(
        children: [
          // Soft brand glow behind the mark
          Positioned.fill(
            child: IgnorePointer(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: RadialGradient(
                    center: const Alignment(0, -0.15),
                    radius: 0.9,
                    colors: [AppColors.primary.withValues(alpha: 0.22), _backdrop],
                  ),
                ),
              ),
            ),
          ),
          SafeArea(
            child: Column(
              children: [
                const Spacer(flex: 5),
                Semantics(
                  label: 'Repsi',
                  child: FadeTransition(
                    opacity: _fade,
                    child: ScaleTransition(
                      scale: _scale,
                      // The artwork is white on pure black; screen-blending a backdrop-coloured tint
                      // turns its black into the backdrop so the mark appears to sit directly on it.
                      child: const RepsiWhiteLogo(width: 240),
                    ),
                  ),
                ),
                const Spacer(flex: 4),
                SizedBox(
                  width: 120,
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(2),
                    child: LinearProgressIndicator(
                      minHeight: 3,
                      color: AppColors.primary,
                      backgroundColor: Colors.white.withValues(alpha: 0.12),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  height: 44,
                  child: _showSlowHint
                      ? TextButton(
                          onPressed: _navigate,
                          child: Text(
                            'Taking longer than usual · Tap to continue',
                            style: AppTypography.caption.copyWith(color: Colors.white70),
                          ),
                        )
                      : FadeTransition(
                          opacity: _taglineFade,
                          child: Center(
                            child: Text(
                              'Your gym. Your progress.',
                              style: AppTypography.caption.copyWith(
                                color: Colors.white54,
                                letterSpacing: 0.6,
                              ),
                            ),
                          ),
                        ),
                ),
                const SizedBox(height: 28),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
