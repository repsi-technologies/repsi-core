import 'package:flutter/material.dart';

/// The white REPSI lockup on any background.
///
/// The bundled artwork is white on opaque black, so its brightness is used as the alpha channel:
/// black becomes fully transparent and white stays white, whatever sits behind it.
class RepsiWhiteLogo extends StatelessWidget {
  final double? width;
  final double? height;

  const RepsiWhiteLogo({super.key, this.width, this.height});

  static const _lumaToAlpha = ColorFilter.matrix(<double>[
    0, 0, 0, 0, 255, //
    0, 0, 0, 0, 255,
    0, 0, 0, 0, 255,
    0.299, 0.587, 0.114, 0, 0,
  ]);

  @override
  Widget build(BuildContext context) {
    return ColorFiltered(
      colorFilter: _lumaToAlpha,
      child: Image.asset(
        'assets/logos/repsi_reverse_white.png',
        width: width,
        height: height,
        fit: BoxFit.contain,
        semanticLabel: 'Repsi',
        errorBuilder: (_, __, ___) => const Icon(Icons.fitness_center_rounded, color: Colors.white, size: 36),
      ),
    );
  }
}
