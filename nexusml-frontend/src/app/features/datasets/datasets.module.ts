import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DatasetsRoutingModule } from './datasets-routing.module';
import { DatasetsComponent } from './datasets.component';

// TODO: import SharedModule once this feature needs common UI building blocks
@NgModule({
  declarations: [
    DatasetsComponent
  ],
  imports: [
    CommonModule,
    DatasetsRoutingModule
  ]
})
export class DatasetsModule { }
