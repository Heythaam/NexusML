import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { ToastService } from '../../core/services/toast.service';
import { MonitoringSimulationService } from './services/monitoring-simulation.service';
import { generateSparkline } from './utils/sparkline.util';
import {
  Alert,
  AlertSeverity,
  DriftStatus,
  FeatureMonitor,
  InfraMetric,
  MetricPoint,
  ModelMonitor,
  Stage
} from './models/monitoring.model';

type ActiveTab = 'model-drift' | 'feature-drift' | 'infrastructure';
type AlertFilter = 'all' | AlertSeverity;

interface SparklineView {
  polyline: string;
  area: string;
  lastX: number;
  lastY: number;
  thresholdY: number | null;
}

interface GaugeView {
  dashoffset: number;
  circumference: number;
  colorClass: 'success' | 'warning' | 'danger';
  label: string;
}

const SPARK_WIDTH = 280;
const SPARK_HEIGHT = 60;
const GAUGE_RADIUS = 28;
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS;
const TREND_POINTS = 24;
const LAST_PIPELINE_RUN_LABEL = '2h ago';
const DEFAULT_DAG_RUN_ID = 'run_20260109_0142';

const MODEL_DAG_RUN_IDS: Record<string, string> = {
  'fraud-detection-v2': 'run_20260109_0142',
  'customer-churn-predictor': 'run_20260108_0915',
  'image-classifier-v2': 'run_20251228_0310',
  'sentiment-analyzer': 'run_20260109_0207',
  'recommendation-engine': 'run_20260107_1830',
  'anomaly-detector': 'run_20260105_0921'
};

@Component({
  selector: 'app-monitoring',
  templateUrl: './monitoring.component.html',
  styleUrl: './monitoring.component.scss'
})
export class MonitoringComponent implements OnInit, OnDestroy {
  activeTab: ActiveTab = 'model-drift';
  alertFilter: AlertFilter = 'all';
  expandedFeatureId: string | null = null;
  recentlyUpdatedId: string | null = null;
  refreshFlash = false;
  refreshing = false;
  now = Date.now();
  private lastUpdatedAt = Date.now();
  private readonly subscriptions: Subscription[] = [];

  modelMonitors: ModelMonitor[] = [
    {
      id: 'fraud-detection-v2', modelName: 'fraud-detection-v2', stage: 'Production', metric: 'accuracy',
      currentValue: 0.934, baselineValue: 0.967, drift: this.calcDrift(0.934, 0.967), driftStatus: 'critical',
      trend: this.buildTrend(0.967, 0.934, 0.003), lastUpdated: '2m ago', threshold: 0.95
    },
    {
      id: 'image-classifier-v2', modelName: 'image-classifier-v2', stage: 'Production', metric: 'accuracy',
      currentValue: 0.918, baselineValue: 0.923, drift: this.calcDrift(0.918, 0.923), driftStatus: 'healthy',
      trend: this.buildTrend(0.923, 0.918, 0.004), lastUpdated: '5m ago', threshold: 0.90
    },
    {
      id: 'customer-churn-predictor', modelName: 'customer-churn-predictor', stage: 'Staging', metric: 'f1_score',
      currentValue: 0.871, baselineValue: 0.876, drift: this.calcDrift(0.871, 0.876), driftStatus: 'healthy',
      trend: this.buildTrend(0.876, 0.871, 0.003), lastUpdated: '8m ago', threshold: 0.85
    },
    {
      id: 'recommendation-engine', modelName: 'recommendation-engine', stage: 'Staging', metric: 'rmse',
      currentValue: 0.051, baselineValue: 0.043, drift: this.calcDrift(0.051, 0.043), driftStatus: 'warning',
      trend: this.buildTrend(0.043, 0.051, 0.002), lastUpdated: '3m ago', threshold: 0.05
    },
    {
      id: 'sentiment-analyzer', modelName: 'sentiment-analyzer', stage: 'Development', metric: 'f1_score',
      currentValue: 0.798, baselineValue: 0.798, drift: this.calcDrift(0.798, 0.798), driftStatus: 'healthy',
      trend: this.buildTrend(0.798, 0.798, 0), lastUpdated: '12m ago', threshold: 0.75
    },
    {
      id: 'anomaly-detector', modelName: 'anomaly-detector', stage: 'Development', metric: 'auc',
      currentValue: 0.941, baselineValue: 0.956, drift: this.calcDrift(0.941, 0.956), driftStatus: 'warning',
      trend: this.buildTrend(0.956, 0.941, 0.002), lastUpdated: '6m ago', threshold: 0.92
    }
  ];

