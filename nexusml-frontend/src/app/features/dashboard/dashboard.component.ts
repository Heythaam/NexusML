import { Component } from '@angular/core';

type TrendDirection = 'up' | 'down';
type PipelineStatus = 'Running' | 'Success' | 'Failed';
type DotColor = 'success' | 'accent' | 'danger' | 'purple';

interface StatCard {
  label: string;
  value: string;
  trend: string;
  trendDirection: TrendDirection;
  icon: string;
  iconBg: string;
  iconColor: string;
}

interface PipelineRow {
  name: string;
  status: PipelineStatus;
  lastRun: string;
  duration: string;
}

interface ActivityItem {
  text: string;
  time: string;
  dot: DotColor;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  lastUpdated = 'just now';

  stats: StatCard[] = [
    { label: 'Active Pipelines', value: '12', trend: '+2 this week', trendDirection: 'up', icon: '⇄', iconBg: 'accent-tint-strong', iconColor: 'accent' },
    { label: 'Models Deployed', value: '7', trend: '+1 today', trendDirection: 'up', icon: '◈', iconBg: 'success-tint', iconColor: 'success' },
    { label: 'Experiments', value: '34', trend: '+8 today', trendDirection: 'up', icon: '⚗', iconBg: 'warning-tint', iconColor: 'warning' },
    { label: 'Storage Used', value: '2.4 TB', trend: '+120 GB', trendDirection: 'up', icon: '▤', iconBg: 'purple-tint', iconColor: 'purple' }
  ];

  pipelines: PipelineRow[] = [
    { name: 'fraud-detection-pipeline', status: 'Running', lastRun: '2 min ago', duration: '4m 32s' },
    { name: 'customer-churn-model', status: 'Success', lastRun: '1 hour ago', duration: '12m 08s' },
    { name: 'image-classifier-v2', status: 'Success', lastRun: '3 hours ago', duration: '8m 44s' },
    { name: 'nlp-sentiment-analysis', status: 'Failed', lastRun: '5 hours ago', duration: '2m 11s' },
    { name: 'recommendation-engine', status: 'Running', lastRun: '8 hours ago', duration: '31m 05s' }
  ];

  activities: ActivityItem[] = [
    { text: 'Model fraud-detection v2.1 deployed', time: '2m ago', dot: 'success' },
    { text: 'Experiment #142 started', time: '15m ago', dot: 'accent' },
    { text: 'Pipeline customer-churn failed', time: '1h ago', dot: 'danger' },
    { text: 'Dataset uploaded: transactions.csv', time: '2h ago', dot: 'purple' },
    { text: 'Model image-classifier promoted to prod', time: '3h ago', dot: 'success' },
    { text: 'Experiment #141 completed', time: '5h ago', dot: 'accent' },
    { text: 'New dataset connected: reviews_2025', time: '8h ago', dot: 'purple' }
  ];

  statusClass(status: PipelineStatus): string {
    return 'badge--' + status.toLowerCase();
  }

  refresh(): void {
    this.lastUpdated = 'just now';
  }
}
