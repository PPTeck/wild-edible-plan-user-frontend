import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { UserSessionService } from '../services/user-session.service';

@Component({
  selector: 'app-user-menu',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './user-menu.html',
  styleUrl: './user-menu.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserMenuComponent implements OnInit {

  menuOpen = false;

  constructor(
    public session: UserSessionService,
    private router: Router,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    const savedLanguage =
      sessionStorage.getItem('selectedLanguage') as 'en' | 'hi' | null;

    this.translate.use(savedLanguage ?? 'en');
  }

  get userName(): string {
    return this.session.get()?.name ?? 'User';
  }

  get initials(): string {
    const name = this.userName;

    return name
      .split(' ')
      .map(w => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  changePassword(): void {
    this.menuOpen = false;
    this.router.navigate(['/change-password']);
  }

  logout(): void {
    this.menuOpen = false;
    this.session.logout();
    this.router.navigate(['/welcome']);
  }
}