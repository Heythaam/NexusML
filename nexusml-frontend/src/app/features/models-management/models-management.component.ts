import { Component } from '@angular/core';

import { ToastService } from '../../core/services/toast.service';
import { DeploymentInfo, ModelSignature, SignatureField, TestEndpointResponse } from './models/model-signature.model';

type Framework = 'PyTorch' | 'scikit-learn' | 'TensorFlow' | 'XGBoost';
type Stage = 'Development' | 'Staging' | 'Production' | 'Archived';
type PromotionStatus = 'pending' | 'approved' | 'rejected';
type ExperimentStatus = 'running' | 'finished' | 'failed';
type MetricKey = 'accuracy' | 'f1Score' | 'precision' | 'recall' | 'auc' | 'rmse' | 'mae';

type ActiveTab = 'registry' | 'experiments';
type StageFilter = 'all' | Stage;
type FrameworkFilter = 'all' | Framework;
type PromotionPanelState = 'requestable' | 'pending' | 'production' | 'terminal';

interface ModelMetrics {
  accuracy?: number;
  f1Score?: number;
  precision?: number;
  recall?: number;
  auc?: number;
  rmse?: number;
  mae?: number;
}

interface PromotionRequest {
  id: string;
  requestedBy: string;
  requestedAt: string;
  fromStage: string;
  toStage: string;
  status: PromotionStatus;
  comment: string;
}

interface PipelineOrigin {
  dagRunId: string;
  triggeredBy: string;
  tasksCompleted: number;
  tasksTotal: number;
  tuned: boolean;
  tuningTrials?: number;
  driftDetected: boolean;
}

interface MlModel {
  id: string;
  name: string;
  description: string;
  framework: Framework;
  stage: Stage;
  version: string;
  metrics: ModelMetrics;
  dataset: string;
  pipeline: string;
  owner: string;
  createdAt: string;
  lastUpdated: string;
  tags: string[];
  runId: string;
  promoted: boolean;
  promotionRequest?: PromotionRequest;
  pipelineOrigin?: PipelineOrigin;
}

interface Experiment {
  id: string;
  name: string;
  runId: string;
  model: string;
  status: ExperimentStatus;
  duration: string;
  metrics: ModelMetrics;
  params: Record<string, string>;
  owner: string;
  createdAt: string;
  tags: string[];
  dagRunId: string;
  isBestRun: boolean;
  tuned: boolean;
}

interface MetricEntry {
  label: string;
  value: number;
}

interface ComparisonCell {
  value: number;
  display: string;
  isBest: boolean;
}

interface ComparisonRow {
  label: string;
  lowerIsBetter: boolean;
  cells: Array<ComparisonCell | null>;
}

interface ParamDiffRow {
  key: string;
  values: string[];
  differs: boolean;
}

const METRIC_DEFS: Array<{ key: MetricKey; label: string; lowerIsBetter: boolean }> = [
  { key: 'accuracy', label: 'Accuracy', lowerIsBetter: false },
  { key: 'f1Score', label: 'F1 Score', lowerIsBetter: false },
  { key: 'precision', label: 'Precision', lowerIsBetter: false },
  { key: 'recall', label: 'Recall', lowerIsBetter: false },
  { key: 'auc', label: 'AUC', lowerIsBetter: false },
  { key: 'rmse', label: 'RMSE', lowerIsBetter: true },
  { key: 'mae', label: 'MAE', lowerIsBetter: true }
];

const STAGE_ORDER: Stage[] = ['Development', 'Staging', 'Production', 'Archived'];
const CURRENT_USER = 'alice';

const SIGNATURE_META = { schemaVersion: '1.0', serialization: 'mlflow.pyfunc', pythonVersion: '3.10.12' };

