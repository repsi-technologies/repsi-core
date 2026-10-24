import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../nutrition/data/coaching_repository.dart';

/// Trainer ⇄ member messages. With [memberId] (trainer side) it opens that member's thread
/// directly; otherwise it lists the caller's conversations.
class TrainerChatView extends ConsumerWidget {
  final String? memberId;
  final bool asTrainer;
  const TrainerChatView({super.key, this.memberId, this.asTrainer = false});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (memberId != null) return _OpenThread(memberId: memberId!);
    final convs = ref.watch(conversationsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Messages')),
      body: convs.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => _Retry(message: e.toString(), onRetry: () => ref.invalidate(conversationsProvider)),
        data: (rows) => rows.isEmpty
            ? Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Text(
                    asTrainer
                        ? 'No conversations yet. Open a client and tap Message.'
                        : 'Once a trainer is assigned to you, you can message them here.',
                    textAlign: TextAlign.center,
                    style: AppTypography.bodySecondary,
                  ),
                ),
              )
            : RefreshIndicator(
                onRefresh: () async => ref.invalidate(conversationsProvider),
                child: ListView.separated(
                  itemCount: rows.length,
                  separatorBuilder: (_, __) => const Divider(height: 1),
                  itemBuilder: (_, i) {
                    final c = rows[i];
                    return ListTile(
                      title: Text(asTrainer ? c.memberName : c.trainerName),
                      subtitle: Text(c.lastMessage ?? 'No messages yet', maxLines: 1, overflow: TextOverflow.ellipsis),
                      trailing: c.unread > 0
                          ? Semantics(
                              label: '${c.unread} unread',
                              child: CircleAvatar(
                                radius: 11,
                                backgroundColor: AppColors.primary,
                                child: Text('${c.unread}', style: const TextStyle(color: Colors.white, fontSize: 11)),
                              ),
                            )
                          : null,
                      onTap: () async {
                        await Navigator.of(context).push(MaterialPageRoute(
                            builder: (_) => ChatThreadView(conversation: c, asTrainer: asTrainer)));
                        ref.invalidate(conversationsProvider);
                      },
                    );
                  },
                ),
              ),
      ),
    );
  }
}

class _OpenThread extends ConsumerWidget {
  final String memberId;
  const _OpenThread({required this.memberId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return FutureBuilder<Conversation>(
      future: ref.read(coachingRepositoryProvider).openWithMember(memberId),
      builder: (context, snap) {
        if (snap.hasData) return ChatThreadView(conversation: snap.data!, asTrainer: true);
        return Scaffold(
          appBar: AppBar(title: const Text('Messages')),
          body: snap.hasError
              ? Center(child: Padding(padding: const EdgeInsets.all(24), child: Text(snap.error.toString())))
              : const Center(child: CircularProgressIndicator()),
        );
      },
    );
  }
}

class ChatThreadView extends ConsumerStatefulWidget {
  final Conversation conversation;
  final bool asTrainer;
  const ChatThreadView({super.key, required this.conversation, required this.asTrainer});

  @override
  ConsumerState<ChatThreadView> createState() => _ChatThreadViewState();
}

class _ChatThreadViewState extends ConsumerState<ChatThreadView> {
  final _controller = TextEditingController();
  final _scroll = ScrollController();
  List<ThreadMessage>? _messages;
  String? _error;
  bool _sending = false;
  String? _pendingRef; // reused on retry so a resend never duplicates

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _controller.dispose();
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final rows = await ref.read(coachingRepositoryProvider).messages(widget.conversation.id);
      if (!mounted) return;
      setState(() {
        _messages = rows;
        _error = null;
      });
      _toBottom();
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    }
  }

  void _toBottom() => WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_scroll.hasClients) _scroll.jumpTo(_scroll.position.maxScrollExtent);
      });

  Future<void> _send() async {
    final text = _controller.text.trim();
    if (text.isEmpty || _sending) return;
    _pendingRef ??= newClientRef();
    setState(() => _sending = true);
    try {
      final msg = await ref.read(coachingRepositoryProvider).send(widget.conversation.id, text, _pendingRef!);
      _pendingRef = null;
      _controller.clear();
      setState(() => _messages = [...?_messages, msg]);
      _toBottom();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Not sent: $e')));
      }
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = widget.conversation;
    final myKind = widget.asTrainer ? 'trainer' : 'member';
    return Scaffold(
      appBar: AppBar(title: Text(widget.asTrainer ? c.memberName : c.trainerName)),
      body: Column(
        children: [
          Expanded(
            child: _error != null
                ? _Retry(message: _error!, onRetry: _load)
                : _messages == null
                    ? const Center(child: CircularProgressIndicator())
                    : _messages!.isEmpty
                        ? Center(child: Text('Say hello to start the conversation.', style: AppTypography.bodySecondary))
                        : ListView.builder(
                            controller: _scroll,
                            padding: const EdgeInsets.all(12),
                            itemCount: _messages!.length,
                            itemBuilder: (_, i) {
                              final m = _messages![i];
                              final mine = m.senderKind == myKind;
                              return Align(
                                alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
                                child: Container(
                                  constraints: BoxConstraints(maxWidth: MediaQuery.sizeOf(context).width * 0.75),
                                  margin: const EdgeInsets.symmetric(vertical: 4),
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: mine ? AppColors.primary : AppColors.surfaceSecondary,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      if (m.body != null)
                                        Text(m.body!, style: TextStyle(color: mine ? Colors.white : AppColors.text)),
                                      const SizedBox(height: 2),
                                      Text(
                                        '${TimeOfDay.fromDateTime(m.createdAt.toLocal()).format(context)}${mine && m.read ? ' · Read' : ''}',
                                        style: TextStyle(fontSize: 10, color: mine ? Colors.white70 : AppColors.textSecondary),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
          ),
          SafeArea(
            top: false,
            child: c.canSend
                ? Padding(
                    padding: const EdgeInsets.all(8),
                    child: Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _controller,
                            maxLength: 4000,
                            minLines: 1,
                            maxLines: 4,
                            textInputAction: TextInputAction.send,
                            onSubmitted: (_) => _send(),
                            decoration: const InputDecoration(hintText: 'Write a message…', counterText: ''),
                          ),
                        ),
                        IconButton(
                          tooltip: 'Send message',
                          onPressed: _sending ? null : _send,
                          icon: _sending
                              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                              : const Icon(Icons.send, color: AppColors.primary),
                        ),
                      ],
                    ),
                  )
                : Padding(
                    padding: const EdgeInsets.all(12),
                    child: Text('This trainer is no longer assigned, so the conversation is read-only.',
                        textAlign: TextAlign.center, style: AppTypography.caption),
                  ),
          ),
        ],
      ),
    );
  }
}

class _Retry extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const _Retry({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Text(message, textAlign: TextAlign.center),
            const SizedBox(height: 12),
            OutlinedButton(onPressed: onRetry, child: const Text('Try again')),
          ]),
        ),
      );
}
