import { Component } from '@angular/core';
import { AuthService } from '../../auth/auth.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  dividerBefore?: boolean;
  roles?: string[];
  hiddenForViewer?: boolean;
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  navItems: NavItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: '▦' },
    { path: '/pipelines', label: 'Pipelines', icon: '⇄', hiddenForViewer: true },
    { path: '/models-management', label: 'Models', icon: '◈' },
    { path: '/monitoring', label: 'Monitoring', icon: '◔' },
    { path: '/datasets', label: 'Datasets', icon: '▤' },
    { path: '/settings', label: 'Settings', icon: '⚙', dividerBefore: true, roles: ['ADMIN'] }
  ];

  constructor(public auth: AuthService) {}

  get visibleNavItems(): NavItem[] {
    return this.navItems.filter(item => {
      if (item.hiddenForViewer && this.auth.isViewer()) {
        return false;
      }
      if (item.roles && !item.roles.some(role => this.auth.hasRole(role))) {
        return false;
      }
      return true;
    });
  }
}
