import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

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
  private readonly apiUrl = `${environment.apiUrl}/api/identity/users/sync`;

  constructor(private http: HttpClient) {}

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
