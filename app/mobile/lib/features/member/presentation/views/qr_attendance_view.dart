import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../core/api/api_error.dart';
import '../../../../shared/models/member_attendance_model.dart';
import '../../../../shared/models/user_model.dart';
import '../../../../shared/widgets/repsi_button.dart';
import '../../../../shared/widgets/repsi_card.dart';
import '../../../../shared/widgets/repsi_error_state.dart';
import '../../../attendance/providers/attendance_provider.dart';
import '../../../auth/providers/auth_provider.dart';

/// Check-in screen.
///
/// Members scan the gym's entrance QR (or show their pass at the desk). Staff scan a member's pass.
/// The server decides whether anyone is admitted; this screen only transports the scan and shows
/// the server's answer.
class QrAttendanceView extends ConsumerStatefulWidget {
  const QrAttendanceView({super.key});

  @override
  ConsumerState<QrAttendanceView> createState() => _QrAttendanceViewState();
}

class _QrAttendanceViewState extends ConsumerState<QrAttendanceView> {
  int _tab = 0; // 0 = scan, 1 = my pass (members only)

  bool get _isStaff {
    final user = ref.read(authProvider).user;
    if (user == null) return false;
    if (user.isSuperadmin) return true;
    final role = UserRole.fromString(user.role);
    return role == UserRole.owner ||
        role == UserRole.admin ||
        role == UserRole.manager ||
        role == UserRole.staff;
  }

  @override
  Widget build(BuildContext context) {
    final isStaff = _isStaff;
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          tooltip: 'Back',
          icon: const Icon(Icons.arrow_back_ios_new_rounded,
              size: 20, color: AppColors.text),
          onPressed: () => context.canPop() ? context.pop() : context.go('/'),
        ),
        title: Text(isStaff ? 'Scan member pass' : 'Gym check-in',
            style: AppTypography.heading
                .copyWith(fontSize: 18, fontWeight: FontWeight.w700)),
        centerTitle: true,
      ),
      body: SafeArea(
        child: isStaff
            ? const _StaffScanner()
            : Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.pageHorizontalPadding,
                        vertical: 8),
                    child: SegmentedButton<int>(
                      showSelectedIcon: false,
                      segments: const [
                        ButtonSegment(
                            value: 0,
                            icon: Icon(Icons.qr_code_scanner_rounded, size: 18),
                            label: Text('Scan gym QR')),
                        ButtonSegment(
                            value: 1,
                            icon: Icon(Icons.badge_outlined, size: 18),
                            label: Text('My pass')),
                      ],
                      selected: {_tab},
                      onSelectionChanged: (s) {
                        HapticFeedback.selectionClick();
                        setState(() => _tab = s.first);
                      },
                    ),
                  ),
                  Expanded(
                      child: _tab == 0
                          ? const _MemberCheckIn()
                          : const _MemberPass()),
                ],
              ),
      ),
    );
  }
}

// ─── Scanner surface shared by member and staff flows ────────────────────

class _CameraScanner extends StatefulWidget {
  final bool paused;
  final void Function(String value) onCode;

  const _CameraScanner({required this.paused, required this.onCode});

  @override
  State<_CameraScanner> createState() => _CameraScannerState();
}

class _CameraScannerState extends State<_CameraScanner> {
  final MobileScannerController _controller = MobileScannerController(
    formats: const [BarcodeFormat.qrCode],
    detectionSpeed: DetectionSpeed.noDuplicates,
  );

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
      child: Stack(
        fit: StackFit.expand,
        children: [
          MobileScanner(
            controller: _controller,
            onDetect: (capture) {
              if (widget.paused) return;
              final value = capture.barcodes
                  .map((b) => b.rawValue)
                  .whereType<String>()
                  .firstOrNull;
              if (value != null) widget.onCode(value);
            },
            errorBuilder: (context, error) => _CameraError(error: error),
          ),
          IgnorePointer(
            child: Center(
              child: Container(
                width: 230,
                height: 230,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                      color: Colors.white.withValues(alpha: 0.9), width: 3),
                ),
              ),
            ),
          ),
          Positioned(
            right: 8,
            top: 8,
            child: IconButton.filledTonal(
              tooltip: 'Toggle flashlight',
              onPressed: _controller.toggleTorch,
              icon: const Icon(Icons.flashlight_on_outlined),
            ),
          ),
        ],
      ),
    );
  }
}

