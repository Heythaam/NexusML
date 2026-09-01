import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { DatasetsRoutingModule } from './datasets-routing.module';
import { DatasetsComponent } from './datasets.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    DatasetsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    DatasetsRoutingModule,
    SharedModule
  ]
})
export class DatasetsModule { }
