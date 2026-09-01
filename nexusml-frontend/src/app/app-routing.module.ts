import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// TODO: add canActivate guards and a default/wildcard redirect once features have content
const routes: Routes = [
  { path: 'dashboard', loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule) },
  { path: 'pipelines', loadChildren: () => import('./features/pipelines/pipelines.module').then(m => m.PipelinesModule) },
  { path: 'models-management', loadChildren: () => import('./features/models-management/models-management.module').then(m => m.ModelsManagementModule) },
  { path: 'monitoring', loadChildren: () => import('./features/monitoring/monitoring.module').then(m => m.MonitoringModule) },
  { path: 'datasets', loadChildren: () => import('./features/datasets/datasets.module').then(m => m.DatasetsModule) },
  { path: 'settings', loadChildren: () => import('./features/settings/settings.module').then(m => m.SettingsModule) }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
