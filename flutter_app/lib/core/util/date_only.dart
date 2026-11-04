/// Contract `DateOnly`: a calendar day as `YYYY-MM-DD`, no timezone
/// (specs §12.5). Uses the local date of [date].
String dateOnly(DateTime date) {
  String two(int n) => n.toString().padLeft(2, '0');
  return '${date.year.toString().padLeft(4, '0')}-${two(date.month)}-'
      '${two(date.day)}';
}
