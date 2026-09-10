import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

import { UserSessionService } from '../services/user-session.service';

const API = 'http://192.168.29.51:8080/api';

interface LoginResponse {
  success: boolean;

  token?: string;

  user: {
    userName: string;
    phoneNumber?: string;
    emailId?: string;

    role?: string;
    roleName?: string;

    featureAllowed?: string;
  };

  error?: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {

  emailId = '';
  phoneNumber = '';

  loading = false;
  errorMsg = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private session: UserSessionService,
    private cdr: ChangeDetectorRef,
  ) {}

  login(): void {

    if (
      !this.emailId.trim() ||
      !this.phoneNumber.trim()
    ) {
      this.errorMsg = 'Please enter email and phone number.';
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.errorMsg = '';

    this.http.post<LoginResponse>(
      `${API}/users/login`,
      {
        emailId: this.emailId.trim(),
        phoneNumber: this.phoneNumber.trim(),
      }
    ).subscribe({

      next: (res) => {

        console.log('Login response:', res);

        if (!res?.success || !res.user) {
          this.errorMsg =
            res?.error ||
            'Login failed. Invalid login response.';

          this.loading = false;
          this.cdr.markForCheck();
          return;
        }

        const user = res.user;

        // =====================================================
        // JWT TOKEN
        // =====================================================

        const token = res.token ?? '';

        console.log(
          'Login JWT exists:',
          !!token
        );

        if (!token) {

          console.error(
            'Login succeeded but backend did not return a JWT token.'
          );

          this.errorMsg =
            'Login succeeded, but no authentication token was received from the server.';

          this.loading = false;
          this.cdr.markForCheck();

          return;
        }

        // =====================================================
        // ROLE
        // =====================================================

        const role = String(
          user.roleName ??
          user.role ??
          ''
        )
          .trim()
          .toUpperCase();

        console.log(
          'Logged-in user role:',
          role
        );

        // =====================================================
        // FEATURES
        // =====================================================

        const features: string[] =
          String(user.featureAllowed ?? '')
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean);

        // Feature 4 = Reports / Download
        const canDownload =
          features.includes('4');

        const permission =
          canDownload
            ? 'both'
            : 'view';

        // =====================================================
        // SAVE SESSION
        // =====================================================

        this.session.save({

          name: user.userName,

          phone:
            user.phoneNumber ?? '',

          email:
            user.emailId ?? '',

          permission,

          token,

        });

        console.log(
          'User session saved successfully.'
        );

        console.log(
          'Session role:',
          role
        );

        // =====================================================
        // LOGIN COMPLETE
        // =====================================================

        this.loading = false;

        this.cdr.markForCheck();

        this.router.navigate(['/']);

      },

      error: (err) => {

        console.error(
          'Login error:',
          err
        );

        this.errorMsg =
          err?.error?.error ??
          err?.error?.message ??
          'Login failed. Please check your credentials.';

        this.loading = false;

        this.cdr.markForCheck();
      },

    });
  }

  back(): void {
    this.router.navigate(['/entry']);
  }
}