const MODEL_SIGNATURES: Record<string, ModelSignature> = {
  'fraud-detection-v2': {
    ...SIGNATURE_META,
    inputs: [
      { name: 'transaction_amount', dataType: 'float64', shape: '(1,)', required: true, description: 'Transaction value in USD', example: 249.99 },
      { name: 'customer_age', dataType: 'int32', shape: '(1,)', required: true, description: 'Customer age in years', example: 34 },
      { name: 'merchant_category', dataType: 'string', shape: '(1,)', required: true, description: 'MCC code', example: '5411' },
      { name: 'transaction_hour', dataType: 'int32', shape: '(1,)', required: true, description: 'Hour of transaction (0-23)', example: 14 },
      { name: 'card_present', dataType: 'boolean', shape: '(1,)', required: true, description: 'Physical card used', example: true },
      { name: 'previous_fraud_count', dataType: 'int32', shape: '(1,)', required: true, description: 'Historical fraud count', example: 0 },
      { name: 'account_balance', dataType: 'float64', shape: '(1,)', required: false, description: 'Optional balance info', example: 5234.10 }
    ],
    outputs: [
      { name: 'is_fraud', dataType: 'boolean', shape: '(1,)', required: true, description: 'Fraud prediction', example: false },
      { name: 'fraud_probability', dataType: 'float64', shape: '(1,)', required: true, description: 'Confidence score 0-1', example: 0.023 },
      { name: 'risk_score', dataType: 'float64', shape: '(1,)', required: true, description: 'Risk score 0-100', example: 12.4 }
    ]
  },
  'customer-churn-predictor': {
    ...SIGNATURE_META,
    inputs: [
      { name: 'customer_id', dataType: 'string', shape: '(1,)', required: true, description: 'Unique customer ID', example: 'cust_88213' },
      { name: 'tenure_months', dataType: 'int32', shape: '(1,)', required: true, description: 'Months as customer', example: 18 },
      { name: 'monthly_charges', dataType: 'float64', shape: '(1,)', required: true, description: 'Monthly bill amount', example: 74.50 },
      { name: 'total_charges', dataType: 'float64', shape: '(1,)', required: true, description: 'Total billed amount', example: 1341.00 },
      { name: 'contract_type', dataType: 'string', shape: '(1,)', required: true, description: 'Monthly/One year/Two year', example: 'One year' },
      { name: 'internet_service', dataType: 'string', shape: '(1,)', required: true, description: 'DSL/Fiber/No', example: 'Fiber' },
      { name: 'num_products', dataType: 'int32', shape: '(1,)', required: true, description: 'Number of services used', example: 3 }
    ],
    outputs: [
      { name: 'will_churn', dataType: 'boolean', shape: '(1,)', required: true, description: 'Churn prediction', example: false },
      { name: 'churn_probability', dataType: 'float64', shape: '(1,)', required: true, description: 'Probability 0-1', example: 0.17 },
      { name: 'retention_score', dataType: 'float64', shape: '(1,)', required: true, description: 'Retention likelihood 0-100', example: 82.5 }
    ]
  },
  'image-classifier-v2': {
    ...SIGNATURE_META,
    inputs: [
      { name: 'image', dataType: 'float32', shape: '(1, 3, 224, 224)', required: true, description: 'Normalized RGB image tensor', example: '<float32[1,3,224,224]>' },
      { name: 'image_id', dataType: 'string', shape: '(1,)', required: false, description: 'Optional image identifier', example: 'img_00918' }
    ],
    outputs: [
      { name: 'predicted_class', dataType: 'string', shape: '(1,)', required: true, description: 'Top predicted category', example: 'golden_retriever' },
      { name: 'class_probabilities', dataType: 'float32', shape: '(1, 1000)', required: true, description: 'Softmax scores per class', example: '<float32[1,1000]>' },
      { name: 'confidence', dataType: 'float64', shape: '(1,)', required: true, description: 'Top-1 confidence score', example: 0.961 }
    ]
  },
  'recommendation-engine': {
    ...SIGNATURE_META,
    inputs: [
      { name: 'user_id', dataType: 'string', shape: '(1,)', required: true, description: 'User identifier', example: 'user_4471' },
      { name: 'item_ids', dataType: 'int32', shape: '(1, N)', required: true, description: 'Candidate item IDs', example: '<int32[1,N]>' },
      { name: 'user_history', dataType: 'int32', shape: '(1, 50)', required: true, description: 'Last 50 interacted items', example: '<int32[1,50]>' },
      { name: 'context_features', dataType: 'float32', shape: '(1, 12)', required: false, description: 'Optional context', example: '<float32[1,12]>' }
    ],
    outputs: [
      { name: 'recommended_items', dataType: 'int32', shape: '(1, 10)', required: true, description: 'Top 10 item IDs', example: '<int32[1,10]>' },
      { name: 'scores', dataType: 'float32', shape: '(1, 10)', required: true, description: 'Relevance scores', example: '<float32[1,10]>' },
      { name: 'explanation', dataType: 'string', shape: '(1,)', required: true, description: 'Human-readable reason', example: 'Frequently bought with items in your cart' }
    ]
  },
  'sentiment-analyzer': {
    ...SIGNATURE_META,
    inputs: [
      { name: 'text', dataType: 'string', shape: '(1,)', required: true, description: 'Raw review text', example: 'This product exceeded my expectations, highly recommend!' },
      { name: 'language', dataType: 'string', shape: '(1,)', required: false, description: 'ISO language code (default: en)', example: 'en' },
      { name: 'max_length', dataType: 'int32', shape: '(1,)', required: false, description: 'Max tokens (default: 512)', example: 512 }
    ],
    outputs: [
      { name: 'sentiment', dataType: 'string', shape: '(1,)', required: true, description: 'positive/negative/neutral', example: 'positive' },
      { name: 'score', dataType: 'float64', shape: '(1,)', required: true, description: 'Sentiment score -1 to 1', example: 0.87 },
      { name: 'confidence', dataType: 'float64', shape: '(1,)', required: true, description: 'Model confidence 0-1', example: 0.95 }
    ]
  },
  'anomaly-detector': {
    ...SIGNATURE_META,
    inputs: [
      { name: 'sensor_readings', dataType: 'float32', shape: '(1, 8)', required: true, description: '8 sensor values', example: '<float32[1,8]>' },
      { name: 'timestamp', dataType: 'int64', shape: '(1,)', required: true, description: 'Unix timestamp', example: 1717430400 },
      { name: 'device_id', dataType: 'string', shape: '(1,)', required: true, description: 'Device identifier', example: 'device_1187' },
      { name: 'window_size', dataType: 'int32', shape: '(1,)', required: false, description: 'Rolling window (default: 60)', example: 60 }
    ],
    outputs: [
      { name: 'is_anomaly', dataType: 'boolean', shape: '(1,)', required: true, description: 'Anomaly detected', example: true },
      { name: 'anomaly_score', dataType: 'float64', shape: '(1,)', required: true, description: 'Score 0-1', example: 0.83 },
      { name: 'affected_sensors', dataType: 'string', shape: '(1,)', required: true, description: 'Comma-separated sensor IDs', example: 'sensor_3,sensor_7' }
    ]
  },
  'churn-features-model': {
    ...SIGNATURE_META,
    inputs: [
      { name: 'customer_id', dataType: 'string', shape: '(1,)', required: true, description: 'Unique customer ID', example: 'cust_20938' },
      { name: 'tenure_months', dataType: 'int32', shape: '(1,)', required: true, description: 'Months as customer', example: 24 },
      { name: 'monthly_charges', dataType: 'float64', shape: '(1,)', required: true, description: 'Monthly bill amount', example: 68.20 },
      { name: 'contract_type', dataType: 'string', shape: '(1,)', required: true, description: 'Monthly/One year/Two year', example: 'Month-to-month' },
      { name: 'payment_method', dataType: 'string', shape: '(1,)', required: true, description: 'Billing payment method', example: 'Electronic check' },
      { name: 'support_tickets', dataType: 'int32', shape: '(1,)', required: true, description: 'Open support ticket count', example: 2 },
      { name: 'num_products', dataType: 'int32', shape: '(1,)', required: false, description: 'Number of services used', example: 4 }
    ],
    outputs: [
      { name: 'feature_importances', dataType: 'float32', shape: '(1, 7)', required: true, description: 'Importance score per input feature', example: '<float32[1,7]>' },
      { name: 'top_feature', dataType: 'string', shape: '(1,)', required: true, description: 'Highest-importance feature name', example: 'contract_type' },
      { name: 'importance_sum', dataType: 'float64', shape: '(1,)', required: true, description: 'Sum of importance scores', example: 1.0 }
    ]
  },
  'fraud-detection-v3': {
    ...SIGNATURE_META,
    inputs: [
      { name: 'transaction_amount', dataType: 'float64', shape: '(1,)', required: true, description: 'Transaction value in USD', example: 512.40 },
      { name: 'customer_age', dataType: 'int32', shape: '(1,)', required: true, description: 'Customer age in years', example: 41 },
      { name: 'merchant_category', dataType: 'string', shape: '(1,)', required: true, description: 'MCC code', example: '7995' },
      { name: 'transaction_hour', dataType: 'int32', shape: '(1,)', required: true, description: 'Hour of transaction (0-23)', example: 2 },
      { name: 'card_present', dataType: 'boolean', shape: '(1,)', required: true, description: 'Physical card used', example: false },
      { name: 'previous_fraud_count', dataType: 'int32', shape: '(1,)', required: true, description: 'Historical fraud count', example: 1 },
      { name: 'device_fingerprint_score', dataType: 'float32', shape: '(1,)', required: true, description: 'Device trust score 0-1', example: 0.72 },
      { name: 'ip_risk_score', dataType: 'float32', shape: '(1,)', required: false, description: 'Optional IP reputation risk score', example: 0.35 }
    ],
    outputs: [
      { name: 'is_fraud', dataType: 'boolean', shape: '(1,)', required: true, description: 'Fraud prediction', example: true },
      { name: 'fraud_probability', dataType: 'float64', shape: '(1,)', required: true, description: 'Confidence score 0-1', example: 0.812 },
      { name: 'risk_score', dataType: 'float64', shape: '(1,)', required: true, description: 'Risk score 0-100', example: 87.3 }
    ]
  }
};

