import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { UserSessionService } from '../services/user-session.service';

const API = 'http://192.168.29.217:8080/api';
const DESTINATION_APP = 'http://192.168.29.51:4200';
// const DESTINATION_APP = 'http://192.168.29.138:4200';
@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './verify-otp.html',
  styleUrl: './verify-otp.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyOtpComponent implements OnInit {

  otpCode    = '';
  loading    = false;
  errorMsg   = '';
  phoneMasked = '';
  userName   = '';
  devOtp     = '';   // shown in dev mode only

  private userId = '';

  constructor(
    private http:    HttpClient,
    private router:  Router,
    private session: UserSessionService,
    private cdr:     ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.userId      = sessionStorage.getItem('pendingUserId')    ?? '';
    this.userName    = sessionStorage.getItem('pendingUserName')  ?? '';
    this.phoneMasked = sessionStorage.getItem('emailMasked')      ?? '';
    this.devOtp      = sessionStorage.getItem('devOtp')           ?? '';

    if (!this.userId) {
      this.router.navigate(['/welcome']);
    }
  }

  verify(): void {
    if (!this.otpCode.trim()) return;
    this.loading  = true;
    this.errorMsg = '';

    this.http.post<any>(`${API}/auth/verify-otp`, {
      userId:  Number(this.userId),
      otpCode: this.otpCode.trim(),
    }).subscribe({
      next: res => {
        // Clean up sessionStorage
        const roleName = sessionStorage.getItem('pendingRoleName') ?? '';
        sessionStorage.removeItem('pendingUserId');
        sessionStorage.removeItem('pendingUserName');
        sessionStorage.removeItem('pendingRoleName');
        sessionStorage.removeItem('phoneMasked');
        sessionStorage.removeItem('emailMasked');
        sessionStorage.removeItem('devOtp');

        this.loading = false;
        this.cdr.markForCheck();

        const token = res.token;
        const normalizedRoleName = roleName.trim().toLowerCase();
        if (normalizedRoleName === 'field staff' || normalizedRoleName === 'field operator') {
          const features: string[] = (res.featureAllowed ?? '')
            .split(',')
            .map((feature: string) => feature.trim());
          const permission = features.includes('4') ? 'both' : 'view';

          this.session.save({
            name:       res.userName ?? this.userName,
            phone:      res.phoneNumber ?? '',
            email:      res.emailId ?? '',
            permission,
            token:      res.token ?? '',
          });
          this.router.navigate(['/']);
          return;
        }

        const destination = normalizedRoleName === 'admin' ? 'admin' : 'manager';
        window.location.assign(`${DESTINATION_APP}/${destination}?token=${encodeURIComponent(token)}`);
      },
      error: err => {
        this.errorMsg = err.error?.error ?? 'OTP verification failed';
        this.loading  = false;
        this.cdr.markForCheck();
      },
    });
  }

  back(): void { this.router.navigate(['/welcome']); }
}
