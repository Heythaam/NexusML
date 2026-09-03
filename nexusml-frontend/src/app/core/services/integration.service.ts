import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { RuntimeConfigService } from './runtime-config.service';
import { IntegrationConfig, UpdateIntegrationRequest } from '../models/integration.model';

@Injectable({ providedIn: 'root' })
export class IntegrationService {
  private get apiUrl(): string {
    return `${this.runtimeConfig.apiUrl}/api/identity/integrations`;
  }

  constructor(private http: HttpClient, private runtimeConfig: RuntimeConfigService) {}

  getAll(): Observable<IntegrationConfig[]> {
    return this.http.get<IntegrationConfig[]>(this.apiUrl);
  }

  update(id: string, request: UpdateIntegrationRequest): Observable<IntegrationConfig> {
    return this.http.put<IntegrationConfig>(`${this.apiUrl}/${id}`, request);
  }

  testConnection(id: string): Observable<IntegrationConfig> {
    return this.http.post<IntegrationConfig>(`${this.apiUrl}/${id}/test`, {});
  }

  getFullUrl(config: IntegrationConfig): string {
    if (!config.port) {
      return config.url;
    }
    return `${config.url}:${config.port}`;
  }
}
