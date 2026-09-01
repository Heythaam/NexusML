import { Component } from '@angular/core';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  dividerBefore?: boolean;
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  navItems: NavItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: '▦' },
    { path: '/pipelines', label: 'Pipelines', icon: '⇄' },
    { path: '/models-management', label: 'Models', icon: '◈' },
    { path: '/monitoring', label: 'Monitoring', icon: '◔' },
    { path: '/datasets', label: 'Datasets', icon: '▤' },
    { path: '/settings', label: 'Settings', icon: '⚙', dividerBefore: true }
  ];
}