class _CameraError extends StatelessWidget {
  final MobileScannerException error;

  const _CameraError({required this.error});

  @override
  Widget build(BuildContext context) {
    final denied = error.errorCode == MobileScannerErrorCode.permissionDenied;
    return Container(
      color: AppColors.surfaceSecondary,
      padding: const EdgeInsets.all(AppSpacing.xxl),
      alignment: Alignment.center,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.no_photography_outlined,
              size: 40, color: AppColors.textSecondary),
          const SizedBox(height: 12),
          Text(
            denied ? 'Camera access is off' : 'Camera unavailable',
            style: AppTypography.sectionHeading.copyWith(color: AppColors.text),
          ),
          const SizedBox(height: 6),
          Text(
            denied
                ? 'Allow camera access for REPSI in your phone settings to scan the gym QR, or ask the front desk to check you in.'
                : 'We could not start the camera. Ask the front desk to check you in.',
            textAlign: TextAlign.center,
            style: AppTypography.bodySecondary
                .copyWith(color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }
}

// ─── Member: scan the gym entrance QR ────────────────────────────────────

class _MemberCheckIn extends ConsumerStatefulWidget {
  const _MemberCheckIn();

  @override
  ConsumerState<_MemberCheckIn> createState() => _MemberCheckInState();
}

class _MemberCheckInState extends ConsumerState<_MemberCheckIn> {
  bool _busy = false;
  String? _message;
  bool _messageIsError = false;

  Future<void> _onCode(String raw) async {
    if (_busy) return;
    final token = gymQrToken(raw);
    if (token == null) {
      setState(() {
        _message =
            'That is not a REPSI gym QR code. Scan the code shown at your gym entrance.';
        _messageIsError = true;
      });
      return;
    }
    setState(() {
      _busy = true;
      _message = null;
    });
    try {
      await ref.read(attendanceServiceProvider).selfCheckIn(token);
      HapticFeedback.heavyImpact();
      ref.invalidate(myAttendanceProvider);
      if (mounted) {
        setState(() {
          _message = 'Checked in. Have a great workout!';
          _messageIsError = false;
        });
      }
    } on ApiError catch (e) {
      if (mounted) {
        setState(() {
          _message = e.message;
          _messageIsError = true;
        });
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _checkOut() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Check out?'),
        content: const Text('This ends your current gym visit.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Cancel')),
          FilledButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Check out')),
        ],
      ),
    );
    if (confirmed != true) return;
    setState(() => _busy = true);
    try {
      await ref.read(attendanceServiceProvider).selfCheckOut();
      ref.invalidate(myAttendanceProvider);
      if (mounted) {
        setState(() {
          _message = 'Checked out. See you next time!';
          _messageIsError = false;
        });
      }
    } on ApiError catch (e) {
      if (mounted) {
        setState(() {
          _message = e.message;
          _messageIsError = true;
        });
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final attendance = ref.watch(myAttendanceProvider);
    return RefreshIndicator(
      onRefresh: () async => ref.refresh(myAttendanceProvider.future),
      child: ListView(
        padding: const EdgeInsets.fromLTRB(AppSpacing.pageHorizontalPadding, 4,
            AppSpacing.pageHorizontalPadding, 24),
        children: [
          attendance.when(
            loading: () => const SizedBox(
                height: 96, child: Center(child: CircularProgressIndicator())),
            error: (e, _) => SizedBox(
              height: 220,
              child: RepsiErrorState(
                message: e is ApiError
                    ? e.message
                    : 'Could not load your attendance.',
                onRetry: () => ref.invalidate(myAttendanceProvider),
              ),
            ),
            data: (a) =>
                _StatusCard(attendance: a, busy: _busy, onCheckOut: _checkOut),
          ),
          const SizedBox(height: 12),
          if (attendance.valueOrNull?.isInside != true) ...[
            AspectRatio(
              aspectRatio: 1,
              child: _CameraScanner(paused: _busy, onCode: _onCode),
            ),
            const SizedBox(height: 8),
            Text(
              'Point your camera at the QR code at your gym entrance.',
              textAlign: TextAlign.center,
              style: AppTypography.caption
                  .copyWith(color: AppColors.textSecondary),
            ),
          ],
          if (_message != null) ...[
            const SizedBox(height: 12),
            Semantics(
              liveRegion: true,
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: _messageIsError
                      ? AppColors.errorSoft
                      : AppColors.successSoft,
                  borderRadius: BorderRadius.circular(AppSpacing.radiusDefault),
                ),
                child: Text(
                  _message!,
                  style: AppTypography.body.copyWith(
                      color: _messageIsError
                          ? AppColors.errorDark
                          : AppColors.successDark),
                ),
              ),
            ),
          ],
          const SizedBox(height: 16),
          if (attendance.valueOrNull case final a?)
            _RecentVisits(visits: a.recentVisits),
        ],
      ),
    );
  }
}