  featureMonitors: FeatureMonitor[] = [
    {
      id: 'transaction_amount', featureName: 'transaction_amount', model: 'fraud-detection-v2', type: 'numerical',
      driftScore: 0.28, driftStatus: 'critical', baselineMean: 245.3, currentMean: 312.7,
      baselineStd: 180.2, currentStd: 267.4, nullRate: 0.1, outlierRate: 3.2, lastUpdated: '2m ago'
    },
    {
      id: 'customer_age', featureName: 'customer_age', model: 'customer-churn-predictor', type: 'numerical',
      driftScore: 0.04, driftStatus: 'healthy', baselineMean: 42.3, currentMean: 43.1,
      nullRate: 0.0, outlierRate: 0.8, lastUpdated: '10m ago'
    },
    {
      id: 'product_category', featureName: 'product_category', model: 'recommendation-engine', type: 'categorical',
      driftScore: 0.19, driftStatus: 'warning', nullRate: 1.2, outlierRate: 0.0, lastUpdated: '4m ago'
    },
    {
      id: 'review_length', featureName: 'review_length', model: 'sentiment-analyzer', type: 'numerical',
      driftScore: 0.07, driftStatus: 'healthy', baselineMean: 124.5, currentMean: 131.2,
      nullRate: 0.3, outlierRate: 1.1, lastUpdated: '15m ago'
    },
    {
      id: 'sensor_temperature', featureName: 'sensor_temperature', model: 'anomaly-detector', type: 'numerical',
      driftScore: 0.22, driftStatus: 'warning', baselineMean: 23.4, currentMean: 28.9,
      nullRate: 0.0, outlierRate: 4.7, lastUpdated: '7m ago'
    },
    {
      id: 'payment_method', featureName: 'payment_method', model: 'fraud-detection-v2', type: 'categorical',
      driftScore: 0.31, driftStatus: 'critical', nullRate: 0.5, outlierRate: 0.0, lastUpdated: '9m ago'
    },
    {
      id: 'customer_lifetime_value', featureName: 'customer_lifetime_value', model: 'customer-churn-predictor', type: 'numerical',
      driftScore: 0.06, driftStatus: 'healthy', nullRate: 2.1, outlierRate: 2.3, lastUpdated: '11m ago'
    },
    {
      id: 'image_resolution', featureName: 'image_resolution', model: 'image-classifier-v2', type: 'numerical',
      driftScore: 0.03, driftStatus: 'healthy', nullRate: 0.0, outlierRate: 0.4, lastUpdated: '20m ago'
    }
  ];

