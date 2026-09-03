import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { RuntimeConfigService } from './runtime-config.service';
import { CreateCredentialRequest, Credential } from '../models/credential.model';

@Injectable({ providedIn: 'root' })
export class CredentialService {
  private get apiUrl(): string {
    return `${this.runtimeConfig.apiUrl}/api/identity/credentials`;
  }

  constructor(private http: HttpClient, private runtimeConfig: RuntimeConfigService) {}

  getAll(): Observable<Credential[]> {
    return this.http.get<Credential[]>(this.apiUrl);
  }

  create(request: CreateCredentialRequest): Observable<Credential> {
    return this.http.post<Credential>(this.apiUrl, request);
  }

  update(id: string, request: CreateCredentialRequest): Observable<Credential> {
    return this.http.put<Credential>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
