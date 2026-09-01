import { Component } from '@angular/core';

import { ToastService } from '../../core/services/toast.service';

type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'untested';
type AuditDotColor = 'accent' | 'success' | 'warning';

interface IntegrationConfig {
  id: string;
  name: string;
  description: string;
  url: string;
  port: number | null;
  status: IntegrationStatus;
  lastTested: string | null;
  icon: string;
  dirty: boolean;
  testing: boolean;
}

interface Credential {
  id: string;
  name: string;
  type: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  userCount: number;
}

interface AuditEvent {
  text: string;
  time: string;
  dot: AuditDotColor;
}

const TEST_DURATION_MS = 1500;
const SAVE_DURATION_MS = 800;

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {
  saving = false;

  integrations: IntegrationConfig[] = [
    { id: 'airflow', name: 'Apache Airflow', description: 'Pipeline orchestration', url: 'http://localhost', port: 8080, status: 'connected', lastTested: '2 min ago', icon: '✈', dirty: false, testing: false },
    { id: 'mlflow', name: 'MLflow', description: 'Experiment tracking', url: 'http://localhost', port: 5000, status: 'connected', lastTested: '5 min ago', icon: '🧪', dirty: false, testing: false },
    { id: 'prometheus', name: 'Prometheus', description: 'Metrics collection', url: 'http://localhost', port: 9090, status: 'error', lastTested: '10 min ago', icon: '📊', dirty: false, testing: false },
    { id: 'grafana', name: 'Grafana', description: 'Metrics visualization', url: 'http://localhost', port: 3000, status: 'disconnected', lastTested: null, icon: '📈', dirty: false, testing: false },
    { id: 'kubernetes', name: 'Kubernetes API', description: 'Container orchestration', url: 'https://localhost', port: 6443, status: 'connected', lastTested: '1 min ago', icon: '☸', dirty: false, testing: false },
    { id: 'slack', name: 'Slack Webhook', description: 'Notifications', url: 'https://hooks.slack.com', port: null, status: 'untested', lastTested: null, icon: '💬', dirty: false, testing: false }
  ];

  credentials: Credential[] = [
    { id: 'github-token', name: 'GitHub Token', type: 'Personal Access Token' },
    { id: 'dockerhub-password', name: 'DockerHub Password', type: 'Registry Credential' },
    { id: 'slack-webhook-url', name: 'Slack Webhook URL', type: 'Webhook' },
    { id: 'aws-access-key', name: 'AWS Access Key', type: 'Cloud Credential' }
  ];

  roles: Role[] = [
    { id: 'admin', name: 'Admin', description: 'Full access to all features', userCount: 2 },
    { id: 'data-scientist', name: 'Data Scientist', description: 'Can run pipelines, promote models', userCount: 5 },
    { id: 'viewer', name: 'Viewer', description: 'Read-only access', userCount: 12 }
  ];

  auditEvents: AuditEvent[] = [
    { text: 'Admin promoted model fraud-detection-v2 to Production', time: '2 min ago', dot: 'success' },
    { text: 'alice triggered pipeline customer-churn-model', time: '15 min ago', dot: 'accent' },
    { text: 'bob uploaded dataset transactions_2025.csv', time: '1h ago', dot: 'accent' },
    { text: 'Admin updated Airflow URL configuration', time: '2h ago', dot: 'warning' },
    { text: 'carol ran experiment #142 with PyTorch', time: '3h ago', dot: 'accent' }
  ];

  constructor(private readonly toastService: ToastService) {}

  get hasUnsavedChanges(): boolean {
    return this.integrations.some(integration => integration.dirty);
  }

  statusBadgeClass(status: IntegrationStatus): string {
    return 'badge--' + status;
  }

  onFieldChange(integration: IntegrationConfig): void {
    integration.dirty = true;
  }

  testConnection(integration: IntegrationConfig): void {
    if (integration.testing) {
      return;
    }

    integration.testing = true;

    setTimeout(() => {
      integration.testing = false;
      integration.status = Math.random() > 0.5 ? 'connected' : 'error';
      integration.lastTested = 'just now';
    }, TEST_DURATION_MS);
  }

  saveAll(): void {
    if (!this.hasUnsavedChanges || this.saving) {
      return;
    }

    this.saving = true;

    setTimeout(() => {
      this.integrations.forEach(integration => (integration.dirty = false));
      this.saving = false;
      this.toastService.show('Settings saved successfully ✓', 'success');
    }, SAVE_DURATION_MS);
  }

  addCredential(): void {}

  editCredential(credential: Credential): void {}

  deleteCredential(credential: Credential): void {}

  manageRole(role: Role): void {}
}
