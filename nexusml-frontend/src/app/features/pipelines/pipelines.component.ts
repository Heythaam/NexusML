import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { ToastService } from '../../core/services/toast.service';
import { PipelineApiService } from '../../core/services/pipeline-api.service';
import { AuthService } from '../../core/auth/auth.service';
import { AirflowDag, PipelineRun, TaskStatus, TriggerPipelineRequest } from '../../core/models/pipeline.model';

const MLOPS_DAG_ID = 'talys_mlops_pipeline';

type DagStatusFilter = 'all' | 'active' | 'paused';

interface DagTaskDef {
  id: string;
  description: string;
}

interface TriggerDataset {
  name: string;
  format: string;
  size: string;
}

const DAG_TASKS: DagTaskDef[] = [
  { id: 'quality_gate', description: 'Data quality validation' },
  { id: 'hdfs_upload', description: 'Upload to HDFS' },
  { id: 'spark_ingest', description: 'Spark data ingestion' },
  { id: 'spark_preprocess', description: 'Spark preprocessing' },
  { id: 'spark_validate', description: 'Spark validation' },
  { id: 'hdfs_download', description: 'Verify HDFS availability' },
  { id: 'train_model', description: 'Train & compare models (MLflow)' },
  { id: 'fix_mlflow_paths', description: 'Fix MLflow artifact paths' },
  { id: 'optimize_hyperparams', description: 'Hyperparameter tuning (Optuna)' },
  { id: 'evaluate_model', description: 'Final model evaluation' },
  { id: 'monitor_drift', description: 'PSI drift detection' }
];

const TRIGGER_DATASETS: TriggerDataset[] = [
  { name: 'transactions_2025.csv', format: 'CSV', size: '2.4 GB' },
  { name: 'fraud_labels.csv', format: 'CSV', size: '120 MB' },
  { name: 'customer_profiles.parquet', format: 'Parquet', size: '890 MB' }
];

const TASK_LABEL_MAP: Record<string, string> = {
  quality_gate: 'Quality Gate',
  hdfs_upload: 'HDFS Upload',
  spark_ingest: 'Spark Ingest',
  spark_preprocess: 'Spark Preprocess',
  spark_validate: 'Spark Validate',
  hdfs_download: 'HDFS Download',
  train_model: 'Train Model',
  fix_mlflow_paths: 'Fix MLflow Paths',
  optimize_hyperparams: 'Optimize Hyperparams',
  evaluate_model: 'Evaluate Model',
  monitor_drift: 'Monitor Drift'
};

const AIRFLOW_BASE_URL = 'http://localhost:8080';

@Component({
  selector: 'app-pipelines',
  templateUrl: './pipelines.component.html',
  styleUrl: './pipelines.component.scss'
})
export class PipelinesComponent implements OnInit, OnDestroy {
  dags: AirflowDag[] = [];
  dagRuns: Map<string, any[]> = new Map();
  isLoading = false;
  error: string | null = null;

  searchTerm = '';
  statusFilter: DagStatusFilter = 'all';

  selectedDagPanel: AirflowDag | null = null;

  readonly dagTasks: DagTaskDef[] = DAG_TASKS;
  readonly triggerDatasets: TriggerDataset[] = TRIGGER_DATASETS;
  readonly TASK_ORDER: string[] = DAG_TASKS.map(t => t.id);
  readonly TASK_LABELS: Record<string, string> = TASK_LABEL_MAP;

  showTriggerModal = false;
  triggering = false;
  selectedDatasetName = TRIGGER_DATASETS[0].name;

  availableDags: AirflowDag[] = [];
  isLoadingDags = false;
  selectedDagId: string | null = null;
  selectedDagRunsCount: number | null = null;
  additionalConfJson = '';

  activeRun: PipelineRun | null = null;
  private pollingSubscription: Subscription | null = null;

  dagRefreshInterval: any = null;
  lastSyncTime: Date = new Date();
  syncDisplayInterval: any = null;
  syncDisplay = 0;

