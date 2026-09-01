import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from './components/button/button.component';
import { CardComponent } from './components/card/card.component';
import { ModalComponent } from './components/modal/modal.component';
import { LoaderComponent } from './components/loader/loader.component';
import { ToastComponent } from './components/toast/toast.component';
import { HighlightDirective } from './directives/highlight.directive';
import { TruncatePipe } from './pipes/truncate.pipe';

// TODO: declare/export additional shared components, directives, and pipes as they are added
@NgModule({
  declarations: [
    ButtonComponent,
    CardComponent,
    ModalComponent,
    LoaderComponent,
    ToastComponent,
    HighlightDirective,
    TruncatePipe
  ],
  imports: [
    CommonModule
  ],
  exports: [
    ButtonComponent,
    CardComponent,
    ModalComponent,
    LoaderComponent,
    ToastComponent,
    HighlightDirective,
    TruncatePipe
  ]
})
export class SharedModule { }
