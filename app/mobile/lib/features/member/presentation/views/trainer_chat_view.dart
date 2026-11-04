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
import '../../../coaching/data/coaching_api.dart';
import '../../../coaching/data/coaching_models.dart';
import '../../../../l10n/l10n.dart';
import '../../../../app/theme/repsi_palette.dart';

String _errorText(BuildContext context, Object e) => e is ApiError ? e.message : context.l10n.errorGeneric;

/// Trainer ⇄ member messages. With [memberId] (trainer side) it opens that member's thread
/// directly; otherwise it lists the caller's conversations. [embedded] hides the back button
/// when shown as a tab.
class TrainerChatView extends ConsumerStatefulWidget {
  final String? memberId;
  final bool asTrainer;
  final bool embedded;
  const TrainerChatView({super.key, this.memberId, this.asTrainer = false, this.embedded = false});

  @override
  ConsumerState<TrainerChatView> createState() => _TrainerChatViewState();
}

class _TrainerChatViewState extends ConsumerState<TrainerChatView> {
  String _searchQuery = '';
  String _filter = 'all'; // 'all', 'assigned', 'unread'
  final _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.memberId != null) return _OpenThread(memberId: widget.memberId!);
    final l = context.l10n;
    final palette = context.palette;
    final convs = ref.watch(conversationsProvider);
    final trainersAsync = !widget.asTrainer ? ref.watch(availableTrainersProvider) : null;

    return Scaffold(
      backgroundColor: palette.background,
      appBar: AppBar(
        backgroundColor: palette.background,
        automaticallyImplyLeading: !widget.embedded,
        title: Text(l.messages, style: AppTypography.heading.copyWith(fontSize: 20, fontWeight: FontWeight.w700)),
        actions: [
          if (!widget.asTrainer)
            IconButton(
              tooltip: l.chatNewChat,
              icon: const Icon(Icons.edit_outlined),
              onPressed: () => _startChat(context, ref),
            ),
        ],
      ),
      floatingActionButton: widget.asTrainer
          ? null
          : FloatingActionButton.extended(
              onPressed: () => _startChat(context, ref),
              icon: const Icon(Icons.chat_outlined),
              label: Text(l.chatNewChat),
            ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(conversationsProvider);
          if (!widget.asTrainer) ref.invalidate(availableTrainersProvider);
          await ref.read(conversationsProvider.future).then((_) {}, onError: (_) {});
        },
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            // Top Trainers Reel for Members (chat with any trainer)
            if (!widget.asTrainer && trainersAsync != null)
              SliverToBoxAdapter(
                child: trainersAsync.when(
                  data: (trainers) {
                    if (trainers.isEmpty) return const SizedBox.shrink();
                    return Padding(
                      padding: const EdgeInsets.only(top: 8, bottom: 12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.pageHorizontalPadding),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Gym Coaches & Trainers',
                                  style: AppTypography.caption.copyWith(
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: 0.5,
                                    fontSize: 12,
                                    color: palette.textSecondary,
                                  ),
                                ),
                                Text(
                                  '${trainers.length} available',
                                  style: AppTypography.caption.copyWith(color: AppColors.primary, fontWeight: FontWeight.w700),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 10),
                          SizedBox(
                            height: 106,
                            child: ListView.separated(
                              scrollDirection: Axis.horizontal,
                              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.pageHorizontalPadding),
                              itemCount: trainers.length,
                              separatorBuilder: (_, __) => const SizedBox(width: 12),
                              itemBuilder: (context, i) {
                                final t = trainers[i];
                                return GestureDetector(
                                  onTap: () async {
                                    try {
                                      final conv = await ref.read(coachingRepositoryProvider).openWithTrainer(t.id);
                                      if (!context.mounted) return;
                                      await Navigator.of(context).push(
                                        MaterialPageRoute(builder: (_) => ChatThreadView(conversation: conv, asTrainer: false)),
                                      );
                                      ref.invalidate(conversationsProvider);
                                    } catch (e) {
                                      if (context.mounted) {
                                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(_errorText(context, e))));
                                      }
                                    }
                                  },
                                  child: Container(
                                    width: 82,
                                    padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
                                    decoration: BoxDecoration(
                                      color: palette.surface,
                                      borderRadius: BorderRadius.circular(16),
                                      border: Border.all(color: palette.border),
                                      boxShadow: [
                                        BoxShadow(color: palette.shadow, blurRadius: 8, offset: const Offset(0, 2)),
                                      ],
                                    ),
                                    child: Column(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Stack(
                                          clipBehavior: Clip.none,
                                          children: [
                                            RepsiAvatar(name: t.name, imageUrl: t.photoUrl, size: 40),
                                            Positioned(
                                              right: -1,
                                              bottom: -1,
                                              child: Container(
                                                width: 12,
                                                height: 12,
                                                decoration: BoxDecoration(
                                                  color: const Color(0xFF10B981),
                                                  shape: BoxShape.circle,
                                                  border: Border.all(color: palette.surface, width: 2),
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 6),
                                        Text(
                                          t.name.split(' ').first,
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: AppTypography.caption.copyWith(
                                            fontWeight: FontWeight.w700,
                                            fontSize: 11,
                                            color: palette.text,
                                          ),
                                        ),
                                        Text(
                                          t.specialization ?? 'Coach',
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: AppTypography.caption.copyWith(
                                            fontSize: 9,
                                            color: palette.textSecondary,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                  loading: () => const SizedBox.shrink(),
                  error: (_, __) => const SizedBox.shrink(),
                ),
              ),

            // Search Bar & Filter Chips
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.pageHorizontalPadding, vertical: 6),
                child: Column(
                  children: [
                    TextField(
                      controller: _searchController,
                      onChanged: (q) => setState(() => _searchQuery = q.trim().toLowerCase()),
                      decoration: InputDecoration(
                        hintText: widget.asTrainer ? 'Search client messages...' : 'Search messages & coaches...',
                        prefixIcon: const Icon(Icons.search, size: 20),
                        suffixIcon: _searchQuery.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear, size: 18),
                                onPressed: () {
                                  _searchController.clear();
                                  setState(() => _searchQuery = '');
                                },
                              )
                            : null,
                        filled: true,
                        fillColor: palette.surface,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(color: palette.border),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(color: palette.border),
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          ChoiceChip(
                            label: const Text('All'),
                            selected: _filter == 'all',
                            onSelected: (_) => setState(() => _filter = 'all'),
                          ),
                          const SizedBox(width: 8),
                          ChoiceChip(
                            label: const Text('Unread'),
                            selected: _filter == 'unread',
                            onSelected: (_) => setState(() => _filter = 'unread'),
                          ),
                          if (!widget.asTrainer) ...[
                            const SizedBox(width: 8),
                            ChoiceChip(
                              label: Text(l.yourTrainer),
                              selected: _filter == 'assigned',
                              onSelected: (_) => setState(() => _filter = 'assigned'),
                            ),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(height: 6),
                  ],
                ),
              ),
            ),

            // Conversations List
            convs.when(
              loading: () => SliverPadding(
                padding: AppSpacing.pagePadding,
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    const RepsiSkeleton(height: 68),
                    const SizedBox(height: 8),
                    const RepsiSkeleton(height: 68),
                  ]),
                ),
              ),
              error: (e, _) => SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.only(top: 40),
                  child: RepsiErrorState(
                    message: _errorText(context, e),
                    onRetry: () => ref.invalidate(conversationsProvider),
                  ),
                ),
              ),
              data: (rows) {
                var filtered = rows;
                if (_filter == 'unread') {
                  filtered = filtered.where((c) => c.unread > 0).toList();
                } else if (_filter == 'assigned') {
                  filtered = filtered.where((c) => c.assigned).toList();
                }
                if (_searchQuery.isNotEmpty) {
                  filtered = filtered.where((c) {
                    final name = (widget.asTrainer ? c.memberName : c.trainerName).toLowerCase();
                    final last = (c.lastMessage ?? '').toLowerCase();
                    return name.contains(_searchQuery) || last.contains(_searchQuery);
                  }).toList();
                }

                if (filtered.isEmpty) {
                  if (rows.isEmpty && !widget.asTrainer && trainersAsync != null) {
                    // Friendly onboarding to chat with coaches
                    return SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          children: [
                            const SizedBox(height: 20),
                            Icon(Icons.mark_chat_unread_outlined, size: 52, color: AppColors.primary.withValues(alpha: 0.7)),
                            const SizedBox(height: 16),
                            Text(
                              'Chat with Any Gym Coach',
                              style: AppTypography.sectionHeading.copyWith(fontSize: 18),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Have questions about workout forms, diet plans, or training? Select any trainer above or tap New Chat to message them directly.',
                              textAlign: TextAlign.center,
                              style: AppTypography.bodySmall.copyWith(color: palette.textSecondary),
                            ),
                            const SizedBox(height: 20),
                            FilledButton.icon(
                              onPressed: () => _startChat(context, ref),
                              icon: const Icon(Icons.add_comment_rounded, size: 18),
                              label: const Text('Start First Conversation'),
                            ),
                          ],
                        ),
                      ),
                    );
                  }

                  return SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.only(top: 40),
                      child: RepsiEmptyState(
                        icon: Icons.chat_bubble_outline_rounded,
                        title: _searchQuery.isNotEmpty ? 'No conversations match' : l.noMessagesYet,
                        message: widget.asTrainer ? l.noConversationsTrainer : l.noConversationsMember,
                      ),
                    ),
                  );
                }

                return SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.pageHorizontalPadding, vertical: 4),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, i) {
                        final c = filtered[i];
                        final name = widget.asTrainer ? c.memberName : c.trainerName;
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: RepsiStaggerItem(
                            index: i,
                            delay: const Duration(milliseconds: 30),
                            child: Material(
                              color: palette.surface,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                                side: BorderSide(
                                  color: c.unread > 0 ? AppColors.primary.withValues(alpha: 0.35) : palette.border,
                                ),
                              ),
                              child: InkWell(
                                borderRadius: BorderRadius.circular(16),
                                onTap: () async {
                                  await Navigator.of(context).push(
                                    MaterialPageRoute(builder: (_) => ChatThreadView(conversation: c, asTrainer: widget.asTrainer)),
                                  );
                                  ref.invalidate(conversationsProvider);
                                },
                                child: Padding(
                                  padding: const EdgeInsets.all(12),
                                  child: Row(
                                    children: [
                                      Stack(
                                        children: [
                                          RepsiAvatar(name: name, size: 48),
                                          if (!widget.asTrainer && c.assigned)
                                            Positioned(
                                              right: 0,
                                              bottom: 0,
                                              child: Container(
                                                padding: const EdgeInsets.all(2),
                                                decoration: BoxDecoration(
                                                  color: AppColors.primary,
                                                  shape: BoxShape.circle,
                                                  border: Border.all(color: palette.surface, width: 2),
                                                ),
                                                child: const Icon(Icons.star, size: 10, color: Colors.white),
                                              ),
                                            ),
                                        ],
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Row(
                                              children: [
                                                Flexible(
                                                  child: Text(
                                                    name,
                                                    maxLines: 1,
                                                    overflow: TextOverflow.ellipsis,
                                                    style: AppTypography.bodySmall.copyWith(
                                                      fontWeight: c.unread > 0 ? FontWeight.w800 : FontWeight.w700,
                                                      color: palette.text,
                                                      fontSize: 15,
                                                    ),
                                                  ),
                                                ),
                                                if (!widget.asTrainer) ...[
                                                  const SizedBox(width: 6),
                                                  Container(
                                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                    decoration: BoxDecoration(
                                                      color: c.assigned
                                                          ? AppColors.primary.withValues(alpha: 0.12)
                                                          : palette.surfaceSecondary,
                                                      borderRadius: BorderRadius.circular(6),
                                                    ),
                                                    child: Text(
                                                      c.assigned ? l.yourTrainer : 'Gym Coach',
                                                      style: TextStyle(
                                                        fontSize: 10,
                                                        fontWeight: FontWeight.w700,
                                                        color: c.assigned ? AppColors.primary : palette.textSecondary,
                                                      ),
                                                    ),
                                                  ),
                                                ],
                                              ],
                                            ),
                                            const SizedBox(height: 3),
                                            Text(
                                              c.lastMessage ?? l.noMessagesYet,
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                              style: AppTypography.caption.copyWith(
                                                color: c.unread > 0 ? palette.text : palette.textSecondary,
                                                fontWeight: c.unread > 0 ? FontWeight.w600 : FontWeight.normal,
                                              ),
                                            ),
                                          ],
                                        ),
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
                                            decoration: BoxDecoration(
                                              color: AppColors.primary,
                                              borderRadius: BorderRadius.circular(11),
                                            ),
                                            child: Text(
                                              c.unread > 99 ? '99+' : '${c.unread}',
                                              style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700),
                                            ),
                                          ),
                                        ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ),
                        );
                      },
                      childCount: filtered.length,
                    ),
                  ),
                );
              },
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 80)),
          ],
        ),
      ),
    );
  }
}

