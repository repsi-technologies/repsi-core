import 'package:flutter/material.dart';

/// The REPSI lockup in a single colour (white by default) on any background.
class RepsiWhiteLogo extends StatelessWidget {
  final double? width;
  final double? height;
  final Color color;

  const RepsiWhiteLogo({super.key, this.width, this.height, this.color = Colors.white});

  @override
  Widget build(BuildContext context) {
    final image = Image.asset(
      'assets/logos/repsi-logo-white.png',
      width: width,
      height: height,
      fit: BoxFit.contain,
      semanticLabel: 'Repsi',
      errorBuilder: (_, __, ___) => Icon(Icons.fitness_center_rounded, color: color, size: 36),
    );

    if (color == Colors.white) {
      return image;
    }

    return ColorFiltered(
      colorFilter: ColorFilter.mode(color, BlendMode.srcIn),
      child: image,
    );
  }
}
