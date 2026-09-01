import { Component } from '@angular/core';

import { ToastService } from '../../core/services/toast.service';

export type DatasetFormat = 'CSV' | 'JSON' | 'Parquet' | 'Excel';
export type DatasetStatus = 'ready' | 'processing' | 'failed' | 'uploading';
export type QualityStatus = 'passed' | 'failed' | 'warning' | 'pending';
export type QualityColor = 'success' | 'warning' | 'danger' | 'muted';

type FormatFilter = 'all' | DatasetFormat;
type StatusFilter = 'all' | DatasetStatus;
type QualityFilter = 'all' | QualityStatus;
type CheckState = 'pass' | 'fail' | 'warn' | 'pending';
type UserRole = 'Admin' | 'Data Scientist' | 'Viewer';

interface DatasetVersion {
  version: string;
  commit: string;
  createdAt: string;
  size: string;
  rows: number;
  changedBy: string;
  message: string;
}

interface Dataset {
  id: string;
  name: string;
  description: string;
  size: string;
  rows: number;
  columns: number;
  format: DatasetFormat;
  status: DatasetStatus;
  qualityScore: number;
  qualityStatus: QualityStatus;
  version: string;
  versions: DatasetVersion[];
  owner: string;
  createdAt: string;
  lastModified: string;
  tags: string[];
  dvcTracked: boolean;
}

interface QualityCheck {
  state: CheckState;
  text: string;
}

type DvcChangeType = 'positive' | 'negative' | 'neutral';
type DvcLogKind = 'track' | 'push' | 'pull' | 'compare';

interface DvcTrackState {
  running: boolean;
  done: boolean;
  steps: string[];
}

interface DvcPushState {
  running: boolean;
  done: boolean;
  progress: number;
  commit: string;
}

interface DvcPullState {
  running: boolean;
  done: boolean;
  steps: string[];
}

interface DiffRow {
  metric: string;
  fromValue: string;
  toValue: string;
  change: string;
  changeType: DvcChangeType;
}

interface DvcCompareState {
  running: boolean;
  done: boolean;
  fromVersion: string;
  toVersion: string;
  rows: DiffRow[];
}

const UPLOAD_TICK_MS = 250;
const DVC_TRACK_WARNING = 'Track this dataset first before pushing to remote';