  // Logs modal state
  showLogsModal = false;
  selectedTaskForLogs: string | null = null;
  taskLogs = '';
  isLoadingLogs = false;
  logsError: string | null = null;

  private readonly cleanups: Array<() => void> = [];

  constructor(
    private readonly toastService: ToastService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly pipelineApiService: PipelineApiService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadDags();

    this.dagRefreshInterval = setInterval(() => {
      this.loadDags(true);
    }, 10000);

    this.syncDisplayInterval = setInterval(() => {
      this.syncDisplay = this.secondsSinceSync;
    }, 1000);

    if (this.route.snapshot.queryParamMap.get('trigger') === 'true') {
      this.openTriggerModal();
      this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
    }
  }

  ngOnDestroy(): void {
    this.cleanups.forEach(cleanup => cleanup());
    this.pollingSubscription?.unsubscribe();
    if (this.dagRefreshInterval) {
      clearInterval(this.dagRefreshInterval);
    }
    if (this.syncDisplayInterval) {
      clearInterval(this.syncDisplayInterval);
    }
  }

  get canManage(): boolean {
    return this.authService.isAdmin() || this.authService.isDataScientist();
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  // ─── DAG table ─────────────────────────────────────────────

  loadDags(background = false): void {
    if (!background) {
      this.isLoading = true;
    }
    this.error = null;
    this.pipelineApiService.getAllDags().subscribe({
      next: (dags) => {
        this.dags = dags;
        this.isLoading = false;
        this.lastSyncTime = new Date();
        this.syncDisplay = 0;
        dags.forEach(dag => this.loadLastRun(dag.dagId));
      },
      error: (err) => {
        this.error = 'Failed to load DAGs from Airflow';
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  get secondsSinceSync(): number {
    return Math.floor((new Date().getTime() - this.lastSyncTime.getTime()) / 1000);
  }

  loadLastRun(dagId: string): void {
    this.pipelineApiService.getDagRuns(dagId).subscribe({
      next: (runs) => {
        this.dagRuns.set(dagId, runs);
      },
      error: () => {}
    });
  }

  getLastRun(dagId: string): any | null {
    const runs = this.dagRuns.get(dagId);
    return runs && runs.length > 0 ? runs[0] : null;
  }

  getLastRunStatus(dagId: string): string {
    const run = this.getLastRun(dagId);
    return run?.state || 'never';
  }

  getLastRunDate(dagId: string): string | null {
    const run = this.getLastRun(dagId);
    return run?.startDate || null;
  }

  get filteredDags(): AirflowDag[] {
    return this.dags.filter(dag => {
      const matchesSearch = !this.searchTerm ||
        dag.dagId.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        dag.description?.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesStatus = !this.statusFilter ||
        this.statusFilter === 'all' ||
        (this.statusFilter === 'paused' && dag.isPaused) ||
        (this.statusFilter === 'active' && !dag.isPaused);
      return matchesSearch && matchesStatus;
    });
  }

  get totalCount(): number {
    return this.dags.length;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'all';
  }

  refresh(): void {
    this.loadDags();
  }

  togglePause(dag: AirflowDag, event: Event): void {
    event.stopPropagation();
    this.pipelineApiService.togglePause(dag.dagId, !dag.isPaused).subscribe({
      next: () => {
        dag.isPaused = !dag.isPaused;
        this.toastService.show(
          dag.isPaused ? `${dag.dagId} paused` : `${dag.dagId} unpaused`,
          'success'
        );
        // Reload this DAG's runs to reflect new state
        this.loadLastRun(dag.dagId);
        // Also reload the full DAG list after 1s to get fresh state from Airflow
        setTimeout(() => this.loadDags(true), 1000);
      },
      error: () => this.toastService.show('Failed to toggle pause', 'error')
    });
  }

  initials(owner: string): string {
    return owner.slice(0, 2).toUpperCase();
  }

  dagStatusBadgeClass(dag: AirflowDag): string {
    return dag.isPaused ? 'badge--paused' : 'badge--success';
  }

  lastRunBadgeClass(dagId: string): string {
    return 'badge--' + this.getLastRunStatus(dagId);
  }

  relativeTime(dateStr: string | null): string {
    if (!dateStr) {
      return '—';
    }
    const diffMs = Date.now() - new Date(dateStr).getTime();
    if (diffMs < 60000) {
      return 'just now';
    }
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 60) {
      return `${minutes}m ago`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours}h ago`;
    }
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  airflowDagUrl(dagId: string): string {
    return `${AIRFLOW_BASE_URL}/dags/${dagId}`;
  }

  // ─── Side panel ────────────────────────────────────────────

  openDagDetail(dag: AirflowDag): void {
    this.selectedDagPanel = dag;
    if (!this.dagRuns.has(dag.dagId)) {
      this.loadLastRun(dag.dagId);
    }
  }

  closeDagDetail(): void {
    this.selectedDagPanel = null;
  }

  recentRuns(dagId: string): any[] {
    return (this.dagRuns.get(dagId) ?? []).slice(0, 5);
  }

  runDuration(run: any): string {
    return this.formatDuration(run?.startDate, run?.endDate) || '—';
  }

  triggerFromPanel(dag: AirflowDag): void {
    this.closeDagDetail();
    this.openTriggerModal(dag.dagId);
  }

  // ─── Trigger modal ─────────────────────────────────────────

  get isMlopsDag(): boolean {
    return this.selectedDagId === MLOPS_DAG_ID;
  }

  get selectedDag(): AirflowDag | null {
    return this.availableDags.find(d => d.dagId === this.selectedDagId) ?? null;
  }

  get dagRunConfigJson(): string {
    if (this.isMlopsDag) {
      return JSON.stringify(
        {
          dag_id: this.selectedDagId,
          conf: {
            RAW_DATA_FILE: this.selectedDatasetName,
            MLFLOW_TRACKING_URI: 'http://mlflow:5000',
            objective: 'f1_score'
          }
        },
        null,
        2
      );
    }

    let conf: Record<string, any> = {};
    if (this.additionalConfJson.trim()) {
      try {
        conf = JSON.parse(this.additionalConfJson);
      } catch {
        conf = { error: 'Invalid JSON' };
      }
    }
    return JSON.stringify({ dag_id: this.selectedDagId, conf }, null, 2);
  }

  statusBadgeClass(status: PipelineRun['status']): string {
    return 'badge--' + status;
  }

  openTriggerModal(dagId?: string): void {
    this.selectedDatasetName = this.triggerDatasets[0].name;
    this.additionalConfJson = '';
    this.showTriggerModal = true;
    this.loadAvailableDags(dagId);
  }

  closeTriggerModal(): void {
    if (this.triggering) {
      return;
    }
    this.showTriggerModal = false;
  }

  loadAvailableDags(preferredDagId?: string): void {
    this.isLoadingDags = true;
    this.pipelineApiService.getAllDags().subscribe({
      next: (dags) => {
        this.availableDags = dags.filter(d => d.isActive && !d.hasImportErrors);
        this.isLoadingDags = false;
        const preferred = this.availableDags.find(d => d.dagId === (preferredDagId ?? MLOPS_DAG_ID));
        this.selectedDagId = (preferred ?? this.availableDags[0])?.dagId ?? null;
        this.onDagSelected();
      },
      error: () => {
        this.isLoadingDags = false;
      }
    });
  }

  onDagSelected(): void {
    this.selectedDagRunsCount = null;
    if (!this.selectedDagId) {
      return;
    }
    this.pipelineApiService.getDagRuns(this.selectedDagId).subscribe({
      next: (runs) => (this.selectedDagRunsCount = runs.length),
      error: () => (this.selectedDagRunsCount = null)
    });
  }

  triggerDag(): void {
    if (this.triggering || !this.selectedDagId) {
      return;
    }

    let conf: Record<string, any> | undefined;
    if (!this.isMlopsDag && this.additionalConfJson.trim()) {
      try {
        conf = JSON.parse(this.additionalConfJson);
      } catch {
        this.toastService.show('Additional config must be valid JSON', 'error');
        return;
      }
    }

    this.triggering = true;

    const request: TriggerPipelineRequest = {
      dagId: this.selectedDagId,
      ...(this.isMlopsDag ? { dataset: this.selectedDatasetName, objective: 'f1_score' } : {}),
      ...(conf ? { conf } : {})
    };

    this.pipelineApiService.triggerPipeline(request).subscribe({
      next: (run) => {
        this.triggering = false;
        this.showTriggerModal = false;
        this.activeRun = run;
        this.toastService.show(`DAG triggered — ${run.dagRunId}`, 'success');
        this.startPolling(run.id);
      },
      error: (err) => {
        this.triggering = false;
        this.toastService.show('Failed to trigger DAG', 'error');
        console.error(err);
      }
    });
  }

  private startPolling(runId: string): void {
    this.pollingSubscription?.unsubscribe();
    this.pollingSubscription = this.pipelineApiService.pollRunStatus(runId).subscribe({
      next: (run) => {
        this.activeRun = run;
      },
      complete: () => {
        if (this.activeRun?.status === 'success') {
          this.toastService.show('Pipeline completed successfully!', 'success');
        } else if (this.activeRun?.status === 'failed') {
          this.toastService.show('Pipeline failed', 'error');
        }
      }
    });
  }

  get activeRunProgress(): number {
    if (!this.activeRun || this.activeRun.totalTasks === 0) {
      return 0;
    }
    return Math.round((this.activeRun.completedTasks / this.activeRun.totalTasks) * 100);
  }

  get displayTasks(): Array<{ taskId: string; label: string }> {
    // If we have real task statuses from the API, use them
    if ((this.activeRun?.taskStatuses?.length ?? 0) > 0) {
      const statuses = this.activeRun!.taskStatuses;

      // Sort by TASK_ORDER for the known MLOps DAG
      if (this.activeRun?.dagId === MLOPS_DAG_ID) {
        return this.TASK_ORDER
          .map(taskId => ({
            taskId,
            label: this.TASK_LABELS[taskId]
          }))
          .filter(task => statuses.some(s => s.taskId === task.taskId));
      }

      // For other DAGs, sort by TASK_ORDER where recognized, otherwise keep API order
      return statuses
        .slice()
        .sort((a, b) => {
          const aIdx = this.TASK_ORDER.indexOf(a.taskId);
          const bIdx = this.TASK_ORDER.indexOf(b.taskId);
          if (aIdx !== -1 && bIdx !== -1) {
            return aIdx - bIdx;
          }
          return 0;
        })
        .map(t => ({
          taskId: t.taskId,
          label: this.TASK_LABELS[t.taskId] || this.humanizeTaskId(t.taskId)
        }));
    }
    // Fallback: only use the hardcoded list for the MLOps DAG, before the first poll
    if (this.activeRun?.dagId === MLOPS_DAG_ID) {
      return this.TASK_ORDER.map(taskId => ({
        taskId,
        label: this.TASK_LABELS[taskId]
      }));
    }
    // For other DAGs with no task data yet, show empty
    return [];
  }

  private humanizeTaskId(taskId: string): string {
    return taskId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  getTaskStatus(taskId: string): TaskStatus | null {
    if (!this.activeRun?.taskStatuses) {
      return null;
    }
    return this.activeRun.taskStatuses.find(t => t.taskId === taskId) || null;
  }

  getTaskState(taskId: string): string {
    return this.getTaskStatus(taskId)?.state || 'none';
  }

  getTaskIcon(state: string): string {
    switch (state) {
      case 'success': return '✓';
      case 'running': return '↻';
      case 'failed': return '✗';
      case 'upstream_failed': return '⚠';
      default: return '—';
    }
  }

  getTaskStateClass(state: string): string {
    switch (state) {
      case 'success': return 'success';
      case 'running': return 'running';
      case 'failed': return 'failed';
      case 'upstream_failed': return 'warning';
      default: return 'muted';
    }
  }

  getTaskDuration(taskId: string): string {
    const task = this.getTaskStatus(taskId);
    if (!task?.startDate || !task?.endDate) {
      return '';
    }
    const start = new Date(task.startDate).getTime();
    const end = new Date(task.endDate).getTime();
    const diffMs = end - start;
    const mins = Math.floor(diffMs / 60000);
    const secs = Math.floor((diffMs % 60000) / 1000);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  }

  getFailedTask(): string | null {
    if (!this.activeRun?.taskStatuses) {
      return null;
    }
    const failed = this.activeRun.taskStatuses.find(t => t.state === 'failed');
    return failed ? (this.TASK_LABELS[failed.taskId] || failed.taskId) : null;
  }

  dismissActiveRun(): void {
    this.pollingSubscription?.unsubscribe();
    this.pollingSubscription = null;
    this.activeRun = null;
  }

  // ─── Task logs ─────────────────────────────────────────────

  openTaskLogs(taskId: string): void {
    const task = this.getTaskStatus(taskId);
    if (!task || task.state === 'none' || !this.activeRun) {
      return;
    }

    this.selectedTaskForLogs = taskId;
    this.showLogsModal = true;
    this.taskLogs = '';
    this.logsError = null;
    this.isLoadingLogs = true;

    this.pipelineApiService.getTaskLogs(this.activeRun.id, taskId, task.tryNumber || 1).subscribe({
      next: (response) => {
        this.taskLogs = response.logs;
        this.isLoadingLogs = false;
      },
      error: () => {
        this.logsError = 'Failed to load logs';
        this.isLoadingLogs = false;
      }
    });
  }

  closeLogsModal(): void {
    this.showLogsModal = false;
    this.selectedTaskForLogs = null;
    this.taskLogs = '';
  }

  copyLogs(): void {
    navigator.clipboard.writeText(this.taskLogs).then(
      () => this.toastService.show('Logs copied', 'success'),
      () => this.toastService.show('Failed to copy logs', 'error')
    );
  }

  // ─── Run-level pause / mark-as-failed ──────────────────────

  toggleRunPause(): void {
    if (!this.activeRun) {
      return;
    }
    const isPaused = !this.isRunDagPaused();
    this.pipelineApiService.pauseDagRun(this.activeRun.id, isPaused).subscribe({
      next: () => {
        const dag = this.dags.find(d => d.dagId === this.activeRun?.dagId);
        if (dag) {
          dag.isPaused = isPaused;
        }
        this.toastService.show(isPaused ? 'DAG paused' : 'DAG unpaused', 'success');
      },
      error: () => this.toastService.show('Failed to toggle pause', 'error')
    });
  }

  isRunDagPaused(): boolean {
    if (!this.activeRun) {
      return false;
    }
    const dag = this.dags.find(d => d.dagId === this.activeRun?.dagId);
    return dag?.isPaused ?? false;
  }

  markRunAsFailed(): void {
    if (!this.activeRun) {
      return;
    }
    if (!confirm('Mark this pipeline run as failed?')) {
      return;
    }
    this.pipelineApiService.markAsFailed(this.activeRun.id).subscribe({
      next: () => {
        if (this.activeRun) {
          this.activeRun.status = 'failed';
        }
        this.toastService.show('Pipeline marked as failed', 'success');
        this.pollingSubscription?.unsubscribe();
      },
      error: () => this.toastService.show('Failed to mark as failed', 'error')
    });
  }

  private formatDuration(startDate?: string | null, endDate?: string | null): string {
    if (!startDate) {
      return '';
    }
    const start = new Date(startDate).getTime();
    const end = endDate ? new Date(endDate).getTime() : Date.now();
    const totalSeconds = Math.max(0, Math.round((end - start) / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  }
}