const DEPLOYMENT_INFO: Record<string, DeploymentInfo> = {
  'fraud-detection-v2': {
    readyReplicas: 3, totalReplicas: 3, lastDeploy: '2h ago',
    endpoint: 'https://api.nexusml.io/v1/fraud-detection-v2/predict', avgLatency: 124, requestsPerMin: 1847
  },
  'image-classifier-v2': {
    readyReplicas: 2, totalReplicas: 2, lastDeploy: '4d ago',
    endpoint: 'https://api.nexusml.io/v1/image-classifier-v2/predict', avgLatency: 210, requestsPerMin: 640
  }
};

@Component({
  selector: 'app-models-management',
  templateUrl: './models-management.component.html',
  styleUrl: './models-management.component.scss'
})
export class ModelsManagementComponent {
  models: MlModel[] = [
    {
      id: 'fraud-detection-v2', name: 'fraud-detection-v2', description: 'Fraud detection classifier',
      framework: 'PyTorch', stage: 'Production', version: 'v2.1',
      metrics: { accuracy: 0.967, f1Score: 0.954, precision: 0.961, recall: 0.948, auc: 0.991 },
      dataset: 'fraud_labels.csv', pipeline: 'fraud-detection-pipeline', owner: 'alice',
      createdAt: '9d ago', lastUpdated: '2h ago', tags: ['finance', 'classification'],
      runId: 'run_a1b2c3', promoted: true,
      pipelineOrigin: {
        dagRunId: 'run_20260109_0142', triggeredBy: 'alice', tasksCompleted: 11, tasksTotal: 11,
        tuned: true, tuningTrials: 20, driftDetected: false
      }
    },
    {
      id: 'customer-churn-predictor', name: 'customer-churn-predictor', description: 'Customer churn prediction',
      framework: 'scikit-learn', stage: 'Staging', version: 'v1.3',
      metrics: { accuracy: 0.891, f1Score: 0.876, precision: 0.883, recall: 0.869, auc: 0.934 },
      dataset: 'customer_profiles.parquet', pipeline: 'customer-churn-model', owner: 'bob',
      createdAt: '5d ago', lastUpdated: '1d ago', tags: ['crm', 'classification'],
      runId: 'run_b2c3d4', promoted: false,
      promotionRequest: {
        id: 'pr-customer-churn-predictor-1', requestedBy: 'bob', requestedAt: '2h ago',
        fromStage: 'Staging', toStage: 'Production', status: 'pending',
        comment: 'Model has passed all staging tests. Ready for production.'
      },
      pipelineOrigin: {
        dagRunId: 'run_20260108_0915', triggeredBy: 'bob', tasksCompleted: 11, tasksTotal: 11,
        tuned: true, tuningTrials: 5, driftDetected: false
      }
    },
    {
      id: 'image-classifier-v2', name: 'image-classifier-v2', description: 'Product image classification',
      framework: 'PyTorch', stage: 'Production', version: 'v2.0',
      metrics: { accuracy: 0.923, f1Score: 0.918, precision: 0.925, recall: 0.911, auc: 0.978 },
      dataset: 'image_metadata.excel', pipeline: 'image-classifier-v2', owner: 'alice',
      createdAt: '12d ago', lastUpdated: '4d ago', tags: ['vision', 'classification'],
      runId: 'run_c3d4e5', promoted: true,
      pipelineOrigin: {
        dagRunId: 'run_20251228_0310', triggeredBy: 'alice', tasksCompleted: 11, tasksTotal: 11,
        tuned: false, driftDetected: false
      }
    },
    {
      id: 'sentiment-analyzer', name: 'sentiment-analyzer', description: 'NLP sentiment analysis',
      framework: 'scikit-learn', stage: 'Development', version: 'v0.4',
      metrics: { accuracy: 0.812, f1Score: 0.798, precision: 0.821, recall: 0.776, auc: 0.867 },
      dataset: 'product_reviews.json', pipeline: 'nlp-sentiment-analysis', owner: 'carol',
      createdAt: '2d ago', lastUpdated: '23m ago', tags: ['nlp', 'classification'],
      runId: 'run_d4e5f6', promoted: false,
      pipelineOrigin: {
        dagRunId: 'run_20260109_0207', triggeredBy: 'carol', tasksCompleted: 6, tasksTotal: 11,
        tuned: false, driftDetected: false
      }
    },
    {
      id: 'recommendation-engine', name: 'recommendation-engine', description: 'Product recommendation system',
      framework: 'TensorFlow', stage: 'Staging', version: 'v1.1',
      metrics: { rmse: 0.043, mae: 0.031 },
      dataset: 'transactions_2025.csv', pipeline: 'recommendation-engine', owner: 'bob',
      createdAt: '6d ago', lastUpdated: '2d ago', tags: ['recsys', 'regression'],
      runId: 'run_e5f6g7', promoted: false,
      pipelineOrigin: {
        dagRunId: 'run_20260107_1830', triggeredBy: 'bob', tasksCompleted: 11, tasksTotal: 11,
        tuned: false, driftDetected: true
      }
    },
    {
      id: 'anomaly-detector', name: 'anomaly-detector', description: 'IoT anomaly detection',
      framework: 'XGBoost', stage: 'Development', version: 'v0.2',
      metrics: { accuracy: 0.934, f1Score: 0.921, auc: 0.956 },
      dataset: 'sensor_readings.csv', pipeline: 'anomaly-detection', owner: 'alice',
      createdAt: '4d ago', lastUpdated: '3d ago', tags: ['iot', 'classification'],
      runId: 'run_f6g7h8', promoted: false,
      pipelineOrigin: {
        dagRunId: 'run_20260105_0921', triggeredBy: 'alice', tasksCompleted: 11, tasksTotal: 11,
        tuned: false, driftDetected: false
      }
    },
    {
      id: 'churn-features-model', name: 'churn-features-model', description: 'Feature importance model',
      framework: 'XGBoost', stage: 'Archived', version: 'v1.0',
      metrics: { accuracy: 0.856, f1Score: 0.841, auc: 0.901 },
      dataset: 'churn_features.parquet', pipeline: 'feature-engineering-v3', owner: 'carol',
      createdAt: '30d ago', lastUpdated: '20d ago', tags: ['crm'],
      runId: 'run_g7h8i9', promoted: false,
      pipelineOrigin: {
        dagRunId: 'run_20251210_1104', triggeredBy: 'carol', tasksCompleted: 11, tasksTotal: 11,
        tuned: false, driftDetected: false
      }
    },
    {
      id: 'fraud-detection-v3', name: 'fraud-detection-v3', description: 'Next gen fraud detector',
      framework: 'PyTorch', stage: 'Development', version: 'v0.1',
      metrics: { accuracy: 0.941, f1Score: 0.928, auc: 0.972 },
      dataset: 'fraud_labels.csv', pipeline: 'model-retraining-job', owner: 'alice',
      createdAt: '1d ago', lastUpdated: '1d ago', tags: ['finance', 'classification'],
      runId: 'run_h8i9j0', promoted: false,
      pipelineOrigin: {
        dagRunId: 'run_20260108_0602', triggeredBy: 'alice', tasksCompleted: 8, tasksTotal: 11,
        tuned: false, driftDetected: false
      }
    }
  ];

