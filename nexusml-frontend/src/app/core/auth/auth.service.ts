import { Injectable } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';

import { RuntimeConfigService } from '../services/runtime-config.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private keycloak: KeycloakService, private runtimeConfig: RuntimeConfigService) {}

  getUsername(): string {
    const token = this.keycloak.getKeycloakInstance()?.idTokenParsed;
    return token?.['preferred_username'] || 'User';
  }

  getToken(): Promise<string> {
    return this.keycloak.getToken();
  }

  getFullName(): string {
    const token = this.keycloak.getKeycloakInstance()?.idTokenParsed;
    const first = token?.['given_name'] || '';
    const last = token?.['family_name'] || '';
    return `${first} ${last}`.trim() || this.getUsername();
  }

  getUserInitials(): string {
    const name = this.getFullName();
    if (!name) return 'U';
    return name.split(' ')
      .filter(n => n.length > 0)
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  getEmail(): string {
    const token = this.keycloak.getKeycloakInstance()?.idTokenParsed;
    return token?.['email'] || '';
  }

  getKeycloakId(): string {
    const token = this.keycloak.getKeycloakInstance()?.idTokenParsed;
    return token?.['sub'] || '';
  }

  getRoles(): string[] {
    return this.keycloak.getKeycloakInstance()
      ?.realmAccess?.roles || [];
  }

  hasRole(role: string): boolean {
    return this.getRoles().includes(role);
  }

  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  isDataScientist(): boolean {
    return this.hasRole('DATA_SCIENTIST');
  }

  isViewer(): boolean {
    return this.hasRole('VIEWER');
  }

  getCurrentRole(): string {
    if (this.isAdmin()) return 'ADMIN';
    if (this.isDataScientist()) return 'DATA_SCIENTIST';
    if (this.isViewer()) return 'VIEWER';
    return 'VIEWER';
  }

  logout(): void {
    this.keycloak.logout(this.runtimeConfig.frontendUrl);
  }
}
