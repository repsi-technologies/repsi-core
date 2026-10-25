import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/member_repository.dart';
import '../../../../l10n/l10n.dart';
import '../../../../app/theme/repsi_palette.dart';

class MembershipPaymentsView extends ConsumerWidget {
  const MembershipPaymentsView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final paymentsAsync = ref.watch(memberPaymentsProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(context.l10n.membershipAndPayments),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      context.l10n.membershipDetails,
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      context.l10n.membershipDetailsUnavailable,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            Text(
              context.l10n.paymentHistoryHeader,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                letterSpacing: 1.1,
                color: Colors.grey,
              ),
            ),
            const SizedBox(height: 12),

            paymentsAsync.when(
              data: (payments) => ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: payments.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  final pay = payments[index];
                  return Card(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: ListTile(
                      leading: CircleAvatar(
                        backgroundColor: context.palette.successSoft,
                        child: Icon(Icons.receipt_long, color: context.palette.success),
                      ),
                      title: Text(pay.title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                      subtitle: Text(
                        context.l10n.paymentRefLine(pay.receiptNumber, pay.paymentMethod),
                        style: const TextStyle(fontSize: 12),
                      ),
                      trailing: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            '₹${pay.amount.toInt()}',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 15,
                              color: theme.primaryColor,
                            ),
                          ),
                          Text(
                            pay.status,
                            style: TextStyle(
                              color: context.palette.success,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      onTap: () {
                        showDialog(
                          context: context,
                          builder: (_) => AlertDialog(
                            title: Text(context.l10n.digitalReceipt),
                            content: Column(
                              mainAxisSize: MainAxisSize.min,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(context.l10n.receiptNumberLine(pay.receiptNumber), style: const TextStyle(fontWeight: FontWeight.bold)),
                                const SizedBox(height: 8),
                                Text(context.l10n.receiptDescriptionLine(pay.title)),
                                Text(context.l10n.receiptAmountLine(L10n.currency(pay.amount, decimals: 2))),
                                Text(context.l10n.receiptModeLine(pay.paymentMethod)),
                                Text(context.l10n.receiptStatusLine(pay.status)),
                              ],
                            ),
                            actions: [
                              TextButton(
                                onPressed: () => Navigator.pop(context),
                                child: Text(context.l10n.commonClose),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  );
                },
              ),
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (err, __) => Text(context.l10n.commonErrorWithDetail(err.toString())),
            ),
          ],
        ),
      ),
    );
  }
}