@Component({
  selector: 'app-datasets',
  templateUrl: './datasets.component.html',
  styleUrl: './datasets.component.scss'
})
export class DatasetsComponent {
  datasets: Dataset[] = [
    {
      id: 'transactions-2025', name: 'transactions_2025.csv', description: 'Financial transaction data',
      size: '2.4 GB', rows: 12500000, columns: 28, format: 'CSV', status: 'ready',
      qualityScore: 94, qualityStatus: 'passed', version: 'v3', owner: 'alice',
      createdAt: '3d ago', lastModified: '2h ago', tags: ['finance', 'fraud'], dvcTracked: true,
      versions: [
        { version: 'v3', commit: 'a1b2c3d', createdAt: '2h ago', size: '2.4 GB', rows: 12500000, changedBy: 'alice', message: 'Added Q1 2025 data' },
        { version: 'v2', commit: 'b2c3d4e', createdAt: '1d ago', size: '1.9 GB', rows: 10000000, changedBy: 'alice', message: 'Cleaned duplicates' },
        { version: 'v1', commit: 'c3d4e5f', createdAt: '3d ago', size: '1.5 GB', rows: 8000000, changedBy: 'bob', message: 'Initial upload' }
      ]
    },
    {
      id: 'customer-profiles', name: 'customer_profiles.parquet', description: 'Customer demographic data',
      size: '890 MB', rows: 3200000, columns: 45, format: 'Parquet', status: 'ready',
      qualityScore: 87, qualityStatus: 'warning', version: 'v2', owner: 'bob',
      createdAt: '2d ago', lastModified: '5h ago', tags: ['crm', 'ml'], dvcTracked: true,
      versions: [
        { version: 'v2', commit: 'd4e5f6g', createdAt: '5h ago', size: '890 MB', rows: 3200000, changedBy: 'bob', message: 'Updated demographics' },
        { version: 'v1', commit: 'e5f6g7h', createdAt: '2d ago', size: '830 MB', rows: 3000000, changedBy: 'bob', message: 'Initial upload' }
      ]
    },
    {
      id: 'product-reviews', name: 'product_reviews.json', description: 'E-commerce product reviews',
      size: '340 MB', rows: 890000, columns: 12, format: 'JSON', status: 'ready',
      qualityScore: 72, qualityStatus: 'warning', version: 'v1', owner: 'carol',
      createdAt: '1d ago', lastModified: '1d ago', tags: ['nlp', 'sentiment'], dvcTracked: true,
      versions: [
        { version: 'v1', commit: 'f6g7h8i', createdAt: '1d ago', size: '340 MB', rows: 890000, changedBy: 'carol', message: 'Initial upload' }
      ]
    },
    {
      id: 'sensor-readings', name: 'sensor_readings.csv', description: 'IoT sensor time-series data',
      size: '5.1 GB', rows: 45000000, columns: 8, format: 'CSV', status: 'processing',
      qualityScore: 0, qualityStatus: 'pending', version: 'v1', owner: 'alice',
      createdAt: '10 min ago', lastModified: '10 min ago', tags: ['iot', 'monitoring'], dvcTracked: false,
      versions: [
        { version: 'v1', commit: 'g7h8i9j', createdAt: '10 min ago', size: '5.1 GB', rows: 45000000, changedBy: 'alice', message: 'Uploading...' }
      ]
    },
    {
      id: 'fraud-labels', name: 'fraud_labels.csv', description: 'Labeled fraud dataset',
      size: '120 MB', rows: 500000, columns: 5, format: 'CSV', status: 'ready',
      qualityScore: 98, qualityStatus: 'passed', version: 'v4', owner: 'bob',
      createdAt: '9d ago', lastModified: '3h ago', tags: ['finance', 'fraud', 'ml'], dvcTracked: true,
      versions: [
        { version: 'v4', commit: 'h4i5j6k', createdAt: '3h ago', size: '120 MB', rows: 500000, changedBy: 'bob', message: 'Added new fraud patterns' },
        { version: 'v3', commit: 'i5j6k7l', createdAt: '2d ago', size: '115 MB', rows: 480000, changedBy: 'bob', message: 'Relabeled edge cases' },
        { version: 'v2', commit: 'j6k7l8m', createdAt: '5d ago', size: '108 MB', rows: 450000, changedBy: 'alice', message: 'Balanced class distribution' },
        { version: 'v1', commit: 'k7l8m9n', createdAt: '9d ago', size: '95 MB', rows: 400000, changedBy: 'alice', message: 'Initial upload' }
      ]
    },
    {
      id: 'image-metadata', name: 'image_metadata.excel', description: 'Image classification metadata',
      size: '45 MB', rows: 150000, columns: 22, format: 'Excel', status: 'failed',
      qualityScore: 34, qualityStatus: 'failed', version: 'v1', owner: 'carol',
      createdAt: '3h ago', lastModified: '3h ago', tags: ['vision', 'ml'], dvcTracked: false,
      versions: [
        { version: 'v1', commit: 'i9j0k1l', createdAt: '3h ago', size: '45 MB', rows: 150000, changedBy: 'carol', message: 'Format validation failed' }
      ]
    },
    {
      id: 'churn-features', name: 'churn_features.parquet', description: 'Engineered features for churn model',
      size: '670 MB', rows: 2800000, columns: 67, format: 'Parquet', status: 'ready',
      qualityScore: 91, qualityStatus: 'passed', version: 'v2', owner: 'alice',
      createdAt: '4d ago', lastModified: '6h ago', tags: ['crm', 'ml'], dvcTracked: true,
      versions: [
        { version: 'v2', commit: 'l8m9n0o', createdAt: '6h ago', size: '670 MB', rows: 2800000, changedBy: 'alice', message: 'Added tenure-based features' },
        { version: 'v1', commit: 'm9n0o1p', createdAt: '4d ago', size: '590 MB', rows: 2500000, changedBy: 'alice', message: 'Initial feature set' }
      ]
    },
    {
      id: 'reviews-2025', name: 'reviews_2025.json', description: 'Latest product reviews',
      size: '210 MB', rows: 540000, columns: 15, format: 'JSON', status: 'uploading',
      qualityScore: 0, qualityStatus: 'pending', version: 'v1', owner: 'carol',
      createdAt: 'just now', lastModified: 'just now', tags: ['nlp'], dvcTracked: false,
      versions: [
        { version: 'v1', commit: '—', createdAt: 'just now', size: '210 MB', rows: 0, changedBy: 'carol', message: 'Uploading...' }
      ]
    }
  ];

