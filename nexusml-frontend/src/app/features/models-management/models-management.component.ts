import { Component, OnInit } from '@angular/core';
import { forkJoin, of } from 'rxjs';

import { ToastService } from '../../core/services/toast.service';
import { ModelApiService } from '../../core/services/model-api.service';
import { RuntimeConfigService } from '../../core/services/runtime-config.service';
import { AuthService } from '../../core/auth/auth.service';
import {
  CreatePromotionRequest,
  MLflowExperiment,
  MLflowMetric,
  MLflowModelVersion,
  MLflowParam,
  MLflowRegisteredModel,
  MLflowRun,
  ModelSignature,
  PromotionRequest,
  SignatureField
} from '../../core/models/model.model';

type ActiveTab = 'registry' | 'experiments';
type StageFilter = 'all' | string;

const PROMOTABLE_STAGES = ['Staging', 'Production', 'Archived'];
const PAGE_SIZE_STORAGE_KEY = 'modelsExperimentsPageSize';
const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

@Component({
  selector: 'app-models-management',
  templateUrl: './models-management.component.html',
  styleUrl: './models-management.component.scss'
})
export class ModelsManagementComponent implements OnInit {
  protected readonly Math = Math;

  experiments: MLflowExperiment[] = [];
  allRuns: MLflowRun[] = [];
  registeredModels: MLflowRegisteredModel[] = [];
  pendingPromotions: PromotionRequest[] = [];

  isLoading = false;
  error: string | null = null;

  activeTab: ActiveTab = 'registry';
  searchTerm = '';
  stageFilter: StageFilter = 'all';

  readonly promotionStages = PROMOTABLE_STAGES;

  get mlflowUrl(): string {
    return this.runtimeConfig.mlflowUrl;
  }

  // Model detail / promotion panel
  selectedModel: MLflowRegisteredModel | null = null;
  modelVersions: MLflowModelVersion[] = [];
  loadingVersions = false;

  showPromotionForm = false;
  promotingVersion: MLflowModelVersion | null = null;
  promotionToStage = '';
  promotionComment = '';
  submittingPromotion = false;

  // Version detail modal
  showVersionModal = false;
  selectedVersion: MLflowModelVersion | null = null;
  selectedSignature: ModelSignature | null = null;
  selectedRun: MLflowRun | null = null;
  isLoadingSignature = false;

  // Admin review panel
  showReviewPanel = false;
  approvingId: string | null = null;
  rejectingId: string | null = null;
  rejectReason = '';
  rejectingInFlight = false;

  expandedRunId: string | null = null;

  // Experiments table pagination
  currentPage = 1;
  pageSize = 10;

  constructor(
    private readonly modelApiService: ModelApiService,
    private readonly toastService: ToastService,
    private readonly authService: AuthService,
    private readonly runtimeConfig: RuntimeConfigService
  ) {}

  ngOnInit(): void {
    this.pageSize = this.loadPageSizePreference();
    this.loadData();
  }

