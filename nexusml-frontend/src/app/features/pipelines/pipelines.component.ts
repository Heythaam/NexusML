import { Component } from '@angular/core';

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
}

interface PipelineTask {
  name: string;
  state: TaskState;
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

@Component({
  selector: 'app-pipelines',
  templateUrl: './pipelines.component.html',
  styleUrl: './pipelines.component.scss'
})
export class PipelinesComponent {
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

  private buildTaskList(pipeline: Pipeline): PipelineTask[] {
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
