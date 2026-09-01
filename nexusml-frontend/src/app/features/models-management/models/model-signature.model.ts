export interface SignatureField {
  name: string;
  dataType: string;
  shape: string;
  required: boolean;
  description: string;
  example: string | number | boolean;
}

export interface ModelSignature {
  inputs: SignatureField[];
  outputs: SignatureField[];
  schemaVersion: string;
  serialization: string;
  pythonVersion: string;
}

export interface DeploymentInfo {
  readyReplicas: number;
  totalReplicas: number;
  lastDeploy: string;
  endpoint: string;
  avgLatency: number;
  requestsPerMin: number;
}

export interface TestEndpointResponse {
  status: string;
  latency: number;
  body: string;
}
