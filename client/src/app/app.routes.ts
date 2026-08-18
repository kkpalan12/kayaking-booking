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
      import('./features/admin/admin-login.component').then(
        (m) => m.AdminLoginComponent,
      ),
  },
  {
    path: 'admin/bookings/:bookingId',
    canActivate: [adminAuthGuard],
    loadComponent: () =>
      import('./features/admin/admin-booking-details.component').then(
        (m) => m.AdminBookingDetailsComponent,
      ),
  },

  {
    path: 'admin',
    canActivate: [adminAuthGuard],
    loadComponent: () =>
      import('./features/admin/admin-dashboard.component').then(
        (m) => m.AdminDashboardComponent,
      ),
  },

  {
    path: '**',
    redirectTo: '',
  },
];
