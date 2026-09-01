import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'pipelines',
    loadChildren: () => import('./features/pipelines/pipelines.module').then(m => m.PipelinesModule),
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN', 'DATA_SCIENTIST'] }
  },
  {
    path: 'models-management',
    loadChildren: () => import('./features/models-management/models-management.module').then(m => m.ModelsManagementModule),
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN', 'DATA_SCIENTIST'] }
  },
  {
    path: 'monitoring',
    loadChildren: () => import('./features/monitoring/monitoring.module').then(m => m.MonitoringModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'datasets',
    loadChildren: () => import('./features/datasets/datasets.module').then(m => m.DatasetsModule),
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN', 'DATA_SCIENTIST'] }
  },
  {
    path: 'settings',
    loadChildren: () => import('./features/settings/settings.module').then(m => m.SettingsModule),
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN'] }
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
