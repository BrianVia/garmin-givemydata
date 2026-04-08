interface Level {
  start_gmt: string;
  end_gmt: string;
  activity_level: number;
}

interface TimeSeriesPoint {
  timestamp_gmt: number;
  value: number;
}

interface Props {
  levels: Level[];
  heartRate: TimeSeriesPoint[];
  hrv: TimeSeriesPoint[];
  stress: TimeSeriesPoint[];
  bodyBattery: TimeSeriesPoint[];
  respiration?: TimeSeriesPoint[];
  sleepStart: number;
  sleepEnd: number;
}

const LEVEL_COLORS: Record<number, string> = {
  0: "var(--color-deep)",
  1: "var(--color-light)",
  2: "var(--color-rem)",
  3: "var(--color-awake)",
};

const LEVEL_NAMES: Record<number, string> = {
  0: "Deep",
  1: "Light",
  2: "REM",
  3: "Awake",
};

import { InteractiveChart } from "./InteractiveChart";

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function TimeSeriesLine({
  data,
  minTs,
  maxTs,
  color,
  label,
  unit,
}: {
  data: TimeSeriesPoint[];
  minTs: number;
  maxTs: number;
  color: string;
  label: string;
  unit: string;
}) {
  if (!data.length) return null;

  const tsRange = maxTs - minTs || 1;
  const points = data.map((d) => ({
    x: (d.timestamp_gmt - minTs) / tsRange,
    value: d.value,
    label: formatTime(d.timestamp_gmt),
  }));

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);

  return (
    <div style="margin-bottom: 0.75rem">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.25rem">
        <span style={`font-size:0.75rem;font-weight:600;color:${color};text-transform:uppercase;letter-spacing:0.05em`}>
          {label}
        </span>
        <span style="font-size:0.75rem;color:var(--text-dim)">
          avg: {avg}{unit} · min: {min}{unit} · max: {max}{unit}
        </span>
      </div>
      <InteractiveChart
        series={[{ points, color, label, unit }]}
        height={60}
        showFill={false}
      />
    </div>
  );
}

export function SleepTimeline({ levels, heartRate, hrv, stress, bodyBattery, respiration, sleepStart, sleepEnd }: Props) {
  if (!levels.length) return <div class="loading">No stage data available</div>;

  const totalDuration = sleepEnd - sleepStart || 1;

  // Generate hour markers
  const hours: { ts: number; label: string }[] = [];
  const startHour = new Date(sleepStart);
  startHour.setMinutes(0, 0, 0);
  let hourTs = startHour.getTime() + 3600000;
  while (hourTs < sleepEnd) {
    hours.push({ ts: hourTs, label: formatTime(hourTs) });
    hourTs += 3600000;
  }

  return (
    <div>
      {/* Stage timeline */}
      <div style="margin-bottom:0.25rem">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">
          <span style="font-size:0.75rem;font-weight:600;color:var(--text-dim);text-transform:uppercase;letter-spacing:0.05em">
            Sleep Stages
          </span>
          <div style="display:flex;gap:1rem">
            {Object.entries(LEVEL_NAMES).map(([k, name]) => (
              <span key={k} style="display:flex;align-items:center;gap:0.25rem;font-size:0.7rem;color:var(--text-dim)">
                <span style={`width:10px;height:10px;border-radius:2px;background:${LEVEL_COLORS[Number(k)]}`} />
                {name}
              </span>
            ))}
          </div>
        </div>

        <div style="position:relative;height:36px;border-radius:6px;overflow:hidden;background:var(--bg)">
          {levels.map((lvl, i) => {
            const start = new Date(lvl.start_gmt).getTime();
            const end = new Date(lvl.end_gmt).getTime();
            const left = ((start - sleepStart) / totalDuration) * 100;
            const width = ((end - start) / totalDuration) * 100;
            return (
              <div
                key={i}
                title={`${LEVEL_NAMES[lvl.activity_level]} ${formatTime(start)} - ${formatTime(end)}`}
                style={{
                  position: "absolute",
                  left: `${left}%`,
                  width: `${width}%`,
                  height: "100%",
                  background: LEVEL_COLORS[lvl.activity_level] ?? "var(--border)",
                  borderRight: "1px solid var(--bg)",
                }}
              />
            );
          })}
        </div>

        {/* Hour markers */}
        <div style="position:relative;height:16px;margin-top:2px">
          <span style="position:absolute;left:0;font-size:0.65rem;color:var(--text-dim)">
            {formatTime(sleepStart)}
          </span>
          {hours.map((h) => {
            const left = ((h.ts - sleepStart) / totalDuration) * 100;
            return (
              <span
                key={h.ts}
                style={`position:absolute;left:${left}%;transform:translateX(-50%);font-size:0.65rem;color:var(--text-dim)`}
              >
                {h.label}
              </span>
            );
          })}
          <span style="position:absolute;right:0;font-size:0.65rem;color:var(--text-dim)">
            {formatTime(sleepEnd)}
          </span>
        </div>
      </div>

      {/* Overlaid time series */}
      <div style="margin-top:1rem">
        <TimeSeriesLine
          data={heartRate}
          minTs={sleepStart}
          maxTs={sleepEnd}
          color="var(--color-hr)"
          label="Heart Rate"
          unit=" bpm"
        />
        <TimeSeriesLine
          data={hrv}
          minTs={sleepStart}
          maxTs={sleepEnd}
          color="var(--color-hrv)"
          label="HRV"
          unit=" ms"
        />
        <TimeSeriesLine
          data={stress}
          minTs={sleepStart}
          maxTs={sleepEnd}
          color="var(--color-stress)"
          label="Stress"
          unit=""
        />
        <TimeSeriesLine
          data={bodyBattery}
          minTs={sleepStart}
          maxTs={sleepEnd}
          color="var(--color-battery)"
          label="Body Battery"
          unit=""
        />
        {respiration && respiration.length > 0 && (
          <TimeSeriesLine
            data={respiration}
            minTs={sleepStart}
            maxTs={sleepEnd}
            color="var(--color-spo2)"
            label="Respiration"
            unit=" brpm"
          />
        )}
      </div>
    </div>
  );
}
