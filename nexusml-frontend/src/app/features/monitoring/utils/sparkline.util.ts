import { MetricPoint } from '../models/monitoring.model';

export interface SparklineResult {
  polyline: string;
  area: string;
}

/**
 * Normalizes MetricPoint values to a width x height viewBox and produces
 * an SVG polyline points string plus a closed area path points string.
 */
export function generateSparkline(points: MetricPoint[], width: number, height: number): SparklineResult {
  if (!points.length) {
    return { polyline: '', area: '' };
  }

  const values = points.map(point => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = points.length > 1 ? width / (points.length - 1) : 0;

  const coords = points.map((point, index) => {
    const x = index * stepX;
    const normalized = (point.value - min) / range;
    const y = height - normalized * height;
    return { x, y };
  });

  const polyline = coords.map(coord => `${coord.x.toFixed(1)},${coord.y.toFixed(1)}`).join(' ');
  const area = `0,${height} ${polyline} ${width.toFixed(1)},${height}`;

  return { polyline, area };
}
