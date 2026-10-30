import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../core/api/api_error.dart';
import '../../../../shared/animations/repsi_stagger.dart';
import '../../../../shared/widgets/repsi_avatar.dart';
import '../../../../shared/widgets/repsi_empty_state.dart';
import '../../../../shared/widgets/repsi_error_state.dart';
import '../../../../shared/widgets/repsi_skeleton.dart';
import '../../../nutrition/data/coaching_repository.dart';
import '../../../../l10n/l10n.dart';
import '../../../../app/theme/repsi_palette.dart';

String _errorText(BuildContext context, Object e) => e is ApiError ? e.message : context.l10n.errorGeneric;

/// Trainer ⇄ member messages. With [memberId] (trainer side) it opens that member's thread
/// directly; otherwise it lists the caller's conversations. [embedded] hides the back button
/// when shown as a tab.
class TrainerChatView extends ConsumerWidget {
  final String? memberId;
  final bool asTrainer;
  final bool embedded;
  const TrainerChatView({super.key, this.memberId, this.asTrainer = false, this.embedded = false});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (memberId != null) return _OpenThread(memberId: memberId!);
    final l = context.l10n;
    final palette = context.palette;
    final convs = ref.watch(conversationsProvider);
    return Scaffold(
      backgroundColor: palette.background,
      appBar: AppBar(
        backgroundColor: palette.background,
        automaticallyImplyLeading: !embedded,
        title: Text(l.messages, style: AppTypography.heading.copyWith(fontSize: 20, fontWeight: FontWeight.w700)),
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(conversationsProvider);
          await ref.read(conversationsProvider.future).then((_) {}, onError: (_) {});
        },
        child: convs.when(
          loading: () => ListView(padding: AppSpacing.pagePadding, children: const [
            RepsiSkeleton(height: 68),
            SizedBox(height: 8),
            RepsiSkeleton(height: 68),
          ]),
          error: (e, _) => ListView(children: [
            const SizedBox(height: 80),
            RepsiErrorState(message: _errorText(context, e), onRetry: () => ref.invalidate(conversationsProvider)),
          ]),
          data: (rows) => rows.isEmpty
              ? ListView(children: [
                  const SizedBox(height: 60),
                  RepsiEmptyState(
                    icon: Icons.chat_bubble_outline_rounded,
                    title: l.noMessagesYet,
                    message: asTrainer ? l.noConversationsTrainer : l.noConversationsMember,
                  ),
                ])
              : ListView.separated(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.pageHorizontalPadding, vertical: 8),
                  itemCount: rows.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (_, i) {
                    final c = rows[i];
                    final name = asTrainer ? c.memberName : c.trainerName;
                    return RepsiStaggerItem(
                      index: i,
                      delay: const Duration(milliseconds: 40),
                      child: Material(
                        color: palette.surface,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14), side: BorderSide(color: palette.border)),
                        child: InkWell(
                          borderRadius: BorderRadius.circular(14),
                          onTap: () async {
                            await Navigator.of(context).push(MaterialPageRoute(
                                builder: (_) => ChatThreadView(conversation: c, asTrainer: asTrainer)));
                            ref.invalidate(conversationsProvider);
                          },
                          child: Padding(
                            padding: const EdgeInsets.all(12),
                            child: Row(children: [
                              RepsiAvatar(name: name, size: 44),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                  Text(name,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: AppTypography.bodySmall.copyWith(
                                          fontWeight: c.unread > 0 ? FontWeight.w800 : FontWeight.w700,
                                          color: palette.text,
                                          fontSize: 15)),
                                  const SizedBox(height: 2),
                                  Text(c.lastMessage ?? l.noMessagesYet,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: AppTypography.caption.copyWith(
                                          color: c.unread > 0 ? palette.text : palette.textSecondary)),
                                ]),
                              ),
                              if (c.unread > 0)
                                Semantics(
                                  label: l.chatUnread(c.unread),
                                  excludeSemantics: true,
                                  child: Container(
                                    constraints: const BoxConstraints(minWidth: 22),
                                    height: 22,
                                    padding: const EdgeInsets.symmetric(horizontal: 6),
                                    alignment: Alignment.center,
                                    decoration:
                                        BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(11)),
                                    child: Text(c.unread > 99 ? '99+' : '${c.unread}',
                                        style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700)),
                                  ),
                                ),
                            ]),
                          ),
                        ),
                      ),
                    );
                  },
                ),
        ),
      ),
    );
  }
}

