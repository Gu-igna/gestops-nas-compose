import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';

import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [
    CommonModule,
    RouterModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  mainRoutes = [
    { path: 'system/profile', label: 'Mi Perfil', icon: 'account_circle' },
    { path: 'system/operaciones', label: 'Operaciones', icon: 'settings' },
    { path: 'system/users', label: 'Usuarios', icon: 'people' },
    { path: 'system/entities', label: 'Personas', icon: 'domain' },
    { path: 'system/categories', label: 'Categorías', icon: 'category' }
  ];

  constructor(private authService: AuthService) { }

  logout() {
    this.authService.logout();
  }

}