  experiments: Experiment[] = [
    {
      id: 'fraud-detection-exp-142', name: 'talys/fraud_detection/pytorch_run', runId: 'run_a1b2c3', model: 'fraud-detection-v2',
      status: 'finished', duration: '2h 14m', metrics: { accuracy: 0.967, f1Score: 0.954 },
      params: { lr: '0.001', epochs: '50', batch: '32' }, owner: 'alice', createdAt: '2h ago', tags: ['finance'],
      dagRunId: 'run_20260109_0142', isBestRun: true, tuned: true
    },
    {
      id: 'fraud-detection-exp-141', name: 'talys/fraud_detection/xgboost_run', runId: 'run_z9y8x7', model: 'fraud-detection-v2',
      status: 'finished', duration: '1h 58m', metrics: { accuracy: 0.951, f1Score: 0.938 },
      params: { lr: '0.001', epochs: '40', batch: '64' }, owner: 'alice', createdAt: '5h ago', tags: ['finance'],
      dagRunId: 'run_20260108_0915', isBestRun: false, tuned: false
    },
    {
      id: 'churn-exp-089', name: 'talys/churn_prediction/sklearn_run', runId: 'run_b2c3d4', model: 'customer-churn-predictor',
      status: 'finished', duration: '45m', metrics: { accuracy: 0.891, f1Score: 0.876 },
      params: { n_estimators: '200', max_depth: '6' }, owner: 'bob', createdAt: '1d ago', tags: ['crm'],
      dagRunId: 'run_20260108_0915', isBestRun: true, tuned: true
    },
    {
      id: 'sentiment-exp-034', name: 'talys/sentiment_analysis/sklearn_run', runId: 'run_d4e5f6', model: 'sentiment-analyzer',
      status: 'running', duration: '23m (ongoing)', metrics: { accuracy: 0.812 },
      params: { lr: '0.0001', epochs: '100', batch: '16' }, owner: 'carol', createdAt: '23m ago', tags: ['nlp'],
      dagRunId: 'run_20260109_0207', isBestRun: false, tuned: false
    },
    {
      id: 'recsys-exp-021', name: 'talys/recommendation/tensorflow_run', runId: 'run_e5f6g7', model: 'recommendation-engine',
      status: 'finished', duration: '3h 42m', metrics: { rmse: 0.043, mae: 0.031 },
      params: { embedding_dim: '64', layers: '3' }, owner: 'bob', createdAt: '2d ago', tags: ['recsys'],
      dagRunId: 'run_20260107_1830', isBestRun: false, tuned: false
    },
    {
      id: 'anomaly-exp-015', name: 'talys/anomaly_detection/xgboost_run', runId: 'run_f6g7h8', model: 'anomaly-detector',
      status: 'finished', duration: '18m', metrics: { accuracy: 0.934, f1Score: 0.921 },
      params: { n_estimators: '100', lr: '0.1' }, owner: 'alice', createdAt: '3d ago', tags: ['iot'],
      dagRunId: 'run_20260105_0921', isBestRun: false, tuned: false
    },
    {
      id: 'fraud-v3-exp-003', name: 'talys/fraud_detection_v3/pytorch_run', runId: 'run_h8i9j0', model: 'fraud-detection-v3',
      status: 'failed', duration: '4m', metrics: {},
      params: { lr: '0.01', epochs: '50' }, owner: 'alice', createdAt: '1d ago', tags: ['finance'],
      dagRunId: 'run_20260108_0602', isBestRun: false, tuned: false
    },
    {
      id: 'image-exp-056', name: 'talys/image_classification/pytorch_run', runId: 'run_c3d4e5', model: 'image-classifier-v2',
      status: 'finished', duration: '5h 12m', metrics: { accuracy: 0.923, f1Score: 0.918 },
      params: { lr: '0.0001', epochs: '30', batch: '8' }, owner: 'alice', createdAt: '4d ago', tags: ['vision'],
      dagRunId: 'run_20251228_0310', isBestRun: false, tuned: false
    }
  ];


