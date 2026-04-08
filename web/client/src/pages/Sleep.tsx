import { useState } from "preact/hooks";
import { useApi } from "../lib/hooks";
import { round, formatDate, formatMinutes } from "../lib/format";
import { MetricCard } from "../components/MetricCard";
import { SleepBar } from "../components/SleepBar";
import { Sparkline } from "../components/Sparkline";
import { SleepTimeline } from "../components/SleepTimeline";
import { SleepConsistency } from "../components/SleepConsistency";

interface SleepRow {
  calendar_date: string;
  sleep_hours: number;
  deep_min: number;
  light_min: number;
  rem_min: number;
  awake_min: number;
  average_hr_sleep: number;
  average_spo2: number;
  avg_sleep_stress: number;
  sleep_score_feedback: string;
  sleep_score_insight: string;
}

interface SleepTimeRow {
  calendar_date: string;
  sleep_start_local: number;
  sleep_end_local: number;
  sleep_score_feedback: string;
  sleep_score_insight: string;
  personalized_insight: string;
}

interface SleepDetail {
  summary: SleepRow;
  times: {
    sleep_start_local: number;
    sleep_end_local: number;
    sleep_start_gmt: number;
    sleep_end_gmt: number;
  };
  levels: Array<{ start_gmt: string; end_gmt: string; activity_level: number }>;
  heart_rate: Array<{ timestamp_gmt: number; value: number }>;
  hrv: Array<{ timestamp_gmt: number; value: number }>;
  stress: Array<{ timestamp_gmt: number; value: number }>;
  body_battery: Array<{ timestamp_gmt: number; value: number }>;
  respiration: Array<{ timestamp_gmt: number; value: number }>;
}

const FEEDBACK_LABELS: Record<string, { text: string; cls: string }> = {
  POSITIVE_LONG_AND_DEEP: { text: "Great sleep", cls: "badge-green" },
  POSITIVE_SHORT_BUT_DEEP: { text: "Short but deep", cls: "badge-green" },
  POSITIVE_RESTFUL_EVENING: { text: "Restful evening", cls: "badge-green" },
  NEGATIVE_LONG_BUT_DISCONTINUOUS: { text: "Restless", cls: "badge-yellow" },
  NEGATIVE_DISCONTINUOUS: { text: "Disrupted", cls: "badge-yellow" },
  NEGATIVE_SHORT_AND_DISCONTINUOUS: { text: "Short & restless", cls: "badge-red" },
  NEGATIVE_SHORT: { text: "Too short", cls: "badge-red" },
  NEGATIVE_LONG_BUT_SHALLOW: { text: "Shallow", cls: "badge-yellow" },
  NEGATIVE_SHORT_AND_SHALLOW: { text: "Short & shallow", cls: "badge-red" },
};

const INSIGHT_LABELS: Record<string, { text: string; cls: string }> = {
  POSITIVE_RESTFUL_EVENING: { text: "Restful evening", cls: "badge-green" },
  POSITIVE_LOW_STRESS: { text: "Low stress", cls: "badge-green" },
  NEGATIVE_HIGH_STRESS: { text: "High stress", cls: "badge-red" },
  NEGATIVE_LATE_ACTIVITY: { text: "Late activity", cls: "badge-yellow" },
};

function FeedbackBadge({ feedback, insight }: { feedback: string; insight: string }) {
  const fb = FEEDBACK_LABELS[feedback];
  const ins = insight !== "NONE" ? INSIGHT_LABELS[insight] : null;
  return (
    <div style="display:flex;gap:0.375rem;flex-wrap:wrap">
      {fb && <span class={`badge ${fb.cls}`}>{fb.text}</span>}
      {ins && <span class={`badge ${ins.cls}`}>{ins.text}</span>}
    </div>
  );
}

function NightDetail({ date }: { date: string }) {
  const { data, loading } = useApi<SleepDetail>(`/health/sleep/${date}`);

  if (loading) return <div class="loading" style="padding:1.5rem">Loading night detail...</div>;
  if (!data || !data.levels?.length) return <div class="loading" style="padding:1.5rem">No detailed data available</div>;

  return (
    <div style="padding:1rem 1.25rem 1.25rem;border-top:1px solid var(--border)">
      <SleepTimeline
        levels={data.levels}
        heartRate={data.heart_rate}
        hrv={data.hrv}
        stress={data.stress}
        bodyBattery={data.body_battery}
        respiration={data.respiration}
        sleepStart={data.times.sleep_start_gmt}
        sleepEnd={data.times.sleep_end_gmt}
      />
    </div>
  );
}

