import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ModelsManagementRoutingModule } from './models-management-routing.module';
import { ModelsManagementComponent } from './models-management.component';

// TODO: import SharedModule once this feature needs common UI building blocks
@NgModule({
  declarations: [
    ModelsManagementComponent
  ],
  imports: [
    CommonModule,
    ModelsManagementRoutingModule
  ]
})
export class ModelsManagementModule { }
