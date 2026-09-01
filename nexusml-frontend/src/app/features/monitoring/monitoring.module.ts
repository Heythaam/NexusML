import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MonitoringRoutingModule } from './monitoring-routing.module';
import { MonitoringComponent } from './monitoring.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    MonitoringComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    MonitoringRoutingModule,
    SharedModule
  ]
})
export class MonitoringModule { }
