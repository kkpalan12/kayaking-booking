import { Routes } from '@angular/router';

import { adminAuthGuard } from './core/guards/admin-auth.guard';
import { guestAdminGuard } from './core/guards/guest-admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
  },

  {
    path: 'booking/:id',
    loadComponent: () =>
      import('./features/booking/booking.component').then(
        (m) => m.BookingComponent,
      ),
  },

  {
    path: 'payment-success',
    loadComponent: () =>
      import('./features/confirmation/payment-success.component').then(
        (m) => m.PaymentSuccessComponent,
      ),
  },

  {
    path: 'admin/login',
    canActivate: [guestAdminGuard],
    loadComponent: () =>
      import('./features/admin/auth/admin-login.component').then(
        (m) => m.AdminLoginComponent,
      ),
  },

  {
    path: 'admin/bookings',
    canActivate: [adminAuthGuard],
    loadComponent: () =>
      import('./features/admin/bookings/admin-bookings.component').then(
        (m) => m.AdminBookingsComponent,
      ),
  },

  {
    path: 'admin/bookings/:bookingId',
    canActivate: [adminAuthGuard],
    loadComponent: () =>
      import('./features/admin/bookings/details/admin-booking-details.component').then(
        (m) => m.AdminBookingDetailsComponent,
      ),
  },

  {
    path: 'admin/packages',
    canActivate: [adminAuthGuard],
    loadComponent: () =>
      import('./features/admin/packages/admin-packages.component').then(
        (m) => m.AdminPackagesComponent,
      ),
  },

  {
    path: 'admin',
    canActivate: [adminAuthGuard],
    loadComponent: () =>
      import('./features/admin/dashboard/admin-dashboard.component').then(
        (m) => m.AdminDashboardComponent,
      ),
  },

  {
    path: '**',
    redirectTo: '',
  },
];
