export type CredentialCategory =
  'SOURCE_CONTROL' |
  'CONTAINER_REGISTRY' |
  'CLOUD_PROVIDER' |
  'ML_PLATFORM' |
  'NOTIFICATION' |
  'DATA_STORAGE' |
  'CI_CD' |
  'OTHER';

export interface Credential {
  id: string;
  name: string;
  type: string;
  description: string;
  category: CredentialCategory;
  createdBy: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateCredentialRequest {
  name: string;
  type: string;
  description: string;
  category: string;
  value: string;
}

export interface CredentialType {
  category: string;
  type: string;
  name: string;
  icon: string;
  placeholder: string;
  description: string;
}