  infraMetrics: InfraMetric[] = [
    {
      id: 'fraud-detection-api', service: 'fraud-detection-api', cpu: 78, memory: 65, latency: 124,
      requestsPerMin: 1847, errorRate: 0.3, uptime: 99.97, status: 'warning', trend: this.buildTrend(124, 124, 8)
    },
    {
      id: 'mlflow-server', service: 'mlflow-server', cpu: 23, memory: 41, latency: 45,
      requestsPerMin: 234, errorRate: 0.0, uptime: 100, status: 'healthy', trend: this.buildTrend(45, 45, 3)
    },
    {
      id: 'airflow-scheduler', service: 'airflow-scheduler', cpu: 45, memory: 58, latency: 89,
      requestsPerMin: 567, errorRate: 0.1, uptime: 99.99, status: 'healthy', trend: this.buildTrend(89, 89, 5)
    },
    {
      id: 'prometheus', service: 'prometheus', cpu: 12, memory: 34, latency: 12,
      requestsPerMin: 3421, errorRate: 0.0, uptime: 100, status: 'healthy', trend: this.buildTrend(12, 12, 1)
    },
    {
      id: 'recommendation-api', service: 'recommendation-api', cpu: 91, memory: 87, latency: 847,
      requestsPerMin: 2341, errorRate: 2.8, uptime: 98.20, status: 'critical', trend: this.buildTrend(847, 847, 40)
    },
    {
      id: 'feature-store', service: 'feature-store', cpu: 34, memory: 52, latency: 67,
      requestsPerMin: 891, errorRate: 0.4, uptime: 99.95, status: 'healthy', trend: this.buildTrend(67, 67, 4)
    }
  ];

  alerts: Alert[] = [
    {
      id: 'alert-1', severity: 'critical', title: 'Model Accuracy Degradation',
      message: 'fraud-detection-v2 accuracy dropped below threshold (0.934 < 0.950)',
      source: 'fraud-detection-v2', timestamp: '5 min ago', acknowledged: false, category: 'drift'
    },
    {
      id: 'alert-2', severity: 'critical', title: 'Feature Distribution Shift',
      message: 'transaction_amount PSI score 0.28 exceeds critical threshold (> 0.25)',
      source: 'fraud-detection-v2', timestamp: '12 min ago', acknowledged: false, category: 'drift'
    },
    {
      id: 'alert-3', severity: 'warning', title: 'High CPU Usage',
      message: 'recommendation-api CPU at 91%, approaching limit',
      source: 'recommendation-api', timestamp: '3 min ago', acknowledged: false, category: 'infrastructure'
    },
    {
      id: 'alert-4', severity: 'critical', title: 'High Latency Detected',
      message: 'recommendation-api latency 847ms exceeds SLA threshold (500ms)',
      source: 'recommendation-api', timestamp: '8 min ago', acknowledged: false, category: 'infrastructure'
    },
    {
      id: 'alert-5', severity: 'warning', title: 'Feature Drift Warning',
      message: 'payment_method distribution shifted, PSI: 0.31',
      source: 'fraud-detection-v2', timestamp: '25 min ago', acknowledged: true, category: 'drift'
    },
    {
      id: 'alert-6', severity: 'warning', title: 'RMSE Degradation',
      message: 'recommendation-engine RMSE increased 18.6% from baseline',
      source: 'recommendation-engine', timestamp: '1h ago', acknowledged: true, category: 'drift'
    },
    {
      id: 'alert-7', severity: 'info', title: 'Scheduled Retraining',
      message: 'fraud-detection-v2 retraining job triggered automatically',
      source: 'system', timestamp: '2h ago', acknowledged: true, category: 'pipeline'
    },
    {
      id: 'alert-8', severity: 'info', title: 'Model Deployed',
      message: 'image-classifier-v2 successfully deployed to production',
      source: 'system', timestamp: '3h ago', acknowledged: true, category: 'pipeline'
    }
  ];

