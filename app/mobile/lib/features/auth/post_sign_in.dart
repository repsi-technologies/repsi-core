import 'package:flutter/widgets.dart';
import 'package:go_router/go_router.dart';
import '../../app/routes/route_names.dart';
import 'providers/auth_provider.dart';

/// Where a freshly signed-in user lands: their role's home, an owner's active gym, or the gym
/// picker when an owner-level account has no gym selected yet.
void goAfterSignIn(BuildContext context, AuthState auth) {
  final role = auth.user?.role.toUpperCase();
  if (role == 'TRAINER' || role == 'STAFF' || role == 'USER' || role == 'MEMBER' || role == 'ADMIN' || role == 'SUPER_ADMIN') {
    context.go(RouteNames.roleDashboard(auth.user?.role));
    return;
  }
  final workspace = auth.activeWorkspaceId;
  context.go(workspace != null && workspace.isNotEmpty ? RouteNames.dashboard : RouteNames.selectWorkspace);
}