/// Lets a member pick any active trainer and opens (or resumes) that conversation.
Future<void> _startChat(BuildContext context, WidgetRef ref) async {
  final trainer = await showModalBottomSheet<CoachProfile>(
    context: context,
    useSafeArea: true,
    isScrollControlled: true,
    builder: (sheetContext) => Consumer(builder: (context, ref, _) {
      final l = context.l10n;
      return DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.6,
        builder: (context, scroll) => ref.watch(availableTrainersProvider).when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => RepsiErrorState(message: _errorText(context, e), onRetry: () => ref.invalidate(availableTrainersProvider)),
              data: (list) => ListView(controller: scroll, padding: const EdgeInsets.all(16), children: [
                Text(l.chatPickTrainer, style: AppTypography.sectionHeading),
                const SizedBox(height: 8),
                if (list.isEmpty) RepsiEmptyState(icon: Icons.person_search_outlined, title: l.chatNoTrainers, message: ''),
                for (final t in list)
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: RepsiAvatar(name: t.name, size: 40),
                    title: Text(t.name),
                    subtitle: t.specialization == null ? null : Text(t.specialization!, maxLines: 1, overflow: TextOverflow.ellipsis),
                    trailing: const Icon(Icons.chevron_right_rounded),
                    onTap: () => Navigator.of(sheetContext).pop(t),
                  ),
              ]),
            ),
      );
    }),
  );
  if (trainer == null || !context.mounted) return;
  try {
    final conv = await ref.read(coachingRepositoryProvider).openWithTrainer(trainer.id);
    if (!context.mounted) return;
    await Navigator.of(context).push(MaterialPageRoute(builder: (_) => ChatThreadView(conversation: conv, asTrainer: false)));
    ref.invalidate(conversationsProvider);
  } catch (e) {
    if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(_errorText(context, e))));
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

    final subtitleText = widget.asTrainer
        ? l.commonMember
        : (c.assigned ? '${l.yourTrainer} · Assigned' : 'Gym Coach · General');

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
              Text(subtitleText,
                  style: AppTypography.caption.copyWith(color: palette.textSecondary, fontSize: 11)),
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
                        ? Padding(
                            padding: const EdgeInsets.all(24),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.waving_hand_rounded, size: 48, color: AppColors.primary.withValues(alpha: 0.8)),
                                const SizedBox(height: 12),
                                Text(l.sayHello, style: AppTypography.sectionHeading.copyWith(fontSize: 18)),
                                const SizedBox(height: 6),
                                Text(
                                  widget.asTrainer ? l.chatIntro : 'Ask anything about workouts, routines, diets, or gym guidance. Tap a quick topic below:',
                                  textAlign: TextAlign.center,
                                  style: AppTypography.bodySmall.copyWith(color: palette.textSecondary),
                                ),
                                const SizedBox(height: 20),
                                Wrap(
                                  spacing: 8,
                                  runSpacing: 8,
                                  alignment: WrapAlignment.center,
                                  children: [
                                    ActionChip(
                                      avatar: const Text('🏋️', style: TextStyle(fontSize: 14)),
                                      label: const Text('Form check'),
                                      onPressed: () {
                                        _controller.text = 'Hi coach, could you check my lifting form or technique?';
                                      },
                                    ),
                                    ActionChip(
                                      avatar: const Text('🥗', style: TextStyle(fontSize: 14)),
                                      label: const Text('Diet advice'),
                                      onPressed: () {
                                        _controller.text = 'Hi coach, what foods or diet plan do you suggest for my goal?';
                                      },
                                    ),
                                    ActionChip(
                                      avatar: const Text('⏱️', style: TextStyle(fontSize: 14)),
                                      label: const Text('Schedule training'),
                                      onPressed: () {
                                        _controller.text = 'Hi coach, are you available for a 1-on-1 session this week?';
                                      },
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          )
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
