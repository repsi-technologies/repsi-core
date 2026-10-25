import 'package:flutter/material.dart';
import '../../../shared/models/user_model.dart';
import '../../../shared/navigation/repsi_bottom_nav.dart';
import 'trainer_clients_view.dart';
import '../../member/presentation/views/trainer_chat_view.dart';
import 'trainer_home_view.dart';
import 'trainer_more_view.dart';
import 'trainer_sessions_view.dart';

class TrainerShellView extends StatefulWidget {
  const TrainerShellView({super.key});

  @override
  State<TrainerShellView> createState() => _TrainerShellViewState();
}

class _TrainerShellViewState extends State<TrainerShellView> {
  int _currentIndex = 0;

  void _select(int index) => setState(() => _currentIndex = index);

  @override
  Widget build(BuildContext context) {
    final pages = [
      TrainerHomeView(onSelectTab: _select),
      const TrainerClientsView(),
      const TrainerSessionsView(),
      const TrainerChatView(asTrainer: true, embedded: true),
      TrainerMoreView(onSelectTab: _select),
    ];
    return PopScope(
      canPop: _currentIndex == 0,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _select(0);
      },
      child: Scaffold(
        body: IndexedStack(index: _currentIndex, children: pages),
        bottomNavigationBar: RepsiBottomNav(
          currentIndex: _currentIndex,
          onTap: _select,
          role: UserRole.trainer,
        ),
      ),
    );
  }
}
