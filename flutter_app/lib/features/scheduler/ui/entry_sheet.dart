import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:niwa/core/models/models.dart';
import 'package:niwa/core/theme/tokens.g.dart';
import 'package:niwa/features/items/data/item_providers.dart';
import 'package:niwa/features/knowledge/ui/link_picker.dart';
import 'package:niwa/features/scheduler/data/reminders.dart';
import 'package:niwa/features/scheduler/data/schedule_providers.dart';
import 'package:niwa/features/scheduler/data/schedule_repository.dart';
import 'package:niwa/features/scheduler/domain/calendar.dart';
import 'package:niwa/features/scheduler/domain/entry_look.dart';

/// Create or edit an entry (port of the web `EntryDialog`): event or item
/// block, title, dates/times, all-day, colour, repeat, reminder (this
/// phone), and for recurring entries the scope — "This event" or "This and
/// following" — for both save and delete (SCHEDULER.md §4).
Future<void> showEntrySheet(
  BuildContext context, {
  ScheduleEntry? entry,
  DateTime? start,
  bool allDay = false,
  String? itemId,
}) => showModalBottomSheet<void>(
  context: context,
  isScrollControlled: true,
  showDragHandle: true,
  builder: (_) =>
      EntrySheet(entry: entry, start: start, allDay: allDay, itemId: itemId),
);

class EntrySheet extends ConsumerStatefulWidget {
  const new({
    this.entry,
    this.start,
    this.allDay = false,
    this.itemId,
    super.key,
  });

  final ScheduleEntry? entry;
  final DateTime? start;
  final bool allDay;
  final String? itemId;

  @override
  ConsumerState<EntrySheet> createState() => _EntrySheetState();
}

class _EntrySheetState extends ConsumerState<EntrySheet> {
  late final ScheduleEntry? _e = widget.entry;
  late ScheduleKind _kind =
      _e?.kind ??
      (widget.itemId != null ? ScheduleKind.block : ScheduleKind.event);
  late final _title = TextEditingController(text: _e?.title ?? '');
  late String? _itemId = _e?.itemId ?? widget.itemId;
  late bool _allDay = _e?.isAllDay ?? widget.allDay;
  late String _startDay;
  late String _endDay;
  late TimeOfDay _startTime;
  late TimeOfDay _endTime;
  late String? _color = _e?.color;
  late Recurrence _recurrence = _e?.recurrence ?? Recurrence.none;
  EditScope _scope = EditScope.instance;
  bool? _remind;
  bool _remindSeries = false;
  bool _saving = false;
  String? _error;

  bool get _recurring => _e?.seriesId != null;

  @override
  void initState() {
    super.initState();
    final e = _e;
    if (e != null && e.isAllDay) {
      _startDay = utcDayKey(e.startAt);
      _endDay = addDaysToKey(utcDayKey(e.endAt), -1);
      _startTime = const TimeOfDay(hour: 9, minute: 0);
      _endTime = const TimeOfDay(hour: 10, minute: 0);
    } else {
      final s = e?.startAt.toLocal() ?? widget.start ?? _nextSlot();
      final end = e?.endAt.toLocal() ?? s.add(const Duration(hours: 1));
      _startDay = dayKey(s);
      _endDay = dayKey(end);
      _startTime = TimeOfDay.fromDateTime(s);
      _endTime = TimeOfDay.fromDateTime(end);
    }
  }

  static DateTime _nextSlot() {
    final n = DateTime.now();
    return atMinutes(n, minutesOfDay(n) ~/ 30 * 30 + 30);
  }

  @override
  void dispose() {
    _title.dispose();
    super.dispose();
  }

  DateTime _at(String day, TimeOfDay t) =>
      atMinutes(parseDay(day), t.hour * 60 + t.minute);

  (DateTime, DateTime) _times() => _allDay
      ? (utcMidnight(_startDay), utcMidnight(addDaysToKey(_endDay, 1)))
      : (_at(_startDay, _startTime), _at(_endDay, _endTime));

