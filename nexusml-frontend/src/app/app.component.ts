import { Component, OnInit } from '@angular/core';

import { AuthService } from './core/auth/auth.service';
import { UserSyncService } from './core/services/user-sync.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private userSyncService: UserSyncService
  ) {}

  ngOnInit(): void {
    const saved = localStorage.getItem('theme');
    if (saved) {
      document.body.classList.toggle('dark-theme', saved === 'dark');
    } else {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    }

    const keycloakId = this.authService.getKeycloakId();
    if (keycloakId) {
      this.userSyncService.syncCurrentUser(
        keycloakId,
        this.authService.getUsername(),
        this.authService.getEmail(),
        this.authService.getCurrentRole()
      ).subscribe({
        next: () => console.log('User synced'),
        error: (e) => console.warn('Sync failed', e)
      });
    }
  }
}
