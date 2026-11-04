/// A field in a PATCH body: `null` means "leave unchanged" (omitted), while
/// `Change(null)` clears the field. Needed wherever the contract makes a field
/// both optional and nullable, e.g. `UpdateItemInput.dueAt`.
final class Change<T> {
  const new(this.value);

  final T value;
}

extension ChangeBody on Map<String, Object?> {
  /// Adds [key] only when [change] is given.
  void putChange<T>(
    String key,
    Change<T>? change, [
    Object? Function(T)? wire,
  ]) {
    if (change == null) return;
    final v = change.value;
    this[key] = v == null || wire == null ? v : wire(v);
  }
}