  Future<void> _pickDay(bool start) async {
    final current = parseDay(start ? _startDay : _endDay);
    final picked = await showDatePicker(
      context: context,
      initialDate: current,
      firstDate: DateTime(current.year - 5),
      lastDate: DateTime(current.year + 5),
    );
    if (picked == null) return;
    setState(() {
      if (start) {
        // Moving the start keeps the length (like the web dialog).
        final shift = parseDay(dayKey(picked)).difference(parseDay(_startDay));
        _startDay = dayKey(picked);
        _endDay = dayKey(parseDay(_endDay).add(shift));
      } else {
        _endDay = dayKey(picked);
      }
    });
  }

  Future<void> _pickTime(bool start) async {
    final picked = await showTimePicker(
      context: context,
      initialTime: start ? _startTime : _endTime,
    );
    if (picked != null) {
      setState(() => start ? _startTime = picked : _endTime = picked);
    }
  }

  Future<void> _pickItem() async {
    final target = await showLinkPicker(context);
    if (target != null) setState(() => _itemId = target.itemId);
  }

  Future<void> _save() async {
    final (start, end) = _times();
    if (!end.isAfter(start)) {
      setState(() => _error = 'End must be after start.');
      return;
    }
    if (_kind == ScheduleKind.event && _title.text.trim().isEmpty) {
      setState(() => _error = 'Events need a title.');
      return;
    }
    if (_kind == ScheduleKind.block && _itemId == null) {
      setState(() => _error = 'Choose the item to block time for.');
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    final draft = EntryDraft(
      kind: _kind,
      title: _kind == ScheduleKind.event ? _title.text.trim() : '',
      itemId: _kind == ScheduleKind.block ? _itemId : null,
      startAt: start,
      endAt: end,
      isAllDay: _allDay,
      color: _color,
      recurrence: _recurrence,
    );
    final actions = ref.read(scheduleActionsProvider);
    final e = _e;
    final saved = e == null
        ? await actions.create(draft)
        : await actions.update(e, draft, scope: _scope);
    if (saved != null && _remind != null && !_allDay) {
      final key = reminderKeyFor(saved, wholeSeries: _remindSeries);
      await ref
          .read(reminderServiceProvider.notifier)
          .set(key, _remind! ? defaultReminderMinutes : null);
    }
    if (!mounted) return;
    if (saved == null) {
      setState(() => _saving = false);
    } else {
      Navigator.of(context).pop();
    }
  }

  Future<void> _delete() async {
    final e = _e;
    if (e == null) return;
    final ok = await ref.read(scheduleActionsProvider).remove(e, scope: _scope);
    if (ok && mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    const unit = NiwaTokens.spacingUnit;
    final loc = MaterialLocalizations.of(context);
    final items = ref.watch(treeProvider).value?.byId ?? const {};
    final reminders = ref.watch(reminderServiceProvider);
    final remindOn =
        _remind ?? (_e != null && reminderFor(_e, reminders) != null);
    final label = Theme.of(context).textTheme.labelLarge;

    Widget section(String title, Widget child) => Padding(
      padding: const EdgeInsets.only(top: unit * 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: label),
          const SizedBox(height: unit * 2),
          child,
        ],
      ),
    );

    String day(String key) => loc.formatMediumDate(parseDay(key));

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(unit * 4, 0, unit * 4, unit * 4),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              _e == null ? 'New entry' : 'Edit entry',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            if (_e == null)
              Padding(
                padding: const EdgeInsets.only(top: unit * 3),
                child: SegmentedButton<ScheduleKind>(
                  segments: const [
                    ButtonSegment(
                      value: ScheduleKind.event,
                      label: Text('Event'),
                    ),
                    ButtonSegment(
                      value: ScheduleKind.block,
                      label: Text('Time for an item'),
                    ),
                  ],
                  selected: {_kind},
                  onSelectionChanged: (s) => setState(() => _kind = s.single),
                ),
              ),
            if (_kind == ScheduleKind.event)
              section(
                'Title',
                TextField(
                  controller: _title,
                  maxLength: 300,
                  textCapitalization: TextCapitalization.sentences,
                  decoration: const InputDecoration(labelText: 'Title'),
                ),
              )
            else
              section(
                'Item',
                OutlinedButton.icon(
                  icon: const Icon(Icons.task_alt_outlined),
                  label: Text(
                    _itemId == null
                        ? 'Choose an item'
                        : items[_itemId]?.title ?? 'Item',
                  ),
                  onPressed: _e == null ? _pickItem : null,
                ),
              ),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('All day'),
              value: _allDay,
              onChanged: (v) => setState(() => _allDay = v),
            ),
            Wrap(
              spacing: unit * 2,
              runSpacing: unit * 2,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                OutlinedButton(
                  onPressed: () => _pickDay(true),
                  child: Text(day(_startDay)),
                ),
                if (!_allDay)
                  OutlinedButton(
                    onPressed: () => _pickTime(true),
                    child: Text(loc.formatTimeOfDay(_startTime)),
                  ),
                const Text('→'),
                OutlinedButton(
                  onPressed: () => _pickDay(false),
                  child: Text(day(_endDay)),
                ),
                if (!_allDay)
                  OutlinedButton(
                    onPressed: () => _pickTime(false),
                    child: Text(loc.formatTimeOfDay(_endTime)),
                  ),
              ],
            ),
            section(
              'Colour',
              Wrap(
                spacing: unit * 2,
                children: [
                  ChoiceChip(
                    label: const Text('Default'),
                    selected: _color == null,
                    onSelected: (_) => setState(() => _color = null),
                  ),
                  for (final (name, c) in entryColors)
                    ChoiceChip(
                      avatar: Icon(Icons.circle, color: c, size: 16),
                      label: Text(name),
                      selected: _color == colorHex(c),
                      onSelected: (_) => setState(() => _color = colorHex(c)),
                    ),
                ],
              ),
            ),
            if (_recurring)
              section(
                'Apply to',
                SegmentedButton<EditScope>(
                  segments: const [
                    ButtonSegment(
                      value: EditScope.instance,
                      label: Text('This event'),
                    ),
                    ButtonSegment(
                      value: EditScope.future,
                      label: Text('This and following'),
                    ),
                  ],
                  selected: {_scope},
                  onSelectionChanged: (s) => setState(() => _scope = s.single),
                ),
              ),
            section(
              'Repeat',
              DropdownButtonFormField<Recurrence>(
                initialValue: _recurrence,
                items: const [
                  DropdownMenuItem(
                    value: Recurrence.none,
                    child: Text('Does not repeat'),
                  ),
                  DropdownMenuItem(
                    value: Recurrence.daily,
                    child: Text('Daily'),
                  ),
                  DropdownMenuItem(
                    value: Recurrence.weekly,
                    child: Text('Weekly'),
                  ),
                  DropdownMenuItem(
                    value: Recurrence.monthly,
                    child: Text('Monthly'),
                  ),
                ],
                onChanged: _recurring && _scope == EditScope.instance
                    ? null
                    : (r) => setState(() => _recurrence = r!),
                decoration: InputDecoration(
                  helperText: _recurring && _scope == EditScope.instance
                      ? 'Choose "This and following" to change the repeat.'
                      : null,
                ),
              ),
            ),
            if (!_allDay) ...[
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Remind me'),
                subtitle: const Text(
                  '$defaultReminderMinutes minutes before, on this phone',
                ),
                value: remindOn,
                onChanged: (v) => setState(() => _remind = v),
              ),
              if (remindOn && (_recurring || _recurrence != Recurrence.none))
                CheckboxListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('For every occurrence'),
                  value: _remindSeries,
                  onChanged: (v) => setState(() => _remindSeries = v!),
                ),
            ],
            if (_error case final message?)
              Padding(
                padding: const EdgeInsets.only(top: unit * 2),
                child: Text(
                  message,
                  style: TextStyle(color: Theme.of(context).colorScheme.error),
                ),
              ),
            const SizedBox(height: unit * 6),
            FilledButton(
              onPressed: _saving ? null : _save,
              style: FilledButton.styleFrom(
                minimumSize: const Size.fromHeight(48),
              ),
              child: Text(_saving ? 'Saving…' : 'Save'),
            ),
            if (_e != null)
              TextButton.icon(
                icon: const Icon(Icons.delete_outline),
                label: Text(
                  _recurring && _scope == EditScope.future
                      ? 'Delete this and following'
                      : 'Delete',
                ),
                onPressed: _saving ? null : _delete,
              ),
          ],
        ),
      ),
    );
  }
}
