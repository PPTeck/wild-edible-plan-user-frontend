import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { UserSessionService } from '../services/user-session.service';

const API = 'http://192.168.29.69:8080/api';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './change-password.html',
  styleUrl: './change-password.css',
})
export class ChangePasswordComponent implements OnInit {

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  loading = false;
  errorMsg = '';
  successMsg = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private session: UserSessionService,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    const savedLanguage =
      sessionStorage.getItem('selectedLanguage') as 'en' | 'hi' | null;

    this.translate.use(savedLanguage ?? 'en');
  }

  submit(): void {
    this.errorMsg = '';
    this.successMsg = '';

    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.errorMsg = this.translate.instant(
        'CHANGE_PASSWORD.ERROR_ALL_FIELDS'
      );
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMsg = this.translate.instant(
        'CHANGE_PASSWORD.ERROR_PASSWORD_MISMATCH'
      );
      return;
    }

    if (this.newPassword.length < 6) {
      this.errorMsg = this.translate.instant(
        'CHANGE_PASSWORD.ERROR_MIN_LENGTH'
      );
      return;
    }

    this.loading = true;

    const email = this.session.get()?.email ?? '';

    this.http.post<any>(`${API}/auth/change-password`, {
      emailId: email,
      currentPassword: this.currentPassword,
      newPassword: this.newPassword,
    }).subscribe({
      next: () => {
        this.loading = false;

        this.successMsg = this.translate.instant(
          'CHANGE_PASSWORD.SUCCESS'
        );

        setTimeout(() => this.router.navigate(['/']), 1500);
      },

      error: err => {
        this.loading = false;

        this.errorMsg =
          err.error?.error ??
          this.translate.instant('CHANGE_PASSWORD.ERROR_FAILED');
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/']);
  }
}