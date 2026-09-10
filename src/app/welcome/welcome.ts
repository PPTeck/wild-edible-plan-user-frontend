import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';

const API = 'http://192.168.29.51:8080/api';

// Icon map for role names
const ROLE_ICONS: Record<string, string> = {
  'admin':          '🔧',
  'field operator': '🌿',
  'reviewer':       '🔍',
};

interface Role { roleId: number; roleName: string; }

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './welcome.html',
  styleUrl: './welcome.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WelcomeComponent implements OnInit {

  roles: Role[] = [];       // loaded from API
  rolesLoading  = true;

  selectedRole  = '';
  emailId       = '';
  password      = '';
  showPassword  = false;    // eye icon toggle
  loading       = false;
  errorMsg      = '';

  constructor(
    private http:   HttpClient,
    private router: Router,
    private cdr:    ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // Load all roles from role_table
    this.http.get<Role[]>(`${API}/roles/all`).subscribe({
      next: roles => {
        this.roles        = roles;
        this.rolesLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        // Fallback to static if API unavailable
        // this.roles = [
        //   { roleId: 1, roleName: 'Admin'          },
        //   { roleId: 2, roleName: 'Field Operator' },
        //   { roleId: 3, roleName: 'Reviewer'       },
        // ];
        this.rolesLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  roleIcon(name: string): string {
    return ROLE_ICONS[name.toLowerCase().trim()] ?? '👤';
  }

  selectRole(roleName: string): void {
    this.selectedRole = roleName;
    this.errorMsg     = '';
    this.cdr.markForCheck();
  }

  get formVisible(): boolean { return !!this.selectedRole; }

  login(): void {
    if (!this.selectedRole || !this.emailId.trim() || !this.password) return;

    this.loading  = true;
    this.errorMsg = '';

    this.http.post<any>(`${API}/auth/login`, {
      emailId:  this.emailId.trim(),
      password: this.password,
      roleName: this.selectedRole,
    }).subscribe({
      next: res => {
        this.loading = false;
        this.cdr.markForCheck();
        sessionStorage.setItem('pendingUserId',   String(res.userId));
        sessionStorage.setItem('pendingUserName',  res.userName);
        sessionStorage.setItem('pendingRoleName',  this.selectedRole);
        sessionStorage.setItem('emailMasked',      res.emailMasked ?? '');
        if (res.otp) sessionStorage.setItem('devOtp', res.otp);
        this.router.navigate(['/verify-otp']);
      },
      error: err => {
        this.errorMsg = err.error?.error ?? 'Login failed';
        this.loading  = false;
        this.cdr.markForCheck();
      },
    });
  }
}