class _StatusCard extends StatelessWidget {
  final MemberAttendance attendance;
  final bool busy;
  final VoidCallback onCheckOut;

  const _StatusCard(
      {required this.attendance, required this.busy, required this.onCheckOut});

  @override
  Widget build(BuildContext context) {
    final active = attendance.activeVisit;
    return RepsiCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                  active != null
                      ? Icons.check_circle_rounded
                      : Icons.radio_button_unchecked_rounded,
                  color: active != null
                      ? AppColors.success
                      : AppColors.textSecondary),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  active != null
                      ? 'You are checked in'
                      : 'You are not checked in',
                  style: AppTypography.sectionHeading
                      .copyWith(color: AppColors.text),
                ),
              ),
            ],
          ),
          if (active != null) ...[
            const SizedBox(height: 4),
            Text('Since ${DateFormat.jm().format(active.checkInTime)}',
                style: AppTypography.bodySecondary
                    .copyWith(color: AppColors.textSecondary)),
            const SizedBox(height: 12),
            RepsiButton(
              text: 'Check out',
              variant: RepsiButtonVariant.outline,
              isFullWidth: true,
              isLoading: busy,
              onPressed: busy ? null : onCheckOut,
            ),
          ],
          const SizedBox(height: 14),
          Row(
            children: [
              _Stat(value: '${attendance.streakDays}', label: 'Day streak'),
              _Stat(value: '${attendance.thisWeekVisits}', label: 'This week'),
              _Stat(
                  value: '${attendance.thisMonthVisits}', label: 'This month'),
            ],
          ),
        ],
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  final String value;
  final String label;

  const _Stat({required this.value, required this.label});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Text(value,
              style: AppTypography.heading
                  .copyWith(fontSize: 22, color: AppColors.text)),
          Text(label,
              style: AppTypography.caption
                  .copyWith(color: AppColors.textSecondary)),
        ],
      ),
    );
  }
}

class _RecentVisits extends StatelessWidget {
  final List<VisitModel> visits;

  const _RecentVisits({required this.visits});

  @override
  Widget build(BuildContext context) {
    if (visits.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Text('No visits yet. Your check-ins will show up here.',
            textAlign: TextAlign.center,
            style: AppTypography.bodySecondary
                .copyWith(color: AppColors.textSecondary)),
      );
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Recent visits',
            style:
                AppTypography.sectionHeading.copyWith(color: AppColors.text)),
        const SizedBox(height: 8),
        for (final v in visits.take(10))
          ListTile(
            contentPadding: EdgeInsets.zero,
            dense: true,
            leading: const Icon(Icons.fitness_center_rounded,
                size: 20, color: AppColors.primary),
            title: Text(DateFormat('EEE, d MMM').format(v.checkInTime)),
            subtitle: Text(v.isOpen
                ? 'In at ${DateFormat.jm().format(v.checkInTime)}'
                : '${DateFormat.jm().format(v.checkInTime)} – ${DateFormat.jm().format(v.checkOutTime!)}'),
            trailing: v.durationLabel.isEmpty ? null : Text(v.durationLabel),
          ),
      ],
    );
  }
}

