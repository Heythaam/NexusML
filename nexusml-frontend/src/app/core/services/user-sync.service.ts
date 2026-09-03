import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { RuntimeConfigService } from './runtime-config.service';

export interface UserSyncResponse {
  id: string;
  keycloakId: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  lastLogin: string | null;
  active: boolean;
}

@Injectable({ providedIn: 'root' })
export class UserSyncService {
  private get apiUrl(): string {
    return `${this.runtimeConfig.apiUrl}/api/identity/users/sync`;
  }

  constructor(private http: HttpClient, private runtimeConfig: RuntimeConfigService) {}

  syncCurrentUser(
    keycloakId: string,
    username: string,
    email: string,
    role: string
  ): Observable<UserSyncResponse> {
    return this.http.post<UserSyncResponse>(this.apiUrl, {
      keycloakId,
      username,
      email,
      role
    });
  }
}
