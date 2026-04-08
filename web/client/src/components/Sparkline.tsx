interface Props {
  data: number[];
  color?: string;
  height?: number;
}

export function Sparkline({ data, color = "var(--accent)", height = 40 }: Props) {
  if (!data.length) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 100;
  const pad = 2;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = height - pad - ((v - min) / range) * (height - pad * 2);
    return `${x},${y}`;
  });

  return (
    <div class="sparkline">
      <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none">
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke={color}
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>
  );
}
