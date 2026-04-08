import { useState } from "preact/hooks";
import { useApi } from "../lib/hooks";
import { round, formatDate } from "../lib/format";
import { MetricCard } from "../components/MetricCard";
import { Sparkline } from "../components/Sparkline";
import { InteractiveChart } from "../components/InteractiveChart";

interface HrRow {
  calendar_date: string;
  resting_hr: number;
  min_hr: number;
  max_hr: number;
  avg_hr: number;
}

interface IntradayPoint { timestamp_gmt: number; value: number }

interface HrDetail {
  summary: HrRow;
  heart_rate: IntradayPoint[];
}

const ZONE_COLORS = ["#94a3b8", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444"];
const ZONE_BOUNDARIES = [97, 116, 136, 155, 175, 194]; // from hr_zones table

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function getZone(hr: number): number {
  for (let i = ZONE_BOUNDARIES.length - 1; i >= 0; i--) {
    if (hr >= (ZONE_BOUNDARIES[i] ?? 0)) return Math.min(i, 4);
  }
  return 0;
}

function HrDayChart({ data, height = 120 }: { data: IntradayPoint[]; height?: number }) {
  if (!data.length) return null;

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);

  const points = data.map((d, i) => ({
    x: i / (data.length - 1),
    value: d.value,
    label: `${formatTime(d.timestamp_gmt)} — Z${getZone(d.value) + 1}`,
  }));

  // Zone time distribution
  const zoneTimes = [0, 0, 0, 0, 0];
  for (const d of data) {
    zoneTimes[getZone(d.value)]!++;
  }
  const totalPts = data.length;

  return (
    <div>
      <div class="chart-container">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">
          <h3 style="margin:0">24-Hour Heart Rate</h3>
          <span style="font-size:0.75rem;color:var(--text-dim)">
            avg: {avg} · min: {min} · max: {max} bpm
          </span>
        </div>

        <div style="display:flex;justify-content:space-between;margin-bottom:0.25rem">
          {[0, 0.25, 0.5, 0.75, 1].map((f) => {
            const idx = Math.min(Math.floor(f * (data.length - 1)), data.length - 1);
            return (
              <span key={f} style="font-size:0.65rem;color:var(--text-dim)">
                {formatTime(data[idx]!.timestamp_gmt)}
              </span>
            );
          })}
        </div>

        <InteractiveChart
          series={[{ points, color: "var(--color-hr)", label: "HR", unit: " bpm" }]}
          height={height}
        />
      </div>

      {/* Zone distribution */}
      <div class="chart-container">
        <h3>Time in HR Zones</h3>
        <div style="display:flex;height:28px;border-radius:6px;overflow:hidden;gap:2px;margin-bottom:0.75rem">
          {zoneTimes.map((count, i) =>
            count > 0 ? (
              <div
                key={i}
                style={`width:${(count / totalPts) * 100}%;background:${ZONE_COLORS[i]};display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:600;color:white;min-width:20px`}
              >
                Z{i + 1}
              </div>
            ) : null
          )}
        </div>
        <div style="display:flex;gap:1.5rem;flex-wrap:wrap;font-size:0.8rem">
          {zoneTimes.map((count, i) => {
            const pct = ((count / totalPts) * 100).toFixed(0);
            return count > 0 ? (
              <span key={i} style={`color:${ZONE_COLORS[i]}`}>
                Z{i + 1} ({ZONE_BOUNDARIES[i]}-{ZONE_BOUNDARIES[i + 1] || "max"}): {pct}%
              </span>
            ) : null;
          })}
        </div>
      </div>
    </div>
  );
}

export function HeartRate() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { data, loading } = useApi<HrRow[]>("/health/heart-rate", { days: "30" });
  const { data: detail } = useApi<HrDetail | null>(
    selectedDate ? `/health/heart-rate/${selectedDate}` : "/health/heart-rate",
    selectedDate ? undefined : { days: "0" }
  );

  if (loading) return <div class="loading">Loading...</div>;
  if (!data?.length) return <div class="loading">No heart rate data</div>;

  const latest = data[data.length - 1]!;

  return (
    <div>
      <div class="page-header">
        <h1>Heart Rate</h1>
        <p>Last 30 days — click a date for 24h detail</p>
      </div>

      <div class="cards">
        <MetricCard label="Resting HR" value={latest.resting_hr ?? "--"} unit="bpm" color="var(--color-hr)">
          <Sparkline data={data.map((d) => d.resting_hr).filter(Boolean) as number[]} color="var(--color-hr)" />
        </MetricCard>

        <MetricCard label="Min HR" value={latest.min_hr ?? "--"} unit="bpm" color="#3b82f6">
          <Sparkline data={data.map((d) => d.min_hr).filter(Boolean) as number[]} color="#3b82f6" />
        </MetricCard>

        <MetricCard label="Max HR" value={latest.max_hr ?? "--"} unit="bpm" color="#ef4444">
          <Sparkline data={data.map((d) => d.max_hr).filter(Boolean) as number[]} color="#ef4444" />
        </MetricCard>

        <MetricCard label="Avg HR" value={latest.avg_hr != null ? round(latest.avg_hr) : "--"} unit="bpm" color="var(--color-stress)">
          <Sparkline data={data.map((d) => d.avg_hr).filter(Boolean) as number[]} color="var(--color-stress)" />
        </MetricCard>
      </div>

      {/* Date selector */}
      <div style="display:flex;gap:0.375rem;flex-wrap:wrap;margin-bottom:1.5rem">
        {[...data].reverse().map((d) => (
          <button
            key={d.calendar_date}
            onClick={() => setSelectedDate(selectedDate === d.calendar_date ? null : d.calendar_date)}
            style={`padding:0.375rem 0.75rem;border-radius:6px;font-size:0.8rem;cursor:pointer;border:1px solid var(--border);transition:all 0.15s;
              ${selectedDate === d.calendar_date
                ? "background:var(--color-hr);color:white;border-color:var(--color-hr)"
                : "background:var(--bg-card);color:var(--text-dim)"}`}
          >
            {formatDate(d.calendar_date)}
          </button>
        ))}
      </div>

      {selectedDate && detail && 'heart_rate' in detail && detail.heart_rate?.length > 0 && (
        <HrDayChart data={detail.heart_rate} />
      )}

      <div class="table-wrap">
        <h3>Daily Summary</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Resting</th>
              <th>Min</th>
              <th>Max</th>
              <th>Avg</th>
            </tr>
          </thead>
          <tbody>
            {[...data].reverse().map((d) => (
              <tr key={d.calendar_date}>
                <td>{formatDate(d.calendar_date)}</td>
                <td style="font-weight:600;color:var(--color-hr)">{d.resting_hr} bpm</td>
                <td>{d.min_hr} bpm</td>
                <td>{d.max_hr} bpm</td>
                <td>{d.avg_hr ? round(d.avg_hr) : "--"} bpm</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
