import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { RuntimeConfigService } from './runtime-config.service';
import {
  CreatePromotionRequest,
  MLflowExperiment,
  MLflowModelVersion,
  MLflowRegisteredModel,
  MLflowRun,
  ModelSignature,
  PromotionRequest
} from '../models/model.model';

@Injectable({ providedIn: 'root' })
export class ModelApiService {
  private get baseUrl(): string {
    return this.runtimeConfig.apiUrl;
  }

  constructor(private http: HttpClient, private runtimeConfig: RuntimeConfigService) {}

  // Experiments
  getExperiments(): Observable<MLflowExperiment[]> {
    return this.http.get<MLflowExperiment[]>(`${this.baseUrl}/api/models/experiments`);
  }

  getExperimentRuns(experimentId: string): Observable<MLflowRun[]> {
    return this.http.get<MLflowRun[]>(`${this.baseUrl}/api/models/experiments/${experimentId}/runs`);
  }

  getAllRuns(): Observable<MLflowRun[]> {
    return this.http.get<MLflowRun[]>(`${this.baseUrl}/api/models/experiments/runs`);
  }

  getRunById(runId: string): Observable<MLflowRun> {
    return this.http.get<MLflowRun>(`${this.baseUrl}/api/models/experiments/runs/${runId}`);
  }

  // Registered Models
  getRegisteredModels(): Observable<MLflowRegisteredModel[]> {
    return this.http.get<MLflowRegisteredModel[]>(`${this.baseUrl}/api/models/registry`);
  }

  getModelVersions(modelName: string): Observable<MLflowModelVersion[]> {
    return this.http.get<MLflowModelVersion[]>(`${this.baseUrl}/api/models/registry/${modelName}/versions`);
  }

  getModelSignature(modelName: string, modelId: string): Observable<ModelSignature> {
    return this.http.get<ModelSignature>(`${this.baseUrl}/api/models/registry/${modelName}/signature/${modelId}`);
  }

  // Promotions
  getPromotions(): Observable<PromotionRequest[]> {
    return this.http.get<PromotionRequest[]>(`${this.baseUrl}/api/models/promotions`);
  }

  getPendingPromotions(): Observable<PromotionRequest[]> {
    return this.http.get<PromotionRequest[]>(`${this.baseUrl}/api/models/promotions/pending`);
  }

  createPromotion(request: CreatePromotionRequest): Observable<PromotionRequest> {
    return this.http.post<PromotionRequest>(`${this.baseUrl}/api/models/promotions`, request);
  }

  approvePromotion(id: string): Observable<PromotionRequest> {
    return this.http.post<PromotionRequest>(`${this.baseUrl}/api/models/promotions/${id}/approve`, {});
  }

  rejectPromotion(id: string, reason: string): Observable<PromotionRequest> {
    return this.http.post<PromotionRequest>(`${this.baseUrl}/api/models/promotions/${id}/reject`, { reason });
  }

  testConnection(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/models/experiments/connection/test`);
  }
}
