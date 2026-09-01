import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ToastService } from '../../core/services/toast.service';

export type PipelineStatus = 'running' | 'success' | 'failed' | 'paused';
type StatusFilter = 'all' | PipelineStatus;
type TaskState = 'success' | 'running' | 'failed' | 'pending';

interface Pipeline {
  id: string;
  name: string;
  status: PipelineStatus;
  schedule: string;
  lastRun: string;
  duration: string;
  tasks: number;
  tasksCompleted: number;
  owner: string;
  tags: string[];
  isDagRun?: boolean;
}

interface PipelineTask {
  name: string;
  state: TaskState;
}

interface DagTaskDef {
  id: string;
  description: string;
}

interface TriggerDataset {
  name: string;
  format: string;
  size: string;
}

const TASK_NAME_POOL = [
  'data_ingestion',
  'data_validation',
  'feature_extraction',
  'feature_engineering',
  'model_train',
  'model_evaluation',
  'model_registration',
  'deployment',
  'notification',
  'schema_check',
  'data_export',
  'cleanup'
];

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

const DAG_STEP_INTERVAL_MS = 2000;
const CURRENT_USER = 'alice';

@Component({
  selector: 'app-pipelines',
  templateUrl: './pipelines.component.html',
  styleUrl: './pipelines.component.scss'
})
export class PipelinesComponent implements OnInit, OnDestroy {
  pipelines: Pipeline[] = [
    { id: 'fraud-detection-pipeline', name: 'fraud-detection-pipeline', status: 'running', schedule: 'Every 6h', lastRun: '2 min ago', duration: '4m 32s', tasks: 8, tasksCompleted: 5, owner: 'alice', tags: ['finance', 'ml'] },
    { id: 'customer-churn-model', name: 'customer-churn-model', status: 'success', schedule: 'Daily 2AM', lastRun: '1h ago', duration: '12m 08s', tasks: 12, tasksCompleted: 12, owner: 'bob', tags: ['crm', 'ml'] },
    { id: 'image-classifier-v2', name: 'image-classifier-v2', status: 'success', schedule: 'On push', lastRun: '3h ago', duration: '8m 44s', tasks: 6, tasksCompleted: 6, owner: 'alice', tags: ['vision'] },
    { id: 'nlp-sentiment-analysis', name: 'nlp-sentiment-analysis', status: 'failed', schedule: 'Every 12h', lastRun: '5h ago', duration: '2m 11s', tasks: 9, tasksCompleted: 3, owner: 'carol', tags: ['nlp'] },
    { id: 'recommendation-engine', name: 'recommendation-engine', status: 'running', schedule: 'Every 2h', lastRun: '8h ago', duration: '31m 05s', tasks: 15, tasksCompleted: 11, owner: 'bob', tags: ['recsys', 'ml'] },
    { id: 'data-quality-checker', name: 'data-quality-checker', status: 'success', schedule: 'Hourly', lastRun: '10h ago', duration: '1m 20s', tasks: 4, tasksCompleted: 4, owner: 'alice', tags: ['data'] },
    { id: 'model-retraining-job', name: 'model-retraining-job', status: 'paused', schedule: 'Weekly Mon', lastRun: '2d ago', duration: '45m 00s', tasks: 20, tasksCompleted: 0, owner: 'carol', tags: ['ml'] },
    { id: 'feature-engineering-v3', name: 'feature-engineering-v3', status: 'success', schedule: 'Daily 6AM', lastRun: '1d ago', duration: '18m 33s', tasks: 10, tasksCompleted: 10, owner: 'bob', tags: ['data', 'ml'] },
    { id: 'anomaly-detection', name: 'anomaly-detection', status: 'failed', schedule: 'Every 30min', lastRun: '2d ago', duration: '0m 45s', tasks: 5, tasksCompleted: 1, owner: 'alice', tags: ['monitoring'] },
    { id: 'batch-inference-job', name: 'batch-inference-job', status: 'paused', schedule: 'Daily 11PM', lastRun: '3d ago', duration: '22m 10s', tasks: 8, tasksCompleted: 0, owner: 'carol', tags: ['ml'] }
  ];

  owners = ['alice', 'bob', 'carol'];

  searchTerm = '';
  statusFilter: StatusFilter = 'all';
  ownerFilter = 'all';

  selectedPipeline: Pipeline | null = null;
  selectedPipelineTasks: PipelineTask[] = [];

  readonly dagTasks: DagTaskDef[] = DAG_TASKS;
  readonly triggerDatasets: TriggerDataset[] = TRIGGER_DATASETS;

  showTriggerModal = false;
  triggering = false;
  selectedDatasetName = TRIGGER_DATASETS[0].name;

  private readonly cleanups: Array<() => void> = [];

