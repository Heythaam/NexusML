import { Component, OnInit } from '@angular/core';

import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { CredentialService } from '../../core/services/credential.service';
import { PipelineApiService } from '../../core/services/pipeline-api.service';
import { ModelApiService } from '../../core/services/model-api.service';
import { IntegrationService } from '../../core/services/integration.service';
import { Credential, CreateCredentialRequest, CredentialType } from '../../core/models/credential.model';
import { IntegrationConfig, UpdateIntegrationRequest } from '../../core/models/integration.model';

type AuditDotColor = 'accent' | 'success' | 'warning';

// Icon/description are cosmetic only — the backend doesn't store them, so any
// integration id not listed here still renders with a sensible fallback.
const INTEGRATION_META: Record<string, { description: string; icon: string }> = {
  airflow: { description: 'Pipeline orchestration', icon: 'AF' },
  mlflow: { description: 'Experiment tracking', icon: 'ML' },
  prometheus: { description: 'Metrics collection', icon: 'PR' },
  grafana: { description: 'Metrics visualization', icon: 'GR' },
  kubernetes: { description: 'Container orchestration', icon: 'K8' },
  slack: { description: 'Notifications', icon: 'SL' }
};
const DEFAULT_INTEGRATION_META = { description: '', icon: 'IN' };

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

interface CredentialCategoryGroup {
  category: string;
  label: string;
  icon: string;
  items: Credential[];
}