// ─── Member: show my pass at the front desk ──────────────────────────────

class _MemberPass extends ConsumerStatefulWidget {
  const _MemberPass();

  @override
  ConsumerState<_MemberPass> createState() => _MemberPassState();
}

class _MemberPassState extends ConsumerState<_MemberPass> {
  MemberPass? _pass;
  String? _error;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _load() async {
    _timer?.cancel();
    setState(() => _error = null);
    try {
      final pass = await ref.read(attendanceServiceProvider).getMyPass();
      if (!mounted) return;
      setState(() => _pass = pass);
      // The pass is short-lived and single-purpose; renew it shortly before it lapses.
      final wait = pass.expiresAt.difference(DateTime.now()) -
          const Duration(seconds: 10);
      _timer =
          Timer(wait.isNegative ? const Duration(seconds: 5) : wait, _load);
    } on ApiError catch (e) {
      if (mounted) {
        setState(() {
          _pass = null;
          _error = e.message;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null) {
      return RepsiErrorState(message: _error!, onRetry: _load);
    }
    final pass = _pass;
    if (pass == null) return const Center(child: CircularProgressIndicator());
    return ListView(
      padding: const EdgeInsets.all(AppSpacing.pageHorizontalPadding),
      children: [
        RepsiCard(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              Semantics(
                label: 'Your REPSI member pass QR code',
                child: QrImageView(
                    data: pass.token, size: 240, backgroundColor: Colors.white),
              ),
              const SizedBox(height: 12),
              Text('Show this to the front desk',
                  style: AppTypography.sectionHeading
                      .copyWith(color: AppColors.text)),
              const SizedBox(height: 4),
              Text(
                'It refreshes automatically and only works at your gym. Do not share a screenshot.',
                textAlign: TextAlign.center,
                style: AppTypography.caption
                    .copyWith(color: AppColors.textSecondary),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// ─── Staff: scan a member's pass ─────────────────────────────────────────

class _StaffScanner extends ConsumerStatefulWidget {
  const _StaffScanner();

  @override
  ConsumerState<_StaffScanner> createState() => _StaffScannerState();
}

class _StaffScannerState extends ConsumerState<_StaffScanner> {
  bool _busy = false;
  String? _message;
  bool _isError = false;

  Future<void> _onCode(String raw) async {
    if (_busy) return;
    setState(() {
      _busy = true;
      _message = null;
    });
    try {
      final result = await ref.read(attendanceServiceProvider).staffScan(raw);
      HapticFeedback.mediumImpact();
      _show(result.message, error: false);
    } on ApiError catch (e) {
      _show(e.message, error: true);
    }
  }

  void _show(String message, {required bool error}) {
    if (!mounted) return;
    setState(() {
      _message = message;
      _isError = error;
    });
    // Keep the result readable, then resume scanning for the next member.
    Future<void>.delayed(const Duration(seconds: 3), () {
      if (mounted) setState(() => _busy = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.pageHorizontalPadding),
      child: Column(
        children: [
          Expanded(child: _CameraScanner(paused: _busy, onCode: _onCode)),
          const SizedBox(height: 12),
          Semantics(
            liveRegion: true,
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: _message == null
                    ? AppColors.surfaceSecondary
                    : (_isError ? AppColors.errorSoft : AppColors.successSoft),
                borderRadius: BorderRadius.circular(AppSpacing.radiusDefault),
              ),
              child: Text(
                _message ?? 'Scan a member\'s pass to check them in or out.',
                textAlign: TextAlign.center,
                style: AppTypography.body.copyWith(
                  color: _message == null
                      ? AppColors.textSecondary
                      : (_isError
                          ? AppColors.errorDark
                          : AppColors.successDark),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
