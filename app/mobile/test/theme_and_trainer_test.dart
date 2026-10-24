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

    var app = tester.widget<MaterialApp>(find.byType(MaterialApp));
    expect(app.themeMode, ThemeMode.light);

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

    expect(find.text('Add New Trainer'), findsOneWidget);
    expect(find.text('Full Name *'), findsOneWidget);
    expect(find.text('Mobile Number *'), findsOneWidget);
    expect(find.text('Email Address (Optional)'), findsOneWidget);
    expect(find.text('Specialization / Track'), findsOneWidget);
    expect(find.text('Save & Onboard Trainer'), findsOneWidget);

    // Scroll to submit button and tap
    await tester.ensureVisible(find.text('Save & Onboard Trainer'));
    await tester.tap(find.text('Save & Onboard Trainer'));
    await tester.pumpAndSettle();

    expect(find.text('Trainer name is required'), findsOneWidget);
  });
}