class _OpenThread extends ConsumerStatefulWidget {
  final String memberId;
  const _OpenThread({required this.memberId});

  @override
  ConsumerState<_OpenThread> createState() => _OpenThreadState();
}

class _OpenThreadState extends ConsumerState<_OpenThread> {
  // Created once: rebuilding must not open the conversation again.
  late Future<Conversation> _future = ref.read(coachingRepositoryProvider).openWithMember(widget.memberId);

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Conversation>(
      future: _future,
      builder: (context, snap) {
        if (snap.hasData) return ChatThreadView(conversation: snap.data!, asTrainer: true);
        return Scaffold(
          appBar: AppBar(title: Text(context.l10n.messages)),
          body: snap.hasError
              ? RepsiErrorState(
                  message: _errorText(context, snap.error!),
                  onRetry: () => setState(
                      () => _future = ref.read(coachingRepositoryProvider).openWithMember(widget.memberId)),
                )
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

class _ChatThreadViewState extends ConsumerState<ChatThreadView> with WidgetsBindingObserver {
  // No push notifications yet: poll while the thread is open and the app is in the foreground.
  static const _pollEvery = Duration(seconds: 8);
  final _controller = TextEditingController();
  final _scroll = ScrollController();
  Timer? _poll;
  List<ThreadMessage>? _messages;
  Object? _error;
  bool _sending = false;
  bool _loading = false;
  String? _pendingRef; // reused on retry so a resend never duplicates

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _load();
    _poll = Timer.periodic(_pollEvery, (_) => _load(silent: true));
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _poll ??= Timer.periodic(_pollEvery, (_) => _load(silent: true));
      _load(silent: true);
    } else if (state == AppLifecycleState.paused) {
      _poll?.cancel();
      _poll = null;
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _poll?.cancel();
    _controller.dispose();
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _load({bool silent = false}) async {
    if (_loading) return;
    _loading = true;
    try {
      final rows = await ref.read(coachingRepositoryProvider).messages(widget.conversation.id);
      if (!mounted) return;
      final grew = rows.length != (_messages?.length ?? -1);
      setState(() {
        _messages = rows;
        _error = null;
      });
      if (grew) _toBottom(animate: _messages != null && silent);
    } catch (e) {
      // A failed background refresh keeps the messages already on screen.
      if (mounted && (!silent || _messages == null)) setState(() => _error = e);
    } finally {
      _loading = false;
    }
  }

  void _toBottom({bool animate = false}) => WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!_scroll.hasClients) return;
        final end = _scroll.position.maxScrollExtent;
        animate
            ? _scroll.animateTo(end, duration: const Duration(milliseconds: 300), curve: Curves.easeOutCubic)
            : _scroll.jumpTo(end);
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
      _toBottom(animate: true);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(context.l10n.chatNotSent(_errorText(context, e)))));
      }
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  Future<void> _report({ThreadMessage? message}) async {
    final sent = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => _ReportSheet(conversationId: widget.conversation.id, message: message),
    );
    if (sent == true && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(context.l10n.chatReportSent)));
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final palette = context.palette;
    final c = widget.conversation;
    final myKind = widget.asTrainer ? 'trainer' : 'member';
    final title = widget.asTrainer ? c.memberName : c.trainerName;
    final messages = _messages;

    return Scaffold(
      backgroundColor: palette.background,
      appBar: AppBar(
        backgroundColor: palette.surface,
        titleSpacing: 0,
        title: Row(children: [
          RepsiAvatar(name: title, size: 36),
          const SizedBox(width: 10),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(title, maxLines: 1, overflow: TextOverflow.ellipsis, style: AppTypography.bodySmall.copyWith(
                  fontWeight: FontWeight.w700, color: palette.text, fontSize: 16)),
              Text(widget.asTrainer ? l.commonMember : l.yourTrainer,
                  style: AppTypography.caption.copyWith(color: palette.textSecondary)),
            ]),
          ),
        ]),
        actions: [
          IconButton(
            tooltip: l.chatReport,
            icon: Icon(Icons.flag_outlined, color: palette.textSecondary),
            onPressed: () => _report(),
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: _error != null && messages == null
                ? RepsiErrorState(message: _errorText(context, _error!), onRetry: _load)
                : messages == null
                    ? const Center(child: CircularProgressIndicator())
                    : messages.isEmpty
                        ? RepsiEmptyState(icon: Icons.waving_hand_rounded, title: l.sayHello, message: l.chatIntro)
                        : ListView.builder(
                            controller: _scroll,
                            padding: const EdgeInsets.fromLTRB(12, 12, 12, 8),
                            itemCount: messages.length,
                            itemBuilder: (_, i) {
                              final m = messages[i];
                              final local = m.createdAt.toLocal();
                              final prev = i > 0 ? messages[i - 1].createdAt.toLocal() : null;
                              final newDay = prev == null ||
                                  prev.year != local.year || prev.month != local.month || prev.day != local.day;
                              return Column(children: [
                                if (newDay)
                                  Padding(
                                    padding: const EdgeInsets.symmetric(vertical: 10),
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(
                                          color: palette.surfaceSecondary, borderRadius: BorderRadius.circular(999)),
                                      child: Text(DateFormat.MMMEd(L10n.localeName).format(local),
                                          style: AppTypography.caption.copyWith(color: palette.textSecondary, fontSize: 11)),
                                    ),
                                  ),
                                GestureDetector(
                                  key: ValueKey(m.id),
                                  // Long-press the other person's message to report it.
                                  onLongPress: m.senderKind == myKind ? null : () => _report(message: m),
                                  child: _Bubble(message: m, mine: m.senderKind == myKind),
                                ),
                              ]);
                            },
                          ),
          ),
          DecoratedBox(
            decoration: BoxDecoration(color: palette.surface, border: Border(top: BorderSide(color: palette.border))),
            child: SafeArea(
              top: false,
              child: c.canSend
                  ? Padding(
                      padding: const EdgeInsets.fromLTRB(12, 8, 8, 8),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _controller,
                              maxLength: 4000,
                              minLines: 1,
                              maxLines: 4,
                              textCapitalization: TextCapitalization.sentences,
                              textInputAction: TextInputAction.send,
                              onSubmitted: (_) => _send(),
                              decoration: InputDecoration(
                                hintText: l.writeMessage,
                                counterText: '',
                                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(24)),
                                enabledBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(24), borderSide: BorderSide(color: palette.border)),
                                focusedBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(24),
                                    borderSide: const BorderSide(color: AppColors.primary, width: 1.5)),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          IconButton.filled(
                            tooltip: l.sendMessage,
                            style: IconButton.styleFrom(
                                backgroundColor: AppColors.primary, minimumSize: const Size(48, 48)),
                            onPressed: _sending ? null : _send,
                            icon: _sending
                                ? const SizedBox(
                                    width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                : const Icon(Icons.send_rounded, color: Colors.white),
                          ),
                        ],
                      ),
                    )
                  : Padding(
                      padding: const EdgeInsets.all(14),
                      child: Text(l.chatReadOnly,
                          textAlign: TextAlign.center, style: AppTypography.caption.copyWith(color: palette.textSecondary)),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Bubble extends StatelessWidget {
  final ThreadMessage message;
  final bool mine;
  const _Bubble({required this.message, required this.mine});

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final palette = context.palette;
    final m = message;
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: const Duration(milliseconds: 260),
      curve: Curves.easeOutCubic,
      builder: (_, v, child) => Opacity(
        opacity: v,
        child: Transform.translate(offset: Offset(mine ? 16 * (1 - v) : -16 * (1 - v), 0), child: child),
      ),
      child: Align(
        alignment: mine ? AlignmentDirectional.centerEnd : AlignmentDirectional.centerStart,
        child: Container(
          constraints: BoxConstraints(maxWidth: MediaQuery.sizeOf(context).width * 0.78),
          margin: const EdgeInsets.symmetric(vertical: 3),
          padding: const EdgeInsets.fromLTRB(14, 10, 14, 8),
          decoration: BoxDecoration(
            gradient: mine
                ? const LinearGradient(colors: [Color(0xFFF06A2E), AppColors.primary], begin: Alignment.topLeft, end: Alignment.bottomRight)
                : null,
            color: mine ? null : palette.surface,
            border: mine ? null : Border.all(color: palette.border),
            borderRadius: BorderRadiusDirectional.only(
              topStart: const Radius.circular(18),
              topEnd: const Radius.circular(18),
              bottomStart: Radius.circular(mine ? 18 : 4),
              bottomEnd: Radius.circular(mine ? 4 : 18),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            mainAxisSize: MainAxisSize.min,
            children: [
              if (m.body != null)
                Align(
                  alignment: AlignmentDirectional.centerStart,
                  widthFactor: 1,
                  child: Text(m.body!,
                      style: AppTypography.bodySmall.copyWith(color: mine ? Colors.white : palette.text, height: 1.4, fontSize: 15)),
                ),
              const SizedBox(height: 3),
              Row(mainAxisSize: MainAxisSize.min, children: [
                Text(TimeOfDay.fromDateTime(m.createdAt.toLocal()).format(context),
                    style: TextStyle(fontSize: 10, color: mine ? Colors.white70 : palette.textSecondary)),
                if (mine) ...[
                  const SizedBox(width: 4),
                  Icon(m.read ? Icons.done_all_rounded : Icons.done_rounded,
                      size: 13, color: Colors.white.withValues(alpha: m.read ? 1 : 0.7), semanticLabel: m.read ? l.chatRead : null),
                ],
              ]),
            ],
          ),
        ),
      ),
    );
  }
}

