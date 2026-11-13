const fixed = (n) => Number(n.toFixed(3));

// Fraction 0..1 clockwise from the top of the circle to a point on it.
export function polarPoint(cx, cy, r, fraction) {
  const angle = fraction * 2 * Math.PI - Math.PI / 2;
  return { x: fixed(cx + r * Math.cos(angle)), y: fixed(cy + r * Math.sin(angle)) };
}

// SVG path for one donut arc between two fractions; a full circle is trimmed so the arc still draws.
export function arcPath({ cx = 50, cy = 50, r = 40, from = 0, to = 1 }) {
  const span = Math.min(Math.max(to - from, 0), 0.9999);
  if (span === 0) return "";
  const start = polarPoint(cx, cy, r, from);
  const end = polarPoint(cx, cy, r, from + span);
  const large = span > 0.5 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`;
}

// Items with amountMinor become items with from/to fractions of the total (zero total gives no segments).
export function donutSegments(items) {
  const total = items.reduce((sum, item) => sum + Math.max(item.amountMinor, 0), 0);
  if (total <= 0) return [];
  let cursor = 0;
  return items
    .filter((item) => item.amountMinor > 0)
    .map((item) => {
      const from = cursor;
      cursor += item.amountMinor / total;
      return { ...item, from, to: cursor };
    });
}

// Height as a percent of the track; tall outliers are capped so normal days stay readable.
export function barPercent(value, cap, { min = 4 } = {}) {
  if (value <= 0 || cap <= 0) return 0;
  return Math.max(min, Math.min((Math.min(value, cap) / cap) * 100, 100));
}

// Cap = twice the average non-zero value, or the maximum when no value exceeds it.
export function barCap(values) {
  const positive = values.filter((v) => v > 0);
  if (positive.length === 0) return 0;
  const max = Math.max(...positive);
  const cap = (positive.reduce((a, b) => a + b, 0) / positive.length) * 2;
  return max <= cap ? max : cap;
}
