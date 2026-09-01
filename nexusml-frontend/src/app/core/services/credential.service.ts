import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CreateCredentialRequest, Credential } from '../models/credential.model';

@Injectable({ providedIn: 'root' })
export class CredentialService {
  private readonly apiUrl = `${environment.apiUrl}/api/identity/credentials`;

  constructor(private http: HttpClient) {}

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
