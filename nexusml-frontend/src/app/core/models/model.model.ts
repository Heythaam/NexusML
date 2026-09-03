export interface MLflowExperiment {
  experimentId: string;
  name: string;
  artifactLocation: string;
  lifecycleStage: string;
  lastUpdateTime: number;
  creationTime: number;
}

export interface MLflowRun {
  info: MLflowRunInfo;
  data: MLflowRunData;
}

export interface MLflowRunInfo {
  runUuid: string;
  runId: string;
  experimentId: string;
  runName: string;
  userId: string;
  status: string;
  startTime: number;
  endTime: number;
  artifactUri: string;
  lifecycleStage: string;
}

export interface MLflowRunData {
  metrics: MLflowMetric[];
  params: MLflowParam[];
  tags: MLflowTag[];
}

export interface MLflowMetric {
  key: string;
  value: number;
  timestamp: number;
  step: number;
}

export interface MLflowParam {
  key: string;
  value: string;
}

export interface MLflowTag {
  key: string;
  value: string;
}

export interface MLflowRegisteredModel {
  name: string;
  creationTimestamp: number;
  lastUpdatedTimestamp: number;
  description: string;
  latestVersions: MLflowModelVersion[];
}

export interface MLflowModelVersion {
  name: string;
  version: string;
  creationTimestamp: number;
  lastUpdatedTimestamp: number;
  currentStage: string;
  description: string;
  source: string;
  runId: string;
  status: string;
}

export interface PromotionRequest {
  id: string;
  modelName: string;
  modelVersion: string;
  fromStage: string;
  toStage: string;
  requestedBy: string;
  requestedAt: string;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
}

export interface CreatePromotionRequest {
  modelName: string;
  modelVersion: string;
  fromStage: string;
  toStage: string;
  comment: string;
}

export interface SignatureField {
  name: string;
  type: string;
  required: boolean;
  tensorSpec: string | null;
}

export interface ModelSignature {
  inputs: SignatureField[];
  outputs: SignatureField[];
  flavor: string;
  frameworkVersion: string;
  mlflowVersion: string;
  modelId: string;
}