  activeTab: ActiveTab = 'registry';

  searchTerm = '';
  stageFilter: StageFilter = 'all';
  frameworkFilter: FrameworkFilter = 'all';

  selectedModel: MlModel | null = null;
  highlightedModelId: string | null = null;

  promotionComment = '';
  submittingPromotion = false;
  approvingPromotion = false;
  showRejectForm = false;
  rejectReason = '';

  metricBarsAnimated = false;
  examplePayloadOpen = false;
  testEndpointOpen = false;
  testRequestBody = '';
  testRequestSending = false;
  testResponse: TestEndpointResponse | null = null;

  selectedExperimentIds = new Set<string>();
  expandedExperimentId: string | null = null;
  showComparison = false;

  private panelCleanups: Array<() => void> = [];

  constructor(private readonly toastService: ToastService) {}

  get filteredModels(): MlModel[] {
    const term = this.searchTerm.trim().toLowerCase();
    return this.models.filter(model => {
      const matchesSearch = !term
        || model.name.toLowerCase().includes(term)
        || model.description.toLowerCase().includes(term)
        || model.tags.some(tag => tag.toLowerCase().includes(term));
      const matchesStage = this.stageFilter === 'all' || model.stage === this.stageFilter;
      const matchesFramework = this.frameworkFilter === 'all' || model.framework === this.frameworkFilter;
      return matchesSearch && matchesStage && matchesFramework;
    });
  }

