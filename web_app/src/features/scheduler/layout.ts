/**
 * Side-by-side layout for overlapping timed entries in one day column (SCHEDULER.md §6):
 * transitively-overlapping entries form a cluster; each cluster uses the fewest columns.
 */
export interface Segment<T> {
  key: string;
  value: T;
  start: number; // minutes from day start (0–1440)
  end: number;
}

export interface Placed<T> extends Segment<T> {
  column: number;
  columns: number;
}

export function layoutDay<T>(segments: Segment<T>[]): Placed<T>[] {
  const sorted = [...segments].sort((a, b) => a.start - b.start || b.end - a.end);
  const out: Placed<T>[] = [];
  let cluster: Placed<T>[] = [];
  let colEnds: number[] = [];
  let clusterEnd = -1;

  const flush = () => {
    for (const p of cluster) p.columns = colEnds.length;
    out.push(...cluster);
    cluster = [];
    colEnds = [];
  };

  for (const s of sorted) {
    if (cluster.length && s.start >= clusterEnd) flush();
    let column = colEnds.findIndex((end) => end <= s.start);
    if (column < 0) {
      column = colEnds.length;
      colEnds.push(s.end);
    } else {
      colEnds[column] = s.end;
    }
    cluster.push({ ...s, column, columns: 1 });
    clusterEnd = Math.max(clusterEnd, s.end);
  }
  flush();
  return out;
}