const CATEGORY_META: { category: string; label: string; icon: string }[] = [
  { category: 'SOURCE_CONTROL', label: 'Source Control', icon: 'SC' },
  { category: 'CONTAINER_REGISTRY', label: 'Container Registry', icon: 'CR' },
  { category: 'CLOUD_PROVIDER', label: 'Cloud Provider', icon: 'CP' },
  { category: 'ML_PLATFORM', label: 'ML Platform', icon: 'ML' },
  { category: 'NOTIFICATION', label: 'Notification', icon: 'NT' },
  { category: 'DATA_STORAGE', label: 'Data Storage', icon: 'DS' },
  { category: 'CI_CD', label: 'CI/CD', icon: 'CI' },
  { category: 'OTHER', label: 'Other', icon: 'OT' }
];

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  integrations: IntegrationConfig[] = [];
  isLoadingIntegrations = false;
  editingIntegrations: Map<string, UpdateIntegrationRequest> = new Map();
  testingIds = new Set<string>();

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

  // Credentials store state
  credentials: Credential[] = [];
  isLoadingCredentials = false;
  showAddCredential = false;
  editingCredential: Credential | null = null;

  readonly categories = CATEGORY_META;

  // Modal state
  modalCategory: string | null = null;
  selectedTypeInfo: CredentialType | null = null;
  formName = '';
  formDescription = '';
  formCategory = '';
  formType = '';
  formValue = '';
  savingCredential = false;

  // Predefined MLOps credential types
  readonly credentialTypes: CredentialType[] = [
    // Source Control
    { category: 'SOURCE_CONTROL', type: 'GITHUB_PAT', name: 'GitHub Personal Access Token', icon: '🐙', placeholder: 'ghp_xxxxxxxxxxxx', description: 'For pulling code and pushing model artifacts' },
    { category: 'SOURCE_CONTROL', type: 'GITLAB_TOKEN', name: 'GitLab Access Token', icon: '🦊', placeholder: 'glpat-xxxxxxxxxxxx', description: 'For GitLab CI/CD pipelines' },

    // Container Registry
    { category: 'CONTAINER_REGISTRY', type: 'DOCKERHUB_PASSWORD', name: 'DockerHub Password', icon: '🐳', placeholder: 'your-dockerhub-password', description: 'For pushing model serving Docker images' },
    { category: 'CONTAINER_REGISTRY', type: 'DOCKERHUB_TOKEN', name: 'DockerHub Access Token', icon: '🐳', placeholder: 'dckr_pat_xxxxxxxxxxxx', description: 'Preferred over password for CI/CD' },
    { category: 'CONTAINER_REGISTRY', type: 'ECR_ACCESS_KEY', name: 'AWS ECR Access Key', icon: '📦', placeholder: 'AKIAIOSFODNN7EXAMPLE', description: 'For AWS Elastic Container Registry' },

    // Cloud Provider
    { category: 'CLOUD_PROVIDER', type: 'AWS_ACCESS_KEY', name: 'AWS Access Key ID', icon: '☁️', placeholder: 'AKIAIOSFODNN7EXAMPLE', description: 'For S3 dataset storage and SageMaker' },
    { category: 'CLOUD_PROVIDER', type: 'AWS_SECRET_KEY', name: 'AWS Secret Access Key', icon: '☁️', placeholder: 'wJalrXUtnFEMI/K7MDENG', description: 'Paired with AWS Access Key ID' },
    { category: 'CLOUD_PROVIDER', type: 'GCP_SERVICE_ACCOUNT', name: 'GCP Service Account JSON', icon: '🌐', placeholder: '{"type":"service_account"...}', description: 'For Google Cloud Storage and Vertex AI' },
    { category: 'CLOUD_PROVIDER', type: 'AZURE_CLIENT_SECRET', name: 'Azure Client Secret', icon: '🔷', placeholder: 'your-azure-client-secret', description: 'For Azure Blob Storage and Azure ML' },

    // ML Platform
    { category: 'ML_PLATFORM', type: 'MLFLOW_TRACKING_TOKEN', name: 'MLflow Tracking Token', icon: '🧪', placeholder: 'mlflow-token-xxxx', description: 'For remote MLflow tracking server auth' },
    { category: 'ML_PLATFORM', type: 'HUGGINGFACE_TOKEN', name: 'HuggingFace API Token', icon: '🤗', placeholder: 'hf_xxxxxxxxxxxx', description: 'For downloading pretrained models' },
    { category: 'ML_PLATFORM', type: 'WANDB_API_KEY', name: 'Weights & Biases API Key', icon: '📊', placeholder: 'your-wandb-api-key', description: 'For experiment tracking with W&B' },
    { category: 'ML_PLATFORM', type: 'OPENAI_API_KEY', name: 'OpenAI API Key', icon: '🤖', placeholder: 'sk-xxxxxxxxxxxx', description: 'For LLM-powered features' },

    // Notification
    { category: 'NOTIFICATION', type: 'SLACK_WEBHOOK', name: 'Slack Webhook URL', icon: '💬', placeholder: 'https://hooks.slack.com/...', description: 'For pipeline and model alerts' },
    { category: 'NOTIFICATION', type: 'SLACK_BOT_TOKEN', name: 'Slack Bot Token', icon: '💬', placeholder: 'xoxb-xxxxxxxxxxxx', description: 'For advanced Slack integrations' },
    { category: 'NOTIFICATION', type: 'PAGERDUTY_KEY', name: 'PagerDuty Integration Key', icon: '🚨', placeholder: 'your-pagerduty-key', description: 'For critical alert escalation' },

    // Data Storage
    { category: 'DATA_STORAGE', type: 'S3_BUCKET_KEY', name: 'S3 Bucket Access Key', icon: '🪣', placeholder: 'AKIAIOSFODNN7EXAMPLE', description: 'For DVC remote storage on S3' },
    { category: 'DATA_STORAGE', type: 'HDFS_KEYTAB', name: 'HDFS Kerberos Keytab', icon: '🗄️', placeholder: 'base64-encoded-keytab', description: 'For secured HDFS cluster access' },
    { category: 'DATA_STORAGE', type: 'SNOWFLAKE_PASSWORD', name: 'Snowflake Password', icon: '❄️', placeholder: 'your-snowflake-password', description: 'For Snowflake data warehouse' },

    // CI/CD
    { category: 'CI_CD', type: 'JENKINS_TOKEN', name: 'Jenkins API Token', icon: '⚙️', placeholder: 'your-jenkins-token', description: 'For Jenkins pipeline triggers' },
    { category: 'CI_CD', type: 'GITHUB_ACTIONS_SECRET', name: 'GitHub Actions Secret', icon: '🔄', placeholder: 'your-actions-secret', description: 'For GitHub Actions workflow auth' },
    { category: 'CI_CD', type: 'SONAR_TOKEN', name: 'SonarQube Token', icon: '🔍', placeholder: 'squ_xxxxxxxxxxxx', description: 'For code quality analysis' },

    // Other
    { category: 'OTHER', type: 'KUBERNETES_TOKEN', name: 'Kubernetes Service Account Token', icon: '☸️', placeholder: 'eyJhbGci...', description: 'For K8s API access from pipelines' },
    { category: 'OTHER', type: 'AIRFLOW_API_KEY', name: 'Airflow API Key', icon: '✈️', placeholder: 'your-airflow-api-key', description: 'For triggering DAGs via REST API' },
    { category: 'OTHER', type: 'PROMETHEUS_TOKEN', name: 'Prometheus Bearer Token', icon: '📈', placeholder: 'your-prometheus-token', description: 'For authenticated Prometheus queries' }
  ];

  constructor(
    private readonly toastService: ToastService,
    private readonly credentialService: CredentialService,
    private readonly pipelineApiService: PipelineApiService,
    private readonly modelApiService: ModelApiService,
    private readonly integrationService: IntegrationService,
    public readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadIntegrations();
    this.loadCredentials();
  }

  get hasUnsavedChanges(): boolean {
    return this.editingIntegrations.size > 0;
  }

  statusBadgeClass(status: IntegrationConfig['status']): string {
    return 'badge--' + status;
  }

  integrationIcon(id: string): string {
    return (INTEGRATION_META[id] ?? DEFAULT_INTEGRATION_META).icon;
  }

  integrationDescription(id: string): string {
    return (INTEGRATION_META[id] ?? DEFAULT_INTEGRATION_META).description;
  }

  loadIntegrations(): void {
    this.isLoadingIntegrations = true;
    this.integrationService.getAll().subscribe({
      next: (integrations) => {
        this.integrations = integrations;
        this.isLoadingIntegrations = false;
      },
      error: () => {
        this.isLoadingIntegrations = false;
      }
    });
  }

  // The inputs are bound to these instead of the source integration directly,
  // so an in-progress edit survives change detection until it's actually saved.
  displayedUrl(integration: IntegrationConfig): string {
    return this.editingIntegrations.get(integration.id)?.url ?? integration.url;
  }

  displayedPort(integration: IntegrationConfig): number | null {
    const edit = this.editingIntegrations.get(integration.id);
    return edit ? edit.port : integration.port;
  }

  onUrlChange(id: string, url: string): void {
    const existing = this.editingIntegrations.get(id) ?? { url, port: this.portFor(id) };
    this.editingIntegrations.set(id, { ...existing, url });
  }

  onPortChange(id: string, port: number): void {
    const existing = this.editingIntegrations.get(id) ?? { url: this.urlFor(id), port };
    this.editingIntegrations.set(id, { ...existing, port });
  }

  isDirty(id: string): boolean {
    return this.editingIntegrations.has(id);
  }

  isTesting(id: string): boolean {
    return this.testingIds.has(id);
  }

  saveIntegration(id: string): void {
    const request = this.editingIntegrations.get(id);
    if (!request) {
      return;
    }
    this.integrationService.update(id, request).subscribe({
      next: (updated) => {
        const idx = this.integrations.findIndex(i => i.id === id);
        if (idx !== -1) {
          this.integrations[idx] = updated;
        }
        this.editingIntegrations.delete(id);
        this.toastService.show(`${updated.name} configuration saved`, 'success');
      },
      error: () => this.toastService.show('Failed to save configuration', 'error')
    });
  }

  saveAllIntegrations(): void {
    const ids = Array.from(this.editingIntegrations.keys());
    ids.forEach(id => this.saveIntegration(id));
  }

  testIntegration(id: string): void {
    const integration = this.integrations.find(i => i.id === id);
    if (!integration || this.testingIds.has(id)) {
      return;
    }

    this.testingIds.add(id);

    // Airflow and MLflow have real, service-backed connection tests.
    if (id === 'airflow') {
      this.pipelineApiService.testConnection().subscribe({
        next: (result) => {
          this.testingIds.delete(id);
          integration.status = result.connected ? 'connected' : 'error';
          integration.lastTested = new Date().toISOString();
          this.toastService.show(
            result.connected ? `✓ Connected — ${result.dagCount} DAGs found` : '✗ Connection failed',
            result.connected ? 'success' : 'error'
          );
        },
        error: () => {
          this.testingIds.delete(id);
          integration.status = 'error';
          integration.lastTested = new Date().toISOString();
          this.toastService.show('✗ Connection failed', 'error');
        }
      });
      return;
    }

    if (id === 'mlflow') {
      this.modelApiService.testConnection().subscribe({
        next: (result) => {
          this.testingIds.delete(id);
          integration.status = result?.connected ? 'connected' : 'error';
          integration.lastTested = new Date().toISOString();
          this.toastService.show(
            integration.status === 'connected' ? '✓ Connected to MLflow' : '✗ Connection failed',
            integration.status === 'connected' ? 'success' : 'error'
          );
        },
        error: () => {
          this.testingIds.delete(id);
          integration.status = 'error';
          integration.lastTested = new Date().toISOString();
          this.toastService.show('✗ Connection failed', 'error');
        }
      });
      return;
    }

    // Everything else is a stub on the backend today — it always reports
    // "connected" rather than actually reaching the service.
    this.integrationService.testConnection(id).subscribe({
      next: (updated) => {
        this.testingIds.delete(id);
        const idx = this.integrations.findIndex(i => i.id === id);
        if (idx !== -1) {
          this.integrations[idx] = updated;
        }
      },
      error: () => {
        this.testingIds.delete(id);
        integration.status = 'error';
      }
    });
  }

  manageRole(role: Role): void {}

  private urlFor(id: string): string {
    return this.integrations.find(i => i.id === id)?.url ?? '';
  }

  private portFor(id: string): number | null {
    return this.integrations.find(i => i.id === id)?.port ?? null;
  }

  // ─── Credentials ───────────────────────────────────────────

  get groupedCredentials(): CredentialCategoryGroup[] {
    return CATEGORY_META
      .map(meta => ({
        ...meta,
        items: this.credentials.filter(c => c.category === meta.category)
      }))
      .filter(group => group.items.length > 0);
  }

  get typesForModalCategory(): CredentialType[] {
    if (!this.modalCategory) {
      return [];
    }
    return this.credentialTypes.filter(t => t.category === this.modalCategory);
  }

  loadCredentials(): void {
    this.isLoadingCredentials = true;
    this.credentialService.getAll().subscribe({
      next: (creds) => {
        this.credentials = creds;
        this.isLoadingCredentials = false;
      },
      error: (e) => {
        console.error('Failed to load credentials', e);
        this.isLoadingCredentials = false;
      }
    });
  }

  openAddCredential(): void {
    this.editingCredential = null;
    this.resetModalState();
    this.showAddCredential = true;
  }

  editCredential(credential: Credential): void {
    this.editingCredential = credential;
    this.modalCategory = credential.category;
    this.selectedTypeInfo = this.credentialTypes.find(
      t => t.category === credential.category && t.type === credential.type
    ) ?? {
      category: credential.category,
      type: credential.type,
      name: credential.name,
      icon: '🔑',
      placeholder: '',
      description: credential.description
    };
    this.formName = credential.name;
    this.formDescription = credential.description;
    this.formCategory = credential.category;
    this.formType = credential.type;
    this.formValue = '';
    this.showAddCredential = true;
  }

  getCredentialOwner(createdBy: string): string {
    // If it looks like a UUID, show "Admin"
    // Real fix: store username not UUID
    const uuidRegex = /^[0-9a-f-]{36}$/i;
    return uuidRegex.test(createdBy) ? 'Admin' : createdBy;
  }

  credentialIcon(credential: Credential): string {
    return this.credentialTypes.find(
      t => t.category === credential.category && t.type === credential.type
    )?.icon ?? '🔑';
  }

  closeModal(): void {
    this.showAddCredential = false;
    this.editingCredential = null;
    this.resetModalState();
  }

  selectCategory(category: string): void {
    this.modalCategory = category;
    this.selectedTypeInfo = null;
  }

  selectType(type: CredentialType): void {
    this.selectedTypeInfo = type;
    this.formName = type.name;
    this.formDescription = type.description;
    this.formCategory = type.category;
    this.formType = type.type;
  }

  changeType(): void {
    this.selectedTypeInfo = null;
    this.formType = '';
    this.formCategory = '';
  }

  get isFormValid(): boolean {
    // Value is required when creating; on edit, a blank value means
    // "keep the existing encrypted value", so it's optional there.
    const hasValue = this.editingCredential ? true : !!this.formValue.trim();
    return !!(this.formName.trim() && this.formType.trim() &&
      this.formCategory.trim() && hasValue);
  }

  submitCredentialForm(): void {
    if (!this.isFormValid || this.savingCredential) {
      return;
    }

    const request: CreateCredentialRequest = {
      name: this.formName.trim(),
      type: this.formType,
      description: this.formDescription.trim(),
      category: this.formCategory,
      value: this.formValue.trim()
    };

    this.savingCredential = true;
    const isEdit = !!this.editingCredential;
    const request$ = isEdit
      ? this.credentialService.update(this.editingCredential!.id, request)
      : this.credentialService.create(request);

    request$.subscribe({
      next: () => {
        this.savingCredential = false;
        this.toastService.show(
          isEdit ? 'Credential updated' : 'Credential created', 'success');
        this.closeModal();
        this.loadCredentials();
      },
      error: () => {
        this.savingCredential = false;
        this.toastService.show(
          isEdit ? 'Failed to update credential' : 'Failed to create credential', 'error');
      }
    });
  }

  deleteCredential(id: string): void {
    this.credentialService.delete(id).subscribe({
      next: () => {
        this.credentials = this.credentials.filter(c => c.id !== id);
        this.toastService.show('Credential deleted', 'success');
      },
      error: () => this.toastService.show('Failed to delete credential', 'error')
    });
  }

  private resetModalState(): void {
    this.modalCategory = null;
    this.selectedTypeInfo = null;
    this.formName = '';
    this.formDescription = '';
    this.formCategory = '';
    this.formType = '';
    this.formValue = '';
  }
}