  get pendingModels(): MlModel[] {
    return this.models.filter(model => model.promotionRequest?.status === 'pending');
  }

  get totalModels(): number {
    return this.models.length;
  }

  get inProductionCount(): number {
    return this.models.filter(model => model.stage === 'Production').length;
  }

  get pendingApprovalCount(): number {
    return this.pendingModels.length;
  }

  get experimentsCount(): number {
    return this.experiments.length;
  }

  get lastPipelineRunLabel(): string {
    return '2h ago';
  }

  get promotionPanelState(): PromotionPanelState {
    const model = this.selectedModel;
    if (!model) {
      return 'terminal';
    }
    if (model.promotionRequest?.status === 'pending') {
      return 'pending';
    }
    if (model.stage === 'Production') {
      return 'production';
    }
    return this.nextStage(model.stage) ? 'requestable' : 'terminal';
  }

  get selectedModelNextStage(): Stage | null {
    return this.selectedModel ? this.nextStage(this.selectedModel.stage) : null;
  }

  get selectedModelImage(): string {
    if (!this.selectedModel) {
      return '';
    }
    const base = this.selectedModel.id.replace(/-v\d+(\.\d+)?$/i, '');
    return `nexusml/${base}:${this.selectedModel.version}`;
  }

  setTab(tab: ActiveTab): void {
    this.activeTab = tab;
  }

  initials(owner: string): string {
    return owner.slice(0, 2).toUpperCase();
  }

  frameworkBadgeClass(framework: Framework): string {
    const map: Record<Framework, string> = {
      'PyTorch': 'framework-badge--pytorch',
      'scikit-learn': 'framework-badge--sklearn',
      'TensorFlow': 'framework-badge--tensorflow',
      'XGBoost': 'framework-badge--xgboost'
    };
    return map[framework];
  }

  stageBadgeClass(stage: Stage): string {
    return 'stage-badge--' + stage.toLowerCase();
  }

  metricsList(metrics: ModelMetrics): MetricEntry[] {
    return METRIC_DEFS
      .filter(def => metrics[def.key] !== undefined)
      .map(def => ({ label: def.label, value: metrics[def.key] as number }));
  }

  topMetrics(model: MlModel): MetricEntry[] {
    const m = model.metrics;
    const preferred = METRIC_DEFS.filter(def => ['accuracy', 'f1Score', 'auc'].includes(def.key) && m[def.key] !== undefined);
    if (preferred.length) {
      return preferred.map(def => ({ label: def.key === 'f1Score' ? 'F1' : def.label, value: m[def.key] as number }));
    }
    return METRIC_DEFS
      .filter(def => (def.key === 'rmse' || def.key === 'mae') && m[def.key] !== undefined)
      .map(def => ({ label: def.label, value: m[def.key] as number }));
  }

  formatMetricValue(label: string, value: number): string {
    if (label === 'RMSE' || label === 'MAE') {
      return value.toFixed(3);
    }
    return `${(value * 100).toFixed(1)}%`;
  }

  barWidth(label: string, value: number): number {
    return Math.min(100, Math.max(0, value * 100));
  }

  primaryMetricEntry(model: MlModel): MetricEntry | null {
    const top = this.topMetrics(model);
    return top.length ? top[0] : null;
  }

  hasRunningExperiment(model: MlModel): boolean {
    return this.experiments.some(exp => exp.model === model.name && exp.status === 'running');
  }

  pipelineOriginOf(model: MlModel): PipelineOrigin | undefined {
    return model.pipelineOrigin;
  }

  mlflowRawDataFile(exp: Experiment): string {
    return this.models.find(model => model.name === exp.model)?.dataset ?? 'transactions.csv';
  }

  viewInAirflow(exp: Experiment, event?: Event): void {
    event?.stopPropagation();
  }

  signatureOf(model: MlModel): ModelSignature | undefined {
    return MODEL_SIGNATURES[model.id];
  }

  requiredCount(fields: SignatureField[]): number {
    return fields.filter(field => field.required).length;
  }

  deploymentInfoOf(model: MlModel): DeploymentInfo | undefined {
    return DEPLOYMENT_INFO[model.id];
  }

  replicaDots(deploy: DeploymentInfo): number[] {
    return Array(deploy.totalReplicas).fill(0);
  }

  toggleExamplePayload(): void {
    this.examplePayloadOpen = !this.examplePayloadOpen;
  }

  inputExampleObject(model: MlModel): Record<string, unknown> {
    const sig = this.signatureOf(model);
    return sig ? this.exampleObject(sig.inputs) : {};
  }

  outputExampleObject(model: MlModel): Record<string, unknown> {
    const sig = this.signatureOf(model);
    return sig ? this.exampleObject(sig.outputs) : {};
  }

  highlightedInputExample(model: MlModel): string {
    return this.highlightJson(this.inputExampleObject(model));
  }

  highlightedOutputExample(model: MlModel): string {
    return this.highlightJson(this.outputExampleObject(model));
  }

