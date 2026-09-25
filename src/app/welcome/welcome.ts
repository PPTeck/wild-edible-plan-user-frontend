import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  PLATFORM_ID,
  inject
} from '@angular/core';

import {
  CommonModule,
  isPlatformBrowser
} from '@angular/common';

import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';

import {
  TranslatePipe,
  TranslateService
} from '@ngx-translate/core';

const API = 'http://192.168.29.69:8080/api';

// Icon map for role names
const ROLE_ICONS: Record<string, string> = {
  'admin':          '🔧',
  'field operator': '🌿',
  'reviewer':       '🔍',
};

interface Role {
  roleId: number;
  roleName: string;
}

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe],
  templateUrl: './welcome.html',
  styleUrl: './welcome.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WelcomeComponent implements OnInit {

  // SSR / Browser platform
  private platformId = inject(PLATFORM_ID);

  roles: Role[] = [];
  rolesLoading = true;

  selectedRole = '';
  emailId = '';
  password = '';
  showPassword = false;
  loading = false;
  errorMsg = '';

  // Language
  selectedLanguage: 'en' | 'hi' = 'en';

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {

    // Load saved language only in browser
    if (isPlatformBrowser(this.platformId)) {
      const savedLanguage =
        sessionStorage.getItem('selectedLanguage') as 'en' | 'hi' | null;

      this.selectedLanguage = savedLanguage ?? 'en';

      this.translate.use(this.selectedLanguage);
    }

    // Load all roles from role_table
    this.http.get<Role[]>(`${API}/roles/all`).subscribe({
      next: roles => {
        this.roles = roles;
        this.rolesLoading = false;
        this.cdr.markForCheck();
      },

      error: () => {
        // Fallback to static if API unavailable
        // this.roles = [
        //   { roleId: 1, roleName: 'Admin' },
        //   { roleId: 2, roleName: 'Field Operator' },
        //   { roleId: 3, roleName: 'Reviewer' },
        // ];

        this.rolesLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  // Language change
  changeLanguage(lang: 'en' | 'hi'): void {
    this.selectedLanguage = lang;

    // sessionStorage exists only in browser
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem('selectedLanguage', lang);
    }

    this.translate.use(lang);
    this.cdr.markForCheck();
  }

  roleIcon(name: string): string {
    return ROLE_ICONS[name.toLowerCase().trim()] ?? '👤';
  }

  selectRole(roleName: string): void {
    this.selectedRole = roleName;
    this.errorMsg = '';
    this.cdr.markForCheck();
  }

  get formVisible(): boolean {
    return !!this.selectedRole;
  }

  login(): void {
    if (!this.selectedRole || !this.emailId.trim() || !this.password) {
      return;
    }

    this.loading = true;
    this.errorMsg = '';

    this.http.post<any>(`${API}/auth/login`, {
      emailId: this.emailId.trim(),
      password: this.password,
      roleName: this.selectedRole,
    }).subscribe({

      next: res => {
        this.loading = false;
        this.cdr.markForCheck();

        if (isPlatformBrowser(this.platformId)) {
          sessionStorage.setItem(
            'pendingUserId',
            String(res.userId)
          );

          sessionStorage.setItem(
            'pendingUserName',
            res.userName
          );

          sessionStorage.setItem(
            'pendingRoleName',
            this.selectedRole
          );

          sessionStorage.setItem(
            'emailMasked',
            res.emailMasked ?? ''
          );

          if (res.otp) {
            sessionStorage.setItem('devOtp', res.otp);
          }
        }

        this.router.navigate(['/verify-otp']);
      },

      error: err => {
        this.errorMsg = err.error?.error ?? 'Login failed';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }
}