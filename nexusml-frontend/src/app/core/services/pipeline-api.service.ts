import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';

import { RuntimeConfigService } from './runtime-config.service';
import {
  AirflowConnectionStatus,
  AirflowDag,
  PipelineRun,
  TaskLogsResponse,
  TriggerPipelineRequest
} from '../models/pipeline.model';

@Injectable({ providedIn: 'root' })
export class PipelineApiService {
  private get apiUrl(): string {
    return `${this.runtimeConfig.apiUrl}/api/pipelines`;
  }

  constructor(private http: HttpClient, private runtimeConfig: RuntimeConfigService) {}

  triggerPipeline(request: TriggerPipelineRequest): Observable<PipelineRun> {
    return this.http.post<PipelineRun>(`${this.apiUrl}/trigger`, request);
  }

  getAllRuns(): Observable<PipelineRun[]> {
    return this.http.get<PipelineRun[]>(this.apiUrl);
  }

  getRunById(id: string): Observable<PipelineRun> {
    return this.http.get<PipelineRun>(`${this.apiUrl}/${id}`);
  }

  testConnection(): Observable<AirflowConnectionStatus> {
    return this.http.get<AirflowConnectionStatus>(`${this.apiUrl}/connection/test`);
  }

  pollRunStatus(id: string): Observable<PipelineRun> {
    return interval(3000).pipe(
      switchMap(() => this.getRunById(id)),
      takeWhile(run => run.status === 'running', true)
    );
  }

  getAllDags(): Observable<AirflowDag[]> {
    return this.http.get<AirflowDag[]>(`${this.apiUrl}/dags`);
  }

  getDag(dagId: string): Observable<AirflowDag> {
    return this.http.get<AirflowDag>(`${this.apiUrl}/dags/${dagId}`);
  }

  getDagRuns(dagId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/dags/${dagId}/runs`);
  }

  togglePause(dagId: string, isPaused: boolean): Observable<void> {
    return this.http.patch<void>(
      `${this.apiUrl}/dags/${dagId}/pause`,
      null,
      { params: { isPaused } }
    );
  }

  getTaskLogs(runId: string, taskId: string, tryNumber = 1): Observable<TaskLogsResponse> {
    return this.http.get<TaskLogsResponse>(
      `${this.apiUrl}/${runId}/tasks/${taskId}/logs`,
      { params: { tryNumber } }
    );
  }

  markAsFailed(runId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${runId}/fail`, {});
  }

  pauseDagRun(runId: string, isPaused: boolean): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/${runId}/pause-dag`,
      null,
      { params: { isPaused } }
    );
  }
}
