import 'dart:math' as math;

import 'package:flutter/material.dart';

/// A small WhatsApp-style glyph (speech bubble with a handset) that says where a code is sent.
/// Outlined in [color] by default (for coloured buttons); pass [fill] for a solid badge.
class WhatsAppMark extends StatelessWidget {
  final double size;
  final Color color;
  final Color? fill;

  const WhatsAppMark({super.key, this.size = 20, this.color = Colors.white, this.fill});

  @override
  Widget build(BuildContext context) {
    return ExcludeSemantics(
      child: SizedBox.square(
        dimension: size,
        child: CustomPaint(
          painter: _BubblePainter(stroke: color, fill: fill),
          child: Padding(
            padding: EdgeInsets.only(left: size * 0.04, bottom: size * 0.06),
            child: Icon(Icons.call_rounded, size: size * 0.46, color: color),
          ),
        ),
      ),
    );
  }
}

class _BubblePainter extends CustomPainter {
  final Color stroke;
  final Color? fill;

  _BubblePainter({required this.stroke, this.fill});

  @override
  void paint(Canvas canvas, Size size) {
    final s = size.width;
    final center = Offset(s * 0.53, s * 0.47);
    final radius = s * 0.41;
    const start = math.pi * 0.70;
    const sweep = math.pi * 1.86;
    // Circle with a gap at the lower left, closed through the tail point.
    final path = Path()
      ..addArc(Rect.fromCircle(center: center, radius: radius), start, sweep)
      ..lineTo(s * 0.06, s * 0.95)
      ..close();
    if (fill != null) canvas.drawPath(path, Paint()..color = fill!);
    canvas.drawPath(
      path,
      Paint()
        ..color = fill ?? stroke
        ..style = PaintingStyle.stroke
        ..strokeWidth = s * 0.08
        ..strokeJoin = StrokeJoin.round,
    );
  }

  @override
  bool shouldRepaint(_BubblePainter old) => old.stroke != stroke || old.fill != fill;
}
