import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';
import { adminGuard } from './guards/admin-guard';

export const routes: Routes = [
  // ===================== PUBLIC ROUTES =====================
  { 
    path: '', 
    loadComponent: () => import('./home/home').then(m => m.Home) 
  },
  { 
    path: 'login', 
    loadComponent: () => import('./pages/login/login').then(m => m.Login) 
  },
  { 
    path: 'register', 
    loadComponent: () => import('./pages/register/register').then(m => m.Register) 
  },
  { 
    path: 'community', 
    loadComponent: () => import('./pages/community/community').then(m => m.Community) 
  },
  { 
    path: 'route-planner', 
    loadComponent: () => import('./pages/route-planner/route-planner').then(m => m.RoutePlanner) 
  },
  { 
    path: 'route-details', 
    loadComponent: () => import('./components/route-details/route-details').then(m => m.RouteDetails) 
  },

  // ===================== PROTECTED ROUTES =====================
  { 
    path: 'booking', 
    canActivate: [authGuard],
    loadComponent: () => import('./booking/booking').then(m => m.Booking) 
  },
  { 
    path: 'payment', 
    canActivate: [authGuard],
    loadComponent: () => import('./payment/payment').then(m => m.Payment) 
  },
  { 
    path: 'success', 
    canActivate: [authGuard],
    loadComponent: () => import('./booking-success/booking-success').then(m => m.BookingSuccess) 
  },
  { 
    path: 'my-bookings', 
    canActivate: [authGuard],
    loadComponent: () => import('./components/my-bookings/my-bookings').then(m => m.MyBookings) 
  },
  { 
    path: 'profile', 
    canActivate: [authGuard],
    loadComponent: () => import('./components/profile/profile').then(m => m.Profile) 
  },
  { 
    path: 'notifications', 
    canActivate: [authGuard],
    loadComponent: () => import('./pages/notifications/notifications').then(m => m.Notifications) 
  },
  { 
    path: 'notification-preferences', 
    canActivate: [authGuard],
    loadComponent: () => import('./pages/notification-preferences/notification-preferences').then(m => m.NotificationPreferences) 
  },
  { 
    path: 'discussion-board', 
    loadComponent: () => import('./pages/discussion-board/discussion-board').then(m => m.DiscussionBoard) 
  },
  {
  path: 'admin',
  canActivate: [adminGuard],
  loadComponent: () => import('./pages/admin/admin').then(m => m.Admin)
},

  { path: '**', redirectTo: '' }
];