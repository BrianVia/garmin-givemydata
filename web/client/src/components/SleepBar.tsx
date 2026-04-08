interface Props {
  deep: number;
  light: number;
  rem: number;
  awake: number;
}

export function SleepBar({ deep, light, rem, awake }: Props) {
  const total = deep + light + rem + awake;
  if (!total) return null;

  const pct = (v: number) => `${((v / total) * 100).toFixed(1)}%`;

  return (
    <div class="sleep-bar" title={`Deep: ${deep}m | Light: ${light}m | REM: ${rem}m | Awake: ${awake}m`}>
      <div class="sleep-deep" style={{ width: pct(deep) }} />
      <div class="sleep-light" style={{ width: pct(light) }} />
      <div class="sleep-rem" style={{ width: pct(rem) }} />
      <div class="sleep-awake" style={{ width: pct(awake) }} />
    </div>
  );
}
