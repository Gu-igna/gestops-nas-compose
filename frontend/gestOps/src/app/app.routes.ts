import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { UpdatePasswordComponent } from './pages/update-password/update-password.component';
import { OperacionesComponent } from './pages/operaciones/operaciones.component';
import { UsersComponent } from './pages/users/users.component';
import { EntitiesComponent } from './pages/entities/entities.component';
import { CategoriesComponent } from './pages/categories/categories.component';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';

export const routes: Routes = [
    { path: 'auth/login', component: LoginComponent, canActivate: [guestGuard] },
    { path: 'auth/reset-password', component: ResetPasswordComponent, canActivate: [guestGuard] },
    { path: 'auth/change-password', component: UpdatePasswordComponent, canActivate: [guestGuard] },
    { path: 'system/profile', component: ProfileComponent, canActivate: [authGuard] },
    { path: 'system/operaciones', component: OperacionesComponent, canActivate: [authGuard] },
    { path: 'system/users', component: UsersComponent, canActivate: [authGuard] },
    { path: 'system/entities', component: EntitiesComponent, canActivate: [authGuard] },
    { path: 'system/categories', component: CategoriesComponent, canActivate: [authGuard] },
    { path: '', redirectTo: '/system/operaciones', pathMatch: 'full' },
    { path: '**', redirectTo: '/system/operaciones' } // Captura cualquier ruta no encontrada
];