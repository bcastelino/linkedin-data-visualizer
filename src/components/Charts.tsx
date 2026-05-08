import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line,
} from 'recharts';

const BRAND = '#0b64c3';
const MID = '#174c81';
const DARK = '#1c2c34';
const PALETTE = ['#0b64c3', '#a2c8ee', '#1464c0', '#084a90', '#174c81', '#1c2c34'];

export function BarTimeSeries({ data, dataKey = 'count', xKey = 'key', height = 220 }: {
  data: Record<string, unknown>[];
  dataKey?: string;
  xKey?: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid stroke="#d8eafd" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: MID }} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 11, fill: MID }} allowDecimals={false} />
        <Tooltip />
        <Bar dataKey={dataKey} fill={BRAND} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function LineTimeSeries({ data, dataKey = 'count', xKey = 'key', height = 220 }: {
  data: Record<string, unknown>[];
  dataKey?: string;
  xKey?: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid stroke="#d8eafd" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: MID }} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 11, fill: MID }} allowDecimals={false} />
        <Tooltip />
        <Line type="monotone" dataKey={dataKey} stroke={DARK} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function HBarList({ data, height = 280 }: { data: { label: string; value: number }[]; height?: number }) {
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const max = Math.max(1, ...sorted.map((d) => d.value));
  return (
    <div style={{ height }} className="overflow-y-auto pr-1">
      {sorted.map((d) => (
        <div key={d.label} className="mb-2">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
            <span className="truncate pr-2 text-brand-900" title={d.label}>{d.label}</span>
            <span className="font-medium text-slate-900 tabular-nums">{d.value.toLocaleString()}</span>
          </div>
          <div className="h-2 rounded bg-slate-100 overflow-hidden">
            <div className="h-2 bg-brand-500" style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
      {!sorted.length && <p className="text-sm text-slate-500">No data.</p>}
    </div>
  );
}

/**
 * CategoryBreakdown: a clean alternative to a pie/donut that handles
 * heavily skewed distributions gracefully. Renders a 100%-stacked bar
 * plus a labeled list with count and percentage.
 *
 * Exported as both `CategoryBreakdown` and `DonutChart` (back-compat).
 */
export function CategoryBreakdown({ data, maxItems = 8 }: {
  data: { label: string; value: number }[];
  maxItems?: number;
}) {
  if (!data.length) return <p className="text-sm text-slate-500">No data.</p>;
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const visible = sorted.slice(0, maxItems);
  const rest = sorted.slice(maxItems);
  const restSum = rest.reduce((acc, d) => acc + d.value, 0);
  const items = restSum > 0
    ? [...visible, { label: `Other (${rest.length})`, value: restSum }]
    : visible;
  const total = items.reduce((acc, d) => acc + d.value, 0) || 1;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex w-full h-3 rounded-full overflow-hidden bg-slate-100" role="img" aria-label="Category breakdown bar">
        {items.map((d, i) => {
          const pct = (d.value / total) * 100;
          return (
            <div
              key={d.label}
              className="h-full"
              style={{ width: `${pct}%`, background: PALETTE[i % PALETTE.length] }}
              title={`${d.label}: ${d.value.toLocaleString()} (${pct.toFixed(1)}%)`}
            />
          );
        })}
      </div>
      <ul className="flex flex-col gap-1.5 text-sm">
        {items.map((d, i) => {
          const pct = (d.value / total) * 100;
          return (
            <li key={d.label} className="flex items-center gap-2 min-w-0">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: PALETTE[i % PALETTE.length] }}
                aria-hidden
              />
              <span className="truncate text-slate-700" title={d.label}>{d.label}</span>
              <span className="ml-auto tabular-nums text-slate-900 font-medium">{d.value.toLocaleString()}</span>
              <span className="tabular-nums text-xs text-slate-500 w-12 text-right">{pct.toFixed(1)}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// Back-compat alias for callers using the old name.
export const DonutChart = CategoryBreakdown;