  copyExamplePayload(model: MlModel): void {
    const text = `// Input\n${JSON.stringify(this.inputExampleObject(model), null, 2)}\n\n// Output\n${JSON.stringify(this.outputExampleObject(model), null, 2)}`;
    navigator.clipboard?.writeText(text).then(
      () => this.toastService.show('Example payload copied to clipboard ✓', 'success'),
      () => this.toastService.show('Could not copy payload', 'error')
    );
  }

  copyEndpoint(deploy: DeploymentInfo): void {
    navigator.clipboard?.writeText(deploy.endpoint).then(
      () => this.toastService.show('Endpoint copied to clipboard ✓', 'success'),
      () => this.toastService.show('Could not copy endpoint', 'error')
    );
  }

  toggleTestEndpoint(model: MlModel): void {
    this.testEndpointOpen = !this.testEndpointOpen;
    if (this.testEndpointOpen && !this.testRequestBody) {
      this.testRequestBody = JSON.stringify(this.inputExampleObject(model), null, 2);
    }
  }

  sendTestRequest(model: MlModel): void {
    if (this.testRequestSending) {
      return;
    }
    this.testRequestSending = true;
    const timeout = setTimeout(() => {
      const deploy = this.deploymentInfoOf(model);
      this.testResponse = {
        status: '200 OK',
        latency: deploy?.avgLatency ?? 89,
        body: this.highlightJson(this.outputExampleObject(model))
      };
      this.testRequestSending = false;
    }, 600);
    this.panelCleanups.push(() => clearTimeout(timeout));
  }

  clearTestEndpoint(model: MlModel): void {
    this.testResponse = null;
    this.testRequestBody = JSON.stringify(this.inputExampleObject(model), null, 2);
  }

  stageState(model: MlModel, stage: Stage): 'completed' | 'current' | 'future' {
    const currentIdx = STAGE_ORDER.indexOf(model.stage);
    const stageIdx = STAGE_ORDER.indexOf(stage);
    if (stageIdx < currentIdx) {
      return 'completed';
    }
    if (stageIdx === currentIdx) {
      return 'current';
    }
    return 'future';
  }

  stagesForLifecycle(): Stage[] {
    return STAGE_ORDER;
  }

  reviewNow(model: MlModel, event?: Event): void {
    event?.stopPropagation();
    this.highlightedModelId = model.id;
    document.getElementById('model-row-' + model.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => this.openDetail(model), 400);
    setTimeout(() => {
      this.highlightedModelId = null;
    }, 2000);
  }

  openDetail(model: MlModel): void {
    this.selectedModel = model;
    this.resetPromotionPanel();
    this.resetDetailExtras();
    this.metricBarsAnimated = false;
    const timeout = setTimeout(() => {
      this.metricBarsAnimated = true;
    }, 30);
    this.panelCleanups.push(() => clearTimeout(timeout));
  }

  closeDetail(): void {
    this.selectedModel = null;
    this.resetPromotionPanel();
    this.resetDetailExtras();
  }

  downloadModel(model: MlModel, event?: Event): void {
    event?.stopPropagation();
  }

  viewInMlflow(model: MlModel, event?: Event): void {
    event?.stopPropagation();
  }

  archiveModel(model: MlModel, event?: Event): void {
    event?.stopPropagation();
    if (model.stage === 'Archived') {
      return;
    }
    model.stage = 'Archived';
    model.promoted = false;
    model.promotionRequest = undefined;
    this.toastService.show(`${model.name} archived`, 'success');
  }

  submitPromotionRequest(model: MlModel): void {
    const next = this.nextStage(model.stage);
    if (!next || this.submittingPromotion) {
      return;
    }

    this.submittingPromotion = true;
    const timeout = setTimeout(() => {
      model.promotionRequest = {
        id: `pr-${model.id}-${Date.now()}`,
        requestedBy: CURRENT_USER,
        requestedAt: 'just now',
        fromStage: model.stage,
        toStage: next,
        status: 'pending',
        comment: this.promotionComment.trim()
      };
      this.submittingPromotion = false;
      this.promotionComment = '';
      this.toastService.show('Promotion request submitted for review', 'success');
    }, 600);
    this.panelCleanups.push(() => clearTimeout(timeout));
  }

  approvePromotion(model: MlModel): void {
    if (!model.promotionRequest || this.approvingPromotion) {
      return;
    }

    this.approvingPromotion = true;
    const toStage = model.promotionRequest.toStage as Stage;
    const timeout = setTimeout(() => {
      model.stage = toStage;
      model.promoted = toStage === 'Production';
      model.promotionRequest = undefined;
      this.approvingPromotion = false;
      this.toastService.show(`Model promoted to ${toStage} successfully`, 'success');
    }, 1000);
    this.panelCleanups.push(() => clearTimeout(timeout));
  }

  startReject(): void {
    this.showRejectForm = true;
  }

  cancelReject(): void {
    this.showRejectForm = false;
    this.rejectReason = '';
  }

  confirmRejection(model: MlModel): void {
    if (!model.promotionRequest) {
      return;
    }
    model.promotionRequest = undefined;
    this.showRejectForm = false;
    this.rejectReason = '';
    this.toastService.show('Promotion request rejected', 'error');
  }

  rollbackToStaging(model: MlModel): void {
    if (model.stage !== 'Production') {
      return;
    }
    model.stage = 'Staging';
    model.promoted = false;
    this.toastService.show(`${model.name} rolled back to Staging`, 'success');
  }

