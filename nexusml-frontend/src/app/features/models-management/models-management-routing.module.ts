import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ModelsManagementComponent } from './models-management.component';

// TODO: add child routes for model management sub-views
const routes: Routes = [{ path: '', component: ModelsManagementComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ModelsManagementRoutingModule { }
