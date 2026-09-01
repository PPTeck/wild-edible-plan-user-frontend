import { Routes } from '@angular/router';

export const routes: Routes = [
  // ── Welcome (role select + login) — first page ───────────
  {
    path: 'welcome',
    loadComponent: () => import('./welcome/welcome').then(m => m.WelcomeComponent),
  },
  // Legacy phone-login route
  {
    path: 'login',
    loadComponent: () => import('./login/login').then(m => m.LoginComponent),
  },
  // ── OTP verification ──────────────────────────────────────
  {
    path: 'verify-otp',
    loadComponent: () => import('./verify-otp/verify-otp').then(m => m.VerifyOtpComponent),
  },
  // ── Change Password ───────────────────────────────────────
  {
    path: 'change-password',
    loadComponent: () => import('./change-password/change-password')
      .then(m => m.ChangePasswordComponent),
  },
  // ── Forgot Password ───────────────────────────────────────
  {
    path: 'forgot-password',
    loadComponent: () => import('./forgot-password/forgot-password').then(m => m.ForgotPasswordComponent),
  },
  // ── GIS Portal (after successful login) ───────────────────
  {
    path: '',
    loadComponent: () => import('./portal/portal').then(m => m.PortalComponent),
  },
  // ── Admin Console ─────────────────────────────────────────
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then(m => m.adminRoutes),
  },
  // Default redirect → welcome
  { path: '**', redirectTo: 'welcome' },
];