  isSelected(exp: Experiment): boolean {
    return this.selectedExperimentIds.has(exp.id);
  }

  toggleExperimentSelection(exp: Experiment, event?: Event): void {
    event?.stopPropagation();
    if (this.selectedExperimentIds.has(exp.id)) {
      this.selectedExperimentIds.delete(exp.id);
    } else {
      this.selectedExperimentIds.add(exp.id);
    }
    if (this.selectedExperimentIds.size < 2) {
      this.showComparison = false;
    }
  }

  toggleExpand(exp: Experiment, event?: Event): void {
    event?.stopPropagation();
    this.expandedExperimentId = this.expandedExperimentId === exp.id ? null : exp.id;
  }

  viewExperiment(exp: Experiment, event?: Event): void {
    event?.stopPropagation();
  }

  archiveExperiment(exp: Experiment, event?: Event): void {
    event?.stopPropagation();
  }

  paramEntries(exp: Experiment): Array<{ key: string; value: string }> {
    return Object.entries(exp.params).map(([key, value]) => ({ key, value }));
  }

  paramsPreview(exp: Experiment): string {
    return Object.entries(exp.params).map(([key, value]) => `${key}=${value}`).join(', ');
  }

  get selectedExperiments(): Experiment[] {
    return this.experiments.filter(exp => this.selectedExperimentIds.has(exp.id));
  }

  get canCompare(): boolean {
    return this.selectedExperimentIds.size >= 2;
  }

  openComparison(): void {
    if (!this.canCompare) {
      return;
    }
    this.showComparison = true;
  }

  clearComparison(): void {
    this.showComparison = false;
    this.selectedExperimentIds.clear();
  }

  get comparisonRows(): ComparisonRow[] {
    const exps = this.selectedExperiments;
    return METRIC_DEFS
      .filter(def => exps.some(exp => exp.metrics[def.key] !== undefined))
      .map(def => {
        const values = exps.map(exp => exp.metrics[def.key]);
        const definedValues = values.filter((v): v is number => v !== undefined);
        const bestValue = definedValues.length
          ? (def.lowerIsBetter ? Math.min(...definedValues) : Math.max(...definedValues))
          : null;

        const cells = values.map(v => {
          if (v === undefined) {
            return null;
          }
          return {
            value: v,
            display: this.formatMetricValue(def.label, v),
            isBest: bestValue !== null && v === bestValue
          };
        });

        return { label: def.label, lowerIsBetter: def.lowerIsBetter, cells };
      });
  }

  get comparisonDifference(): string | null {
    const rows = this.comparisonRows;
    const exps = this.selectedExperiments;
    if (!rows.length || exps.length < 2) {
      return null;
    }

    const primary = rows[0];
    const baselineCell = primary.cells[0];
    const bestIndex = primary.cells.findIndex(cell => cell?.isBest);
    const bestCell = bestIndex >= 0 ? primary.cells[bestIndex] : null;
    if (!baselineCell || !bestCell || bestCell.value === baselineCell.value) {
      return null;
    }

    const delta = bestCell.value - baselineCell.value;
    const magnitude = primary.lowerIsBetter
      ? Math.abs(delta).toFixed(3)
      : `${Math.abs(delta * 100).toFixed(1)}%`;
    const sign = delta >= 0 ? '+' : '-';
    return `${sign}${magnitude} ${primary.label} vs baseline (${exps[0].runId})`;
  }

  get paramDiffRows(): ParamDiffRow[] {
    const exps = this.selectedExperiments;
    const keys = new Set<string>();
    exps.forEach(exp => Object.keys(exp.params).forEach(key => keys.add(key)));

    return Array.from(keys).map(key => {
      const values = exps.map(exp => exp.params[key] ?? '—');
      const differs = new Set(values).size > 1;
      return { key, values, differs };
    });
  }

  registerBestModel(): void {
    this.toastService.show('Best model registered to the Model Registry ✓', 'success');
  }

  private nextStage(stage: Stage): Stage | null {
    const idx = STAGE_ORDER.indexOf(stage);
    if (idx === -1 || idx >= STAGE_ORDER.length - 1) {
      return null;
    }
    return STAGE_ORDER[idx + 1];
  }

  private resetPromotionPanel(): void {
    this.panelCleanups.forEach(cleanup => cleanup());
    this.panelCleanups = [];
    this.promotionComment = '';
    this.submittingPromotion = false;
    this.approvingPromotion = false;
    this.showRejectForm = false;
    this.rejectReason = '';
  }

  private resetDetailExtras(): void {
    this.examplePayloadOpen = false;
    this.testEndpointOpen = false;
    this.testRequestBody = '';
    this.testRequestSending = false;
    this.testResponse = null;
  }

  private exampleObject(fields: SignatureField[]): Record<string, unknown> {
    return Object.fromEntries(fields.map(field => [field.name, field.example]));
  }

  private highlightJson(value: unknown): string {
    const json = JSON.stringify(value, null, 2);
    const escaped = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return escaped
      .replace(/"([^"\n]+)":/g, '<span class="json-key">"$1"</span>:')
      .replace(/: "([^"\n]*)"/g, ': <span class="json-value">"$1"</span>')
      .replace(/: (-?\d+\.?\d*)/g, ': <span class="json-value">$1</span>')
      .replace(/: (true|false)/g, ': <span class="json-value">$1</span>');
  }
}