  constructor(
    private readonly toastService: ToastService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('trigger') === 'true') {
      this.openTriggerModal();
      this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
    }
  }

  ngOnDestroy(): void {
    this.cleanups.forEach(cleanup => cleanup());
  }

  get filteredPipelines(): Pipeline[] {
    const term = this.searchTerm.trim().toLowerCase();
    return this.pipelines.filter(pipeline => {
      const matchesSearch = !term || pipeline.name.toLowerCase().includes(term);
      const matchesStatus = this.statusFilter === 'all' || pipeline.status === this.statusFilter;
      const matchesOwner = this.ownerFilter === 'all' || pipeline.owner === this.ownerFilter;
      return matchesSearch && matchesStatus && matchesOwner;
    });
  }

  get totalCount(): number {
    return this.pipelines.length;
  }

  get dagRunConfigJson(): string {
    return JSON.stringify(
      {
        dag_id: 'talys_mlops_pipeline',
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

  statusBadgeClass(status: PipelineStatus): string {
    return 'badge--' + status;
  }

  progress(pipeline: Pipeline): number {
    return Math.round((pipeline.tasksCompleted / pipeline.tasks) * 100);
  }

  initials(owner: string): string {
    return owner.slice(0, 2).toUpperCase();
  }

  taskIcon(state: TaskState): string {
    switch (state) {
      case 'success': return '✓';
      case 'running': return '●';
      case 'failed': return '✗';
      default: return '—';
    }
  }

  openDetail(pipeline: Pipeline): void {
    this.selectedPipeline = pipeline;
    this.selectedPipelineTasks = this.buildTaskList(pipeline);
  }

  closeDetail(): void {
    this.selectedPipeline = null;
  }

  runPipeline(pipeline: Pipeline, event?: Event): void {
    event?.stopPropagation();
  }

  pausePipeline(pipeline: Pipeline, event?: Event): void {
    event?.stopPropagation();
  }

  deletePipeline(pipeline: Pipeline, event?: Event): void {
    event?.stopPropagation();
  }

  openTriggerModal(): void {
    this.selectedDatasetName = this.triggerDatasets[0].name;
    this.showTriggerModal = true;
  }

  closeTriggerModal(): void {
    if (this.triggering) {
      return;
    }
    this.showTriggerModal = false;
  }

  triggerDag(): void {
    if (this.triggering) {
      return;
    }
    this.triggering = true;
    const timeout = setTimeout(() => {
      this.triggering = false;
      this.showTriggerModal = false;
      this.launchDagRun();
    }, 800);
    this.cleanups.push(() => clearTimeout(timeout));
  }

  private launchDagRun(): void {
    const pipeline: Pipeline = {
      id: `talys-mlops-pipeline-${Date.now()}`,
      name: 'talys_mlops_pipeline',
      status: 'running',
      schedule: 'Manual',
      lastRun: 'just now',
      duration: '0m 00s',
      tasks: this.dagTasks.length,
      tasksCompleted: 0,
      owner: CURRENT_USER,
      tags: ['mlops', 'dag'],
      isDagRun: true
    };

    this.pipelines = [pipeline, ...this.pipelines];
    this.toastService.show('DAG triggered — talys_mlops_pipeline is running', 'success');
    this.runDagSimulation(pipeline);
  }

  private runDagSimulation(pipeline: Pipeline): void {
    const interval = setInterval(() => {
      pipeline.tasksCompleted++;
      if (this.selectedPipeline?.id === pipeline.id) {
        this.selectedPipelineTasks = this.buildTaskList(pipeline);
      }
      if (pipeline.tasksCompleted >= pipeline.tasks) {
        clearInterval(interval);
        pipeline.status = 'success';
        pipeline.duration = `0m ${pipeline.tasks * (DAG_STEP_INTERVAL_MS / 1000)}s`;
        if (this.selectedPipeline?.id === pipeline.id) {
          this.selectedPipelineTasks = this.buildTaskList(pipeline);
        }
        this.toastService.show('Pipeline completed — results available in Models page', 'success');
      }
    }, DAG_STEP_INTERVAL_MS);
    this.cleanups.push(() => clearInterval(interval));
  }

  private buildTaskList(pipeline: Pipeline): PipelineTask[] {
    if (pipeline.isDagRun) {
      return this.dagTasks.map((task, index) => {
        let state: TaskState;
        if (index < pipeline.tasksCompleted) {
          state = 'success';
        } else if (pipeline.status === 'running' && index === pipeline.tasksCompleted) {
          state = 'running';
        } else {
          state = 'pending';
        }
        return { name: task.id, state };
      });
    }

    const names = TASK_NAME_POOL.slice(0, pipeline.tasks);
    while (names.length < pipeline.tasks) {
      names.push(`task_${names.length + 1}`);
    }

    return names.map((name, index) => {
      let state: TaskState;
      if (index < pipeline.tasksCompleted) {
        state = 'success';
      } else if (pipeline.status === 'failed' && index === pipeline.tasksCompleted) {
        state = 'failed';
      } else if (pipeline.status === 'running' && index === pipeline.tasksCompleted) {
        state = 'running';
      } else {
        state = 'pending';
      }
      return { name, state };
    });
  }
}
