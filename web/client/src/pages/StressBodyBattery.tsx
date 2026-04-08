import { useState } from "preact/hooks";
import { useApi } from "../lib/hooks";
import { round, formatDate } from "../lib/format";
import { MetricCard } from "../components/MetricCard";
import { Sparkline } from "../components/Sparkline";
import { InteractiveChart } from "../components/InteractiveChart";

interface StressRow {
  calendar_date: string;
  avg_stress: number;
  max_stress: number;
  stress_qualifier: string;
}

interface BatteryRow {
  calendar_date: string;
  charged: number;
  drained: number;
  highest: number;
  lowest: number;
  most_recent: number;
  at_wake: number;
}

interface IntradayPoint { timestamp_gmt: number; value: number }
interface BatteryPoint { timestamp_gmt: number; value: number; status: string }

interface DayDetail {
  summary: StressRow;
  daily: {
    low_stress_seconds: number;
    medium_stress_seconds: number;
    high_stress_seconds: number;
    body_battery_charged: number;
    body_battery_drained: number;
    body_battery_highest: number;
    body_battery_lowest: number;
    body_battery_at_wake: number;
    body_battery_most_recent: number;
  };
  stress: IntradayPoint[];
  body_battery: BatteryPoint[];
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function IntradayChart({
  data, color, label, unit, height = 80,
}: {
  data: IntradayPoint[];
  color: string;
  label: string;
  unit: string;
  height?: number;
}) {
  if (!data.length) return null;
  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);

  const points = data.map((d, i) => ({
    x: i / (data.length - 1),
    value: d.value,
    label: formatTime(d.timestamp_gmt),
  }));

  return (
    <div class="chart-container">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">
        <h3 style="margin:0">{label}</h3>
        <span style="font-size:0.75rem;color:var(--text-dim)">
          avg: {avg}{unit} · min: {min}{unit} · max: {max}{unit}
        </span>
      </div>

      <div style="display:flex;justify-content:space-between;margin-bottom:0.25rem">
        {[0, 0.25, 0.5, 0.75, 1].map((f) => {
          const idx = Math.min(Math.floor(f * (data.length - 1)), data.length - 1);
          return <span key={f} style="font-size:0.65rem;color:var(--text-dim)">{formatTime(data[idx]!.timestamp_gmt)}</span>;
        })}
      </div>

      <InteractiveChart
        series={[{ points, color, label, unit }]}
        height={height}
      />
    </div>
  );
}

