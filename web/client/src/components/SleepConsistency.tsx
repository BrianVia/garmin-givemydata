import { formatDate } from "../lib/format";

interface SleepTime {
  calendar_date: string;
  sleep_start_local: number;
  sleep_end_local: number;
}

interface Props {
  data: SleepTime[];
}

function msToHourOfDay(ts: number): number {
  // Garmin "local" timestamps are wall-clock time encoded as UTC epoch ms
  const d = new Date(ts);
  return d.getUTCHours() + d.getUTCMinutes() / 60;
}

function formatHour(h: number): string {
  const hour = Math.floor(h) % 24;
  const min = Math.round((h % 1) * 60);
  const period = hour >= 12 ? "PM" : "AM";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${String(min).padStart(2, "0")} ${period}`;
}

export function SleepConsistency({ data }: Props) {
  if (!data.length) return null;

  // Normalize bedtimes: if after noon, subtract 24 to get negative (previous day evening)
  // This way 10 PM = -2, 11 PM = -1, midnight = 0, 1 AM = 1, 7 AM = 7
  const entries = data.map((d) => {
    const bedHour = msToHourOfDay(d.sleep_start_local);
    const wakeHour = msToHourOfDay(d.sleep_end_local);
    // Normalize bedtime: if PM, treat as negative offset from midnight
    const normBed = bedHour > 12 ? bedHour - 24 : bedHour;
    return { date: d.calendar_date, bed: normBed, wake: wakeHour, bedRaw: bedHour, wakeRaw: wakeHour };
  });

  // Chart range: min bed to max wake
  const allBeds = entries.map((e) => e.bed);
  const allWakes = entries.map((e) => e.wake);
  const minHour = Math.floor(Math.min(...allBeds)) - 0.5;
  const maxHour = Math.ceil(Math.max(...allWakes)) + 0.5;
  const hourRange = maxHour - minHour;

  const avgBed = allBeds.reduce((a, b) => a + b, 0) / allBeds.length;
  const avgWake = allWakes.reduce((a, b) => a + b, 0) / allWakes.length;

  const barHeight = 16;
  const gap = 4;
  const chartHeight = entries.length * (barHeight + gap);
  const w = 100;

  return (
    <div class="chart-container">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
        <h3 style="margin:0">Sleep Consistency</h3>
        <span style="font-size:0.75rem;color:var(--text-dim)">
          Avg bed: {formatHour(avgBed < 0 ? avgBed + 24 : avgBed)} · Avg wake: {formatHour(avgWake)}
        </span>
      </div>

      <div style="position:relative;overflow-x:auto">
        {/* Hour labels */}
        <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem;padding-left:60px">
          {Array.from({ length: Math.ceil(hourRange) + 1 }, (_, i) => {
            const h = minHour + i;
            const displayH = h < 0 ? h + 24 : h;
            return (
              <span key={i} style="font-size:0.65rem;color:var(--text-dim);min-width:40px;text-align:center">
                {formatHour(displayH)}
              </span>
            );
          })}
        </div>

        {/* Bars */}
        {entries.map((e, i) => {
          const left = ((e.bed - minHour) / hourRange) * 100;
          const width = ((e.wake - e.bed) / hourRange) * 100;
          return (
            <div
              key={e.date}
              style={`display:flex;align-items:center;height:${barHeight}px;margin-bottom:${gap}px`}
            >
              <span style="width:60px;font-size:0.7rem;color:var(--text-dim);flex-shrink:0">
                {formatDate(e.date)}
              </span>
              <div style="flex:1;position:relative;height:100%;background:var(--bg);border-radius:3px">
                <div
                  style={{
                    position: "absolute",
                    left: `${left}%`,
                    width: `${width}%`,
                    height: "100%",
                    background: "var(--color-sleep)",
                    borderRadius: "3px",
                    opacity: 0.7,
                  }}
                  title={`${formatDate(e.date)}: ${formatHour(e.bedRaw)} - ${formatHour(e.wakeRaw)}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
