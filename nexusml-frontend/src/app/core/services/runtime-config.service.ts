import { Injectable } from '@angular/core';

export interface RuntimeConfig {
  apiUrl: string;
  mlflowUrl: string;
  airflowUrl: string;
  frontendUrl: string;
  keycloak: {
    url: string;
    realm: string;
    clientId: string;
  };
}

// Used only if config.json is missing or fails to load, so local dev works out of the box.
const DEFAULT_CONFIG: RuntimeConfig = {
  apiUrl: 'http://localhost:8085',
  mlflowUrl: 'http://localhost:5001',
  airflowUrl: 'http://localhost:8080',
  frontendUrl: 'http://localhost:4300',
  keycloak: {
    url: 'http://localhost:8180',
    realm: 'nexusml',
    clientId: 'nexusml-frontend'
  }
};

/**
 * Loads deployment-specific service URLs from /config.json at app startup.
 * Unlike environment.ts, config.json is a static asset copied as-is into the
 * build output — it can be edited after the app is built (e.g. by whoever
 * deploys it, to point at whatever ports their services run on) and takes
 * effect on the next page load, no rebuild required.
 */
@Injectable({ providedIn: 'root' })
export class RuntimeConfigService {
  private config: RuntimeConfig = DEFAULT_CONFIG;
  private loadPromise: Promise<void> | null = null;

  load(): Promise<void> {
    if (!this.loadPromise) {
      this.loadPromise = fetch('config.json')
        .then(res => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
        .then((json: Partial<RuntimeConfig>) => {
          this.config = {
            ...DEFAULT_CONFIG,
            ...json,
            keycloak: { ...DEFAULT_CONFIG.keycloak, ...json.keycloak }
          };
        })
        .catch((err: unknown) => {
          console.warn('Could not load config.json, falling back to built-in defaults.', err);
          this.config = DEFAULT_CONFIG;
        });
    }
    return this.loadPromise;
  }

  get apiUrl(): string {
    return this.config.apiUrl;
  }

  get mlflowUrl(): string {
    return this.config.mlflowUrl;
  }

  get airflowUrl(): string {
    return this.config.airflowUrl;
  }

  get frontendUrl(): string {
    return this.config.frontendUrl;
  }

  get keycloakUrl(): string {
    return this.config.keycloak.url;
  }

  get keycloakRealm(): string {
    return this.config.keycloak.realm;
  }

  get keycloakClientId(): string {
    return this.config.keycloak.clientId;
  }
}