export function Sleep() {
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const { data, loading } = useApi<SleepRow[]>("/health/sleep", { days: "30" });
  const { data: consistency } = useApi<SleepTimeRow[]>("/health/sleep/consistency", { days: "30" });

  if (loading) return <div class="loading">Loading...</div>;
  if (!data?.length) return <div class="loading">No sleep data available</div>;

  const latest = data[data.length - 1]!;
  const avgHours = data.reduce((s, d) => s + (d.sleep_hours || 0), 0) / data.length;
  const avgDeep = data.reduce((s, d) => s + (d.deep_min || 0), 0) / data.length;
  const avgRem = data.reduce((s, d) => s + (d.rem_min || 0), 0) / data.length;

  return (
    <div>
      <div class="page-header">
        <h1>Sleep</h1>
        <p>Last 30 days — click a row for night detail</p>
      </div>

      <div class="cards">
        <MetricCard
          label="Last Night"
          value={round(latest.sleep_hours)}
          unit="hrs"
          color="var(--color-sleep)"
        >
          <SleepBar deep={latest.deep_min} light={latest.light_min} rem={latest.rem_min} awake={latest.awake_min} />
        </MetricCard>

        <MetricCard label="30-Day Avg" value={round(avgHours)} unit="hrs" color="var(--color-sleep)">
          <Sparkline data={data.map((d) => d.sleep_hours).filter(Boolean) as number[]} color="var(--color-sleep)" />
        </MetricCard>

        <MetricCard label="Sleep HR" value={round(latest.average_hr_sleep)} unit="bpm" color="var(--color-hr)">
          <Sparkline data={data.map((d) => d.average_hr_sleep).filter(Boolean) as number[]} color="var(--color-hr)" />
        </MetricCard>

        <MetricCard label="Avg Deep" value={formatMinutes(avgDeep)} color="var(--color-deep)">
          <Sparkline data={data.map((d) => d.deep_min).filter(Boolean) as number[]} color="var(--color-deep)" />
        </MetricCard>

        <MetricCard label="Avg REM" value={formatMinutes(avgRem)} color="var(--color-rem)">
          <Sparkline data={data.map((d) => d.rem_min).filter(Boolean) as number[]} color="var(--color-rem)" />
        </MetricCard>

        <MetricCard label="Sleep Stress" value={round(latest.avg_sleep_stress)} color="var(--color-stress)">
          <Sparkline data={data.map((d) => d.avg_sleep_stress).filter(Boolean) as number[]} color="var(--color-stress)" />
        </MetricCard>
      </div>

      {/* Sleep consistency chart */}
      {consistency && consistency.length > 0 && (
        <SleepConsistency data={consistency} />
      )}

      {/* Sleep history table */}
      <div class="table-wrap">
        <h3>Sleep History</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Total</th>
              <th>Deep</th>
              <th>Light</th>
              <th>REM</th>
              <th>Awake</th>
              <th>Stages</th>
              <th>HR</th>
              <th>Quality</th>
            </tr>
          </thead>
          <tbody>
            {[...data].reverse().map((d) => (
              <>
                <tr
                  key={d.calendar_date}
                  onClick={() =>
                    setExpandedDate(expandedDate === d.calendar_date ? null : d.calendar_date)
                  }
                  style="cursor:pointer"
                >
                  <td>{formatDate(d.calendar_date)}</td>
                  <td>{round(d.sleep_hours)}h</td>
                  <td>{formatMinutes(d.deep_min)}</td>
                  <td>{formatMinutes(d.light_min)}</td>
                  <td>{formatMinutes(d.rem_min)}</td>
                  <td>{formatMinutes(d.awake_min)}</td>
                  <td style="min-width:120px">
                    <SleepBar deep={d.deep_min} light={d.light_min} rem={d.rem_min} awake={d.awake_min} />
                  </td>
                  <td>{round(d.average_hr_sleep, 0)} bpm</td>
                  <td>
                    <FeedbackBadge feedback={d.sleep_score_feedback} insight={d.sleep_score_insight} />
                  </td>
                </tr>
                {expandedDate === d.calendar_date && (
                  <tr key={`${d.calendar_date}-detail`}>
                    <td colspan={9} style="padding:0;background:var(--bg-card)">
                      <NightDetail date={d.calendar_date} />
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
