import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/providers/theme_provider.dart';
import 'package:mobile/features/trainer/views/add_trainer_view.dart';
import 'package:mobile/main.dart';

void main() {
  testWidgets('app updates themeMode when themeNotifierProvider changes', (tester) async {
    final container = ProviderContainer();
    addTearDown(container.dispose);

    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: const RepsiApp(),
      ),
    );
    await tester.pump(const Duration(milliseconds: 300));

    // Follows the phone until the user picks a theme.
    var app = tester.widget<MaterialApp>(find.byType(MaterialApp));
    expect(app.themeMode, ThemeMode.system);

    container.read(themeNotifierProvider.notifier).setTheme(AppThemeMode.dark);
    await tester.pump(const Duration(milliseconds: 100));

    app = tester.widget<MaterialApp>(find.byType(MaterialApp));
    expect(app.themeMode, ThemeMode.dark);

    await tester.pumpWidget(const SizedBox());
  });

  testWidgets('AddTrainerView renders all necessary inputs and validates required fields', (tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: MaterialApp(
          home: AddTrainerView(),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Add new trainer'), findsOneWidget);
    expect(find.text('Full name *'), findsOneWidget);
    expect(find.text('Mobile number *'), findsOneWidget);
    expect(find.text('Email address (optional)'), findsOneWidget);
    expect(find.text('Specialisation'), findsOneWidget);
    expect(find.text('Save trainer'), findsOneWidget);

    // Scroll to submit button and tap
    await tester.ensureVisible(find.text('Save trainer'));
    await tester.tap(find.text('Save trainer'));
    await tester.pumpAndSettle();

    expect(find.text('Trainer name is required'), findsOneWidget);
  });
}
