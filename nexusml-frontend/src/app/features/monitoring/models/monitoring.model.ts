export type Stage = 'Production' | 'Staging' | 'Development';
export type DriftStatus = 'healthy' | 'warning' | 'critical';
export type InfraStatus = 'healthy' | 'warning' | 'critical' | 'down';
export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertCategory = 'drift' | 'infrastructure' | 'pipeline';
export type FeatureType = 'numerical' | 'categorical';

export interface MetricPoint {
  timestamp: string;
  value: number;
}

export interface ModelMonitor {
  id: string;
  modelName: string;
  stage: Stage;
  metric: string;
  currentValue: number;
  baselineValue: number;
  drift: number;
  driftStatus: DriftStatus;
  trend: MetricPoint[];
  lastUpdated: string;
  threshold: number;
}

export interface FeatureMonitor {
  id: string;
  featureName: string;
  model: string;
  type: FeatureType;
  driftScore: number;
  driftStatus: DriftStatus;
  baselineMean?: number;
  currentMean?: number;
  baselineStd?: number;
  currentStd?: number;
  nullRate: number;
  outlierRate: number;
  lastUpdated: string;
}

export interface InfraMetric {
  id: string;
  service: string;
  cpu: number;
  memory: number;
  latency: number;
  requestsPerMin: number;
  errorRate: number;
  uptime: number;
  status: InfraStatus;
  trend: MetricPoint[];
}

export interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  source: string;
  timestamp: string;
  acknowledged: boolean;
  category: AlertCategory;
}
