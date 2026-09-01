import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PipelinesComponent } from './pipelines.component';

// TODO: add child routes for pipeline sub-views
const routes: Routes = [{ path: '', component: PipelinesComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PipelinesRoutingModule { }
