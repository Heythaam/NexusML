export interface IntegrationConfig {
  id: string;
  name: string;
  url: string;
  port: number | null;
  status: 'connected' | 'disconnected' | 'error' | 'untested';
  lastTested: string | null;
  updatedBy: string | null;
  updatedAt: string | null;
}

export interface UpdateIntegrationRequest {
  url: string;
  port: number | null;
}
