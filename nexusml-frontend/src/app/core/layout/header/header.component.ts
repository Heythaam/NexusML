import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../auth/auth.service';

const THEME_STORAGE_KEY = 'theme';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  isDarkTheme = false;

  constructor(private auth: AuthService) {}

  get username(): string {
    return this.auth.getUsername();
  }

  get initials(): string {
    return this.auth.getUserInitials();
  }

  get fullName(): string {
    return this.auth.getFullName();
  }

  get currentRole(): string {
    return this.auth.getCurrentRole();
  }

  ngOnInit(): void {
    this.isDarkTheme = localStorage.getItem(THEME_STORAGE_KEY) === 'dark';
    this.applyTheme();
  }

  toggleTheme(): void {
    this.isDarkTheme = !this.isDarkTheme;
    this.applyTheme();
    localStorage.setItem(THEME_STORAGE_KEY, this.isDarkTheme ? 'dark' : 'light');
  }

  logout(): void {
    this.auth.logout();
  }

  private applyTheme(): void {
    document.body.classList.toggle('dark-theme', this.isDarkTheme);
  }
}