  get canManage(): boolean {
    return this.authService.isAdmin() || this.authService.isDataScientist();
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  loadData(): void {
    this.isLoading = true;
    this.error = null;
    forkJoin({
      experiments: this.modelApiService.getExperiments(),
      runs: this.modelApiService.getAllRuns(),
      models: this.modelApiService.getRegisteredModels(),
      promotions: this.modelApiService.getPendingPromotions()
    }).subscribe({
      next: (data) => {
        this.experiments = data.experiments;
        this.allRuns = data.runs;
        this.registeredModels = data.models;
        this.pendingPromotions = data.promotions;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load model data', err);
        this.error = 'Failed to load data from the Model Service. Is MLflow reachable?';
        this.isLoading = false;
      }
    });
  }

  setTab(tab: ActiveTab): void {
    this.activeTab = tab;
  }

  // ─── Registry tab ──────────────────────────────────────────

  get filteredModels(): MLflowRegisteredModel[] {
    const term = this.searchTerm.trim().toLowerCase();
    return this.registeredModels.filter(model => {
      const matchesSearch = !term || model.name.toLowerCase().includes(term);
      const stage = this.latestVersion(model)?.currentStage ?? 'None';
      const matchesStage = this.stageFilter === 'all' || stage === this.stageFilter;
      return matchesSearch && matchesStage;
    });
  }

  latestVersion(model: MLflowRegisteredModel): MLflowModelVersion | null {
    return model.latestVersions?.length ? model.latestVersions[0] : null;
  }

  initials(name: string): string {
    return name ? name.slice(0, 2).toUpperCase() : '??';
  }

  stageBadgeClass(stage: string | undefined | null): string {
    return 'stage-badge--' + (stage || 'none').toLowerCase();
  }

  statusBadgeClass(status: string | undefined | null): string {
    return 'badge--' + (status || 'unknown').toLowerCase();
  }

  get totalModels(): number {
    return this.registeredModels.length;
  }

  get inProductionCount(): number {
    return this.registeredModels.filter(m => this.latestVersion(m)?.currentStage === 'Production').length;
  }

  get pendingApprovalCount(): number {
    return this.pendingPromotions.length;
  }

  get experimentsCount(): number {
    return this.experiments.length;
  }

  get totalRuns(): number {
    return this.allRuns.length;
  }

  modelMlflowLink(model: MLflowRegisteredModel): string {
    return this.mlflowUrl;
  }

  // ─── Experiments tab ───────────────────────────────────────

  runStatusLabel(run: MLflowRun): string {
    return run.info?.status || 'UNKNOWN';
  }

  getRunName(run: MLflowRun): string {
    if (run.info?.runName) {
      return run.info.runName;
    }
    const nameTag = run.data?.tags?.find(t => t.key === 'mlflow.runName');
    return nameTag?.value || '(unnamed run)';
  }

  formatTimestamp(ms: number | null | undefined): string {
    if (!ms) {
      return '—';
    }
    return new Date(ms).toLocaleString();
  }

  getDuration(startMs: number | null | undefined, endMs: number | null | undefined): string {
    if (!startMs || !endMs) {
      return '—';
    }
    const diffMs = endMs - startMs;
    const mins = Math.floor(diffMs / 60000);
    const secs = Math.floor((diffMs % 60000) / 1000);
    if (mins > 60) {
      const hours = Math.floor(mins / 60);
      return `${hours}h ${mins % 60}m`;
    }
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  }

  topMetrics(run: MLflowRun): MLflowMetric[] {
    return (run.data?.metrics ?? []).slice(0, 3);
  }

  topParams(run: MLflowRun): MLflowParam[] {
    return (run.data?.params ?? []).slice(0, 3);
  }

  toggleExpand(run: MLflowRun): void {
    this.expandedRunId = this.expandedRunId === run.info.runId ? null : run.info.runId;
  }

  get filteredRuns(): MLflowRun[] {
    return this.allRuns; // extend with search filter later
  }

  get totalPages(): number {
    return Math.ceil(this.filteredRuns.length / this.pageSize);
  }

  get paginatedRuns(): MLflowRun[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredRuns.slice(start, start + this.pageSize);
  }

  get pageNumbers(): number[] {
    const pages = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    this.currentPage = page;
  }

  onPageSizeChange(): void {
    this.pageSize = Number(this.pageSize);
    this.currentPage = 1;
    localStorage.setItem(PAGE_SIZE_STORAGE_KEY, String(this.pageSize));
  }

  private loadPageSizePreference(): number {
    const stored = Number(localStorage.getItem(PAGE_SIZE_STORAGE_KEY));
    return PAGE_SIZE_OPTIONS.includes(stored) ? stored : 10;
  }

  // ─── Pending promotions banner ─────────────────────────────

  openReviewPanel(): void {
    this.showReviewPanel = true;
  }

  closeReviewPanel(): void {
    this.showReviewPanel = false;
    this.rejectingId = null;
    this.rejectReason = '';
  }

  // ─── Model detail panel ────────────────────────────────────

  openDetail(model: MLflowRegisteredModel): void {
    this.selectedModel = model;
    this.resetPromotionForm();
    this.loadVersions(model.name);
  }

  closeDetail(): void {
    this.selectedModel = null;
    this.modelVersions = [];
    this.resetPromotionForm();
  }

  loadVersions(modelName: string): void {
    this.loadingVersions = true;
    this.modelApiService.getModelVersions(modelName).subscribe({
      next: (versions) => {
        this.modelVersions = versions;
        this.loadingVersions = false;
      },
      error: () => {
        this.loadingVersions = false;
      }
    });
  }

  openPromotionForm(version: MLflowModelVersion | null): void {
    if (!version) {
      return;
    }
    this.promotingVersion = version;
    this.showPromotionForm = true;
    this.promotionComment = '';
    this.promotionToStage = this.nextStage(version.currentStage) ?? this.promotionStages[0];
  }

  cancelPromotionForm(): void {
    this.showPromotionForm = false;
    this.promotionComment = '';
  }

  nextStage(currentStage: string | undefined | null): string | null {
    switch (currentStage) {
      case 'None':
      case null:
      case undefined:
        return 'Staging';
      case 'Staging':
        return 'Production';
      default:
        return null;
    }
  }

  submitPromotionRequest(): void {
    const model = this.selectedModel;
    const version = this.promotingVersion;
    if (!model || !version || this.submittingPromotion) {
      return;
    }

    const request: CreatePromotionRequest = {
      modelName: model.name,
      modelVersion: version.version,
      fromStage: version.currentStage,
      toStage: this.promotionToStage,
      comment: this.promotionComment.trim()
    };

    this.submittingPromotion = true;
    this.modelApiService.createPromotion(request).subscribe({
      next: () => {
        this.submittingPromotion = false;
        this.showPromotionForm = false;
        this.promotionComment = '';
        this.toastService.show('Promotion request submitted for review', 'success');
        this.loadData();
      },
      error: () => {
        this.submittingPromotion = false;
        this.toastService.show('Failed to submit promotion request', 'error');
      }
    });
  }

  // ─── Admin approve / reject ────────────────────────────────

  approvePromotion(promotion: PromotionRequest): void {
    if (this.approvingId) {
      return;
    }
    this.approvingId = promotion.id;
    this.modelApiService.approvePromotion(promotion.id).subscribe({
      next: () => {
        this.approvingId = null;
        this.toastService.show(`Model promoted to ${promotion.toStage} successfully`, 'success');
        this.loadData();
      },
      error: () => {
        this.approvingId = null;
        this.toastService.show('Failed to approve promotion', 'error');
      }
    });
  }

  startReject(promotion: PromotionRequest): void {
    this.rejectingId = promotion.id;
    this.rejectReason = '';
  }

  cancelReject(): void {
    this.rejectingId = null;
    this.rejectReason = '';
  }

  confirmReject(promotion: PromotionRequest): void {
    if (this.rejectingInFlight) {
      return;
    }
    this.rejectingInFlight = true;
    this.modelApiService.rejectPromotion(promotion.id, this.rejectReason.trim()).subscribe({
      next: () => {
        this.rejectingInFlight = false;
        this.rejectingId = null;
        this.rejectReason = '';
        this.toastService.show('Promotion request rejected', 'error');
        this.loadData();
      },
      error: () => {
        this.rejectingInFlight = false;
        this.toastService.show('Failed to reject promotion', 'error');
      }
    });
  }

  private resetPromotionForm(): void {
    this.showPromotionForm = false;
    this.promotingVersion = null;
    this.promotionToStage = '';
    this.promotionComment = '';
    this.submittingPromotion = false;
  }

  // ─── Version detail modal ──────────────────────────────────

  getModelId(source: string | undefined | null): string {
    return source?.replace('models:/', '') || '';
  }

  loadSignature(version: MLflowModelVersion): void {
    this.isLoadingSignature = true;
    this.selectedVersion = version;
    this.selectedSignature = null;
    this.selectedRun = null;
    this.showVersionModal = true;
    const modelId = this.getModelId(version.source);

    forkJoin({
      signature: this.modelApiService.getModelSignature(version.name, modelId),
      run: version.runId ? this.modelApiService.getRunById(version.runId) : of(null)
    }).subscribe({
      next: (data) => {
        this.selectedSignature = data.signature;
        this.selectedRun = data.run;
        this.isLoadingSignature = false;
      },
      error: () => {
        this.isLoadingSignature = false;
      }
    });
  }

  closeVersionModal(): void {
    this.showVersionModal = false;
    this.selectedVersion = null;
    this.selectedSignature = null;
    this.selectedRun = null;
  }

  requestPromotionFromVersion(): void {
    const version = this.selectedVersion;
    this.showVersionModal = false;
    this.openPromotionForm(version);
  }

  typeBadgeClass(type: string | undefined | null): string {
    switch (type) {
      case 'long':
        return 'type-badge--long';
      case 'double':
        return 'type-badge--double';
      default:
        return 'type-badge--default';
    }
  }

  metricByKey(key: string): number | null {
    const metric = this.selectedRun?.data?.metrics?.find(m => m.key === key);
    return metric ? metric.value : null;
  }

  private parseTensorSpec(tensorSpec: string | null): { dtype: string; shape: string } {
    if (!tensorSpec) {
      return { dtype: '', shape: '' };
    }
    const dtypeMatch = tensorSpec.match(/dtype=([^,}]+)/);
    const shapeMatch = tensorSpec.match(/shape=(\[[^\]]*\])/);
    return { dtype: dtypeMatch?.[1] ?? '', shape: shapeMatch?.[1] ?? '' };
  }

  outputTypeLabel(field: SignatureField): string {
    const { dtype } = this.parseTensorSpec(field.tensorSpec);
    return dtype ? `${field.type}[${dtype}]` : field.type;
  }

  outputShapeLabel(field: SignatureField): string {
    return this.parseTensorSpec(field.tensorSpec).shape || '—';
  }

  runMlflowLink(): string {
    if (!this.selectedRun) {
      return this.mlflowUrl;
    }
    return `${this.mlflowUrl}/#/experiments/${this.selectedRun.info.experimentId}/runs/${this.selectedRun.info.runId}`;
  }
}
