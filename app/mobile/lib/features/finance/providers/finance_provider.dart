import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/api_provider.dart';

/// Owner finance figures from /payments/summary, the dues and revenue reports, and /expenses.
/// Auto-disposed, so nothing outlives the tab or the signed-in gym.

double _n(Object? v) => (v as num?)?.toDouble() ?? 0;

class FinanceSummary {
  final double revenue;
  final double expenses;
  final double net;
  final double pendingDues;

  const FinanceSummary({required this.revenue, required this.expenses, required this.net, required this.pendingDues});
}

final financeSummaryProvider = FutureProvider.autoDispose<FinanceSummary>((ref) async {
  final j = (await ref.watch(apiClientProvider).get('/payments/summary')).data as Map<String, dynamic>;
  return FinanceSummary(
    revenue: _n(j['monthly_revenue']),
    expenses: _n(j['monthly_expenses']),
    net: _n(j['net_profit']),
    pendingDues: _n(j['pending_dues']),
  );
});

class DueItem {
  final String member;
  final String? phone;
  final double balance;
  final double total;
  final int daysOverdue;

  const DueItem({required this.member, this.phone, required this.balance, required this.total, required this.daysOverdue});
}

final duesProvider = FutureProvider.autoDispose<List<DueItem>>((ref) async {
  final j = (await ref.watch(apiClientProvider).get('/reports/dues')).data as Map<String, dynamic>;
  return (j['rows'] as List<dynamic>? ?? const [])
      .whereType<Map<String, dynamic>>()
      .map((r) => DueItem(
            member: r['member_name']?.toString() ?? 'Member',
            phone: r['phone']?.toString(),
            balance: _n(r['balance']),
            total: _n(r['total']),
            daysOverdue: (r['days_overdue'] as num?)?.toInt() ?? 0,
          ))
      .toList()
    ..sort((a, b) => b.daysOverdue.compareTo(a.daysOverdue));
});

class RevenuePeriod {
  final String period;
  final double collected;
  final double expenses;

  const RevenuePeriod({required this.period, required this.collected, required this.expenses});
}

class RevenueReport {
  final List<RevenuePeriod> periods;
  final Map<String, double> byMethod;

  const RevenueReport({required this.periods, required this.byMethod});
}

final revenueReportProvider = FutureProvider.autoDispose<RevenueReport>((ref) async {
  final now = DateTime.now();
  final start = DateTime(now.year, now.month - 5, 1);
  final j = (await ref.watch(apiClientProvider).get('/reports/revenue', queryParameters: {
    'group_by': 'month',
    'start': '${start.year}-${start.month.toString().padLeft(2, '0')}-01',
  }))
      .data as Map<String, dynamic>;
  final summary = j['summary'] as Map<String, dynamic>? ?? const {};
  return RevenueReport(
    periods: (j['rows'] as List<dynamic>? ?? const [])
        .whereType<Map<String, dynamic>>()
        .map((r) => RevenuePeriod(period: r['period']?.toString() ?? '', collected: _n(r['collected']), expenses: _n(r['expenses'])))
        .toList(),
    byMethod: (summary['by_method'] as Map<String, dynamic>? ?? const {}).map((k, v) => MapEntry(k, _n(v))),
  );
});

class ExpenseItem {
  final String title;
  final String category;
  final double amount;
  final DateTime date;

  const ExpenseItem({required this.title, required this.category, required this.amount, required this.date});
}

final expensesProvider = FutureProvider.autoDispose<List<ExpenseItem>>((ref) async {
  final list = (await ref.watch(apiClientProvider).get('/expenses/')).data as List<dynamic>? ?? const [];
  return list
      .whereType<Map<String, dynamic>>()
      .map((e) => ExpenseItem(
            title: e['title']?.toString() ?? '',
            category: e['category']?.toString() ?? '',
            amount: _n(e['amount']),
            date: DateTime.tryParse(e['expense_date']?.toString() ?? '') ?? DateTime.now(),
          ))
      .toList()
    ..sort((a, b) => b.date.compareTo(a.date));
});