function StressBreakdown({ low, med, high }: { low: number; med: number; high: number }) {
  const total = low + med + high;
  if (!total) return null;
  const fmt = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.round((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };
  const pct = (v: number) => ((v / total) * 100).toFixed(0);

  return (
    <div class="chart-container">
      <h3>Stress Breakdown</h3>
      <div style="display:flex;height:32px;border-radius:6px;overflow:hidden;gap:2px;margin-bottom:0.75rem">
        <div style={`width:${pct(low)}%;background:#22c55e;display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:600;color:white`}>
          {pct(low)}%
        </div>
        <div style={`width:${pct(med)}%;background:#f59e0b;display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:600;color:white`}>
          {pct(med)}%
        </div>
        <div style={`width:${pct(high)}%;background:#ef4444;display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:600;color:white`}>
          {pct(high)}%
        </div>
      </div>
      <div style="display:flex;gap:2rem;font-size:0.8rem">
        <span style="color:#22c55e">Low: {fmt(low)}</span>
        <span style="color:#f59e0b">Medium: {fmt(med)}</span>
        <span style="color:#ef4444">High: {fmt(high)}</span>
      </div>
    </div>
  );
}

function DayDrilldown({ date }: { date: string }) {
  const { data, loading } = useApi<DayDetail>(`/health/stress/${date}`);

  if (loading) return <div class="loading">Loading...</div>;
  if (!data) return <div class="loading">No data for this date</div>;

  return (
    <div>
      {data.daily && (
        <StressBreakdown
          low={data.daily.low_stress_seconds || 0}
          med={data.daily.medium_stress_seconds || 0}
          high={data.daily.high_stress_seconds || 0}
        />
      )}

      <IntradayChart data={data.stress} color="var(--color-stress)" label="Stress Level (24h)" unit="" height={100} />

      <IntradayChart
        data={data.body_battery.map((b) => ({ timestamp_gmt: b.timestamp_gmt, value: b.value }))}
        color="var(--color-battery)"
        label="Body Battery (24h)"
        unit=""
        height={100}
      />
    </div>
  );
}

export function StressBodyBattery() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { data: stressData, loading: l1 } = useApi<StressRow[]>("/health/stress", { days: "30" });
  const { data: batteryData, loading: l2 } = useApi<BatteryRow[]>("/health/body-battery", { days: "30" });

  if (l1 || l2) return <div class="loading">Loading...</div>;

  const latestStress = stressData?.[stressData.length - 1];
  const latestBattery = batteryData?.[batteryData.length - 1];

  return (
    <div>
      <div class="page-header">
        <h1>Stress & Body Battery</h1>
        <p>Last 30 days — click a date for 24h detail</p>
      </div>

      <div class="cards">
        <MetricCard label="Avg Stress" value={latestStress?.avg_stress ?? "--"} color="var(--color-stress)"
          sub={latestStress?.stress_qualifier ?? ""}>
          <Sparkline data={stressData?.map((d) => d.avg_stress).filter(Boolean) as number[] ?? []} color="var(--color-stress)" />
        </MetricCard>

        <MetricCard label="Max Stress" value={latestStress?.max_stress ?? "--"} color="var(--color-hr)">
          <Sparkline data={stressData?.map((d) => d.max_stress).filter(Boolean) as number[] ?? []} color="var(--color-hr)" />
        </MetricCard>

        <MetricCard label="Body Battery High" value={latestBattery?.highest ?? "--"} color="var(--color-battery)"
          sub={latestBattery ? `Wake: ${latestBattery.at_wake}` : ""}>
          <Sparkline data={batteryData?.map((d) => d.highest).filter(Boolean) as number[] ?? []} color="var(--color-battery)" />
        </MetricCard>

        <MetricCard label="Charge / Drain" value={latestBattery ? `+${latestBattery.charged}/-${latestBattery.drained}` : "--"}
          color="var(--color-battery)">
          <Sparkline data={batteryData?.map((d) => d.charged).filter(Boolean) as number[] ?? []} color="var(--color-battery)" />
        </MetricCard>
      </div>

      {/* Date selector */}
      {stressData && stressData.length > 0 && (
        <div style="display:flex;gap:0.375rem;flex-wrap:wrap;margin-bottom:1.5rem">
          {[...stressData].reverse().map((d) => (
            <button
              key={d.calendar_date}
              onClick={() => setSelectedDate(selectedDate === d.calendar_date ? null : d.calendar_date)}
              style={`padding:0.375rem 0.75rem;border-radius:6px;font-size:0.8rem;cursor:pointer;border:1px solid var(--border);transition:all 0.15s;
                ${selectedDate === d.calendar_date
                  ? "background:var(--accent);color:white;border-color:var(--accent)"
                  : "background:var(--bg-card);color:var(--text-dim)"}`}
            >
              {formatDate(d.calendar_date)}
            </button>
          ))}
        </div>
      )}

      {selectedDate && <DayDrilldown date={selectedDate} />}

      <div class="table-wrap">
        <h3>Daily Summary</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Avg Stress</th>
              <th>Max Stress</th>
              <th>Quality</th>
              <th>BB High</th>
              <th>BB Low</th>
              <th>BB Wake</th>
              <th>Charged</th>
              <th>Drained</th>
            </tr>
          </thead>
          <tbody>
            {stressData && batteryData && [...stressData].reverse().map((s) => {
              const b = batteryData.find((bb) => bb.calendar_date === s.calendar_date);
              return (
                <tr key={s.calendar_date}>
                  <td>{formatDate(s.calendar_date)}</td>
                  <td>{s.avg_stress}</td>
                  <td>{s.max_stress}</td>
                  <td>
                    <span class={`badge ${s.stress_qualifier === "CALM" || s.stress_qualifier === "LOW" ? "badge-green"
                      : s.stress_qualifier === "MEDIUM" ? "badge-yellow" : "badge-red"}`}>
                      {s.stress_qualifier || "--"}
                    </span>
                  </td>
                  <td>{b?.highest ?? "--"}</td>
                  <td>{b?.lowest ?? "--"}</td>
                  <td>{b?.at_wake ?? "--"}</td>
                  <td style="color:#22c55e">{b?.charged ? `+${b.charged}` : "--"}</td>
                  <td style="color:#ef4444">{b?.drained ? `-${b.drained}` : "--"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