  currentUserRole: UserRole = 'Admin';

  searchTerm = '';
  formatFilter: FormatFilter = 'all';
  statusFilter: StatusFilter = 'all';
  qualityFilter: QualityFilter = 'all';

  selectedDataset: Dataset | null = null;

  dvcTrack: DvcTrackState = { running: false, done: false, steps: [] };
  dvcPush: DvcPushState = { running: false, done: false, progress: 0, commit: '' };
  dvcPull: DvcPullState = { running: false, done: false, steps: [] };
  dvcCompare: DvcCompareState = { running: false, done: false, fromVersion: '', toVersion: '', rows: [] };
  dvcTrackWarning = DVC_TRACK_WARNING;
  showDvcLogs = false;
  dvcLogTitle = '';
  dvcLogLines: string[] = [];

  private dvcCleanups: Array<() => void> = [];

  showUploadModal = false;
  isDragOver = false;
  selectedFile: File | null = null;
  selectedFileSize = '';
  datasetNameInput = '';
  descriptionInput = '';
  tagsInput = '';
  dvcEnabled = true;
  qualityGateEnabled = true;
  uploading = false;
  uploadComplete = false;
  uploadProgress = 0;

  private uploadTimer?: ReturnType<typeof setInterval>;

  constructor(private readonly toastService: ToastService) {}

  get isAdmin(): boolean {
    return this.currentUserRole === 'Admin';
  }

  get filteredDatasets(): Dataset[] {
    const term = this.searchTerm.trim().toLowerCase();
    return this.datasets.filter(dataset => {
      const matchesSearch = !term
        || dataset.name.toLowerCase().includes(term)
        || dataset.description.toLowerCase().includes(term);
      const matchesFormat = this.formatFilter === 'all' || dataset.format === this.formatFilter;
      const matchesStatus = this.statusFilter === 'all' || dataset.status === this.statusFilter;
      const matchesQuality = this.qualityFilter === 'all' || dataset.qualityStatus === this.qualityFilter;
      return matchesSearch && matchesFormat && matchesStatus && matchesQuality;
    });
  }

  get totalCount(): number {
    return this.datasets.length;
  }

  get totalStorageLabel(): string {
    const totalGb = this.datasets.reduce((sum, dataset) => sum + this.parseSizeToGb(dataset.size), 0);
    return `${totalGb.toFixed(1)} GB`;
  }

  get dvcTrackedCount(): number {
    return this.datasets.filter(dataset => dataset.dvcTracked).length;
  }

  get avgQualityScore(): number {
    const scored = this.datasets.filter(dataset => dataset.qualityScore > 0);
    if (!scored.length) {
      return 0;
    }
    const sum = scored.reduce((total, dataset) => total + dataset.qualityScore, 0);
    return Math.round(sum / scored.length);
  }

  get selectedQualityChecks(): QualityCheck[] {
    return this.selectedDataset ? this.buildQualityChecks(this.selectedDataset) : [];
  }

