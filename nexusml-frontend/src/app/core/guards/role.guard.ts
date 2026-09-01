import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const requiredRoles = route.data?.['roles'] as string[];
    if (!requiredRoles) return true;

    const hasRole = requiredRoles.some(role => this.auth.hasRole(role));
    if (!hasRole) {
      this.router.navigate(['/dashboard']);
      return false;
    }
    return true;
  }
}
