import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AuthService } from '../auth.service';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

@Component({
  selector: 'app-shell',
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatListModule,
    MatMenuModule,
    MatButtonModule
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.css'
})
export class Shell {
  navItems: NavItem[] = [
    { label: 'Dashboard', path: '/', icon: 'dashboard' },
    { label: 'Tickets', path: '/tickets', icon: 'confirmation_number' },
    { label: 'Clients', path: '/clients', icon: 'groups' },
    { label: 'Events', path: '/events', icon: 'event' },
    { label: 'Reports', path: '/reports', icon: 'insights' },
    { label: 'Settings', path: '/settings', icon: 'settings' }
  ];

  isMobile = signal(false);

  constructor(public authService: AuthService, private router: Router, breakpointObserver: BreakpointObserver) {
    breakpointObserver.observe(Breakpoints.Handset).subscribe((result) => {
      this.isMobile.set(result.matches);
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  initials(): string {
    const user = this.authService.currentUser();
    if (!user) return '?';
    const name = user.name || user.email;
    return name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }
}
