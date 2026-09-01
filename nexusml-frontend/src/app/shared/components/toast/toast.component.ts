import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { ToastMessage, ToastService } from '../../../core/services/toast.service';

const DISPLAY_DURATION_MS = 3000;
const FADE_OUT_DURATION_MS = 250;

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss'
})
export class ToastComponent implements OnInit, OnDestroy {
  toast: ToastMessage | null = null;
  visible = false;

  private subscription?: Subscription;
  private dismissTimer?: ReturnType<typeof setTimeout>;
  private removeTimer?: ReturnType<typeof setTimeout>;

  constructor(private readonly toastService: ToastService) {}

  ngOnInit(): void {
    this.subscription = this.toastService.toast$.subscribe(toast => this.present(toast));
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    clearTimeout(this.dismissTimer);
    clearTimeout(this.removeTimer);
  }

  private present(toast: ToastMessage): void {
    clearTimeout(this.dismissTimer);
    clearTimeout(this.removeTimer);

    this.toast = toast;
    this.visible = true;

    this.dismissTimer = setTimeout(() => {
      this.visible = false;
      this.removeTimer = setTimeout(() => {
        this.toast = null;
      }, FADE_OUT_DURATION_MS);
    }, DISPLAY_DURATION_MS);
  }
}
