export interface PipelineRun {
  id: string;
  dagId: string;
  dagRunId: string;
  status: 'running' | 'success' | 'failed';
  triggeredBy: string;
  triggeredAt: string;
  completedAt: string | null;
  dataset: string;
  objective: string;
  totalTasks: number;
  completedTasks: number;
  taskStatuses: TaskStatus[];
}

export interface TaskStatus {
  taskId: string;
  state: 'success' | 'running' | 'failed' | 'queued' | 'none' | 'upstream_failed';
  startDate: string | null;
  endDate: string | null;
  tryNumber: number;
}

export interface TriggerPipelineRequest {
  dagId: string;
  dataset?: string;
  objective?: string;
  conf?: Record<string, any>;
}

export interface AirflowConnectionStatus {
  connected: boolean;
  airflowUrl: string;
  dagCount: number;
  timestamp: string;
}

export interface TaskLogsResponse {
  taskId: string;
  dagRunId: string;
  logs: string;
}

export interface AirflowDag {
  dagId: string;
  displayName: string;
  description: string;
  isPaused: boolean;
  isActive: boolean;
  scheduleInterval: any;
  tags: Array<{ name: string }>;
  owners: string[];
  hasImportErrors: boolean;
  timetableDescription: string;
}
