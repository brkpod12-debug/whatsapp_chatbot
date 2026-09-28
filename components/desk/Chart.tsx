/**
 * Charts for the desk, in CSS and inline SVG. No charting library: these are
 * bars and a polyline, and a library would arrive with its own visual language
 * to fight the register palette.
 *
 * Server components. Nothing here needs state or the browser.
 */

export type Point = { label: string; value: number };

function niceMax(points: Point[]): number {
  return Math.max(1, ...points.map((p) => p.value));
}

/** Horizontal bars, for categories: source, asset class, temperature. */
export function BarList({ points, empty = "No data yet." }: { points: Point[]; empty?: string }) {
  if (points.length === 0) return <p className="mt-3 text-sm text-slate">{empty}</p>;
  const max = niceMax(points);

  return (
    <ul className="mt-3 space-y-2">
      {points.map((p) => (
        <li key={p.label} className="flex items-center gap-3">
          <span className="stamp w-28 shrink-0 truncate text-slate">{p.label}</span>
          <span className="h-2 flex-1 bg-mist">
            <span
              className="block h-full bg-emerald"
              style={{ width: `${Math.round((p.value / max) * 100)}%` }}
            />
          </span>
          <span className="w-8 shrink-0 text-right text-sm tabular-nums">{p.value}</span>
        </li>
      ))}
    </ul>
  );
}

/** Vertical columns, for the 24 hours of today. */
export function HourColumns({ points }: { points: Point[] }) {
  const max = niceMax(points);
  const busiest = points.reduce((a, b) => (b.value > a.value ? b : a), points[0]);

  return (
    <div className="mt-3">
      <div className="flex h-24 items-end gap-[3px]">
        {points.map((p) => (
          <div
            key={p.label}
            className="flex-1 bg-emerald/70"
            style={{ height: `${Math.max(2, Math.round((p.value / max) * 100))}%` }}
            title={`${p.label}:00 IST, ${p.value} messages`}
          />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between">
        {["00", "06", "12", "18", "23"].map((h) => (
          <span key={h} className="stamp text-slate">
            {h}
          </span>
        ))}
      </div>
      {busiest && busiest.value > 0 ? (
        <p className="stamp mt-2 text-slate">
          Peak {busiest.label}:00 IST, {busiest.value} messages
        </p>
      ) : null}
    </div>
  );
}

/** Thirty-day trend. One polyline, no axes: the shape is the whole message. */
export function Sparkline({ points, label }: { points: Point[]; label: string }) {
  const max = niceMax(points);
  const total = points.reduce((sum, p) => sum + p.value, 0);
  const width = 240;
  const height = 40;

  const d = points
    .map((p, i) => {
      const x = (i / Math.max(1, points.length - 1)) * width;
      const y = height - (p.value / max) * (height - 2) - 1;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className="stamp text-slate">{label}</span>
        <span className="text-sm tabular-nums">{total}</span>
        <span className="stamp text-slate">/ 30 days</span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="mt-2 h-10 w-full"
        role="img"
        aria-label={`${label}: ${total} over the last 30 days`}
      >
        <path d={d} fill="none" stroke="var(--brass)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}