  get isFileSelected(): boolean {
    return this.selectedFile !== null;
  }

  get dvcLogText(): string {
    return this.dvcLogLines.join('\n');
  }

  formatCount(value: number): string {
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    }
    if (value >= 1_000) {
      return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
    }
    return value.toString();
  }

  initials(owner: string): string {
    return owner.slice(0, 2).toUpperCase();
  }

  formatBadgeClass(format: DatasetFormat): string {
    return 'format-badge--' + format.toLowerCase();
  }

  statusBadgeClass(status: DatasetStatus): string {
    return 'badge--' + status;
  }

  qualityBadgeClass(status: QualityStatus): string {
    return 'quality-badge--' + status;
  }

  qualityColor(score: number): QualityColor {
    if (score === 0) {
      return 'muted';
    }
    if (score >= 90) {
      return 'success';
    }
    if (score >= 70) {
      return 'warning';
    }
    return 'danger';
  }

  checkIcon(state: CheckState): string {
    switch (state) {
      case 'pass': return '✓';
      case 'fail': return '✗';
      case 'warn': return '⚠';
      default: return '⏳';
    }
  }

  isTransient(dataset: Dataset): boolean {
    return dataset.status === 'processing' || dataset.status === 'uploading';
  }

  openDetail(dataset: Dataset): void {
    this.selectedDataset = dataset;
    this.resetDvcOperations(dataset);
  }

  closeDetail(): void {
    this.selectedDataset = null;
    this.resetDvcOperations(null);
  }

  downloadDataset(dataset: Dataset, event?: Event): void {
    event?.stopPropagation();
  }

  createVersion(dataset: Dataset, event?: Event): void {
    event?.stopPropagation();
  }

  runQualityCheck(dataset: Dataset, event?: Event): void {
    event?.stopPropagation();
  }

  deleteDataset(dataset: Dataset, event?: Event): void {
    event?.stopPropagation();
  }

  trackDataset(dataset: Dataset, event?: Event): void {
    event?.stopPropagation();
    if (dataset.dvcTracked || this.dvcTrack.running) {
      return;
    }

    this.runSteps(
      ['Computing file hash...', 'Creating .dvc file...', 'Updating .gitignore...'],
      this.dvcTrack,
      800,
      () => {
        dataset.dvcTracked = true;
        this.setDvcLog('track', dataset);
      }
    );
  }

  pushToRemote(dataset: Dataset, event?: Event): void {
    event?.stopPropagation();
    if (!dataset.dvcTracked || this.dvcPush.running) {
      return;
    }

    this.dvcPush = { running: true, done: false, progress: 0, commit: '' };
    const totalMs = 1200;
    const tickMs = 40;
    const totalTicks = totalMs / tickMs;
    let tick = 0;

    const interval = setInterval(() => {
      tick++;
      this.dvcPush.progress = Math.min(100, Math.round((tick / totalTicks) * 100));
      if (tick >= totalTicks) {
        clearInterval(interval);
        this.dvcPush.running = false;
        this.dvcPush.done = true;
        this.dvcPush.commit = this.randomHash();
        this.setDvcLog('push', dataset);
      }
    }, tickMs);
    this.dvcCleanups.push(() => clearInterval(interval));
  }

  pullLatest(dataset: Dataset, event?: Event): void {
    event?.stopPropagation();
    if (!dataset.dvcTracked || this.dvcPull.running) {
      return;
    }

    const latest = dataset.versions[0];
    this.runSteps(
      ['Checking remote for updates...', `Fetching ${latest.version} (${latest.size})...`, 'Checking out dataset...'],
      this.dvcPull,
      1000,
      () => this.setDvcLog('pull', dataset)
    );
  }

  compareVersions(dataset: Dataset, event?: Event): void {
    event?.stopPropagation();
    if (!dataset.dvcTracked || this.dvcCompare.running) {
      return;
    }

    this.dvcCompare = { ...this.dvcCompare, running: true, done: false, rows: [] };
    const timeout = setTimeout(() => {
      this.dvcCompare.running = false;
      this.dvcCompare.done = true;
      this.dvcCompare.rows = this.buildDiffRows(dataset, this.dvcCompare.fromVersion, this.dvcCompare.toVersion);
      this.setDvcLog('compare', dataset);
    }, 600);
    this.dvcCleanups.push(() => clearTimeout(timeout));
  }

  copyLogs(): void {
    if (!this.dvcLogLines.length) {
      return;
    }
    navigator.clipboard?.writeText(this.dvcLogText).then(
      () => this.toastService.show('Logs copied to clipboard ✓', 'success'),
      () => this.toastService.show('Could not copy logs', 'error')
    );
  }

  openUploadModal(): void {
    this.showUploadModal = true;
  }

  closeUploadModal(): void {
    clearInterval(this.uploadTimer);
    this.showUploadModal = false;
    this.isDragOver = false;
    this.selectedFile = null;
    this.selectedFileSize = '';
    this.datasetNameInput = '';
    this.descriptionInput = '';
    this.tagsInput = '';
    this.dvcEnabled = true;
    this.qualityGateEnabled = true;
    this.uploading = false;
    this.uploadComplete = false;
    this.uploadProgress = 0;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.handleFile(file);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.handleFile(file);
    }
    input.value = '';
  }

  confirmUpload(): void {
    if (!this.selectedFile || !this.uploadComplete) {
      return;
    }

    const name = this.datasetNameInput.trim() || this.selectedFile.name;
    const newDataset: Dataset = {
      id: `upload-${Date.now()}`,
      name,
      description: this.descriptionInput.trim(),
      size: this.selectedFileSize,
      rows: 0,
      columns: 0,
      format: this.detectFormat(this.selectedFile.name),
      status: 'processing',
      qualityScore: 0,
      qualityStatus: 'pending',
      version: 'v1',
      owner: 'alice',
      createdAt: 'just now',
      lastModified: 'just now',
      tags: this.tagsInput.split(',').map(tag => tag.trim()).filter(Boolean),
      dvcTracked: this.dvcEnabled,
      versions: [
        {
          version: 'v1',
          commit: this.randomHash(),
          createdAt: 'just now',
          size: this.selectedFileSize,
          rows: 0,
          changedBy: 'alice',
          message: 'Initial upload'
        }
      ]
    };

    this.datasets = [newDataset, ...this.datasets];
    this.toastService.show(`${name} uploaded and queued for processing ✓`, 'success');
    this.closeUploadModal();
  }

  private handleFile(file: File): void {
    clearInterval(this.uploadTimer);
    this.selectedFile = file;
    this.selectedFileSize = this.formatBytes(file.size);
    this.datasetNameInput = this.stripExtension(file.name);
    this.uploadProgress = 0;
    this.uploadComplete = false;
    this.uploading = true;

    this.uploadTimer = setInterval(() => {
      this.uploadProgress = Math.min(100, this.uploadProgress + Math.floor(Math.random() * 12) + 5);
      if (this.uploadProgress >= 100) {
        this.uploadProgress = 100;
        this.uploading = false;
        this.uploadComplete = true;
        clearInterval(this.uploadTimer);
      }
    }, UPLOAD_TICK_MS);
  }

  private buildQualityChecks(dataset: Dataset): QualityCheck[] {
    switch (dataset.qualityStatus) {
      case 'pending':
        return [
          { state: 'pending', text: 'Schema validation' },
          { state: 'pending', text: 'Duplicate row check' },
          { state: 'pending', text: 'Null value threshold check' },
          { state: 'pending', text: 'Outlier detection' },
          { state: 'pending', text: 'Data type consistency check' }
        ];
      case 'failed':
        return [
          { state: 'pass', text: 'Schema validation passed' },
          { state: 'fail', text: 'Missing required columns' },
          { state: 'warn', text: 'Outliers detected in 3 columns' },
          { state: 'fail', text: 'Data types inconsistent across columns' }
        ];
      case 'warning':
        return [
          { state: 'pass', text: 'Schema validation passed' },
          { state: 'pass', text: 'No duplicate rows detected' },
          { state: 'pass', text: 'Null values within threshold (2.3%)' },
          { state: 'warn', text: 'Outliers detected in 3 columns' },
          { state: 'pass', text: 'Data types consistent' }
        ];
      default:
        return [
          { state: 'pass', text: 'Schema validation passed' },
          { state: 'pass', text: 'No duplicate rows detected' },
          { state: 'pass', text: 'Null values within threshold (0.4%)' },
          { state: 'pass', text: 'No outliers detected' },
          { state: 'pass', text: 'Data types consistent' }
        ];
    }
  }

  private parseSizeToGb(size: string): number {
    const match = size.match(/^([\d.]+)\s*(GB|MB|KB)$/i);
    if (!match) {
      return 0;
    }
    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    if (unit === 'GB') {
      return value;
    }
    if (unit === 'MB') {
      return value / 1000;
    }
    return value / 1_000_000;
  }

  private formatBytes(bytes: number): string {
    if (bytes >= 1e9) {
      return `${(bytes / 1e9).toFixed(1)} GB`;
    }
    if (bytes >= 1e6) {
      return `${(bytes / 1e6).toFixed(1)} MB`;
    }
    if (bytes >= 1e3) {
      return `${(bytes / 1e3).toFixed(1)} KB`;
    }
    return `${bytes} B`;
  }

  private detectFormat(filename: string): DatasetFormat {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'json': return 'JSON';
      case 'parquet': return 'Parquet';
      case 'xlsx':
      case 'xls': return 'Excel';
      default: return 'CSV';
    }
  }

  private stripExtension(filename: string): string {
    const idx = filename.lastIndexOf('.');
    return idx > 0 ? filename.slice(0, idx) : filename;
  }

  private randomHash(): string {
    return Math.random().toString(16).slice(2, 9);
  }

  private resetDvcOperations(dataset: Dataset | null): void {
    this.dvcCleanups.forEach(cleanup => cleanup());
    this.dvcCleanups = [];

    this.dvcTrack = { running: false, done: false, steps: [] };
    this.dvcPush = { running: false, done: false, progress: 0, commit: '' };
    this.dvcPull = { running: false, done: false, steps: [] };

    const versions = dataset?.versions ?? [];
    this.dvcCompare = {
      running: false,
      done: false,
      fromVersion: versions.length ? versions[versions.length - 1].version : '',
      toVersion: versions.length ? versions[0].version : '',
      rows: []
    };

    this.showDvcLogs = false;
    this.dvcLogTitle = '';
    this.dvcLogLines = [];
  }

  private runSteps(
    steps: string[],
    target: { running: boolean; done: boolean; steps: string[] },
    initialDelayMs: number,
    onComplete: () => void
  ): void {
    const STEP_DELAY_MS = 400;
    target.running = true;
    target.done = false;
    target.steps = [];

    const start = setTimeout(() => {
      let index = 0;
      const addNext = () => {
        target.steps = [...target.steps, steps[index]];
        index++;
        if (index < steps.length) {
          const next = setTimeout(addNext, STEP_DELAY_MS);
          this.dvcCleanups.push(() => clearTimeout(next));
        } else {
          target.running = false;
          target.done = true;
          onComplete();
        }
      };
      addNext();
    }, initialDelayMs);
    this.dvcCleanups.push(() => clearTimeout(start));
  }

  private buildDiffRows(dataset: Dataset, fromVersion: string, toVersion: string): DiffRow[] {
    const from = dataset.versions.find(v => v.version === fromVersion) ?? dataset.versions[dataset.versions.length - 1];
    const to = dataset.versions.find(v => v.version === toVersion) ?? dataset.versions[0];

    const rowsDelta = to.rows - from.rows;
    const sizeDeltaGb = this.parseSizeToGb(to.size) - this.parseSizeToGb(from.size);

    return [
      {
        metric: 'Rows',
        fromValue: this.formatCount(from.rows),
        toValue: this.formatCount(to.rows),
        change: this.formatDelta(rowsDelta, value => Math.round(value).toLocaleString()),
        changeType: this.deltaType(rowsDelta)
      },
      {
        metric: 'Size',
        fromValue: from.size,
        toValue: to.size,
        change: this.formatDelta(sizeDeltaGb, value => this.formatGbDelta(value)),
        changeType: this.deltaType(sizeDeltaGb)
      },
      {
        metric: 'Columns',
        fromValue: dataset.columns.toString(),
        toValue: dataset.columns.toString(),
        change: 'No change',
        changeType: 'neutral'
      },
      {
        metric: 'Author',
        fromValue: from.changedBy,
        toValue: to.changedBy,
        change: '—',
        changeType: 'neutral'
      },
      {
        metric: 'Message',
        fromValue: from.message,
        toValue: to.message,
        change: '—',
        changeType: 'neutral'
      }
    ];
  }

  private deltaType(delta: number): DvcChangeType {
    if (delta === 0) {
      return 'neutral';
    }
    return delta > 0 ? 'positive' : 'negative';
  }

  private formatDelta(delta: number, formatMagnitude: (value: number) => string): string {
    if (delta === 0) {
      return 'No change';
    }
    const arrow = delta > 0 ? '↑' : '↓';
    const sign = delta > 0 ? '+' : '-';
    return `${sign}${formatMagnitude(Math.abs(delta))} ${arrow}`;
  }

  private formatGbDelta(deltaGb: number): string {
    if (deltaGb < 1) {
      return `${Math.round(deltaGb * 1000)} MB`;
    }
    return `${deltaGb.toFixed(1)} GB`;
  }

  private setDvcLog(kind: DvcLogKind, dataset: Dataset): void {
    switch (kind) {
      case 'track':
        this.dvcLogTitle = 'dvc add & git commit';
        this.dvcLogLines = [
          `$ dvc add ${dataset.name}`,
          `100% Adding...|████████████████| 1/1 file`,
          `Creating '${dataset.name}.dvc'`,
          `$ git add ${dataset.name}.dvc .gitignore`,
          `$ git commit -m "Track ${dataset.name} with DVC"`,
          `[main ${this.randomHash()}] Track ${dataset.name} with DVC`
        ];
        break;
      case 'push':
        this.dvcLogTitle = 'dvc push';
        this.dvcLogLines = [
          `$ dvc push ${dataset.name}`,
          `Collecting information from local cache...`,
          `Pushing to s3://nexusml-datasets/${dataset.id}`,
          `100% ${dataset.size} |████████████████| 1/1 file`,
          `Commit ${this.dvcPush.commit} pushed to remote`
        ];
        break;
      case 'pull':
        this.dvcLogTitle = 'dvc pull';
        this.dvcLogLines = [
          `$ dvc pull ${dataset.name}`,
          `Comparing checksums to detect changes...`,
          `Fetching from s3://nexusml-datasets/${dataset.id}`,
          `100% ${dataset.versions[0].size} |████████████████| 1/1 file`,
          `M       ${dataset.name}`,
          `Checked out ${dataset.versions[0].version}`
        ];
        break;
      case 'compare':
        this.dvcLogTitle = 'dvc diff';
        this.dvcLogLines = [
          `$ dvc diff ${this.dvcCompare.fromVersion} ${this.dvcCompare.toVersion}`,
          `diff for ${dataset.name}`,
          `added: 0 files`,
          `modified: 1 file (${dataset.name})`,
          `renamed: 0 files`,
          `deleted: 0 files`
        ];
        break;
    }
  }
}
