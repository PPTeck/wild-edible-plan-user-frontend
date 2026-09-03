import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { UserSessionService } from '../services/user-session.service';

const API             = 'http://192.168.29.51:8080/api';
const DESTINATION_APP = 'http://192.168.29.51:4200';

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './verify-otp.html',
  styleUrl: './verify-otp.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyOtpComponent implements OnInit {

  otpCode     = '';
  loading     = false;
  errorMsg    = '';
  phoneMasked = '';
  userName    = '';
  devOtp      = '';

  // ── Active session popup ──────────────────────────────────
  showActiveSessionPopup    = false;
  activeSessionPopupLoading = false;
  conflictSessionId         = '';

  private userId = '';

  constructor(
    private http:    HttpClient,
    private router:  Router,
    private session: UserSessionService,
    private cdr:     ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.userId      = sessionStorage.getItem('pendingUserId')   ?? '';
    this.userName    = sessionStorage.getItem('pendingUserName') ?? '';
    this.phoneMasked = sessionStorage.getItem('emailMasked')     ?? '';
    this.devOtp      = sessionStorage.getItem('devOtp')          ?? '';

    if (!this.userId) {
      this.router.navigate(['/welcome']);
    }
  }

  // ──────────────────────────────────────────────────────────
  // VERIFY OTP
  // ──────────────────────────────────────────────────────────

  verify(): void {
    if (!this.otpCode.trim()) return;
    this.loading  = true;
    this.errorMsg = '';

    this.http.post<any>(`${API}/auth/verify-otp`, {
      userId:  Number(this.userId),
      otpCode: this.otpCode.trim(),
    }).subscribe({

      next: res => this.handleSuccess(res),

      error: err => {

        // ── 409: active session on another device ──────────
        if (
          err.status === 409 &&
          err.error?.message === 'active_session_exists'
        ) {
          this.loading           = false;
          this.conflictSessionId = err.error?.existing_session_id ?? '';
          this.showActiveSessionPopup = true;
          this.cdr.markForCheck();
          return;
        }

        // ── OTP expired / not found → back to login ─────────
        const errMsg: string = err.error?.error ?? '';
        if (
          errMsg.toLowerCase().includes('no pending otp') ||
          errMsg.toLowerCase().includes('otp expired')
        ) {
          this.loading               = false;
          this.showActiveSessionPopup = false;
          this.cdr.markForCheck();
          setTimeout(() => {
            window.location.href = 'http://192.168.29.51:64959/welcome';
          }, 100);
          return;
        }

        this.errorMsg = errMsg || 'OTP verification failed';
        this.loading  = false;
        this.cdr.markForCheck();
      },
    });
  }

  // ──────────────────────────────────────────────────────────
  // HANDLE SUCCESS  (verify-otp OR issue-token response)
  // ──────────────────────────────────────────────────────────

  private handleSuccess(res: any): void {
    const roleName = sessionStorage.getItem('pendingRoleName') ?? '';

    sessionStorage.removeItem('pendingUserId');
    sessionStorage.removeItem('pendingUserName');
    sessionStorage.removeItem('pendingRoleName');
    sessionStorage.removeItem('phoneMasked');
    sessionStorage.removeItem('emailMasked');
    sessionStorage.removeItem('devOtp');

    this.loading = false;
    this.cdr.markForCheck();

    const token              = res.token;
    const normalizedRoleName = roleName.trim().toLowerCase();

    // Field operator / field staff → stay in this Angular app
    if (
      normalizedRoleName === 'field staff' ||
      normalizedRoleName === 'field operator'
    ) {
      const features: string[] = (res.featureAllowed ?? '')
        .split(',').map((f: string) => f.trim());
      const permission = features.includes('4') ? 'both' : 'view';

      this.session.save({
        name:       res.userName    ?? this.userName,
        phone:      res.phoneNumber ?? '',
        email:      res.emailId     ?? '',
        permission,
        token:      res.token       ?? '',
      });

      this.router.navigate(['/']);
      return;
    }

    // Admin → /admin,  Reviewer / Manager → /manager
    const destination = normalizedRoleName === 'admin' ? 'admin' : 'manager';
    window.location.assign(
      `${DESTINATION_APP}/${destination}?token=${encodeURIComponent(token)}`
    );
  }

  // ──────────────────────────────────────────────────────────
  // FORCE LOGOUT → ISSUE NEW TOKEN → PORTAL REDIRECT
  // Called when user clicks OK on the active-session popup
  // ──────────────────────────────────────────────────────────

  forceLogoutAndReVerify(): void {

    if (!this.conflictSessionId) {
      // Nothing to invalidate — just issue token directly
      this.showActiveSessionPopup = false;
      this.loading = true;
      this.cdr.markForCheck();
      this.issueToken();
      return;
    }

    this.activeSessionPopupLoading = true;
    this.cdr.markForCheck();

    // Step 1: invalidate the old session in DB
    this.http.post<any>(`${API}/auth/force-logout-session`, {
      session_id: this.conflictSessionId,
    }).subscribe({

      next: () => {
        // Step 2: old session is gone — issue a fresh token
        this.conflictSessionId = '';
        this.issueToken();
      },

      error: err => {
        console.error('Force logout error:', err);
        this.activeSessionPopupLoading = false;
        this.showActiveSessionPopup    = false;
        this.errorMsg = 'Could not invalidate the previous session. Please try again.';
        this.cdr.markForCheck();
      },
    });
  }

  // ──────────────────────────────────────────────────────────
  // ISSUE TOKEN  (called after successful force-logout)
  // ──────────────────────────────────────────────────────────

  private issueToken(): void {
    this.http.post<any>(`${API}/auth/issue-token`, {
      userId: Number(this.userId),
    }).subscribe({

      next: res => {
        this.activeSessionPopupLoading = false;
        this.showActiveSessionPopup    = false;
        this.loading                   = false;
        this.cdr.markForCheck();
        this.handleSuccess(res);
      },

      error: err => {
        console.error('Issue token error:', err);
        this.activeSessionPopupLoading = false;
        this.showActiveSessionPopup    = false;
        this.loading                   = false;
        this.errorMsg = err.error?.error ?? 'Failed to create session. Please try again.';
        this.cdr.markForCheck();
      },
    });
  }

  // ──────────────────────────────────────────────────────────
  // CLOSE POPUP  (cancel — stay on OTP page)
  // ──────────────────────────────────────────────────────────

  closeActiveSessionPopup(): void {
    this.showActiveSessionPopup = false;
    this.conflictSessionId      = '';
  }

  back(): void { this.router.navigate(['/welcome']); }
}
