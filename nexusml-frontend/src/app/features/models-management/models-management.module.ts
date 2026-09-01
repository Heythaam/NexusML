import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ModelsManagementRoutingModule } from './models-management-routing.module';
import { ModelsManagementComponent } from './models-management.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    ModelsManagementComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ModelsManagementRoutingModule,
    SharedModule
  ]
})
export class ModelsManagementModule { }