class _ReportSheet extends ConsumerStatefulWidget {
  final String conversationId;
  final ThreadMessage? message;
  const _ReportSheet({required this.conversationId, this.message});

  @override
  ConsumerState<_ReportSheet> createState() => _ReportSheetState();
}

class _ReportSheetState extends ConsumerState<_ReportSheet> {
  final _details = TextEditingController();
  String? _reason;
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _details.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_reason == null || _busy) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref.read(coachingRepositoryProvider).report(widget.conversationId,
          reason: _reason!, details: _details.text, messageId: widget.message?.id);
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      if (mounted) setState(() => _error = _errorText(context, e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    final palette = context.palette;
    final reasons = <(String, String)>[
      ('harassment', l.chatReasonHarassment),
      ('inappropriate', l.chatReasonInappropriate),
      ('off_topic', l.chatReasonOffTopic),
      ('spam', l.chatReasonSpam),
      ('safety', l.chatReasonSafety),
      ('other', l.chatReasonOther),
    ];
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(AppSpacing.pageHorizontalPadding, 16, AppSpacing.pageHorizontalPadding, 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(widget.message != null ? l.chatReportMessage : l.chatReportTitle,
                style: AppTypography.sectionHeading.copyWith(color: palette.text)),
            const SizedBox(height: 4),
            Text(l.chatReportDesc, style: AppTypography.bodySecondary.copyWith(color: palette.textSecondary)),
            if (widget.message?.body != null) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: palette.surfaceSecondary,
                  borderRadius: BorderRadius.circular(10),
                  border: const BorderDirectional(start: BorderSide(color: AppColors.primary, width: 2)),
                ),
                child: Text(widget.message!.body!, maxLines: 3, overflow: TextOverflow.ellipsis,
                    style: AppTypography.bodySmall.copyWith(color: palette.text)),
              ),
            ],
            const SizedBox(height: 12),
            Text(l.chatReportReason, style: AppTypography.bodySmall.copyWith(fontWeight: FontWeight.w700, color: palette.text)),
            RadioGroup<String>(
              groupValue: _reason,
              onChanged: (v) => setState(() => _reason = v),
              child: Column(children: [
                for (final (id, label) in reasons)
                  RadioListTile<String>(value: id, title: Text(label), dense: true, contentPadding: EdgeInsets.zero),
              ]),
            ),
            TextField(
              controller: _details,
              maxLength: 2000,
              maxLines: 3,
              minLines: 2,
              decoration: InputDecoration(labelText: l.chatReportDetails),
            ),
            if (_error != null) ...[
              Text(_error!, style: AppTypography.bodySmall.copyWith(color: palette.errorDark)),
              const SizedBox(height: 8),
            ],
            FilledButton(
              onPressed: _reason == null || _busy ? null : _submit,
              style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
              child: _busy
                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                  : Text(l.chatReportSend),
            ),
          ],
        ),
      ),
    );
  }
}