  constructor(
    private readonly toastService: ToastService,
    private readonly simulation: MonitoringSimulationService
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.simulation.fastTick$.subscribe(() => this.applyFastTick()),
      this.simulation.slowTick$.subscribe(() => this.applySlowTick()),
      this.simulation.clockTick$.subscribe(() => { this.now = Date.now(); })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  get lastUpdatedLabel(): string {
    const seconds = Math.floor((this.now - this.lastUpdatedAt) / 1000);
    if (seconds < 5) {
      return 'just now';
    }
    if (seconds < 60) {
      return `${seconds} seconds ago`;
    }
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
  }

  get modelsMonitoredCount(): number {
    return this.modelMonitors.length;
  }

  get unacknowledgedCount(): number {
    return this.alerts.filter(alert => !alert.acknowledged).length;
  }

  get avgModelHealth(): number {
    const scoreMap: Record<DriftStatus, number> = { healthy: 100, warning: 85, critical: 52 };
    const total = this.modelMonitors.reduce((sum, model) => sum + scoreMap[model.driftStatus], 0);
    return Math.round(total / this.modelMonitors.length);
  }

  get servicesOnlineCount(): number {
    return this.infraMetrics.filter(metric => metric.status !== 'critical' && metric.status !== 'down').length;
  }

  get avgLatency(): number {
    return Math.round(this.infraMetrics.reduce((sum, metric) => sum + metric.latency, 0) / this.infraMetrics.length);
  }

  get lastPipelineRunLabel(): string {
    return LAST_PIPELINE_RUN_LABEL;
  }

  dagRunIdFor(modelName: string): string {
    return MODEL_DAG_RUN_IDS[modelName] ?? DEFAULT_DAG_RUN_ID;
  }

  get filteredAlerts(): Alert[] {
    if (this.alertFilter === 'all') {
      return this.alerts;
    }
    return this.alerts.filter(alert => alert.severity === this.alertFilter);
  }

  setTab(tab: ActiveTab): void {
    this.activeTab = tab;
  }

  setAlertFilter(filter: AlertFilter): void {
    this.alertFilter = filter;
  }

  statusClass(status: string): string {
    return 'status-badge--' + status;
  }

  stageClass(stage: Stage): string {
    return 'stage-pill--' + stage.toLowerCase();
  }

  driftArrow(drift: number): string {
    if (drift > 0) { return '↑'; }
    if (drift < 0) { return '↓'; }
    return '→';
  }

  formatDrift(drift: number): string {
    const sign = drift > 0 ? '+' : '';
    return `${sign}${drift.toFixed(1)}%`;
  }

  formatModelValue(model: ModelMonitor, value: number): string {
    return model.metric === 'rmse' || model.metric === 'mae' ? value.toFixed(3) : `${(value * 100).toFixed(1)}%`;
  }

  isFlashing(id: string): boolean {
    return this.refreshFlash || this.recentlyUpdatedId === id;
  }

  viewFullHistory(): void {
    // no-op in this mock/demo build
  }

  modelSparkline(monitor: ModelMonitor): SparklineView {
    return this.buildSparklineView(monitor.trend, monitor.driftStatus === 'critical' ? monitor.threshold : undefined);
  }

  infraSparkline(metric: InfraMetric): SparklineView {
    return this.buildSparklineView(metric.trend);
  }

  gaugeView(value: number): GaugeView {
    const pct = Math.max(0, Math.min(100, value));
    const dashoffset = GAUGE_CIRCUMFERENCE * (1 - pct / 100);
    const colorClass: GaugeView['colorClass'] = pct > 80 ? 'danger' : pct >= 60 ? 'warning' : 'success';
    const label = value < 10 ? `${value.toFixed(1)}%` : `${Math.round(value)}%`;
    return { dashoffset, circumference: GAUGE_CIRCUMFERENCE, colorClass, label };
  }

  requestsTrendArrow(metric: InfraMetric): string {
    const avg = this.infraMetrics.reduce((sum, item) => sum + item.requestsPerMin, 0) / this.infraMetrics.length;
    return metric.requestsPerMin >= avg ? '↑' : '↓';
  }

  psiColorClass(score: number): 'success' | 'warning' | 'danger' {
    if (score < 0.1) { return 'success'; }
    if (score <= 0.25) { return 'warning'; }
    return 'danger';
  }

  psiBarPct(score: number): number {
    return Math.min(100, (score / 0.4) * 100);
  }

  hasDistributionStats(feature: FeatureMonitor): boolean {
    return feature.baselineMean !== undefined && feature.currentMean !== undefined;
  }

  distributionLabel(feature: FeatureMonitor): string {
    return feature.driftStatus === 'healthy' ? 'Stable' : 'Shifted';
  }

  distributionBarHeight(value: number, feature: FeatureMonitor): number {
    const base = Math.abs(feature.baselineMean ?? 0);
    const curr = Math.abs(feature.currentMean ?? 0);
    const max = Math.max(base, curr, 1);
    return Math.min(20, Math.max(2, (Math.abs(value) / max) * 20));
  }

  meanShiftPct(feature: FeatureMonitor): number | null {
    if (feature.baselineMean === undefined || feature.currentMean === undefined || feature.baselineMean === 0) {
      return null;
    }
    return ((feature.currentMean - feature.baselineMean) / feature.baselineMean) * 100;
  }

  interpretationText(feature: FeatureMonitor): string {
    const shift = this.meanShiftPct(feature);
    if (shift === null) {
      return feature.driftStatus === 'healthy'
        ? 'Distribution is stable relative to baseline.'
        : 'Distribution has shifted — review upstream data sources for schema or population changes.';
    }
    const sign = shift >= 0 ? '+' : '';
    const cause = feature.driftStatus === 'healthy' ? 'within normal variation' : 'likely seasonal effect or data pipeline change';
    return `Mean shifted by ${sign}${shift.toFixed(1)}% — ${cause}`;
  }

  isFeatureExpanded(feature: FeatureMonitor): boolean {
    return this.expandedFeatureId === feature.id;
  }

  toggleFeatureExpand(feature: FeatureMonitor): void {
    this.expandedFeatureId = this.expandedFeatureId === feature.id ? null : feature.id;
  }

  severityIcon(severity: AlertSeverity): string {
    const map: Record<AlertSeverity, string> = { critical: '🔴', warning: '🟡', info: '🔵' };
    return map[severity];
  }

  acknowledgeAlert(alert: Alert): void {
    if (alert.acknowledged) {
      return;
    }
    alert.acknowledged = true;
    this.toastService.show('Alert acknowledged', 'success');
  }

  acknowledgeAllAlerts(): void {
    const hadUnacknowledged = this.alerts.some(alert => !alert.acknowledged);
    if (!hadUnacknowledged) {
      return;
    }
    this.alerts.forEach(alert => { alert.acknowledged = true; });
    this.toastService.show('All alerts acknowledged', 'success');
  }

  refreshAll(): void {
    if (this.refreshing) {
      return;
    }
    this.refreshing = true;

    this.modelMonitors.forEach(model => this.nudgeModel(model, this.simulation.randomModelDelta()));
    this.infraMetrics.forEach(infra => this.nudgeInfra(infra, this.simulation.randomInfraDelta()));

    this.lastUpdatedAt = Date.now();
    this.now = Date.now();
    this.refreshFlash = true;
    setTimeout(() => { this.refreshFlash = false; }, 500);
    setTimeout(() => { this.refreshing = false; }, 800);
  }

  private applyFastTick(): void {
    if (this.infraMetrics.length) {
      const infra = this.infraMetrics[Math.floor(Math.random() * this.infraMetrics.length)];
      this.nudgeInfra(infra, this.simulation.randomInfraDelta());
      this.flash(infra.id);
    }
    if (this.modelMonitors.length) {
      const model = this.modelMonitors[Math.floor(Math.random() * this.modelMonitors.length)];
      this.nudgeModel(model, this.simulation.randomModelDelta());
      this.flash(model.id);
    }
    this.lastUpdatedAt = Date.now();
    this.now = Date.now();
  }

  private applySlowTick(): void {
    this.modelMonitors.forEach(model => {
      const last = model.trend[model.trend.length - 1];
      const next = +(last.value + this.simulation.randomModelDelta()).toFixed(4);
      model.trend = this.scrollTrend(model.trend, next);
    });

    this.infraMetrics.forEach(infra => {
      const last = infra.trend[infra.trend.length - 1];
      const delta = this.simulation.randomInfraDelta();
      const next = Math.max(1, Math.round(last.value + delta.latency));
      infra.trend = this.scrollTrend(infra.trend, next);
    });

    const alert = this.simulation.maybeGenerateAlert();
    if (alert) {
      this.alerts = [alert, ...this.alerts];
    }
  }

  private flash(id: string): void {
    this.recentlyUpdatedId = id;
    setTimeout(() => {
      if (this.recentlyUpdatedId === id) {
        this.recentlyUpdatedId = null;
      }
    }, 500);
  }

  private nudgeModel(model: ModelMonitor, delta: number): void {
    model.currentValue = +(model.currentValue + delta).toFixed(4);
    model.drift = this.calcDrift(model.currentValue, model.baselineValue);
    if (model.trend.length) {
      model.trend[model.trend.length - 1] = { ...model.trend[model.trend.length - 1], value: model.currentValue };
    }
    model.lastUpdated = 'just now';
  }

  private nudgeInfra(infra: InfraMetric, delta: { cpu: number; memory: number; latency: number; requests: number }): void {
    infra.cpu = this.clamp(infra.cpu + delta.cpu, 0, 100);
    infra.memory = this.clamp(infra.memory + delta.memory, 0, 100);
    infra.latency = Math.max(1, Math.round(infra.latency + delta.latency));
    infra.requestsPerMin = Math.max(0, Math.round(infra.requestsPerMin + delta.requests));
  }

  private scrollTrend(trend: MetricPoint[], nextValue: number): MetricPoint[] {
    if (!trend.length) {
      return trend;
    }
    return [...trend.slice(1), { timestamp: 'now', value: nextValue }];
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  private calcDrift(current: number, baseline: number): number {
    if (!baseline) {
      return 0;
    }
    return +(((current - baseline) / baseline) * 100).toFixed(1);
  }

  private buildSparklineView(trend: MetricPoint[], thresholdValue?: number): SparklineView {
    const { polyline, area } = generateSparkline(trend, SPARK_WIDTH, SPARK_HEIGHT);
    if (!trend.length) {
      return { polyline, area, lastX: 0, lastY: SPARK_HEIGHT, thresholdY: null };
    }
    const values = trend.map(point => point.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const stepX = trend.length > 1 ? SPARK_WIDTH / (trend.length - 1) : 0;
    const lastX = (trend.length - 1) * stepX;
    const lastY = SPARK_HEIGHT - ((trend[trend.length - 1].value - min) / range) * SPARK_HEIGHT;

    let thresholdY: number | null = null;
    if (thresholdValue !== undefined) {
      const clamped = Math.min(max, Math.max(min, thresholdValue));
      thresholdY = SPARK_HEIGHT - ((clamped - min) / range) * SPARK_HEIGHT;
    }

    return { polyline, area, lastX, lastY, thresholdY };
  }

  private buildTrend(start: number, end: number, noiseMagnitude = 0): MetricPoint[] {
    return Array.from({ length: TREND_POINTS }, (_, i) => {
      const t = i / (TREND_POINTS - 1);
      const base = start + (end - start) * t;
      const isEdge = i === 0 || i === TREND_POINTS - 1;
      const noise = !isEdge && noiseMagnitude ? (this.seededNoise(i) - 0.5) * 2 * noiseMagnitude : 0;
      const value = +(base + noise).toFixed(4);
      const timestamp = i === TREND_POINTS - 1 ? 'now' : `${TREND_POINTS - 1 - i}h ago`;
      return { timestamp, value };
    });
  }

  private seededNoise(seed: number): number {
    const x = Math.sin(seed * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  }
}
