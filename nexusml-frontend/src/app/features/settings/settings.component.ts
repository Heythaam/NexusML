import { Component, OnInit } from '@angular/core';

import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { CredentialService } from '../../core/services/credential.service';
import { PipelineApiService } from '../../core/services/pipeline-api.service';
import { Credential, CreateCredentialRequest, CredentialType } from '../../core/models/credential.model';

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

const TEST_DURATION_MS = 1500;
const SAVE_DURATION_MS = 800;

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
  saving = false;

  integrations: IntegrationConfig[] = [
    { id: 'airflow', name: 'Apache Airflow', description: 'Pipeline orchestration', url: 'http://localhost', port: 8080, status: 'connected', lastTested: '2 min ago', icon: 'AF', dirty: false, testing: false },
    { id: 'mlflow', name: 'MLflow', description: 'Experiment tracking', url: 'http://localhost', port: 5000, status: 'connected', lastTested: '5 min ago', icon: 'ML', dirty: false, testing: false },
    { id: 'prometheus', name: 'Prometheus', description: 'Metrics collection', url: 'http://localhost', port: 9090, status: 'error', lastTested: '10 min ago', icon: 'PR', dirty: false, testing: false },
    { id: 'grafana', name: 'Grafana', description: 'Metrics visualization', url: 'http://localhost', port: 3000, status: 'disconnected', lastTested: null, icon: 'GR', dirty: false, testing: false },
    { id: 'kubernetes', name: 'Kubernetes API', description: 'Container orchestration', url: 'https://localhost', port: 6443, status: 'connected', lastTested: '1 min ago', icon: 'K8', dirty: false, testing: false },
    { id: 'slack', name: 'Slack Webhook', description: 'Notifications', url: 'https://hooks.slack.com', port: null, status: 'untested', lastTested: null, icon: 'SL', dirty: false, testing: false }
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
    public readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadCredentials();
  }

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

    if (integration.id === 'airflow') {
      this.pipelineApiService.testConnection().subscribe({
        next: (result) => {
          integration.testing = false;
          integration.status = result.connected ? 'connected' : 'error';
          integration.lastTested = 'just now';
          this.toastService.show(
            result.connected ? `✓ Connected — ${result.dagCount} DAGs found` : '✗ Connection failed',
            result.connected ? 'success' : 'error'
          );
        },
        error: () => {
          integration.testing = false;
          integration.status = 'error';
          integration.lastTested = 'just now';
          this.toastService.show('✗ Connection failed', 'error');
        }
      });
      return;
    }

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

  manageRole(role: Role): void {}

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
