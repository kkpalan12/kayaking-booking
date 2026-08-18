import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AdminAuthService } from '../../../../core/services/admin-auth.service';

@Component({
  selector: 'app-admin-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './admin-nav.component.html',
  styleUrl: './admin-nav.component.scss',
})
export class AdminNavComponent implements OnInit {
  private readonly authService = inject(AdminAuthService);

  private readonly router = inject(Router);

  adminEmail = '';

  ngOnInit(): void {
    this.authService.me().subscribe({
      next: (admin) => {
        this.adminEmail = admin.email;
      },
      error: (error) => {
        console.error('Failed to load admin session', error);
      },
    });
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/admin/login']);
      },

      error: (error) => {
        console.error('Admin logout failed', error);

        this.router.navigate(['/admin/login']);
      },
    });
  }
}
