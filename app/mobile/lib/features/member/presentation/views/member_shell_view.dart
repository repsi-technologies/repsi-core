import 'package:flutter/material.dart';
import '../../../../shared/models/user_model.dart';
import '../../../../shared/navigation/repsi_bottom_nav.dart';
import 'member_activity_view.dart';
import 'member_home_view.dart';
import 'member_profile_view.dart';
import '../../../../l10n/l10n.dart';

/// Only tabs backed by real data are shown. Workouts, classes and progress return once their
/// screens read from the API instead of sample content.
List<RepsiNavItem> memberNavItems(BuildContext context) => [
      RepsiNavItem(icon: Icons.home_outlined, activeIcon: Icons.home_rounded, label: context.l10n.commonHome),
      RepsiNavItem(icon: Icons.show_chart_rounded, activeIcon: Icons.show_chart_rounded, label: context.l10n.activity),
      RepsiNavItem(icon: Icons.grid_view_rounded, activeIcon: Icons.grid_view_rounded, label: context.l10n.commonMore),
    ];

class MemberShellView extends StatefulWidget {
  const MemberShellView({super.key});

  @override
  State<MemberShellView> createState() => _MemberShellViewState();
}

class _MemberShellViewState extends State<MemberShellView> {
  int _currentIndex = 0;

  final List<Widget> _pages = const [
    MemberHomeView(),
    MemberActivityView(),
    MemberProfileView(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _pages,
      ),
      bottomNavigationBar: RepsiBottomNav(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        role: UserRole.user,
        customItems: memberNavItems(context),
      ),
    );
  }
}
