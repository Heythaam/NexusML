import { Injectable } from '@angular/core';
import { Observable, interval } from 'rxjs';

import { Alert } from '../models/monitoring.model';

export interface InfraDelta {
  cpu: number;
  memory: number;
  latency: number;
  requests: number;
}

interface AlertTemplate {
  title: string;
  message: string;
  source: string;
  category: Alert['category'];
}

const ALERT_POOL: AlertTemplate[] = [
  { title: 'Model Health Check Passed', message: 'All production models passed their scheduled health check.', source: 'system', category: 'pipeline' },
  { title: 'Scheduled Backup Completed', message: 'Model registry backup completed successfully.', source: 'system', category: 'infrastructure' },
  { title: 'Data Pipeline Sync Completed', message: 'Feature store sync finished with no errors.', source: 'feature-store', category: 'pipeline' },
  { title: 'Autoscaling Event', message: 'recommendation-api scaled up to handle increased load.', source: 'recommendation-api', category: 'infrastructure' },
  { title: 'New Model Version Registered', message: 'A new candidate version was registered in the model registry.', source: 'system', category: 'pipeline' }
];

@Injectable({
  providedIn: 'root'
})
export class MonitoringSimulationService {
  readonly fastTick$: Observable<number> = interval(5000);
  readonly slowTick$: Observable<number> = interval(30000);
  readonly clockTick$: Observable<number> = interval(1000);

  randomInfraDelta(): InfraDelta {
    return {
      cpu: this.randomInRange(-3, 3),
      memory: this.randomInRange(-2, 2),
      latency: this.randomInRange(-20, 20),
      requests: Math.round(this.randomInRange(-50, 50))
    };
  }

  randomModelDelta(): number {
    return this.randomInRange(-0.002, 0.002);
  }

  maybeGenerateAlert(): Alert | null {
    if (Math.random() > 0.35) {
      return null;
    }
    const template = ALERT_POOL[Math.floor(Math.random() * ALERT_POOL.length)];
    return {
      id: `alert-${Date.now()}`,
      severity: 'info',
      title: template.title,
      message: template.message,
      source: template.source,
      timestamp: 'just now',
      acknowledged: false,
      category: template.category
    };
  }

  private randomInRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }
}
