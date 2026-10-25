import 'dart:async';
import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../l10n/l10n.dart';
import '../../../../app/theme/repsi_palette.dart';

class RunningTrackerView extends StatefulWidget {
  const RunningTrackerView({super.key});

  @override
  State<RunningTrackerView> createState() => _RunningTrackerViewState();
}

class _RunningTrackerViewState extends State<RunningTrackerView> {
  bool _isRunning = false;
  int _secondsElapsed = 0;
  double _distanceKm = 0.0;
  Timer? _timer;

  void _toggleRun() {
    if (_isRunning) {
      _timer?.cancel();
      setState(() => _isRunning = false);
    } else {
      setState(() => _isRunning = true);
      _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
        if (mounted) {
          setState(() {
            _secondsElapsed++;
            _distanceKm += 0.003; // Simulate GPS movement pace (~5 min/km)
          });
        }
      });
    }
  }

  String _formatDuration(int seconds) {
    final mins = seconds ~/ 60;
    final secs = seconds % 60;
    return '${mins.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';
  }

  double get _currentPace {
    if (_distanceKm == 0) return 0.0;
    return (_secondsElapsed / 60) / _distanceKm;
  }

  int get _caloriesEstimate => (_distanceKm * 65).toInt();

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(context.l10n.outdoorRunningGps),
      ),
      body: Column(
        children: [
          // Live Run Metrics Header Container
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppColors.darkBackground,
            ),
            child: Column(
              children: [
                Text(
                  context.l10n.runDistance,
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.2,
                  ),
                ),
                Text(
                  _distanceKm.toStringAsFixed(2),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 54,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  context.l10n.runKilometers,
                  style: const TextStyle(color: Colors.white70, fontSize: 12),
                ),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildRunMetric(context.l10n.runTime, _formatDuration(_secondsElapsed)),
                    _buildRunMetric(
                      context.l10n.runPace,
                      context.l10n.runPacePerKm(_currentPace.toStringAsFixed(2)),
                    ),
                    _buildRunMetric(context.l10n.runCalories, '$_caloriesEstimate kcal'),
                  ],
                ),
                const SizedBox(height: 20),
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: theme.colorScheme.primary,
                    foregroundColor: theme.colorScheme.onPrimary,
                    padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(30),
                    ),
                  ),
                  onPressed: _toggleRun,
                  icon: Icon(_isRunning ? Icons.pause : Icons.play_arrow_rounded),
                  label: Text(
                    _isRunning ? context.l10n.pauseRun : context.l10n.startRun,
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ),

          // Map Placeholder / Recent Runs
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Container(
                  height: 140,
                  decoration: BoxDecoration(
                    color: Colors.grey.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.grey.withValues(alpha: 0.3)),
                  ),
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.map_rounded, size: 36, color: Colors.grey),
                        const SizedBox(height: 8),
                        Text(
                          context.l10n.liveGpsMap,
                          style: const TextStyle(color: Colors.grey, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  context.l10n.recentRunHistory,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.1,
                    color: Colors.grey,
                  ),
                ),
                const SizedBox(height: 10),
                ListTile(
                  leading: CircleAvatar(
                    backgroundColor: context.palette.primarySoft,
                    child: Icon(Icons.directions_run, color: context.palette.primaryDark),
                  ),
                  title: Text(
                    '5.42 km · ${context.l10n.morningRun}',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  subtitle: Text(context.l10n.runHistorySummary('32:18', '5:57')),
                  trailing: Text(context.l10n.timeYesterday, style: const TextStyle(color: Colors.grey, fontSize: 12)),
                ),
                ListTile(
                  leading: CircleAvatar(
                    backgroundColor: context.palette.primarySoft,
                    child: Icon(Icons.directions_run, color: context.palette.primaryDark),
                  ),
                  title: const Text(
                    '3.10 km · Interval Jog',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                  subtitle: Text(context.l10n.runHistorySummary('18:40', '6:01')),
                  trailing: const Text('3d', style: TextStyle(color: Colors.grey, fontSize: 12)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRunMetric(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(color: Colors.white70, fontSize: 10),
        ),
      ],
    );
  }
}

