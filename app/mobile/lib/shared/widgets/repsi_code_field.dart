import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_spacing.dart';
import '../../app/theme/app_typography.dart';
import '../animations/repsi_motion.dart';

import '../../l10n/l10n.dart';
import '../../app/theme/repsi_palette.dart';
/// One-time code entry shown as separate digit boxes, backed by a single text field so paste,
/// SMS/WhatsApp autofill and backspace all behave like a normal input.
class RepsiCodeField extends StatefulWidget {
  final TextEditingController controller;
  final int length;
  final ValueChanged<String>? onCompleted;
  final bool hasError;
  final bool enabled;
  final bool autofocus;

  const RepsiCodeField({
    super.key,
    required this.controller,
    this.length = 6,
    this.onCompleted,
    this.hasError = false,
    this.enabled = true,
    this.autofocus = true,
  });

  @override
  State<RepsiCodeField> createState() => _RepsiCodeFieldState();
}

class _RepsiCodeFieldState extends State<RepsiCodeField> {
  final _focusNode = FocusNode();

  @override
  void initState() {
    super.initState();
    widget.controller.addListener(_onChanged);
    _focusNode.addListener(_rebuild);
  }

  @override
  void didUpdateWidget(RepsiCodeField oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.controller != widget.controller) {
      oldWidget.controller.removeListener(_onChanged);
      widget.controller.addListener(_onChanged);
    }
  }

  @override
  void dispose() {
    widget.controller.removeListener(_onChanged);
    _focusNode.dispose();
    super.dispose();
  }

  void _rebuild() => setState(() {});

  void _onChanged() {
    setState(() {});
    if (widget.controller.text.length == widget.length) widget.onCompleted?.call(widget.controller.text);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final code = widget.controller.text;
    final focused = _focusNode.hasFocus;

    return Semantics(
      label: context.l10n.codeFieldLabel(widget.length),
      value: code.isEmpty ? null : code.split('').join(' '),
      textField: true,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: widget.enabled ? _focusNode.requestFocus : null,
        child: Stack(
          children: [
            // The real input: invisible, but focused and receiving keystrokes/paste/autofill.
            Positioned.fill(
              child: Opacity(
                opacity: 0,
                child: TextField(
                  controller: widget.controller,
                  focusNode: _focusNode,
                  autofocus: widget.autofocus,
                  enabled: widget.enabled,
                  keyboardType: TextInputType.number,
                  textInputAction: TextInputAction.done,
                  autofillHints: const [AutofillHints.oneTimeCode],
                  showCursor: false,
                  enableInteractiveSelection: false,
                  maxLength: widget.length,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  decoration: const InputDecoration(counterText: '', border: InputBorder.none),
                ),
              ),
            ),
            IgnorePointer(
              child: Row(
                children: [
                  for (var i = 0; i < widget.length; i++) ...[
                    if (i > 0) SizedBox(width: i == widget.length ~/ 2 ? 14 : 8),
                    Expanded(child: _box(i, code, focused, isDark)),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _box(int i, String code, bool focused, bool isDark) {
    final digit = i < code.length ? code[i] : '';
    final isCurrent = focused && (i == code.length || (i == widget.length - 1 && code.length == widget.length));
    final borderColor = widget.hasError
        ? context.palette.error
        : isCurrent
            ? AppColors.primary
            : digit.isNotEmpty
                ? (isDark ? AppColors.darkBorderStrong : context.palette.borderStrong)
                : (isDark ? AppColors.darkBorder : context.palette.border);

    return AspectRatio(
      aspectRatio: 0.86,
      child: AnimatedContainer(
        duration: RepsiMotion.input,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: isDark ? AppColors.darkSurface : context.palette.surface,
          borderRadius: BorderRadius.circular(AppSpacing.radiusInput),
          border: Border.all(color: borderColor, width: isCurrent || widget.hasError ? 1.5 : 1),
        ),
        child: Text(
          digit,
          style: AppTypography.tabularNumber(
            fontSize: 22,
            fontWeight: FontWeight.w600,
            color: isDark ? AppColors.darkText : context.palette.text,
          ),
        ),
      ),
    );
  }
}
