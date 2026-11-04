import 'package:flutter/material.dart';
import 'package:niwa/core/models/models.dart';
import 'package:niwa/core/theme/niwa_colors.dart';

/// Item-type icon in its token colour, labelled for screen readers.
class ItemTypeIcon extends StatelessWidget {
  const new(this.type, {this.completed = false, super.key});

  final ItemType type;

  /// Tasks show a check when done.
  final bool completed;

  @override
  Widget build(BuildContext context) {
    final types = NiwaColors.of(context).types;
    final (icon, color, label) = switch (type) {
      ItemType.project => (Icons.folder_outlined, types.project, 'Project'),
      ItemType.task => (
        completed ? Icons.check_circle : Icons.radio_button_unchecked,
        types.task,
        completed ? 'Completed task' : 'Task',
      ),
      ItemType.note => (Icons.description_outlined, types.note, 'Note'),
      ItemType.idea => (Icons.lightbulb_outline, types.idea, 'Idea'),
      ItemType.unknown => (
        Icons.help_outline,
        NiwaColors.of(context).textSecondary,
        'Item',
      ),
    };
    return Icon(icon, color: color, semanticLabel: label);
  }
}
