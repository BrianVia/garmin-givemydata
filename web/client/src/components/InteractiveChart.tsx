import { useState, useRef } from "preact/hooks";

interface DataPoint {
  x: number;  // 0-1 normalized position
  value: number;
  label?: string;  // tooltip label (e.g., time or date)
}

interface Series {
  points: DataPoint[];
  color: string;
  label: string;
  unit: string;
}

interface Props {
  series: Series[];
  height?: number;
  showFill?: boolean;
  children?: any; // extra SVG content rendered behind the overlay
}

export function InteractiveChart({ series, height = 100, showFill = true, children }: Props) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const w = 1000;
  const pad = 4;

  // Compute Y scale across all series
  const allValues = series.flatMap((s) => s.points.map((p) => p.value));
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const range = max - min || 1;

  const toY = (v: number) => height - pad - ((v - min) / range) * (height - pad * 2);
  const toX = (x: number) => pad + x * (w - pad * 2);

  function handleMouseMove(e: MouseEvent) {
    const svg = svgRef.current;
    if (!svg || !series[0]?.points.length) return;
    const rect = svg.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width;
    // Find nearest point index
    const pts = series[0]!.points;
    let nearest = 0;
    let nearestDist = Infinity;
    for (let i = 0; i < pts.length; i++) {
      const dist = Math.abs(pts[i]!.x - xPct);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    }
    setHoverIdx(nearest);
  }

  const hoverX = hoverIdx != null && series[0]?.points[hoverIdx]
    ? toX(series[0].points[hoverIdx]!.x)
    : null;

  return (
    <div style="position:relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${w} ${height}`}
        style={`width:100%;height:${height}px;cursor:crosshair`}
        preserveAspectRatio="none"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIdx(null)}
      >
        {children}

        {series.map((s, si) => {
          const linePoints = s.points.map((p) => `${toX(p.x)},${toY(p.value)}`).join(" ");
          const fillPoints = [
            `${toX(s.points[0]!.x)},${height}`,
            ...s.points.map((p) => `${toX(p.x)},${toY(p.value)}`),
            `${toX(s.points[s.points.length - 1]!.x)},${height}`,
          ].join(" ");

          return (
            <g key={si}>
              {showFill && (
                <polygon points={fillPoints} fill={s.color} opacity="0.1" />
              )}
              <polyline
                points={linePoints}
                fill="none"
                stroke={s.color}
                stroke-width="1.5"
                vector-effect="non-scaling-stroke"
                stroke-linejoin="round"
              />
              {/* Hover dot */}
              {hoverIdx != null && s.points[hoverIdx] && (
                <circle
                  cx={toX(s.points[hoverIdx]!.x)}
                  cy={toY(s.points[hoverIdx]!.value)}
                  r="5"
                  fill={s.color}
                  stroke="var(--bg)"
                  stroke-width="2"
                  vector-effect="non-scaling-stroke"
                />
              )}
            </g>
          );
        })}

        {/* Vertical crosshair */}
        {hoverX != null && (
          <line
            x1={hoverX} y1={0} x2={hoverX} y2={height}
            stroke="var(--text-dim)" stroke-width="1" opacity="0.4"
            vector-effect="non-scaling-stroke"
            stroke-dasharray="4,4"
          />
        )}
      </svg>

      {/* Tooltip */}
      {hoverIdx != null && series[0]?.points[hoverIdx] && (
        <div
          style={{
            position: "absolute",
            top: "4px",
            right: "8px",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "0.5rem 0.75rem",
            fontSize: "0.8rem",
            pointerEvents: "none",
            zIndex: 10,
            minWidth: "100px",
          }}
        >
          {series[0]!.points[hoverIdx]!.label && (
            <div style="color:var(--text-dim);font-size:0.7rem;margin-bottom:0.25rem">
              {series[0]!.points[hoverIdx]!.label}
            </div>
          )}
          {series.map((s, si) => {
            const pt = s.points[hoverIdx!];
            if (!pt) return null;
            return (
              <div key={si} style={`color:${s.color};font-weight:600`}>
                {s.label}: {Math.round(pt.value * 10) / 10}{s.unit}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
