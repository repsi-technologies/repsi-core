import 'package:flutter/material.dart';

/// The REPSI lockup in a single colour (white by default) on any background.
///
/// The bundled artwork is white on opaque black, so its brightness is used as the alpha channel:
/// black becomes fully transparent and white takes [color], whatever sits behind it.
class RepsiWhiteLogo extends StatelessWidget {
  final double? width;
  final double? height;
  final Color color;

  const RepsiWhiteLogo({super.key, this.width, this.height, this.color = Colors.white});

  ColorFilter get _lumaToAlpha {
    double c(double channel) => channel * 255;
    return ColorFilter.matrix(<double>[
      0, 0, 0, 0, c(color.r), //
      0, 0, 0, 0, c(color.g),
      0, 0, 0, 0, c(color.b),
      0.299 * color.a, 0.587 * color.a, 0.114 * color.a, 0, 0,
    ]);
  }

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
        errorBuilder: (_, __, ___) => Icon(Icons.fitness_center_rounded, color: color, size: 36),
      ),
    );
  }
}
