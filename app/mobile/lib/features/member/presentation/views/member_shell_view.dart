import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../shared/models/user_model.dart';
import '../../../../shared/navigation/repsi_bottom_nav.dart';
import '../../../coaching/views/workout_plan_view.dart';
import 'member_activity_view.dart';
import 'member_home_view.dart';
import 'member_profile_view.dart';
import 'trainer_chat_view.dart';
import '../../../../l10n/l10n.dart';

/// Only tabs backed by real data are shown. Classes and progress return once their screens read
/// from the API instead of sample content.
List<RepsiNavItem> memberNavItems(BuildContext context) => [
      RepsiNavItem(icon: LucideIcons.house, label: context.l10n.commonHome),
      RepsiNavItem(icon: LucideIcons.dumbbell, label: context.l10n.navWorkout),
      RepsiNavItem(icon: LucideIcons.activity, label: context.l10n.activity),
      RepsiNavItem(icon: LucideIcons.messageSquare, label: context.l10n.navChat),
      RepsiNavItem(icon: LucideIcons.ellipsis, label: context.l10n.commonMore),
    ];

class MemberShellView extends StatefulWidget {
  const MemberShellView({super.key});

  @override
  State<MemberShellView> createState() => _MemberShellViewState();
}

class _MemberShellViewState extends State<MemberShellView> {
  int _currentIndex = 0;

  void _select(int index) => setState(() => _currentIndex = index);

  @override
  Widget build(BuildContext context) {
    final pages = [
      MemberHomeView(onOpenWorkouts: () => _select(1)),
      const WorkoutPlanView(embedded: true),
      const MemberActivityView(),
      const TrainerChatView(embedded: true),
      const MemberProfileView(),
    ];
    return PopScope(
      // Back from another tab returns to Home before leaving the app.
      canPop: _currentIndex == 0,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _select(0);
      },
      child: Scaffold(
        body: IndexedStack(index: _currentIndex, children: pages),
        bottomNavigationBar: RepsiBottomNav(
          currentIndex: _currentIndex,
          onTap: _select,
          role: UserRole.user,
          customItems: memberNavItems(context),
        ),
      ),
    );
  }
}
