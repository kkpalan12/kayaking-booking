import { CommonModule } from '@angular/common';

import { Component, inject } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Router } from '@angular/router';

import { AdminAuthService } from '../../../core/services/admin-auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.scss',
})
export class AdminLoginComponent {
  private readonly fb = inject(FormBuilder);

  private readonly router = inject(Router);

  private readonly adminAuthService = inject(AdminAuthService);

  submitting = false;

  errorMessage = '';

  showPassword = false;

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],

    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  get email() {
    return this.loginForm.controls.email;
  }

  get password() {
    return this.loginForm.controls.password;
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  login(): void {
    if (this.loginForm.invalid || this.submitting) {
      this.loginForm.markAllAsTouched();

      return;
    }

    this.submitting = true;

    this.errorMessage = '';

    const email = this.email.value?.trim() || '';

    const password = this.password.value || '';

    this.adminAuthService.login(email, password).subscribe({
      next: () => {
        this.submitting = false;

        this.router.navigate(['/admin']);
      },

      error: (error) => {
        console.error('Admin login failed:', error);

        this.submitting = false;

        this.errorMessage =
          error?.error?.message ||
          'Unable to sign in. Please check your credentials.';
      },
    });
  }
}
